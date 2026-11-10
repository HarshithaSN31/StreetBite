'use client';

import { useState, useEffect } from 'react';
import { predictStallRating, MLPredictionResult } from '../../lib/ml';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  BrainCircuit,
  Award,
  Sparkles,
  CheckCircle2,
  Sliders,
  DollarSign,
  MapPin,
  Utensils,
  GraduationCap,
  Layers,
  FileText,
  Compass,
  AlertTriangle,
  ShoppingCart,
  Activity,
} from 'lucide-react';

export default function DataMiningProjectPage() {
  // Machine Learning Interactive Form State
  const [approxPrice, setApproxPrice] = useState<number>(60);
  const [locality, setLocality] = useState<string>('HSR Layout');
  const [category, setCategory] = useState<string>('Indo-Chinese');
  const [tastePositivePct, setTastePositivePct] = useState<number>(85);
  const [cleanlinessScore, setCleanlinessScore] = useState<number>(8);
  const [queueWaitMinutes, setQueueWaitMinutes] = useState<number>(10);

  // Run initial prediction
  const [prediction, setPrediction] = useState<MLPredictionResult>(
    predictStallRating({
      approxPrice: 60,
      locality: 'HSR Layout',
      category: 'Indo-Chinese',
      tastePositivePct: 85,
      cleanlinessScore: 8,
      queueWaitMinutes: 10,
    })
  );

  // Dynamic state loaded from real SQLite Mining API
  const [miningData, setMiningData] = useState<any>(null);
  const [isLoadingMining, setIsLoadingMining] = useState<boolean>(true);

  useEffect(() => {
    async function loadMiningInsights() {
      try {
        const res = await fetch('/api/ml/mining-insights');
        const data = await res.json();
        setMiningData(data);
      } catch (e) {
        console.error('Failed to load mining insights:', e);
      } finally {
        setIsLoadingMining(false);
      }
    }
    loadMiningInsights();
  }, []);

  const handlePredict = () => {
    const res = predictStallRating({
      approxPrice,
      locality,
      category,
      tastePositivePct,
      cleanlinessScore,
      queueWaitMinutes,
    });
    setPrediction(res);
  };

  const dbscanClusters = miningData?.dbscan?.clusters || [];
  const noisePoints = miningData?.dbscan?.noisePoints || [];
  const aprioriRules = miningData?.apriori?.rules || [];
  const priceMetrics = miningData?.priceIntelligence?.dishMetrics || [];
  const surgeAlerts = miningData?.priceIntelligence?.surgeAlerts || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/60 border border-amber-500/30 p-6 sm:p-8 rounded-3xl space-y-3 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" /> Academic Data Mining Capstone
          </span>
          <span className="text-slate-400 text-xs">Algorithms: DBSCAN | Apriori | OLS Regression | ABSA</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
          Data Mining, Pattern Discovery & Predictive Analytics Engine
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Demonstrating mathematical machine learning models (OLS Rating Regression & Multi-Class Decision Tree), DBSCAN Spatial Clustering, Apriori Association Rule Mining, and real-time Price Intelligence.
        </p>
      </div>

      {/* SECTION 1: MACHINE LEARNING PREDICTION ENGINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-amber-500" /> Supervised Learning: OLS Regression & Decision Tree
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 mt-1">
              Stall Rating & Success Predictor
            </h2>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            Model: <span className="font-semibold text-emerald-400">Multivariate Ordinary Least Squares (OLS)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Inputs (5 cols) */}
          <div className="lg:col-span-5 space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" /> Adjust Feature Inputs
            </h3>

            {/* Price Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>Approx Dish Price (₹)</span>
                <span className="text-amber-400 font-bold">₹{approxPrice}</span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={approxPrice}
                onChange={(e) => setApproxPrice(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Locality Selector */}
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">Locality</label>
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-amber-500 outline-none"
              >
                <option value="HSR Layout">HSR Layout, Bengaluru</option>
                <option value="Koramangala">Koramangala, Bengaluru</option>
                <option value="Indiranagar">Indiranagar, Bengaluru</option>
                <option value="Jayanagar">Jayanagar, Bengaluru</option>
                <option value="Mysuru">Devaraja Urs Road, Mysuru</option>
                <option value="Mangaluru">Hampankatta, Mangaluru</option>
                <option value="Hubballi">Durgadbail, Hubballi</option>
              </select>
            </div>

            {/* Food Category */}
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">Food Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:border-amber-500 outline-none"
              >
                <option value="Chats">Chats & Pani Puri</option>
                <option value="Indo-Chinese">Indo-Chinese & Gobi</option>
                <option value="Fast Food">Fast Food & Rolls</option>
                <option value="South Indian">South Indian Tiffin</option>
              </select>
            </div>

            {/* Taste Sentiment % Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>Taste Sentiment (%)</span>
                <span className="text-emerald-400 font-bold">{tastePositivePct}% Pos</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={tastePositivePct}
                onChange={(e) => setTastePositivePct(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Cleanliness Score */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>Cleanliness Score (0 - 10)</span>
                <span className="text-indigo-400 font-bold">{cleanlinessScore} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={cleanlinessScore}
                onChange={(e) => setCleanlinessScore(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Queue Wait Time */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                <span>Queue Waiting Time (mins)</span>
                <span className="text-rose-400 font-bold">{queueWaitMinutes} mins</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={queueWaitMinutes}
                onChange={(e) => setQueueWaitMinutes(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handlePredict}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" /> Run ML Prediction Equation
            </button>
          </div>

          {/* Prediction Outputs & Evaluation (7 cols) */}
          <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
            {/* Prediction Output Card */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Predicted Customer Rating</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    prediction.predictedClass === 'Top Performing'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : prediction.predictedClass === 'Moderate Potential'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {prediction.predictedClass}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-slate-100">{prediction.predictedRating}</span>
                <span className="text-xl text-amber-400 font-bold">/ 5.0 ★</span>
              </div>

              {/* Feature Impact Weights Bar */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-400">Feature Weight Contributions</div>
                <div className="grid grid-cols-2 gap-2">
                  {prediction.featureWeights.map((f) => (
                    <div key={f.feature} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                      <div className="text-slate-400 truncate">{f.feature}</div>
                      <div
                        className={`font-bold mt-0.5 ${
                          f.impact === 'Positive' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {f.impact === 'Positive' ? '+' : '-'}
                        {f.weight}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Academic Evaluation Metrics */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Mathematical Model Validation</span>
                <span className="text-[10px] text-slate-400">Evaluated on Ground-Truth Fixtures</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">R² Score</div>
                  <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                    {prediction.evaluationMetrics.r2Score}
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">RMSE</div>
                  <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">
                    {prediction.evaluationMetrics.rmse}
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">MAE</div>
                  <div className="font-mono font-bold text-indigo-400 text-sm mt-0.5">
                    {prediction.evaluationMetrics.mae}
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Macro-F1</div>
                  <div className="font-mono font-bold text-blue-400 text-sm mt-0.5">
                    {prediction.evaluationMetrics.macroF1}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ADVANCED DATA MINING MODULES (DBSCAN & APRIORI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module A: DBSCAN Spatial Clustering */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> Spatial Data Mining
              </span>
              <h3 className="text-lg font-bold text-slate-100">DBSCAN Spatial Clustering</h3>
            </div>
            <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
              ε = 500m | MinPts = 2
            </span>
          </div>

          <div className="space-y-3">
            {dbscanClusters.map((cluster: any) => (
              <div key={cluster.clusterId} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">{cluster.clusterName}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {cluster.stallsCount} Stalls Clustered
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Center: {cluster.centerLat}, {cluster.centerLng} ({cluster.dominantLocality})
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {cluster.stalls.map((s: any) => (
                    <span key={s.id} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {noisePoints.length > 0 && (
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
                <div className="text-slate-400 text-[11px] font-semibold">
                  Isolated Stalls (DBSCAN Noise Points: {noisePoints.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {noisePoints.slice(0, 4).map((p: any) => (
                    <span key={p.id} className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Module B: Apriori Association Rule Mining */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5" /> Market Basket Analysis
              </span>
              <h3 className="text-lg font-bold text-slate-100">Apriori Association Rules</h3>
            </div>
            <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
              MinSup: 15% | MinConf: 40%
            </span>
          </div>

          <div className="space-y-3">
            {aprioriRules.slice(0, 4).map((rule: any, idx: number) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-400">
                    {rule.antecedent.join(', ')} <span className="text-slate-500">⟹</span> {rule.consequent.join(', ')}
                  </div>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Lift: {rule.lift}x
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{rule.explanation}</p>
                <div className="flex gap-4 text-[10px] text-slate-400 pt-0.5">
                  <span>Support: {(rule.support * 100).toFixed(1)}%</span>
                  <span>Confidence: {(rule.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: PRICE INTELLIGENCE & TIME-SERIES ANOMALY ALERTS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> Economic Pattern Mining
            </span>
            <h3 className="text-xl font-bold text-slate-100">Price Intelligence & Outlier Metrics</h3>
          </div>
          <span className="text-xs text-slate-400">
            City Benchmark: ₹{miningData?.priceIntelligence?.cityWideAveragePrice || 45} Avg
          </span>
        </div>

        {/* Dish Price Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Dish Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Median Price</th>
                <th className="p-3">Valid IQR Range</th>
                <th className="p-3">Std Deviation</th>
                <th className="p-3">Obs Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {priceMetrics.slice(0, 6).map((dish: any) => (
                <tr key={dish.foodName} className="hover:bg-slate-800/30">
                  <td className="p-3 font-bold text-slate-100">{dish.foodName}</td>
                  <td className="p-3 text-slate-400">{dish.category}</td>
                  <td className="p-3 font-mono text-amber-400 font-bold">₹{dish.medianPrice}</td>
                  <td className="p-3 font-mono text-emerald-400">₹{dish.minPrice} - ₹{dish.maxPrice} (IQR: ₹{dish.iqr})</td>
                  <td className="p-3 font-mono text-slate-400">±₹{dish.stdDev}</td>
                  <td className="p-3 text-slate-400">{dish.observationsCount} samples</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Price Surge Alerts */}
        {surgeAlerts.length > 0 && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-rose-500/30 space-y-2">
            <div className="font-bold text-xs text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Detected Price Surge Anomalies (&gt;15% Delta)
            </div>
            {surgeAlerts.map((alert: any) => (
              <div key={alert.id} className="text-xs text-slate-300 flex items-center justify-between">
                <span>
                  <strong className="text-slate-100">{alert.placeName}</strong> ({alert.locality}): {alert.foodName} shifted from ₹{alert.oldPrice} to ₹{alert.newPrice}
                </span>
                <span className="font-bold text-rose-400 font-mono">+{alert.deltaPercent}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
