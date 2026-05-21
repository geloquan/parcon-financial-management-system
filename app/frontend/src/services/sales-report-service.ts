import type { SalesReport } from '../types/api'
import { apiRequest } from './api-client'

export type GenerateSalesReportPayload = {
  scope: 'portfolio' | 'business'
  business_id?: number
  period: 'today' | 'date_range'
  start_date?: string
  end_date?: string
}

export const generateSalesReport = async (payload: GenerateSalesReportPayload): Promise<SalesReport> => {
  return apiRequest<SalesReport>('/sales_reports/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
