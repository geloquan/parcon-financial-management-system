import type { ApiCollectionResponse, Business } from '../types/api'
import { apiRequest } from './api-client'

export type CreateBusinessPayload = {
  name: string
  slug: string
  description?: string
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
