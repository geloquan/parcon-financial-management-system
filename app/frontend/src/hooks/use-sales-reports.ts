import { useMutation } from '@tanstack/react-query'
import { generateSalesReport, type GenerateSalesReportPayload } from '../services/sales-report-service'

export const useGenerateSalesReport = () => {
  return useMutation({
    mutationFn: async (payload: GenerateSalesReportPayload) => generateSalesReport(payload),
  })
}
