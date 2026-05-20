import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCoffeeSale, fetchCoffeeSales, type CreateCoffeeSalePayload } from '../services/coffee-sale-service'

export const useCoffeeSales = (businessId: number | null) => {
  return useQuery({
    queryKey: ['coffee-sales', businessId],
    queryFn: async () => fetchCoffeeSales(businessId as number),
    enabled: Boolean(businessId),
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
