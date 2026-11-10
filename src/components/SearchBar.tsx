'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Sparkles, MapPin, X } from 'lucide-react';

interface SearchBarProps {
  initialQuery?: string;
  onSearchSubmit?: (query: string) => void;
}

export default function SearchBar({ initialQuery = '', onSearchSubmit }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasExactMatch, setHasExactMatch] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced Autocomplete fetch
  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setHasExactMatch(data.hasExactMatch ?? true);
        setIsOpen(true);
      } catch (err) {
        console.error('Autocomplete error:', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (foodName: string) => {
    setQuery(foodName);
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(foodName);
    } else {
      router.push(`/search?q=${encodeURIComponent(foodName)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(query.trim());
    } else {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          placeholder="What are you craving? (e.g. Gobi, Pani Puri, Cheese Maggi...)"
          className="w-full bg-white text-slate-800 placeholder-slate-400 pl-11 pr-24 py-3.5 rounded-2xl border border-white/80 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-lg text-sm transition-all font-medium"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-20 text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all"
        >
          Find
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100 animate-in">
          {suggestions.length > 0 ? (
            <div className="p-2">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-orange-500 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Matching Street Foods
              </div>
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item.name)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-orange-50 flex items-center justify-between group transition-colors"
                >
                  <span className="text-sm text-slate-800 group-hover:text-orange-700 font-semibold">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {!hasExactMatch && query.trim().length > 1 && (
            <div className="p-3 bg-orange-50/60 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-xs text-slate-600">
                No match for <span className="font-semibold text-orange-600">"{query}"</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSubmit}
                  className="text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg flex-1 sm:flex-none text-center font-medium"
                >
                  Search anyway
                </button>
                <button
                  onClick={() => router.push(`/place/add?food=${encodeURIComponent(query.trim())}`)}
                  className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 flex-1 sm:flex-none font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add "{query}"
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
