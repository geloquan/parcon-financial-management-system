import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createStaff,
  deleteStaff,
  fetchStaff,
  type ReauthPayload,
  type CreateStaffPayload,
  type UpdateStaffPayload,
  updateStaff,
} from '../services/staff-service'
import type { ApiCollectionResponse, Staff } from '../types/api'

const staleTime = import.meta.env.DEV ? 60_000 : 60_000;

export const useStaff = (
  businessId: number | null,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<Staff>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['staff', businessId],
    queryFn: async () => fetchStaff(businessId as number),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
  })
}

export const useCreateStaff = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateStaffPayload) => createStaff(businessId as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff', businessId] })
    },
  })
}

export const useUpdateStaff = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ staffId, payload }: { staffId: number; payload: UpdateStaffPayload }) =>
      updateStaff(businessId as number, staffId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff', businessId] })
    },
  })
}

export const useDeleteStaff = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ staffId, payload }: { staffId: number; payload: ReauthPayload }) =>
      deleteStaff(businessId as number, staffId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff', businessId] })
    },
  })
}
