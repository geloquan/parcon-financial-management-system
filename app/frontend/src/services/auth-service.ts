import { apiRequest } from './api-client'
import type { User } from '../types/api'

export type LoginPayload = {
  username: string
  password: string
}

export type LoginResponse = {
  token: string
  user: User
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const fetchMe = async (): Promise<User> => {
  return apiRequest<User>('/auth/me')
}

export const logout = async (): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}
