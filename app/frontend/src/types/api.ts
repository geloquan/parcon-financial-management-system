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
  sales_target: string
}

export type Expense = {
  id: number
  business_id: number
  date_issued: string
  amount: string
  description: string
  purpose: 'business' | 'business_portfolio' | 'service'
  recurrence_reference: string | null
  proof_file_name: string | null
  proof_download_url: string | null
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
  is_debt: boolean
  charged_amount: string | null
  remarks: string | null
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
  is_debt: boolean
  charged_amount: string | null
  remarks: string | null
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
  is_debt: boolean
  charged_amount: string | null
  remarks: string | null
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
  is_debt: boolean
  charged_amount: string | null
  remarks: string | null
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
  direction: 'add' | 'deduct' | 'transfer' | 'debt'
  source_type: 'portfolio' | 'business'
  source_business_id: number | null
  target_business_id: number | null
  occurred_on: string
  notes: string | null
  remarks: string | null
  debt_status: 'outstanding' | 'settled' | null
  settled_at: string | null
  settled_by_user_id: number | null
}

export type SalesReportTotals = {
  gcash_sales_total: string
  gcash_profit_total: string
  coffee_sales_total: string
  coffee_profit_total: string
  print_sales_total: string
  print_profit_total: string
  ethereal_sales_total: string
  ethereal_profit_total: string
  sales_total: string
  profit_total: string
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
  business_summary: Array<{
    business_id: number
    business_name: string
    business_slug: string
    sales_target: number
    total_sales: number
    total_profit: number
    entries_count: number
  }>
  daily_profit_summary: Array<{
    date: string
    sales_total: number
    profit_total: number
    entries_count: number
  }>
  sales_target_progress: Array<{
    business_id: number
    business_name: string
    business_slug: string
    sales_target: number
    total_sales: number
    total_profit: number
    remaining_target: number
    progress_percent: number
    is_target_met: boolean
    days_total: number
    days_rendered: number
    days_left: number
  }>
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
  business_deduction?: {
    capital_movement_id: number
    amount: string
    occurred_on: string
  }
  /** @deprecated use business_deduction */
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
  report_type: 'sales' | 'compensation' | 'combined'
  file_path: string | null
  file_name: string | null
  portfolio_download_url?: string
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
    report_scope?: 'business' | 'all_businesses'
    include_sections?: Array<
      | 'staff'
      | 'schedule_attendance'
      | 'compensation'
      | 'reference_items'
      | 'expenses'
      | 'sales_gcash'
      | 'sales_coffee'
      | 'sales_print'
      | 'sales_ethereal'
      | 'sales_target_progress'
      | 'portfolio_business_money'
    >
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
    business_summary?: Array<{
      business_id: number
      business_name: string
      business_slug: string
      sales_target?: number
      entries_count: number
      total_sales: number
      gcash_sales: number
      module_sales: number
      total_profit?: number
      gcash_profit?: number
      coffee_profit?: number
      print_profit?: number
      ethereal_profit?: number
    }>
    entries: Array<{
      module: string
      business_id?: number
      business_slug?: string
      business_name: string
      sale_name: string
      amount: number
      sale_date: string | null
      reference_item_name: string | null
      reference_item_original_price: number | null
      metadata: Record<string, string | number | null>
    }>
    compensation_totals?: {
      gross_pay: number
      total_deductions: number
      net_pay: number
    }
    compensation_counts?: {
      runs_total: number
      runs_pending: number
      runs_finalized: number
    }
    compensation_entries?: Array<{
      module: string
      business_name: string
      run_id: number
      entry_name: string
      amount: number
      entry_date: string | null
      metadata: Record<string, string | number | null>
    }>
    capital_flow_entries?: Array<{
      movement_id: number
      direction: 'add' | 'deduct' | 'transfer' | 'debt'
      source_type: 'portfolio' | 'business'
      amount: number
      occurred_on: string | null
      who: string
      what: string
      where: string
      notes: string | null
      remarks: string | null
      debt_status: 'outstanding' | 'settled' | null
      settled_at: string | null
      settled_by: string | null
    }>
    capital_flow_totals?: {
      portfolio_inflows: number
      portfolio_outflows: number
      business_inflows: number
      business_outflows: number
      debts_outstanding: number
      debts_settled: number
      total_movements: number
    }
    capital_money_totals?: {
      portfolio_money_total: number
      business_money_total: number
      debts_outstanding: number
      debts_settled: number
      business_breakdown: Array<{
        business_id: number
        business_name: string
        money_total: number
      }>
    }
    staff_details?: {
      totals: {
        total_staff: number
        active_staff: number
        inactive_staff: number
      }
      entries: Array<{
        business_name: string
        full_name: string
        employment_type: string
        salary: number
        is_active: boolean
        employment_start_date: string | null
        employment_end_date: string | null
      }>
    }
    schedule_attendance_details?: {
      totals: {
        day_off_count: number
        absence_count: number
        attendance_related_count: number
      }
      entries: Array<{
        business_name: string
        staff_name: string
        event_type: 'day_off' | 'absence'
        event_date: string | null
        notes: string | null
      }>
    }
    reference_items_details?: {
      totals: {
        total_items: number
        product_items: number
        service_items: number
      }
      entries: Array<{
        business_name: string
        item_type: 'product' | 'service'
        name: string
        price: number
        description: string | null
      }>
    }
    expenses_details?: {
      totals: {
        total_expenses: number
        expense_amount_total: number
      }
      entries: Array<{
        business_name: string
        date_issued: string | null
        amount: number
        purpose: 'business' | 'business_portfolio' | 'service'
        description: string
        recurrence_reference: string | null
      }>
    }
    daily_profit_summary?: Array<{
      date: string
      sales_total: number
      profit_total: number
      entries_count: number
    }>
    sales_target_progress?: Array<{
      business_id: number
      business_name: string
      business_slug: string
      sales_target: number
      total_sales: number
      total_profit: number
      remaining_target: number
      progress_percent: number
      is_target_met: boolean
      days_total: number
      days_rendered: number
      days_left: number
    }>
  }
  pdf_verification?: {
    status: 'verified' | 'mismatch' | 'missing_file'
    checked_at: string
    file_exists: boolean
    metadata_checks: {
      business_name: boolean
      generated_at: boolean
      generated_by: boolean
      stored_file_name: boolean
    }
    module_checks: {
      gcash: boolean
      coffee: boolean
      print: boolean
      ethereal: boolean
    }
  }
  download_url: string
}
