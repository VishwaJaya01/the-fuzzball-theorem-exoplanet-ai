'use client';

import React, { useState, useEffect } from 'react';
import type { HeaderProps, ApiStatus } from '@/lib/types';

function Header({ onOpenAbout, onUploadClick }: HeaderProps) {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isOnline: false,
    modelVersion: null,
    lastChecked: null,
  });
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Check API status on mount and periodically
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/health', { method: 'GET' });
        const data = await response.json();
        setApiStatus({
          isOnline: response.ok,
          modelVersion: data.modelVersion || 'v1.0.0',
          lastChecked: new Date(),
        });
      } catch {
        setApiStatus({
          isOnline: false,
          modelVersion: null,
          lastChecked: new Date(),
        });
      }
    };

    checkApiStatus();
    const interval = setInterval(checkApiStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleAboutClick = () => {
    setShowAboutModal(true);
    onOpenAbout();
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: App Name & Tagline */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ExoFind
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Find exoplanet transits in TESS data
            </p>
          </div>

          {/* Center: Status Indicators */}
          <div className="flex items-center gap-4 px-6">
            {/* API Status */}
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  apiStatus.isOnline
                    ? 'bg-green-500 animate-pulse'
                    : 'bg-red-500'
                }`}
                title={apiStatus.isOnline ? 'API Online' : 'API Offline'}
              />
              <span className="text-gray-600 dark:text-gray-400">
                API {apiStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Model Version */}
            {apiStatus.modelVersion && (
              <div className="text-xs text-gray-600 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 pl-4">
                Model: <span className="font-mono font-semibold">{apiStatus.modelVersion}</span>
              </div>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <button
              onClick={handleAboutClick}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-300 dark:border-gray-600"
              title="View help, documentation, and about information"
            >
              <span className="flex items-center gap-2">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Help & Docs
              </span>
            </button>

            <button
              onClick={onUploadClick}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              title="Upload TESS light curve data"
            >
              <span className="flex items-center gap-2">
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload Data
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* About Modal */}
      {showAboutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  About ExoFind
                </h2>
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <section>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    What is ExoFind?
                  </h3>
                  <p>
                    ExoFind is an AI-powered tool for detecting exoplanet transits in TESS
                    (Transiting Exoplanet Survey Satellite) light curve data. Using advanced
                    machine learning models, we help astronomers and researchers identify
                    potential exoplanet candidates.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    How to Use
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Upload your TESS light curve data (CSV format)</li>
                    <li>Our AI model analyzes the data for transit signals</li>
                    <li>Review the results, including confidence scores and visualizations</li>
                    <li>Export or compare multiple analyses</li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    Documentation
                  </h3>
                  <p>
                    For detailed documentation, API references, and examples, visit our{' '}
                    <a
                      href="#"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      documentation page
                    </a>
                    .
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    Model Information
                  </h3>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-sm">
                    <p>
                      <strong>Current Version:</strong> {apiStatus.modelVersion || 'N/A'}
                    </p>
                    <p>
                      <strong>Architecture:</strong> Deep Neural Network with attention mechanism
                    </p>
                    <p>
                      <strong>Training Data:</strong> TESS confirmed exoplanet catalog
                    </p>
                  </div>
                </section>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;