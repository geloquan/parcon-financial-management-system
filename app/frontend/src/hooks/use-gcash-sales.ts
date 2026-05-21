import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createGcashSale,
  deleteGcashSale,
  fetchGcashSales,
  type CreateGcashSalePayload,
} from '../services/gcash-sale-service'

export const useGcashSales = (businessId: number | null) => {
  return useQuery({
    queryKey: ['gcash-sales', businessId],
    queryFn: async () => fetchGcashSales(businessId as number),
    enabled: Boolean(businessId),
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
    mutationFn: async (saleId: number) => deleteGcashSale(businessId as number, saleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['gcash-sales', businessId] })
    },
  })
}
