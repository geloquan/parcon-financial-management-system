import type { ApiCollectionResponse, EtherealSale } from '../types/api'
import { apiRequest } from './api-client'
import type { ReauthPayload } from './staff-service'

export type EtherealSaleEntryPayload = {
  staff_ids: number[]
  service_name?: string
  reference_item_name?: string
  reference_item_original_price?: number
  service_cost: number
  discount_percentage: number
  customer_name?: string
  discount_type: string
  service_date: string
  reauth_username?: string
  reauth_password?: string
}

export type CreateEtherealSalePayload = EtherealSaleEntryPayload & {
  staff_id?: number
  reauth_username: string
  reauth_password: string
  entries?: EtherealSaleEntryPayload[]
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

export const deleteEtherealSale = async (
  businessId: number,
  saleId: number,
  reauth: ReauthPayload,
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/businesses/${businessId}/ethereal_sales/${saleId}`, {
    method: 'DELETE',
    body: JSON.stringify(reauth),
  })
}
