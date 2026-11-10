'use client';

import { useState, useEffect } from 'react';
import { Store, Star, ThumbsUp, AlertTriangle, MessageSquare, ShieldCheck, IndianRupee } from 'lucide-react';

export default function VendorDashboardPage() {
  const [vendorData, setVendorData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadVendorData() {
      try {
        const res = await fetch('/api/vendor/dashboard?placeId=place-1');
        const data = await res.json();
        setVendorData(data.vendor);
      } catch (err) {
        console.error('Vendor dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadVendorData();
  }, []);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        Loading Vendor Portal...
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="text-center py-12 text-xs text-slate-400">
        No vendor stall claimed yet.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 rounded-3xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Claimed & Verified Vendor Portal
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-100">{vendorData.stall_name}</h1>
        <p className="text-xs text-slate-400">{vendorData.address}</p>
      </div>

      {/* Vendor Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Stall Rating</div>
          <div className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>{vendorData.rating_avg}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Total Customer Reviews</div>
          <div className="text-2xl font-black text-slate-100 mt-1">{vendorData.total_reviews}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl col-span-2 sm:col-span-1">
          <div className="text-slate-400">Community Price Range</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{vendorData.price_range}</div>
        </div>
      </div>

      {/* Customer Insights: What customers love vs Areas to improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customers Love */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 text-emerald-400">
            <ThumbsUp className="w-4 h-4" />
            What Customers Love (Positive Aspects)
          </h3>

          <div className="space-y-2">
            {vendorData.positive_aspects.map((item: any) => (
              <div key={item.aspect} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between text-xs">
                <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">{item.aspect}</span>
                <span className="text-emerald-400 font-bold">{item.count} positive mention{item.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Areas to Improve */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            Customer Improvement Feedback
          </h3>

          <div className="space-y-2">
            {vendorData.areas_to_improve.map((item: any) => (
              <div key={item.aspect} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between text-xs">
                <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">{item.aspect}</span>
                <span className="text-rose-400 font-bold">{item.count} complaint{item.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Reviews Response Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            Customer Reviews & Vendor Response
          </h3>
          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
            Note: Vendors cannot delete legitimate customer reviews.
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {vendorData.recent_reviews.map((rev: any) => (
            <div key={rev.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between font-bold text-slate-200">
                <span>{rev.user_name}</span>
                <span className="text-amber-400">★ {rev.rating}.0</span>
              </div>
              <p className="text-slate-300">{rev.review_text}</p>
              <div className="pt-2 border-t border-slate-900 flex justify-end">
                <button
                  onClick={() => alert('Vendor official response submitted for review ' + rev.id)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg font-bold text-[11px]"
                >
                  Respond to Customer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
