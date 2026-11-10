export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'vendor' | 'admin';
  reputation_score: number;
  created_at: string;
}

export interface FoodCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  normalized_name: string;
  category_id: string;
  category_name?: string;
  is_community_added: boolean;
}

export interface PlaceFoodItem {
  id: string;
  place_id: string;
  food_item_id: string;
  food_name: string;
  approx_price: number;
  rating_avg: number;
  review_count: number;
}

export interface OperatingHour {
  id?: string;
  day_of_week?: string;
  open_time: string;
  close_time: string;
}

export interface AspectSentimentAggregate {
  aspect: string;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  total_mentions: number;
  overall: 'Mostly Positive' | 'Mostly Negative' | 'Mixed' | 'Neutral';
}

export interface Place {
  id: string;
  name: string;
  normalized_name: string;
  description: string;
  address: string;
  locality: string;
  landmark: string;
  latitude: number;
  longitude: number;
  is_verified: boolean;
  created_by_user_id: string;
  created_at: string;
  // Computed / aggregated fields
  distance_meters?: number;
  rating_avg?: number;
  review_count?: number;
  min_price?: number;
  max_price?: number;
  last_reported_price?: number;
  opening_time?: string;
  closing_time?: string;
  operating_days?: string;
  photos?: string[];
  food_items?: PlaceFoodItem[];
  categories?: string[];
  ranking_explanation?: string[];
  operating_hours?: OperatingHour[];
  reviews?: Review[];
  aspect_sentiment?: AspectSentimentAggregate[];
}

export interface ReviewAspect {
  id?: string;
  review_id?: string;
  aspect: 'taste' | 'price' | 'quantity' | 'cleanliness' | 'waiting_time' | 'service' | 'freshness' | 'portion_size' | 'spiciness';
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface Review {
  id: string;
  place_id: string;
  user_id: string;
  user_name?: string;
  food_item_id?: string;
  food_name?: string;
  rating: number;
  review_text: string;
  cleaned_text?: string;
  sentiment_score?: number; // -1.0 to 1.0
  price_paid?: number;
  visit_date: string;
  photo_url?: string;
  created_at: string;
  aspects?: ReviewAspect[];
}

export interface DuplicateCandidate {
  id: string;
  existing_place_id: string;
  existing_place?: Place;
  new_place_data: Partial<Place>;
  similarity_score: number;
  location_score: number;
  name_score: number;
  food_score: number;
  address_score: number;
  decision: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'pending' | 'confirmed_duplicate' | 'rejected';
  created_at: string;
}

export interface PriceObservation {
  id: string;
  place_id: string;
  food_item_id?: string;
  food_name?: string;
  reported_price: number;
  reported_at: string;
  user_id: string;
}

export interface DataQualitySummary {
  total_raw_submissions: number;
  valid_records: number;
  invalid_records: number;
  missing_values_handled: number;
  duplicate_candidates_detected: number;
  cleaned_and_normalized: number;
  transformation_logs: Array<{
    raw_input: string;
    cleaned_output: string;
    type: string;
    timestamp: string;
  }>;
}

export interface AnalyticsSummary {
  total_places: number;
  total_reviews: number;
  total_users: number;
  total_foods: number;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  top_positive_aspects: Array<{ aspect: string; count: number }>;
  top_negative_aspects: Array<{ aspect: string; count: number }>;
  popular_searches: Array<{ query: string; count: number }>;
  geospatial_clusters: Array<{ area: string; count: number; lat: number; lng: number }>;
}
