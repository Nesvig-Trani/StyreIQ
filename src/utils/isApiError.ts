interface ApiError {
  data?: {
    message?: string
    details?: string
  }
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'data' in error
}
