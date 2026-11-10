'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '../../components/SearchBar';
import PlaceCard from '../../components/PlaceCard';
import MapView from '../../components/MapView';
import { List, Map, MapPin } from 'lucide-react';
import { Place } from '../../types';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Array<{ place: Place; rank_score: number; explanations: string[] }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [radiusMeters, setRadiusMeters] = useState(5000);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    async function executeSearch() {
      setIsLoading(true);
      try {
        const locationParams = userLocation ? `&lat=${userLocation.lat}&lng=${userLocation.lng}` : '';
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&radius=${radiusMeters}${locationParams}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    executeSearch();
  }, [query, radiusMeters, userLocation]);

  const placesList = results.map((r) => r.place);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search Bar Container */}
      <div className="pt-2">
        <SearchBar initialQuery={query} />
      </div>

      {/* Header Results Summary & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-orange-100 p-5 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>Results for</span>
            <span className="text-orange-600">"{query || 'All Foods'}"</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {results.length} place{results.length !== 1 ? 's' : ''} found{userLocation ? ' near your location' : ' in StreetBite'}
          </p>
        </div>

        {/* View Mode & Radius Selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={() =>
              navigator.geolocation?.getCurrentPosition((position) =>
                setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
              )
            }
            className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-2 text-orange-950 font-bold hover:bg-orange-100 transition-colors"
            title="Use your current location"
          >
            <MapPin className="h-3.5 w-3.5 text-orange-600" />
            {userLocation ? 'Location set' : 'Near me'}
          </button>

          <div className="flex items-center gap-1 bg-orange-50/40 border border-orange-100 rounded-xl p-1">
            {[1000, 2000, 5000].map((r) => (
              <button
                key={r}
                onClick={() => setRadiusMeters(r)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  radiusMeters === r ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r < 1000 ? `${r}m` : `${r / 1000}km`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-orange-50/40 border border-orange-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white text-orange-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'map' ? 'bg-white text-orange-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Map View"
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-orange-50/60 border border-orange-100 rounded-3xl h-44 animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white border border-orange-100 rounded-3xl p-10 text-center space-y-3 shadow-sm">
          <div className="text-4xl">🔍</div>
          <h3 className="text-lg font-extrabold text-slate-800">No exact match found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find an existing stall selling "{query}" within {radiusMeters / 1000}km. Be the first contributor to add it!
          </p>
          <a
            href={`/place/add?food=${encodeURIComponent(query)}`}
            className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-orange-500/20 active:scale-95"
          >
            + Add "{query}" Stall
          </a>
        </div>
      ) : viewMode === 'map' ? (
        <div className="space-y-4">
          <MapView places={placesList} zoom={13} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map(({ place, explanations }) => (
              <PlaceCard key={place.id} place={place} explanations={explanations} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map(({ place, explanations }) => (
            <PlaceCard key={place.id} place={place} explanations={explanations} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-slate-400 text-xs">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
