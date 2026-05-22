import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createEtherealSale,
  deleteEtherealSale,
  fetchEtherealSales,
  type CreateEtherealSalePayload,
} from '../services/ethereal-sale-service'
import type { ReauthPayload } from '../services/staff-service'
import type { ApiCollectionResponse, EtherealSale } from '../types/api'

const staleTime = import.meta.env.DEV ? 1 : 60_000;

export const useEtherealSales = (
  businessId: number | null,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<EtherealSale>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['ethereal-sales', businessId],
    queryFn: async () => fetchEtherealSales(businessId as number),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
  })
}

export const useCreateEtherealSale = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateEtherealSalePayload) => createEtherealSale(businessId as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ethereal-sales', businessId] })
    },
  })
}

export const useDeleteEtherealSale = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ saleId, payload }: { saleId: number; payload: ReauthPayload }) =>
      deleteEtherealSale(businessId as number, saleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ethereal-sales', businessId] })
    },
  })
}
