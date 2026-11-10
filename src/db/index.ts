/**
 * StreetBite — Universal Database Adapter
 * =========================================
 * - Local / Node.js: uses better-sqlite3 (file-based, full-featured)
 * - Vercel Serverless: uses better-sqlite3 with :memory: + schema seeding
 *   (Vercel has read-only fs; writes go to /tmp which is ephemeral per function)
 *
 * For persistent production data on Vercel, set:
 *   TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables
 *   and migrate to @libsql/client (drop-in SQLite-compatible).
 */

import path from 'path';
import fs   from 'fs';

let dbInstance: any = null;

function getSchemaSQL(): string {
  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) return fs.readFileSync(schemaPath, 'utf-8');
  return '';
}

function seedDemoData(db: any) {
  // Insert a system user so FK constraints work
  db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, role, reputation_score)
    VALUES ('demo-user', 'StreetBite Demo', 'demo@streetbite.app', 'admin', 100)
  `).run();

  // Seed a handful of well-known Bengaluru stalls so the demo is not empty
  const DEMO_PLACES = [
    { id: 'demo-1', name: 'Veena Stores', norm: 'veena stores', desc: 'Iconic Bengaluru chaat shop. Famous for Masala Puri since 1943.', addr: '11th Cross, Sampige Rd', loc: 'Malleshwaram', lat: 13.0027, lng: 77.5700 },
    { id: 'demo-2', name: 'VV Puram Food Street', norm: 'vv puram food street', desc: 'Famous food street with dozens of chaat stalls and snack vendors.', addr: 'VV Puram, Near Sajjan Rao Circle', loc: 'VV Puram', lat: 12.9510, lng: 77.5680 },
    { id: 'demo-3', name: 'MTR - Mavalli Tiffin Rooms', norm: 'mtr mavalli tiffin rooms', desc: 'Legendary restaurant since 1924. Invented Rava Idli.', addr: '11 Lalbagh Road, Mavalli', loc: 'Lalbagh Road', lat: 12.9497, lng: 77.5812 },
    { id: 'demo-4', name: 'Brahmin\'s Coffee Bar', norm: 'brahmins coffee bar', desc: 'Iconic Bengaluru breakfast. Filter coffee, Idli and Vada since 1952.', addr: 'Shankarapuram, Basavanagudi', loc: 'Basavanagudi', lat: 12.9430, lng: 77.5700 },
    { id: 'demo-5', name: 'Rameshwaram Cafe', norm: 'rameshwaram cafe', desc: 'Modern South Indian cafe. Famous for Rava Idli and filter coffee.', addr: '100 Feet Road, Indiranagar', loc: 'Indiranagar', lat: 12.9719, lng: 77.6378 },
    { id: 'demo-6', name: 'Sukh Sagar', norm: 'sukh sagar', desc: 'Famous for Pani Puri and Bhel Puri. Very popular with families.', addr: 'Chowdaiah Road, Sadashivanagar', loc: 'Sadashivanagar', lat: 13.0063, lng: 77.5778 },
    { id: 'demo-7', name: 'Gobi Manchester Corner', norm: 'gobi manchester corner', desc: 'Crispy Gobi Manchurian and Veg Noodles. Popular with IT crowd.', addr: 'Marathahalli Bridge, ORR', loc: 'Marathahalli', lat: 12.9558, lng: 77.7016 },
    { id: 'demo-8', name: 'Pani Puri Bhaiyya - Whitefield', norm: 'pani puri bhaiyya whitefield', desc: 'UP-style Pani Puri stall near ITPL. Spicy jaljeera pani.', addr: 'Near ITPL, Whitefield', loc: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  ];

  const DEMO_FOODS: Record<string, { name: string; price: number }[]> = {
    'demo-1': [{ name: 'Masala Puri', price: 40 }, { name: 'Pani Puri', price: 35 }, { name: 'Dahi Puri', price: 45 }],
    'demo-2': [{ name: 'Masala Puri', price: 30 }, { name: 'Corn Chaat', price: 40 }, { name: 'Bhel Puri', price: 30 }],
    'demo-3': [{ name: 'Rava Idli', price: 60 }, { name: 'Kesari Bath', price: 40 }, { name: 'Masala Dosa', price: 70 }],
    'demo-4': [{ name: 'Idli', price: 20 }, { name: 'Vada', price: 20 }, { name: 'Filter Coffee', price: 15 }],
    'demo-5': [{ name: 'Rava Idli', price: 60 }, { name: 'Podi Idli', price: 60 }, { name: 'Masala Dosa', price: 70 }],
    'demo-6': [{ name: 'Pani Puri', price: 30 }, { name: 'Bhel Puri', price: 35 }, { name: 'Ragda Pattis', price: 50 }],
    'demo-7': [{ name: 'Gobi Manchurian', price: 60 }, { name: 'Veg Noodles', price: 70 }, { name: 'Fried Rice', price: 70 }],
    'demo-8': [{ name: 'Pani Puri', price: 30 }, { name: 'Dahi Puri', price: 40 }, { name: 'Bhel Puri', price: 35 }],
  };

  const insertPlace = db.prepare(`
    INSERT OR IGNORE INTO places
      (id, name, normalized_name, description, address, locality, landmark, latitude, longitude, is_verified, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertFood = db.prepare(`INSERT OR IGNORE INTO food_items (id, name, normalized_name, category_id, is_community_added) VALUES (?, ?, ?, ?, ?)`);
  const insertPFI  = db.prepare(`INSERT OR IGNORE INTO place_food_items (id, place_id, food_item_id, approx_price, rating_avg, review_count) VALUES (?, ?, ?, ?, ?, ?)`);

  for (const p of DEMO_PLACES) {
    insertPlace.run(p.id, p.name, p.norm, p.desc, p.addr, p.loc, '', p.lat, p.lng, 1, 'demo-user');

    const foods = DEMO_FOODS[p.id] || [];
    for (const f of foods) {
      const fid = `fi-${f.name.toLowerCase().replace(/\s+/g, '-')}`;
      insertFood.run(fid, f.name, f.name.toLowerCase(), 'cat-1', 0);
      insertPFI.run(`pfi-${p.id}-${fid}`, p.id, fid, f.price, 0, 0);
    }
  }
}

export function getDb() {
  if (dbInstance) return dbInstance;

  // On Vercel: VERCEL env var is set. Use /tmp for writable path.
  const isVercel  = process.env.VERCEL === '1';
  const dbPath    = isVercel
    ? '/tmp/streetbite.db'
    : path.join(process.cwd(), 'streetbite.db');

  // Dynamic require so Next.js build doesn't bundle for edge runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database  = require('better-sqlite3');
  dbInstance      = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  // Apply schema
  const schema = getSchemaSQL();
  if (schema) dbInstance.exec(schema);

  // On Vercel, seed demo data into the fresh /tmp database
  if (isVercel) {
    seedDemoData(dbInstance);
  }

  return dbInstance;
}

const db = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getDb();
    const value    = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export default db;
