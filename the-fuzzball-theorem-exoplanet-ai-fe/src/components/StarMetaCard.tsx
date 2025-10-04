'use client';

import React from 'react';
import type { StarMetaCardProps } from '@/lib/types';

/**
 * StarMetaCard Component
 * Displays stellar metadata in a compact two-column layout
 * Includes links to MAST and TOI catalogs
 */
function StarMetaCard({ meta }: StarMetaCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Star Info
          </h3>
        </div>
        
        {/* External Links */}
        {meta.links && (
          <div className="flex items-center gap-2">
            {meta.links.mast && (
              <a
                href={meta.links.mast}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                title="Open in MAST"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            {meta.links.toi && (
              <a
                href={meta.links.toi}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                title="Open in TOI"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>

      {/* TIC ID - Full Width */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">TIC ID</p>
        <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
          {meta.tic}
        </p>
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tmag */}
        {meta.tmag !== undefined && (
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">T mag</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {meta.tmag.toFixed(2)}
            </p>
          </div>
        )}

        {/* Teff */}
        {meta.teff !== undefined && (
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">T<sub>eff</sub></p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {meta.teff.toLocaleString()} K
            </p>
          </div>
        )}

        {/* Radius */}
        {meta.radius !== undefined && (
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Radius</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {meta.radius.toFixed(2)} R<sub>☉</sub>
            </p>
          </div>
        )}

        {/* Crowding */}
        {meta.crowding !== undefined && (
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Crowding</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {(meta.crowding * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Footer Note */}
      {meta.links && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Click icons above to view in catalogs
          </p>
        </div>
      )}
    </div>
  );
}

export default StarMetaCard;
