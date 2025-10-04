'use client';

import React, { useState } from 'react';
import ResultsCard from './ResultsCard';
import type { PredictResult } from '@/lib/types';

/**
 * Demo component for ResultsCard
 * Shows different scenarios and scores
 */
export default function ResultsDemo() {
  const [selectedExample, setSelectedExample] = useState<string>('high');

  // Example results with different scores
  const examples: Record<string, PredictResult> = {
    high: {
      id: 'result-001',
      status: 'success',
      data: {
        id: 'analysis-001',
        timestamp: new Date().toISOString(),
        target: {
          tic_id: '307210830',
          sector: 3,
          ra: 123.456,
          dec: -45.678,
          magnitude: 8.5,
        },
        detections: [
          {
            period: 3.8567,
            epoch: 2458325.5,
            duration: 2.4,
            depth: 1250,
            snr: 15.3,
            confidence: 0.95,
          },
        ],
        lightCurve: {
          time: [],
          flux: [],
        },
        status: 'completed',
      },
    },
    medium: {
      id: 'result-002',
      status: 'success',
      data: {
        id: 'analysis-002',
        timestamp: new Date().toISOString(),
        target: {
          tic_id: '123456789',
          sector: 5,
        },
        detections: [
          {
            period: 15.234,
            epoch: 2458420.1,
            duration: 4.8,
            depth: 850,
            snr: 8.2,
            confidence: 0.72,
          },
        ],
        lightCurve: {
          time: [],
          flux: [],
        },
        status: 'completed',
      },
    },
    low: {
      id: 'result-003',
      status: 'success',
      data: {
        id: 'analysis-003',
        timestamp: new Date().toISOString(),
        target: {
          tic_id: '987654321',
          sector: 7,
        },
        detections: [
          {
            period: 8.456,
            epoch: 2458500.3,
            duration: 3.2,
            depth: 450,
            snr: 5.1,
            confidence: 0.48,
          },
        ],
        lightCurve: {
          time: [],
          flux: [],
        },
        status: 'completed',
      },
    },
    unlikely: {
      id: 'result-004',
      status: 'success',
      data: {
        id: 'analysis-004',
        timestamp: new Date().toISOString(),
        target: {
          tic_id: '555666777',
          sector: 10,
        },
        detections: [
          {
            period: 2.123,
            epoch: 2458600.7,
            duration: 1.5,
            depth: 200,
            snr: 3.8,
            confidence: 0.32,
          },
        ],
        lightCurve: {
          time: [],
          flux: [],
        },
        status: 'completed',
      },
    },
    none: {
      id: 'result-005',
      status: 'success',
      data: {
        id: 'analysis-005',
        timestamp: new Date().toISOString(),
        target: {
          tic_id: '111222333',
          sector: 12,
        },
        detections: [],
        lightCurve: {
          time: [],
          flux: [],
        },
        status: 'completed',
      },
    },
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          ResultsCard Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Display exoplanet detection results with scores, metrics, and quality badges
        </p>
      </div>

      {/* Example Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Example
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedExample('high')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedExample === 'high'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            High Confidence (95%)
          </button>
          <button
            onClick={() => setSelectedExample('medium')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedExample === 'medium'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Medium Confidence (72%)
          </button>
          <button
            onClick={() => setSelectedExample('low')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedExample === 'low'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Possible (48%)
          </button>
          <button
            onClick={() => setSelectedExample('unlikely')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedExample === 'unlikely'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Unlikely (32%)
          </button>
          <button
            onClick={() => setSelectedExample('none')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedExample === 'none'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            No Detection (0%)
          </button>
        </div>
      </div>

      {/* ResultsCard */}
      <ResultsCard
        result={examples[selectedExample]}
        onCopyJson={() => console.log('JSON copied')}
        onDownloadCsv={() => console.log('CSV downloaded')}
        onCopyApiCurl={() => console.log('API curl copied')}
      />

      {/* Features List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Features
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Scoring</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>✓ 0-1 confidence score with percentage</li>
              <li>✓ Color-coded labels (Highly Likely to Unlikely)</li>
              <li>✓ Score threshold indicator</li>
              <li>✓ Confidence level (high/medium/low)</li>
              <li>✓ Visual progress bar</li>
              <li>✓ Tooltip explaining scoring</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Metrics</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>✓ Period (days)</li>
              <li>✓ Duration (hours)</li>
              <li>✓ Depth (ppm)</li>
              <li>✓ Signal-to-Noise Ratio (SNR)</li>
              <li>✓ Icons for each metric</li>
              <li>✓ Formatted with units</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Quality Badges</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>✓ Clean Data indicator</li>
              <li>✓ Low Crowding indicator</li>
              <li>✓ High SNR indicator</li>
              <li>✓ Adequate Coverage indicator</li>
              <li>✓ Color-coded badges</li>
              <li>✓ Checkmark icons</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white">Actions</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>✓ Copy JSON to clipboard</li>
              <li>✓ Download results as CSV</li>
              <li>✓ Copy API curl command</li>
              <li>✓ Toast notifications on action</li>
              <li>✓ Error handling</li>
              <li>✓ Optional callbacks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Score Thresholds */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Score Thresholds
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-2xl">
              🌍
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">≥ 90%: Highly Likely Planet</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Strong transit signal with high confidence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl">
              🪐
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">70-89%: Likely Planet</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Good transit signal, recommended for follow-up</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
              🔵
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">50-69%: Possible Planet</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Moderate signal, requires additional verification</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">30-49%: Unlikely Planet</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Weak signal, likely false positive</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-2xl">
              ❌
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">&lt; 30%: No Transit Detected</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">No significant transit signal found</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
