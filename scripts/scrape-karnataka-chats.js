const Database = require('better-sqlite3');
const path = require('path');
const https = require('https');

const dbPath = path.join(process.cwd(), 'streetbite.db');
const db = new Database(dbPath);

console.log('🌐 Scraper Utility: Ingesting Real-Time Chat Centres across Karnataka...');

const karnatakaCities = [
  { city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { city: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { city: 'Mangaluru', lat: 12.9141, lng: 74.8560 },
  { city: 'Hubballi', lat: 15.3647, lng: 75.1240 },
  { city: 'Dharwad', lat: 15.4589, lng: 75.0078 },
  { city: 'Belagavi', lat: 15.8497, lng: 74.5089 },
  { city: 'Udupi', lat: 13.3409, lng: 74.7421 },
  { city: 'Davanagere', lat: 14.4644, lng: 75.9218 },
  { city: 'Shivamogga', lat: 13.9299, lng: 75.5681 },
  { city: 'Tumakuru', lat: 13.3401, lng: 77.1006 }
];

const insertPlace = db.prepare(`
  INSERT OR IGNORE INTO places (id, name, normalized_name, description, address, locality, landmark, latitude, longitude, is_verified, created_by_user_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'usr-4')
`);

function searchOsm(cityObj) {
  return new Promise((resolve) => {
    const query = `[out:json][timeout:15];node["amenity"="fast_food"](around:10000,${cityObj.lat},${cityObj.lng});out body 15;`;
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const elements = json.elements || [];
          let count = 0;
          elements.forEach((el) => {
            if (!el.tags || !el.tags.name) return;
            const name = el.tags.name;
            const norm = name.toLowerCase().trim();
            const id = `osm-ktk-${el.id}`;
            const street = el.tags['addr:street'] || el.tags['addr:full'] || 'Main Road';
            const desc = `Karnataka vendor location in ${cityObj.city}. Tagged cuisine: ${el.tags.cuisine || 'Chaat & Fast Food'}.`;

            insertPlace.run(id, name, norm, desc, street, `${cityObj.city}, Karnataka`, 'OSM Karnataka Verified', el.lat, el.lon);
            count++;
          });
          console.log(`  📍 ${cityObj.city}: Ingested ${count} real-time vendors.`);
        } catch (e) {
          console.warn(`  ⚠️ ${cityObj.city}: OSM parsing skipped.`);
        }
        resolve();
      });
    }).on('error', () => {
      console.warn(`  ⚠️ ${cityObj.city}: HTTP request failed.`);
      resolve();
    });
  });
}

async function run() {
  for (const c of karnatakaCities) {
    await searchOsm(c);
  }
  const total = db.prepare('SELECT count(*) as cnt FROM places').get().cnt;
  console.log(`\n✅ Karnataka Scraping Complete! Total active places in database: ${total}`);
}

run();
