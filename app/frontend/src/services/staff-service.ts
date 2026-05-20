import type { ApiCollectionResponse, Staff } from '../types/api'
import { apiRequest } from './api-client'

export type CreateStaffPayload = {
  full_name: string
  age: number
  employment_start_date: string
  employment_end_date?: string
  employment_type: string
  salary: number
  is_active: boolean
}

export const fetchStaff = async (businessId: number): Promise<ApiCollectionResponse<Staff>> => {
  return apiRequest<ApiCollectionResponse<Staff>>(`/businesses/${businessId}/staff`)
}

export const createStaff = async (businessId: number, payload: CreateStaffPayload): Promise<Staff> => {
  return apiRequest<Staff>(`/businesses/${businessId}/staff`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
