/**
 * Toast notification utilities
 * Convenience functions for showing different types of toast messages
 */

import toast from 'react-hot-toast';

/**
 * Show a success toast
 */
export function showSuccess(message: string, duration?: number) {
  return toast.success(message, { duration });
}

/**
 * Show an error toast
 */
export function showError(message: string, duration?: number) {
  return toast.error(message, { duration });
}

/**
 * Show a loading toast
 */
export function showLoading(message: string) {
  return toast.loading(message);
}

/**
 * Show a custom toast
 */
export function showToast(message: string, duration?: number) {
  return toast(message, { duration });
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId: string) {
  toast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  toast.dismiss();
}

/**
 * Show a promise toast with loading/success/error states
 */
export function showPromiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) {
  return toast.promise(promise, messages);
}

/**
 * Common error messages
 */
export const ErrorMessages = {
  NO_DATA: 'No data available',
  INVALID_FILE: 'Invalid file format. Please upload a valid CSV file.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timeout. Please try again.',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Validation error. Please check your input.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

/**
 * Common success messages
 */
export const SuccessMessages = {
  UPLOAD_SUCCESS: 'File uploaded successfully!',
  ANALYSIS_COMPLETE: 'Analysis completed successfully!',
  DATA_FETCHED: 'Data fetched successfully!',
  SAVE_SUCCESS: 'Saved successfully!',
  DELETE_SUCCESS: 'Deleted successfully!',
} as const;

/**
 * Get friendly error message
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map common error messages to user-friendly versions
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return ErrorMessages.NETWORK_ERROR;
    }
    if (error.message.includes('timeout')) {
      return ErrorMessages.TIMEOUT;
    }
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return ErrorMessages.UNAUTHORIZED;
    }
    if (error.message.includes('404') || error.message.includes('not found')) {
      return ErrorMessages.NOT_FOUND;
    }
    if (error.message.includes('500') || error.message.includes('server')) {
      return ErrorMessages.SERVER_ERROR;
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return ErrorMessages.VALIDATION_ERROR;
    }
    
    // Return the original message if it's user-friendly
    return error.message;
  }
  
  return ErrorMessages.UNKNOWN_ERROR;
}

/**
 * Show error with automatic friendly message conversion
 */
export function showFriendlyError(error: unknown, fallbackMessage?: string) {
  const message = fallbackMessage || getFriendlyErrorMessage(error);
  return showError(message);
}
