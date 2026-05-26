import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createBusiness,
  fetchBusinesses,
  updateBusiness,
  type CreateBusinessPayload,
  type UpdateBusinessPayload,
} from '../services/business-service'
import type { ApiCollectionResponse, Business } from '../types/api'

const staleTime = import.meta.env.DEV ? 60_000 : 60_000;

export const useBusinesses = (
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<Business>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: fetchBusinesses,
    staleTime,
    ...queryOptions,
  })
}

export const useCreateBusiness = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateBusinessPayload) => createBusiness(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}

export const useUpdateBusiness = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ businessId, payload }: { businessId: number; payload: UpdateBusinessPayload }) =>
      updateBusiness(businessId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}
