import { NextResponse } from 'next/server';
import db from '../../../../db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Dynamic Database Aggregations
    const totalPlaces = db.prepare(`SELECT COUNT(*) as c FROM places`).get() as any;
    const totalReviews = db.prepare(`SELECT COUNT(*) as c FROM reviews`).get() as any;
    const totalFoods = db.prepare(`SELECT COUNT(*) as c FROM food_items`).get() as any;
    const duplicateCount = db.prepare(`SELECT COUNT(*) as c FROM duplicate_candidates`).get() as any;
    const totalRawIngestion = db.prepare(`SELECT COUNT(*) as c FROM raw_ingestion_logs`).get() as any;
    const totalAudited = db.prepare(`SELECT COUNT(*) as c FROM transformation_audit`).get() as any;

    // 2. Fetch Transformation Audit Trail (Real SQLite Records)
    const auditLogs = db.prepare(`
      SELECT * FROM transformation_audit
      ORDER BY created_at DESC
      LIMIT 25
    `).all();

    // 3. Fetch Raw Ingestion Logs
    const rawLogs = db.prepare(`
      SELECT * FROM raw_ingestion_logs
      ORDER BY ingested_at DESC
      LIMIT 15
    `).all();

    // 4. Fetch Duplicate Candidates with Existing Place Details
    const duplicates = db.prepare(`
      SELECT d.*, p.name as existing_place_name, p.locality as existing_locality
      FROM duplicate_candidates d
      LEFT JOIN places p ON d.existing_place_id = p.id
      ORDER BY d.created_at DESC
    `).all();

    // 5. Fetch FSSAI Verification Summary
    const fssaiSummary = db.prepare(`
      SELECT 
        verification_status,
        COUNT(*) as count
      FROM fssai_verifications
      GROUP BY verification_status
    `).all();

    // 6. Dynamic Column Null Rate Check (Real Data Quality Profiling)
    const placesRows = db.prepare(`SELECT description, address, landmark, locality FROM places`).all() as any[];
    let missingDesc = 0;
    let missingLandmark = 0;
    let missingAddress = 0;

    placesRows.forEach((p) => {
      if (!p.description || p.description.trim().length === 0) missingDesc++;
      if (!p.landmark || p.landmark.trim().length === 0) missingLandmark++;
      if (!p.address || p.address.trim().length === 0) missingAddress++;
    });

    const totalP = Math.max(1, placesRows.length);

    return NextResponse.json({
      summary: {
        total_raw_submissions: (totalRawIngestion?.c || 0) + (totalPlaces?.c || 0),
        valid_records: totalPlaces?.c || 0,
        invalid_records: db.prepare(`SELECT COUNT(*) as c FROM raw_ingestion_logs WHERE status = 'REJECTED'`).get()?.c || 0,
        missing_values_handled: totalAudited?.c || 0,
        duplicate_candidates_detected: duplicateCount?.c || 0,
        cleaned_and_normalized: (totalPlaces?.c || 0) + (totalFoods?.c || 0),
        data_freshness: 'Real-Time Dynamic Sync (SQLite)',
      },
      quality_profiling: {
        missing_description_pct: Number(((missingDesc / totalP) * 100).toFixed(1)),
        missing_landmark_pct: Number(((missingLandmark / totalP) * 100).toFixed(1)),
        missing_address_pct: Number(((missingAddress / totalP) * 100).toFixed(1)),
        total_places_audited: totalP,
      },
      fssai_breakdown: fssaiSummary,
      transformation_logs: auditLogs,
      raw_ingestion_logs: rawLogs,
      duplicate_candidates: duplicates,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
