import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPrintSale,
  deletePrintSale,
  fetchPrintSales,
  type CreatePrintSalePayload,
} from '../services/print-sale-service'

const staleTime = import.meta.env.DEV ? 1 : 60_000;

export const usePrintSales = (businessId: number | null) => {
  return useQuery({
    queryKey: ['print-sales', businessId],
    queryFn: async () => fetchPrintSales(businessId as number),
    enabled: Boolean(businessId),
    staleTime,
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
    mutationFn: async (saleId: number) => deletePrintSale(businessId as number, saleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['print-sales', businessId] })
    },
  })
}
