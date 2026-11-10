const Database = require('better-sqlite3');
const path = require('path');
const https = require('https');

const dbPath = path.join(process.cwd(), 'streetbite.db');
const db = new Database(dbPath);

console.log('🌐 Fetching Real-Time Chat Centres & Street Food Vendors from OpenStreetMap Overpass API...');

// Query Overpass API for fast food / chaat / street food nodes in Bangalore area
const overpassQuery = `
[out:json][timeout:25];
(
  node["amenity"="fast_food"](12.85,77.50,13.05,77.70);
  node["cuisine"="chaat"](12.85,77.50,13.05,77.70);
  node["cuisine"="street_food"](12.85,77.50,13.05,77.70);
  node["cuisine"="indian"](12.85,77.50,13.05,77.70);
);
out body 30;
`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(overpassQuery);

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const elements = parsed.elements || [];
      console.log(`📡 Retrieved ${elements.length} real locations from OpenStreetMap.`);

      let insertedCount = 0;
      const insertPlace = db.prepare(`
        INSERT OR IGNORE INTO places (id, name, normalized_name, description, address, locality, landmark, latitude, longitude, is_verified, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'usr-4')
      `);

      elements.forEach((el, index) => {
        if (!el.tags || !el.tags.name) return;

        const id = `osm-place-${el.id}`;
        const name = el.tags.name;
        const norm = name.toLowerCase().trim();
        const lat = el.lat;
        const lng = el.lon;
        const locality = el.tags['addr:suburb'] || el.tags['addr:district'] || el.tags['addr:city'] || 'Bangalore';
        const street = el.tags['addr:street'] || el.tags['addr:full'] || 'Main Road';
        const cuisine = el.tags.cuisine || 'Street Food & Chaats';
        const desc = `Real-world vendor retrieved via OSM. Cuisine: ${cuisine}. Specializes in fresh local food.`;

        insertPlace.run(id, name, norm, desc, street, locality, 'OpenStreetMap Verified Location', lat, lng);
        insertedCount++;
      });

      console.log(`✅ Successfully ingested ${insertedCount} real-world chat centres & eateries into streetbite.db!`);
    } catch (e) {
      console.error('Error parsing OSM response:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('HTTP request failed:', err.message);
});
