'use client';

import { useState } from 'react';
import { Star, Send, IndianRupee } from 'lucide-react';
import { PlaceFoodItem } from '../types';

interface ReviewFormProps {
  placeId: string;
  foodItems?: PlaceFoodItem[];
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ placeId, foodItems = [], onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [selectedFoodId, setSelectedFoodId] = useState<string>(foodItems[0]?.food_item_id || '');
  const [reviewText, setReviewText] = useState('');
  const [pricePaid, setPricePaid] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId,
          foodItemId: selectedFoodId || null,
          rating,
          reviewText,
          pricePaid: pricePaid ? parseFloat(pricePaid) : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Review posted and mined into sentiment aspects!');
        setReviewText('');
        setPricePaid('');
        if (onReviewSubmitted) onReviewSubmitted();
      } else {
        alert(data.error || 'Failed to post review');
      }
    } catch (err: any) {
      alert('Error submitting review: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-orange-100 rounded-3xl p-6 space-y-4 shadow-sm">
      <h3 className="font-extrabold text-slate-900 text-base">Write a Customer Review</h3>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Rating Stars Selection */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">Your Rating</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
            <span className="text-orange-600 font-extrabold text-sm ml-2">{rating}.0 / 5.0</span>
          </div>
        </div>

        {/* Food Item Selection */}
        {foodItems.length > 0 && (
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Which food dish did you try?</label>
            <select
              value={selectedFoodId}
              onChange={(e) => setSelectedFoodId(e.target.value)}
              className="w-full bg-orange-50/40 text-slate-800 border border-orange-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-orange-500 font-medium"
            >
              <option value="">General Stall Experience</option>
              {foodItems.map((f) => (
                <option key={f.id} value={f.food_item_id}>
                  {f.food_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price Paid Observation */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">Price Paid (₹)</label>
          <div className="relative flex items-center">
            <IndianRupee className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="number"
              placeholder="e.g. 60"
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
              className="w-full bg-orange-50/40 text-slate-800 pl-9 pr-3 py-2.5 border border-orange-100 rounded-xl focus:outline-none focus:border-orange-500 placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5">Your Detailed Experience</label>
          <textarea
            rows={3}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share details on taste, price, portion size, cleanliness, or queue waiting time..."
            className="w-full bg-orange-50/40 text-slate-800 p-3 border border-orange-100 rounded-xl focus:outline-none focus:border-orange-500 placeholder-slate-400 font-medium"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all active:scale-[0.98]"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Posting Review...' : 'Post Community Review'}</span>
        </button>
      </form>
    </div>
  );
}
