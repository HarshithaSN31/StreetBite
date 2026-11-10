import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../db';

export const dynamic = 'force-dynamic';

// ── Bengaluru bounding box ────────────────────────────────────────────────────
const BBOX = '12.7343,77.3791,13.1434,77.8305';

// ── Overpass QL query ─────────────────────────────────────────────────────────
const OVERPASS_QUERY = `
[out:json][timeout:90];
(
  node["amenity"~"restaurant|fast_food|cafe|food_court|snack_bar|ice_cream"]["name"](${BBOX});
  node["shop"~"beverages|juice_bar|confectionery"]["name"](${BBOX});
  node["cuisine"~"indian|south_indian|street_food"]["name"](${BBOX});
  way["amenity"~"restaurant|fast_food|cafe|food_court|snack_bar"]["name"](${BBOX});
);
out center;
`.trim();

// ── Classification ────────────────────────────────────────────────────────────
const CHAAT_KW    = ['chat','chaat','puri','panipuri','pani puri','bhel','masala','ragda','dahi','sev','kachori','golgappa','tikki','channa','chole'];
const BEV_KW      = ['juice','lassi','chai','tea','coffee','beverages','sugarcane','milkshake','shake','coconut','lemonade','nimbu','soda','faluda','badam'];
const SI_KW       = ['dosa','idli','vada','udupi','darshini','tiffin','poha','upma','rava','uttapam','bisi bele','sagara','sagar'];
const CHINESE_KW  = ['chinese','manchurian','noodles','fried rice','momos','hakka','65','chilli'];

function classify(name: string, cuisine: string, amenity: string) {
  const t = `${name} ${cuisine} ${amenity}`.toLowerCase();
  if (CHAAT_KW.some(k => t.includes(k)))   return 'Chaat & Street Food';
  if (BEV_KW.some(k => t.includes(k)))     return 'Beverages & Desserts';
  if (SI_KW.some(k => t.includes(k)))      return 'South Indian';
  if (CHINESE_KW.some(k => t.includes(k))) return 'Indo-Chinese';
  return 'Street Food';
}

function defaultFoods(cat: string): string[] {
  if (cat === 'Chaat & Street Food')    return ['Pani Puri', 'Masala Puri', 'Bhel Puri'];
  if (cat === 'Beverages & Desserts')   return ['Fresh Juice', 'Lassi', 'Beverages'];
  if (cat === 'South Indian')           return ['Idli', 'Dosa', 'Vada'];
  if (cat === 'Indo-Chinese')           return ['Gobi Manchurian', 'Noodles'];
  return ['Snacks', 'Street Food'];
}

function getLocality(tags: Record<string,string>) {
  return tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:quarter'] || tags['addr:district'] || 'Bengaluru';
}

function buildAddress(tags: Record<string,string>) {
  return [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb']].filter(Boolean).join(', ');
}

// ── Fetch Overpass ────────────────────────────────────────────────────────────
async function fetchOverpass(query: string) {
  const body = `data=${encodeURIComponent(query)}`;
  const res  = await fetch('https://overpass-api.de/api/interpreter', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':   'StreetBite-DataMiner/1.0 (academic; bengaluru street food research)',
    },
    body,
    signal: AbortSignal.timeout(100_000),
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  return res.json();
}

// ── POST /api/admin/scrape-osm ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Fetch from Overpass
    let osmData: any;
    try {
      osmData = await fetchOverpass(OVERPASS_QUERY);
    } catch (err: any) {
      return NextResponse.json({ error: 'Overpass API unreachable: ' + err.message }, { status: 503 });
    }

    const elements: any[] = osmData.elements || [];

    // 2. Filter to named, coordinated elements
    const named = elements.filter(el => {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      return el.tags?.name?.trim().length > 1 && lat && lng &&
             lat > 12.7 && lat < 13.2 && lng > 77.3 && lng < 77.9;
    });

    // 3. Load existing normalized names to avoid duplicates
    const existingRows: any[] = db.prepare(`SELECT normalized_name FROM places`).all();
    const existingNames = new Set(existingRows.map((r: any) => r.normalized_name));

    // 3b. Ensure OSM system user exists (FK: places.created_by_user_id → users.id)
    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, role, reputation_score)
      VALUES ('osm-scraper', 'OSM Data Scraper', 'osm@streetbite.internal', 'admin', 100)
    `).run();

    // 4. Log raw ingestion
    const ingestId = `osm-${Date.now()}`;
    try {
      db.prepare(`
        INSERT INTO raw_ingestion_logs (id, source_type, raw_payload, status, ip_or_user_agent)
        VALUES (?, ?, ?, ?, ?)
      `).run(ingestId, 'OSM_OVERPASS_API',
        JSON.stringify({ query: 'bengaluru_food', elementCount: elements.length, timestamp: new Date().toISOString() }),
        'INGESTED', 'StreetBite-Admin-Scraper/1.0');
    } catch (_) {}

    // 5. Process & insert
    const inserted: any[] = [];
    const skipped: string[] = [];
    const catCounts: Record<string, number> = {};

    for (const el of named) {
      const tags     = el.tags || {};
      const name     = tags.name.trim();
      const normName = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      const lat      = Number((el.lat ?? el.center?.lat).toFixed(6));
      const lng      = Number((el.lon ?? el.center?.lon).toFixed(6));

      if (existingNames.has(normName)) { skipped.push(name); continue; }

      const cuisine  = tags.cuisine || '';
      const amenity  = tags.amenity || tags.shop || '';
      const locality = getLocality(tags);
      const address  = buildAddress(tags);
      const opening  = tags.opening_hours || '';
      const category = classify(name, cuisine, amenity);
      const foods    = defaultFoods(category);

      const desc = [
        `Community-discovered ${category.toLowerCase()} spot in ${locality}, Bengaluru.`,
        opening ? `Open: ${opening}.` : '',
        cuisine  ? `Cuisine: ${cuisine}.` : '',
        `Data sourced from OpenStreetMap (OSM ID: ${el.type}/${el.id}).`,
      ].filter(Boolean).join(' ');

      try {
        const placeId = `osm-${el.id}-${Date.now()}`;
        db.prepare(`
          INSERT OR IGNORE INTO places
            (id, name, normalized_name, description, address, locality, landmark, latitude, longitude, is_verified, created_by_user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(placeId, name, normName, desc, address, locality, '', lat, lng, 0, 'osm-scraper');

        const check = db.prepare(`SELECT id FROM places WHERE id = ?`).get(placeId);
        if (!check) { skipped.push(name); continue; }

        // Insert food items
        for (const foodName of foods) {
          const normFood = foodName.toLowerCase();
          let foodRow: any = db.prepare(`SELECT id FROM food_items WHERE normalized_name = ?`).get(normFood);
          let foodId = foodRow?.id;
          if (!foodId) {
            foodId = `food-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
            db.prepare(`INSERT OR IGNORE INTO food_items (id, name, normalized_name, category_id, is_community_added) VALUES (?, ?, ?, ?, ?)`)
              .run(foodId, foodName, normFood, 'cat-1', 1);
          }
          db.prepare(`INSERT OR IGNORE INTO place_food_items (id, place_id, food_item_id, approx_price, rating_avg, review_count) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(`pf-${Date.now()}-${Math.floor(Math.random()*9999)}`, placeId, foodId, 0, 0, 0);
        }

        existingNames.add(normName);
        catCounts[category] = (catCounts[category] || 0) + 1;
        inserted.push({ id: placeId, name, locality, category, lat, lng, foods, opening });
      } catch (err: any) {
        skipped.push(`${name} (error: ${err.message})`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      source:  'OpenStreetMap Overpass API',
      region:  'Bengaluru, Karnataka',
      timestamp: new Date().toISOString(),
      elapsed_seconds: elapsed,
      stats: {
        raw_elements:   elements.length,
        named_elements: named.length,
        inserted:       inserted.length,
        skipped:        skipped.length,
        categories:     catCounts,
      },
      inserted,
      sample_skipped: skipped.slice(0, 10),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── GET /api/admin/scrape-osm — current DB stats ─────────────────────────────
export async function GET() {
  const total  = (db.prepare(`SELECT COUNT(*) as c FROM places`).get() as any).c;
  const osm    = (db.prepare(`SELECT COUNT(*) as c FROM places WHERE created_by_user_id = 'osm-scraper'`).get() as any).c;
  const manual = total - osm;
  const recent = db.prepare(`
    SELECT name, locality, created_at FROM places
    WHERE created_by_user_id = 'osm-scraper'
    ORDER BY created_at DESC LIMIT 20
  `).all();

  return NextResponse.json({ total, osm_imported: osm, manually_added: manual, recent_imports: recent });
}
