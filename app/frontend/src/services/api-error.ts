import type { ApiError } from '../types/api'

export type ApiFieldErrors = Record<string, string[]>

export class ApiRequestError extends Error {
  status: number
  fieldErrors: ApiFieldErrors

  constructor(message: string, status: number, fieldErrors: ApiFieldErrors = {}) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

const normalizeFieldErrors = (errors?: ApiError['errors']): ApiFieldErrors => {
  if (!errors || typeof errors !== 'object') return {}

  return Object.entries(errors).reduce<ApiFieldErrors>((accumulator, [field, messages]) => {
    if (Array.isArray(messages)) {
      accumulator[field] = messages.map((message) => String(message))
    }

    return accumulator
  }, {})
}

export const createApiRequestError = (errorPayload: ApiError, status: number): ApiRequestError => {
  const fieldErrors = normalizeFieldErrors(errorPayload.errors)
  const firstFieldError = Object.values(fieldErrors).find((messages) => messages.length > 0)?.[0]
  const message = firstFieldError ?? errorPayload.message ?? 'Request failed.'

  return new ApiRequestError(message, status, fieldErrors)
}

export const getErrorMessage = (error: unknown, fallback = 'Request failed.'): string => {
  if (error instanceof ApiRequestError) {
    return error.message.trim() || fallback
  }

  if (error instanceof Error) {
    return error.message.trim() || fallback
  }

  return fallback
}

export const getFieldErrorsFor = (error: unknown, field: string): string[] => {
  if (!(error instanceof ApiRequestError)) {
    return []
  }

  return error.fieldErrors[field] ?? []
}

export const getAllFieldErrors = (error: unknown): Array<[string, string[]]> => {
  if (!(error instanceof ApiRequestError)) {
    return []
  }

  return Object.entries(error.fieldErrors).filter(([, messages]) => messages.length > 0)
}
