'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AspectSentiment from '../../../components/AspectSentiment';
import ReviewForm from '../../../components/ReviewForm';
import MapView from '../../../components/MapView';
import {
  Star, MapPin, Clock, IndianRupee, Utensils, ShieldCheck,
  MessageSquare, Navigation, ThumbsUp, Users, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Place } from '../../../types';

export const dynamic = 'force-dynamic';

function StarBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-slate-500 font-bold text-right">{rating}</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-slate-400 text-right">{count}</span>
    </div>
  );
}

export default function PlaceDetailPage() {
  const params = useParams();
  const placeId = (params?.id as string) || '';
  const [place, setPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const fetchPlaceDetails = async () => {
    if (!placeId) return;
    try {
      const res = await fetch(`/api/places/${placeId}`);
      const data = await res.json();
      if (data.place) setPlace(data.place);
    } catch (err) {
      console.error('Failed to load place details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPlaceDetails(); }, [placeId]);

  if (isLoading) {
    return (
      <div className="space-y-4 py-8 max-w-4xl mx-auto">
        <div className="bg-orange-50/60 border border-orange-100 h-64 rounded-3xl animate-pulse" />
        <div className="bg-orange-50/60 border border-orange-100 h-32 rounded-2xl animate-pulse" />
        <div className="bg-orange-50/60 border border-orange-100 h-48 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="text-center py-16 space-y-3 bg-white rounded-3xl border border-orange-100 max-w-xl mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
          <Utensils className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Stall Not Found</h2>
        <p className="text-xs text-slate-500">The street food place you are looking for does not exist.</p>
        <a href="/" className="inline-block text-xs font-bold text-orange-600 hover:underline pt-2">
          ← Return to Food Discovery
        </a>
      </div>
    );
  }

  const googleNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  const hasReviews = place.review_count && place.review_count > 0;
  const reviews: any[] = (place as any).reviews || [];
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  // Star distribution breakdown
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => Math.round(r.rating) === s).length,
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">

      {/* ── HEADER CARD ── */}
      <div className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              {place.is_verified ? (
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Vendor Verified
                </span>
              ) : (
                <span className="bg-orange-50 text-orange-800 border border-orange-200/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Community Submitted
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">{place.name}</h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
              <span className="font-medium text-slate-700">{place.address || place.locality}</span>
              {place.landmark && <span className="text-slate-400">• Near {place.landmark}</span>}
            </div>
          </div>

          {/* Rating Badge */}
          <div className="bg-orange-50/80 border border-orange-200 text-orange-950 p-4 rounded-2xl text-center shrink-0 min-w-[120px]">
            {hasReviews ? (
              <>
                <div className="flex items-center justify-center gap-1 font-black text-3xl text-slate-900">
                  <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                  <span>{(place.rating_avg ?? 0).toFixed(1)}</span>
                </div>
                <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                  {place.review_count} review{place.review_count !== 1 ? 's' : ''}
                </div>
              </>
            ) : (
              <>
                <div className="font-extrabold text-sm text-slate-800">New Stall</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">0 reviews yet</div>
              </>
            )}
          </div>
        </div>

        <p className="text-slate-700 text-xs sm:text-sm leading-relaxed bg-orange-50/40 p-4 rounded-2xl border border-orange-100">
          {place.description || 'Authentic community-discovered street food spot.'}
        </p>

        {/* Quick Attributes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl">
            <div className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Price Range
            </div>
            <div className="text-slate-900 font-extrabold text-sm mt-0.5">
              ₹{place.min_price || 40} – ₹{place.max_price || 70}
            </div>
            <div className="text-[10px] text-slate-400">Crowdsourced</div>
          </div>

          <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl">
            <div className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-orange-600" /> Operating Hours
            </div>
            <div className="text-slate-900 font-bold text-xs mt-0.5">
              {((place as any).operating_hours?.length > 0)
                ? `${(place as any).operating_hours[0].open_time} - ${(place as any).operating_hours[0].close_time}`
                : '4:30 PM – 10:30 PM'}
            </div>
            <div className="text-[10px] text-slate-400">Evening street hours</div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-gradient-to-r from-orange-500 to-amber-500 p-3.5 rounded-2xl flex items-center justify-between text-white shadow-sm">
            <div>
              <div className="font-extrabold text-xs">Get Directions</div>
              <div className="text-[10px] opacity-90">Open in Google Maps</div>
            </div>
            <a
              href={googleNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-orange-600 p-2 rounded-xl font-bold text-xs hover:bg-orange-50 transition-colors"
              title="Navigate with Google Maps"
            >
              <Navigation className="w-4 h-4 fill-orange-600" />
            </a>
          </div>
        </div>
      </div>

      {/* ── FOOD MENU ── */}
      <div className="bg-white border border-orange-100 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <Utensils className="w-4 h-4 text-orange-600" />
          Dishes Served & Prices
        </h3>
        {((place as any).food_items || []).length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No menu items listed yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {((place as any).food_items || []).map((food: any) => (
              <div
                key={food.id}
                className="bg-orange-50/40 border border-orange-100 p-4 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <div className="font-extrabold text-slate-800 text-sm">{food.food_name}</div>
                  <div className="text-xs text-orange-700 font-bold mt-0.5">₹{food.approx_price || '—'}</div>
                </div>
                {food.review_count > 0 && (
                  <div className="flex items-center gap-1 bg-white border border-orange-200/60 text-slate-800 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{(food.rating_avg || 0).toFixed(1)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ASPECT SENTIMENT ── */}
      <AspectSentiment aspects={(place as any).aspect_sentiment || []} />

      {/* ── LOCATION MAP ── */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-600" />
          Location & Surroundings
        </h3>
        <MapView places={[place]} centerLat={place.latitude} centerLng={place.longitude} zoom={15} />
      </div>

      {/* ── REVIEWS & COMMUNITY COMMENTS ── */}
      <div className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden">

        {/* Section Header */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50/60 border-b border-orange-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Community Reviews & Comments
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {reviews.length === 0
                  ? 'Be the first to share your experience!'
                  : `${reviews.length} customer review${reviews.length !== 1 ? 's' : ''} from the community`}
              </p>
            </div>
          </div>

          {hasReviews && (
            <div className="flex items-center gap-1.5 bg-orange-100/60 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-800">
              <Users className="w-3.5 h-3.5" />
              {reviews.length} Reviews
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">

          {/* Rating Breakdown (only if there are reviews) */}
          {hasReviews && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center shrink-0">
                  <div className="text-5xl font-black text-slate-900">{(place.rating_avg ?? 0).toFixed(1)}</div>
                  <div className="flex justify-center mt-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= Math.round(place.rating_avg ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{reviews.length} ratings</div>
                </div>
                <div className="flex-1 space-y-1">
                  {starCounts.map(({ star, count }) => (
                    <StarBar key={star} rating={star} count={count} total={reviews.length} />
                  ))}
                </div>
              </div>
              <div className="bg-orange-50/40 border border-orange-100 rounded-2xl p-4 text-xs space-y-2">
                <div className="font-bold text-slate-700">What people say</div>
                {starCounts[0].count > 0 && (
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{starCounts[0].count} customers rated this 5 stars</span>
                  </div>
                )}
                <div className="text-slate-500">
                  Average price paid: ₹{
                    reviews.filter(r => r.price_paid).length > 0
                      ? Math.round(reviews.filter(r => r.price_paid).reduce((s: number, r: any) => s + r.price_paid, 0) / reviews.filter(r => r.price_paid).length)
                      : (place.min_price || 60)
                  }
                </div>
              </div>
            </div>
          )}

          {/* Review Cards */}
          {reviews.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="text-4xl">💬</div>
              <div className="font-extrabold text-slate-700 text-sm">No reviews yet</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Tried food from this stall? Be the first community member to share your experience below!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleReviews.map((rev: any) => {
                const initials = (rev.user_name || 'Community Foodie')
                  .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <div
                    key={rev.id}
                    className="bg-orange-50/30 border border-orange-100 rounded-2xl p-4 space-y-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <span className="font-extrabold text-slate-800">
                              {rev.user_name || 'Community Foodie'}
                            </span>
                            {rev.food_name && (
                              <span className="text-orange-600 font-semibold text-[11px] ml-2">
                                tried {rev.food_name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
                            {[1,2,3,4,5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                              />
                            ))}
                            <span className="ml-1 text-slate-700 font-bold">{rev.rating}.0</span>
                          </div>
                        </div>

                        <p className="text-slate-700 leading-relaxed mt-1.5">{rev.review_text}</p>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2 pt-2 border-t border-orange-100/80">
                          <span>Visited: {rev.visit_date || 'Recently'}</span>
                          {rev.price_paid && (
                            <span className="font-semibold text-slate-600 flex items-center gap-0.5">
                              <IndianRupee className="w-2.5 h-2.5" /> Paid ₹{rev.price_paid}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {reviews.length > 3 && (
                <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="w-full text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center justify-center gap-1.5 py-2 border border-orange-100 rounded-2xl hover:bg-orange-50 transition-colors"
                >
                  {showAllReviews ? (
                    <><ChevronUp className="w-4 h-4" /> Show fewer reviews</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Show all {reviews.length} reviews</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-orange-100 pt-4">
            <div className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Write a Review for {place.name}
            </div>
            <ReviewForm
              placeId={place.id}
              foodItems={(place as any).food_items}
              onReviewSubmitted={fetchPlaceDetails}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
