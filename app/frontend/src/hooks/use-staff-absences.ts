import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createStaffAbsence,
  deleteStaffAbsence,
  fetchStaffAbsences,
  type CreateStaffAbsencePayload,
} from '../services/staff-absence-service'

export const useStaffAbsences = (businessId: number | null, absenceDate?: string) => {
  return useQuery({
    queryKey: ['staff-absences', businessId, absenceDate],
    queryFn: async () => fetchStaffAbsences(businessId as number, absenceDate),
    enabled: Boolean(businessId),
  })
}

export const useCreateStaffAbsence = (businessId: number | null, absenceDate?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateStaffAbsencePayload) => createStaffAbsence(businessId as number, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-absences', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-absences', businessId, absenceDate] }),
      ])
    },
  })
}

export const useDeleteStaffAbsence = (businessId: number | null, absenceDate?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (absenceId: number) => deleteStaffAbsence(businessId as number, absenceId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-absences', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-absences', businessId, absenceDate] }),
      ])
    },
  })
}
