# Google Maps setup

StreetBite can use Google Geocoding API to turn a selected map pin or current location into a readable address. Each place card also opens Google Maps directions through its **Maps** button. The interactive map tiles continue to use OpenStreetMap.

1. In Google Cloud Console, enable **Geocoding API** for a project with billing configured.
2. Create an API key restricted to the Geocoding API. Keep it server-side; do not use a `NEXT_PUBLIC_` variable for this key.
3. Add this to `.env.local` in the project root:

   ```env
   GOOGLE_MAPS_API_KEY=your_restricted_key
   ```

4. Restart the Next.js dev server. Pin lookups will use Google and fall back to OpenStreetMap if the key is absent or Google is unavailable.

The key is read only by `/api/geocode` and is never returned to the browser.
