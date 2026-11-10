'use client';

import Link from 'next/link';
import { AlertTriangle, MapPin, ShieldAlert, Star, ArrowRight, Utensils, CheckCircle2, Camera } from 'lucide-react';
import { Place } from '../types';

interface DuplicateModalProps {
  isOpen: boolean;
  decision: 'LOW' | 'MEDIUM' | 'HIGH';
  compositeScore: number;
  locationScore: number;
  nameScore: number;
  foodScore: number;
  addressScore: number;
  ocrScore?: number;
  imageScore?: number;
  evidenceReasons?: string[];
  matchedPlace?: Place;
  photoOcrText?: string;
  onConfirmBypass: (e: any) => void;
  onClose: () => void;
}

function ScoreChip({ label, score, color = 'slate' }: { label: string; score: number; color?: string }) {
  const pct = (score * 100).toFixed(0);
  return (
    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between gap-2 text-[11px]">
      <span className="text-slate-600 font-medium">{label}</span>
      <span className={`font-extrabold ${Number(pct) >= 70 ? 'text-orange-600' : 'text-slate-700'}`}>{pct}%</span>
    </div>
  );
}

export default function DuplicateModal({
  isOpen,
  decision,
  compositeScore,
  locationScore,
  nameScore,
  foodScore,
  addressScore,
  ocrScore = 0,
  imageScore = 0,
  evidenceReasons = [],
  matchedPlace,
  photoOcrText,
  onConfirmBypass,
  onClose,
}: DuplicateModalProps) {
  if (!isOpen || !matchedPlace) return null;

  const matchedFoods = (matchedPlace.food_items || []).map((f) => f.food_name).join(', ');
  const pct = (compositeScore * 100).toFixed(0);
  const isHigh = decision === 'HIGH';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in">

        {/* ── Coloured header stripe ── */}
        <div className={`px-6 py-5 ${isHigh ? 'bg-orange-500' : 'bg-amber-400'} text-white`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold tracking-widest uppercase opacity-80 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Duplicate Detector
              </div>
              <h3 className="text-lg font-black leading-tight">
                This place may already be listed on StreetBite.
              </h3>
            </div>
          </div>

          {/* Similarity score pill */}
          <div className="mt-4 flex items-center gap-2">
            <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
              Similarity Score: <span className="text-white font-black">{pct}%</span>
            </div>
            <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-bold capitalize">
              {decision} confidence match
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">

          <p className="text-xs text-slate-600 leading-relaxed">
            StreetBite evaluated location proximity, name similarity, food items, address, and signboard OCR to detect an existing listing with a{' '}
            <strong className="text-orange-600">{pct}%</strong> similarity score.
          </p>

          {/* ── Existing Place Preview ── */}
          <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{matchedPlace.name}</h4>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{matchedPlace.address || matchedPlace.locality}</span>
                  {matchedPlace.distance_meters !== undefined && (
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-orange-200">
                      {Math.round(matchedPlace.distance_meters)}m away
                    </span>
                  )}
                </div>
              </div>
              {(matchedPlace.rating_avg || 0) > 0 && (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-900 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {(matchedPlace.rating_avg || 0).toFixed(1)}
                  <span className="text-slate-400 font-normal">({matchedPlace.review_count || 0})</span>
                </div>
              )}
            </div>
            {matchedFoods && (
              <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-orange-100">
                <Utensils className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">Foods: {matchedFoods}</span>
              </div>
            )}
          </div>

          {/* ── Evidence Reasons ── */}
          {evidenceReasons.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <h5 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Supporting Evidence
              </h5>
              <div className="space-y-1 text-xs text-emerald-900">
                {evidenceReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-emerald-600">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── OCR Evidence ── */}
          {photoOcrText && (
            <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl text-xs space-y-1.5">
              <div className="font-extrabold text-indigo-800 flex items-center gap-1.5 text-[11px]">
                <Camera className="w-3.5 h-3.5 text-indigo-600" /> Signboard OCR Evidence
              </div>
              <div className="font-mono text-slate-800 text-[11px] bg-white p-2 rounded-lg truncate border border-indigo-100">
                "{photoOcrText}"
              </div>
            </div>
          )}

          {/* ── Signal Scores Grid ── */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Signal Similarity Breakdown
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <ScoreChip label="📍 Geo Distance"    score={locationScore} />
              <ScoreChip label="🏷️ Name Similarity"  score={nameScore} />
              <ScoreChip label="🍢 Food Overlap"     score={foodScore} />
              <ScoreChip label="🏠 Address Match"    score={addressScore} />
              {ocrScore > 0 && <ScoreChip label="📷 Signboard OCR" score={ocrScore} color="indigo" />}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col gap-2.5 pt-1 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href={`/place/${matchedPlace.id}`}
                className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                View Existing Listing <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/place/${matchedPlace.id}?action=review`}
                className="bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                Add My Review Instead
              </Link>
            </div>
            <button
              onClick={onConfirmBypass}
              className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
            >
              This is a Different Place — Submit Separately
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
