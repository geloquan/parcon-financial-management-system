import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPrintSale, fetchPrintSales, type CreatePrintSalePayload } from '../services/print-sale-service'

export const usePrintSales = (businessId: number | null) => {
  return useQuery({
    queryKey: ['print-sales', businessId],
    queryFn: async () => fetchPrintSales(businessId as number),
    enabled: Boolean(businessId),
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
