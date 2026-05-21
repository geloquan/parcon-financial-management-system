import type { ApiCollectionResponse, StaffSchedule } from '../types/api'
import { apiRequest } from './api-client'

export type CreateStaffSchedulePayload = {
  staff_id: number
  scheduled_on: string
  attendance_status: 'pending' | 'present' | 'absent'
  notes?: string
}

export type UpdateStaffSchedulePayload = Partial<CreateStaffSchedulePayload>
export type SwapStaffSchedulesPayload = {
  source_schedule_id: number
  target_schedule_id: number
}

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

export const swapStaffSchedules = async (
  businessId: number,
  payload: SwapStaffSchedulesPayload,
): Promise<{
  message: string
  data: {
    source_schedule: StaffSchedule
    target_schedule: StaffSchedule
  }
}> => {
  return apiRequest(`/businesses/${businessId}/staff_schedules/swap`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
