import { NextResponse } from "next/server";
import type { AnalysisResult, PredictPayload, TransitDetection } from "@/lib/types";

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:7860";

interface BackendPrediction {
  tic_id?: number | string;
  score?: number;
  summary?: Record<string, unknown>;
  features?: Record<string, unknown>;
  warnings?: unknown;
  meta?: Record<string, unknown>;
  lightcurve?: {
    time?: number[];
    flux?: number[];
    flux_err?: number[];
  };
}

function buildDetection(score: number | undefined, summary: Record<string, unknown> | undefined): TransitDetection | null {
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

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function buildAnalysisResult(payload: PredictPayload, backend: BackendPrediction): AnalysisResult {
  const detection = buildDetection(backend?.score, backend?.summary ?? undefined);
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
    status: "completed",
    error: warnings.length ? warnings.join(", ") : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const payload: PredictPayload = await request.json();

    if (!payload.source) {
      return NextResponse.json(
        { error: "Missing required field: source" },
        { status: 400 },
      );
    }

    if (payload.source === "tic" && !payload.ticId) {
      return NextResponse.json(
        { error: "TIC ID is required for TESS data source" },
        { status: 400 },
      );
    }

    if (payload.source === "csv") {
      if (!payload.csvData) {
        return NextResponse.json(
          { error: "CSV data is required for CSV source" },
          { status: 400 },
        );
      }
      if (payload.csvData.time.length !== payload.csvData.flux.length) {
        return NextResponse.json(
          { error: "Time and flux arrays must have matching lengths" },
          { status: 400 },
        );
      }
      if (payload.csvData.flux_err && payload.csvData.flux_err.length !== payload.csvData.time.length) {
        return NextResponse.json(
          { error: "flux_err must have the same length as time" },
          { status: 400 },
        );
      }
      if (payload.csvData.time.length < 200) {
        return NextResponse.json(
          { error: "Provide at least 200 samples for analysis" },
          { status: 422 },
        );
      }
    }

    let response: Response;
    if (payload.source === "tic" && payload.ticId) {
      const params = new URLSearchParams({ tic_id: payload.ticId });
      response = await fetch(`${BACKEND_API_URL}/predict/by_tic?${params.toString()}`, {
        cache: "no-store",
      });
    } else {
      response = await fetch(`${BACKEND_API_URL}/predict/from_lightcurve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          time: payload.csvData?.time ?? [],
          flux: payload.csvData?.flux ?? [],
          flux_err: payload.csvData?.flux_err,
        }),
      });
    }

    const backendBody = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        typeof backendBody?.detail === "string"
          ? backendBody.detail
          : typeof backendBody?.error === "string"
          ? backendBody.error
          : Array.isArray(backendBody?.detail)
          ? backendBody.detail.join(", ")
          : "Prediction failed";

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status },
      );
    }

    if (!backendBody || typeof backendBody !== "object") {
      return NextResponse.json(
        { error: "Malformed response from backend" },
        { status: 500 },
      );
    }

    const analysis = buildAnalysisResult(payload, backendBody as BackendPrediction);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prediction failed" },
      { status: 500 },
    );
  }
}
