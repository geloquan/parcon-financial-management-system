import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createBusinessCapitalMovement,
  createPortfolioCapitalMovement,
  fetchCapitalMovements,
  type CreateBusinessCapitalMovementPayload,
  type CreatePortfolioCapitalMovementPayload,
} from '../services/capital-movement-service'

const staleTime = import.meta.env.DEV ? 1 : 60_000;

export const useCapitalMovements = () => {
  return useQuery({
    queryKey: ['capital-movements'],
    queryFn: fetchCapitalMovements,
    staleTime,
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
