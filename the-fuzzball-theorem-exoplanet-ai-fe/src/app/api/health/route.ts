import { NextResponse } from "next/server";
import { join } from "path";
import { readFileSync, existsSync, readdirSync } from "fs";

/**
 * Health check endpoint for API status monitoring
 * Returns real API status and model version information
 */
export async function GET() {
  try {
    // Check model files availability
    const projectRoot = join(process.cwd(), "..");
    const modelDir = join(projectRoot, "data", "model");

    let modelVersion = "unknown";
    let modelStatus = "unavailable";
    let modelMode = "unknown";

    try {
      const latestFile = join(modelDir, "latest.txt");
      if (existsSync(latestFile)) {
        const latest = readFileSync(latestFile, "utf-8").trim();
        modelVersion = latest.split("_").slice(1).join("_").replace(".pkl", "");
        modelStatus = "loaded";

        // Check model mode from metrics file
        const metricsFile = join(modelDir, `metrics_${modelVersion}.json`);
        if (existsSync(metricsFile)) {
          const metrics = JSON.parse(readFileSync(metricsFile, "utf-8"));
          modelMode = metrics.mode || "unknown";
        }
      }
    } catch (_error) {
      console.warn("Model check failed:", _error);
      modelStatus = "error";
    }

    // Check data availability
    let dataStatus = "available";
    const dataCounts = { features: 0, processed: 0 };

    try {
      const interimDir = join(projectRoot, "data", "interim", "features");
      const processedDir = join(projectRoot, "data", "processed");

      if (existsSync(interimDir)) {
        const files = readdirSync(interimDir);
        dataCounts.features = files.filter((f: string) =>
          f.endsWith(".parquet")
        ).length;
      }

      if (existsSync(processedDir)) {
        dataCounts.processed = readdirSync(processedDir).length;
      }

      if (dataCounts.features === 0 && dataCounts.processed === 0) {
        dataStatus = "no_data";
      }
    } catch (_error) {
      dataStatus = "error";
    }

    // Check Python availability
    let pythonStatus = "available";
    try {
      const { spawn } = await import("child_process");
      const python = spawn("python", ["--version"], { stdio: "pipe" });
      python.on("error", () => {
        pythonStatus = "unavailable";
      });
    } catch (_error) {
      pythonStatus = "error";
    }

    const overallStatus =
      modelStatus === "loaded" &&
      dataStatus === "available" &&
      pythonStatus === "available"
        ? "ok"
        : "degraded";

    return NextResponse.json({
      status: overallStatus,
      isOnline: true,
      modelVersion: modelVersion,
      timestamp: new Date().toISOString(),
      services: {
        api: "healthy",
        ml_model: modelStatus,
        data_service: dataStatus,
        python: pythonStatus,
      },
      details: {
        modelMode: modelMode,
        dataFiles: dataCounts,
        projectRoot: projectRoot,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        isOnline: false,
        modelVersion: null,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        services: {
          api: "error",
          ml_model: "unavailable",
          data_service: "unavailable",
          python: "unknown",
        },
      },
      { status: 503 }
    );
  }
}
