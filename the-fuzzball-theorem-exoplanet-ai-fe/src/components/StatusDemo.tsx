'use client';

import React, { useState } from 'react';
import StatusAlerts, { StatusBar, SkeletonLoader, StatusBadge } from './StatusAlerts';
import { showSuccess, showError, showLoading, dismissToast, showPromiseToast } from '@/lib/toast';
import type { StatusType } from '@/lib/types';

/**
 * Demo component showing all status/alert variations
 * This is for development/testing purposes
 */
export default function StatusDemo() {
  const [alertStatus, setAlertStatus] = useState<StatusType>('idle');
  const [barStatus, setBarStatus] = useState<StatusType>('idle');
  const [message, setMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  // Simulate a full analysis workflow
  const simulateWorkflow = async () => {
    // Step 1: Fetching
    setBarStatus('fetching');
    setMessage('Connecting to TESS archive...');
    setProgress(0);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProgress(25);

    // Step 2: Processing
    setBarStatus('processing');
    setMessage('Cleaning and normalizing data...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProgress(50);

    // Step 3: Analyzing
    setBarStatus('analyzing');
    setMessage('Running Box Least Squares (BLS) algorithm...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProgress(75);

    // Step 4: Scoring
    setBarStatus('scoring');
    setMessage('Calculating confidence metrics...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProgress(100);

    // Complete
    setBarStatus('success');
    setMessage('Analysis complete!');
    setTimeout(() => {
      setBarStatus('idle');
      setProgress(0);
    }, 3000);
  };

  // Show different alert types
  const showAlert = (type: StatusType, msg?: string) => {
    setAlertStatus(type);
    setMessage(msg || `${type} state activated`);
  };

  // Show toast examples
  const showToastExample = (type: 'success' | 'error' | 'loading' | 'promise') => {
    switch (type) {
      case 'success':
        showSuccess('Transit detected with 95% confidence!');
        break;
      case 'error':
        showError('Failed to fetch TESS data. Please try again.');
        break;
      case 'loading':
        const loadingId = showLoading('Analyzing light curve...');
        setTimeout(() => dismissToast(loadingId), 3000);
        break;
      case 'promise':
        const promise = new Promise((resolve, reject) => {
          setTimeout(() => Math.random() > 0.5 ? resolve('Done!') : reject(new Error('Failed')), 2000);
        });
        showPromiseToast(promise, {
          loading: 'Processing data...',
          success: 'Analysis completed successfully!',
          error: 'Analysis failed. Please try again.',
        });
        break;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Status & Alerts Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Demonstration of all status and alert components
        </p>
      </div>

      {/* StatusAlerts Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          StatusAlerts (Toast-style)
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => showAlert('fetching', 'Fetching light curve data from TESS...')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Fetching
            </button>
            <button
              onClick={() => showAlert('processing', 'Processing light curve data...')}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Processing
            </button>
            <button
              onClick={() => showAlert('analyzing', 'Running BLS/TLS analysis...')}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Analyzing
            </button>
            <button
              onClick={() => showAlert('scoring', 'Calculating confidence scores...')}
              className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
            >
              Scoring
            </button>
            <button
              onClick={() => showAlert('success', 'Analysis completed successfully!')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Success
            </button>
            <button
              onClick={() => showAlert('error', 'Network error. Please try again.')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Error
            </button>
            <button
              onClick={() => showAlert('warning', 'Low data quality detected')}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Warning
            </button>
            <button
              onClick={() => setAlertStatus('idle')}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* StatusAlerts Display */}
        <StatusAlerts
          status={alertStatus}
          message={message}
          progress={alertStatus === 'processing' ? progress : undefined}
          onDismiss={() => setAlertStatus('idle')}
        />
      </section>

      {/* StatusBar Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          StatusBar (Step-by-step)
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <button
            onClick={simulateWorkflow}
            disabled={barStatus !== 'idle'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {barStatus === 'idle' ? 'Start Analysis Workflow' : 'Running...'}
          </button>

          {barStatus !== 'idle' && (
            <StatusBar status={barStatus} message={message} progress={progress} />
          )}
        </div>
      </section>

      {/* Toast Notifications */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Toast Notifications (react-hot-toast)
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => showToastExample('success')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Success Toast
            </button>
            <button
              onClick={() => showToastExample('error')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Error Toast
            </button>
            <button
              onClick={() => showToastExample('loading')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Loading Toast
            </button>
            <button
              onClick={() => showToastExample('promise')}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Promise Toast
            </button>
          </div>
        </div>
      </section>

      {/* StatusBadge Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          StatusBadge (Inline indicators)
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-3">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status="fetching" message="Fetching" />
            <StatusBadge status="processing" message="Processing" />
            <StatusBadge status="analyzing" message="Analyzing" />
            <StatusBadge status="scoring" message="Scoring" />
            <StatusBadge status="success" message="Complete" />
            <StatusBadge status="error" message="Failed" />
            <StatusBadge status="warning" message="Warning" />
          </div>
        </div>
      </section>

      {/* SkeletonLoader Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          SkeletonLoader (Loading placeholders)
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <SkeletonLoader lines={3} />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonLoader lines={5} />
            <SkeletonLoader lines={5} />
          </div>
        </div>
      </section>

      {/* Common Error Messages */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Common Error Scenarios
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-3">
          <div className="space-y-2">
            <button
              onClick={() => showError('No data available for TIC 123456789')}
              className="w-full text-left px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              No Data Error
            </button>
            <button
              onClick={() => showError('Invalid file format. Expected CSV with time,flux columns.')}
              className="w-full text-left px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Invalid File Error
            </button>
            <button
              onClick={() => showError('Network error. Please check your connection.')}
              className="w-full text-left px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Network Error
            </button>
            <button
              onClick={() => showError('Server error (500). Please try again later.')}
              className="w-full text-left px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Server Error
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
