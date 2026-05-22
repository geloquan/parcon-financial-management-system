import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { fetchMe, login, logout, type LoginPayload } from '../services/auth-service'
import { clearStoredToken, getStoredToken, setStoredToken } from '../services/api-client'
import type { User } from '../types/api'

export const useMe = (
  queryOptions?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    ...queryOptions,
    enabled: Boolean(getStoredToken()) && (queryOptions?.enabled ?? true),
  })
}

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: LoginPayload) => login(payload),
    onSuccess: async (response) => {
      setStoredToken(response.token)
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      clearStoredToken()
      await queryClient.invalidateQueries()
    },
  })
}
