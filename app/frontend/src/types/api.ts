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
  roles: string[]
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

export type BusinessReferenceItem = {
  id: number
  business_id: number
  item_type: 'product' | 'service'
  name: string
  price: string
  description: string | null
}

export type GcashSale = {
  id: number
  business_id: number
  transaction_recipient: string | null
  reference_item_name: string | null
  reference_item_original_price: string | null
  amount_moved: string
  sales_amount: string
  profit_amount: string
  transaction_type: 'cash_in' | 'cash_out'
  transaction_date: string
}

export type CoffeeSale = {
  id: number
  business_id: number
  price: string
  coffee_type: string
  reference_item_name: string | null
  reference_item_original_price: string | null
  size: string
  add_on_price: string
  total_amount: string
  add_on_description: string | null
  sale_date: string
}

export type PrintSale = {
  id: number
  business_id: number
  job_type: string
  description: string
  reference_item_name: string | null
  reference_item_original_price: string | null
  color_mode: 'black' | 'white'
  print_size: string
  paper_count: number
  sales_amount: string
  sale_date: string
}

export type EtherealSale = {
  id: number
  business_id: number
  staff_id: number
  staff_ids: number[]
  service_name: string | null
  reference_item_name: string | null
  reference_item_original_price: string | null
  service_cost: string
  discount_percentage: string
  customer_name: string | null
  discount_type: string
  cash_discount: string
  net_amount: string
  service_date: string
}

export type Staff = {
  id: number
  business_id: number
  full_name: string
  age: number
  employment_start_date: string
  employment_end_date: string | null
  employment_type: string
  salary: string
  commission_rate_percent: string
  is_active: boolean
}

export type CapitalMovement = {
  id: number
  initiated_by_user_id: number
  amount: string
  direction: 'add' | 'deduct' | 'transfer'
  source_type: 'portfolio' | 'business'
  source_business_id: number | null
  target_business_id: number | null
  occurred_on: string
  notes: string | null
}

export type SalesReportTotals = {
  gcash_sales_total: string
  coffee_sales_total: string
  print_sales_total: string
  ethereal_sales_total: string
  sales_total: string
  total_transactions: number
}

export type SalesReport = {
  scope: 'portfolio' | 'business'
  period: 'today' | 'date_range'
  business_id: number | null
  business_name: string | null
  start_date: string
  end_date: string
  generated_at: string
  totals: SalesReportTotals
}

export type StaffDayOff = {
  id: number
  business_id: number
  staff_id: number
  staff_name: string | null
  day_off_on: string
  notes: string | null
}

export type StaffAbsence = {
  id: number
  business_id: number
  staff_id: number
  staff_name: string | null
  absent_on: string
  notes: string | null
}

export type CompensationBreakdownItem = {
  staff_id: number
  staff_name: string
  salary: string
  day_off_days: number
  absent_days: number
  present_days: number
  payable_days: number
  base_pay: number
  commission_rate_percent: number
  commissionable_sales_total: number
  commission_amount: number
  gross_pay: number
  deductions: number
  net_pay: number
  cash_advance_settlements: {
    cash_advance_id: number
    deducted_amount: number
    remaining_balance_before: number
  }[]
}

export type CompensationPaymentHistoryItem = {
  action: 'finalized'
  finalized_at: string
  finalized_by_user_id: number
  finalized_by_name: string
  portfolio_deduction?: {
    capital_movement_id: number
    amount: string
    occurred_on: string
  }
  settled_deductions: {
    staff_id: number
    staff_name: string
    cash_advance_id: number
    deducted_amount: number
    settled_amount: number
    remaining_balance_before: number
    remaining_balance_after: number
    status: 'pending' | 'settled'
  }[]
}

export type CompensationRun = {
  id: number
  business_id: number
  computed_by_user_id: number
  computation_mode: 'today' | 'specific_date'
  number_of_days: number | null
  cutoff_date: string
  period_start: string
  period_end: string
  gross_pay: string
  total_deductions: string
  net_pay: string
  employee_breakdown: CompensationBreakdownItem[]
  payment_status: 'pending' | 'finalized'
  finalized_by_user_id: number | null
  finalized_by_name: string | null
  finalized_at: string | null
  payment_history: CompensationPaymentHistoryItem[]
}

export type SalesReportVersion = {
  id: number
  business_id: number
  generated_by_user_id: number
  version: number
  start_date: string
  end_date: string
  document_title: string
  document_format: string
  file_path: string | null
  file_name: string | null
  file_size_bytes: number | null
  metadata: {
    page_size: string
    generated_at: string
    generated_by: string
    generated_by_username?: string
    business_name: string
    business_slug?: string
    report_scope?: string
    stored_disk?: string
    stored_file_name?: string
  }
  details: {
    range: {
      start_date: string
      end_date: string
    }
    totals: {
      gcash_sales: number
      gcash_profit: number
      coffee_sales: number
      print_sales: number
      ethereal_sales: number
      overall_sales: number
    }
    counts: {
      gcash_entries: number
      coffee_entries: number
      print_entries: number
      ethereal_entries: number
      all_entries: number
    }
    entries: Array<{
      module: string
      business_name: string
      sale_name: string
      amount: number
      sale_date: string | null
      reference_item_name: string | null
      reference_item_original_price: number | null
      metadata: Record<string, string | number | null>
    }>
  }
  download_url: string
}
