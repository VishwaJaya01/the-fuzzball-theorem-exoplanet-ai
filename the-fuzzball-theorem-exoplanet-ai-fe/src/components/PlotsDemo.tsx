'use client';

import React, { useState } from 'react';
import LightCurvePlot from './plots/LightCurvePlot';
import PhaseFoldPlot from './plots/PhaseFoldPlot';
import PeriodogramPlot from './plots/PeriodogramPlot';
import type { 
  TessLightCurve, 
  PhaseFoldData, 
  PeriodogramData, 
  TransitDetection 
} from '@/lib/types';

/**
 * Generate synthetic light curve data with transits
 */
function generateLightCurveData(numPoints: number = 1000): TessLightCurve {
  const time: number[] = [];
  const flux: number[] = [];
  const flux_err: number[] = [];
  
  const timeStart = 1500;
  const timeSpan = 50; // days
  const period = 3.5; // days
  const transitDepth = 0.015;
  const transitDuration = 0.15; // days
  
  for (let i = 0; i < numPoints; i++) {
    const t = timeStart + (i / numPoints) * timeSpan;
    const noise = (Math.random() - 0.5) * 0.001;
    
    // Check if we're in a transit
    const phase = ((t % period) / period);
    const inTransit = phase < (transitDuration / period) || 
                      phase > (1 - transitDuration / period);
    
    const transitSignal = inTransit ? -transitDepth : 0;
    
    time.push(t);
    flux.push(1.0 + transitSignal + noise);
    flux_err.push(0.001);
  }
  
  return { time, flux, flux_err };
}

/**
 * Generate phase-folded data
 */
function generatePhaseFoldData(): PhaseFoldData {
  const phase: number[] = [];
  const flux: number[] = [];
  
  const numPoints = 500;
  const transitDepth = 0.015;
  const transitWidth = 0.05; // phase units
  
  for (let i = 0; i < numPoints; i++) {
    const p = -0.5 + (i / numPoints);
    const noise = (Math.random() - 0.5) * 0.001;
    
    // Gaussian transit shape
    const transitSignal = Math.abs(p) < transitWidth 
      ? -transitDepth * Math.exp(-50 * p * p)
      : 0;
    
    phase.push(p);
    flux.push(1.0 + transitSignal + noise);
  }
  
  return { phase, flux };
}

/**
 * Generate periodogram data
 */
function generatePeriodogramData(): PeriodogramData {
  const period: number[] = [];
  const power: number[] = [];
  
  const numPoints = 500;
  const minPeriod = 0.5;
  const maxPeriod = 10;
  const truePeriod = 3.5;
  
  for (let i = 0; i < numPoints; i++) {
    const p = minPeriod + (i / numPoints) * (maxPeriod - minPeriod);
    
    // Power peaks at true period with noise
    const powerSignal = Math.exp(-10 * Math.pow((p - truePeriod) / truePeriod, 2));
    const noise = Math.random() * 0.1;
    
    period.push(p);
    power.push(powerSignal + noise);
  }
  
  return {
    period,
    power,
    bestPeriod: truePeriod,
    bestPower: Math.max(...power),
    method: 'BLS'
  };
}

/**
 * Sample transit detection
 */
const sampleDetection: TransitDetection = {
  period: 3.5,
  epoch: 1500.5,
  duration: 3.6,
  depth: 0.015,
  confidence: 0.92,
  snr: 12.5
};

/**
 * PlotsDemo Component
 * Interactive demonstration of all plot types with sample data
 */
function PlotsDemo() {
  const [activeTab, setActiveTab] = useState<'raw' | 'flattened' | 'phaseFold' | 'periodogram'>('raw');
  const [showTransits, setShowTransits] = useState(true);
  
  // Generate sample data
  const lightCurveData = generateLightCurveData();
  const phaseFoldData = generatePhaseFoldData();
  const periodogramData = generatePeriodogramData();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          📊 ExoFind Plots Demo
        </h1>
        <p className="text-blue-100">
          Interactive visualization components for exoplanet transit detection
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🪐</div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Sample Transit Detection
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Period</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {sampleDetection.period} days
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {sampleDetection.duration} hours
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Depth</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {(sampleDetection.depth * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">SNR</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {sampleDetection.snr}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showTransits}
                onChange={(e) => setShowTransits(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Transit Regions
              </span>
            </label>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            💡 Hover over data points for details
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { id: 'raw' as const, label: 'Raw Light Curve', icon: '📈' },
            { id: 'flattened' as const, label: 'Flattened', icon: '✨' },
            { id: 'phaseFold' as const, label: 'Phase-Folded', icon: '🔄' },
            { id: 'periodogram' as const, label: 'Periodogram', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'raw' && (
            <LightCurvePlot
              data={lightCurveData}
              title="Raw Light Curve"
              detections={showTransits ? [sampleDetection] : undefined}
              isFlattened={false}
            />
          )}
          
          {activeTab === 'flattened' && (
            <LightCurvePlot
              data={lightCurveData}
              title="Flattened Light Curve"
              detections={showTransits ? [sampleDetection] : undefined}
              isFlattened={true}
            />
          )}
          
          {activeTab === 'phaseFold' && (
            <PhaseFoldPlot
              data={phaseFoldData}
              detections={[sampleDetection]}
            />
          )}
          
          {activeTab === 'periodogram' && (
            <PeriodogramPlot data={periodogramData} />
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>✨</span> Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Interactive tooltips with precise values</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Zoom and pan support (Recharts built-in)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Transit region highlighting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Statistical summary cards</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Dark mode support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Export to PNG (via html2canvas)</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🎨</span> Components
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">LightCurvePlot</p>
              <p className="text-gray-600 dark:text-gray-400">Time-series flux data with optional transit overlays</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">PhaseFoldPlot</p>
              <p className="text-gray-600 dark:text-gray-400">Phase-folded scatter plot at detected period</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">PeriodogramPlot</p>
              <p className="text-gray-600 dark:text-gray-400">BLS/TLS power spectrum with peak marking</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">TransitOverlay</p>
              <p className="text-gray-600 dark:text-gray-400">Reusable transit region renderer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          📘 Usage in Your App
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-400 mb-3">
          Import these components and pass your real data from the API:
        </p>
        <pre className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-3 text-xs overflow-x-auto">
{`import PlotsPanel from '@/components/PlotsPanel';

<PlotsPanel
  lightCurve={analysis.lightCurve}
  phaseFold={analysis.phaseFold}
  periodogram={analysis.periodogram}
  detections={prediction.detections}
/>`}
        </pre>
      </div>
    </div>
  );
}

export default PlotsDemo;
