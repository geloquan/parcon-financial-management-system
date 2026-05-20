import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBusiness, fetchBusinesses, type CreateBusinessPayload } from '../services/business-service'

export const useBusinesses = () => {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: fetchBusinesses,
  })
}

export const useCreateBusiness = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateBusinessPayload) => createBusiness(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}
