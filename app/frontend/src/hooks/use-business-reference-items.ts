import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createBusinessReferenceItem,
  fetchBusinessReferenceItems,
  type CreateBusinessReferenceItemPayload,
} from '../services/business-reference-item-service'

const staleTime = import.meta.env.DEV ? 1 : 60_000;

export const useBusinessReferenceItems = (businessId: number | null) => {
  return useQuery({
    queryKey: ['business-reference-items', businessId],
    queryFn: async () => fetchBusinessReferenceItems(businessId as number),
    enabled: Boolean(businessId),
    staleTime,
  })
}

export const useCreateBusinessReferenceItem = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateBusinessReferenceItemPayload) => createBusinessReferenceItem(businessId as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['business-reference-items', businessId] })
    },
  })
}
