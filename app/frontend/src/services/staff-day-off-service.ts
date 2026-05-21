import type { ApiCollectionResponse, StaffDayOff } from '../types/api'
import { apiRequest } from './api-client'

export type CreateStaffDayOffPayload = {
  staff_id: number
  day_off_date: string
  notes?: string
}

export const fetchStaffDayOffs = async (
  businessId: number,
  dayOffDate?: string,
): Promise<ApiCollectionResponse<StaffDayOff>> => {
  const query = dayOffDate ? `?day_off_date=${encodeURIComponent(dayOffDate)}` : ''
  return apiRequest<ApiCollectionResponse<StaffDayOff>>(`/businesses/${businessId}/staff_day_offs${query}`)
}

export const createStaffDayOff = async (
  businessId: number,
  payload: CreateStaffDayOffPayload,
): Promise<StaffDayOff> => {
  return apiRequest<StaffDayOff>(`/businesses/${businessId}/staff_day_offs`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const deleteStaffDayOff = async (businessId: number, dayOffId: number): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/businesses/${businessId}/staff_day_offs/${dayOffId}`, {
    method: 'DELETE',
  })
}
