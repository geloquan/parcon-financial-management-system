import type { ApiCollectionResponse, CoffeeSale } from '../types/api'
import { apiRequest } from './api-client'

export type CreateCoffeeSalePayload = {
  price: number
  coffee_type: string
  size: string
  add_ons?: string
  sale_date: string
}

export const fetchCoffeeSales = async (businessId: number): Promise<ApiCollectionResponse<CoffeeSale>> => {
  return apiRequest<ApiCollectionResponse<CoffeeSale>>(`/businesses/${businessId}/coffee_sales`)
}

export const createCoffeeSale = async (businessId: number, payload: CreateCoffeeSalePayload): Promise<CoffeeSale> => {
  return apiRequest<CoffeeSale>(`/businesses/${businessId}/coffee_sales`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
