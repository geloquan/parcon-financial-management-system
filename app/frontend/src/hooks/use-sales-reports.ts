import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSalesReport,
  downloadSalesReport,
  fetchSalesReports,
  type CreateSalesReportPayload,
} from '../services/sales-report-service'

export const useSalesReports = (businessId: number | null, page: number) => {
  return useQuery({
    queryKey: ['sales-reports', businessId, page],
    queryFn: async () => fetchSalesReports(businessId as number, page),
    enabled: Boolean(businessId),
  })
}

export const useCreateSalesReport = (businessId: number | null, page: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateSalesReportPayload) => createSalesReport(businessId as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sales-reports', businessId, page] })
    },
  })
}

export const useDownloadSalesReport = (businessId: number | null) => {
  return useMutation({
    mutationFn: async (reportId: number) => downloadSalesReport(businessId as number, reportId),
  })
}
