# 🍜 StreetBite — Community Street Food Intelligence Platform

> **Data Mining & Data Wrangling Academic Project**  
> Transforming India's unorganised street food ecosystem into structured, searchable, real-world intelligence.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL-green?logo=sqlite)](https://sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan?logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-17%2F17%20Passing-brightgreen)](./tests/run-tests.js)

---

## 🎯 Project Overview

StreetBite is a data-driven street food discovery platform for **Bengaluru, Karnataka**. It solves real problems faced by:

- 🧑 **Customers** — finding affordable, trustworthy street food nearby
- 🏪 **Vendors** — gaining digital visibility without formal registration
- 🔬 **Researchers** — analysing unorganised food ecosystem patterns

---

## 🏗️ Architecture

```
Data Collection → Ingestion → Wrangling → Cleaning → Entity Resolution
     ↓                                                        ↓
OSM Overpass API                                    Duplicate Detection
Community Submissions                               (7-signal algorithm)
                                                         ↓
                                              EDA → Data Mining → ML
                                              ↓
                                    DBSCAN Clustering | Apriori Rules
                                    Sentiment Mining  | Price Outlier IQR
                                    OLS Regression    | Bayesian Ratings
                                              ↓
                                    Customer-Facing Platform
```

## 🔬 Data Mining Features

| Technique | Implementation |
|-----------|---------------|
| **DBSCAN Spatial Clustering** | Discovers vendor hotspots across Bengaluru |
| **Apriori Association Rules** | Finds food co-occurrence patterns |
| **Aspect-Based Sentiment Analysis** | Mines reviews for Taste/Hygiene/Price/Speed |
| **IQR Price Outlier Detection** | Flags and imputes suspicious price data |
| **OLS Regression** | Price prediction with R², RMSE, MAE |
| **Bayesian Smoothed Ratings** | Prevents 1-review 5-star bias |
| **7-Signal Duplicate Detection** | Name + GPS + Food + Address + OCR + Image hash + Metadata |
| **Bilingual NLP** | Kannada–English food alias mapping |

## 🌍 Real Data Sources

| Source | Description |
|--------|-------------|
| **OpenStreetMap Overpass API** | 4,654+ real Bengaluru food places |
| **Community Submissions** | Vendor add-stall form with OCR signboard reading |
| **Customer Reviews** | Timestamped, aspect-mined reviews |
| **GPS Coordinates** | Precise lat/lng from browser Geolocation API |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/HarshithaSN31/streetbite.git
cd streetbite
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here   # Optional
GOOGLE_MAPS_API_KEY=your_key_here               # Optional
```

> **Note:** Google Maps keys are optional. The app works fully with OpenStreetMap/Leaflet (free, no key needed).

### Database Setup

The SQLite database is auto-created on first run. To seed real Bengaluru data:

```bash
# Seed 26 famous manually-researched Bengaluru food places
node scripts/seed-bengaluru-places.js

# Scrape live data from OpenStreetMap Overpass API (4000+ places)
node scripts/scrape-osm-bengaluru.js
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Run Tests

```bash
npm test
# 17/17 tests passing
```

---

## 📁 Project Structure

```
streetbite/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Customer homepage
│   │   ├── search/               # Explore & search page
│   │   ├── place/
│   │   │   ├── [id]/             # Stall detail + reviews
│   │   │   └── add/              # Community add-stall form
│   │   ├── admin/                # Admin & academic portal
│   │   │   ├── scrape/           # OSM data scraper UI
│   │   │   ├── data-quality/     # Data wrangling dashboard
│   │   │   ├── analytics/        # System analytics
│   │   │   └── data-mining-project/ # ML results
│   │   └── api/                  # REST API routes
│   ├── components/               # React UI components
│   ├── lib/
│   │   ├── duplicates.ts         # 7-signal duplicate detection
│   │   ├── nlp.ts                # Sentiment mining & NLP
│   │   ├── ocr.ts                # Signboard OCR processing
│   │   ├── wrangling.ts          # Data cleaning pipeline
│   │   └── geo.ts                # Haversine distance, clustering
│   └── db/                       # SQLite schema & connection
├── scripts/
│   ├── scrape-osm-bengaluru.js   # OSM Overpass API scraper
│   └── seed-bengaluru-places.js  # Real data seeder
└── tests/
    └── run-tests.js              # 17 automated tests
```

---

## 🖥️ Pages

| Route | Description |
|-------|-------------|
| `/` | Customer homepage — map, search, food categories |
| `/search` | Explore all stalls with filters |
| `/place/[id]` | Stall detail — menu, reviews, sentiment analysis |
| `/place/add` | Community add-stall form with OCR + duplicate detection |
| `/admin` | Admin portal overview |
| `/admin/scrape` | OSM real-time data scraper |
| `/admin/data-quality` | Data wrangling & quality dashboard |
| `/admin/analytics` | System analytics |
| `/admin/data-mining-project` | ML models & academic results |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite (better-sqlite3, WAL mode) |
| Maps | Leaflet.js + OpenStreetMap |
| Data Collection | OSM Overpass API, Browser Geolocation |
| ML/Mining | Custom implementations (DBSCAN, Apriori, OLS) |

---

## 👩‍💻 Author

**Harshitha S N** — [@HarshithaSN31](https://github.com/HarshithaSN31)  
Academic Project — Data Mining & Data Wrangling

---

## 📄 Licence

MIT — Free to use for academic and educational purposes.

> Data sourced from OpenStreetMap under the [ODbL licence](https://www.openstreetmap.org/copyright).
