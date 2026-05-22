import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { createExpense, fetchExpenses, type CreateExpensePayload } from '../services/expense-service'
import type { ApiCollectionResponse, Expense } from '../types/api'

const staleTime = import.meta.env.DEV ? 1 : 60_000;

export const useExpenses = (
  businessId: number | null,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<Expense>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['expenses', businessId],
    queryFn: async () => fetchExpenses(businessId as number),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
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
