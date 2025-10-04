'use client';

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import LightCurvePlot from './plots/LightCurvePlot';
import PhaseFoldPlot from './plots/PhaseFoldPlot';
import PeriodogramPlot from './plots/PeriodogramPlot';
import type { PlotsPanelProps } from '@/lib/types';
import { showSuccess, showError } from '@/lib/toast';

type PlotTab = 'raw' | 'flattened' | 'phaseFold' | 'periodogram';

/**
 * PlotsPanel Component
 * Displays interactive plots with tabs for different visualizations
 */
function PlotsPanel({ 
  raw, 
  flattened, 
  phaseFolded, 
  periodogram,
  detections 
}: PlotsPanelProps) {
  const [activeTab, setActiveTab] = useState<PlotTab>('raw');
  const [isExporting, setIsExporting] = useState(false);
  const plotRef = useRef<HTMLDivElement>(null);

  // Tab configuration
  const tabs = [
    { id: 'raw' as PlotTab, label: 'Raw Light Curve', icon: '📊', available: true },
    { id: 'flattened' as PlotTab, label: 'Flattened', icon: '📉', available: !!flattened },
    { id: 'phaseFold' as PlotTab, label: 'Phase Folded', icon: '🔄', available: !!phaseFolded },
    { id: 'periodogram' as PlotTab, label: 'Periodogram', icon: '📈', available: !!periodogram },
  ];

  // Export plot as PNG
  const handleExportPNG = async () => {
    if (!plotRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(plotRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        logging: false,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `exofind-${activeTab}-plot-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showSuccess('Plot exported as PNG!');
        }
      });
    } catch (error) {
      showError('Failed to export plot');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Get current plot title and description
  const getPlotInfo = () => {
    switch (activeTab) {
      case 'raw':
        return {
          title: 'Raw Light Curve',
          description: 'Unprocessed TESS photometry showing flux vs time',
        };
      case 'flattened':
        return {
          title: 'Flattened Light Curve',
          description: 'Detrended light curve with stellar variability removed',
        };
      case 'phaseFold':
        return {
          title: 'Phase-Folded Light Curve',
          description: 'Light curve folded at the detected orbital period',
        };
      case 'periodogram':
        return {
          title: 'Periodogram',
          description: 'BLS/TLS power spectrum showing periodic signals',
        };
      default:
        return { title: '', description: '' };
    }
  };

  const plotInfo = getPlotInfo();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {plotInfo.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {plotInfo.description}
            </p>
          </div>
          
          {/* Export Button */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.available && setActiveTab(tab.id)}
              disabled={!tab.available}
              className={`
                relative min-w-0 flex-1 px-6 py-4 text-sm font-medium whitespace-nowrap
                transition-colors duration-200
                ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                    : tab.available
                    ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                }
              `}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
              {!tab.available && (
                <span className="absolute top-2 right-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                  N/A
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Plot Content */}
      <div ref={plotRef} className="p-6 bg-white dark:bg-gray-800">
        {activeTab === 'raw' && (
          <LightCurvePlot
            data={raw}
            title="Raw Light Curve"
            detections={detections}
            showErrors={!!raw.flux_err}
          />
        )}

        {activeTab === 'flattened' && flattened && (
          <LightCurvePlot
            data={flattened}
            title="Flattened Light Curve"
            detections={detections}
            showErrors={!!flattened.flux_err}
            isFlattened={true}
          />
        )}

        {activeTab === 'phaseFold' && phaseFolded && (
          <PhaseFoldPlot
            data={phaseFolded}
            detections={detections}
          />
        )}

        {activeTab === 'periodogram' && periodogram && (
          <PeriodogramPlot data={periodogram} />
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              📍 Hover over points for details
            </span>
            <span>
              🔍 Scroll to zoom
            </span>
            {(activeTab === 'raw' || activeTab === 'flattened') && (
              <span>
                🎯 Transit regions highlighted
              </span>
            )}
          </div>
          <span>
            {raw.time.length} data points
          </span>
        </div>
      </div>
    </div>
  );
}

export default PlotsPanel;
