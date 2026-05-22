import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createBusinessReferenceItem,
  fetchBusinessReferenceItems,
  type CreateBusinessReferenceItemPayload,
} from '../services/business-reference-item-service'
import type { ApiCollectionResponse, BusinessReferenceItem } from '../types/api'

const staleTime = import.meta.env.DEV ? 1 : 60_000;

export const useBusinessReferenceItems = (
  businessId: number | null,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<BusinessReferenceItem>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['business-reference-items', businessId],
    queryFn: async () => fetchBusinessReferenceItems(businessId as number),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
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
