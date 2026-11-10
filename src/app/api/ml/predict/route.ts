import { NextRequest, NextResponse } from 'next/server';
import { predictStallRating } from '../../../../lib/ml';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      approxPrice = 60,
      locality = 'HSR Layout',
      category = 'Indo-Chinese',
      tastePositivePct = 85,
      cleanlinessScore = 8,
      queueWaitMinutes = 10,
    } = body;

    const result = predictStallRating({
      approxPrice: Number(approxPrice),
      locality,
      category,
      tastePositivePct: Number(tastePositivePct),
      cleanlinessScore: Number(cleanlinessScore),
      queueWaitMinutes: Number(queueWaitMinutes),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
