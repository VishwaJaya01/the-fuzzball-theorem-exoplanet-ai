import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.BACKEND_API_URL_PROD || "";


/**
 * Health check endpoint that proxies the FastAPI backend status
 */
export async function GET() {
  try {
    const [healthRes, versionRes] = await Promise.all([
      fetch(`${BACKEND_API_URL}/health`, { cache: "no-store" }),
      fetch(`${BACKEND_API_URL}/version`, { cache: "no-store" }),
    ]);

    if (!healthRes.ok) {
      throw new Error(`Backend health check failed with status ${healthRes.status}`);
    }

    const healthData = await healthRes.json();
    const versionData = versionRes.ok ? await versionRes.json() : null;

    return NextResponse.json({
      status: "ok",
      isOnline: Boolean(healthData?.ok),
      modelVersion: versionData?.model ?? null,
      timestamp: new Date().toISOString(),
      backend: {
        url: BACKEND_API_URL,
        mode: versionData?.mode ?? null,
        model: versionData?.model ?? null,
        isProbability: versionData?.is_probability ?? false,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        isOnline: false,
        modelVersion: null,
        timestamp: new Date().toISOString(),
        error: message,
      },
      { status: 503 },
    );
  }
}
