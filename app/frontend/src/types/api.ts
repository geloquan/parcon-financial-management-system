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
  size: string
  add_on_price: string
  add_on_description: string | null
  sale_date: string
}

export type PrintSale = {
  id: number
  business_id: number
  job_type: string
  description: string
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
