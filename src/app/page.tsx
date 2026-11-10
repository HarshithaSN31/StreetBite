'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '../components/SearchBar';
import PlaceCard from '../components/PlaceCard';
import MapView from '../components/MapView';
import {
  Sparkles, MapPin, PlusCircle, Compass, Flame,
  DollarSign, Award, Utensils,
} from 'lucide-react';
import { Place } from '../types';

export default function HomePage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [radiusMeters, setRadiusMeters] = useState<number>(5000);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>({ lat: 12.9716, lng: 77.5946 });
  const [userLocName, setUserLocName] = useState<string>('HSR Layout, Bengaluru');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPlaces() {
      setIsLoading(true);
      try {
        let url = `/api/search?radius=${radiusMeters}`;
        if (userLoc) url += `&lat=${userLoc.lat}&lng=${userLoc.lng}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.results) {
          setPlaces(data.results.map((r: any) => ({ ...r.place, ranking_explanation: r.explanations })));
        }
      } catch (err) {
        console.error('Error loading home places:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPlaces();
  }, [radiusMeters, userLoc]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setUserLoc({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const loc = data?.address?.suburb || data?.address?.neighbourhood || data?.address?.city || 'Your Area';
          setUserLocName(`${loc} 📍`);
        } catch {
          setUserLocName('Current Location 📍');
        }
      },
      () => alert('Could not get your location. Please allow location access.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const categories = [
    { name: 'All',               icon: '🍽️' },
    { name: 'Chats',             icon: '🥠' },
    { name: 'Indo-Chinese',      icon: '🍜' },
    { name: 'Fast Food',         icon: '🍔' },
    { name: 'South Indian',      icon: '🥞' },
    { name: 'Beverages & Desserts', icon: '🧋' },
  ];

  const visiblePlaces = activeCategory === 'All' ? places : places.filter((place) => {
    const searchText = `${(place.food_items || []).map((f) => f.food_name).join(' ')} ${place.name}`.toLowerCase();
    const terms: Record<string, string> = {
      'Chats':              'chat chaat pani puri bhel sev dahi kachori masala',
      'Indo-Chinese':       'chinese noodles manchurian gobi 65',
      'Fast Food':          'fast burger sandwich maggi roll fries',
      'South Indian':       'south dosa idli vada girmit uttapam',
      'Beverages & Desserts': 'beverage drink juice dessert gola kulfi ice cream',
    };
    return (terms[activeCategory] || '').split(' ').some((t) => searchText.includes(t));
  });

  const popularPlaces  = visiblePlaces.slice(0, 4);
  const budgetEats     = visiblePlaces.filter((p) => (p.min_price ?? 999) <= 60).slice(0, 4);
  const highlyRated    = [...visiblePlaces]
    .filter((p) => p.review_count && p.review_count > 0)
    .sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0))
    .slice(0, 4);

  return (
    <div className="space-y-10 animate-in">

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="relative rounded-3xl overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 opacity-100" />
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-amber-300/20 rounded-full blur-2xl" />

        <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Discover Unregistered Stalls &amp; Local Chaats
          </div>

          {/* Hero headline */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-4 drop-shadow-sm">
            Find the street food
            <br />
            <span className="text-amber-100">people actually love.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-orange-50 text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-8 opacity-90">
            Real prices, authentic reviews, and exact GPS coordinates for roadside carts,
            chat centres &amp; corner stalls across Karnataka.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto mb-6">
            <SearchBar />
          </div>

          {/* Location + radius + add stall row */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs">
            <button
              onClick={handleUseLocation}
              className="flex items-center gap-1.5 bg-white hover:bg-orange-50 text-orange-700 font-bold border border-white/80 px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span>{userLoc ? userLocName : 'Use My Location'}</span>
            </button>

            <div className="flex items-center gap-1 bg-white/90 border border-white/60 rounded-xl px-3 py-1.5 shadow-sm backdrop-blur-sm">
              <span className="text-slate-500 font-medium mr-1">Radius:</span>
              {[1000, 2000, 5000].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusMeters(r)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${
                    radiusMeters === r
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-orange-600'
                  }`}
                >
                  {r < 1000 ? `${r}m` : `${r / 1000}km`}
                </button>
              ))}
            </div>

            <Link
              href="/place/add"
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Street Food</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CATEGORY CHIPS
      ══════════════════════════════════════ */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none -mt-4">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs ${
              activeCategory === cat.name
                ? 'bg-orange-500 text-white shadow-orange-200'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-700'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          MAP SECTION
      ══════════════════════════════════════ */}
      <div id="nearby-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-orange-500" />
              Street Food Map
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {places.length} active stalls near {userLocName}
            </p>
          </div>
          <span className="text-xs text-orange-500 font-bold hidden sm:inline bg-orange-50 px-3 py-1 rounded-xl border border-orange-100">
            Click pins to explore
          </span>
        </div>
        <MapView places={places} centerLat={userLoc?.lat} centerLng={userLoc?.lng} zoom={13} />
      </div>

      {/* ══════════════════════════════════════
          SECTION 1: Popular Near You
      ══════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Popular Near You
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Sorted by distance, reviews &amp; open dishes</p>
          </div>
          <Link href="/search" className="text-xs text-orange-600 hover:underline font-bold bg-orange-50 px-3 py-1 rounded-xl border border-orange-100">
            View All →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-orange-100 rounded-3xl h-48 animate-pulse" />
            ))}
          </div>
        ) : popularPlaces.length === 0 ? (
          <div className="bg-white border border-orange-100 rounded-3xl p-8 text-center space-y-2">
            <Utensils className="w-8 h-8 text-orange-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No stalls found in this area</p>
            <p className="text-xs text-slate-500">Try expanding your radius or add the first stall!</p>
            <Link href="/place/add" className="inline-block mt-2 text-xs font-bold bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors">
              + Add a Stall
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} explanations={place.ranking_explanation} />
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          SECTION 2: Community Favorites
      ══════════════════════════════════════ */}
      {highlyRated.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Community Favorites
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Highly rated by real customers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlyRated.map((place) => (
              <PlaceCard key={place.id} place={place} explanations={place.ranking_explanation} />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          SECTION 3: Budget Eats
      ══════════════════════════════════════ */}
      {budgetEats.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Pocket-Friendly Eats
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Under ₹60</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Verified dishes under ₹60 for budget foodies</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetEats.map((place) => (
              <PlaceCard key={place.id} place={place} explanations={place.ranking_explanation} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
