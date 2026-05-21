import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createStaffDayOff,
  deleteStaffDayOff,
  fetchStaffDayOffs,
  type CreateStaffDayOffPayload,
} from '../services/staff-day-off-service'

export const useStaffDayOffs = (businessId: number | null, dayOffDate?: string) => {
  return useQuery({
    queryKey: ['staff-day-offs', businessId, dayOffDate],
    queryFn: async () => fetchStaffDayOffs(businessId as number, dayOffDate),
    enabled: Boolean(businessId),
  })
}

export const useCreateStaffDayOff = (businessId: number | null, dayOffDate?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateStaffDayOffPayload) => createStaffDayOff(businessId as number, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-day-offs', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-day-offs', businessId, dayOffDate] }),
      ])
    },
  })
}

export const useDeleteStaffDayOff = (businessId: number | null, dayOffDate?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dayOffId: number) => deleteStaffDayOff(businessId as number, dayOffId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-day-offs', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-day-offs', businessId, dayOffDate] }),
      ])
    },
  })
}
