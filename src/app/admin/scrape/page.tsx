'use client';

import { useState, useEffect } from 'react';
import {
  Download, MapPin, Utensils, RefreshCw, CheckCircle2,
  AlertCircle, Loader2, Database, Globe, BarChart3, Clock,
} from 'lucide-react';

interface ScrapeResult {
  success: boolean;
  source: string;
  region: string;
  timestamp: string;
  elapsed_seconds: string;
  stats: {
    raw_elements: number;
    named_elements: number;
    inserted: number;
    skipped: number;
    categories: Record<string, number>;
  };
  inserted: Array<{ id: string; name: string; locality: string; category: string; lat: number; lng: number; foods: string[]; opening: string }>;
  sample_skipped: string[];
  error?: string;
}

interface DbStats {
  total: number;
  osm_imported: number;
  manually_added: number;
  recent_imports: Array<{ name: string; locality: string; created_at: string }>;
}

const CAT_COLORS: Record<string, string> = {
  'Chaat & Street Food':  'bg-orange-100 text-orange-800 border-orange-200',
  'Beverages & Desserts': 'bg-blue-100 text-blue-800 border-blue-200',
  'South Indian':         'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Indo-Chinese':         'bg-red-100 text-red-800 border-red-200',
  'Street Food':          'bg-amber-100 text-amber-800 border-amber-200',
};

export default function ScrapeOsmPage() {
  const [isScraping, setIsScraping]   = useState(false);
  const [result, setResult]           = useState<ScrapeResult | null>(null);
  const [dbStats, setDbStats]         = useState<DbStats | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [elapsed, setElapsed]         = useState(0);
  const [timer, setTimer]             = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/scrape-osm');
      const data = await res.json();
      setDbStats(data);
    } catch (e) {}
  }

  async function runScrape() {
    setIsScraping(true);
    setResult(null);
    setError(null);
    setElapsed(0);

    // Start elapsed timer
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    setTimer(t);

    try {
      const res  = await fetch('/api/admin/scrape-osm', { method: 'POST' });
      const data = await res.json();
      clearInterval(t);
      setTimer(null);

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        await fetchStats(); // Refresh DB stats
      }
    } catch (err: any) {
      clearInterval(t);
      setTimer(null);
      setError('Network error: ' + err.message);
    } finally {
      setIsScraping(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">

      {/* ── Page header ── */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
            <Globe className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-100">Real-World Data Scraper</h1>
            <p className="text-xs text-slate-400">OpenStreetMap Overpass API — Bengaluru Food Places</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3.5 mt-3 text-xs text-slate-300 space-y-1">
          <div className="font-bold text-slate-100 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Data Source Information
          </div>
          <p>
            This scraper uses the <strong className="text-orange-400">OpenStreetMap Overpass API</strong> — a free, legal,
            community-maintained geographic database covering all of Bengaluru. It contains real restaurants,
            chaat shops, beverage stalls, cafes, and street food joints contributed by the OSM community.
          </p>
          <p className="text-slate-400">
            Note: Google Maps ToS prohibits scraping. OSM Overpass API is the legitimate free alternative used
            by researchers and developers worldwide under the ODbL licence.
          </p>
        </div>
      </div>

      {/* ── Current DB stats ── */}
      {dbStats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Places in DB', value: dbStats.total,          icon: Database, color: 'text-slate-300' },
            { label: 'OSM Imported',       value: dbStats.osm_imported,   icon: Globe,    color: 'text-orange-400' },
            { label: 'Community Added',    value: dbStats.manually_added, icon: Utensils, color: 'text-emerald-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Scrape control ── */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <Download className="w-5 h-5 text-orange-400" /> Scrape Bengaluru Food Places
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
          {[
            ['Region',   'Bengaluru, Karnataka'],
            ['Bbox',     '12.73°N–13.14°N, 77.38°–77.83°E'],
            ['Amenities','restaurant, fast_food, cafe, snack_bar, food_court, beverages'],
            ['API',      'Overpass API (overpass-api.de)'],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
              <div className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">{k}</div>
              <div className="text-slate-200 font-medium mt-0.5 text-[11px]">{v}</div>
            </div>
          ))}
        </div>

        <button
          onClick={runScrape}
          disabled={isScraping}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 text-white font-black py-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
        >
          {isScraping ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Scraping from Overpass API... {elapsed}s elapsed
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              🗺️ Scrape Bengaluru Food Places Now
            </>
          )}
        </button>

        {isScraping && (
          <div className="bg-slate-900/60 border border-orange-500/30 rounded-xl p-4 text-xs text-slate-300 space-y-1.5 animate-pulse">
            <div className="font-bold text-orange-400">Pipeline running...</div>
            <div>① Sending Overpass QL query to OSM servers (Bengaluru bbox)</div>
            <div>② Receiving GeoJSON nodes & ways with food amenity tags</div>
            <div>③ Classifying by name: Chaat / Beverage / South Indian / Chinese</div>
            <div>④ Deduplication check against existing StreetBite database</div>
            <div>⑤ Wrangling: address normalization, locality extraction, food tagging</div>
            <div>⑥ Inserting into SQLite with provenance &amp; raw ingestion log</div>
          </div>
        )}
      </div>

      {/* ── Error display ── */}
      {error && (
        <div className="bg-rose-900/30 border border-rose-500/40 rounded-2xl p-5 flex items-start gap-3 text-xs text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-extrabold text-rose-300 text-sm mb-1">Scrape Failed</div>
            <p>{error}</p>
            <p className="mt-2 text-rose-400">Check your internet connection. Overpass API sometimes throttles busy requests — try again in 30 seconds.</p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="space-y-5">

          {/* Summary cards */}
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Scrape Completed — {result.elapsed_seconds}s
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: 'Raw OSM elements',  value: result.stats.raw_elements,   color: 'text-slate-300' },
                { label: 'Named places',      value: result.stats.named_elements,  color: 'text-blue-400' },
                { label: '✅ Inserted',        value: result.stats.inserted,        color: 'text-emerald-400' },
                { label: '⏭️ Skipped (dup)',   value: result.stats.skipped,         color: 'text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center">
                  <div className={`text-2xl font-black ${color}`}>{value}</div>
                  <div className="text-slate-400 text-[10px] font-medium mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category breakdown */}
          {Object.keys(result.stats.categories).length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
              <h3 className="font-extrabold text-slate-100 flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-orange-400" /> Category Breakdown
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.stats.categories)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => (
                    <div key={cat} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${CAT_COLORS[cat] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                      <span>{cat}</span>
                      <span className="bg-white/30 px-1.5 py-0.5 rounded-lg font-black">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Inserted places table */}
          {result.inserted.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-100 flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  Newly Imported Places ({result.inserted.length})
                </h3>
                <span className="text-xs text-slate-400">Source: OpenStreetMap</span>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold border-b border-slate-700 sticky top-0">
                    <tr>
                      <th className="text-left p-3">Place Name</th>
                      <th className="text-left p-3">Locality</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-left p-3">Foods Tagged</th>
                      <th className="text-left p-3">Coordinates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {result.inserted.map((place) => (
                      <tr key={place.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-3 font-bold text-slate-100">
                          <a href={`/place/${place.id}`} target="_blank" rel="noopener noreferrer"
                             className="hover:text-orange-400 transition-colors">
                            {place.name}
                          </a>
                        </td>
                        <td className="p-3 text-slate-400">{place.locality}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CAT_COLORS[place.category] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                            {place.category}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{place.foods.join(', ')}</td>
                        <td className="p-3 font-mono text-slate-500 text-[10px]">{place.lat}, {place.lng}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent DB imports */}
          {dbStats?.recent_imports && dbStats.recent_imports.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
              <h3 className="font-extrabold text-slate-100 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-400" /> All OSM Imports in Database
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dbStats.recent_imports.map((r, i) => (
                  <div key={i} className="bg-slate-900/40 border border-slate-700 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-200">{r.name}</div>
                      <div className="text-slate-500">{r.locality}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono text-right">
                      {new Date(r.created_at).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={fetchStats} className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors">
                <RefreshCw className="w-3 h-3" /> Refresh stats
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
