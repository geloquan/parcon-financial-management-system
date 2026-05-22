import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCompensationRun,
  type FinalizeCompensationRunPayload,
  finalizeCompensationRun,
  fetchCompensationRuns,
  type CreateCompensationRunPayload,
} from '../services/compensation-run-service'

export const useCompensationRuns = (businessId: number | null) => {
  return useQuery({
    queryKey: ['compensation-runs', businessId],
    queryFn: async () => fetchCompensationRuns(businessId as number),
    enabled: Boolean(businessId),
  })
}

export const useCreateCompensationRun = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCompensationRunPayload) => createCompensationRun(businessId as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['compensation-runs', businessId] })
    },
  })
}

export const useFinalizeCompensationRun = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ runId, payload }: { runId: number; payload: FinalizeCompensationRunPayload }) =>
      finalizeCompensationRun(businessId as number, runId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['compensation-runs', businessId] })
    },
  })
}
