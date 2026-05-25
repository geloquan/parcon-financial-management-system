import type { ApiCollectionResponse, Expense } from '../types/api'
import { apiRequest } from './api-client'

export type CreateExpensePayload = {
  date_issued: string
  amount: number
  description: string
  purpose: 'business' | 'business_portfolio' | 'service'
  recurrence_reference?: string
  proof?: File | null
  reauth_username: string
  reauth_password: string
}

export const fetchExpenses = async (businessId: number): Promise<ApiCollectionResponse<Expense>> => {
  return apiRequest<ApiCollectionResponse<Expense>>(`/businesses/${businessId}/expenses`)
}

export const createExpense = async (businessId: number, payload: CreateExpensePayload): Promise<Expense> => {
  const formData = new FormData()
  formData.set('date_issued', payload.date_issued)
  formData.set('amount', String(payload.amount))
  formData.set('description', payload.description)
  formData.set('purpose', payload.purpose)
  formData.set('recurrence_reference', payload.recurrence_reference ?? '')
  formData.set('reauth_username', payload.reauth_username)
  formData.set('reauth_password', payload.reauth_password)

  if (payload.proof) {
    formData.set('proof', payload.proof)
  }

  return apiRequest<Expense>(`/businesses/${businessId}/expenses`, {
    method: 'POST',
    body: formData,
  })
}
