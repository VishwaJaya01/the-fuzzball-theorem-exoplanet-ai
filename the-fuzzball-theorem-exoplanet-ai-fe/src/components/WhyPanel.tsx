'use client';

import React from 'react';
import type { WhyPanelProps } from '@/lib/types';

/**
 * WhyPanel Component
 * Displays model explainability information in a compact format
 * - Tree models: Top 3 feature contributions with mini bar chart
 * - CNN models: Descriptive text about what the model focused on
 */
function WhyPanel({ explain }: WhyPanelProps) {
  if (!explain) {
    return null;
  }

  // Tree model with feature contributions
  if (explain.type === 'tree' && explain.contributions) {
    // Sort by absolute value and take top 3
    const topContributions = explain.contributions
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 3);

    // Find max value for scaling bars
    const maxValue = Math.max(...topContributions.map(c => Math.abs(c.value)));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🧠</span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Why this prediction?
          </h3>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Top features influencing the decision:
        </p>

        <div className="space-y-2">
          {topContributions.map((contribution, index) => {
            const percentage = (Math.abs(contribution.value) / maxValue) * 100;
            const isPositive = contribution.value > 0;

            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {contribution.name}
                  </span>
                  <span className={`font-semibold ${
                    isPositive 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isPositive ? '+' : ''}{contribution.value.toFixed(3)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isPositive 
                        ? 'bg-green-500 dark:bg-green-400' 
                        : 'bg-red-500 dark:bg-red-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
          Positive values indicate support for planet detection
        </p>
      </div>
    );
  }

  // CNN model with descriptive text
  if (explain.type === 'cnn' && explain.text) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🧠</span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Why this prediction?
          </h3>
        </div>
        
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {explain.text}
        </p>
      </div>
    );
  }

  return null;
}

export default WhyPanel;
