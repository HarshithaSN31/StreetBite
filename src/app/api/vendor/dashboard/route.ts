import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get('placeId') || 'place-1';

    const place = db.prepare(`SELECT * FROM places WHERE id = ?`).get(placeId) as any;
    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name, f.name as food_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN food_items f ON r.food_item_id = f.id
      WHERE r.place_id = ?
      ORDER BY r.created_at DESC
    `).all(placeId);

    const aspectRows = db.prepare(`
      SELECT ra.aspect, ra.sentiment, COUNT(*) as count
      FROM review_aspects ra
      JOIN reviews r ON ra.review_id = r.id
      WHERE r.place_id = ?
      GROUP BY ra.aspect, ra.sentiment
    `).all(placeId) as any[];

    const positiveAspects: Record<string, number> = {};
    const negativeAspects: Record<string, number> = {};

    aspectRows.forEach((row: any) => {
      if (row.sentiment === 'positive') {
        positiveAspects[row.aspect] = (positiveAspects[row.aspect] || 0) + row.count;
      } else if (row.sentiment === 'negative') {
        negativeAspects[row.aspect] = (negativeAspects[row.aspect] || 0) + row.count;
      }
    });

    const prices = db.prepare(`SELECT reported_price FROM price_observations WHERE place_id = ?`).all(placeId) as any[];
    const pricesArr = prices.map((p: any) => p.reported_price);
    const minPrice = pricesArr.length ? Math.min(...pricesArr) : 50;
    const maxPrice = pricesArr.length ? Math.max(...pricesArr) : 70;

    return NextResponse.json({
      vendor: {
        place_id: place.id,
        stall_name: place.name,
        address: place.address,
        rating_avg: 4.7,
        total_reviews: reviews.length,
        price_range: `₹${minPrice} - ₹${maxPrice}`,
        positive_aspects: Object.entries(positiveAspects).map(([aspect, count]) => ({ aspect, count })),
        areas_to_improve: Object.entries(negativeAspects).map(([aspect, count]) => ({ aspect, count })),
        recent_reviews: reviews,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
