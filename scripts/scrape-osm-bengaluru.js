/**
 * StreetBite — OpenStreetMap Overpass API Scraper for Bengaluru
 * =============================================================
 * Legal, free, real-time data from OpenStreetMap community.
 * Fetches chaat shops, street food stalls, beverage joints, restaurants
 * in Bengaluru and imports them into the StreetBite SQLite database.
 *
 * Usage:  node scripts/scrape-osm-bengaluru.js
 *         node scripts/scrape-osm-bengaluru.js --dry-run
 */

const Database = require('better-sqlite3');
const path     = require('path');
const https    = require('https');

// ── Config ───────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
const DB_PATH  = path.join(__dirname, '..', 'streetbite.db');

// Bengaluru bounding box  (S, W, N, E)
const BBOX = '12.7343,77.3791,13.1434,77.8305';

// Overpass QL query — targets food amenities with names, inside Bengaluru
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

// ── Food classification helpers ───────────────────────────────────────────────
const CHAAT_KEYWORDS = [
  'chat', 'chaat', 'puri', 'pani puri', 'bhel', 'masala', 'ragda',
  'dahi', 'sev', 'aloo tikki', 'kachori', 'papdi', 'golgappa', 'panipuri',
  'chats', 'chaats', 'channa', 'chole', 'mirchi bajji',
];

const BEVERAGE_KEYWORDS = [
  'juice', 'lassi', 'chai', 'tea', 'coffee', 'beverages', 'drinks',
  'sugarcane', 'milkshake', 'shake', 'sharbat', 'nimbu', 'tender coconut',
  'coconut', 'soda', 'cold', 'lemonade', 'faluda', 'badam milk',
];

const SOUTH_INDIAN_KEYWORDS = [
  'dosa', 'idli', 'vada', 'udupi', 'darshini', 'sagar', 'sagara',
  'hotel', 'tiffin', 'meals', 'thali', 'paratha', 'poha', 'upma',
  'rava', 'uttapam', 'bisi bele',
];

const INDO_CHINESE_KEYWORDS = [
  'chinese', 'manchurian', 'noodles', 'fried rice', 'chilli',
  'momos', '65', 'hakka', 'chopstick', 'wok',
];

function classifyPlace(name = '', cuisine = '', amenity = '') {
  const text = `${name} ${cuisine} ${amenity}`.toLowerCase();

  if (CHAAT_KEYWORDS.some(k => text.includes(k)))      return { category: 'Chaat & Street Food', foods: detectChaatFoods(text) };
  if (BEVERAGE_KEYWORDS.some(k => text.includes(k)))   return { category: 'Beverages & Desserts', foods: detectBeverageFoods(text) };
  if (SOUTH_INDIAN_KEYWORDS.some(k => text.includes(k))) return { category: 'South Indian',       foods: detectSouthIndianFoods(text) };
  if (INDO_CHINESE_KEYWORDS.some(k => text.includes(k))) return { category: 'Indo-Chinese',       foods: detectChineseFoods(text) };

  return { category: 'Street Food',  foods: ['Snacks', 'Street Food'] };
}

function detectChaatFoods(text) {
  const foods = [];
  if (text.includes('pani puri') || text.includes('panipuri') || text.includes('golgappa')) foods.push('Pani Puri');
  if (text.includes('masala puri') || text.includes('masalapuri')) foods.push('Masala Puri');
  if (text.includes('bhel'))      foods.push('Bhel Puri');
  if (text.includes('dahi puri') || text.includes('dahipuri')) foods.push('Dahi Puri');
  if (text.includes('sev puri') || text.includes('sevpuri'))   foods.push('Sev Puri');
  if (text.includes('aloo tikki') || text.includes('tikki'))   foods.push('Aloo Tikki');
  if (text.includes('kachori'))   foods.push('Kachori');
  if (text.includes('ragda'))     foods.push('Ragda Pattis');
  if (text.includes('channa') || text.includes('chole')) foods.push('Channa Chaat');
  if (foods.length === 0)         foods.push('Pani Puri', 'Masala Puri', 'Bhel Puri');
  return foods;
}

function detectBeverageFoods(text) {
  const foods = [];
  if (text.includes('juice'))      foods.push('Fresh Fruit Juice');
  if (text.includes('sugarcane'))  foods.push('Sugarcane Juice');
  if (text.includes('lassi'))      foods.push('Lassi');
  if (text.includes('chai') || text.includes('tea')) foods.push('Masala Chai');
  if (text.includes('milkshake') || text.includes('shake')) foods.push('Milkshake');
  if (text.includes('coconut'))    foods.push('Tender Coconut Water');
  if (text.includes('lemonade') || text.includes('nimbu')) foods.push('Fresh Lime Soda');
  if (foods.length === 0)          foods.push('Fresh Juice', 'Beverages');
  return foods;
}

function detectSouthIndianFoods(text) {
  const foods = [];
  if (text.includes('dosa'))  foods.push('Masala Dosa');
  if (text.includes('idli'))  foods.push('Idli');
  if (text.includes('vada'))  foods.push('Medu Vada');
  if (text.includes('uttapam')) foods.push('Uttapam');
  if (text.includes('poha'))  foods.push('Poha');
  if (foods.length === 0)     foods.push('Idli', 'Dosa', 'Vada');
  return foods;
}

function detectChineseFoods(text) {
  const foods = [];
  if (text.includes('manchurian')) foods.push('Gobi Manchurian');
  if (text.includes('noodles'))    foods.push('Veg Noodles');
  if (text.includes('fried rice')) foods.push('Fried Rice');
  if (text.includes('momos'))      foods.push('Momos');
  if (foods.length === 0)          foods.push('Gobi Manchurian', 'Noodles');
  return foods;
}

// ── Build human-readable address from OSM tags ────────────────────────────────
function buildAddress(tags) {
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street'])      parts.push(tags['addr:street']);
  if (tags['addr:suburb'])      parts.push(tags['addr:suburb']);
  if (tags['addr:city'])        parts.push(tags['addr:city']);
  return parts.join(', ') || '';
}

function getLocality(tags) {
  return (
    tags['addr:suburb']       ||
    tags['addr:neighbourhood']||
    tags['addr:quarter']      ||
    tags['addr:district']     ||
    tags['addr:city']         ||
    'Bengaluru'
  );
}

// ── Overpass mirrors (tried in order on failure) ─────────────────────────────
const OVERPASS_MIRRORS = [
  { hostname: 'overpass.kumi.systems',       path: '/api/interpreter' },
  { hostname: 'overpass.openstreetmap.ru',   path: '/api/interpreter' },
  { hostname: 'overpass-api.de',             path: '/api/interpreter' },
];

function fetchFromMirror(mirror, query) {
  return new Promise((resolve, reject) => {
    const body = `data=${encodeURIComponent(query)}`;
    const options = {
      hostname: mirror.hostname,
      path:     mirror.path,
      method:   'POST',
      timeout:  90000,
      headers:  {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent':     'StreetBite-DataMiner/1.0 (academic; bengaluru food research)',
        'Accept':         'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const trimmed = data.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          reject(new Error(`Non-JSON (HTTP ${res.statusCode}): ` + trimmed.slice(0, 120)));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 150))); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timed out')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function fetchOverpass(query) {
  for (let i = 0; i < OVERPASS_MIRRORS.length; i++) {
    const m = OVERPASS_MIRRORS[i];
    console.log(`   Trying mirror ${i + 1}/${OVERPASS_MIRRORS.length}: ${m.hostname}`);
    try {
      const result = await fetchFromMirror(m, query);
      console.log(`   ✅ Got data from ${m.hostname}\n`);
      return result;
    } catch (err) {
      console.warn(`   ⚠️  ${m.hostname}: ${err.message}`);
      if (i < OVERPASS_MIRRORS.length - 1) {
        await new Promise(r => setTimeout(r, 4000));
      }
    }
  }
  throw new Error('All Overpass mirrors failed. Check internet connection.');
}

// ── Main pipeline ─────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   StreetBite — OpenStreetMap Bengaluru Food Scraper      ║');
  console.log('║   Source: OpenStreetMap Overpass API (legal & free)      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  if (DRY_RUN) console.log('⚠️  DRY RUN — No data will be written to the database.\n');

  // ── 1. Fetch from Overpass API ──────────────────────────────────────────────
  console.log('📡 Querying OpenStreetMap Overpass API for Bengaluru food places...');
  console.log('   Bounding box: Bengaluru (12.73°N–13.14°N, 77.38°E–77.83°E)');
  console.log('   This may take 15–30 seconds...\n');

  let osmData;
  try {
    osmData = await fetchOverpass(OVERPASS_QUERY);
  } catch (err) {
    console.error('❌ Overpass API error:', err.message);
    process.exit(1);
  }

  const elements = osmData.elements || [];
  console.log(`✅ Received ${elements.length} raw OSM elements from Overpass API`);

  // ── 2. Filter: only elements with a name ───────────────────────────────────
  const named = elements.filter(el => el.tags && el.tags.name && el.tags.name.trim().length > 1);
  console.log(`🔍 ${named.length} elements have valid names (skipping unnamed)`);

  // ── 3. Open DB ─────────────────────────────────────────────────────────────
  const db = DRY_RUN ? null : new Database(DB_PATH);
  if (db) {
    db.pragma('journal_mode = WAL');
    // Ensure the OSM system user exists (FK on created_by_user_id references users table)
    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, role, reputation_score)
      VALUES ('osm-scraper', 'OSM Data Scraper', 'osm@streetbite.internal', 'admin', 100)
    `).run();
    console.log('✅ System user "osm-scraper" ready\n');
  }

  // Log raw ingestion
  const ingestId = `osm-${Date.now()}`;
  if (db) {
    try {
      db.prepare(`
        INSERT INTO raw_ingestion_logs (id, source_type, raw_payload, status, ip_or_user_agent)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        ingestId,
        'OSM_OVERPASS_API',
        JSON.stringify({ query: OVERPASS_QUERY, elementCount: elements.length, timestamp: new Date().toISOString() }),
        'INGESTED',
        'StreetBite-Scraper/1.0'
      );
    } catch (e) {
      console.warn('Raw ingestion log skipped (table may not exist yet):', e.message);
    }
  }

  // ── 4. Deduplicate against existing DB entries ─────────────────────────────
  const existingNames = new Set();
  if (db) {
    const rows = db.prepare(`SELECT normalized_name FROM places`).all();
    rows.forEach(r => existingNames.add(r.normalized_name));
  }

  // ── 5. Process and insert each place ──────────────────────────────────────
  const stats = { inserted: 0, skipped_duplicate: 0, skipped_no_coords: 0, categories: {} };
  const inserted = [];

  console.log('\n🔄 Processing and importing places...\n');

  for (const el of named) {
    const tags    = el.tags || {};
    const name    = tags.name.trim();
    const normName = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

    // Skip if coords missing
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!lat || !lng) { stats.skipped_no_coords++; continue; }

    // Skip if coords outside Karnataka bounds (safety check)
    if (lat < 11.5 || lat > 13.5 || lng < 74.0 || lng > 78.5) {
      stats.skipped_no_coords++;
      continue;
    }

    // Skip duplicates
    if (existingNames.has(normName)) { stats.skipped_duplicate++; continue; }

    const cuisine  = tags.cuisine || '';
    const amenity  = tags.amenity || tags.shop || '';
    const address  = buildAddress(tags);
    const locality = getLocality(tags);
    const phone    = tags.phone || tags['contact:phone'] || '';
    const website  = tags.website || tags['contact:website'] || '';
    const opening  = tags.opening_hours || '';
    const osmId    = `osm-${el.type}-${el.id}`;

    const { category, foods } = classifyPlace(name, cuisine, amenity);

    // Build description
    const descParts = [`Community-discovered ${category.toLowerCase()} spot in ${locality}.`];
    if (opening) descParts.push(`Open: ${opening}.`);
    if (cuisine) descParts.push(`Cuisine: ${cuisine}.`);
    const description = descParts.join(' ');

    if (DRY_RUN) {
      console.log(`  [DRY] ${name} | ${locality} | ${category} | Foods: ${foods.join(', ')}`);
      stats.inserted++;
      stats.categories[category] = (stats.categories[category] || 0) + 1;
      continue;
    }

    try {
      const placeId = `osm-${Date.now()}-${el.id}`;

      db.prepare(`
        INSERT OR IGNORE INTO places
          (id, name, normalized_name, description, address, locality, landmark, latitude, longitude, is_verified, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(placeId, name, normName, description, address, locality, '', lat, lng, 0, 'osm-scraper');

      // Check it was actually inserted (not ignored)
      const inserted_row = db.prepare(`SELECT id FROM places WHERE id = ?`).get(placeId);
      if (!inserted_row) { stats.skipped_duplicate++; continue; }

      // Record transformation audit
      try {
        db.prepare(`
          INSERT INTO transformation_audit_logs
            (id, field_name, record_id, original_value, cleaned_value, action_taken, raw_ingestion_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          `ta-${Date.now()}-${Math.floor(Math.random()*9999)}`,
          'SOURCE',
          placeId,
          `OSM:${el.type}:${el.id}`,
          name,
          'OSM_IMPORT',
          ingestId
        );
      } catch (e) { /* audit table may differ */ }

      // Insert food items
      for (const foodName of foods) {
        const normFood = foodName.toLowerCase();
        let foodRow = db.prepare(`SELECT id FROM food_items WHERE normalized_name = ?`).get(normFood);
        let foodId  = foodRow?.id;

        if (!foodId) {
          foodId = `food-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
          db.prepare(`
            INSERT OR IGNORE INTO food_items (id, name, normalized_name, category_id, is_community_added)
            VALUES (?, ?, ?, ?, ?)
          `).run(foodId, foodName, normFood, 'cat-1', 1);
        }

        db.prepare(`
          INSERT OR IGNORE INTO place_food_items (id, place_id, food_item_id, approx_price, rating_avg, review_count)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(`pf-${Date.now()}-${Math.floor(Math.random()*9999)}`, placeId, foodId, 0, 0, 0);
      }

      existingNames.add(normName);
      stats.inserted++;
      stats.categories[category] = (stats.categories[category] || 0) + 1;
      inserted.push({ name, locality, category, lat: lat.toFixed(4), lng: lng.toFixed(4) });

      if (stats.inserted % 20 === 0) {
        process.stdout.write(`\r   ✅ Imported ${stats.inserted} places so far...`);
      }
    } catch (err) {
      console.error(`\n  ⚠️  Failed to insert "${name}": ${err.message}`);
    }
  }

  if (db) db.close();

  // ── 6. Report ───────────────────────────────────────────────────────────────
  console.log('\n\n══════════════════════════════════════════════════════════');
  console.log('  📊 SCRAPE COMPLETE — SUMMARY REPORT');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Source         : OpenStreetMap Overpass API`);
  console.log(`  Region         : Bengaluru, Karnataka`);
  console.log(`  Raw elements   : ${elements.length}`);
  console.log(`  Named places   : ${named.length}`);
  console.log(`  ✅ Inserted     : ${stats.inserted}`);
  console.log(`  ⏭️  Duplicates   : ${stats.skipped_duplicate}`);
  console.log(`  ⚠️  No coords   : ${stats.skipped_no_coords}`);
  console.log(`\n  Category breakdown:`);
  Object.entries(stats.categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`    ${cat.padEnd(28)} ${count}`));
  console.log('\n  Sample of imported places:');
  inserted.slice(0, 10).forEach(p =>
    console.log(`    • ${p.name} (${p.locality}) — ${p.category}`)
  );
  if (DRY_RUN) console.log('\n  ⚠️  DRY RUN — nothing was written to database.');
  console.log('\n══════════════════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
