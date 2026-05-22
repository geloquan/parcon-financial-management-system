import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createExpense, fetchExpenses, type CreateExpensePayload } from '../services/expense-service'

const staleTime = import.meta.env.DEV ? 1 : 60_000;

export const useExpenses = (businessId: number | null) => {
  return useQuery({
    queryKey: ['expenses', businessId],
    queryFn: async () => fetchExpenses(businessId as number),
    enabled: Boolean(businessId),
    staleTime,
  })
}

export const useCreateExpense = (businessId: number | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => createExpense(businessId as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses', businessId] })
    },
  })
}
