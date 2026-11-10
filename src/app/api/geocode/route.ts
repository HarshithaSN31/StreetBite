import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'A valid latitude and longitude are required.' }, { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return NextResponse.json({ error: 'Google geocoding is not configured.' }, { status: 503 });

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('key', key);
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error(`Google Geocoding returned ${response.status}`);
    const data = await response.json();
    const result = data.results?.[0];
    if (data.status !== 'OK' || !result) {
      return NextResponse.json({ error: 'No address found for these coordinates.' }, { status: 404 });
    }

    const components = result.address_components || [];
    const locality = components.find((part: any) => part.types?.some((type: string) => ['sublocality', 'sublocality_level_1', 'neighborhood', 'locality'].includes(type)))?.long_name;
    return NextResponse.json({ address: result.formatted_address, locality: locality || components.find((part: any) => part.types?.includes('administrative_area_level_2'))?.long_name });
  } catch (error) {
    console.error('Google geocoding error:', error);
    return NextResponse.json({ error: 'Address lookup is temporarily unavailable.' }, { status: 502 });
  }
}
