'use client';

import React, { useState } from 'react';
import type { HistoryCompareProps, HistoryItem } from '@/lib/types';

/**
 * HistoryCompare Component
 * Displays analysis history and allows side-by-side comparison of results
 */
function HistoryCompare({ history, onSelect, maxCompare = 3 }: HistoryCompareProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  // Toggle item selection
  const toggleSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      } else {
        if (prev.length >= maxCompare) {
          return prev; // Max selection reached
        }
        return [...prev, id];
      }
    });
  };

  // Get selected history items
  const getSelectedItems = (): HistoryItem[] => {
    return history.filter((item) => selectedItems.includes(item.id));
  };

  // Handle compare action
  const handleCompare = () => {
    if (selectedItems.length >= 2) {
      setCompareMode(true);
      if (onSelect) {
        onSelect(getSelectedItems());
      }
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems([]);
    setCompareMode(false);
  };

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    if (score >= 0.7) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    if (score >= 0.5) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    if (score >= 0.3) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  };

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📜</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Analysis History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your analysis history will appear here for easy comparison
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📜</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Analysis History
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {history.length} {history.length === 1 ? 'analysis' : 'analyses'} • Select up to {maxCompare} to compare
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {selectedItems.length} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-xs px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Clear
              </button>
              {selectedItems.length >= 2 && (
                <button
                  onClick={handleCompare}
                  className="text-xs px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Compare ({selectedItems.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History List or Compare View */}
      {!compareMode ? (
        <div className="space-y-2">
          {history.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            const isDisabled = !isSelected && selectedItems.length >= maxCompare;

            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && toggleSelect(item.id)}
                disabled={isDisabled}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-md'
                    : isDisabled
                    ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Selection Checkbox */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        TIC {item.ticId}
                      </p>
                      {item.sector && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          Sector {item.sector}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(item.timestamp)}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Detections</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.detectionCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Score</p>
                      <p className={`text-sm font-bold px-2 py-0.5 rounded ${getScoreColor(item.score)}`}>
                        {(item.score * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Compare View */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Compare Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <span className="text-xl">🔍</span>
                <h3 className="font-semibold">Comparison View</h3>
              </div>
              <button
                onClick={clearSelection}
                className="text-sm px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                Exit Comparison
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-700 dark:text-gray-300 p-3 sticky left-0 bg-gray-50 dark:bg-gray-900/50">
                    Metric
                  </th>
                  {getSelectedItems().map((item) => (
                    <th key={item.id} className="text-center text-xs font-semibold text-gray-700 dark:text-gray-300 p-3">
                      TIC {item.ticId}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Timestamp */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="text-xs font-medium text-gray-700 dark:text-gray-300 p-3 sticky left-0 bg-white dark:bg-gray-800">
                    Analysis Date
                  </td>
                  {getSelectedItems().map((item) => (
                    <td key={item.id} className="text-xs text-gray-600 dark:text-gray-400 p-3 text-center">
                      {formatDate(item.timestamp)}
                    </td>
                  ))}
                </tr>

                {/* Sector */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="text-xs font-medium text-gray-700 dark:text-gray-300 p-3 sticky left-0 bg-white dark:bg-gray-800">
                    Sector
                  </td>
                  {getSelectedItems().map((item) => (
                    <td key={item.id} className="text-xs text-gray-600 dark:text-gray-400 p-3 text-center">
                      {item.sector || 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Overall Score */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="text-xs font-medium text-gray-700 dark:text-gray-300 p-3 sticky left-0 bg-white dark:bg-gray-800">
                    Overall Score
                  </td>
                  {getSelectedItems().map((item) => (
                    <td key={item.id} className="p-3 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${getScoreColor(item.score)}`}>
                        {(item.score * 100).toFixed(1)}%
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Detection Count */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="text-xs font-medium text-gray-700 dark:text-gray-300 p-3 sticky left-0 bg-white dark:bg-gray-800">
                    Detections
                  </td>
                  {getSelectedItems().map((item) => (
                    <td key={item.id} className="text-xs font-bold text-gray-900 dark:text-white p-3 text-center">
                      {item.detectionCount}
                    </td>
                  ))}
                </tr>

                {/* Best Detection Details */}
                {getSelectedItems().some((item) => item.result.data?.detections && item.result.data.detections.length > 0) && (
                  <>
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <td colSpan={selectedItems.length + 1} className="text-xs font-semibold text-gray-700 dark:text-gray-300 p-3">
                        Best Detection
                      </td>
                    </tr>

                    {/* Period */}
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="text-xs font-medium text-gray-700 dark:text-gray-300 p-3 sticky left-0 bg-white dark:bg-gray-800">
                        Period (days)
                      </td>
                      {getSelectedItems().map((item) => (
                        <td key={item.id} className="text-xs text-gray-600 dark:text-gray-400 p-3 text-center">
                          {item.result.data?.detections?.[0]?.period.toFixed(4) || 'N/A'}
                        </td>
                      ))}
                    </tr>

                    {/* Depth */}
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="text-xs font-medium text-gray-700 dark:text-gray-300 p-3 sticky left-0 bg-white dark:bg-gray-800">
                        Depth (%)
                      </td>
                      {getSelectedItems().map((item) => (
                        <td key={item.id} className="text-xs text-gray-600 dark:text-gray-400 p-3 text-center">
                          {item.result.data?.detections?.[0]?.depth 
                            ? (item.result.data.detections[0].depth * 100).toFixed(2) 
                            : 'N/A'}
                        </td>
                      ))}
                    </tr>

                    {/* SNR */}
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="text-xs font-medium text-gray-700 dark:text-gray-300 p-3 sticky left-0 bg-white dark:bg-gray-800">
                        SNR
                      </td>
                      {getSelectedItems().map((item) => (
                        <td key={item.id} className="text-xs text-gray-600 dark:text-gray-400 p-3 text-center">
                          {item.result.data?.detections?.[0]?.snr.toFixed(1) || 'N/A'}
                        </td>
                      ))}
                    </tr>

                    {/* Confidence */}
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="text-xs font-medium text-gray-700 dark:text-gray-300 p-3 sticky left-0 bg-white dark:bg-gray-800">
                        Confidence
                      </td>
                      {getSelectedItems().map((item) => (
                        <td key={item.id} className="text-xs text-gray-600 dark:text-gray-400 p-3 text-center">
                          {item.result.data?.detections?.[0]?.confidence 
                            ? (item.result.data.detections[0].confidence * 100).toFixed(1) + '%'
                            : 'N/A'}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Comparison Summary */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📊 Quick Insights
            </h4>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {(() => {
                const items = getSelectedItems();
                const avgScore = items.reduce((sum, item) => sum + item.score, 0) / items.length;
                const totalDetections = items.reduce((sum, item) => sum + item.detectionCount, 0);
                const bestScore = Math.max(...items.map((item) => item.score));
                const bestItem = items.find((item) => item.score === bestScore);

                return (
                  <>
                    <p>• Average score: <strong>{(avgScore * 100).toFixed(1)}%</strong></p>
                    <p>• Total detections: <strong>{totalDetections}</strong></p>
                    <p>• Best performer: <strong>TIC {bestItem?.ticId}</strong> ({(bestScore * 100).toFixed(1)}%)</p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryCompare;
