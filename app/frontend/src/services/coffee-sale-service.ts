import type { ApiCollectionResponse, CoffeeSale } from '../types/api'
import { apiRequest } from './api-client'
import type { ReauthPayload } from './staff-service'

export type CreateCoffeeSalePayload = {
  price: number
  coffee_type: string
  size: '8oz' | '9oz' | '12oz' | '16oz' | '18oz'
  add_on_price: number
  add_on_description?: string
  sale_date: string
  reauth_username: string
  reauth_password: string
  entries?: Array<{
    price: number
    coffee_type: string
    size: '8oz' | '9oz' | '12oz' | '16oz' | '18oz'
    add_on_price: number
    add_on_description?: string
    sale_date: string
    reauth_username?: string
    reauth_password?: string
  }>
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

export const deleteCoffeeSale = async (
  businessId: number,
  saleId: number,
  reauth: ReauthPayload,
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/businesses/${businessId}/coffee_sales/${saleId}`, {
    method: 'DELETE',
    body: JSON.stringify(reauth),
  })
}
