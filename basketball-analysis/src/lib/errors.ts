/**
 * Error handling utilities for consistent error management across the app
 */

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message)
    this.name = "ValidationError"
  }
}

/**
 * Custom error class for analysis errors
 */
export class AnalysisError extends Error {
  constructor(
    message: string,
    public phase?: string
  ) {
    super(message)
    this.name = "AnalysisError"
  }
}

/**
 * Type guard to check if error is an instance of Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "An unknown error occurred"
}

/**
 * Logs error with context for debugging
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const message = getErrorMessage(error)
  const errorInfo = {
    context,
    message,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  }
  
  console.error(`[${context}]`, errorInfo)
  
  // In production, you could send this to an error tracking service
  if (process.env.NODE_ENV === "production") {
    // sendToErrorTracker(errorInfo)
  }
}

/**
 * Creates a standardized error response for API routes
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage = "An error occurred"
): { success: false; error: string; code?: string } {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
    }
  }
  
  return {
    success: false,
    error: getErrorMessage(error) || defaultMessage,
  }
}

/**
 * Wraps an async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    logError(context, error)
    return fallback
  }
}









