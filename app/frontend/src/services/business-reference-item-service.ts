import type { ApiCollectionResponse, BusinessReferenceItem } from '../types/api'
import { apiRequest } from './api-client'

export type CreateBusinessReferenceItemPayload = {
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
  payload: CreateBusinessReferenceItemPayload,
): Promise<BusinessReferenceItem> => {
  return apiRequest<BusinessReferenceItem>(`/businesses/${businessId}/reference_items`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
