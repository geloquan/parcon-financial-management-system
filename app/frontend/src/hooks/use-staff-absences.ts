import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createStaffAbsence,
  deleteStaffAbsence,
  fetchStaffAbsences,
  type CreateStaffAbsencePayload,
} from '../services/staff-absence-service'

const staleTime = import.meta.env.DEV ? 1 : 60_000;

export const useStaffAbsences = (businessId: number | null, absentOn?: string) => {
  return useQuery({
    queryKey: ['staff-absences', businessId, absentOn],
    queryFn: async () => fetchStaffAbsences(businessId as number, absentOn),
    enabled: Boolean(businessId),
    staleTime,
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
    mutationFn: async (absenceId: number) => deleteStaffAbsence(businessId as number, absenceId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-absences', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-absences', businessId, absentOn] }),
      ])
    },
  })
}
