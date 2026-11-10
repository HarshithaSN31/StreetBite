'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, PlusCircle, Utensils, Compass, Navigation, Bookmark, User, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  userLocationName?: string;
}

export default function Navbar({ userLocationName = 'HSR Layout, Bengaluru' }: NavbarProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  // If in admin portal, don't show customer navbar
  if (isAdmin) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-orange-100 text-slate-800 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
              StreetBite
            </span>
            <span className="block text-[10px] text-orange-600 font-semibold tracking-wide uppercase">
              Street Food Discovery
            </span>
          </div>
        </Link>

        {/* Center Navigation Links: Home | Explore | Nearby */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link
            href="/"
            className={`transition-colors hover:text-orange-600 ${
              pathname === '/' ? 'text-orange-600 font-bold' : ''
            }`}
          >
            Home
          </Link>
          <Link
            href="/search"
            className={`transition-colors hover:text-orange-600 ${
              pathname === '/search' ? 'text-orange-600 font-bold' : ''
            }`}
          >
            Explore
          </Link>
          <Link
            href="/#nearby-section"
            className="transition-colors hover:text-orange-600"
          >
            Nearby
          </Link>
        </nav>

        {/* Right CTA / Location */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/60 text-xs font-medium text-orange-900">
            <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span className="truncate max-w-[140px]">{userLocationName}</span>
          </div>

          <Link
            href="/place/add"
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-orange-500/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Stall</span>
          </Link>

          <Link
            href="/admin"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Admin Portal"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
