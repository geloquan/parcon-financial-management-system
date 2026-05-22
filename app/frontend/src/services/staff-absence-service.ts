import type { ApiCollectionResponse, StaffAbsence } from '../types/api'
import { apiRequest } from './api-client'
import type { ReauthPayload } from './staff-service'

export type CreateStaffAbsencePayload = {
  staff_id: number
  absent_on: string
  notes?: string
}

export const fetchStaffAbsences = async (
  businessId: number,
  absentOn?: string,
): Promise<ApiCollectionResponse<StaffAbsence>> => {
  const query = absentOn ? `?absent_on=${encodeURIComponent(absentOn)}` : ''
  return apiRequest<ApiCollectionResponse<StaffAbsence>>(`/businesses/${businessId}/staff_absences${query}`)
}

export const createStaffAbsence = async (
  businessId: number,
  payload: CreateStaffAbsencePayload,
): Promise<StaffAbsence> => {
  return apiRequest<StaffAbsence>(`/businesses/${businessId}/staff_absences`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const deleteStaffAbsence = async (
  businessId: number,
  absenceId: number,
  reauth: ReauthPayload,
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/businesses/${businessId}/staff_absences/${absenceId}`, {
    method: 'DELETE',
    body: JSON.stringify(reauth),
  })
}
