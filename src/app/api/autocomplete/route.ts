import { NextRequest, NextResponse } from 'next/server';
import db from '../../../db';
import { stringSimilarity, normalizeString } from '../../../lib/nlp';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const normQ = normalizeString(q);

    // Fetch all food items from DB
    const stmt = db.prepare(`
      SELECT f.id, f.name, f.normalized_name, c.name as category_name
      FROM food_items f
      LEFT JOIN food_categories c ON f.category_id = c.id
    `);
    const allFoods = stmt.all() as Array<{
      id: string;
      name: string;
      normalized_name: string;
      category_name?: string;
    }>;

    // Rank suggestions by prefix match, substring match, and fuzzy similarity
    const suggestions = allFoods
      .map((food) => {
        let score = 0;
        const normFood = food.normalized_name;

        if (normFood.startsWith(normQ)) {
          score = 1.0;
        } else if (normFood.includes(normQ)) {
          score = 0.8;
        } else {
          score = stringSimilarity(normQ, normFood);
        }

        return {
          id: food.id,
          name: food.name,
          category: food.category_name || 'General',
          score,
        };
      })
      .filter((item) => item.score > 0.35)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return NextResponse.json({
      query: q,
      suggestions,
      hasExactMatch: suggestions.some((s) => s.name.toLowerCase() === q.toLowerCase()),
    });
  } catch (error: any) {
    console.error('Autocomplete API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
