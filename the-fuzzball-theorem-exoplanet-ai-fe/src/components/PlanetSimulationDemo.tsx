'use client';

import React, { useState } from 'react';
import PlanetSimulation from './PlanetSimulation';
import type { TransitDetection } from '@/lib/types';

/**
 * PlanetSimulationDemo Component
 * Interactive demonstration of the 3D planet simulation
 */
function PlanetSimulationDemo() {
  const [selectedSystem, setSelectedSystem] = useState<'multi' | 'single' | 'hot-jupiter' | 'none'>('multi');

  // Sample detection data for different planetary systems
  const systems: Record<string, { ticId: string; detections: TransitDetection[] }> = {
    multi: {
      ticId: '307210830',
      detections: [
        {
          period: 3.524,
          epoch: 1815.42,
          duration: 3.6,
          depth: 0.0148,
          confidence: 0.92,
          snr: 14.2,
        },
        {
          period: 7.048,
          epoch: 1817.19,
          duration: 4.1,
          depth: 0.0092,
          confidence: 0.78,
          snr: 9.8,
        },
        {
          period: 12.345,
          epoch: 1820.55,
          duration: 5.2,
          depth: 0.0065,
          confidence: 0.68,
          snr: 7.5,
        },
      ],
    },
    single: {
      ticId: '441420236',
      detections: [
        {
          period: 5.123,
          epoch: 1800.15,
          duration: 4.2,
          depth: 0.0201,
          confidence: 0.87,
          snr: 12.5,
        },
      ],
    },
    'hot-jupiter': {
      ticId: '238855987',
      detections: [
        {
          period: 1.234,
          epoch: 1785.56,
          duration: 1.9,
          depth: 0.0340,
          confidence: 0.95,
          snr: 18.2,
        },
      ],
    },
    none: {
      ticId: '150428135',
      detections: [],
    },
  };

  const currentSystem = systems[selectedSystem];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          🪐 3D Planet Simulation Demo
        </h1>
        <p className="text-purple-100">
          Interactive visualization of exoplanetary systems using Three.js
        </p>
      </div>

      {/* System Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          🌟 Select a Planetary System
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <button
            onClick={() => setSelectedSystem('multi')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedSystem === 'multi'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <div className="text-2xl mb-2">🌍🌍🌍</div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Multi-Planet</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">3 planets detected</p>
          </button>

          <button
            onClick={() => setSelectedSystem('single')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedSystem === 'single'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <div className="text-2xl mb-2">🌍</div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Single Planet</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">1 planet detected</p>
          </button>

          <button
            onClick={() => setSelectedSystem('hot-jupiter')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedSystem === 'hot-jupiter'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <div className="text-2xl mb-2">🔥🪐</div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Hot Jupiter</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Close orbit, large planet</p>
          </button>

          <button
            onClick={() => setSelectedSystem('none')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedSystem === 'none'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <div className="text-2xl mb-2">⭐</div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Empty System</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">No planets detected</p>
          </button>
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="h-[600px]">
          <PlanetSimulation
            detections={currentSystem.detections}
            ticId={currentSystem.ticId}
          />
        </div>
      </div>

      {/* Detection Details */}
      {currentSystem.detections.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            📊 Detection Details
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {currentSystem.detections.map((det, idx) => (
              <div
                key={idx}
                className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        det.confidence >= 0.8 ? '#4ade80' :
                        det.confidence >= 0.6 ? '#60a5fa' :
                        det.confidence >= 0.4 ? '#fbbf24' : '#f87171'
                    }}
                  />
                  <span className="font-bold text-gray-900 dark:text-white">
                    Planet {idx + 1}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Period:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {det.period.toFixed(3)} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Depth:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {(det.depth * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {det.duration.toFixed(1)} hrs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">SNR:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {det.snr.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {(det.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>✨</span> Interactive Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Drag to Rotate:</strong> Click and drag to orbit around the system</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Scroll to Zoom:</strong> Use mouse wheel to zoom in/out</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Right-Click Drag:</strong> Pan the camera view</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Auto-Rotation:</strong> Planets orbit automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Color Coding:</strong> Planet color shows confidence level</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Starfield:</strong> Beautiful animated star background</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🔬</span> Scientific Accuracy
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Orbital Period</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Planet distance scales with √period (Kepler&apos;s Third Law approximation)
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Planet Size</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Planet radius scaled based on transit depth (larger depth = larger planet)
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Orbital Speed</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Shorter periods result in faster orbital motion
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Confidence Color</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Green (high) → Blue → Yellow → Red (low)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Example */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
          📘 Usage Example
        </h3>
        <pre className="bg-purple-100 dark:bg-purple-900/40 rounded-lg p-4 text-xs overflow-x-auto">
{`import PlanetSimulation from '@/components/PlanetSimulation';

<PlanetSimulation
  detections={result.data?.detections || []}
  ticId={result.data?.target.tic_id || ''}
/>`}
        </pre>
      </div>

      {/* Technical Info */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          🛠️ Technical Stack
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Three.js</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              WebGL-based 3D graphics library
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">React Three Fiber</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              React renderer for Three.js
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">React Three Drei</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Useful helpers (OrbitControls, Stars)
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
          💡 Pro Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Watch planets orbit in real-time to see their relative speeds</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Compare planet sizes - larger planets have deeper transits</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Zoom in close to see the glowing star at the center</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Orbit paths show the full trajectory of each planet</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default PlanetSimulationDemo;
