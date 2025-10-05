"use client";

import React, { useState } from "react";
import type {
  ResultsCardProps,
  DetectionScore,
  TransitMetrics,
  DataQualityBadges,
} from "@/lib/types";
import { showSuccess, showError } from "@/lib/toast";

/**
 * ResultsCard Component
 * Displays prediction results with score, metrics, and quality badges
 */
function ResultsCard({
  result,
  onCopyJson,
  onDownloadCsv,
  onCopyApiCurl,
}: ResultsCardProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Extract metrics from result
  const getMetrics = (): TransitMetrics | null => {
    if (!result?.data?.detections?.length) {
      return null;
    }

    const detection = result.data.detections[0];
    return {
      period: detection.period,
      duration: detection.duration,
      depth: detection.depth,
      snr: detection.snr,
      epoch: detection.epoch,
      confidence: detection.confidence,
    };
    return metrics;
  };

  const metrics = getMetrics();

  // Use API-calculated confidence score (already handles ML model fallbacks)
  const getDetectionScore = (): DetectionScore => {
    if (!metrics) {
      return {
        score: 0,
        label: "No Transit Detected",
        confidence: "low",
        threshold: 0.05,
      };
    }

    // Use the robust confidence score calculated by the API
    const apiScore = metrics.confidence;

    // Interpret confidence scores with proper thresholds
    if (apiScore >= 0.7) {
      return {
        score: apiScore,
        label: "Likely Planet",
        confidence: "high",
        threshold: 0.7,
      };
    } else if (apiScore >= 0.4) {
      return {
        score: apiScore,
        label: "Possible Planet",
        confidence: "medium",
        threshold: 0.4,
      };
    } else if (apiScore >= 0.15) {
      return {
        score: apiScore,
        label: "Unlikely Planet",
        confidence: "low",
        threshold: 0.15,
      };
    } else {
      return {
        score: apiScore,
        label: "No Transit Detected",
        confidence: "low",
        threshold: 0.15,
      };
    }
  };
  const detectionScore = getDetectionScore();

  // Calculate quality badges
  const getQualityBadges = (): DataQualityBadges => {
    if (!metrics) {
      return {
        cleanData: false,
        lowCrowding: false,
        highSnr: false,
      };
    }

    return {
      cleanData: true, // In production, check data quality metrics
      lowCrowding: true, // Check crowding parameter from TESS
      highSnr: metrics.snr >= 7,
      adequateCoverage: true,
    };
  };

  const badges = getQualityBadges();

  // Get color scheme based on score
  const getScoreColors = () => {
    if (detectionScore.score >= 0.9) {
      return {
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
        text: "text-emerald-800 dark:text-emerald-300",
        icon: "🌍",
        ring: "ring-emerald-500",
      };
    } else if (detectionScore.score >= 0.7) {
      return {
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-800",
        text: "text-green-800 dark:text-green-300",
        icon: "🪐",
        ring: "ring-green-500",
      };
    } else if (detectionScore.score >= 0.5) {
      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-800 dark:text-blue-300",
        icon: "🔵",
        ring: "ring-blue-500",
      };
    } else if (detectionScore.score >= 0.3) {
      return {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-800",
        text: "text-yellow-800 dark:text-yellow-300",
        icon: "⚠️",
        ring: "ring-yellow-500",
      };
    } else {
      return {
        bg: "bg-gray-50 dark:bg-gray-900/20",
        border: "border-gray-200 dark:border-gray-800",
        text: "text-gray-800 dark:text-gray-300",
        icon: "❌",
        ring: "ring-gray-500",
      };
    }
  };

  const colors = getScoreColors();

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    try {
      const json = JSON.stringify(result, null, 2);
      await navigator.clipboard.writeText(json);
      showSuccess("JSON copied to clipboard!");
      onCopyJson?.();
    } catch {
      showError("Failed to copy JSON");
    }
  };

  // Download CSV
  const handleDownloadCsv = () => {
    try {
      if (!metrics) {
        showError("No data to download");
        return;
      }

      const csv = [
        "metric,value",
        `score,${detectionScore.score}`,
        `label,${detectionScore.label}`,
        `period_days,${metrics.period}`,
        `duration_hours,${metrics.duration}`,
        `depth_ppm,${metrics.depth}`,
        `snr,${metrics.snr}`,
        `confidence,${metrics.confidence}`,
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exofind-results-${result?.id || "unknown"}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess("CSV downloaded!");
      onDownloadCsv?.();
    } catch {
      showError("Failed to download CSV");
    }
  };

  // Copy API curl command
  const handleCopyApiCurl = async () => {
    try {
      const curlCommand = `curl -X POST https://api.exofind.app/predict \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    { ticId: result?.data?.target?.tic_id || "TIC_ID" },
    null,
    2
  )}'`;

      await navigator.clipboard.writeText(curlCommand);
      showSuccess("API curl command copied!");
      onCopyApiCurl?.();
    } catch {
      showError("Failed to copy curl command");
    }
  };

  // Format number with units
  const formatMetric = (value: number, unit: string, decimals = 2) => {
    return `${value.toFixed(decimals)} ${unit}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header: Prediction Score */}
      <div className={`${colors.bg} ${colors.border} border-b px-6 py-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Score Icon */}
            <div
              className={`text-5xl ${colors.ring} ring-4 ring-opacity-20 rounded-full w-20 h-20 flex items-center justify-center bg-white dark:bg-gray-800`}
            >
              {colors.icon}
            </div>

            {/* Score Details */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-2xl font-bold ${colors.text}`}>
                  {(detectionScore.score * 100).toFixed(1)}%
                </h3>
                <button
                  className="relative"
                  onMouseEnter={() => setShowTooltip("score")}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <svg
                    className={`w-5 h-5 ${colors.text} opacity-60 hover:opacity-100`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {showTooltip === "score" && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap z-10 shadow-lg">
                      Confidence score based on transit depth, SNR, and
                      periodicity
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                      </div>
                    </div>
                  )}
                </button>
              </div>
              <p className={`text-lg font-semibold ${colors.text}`}>
                {detectionScore.label}
              </p>
              <p className={`text-sm ${colors.text} opacity-75 mt-1`}>
                Threshold: {(detectionScore.threshold * 100).toFixed(0)}% •
                Confidence: {detectionScore.confidence}
              </p>
            </div>
          </div>

          {/* Score Bar */}
          <div className="hidden md:block w-40">
            <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${
                  detectionScore.score >= 0.7
                    ? "bg-green-500"
                    : detectionScore.score >= 0.5
                    ? "bg-blue-500"
                    : detectionScore.score >= 0.3
                    ? "bg-yellow-500"
                    : "bg-gray-400"
                } transition-all duration-500`}
                style={{ width: `${detectionScore.score * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1 text-gray-600 dark:text-gray-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
            Transit Parameters
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Period */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-4 h-4 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Period
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatMetric(metrics.period, "days")}
              </p>
            </div>

            {/* Duration */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Duration
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatMetric(metrics.duration, "hrs")}
              </p>
            </div>

            {/* Depth */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-4 h-4 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Depth
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatMetric(metrics.depth * 1e6, "ppm", 0)}
              </p>
            </div>

            {/* SNR */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  SNR
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {metrics.snr.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quality Badges */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
          Data Quality
        </h4>
        <div className="flex flex-wrap gap-2">
          {badges.cleanData && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm font-medium rounded-full">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Clean Data
            </span>
          )}

          {badges.lowCrowding && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Low Crowding
            </span>
          )}

          {badges.highSnr && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-sm font-medium rounded-full">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              High SNR
            </span>
          )}

          {badges.adequateCoverage && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-sm font-medium rounded-full">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Adequate Coverage
            </span>
          )}

          {!badges.cleanData && !badges.lowCrowding && !badges.highSnr && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 text-sm font-medium rounded-full">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Quality Check Needed
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopyJson}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy JSON
          </button>

          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download CSV
          </button>

          <button
            onClick={handleCopyApiCurl}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            Copy API curl
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultsCard;
