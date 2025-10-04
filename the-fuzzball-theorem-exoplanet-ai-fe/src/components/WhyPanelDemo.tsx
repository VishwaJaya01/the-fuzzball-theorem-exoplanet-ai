'use client';

import React, { useState } from 'react';
import WhyPanel from './WhyPanel';
import type { ExplainData } from '@/lib/types';

/**
 * WhyPanelDemo Component
 * Interactive demonstration of the WhyPanel component
 */
function WhyPanelDemo() {
  const [modelType, setModelType] = useState<'tree' | 'cnn'>('tree');

  // Sample data for tree model
  const treeExplain: ExplainData = {
    type: 'tree',
    contributions: [
      { name: 'Transit Depth', value: 0.342 },
      { name: 'Period Stability', value: 0.289 },
      { name: 'SNR', value: 0.176 },
      { name: 'Duration', value: -0.098 },
      { name: 'Stellar Noise', value: -0.145 },
    ],
  };

  // Sample data for CNN model
  const cnnExplain: ExplainData = {
    type: 'cnn',
    text: 'Model focused on sharp dips near phase 0, consistent with planetary transit signature.',
  };

  const currentExplain = modelType === 'tree' ? treeExplain : cnnExplain;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          🧠 WhyPanel Demo
        </h1>
        <p className="text-purple-100">
          Model explainability component for transparent predictions
        </p>
      </div>

      {/* Model Type Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Select Model Type
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => setModelType('tree')}
            className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
              modelType === 'tree'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-2xl mb-2">🌳</div>
            <div className="text-sm">Tree Model</div>
            <div className="text-xs opacity-75 mt-1">Feature contributions</div>
          </button>
          
          <button
            onClick={() => setModelType('cnn')}
            className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
              modelType === 'cnn'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm">CNN Model</div>
            <div className="text-xs opacity-75 mt-1">Descriptive text</div>
          </button>
        </div>
      </div>

      {/* WhyPanel Component */}
      <WhyPanel explain={currentExplain} />

      {/* Information Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🌳</span> Tree Model
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Shows top 3 feature contributions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Mini bar chart for visual comparison</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Positive/negative value color coding</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Compact, judge-friendly format</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🤖</span> CNN Model
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Simple descriptive sentence</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Explains what model focused on</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Human-readable interpretation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Minimal, non-technical language</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Usage Example */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          📘 Usage Example
        </h3>
        <pre className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-4 text-xs overflow-x-auto">
{modelType === 'tree' ? `import WhyPanel from '@/components/WhyPanel';

<WhyPanel
  explain={{
    type: 'tree',
    contributions: [
      { name: 'Transit Depth', value: 0.342 },
      { name: 'Period Stability', value: 0.289 },
      { name: 'SNR', value: 0.176 }
    ]
  }}
/>` : `import WhyPanel from '@/components/WhyPanel';

<WhyPanel
  explain={{
    type: 'cnn',
    text: 'Model focused on sharp dips near phase 0.'
  }}
/>`}
        </pre>
      </div>

      {/* Sample Feature Contributions */}
      {modelType === 'tree' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            📊 All Feature Contributions
          </h3>
          <div className="space-y-3">
            {treeExplain.contributions?.map((contribution, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {index + 1}. {contribution.name}
                </span>
                <span className={`font-semibold ${
                  contribution.value > 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {contribution.value > 0 ? '+' : ''}{contribution.value.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Note: Only top 3 are displayed in the WhyPanel component to keep it compact.
          </p>
        </div>
      )}

      {/* Design Principles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          🎨 Design Principles
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold text-purple-600 dark:text-purple-400 mb-1">
              Compact
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Minimal space usage. Judges like explainability but keep it brief.
            </p>
          </div>
          <div>
            <div className="font-semibold text-purple-600 dark:text-purple-400 mb-1">
              Clear
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Easy to understand. Visual bar charts for quick comprehension.
            </p>
          </div>
          <div>
            <div className="font-semibold text-purple-600 dark:text-purple-400 mb-1">
              Actionable
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Shows what matters. Focus on top contributors only.
            </p>
          </div>
        </div>
      </div>

      {/* Props Interface */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          🔧 Props Interface
        </h3>
        <pre className="text-xs bg-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`interface WhyPanelProps {
  explain?: {
    type: 'tree' | 'cnn';
    contributions?: Array<{
      name: string;
      value: number;
    }>;
    text?: string;
  };
}`}
        </pre>
      </div>
    </div>
  );
}

export default WhyPanelDemo;
