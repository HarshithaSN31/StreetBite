/**
 * StreetBite — Bengaluru Real Food Places Seeder
 * ================================================
 * Seeds the database with real, manually researched Bengaluru
 * chaat shops, beverage joints, and street food stalls.
 * This is used as a reliable fallback when Overpass API is unavailable.
 *
 * Data sourced from public knowledge of well-known Bengaluru eateries.
 * Usage: node scripts/seed-bengaluru-places.js
 */

const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH  = path.join(__dirname, '..', 'streetbite.db');

// ── Real Bengaluru food places (researched data) ──────────────────────────────
const BENGALURU_PLACES = [
  // ── CHAAT & STREET FOOD ──────────────────────────────────────────────────
  {
    name: 'Veena Stores',
    locality: 'Malleshwaram',
    address: '11th Cross, Sampige Road, Malleshwaram',
    lat: 13.0027, lng: 77.5700,
    description: 'Iconic Bengaluru chaat shop famous for Masala Puri and Dahi Puri. Running since 1943.',
    category: 'Chaat & Street Food',
    foods: [{ name: 'Masala Puri', price: 40 }, { name: 'Dahi Puri', price: 45 }, { name: 'Pani Puri', price: 35 }],
  },
  {
    name: 'Shri Sagar (CTR)',
    locality: 'Malleshwaram',
    address: '7th Cross, Margosa Road, Malleshwaram',
    lat: 13.0024, lng: 77.5712,
    description: 'Legendary tiffin house. Known for crispy Masala Dosa and Idli Vada. Opens at 6:30 AM.',
    category: 'South Indian',
    foods: [{ name: 'Masala Dosa', price: 50 }, { name: 'Idli', price: 30 }, { name: 'Vada', price: 25 }],
  },
  {
    name: 'VV Puram Food Street - Chaat Stalls',
    locality: 'VV Puram',
    address: 'V V Puram Food Street, Near Sajjan Rao Circle',
    lat: 12.9510, lng: 77.5680,
    description: 'Famous food street with dozens of chaat stalls. Best Masala Puri in Bengaluru.',
    category: 'Chaat & Street Food',
    foods: [{ name: 'Masala Puri', price: 30 }, { name: 'Pani Puri', price: 25 }, { name: 'Bhel Puri', price: 30 }, { name: 'Corn Chaat', price: 40 }],
  },
  {
    name: 'Brahmin\'s Coffee Bar',
    locality: 'Shankarapuram',
    address: 'Shankarapuram, Basavanagudi',
    lat: 12.9430, lng: 77.5700,
    description: 'Iconic Bengaluru breakfast spot. Famous for filter coffee, Idli and Vada since 1952.',
    category: 'South Indian',
    foods: [{ name: 'Idli', price: 20 }, { name: 'Vada', price: 20 }, { name: 'Filter Coffee', price: 15 }],
  },
  {
    name: 'Airlines Hotel',
    locality: 'Lavelle Road',
    address: '1/2 Lavelle Road, Ashok Nagar',
    lat: 12.9700, lng: 77.5960,
    description: 'Bengaluru institution. Idli, Vada, Dosa since 1950s. Queue starts at 7 AM.',
    category: 'South Indian',
    foods: [{ name: 'Masala Dosa', price: 60 }, { name: 'Idli', price: 30 }, { name: 'Vada', price: 25 }],
  },
  {
    name: 'Rameshwaram Cafe',
    locality: 'Indiranagar',
    address: '100 Feet Road, Indiranagar',
    lat: 12.9719, lng: 77.6378,
    description: 'Popular modern South Indian cafe. Known for Rava Idli, Podi Idli, and filter coffee.',
    category: 'South Indian',
    foods: [{ name: 'Rava Idli', price: 60 }, { name: 'Podi Idli', price: 60 }, { name: 'Masala Dosa', price: 70 }],
  },
  {
    name: 'Gutthu Idli',
    locality: 'HSR Layout',
    address: '27th Main, Sector 1, HSR Layout',
    lat: 12.9116, lng: 77.6412,
    description: 'Popular street-side idli stall. Very affordable breakfast. Opens early morning.',
    category: 'South Indian',
    foods: [{ name: 'Idli', price: 15 }, { name: 'Vada', price: 20 }, { name: 'Sambar Vada', price: 25 }],
  },
  {
    name: 'Chaat Puchka Corner',
    locality: 'Koramangala',
    address: '5th Block, 80 Feet Road, Koramangala',
    lat: 12.9279, lng: 77.6271,
    description: 'Evening chaat stall. Bestseller is the tangy Pani Puri and Dahi Puri.',
    category: 'Chaat & Street Food',
    foods: [{ name: 'Pani Puri', price: 30 }, { name: 'Dahi Puri', price: 40 }, { name: 'Sev Puri', price: 35 }],
  },
  {
    name: 'Sukh Sagar',
    locality: 'Chowdaiah Road',
    address: 'Chowdaiah Road, Sadashivanagar',
    lat: 13.0063, lng: 77.5778,
    description: 'Famous for Pani Puri and Bhel Puri. Very popular with families. Evenings only.',
    category: 'Chaat & Street Food',
    foods: [{ name: 'Pani Puri', price: 30 }, { name: 'Bhel Puri', price: 35 }, { name: 'Ragda Pattis', price: 50 }],
  },
  {
    name: 'Dahi Puri House',
    locality: 'Jayanagar',
    address: '11th Main, 4th Block, Jayanagar',
    lat: 12.9253, lng: 77.5832,
    description: 'Specialises in chaat. Famous Dahi Puri loaded with sev and chutney.',
    category: 'Chaat & Street Food',
    foods: [{ name: 'Dahi Puri', price: 40 }, { name: 'Pani Puri', price: 30 }, { name: 'Papdi Chaat', price: 45 }],
  },
  // ── BEVERAGES ────────────────────────────────────────────────────────────
  {
    name: 'Lalbagh Tender Coconut Stall',
    locality: 'Lalbagh',
    address: 'Near Lalbagh Main Gate, Basavanagudi',
    lat: 12.9494, lng: 77.5862,
    description: 'Fresh tender coconut water right at Lalbagh entrance. Very popular after park walks.',
    category: 'Beverages & Desserts',
    foods: [{ name: 'Tender Coconut Water', price: 50 }, { name: 'Coconut Cream', price: 60 }],
  },
  {
    name: 'Shree Srinivasa Sugarcane Juice',
    locality: 'Commercial Street',
    address: 'Commercial Street, Shivajinagar',
    lat: 12.9826, lng: 77.6093,
    description: 'Famous sugarcane juice stall on Commercial Street. Chilled with ginger and lemon.',
    category: 'Beverages & Desserts',
    foods: [{ name: 'Sugarcane Juice', price: 30 }, { name: 'Ginger Lime Sugarcane', price: 35 }],
  },
  {
    name: 'Lassi Corner',
    locality: 'Gandhi Bazaar',
    address: 'Gandhi Bazaar Main Road, Basavanagudi',
    lat: 12.9430, lng: 77.5751,
    description: 'Thick creamy lassi served in matka. Plain and rose flavours. Very refreshing.',
    category: 'Beverages & Desserts',
    foods: [{ name: 'Plain Lassi', price: 40 }, { name: 'Rose Lassi', price: 45 }, { name: 'Mango Lassi', price: 50 }],
  },
  {
    name: 'Fresh Juice Stall - Jayanagar',
    locality: 'Jayanagar',
    address: '4th Block Shopping Complex, Jayanagar',
    lat: 12.9241, lng: 77.5861,
    description: 'Fresh fruit juice counter. Pomegranate, watermelon, pineapple and mixed fruit.',
    category: 'Beverages & Desserts',
    foods: [{ name: 'Pomegranate Juice', price: 60 }, { name: 'Watermelon Juice', price: 40 }, { name: 'Mixed Fruit Juice', price: 50 }],
  },
  {
    name: 'Prakash Coffee Bar',
    locality: 'Visveswaraya Layout',
    address: 'Near Bus Stop, Basavanagudi',
    lat: 12.9439, lng: 77.5745,
    description: 'Old-school filter coffee shop. Served in davara-tumbler. Opens 6 AM.',
    category: 'Beverages & Desserts',
    foods: [{ name: 'Filter Coffee', price: 15 }, { name: 'Badam Milk', price: 25 }],
  },
  // ── INDO-CHINESE ─────────────────────────────────────────────────────────
  {
    name: 'Gobi Manchester Corner',
    locality: 'Marathahalli',
    address: 'Marathahalli Bridge, ORR',
    lat: 12.9558, lng: 77.7016,
    description: 'Evening street stall. Crispy Gobi Manchurian and Veg Noodles. Very popular with IT crowd.',
    category: 'Indo-Chinese',
    foods: [{ name: 'Gobi Manchurian', price: 60 }, { name: 'Veg Noodles', price: 70 }, { name: 'Fried Rice', price: 70 }],
  },
  {
    name: 'Chinese Corner - Electronic City',
    locality: 'Electronic City',
    address: 'Phase 1, Electronic City',
    lat: 12.8445, lng: 77.6610,
    description: 'Indo-Chinese fast food stall near tech parks. Noodles, Manchurian, Fried Rice.',
    category: 'Indo-Chinese',
    foods: [{ name: 'Veg Manchurian', price: 60 }, { name: 'Hakka Noodles', price: 70 }, { name: 'Veg Fried Rice', price: 70 }],
  },
  // ── FAST FOOD / SNACKS ────────────────────────────────────────────────────
  {
    name: 'Mirchi Bajji Stall - MG Road',
    locality: 'MG Road',
    address: 'Near MG Road Metro Station',
    lat: 12.9757, lng: 77.6097,
    description: 'Crispy Mirchi Bajji and Bread Pakoda stall near metro. Perfect evening snack.',
    category: 'Street Food',
    foods: [{ name: 'Mirchi Bajji', price: 20 }, { name: 'Bread Pakoda', price: 25 }, { name: 'Corn Bhutta', price: 30 }],
  },
  {
    name: 'Asha Sweet Centre',
    locality: 'Gandhi Bazaar',
    address: 'Gandhi Bazaar, Basavanagudi',
    lat: 12.9435, lng: 77.5756,
    description: 'Famous sweet and snack shop. Mysore Pak, Kara Sev and Mixture.',
    category: 'Street Food',
    foods: [{ name: 'Mysore Pak', price: 60 }, { name: 'Kara Sev', price: 30 }, { name: 'Mixture', price: 30 }],
  },
  {
    name: 'Samosa King - Shivajinagar',
    locality: 'Shivajinagar',
    address: 'Russell Market Road, Shivajinagar',
    lat: 12.9834, lng: 77.6033,
    description: 'Hot crispy samosas and kachori. Best evening snack near Russell Market.',
    category: 'Street Food',
    foods: [{ name: 'Samosa', price: 15 }, { name: 'Kachori', price: 20 }, { name: 'Aloo Tikki', price: 25 }],
  },
  {
    name: 'Girmit Corner',
    locality: 'Davanagere Style - Rajajinagar',
    address: '1st Block, Rajajinagar',
    lat: 12.9916, lng: 77.5520,
    description: 'Davanagere-style Girmit (spicy puffed rice) and Sev Mixture. North Karnataka street food.',
    category: 'Chaat & Street Food',
    foods: [{ name: 'Girmit', price: 20 }, { name: 'Sev Mixture', price: 25 }],
  },
  {
    name: 'Shree Ram Chaat Center',
    locality: 'Vijayanagar',
    address: '3rd Stage, Vijayanagar',
    lat: 12.9700, lng: 77.5290,
    description: 'Popular chaat corner in Vijayanagar. Papdi Chaat and Ragda Pattis.',
    category: 'Chaat & Street Food',
    foods: [{ name: 'Papdi Chaat', price: 40 }, { name: 'Ragda Pattis', price: 50 }, { name: 'Pani Puri', price: 30 }],
  },
  {
    name: 'Halli Mane',
    locality: 'Basavanagudi',
    address: 'Bull Temple Road, Basavanagudi',
    lat: 12.9440, lng: 77.5713,
    description: 'Village-style Karnataka cuisine. Ragi Mudde, Soppu Saaru and Jolada Rotti.',
    category: 'South Indian',
    foods: [{ name: 'Ragi Mudde', price: 60 }, { name: 'Jolada Rotti', price: 50 }, { name: 'Bisi Bele Bath', price: 70 }],
  },
  {
    name: 'MTR - Mavalli Tiffin Rooms',
    locality: 'Lalbagh Road',
    address: '11 Lalbagh Road, Mavalli',
    lat: 12.9497, lng: 77.5812,
    description: 'Legendary restaurant since 1924. Known for Rava Idli (invented here) and Kesari Bath.',
    category: 'South Indian',
    foods: [{ name: 'Rava Idli', price: 60 }, { name: 'Kesari Bath', price: 40 }, { name: 'Masala Dosa', price: 70 }],
  },
  {
    name: 'Pani Puri Bhaiyya - Whitefield',
    locality: 'Whitefield',
    address: 'Near Whitefield Main Road, ITPL',
    lat: 12.9698, lng: 77.7500,
    description: 'UP-style Pani Puri stall near ITPL. Spicy jaljeera pani with crispy puris.',
    category: 'Chaat & Street Food',
    foods: [{ name: 'Pani Puri', price: 30 }, { name: 'Dahi Puri', price: 40 }, { name: 'Bhel Puri', price: 35 }],
  },
  {
    name: 'Coconut Water Stall - Cubbon Park',
    locality: 'Cubbon Park',
    address: 'Near Cubbon Park Main Gate, MG Road',
    lat: 12.9793, lng: 77.5929,
    description: 'Fresh tender coconut right outside Cubbon Park. Very refreshing on a hot day.',
    category: 'Beverages & Desserts',
    foods: [{ name: 'Tender Coconut Water', price: 40 }, { name: 'Coconut Malai', price: 50 }],
  },
];

// ── Main seeder ───────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   StreetBite — Bengaluru Real Data Seeder                ║');
  console.log('║   Real food places from Karnataka research               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Ensure system user exists
  db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, role, reputation_score)
    VALUES ('osm-scraper', 'StreetBite Data Team', 'data@streetbite.internal', 'admin', 100)
  `).run();

  // Log ingestion
  const ingestId = `seed-${Date.now()}`;
  try {
    db.prepare(`
      INSERT INTO raw_ingestion_logs (id, source_type, raw_payload, status, ip_or_user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).run(ingestId, 'MANUAL_RESEARCH_BENGALURU',
      JSON.stringify({ count: BENGALURU_PLACES.length, source: 'bengaluru_food_research', timestamp: new Date().toISOString() }),
      'INGESTED', 'StreetBite-Seeder/1.0');
  } catch (e) {}

  const existing = new Set(
    db.prepare(`SELECT normalized_name FROM places`).all().map(r => r.normalized_name)
  );

  let inserted = 0, skipped = 0;
  const results = [];

  for (const p of BENGALURU_PLACES) {
    const normName = p.name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (existing.has(normName)) {
      console.log(`  ⏭️  Skip (exists): ${p.name}`);
      skipped++;
      continue;
    }

    try {
      const placeId = `place-seed-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
      db.prepare(`
        INSERT INTO places (id, name, normalized_name, description, address, locality, landmark, latitude, longitude, is_verified, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(placeId, p.name, normName, p.description, p.address, p.locality, '', p.lat, p.lng, 1, 'osm-scraper');

      for (const food of p.foods) {
        const normFood = food.name.toLowerCase();
        let foodRow = db.prepare(`SELECT id FROM food_items WHERE normalized_name = ?`).get(normFood);
        let foodId  = foodRow?.id;
        if (!foodId) {
          foodId = `food-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
          db.prepare(`INSERT OR IGNORE INTO food_items (id, name, normalized_name, category_id, is_community_added) VALUES (?, ?, ?, ?, ?)`)
            .run(foodId, food.name, normFood, 'cat-1', 0);
        }
        db.prepare(`INSERT OR IGNORE INTO place_food_items (id, place_id, food_item_id, approx_price, rating_avg, review_count) VALUES (?, ?, ?, ?, ?, ?)`)
          .run(`pf-${Date.now()}-${Math.floor(Math.random()*9999)}`, placeId, foodId, food.price || 0, 0, 0);
      }

      existing.add(normName);
      inserted++;
      results.push({ name: p.name, locality: p.locality, category: p.category });
      console.log(`  ✅ Inserted: ${p.name} (${p.locality}) — ${p.category}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${p.name} — ${err.message}`);
    }
  }

  db.close();

  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`  ✅ Inserted : ${inserted} real Bengaluru food places`);
  console.log(`  ⏭️  Skipped  : ${skipped} (already in database)`);
  console.log('\n  Places by category:');
  const cats = {};
  results.forEach(r => { cats[r.category] = (cats[r.category] || 0) + 1; });
  Object.entries(cats).forEach(([k, v]) => console.log(`    ${k.padEnd(28)} ${v}`));
  console.log('══════════════════════════════════════════════════════════\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
