'use client';

import React, { useState } from 'react';
import type { ActionsMenuProps } from '@/lib/types';
import { showSuccess, showError } from '@/lib/toast';

/**
 * ActionsMenu Component
 * Provides download and API call copy functionality
 */
function ActionsMenu({ result, apiUrl }: ActionsMenuProps) {
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState<'tic' | 'upload'>('tic');

  // Download as JSON
  const downloadJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exofind-result-${result.data?.target?.tic_id || Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess('JSON report downloaded');
    } catch {
      showError('Failed to download JSON');
    }
  };

  // Download as CSV
  const downloadCSV = () => {
    try {
      if (!result.data?.detections || result.data.detections.length === 0) {
        showError('No detections to export');
        return;
      }

      // CSV header
      let csv = 'TIC_ID,Period (days),Epoch (BTJD),Duration (hours),Depth,Confidence,SNR\n';

      // CSV rows
      result.data.detections.forEach((detection) => {
        csv += `${result.data?.target?.tic_id || 'N/A'},${detection.period},${detection.epoch},${detection.duration},${detection.depth},${detection.confidence},${detection.snr}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exofind-detections-${result.data?.target?.tic_id || Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSuccess('CSV report downloaded');
    } catch {
      showError('Failed to download CSV');
    }
  };

  // Generate cURL command
  const generateCurlCommand = () => {
    if (apiEndpoint === 'tic') {
      return `curl -X POST ${apiUrl}/predict/by_tic \\
  -H "Content-Type: application/json" \\
  -d '{
    "tic_id": "${result.data?.target?.tic_id || '307210830'}",
    "sector": ${result.data?.target?.sector || 1}
  }'`;
    } else {
      return `curl -X POST ${apiUrl}/predict/by_upload \\
  -H "Content-Type: application/json" \\
  -d '{
    "time": [1500.0, 1500.1, 1500.2, ...],
    "flux": [1.0, 0.998, 1.002, ...],
    "flux_err": [0.001, 0.001, 0.001, ...]
  }'`;
    }
  };

  // Copy cURL to clipboard
  const copyCurl = async () => {
    try {
      await navigator.clipboard.writeText(generateCurlCommand());
      showSuccess('cURL command copied to clipboard');
    } catch {
      showError('Failed to copy to clipboard');
    }
  };

  // Generate sample JSON body
  const generateSampleJSON = () => {
    if (apiEndpoint === 'tic') {
      return {
        tic_id: result.data?.target?.tic_id || '307210830',
        sector: result.data?.target?.sector || 1,
      };
    } else {
      return {
        time: [1500.0, 1500.1, 1500.2, 1500.3, 1500.4],
        flux: [1.0, 0.998, 1.002, 0.999, 1.001],
        flux_err: [0.001, 0.001, 0.001, 0.001, 0.001],
      };
    }
  };

  // Copy JSON to clipboard
  const copyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(generateSampleJSON(), null, 2));
      showSuccess('JSON body copied to clipboard');
    } catch {
      showError('Failed to copy to clipboard');
    }
  };

  return (
    <>
      {/* Actions Menu */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">⚙️</span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Actions
          </h3>
        </div>

        <div className="space-y-2">
          {/* Download JSON */}
          <button
            onClick={downloadJSON}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors text-left group"
          >
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">
                Download JSON
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Full result with metadata
              </p>
            </div>
          </button>

          {/* Download CSV */}
          <button
            onClick={downloadCSV}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg transition-colors text-left group"
          >
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300">
                Download CSV
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Detections table
              </p>
            </div>
          </button>

          {/* Copy API Call */}
          <button
            onClick={() => setShowApiModal(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg transition-colors text-left group"
          >
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300">
                Copy API Call
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                cURL command & JSON
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* API Modal */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔗</span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  API Call Examples
                </h2>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Endpoint Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Endpoint
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setApiEndpoint('tic')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      apiEndpoint === 'tic'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-sm">Predict by TIC</div>
                    <div className="text-xs opacity-75 mt-1">/predict/by_tic</div>
                  </button>
                  <button
                    onClick={() => setApiEndpoint('upload')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      apiEndpoint === 'upload'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-sm">Predict by Upload</div>
                    <div className="text-xs opacity-75 mt-1">/predict/by_upload</div>
                  </button>
                </div>
              </div>

              {/* cURL Command */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">
                    cURL Command
                  </label>
                  <button
                    onClick={copyCurl}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                <pre className="bg-gray-900 dark:bg-black text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">
{generateCurlCommand()}
                </pre>
              </div>

              {/* JSON Body */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">
                    JSON Request Body
                  </label>
                  <button
                    onClick={copyJSON}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </div>
                <pre className="bg-gray-900 dark:bg-black text-blue-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">
{JSON.stringify(generateSampleJSON(), null, 2)}
                </pre>
              </div>

              {/* Notes */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  📘 Usage Notes
                </h4>
                <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
                  <li>• Replace placeholder values with your actual data</li>
                  <li>• API URL: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">{apiUrl}</code></li>
                  <li>• Authentication may be required (check API docs)</li>
                  <li>• Rate limits may apply to API requests</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowApiModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ActionsMenu;
