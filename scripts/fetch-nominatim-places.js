const Database = require('better-sqlite3');
const path = require('path');
const https = require('https');

const dbPath = path.join(process.cwd(), 'streetbite.db');
const db = new Database(dbPath);

function fetchNominatim(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: `/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=25`,
      headers: {
        'User-Agent': 'StreetBite-App/1.0 (streetbite-research@example.org)'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('🌐 Fetching real-time Chat Centres in Bangalore via OpenStreetMap Nominatim API...');
  const queries = [
    'chaat bangalore',
    'pani puri bangalore',
    'gobi manchurian bangalore',
    'bhel house bangalore',
    'food street bangalore'
  ];

  let totalFetched = 0;
  const insertPlace = db.prepare(`
    INSERT OR IGNORE INTO places (id, name, normalized_name, description, address, locality, landmark, latitude, longitude, is_verified, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'usr-4')
  `);

  for (const q of queries) {
    try {
      console.log(`🔍 Searching: "${q}"...`);
      const results = await fetchNominatim(q);
      console.log(`  Found ${results.length} locations.`);

      results.forEach((item, idx) => {
        const id = `real-osm-${item.place_id}`;
        const rawName = item.display_name.split(',')[0];
        const name = rawName.length > 3 ? rawName : item.display_name.split(',').slice(0, 2).join(', ');
        const norm = name.toLowerCase().trim();
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const addrDetails = item.address || {};
        const locality = addrDetails.suburb || addrDetails.neighbourhood || addrDetails.quarter || addrDetails.city_district || 'Bangalore';
        const road = addrDetails.road || addrDetails.pedestrian || addrDetails.street || 'Main Road';
        const desc = `Authentic vendor location retrieved via OpenStreetMap. Category: Chaat & Street Food.`;

        insertPlace.run(id, name, norm, desc, road, locality, 'OSM Verified Real-World Spot', lat, lng);
        totalFetched++;
      });
    } catch (e) {
      console.error(`Failed for "${q}":`, e.message);
    }
  }

  console.log(`✅ Finished! Total real places in database: ${totalFetched}`);
}

run();
