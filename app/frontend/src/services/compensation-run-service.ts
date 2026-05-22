import type { ApiCollectionResponse, CompensationRun } from '../types/api'
import { apiRequest } from './api-client'

export type CreateCompensationRunPayload = {
  computation_mode: 'today' | 'specific_date'
  cutoff_date?: string
}

export type FinalizeCompensationRunPayload = {
  reauth_username: string
  reauth_password: string
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

export const finalizeCompensationRun = async (
  businessId: number,
  runId: number,
  payload: FinalizeCompensationRunPayload,
): Promise<CompensationRun> => {
  return apiRequest<CompensationRun>(`/businesses/${businessId}/compensation_runs/${runId}/finalize`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
