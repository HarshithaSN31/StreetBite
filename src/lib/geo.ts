/**
 * Calculate Haversine distance between two sets of GPS coordinates in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusMeters: number
): boolean {
  return haversineDistance(lat1, lon1, lat2, lon2) <= radiusMeters;
}

/**
 * Converts spatial distance in meters into a similarity score between 0.0 and 1.0.
 * Decays exponentially: at 0m -> 1.0, at 150m -> ~0.37, at 500m+ -> < 0.05
 */
export function geoSimilarityScore(distanceMeters: number): number {
  const decayHalfDistance = 150; // meters
  return Math.exp(-distanceMeters / decayHalfDistance);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
