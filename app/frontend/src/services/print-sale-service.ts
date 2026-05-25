import type { ApiCollectionResponse, PrintSale } from '../types/api'
import { apiRequest } from './api-client'
import type { ReauthPayload } from './staff-service'

export type PrintSaleEntryPayload = {
  job_type: string
  description: string
  reference_item_name?: string
  reference_item_original_price?: number
  color_mode: 'black' | 'white'
  print_size: string
  paper_count: number
  sales_amount: number
  is_debt?: boolean
  charged_amount?: number
  remarks?: string
  sale_date: string
  reauth_username?: string
  reauth_password?: string
}

export type CreatePrintSalePayload = PrintSaleEntryPayload & {
  reauth_username: string
  reauth_password: string
  entries?: PrintSaleEntryPayload[]
}

export const fetchPrintSales = async (businessId: number): Promise<ApiCollectionResponse<PrintSale>> => {
  return apiRequest<ApiCollectionResponse<PrintSale>>(`/businesses/${businessId}/print_sales`)
}

export const createPrintSale = async (businessId: number, payload: CreatePrintSalePayload): Promise<PrintSale> => {
  return apiRequest<PrintSale>(`/businesses/${businessId}/print_sales`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const deletePrintSale = async (
  businessId: number,
  saleId: number,
  reauth: ReauthPayload,
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/businesses/${businessId}/print_sales/${saleId}`, {
    method: 'DELETE',
    body: JSON.stringify(reauth),
  })
}
