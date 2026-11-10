import Link from 'next/link';
import { Star, MapPin, Navigation, Utensils, CheckCircle2, IndianRupee } from 'lucide-react';
import { Place } from '../types';
import { formatDistance } from '../lib/geo';

interface PlaceCardProps {
  place: Place;
  rankScore?: number;
  explanations?: string[];
}

export default function PlaceCard({ place, rankScore, explanations = [] }: PlaceCardProps) {
  const googleNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  const hasReviews = place.review_count && place.review_count > 0;

  return (
    <div className="bg-white border border-orange-100/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between group">
      <div>
        {/* Header Title & Badges */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-orange-600 transition-colors leading-snug">
              <Link href={`/place/${place.id}`}>{place.name}</Link>
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="font-medium text-slate-600">{place.locality || 'Bengaluru'}</span>
              {place.distance_meters !== undefined && (
                <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[11px] border border-orange-200/50">
                  {formatDistance(place.distance_meters)} away
                </span>
              )}
            </div>
          </div>

          {/* Rating Badge */}
          <div className="shrink-0">
            {hasReviews ? (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-xl font-black text-xs shadow-xs">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{(place.rating_avg ?? 0).toFixed(1)}</span>
                <span className="text-slate-400 font-normal text-[10px]">({place.review_count})</span>
              </div>
            ) : (
              <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200">
                New stall
              </span>
            )}
          </div>
        </div>

        {/* Description / Story */}
        <p className="text-slate-600 text-xs line-clamp-2 my-2.5 leading-relaxed">
          {place.description || 'Authentic local street food stall.'}
        </p>

        {/* Food Items & Price Tags */}
        <div className="flex flex-wrap items-center gap-1.5 my-3">
          {(place.food_items || []).slice(0, 3).map((f) => (
            <span
              key={f.id}
              className="bg-orange-50/70 text-orange-800 border border-orange-200/50 text-[11px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1"
            >
              <Utensils className="w-3 h-3 text-orange-500" />
              {f.food_name}
            </span>
          ))}

          {place.min_price && place.max_price && (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[11px] px-2 py-0.5 rounded-lg font-bold flex items-center gap-0.5">
              <span>₹{place.min_price} – ₹{place.max_price}</span>
            </span>
          )}
        </div>

        {/* Why this appears (Recommendation highlight) */}
        {explanations.length > 0 && (
          <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-2.5 my-2 text-[11px] text-slate-600 space-y-0.5">
            <div className="font-bold text-orange-800 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-orange-600" /> Why we recommend this
            </div>
            {explanations.slice(0, 2).map((exp, idx) => (
              <div key={idx} className="text-slate-600 font-medium truncate">
                {exp}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-2">
        <Link
          href={`/place/${place.id}`}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-xl text-center shadow-xs transition-colors"
        >
          View Menu & Reviews
        </Link>
        <a
          href={googleNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
          title="Get Directions in Google Maps"
        >
          <Navigation className="w-3.5 h-3.5 text-orange-600" />
          <span className="hidden sm:inline">Directions</span>
        </a>
      </div>
    </div>
  );
}
