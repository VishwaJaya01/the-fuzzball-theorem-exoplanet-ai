'use client';

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { PhaseFoldData, TransitDetection } from '@/lib/types';

interface PhaseFoldPlotProps {
  data: PhaseFoldData;
  detections?: TransitDetection[];
}

/**
 * PhaseFoldPlot Component
 * Phase-folded light curve showing transit at predicted period
 */
function PhaseFoldPlot({ data, detections }: PhaseFoldPlotProps) {
  // Prepare data for recharts
  const plotData = data.phase.map((phase, index) => ({
    phase,
    flux: data.flux[index],
  }));

  // Sort by phase for better visualization
  plotData.sort((a, b) => a.phase - b.phase);

  // Calculate transit region (typically around phase 0)
  const transitWidth = detections && detections.length > 0
    ? (detections[0].duration / 24) / detections[0].period / 2 // Half-width in phase units
    : 0.05;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: {active?: boolean, payload?: Array<{payload: {phase: number, flux: number}}>}) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Phase: {point.phase.toFixed(4)}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Relative Flux: {point.flux.toFixed(6)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const fluxMean = data.flux.reduce((a, b) => a + b, 0) / data.flux.length;
  const fluxMin = Math.min(...data.flux);

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔄</div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              Phase-Folded at {detections?.[0]?.period.toFixed(4) || 'N/A'} days
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-400">
              All transits overlaid at their predicted orbital phase. Transit occurs near phase 0.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Data Points</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {data.phase.length.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transit Depth</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {((1 - fluxMin) * 1e6).toFixed(0)} ppm
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Duration</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {detections?.[0]?.duration.toFixed(2) || 'N/A'} hrs
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            
            <XAxis
              type="number"
              dataKey="phase"
              domain={[-0.5, 0.5]}
              label={{ 
                value: 'Orbital Phase', 
                position: 'insideBottom', 
                offset: -10,
                style: { fill: '#6B7280' }
              }}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(2)}
            />
            
            <YAxis
              type="number"
              dataKey="flux"
              label={{ 
                value: 'Relative Flux', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#6B7280' }
              }}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(4)}
            />
            
            <Tooltip content={<CustomTooltip />} />

            {/* Transit region highlight */}
            <ReferenceArea
              x1={-transitWidth}
              x2={transitWidth}
              fill="#EF4444"
              fillOpacity={0.1}
              stroke="#EF4444"
              strokeOpacity={0.3}
            />

            {/* Phase 0 line */}
            <ReferenceLine
              x={0}
              stroke="#EF4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: 'Transit Center', 
                position: 'top',
                fill: '#EF4444',
                fontSize: 11
              }}
            />

            {/* Mean flux line */}
            <ReferenceLine
              y={fluxMean}
              stroke="#10B981"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ 
                value: 'Baseline', 
                position: 'right',
                fill: '#10B981',
                fontSize: 11
              }}
            />

            {/* Scatter points */}
            <Scatter
              data={plotData}
              fill="#3B82F6"
              fillOpacity={0.6}
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Data Points</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-red-500 border-dashed border-2 border-red-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Transit Center</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 bg-opacity-20"></div>
          <span className="text-gray-700 dark:text-gray-300">Transit Region</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-green-500 border-dashed border-2 border-green-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Baseline</span>
        </div>
      </div>
    </div>
  );
}

export default PhaseFoldPlot;
