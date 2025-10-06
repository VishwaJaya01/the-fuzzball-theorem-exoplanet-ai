/**
 * API utility functions for ExoFind application
 */

import type { 
  PredictPayload, 
  PredictResult, 
  UploadPreview,
  HealthCheckResponse,
  TransitDetection,
  AnalysisResult
} from './types';

// Use Next.js API routes for localhost, direct backend calls for production
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : '') || 
                    process.env.NEXT_PUBLIC_BACKEND_API_URL_PROD || '';

/**
 * Helper function to create a timeout for fetch requests
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * Helper function to get number from unknown value
 */
function getNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/**
 * Helper function to build detection from backend response
 */
function buildDetectionFromBackend(score: number | undefined, summary: Record<string, unknown> | undefined): TransitDetection | null {
  if (!summary) {
    return null;
  }

  const period = typeof summary.period_days === "number" ? summary.period_days : null;
  const duration = typeof summary.duration_hours === "number" ? summary.duration_hours : null;
  const depth = typeof summary.depth_ppm === "number" ? summary.depth_ppm : null;
  const snr = typeof summary.snr === "number" ? summary.snr : null;

  if (period === null || duration === null || depth === null || snr === null) {
    return null;
  }

  return {
    period,
    duration,
    depth,
    snr,
    epoch: typeof summary.t0_btjd === "number" ? summary.t0_btjd : 0,
    confidence: typeof score === "number" ? score : 0,
  };
}

/**
 * Helper function to build analysis result from backend response (matches Next.js API route logic)
 */
function buildAnalysisResultFromBackend(payload: PredictPayload, backend: Record<string, unknown>): AnalysisResult {
  const detection = buildDetectionFromBackend(
    typeof backend?.score === 'number' ? backend.score : undefined, 
    backend?.summary as Record<string, unknown> | undefined
  );
  const features = (backend?.features ?? {}) as Record<string, unknown>;
  const meta = (backend?.meta ?? {}) as Record<string, unknown>;
  const requestIdValue = meta["request_id"];
  const requestId = typeof requestIdValue === "string" ? requestIdValue : undefined;

  const warnings = Array.isArray(backend?.warnings) ? backend.warnings.map(String) : [];

  return {
    id: requestId ?? `analysis_${Date.now()}`,
    timestamp: new Date().toISOString(),
    target: {
      tic_id: String(backend?.tic_id ?? payload.ticId ?? "CSV_UPLOAD"),
      sector: payload.sector ?? 0,
      magnitude: getNumber(features["tmag"]),
      teff: getNumber(features["teff"]),
      radius: getNumber(features["rad"]),
      crowding: getNumber(features["crowdsap"]),
    },
    detections: detection ? [detection] : [],
    lightCurve: (() => {
      const lc = backend?.lightcurve as { time?: number[]; flux?: number[]; flux_err?: number[] } | undefined;
      const backendTime = Array.isArray(lc?.time) ? lc?.time : undefined;
      const backendFlux = Array.isArray(lc?.flux) ? lc?.flux : undefined;
      const backendFluxErr = Array.isArray(lc?.flux_err) ? lc?.flux_err : undefined;

      if (backendTime && backendFlux) {
        return {
          time: backendTime,
          flux: backendFlux,
          flux_err: backendFluxErr,
        };
      }

      if (payload.source === "csv" && payload.csvData) {
        return {
          time: payload.csvData.time,
          flux: payload.csvData.flux,
          flux_err: payload.csvData.flux_err,
        };
      }

      return { time: [], flux: [] };
    })(),
    status: "completed" as const,
    error: warnings.length ? warnings.join(", ") : undefined,
  };
}

/**
 * Helper function to call production backend directly
 */
async function callProductionBackend(payload: PredictPayload): Promise<Response> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL_PROD || '';
  
  if (payload.source === 'tic' && payload.ticId) {
    const params = new URLSearchParams({ tic_id: payload.ticId });
    if (payload.sector) {
      params.append('sector', payload.sector.toString());
    }
    return fetch(`${backendUrl}/predict/by_tic?${params.toString()}`);
  } else if (payload.source === 'csv' && payload.csvData) {
    const requestBody = {
      time: payload.csvData.time,
      flux: payload.csvData.flux,
      flux_err: payload.csvData.flux_err || null,
      meta: null,
    };
    return fetch(`${backendUrl}/predict/from_lightcurve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } else {
    throw new Error('Invalid payload: missing source or required data');
  }
}

/**
 * Check API health and get model version
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  const hasLocalUrl = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
  
  // Try local first if available, then fallback to production
  if (hasLocalUrl) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        signal: createTimeoutSignal(3000), // 3 second timeout
      });
      if (response.ok) {
        return response.json();
      }
      throw new Error(`Local health check failed with ${response.status}`);
    } catch {
      // Fallback to production
      const prodResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL_PROD}/health`);
      if (!prodResponse.ok) {
        throw new Error('Production health check failed');
      }
      return prodResponse.json();
    }
  } else {
    // Use production directly
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL_PROD}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }
}

/**
 * Predict exoplanet transits from provided data
 */
export async function predictTransits(payload: PredictPayload): Promise<PredictResult> {
  try {
    // Check if we should try local first
    const hasLocalUrl = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
    
    let response: Response;
    
    // Try local first if available, then fallback to production
    if (hasLocalUrl) {
      try {
        // Use Next.js API route for local development
        response = await fetch(`${API_BASE_URL}/api/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          // Add a timeout for faster fallback
          signal: createTimeoutSignal(5000), // 5 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`Local server responded with ${response.status}`);
        }
      } catch {
        // Fallback to production
        response = await callProductionBackend(payload);
      }
    } else {
      // Call production backend directly
      response = await callProductionBackend(payload);
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        id: crypto.randomUUID(),
        status: 'error',
        error: data.detail || data.error || 'Prediction failed',
      };
    }

    // Transform backend response for production calls (direct backend responses have tic_id field)
    if (data.tic_id !== undefined) {
      // This is a direct backend response, transform it using the same logic as Next.js API route
      const analysisResult = buildAnalysisResultFromBackend(payload, data);

      return {
        id: crypto.randomUUID(),
        status: 'success',
        data: analysisResult,
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
 * Note: This uses a mock endpoint and may not be needed in production
 */
export async function fetchTessData(ticId: string, sector?: number): Promise<PredictResult> {
  try {
    const hasLocalUrl = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
    
    let response: Response;
    
    if (hasLocalUrl) {
      try {
        const params = new URLSearchParams({ ticId });
        if (sector) {
          params.append('sector', sector.toString());
        }

        response = await fetch(`${API_BASE_URL}/api/tess?${params.toString()}`, {
          signal: createTimeoutSignal(5000),
        });

        if (!response.ok) {
          throw new Error(`Local TESS endpoint responded with ${response.status}`);
        }
      } catch {
        return {
          id: crypto.randomUUID(),
          status: 'error',
          error: 'TESS data endpoint not available in production mode',
        };
      }
    } else {
      // No direct backend equivalent for TESS endpoint
      return {
        id: crypto.randomUUID(),
        status: 'error',
        error: 'TESS data endpoint not available in production mode',
      };
    }

    const data = await response.json();

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
 * Get model information from the backend
 */
export async function getModelInfo(): Promise<Record<string, unknown>> {
  try {
    // Try local backend first, then fallback to production
    const localUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    const prodUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL_PROD;
    
    if (localUrl) {
      try {
        const response = await fetch(`${localUrl}/model/info`, {
          signal: createTimeoutSignal(3000),
        });
        
        if (response.ok) {
          return response.json();
        }
        throw new Error(`Local model info failed with ${response.status}`);
      } catch {
        // Continue to production fallback
      }
    }
    
    // Fallback to production
    const response = await fetch(`${prodUrl}/model/info`);
    if (!response.ok) {
      throw new Error('Model info request failed');
    }
    return response.json();
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
}

/**
 * Analyze light curve data
 * Note: This is an alias for predictTransits - both use the same backend endpoints
 */
export async function analyzeData(payload: PredictPayload): Promise<PredictResult> {
  // Since /api/analyze just exports the same function as /api/predict,
  // we can reuse the predictTransits function which has proper fallback logic
  return predictTransits(payload);
}
