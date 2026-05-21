import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createStaff,
  fetchStaff,
  type CreateStaffPayload,
  type UpdateStaffPayload,
  updateStaff,
} from '../services/staff-service'

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

export const useUpdateStaff = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ staffId, payload }: { staffId: number; payload: UpdateStaffPayload }) =>
      updateStaff(businessId as number, staffId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff', businessId] })
    },
  })
}
