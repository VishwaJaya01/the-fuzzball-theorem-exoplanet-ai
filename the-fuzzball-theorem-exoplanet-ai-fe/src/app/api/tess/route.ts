import { NextResponse } from "next/server";
import { pythonBridge } from "@/lib/python-bridge";

/**
 * TESS endpoint for fetching TESS light curve data
 * Retrieves data from preprocessed TESS archive by TIC ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticId = searchParams.get("ticId");
    const sector = searchParams.get("sector");

    // Validate required parameters
    if (!ticId) {
      return NextResponse.json(
        { error: "TIC ID is required" },
        { status: 400 }
      );
    }

    // Load real TESS data from preprocessed files
    let lightCurveData;
    let starMeta = null;

    try {
      lightCurveData = await pythonBridge.loadLightCurveData(ticId);
      if (!lightCurveData) {
        return NextResponse.json(
          { error: `No TESS light curve data found for TIC ${ticId}` },
          { status: 404 }
        );
      }

      // Try to get star metadata
      starMeta = await pythonBridge.getStarMetadata(ticId);
    } catch (error) {
      console.error("Data loading error:", error);
      return NextResponse.json(
        {
          error: `Failed to load TESS data for TIC ${ticId}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }

    const tessData = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      target: {
        tic_id: ticId,
        sector: sector ? parseInt(sector) : starMeta?.sector || 1,
        ra: starMeta?.ra,
        dec: starMeta?.dec,
        magnitude: starMeta?.tmag || starMeta?.magnitude,
        teff: starMeta?.teff,
        radius: starMeta?.rad || starMeta?.radius,
        crowding: starMeta?.crowdsap || starMeta?.crowding,
      },
      lightCurve: lightCurveData,
      detections: [],
      status: "completed" as const,
      metadata: starMeta,
    };

    return NextResponse.json(tessData);
  } catch (error) {
    console.error("TESS data fetch error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch TESS data",
      },
      { status: 500 }
    );
  }
}
