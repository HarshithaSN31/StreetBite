/**
 * StreetBite NLP & Text Mining Utilities
 * Includes string normalization, Levenshtein, Jaro-Winkler, Jaccard set matching,
 * and Aspect-Based Sentiment Analysis (ABSA)
 */

// Common food alias & typo mappings
const FOOD_ALIAS_MAP: Record<string, string> = {
  'panipuri': 'Pani Puri',
  'pani poori': 'Pani Puri',
  'golgappa': 'Pani Puri',
  'gol gappa': 'Pani Puri',
  'phuchka': 'Pani Puri',
  'gobi manch': 'Gobi Manchurian',
  'gobi manchurian': 'Gobi Manchurian',
  'gobimanchurian': 'Gobi Manchurian',
  'gobi 65': 'Gobi 65',
  'gobi noodle': 'Gobi Noodles',
  'gobi noodles': 'Gobi Noodles',
  'cheese maggi': 'Cheese Maggi',
  'cheesemaggi': 'Cheese Maggi',
  'masala corn': 'Masala Corn',
  'paneer roll': 'Paneer Roll',
  'bhel puri': 'Bhel Puri',
  'bhelpuri': 'Bhel Puri',
  'sev puri': 'Sev Puri',
  'sevpuri': 'Sev Puri',
  'dosa': 'Dosa',
  'masala dosa': 'Masala Dosa',
  'momos': 'Momos',
  'ice gola': 'Ice Gola',
  'pav bhaji': 'Pav Bhaji',
  'pavbhaji': 'Pav Bhaji',
  'vada pav': 'Vada Pav',
  'vadapav': 'Vada Pav',
};

/**
 * Standardize and clean string (lowercase, strip extra spaces & non-alphanumeric noise)
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve food name aliases and common spelling variations
 */
export function standardizeFoodName(foodName: string): string {
  const norm = normalizeString(foodName);
  if (FOOD_ALIAS_MAP[norm]) {
    return FOOD_ALIAS_MAP[norm];
  }
  // Title case fallback
  return foodName
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Compute Levenshtein Edit Distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = normalizeString(a);
  const s2 = normalizeString(b);
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Normalized Levenshtein similarity ratio between 0.0 and 1.0
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const s1 = normalizeString(a);
  const s2 = normalizeString(b);
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return 1 - dist / maxLen;
}

/**
 * Jaro-Winkler distance calculation for fine string matching
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  const str1 = normalizeString(s1);
  const str2 = normalizeString(s2);

  if (str1 === str2) return 1.0;
  const len1 = str1.length;
  const len2 = str2.length;
  if (len1 === 0 || len2 === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const str1Matches = new Array(len1).fill(false);
  const str2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);
    for (let j = start; j < end; j++) {
      if (str2Matches[j]) continue;
      if (str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  const jaro =
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

  // Winkler prefix scaling
  let prefix = 0;
  const p = 0.1; // scaling factor
  const maxPrefix = Math.min(4, Math.min(len1, len2));
  for (let i = 0; i < maxPrefix; i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  return jaro + prefix * p * (1 - jaro);
}

/**
 * Combined Hybrid String Similarity Score (Jaro-Winkler + Levenshtein)
 */
export function stringSimilarity(a: string, b: string): number {
  const lev = levenshteinSimilarity(a, b);
  const jw = jaroWinklerSimilarity(a, b);
  return 0.4 * lev + 0.6 * jw;
}

/**
 * Set Jaccard Similarity Ratio (e.g. array of foods or tokens)
 */
export function jaccardSimilarity(setA: string[], setB: string[]): number {
  const normA = new Set(setA.map(normalizeString));
  const normB = new Set(setB.map(normalizeString));
  if (normA.size === 0 && normB.size === 0) return 1.0;
  if (normA.size === 0 || normB.size === 0) return 0.0;

  let intersection = 0;
  normA.forEach((item) => {
    if (normB.has(item)) intersection++;
  });

  const union = normA.size + normB.size - intersection;
  return intersection / union;
}

// Aspect keywords lexicon
const ASPECT_LEXICON: Record<string, { pos: string[]; neg: string[] }> = {
  taste: {
    pos: ['crispy', 'spicy', 'yummy', 'delicious', 'tasty', 'flavorful', 'flavourful', 'awesome', 'good taste', 'amazing taste', 'mouthwatering', 'smoky', 'savory', 'authentic'],
    pos_sub: ['crisp', 'taste', 'flavor', 'yum', 'delicious'],
    neg: ['bland', 'tasteless', 'burnt', 'stale', 'salty', 'too spicy', 'soggy', 'bad taste', 'horrible taste', 'raw', 'undercooked'],
    neg_sub: ['bland', 'terrible', 'horrible']
  } as any,
  price: {
    pos: ['cheap', 'pocket friendly', 'pocket-friendly', 'affordable', 'reasonable', 'worth it', 'value for money', 'budget', 'bargain', 'inexpensive'],
    pos_sub: ['cheap', 'worth', 'value', 'budget'],
    neg: ['costly', 'expensive', 'overpriced', 'pricey', 'loot', 'waste of money', 'not worth'],
    neg_sub: ['costly', 'expensive', 'overpriced']
  } as any,
  quantity: {
    pos: ['huge portion', 'good quantity', 'generous', 'filling', 'large portion', 'lots of', 'heavy quantity', 'sufficient'],
    pos_sub: ['filling', 'generous', 'heavy'],
    neg: ['small portion', 'less quantity', 'very small', 'tiny', 'meager', 'insufficient', 'not enough'],
    neg_sub: ['tiny', 'less quantity']
  } as any,
  cleanliness: {
    pos: ['clean', 'hygienic', 'neat', 'tidy', 'gloves', 'sanitized', 'fresh water'],
    pos_sub: ['clean', 'hygiene'],
    neg: ['dirty', 'unhygienic', 'flies', 'flies everywhere', 'dusty', 'filthy', 'garbage', 'smelly', 'messy'],
    neg_sub: ['dirty', 'unhygienic', 'filthy']
  } as any,
  waiting_time: {
    pos: ['fast service', 'quick', 'no rush', 'fast prep', 'immediate', 'prompt'],
    pos_sub: ['quick', 'fast'],
    neg: ['long queue', 'waiting time', 'wait', 'slow prep', 'long wait', 'crowded queue', 'delay', 'took forever'],
    neg_sub: ['queue', 'waiting', 'slow', 'delay']
  } as any,
  service: {
    pos: ['polite', 'friendly', 'welcoming', 'kind vendor', 'good behavior', 'nice uncle'],
    pos_sub: ['friendly', 'polite', 'kind'],
    neg: ['rude', 'arrogant', 'ignored', 'bad behavior', 'harsh'],
    neg_sub: ['rude', 'arrogant']
  } as any,
  freshness: {
    pos: ['fresh', 'hot', 'piping hot', 'freshly made', 'cooked live'],
    pos_sub: ['fresh', 'hot'],
    neg: ['cold', 'reheated', 'old oil', 'rancid', 'stale'],
    neg_sub: ['stale', 'cold', 'old']
  } as any,
  spiciness: {
    pos: ['perfect spice', 'spicy kicked', 'fiery', 'zesty'],
    pos_sub: ['spicy', 'fiery'],
    neg: ['too spicy', 'excessive chili', 'burning', 'stomach ache'],
    neg_sub: ['excessive']
  } as any,
};

// Negation prefixes that flip valence of following adjectives
const NEGATION_PREFIXES = ['not', 'never', 'hardly', 'barely', 'scarcely', 'no', 'isnt', 'wasnt', 'dont', 'wont'];

/**
 * Aspect-Based Sentiment Mining Engine (ABSA) with Bi-Gram Negation Handling
 */
export function analyzeReviewSentiment(reviewText: string): {
  overall_score: number;
  cleaned_text: string;
  aspects: Array<{ aspect: any; sentiment: 'positive' | 'negative' | 'neutral'; confidence: number }>;
} {
  const norm = normalizeString(reviewText);
  const words = norm.split(' ');
  const extractedAspects: Array<{ aspect: any; sentiment: 'positive' | 'negative' | 'neutral'; confidence: number }> = [];

  let totalPosHits = 0;
  let totalNegHits = 0;

  Object.entries(ASPECT_LEXICON).forEach(([aspectKey, lex]) => {
    let aspectPosCount = 0;
    let aspectNegCount = 0;

    lex.pos.forEach((keyword) => {
      if (norm.includes(keyword)) {
        // Check for preceding negation within a 3-word window
        const kwParts = keyword.split(' ');
        const firstKwWord = kwParts[0];
        const wordIdx = words.indexOf(firstKwWord);

        let isNegated = false;
        if (wordIdx > 0) {
          const windowStart = Math.max(0, wordIdx - 3);
          for (let i = windowStart; i < wordIdx; i++) {
            if (NEGATION_PREFIXES.includes(words[i])) {
              isNegated = true;
              break;
            }
          }
        }

        if (isNegated) {
          aspectNegCount++; // "not crispy" flips to negative
        } else {
          aspectPosCount++;
        }
      }
    });

    lex.neg.forEach((keyword) => {
      if (norm.includes(keyword)) {
        const kwParts = keyword.split(' ');
        const firstKwWord = kwParts[0];
        const wordIdx = words.indexOf(firstKwWord);

        let isNegated = false;
        if (wordIdx > 0) {
          const windowStart = Math.max(0, wordIdx - 3);
          for (let i = windowStart; i < wordIdx; i++) {
            if (NEGATION_PREFIXES.includes(words[i])) {
              isNegated = true;
              break;
            }
          }
        }

        if (isNegated) {
          aspectPosCount++; // "not dirty" flips to positive
        } else {
          aspectNegCount++;
        }
      }
    });

    if (aspectPosCount > 0 || aspectNegCount > 0) {
      const sentiment =
        aspectPosCount > aspectNegCount
          ? 'positive'
          : aspectNegCount > aspectPosCount
          ? 'negative'
          : 'neutral';

      const confidence = Math.min(1.0, 0.6 + 0.2 * (aspectPosCount + aspectNegCount));
      extractedAspects.push({
        aspect: aspectKey as any,
        sentiment,
        confidence,
      });

      totalPosHits += aspectPosCount;
      totalNegHits += aspectNegCount;
    }
  });

  // Calculate sentiment score bounded between -1.0 and +1.0
  let score = 0;
  if (totalPosHits + totalNegHits > 0) {
    score = (totalPosHits - totalNegHits) / (totalPosHits + totalNegHits);
  } else {
    score = norm.includes('good') || norm.includes('great') || norm.includes('nice') ? 0.5 : 0.0;
  }

  return {
    overall_score: Number(Math.max(-1.0, Math.min(1.0, score)).toFixed(2)),
    cleaned_text: norm,
    aspects: extractedAspects,
  };
}
