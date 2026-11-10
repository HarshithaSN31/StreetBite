'use client';

import { BarChart3, PieChart, TrendingUp, Sparkles, ThumbsUp, ThumbsDown, Search, MapPin } from 'lucide-react';

export default function AnalyticsDashboardPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-slate-800 p-6 rounded-3xl space-y-2">
        <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <BarChart3 className="w-4 h-4" /> Academic Analytics
        </div>
        <h1 className="text-2xl font-extrabold text-slate-100">Data Mining Analytics Dashboard</h1>
        <p className="text-xs text-slate-400">
          Aspect sentiment metrics, geospatial density, and crowdsourced search query trends.
        </p>
      </div>

      {/* Dataset Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Total Food Stalls</div>
          <div className="text-2xl font-black text-slate-100 mt-1">4</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Total Reviews Mined</div>
          <div className="text-2xl font-black text-amber-400 mt-1">5</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Total Unique Foods</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">10</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Active Contributors</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">4</div>
        </div>
      </div>

      {/* Review Mining Sentiment Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-500" />
            Overall Review Sentiment Breakdown
          </h3>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ThumbsUp className="w-3.5 h-3.5" /> Positive Sentiment
                </span>
                <span>80%</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[80%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span className="flex items-center gap-1 text-rose-400">
                  <ThumbsDown className="w-3.5 h-3.5" /> Negative Sentiment
                </span>
                <span>20%</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full w-[20%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Positive vs Top Negative Aspects */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Top Mined Aspect Themes
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 space-y-1">
              <div className="font-bold text-emerald-400">Top Positive Aspects</div>
              <ul className="text-slate-300 space-y-1 text-[11px] pt-1">
                <li>• Taste & Flavor (95%)</li>
                <li>• Pocket Friendly (90%)</li>
                <li>• Live Freshness (88%)</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-rose-500/30 space-y-1">
              <div className="font-bold text-rose-400">Top Complaints</div>
              <ul className="text-slate-300 space-y-1 text-[11px] pt-1">
                <li>• Waiting Time / Queue (88%)</li>
                <li>• Crowded Area (60%)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Geospatial Stall Density */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-500" />
          Geospatial Stall Density Clusters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="font-bold text-amber-400">HSR Layout</div>
            <div className="text-slate-300 text-sm font-extrabold mt-1">2 Stalls</div>
            <div className="text-[10px] text-slate-500">Chats & Indo-Chinese</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="font-bold text-amber-400">Indiranagar</div>
            <div className="text-slate-300 text-sm font-extrabold mt-1">1 Stall</div>
            <div className="text-[10px] text-slate-500">Gobi Manchurian Special</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="font-bold text-amber-400">Koramangala</div>
            <div className="text-slate-300 text-sm font-extrabold mt-1">1 Stall</div>
            <div className="text-[10px] text-slate-500">Midnight Maggi & Rolls</div>
          </div>
        </div>
      </div>
    </div>
  );
}
