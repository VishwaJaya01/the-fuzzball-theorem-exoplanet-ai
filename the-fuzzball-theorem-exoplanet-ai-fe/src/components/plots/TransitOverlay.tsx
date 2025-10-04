'use client';

import React from 'react';
import { ReferenceArea } from 'recharts';
import type { TransitDetection } from '@/lib/types';

interface TransitOverlayProps {
  detections: TransitDetection[];
  timeMin: number;
  timeMax: number;
  opacity?: number;
}

/**
 * TransitOverlay Component
 * Renders transit region overlays on light curve plots
 */
function TransitOverlay({ 
  detections, 
  timeMin, 
  timeMax,
  opacity = 0.15
}: TransitOverlayProps) {
  if (!detections || detections.length === 0) {
    return null;
  }

  // For each detection, calculate all transit times within the visible range
  const transitRegions: Array<{ start: number; end: number }> = [];

  detections.forEach((detection) => {
    const { period, epoch, duration } = detection;
    
    // Skip if missing critical data
    if (!period || !epoch || !duration) return;

    const transitHalfDuration = duration / 24 / 2; // Convert hours to days and get half-duration

    // Calculate which transit number we're starting from
    const firstTransitNum = Math.floor((timeMin - epoch) / period);
    const lastTransitNum = Math.ceil((timeMax - epoch) / period);

    // Generate all transits in visible range
    for (let n = firstTransitNum - 1; n <= lastTransitNum + 1; n++) {
      const transitTime = epoch + n * period;
      const startTime = transitTime - transitHalfDuration;
      const endTime = transitTime + transitHalfDuration;

      // Only include if within visible range
      if (endTime >= timeMin && startTime <= timeMax) {
        transitRegions.push({
          start: Math.max(startTime, timeMin),
          end: Math.min(endTime, timeMax)
        });
      }
    }
  });

  return (
    <>
      {transitRegions.map((region, index) => (
        <ReferenceArea
          key={`transit-${index}`}
          x1={region.start}
          x2={region.end}
          fill="#EF4444"
          fillOpacity={opacity}
          stroke="#EF4444"
          strokeOpacity={opacity * 2}
          strokeWidth={1}
        />
      ))}
    </>
  );
}

export default TransitOverlay;
