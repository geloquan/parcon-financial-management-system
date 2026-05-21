import type { ApiCollectionResponse, CompensationRun } from '../types/api'
import { apiRequest } from './api-client'

export type CreateCompensationRunPayload = {
  computation_mode: 'by_days' | 'up_to_date'
  number_of_days?: number
  cutoff_date: string
}

export const fetchCompensationRuns = async (businessId: number): Promise<ApiCollectionResponse<CompensationRun>> => {
  return apiRequest<ApiCollectionResponse<CompensationRun>>(`/businesses/${businessId}/compensation_runs`)
}

export const createCompensationRun = async (
  businessId: number,
  payload: CreateCompensationRunPayload,
): Promise<CompensationRun> => {
  return apiRequest<CompensationRun>(`/businesses/${businessId}/compensation_runs`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
