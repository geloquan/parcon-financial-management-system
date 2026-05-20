import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEtherealSale,
  fetchEtherealSales,
  type CreateEtherealSalePayload,
} from '../services/ethereal-sale-service'

export const useEtherealSales = (businessId: number | null) => {
  return useQuery({
    queryKey: ['ethereal-sales', businessId],
    queryFn: async () => fetchEtherealSales(businessId as number),
    enabled: Boolean(businessId),
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
