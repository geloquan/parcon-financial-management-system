import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createBusinessCapitalMovement,
  createPortfolioCapitalMovement,
  fetchCapitalMovements,
  type CreateBusinessCapitalMovementPayload,
  type CreatePortfolioCapitalMovementPayload,
} from '../services/capital-movement-service'
import type { ApiCollectionResponse, CapitalMovement } from '../types/api'

const staleTime = import.meta.env.DEV ? 60_000 : 60_000;

export const useCapitalMovements = (
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<CapitalMovement>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['capital-movements'],
    queryFn: fetchCapitalMovements,
    staleTime,
    ...queryOptions,
  })
}

export const useCreatePortfolioCapitalMovement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreatePortfolioCapitalMovementPayload) => createPortfolioCapitalMovement(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['capital-movements'] })
    },
  })
}

export const useCreateBusinessCapitalMovement = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateBusinessCapitalMovementPayload) =>
      createBusinessCapitalMovement(businessId as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['capital-movements'] })
    },
  })
}
