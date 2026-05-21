import type { ApiCollectionResponse, EtherealSale } from '../types/api'
import { apiRequest } from './api-client'

export type CreateEtherealSalePayload = {
  staff_id?: number
  staff_ids: number[]
  service_cost: number
  discount_percentage: number
  customer_name?: string
  discount_type: string
  service_date: string
  entries?: Array<{
    staff_ids: number[]
    service_cost: number
    discount_percentage: number
    customer_name?: string
    discount_type: string
    service_date: string
  }>
}

export const fetchEtherealSales = async (businessId: number): Promise<ApiCollectionResponse<EtherealSale>> => {
  return apiRequest<ApiCollectionResponse<EtherealSale>>(`/businesses/${businessId}/ethereal_sales`)
}

export const createEtherealSale = async (businessId: number, payload: CreateEtherealSalePayload): Promise<EtherealSale> => {
  return apiRequest<EtherealSale>(`/businesses/${businessId}/ethereal_sales`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
