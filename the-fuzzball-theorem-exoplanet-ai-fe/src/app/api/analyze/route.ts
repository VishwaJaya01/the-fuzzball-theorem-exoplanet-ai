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

    // Calculate robust confidence score from BLS parameters
    const calculateRobustConfidence = (
      period: number,
      depth_ppm: number, 
      snr: number,
      duration_hours: number,
      mlScore: number
    ): number => {
      // If ML score is valid and reasonable, use it
      if (mlScore > 0.01 && mlScore <= 1.0) {
        return mlScore;
      }
      
      // Fallback: Calculate confidence from BLS transit parameters
      let confidence = 0;
      
      // Depth contribution (0-0.4)
      const absDepthPpm = Math.abs(depth_ppm);
      if (absDepthPpm > 10000) confidence += 0.4;      // Very deep (>1%)
      else if (absDepthPpm > 5000) confidence += 0.35; // Deep (>0.5%)
      else if (absDepthPpm > 2000) confidence += 0.3;  // Moderate (>0.2%)
      else if (absDepthPpm > 1000) confidence += 0.25; // Shallow (>0.1%)
      else if (absDepthPpm > 500) confidence += 0.15;  // Very shallow (>0.05%)
      else if (absDepthPpm > 200) confidence += 0.1;   // Marginal (>0.02%)
      
      // Period contribution (0-0.25)
      if (period > 0.5 && period < 300) {  // Reasonable period range
        confidence += 0.15;
        if (period > 1 && period < 50) confidence += 0.1; // Optimal range for TESS
      }
      
      // Duration contribution (0-0.2)
      if (duration_hours > 0.1 && duration_hours < 24) {
        confidence += 0.15;
        if (duration_hours > 1 && duration_hours < 12) confidence += 0.05; // Reasonable range
      }
      
      // SNR contribution (0-0.15)
      if (snr > 10) confidence += 0.15;
      else if (snr > 7) confidence += 0.12;
      else if (snr > 5) confidence += 0.1;
      else if (snr > 3) confidence += 0.08;
      else if (snr > 1) confidence += 0.05;
      else if (snr > 0.1) confidence += 0.02;
      
      return Math.min(confidence, 1.0);
    };

    // Convert analysis output to frontend format
    const detections = [];
    // Show detections if we have valid transit parameters
    if (
      analysis.period_days > 0 &&
      analysis.depth_ppm != null &&
      Math.abs(analysis.depth_ppm) > 100
    ) {
      const robustConfidence = calculateRobustConfidence(
        analysis.period_days,
        analysis.depth_ppm,
        analysis.snr || 0,
        analysis.duration_hours || 0,
        analysis.score || 0
      );

      detections.push({
        period: analysis.period_days,
        epoch: analysis.t0 || 0,
        duration: (analysis.duration_hours || 0) / 24, // Convert hours to days
        depth: Math.abs(analysis.depth_ppm) / 1e6, // Convert ppm to fraction, use absolute value
        confidence: robustConfidence,
        snr: analysis.snr || 0,
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
