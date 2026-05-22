import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createStaffDayOff,
  deleteStaffDayOff,
  fetchStaffDayOffs,
  type CreateStaffDayOffPayload,
} from '../services/staff-day-off-service'
import type { ReauthPayload } from '../services/staff-service'
import type { ApiCollectionResponse, StaffDayOff } from '../types/api'

const staleTime = import.meta.env.DEV ? 1 : 60_000;

export const useStaffDayOffs = (
  businessId: number | null,
  dayOffOn?: string,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<StaffDayOff>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['staff-day-offs', businessId, dayOffOn],
    queryFn: async () => fetchStaffDayOffs(businessId as number, dayOffOn),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
  })
}

export const useCreateStaffDayOff = (businessId: number | null, dayOffOn?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateStaffDayOffPayload) => createStaffDayOff(businessId as number, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-day-offs', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-day-offs', businessId, dayOffOn] }),
      ])
    },
  })
}

export const useDeleteStaffDayOff = (businessId: number | null, dayOffOn?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dayOffId, payload }: { dayOffId: number; payload: ReauthPayload }) =>
      deleteStaffDayOff(businessId as number, dayOffId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-day-offs', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-day-offs', businessId, dayOffOn] }),
      ])
    },
  })
}
