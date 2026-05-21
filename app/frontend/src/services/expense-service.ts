import type { ApiCollectionResponse, Expense } from '../types/api'
import { apiRequest } from './api-client'

export type CreateExpensePayload = {
  date_issued: string
  amount: number
  description: string
  purpose: 'business' | 'business_portfolio' | 'service'
  payment_type: 'one_time' | 'repeat'
  recurrence_reference?: string
  reauth_username: string
  reauth_password: string
}

export const fetchExpenses = async (businessId: number): Promise<ApiCollectionResponse<Expense>> => {
  return apiRequest<ApiCollectionResponse<Expense>>(`/businesses/${businessId}/expenses`)
}

export const createExpense = async (businessId: number, payload: CreateExpensePayload): Promise<Expense> => {
  return apiRequest<Expense>(`/businesses/${businessId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
