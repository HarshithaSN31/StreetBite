-- StreetBite SQLite Master Database Schema
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user', -- 'user', 'vendor', 'admin'
    reputation_score INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT
);

CREATE TABLE IF NOT EXISTS food_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    category_id TEXT,
    is_community_added INTEGER DEFAULT 0,
    FOREIGN KEY(category_id) REFERENCES food_categories(id)
);

CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    locality TEXT,
    landmark TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    is_verified INTEGER DEFAULT 0,
    created_by_user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS place_food_items (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    food_item_id TEXT NOT NULL,
    approx_price REAL DEFAULT 0,
    rating_avg REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    FOREIGN KEY(place_id) REFERENCES places(id) ON DELETE CASCADE,
    FOREIGN KEY(food_item_id) REFERENCES food_items(id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    food_item_id TEXT,
    rating INTEGER NOT NULL,
    review_text TEXT NOT NULL,
    cleaned_text TEXT,
    sentiment_score REAL DEFAULT 0,
    price_paid REAL,
    visit_date TEXT,
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(place_id) REFERENCES places(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(food_item_id) REFERENCES food_items(id)
);

CREATE TABLE IF NOT EXISTS review_aspects (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    aspect TEXT NOT NULL, -- 'taste', 'price', 'quantity', 'cleanliness', 'waiting_time', 'service', 'freshness', 'spiciness'
    sentiment TEXT NOT NULL, -- 'positive', 'negative', 'neutral'
    confidence REAL DEFAULT 1.0,
    FOREIGN KEY(review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS price_observations (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    food_item_id TEXT,
    reported_price REAL NOT NULL,
    user_id TEXT NOT NULL,
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(place_id) REFERENCES places(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS duplicate_candidates (
    id TEXT PRIMARY KEY,
    existing_place_id TEXT NOT NULL,
    new_place_name TEXT NOT NULL,
    new_place_lat REAL NOT NULL,
    new_place_lng REAL NOT NULL,
    similarity_score REAL NOT NULL,
    location_score REAL NOT NULL,
    name_score REAL NOT NULL,
    food_score REAL NOT NULL,
    address_score REAL NOT NULL,
    decision TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH'
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed_duplicate', 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(existing_place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS operating_hours (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    open_time TEXT NOT NULL,
    close_time TEXT NOT NULL,
    is_crowdsourced INTEGER DEFAULT 1,
    FOREIGN KEY(place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    place_id TEXT UNIQUE NOT NULL,
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    business_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS search_analytics (
    id TEXT PRIMARY KEY,
    search_query TEXT NOT NULL,
    user_lat REAL,
    user_lng REAL,
    results_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_places_coords ON places(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_places_norm_name ON places(normalized_name);
CREATE INDEX IF NOT EXISTS idx_reviews_place ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_food ON reviews(food_item_id);
CREATE INDEX IF NOT EXISTS idx_review_aspects_review ON review_aspects(review_id);
CREATE INDEX IF NOT EXISTS idx_food_items_norm ON food_items(normalized_name);

-- -----------------------------------------------------------------
-- ADVANCED DATA ENGINEERING & DATA PROVENANCE MODULES
-- -----------------------------------------------------------------

-- 1. Raw Ingestion Logs (Capturing raw immutable payloads before cleaning)
CREATE TABLE IF NOT EXISTS raw_ingestion_logs (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL, -- 'COMMUNITY_SUBMISSION', 'OPENSTREETMAP_OVERPASS', 'GOOGLE_PLACES_IMPORT', 'CSV_SEED'
    raw_payload TEXT NOT NULL,
    status TEXT DEFAULT 'INGESTED', -- 'INGESTED', 'WRANGLED', 'REJECTED'
    rejection_reason TEXT,
    ip_or_user_agent TEXT,
    ingested_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Transformation Audit Trail (Traceable data wrangling operations)
CREATE TABLE IF NOT EXISTS transformation_audit (
    id TEXT PRIMARY KEY,
    ingestion_id TEXT,
    entity_type TEXT NOT NULL, -- 'PLACE', 'PRICE', 'REVIEW', 'COORDINATE'
    entity_id TEXT,
    raw_input TEXT NOT NULL,
    cleaned_output TEXT NOT NULL,
    transformation_rule TEXT NOT NULL, -- 'WHITESPACE_TRIM', 'ALIAS_RESOLUTION', 'MEDIAN_PRICE_IMPUTATION', 'OUTLIER_REJECTION', 'KANNADA_TOKEN_MAPPING'
    confidence REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. FSSAI & Food Safety Verification Records
CREATE TABLE IF NOT EXISTS fssai_verifications (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    fssai_license_number TEXT,
    verification_status TEXT DEFAULT 'UNVERIFIED', -- 'VERIFIED_FSSAI', 'APPLIED', 'UNVERIFIED', 'INSPECTION_PENDING'
    hygiene_rating_score REAL DEFAULT 0.0, -- 1.0 to 5.0
    verified_by TEXT,
    verified_at DATETIME,
    notes TEXT,
    FOREIGN KEY(place_id) REFERENCES places(id) ON DELETE CASCADE
);

-- 4. Customer Meal Baskets (For Apriori Association Rule Mining)
CREATE TABLE IF NOT EXISTS meal_baskets (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    food_item_ids TEXT NOT NULL, -- JSON array of food item IDs co-purchased
    total_amount REAL,
    ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(place_id) REFERENCES places(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trans_audit_entity ON transformation_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_fssai_place ON fssai_verifications(place_id);
CREATE INDEX IF NOT EXISTS idx_meal_baskets_place ON meal_baskets(place_id);
