'use client';

import React from 'react';
import ActionsMenu from './ActionsMenu';
import type { PredictResult } from '@/lib/types';

/**
 * ActionsMenuDemo Component
 * Interactive demonstration of the ActionsMenu component
 */
function ActionsMenuDemo() {
  // Sample prediction result
  const sampleResult: PredictResult = {
    id: 'pred_12345',
    status: 'success',
    data: {
      id: 'analysis_67890',
      timestamp: new Date().toISOString(),
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
          confidence: 0.89,
          snr: 14.2,
        },
        {
          period: 7.048,
          epoch: 1817.19,
          duration: 4.1,
          depth: 0.0092,
          confidence: 0.72,
          snr: 8.5,
        },
      ],
      lightCurve: {
        time: Array.from({ length: 1000 }, (_, i) => 1815 + i * 0.05),
        flux: Array.from({ length: 1000 }, () => 1.0 + (Math.random() - 0.5) * 0.001),
        flux_err: Array.from({ length: 1000 }, () => 0.001),
      },
      status: 'completed',
    },
  };

  const apiUrl = 'https://api.exofind.com';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ⚙️ ActionsMenu Demo
        </h1>
        <p className="text-indigo-100">
          Download reports and copy API calls for reproducibility
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          📋 Sample Result Info
        </h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Target</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              TIC {sampleResult.data?.target?.tic_id}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Detections</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {sampleResult.data?.detections?.length || 0} candidates
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Status</p>
            <p className="font-semibold text-green-600 dark:text-green-400">
              {sampleResult.status}
            </p>
          </div>
        </div>
      </div>

      {/* Main Demo */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* ActionsMenu Component */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Actions Component
          </h3>
          <ActionsMenu result={sampleResult} apiUrl={apiUrl} />
        </div>

        {/* Features List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>✨</span> Features
          </h3>
          <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">📄</span>
              <div>
                <p className="font-medium">Download JSON</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Complete result with all metadata
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">📊</span>
              <div>
                <p className="font-medium">Download CSV</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Detections table for spreadsheet analysis
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">🔗</span>
              <div>
                <p className="font-medium">Copy API Call</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  cURL command and JSON body for reproducibility
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* API Modal Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          🔗 API Modal Features
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Endpoint Selection
            </h4>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  /predict/by_tic
                </code>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  - Fetch from MAST
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  /predict/by_upload
                </code>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  - Custom data
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Copy Actions
            </h4>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>• One-click copy cURL command</li>
              <li>• Copy JSON request body</li>
              <li>• Usage notes and examples</li>
              <li>• Syntax-highlighted code blocks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Download Formats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <span>📄</span> JSON Format
          </h3>
          <p className="text-xs text-blue-800 dark:text-blue-400 mb-3">
            Complete result including:
          </p>
          <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
            <li>• All detection parameters</li>
            <li>• Target star metadata</li>
            <li>• Light curve data points</li>
            <li>• Timestamps and IDs</li>
            <li>• Quality metrics</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <p className="text-xs font-mono text-blue-900 dark:text-blue-300">
              exofind-result-307210830.json
            </p>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center gap-2">
            <span>📊</span> CSV Format
          </h3>
          <p className="text-xs text-green-800 dark:text-green-400 mb-3">
            Tabular detections data:
          </p>
          <ul className="space-y-1 text-xs text-green-800 dark:text-green-400">
            <li>• One row per detection</li>
            <li>• Compatible with Excel/Sheets</li>
            <li>• Easy statistical analysis</li>
            <li>• Publication-ready format</li>
          </ul>
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
            <p className="text-xs font-mono text-green-900 dark:text-green-300">
              exofind-detections-307210830.csv
            </p>
          </div>
        </div>
      </div>

      {/* Usage Example */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
          📘 Usage Example
        </h3>
        <pre className="bg-purple-100 dark:bg-purple-900/40 rounded-lg p-4 text-xs overflow-x-auto">
{`import ActionsMenu from '@/components/ActionsMenu';

<ActionsMenu
  result={predictionResult}
  apiUrl="https://api.exofind.com"
/>`}
        </pre>
      </div>

      {/* Props Interface */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          🔧 Props Interface
        </h3>
        <pre className="text-xs bg-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`interface ActionsMenuProps {
  result: PredictResult;  // Complete prediction result
  apiUrl: string;         // Base API URL
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
            <div className="text-2xl mb-2">📚</div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Research
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Download results for papers, citations, and reproducible research
            </p>
          </div>
          <div>
            <div className="text-2xl mb-2">🔄</div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Integration
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Copy API calls to integrate ExoFind into your workflow
            </p>
          </div>
          <div>
            <div className="text-2xl mb-2">📊</div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Analysis
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Export CSV for statistical analysis in Excel or Python
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">
          💡 Tips
        </h3>
        <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-400">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Downloaded files include timestamps in filename for organization</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>cURL commands can be tested directly in terminal or used in scripts</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>JSON format preserves all data and can be re-imported later</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>CSV format is compatible with most data analysis tools</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ActionsMenuDemo;
