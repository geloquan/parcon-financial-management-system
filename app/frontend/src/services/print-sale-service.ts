import type { ApiCollectionResponse, PrintSale } from '../types/api'
import { apiRequest } from './api-client'

export type CreatePrintSalePayload = {
  job_type: string
  description: string
  color_mode: 'black' | 'white'
  print_size: string
  paper_count: number
  sales_amount: number
  sale_date: string
  entries?: Array<{
    job_type: string
    description: string
    color_mode: 'black' | 'white'
    print_size: string
    paper_count: number
    sales_amount: number
    sale_date: string
  }>
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
