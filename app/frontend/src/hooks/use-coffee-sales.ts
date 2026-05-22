import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCoffeeSale,
  deleteCoffeeSale,
  fetchCoffeeSales,
  type CreateCoffeeSalePayload,
} from '../services/coffee-sale-service'

const staleTime = import.meta.env.DEV ? 1 : 60_000;

export const useCoffeeSales = (businessId: number | null) => {
  return useQuery({
    queryKey: ['coffee-sales', businessId],
    queryFn: async () => fetchCoffeeSales(businessId as number),
    enabled: Boolean(businessId),
    staleTime,
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
    mutationFn: async (saleId: number) => deleteCoffeeSale(businessId as number, saleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coffee-sales', businessId] })
    },
  })
}
