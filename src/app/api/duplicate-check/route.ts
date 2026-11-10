import { NextRequest, NextResponse } from 'next/server';
import db from '../../../db';
import { findBestDuplicateMatch } from '../../../lib/duplicates';
import { cleanRawPlaceName, sanitizeAddress, validateCoordinates } from '../../../lib/wrangling';
import { standardizeFoodName } from '../../../lib/nlp';
import { extractSignboardText, calculateSimpleImageHash, validateStallImage } from '../../../lib/ocr';
import { Place } from '../../../types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      latitude,
      longitude,
      address,
      locality,
      foodItems = [],
      photoBase64,
      photoOcrText: inputOcrText,
    } = body;

    const cleanedName = cleanRawPlaceName(name || '');
    const sanitizedAddr = sanitizeAddress(address || '');
    const { valid, lat, lng } = validateCoordinates(latitude, longitude);

    if (!cleanedName || !valid) {
      return NextResponse.json({ isDuplicate: false, decision: 'LOW' });
    }

    // Process photo & extract signboard OCR text if image provided
    let extractedOcr = inputOcrText || '';
    let photoHash = '';
    if (photoBase64 && photoBase64.length > 100) {
      photoHash = calculateSimpleImageHash(photoBase64);
      if (!extractedOcr) {
        const ocrRes = await extractSignboardText(photoBase64);
        if (ocrRes.success) {
          extractedOcr = ocrRes.extractedText;
        }
      }
    }

    const stdFoods: string[] = foodItems.map((f: string) => standardizeFoodName(f));

    // Fetch existing places
    const existingRows = db.prepare(`
      SELECT p.*, COALESCE(AVG(r.rating), 4.5) as rating_avg, COUNT(r.id) as review_count
      FROM places p
      LEFT JOIN reviews r ON p.id = r.place_id
      GROUP BY p.id
    `).all() as any[];

    const existingPlaces: Place[] = existingRows.map((r) => {
      const foods = db.prepare(`
        SELECT pf.*, f.name as food_name
        FROM place_food_items pf
        JOIN food_items f ON pf.food_item_id = f.id
        WHERE pf.place_id = ?
      `).all(r.id) as any[];

      return {
        id: r.id,
        name: r.name,
        normalized_name: r.normalized_name,
        description: r.description,
        address: r.address,
        locality: r.locality,
        landmark: r.landmark,
        latitude: r.latitude,
        longitude: r.longitude,
        is_verified: Boolean(r.is_verified),
        created_by_user_id: r.created_by_user_id,
        created_at: r.created_at,
        food_items: foods.map((f) => ({
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

    const matchResult = findBestDuplicateMatch(
      {
        name: cleanedName,
        latitude: lat,
        longitude: lng,
        address: sanitizedAddr,
        locality,
        foodNames: stdFoods,
        photoOcrText: extractedOcr,
        photoHash,
      },
      existingPlaces
    );

    if (!matchResult || matchResult.decision === 'LOW') {
      return NextResponse.json({
        isDuplicate: false,
        decision: 'LOW',
        compositeScore: matchResult?.composite_score || 0,
        extractedOcrText: extractedOcr,
      });
    }

    return NextResponse.json({
      isDuplicate: matchResult.decision === 'HIGH',
      decision: matchResult.decision,
      compositeScore: matchResult.composite_score,
      locationScore: matchResult.signals.location_score,
      nameScore: matchResult.signals.name_score,
      foodScore: matchResult.signals.food_score,
      addressScore: matchResult.signals.address_score,
      ocrScore: matchResult.signals.ocr_score,
      imageScore: matchResult.signals.image_score,
      evidenceReasons: matchResult.evidence_reasons,
      explanation: matchResult.explanation,
      matchedPlace: matchResult.matched_place,
      extractedOcrText: extractedOcr,
    });
  } catch (error: any) {
    console.error('Duplicate Check API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
