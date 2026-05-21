import type { ApiCollectionResponse, StaffSchedule } from '../types/api'
import { apiRequest } from './api-client'

export type CreateStaffSchedulePayload = {
  staff_id: number
  scheduled_on: string
  attendance_status: 'pending' | 'present' | 'absent'
  notes?: string
}

export type UpdateStaffSchedulePayload = Partial<CreateStaffSchedulePayload>

export const fetchStaffSchedules = async (
  businessId: number,
  scheduledOn?: string,
): Promise<ApiCollectionResponse<StaffSchedule>> => {
  const query = scheduledOn ? `?scheduled_on=${encodeURIComponent(scheduledOn)}` : ''
  return apiRequest<ApiCollectionResponse<StaffSchedule>>(`/businesses/${businessId}/staff_schedules${query}`)
}

export const createStaffSchedule = async (
  businessId: number,
  payload: CreateStaffSchedulePayload,
): Promise<StaffSchedule> => {
  return apiRequest<StaffSchedule>(`/businesses/${businessId}/staff_schedules`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const updateStaffSchedule = async (
  businessId: number,
  scheduleId: number,
  payload: UpdateStaffSchedulePayload,
): Promise<StaffSchedule> => {
  return apiRequest<StaffSchedule>(`/businesses/${businessId}/staff_schedules/${scheduleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
