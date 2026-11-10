import { NextRequest, NextResponse } from 'next/server';
import db from '../../../db';
import { rankPlaceForQuery } from '../../../lib/ranking';
import { Place } from '../../../types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;
    const radius = searchParams.get('radius') ? parseInt(searchParams.get('radius')!, 10) : 5000;

    // Fetch places from SQLite along with food items and aggregated ratings
    const placesRows = db.prepare(`
      SELECT 
        p.*,
        AVG(r.rating) as rating_avg,
        COUNT(r.id) as review_count,
        MIN(po.reported_price) as min_price,
        MAX(po.reported_price) as max_price
      FROM places p
      LEFT JOIN reviews r ON p.id = r.place_id
      LEFT JOIN price_observations po ON p.id = po.place_id
      GROUP BY p.id
    `).all() as any[];

    // Attach food items for each place
    const getFoodItemsStmt = db.prepare(`
      SELECT pf.*, f.name as food_name
      FROM place_food_items pf
      JOIN food_items f ON pf.food_item_id = f.id
      WHERE pf.place_id = ?
    `);

    const processedPlaces: Place[] = placesRows.map((row) => {
      const foodItems = getFoodItemsStmt.all(row.id) as any[];
      return {
        id: row.id,
        name: row.name,
        normalized_name: row.normalized_name,
        description: row.description,
        address: row.address,
        locality: row.locality,
        landmark: row.landmark,
        latitude: row.latitude,
        longitude: row.longitude,
        is_verified: Boolean(row.is_verified),
        created_by_user_id: row.created_by_user_id,
        created_at: row.created_at,
        rating_avg: row.rating_avg === null ? undefined : Number(row.rating_avg.toFixed(1)),
        review_count: row.review_count || 0,
        min_price: row.min_price === null ? undefined : row.min_price,
        max_price: row.max_price === null ? undefined : row.max_price,
        food_items: foodItems.map((f) => ({
          id: f.id,
          place_id: f.place_id,
          food_item_id: f.food_item_id,
          food_name: f.food_name,
          approx_price: f.approx_price,
          rating_avg: f.rating_avg,
          review_count: f.review_count,
        })),
      };
    });

    // Score & Rank each place using Explainable Recommendation model
    const rankedResults = processedPlaces
      .map((place) => {
        const { score, explanations } = rankPlaceForQuery(place, {
          foodQuery: q,
          userLat,
          userLng,
          maxDistanceMeters: radius,
        });

        return {
          place,
          rank_score: score,
          explanations,
        };
      })
      // Filter out places exceeding spatial radius if user location provided
      .filter((res) => {
        if (userLat !== undefined && userLng !== undefined && res.place.distance_meters) {
          return res.place.distance_meters <= radius;
        }
        return true;
      })
      .sort((a, b) => b.rank_score - a.rank_score);

    // Log search event in analytics
    if (q) {
      db.prepare(`
        INSERT INTO search_analytics (id, search_query, user_lat, user_lng, results_count)
        VALUES (?, ?, ?, ?, ?)
      `).run(`search-${Date.now()}`, q, userLat || null, userLng || null, rankedResults.length);
    }

    return NextResponse.json({
      query: q,
      total: rankedResults.length,
      results: rankedResults,
    });
  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
