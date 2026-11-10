import { Place } from '../types';
import { haversineDistance, geoSimilarityScore } from './geo';
import { stringSimilarity, jaccardSimilarity } from './nlp';
import { calculateOcrNameSimilarity, calculateImageHashSimilarity } from './ocr';

export interface DuplicateDetectionInput {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  locality?: string;
  foodNames?: string[];
  photoOcrText?: string;
  photoHash?: string;
}

export interface DuplicateSignalBreakdown {
  location_score: number;
  name_score: number;
  food_score: number;
  address_score: number;
  ocr_score: number;
  image_score: number;
}

export interface DuplicateCheckResult {
  composite_score: number;
  signals: DuplicateSignalBreakdown;
  decision: 'LOW' | 'MEDIUM' | 'HIGH';
  matched_place?: Place;
  evidence_reasons: string[];
  explanation: string;
}

// Configurable threshold defaults
export const DUPLICATE_CONFIG = {
  HIGH_THRESHOLD: 0.70,
  MEDIUM_THRESHOLD: 0.45,
};

/**
 * Intelligent Multi-Signal Duplicate Detection Engine
 * Combines Geo distance, Name similarity, Food overlap, Address match,
 * Signboard OCR text, and Visual photo similarity.
 */
export function calculateDuplicateScore(
  input: DuplicateDetectionInput,
  existingPlace: Place
): DuplicateCheckResult {
  const evidence_reasons: string[] = [];

  // 1. Geographic distance signal
  const distMeters = haversineDistance(
    input.latitude,
    input.longitude,
    existingPlace.latitude,
    existingPlace.longitude
  );
  const location_score = geoSimilarityScore(distMeters);
  if (distMeters <= 50) {
    evidence_reasons.push(`📍 Pin location is extremely close (${Math.round(distMeters)}m away)`);
  } else if (distMeters <= 250) {
    evidence_reasons.push(`📍 Physical location is nearby (${Math.round(distMeters)}m away)`);
  }

  // 2. Name similarity signal (Levenshtein + Jaro-Winkler)
  const name_score = stringSimilarity(input.name, existingPlace.name);
  if (name_score >= 0.75) {
    evidence_reasons.push(`🏷️ High stall name similarity ("${input.name}" vs "${existingPlace.name}")`);
  }

  // 3. Food item overlap signal (Jaccard similarity)
  const inputFoods = input.foodNames || [];
  const existingFoods = (existingPlace.food_items || []).map((f) => f.food_name);
  const food_score = jaccardSimilarity(inputFoods, existingFoods);

  const matchedFoods = inputFoods.filter((f) =>
    existingFoods.some((ef) => ef.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(ef.toLowerCase()))
  );
  if (matchedFoods.length > 0) {
    evidence_reasons.push(`🍢 Overlapping food items (${matchedFoods.join(', ')})`);
  }

  // 4. Address & Locality similarity signal
  const inputAddr = `${input.address || ''} ${input.locality || ''}`;
  const existingAddr = `${existingPlace.address || ''} ${existingPlace.locality || ''}`;
  const address_score = stringSimilarity(inputAddr, existingAddr);
  if (address_score >= 0.70) {
    evidence_reasons.push(`🏠 Matching locality & street address`);
  }

  // 5. Signboard OCR Text Extraction signal
  let ocr_score = 0.0;
  if (input.photoOcrText && input.photoOcrText.trim().length > 0) {
    ocr_score = calculateOcrNameSimilarity(input.photoOcrText, existingPlace.name);
    if (ocr_score >= 0.70) {
      evidence_reasons.push(`📷 Signboard OCR extracted text matched existing stall ("${input.photoOcrText.slice(0, 30)}")`);
    }
  }

  // 6. Visual Image Similarity signal
  let image_score = 0.0;
  if (input.photoHash && existingPlace.photos && existingPlace.photos.length > 0) {
    image_score = calculateImageHashSimilarity(input.photoHash, existingPlace.photos[0]);
    if (image_score >= 0.75) {
      evidence_reasons.push(`🖼️ Visual photograph similarity match (${(image_score * 100).toFixed(0)}%)`);
    }
  }

  // Dynamic Evidence Weighting
  // If OCR or Image evidence is present, incorporate them; otherwise redistribute weights proportionally
  let w_loc = 0.35;
  let w_name = 0.25;
  let w_food = 0.15;
  let w_addr = 0.15;
  let w_ocr = 0.0;
  let w_img = 0.0;

  if (input.photoOcrText) {
    w_ocr = 0.10;
    w_loc -= 0.05;
    w_name -= 0.05;
  }

  if (input.photoHash) {
    w_img = 0.05;
    w_loc -= 0.05;
  }

  const composite_score = Number(
    (
      w_loc * location_score +
      w_name * name_score +
      w_food * food_score +
      w_addr * address_score +
      w_ocr * ocr_score +
      w_img * image_score
    ).toFixed(3)
  );

  // Determine Threshold Decision
  let decision: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (composite_score >= DUPLICATE_CONFIG.HIGH_THRESHOLD) {
    decision = 'HIGH';
  } else if (composite_score >= DUPLICATE_CONFIG.MEDIUM_THRESHOLD) {
    decision = 'MEDIUM';
  }

  const signals: DuplicateSignalBreakdown = {
    location_score: Number(location_score.toFixed(3)),
    name_score: Number(name_score.toFixed(3)),
    food_score: Number(food_score.toFixed(3)),
    address_score: Number(address_score.toFixed(3)),
    ocr_score: Number(ocr_score.toFixed(3)),
    image_score: Number(image_score.toFixed(3)),
  };

  const explanation = `Matched ${Math.round(distMeters)}m distance (${(location_score * 100).toFixed(0)}%), name similarity (${(name_score * 100).toFixed(0)}%), food match (${(food_score * 100).toFixed(0)}%).`;

  return {
    composite_score,
    signals,
    decision,
    matched_place: existingPlace,
    evidence_reasons,
    explanation,
  };
}

/**
 * Scan existing places list to find highest composite duplicate match
 */
export function findBestDuplicateMatch(
  input: DuplicateDetectionInput,
  existingPlaces: Place[]
): DuplicateCheckResult | null {
  let bestResult: DuplicateCheckResult | null = null;

  for (const place of existingPlaces) {
    const result = calculateDuplicateScore(input, place);
    if (!bestResult || result.composite_score > bestResult.composite_score) {
      bestResult = result;
    }
  }

  return bestResult;
}
