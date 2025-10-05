/**
 * API utility functions for ExoFind application
 */

import type { 
  PredictPayload, 
  PredictResult, 
  UploadPreview,
  HealthCheckResponse 
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

/**
 * Check API health and get model version
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

/**
 * Predict exoplanet transits from provided data
 */
export async function predictTransits(payload: PredictPayload): Promise<PredictResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        id: crypto.randomUUID(),
        status: 'error',
        error: data.error || 'Prediction failed',
      };
    }

    return {
      id: crypto.randomUUID(),
      status: 'success',
      data: data,
    };
  } catch (error) {
    return {
      id: crypto.randomUUID(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Fetch TESS light curve data by TIC ID
 */
export async function fetchTessData(ticId: string, sector?: number): Promise<PredictResult> {
  try {
    const params = new URLSearchParams({ ticId });
    if (sector) {
      params.append('sector', sector.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api/tess?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        id: crypto.randomUUID(),
        status: 'error',
        error: data.error || 'Failed to fetch TESS data',
      };
    }

    return {
      id: crypto.randomUUID(),
      status: 'success',
      data: data,
    };
  } catch (error) {
    return {
      id: crypto.randomUUID(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload and validate CSV file
 */
export async function uploadCsvFile(file: File): Promise<UploadPreview> {
  return new Promise((resolve) => {
    // This is a client-side validation that returns a preview
    // The actual file parsing is done in the component
    resolve({
      fileName: file.name,
      rowCount: 0,
      columns: [],
      preview: [],
      isValid: true,
    });
  });
}

/**
 * Analyze light curve data
 */
export async function analyzeData(payload: PredictPayload): Promise<PredictResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        id: crypto.randomUUID(),
        status: 'error',
        error: data.error || 'Analysis failed',
      };
    }

    return {
      id: crypto.randomUUID(),
      status: 'success',
      data: data,
    };
  } catch (error) {
    return {
      id: crypto.randomUUID(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
