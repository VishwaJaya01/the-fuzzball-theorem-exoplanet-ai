'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { PeriodogramData } from '@/lib/types';

interface PeriodogramPlotProps {
  data: PeriodogramData;
}

/**
 * PeriodogramPlot Component
 * Shows BLS/TLS power vs. period with peak marked
 */
function PeriodogramPlot({ data }: PeriodogramPlotProps) {
  // Prepare data for recharts
  const plotData = data.period.map((period, index) => ({
    period,
    power: data.power[index],
  }));

  // Sort by period for better visualization
  plotData.sort((a, b) => a.period - b.period);

  // Find peak
  const maxPower = Math.max(...data.power);
  const peakIndex = data.power.indexOf(maxPower);
  const peakPeriod = data.period[peakIndex];

  // Calculate false alarm probability levels (example thresholds)
  const fap1Percent = maxPower * 0.9; // ~1% FAP
  const fap10Percent = maxPower * 0.7; // ~10% FAP

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: {active?: boolean, payload?: Array<{payload: {period: number, power: number}}>}) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Period: {point.period.toFixed(4)} days
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Power: {point.power.toFixed(4)}
          </p>
          {Math.abs(point.period - peakPeriod) < 0.01 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
              ⭐ Peak Period
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const meanPower = data.power.reduce((a, b) => a + b, 0) / data.power.length;
  const minPeriod = Math.min(...data.period);
  const maxPeriodVal = Math.max(...data.period);

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📊</div>
          <div>
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-1">
              {data.method || 'BLS'} Periodogram
            </h4>
            <p className="text-xs text-purple-800 dark:text-purple-400">
              Transit detection power vs. test period. Highest peak indicates most likely orbital period.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Peak Period</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {peakPeriod.toFixed(4)} d
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Max Power</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {maxPower.toFixed(4)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Period Range</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {minPeriod.toFixed(1)}–{maxPeriodVal.toFixed(1)} d
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">SNR</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {(maxPower / meanPower).toFixed(1)}σ
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={plotData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            
            <XAxis
              type="number"
              dataKey="period"
              label={{ 
                value: 'Period (days)', 
                position: 'insideBottom', 
                offset: -10,
                style: { fill: '#6B7280' }
              }}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            
            <YAxis
              type="number"
              dataKey="power"
              label={{ 
                value: 'Detection Power', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#6B7280' }
              }}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(2)}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Peak period line */}
            <ReferenceLine
              x={peakPeriod}
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ 
                value: `Peak: ${peakPeriod.toFixed(4)} d`, 
                position: 'top',
                fill: '#10B981',
                fontSize: 11,
                fontWeight: 'bold'
              }}
            />

            {/* False alarm probability levels */}
            <ReferenceLine
              y={fap1Percent}
              stroke="#F59E0B"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ 
                value: '1% FAP', 
                position: 'right',
                fill: '#F59E0B',
                fontSize: 10
              }}
            />

            <ReferenceLine
              y={fap10Percent}
              stroke="#EF4444"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ 
                value: '10% FAP', 
                position: 'right',
                fill: '#EF4444',
                fontSize: 10
              }}
            />

            {/* Power line */}
            <Line
              type="monotone"
              dataKey="power"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
              name="Detection Power"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-purple-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Power Spectrum</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-green-500 border-dashed border-2 border-green-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Best Period</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-amber-500 border-dashed border-2 border-amber-500"></div>
          <span className="text-gray-700 dark:text-gray-300">1% FAP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-red-500 border-dashed border-2 border-red-500"></div>
          <span className="text-gray-700 dark:text-gray-300">10% FAP</span>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h5 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
          📚 How to Interpret
        </h5>
        <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
          <li>• <strong>Peak:</strong> Most likely orbital period for the planet candidate</li>
          <li>• <strong>FAP Lines:</strong> False Alarm Probability thresholds (lower is better)</li>
          <li>• <strong>SNR:</strong> Signal-to-Noise Ratio. Higher values indicate more confident detections</li>
          <li>• <strong>Multiple Peaks:</strong> May indicate harmonics or multiple planets</li>
        </ul>
      </div>
    </div>
  );
}

export default PeriodogramPlot;
