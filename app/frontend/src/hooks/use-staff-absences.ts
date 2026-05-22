import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createStaffAbsence,
  deleteStaffAbsence,
  fetchStaffAbsences,
  type CreateStaffAbsencePayload,
} from '../services/staff-absence-service'
import type { ReauthPayload } from '../services/staff-service'
import type { ApiCollectionResponse, StaffAbsence } from '../types/api'

const staleTime = import.meta.env.DEV ? 1_000 : 60_000;

export const useStaffAbsences = (
  businessId: number | null,
  absentOn?: string,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<StaffAbsence>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['staff-absences', businessId, absentOn],
    queryFn: async () => fetchStaffAbsences(businessId as number, absentOn),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
  })
}

export const useCreateStaffAbsence = (businessId: number | null, absentOn?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateStaffAbsencePayload) => createStaffAbsence(businessId as number, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-absences', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-absences', businessId, absentOn] }),
      ])
    },
  })
}

export const useDeleteStaffAbsence = (businessId: number | null, absentOn?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ absenceId, payload }: { absenceId: number; payload: ReauthPayload }) =>
      deleteStaffAbsence(businessId as number, absenceId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-absences', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-absences', businessId, absentOn] }),
      ])
    },
  })
}
