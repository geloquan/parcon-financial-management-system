import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createGcashSale,
  deleteGcashSale,
  fetchGcashSales,
  type CreateGcashSalePayload,
} from '../services/gcash-sale-service'
import type { ReauthPayload } from '../services/staff-service'
import type { ApiCollectionResponse, GcashSale } from '../types/api'

const staleTime = import.meta.env.DEV ? 1_000 : 60_000;

export const useGcashSales = (
  businessId: number | null,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<GcashSale>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['gcash-sales', businessId],
    queryFn: async () => fetchGcashSales(businessId as number),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
  })
}

export const useCreateGcashSale = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateGcashSalePayload) => createGcashSale(businessId as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['gcash-sales', businessId] })
    },
  })
}

export const useDeleteGcashSale = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ saleId, payload }: { saleId: number; payload: ReauthPayload }) =>
      deleteGcashSale(businessId as number, saleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['gcash-sales', businessId] })
    },
  })
}
