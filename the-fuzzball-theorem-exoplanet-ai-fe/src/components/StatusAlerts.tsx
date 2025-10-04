'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { StatusAlertsProps, LoadingStep } from '@/lib/types';

/**
 * StatusAlerts Component
 * Displays loading states, progress, and error messages
 * with subtle animations and toast-like notifications
 */
function StatusAlerts({ 
  status, 
  message, 
  progress, 
  details,
  onDismiss 
}: StatusAlertsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Manage visibility with animations
  useEffect(() => {
    if (status !== 'idle') {
      setShouldRender(true);
      // Delay to trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Remove from DOM after animation
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [status]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setShouldRender(false);
      onDismiss?.();
    }, 300);
  }, [onDismiss]);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, handleDismiss]);

  // Don't render if idle and animation is complete
  if (!shouldRender) return null;

  // Get status configuration
  const getStatusConfig = () => {
    switch (status) {
      case 'fetching':
        return {
          icon: '📡',
          color: 'blue',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-300',
          iconBg: 'bg-blue-100 dark:bg-blue-900/40',
          defaultMessage: 'Fetching light curve data...',
        };
      case 'processing':
        return {
          icon: '⚙️',
          color: 'indigo',
          bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
          borderColor: 'border-indigo-200 dark:border-indigo-800',
          textColor: 'text-indigo-800 dark:text-indigo-300',
          iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
          defaultMessage: 'Processing data...',
        };
      case 'analyzing':
        return {
          icon: '🔍',
          color: 'purple',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          textColor: 'text-purple-800 dark:text-purple-300',
          iconBg: 'bg-purple-100 dark:bg-purple-900/40',
          defaultMessage: 'Running BLS/TLS analysis...',
        };
      case 'scoring':
        return {
          icon: '📊',
          color: 'violet',
          bgColor: 'bg-violet-50 dark:bg-violet-900/20',
          borderColor: 'border-violet-200 dark:border-violet-800',
          textColor: 'text-violet-800 dark:text-violet-300',
          iconBg: 'bg-violet-100 dark:bg-violet-900/40',
          defaultMessage: 'Calculating confidence scores...',
        };
      case 'success':
        return {
          icon: '✅',
          color: 'green',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-300',
          iconBg: 'bg-green-100 dark:bg-green-900/40',
          defaultMessage: 'Analysis complete!',
        };
      case 'error':
        return {
          icon: '❌',
          color: 'red',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-300',
          iconBg: 'bg-red-100 dark:bg-red-900/40',
          defaultMessage: 'An error occurred',
        };
      case 'warning':
        return {
          icon: '⚠️',
          color: 'yellow',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-300',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
          defaultMessage: 'Warning',
        };
      default:
        return {
          icon: 'ℹ️',
          color: 'gray',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-800 dark:text-gray-300',
          iconBg: 'bg-gray-100 dark:bg-gray-900/40',
          defaultMessage: 'Processing...',
        };
    }
  };

  const config = getStatusConfig();
  const displayMessage = message || config.defaultMessage;
  const showSpinner = ['fetching', 'processing', 'analyzing', 'scoring'].includes(status);

  return (
    <div
      className={`fixed top-20 right-4 z-40 max-w-md transition-all duration-300 ease-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg overflow-hidden backdrop-blur-sm`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 ${config.iconBg} rounded-lg p-2 text-xl`}>
              {showSpinner ? (
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <span>{config.icon}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${config.textColor}`}>
                {displayMessage}
              </p>
              
              {details && (
                <p className={`text-xs mt-1 ${config.textColor} opacity-80`}>
                  {details}
                </p>
              )}

              {/* Progress Bar */}
              {typeof progress === 'number' && progress >= 0 && progress <= 100 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={config.textColor}>Progress</span>
                    <span className={`font-medium ${config.textColor}`}>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 bg-${config.color}-600`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            {(status === 'success' || status === 'error' || status === 'warning') && (
              <button
                onClick={handleDismiss}
                className={`flex-shrink-0 ${config.textColor} hover:opacity-70 transition-opacity`}
                aria-label="Dismiss"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StatusBar Component with Loading Steps
 * Shows a detailed breakdown of processing steps
 */
export function StatusBar({ 
  status, 
  message,
  progress 
}: StatusAlertsProps) {
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: 'fetch', label: 'Fetch Data', status: 'pending' },
    { id: 'process', label: 'Process Light Curve', status: 'pending' },
    { id: 'analyze', label: 'Run BLS/TLS', status: 'pending' },
    { id: 'score', label: 'Calculate Scores', status: 'pending' },
  ]);

  useEffect(() => {
    // Update steps based on status
    const statusMap: Record<string, number> = {
      'idle': -1,
      'fetching': 0,
      'processing': 1,
      'analyzing': 2,
      'scoring': 3,
      'success': 4,
      'error': -1,
    };

    const currentStep = statusMap[status] ?? -1;

    setSteps(prevSteps =>
      prevSteps.map((step, index) => {
        if (index < currentStep) {
          return { ...step, status: 'complete' };
        } else if (index === currentStep) {
          return { ...step, status: 'active', message };
        } else if (status === 'error' && index === currentStep) {
          return { ...step, status: 'error', message };
        } else {
          return { ...step, status: 'pending' };
        }
      })
    );
  }, [status, message]);

  if (status === 'idle') return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3">
            {/* Step Indicator */}
            <div className="flex-shrink-0">
              {step.status === 'complete' ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : step.status === 'active' ? (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : step.status === 'error' ? (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600" />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                step.status === 'active' 
                  ? 'text-blue-600 dark:text-blue-400'
                  : step.status === 'complete'
                  ? 'text-green-600 dark:text-green-400'
                  : step.status === 'error'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.label}
              </p>
              {step.message && step.status === 'active' && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {step.message}
                </p>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`absolute left-7 mt-10 w-0.5 h-6 ${
                step.status === 'complete' 
                  ? 'bg-green-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`} style={{ marginTop: '6px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      {typeof progress === 'number' && progress >= 0 && progress <= 100 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton Loader Component
 * Subtle loading placeholder for content
 */
export function SkeletonLoader({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Inline Status Badge
 * Small status indicator for compact spaces
 */
export function StatusBadge({ status, message }: { status: StatusAlertsProps['status']; message?: string }) {
  const getConfig = () => {
    switch (status) {
      case 'fetching':
      case 'processing':
      case 'analyzing':
      case 'scoring':
        return {
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
          icon: '⏳',
        };
      case 'success':
        return {
          color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
          icon: '✓',
        };
      case 'error':
        return {
          color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
          icon: '✗',
        };
      case 'warning':
        return {
          color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
          icon: '!',
        };
      default:
        return {
          color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
          icon: '•',
        };
    }
  };

  const config = getConfig();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span>{config.icon}</span>
      {message && <span>{message}</span>}
    </span>
  );
}

export default StatusAlerts;
