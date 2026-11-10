/**
 * StreetBite Google Maps & Real-Time Places Ingestion CLI Utility
 * 
 * Usage:
 *   1. Direct Ingestion from real Google Places API (with API Key):
 *      node scripts/ingest-google-maps.js --api-key=YOUR_GOOGLE_MAPS_KEY --query="chaat centre bangalore"
 * 
 *   2. Ingest from a JSON file exported from Google Maps:
 *      node scripts/ingest-google-maps.js --file=my-places.json
 * 
 *   3. Run native real-world seed:
 *      node scripts/seed.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const https = require('https');

const dbPath = path.join(process.cwd(), 'streetbite.db');
const db = new Database(dbPath);

const args = process.argv.slice(2);
const apiKeyArg = args.find(a => a.startsWith('--api-key='));
const queryArg = args.find(a => a.startsWith('--query='));
const fileArg = args.find(a => a.startsWith('--file='));

const insertPlace = db.prepare(`
  INSERT OR REPLACE INTO places (id, name, normalized_name, description, address, locality, landmark, latitude, longitude, is_verified, created_by_user_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'usr-4')
`);

if (fileArg) {
  const filePath = fileArg.split('=')[1];
  console.log(`📂 Ingesting places from JSON file: ${filePath}...`);
  try {
    const rawData = fs.readFileSync(path.resolve(filePath), 'utf-8');
    const items = JSON.parse(rawData);
    let count = 0;
    items.forEach((p, idx) => {
      const id = p.id || `gmap-file-${idx}-${Date.now()}`;
      const name = p.name || 'Unknown Street Food Stall';
      const norm = name.toLowerCase().trim();
      const desc = p.description || 'Real-world street food vendor ingested from Google Maps export.';
      const addr = p.address || 'Street Vendor Spot';
      const locality = p.locality || 'Bangalore';
      const landmark = p.landmark || 'Google Maps Verified Location';
      const lat = parseFloat(p.lat || p.latitude);
      const lng = parseFloat(p.lng || p.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        insertPlace.run(id, name, norm, desc, addr, locality, landmark, lat, lng);
        count++;
      }
    });
    console.log(`✅ Successfully ingested ${count} Google Maps places into streetbite.db!`);
  } catch (err) {
    console.error(`❌ Failed to read file ${filePath}:`, err.message);
  }
} else if (apiKeyArg) {
  const apiKey = apiKeyArg.split('=')[1];
  const query = queryArg ? queryArg.split('=')[1] : 'chaat centre bangalore';
  console.log(`🌐 Querying Google Places API for query: "${query}"...`);

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  
  https.get(url, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        if (json.status !== 'OK') {
          console.error(`❌ Google Places API returned status: ${json.status}`, json.error_message || '');
          return;
        }

        const results = json.results || [];
        console.log(`📡 Retrieved ${results.length} real locations from Google Places API.`);

        let count = 0;
        results.forEach((item) => {
          const id = `gmap-${item.place_id}`;
          const name = item.name;
          const norm = name.toLowerCase().trim();
          const desc = `Google Maps Rating: ${item.rating}★ (${item.user_ratings_total} reviews). Address: ${item.formatted_address}`;
          const addr = item.formatted_address || 'Bangalore';
          const locality = addr.split(',').reverse()[2]?.trim() || 'Bangalore';
          const lat = item.geometry.location.lat;
          const lng = item.geometry.location.lng;

          insertPlace.run(id, name, norm, desc, addr, locality, 'Google Maps Verified Spot', lat, lng);
          count++;
        });

        console.log(`✅ Successfully ingested ${count} live Google Maps places into streetbite.db!`);
      } catch (e) {
        console.error('❌ Failed to parse Google Places API response:', e.message);
      }
    });
  }).on('error', (err) => {
    console.error('❌ HTTP Request failed:', err.message);
  });
} else {
  console.log(`
ℹ️ StreetBite Google Maps Ingestion Tool

Options:
  1. Live Google Places API Search:
     node scripts/ingest-google-maps.js --api-key=YOUR_API_KEY --query="chaat centre bangalore"

  2. Import Custom JSON File:
     node scripts/ingest-google-maps.js --file=my-places.json

  3. Seed Database with 15+ Real Bangalore Chaat Centres:
     node scripts/seed.js
`);
}
