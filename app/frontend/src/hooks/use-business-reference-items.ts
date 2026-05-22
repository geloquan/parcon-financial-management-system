import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createBusinessReferenceItem,
  deleteBusinessReferenceItem,
  fetchBusinessReferenceItems,
  updateBusinessReferenceItem,
  type BusinessReferenceItemPayload,
} from '../services/business-reference-item-service'
import type { ApiCollectionResponse, BusinessReferenceItem } from '../types/api'
import type { ReauthPayload } from '../services/staff-service'

const staleTime = import.meta.env.DEV ? 1_000 : 60_000

export const useBusinessReferenceItems = (
  businessId: number | null,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<BusinessReferenceItem>>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: ['business-reference-items', businessId],
    queryFn: async () => fetchBusinessReferenceItems(businessId as number),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
  })
}

const invalidateReferenceItems = async (queryClient: ReturnType<typeof useQueryClient>, businessId: number | null) => {
  await queryClient.invalidateQueries({ queryKey: ['business-reference-items', businessId] })
}

export const useCreateBusinessReferenceItem = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: BusinessReferenceItemPayload) => createBusinessReferenceItem(businessId as number, payload),
    onSuccess: async () => invalidateReferenceItems(queryClient, businessId),
  })
}

export const useUpdateBusinessReferenceItem = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, payload }: { itemId: number; payload: BusinessReferenceItemPayload & ReauthPayload }) =>
      updateBusinessReferenceItem(businessId as number, itemId, payload),
    onSuccess: async () => invalidateReferenceItems(queryClient, businessId),
  })
}

export const useDeleteBusinessReferenceItem = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, payload }: { itemId: number; payload: ReauthPayload }) =>
      deleteBusinessReferenceItem(businessId as number, itemId, payload),
    onSuccess: async () => invalidateReferenceItems(queryClient, businessId),
  })
}
