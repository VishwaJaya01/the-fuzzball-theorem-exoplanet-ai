"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import Papa from "papaparse";
import { predictTransits } from "@/lib/api";
import type {
  InputPanelProps,
  PredictPayload,
  UploadPreview,
  Example,
} from "@/lib/types";

function InputPanel({ onPredict, onUploadFile, examples }: InputPanelProps) {
  // State management
  const [ticId, setTicId] = useState("");
  const [sector, setSector] = useState<number | "">("");
  const [uploadPreview, setUploadPreview] = useState<UploadPreview | null>(
    null
  );
  const [csvDataFull, setCsvDataFull] = useState<
    PredictPayload["csvData"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTic, setIsFetchingTic] = useState(false);
  const [activeTab, setActiveTab] = useState<"tic" | "csv">("tic");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate CSV schema
  const validateCsvData = (
    data: Array<Record<string, string | number | null>>
  ): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (!data || data.length === 0) {
      errors.push("CSV file is empty");
      return { isValid: false, errors };
    }

    const firstRow = data[0];
    const columns = Object.keys(firstRow);

    // Check for required columns
    if (!columns.includes("time")) {
      errors.push('Missing required column: "time"');
    }
    if (!columns.includes("flux")) {
      errors.push('Missing required column: "flux"');
    }

    // Validate data types
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (typeof row.time !== "number" || isNaN(row.time as number)) {
        errors.push(`Invalid time value at row ${i + 1}`);
        break;
      }
      if (typeof row.flux !== "number" || isNaN(row.flux as number)) {
        errors.push(`Invalid flux value at row ${i + 1}`);
        break;
      }
    }

    if (data.length < 200) {
      errors.push("At least 200 rows are required for analysis");
    }

    return { isValid: errors.length === 0, errors };
  };

  // Handle CSV file upload
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as Array<
          Record<string, string | number | null>
        >;
        const validation = validateCsvData(data);
        const columns = Object.keys(data[0] || {});

        const timeValues: number[] = [];
        const fluxValues: number[] = [];
        const fluxErrValues: number[] = [];
        let includeFluxErr = true;

        data.forEach((row) => {
          const timeVal =
            typeof row.time === "number" ? row.time : Number(row.time);
          const fluxVal =
            typeof row.flux === "number" ? row.flux : Number(row.flux);

          if (!Number.isFinite(timeVal) || !Number.isFinite(fluxVal)) {
            includeFluxErr = false;
            return;
          }

          timeValues.push(timeVal);
          fluxValues.push(fluxVal);

          if (row.flux_err === null || row.flux_err === undefined) {
            includeFluxErr = false;
            return;
          }

          const errVal =
            typeof row.flux_err === "number"
              ? row.flux_err
              : Number(row.flux_err);
          if (Number.isFinite(errVal)) {
            fluxErrValues.push(errVal);
          } else {
            includeFluxErr = false;
          }
        });

        const fullCsvData = {
          time: timeValues,
          flux: fluxValues,
          flux_err:
            includeFluxErr && fluxErrValues.length === timeValues.length
              ? fluxErrValues
              : undefined,
        };

        setCsvDataFull(validation.isValid ? fullCsvData : null);

        const preview: UploadPreview = {
          fileName: file.name,
          rowCount: data.length,
          columns,
          preview: data.slice(0, Math.min(10, data.length)),
          isValid: validation.isValid,
          errors: validation.errors,
        };

        setUploadPreview(preview);

        // Call the onUploadFile callback
        if (onUploadFile) {
          try {
            await onUploadFile(file);
          } catch {
            // Handle file upload error silently
          }
        }

        setIsLoading(false);
      },
      error: (error) => {
        setCsvDataFull(null);
        setUploadPreview({
          fileName: file.name,
          rowCount: 0,
          columns: [],
          preview: [],
          isValid: false,
          errors: [`Parse error: ${error.message}`],
        });
        setIsLoading(false);
      },
    });
  };

  // Handle TIC fetch
  const handleFetchTic = async () => {
    if (!ticId) return;

    setIsFetchingTic(true);
    try {
      const predictor = onPredict ?? predictTransits;
      const payload: PredictPayload = {
        ticId,
        sector: sector || undefined,
        source: "tic",
      };

      await predictor(payload);
    } catch {
      // Handle TIC fetch error silently
    } finally {
      setIsFetchingTic(false);
    }
  };

  // Handle predict button click
  const handlePredict = async () => {
    const predictor = onPredict ?? predictTransits;

    setIsLoading(true);
    try {
      let payload: PredictPayload;

      if (activeTab === "tic" && ticId) {
        payload = {
          ticId,
          sector: sector || undefined,
          source: "tic",
        };
      } else if (activeTab === "csv" && uploadPreview?.isValid && csvDataFull) {
        payload = {
          csvData: csvDataFull,
          source: "csv",
        };
      } else {
        return;
      }

      await predictor(payload);
    } catch {
      // Handle prediction error silently
    } finally {
      setIsLoading(false);
    }
  };

  // Handle example selection
  const handleExampleClick = (example: Example) => {
    if (example.type === "tic" && example.ticId) {
      setTicId(example.ticId);
      setSector(example.sector || "");
      setActiveTab("tic");
    } else if (example.type === "csv" && example.fileUrl) {
      // Fetch and load example CSV
      fetch(example.fileUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `${example.label}.csv`, {
            type: "text/csv",
          });
          const fakeEvent = {
            target: { files: [file] },
          } as unknown as ChangeEvent<HTMLInputElement>;
          handleFileChange(fakeEvent);
          setActiveTab("csv");
        });
    }
  };

  // Check if predict button should be enabled
  const isPredictEnabled = () => {
    if (activeTab === "tic") {
      return ticId.trim() !== "";
    }
    return Boolean(uploadPreview?.isValid && csvDataFull);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6 w-full space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Input Data
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter a TIC ID or upload your own light curve data
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("tic")}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === "tic"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          TIC ID
        </button>
        <button
          onClick={() => setActiveTab("csv")}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === "csv"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          Upload CSV
        </button>
      </div>

      {/* TIC Input Tab */}
      {activeTab === "tic" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {/* TIC ID Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                TIC ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ticId}
                onChange={(e) => setTicId(e.target.value)}
                placeholder="e.g., 307210830"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Sector Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sector (Optional)
              </label>
              <select
                value={sector}
                onChange={(e) =>
                  setSector(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sectors</option>
                {Array.from({ length: 69 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>
                    Sector {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Sample TIC ID Chips */}
          <div className="col-span-full mt-2 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 flex items-center h-7">
              Sample TIC IDs:
            </span>
            {["307210830", "148673433"].map((sample) => (
              <button
                key={sample}
                type="button"
                className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                onClick={() => setTicId(sample)}
              >
                #{sample}
              </button>
            ))}
          </div>

          {/* Fetch Lightcurve Button */}
          {ticId && (
            <button
              onClick={handleFetchTic}
              disabled={isFetchingTic}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400
                       bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetchingTic ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Fetching...
                </>
              ) : (
                <>
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Fetch Light Curve
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* CSV Upload Tab */}
      {activeTab === "csv" && (
        <div className="space-y-4 w-full">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8
                     hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer
                     bg-gray-50 dark:bg-gray-700/50 overflow-x-auto w-full"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center text-center">
              <svg
                className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                CSV file with columns: time, flux, flux_err (optional)
              </p>
            </div>
          </div>

          {/* Upload Preview */}
          {uploadPreview && (
            <div className="space-y-3 overflow-x-auto w-full">
              {/* File Info */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-8 h-8 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {uploadPreview.fileName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {uploadPreview.rowCount} rows •{" "}
                      {uploadPreview.columns.join(", ")}
                    </p>
                  </div>
                </div>
                {uploadPreview.isValid ? (
                  <span
                    className="px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 
                                 bg-green-100 dark:bg-green-900/30 rounded"
                  >
                    Valid
                  </span>
                ) : (
                  <span
                    className="px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 
                                 bg-red-100 dark:bg-red-900/30 rounded"
                  >
                    Invalid
                  </span>
                )}
              </div>

              {/* Validation Errors */}
              {uploadPreview.errors && uploadPreview.errors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
                    Validation Errors:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                    {uploadPreview.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Data Preview */}
              {uploadPreview.isValid && uploadPreview.preview.length > 0 && (
                <div className="overflow-x-auto">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview (first 10 rows):
                  </p>
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        {uploadPreview.columns.map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {uploadPreview.preview.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          {uploadPreview.columns.map((col) => (
                            <td
                              key={col}
                              className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono"
                            >
                              {typeof row[col] === "number"
                                ? (row[col] as number).toFixed(6)
                                : String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Example Chips */}
      {examples && examples.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Try an example:
          </p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => handleExampleClick(example)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300
                         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                         rounded-full transition-colors border border-gray-300 dark:border-gray-600
                         flex items-center gap-1.5"
                title={example.description}
              >
                {example.type === "tic" ? (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
                {example.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Predict Button */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePredict}
          disabled={!isPredictEnabled() || isLoading}
          className="w-full px-6 py-3 text-base font-semibold text-white bg-blue-600 
                   hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600
                   rounded-lg transition-colors shadow-sm hover:shadow-md
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm
                   flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
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
              Predict Transits
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default InputPanel;
