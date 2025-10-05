'use client';

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';
import InputPanel from '@/components/InputPanel';
import StatusAlerts from '@/components/StatusAlerts';
import ResultsCard from '@/components/ResultsCard';
import StarMetaCard from '@/components/StarMetaCard';
import PlotsPanel from '@/components/PlotsPanel';
import PlanetSimulation from '@/components/PlanetSimulation';
import WhyPanel from '@/components/WhyPanel';
import ActionsMenu from '@/components/ActionsMenu';
import HistoryCompare from '@/components/HistoryCompare';
import { predictTransits } from '@/lib/api';
import type { PredictResult, HistoryItem, PredictPayload } from '@/lib/types';

export default function Home() {
  const [result, setResult] = useState<PredictResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handlePredict = async (payload: PredictPayload) => {
    setIsAnalyzing(true);
    const result = await predictTransits(payload);
    handleAnalysisComplete(result);
    return result;
  };

  const handleAnalysisComplete = (analysisResult: PredictResult) => {
    setResult(analysisResult);
    setIsAnalyzing(false);

    // Add to history if successful
    if (analysisResult.status === 'success' && analysisResult.data) {
      const historyItem: HistoryItem = {
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ticId: analysisResult.data.target.tic_id,
        sector: analysisResult.data.target.sector,
        score: analysisResult.data.detections.length > 0 
          ? Math.max(...analysisResult.data.detections.map(d => d.confidence))
          : 0,
        detectionCount: analysisResult.data.detections.length,
        result: analysisResult,
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 10)); // Keep last 10
    }
  };

  const handleHistorySelect = (items: HistoryItem[]) => {
    // Optional: Do something when history items are selected
    console.log('Selected history items:', items);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <Header 
        onOpenAbout={() => console.log('About clicked')}
        onUploadClick={() => console.log('Upload clicked')}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        
        {/* Input Section */}
        <section id="input" className="scroll-mt-20">
          <InputPanel
            onAnalysisComplete={handleAnalysisComplete}
            onPredict={handlePredict}
          />
        </section>

        {/* Status Section */}
        {isAnalyzing && (
          <section id="status" className="scroll-mt-20">
            <StatusAlerts status="analyzing" />
          </section>
        )}

        {/* Results Section */}
        {result && result.status === 'success' && result.data && (
          <>
            {/* Status Alert */}
            <section id="results-status" className="scroll-mt-20">
              <StatusAlerts
                status={result.data.detections.length > 0 ? 'success' : 'no-detection'}
                detectionCount={result.data.detections.length}
              />
            </section>

            {/* Action Menu */}
            <section id="actions" className="scroll-mt-20">
              <ActionsMenu 
                result={result} 
                apiUrl={process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:7860'}
              />
            </section>

            {/* Star Metadata Card */}
            {result.data.target && (
              <section id="star-info" className="scroll-mt-20">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>⭐</span> Star Information
                  </h2>
                  <StarMetaCard
                    meta={{
                      tic: result.data.target.tic_id,
                      tmag: result.data.target.magnitude,
                      teff: result.data.target.teff,
                      radius: result.data.target.radius,
                      crowding: result.data.target.crowding,
                      links: {
                        mast: `https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html?searchQuery=${result.data.target.tic_id}`,
                      },
                    }}
                  />
                </div>
              </section>
            )}

            {/* Detection Results */}
            {result.data.detections.length > 0 && (
              <section id="detections" className="scroll-mt-20">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>🪐</span> Detection Results
                  </h2>
                  <ResultsCard result={result} detections={result.data.detections} />
                </div>
              </section>
            )}

            {/* 3D Planet Simulation */}
            {result.data.detections.length > 0 && (
              <section id="simulation" className="scroll-mt-20">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>🌌</span> 3D System Visualization
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Interactive simulation • Drag to rotate • Scroll to zoom
                    </p>
                  </div>
                  <div className="h-[600px]">
                    <PlanetSimulation
                      detections={result.data.detections}
                      ticId={result.data.target.tic_id}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Light Curve Plots */}
            {result.data.lightCurve && result.data.lightCurve.time?.length && (
              <section id="plots" className="scroll-mt-20">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>📊</span> Light Curve Analysis
                  </h2>
                  <PlotsPanel
                    raw={result.data.lightCurve}
                    detections={result.data.detections}
                  />
                </div>
              </section>
            )}

            {/* Model Explainability */}
            {result.data.explain && (
              <section id="explainability" className="scroll-mt-20">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>🧠</span> Why This Prediction?
                  </h2>
                  <WhyPanel explain={result.data.explain} />
                </div>
              </section>
            )}
          </>
        )}

        {/* Error State */}
        {result && result.status === 'error' && (
          <section id="error" className="scroll-mt-20">
            <StatusAlerts status="error" errorMessage={result.error} />
          </section>
        )}

        {/* Analysis History */}
        {history.length > 0 && (
          <section id="history" className="scroll-mt-20">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📜</span> Analysis History
              </h2>
              <HistoryCompare
                history={history}
                onSelect={handleHistorySelect}
                maxCompare={3}
              />
            </div>
          </section>
        )}

        {/* Welcome/Empty State */}
        {!result && !isAnalyzing && (
          <section id="welcome" className="scroll-mt-20">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-6xl mb-4">🔭</div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome to ExoFind
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  AI-powered exoplanet detection using the Fuzzball Theorem
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-8 text-left">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl mb-2">🎯</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      High Accuracy
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Advanced ML models trained on TESS mission data
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl mb-2">⚡</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Fast Analysis
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get results in seconds with real-time processing
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-2xl mb-2">🌌</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      3D Visualization
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Interactive planetary system simulations
                    </p>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    👆 <strong>Get started:</strong> Enter a TIC ID or upload TESS data above
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">ExoFind</strong> • 
              Powered by the Fuzzball Theorem • Built with Next.js & Three.js
            </div>
            <div className="flex gap-6 text-sm">
              <a
                href="https://github.com/VishwaJaya01/the-fuzzball-theorem-exoplanet-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                MAST Archive
              </a>
              <a
                href="https://tess.mit.edu/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                TESS Mission
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

