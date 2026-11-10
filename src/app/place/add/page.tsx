'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MapView from '../../../components/MapView';
import DuplicateModal from '../../../components/DuplicateModal';
import { PlusCircle, Star, Camera, Upload, CheckCircle2, AlertCircle, IndianRupee, Trash2, Lightbulb } from 'lucide-react';
import { extractSignboardText, validateStallImage } from '../../../lib/ocr';

// --- Smart suggestion sets by food category ---
const FOOD_SUGGESTIONS: Record<string, string[]> = {
  'Chaat & Street': [
    'Pani Puri', 'Masala Puri', 'Bhel Puri', 'Dahi Puri', 'Sev Puri',
    'Aloo Tikki', 'Ragda Pattis', 'Papdi Chaat', 'Corn Chaat',
    'Gobi Manchurian', 'Veg Manchurian', 'Chilli Paneer',
  ],
  'South Indian': [
    'Idli', 'Vada', 'Dosa', 'Masala Dosa', 'Poha', 'Upma', 'Rava Idli', 'Uttapam',
  ],
  'Rolls & Wraps': [
    'Veg Roll', 'Paneer Roll', 'Egg Roll', 'Kothu Parotta', 'Frankie',
  ],
  'Beverages': [
    'Sugarcane Juice', 'Fresh Lime Soda', 'Lassi', 'Chai', 'Cold Coffee', 'Milkshake',
  ],
  'Snacks': [
    'Samosa', 'Kachori', 'Bread Pakoda', 'Mirchi Bajji', 'Corn on Cob', 'Noodles', 'Maggi',
  ],
};

interface FoodEntry {
  name: string;
  price: string;
}

function AddPlaceFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFood = searchParams.get('food') || '';

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('HSR Layout');
  const [landmark, setLandmark] = useState('');
  const [lat, setLat] = useState(12.9116);
  const [lng, setLng] = useState(77.6412);

  // Food items with per-item price
  const [foodItems, setFoodItems] = useState<FoodEntry[]>(
    initialFood ? [{ name: initialFood, price: '' }] : []
  );
  const [foodInput, setFoodInput] = useState('');
  const [foodPriceInput, setFoodPriceInput] = useState('');
  const [activeSuggestionCategory, setActiveSuggestionCategory] = useState('Chaat & Street');

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Image & OCR State
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoOcrText, setPhotoOcrText] = useState<string>('');
  const [isProcessingOcr, setIsProcessingOcr] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Duplicate Modal Interceptor State
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ----- Food Item Helpers -----
  const addFoodItem = (foodName: string, price = '') => {
    const trimmed = foodName.trim();
    if (!trimmed) return;
    if (foodItems.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) return;
    setFoodItems([...foodItems, { name: trimmed, price }]);
    setFoodInput('');
    setFoodPriceInput('');
  };

  const addSuggestion = (foodName: string) => {
    if (foodItems.some((f) => f.name.toLowerCase() === foodName.toLowerCase())) return;
    setFoodItems([...foodItems, { name: foodName, price: '' }]);
  };

  const removeFoodItem = (index: number) => {
    setFoodItems(foodItems.filter((_, i) => i !== index));
  };

  const updateFoodPrice = (index: number, price: string) => {
    const updated = [...foodItems];
    updated[index] = { ...updated[index], price };
    setFoodItems(updated);
  };

  const handlePinSelected = (newLat: number, newLng: number, geoDetails?: { address?: string; locality?: string }) => {
    setLat(Number(newLat.toFixed(5)));
    setLng(Number(newLng.toFixed(5)));
    if (geoDetails) {
      if (geoDetails.locality) setLocality(geoDetails.locality);
      if (geoDetails.address && !address) setAddress(geoDetails.address);
    }
  };

  // Handle Photo File Upload & OCR Text Extraction
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    const validation = validateStallImage(file.size, file.type);
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64Str = evt.target?.result as string;
      setPhotoBase64(base64Str);

      setIsProcessingOcr(true);
      try {
        const ocrResult = await extractSignboardText(base64Str);
        if (ocrResult.success && ocrResult.extractedText) {
          setPhotoOcrText(ocrResult.extractedText);
        }
      } finally {
        setIsProcessingOcr(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent | any, bypassCheck = false) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          address,
          locality,
          landmark,
          latitude: lat,
          longitude: lng,
          foodItems: foodItems.map((f) => f.name),
          foodItemPrices: foodItems.reduce((acc, f) => {
            acc[f.name] = f.price ? Number(f.price) : null;
            return acc;
          }, {} as Record<string, number | null>),
          initialRating: rating,
          initialReviewText: reviewText,
          pricePaid: foodItems[0]?.price ? Number(foodItems[0].price) : 60,
          photoBase64,
          photoOcrText,
          bypassDuplicateCheck: bypassCheck,
        }),
      });

      const data = await res.json();

      if (data.duplicateDetected) {
        setDuplicateData(data);
        setDuplicateModalOpen(true);
      } else if (res.ok) {
        alert('Stall added successfully to StreetBite!');
        router.push(`/place/${data.placeId}`);
      } else {
        alert(data.error || 'Failed to create stall');
      }
    } catch (err: any) {
      alert('Error submitting place: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white border border-orange-100 p-6 rounded-3xl space-y-2 shadow-sm">
        <div className="text-orange-600 font-extrabold text-xs flex items-center gap-1">
          <PlusCircle className="w-4 h-4" /> Community Contribution
        </div>
        <h1 className="text-2xl font-black text-slate-900">Add a New Street Food Place</h1>
        <p className="text-xs text-slate-500">
          Discovered a roadside stall or small chat center? Add it to StreetBite so locals can find it!
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6 text-xs">

        {/* ── SECTION 1: Stall Photo & OCR ── */}
        <div className="bg-white border border-orange-100 p-6 rounded-3xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Camera className="w-4 h-4 text-orange-600" />
            1. Stall & Signboard Photograph (OCR Analysis)
          </h3>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Upload Signboard or Shop Front Photo (Max 5MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-500/10 file:text-orange-600 hover:file:bg-orange-500/20 cursor-pointer"
            />
          </div>

          {imageError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{imageError}</span>
            </div>
          )}

          {isProcessingOcr && (
            <div className="text-orange-600 text-xs flex items-center gap-2 animate-pulse bg-orange-50 p-3 rounded-xl border border-orange-200">
              <Upload className="w-4 h-4 animate-spin" />
              <span>Running OCR Signboard Text Extraction...</span>
            </div>
          )}

          {photoOcrText && (
            <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-indigo-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Signboard OCR Extracted Text
              </div>
              <div className="font-mono text-slate-800 bg-white p-2 rounded-lg text-[11px] border border-indigo-100">
                "{photoOcrText}"
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 2: Basic Info ── */}
        <div className="bg-white border border-orange-100 p-6 rounded-3xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm">2. Basic Stall Information</h3>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Stall / Shop Name *</label>
            <input
              type="text"
              placeholder="e.g. Ravi Chat Centre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-orange-50/40 text-slate-800 p-3 border border-orange-100 rounded-xl focus:border-orange-500 focus:outline-none font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Short Description</label>
            <textarea
              rows={2}
              placeholder="e.g. Famous for crispy Gobi Manchurian and Pani Puri..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-orange-50/40 text-slate-800 p-3 border border-orange-100 rounded-xl focus:border-orange-500 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* ── SECTION 3: Foods Offered WITH per-item price ── */}
        <div className="bg-white border border-orange-100 p-6 rounded-3xl space-y-5 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm">3. Foods Offered & Prices</h3>

          {/* Quick-add suggestion chips */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-slate-600 font-semibold text-[11px]">Quick-add by category:</span>
              {Object.keys(FOOD_SUGGESTIONS).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveSuggestionCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    activeSuggestionCategory === cat
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Suggestion chips for selected category */}
            <div className="flex flex-wrap gap-2">
              {FOOD_SUGGESTIONS[activeSuggestionCategory].map((food) => {
                const isAdded = foodItems.some((f) => f.name.toLowerCase() === food.toLowerCase());
                return (
                  <button
                    key={food}
                    type="button"
                    onClick={() => addSuggestion(food)}
                    disabled={isAdded}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                      isAdded
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800'
                    }`}
                  >
                    {isAdded ? '✓ ' : '+ '}{food}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom item input + price */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Custom dish (e.g. Cheese Bhel...)"
              value={foodInput}
              onChange={(e) => setFoodInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFoodItem(foodInput, foodPriceInput))}
              className="flex-1 bg-orange-50/40 text-slate-800 p-3 border border-orange-100 rounded-xl focus:border-orange-500 focus:outline-none font-medium"
            />
            <div className="relative w-28 shrink-0">
              <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                placeholder="Price"
                value={foodPriceInput}
                onChange={(e) => setFoodPriceInput(e.target.value)}
                className="w-full bg-orange-50/40 text-slate-800 pl-8 pr-2 py-3 border border-orange-100 rounded-xl focus:border-orange-500 focus:outline-none font-medium"
              />
            </div>
            <button
              type="button"
              onClick={() => addFoodItem(foodInput, foodPriceInput)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-4 py-3 rounded-xl whitespace-nowrap shadow-sm shadow-orange-500/20 active:scale-95 transition-all"
            >
              + Add
            </button>
          </div>

          {/* Added food items list with price field */}
          {foodItems.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Added Items ({foodItems.length}) — Set price for each:
              </div>
              {foodItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-orange-50/60 border border-orange-100 rounded-xl p-2.5"
                >
                  <span className="flex-1 text-slate-800 font-semibold text-xs">{item.name}</span>
                  <div className="relative w-28 shrink-0">
                    <IndianRupee className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      placeholder="₹ price"
                      value={item.price}
                      onChange={(e) => updateFoodPrice(idx, e.target.value)}
                      className="w-full bg-white text-slate-800 pl-7 pr-2 py-1.5 border border-orange-200 rounded-lg focus:border-orange-500 focus:outline-none text-xs font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFoodItem(idx)}
                    className="text-rose-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {foodItems.length === 0 && (
            <div className="text-center text-slate-400 text-xs py-3 border border-dashed border-slate-200 rounded-2xl">
              Click suggestions above or type a custom dish to add menu items
            </div>
          )}
        </div>

        {/* ── SECTION 4: Location ── */}
        <div className="bg-white border border-orange-100 p-6 rounded-3xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm">4. Precise Location & Geocoding</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Locality / Area *</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. HSR Layout, Koramangala"
                className="w-full bg-orange-50/40 text-slate-800 p-3 border border-orange-100 rounded-xl focus:border-orange-500 focus:outline-none font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Landmark</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opposite NIFT College"
                className="w-full bg-orange-50/40 text-slate-800 p-3 border border-orange-100 rounded-xl focus:border-orange-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 27th Main Road, Sector 1"
              className="w-full bg-orange-50/40 text-slate-800 p-3 border border-orange-100 rounded-xl focus:border-orange-500 focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-700 font-bold">Drop Map Pin & GPS Location</label>

            {/* Location permission tip */}
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-2.5 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
              <span>
                <strong>Allow Location Access:</strong> When the browser asks for your location, click &quot;Allow&quot; to automatically pin your GPS position. If blocked, you can still tap anywhere on the map to drop the pin manually.
              </span>
            </div>

            <MapView
              centerLat={lat}
              centerLng={lng}
              zoom={14}
              interactivePinDrop={true}
              showLocationStatus={true}
              onPinSelected={handlePinSelected}
            />
          </div>
        </div>

        {/* ── SECTION 5: Rating & Review ── */}
        <div className="bg-white border border-orange-100 p-6 rounded-3xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm">5. Your Rating & Experience</h3>

          <div>
            <label className="block text-slate-700 font-bold mb-2">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-orange-600 font-extrabold text-sm ml-1">{rating}.0 / 5</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Your Experience / Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Super crispy Gobi Manchurian, spicy flavor, short queue, very clean stall..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full bg-orange-50/40 text-slate-800 p-3 border border-orange-100 rounded-xl focus:border-orange-500 focus:outline-none font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-4 rounded-2xl text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all"
        >
          {isSubmitting ? 'Running Duplicate Check & OCR...' : 'Submit & Check Duplicate Status'}
        </button>
      </form>

      {/* Duplicate Detection Intercept Modal */}
      {duplicateData && (
        <DuplicateModal
          isOpen={duplicateModalOpen}
          decision={duplicateData.decision}
          compositeScore={duplicateData.compositeScore}
          locationScore={duplicateData.duplicateCheckResult?.signals?.location_score || duplicateData.locationScore || 0}
          nameScore={duplicateData.duplicateCheckResult?.signals?.name_score || duplicateData.nameScore || 0}
          foodScore={duplicateData.duplicateCheckResult?.signals?.food_score || duplicateData.foodScore || 0}
          addressScore={duplicateData.duplicateCheckResult?.signals?.address_score || duplicateData.addressScore || 0}
          ocrScore={duplicateData.duplicateCheckResult?.signals?.ocr_score || 0}
          imageScore={duplicateData.duplicateCheckResult?.signals?.image_score || 0}
          evidenceReasons={duplicateData.evidenceReasons || duplicateData.duplicateCheckResult?.evidence_reasons || []}
          photoOcrText={photoOcrText}
          matchedPlace={duplicateData.matchedPlace}
          onConfirmBypass={(e: any) => {
            setDuplicateModalOpen(false);
            handleSubmit(e, true);
          }}
          onClose={() => setDuplicateModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function AddPlacePage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-slate-400 text-xs">Loading form...</div>}>
      <AddPlaceFormContent />
    </Suspense>
  );
}
