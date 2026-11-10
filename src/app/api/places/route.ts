import { NextRequest, NextResponse } from 'next/server';
import db from '../../../db';
import { findBestDuplicateMatch } from '../../../lib/duplicates';
import { cleanRawPlaceName, sanitizeAddress, validateCoordinates, validateAndCleanPrice, recordTransformationAudit } from '../../../lib/wrangling';
import { analyzeReviewSentiment, standardizeFoodName } from '../../../lib/nlp';
import { extractSignboardText, calculateSimpleImageHash, validateStallImage } from '../../../lib/ocr';
import { Place } from '../../../types';

export const dynamic = 'force-dynamic';

// In-memory submission lock map to prevent double-click / race-condition duplicate creation
const SUBMISSION_LOCKS = new Map<string, number>();

export async function GET(req: NextRequest) {
  try {
    const places = db.prepare(`
      SELECT p.*, COALESCE(AVG(r.rating), 4.5) as rating_avg, COUNT(r.id) as review_count
      FROM places p
      LEFT JOIN reviews r ON p.id = r.place_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();
    return NextResponse.json({ places });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      address,
      locality,
      landmark,
      latitude,
      longitude,
      foodItems = [],
      foodItemPrices = {},
      initialRating,
      initialReviewText,
      pricePaid,
      photoBase64,
      photoOcrText,
      bypassDuplicateCheck = false,
    } = body;

    // 1. Log Raw Ingestion Payload (Immutable Data Provenance)
    const rawIngestionId = `raw-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      db.prepare(`
        INSERT INTO raw_ingestion_logs (id, source_type, raw_payload, status, ip_or_user_agent)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        rawIngestionId,
        'COMMUNITY_SUBMISSION',
        JSON.stringify(body),
        'INGESTED',
        req.headers.get('user-agent') || 'Browser Client'
      );
    } catch (e) {
      console.warn('Raw ingestion log error:', e);
    }

    // 2. Data Wrangling & Sanitization Stage
    const cleanedName = cleanRawPlaceName(name);
    const sanitizedAddr = sanitizeAddress(address);
    const coordValidation = validateCoordinates(latitude, longitude);
    const lat = coordValidation.lat;
    const lng = coordValidation.lng;

    // Log name transformation audit
    if (cleanedName !== name) {
      recordTransformationAudit('PLACE', 'temp-id', name, cleanedName, 'WHITESPACE_TRIM_AND_TITLECASE', rawIngestionId);
    }
    if (!coordValidation.valid) {
      recordTransformationAudit('COORDINATE', 'temp-id', `${latitude},${longitude}`, `${lat},${lng}`, 'OUT_OF_BOUNDS_FALLBACK', rawIngestionId);
    }

    if (!cleanedName) {
      return NextResponse.json(
        { error: 'Invalid place name provided' },
        { status: 400 }
      );
    }

    // Double-click race condition prevention
    const lockKey = `${cleanedName.toLowerCase()}_${lat.toFixed(3)}_${lng.toFixed(3)}`;
    const now = Date.now();
    if (SUBMISSION_LOCKS.has(lockKey) && now - SUBMISSION_LOCKS.get(lockKey)! < 4000) {
      return NextResponse.json(
        { error: 'Duplicate submission in progress. Please wait a moment.' },
        { status: 429 }
      );
    }
    SUBMISSION_LOCKS.set(lockKey, now);

    // Validate photo size / format if provided
    let photoHash = '';
    let extractedOcr = photoOcrText || '';
    if (photoBase64 && photoBase64.length > 100) {
      photoHash = calculateSimpleImageHash(photoBase64);
      if (!extractedOcr) {
        const ocrRes = await extractSignboardText(photoBase64);
        if (ocrRes.success) extractedOcr = ocrRes.extractedText;
      }
    }

    // Validate & Clean Price using IQR Outlier Detection
    const priceValidation = validateAndCleanPrice(pricePaid || 60, locality, foodItems[0] || 'Snack');
    const effectivePrice = priceValidation.price;
    if (priceValidation.isOutlier) {
      recordTransformationAudit('PRICE', 'temp-id', String(pricePaid), String(effectivePrice), priceValidation.actionTaken, rawIngestionId);
    }

    // Standardize food names list
    const stdFoods: string[] = foodItems.map((f: string) => standardizeFoodName(f));

    // 2. Multi-Signal Duplicate Detection Stage
    if (!bypassDuplicateCheck) {
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

      const duplicateCheck = findBestDuplicateMatch(
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

      // If High or Medium duplicate candidate detected, record candidate and interrupt creation
      if (duplicateCheck && duplicateCheck.decision !== 'LOW') {
        const candidateId = `dup-${Date.now()}`;
        db.prepare(`
          INSERT INTO duplicate_candidates (
            id, existing_place_id, new_place_name, new_place_lat, new_place_lng,
            similarity_score, location_score, name_score, food_score, address_score, decision, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          candidateId,
          duplicateCheck.matched_place!.id,
          cleanedName,
          lat,
          lng,
          duplicateCheck.composite_score,
          duplicateCheck.signals.location_score,
          duplicateCheck.signals.name_score,
          duplicateCheck.signals.food_score,
          duplicateCheck.signals.address_score,
          duplicateCheck.decision,
          'pending'
        );

        return NextResponse.json({
          duplicateDetected: true,
          decision: duplicateCheck.decision,
          compositeScore: duplicateCheck.composite_score,
          duplicateCheckResult: duplicateCheck,
          matchedPlace: duplicateCheck.matched_place,
          evidenceReasons: duplicateCheck.evidence_reasons,
          extractedOcrText: extractedOcr,
          message:
            duplicateCheck.decision === 'HIGH'
              ? 'This place may already exist in StreetBite.'
              : 'A similar place was found nearby.',
        });
      }
    }

    // 3. Database Creation Stage
    const placeId = `place-${Date.now()}`;
    const normName = cleanedName.toLowerCase();

    db.prepare(`
      INSERT INTO places (
        id, name, normalized_name, description, address, locality, landmark, latitude, longitude, is_verified, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      placeId,
      cleanedName,
      normName,
      description || 'Community submitted street food stall.',
      sanitizedAddr,
      locality || 'Bengaluru',
      landmark || '',
      lat,
      lng,
      0,
      'usr-1' // Default demo user
    );

    // Insert Food Items & Place-Food mapping (with per-item prices)
    for (const foodName of stdFoods) {
      const normFood = foodName.toLowerCase();
      let foodRow = db.prepare(`SELECT * FROM food_items WHERE normalized_name = ?`).get(normFood) as any;

      let foodId = foodRow?.id;
      if (!foodId) {
        foodId = `food-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        db.prepare(`
          INSERT INTO food_items (id, name, normalized_name, category_id, is_community_added)
          VALUES (?, ?, ?, ?, ?)
        `).run(foodId, foodName, normFood, 'cat-1', 1);
      }

      // Use per-item price if provided, else fallback to global pricePaid or 60
      const itemPrice = (foodItemPrices as Record<string, number | null>)[foodName] ??
                        (foodItemPrices as Record<string, number | null>)[normFood] ??
                        pricePaid ?? 60;

      db.prepare(`
        INSERT INTO place_food_items (id, place_id, food_item_id, approx_price, rating_avg, review_count)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(`pf-${Date.now()}-${Math.floor(Math.random() * 1000)}`, placeId, foodId, itemPrice || 60, initialRating || 5, 1);
    }

    // 4. Initial Review Ingestion & NLP Mining
    if (initialReviewText) {
      const reviewId = `rev-${Date.now()}`;
      const analysis = analyzeReviewSentiment(initialReviewText);

      db.prepare(`
        INSERT INTO reviews (
          id, place_id, user_id, rating, review_text, cleaned_text, sentiment_score, price_paid, visit_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        reviewId,
        placeId,
        'usr-1',
        initialRating || 5,
        initialReviewText,
        analysis.cleaned_text,
        analysis.overall_score,
        pricePaid || 60,
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
          INSERT INTO price_observations (id, place_id, reported_price, user_id)
          VALUES (?, ?, ?, ?)
        `).run(`pr-${Date.now()}`, placeId, pricePaid, 'usr-1');
      }
    }

    return NextResponse.json({
      success: true,
      placeId,
      message: 'Street food stall created successfully!',
    });
  } catch (error: any) {
    console.error('Place Creation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
