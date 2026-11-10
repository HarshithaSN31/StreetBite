'use client';

import { useState, useEffect } from 'react';
import { Database, ShieldCheck, AlertOctagon, FileText, ArrowRight, Activity, CheckCircle2, XCircle } from 'lucide-react';

export default function DataQualityPage() {
  const [dataStats, setDataStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/data-quality');
        const data = await res.json();
        setDataStats(data);
      } catch (err) {
        console.error('Data quality fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        <Activity className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
        Profiling Database Quality & Ingestion Provenance...
      </div>
    );
  }

  const summary = dataStats?.summary || {};
  const profiling = dataStats?.quality_profiling || {};
  const logs = dataStats?.transformation_logs || [];
  const rawLogs = dataStats?.raw_ingestion_logs || [];
  const duplicates = dataStats?.duplicate_candidates || [];
  const fssai = dataStats?.fssai_breakdown || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-2">
        <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <Database className="w-4 h-4" /> Academic Data Mining Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Data Wrangling, Provenance & Quality Governance Dashboard
        </h1>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Real-time monitoring of raw community submissions, data provenance audit trails, column null-rate distributions, and FSSAI safety verification compliance.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Total Ingested Records</div>
          <div className="text-2xl font-black text-slate-100 mt-1">{summary.total_raw_submissions}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Community & OSM sources</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Cleaned & Transformed</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{summary.cleaned_and_normalized}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Standardized into SQLite</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Wrangling Audit Operations</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{summary.missing_values_handled}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Recorded in SQLite audit trail</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Duplicate Candidates</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{summary.duplicate_candidates_detected}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">7-Signal intercepted</div>
        </div>
      </div>

      {/* Data Quality Profiling & Column Null Rates */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-500" />
          Column-Level Completeness & Missing Value Profiling ({profiling.total_places_audited} Records)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Missing Landmark:</span>
              <span className="font-mono font-bold text-amber-400">{profiling.missing_landmark_pct}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${profiling.missing_landmark_pct}%` }} />
            </div>
            <div className="text-[10px] text-slate-500">Imputed via Reverse Geocoding</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Missing Detailed Address:</span>
              <span className="font-mono font-bold text-emerald-400">{profiling.missing_address_pct}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${profiling.missing_address_pct}%` }} />
            </div>
            <div className="text-[10px] text-slate-500">Sanitized with Locality fallback</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Missing Description:</span>
              <span className="font-mono font-bold text-blue-400">{profiling.missing_description_pct}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${profiling.missing_description_pct}%` }} />
            </div>
            <div className="text-[10px] text-slate-500">Filled via Category default text</div>
          </div>
        </div>
      </div>

      {/* FSSAI Food Safety Verification Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          FSSAI / FoSCoS Food Safety Verification Status
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {fssai.map((item: any) => (
            <div key={item.verification_status} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{item.verification_status}</div>
                <div className="text-lg font-black text-slate-100">{item.count}</div>
              </div>
              {item.verification_status === 'VERIFIED_FSSAI' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-amber-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Traceable Transformation Audit Trail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          Traceable Data Wrangling Audit Trail (`transformation_audit`)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Raw Input String</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Transformation Rule</th>
                <th className="p-3">Cleaned Normalized Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-mono text-rose-300 bg-rose-950/20 rounded-lg max-w-[200px] truncate">
                    "{log.raw_input}"
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] text-slate-400 font-mono">{log.entity_type}</span>
                  </td>
                  <td className="p-3">
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {log.transformation_rule}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span>"{log.cleaned_output}"</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Ingestion Logs (Data Provenance) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          Raw Ingestion Provenance Log (`raw_ingestion_logs`)
        </h3>

        <div className="space-y-2">
          {rawLogs.map((raw: any) => (
            <div key={raw.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-blue-400 font-bold">{raw.source_type}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${raw.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {raw.status}
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-400 bg-slate-900 p-2 rounded-lg truncate">
                {raw.raw_payload}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                <span>Agent: {raw.ip_or_user_agent}</span>
                <span>Timestamp: {raw.ingested_at}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
