'use client';

import React, { useState } from 'react';
import HistoryCompare from './HistoryCompare';
import type { HistoryItem } from '@/lib/types';

/**
 * HistoryCompareDemo Component
 * Interactive demonstration of the HistoryCompare component
 */
function HistoryCompareDemo() {
  const [selectedItems, setSelectedItems] = useState<HistoryItem[]>([]);

  // Sample history data
  const sampleHistory: HistoryItem[] = [
    {
      id: 'hist_001',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      ticId: '307210830',
      sector: 14,
      score: 0.92,
      detectionCount: 2,
      result: {
        id: 'pred_001',
        status: 'success',
        data: {
          id: 'analysis_001',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
          target: {
            tic_id: '307210830',
            sector: 14,
            ra: 238.752,
            dec: -41.293,
            magnitude: 11.45,
          },
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
          ],
          lightCurve: {
            time: [],
            flux: [],
            flux_err: [],
          },
          status: 'completed',
        },
      },
    },
    {
      id: 'hist_002',
      timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
      ticId: '441420236',
      sector: 12,
      score: 0.87,
      detectionCount: 1,
      result: {
        id: 'pred_002',
        status: 'success',
        data: {
          id: 'analysis_002',
          timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
          target: {
            tic_id: '441420236',
            sector: 12,
            ra: 145.234,
            dec: 22.456,
            magnitude: 9.87,
          },
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
          lightCurve: {
            time: [],
            flux: [],
            flux_err: [],
          },
          status: 'completed',
        },
      },
    },
    {
      id: 'hist_003',
      timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
      ticId: '260647166',
      sector: 10,
      score: 0.65,
      detectionCount: 3,
      result: {
        id: 'pred_003',
        status: 'success',
        data: {
          id: 'analysis_003',
          timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
          target: {
            tic_id: '260647166',
            sector: 10,
            ra: 89.123,
            dec: -15.678,
            magnitude: 10.23,
          },
          detections: [
            {
              period: 2.456,
              epoch: 1790.23,
              duration: 2.8,
              depth: 0.0087,
              confidence: 0.65,
              snr: 7.9,
            },
            {
              period: 4.912,
              epoch: 1792.01,
              duration: 3.1,
              depth: 0.0065,
              confidence: 0.58,
              snr: 6.5,
            },
            {
              period: 9.824,
              epoch: 1794.78,
              duration: 3.5,
              depth: 0.0043,
              confidence: 0.51,
              snr: 5.2,
            },
          ],
          lightCurve: {
            time: [],
            flux: [],
            flux_err: [],
          },
          status: 'completed',
        },
      },
    },
    {
      id: 'hist_004',
      timestamp: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
      ticId: '238855987',
      sector: 9,
      score: 0.45,
      detectionCount: 1,
      result: {
        id: 'pred_004',
        status: 'success',
        data: {
          id: 'analysis_004',
          timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
          target: {
            tic_id: '238855987',
            sector: 9,
            ra: 312.456,
            dec: 45.789,
            magnitude: 8.76,
          },
          detections: [
            {
              period: 1.234,
              epoch: 1785.56,
              duration: 1.9,
              depth: 0.0034,
              confidence: 0.45,
              snr: 4.2,
            },
          ],
          lightCurve: {
            time: [],
            flux: [],
            flux_err: [],
          },
          status: 'completed',
        },
      },
    },
    {
      id: 'hist_005',
      timestamp: new Date(Date.now() - 86400000 * 14).toISOString(), // 14 days ago
      ticId: '150428135',
      sector: 8,
      score: 0.28,
      detectionCount: 0,
      result: {
        id: 'pred_005',
        status: 'success',
        data: {
          id: 'analysis_005',
          timestamp: new Date(Date.now() - 86400000 * 14).toISOString(),
          target: {
            tic_id: '150428135',
            sector: 8,
            ra: 201.345,
            dec: -33.456,
            magnitude: 13.12,
          },
          detections: [],
          lightCurve: {
            time: [],
            flux: [],
            flux_err: [],
          },
          status: 'completed',
        },
      },
    },
  ];

  const handleSelect = (items: HistoryItem[]) => {
    setSelectedItems(items);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          📜 HistoryCompare Demo
        </h1>
        <p className="text-purple-100">
          Compare multiple analysis results side-by-side
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          How to Use
        </h2>
        <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-purple-600 dark:text-purple-400">1.</span>
            <span>Click on analysis items to select them (up to 3)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-purple-600 dark:text-purple-400">2.</span>
            <span>Once 2+ items are selected, click &quot;Compare&quot; button</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-purple-600 dark:text-purple-400">3.</span>
            <span>View side-by-side comparison table with metrics</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-purple-600 dark:text-purple-400">4.</span>
            <span>Click &quot;Exit Comparison&quot; to return to list view</span>
          </li>
        </ol>
      </div>

      {/* Main Component */}
      <HistoryCompare
        history={sampleHistory}
        onSelect={handleSelect}
        maxCompare={3}
      />

      {/* Selected Items Info */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
            📊 Currently Selected for Comparison
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {selectedItems.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  TIC {item.ticId}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Score: {(item.score * 100).toFixed(0)}% • {item.detectionCount} detections
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>✨</span> Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Multi-select up to 3 analyses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Side-by-side comparison table</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Color-coded score indicators</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Quick insights summary</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Detailed detection metrics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Empty state handling</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📊</span> Comparison Metrics
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Basic Info</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Date, TIC ID, Sector, Score</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Detection Stats</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Count, Period, Depth, SNR</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Quality Metrics</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Confidence, Best performer</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Quick Insights</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Average score, Total detections</p>
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
{`import HistoryCompare from '@/components/HistoryCompare';

<HistoryCompare
  history={analysisHistory}
  onSelect={() => {}}
  maxCompare={3}
/>`}
        </pre>
      </div>

      {/* Props Interface */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          🔧 Props Interface
        </h3>
        <pre className="text-xs bg-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`interface HistoryCompareProps {
  history: HistoryItem[];        // Array of analysis results
  onSelect?: (items: HistoryItem[]) => void;  // Selection callback
  maxCompare?: number;           // Max items to compare (default: 3)
}

interface HistoryItem {
  id: string;
  timestamp: string;
  ticId: string;
  sector?: number;
  score: number;
  detectionCount: number;
  result: PredictResult;
}`}
        </pre>
      </div>

      {/* Use Cases */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          💡 Use Cases
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl mb-2">🔬</div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Research
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Compare different sectors or observation periods for the same star
            </p>
          </div>
          <div>
            <div className="text-2xl mb-2">📈</div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Performance
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Identify patterns in successful vs. unsuccessful detections
            </p>
          </div>
          <div>
            <div className="text-2xl mb-2">✅</div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Validation
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Verify consistency of detections across multiple analyses
            </p>
          </div>
        </div>
      </div>

      {/* Score Color Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          🎨 Score Color Coding
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold text-sm">
              90%+
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">Highly Likely Planet</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold text-sm">
              70-90%
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">Likely Planet</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 font-semibold text-sm">
              50-70%
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">Possible Candidate</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold text-sm">
              30-50%
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">Unlikely</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold text-sm">
              &lt;30%
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">Very Unlikely</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryCompareDemo;
