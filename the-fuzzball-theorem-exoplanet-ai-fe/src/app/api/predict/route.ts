import { NextResponse } from 'next/server';
import type { PredictPayload } from '@/lib/types';

/**
 * Predict endpoint for exoplanet transit prediction
 * Takes light curve data and predicts potential exoplanet transits
 */
export async function POST(request: Request) {
  try {
    const payload: PredictPayload = await request.json();

    // Validate payload
    if (!payload.source) {
      return NextResponse.json(
        { error: 'Missing required field: source' },
        { status: 400 }
      );
    }

    if (payload.source === 'tic' && !payload.ticId) {
      return NextResponse.json(
        { error: 'TIC ID is required for TESS data source' },
        { status: 400 }
      );
    }

    if (payload.source === 'csv' && !payload.csvData) {
      return NextResponse.json(
        { error: 'CSV data is required for CSV source' },
        { status: 400 }
      );
    }

    // Mock prediction result for now
    // In production, this would call your ML model backend
    const mockResult = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      target: {
        tic_id: payload.ticId || 'CSV_UPLOAD',
        sector: payload.sector || 0,
      },
      detections: [
        {
          period: 3.5,
          epoch: 2458000.5,
          duration: 2.5,
          depth: 0.01,
          confidence: 0.85,
          snr: 12.5,
        },
      ],
      lightCurve: {
        time: payload.csvData?.time || [],
        flux: payload.csvData?.flux || [],
        flux_err: payload.csvData?.flux_err,
      },
      status: 'completed' as const,
    };

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Prediction failed' },
      { status: 500 }
    );
  }
}
