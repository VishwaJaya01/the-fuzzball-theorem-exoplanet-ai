/**
 * Example data for quick testing and demonstration
 */

import type { Example } from './types';

export const EXAMPLE_DATA: Example[] = [
  {
    id: 'ex-1',
    label: 'TOI-270 (Confirmed)',
    type: 'tic',
    ticId: '259377017',
    sector: 3,
    description: 'TOI-270: Multi-planet system with confirmed transiting planets',
  },
  {
    id: 'ex-2',
    label: 'WASP-126 b',
    type: 'tic',
    ticId: '277539431',
    sector: 1,
    description: 'WASP-126 b: Known hot Jupiter exoplanet',
  },
  {
    id: 'ex-3',
    label: 'HD 21749',
    type: 'tic',
    ticId: '307210830',
    description: 'HD 21749: System with confirmed sub-Neptune',
  },
  {
    id: 'ex-4',
    label: 'Sample Light Curve',
    type: 'csv',
    fileUrl: '/data/mock/sample-tess-1.json',
    description: 'Example TESS light curve CSV data',
  },
  {
    id: 'ex-5',
    label: 'Pi Mensae',
    type: 'tic',
    ticId: '261136679',
    sector: 1,
    description: 'Pi Mensae: Known exoplanet host star',
  },
];

/**
 * Validate TIC ID format
 */
export function isValidTicId(ticId: string): boolean {
  // TIC IDs are typically 8-9 digit numbers
  const ticPattern = /^\d{8,10}$/;
  return ticPattern.test(ticId);
}

/**
 * Format TIC ID for display
 */
export function formatTicId(ticId: string): string {
  return `TIC ${ticId}`;
}

/**
 * Parse sector number from string
 */
export function parseSector(sector: string | number): number | undefined {
  if (typeof sector === 'number') {
    return sector >= 1 && sector <= 69 ? sector : undefined;
  }
  const parsed = parseInt(sector, 10);
  return !isNaN(parsed) && parsed >= 1 && parsed <= 69 ? parsed : undefined;
}
