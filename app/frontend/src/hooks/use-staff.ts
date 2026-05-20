import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createStaff, fetchStaff, type CreateStaffPayload } from '../services/staff-service'

export const useStaff = (businessId: number | null) => {
  return useQuery({
    queryKey: ['staff', businessId],
    queryFn: async () => fetchStaff(businessId as number),
    enabled: Boolean(businessId),
  })
}

export const useCreateStaff = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateStaffPayload) => createStaff(businessId as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff', businessId] })
    },
  })
}
