import { NextResponse } from 'next/server';

/**
 * Health check endpoint for API status monitoring
 * Returns API status and model version information
 */
export async function GET() {
  try {
    // In production, you would check:
    // - Database connectivity
    // - ML model availability
    // - External service dependencies
    
    return NextResponse.json({
      status: 'ok',
      isOnline: true,
      modelVersion: 'v1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        ml_model: 'loaded',
        database: 'connected',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        isOnline: false,
        modelVersion: null,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
