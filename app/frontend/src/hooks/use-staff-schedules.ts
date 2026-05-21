import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createStaffSchedule,
  fetchStaffSchedules,
  type CreateStaffSchedulePayload,
  swapStaffSchedules,
  type SwapStaffSchedulesPayload,
  type UpdateStaffSchedulePayload,
  updateStaffSchedule,
} from '../services/staff-schedule-service'

export const useStaffSchedules = (businessId: number | null, scheduledOn?: string) => {
  return useQuery({
    queryKey: ['staff-schedules', businessId, scheduledOn],
    queryFn: async () => fetchStaffSchedules(businessId as number, scheduledOn),
    enabled: Boolean(businessId),
  })
}

export const useCreateStaffSchedule = (businessId: number | null, scheduledOn?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateStaffSchedulePayload) => createStaffSchedule(businessId as number, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-schedules', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-schedules', businessId, scheduledOn] }),
      ])
    },
  })
}

export const useUpdateStaffSchedule = (businessId: number | null, scheduledOn?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ scheduleId, payload }: { scheduleId: number; payload: UpdateStaffSchedulePayload }) =>
      updateStaffSchedule(businessId as number, scheduleId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-schedules', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-schedules', businessId, scheduledOn] }),
      ])
    },
  })
}

export const useSwapStaffSchedules = (businessId: number | null, scheduledOn?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SwapStaffSchedulesPayload) => swapStaffSchedules(businessId as number, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-schedules', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-schedules', businessId, scheduledOn] }),
      ])
    },
  })
}
