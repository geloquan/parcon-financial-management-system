import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { createBusiness, fetchBusinesses, type CreateBusinessPayload } from '../services/business-service'
import type { ApiCollectionResponse, Business } from '../types/api'

const staleTime = import.meta.env.DEV ? 1 : 60_000;

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
