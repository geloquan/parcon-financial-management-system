import type { ApiCollectionResponse, Business } from '../types/api'
import { apiRequest } from './api-client'

export type CreateBusinessPayload = {
  name: string
  slug: string
  description?: string
  sales_target?: number
}

export type UpdateBusinessPayload = {
  name: string
  slug: string
  description?: string
  sales_target?: number
}

export const fetchBusinesses = async (): Promise<ApiCollectionResponse<Business>> => {
  return apiRequest<ApiCollectionResponse<Business>>('/businesses')
}

export const createBusiness = async (payload: CreateBusinessPayload): Promise<Business> => {
  return apiRequest<Business>('/businesses', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const updateBusiness = async (businessId: number, payload: UpdateBusinessPayload): Promise<Business> => {
  return apiRequest<Business>(`/businesses/${businessId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
