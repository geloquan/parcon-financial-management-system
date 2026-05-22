import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createCompensationRun,
  type FinalizeCompensationRunPayload,
  finalizeCompensationRun,
  fetchCompensationRuns,
  type CreateCompensationRunPayload,
} from '../services/compensation-run-service'
import type { ApiCollectionResponse, CompensationRun } from '../types/api'

const staleTime = import.meta.env.DEV ? 60_000 : 60_000;

export const useCompensationRuns = (
  businessId: number | null,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<CompensationRun>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['compensation-runs', businessId],
    queryFn: async () => fetchCompensationRuns(businessId as number),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
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
