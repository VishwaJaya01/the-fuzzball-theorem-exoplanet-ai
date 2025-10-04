'use client';

import React from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import type { TessLightCurve, TransitDetection } from '@/lib/types';

interface LightCurvePlotProps {
  data: TessLightCurve;
  title: string;
  detections?: TransitDetection[];
  showErrors?: boolean;
  isFlattened?: boolean;
}

/**
 * LightCurvePlot Component
 * Interactive light curve visualization with zoom and hover
 */
function LightCurvePlot({ 
  data, 
  detections, 
  showErrors = false,
  isFlattened = false 
}: LightCurvePlotProps) {
  // Prepare data for recharts
  const plotData = data.time.map((time, index) => ({
    time,
    flux: data.flux[index],
    flux_err: data.flux_err?.[index] || 0,
  }));

  // Calculate transit regions from detections
  const transitRegions: Array<{ start: number; end: number }> = [];
  
  if (detections && detections.length > 0) {
    const detection = detections[0];
    const period = detection.period;
    const duration = detection.duration / 24; // Convert hours to days
    const epoch = detection.epoch || 0;

    // Find all transits in the time range
    const minTime = Math.min(...data.time);
    const maxTime = Math.max(...data.time);
    
    let transitTime = epoch;
    while (transitTime < minTime) {
      transitTime += period;
    }
    
    while (transitTime <= maxTime) {
      transitRegions.push({
        start: transitTime - duration / 2,
        end: transitTime + duration / 2,
      });
      transitTime += period;
    }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: {active?: boolean, payload?: Array<{payload: {time: number, flux: number, flux_err: number}}>}) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Time: {point.time.toFixed(4)} BJD
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Flux: {point.flux.toFixed(6)}
            {showErrors && point.flux_err > 0 && (
              <span className="text-xs text-gray-500 ml-1">
                ± {point.flux_err.toFixed(6)}
              </span>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate flux statistics
  const fluxMean = data.flux.reduce((a, b) => a + b, 0) / data.flux.length;
  const fluxStd = Math.sqrt(
    data.flux.reduce((sum, val) => sum + Math.pow(val - fluxMean, 2), 0) / data.flux.length
  );

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Data Points</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {data.time.length.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Time Span</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {(Math.max(...data.time) - Math.min(...data.time)).toFixed(2)} days
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Mean Flux</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {fluxMean.toFixed(4)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Std Dev</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {fluxStd.toFixed(6)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={plotData}
            margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            
            <XAxis
              dataKey="time"
              label={{ 
                value: 'Time (BJD)', 
                position: 'insideBottom', 
                offset: -10,
                style: { fill: '#6B7280' }
              }}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(2)}
            />
            
            <YAxis
              label={{ 
                value: isFlattened ? 'Relative Flux' : 'Flux', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#6B7280' }
              }}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(4)}
            />
            
            <Tooltip content={<CustomTooltip />} />

            {/* Transit regions as reference areas */}
            {transitRegions.map((region, index) => (
              <ReferenceLine
                key={`transit-${index}`}
                segment={[{ x: region.start, y: 0 }, { x: region.end, y: 0 }]}
                stroke="#3B82F6"
                strokeOpacity={0.2}
                strokeWidth={10}
              />
            ))}

            {/* Main line */}
            <Line
              type="monotone"
              dataKey="flux"
              stroke="#3B82F6"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />

            {/* Mean line */}
            <ReferenceLine
              y={fluxMean}
              stroke="#10B981"
              strokeDasharray="5 5"
              strokeWidth={1}
              label={{ 
                value: 'Mean', 
                position: 'right',
                fill: '#10B981',
                fontSize: 11
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {detections && detections.length > 0 && (
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-600"></div>
            <span className="text-gray-700 dark:text-gray-300">Light Curve</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-green-500 border-dashed border-2 border-green-500"></div>
            <span className="text-gray-700 dark:text-gray-300">Mean Flux</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 bg-opacity-20"></div>
            <span className="text-gray-700 dark:text-gray-300">Transit Regions</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LightCurvePlot;
