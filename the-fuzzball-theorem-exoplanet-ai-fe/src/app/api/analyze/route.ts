import { NextResponse } from "next/server";
import type { PredictPayload } from "@/lib/types";
import { pythonBridge } from "@/lib/python-bridge";

/**
 * Analyze endpoint for light curve data analysis
 * Processes light curve data and detects potential exoplanet transits using real ML model
 * This endpoint provides more detailed analysis including BLS features
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

    let lightCurveData;
    let starMeta = null;

    // Get light curve data based on source
    if (payload.source === "tic") {
      if (!payload.ticId) {
        return NextResponse.json(
          { error: "TIC ID is required for TESS data source" },
          { status: 400 }
        );
      }

      // Load from preprocessed data
      try {
        lightCurveData = await pythonBridge.loadLightCurveData(payload.ticId);
        if (!lightCurveData) {
          return NextResponse.json(
            { error: `No light curve data found for TIC ${payload.ticId}` },
            { status: 404 }
          );
        }

        // Try to get star metadata
        starMeta = await pythonBridge.getStarMetadata(payload.ticId);
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
      if (!payload.csvData) {
        return NextResponse.json(
          { error: "CSV data is required for CSV source" },
          { status: 400 }
        );
      }
      lightCurveData = payload.csvData;
    }

    // Run ML model analysis
    let analysis;
    try {
      analysis = await pythonBridge.predictFromLightCurve(
        lightCurveData.time,
        lightCurveData.flux,
        lightCurveData.flux_err,
        starMeta || undefined
      );
    } catch (error) {
      console.error("Model analysis error:", error);
      return NextResponse.json(
        {
          error: `Model analysis failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }

    // Convert analysis output to frontend format
    const detections = [];
    if (analysis.score > 0.1 && analysis.period_days > 0) {
      // Threshold for detection
      detections.push({
        period: analysis.period_days,
        epoch: analysis.t0,
        duration: analysis.duration_hours / 24, // Convert hours to days
        depth: analysis.depth_ppm / 1e6, // Convert ppm to fraction
        confidence: analysis.score,
        snr: analysis.snr,
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
      analysis: {
        score: analysis.score,
        period_days: analysis.period_days,
        duration_hours: analysis.duration_hours,
        depth_ppm: analysis.depth_ppm,
        snr: analysis.snr,
        warnings: analysis.warnings,
        features: analysis.features,
      },
      starMetadata: starMeta,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
