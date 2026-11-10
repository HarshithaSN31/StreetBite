import { NextResponse } from 'next/server';
import db from '../../../../db';
import { runDBSCANClustering, DBSCANPoint } from '../../../../lib/clustering';
import { runAprioriMining, Transaction } from '../../../../lib/apriori';
import { generatePriceIntelligenceReport } from '../../../../lib/price-intelligence';
import { predictStallRating } from '../../../../lib/ml';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch real vendors from SQLite for DBSCAN Spatial Clustering
    const placeRows = db.prepare(`SELECT id, name, locality, latitude, longitude FROM places`).all() as any[];
    const dbscanPoints: DBSCANPoint[] = placeRows.map((p) => ({
      id: p.id,
      name: p.name,
      locality: p.locality || 'Bengaluru',
      latitude: p.latitude,
      longitude: p.longitude,
    }));
    const dbscanResults = runDBSCANClustering(dbscanPoints, 500, 2);

    // 2. Fetch real transactions from SQLite for Apriori Association Mining
    const basketRows = db.prepare(`SELECT id, food_item_ids FROM meal_baskets`).all() as any[];
    const transactions: Transaction[] = basketRows.map((b) => ({
      id: b.id,
      items: JSON.parse(b.food_item_ids || '[]'),
    }));
    const aprioriResults = runAprioriMining(transactions, 0.15, 0.40);

    // 3. Generate authentic Price Intelligence Report from SQLite observations
    const priceReport = generatePriceIntelligenceReport();

    // 4. Run baseline ML evaluation
    const mlBaseline = predictStallRating({
      approxPrice: 60,
      locality: 'HSR Layout',
      category: 'Indo-Chinese',
      tastePositivePct: 85,
      cleanlinessScore: 8,
      queueWaitMinutes: 10,
    });

    return NextResponse.json({
      dbscan: dbscanResults,
      apriori: aprioriResults,
      priceIntelligence: priceReport,
      mlModel: mlBaseline,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
