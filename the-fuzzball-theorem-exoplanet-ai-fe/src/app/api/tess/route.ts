import { NextResponse } from 'next/server';

/**
 * TESS endpoint for fetching TESS light curve data
 * Retrieves data from TESS archive by TIC ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticId = searchParams.get('ticId');
    const sector = searchParams.get('sector');

    // Validate required parameters
    if (!ticId) {
      return NextResponse.json(
        { error: 'TIC ID is required' },
        { status: 400 }
      );
    }

    // Mock TESS data for now
    // In production, this would fetch from MAST or your data service
    const mockTessData = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      target: {
        tic_id: ticId,
        sector: sector ? parseInt(sector) : 1,
        ra: 123.456,
        dec: -45.678,
        magnitude: 12.5,
        teff: 5500,
        radius: 1.0,
      },
      lightCurve: {
        time: Array.from({ length: 100 }, (_, i) => 2458000 + i * 0.02),
        flux: Array.from({ length: 100 }, (_, i) => 1.0 + 0.001 * Math.sin(i * 0.3)),
        flux_err: Array.from({ length: 100 }, () => 0.0001),
      },
      detections: [],
      status: 'completed' as const,
    };

    return NextResponse.json(mockTessData);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
