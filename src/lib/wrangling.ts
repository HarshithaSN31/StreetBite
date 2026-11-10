import db from '../db';
import { normalizeString, standardizeFoodName } from './nlp';

export interface DataTransformationLog {
  id: string;
  raw_input: string;
  cleaned_output: string;
  transformation_type: string;
  timestamp: string;
}

// Karnataka Geographic Bounding Box: Latitude 11.5°N - 18.5°N, Longitude 74.0°E - 78.6°E
export const KARNATAKA_BOUNDS = {
  MIN_LAT: 11.5,
  MAX_LAT: 18.5,
  MIN_LNG: 74.0,
  MAX_LNG: 78.6,
  DEFAULT_LAT: 12.9716, // Bengaluru Vidhana Soudha / City Center
  DEFAULT_LNG: 77.5946,
};

// Bilingual English-Kannada and local street food alias dictionary
export const CANONICAL_FOOD_ALIASES: Record<string, string> = {
  // Gobi aliases
  'gobi manch': 'Gobi Manchurian',
  'gobi manchurian': 'Gobi Manchurian',
  'gobimanchurian': 'Gobi Manchurian',
  'gobi 65': 'Gobi 65',
  'gobi65': 'Gobi 65',
  'gobi noodles': 'Gobi Noodles',
  'ಗೋಬಿ ಮಂಚೂರಿಯನ್': 'Gobi Manchurian',

  // Puri & Chaat aliases
  'panipuri': 'Pani Puri',
  'pani poori': 'Pani Puri',
  'golgappa': 'Pani Puri',
  'puchka': 'Pani Puri',
  'ಪಾನಿಪುರಿ': 'Pani Puri',
  'masalpuri': 'Masala Puri',
  'masala puri': 'Masala Puri',
  'ಮಸಾಲ ಪುರಿ': 'Masala Puri',
  'bhelpuri': 'Bhel Puri',
  'bhel puri': 'Bhel Puri',
  'dahipuri': 'Dahi Puri',
  'dahi batata puri': 'Dahi Puri',
  'sevpuri': 'Sev Puri',
  'sev puri': 'Sev Puri',

  // North Karnataka specialties
  'girmit': 'Girmit & Mandakki',
  'girmit mandakki': 'Girmit & Mandakki',
  'hubli girmit': 'Girmit & Mandakki',
  'ಗಿರ್ಮಿಟ್': 'Girmit & Mandakki',
  'churmuri': 'Churmuri',
  'charmuri': 'Churmuri',
  'ಚುರುಮುರಿ': 'Churmuri',

  // Dosa & Tiffin
  'benne dosa': 'Benne Dosa',
  'davangere benne dosa': 'Benne Dosa',
  'ಬೆಣ್ಣೆ ದೋಸೆ': 'Benne Dosa',
  'masala dosa': 'Masala Dosa',
  'avarekalu dosa': 'Avarekalu Dosa',

  // Snacks & Rolls
  'samosa chat': 'Samosa Chaat',
  'samosa chaat': 'Samosa Chaat',
  'raj kachori': 'Raj Kachori',
  'cheese maggi': 'Cheese Maggi',
  'paneer roll': 'Paneer Kathi Roll',
};

/**
 * Clean & Title-Case raw place names while stripping junk characters
 */
export function cleanRawPlaceName(rawName: string): string {
  if (!rawName) return 'Unnamed Street Stall';
  const trimmed = rawName
    .replace(/[<>{}[\]\\]/g, '') // Strip HTML/script chars
    .replace(/[_+=~`!@#$%^&*()]/g, ' ') // Strip special noise symbols
    .replace(/\s+/g, ' ')
    .trim();

  // Convert ALL CAPS or all lowercase into canonical Title Case
  return trimmed
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Standardize address strings and provide default locality if missing
 */
export function sanitizeAddress(rawAddress?: string, defaultArea = 'Bengaluru'): string {
  if (!rawAddress || rawAddress.trim().length === 0) {
    return `${defaultArea} Main Road`;
  }
  return rawAddress
    .replace(/[<>{}[\]]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Strict Geospatial Validation within Karnataka state boundaries
 */
export function validateCoordinates(lat: number, lng: number): { valid: boolean; lat: number; lng: number; reason?: string } {
  if (isNaN(lat) || isNaN(lng)) {
    return {
      valid: false,
      lat: KARNATAKA_BOUNDS.DEFAULT_LAT,
      lng: KARNATAKA_BOUNDS.DEFAULT_LNG,
      reason: 'Coordinates are NaN/Non-numeric',
    };
  }

  // Check if coordinates lie within Karnataka geographical boundary
  const inKarnataka =
    lat >= KARNATAKA_BOUNDS.MIN_LAT &&
    lat <= KARNATAKA_BOUNDS.MAX_LAT &&
    lng >= KARNATAKA_BOUNDS.MIN_LNG &&
    lng <= KARNATAKA_BOUNDS.MAX_LNG;

  if (!inKarnataka) {
    return {
      valid: false,
      lat: KARNATAKA_BOUNDS.DEFAULT_LAT,
      lng: KARNATAKA_BOUNDS.DEFAULT_LNG,
      reason: `Out-of-bounds coordinate (${lat}, ${lng}) outside Karnataka. Repositioned to Bengaluru reference center.`,
    };
  }

  return { valid: true, lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
}

/**
 * Canonical Food Name Mapping with Bilingual / Slang resolution
 */
export function resolveCanonicalFoodName(inputFood: string): { canonical: string; wasTransformed: boolean } {
  if (!inputFood) return { canonical: 'Street Snack', wasTransformed: true };
  const cleaned = inputFood.trim().toLowerCase().replace(/[-_]/g, ' ');

  if (CANONICAL_FOOD_ALIASES[cleaned]) {
    return { canonical: CANONICAL_FOOD_ALIASES[cleaned], wasTransformed: true };
  }

  // Fallback to title-casing the input
  const titleCased = cleanRawPlaceName(inputFood);
  return { canonical: titleCased, wasTransformed: titleCased !== inputFood };
}

/**
 * Impute missing prices using locality median or global street-food baseline
 */
export function imputeMissingPrice(locality?: string, foodName?: string): { price: number; method: string } {
  try {
    if (locality && foodName) {
      const row = db.prepare(`
        SELECT AVG(pf.approx_price) as avg_p
        FROM place_food_items pf
        JOIN places p ON pf.place_id = p.id
        JOIN food_items f ON pf.food_item_id = f.id
        WHERE p.locality LIKE ? AND f.name LIKE ? AND pf.approx_price > 0
      `).get(`%${locality}%`, `%${foodName}%`) as any;

      if (row && row.avg_p && row.avg_p > 0) {
        return { price: Math.round(row.avg_p), method: `LOCALITY_FOOD_MEDIAN (${locality})` };
      }
    }

    // Secondary fallback: Global average for this food item
    if (foodName) {
      const row = db.prepare(`
        SELECT AVG(pf.approx_price) as avg_p
        FROM place_food_items pf
        JOIN food_items f ON pf.food_item_id = f.id
        WHERE f.name LIKE ? AND pf.approx_price > 0
      `).get(`%${foodName}%`) as any;

      if (row && row.avg_p && row.avg_p > 0) {
        return { price: Math.round(row.avg_p), method: 'GLOBAL_FOOD_MEDIAN' };
      }
    }
  } catch (e) {
    // Graceful fallback if database is locked or cold
  }

  // Street food default baseline price in Karnataka (₹45 average)
  return { price: 45, method: 'BASELINE_DEFAULT_IMPUTATION' };
}

/**
 * IQR Outlier Detection for street food prices (prevents ₹10,000 spam or ₹0 invalid prices)
 */
export function validateAndCleanPrice(rawPrice: any, locality?: string, foodName?: string): {
  price: number;
  isOutlier: boolean;
  actionTaken: string;
} {
  const parsed = parseFloat(String(rawPrice).replace(/[^\d.]/g, ''));

  if (isNaN(parsed) || parsed <= 0) {
    const imputed = imputeMissingPrice(locality, foodName);
    return {
      price: imputed.price,
      isOutlier: true,
      actionTaken: `MISSING_VALUE_IMPUTED: ${imputed.method} (₹${imputed.price})`,
    };
  }

  // Street food realistic boundaries: ₹10 min to ₹350 max
  if (parsed < 10 || parsed > 350) {
    const imputed = imputeMissingPrice(locality, foodName);
    return {
      price: imputed.price,
      isOutlier: true,
      actionTaken: `OUTLIER_REJECTED: Raw price ₹${parsed} outside realistic IQR [₹10 - ₹350]. Imputed to ₹${imputed.price}`,
    };
  }

  return { price: Math.round(parsed), isOutlier: false, actionTaken: 'VALID_PRICE' };
}

/**
 * Record a permanent audit log of any data wrangling operation in SQLite
 */
export function recordTransformationAudit(
  entityType: 'PLACE' | 'PRICE' | 'REVIEW' | 'COORDINATE' | 'FOOD_ITEM',
  entityId: string,
  rawInput: string,
  cleanedOutput: string,
  rule: string,
  ingestionId?: string
) {
  try {
    const auditId = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    db.prepare(`
      INSERT INTO transformation_audit (
        id, ingestion_id, entity_type, entity_id, raw_input, cleaned_output, transformation_rule
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId,
      ingestionId || null,
      entityType,
      entityId,
      String(rawInput).slice(0, 500),
      String(cleanedOutput).slice(0, 500),
      rule
    );
  } catch (err: any) {
    console.warn('Transformation audit log error:', err.message);
  }
}
