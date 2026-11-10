import { Place } from '../types';
import { haversineDistance, formatDistance } from './geo';
import { stringSimilarity, normalizeString } from './nlp';

export interface SearchQueryOptions {
  foodQuery?: string;
  userLat?: number;
  userLng?: number;
  maxDistanceMeters?: number;
  minRating?: number;
}

/**
 * Bayesian Weighted Rating calculation
 * WR = (v / (v + m)) * R + (m / (v + m)) * C
 * Where:
 *  v = review count for the place
 *  m = minimum review threshold (e.g. 5)
 *  R = average rating for the place
 *  C = global mean rating across all places (e.g. 4.0)
 */
export function calculateBayesianRating(
  ratingAvg: number,
  reviewCount: number,
  minReviewsThreshold = 5,
  globalMean = 4.0
): number {
  if (reviewCount === 0) return globalMean;
  const v = reviewCount;
  const m = minReviewsThreshold;
  return (v / (v + m)) * ratingAvg + (m / (v + m)) * globalMean;
}

/**
 * Calculate multi-signal search rank score with explainability tags
 */
export function rankPlaceForQuery(
  place: Place,
  options: SearchQueryOptions
): { score: number; explanations: string[] } {
  const explanations: string[] = [];
  let score = 0;

  // 1. Food Query Relevance Signal
  let foodMatchScore = 0;
  if (options.foodQuery) {
    const qNorm = normalizeString(options.foodQuery);
    const placeFoods = (place.food_items || []).map((f) => f.food_name);
    
    // Check direct substring or fuzzy match against stall food items
    let matchedFoodName = '';
    for (const fName of placeFoods) {
      const fNorm = normalizeString(fName);
      if (fNorm.includes(qNorm) || qNorm.includes(fNorm)) {
        foodMatchScore = 1.0;
        matchedFoodName = fName;
        break;
      }
      const sim = stringSimilarity(qNorm, fNorm);
      if (sim > foodMatchScore) {
        foodMatchScore = sim;
        matchedFoodName = fName;
      }
    }

    // Also check place name / categories if no exact food match
    if (foodMatchScore < 0.5) {
      const nameSim = stringSimilarity(qNorm, place.name);
      if (nameSim > foodMatchScore) foodMatchScore = nameSim * 0.8;
    }

    if (foodMatchScore > 0.6) {
      explanations.push(
        matchedFoodName
          ? `✓ Frequently reviewed for ${matchedFoodName}`
          : `✓ Relevant to "${options.foodQuery}"`
      );
    }
  } else {
    foodMatchScore = 1.0; // No filter specified
  }

  score += foodMatchScore * 40; // Max 40 pts

  // 2. Geospatial Distance Signal
  let distanceScore = 0;
  if (options.userLat !== undefined && options.userLng !== undefined) {
    const dist = haversineDistance(
      options.userLat,
      options.userLng,
      place.latitude,
      place.longitude
    );
    place.distance_meters = Math.round(dist);

    // Distance decay: 100% score within 500m, decaying to 0 at 5km
    const maxDist = options.maxDistanceMeters || 5000;
    distanceScore = Math.max(0, 1 - dist / maxDist);

    if (dist <= 1500) {
      explanations.push(`✓ Only ${formatDistance(dist)} away`);
    } else {
      explanations.push(`📍 Location: ${formatDistance(dist)}`);
    }
  }
  score += distanceScore * 25; // Max 25 pts

  // 3. Bayesian Smoothed Rating Signal
  const bRating = calculateBayesianRating(
    place.rating_avg || 4.0,
    place.review_count || 0
  );
  score += (bRating / 5.0) * 20; // Max 20 pts

  if ((place.review_count || 0) > 0) {
    explanations.push(
      `✓ ${(place.rating_avg || 0).toFixed(1)} ★ from ${place.review_count} community review${
        (place.review_count || 0) > 1 ? 's' : ''
      }`
    );
  }

  // 4. Community Activity & Popularity Boost
  if ((place.review_count || 0) >= 10) {
    score += 10;
    explanations.push(`🔥 High community activity`);
  } else if ((place.review_count || 0) >= 3) {
    score += 5;
  }

  place.ranking_explanation = explanations;
  return { score: Number(score.toFixed(2)), explanations };
}
