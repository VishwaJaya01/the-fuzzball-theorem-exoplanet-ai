import { NextResponse } from "next/server";
import type { PredictPayload } from "@/lib/types";
import { pythonBridge } from "@/lib/python-bridge";

/**
 * Predict endpoint for exoplanet transit prediction
 * Takes light curve data and predicts potential exoplanet transits using real ML model
 */
export async function POST(request: Request) {
  try {
    const payload: PredictPayload = await request.json();

    // Validate payload
    if (!payload.source) {
      return NextResponse.json(
        { error: "Missing required field: source" },
        { status: 400 }
      );
    }

    if (payload.source === "tic" && !payload.ticId) {
      return NextResponse.json(
        { error: "TIC ID is required for TESS data source" },
        { status: 400 }
      );
    }

    if (payload.source === "csv" && !payload.csvData) {
      return NextResponse.json(
        { error: "CSV data is required for CSV source" },
        { status: 400 }
      );
    }

    let lightCurveData;
    let starMeta = null;

    // Get light curve data based on source
    if (payload.source === "tic") {
      // Load from preprocessed data
      try {
        lightCurveData = await pythonBridge.loadLightCurveData(payload.ticId!);
        if (!lightCurveData) {
          return NextResponse.json(
            { error: `No light curve data found for TIC ${payload.ticId}` },
            { status: 404 }
          );
        }

        // Try to get star metadata
        starMeta = await pythonBridge.getStarMetadata(payload.ticId!);
      } catch (error) {
        console.error("Data loading error:", error);
        return NextResponse.json(
          {
            error: `Failed to load data for TIC ${payload.ticId}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
          { status: 500 }
        );
      }
    } else {
      // Use uploaded CSV data
      lightCurveData = payload.csvData!;
    }

    // Run ML model prediction
    let prediction;
    try {
      prediction = await pythonBridge.predictFromLightCurve(
        lightCurveData.time,
        lightCurveData.flux,
        lightCurveData.flux_err,
        starMeta || undefined
      );
    } catch (error) {
      console.error("Model prediction error:", error);
      return NextResponse.json(
        {
          error: `Model prediction failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }

    // Convert model output to frontend format
    const detections = [];
    if (prediction.score > 0.1 && prediction.period_days > 0) {
      // Threshold for detection
      detections.push({
        period: prediction.period_days,
        epoch: prediction.t0,
        duration: prediction.duration_hours / 24, // Convert hours to days
        depth: prediction.depth_ppm / 1e6, // Convert ppm to fraction
        confidence: prediction.score,
        snr: prediction.snr,
      });
    }

    const result = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      target: {
        tic_id: payload.ticId || "CSV_UPLOAD",
        sector: payload.sector || 0,
      },
      detections,
      lightCurve: lightCurveData,
      status: "completed" as const,
      modelOutput: {
        score: prediction.score,
        warnings: prediction.warnings,
        features: prediction.features,
      },
      starMetadata: starMeta,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prediction failed" },
      { status: 500 }
    );
  }
}
