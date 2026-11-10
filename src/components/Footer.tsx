'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Utensils, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-white border-t border-orange-100 text-slate-500 text-xs py-10 px-4 mt-16">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white">
              <Utensils className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">StreetBite</span>
          </div>
          <p className="text-slate-500 text-xs max-w-sm">
            Community-powered discovery platform for roadside vendors, chat stalls, and hidden local street food across Karnataka.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-slate-600 font-medium">
          <Link href="/" className="hover:text-orange-600 transition-colors">
            Home
          </Link>
          <Link href="/search" className="hover:text-orange-600 transition-colors">
            Explore Dishes
          </Link>
          <Link href="/place/add" className="hover:text-orange-600 transition-colors">
            + Add Street Stall
          </Link>
          <Link href="/admin" className="hover:text-orange-600 font-semibold flex items-center gap-1 transition-colors text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-500" /> Admin Portal
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-8 pt-4 border-t border-slate-100 text-slate-400 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 StreetBite. Authentic community street food data.</span>
        <span className="flex items-center gap-1">
          Made with <Heart className="w-3 h-3 text-orange-500 fill-orange-500 inline" /> for street food lovers
        </span>
      </div>
    </footer>
  );
}
