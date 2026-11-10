import db from '../db';

export interface DishPriceMetric {
  foodName: string;
  category: string;
  observationsCount: number;
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
  avgPrice: number;
  stdDev: number;
  iqr: number;
}

export interface LocalityPriceComparison {
  locality: string;
  averageBasketPrice: number;
  dishCount: number;
  priceIndexVsCityAverage: number; // e.g. +12% or -8%
}

export interface PriceSurgeAlert {
  id: string;
  placeName: string;
  locality: string;
  foodName: string;
  oldPrice: number;
  newPrice: number;
  deltaPercent: number;
  alertType: 'SURGE' | 'DROP';
  timestamp: string;
}

export interface PriceIntelligenceReport {
  dishMetrics: DishPriceMetric[];
  localityComparisons: LocalityPriceComparison[];
  surgeAlerts: PriceSurgeAlert[];
  cityWideAveragePrice: number;
  totalObservations: number;
}

/**
 * Price Intelligence Engine
 * Computes descriptive statistics (Median, IQR, Variance, Standard Deviation),
 * cross-locality cost indices, and detects price-surge anomalies.
 */
export function generatePriceIntelligenceReport(): PriceIntelligenceReport {
  // 1. Fetch all raw price observations
  const obsRows = db.prepare(`
    SELECT 
      po.id, po.reported_price, po.reported_at,
      p.id as place_id, p.name as place_name, p.locality,
      f.id as food_id, f.name as food_name,
      COALESCE(c.name, 'Street Food') as category_name
    FROM price_observations po
    JOIN places p ON po.place_id = p.id
    JOIN food_items f ON po.food_item_id = f.id
    LEFT JOIN food_categories c ON f.category_id = c.id
    WHERE po.reported_price > 0
    ORDER BY po.reported_at ASC
  `).all() as any[];

  // Also include place_food_items prices to enrich observations
  const pfRows = db.prepare(`
    SELECT 
      pf.id, pf.approx_price as reported_price, p.created_at as reported_at,
      p.id as place_id, p.name as place_name, p.locality,
      f.id as food_id, f.name as food_name,
      COALESCE(c.name, 'Street Food') as category_name
    FROM place_food_items pf
    JOIN places p ON pf.place_id = p.id
    JOIN food_items f ON pf.food_item_id = f.id
    LEFT JOIN food_categories c ON f.category_id = c.id
    WHERE pf.approx_price > 0
  `).all() as any[];

  const combinedObservations = [...obsRows, ...pfRows];
  const totalObservations = combinedObservations.length;

  if (totalObservations === 0) {
    return {
      dishMetrics: [],
      localityComparisons: [],
      surgeAlerts: [],
      cityWideAveragePrice: 45,
      totalObservations: 0,
    };
  }

  // 2. Group by Food Item to calculate Median, IQR, StdDev
  const foodGroups = new Map<string, { category: string; prices: number[] }>();
  combinedObservations.forEach((row) => {
    const existing = foodGroups.get(row.food_name) || { category: row.category_name, prices: [] as number[] };
    existing.prices.push(Number(row.reported_price));
    foodGroups.set(row.food_name, existing);
  });

  const dishMetrics: DishPriceMetric[] = [];
  let citySum = 0;
  let cityCount = 0;

  foodGroups.forEach(({ category, prices }, foodName) => {
    prices.sort((a, b) => a - b);
    const n = prices.length;
    const sum = prices.reduce((acc, p) => acc + p, 0);
    const avg = sum / n;
    citySum += sum;
    cityCount += n;

    // Median
    const median = n % 2 === 0 ? (prices[n / 2 - 1] + prices[n / 2]) / 2 : prices[Math.floor(n / 2)];

    // Q1 & Q3 for IQR
    const q1 = prices[Math.floor(n * 0.25)];
    const q3 = prices[Math.floor(n * 0.75)];
    const iqr = q3 - q1;

    // Standard deviation
    const variance = prices.reduce((acc, p) => acc + Math.pow(p - avg, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    dishMetrics.push({
      foodName,
      category,
      observationsCount: n,
      minPrice: prices[0],
      maxPrice: prices[n - 1],
      medianPrice: Math.round(median),
      avgPrice: Number(avg.toFixed(1)),
      stdDev: Number(stdDev.toFixed(1)),
      iqr: Math.round(iqr),
    });
  });

  const cityWideAveragePrice = cityCount > 0 ? Number((citySum / cityCount).toFixed(1)) : 45;

  // 3. Locality Comparison Analysis
  const localityGroups = new Map<string, number[]>();
  combinedObservations.forEach((row) => {
    const loc = row.locality || 'Bengaluru';
    const existing = localityGroups.get(loc) || ([] as number[]);
    existing.push(Number(row.reported_price));
    localityGroups.set(loc, existing);
  });

  const localityComparisons: LocalityPriceComparison[] = [];
  localityGroups.forEach((prices, locality) => {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const diffPct = ((avg - cityWideAveragePrice) / cityWideAveragePrice) * 100;

    localityComparisons.push({
      locality,
      averageBasketPrice: Math.round(avg),
      dishCount: prices.length,
      priceIndexVsCityAverage: Number(diffPct.toFixed(1)),
    });
  });

  // 4. Time-series Price Surge Anomaly Detection
  // If the same food at the same stall changes price by >= 20%
  const stallFoodObservations = new Map<string, Array<{ price: number; timestamp: string; placeName: string; locality: string; foodName: string }>>();
  combinedObservations.forEach((row) => {
    const key = `${row.place_id}__${row.food_name}`;
    const existing = stallFoodObservations.get(key) || [];
    existing.push({
      price: row.reported_price,
      timestamp: row.reported_at,
      placeName: row.place_name,
      locality: row.locality,
      foodName: row.food_name,
    });
    stallFoodObservations.set(key, existing);
  });

  const surgeAlerts: PriceSurgeAlert[] = [];
  stallFoodObservations.forEach((obsList, key) => {
    if (obsList.length >= 2) {
      obsList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const first = obsList[0];
      const latest = obsList[obsList.length - 1];

      if (first.price > 0 && latest.price !== first.price) {
        const deltaPct = ((latest.price - first.price) / first.price) * 100;
        if (Math.abs(deltaPct) >= 15) {
          surgeAlerts.push({
            id: `alert-${key}`,
            placeName: latest.placeName,
            locality: latest.locality,
            foodName: latest.foodName,
            oldPrice: first.price,
            newPrice: latest.price,
            deltaPercent: Number(deltaPct.toFixed(1)),
            alertType: deltaPct > 0 ? 'SURGE' : 'DROP',
            timestamp: latest.timestamp,
          });
        }
      }
    }
  });

  return {
    dishMetrics: dishMetrics.sort((a, b) => b.observationsCount - a.observationsCount),
    localityComparisons: localityComparisons.sort((a, b) => b.averageBasketPrice - a.averageBasketPrice),
    surgeAlerts,
    cityWideAveragePrice,
    totalObservations,
  };
}
