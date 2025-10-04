'use client';

import React, { useState } from 'react';
import StarMetaCard from './StarMetaCard';
import type { StarMetadata } from '@/lib/types';

/**
 * StarMetaCardDemo Component
 * Interactive demonstration of the StarMetaCard component
 */
function StarMetaCardDemo() {
  const [showLinks, setShowLinks] = useState(true);
  const [dataCompleteness, setDataCompleteness] = useState<'full' | 'partial' | 'minimal'>('full');

  // Sample data variations
  const fullData: StarMetadata = {
    tic: '307210830',
    tmag: 11.45,
    teff: 5823,
    radius: 1.12,
    crowding: 0.03,
    links: showLinks ? {
      mast: 'https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html?searchQuery=307210830',
      toi: 'https://exofop.ipac.caltech.edu/tess/target.php?id=307210830',
    } : undefined,
  };

  const partialData: StarMetadata = {
    tic: '441420236',
    tmag: 9.87,
    teff: 6142,
    crowding: 0.01,
    links: showLinks ? {
      mast: 'https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html?searchQuery=441420236',
    } : undefined,
  };

  const minimalData: StarMetadata = {
    tic: '123456789',
    tmag: 12.34,
  };

  const currentData = 
    dataCompleteness === 'full' ? fullData :
    dataCompleteness === 'partial' ? partialData :
    minimalData;

  // Additional example stars
  const exampleStars: StarMetadata[] = [
    {
      tic: '260647166',
      tmag: 10.23,
      teff: 5456,
      radius: 0.98,
      crowding: 0.02,
      links: {
        mast: 'https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html?searchQuery=260647166',
        toi: 'https://exofop.ipac.caltech.edu/tess/target.php?id=260647166',
      },
    },
    {
      tic: '238855987',
      tmag: 8.76,
      teff: 6890,
      radius: 1.45,
      crowding: 0.005,
      links: {
        mast: 'https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html?searchQuery=238855987',
        toi: 'https://exofop.ipac.caltech.edu/tess/target.php?id=238855987',
      },
    },
    {
      tic: '150428135',
      tmag: 13.12,
      teff: 4234,
      radius: 0.67,
      crowding: 0.08,
      links: {
        mast: 'https://mast.stsci.edu/portal/Mashup/Clients/Mast/Portal.html?searchQuery=150428135',
      },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ⭐ StarMetaCard Demo
        </h1>
        <p className="text-amber-100">
          Compact stellar metadata display with catalog links
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Configuration
        </h2>
        
        <div className="space-y-4">
          {/* Data Completeness */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Completeness
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setDataCompleteness('full')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dataCompleteness === 'full'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Full Data
              </button>
              <button
                onClick={() => setDataCompleteness('partial')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dataCompleteness === 'partial'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Partial Data
              </button>
              <button
                onClick={() => setDataCompleteness('minimal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dataCompleteness === 'minimal'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Minimal Data
              </button>
            </div>
          </div>

          {/* Show Links Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showLinks"
              checked={showLinks}
              onChange={(e) => setShowLinks(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="showLinks" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show catalog links
            </label>
          </div>
        </div>
      </div>

      {/* Main Demo Card */}
      <div className="max-w-md mx-auto">
        <StarMetaCard meta={currentData} />
      </div>

      {/* Example Cards Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Example Stars
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {exampleStars.map((star) => (
            <StarMetaCard key={star.tic} meta={star} />
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>✨</span> Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Compact two-column layout</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>External catalog links (MAST, TOI)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Graceful handling of missing data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Proper units and formatting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Dark mode support</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📊</span> Displayed Metrics
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">TIC ID</p>
              <p className="text-gray-600 dark:text-gray-400">TESS Input Catalog identifier</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">T mag</p>
              <p className="text-gray-600 dark:text-gray-400">TESS bandpass magnitude</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">T<sub>eff</sub></p>
              <p className="text-gray-600 dark:text-gray-400">Effective temperature (K)</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Radius</p>
              <p className="text-gray-600 dark:text-gray-400">Stellar radius (solar radii)</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Crowding</p>
              <p className="text-gray-600 dark:text-gray-400">Contamination from nearby stars</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Example */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          📘 Usage Example
        </h3>
        <pre className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-4 text-xs overflow-x-auto">
{`import StarMetaCard from '@/components/StarMetaCard';

<StarMetaCard
  meta={{
    tic: '307210830',
    tmag: 11.45,
    teff: 5823,
    radius: 1.12,
    crowding: 0.03,
    links: {
      mast: 'https://mast.stsci.edu/...',
      toi: 'https://exofop.ipac.caltech.edu/...'
    }
  }}
/>`}
        </pre>
      </div>

      {/* Props Interface */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          🔧 Props Interface
        </h3>
        <pre className="text-xs bg-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`interface StarMetaCardProps {
  meta: {
    tic: string;
    tmag?: number;
    teff?: number;
    radius?: number;
    crowding?: number;
    links?: {
      mast?: string;
      toi?: string;
    };
  };
}`}
        </pre>
      </div>

      {/* Link Destinations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          🔗 External Links
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">M</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">MAST Portal</p>
              <p className="text-gray-600 dark:text-gray-400">
                Mikulski Archive for Space Telescopes - official data archive
              </p>
              <code className="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
                mast.stsci.edu
              </code>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 font-bold">T</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">ExoFOP-TESS</p>
              <p className="text-gray-600 dark:text-gray-400">
                Follow-up Observing Program - TESS Objects of Interest
              </p>
              <code className="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
                exofop.ipac.caltech.edu
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Design Notes */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">
          💡 Design Notes
        </h3>
        <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-400">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Links open in new tab with <code>target=&quot;_blank&quot;</code> and <code>rel=&quot;noopener noreferrer&quot;</code></span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Icons use SVG for crisp rendering at any size</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Hover states provide visual feedback</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Only shows available data fields (graceful degradation)</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Compact design suitable for sidebars or dashboards</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default StarMetaCardDemo;
