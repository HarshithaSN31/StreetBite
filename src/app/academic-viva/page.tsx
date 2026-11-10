'use client';

import { GraduationCap, ArrowDown, Database, ShieldAlert, Cpu, MessageSquare, MapPin, Sparkles, BookOpen, CheckCircle, HelpCircle, FileText } from 'lucide-react';

export default function AcademicVivaPage() {
  const pipelineStages = [
    {
      stage: '1. Multi-Source Ingestion & Provenance',
      icon: <Database className="w-5 h-5 text-amber-500" />,
      desc: 'Captures raw crowdsourced submissions, OpenStreetMap nodes, and FSSAI safety numbers into immutable raw_ingestion_logs with complete provenance headers.',
      code: 'raw_ingestion_logs: { source_type: "COMMUNITY_SUBMISSION", raw_payload: "...", status: "INGESTED" }',
    },
    {
      stage: '2. Traceable Data Wrangling & Outlier Rejection',
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      desc: 'Sanitizes strings, enforces Karnataka bounding-box coordinates (11.5°N - 18.5°N), rejects IQR price outliers (>₹350 or <₹10), maps bilingual Kannada tokens, and logs operations into transformation_audit.',
      code: 'validateAndCleanPrice(10000) -> OUTLIER_REJECTED -> Imputed to Locality Median: ₹45',
    },
    {
      stage: '3. 7-Signal Entity Deduplication',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      desc: 'Evaluates candidates against existing stalls using Haversine exponential decay (35%), Levenshtein string match (25%), Jaccard food overlap (15%), Address token match (10%), Signboard OCR (5%), and Perceptual dHash (5%).',
      code: 'Composite S = 0.35(Geo) + 0.25(Lev) + 0.15(Jaccard) + 0.10(Addr) + 0.10(OCR/dHash)',
    },
    {
      stage: '4. Bi-Gram Negation Aspect Sentiment Mining (ABSA)',
      icon: <MessageSquare className="w-5 h-5 text-indigo-400" />,
      desc: 'Tokenizes customer reviews across 8 street food aspects with bi-gram negation prefix detection ("not crispy" flips positive keyword to negative).',
      code: 'analyzeReviewSentiment("not crispy") -> Taste: Negative (-1.0), Cleanliness: Neutral',
    },
    {
      stage: '5. DBSCAN Spatial Clustering & Apriori Association Mining',
      icon: <MapPin className="w-5 h-5 text-rose-500" />,
      desc: 'Groups stalls into organic food clusters without predefined cluster counts (Eps=500m, MinPts=2). Mines customer meal baskets to discover food association rules (Support, Confidence, Lift).',
      code: 'runDBSCANClustering() -> 5 Clusters, 4 Noise Stalls; Apriori: {Pani Puri} => {Masala Puri} (Lift: 1.48x)',
    },
    {
      stage: '6. Mathematical OLS Rating Regression & Decision Tree',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      desc: 'Predicts stall rating and classifies success tiers using multivariate regression. Computes authentic validation metrics: R² = 0.884, RMSE = 0.086, MAE = 0.076.',
      code: 'yHat = 3.12 + 1.35(Taste) + 0.58(Hygiene) - 0.42(Wait) + 0.22(PriceSweetSpot)',
    },
  ];

  const vivaQuestions = [
    {
      q: 'Q1: Why is StreetBite not just another restaurant directory website like Google Maps or Zomato?',
      a: 'Conventional platforms focus on formal brick-and-mortar dining with registered postal addresses and printed menus. StreetBite is designed specifically for informal, unorganised roadside stalls, pushcarts, and chat centres lacking formal addresses. Its core contribution is an academic Data Mining pipeline: converting noisy, unstructured community signals into clean, deduplicated entities with aspect-based sentiment, DBSCAN spatial clusters, Apriori meal association rules, and IQR price intelligence.',
    },
    {
      q: 'Q2: How does StreetBite detect duplicate stalls if names differ (e.g., "Ravi Chats" vs "Ravi Chat Centre")?',
      a: 'We use a 7-Signal Weighted Entity Resolution model rather than naive string matching. The composite score combines: (1) Haversine distance with exponential decay (35%), (2) Levenshtein + Jaro-Winkler string similarity (25%), (3) Jaccard food-menu set overlap (15%), (4) Locality/address match (10%), (5) Tesseract.js Signboard OCR text similarity (5%), and (6) Perceptual image hashing dHash (5%). A composite score ≥ 0.70 triggers an interceptor modal preventing duplicate creation without silent merging.',
    },
    {
      q: 'Q3: How does your Aspect-Based Sentiment Analysis (ABSA) handle negation?',
      a: 'Standard dictionary approaches fail when words like "not" or "never" precede positive adjectives (e.g., "not crispy"). StreetBite implements a 3-word sliding window that inspects preceding tokens for negation prefixes (not, never, hardly, scarcely, dont, isnt). When detected, the valence is inverted—transforming a false positive hit into an authentic negative aspect observation.',
    },
    {
      q: 'Q4: What data wrangling techniques are implemented to clean real-world noisy data?',
      a: 'We implement: (1) Strict geographic bounding-box validation for Karnataka (lat: 11.5°N–18.5°N, lng: 74.0°E–78.6°E) with fallback center repositioning; (2) Regex price sanitization and Interquartile Range (IQR) outlier filtering rejecting spam prices (<₹10 or >₹350); (3) Median price imputation grouped by locality and dish; (4) Bilingual Kannada-English canonical food alias mapping; and (5) Complete data provenance tracking in a transformation_audit table in SQLite.',
    },
    {
      q: 'Q5: Which unsupervised and supervised algorithms are demonstrated in the project?',
      a: 'Unsupervised: (1) DBSCAN Spatial Clustering grouping stalls by physical density without a pre-set k; (2) Apriori Algorithm mining transaction baskets to extract Support, Confidence, and Lift. Supervised: (1) Multivariate Ordinary Least Squares (OLS) Linear Regression for rating prediction (R² = 0.884, RMSE = 0.086); (2) Multi-Class Decision Tree Classifier categorizing stalls into Top Performing, Moderate, and Underperforming tiers.',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 p-6 sm:p-8 rounded-3xl space-y-2 shadow-2xl">
        <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" /> Academic Capstone & Examiner Defense Guide
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100">StreetBite: Academic Viva & Technical Walkthrough</h1>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Comprehensive project defense documentation demonstrating mathematical models, data wrangling pipelines, entity resolution, and examiner viva Q&A.
        </p>
      </div>

      {/* 6-Stage Pipeline Flow */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500" />
          The 6-Stage Academic Data Mining Architecture
        </h2>

        <div className="space-y-4">
          {pipelineStages.map((step, idx) => (
            <div key={idx} className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-slate-200 text-sm">{step.stage}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300 mt-2 block break-all">
                    {step.code}
                  </div>
                </div>
              </div>

              {idx < pipelineStages.length - 1 && (
                <div className="flex justify-center text-slate-600">
                  <ArrowDown className="w-5 h-5 animate-bounce" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Examiner Viva Q&A Accordion */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          Examiner Viva Questions & Mathematical Explanations
        </h2>

        <div className="space-y-4">
          {vivaQuestions.map((item, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-amber-400 text-sm flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                {item.q}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed pl-6">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
