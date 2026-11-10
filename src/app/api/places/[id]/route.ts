import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const placeId = params.id;

    const placeRow = db.prepare(`
      SELECT p.*, u.name as vendor_name
      FROM places p
      LEFT JOIN users u ON p.created_by_user_id = u.id
      WHERE p.id = ?
    `).get(placeId) as any;

    if (!placeRow) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    // 1. Fetch Food Items
    const foodItems = db.prepare(`
      SELECT pf.*, f.name as food_name
      FROM place_food_items pf
      JOIN food_items f ON pf.food_item_id = f.id
      WHERE pf.place_id = ?
    `).all(placeId) as any[];

    // 2. Fetch Reviews & Aspects
    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name, f.name as food_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN food_items f ON r.food_item_id = f.id
      WHERE r.place_id = ?
      ORDER BY r.created_at DESC
    `).all(placeId) as any[];

    const getAspectsStmt = db.prepare(`SELECT * FROM review_aspects WHERE review_id = ?`);
    reviews.forEach((r: any) => {
      r.aspects = getAspectsStmt.all(r.id);
    });

    // 3. Aspect-Based Sentiment Aggregate Mining
    const allAspectRows = db.prepare(`
      SELECT ra.aspect, ra.sentiment, COUNT(*) as count
      FROM review_aspects ra
      JOIN reviews r ON ra.review_id = r.id
      WHERE r.place_id = ?
      GROUP BY ra.aspect, ra.sentiment
    `).all(placeId) as any[];

    const aspectMap: Record<string, { pos: number; neg: number; neu: number }> = {};
    allAspectRows.forEach((row: any) => {
      if (!aspectMap[row.aspect]) {
        aspectMap[row.aspect] = { pos: 0, neg: 0, neu: 0 };
      }
      if (row.sentiment === 'positive') aspectMap[row.aspect].pos += row.count;
      else if (row.sentiment === 'negative') aspectMap[row.aspect].neg += row.count;
      else aspectMap[row.aspect].neu += row.count;
    });

    const aspectSentimentSummary = Object.entries(aspectMap).map(([aspect, counts]) => {
      const total = counts.pos + counts.neg + counts.neu;
      const posPct = Math.round((counts.pos / total) * 100);
      const negPct = Math.round((counts.neg / total) * 100);
      let overall = 'Mixed';
      if (posPct >= 70) overall = 'Mostly Positive';
      else if (negPct >= 50) overall = 'Mostly Negative';

      return {
        aspect,
        positive_pct: posPct,
        negative_pct: negPct,
        total_mentions: total,
        overall,
      };
    });

    // 4. Community Price Range Observations Mining
    const priceRows = db.prepare(`
      SELECT reported_price FROM price_observations WHERE place_id = ?
    `).all(placeId) as any[];

    let minPrice = 50;
    let maxPrice = 80;
    let lastReportedPrice = 60;

    if (priceRows.length > 0) {
      const pricesArr = priceRows.map((pr: any) => pr.reported_price);
      minPrice = Math.min(...pricesArr);
      maxPrice = Math.max(...pricesArr);
      lastReportedPrice = pricesArr[pricesArr.length - 1];
    }

    // 5. Community Operating Hours
    const hours = db.prepare(`SELECT * FROM operating_hours WHERE place_id = ?`).all(placeId);

    // Rating Aggregation
    const ratingStats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(id) as total_reviews FROM reviews WHERE place_id = ?
    `).get(placeId) as any;

    const reviewCount = ratingStats?.total_reviews ?? reviews.length;
    const ratingAvg = reviewCount > 0 && ratingStats?.avg_rating !== null
      ? Number(Number(ratingStats.avg_rating).toFixed(1))
      : null;

    return NextResponse.json({
      place: {
        ...placeRow,
        is_verified: Boolean(placeRow.is_verified),
        rating_avg: ratingAvg,
        review_count: reviewCount,
        min_price: minPrice,
        max_price: maxPrice,
        last_reported_price: lastReportedPrice,
        food_items: foodItems,
        reviews,
        aspect_sentiment: aspectSentimentSummary,
        operating_hours: hours,
      },
    });
  } catch (error: any) {
    console.error('Place Details API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
