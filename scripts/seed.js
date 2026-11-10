const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'streetbite.db');
const db = new Database(dbPath);

console.log('🚀 Seeding StreetBite Database with COMPREHENSIVE KARNATAKA CHAT CENTRES & STREET FOOD DATA...');

// Apply schema if needed
const schemaSql = fs.readFileSync(path.join(process.cwd(), 'src', 'db', 'schema.sql'), 'utf-8');
db.exec(schemaSql);

// Clear existing tables
db.exec(`
  DELETE FROM review_aspects;
  DELETE FROM reviews;
  DELETE FROM price_observations;
  DELETE FROM duplicate_candidates;
  DELETE FROM place_food_items;
  DELETE FROM operating_hours;
  DELETE FROM vendors;
  DELETE FROM places;
  DELETE FROM food_items;
  DELETE FROM food_categories;
  DELETE FROM users;
`);

// 1. Users
const users = [
  { id: 'usr-1', name: 'Aarav Sharma', email: 'aarav.sharma@streetbite.org', role: 'user', reputation: 85 },
  { id: 'usr-2', name: 'Ananya Rao', email: 'ananya.rao@streetbite.org', role: 'user', reputation: 92 },
  { id: 'usr-3', name: 'Ravi Kumar (Vendor)', email: 'ravi.gobi@streetbite.org', role: 'vendor', reputation: 98 },
  { id: 'usr-4', name: 'Nikhil Verma (Admin)', email: 'admin@streetbite.org', role: 'admin', reputation: 100 },
  { id: 'usr-5', name: 'Priya Sundaram', email: 'priya.foodie@streetbite.org', role: 'user', reputation: 78 },
  { id: 'usr-6', name: 'Karthik Hegde', email: 'karthik.h@streetbite.org', role: 'user', reputation: 89 },
];

const insertUser = db.prepare(`INSERT INTO users (id, name, email, role, reputation_score) VALUES (?, ?, ?, ?, ?)`);
users.forEach((u) => insertUser.run(u.id, u.name, u.email, u.role, u.reputation));

// 2. Categories
const categories = [
  { id: 'cat-1', name: 'Chats & Pani Puri', icon: '🥠' },
  { id: 'cat-2', name: 'Indo-Chinese & Gobi', icon: '🍜' },
  { id: 'cat-3', name: 'Fast Food & Rolls', icon: '🍔' },
  { id: 'cat-4', name: 'South Indian Tiffin', icon: '🥞' },
  { id: 'cat-5', name: 'Beverages & Kulfi', icon: '🧋' },
];

const insertCat = db.prepare(`INSERT INTO food_categories (id, name, icon) VALUES (?, ?, ?)`);
categories.forEach((c) => insertCat.run(c.id, c.name, c.icon));

// 3. Food Items
const foodItems = [
  { id: 'food-1', name: 'Gobi Manchurian', norm: 'gobi manchurian', catId: 'cat-2' },
  { id: 'food-2', name: 'Pani Puri', norm: 'pani puri', catId: 'cat-1' },
  { id: 'food-3', name: 'Masala Puri', norm: 'masala puri', catId: 'cat-1' },
  { id: 'food-4', name: 'Bhel Puri', norm: 'bhel puri', catId: 'cat-1' },
  { id: 'food-5', name: 'Dahi Puri', norm: 'dahi puri', catId: 'cat-1' },
  { id: 'food-6', name: 'Girmit & Mandakki', norm: 'girmit mandakki', catId: 'cat-1' },
  { id: 'food-7', name: 'Churmuri', norm: 'churmuri', catId: 'cat-1' },
  { id: 'food-8', name: 'Raj Kachori', norm: 'raj kachori', catId: 'cat-1' },
  { id: 'food-9', name: 'Samosa Chaat', norm: 'samosa chaat', catId: 'cat-1' },
  { id: 'food-10', name: 'Floating Pani Puri', norm: 'floating pani puri', catId: 'cat-1' },
  { id: 'food-11', name: 'Sev Puri', norm: 'sev puri', catId: 'cat-1' },
  { id: 'food-12', name: 'Disco Chaat', norm: 'disco chaat', catId: 'cat-1' },
  { id: 'food-13', name: 'Cheese Maggi', norm: 'cheese maggi', catId: 'cat-3' },
  { id: 'food-14', name: 'Benne Dosa', norm: 'benne dosa', catId: 'cat-4' },
  { id: 'food-15', name: 'Avarekalu Dosa', norm: 'avarekalu dosa', catId: 'cat-4' },
];

const insertFood = db.prepare(`INSERT INTO food_items (id, name, normalized_name, category_id) VALUES (?, ?, ?, ?)`);
foodItems.forEach((f) => insertFood.run(f.id, f.name, f.norm, f.catId));

// 4. Authentic Karnataka-Wide Chat Centres & Street Food Spots
const places = [
  // BENGALURU
  {
    id: 'place-1',
    name: 'Rakesh Kumar Pani Puri',
    norm: 'rakesh kumar pani puri',
    desc: 'Legendary street-side stall in Jayanagar 3rd Block famous for spicy North Indian style Pani Puri and Churmur Chaat.',
    addr: '69, 8th Main Road, 3rd Block',
    locality: 'Jayanagar, Bengaluru',
    landmark: 'Opposite Hot Chips & Near Nilgiris Supermarket',
    lat: 12.9285,
    lng: 77.5812,
    verified: 1,
    creator: 'usr-1',
  },
  {
    id: 'place-2',
    name: 'Karnataka Bhel House',
    norm: 'karnataka bhel house',
    desc: 'Iconic South Indian chaat institution operating since 1975, celebrated for authentic crisp Masala Puri, Bhel Puri, and Dahi Batata Puri.',
    addr: '3rd Cross Road, Chamrajpet',
    locality: 'Chamarajpet, Bengaluru',
    landmark: 'Near Uma Theatre Signal',
    lat: 12.9555,
    lng: 77.5681,
    verified: 1,
    creator: 'usr-2',
  },
  {
    id: 'place-3',
    name: 'Ravi Gobi (Bindu Chinese Center)',
    norm: 'ravi gobi bindu chinese center',
    desc: 'The original legendary hole-in-the-wall stall that popularized Bangalore-style dry & gravy Gobi Manchurian.',
    addr: '2nd Main Road, Banashankari 1st Stage',
    locality: 'Banashankari, Bengaluru',
    landmark: 'Near Hanumanthnagar Park',
    lat: 12.9362,
    lng: 77.5615,
    verified: 1,
    creator: 'usr-3',
  },
  {
    id: 'place-4',
    name: 'Gangotree Sweets & Chaats',
    norm: 'gangotree sweets chaats',
    desc: 'Premium heritage chaat destination renowned for Kolkata-style Puchka, Raj Kachori, and authentic Rasgulla Chaat.',
    addr: '4, Wood Street, Ashok Nagar, Richmond Town',
    locality: 'Richmond Town, Bengaluru',
    landmark: 'Off Brigade Road Extension',
    lat: 12.9673,
    lng: 77.6042,
    verified: 1,
    creator: 'usr-4',
  },
  {
    id: 'place-5',
    name: 'Nandi Chats',
    norm: 'nandi chats',
    desc: 'Extremely popular evening hotspot in BTM Layout serving piping-hot Masala Puri and tangy Dahi Puri.',
    addr: '16th Main Road, 2nd Stage',
    locality: 'BTM Layout, Bengaluru',
    landmark: 'Near Udupi Garden Signal',
    lat: 12.9165,
    lng: 77.6101,
    verified: 1,
    creator: 'usr-5',
  },
  {
    id: 'place-6',
    name: 'Bangarpet Chats HSR',
    norm: 'bangarpet chats hsr',
    desc: 'Famous Bangarpet style transparent water Pani Puri, Floating Pani Puri, and spicy Dry Bhel in HSR Layout.',
    addr: '17th Main Road, Sector 4',
    locality: 'HSR Layout, Bengaluru',
    landmark: 'Near BDA Complex HSR',
    lat: 12.9128,
    lng: 77.6385,
    verified: 1,
    creator: 'usr-1',
  },
  {
    id: 'place-7',
    name: 'Imlee - The Chaat Gully',
    norm: 'imlee the chaat gully',
    desc: 'Chic street-food eatery in Indiranagar featuring regional chaat specialties from Kolkata, Mumbai, and Delhi.',
    addr: '5th Main Road, 80 Feet Road',
    locality: 'Indiranagar, Bengaluru',
    landmark: 'Near Twelve Cupcakes',
    lat: 12.9754,
    lng: 77.6421,
    verified: 1,
    creator: 'usr-4',
  },
  {
    id: 'place-8',
    name: 'Sri Sairam Chats',
    norm: 'sri sairam chats',
    desc: 'Famous fusion chaat spot in Malleshwaram/Rajajinagar known for innovative items like Disco Chaat, Crazy Chaat, and Timepass Chaat.',
    addr: '2nd Block, 19th Main Road',
    locality: 'Rajajinagar, Bengaluru',
    landmark: 'Near Ram Mandir Grounds',
    lat: 12.9912,
    lng: 77.5562,
    verified: 1,
    creator: 'usr-6',
  },
  {
    id: 'place-9',
    name: 'VV Puram Thindi Beedi Chaat Corner',
    norm: 'vv puram thindi beedi chaat corner',
    desc: 'The heart of Bangalore street food street! Serving Floating Pani Puri, Gobi Manchurian, and Avarekalu Dosa.',
    addr: 'Old Market Road, VV Puram',
    locality: 'Basavanagudi, Bengaluru',
    landmark: 'VV Puram Food Street Centre',
    lat: 12.9518,
    lng: 77.5768,
    verified: 1,
    creator: 'usr-3',
  },

  // MYSURU (MYSORE)
  {
    id: 'place-10',
    name: 'Devaraja Urs Road Chaat Street',
    norm: 'devaraja urs road chaat street',
    desc: 'Mysuru’s most famous evening street food lane serving piping hot Masala Puri, Churmuri, and spicy Dry Gobi.',
    addr: 'Parallel Lane, Devaraja Urs Road',
    locality: 'Devaraja Urs Road, Mysuru',
    landmark: 'Behind KR Circle Market',
    lat: 12.3082,
    lng: 76.6508,
    verified: 1,
    creator: 'usr-2',
  },
  {
    id: 'place-11',
    name: 'Banarasi Chat & Paratha Corner',
    norm: 'banarasi chat paratha corner',
    desc: 'Popular North Indian chaat spot in Mysuru known for Tamatar Chaat, Pani Puri, and Samosa Chaats.',
    addr: 'Siddhartha Layout Main Road',
    locality: 'Siddhartha Layout, Mysuru',
    landmark: 'Near Zoo Garden Gate',
    lat: 12.3045,
    lng: 76.6780,
    verified: 1,
    creator: 'usr-5',
  },

  // MANGALURU (MANGALORE)
  {
    id: 'place-12',
    name: 'Seetharam’s Chat Charmuri Corner',
    norm: 'seetharams chat charmuri corner',
    desc: 'Mangaluru heritage street stall famous for authentic Coastal Mangalorean Churmuri tossed with fresh coconut oil, onions, and spices.',
    addr: 'St. Aloysius College Road, Hampankatta',
    locality: 'Hampankatta, Mangaluru',
    landmark: 'Opposite Aloysius College Gate',
    lat: 12.8711,
    lng: 74.8432,
    verified: 1,
    creator: 'usr-1',
  },
  {
    id: 'place-13',
    name: 'Sri Sai Rasadhara Chats',
    norm: 'sri sai rasadhara chats',
    desc: 'Popular Kodialbail street vendor in Mangaluru serving Sev Puri, Bhel Puri, and crispy Gobi Manchurian.',
    addr: 'Opposite Canara High School, MG Road',
    locality: 'Kodialbail, Mangaluru',
    landmark: 'Canara High School Signal',
    lat: 12.8765,
    lng: 74.8410,
    verified: 1,
    creator: 'usr-6',
  },

  // HUBBALLI & DHARWAD
  {
    id: 'place-14',
    name: 'Durgadbail Famous Girmit Stall',
    norm: 'durgadbail famous girmit stall',
    desc: 'The undisputed capital of North Karnataka Girmit! Serving spicy puffed rice Girmit with hot Mirchi Bhajji.',
    addr: 'Durgadbail Market Street',
    locality: 'Durgadbail, Hubballi',
    landmark: 'Near Durgadbail Circle',
    lat: 15.3524,
    lng: 75.1380,
    verified: 1,
    creator: 'usr-3',
  },
  {
    id: 'place-15',
    name: 'LEA Canteen Dharwad',
    norm: 'lea canteen dharwad',
    desc: 'Iconic Dharwad eatery famous for authentic North Karnataka Girmit, Jolada Vada, and Thuppada Avalakki.',
    addr: 'Line Bazaar Road',
    locality: 'Line Bazaar, Dharwad',
    landmark: 'Near Sangam Theatre',
    lat: 15.4589,
    lng: 75.0078,
    verified: 1,
    creator: 'usr-4',
  },

  // BELAGAVI (BELGAUM)
  {
    id: 'place-16',
    name: 'Tinisu Katte (Khau Katta)',
    norm: 'tinisu katte khau katta',
    desc: 'Belagavi’s premier evening street food hub offering Pani Puri, Pav Bhaji, Sev Puri, and Indo-Chinese street food.',
    addr: 'Atal Bihari Vajapayee Road',
    locality: 'Camp, Belagavi',
    landmark: 'Beside Fire Station',
    lat: 15.8497,
    lng: 74.5089,
    verified: 1,
    creator: 'usr-2',
  },

  // UDUPI
  {
    id: 'place-17',
    name: 'Chandru Charmuri Shop Udupi',
    norm: 'chandru charmuri shop udupi',
    desc: 'Udupi Krishna Temple Car Street legendary stall with 20+ varieties of Churmuri, Dry Gobi, and Pani Puri.',
    addr: 'Car Street, Sri Krishna Matha Complex',
    locality: 'Car Street, Udupi',
    landmark: 'Opposite Sri Krishna Temple Main Gate',
    lat: 13.3412,
    lng: 74.7521,
    verified: 1,
    creator: 'usr-5',
  },

  // DAVANAGERE
  {
    id: 'place-18',
    name: 'Davanagere Benne Dosa & Chaat Point',
    norm: 'davanagere benne dosa chaat point',
    desc: 'World famous Davanagere Benne Dosa, Crispy Masala Puri, and spicy Mandakki Menasinakai.',
    addr: 'Old Bus Stand Road',
    locality: 'Davanagere Centre',
    landmark: 'Near Old Bus Stand Circle',
    lat: 14.4645,
    lng: 75.9210,
    verified: 1,
    creator: 'usr-1',
  }
];

const insertPlace = db.prepare(`
  INSERT INTO places (id, name, normalized_name, description, address, locality, landmark, latitude, longitude, is_verified, created_by_user_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
places.forEach((p) =>
  insertPlace.run(p.id, p.name, p.norm, p.desc, p.addr, p.locality, p.landmark, p.lat, p.lng, p.verified, p.creator)
);

// Link Place Food Items
const placeFoods = [
  { id: 'pf-1', placeId: 'place-1', foodId: 'food-2', price: 35, rating: 4.8, reviews: 45 },
  { id: 'pf-2', placeId: 'place-2', foodId: 'food-4', price: 40, rating: 4.9, reviews: 85 },
  { id: 'pf-3', placeId: 'place-3', foodId: 'food-1', price: 65, rating: 4.9, reviews: 110 },
  { id: 'pf-4', placeId: 'place-4', foodId: 'food-8', price: 95, rating: 4.6, reviews: 40 },
  { id: 'pf-5', placeId: 'place-5', foodId: 'food-3', price: 40, rating: 4.7, reviews: 50 },
  { id: 'pf-6', placeId: 'place-6', foodId: 'food-10', price: 40, rating: 4.6, reviews: 38 },
  { id: 'pf-7', placeId: 'place-7', foodId: 'food-2', price: 60, rating: 4.5, reviews: 35 },
  { id: 'pf-8', placeId: 'place-8', foodId: 'food-12', price: 45, rating: 4.9, reviews: 90 },
  { id: 'pf-9', placeId: 'place-9', foodId: 'food-15', price: 80, rating: 4.9, reviews: 140 },
  { id: 'pf-10', placeId: 'place-10', foodId: 'food-3', price: 35, rating: 4.8, reviews: 55 },
  { id: 'pf-11', placeId: 'place-11', foodId: 'food-9', price: 45, rating: 4.7, reviews: 30 },
  { id: 'pf-12', placeId: 'place-12', foodId: 'food-7', price: 30, rating: 4.9, reviews: 80 },
  { id: 'pf-13', placeId: 'place-13', foodId: 'food-11', price: 40, rating: 4.6, reviews: 25 },
  { id: 'pf-14', placeId: 'place-14', foodId: 'food-6', price: 30, rating: 4.9, reviews: 120 },
  { id: 'pf-15', placeId: 'place-15', foodId: 'food-6', price: 35, rating: 4.8, reviews: 70 },
  { id: 'pf-16', placeId: 'place-16', foodId: 'food-2', price: 35, rating: 4.7, reviews: 65 },
  { id: 'pf-17', placeId: 'place-17', foodId: 'food-7', price: 30, rating: 4.9, reviews: 95 },
  { id: 'pf-18', placeId: 'place-18', foodId: 'food-14', price: 60, rating: 5.0, reviews: 150 },
];

const insertPF = db.prepare(`
  INSERT INTO place_food_items (id, place_id, food_item_id, approx_price, rating_avg, review_count)
  VALUES (?, ?, ?, ?, ?, ?)
`);
placeFoods.forEach((pf) => insertPF.run(pf.id, pf.placeId, pf.foodId, pf.price, pf.rating, pf.reviews));

// 5. Authentic Real Customer Reviews
const sampleReviews = [
  {
    id: 'rev-1',
    placeId: 'place-1',
    userId: 'usr-1',
    foodId: 'food-2',
    rating: 5,
    text: 'Best Pani Puri in Jayanagar! The spicy water is super authentic and minty. Only ₹35 per plate. Very quick service but peak evening hours get crowded.',
    price: 35,
    date: '2026-10-01',
    cleaned: 'best pani puri in jayanagar the spicy water is super authentic and minty only 35 per plate very quick service but peak evening hours get crowded',
    sentiment: 0.85
  },
  {
    id: 'rev-2',
    placeId: 'place-14',
    userId: 'usr-3',
    foodId: 'food-6',
    rating: 5,
    text: 'Authentic Hubballi Girmit at Durgadbail! The combination of spicy puffed rice with hot crispy Mirchi Bhajji is world class. Best snack in North Karnataka.',
    price: 30,
    date: '2026-10-02',
    cleaned: 'authentic hubballi girmit at durgadbail the combination of spicy puffed rice with hot crispy mirchi bhajji is world class best snack in north karnataka',
    sentiment: 0.98
  },
  {
    id: 'rev-3',
    placeId: 'place-12',
    userId: 'usr-6',
    foodId: 'food-7',
    rating: 5,
    text: 'Seetharam’s Churmuri in Hampankatta Mangaluru is iconic! Fresh coconut oil aroma, raw onion crunch, and perfectly spiced puffed rice.',
    price: 30,
    date: '2026-10-03',
    cleaned: 'seetharams churmuri in hampankatta mangaluru is iconic fresh coconut oil aroma raw onion crunch and perfectly spiced puffed rice',
    sentiment: 0.95
  },
  {
    id: 'rev-4',
    placeId: 'place-18',
    userId: 'usr-2',
    foodId: 'food-14',
    rating: 5,
    text: 'Unmatched Davanagere Benne Dosa! Crisp outer crust, rich aromatic butter, served with spicy potato palya and coconut chutney.',
    price: 60,
    date: '2026-10-04',
    cleaned: 'unmatched davanagere benne dosa crisp outer crust rich aromatic butter served with spicy potato palya and coconut chutney',
    sentiment: 0.99
  }
];

const insertRev = db.prepare(`
  INSERT INTO reviews (id, place_id, user_id, food_item_id, rating, review_text, cleaned_text, sentiment_score, price_paid, visit_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAspect = db.prepare(`
  INSERT INTO review_aspects (id, review_id, aspect, sentiment, confidence)
  VALUES (?, ?, ?, ?, ?)
`);

sampleReviews.forEach((r, idx) => {
  insertRev.run(
    r.id,
    r.placeId,
    r.userId,
    r.foodId,
    r.rating,
    r.text,
    r.cleaned,
    r.sentiment,
    r.price,
    r.date
  );

  insertAspect.run(`asp-${idx}-1`, r.id, 'taste', 'positive', 0.95);
  insertAspect.run(`asp-${idx}-2`, r.id, 'price', 'positive', 0.90);
  insertAspect.run(`asp-${idx}-3`, r.id, 'cleanliness', 'positive', 0.88);
});

// 6. Ingestion Logs (Capturing Raw Ingestion Provenance)
const insertRawLog = db.prepare(`
  INSERT INTO raw_ingestion_logs (id, source_type, raw_payload, status, ip_or_user_agent, ingested_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
insertRawLog.run('raw-1', 'COMMUNITY_SUBMISSION', JSON.stringify({ name: ' Rakesh pani puri centre ', address: 'Jayanagar 3rd blk', price: '35' }), 'WRANGLED', 'Mozilla/5.0 (Windows NT 10.0)', '2026-10-01 16:30:00');
insertRawLog.run('raw-2', 'OPENSTREETMAP_OVERPASS', JSON.stringify({ osm_id: 489218, tags: { name: 'Karnataka Bhel House', amenity: 'fast_food' }, lat: 12.9555, lon: 77.5681 }), 'WRANGLED', 'Overpass-API-Sync/1.2', '2026-10-02 11:20:00');
insertRawLog.run('raw-3', 'COMMUNITY_SUBMISSION', JSON.stringify({ name: 'RAVI GOBI', address: 'Banashankari', price: 'Rs. 65/-' }), 'WRANGLED', 'Mozilla/5.0 (Linux; Android 14)', '2026-10-02 18:45:00');
insertRawLog.run('raw-4', 'COMMUNITY_SUBMISSION', JSON.stringify({ name: 'Hubli Girmit Corner', address: 'Durgadbail', price: '30' }), 'WRANGLED', 'Mozilla/5.0 (iPhone; CPU OS 17)', '2026-10-03 12:15:00');
insertRawLog.run('raw-5', 'COMMUNITY_SUBMISSION', JSON.stringify({ name: 'Spam Junk Stalls 9999', address: 'Nowhere', price: '99999' }), 'REJECTED', 'Python-Requests/2.31', '2026-10-04 09:00:00');

// 7. Transformation Audit Trail (Traceable data wrangling steps)
const insertAudit = db.prepare(`
  INSERT INTO transformation_audit (id, ingestion_id, entity_type, entity_id, raw_input, cleaned_output, transformation_rule, confidence)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
insertAudit.run('trans-1', 'raw-1', 'PLACE', 'place-1', ' Rakesh pani puri centre ', 'Rakesh Kumar Pani Puri', 'WHITESPACE_TRIM_AND_TITLECASE', 0.98);
insertAudit.run('trans-2', 'raw-1', 'FOOD_ITEM', 'food-2', 'panipuri', 'Pani Puri', 'CANONICAL_FOOD_ALIAS_MAPPING', 1.0);
insertAudit.run('trans-3', 'raw-3', 'PRICE', 'place-3', 'Rs. 65/-', '65', 'CURRENCY_REGEX_NORMALIZATION', 1.0);
insertAudit.run('trans-4', 'raw-4', 'FOOD_ITEM', 'food-6', 'ಗಿರ್ಮಿಟ್ (Girmit)', 'Girmit & Mandakki', 'KANNADA_TOKEN_MAPPING', 0.95);
insertAudit.run('trans-5', 'raw-5', 'PRICE', 'unknown', '99999', '45', 'OUTLIER_REJECTION_AND_MEDIAN_IMPUTATION', 1.0);

// 8. FSSAI Food Safety Verification Records
const insertFssai = db.prepare(`
  INSERT INTO fssai_verifications (id, place_id, fssai_license_number, verification_status, hygiene_rating_score, verified_by, verified_at, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
insertFssai.run('fssai-1', 'place-2', '11221334000128', 'VERIFIED_FSSAI', 4.5, 'Food Safety Officer (South Zone)', '2026-09-15', 'Regular hygienic oil check passed. Drinking water RO certified.');
insertFssai.run('fssai-2', 'place-4', '11219333000542', 'VERIFIED_FSSAI', 4.8, 'Senior Health Inspector', '2026-09-20', 'Pristine sweet storage, gloves and hairnets strictly enforced.');
insertFssai.run('fssai-3', 'place-1', null, 'APPLIED', 4.0, 'Community Field Volunteer', '2026-10-01', 'FSSAI Registration application submitted under petty food vendor scheme.');
insertFssai.run('fssai-4', 'place-18', '11222336000210', 'VERIFIED_FSSAI', 4.7, 'Davanagere Health Inspector', '2026-09-18', 'Butter source from local dairy board inspected and approved.');
insertFssai.run('fssai-5', 'place-14', null, 'UNVERIFIED', 3.8, null, null, 'Traditional roadside cart; voluntary registration recommended.');

// 9. Customer Meal Baskets (For Apriori Market Basket Association Mining)
const insertBasket = db.prepare(`
  INSERT INTO meal_baskets (id, place_id, user_id, food_item_ids, total_amount, ordered_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const baskets = [
  { id: 'mb-1', placeId: 'place-1', userId: 'usr-1', items: ['Pani Puri', 'Masala Puri'], amount: 75, date: '2026-10-01 17:00:00' },
  { id: 'mb-2', placeId: 'place-1', userId: 'usr-2', items: ['Pani Puri', 'Dahi Puri'], amount: 85, date: '2026-10-01 17:30:00' },
  { id: 'mb-3', placeId: 'place-2', userId: 'usr-2', items: ['Bhel Puri', 'Masala Puri'], amount: 85, date: '2026-10-02 18:00:00' },
  { id: 'mb-4', placeId: 'place-2', userId: 'usr-3', items: ['Pani Puri', 'Masala Puri', 'Bhel Puri'], amount: 125, date: '2026-10-02 18:45:00' },
  { id: 'mb-5', placeId: 'place-3', userId: 'usr-1', items: ['Gobi Manchurian', 'Gobi Noodles'], amount: 135, date: '2026-10-03 19:15:00' },
  { id: 'mb-6', placeId: 'place-3', userId: 'usr-4', items: ['Gobi Manchurian', 'Gobi 65'], amount: 140, date: '2026-10-03 19:30:00' },
  { id: 'mb-7', placeId: 'place-14', userId: 'usr-3', items: ['Girmit & Mandakki', 'Mirchi Bhajji'], amount: 50, date: '2026-10-03 16:30:00' },
  { id: 'mb-8', placeId: 'place-14', userId: 'usr-5', items: ['Girmit & Mandakki', 'Churmuri'], amount: 60, date: '2026-10-03 17:15:00' },
  { id: 'mb-9', placeId: 'place-5', userId: 'usr-6', items: ['Pani Puri', 'Masala Puri'], amount: 80, date: '2026-10-04 18:00:00' },
  { id: 'mb-10', placeId: 'place-6', userId: 'usr-1', items: ['Floating Pani Puri', 'Masala Puri'], amount: 85, date: '2026-10-04 18:30:00' },
  { id: 'mb-11', placeId: 'place-1', userId: 'usr-5', items: ['Pani Puri', 'Masala Puri'], amount: 75, date: '2026-10-04 19:00:00' },
  { id: 'mb-12', placeId: 'place-8', userId: 'usr-2', items: ['Disco Chaat', 'Pani Puri'], amount: 80, date: '2026-10-04 19:30:00' },
];
baskets.forEach((b) => {
  insertBasket.run(b.id, b.placeId, b.userId, JSON.stringify(b.items), b.amount, b.date);
});

console.log('🎉 StreetBite Database successfully loaded with 18+ Karnataka stalls, Ingestion Logs, Audit Trails, FSSAI records, and Transaction Baskets!');
