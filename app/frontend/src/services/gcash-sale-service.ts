import type { ApiCollectionResponse, GcashSale } from '../types/api'
import { apiRequest } from './api-client'
import type { ReauthPayload } from './staff-service'

export type CreateGcashSalePayload = {
  transaction_recipient?: string
  amount_moved: number
  sales_amount: number
  transaction_type: 'cash_in' | 'cash_out'
  transaction_date: string
  reauth_username: string
  reauth_password: string
}

export const fetchGcashSales = async (businessId: number): Promise<ApiCollectionResponse<GcashSale>> => {
  return apiRequest<ApiCollectionResponse<GcashSale>>(`/businesses/${businessId}/gcash_sales`)
}

export const createGcashSale = async (businessId: number, payload: CreateGcashSalePayload): Promise<GcashSale> => {
  return apiRequest<GcashSale>(`/businesses/${businessId}/gcash_sales`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const deleteGcashSale = async (
  businessId: number,
  saleId: number,
  reauth: ReauthPayload,
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/businesses/${businessId}/gcash_sales/${saleId}`, {
    method: 'DELETE',
    body: JSON.stringify(reauth),
  })
}
