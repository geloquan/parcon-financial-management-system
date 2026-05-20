import type { ApiCollectionResponse, GcashSale } from '../types/api'
import { apiRequest } from './api-client'

export type CreateGcashSalePayload = {
  transaction_recipient: string
  amount_moved: number
  sales_amount: number
  profit_amount: number
  transaction_type: 'cash_in' | 'cash_out'
  transaction_date: string
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
