import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCompensationRun,
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
