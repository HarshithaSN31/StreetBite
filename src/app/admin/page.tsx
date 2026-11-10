import Link from 'next/link';
import {
  Database,
  BrainCircuit,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import db from '../../db';

export const dynamic = 'force-dynamic';

export default function AdminOverviewPage() {
  const totalPlaces = (db.prepare(`SELECT COUNT(*) as c FROM places`).get() as any)?.c || 0;
  const totalReviews = (db.prepare(`SELECT COUNT(*) as c FROM reviews`).get() as any)?.c || 0;
  const totalDuplicates = (db.prepare(`SELECT COUNT(*) as c FROM duplicate_candidates`).get() as any)?.c || 0;
  const totalWrangled = (db.prepare(`SELECT COUNT(*) as c FROM transformation_audit`).get() as any)?.c || 0;
  const totalFssai = (db.prepare(`SELECT COUNT(*) as c FROM fssai_verifications WHERE verification_status = 'VERIFIED_FSSAI'`).get() as any)?.c || 0;

  const recentAudits = db.prepare(`
    SELECT * FROM transformation_audit
    ORDER BY created_at DESC
    LIMIT 5
  `).all() as any[];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/40 border border-slate-800 p-6 rounded-3xl space-y-2">
        <div className="text-orange-400 font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> StreetBite Administration Console
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">System & Data Governance Overview</h1>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Monitor incoming community submissions, 7-signal duplicate interceptions, real-time data wrangling operations, and machine learning models.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Total Active Places</div>
          <div className="text-2xl font-black text-white mt-1">{totalPlaces}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Database records</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Total Customer Reviews</div>
          <div className="text-2xl font-black text-white mt-1">{totalReviews}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">ABSA mined reviews</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Wrangling Operations</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{totalWrangled}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Logged in audit trail</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">Duplicates Flagged</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{totalDuplicates}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">7-Signal candidate matches</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-slate-400">FSSAI Verified</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{totalFssai}</div>
          <div className="text-[10px] text-blue-500/80 mt-0.5">Hygiene verified stalls</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/data-quality"
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-orange-500/40 p-5 rounded-2xl transition-all space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm group-hover:text-orange-400 transition-colors">
            Data Quality & Wrangling
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inspect column completeness, provenance logs, outlier rejection, and duplicate candidate decisions.
          </p>
        </Link>

        <Link
          href="/admin/data-mining-project"
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-orange-500/40 p-5 rounded-2xl transition-all space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm group-hover:text-orange-400 transition-colors">
            ML & Pattern Mining
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            DBSCAN spatial clustering, Apriori association rules, OLS rating regressor, and price intelligence.
          </p>
        </Link>

        <Link
          href="/admin/academic-viva"
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-orange-500/40 p-5 rounded-2xl transition-all space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm group-hover:text-orange-400 transition-colors">
            Academic Pipeline & Viva
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Theoretical mathematical formulations, 6-stage pipeline diagrams, and examiner defense Q&A.
          </p>
        </Link>
      </div>

      {/* Recent Transformation Audit Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            Recent Data Wrangling Audit Trail
          </h3>
          <Link href="/admin/data-quality" className="text-xs text-orange-400 hover:underline">
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Raw Input</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Rule</th>
                <th className="p-3">Cleaned Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentAudits.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/50">
                  <td className="p-3 font-mono text-rose-300 bg-rose-950/20 rounded-lg max-w-[200px] truncate">
                    "{log.raw_input}"
                  </td>
                  <td className="p-3 font-mono text-[10px] text-slate-400">{log.entity_type}</td>
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
    </div>
  );
}
