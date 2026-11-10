import { ThumbsUp, ThumbsDown, Sparkles, MessageCircle } from 'lucide-react';
import { AspectSentimentAggregate } from '../types';

interface AspectSentimentProps {
  aspects: AspectSentimentAggregate[];
}

const ASPECT_LABELS: Record<string, string> = {
  taste: 'Taste & Flavor',
  price: 'Price & Value',
  quantity: 'Quantity & Portion',
  cleanliness: 'Hygiene & Cleanliness',
  waiting_time: 'Queue & Waiting Time',
  service: 'Vendor Hospitality',
  freshness: 'Freshness & Oil Quality',
  spiciness: 'Spice Level',
};

export default function AspectSentiment({ aspects }: AspectSentimentProps) {
  if (!aspects || aspects.length === 0) {
    return (
      <div className="bg-orange-50/50 border border-orange-200/60 rounded-2xl p-6 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
          <MessageCircle className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-slate-800 text-sm">No Customer Reviews Yet</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Aspect-based feedback (Taste, Hygiene, Price, Portions) will appear here once community members share their experience.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-orange-100 rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Customer Sentiment Breakdown
          </h3>
          <p className="text-xs text-slate-500">Mined directly from actual customer reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {aspects.map((item) => {
          const label = ASPECT_LABELS[item.aspect] || item.aspect;
          const isPos = item.overall === 'Mostly Positive';
          const isNeg = item.overall === 'Mostly Negative';

          return (
            <div
              key={item.aspect}
              className="bg-orange-50/40 border border-orange-100 rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{label}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    isPos
                      ? 'bg-emerald-100 text-emerald-800'
                      : isNeg
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.overall}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${item.positive_pct}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all"
                  style={{ width: `${item.negative_pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ThumbsUp className="w-3 h-3 text-emerald-600" /> {item.positive_pct}% Positive
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-semibold">
                  <ThumbsDown className="w-3 h-3 text-rose-600" /> {item.negative_pct}% Complaints
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
