import type { ApiError } from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'

export const getStoredToken = (): string => localStorage.getItem('parcon_api_token') ?? ''

export const setStoredToken = (token: string): void => {
  localStorage.setItem('parcon_api_token', token)
}

export const clearStoredToken = (): void => {
  localStorage.removeItem('parcon_api_token')
}

export const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> => {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')

  const authToken = token ?? getStoredToken()
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let parsedError: ApiError = { message: 'Request failed.' }

    try {
      parsedError = (await response.json()) as ApiError
    } catch {
      parsedError = { message: 'Request failed.' }
    }

    const firstFieldError = parsedError.errors
      ? Object.values(parsedError.errors).find((messages) => Array.isArray(messages) && messages.length > 0)?.[0]
      : undefined

    throw new Error(firstFieldError ?? parsedError.message)
  }

  return (await response.json()) as T
}
