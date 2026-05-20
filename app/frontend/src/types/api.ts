export type ApiError = {
  message: string
  errors?: Record<string, string[]>
}

export type ApiCollectionResponse<T> = {
  data: T[]
  links?: {
    first?: string | null
    last?: string | null
    prev?: string | null
    next?: string | null
  }
  meta?: {
    current_page?: number
    from?: number
    last_page?: number
    path?: string
    per_page?: number
    to?: number
    total?: number
  }
}

export type User = {
  id: number
  name: string
  username: string
  role: string
  business_id: number | null
}

export type Business = {
  id: number
  name: string
  slug: string
  description: string | null
}

export type Expense = {
  id: number
  business_id: number
  date_issued: string
  amount: string
  description: string
  purpose: 'business' | 'business_portfolio' | 'service'
  payment_type: 'one_time' | 'repeat'
  recurrence_reference: string | null
}

export type GcashSale = {
  id: number
  business_id: number
  transaction_recipient: string
  amount_moved: string
  sales_amount: string
  profit_amount: string
  transaction_type: 'cash_in' | 'cash_out'
  transaction_date: string
}
