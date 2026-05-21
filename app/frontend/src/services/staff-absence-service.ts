import type { ApiCollectionResponse, StaffAbsence } from '../types/api'
import { apiRequest } from './api-client'

export type CreateStaffAbsencePayload = {
  staff_id: number
  absence_date: string
  notes?: string
}

export const fetchStaffAbsences = async (
  businessId: number,
  absenceDate?: string,
): Promise<ApiCollectionResponse<StaffAbsence>> => {
  const query = absenceDate ? `?absence_date=${encodeURIComponent(absenceDate)}` : ''
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
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/businesses/${businessId}/staff_absences/${absenceId}`, {
    method: 'DELETE',
  })
}
