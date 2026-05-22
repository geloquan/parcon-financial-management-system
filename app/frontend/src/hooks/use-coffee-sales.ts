import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createCoffeeSale,
  deleteCoffeeSale,
  fetchCoffeeSales,
  type CreateCoffeeSalePayload,
} from '../services/coffee-sale-service'
import type { ReauthPayload } from '../services/staff-service'
import type { ApiCollectionResponse, CoffeeSale } from '../types/api'

const staleTime = import.meta.env.DEV ? 60_000 : 60_000;

export const useCoffeeSales = (
  businessId: number | null,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<CoffeeSale>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['coffee-sales', businessId],
    queryFn: async () => fetchCoffeeSales(businessId as number),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
  })
}

export const useCreateCoffeeSale = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCoffeeSalePayload) => createCoffeeSale(businessId as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coffee-sales', businessId] })
    },
  })
}

export const useDeleteCoffeeSale = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ saleId, payload }: { saleId: number; payload: ReauthPayload }) =>
      deleteCoffeeSale(businessId as number, saleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coffee-sales', businessId] })
    },
  })
}
