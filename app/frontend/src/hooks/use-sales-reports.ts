import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  generateSalesReport,
  type GenerateSalesReportPayload,
  createSalesReport,
  downloadSalesReport,
  downloadPortfolioSalesReport,
  fetchSalesReports,
  fetchPortfolioSalesReports,
  type CreateSalesReportPayload,
} from '../services/sales-report-service'
import type { ApiCollectionResponse, SalesReportVersion } from '../types/api'

const staleTime = import.meta.env.DEV ? 60_000 : 60_000;

export const useGenerateSalesReport = () => {
  return useMutation({
    mutationFn: async (payload: GenerateSalesReportPayload) => generateSalesReport(payload),
  })
}

export const useSalesReports = (
  businessId: number | null,
  page: number,
  reportScope: 'business' | 'all_businesses',
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<SalesReportVersion>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['sales-reports', businessId, page, reportScope],
    queryFn: async () => fetchSalesReports(businessId as number, page, reportScope),
    staleTime,
    ...queryOptions,
    enabled: Boolean(businessId) && (queryOptions?.enabled ?? true),
  })
}

export const useCreateSalesReport = (page: number, reportScope: 'business' | 'all_businesses') => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ businessId, payload }: { businessId: number; payload: CreateSalesReportPayload }) =>
      createSalesReport(businessId, payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['sales-reports', variables.businessId, page, reportScope] })
      await queryClient.invalidateQueries({ queryKey: ['portfolio-sales-reports'] })
    },
  })
}

export const usePortfolioSalesReports = (
  page: number,
  queryOptions?: Omit<UseQueryOptions<ApiCollectionResponse<SalesReportVersion>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['portfolio-sales-reports', page],
    queryFn: async () => fetchPortfolioSalesReports(page),
    staleTime,
    ...queryOptions,
    enabled: queryOptions?.enabled ?? true,
  })
}

export const useDownloadSalesReport = () => {
  return useMutation({
    mutationFn: async ({ businessId, reportId }: { businessId: number; reportId: number }) =>
      downloadSalesReport(businessId, reportId),
  })
}

export const useDownloadPortfolioSalesReport = () => {
  return useMutation({
    mutationFn: async (reportId: number) => downloadPortfolioSalesReport(reportId),
  })
}
