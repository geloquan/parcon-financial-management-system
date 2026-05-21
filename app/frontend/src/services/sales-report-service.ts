import type { ApiCollectionResponse, SalesReportVersion } from '../types/api'
import { apiRequest, getStoredToken } from './api-client'

export type CreateSalesReportPayload = {
  start_date: string
  end_date: string
  document_title?: string
}

export const fetchSalesReports = async (
  businessId: number,
  page = 1,
): Promise<ApiCollectionResponse<SalesReportVersion>> => {
  return apiRequest<ApiCollectionResponse<SalesReportVersion>>(`/businesses/${businessId}/sales_reports?page=${page}`)
}

export const createSalesReport = async (
  businessId: number,
  payload: CreateSalesReportPayload,
): Promise<SalesReportVersion> => {
  return apiRequest<SalesReportVersion>(`/businesses/${businessId}/sales_reports`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const downloadSalesReport = async (
  businessId: number,
  reportId: number,
): Promise<{ blob: Blob; filename: string }> => {
  const token = getStoredToken()
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'}/businesses/${businessId}/sales_reports/${reportId}/download`,
    {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  )

  if (!response.ok) {
    throw new Error('Failed to download report.')
  }

  const contentDisposition = response.headers.get('content-disposition') ?? ''
  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  const filename = filenameMatch?.[1] ?? `sales-report-${reportId}.pdf`

  return {
    blob: await response.blob(),
    filename,
  }
}
