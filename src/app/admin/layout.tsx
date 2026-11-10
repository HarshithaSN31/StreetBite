'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  BrainCircuit,
  BarChart3,
  GraduationCap,
  ArrowLeft,
  Globe,
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin',                  label: 'Overview',                 icon: LayoutDashboard },
  { href: '/admin/scrape',           label: '🗺️ OSM Data Scraper',       icon: Globe },
  { href: '/admin/data-quality',     label: 'Data Quality & Wrangling', icon: Database },
  { href: '/admin/data-mining-project', label: 'ML & Predictive Mining', icon: BrainCircuit },
  { href: '/admin/analytics',        label: 'System Analytics',         icon: BarChart3 },
  { href: '/admin/academic-viva',    label: 'Academic Pipeline & Viva', icon: GraduationCap },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Admin Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-600/30">
                SB
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white">StreetBite</span>
                <span className="block text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                  Admin & Mining Portal
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Data governance, mathematical models & data mining engine.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Back to Customer Site */}
        <div className="pt-6 border-t border-slate-800/80 space-y-2 text-xs">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-orange-400 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Customer Website</span>
          </Link>
          <div className="text-[10px] text-slate-500 px-3">
            Admin session authenticated
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-6xl">
        {children}
      </main>
    </div>
  );
}
