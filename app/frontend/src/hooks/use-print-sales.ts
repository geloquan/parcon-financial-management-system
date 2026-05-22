import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  createPrintSale,
  deletePrintSale,
  fetchPrintSales,
  type CreatePrintSalePayload,
} from '../services/print-sale-service'
import type { ReauthPayload } from '../services/staff-service'
import type { ApiCollectionResponse, PrintSale } from '../types/api'

const staleTime = import.meta.env.DEV ? 60_000 : 60_000;

export const usePrintSales = (
  businessId: number | null,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<PrintSale>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['print-sales', businessId],
    queryFn: async () => fetchPrintSales(businessId as number),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
  })
}

export const useCreatePrintSale = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreatePrintSalePayload) => createPrintSale(businessId as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['print-sales', businessId] })
    },
  })
}

export const useDeletePrintSale = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ saleId, payload }: { saleId: number; payload: ReauthPayload }) =>
      deletePrintSale(businessId as number, saleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['print-sales', businessId] })
    },
  })
}
