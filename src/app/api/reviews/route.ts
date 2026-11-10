import { NextRequest, NextResponse } from 'next/server';
import db from '../../../db';
import { analyzeReviewSentiment } from '../../../lib/nlp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { placeId, foodItemId, rating, reviewText, pricePaid } = body;

    if (!placeId || !rating || !reviewText) {
      return NextResponse.json(
        { error: 'Missing required review fields' },
        { status: 400 }
      );
    }

    const reviewId = `rev-${Date.now()}`;
    const analysis = analyzeReviewSentiment(reviewText);

    db.prepare(`
      INSERT INTO reviews (
        id, place_id, user_id, food_item_id, rating, review_text, cleaned_text, sentiment_score, price_paid, visit_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reviewId,
      placeId,
      'usr-1',
      foodItemId || null,
      rating,
      reviewText,
      analysis.cleaned_text,
      analysis.overall_score,
      pricePaid || null,
      new Date().toISOString().split('T')[0]
    );

    // Record Aspect mining entries
    analysis.aspects.forEach((asp, idx) => {
      db.prepare(`
        INSERT INTO review_aspects (id, review_id, aspect, sentiment, confidence)
        VALUES (?, ?, ?, ?, ?)
      `).run(`asp-${reviewId}-${idx}`, reviewId, asp.aspect, asp.sentiment, asp.confidence);
    });

    if (pricePaid) {
      db.prepare(`
        INSERT INTO price_observations (id, place_id, food_item_id, reported_price, user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(`pr-${Date.now()}`, placeId, foodItemId || null, pricePaid, 'usr-1');
    }

    // Update food item rating average if food specified
    if (foodItemId) {
      const stats = db.prepare(`
        SELECT AVG(rating) as avg_rating, COUNT(id) as count
        FROM reviews
        WHERE place_id = ? AND food_item_id = ?
      `).get(placeId, foodItemId) as any;

      if (stats) {
        db.prepare(`
          UPDATE place_food_items
          SET rating_avg = ?, review_count = ?
          WHERE place_id = ? AND food_item_id = ?
        `).run(Number(stats.avg_rating.toFixed(1)), stats.count, placeId, foodItemId);
      }
    }

    return NextResponse.json({
      success: true,
      reviewId,
      sentimentScore: analysis.overall_score,
      extractedAspects: analysis.aspects,
      message: 'Review posted and mined successfully!',
    });
  } catch (error: any) {
    console.error('Review Submission API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
