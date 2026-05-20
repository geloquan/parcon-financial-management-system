import type { ApiCollectionResponse, CapitalMovement } from '../types/api'
import { apiRequest } from './api-client'

export type CreatePortfolioCapitalMovementPayload = {
  amount: number
  direction: 'add' | 'deduct' | 'transfer'
  target_business_id?: number
  occurred_on: string
  notes?: string
  reauth_username: string
  reauth_password: string
}

export type CreateBusinessCapitalMovementPayload = {
  amount: number
  direction: 'add' | 'deduct'
  occurred_on: string
  notes?: string
}

export const fetchCapitalMovements = async (): Promise<ApiCollectionResponse<CapitalMovement>> => {
  return apiRequest<ApiCollectionResponse<CapitalMovement>>('/capital/movements')
}

export const createPortfolioCapitalMovement = async (
  payload: CreatePortfolioCapitalMovementPayload,
): Promise<CapitalMovement> => {
  return apiRequest<CapitalMovement>('/portfolio_capital/movements', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const createBusinessCapitalMovement = async (
  businessId: number,
  payload: CreateBusinessCapitalMovementPayload,
): Promise<CapitalMovement> => {
  return apiRequest<CapitalMovement>(`/businesses/${businessId}/capital/movements`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
