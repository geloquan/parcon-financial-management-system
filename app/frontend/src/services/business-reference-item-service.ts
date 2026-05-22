import type { ApiCollectionResponse, BusinessReferenceItem } from '../types/api'
import { apiRequest } from './api-client'
import type { ReauthPayload } from './staff-service'

export type BusinessReferenceItemPayload = {
  item_type: 'product' | 'service'
  name: string
  price: number
  description?: string
}

export const fetchBusinessReferenceItems = async (businessId: number): Promise<ApiCollectionResponse<BusinessReferenceItem>> => {
  return apiRequest<ApiCollectionResponse<BusinessReferenceItem>>(`/businesses/${businessId}/reference_items`)
}

export const createBusinessReferenceItem = async (
  businessId: number,
  payload: BusinessReferenceItemPayload,
): Promise<BusinessReferenceItem> => {
  return apiRequest<BusinessReferenceItem>(`/businesses/${businessId}/reference_items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const updateBusinessReferenceItem = async (
  businessId: number,
  itemId: number,
  payload: BusinessReferenceItemPayload & ReauthPayload,
): Promise<BusinessReferenceItem> => {
  return apiRequest<BusinessReferenceItem>(`/businesses/${businessId}/reference_items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const deleteBusinessReferenceItem = async (
  businessId: number,
  itemId: number,
  payload: ReauthPayload,
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/businesses/${businessId}/reference_items/${itemId}`, {
    method: 'DELETE',
    body: JSON.stringify(payload),
  })
}
