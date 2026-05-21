import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLogin, useLogout, useMe } from './hooks/use-auth'
import { useBusinesses } from './hooks/use-businesses'
import { useCreateExpense, useExpenses } from './hooks/use-expenses'
import { useCreateGcashSale, useGcashSales } from './hooks/use-gcash-sales'
import { useCreateCoffeeSale, useCoffeeSales } from './hooks/use-coffee-sales'
import { useCreatePrintSale, usePrintSales } from './hooks/use-print-sales'
import { useCreateEtherealSale, useEtherealSales } from './hooks/use-ethereal-sales'
import { useCreateStaff, useStaff } from './hooks/use-staff'
import { useBusinessReferenceItems, useCreateBusinessReferenceItem } from './hooks/use-business-reference-items'
import {
  useCapitalMovements,
  useCreateBusinessCapitalMovement,
  useCreatePortfolioCapitalMovement,
} from './hooks/use-capital-movements'

type Tab =
  | 'overview'
  | 'businesses'
  | 'staff'
  | 'referenceItems'
  | 'expenses'
  | 'gcash'
  | 'coffee'
  | 'print'
  | 'ethereal'
  | 'portfolioCapital'
  | 'businessCapital'

const parseAmount = (value: string | number | null | undefined) => {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value)

const formatDateTimeLocal = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const formatDateTimeDisplay = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatRelative = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'unknown time'
  }

  const seconds = Math.max(Math.floor((Date.now() - date.getTime()) / 1000), 0)
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'} ago`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const navItems: Array<{ value: Tab; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'businesses', label: 'Businesses' },
  { value: 'staff', label: 'Staff' },
  { value: 'referenceItems', label: 'Reference Items' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'gcash', label: 'GCash' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'print', label: 'Print' },
  { value: 'ethereal', label: 'Ethereal' },
  { value: 'portfolioCapital', label: 'Portfolio Money' },
  { value: 'businessCapital', label: 'Business Money' },
]

const cardClass =
  'rounded-xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] p-5 shadow-[0_8px_30px_rgba(58,9,18,0.06)]'

const formGridClass = 'mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3'

function App() {
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null)
  const [gcashAmountMoved, setGcashAmountMoved] = useState('0')
  const [gcashSalesAmount, setGcashSalesAmount] = useState('0')
  const [etherealServiceCost, setEtherealServiceCost] = useState('0')
  const [etherealDiscountPercentage, setEtherealDiscountPercentage] = useState('0')

  const meQuery = useMe()
  const loginMutation = useLogin()
  const logoutMutation = useLogout()

  const businessesQuery = useBusinesses()
  const businesses = useMemo(() => businessesQuery.data?.data ?? [], [businessesQuery.data])

  useEffect(() => {
    if (!selectedBusinessId && businesses.length > 0) {
      setSelectedBusinessId(businesses[0].id)
    }
  }, [businesses, selectedBusinessId])

  const staffQuery = useStaff(selectedBusinessId)
  const createStaffMutation = useCreateStaff(selectedBusinessId)

  const expensesQuery = useExpenses(selectedBusinessId)
  const createExpenseMutation = useCreateExpense(selectedBusinessId)

  const gcashQuery = useGcashSales(selectedBusinessId)
  const createGcashMutation = useCreateGcashSale(selectedBusinessId)

  const coffeeQuery = useCoffeeSales(selectedBusinessId)
  const createCoffeeMutation = useCreateCoffeeSale(selectedBusinessId)

  const printQuery = usePrintSales(selectedBusinessId)
  const createPrintMutation = useCreatePrintSale(selectedBusinessId)

  const etherealQuery = useEtherealSales(selectedBusinessId)
  const createEtherealMutation = useCreateEtherealSale(selectedBusinessId)
  const referenceItemsQuery = useBusinessReferenceItems(selectedBusinessId)
  const createReferenceItemMutation = useCreateBusinessReferenceItem(selectedBusinessId)

  const capitalMovementsQuery = useCapitalMovements()
  const createPortfolioCapitalMutation = useCreatePortfolioCapitalMovement()
  const createBusinessCapitalMutation = useCreateBusinessCapitalMovement(selectedBusinessId)

  const selectedBusinessName = useMemo(
    () => businesses.find((business) => business.id === selectedBusinessId)?.name ?? null,
    [businesses, selectedBusinessId],
  )

  const portfolioMovements = useMemo(
    () => (capitalMovementsQuery.data?.data ?? []).filter((movement) => movement.source_type === 'portfolio'),
    [capitalMovementsQuery.data],
  )

  const businessMovements = useMemo(
    () =>
      (capitalMovementsQuery.data?.data ?? []).filter(
        (movement) =>
          movement.source_business_id === selectedBusinessId || movement.target_business_id === selectedBusinessId,
      ),
    [capitalMovementsQuery.data, selectedBusinessId],
  )

  const staffEntries = useMemo(() => staffQuery.data?.data ?? [], [staffQuery.data])
  const expenseEntries = useMemo(() => expensesQuery.data?.data ?? [], [expensesQuery.data])
  const gcashEntries = useMemo(() => gcashQuery.data?.data ?? [], [gcashQuery.data])
  const coffeeEntries = useMemo(() => coffeeQuery.data?.data ?? [], [coffeeQuery.data])
  const printEntries = useMemo(() => printQuery.data?.data ?? [], [printQuery.data])
  const etherealEntries = useMemo(() => etherealQuery.data?.data ?? [], [etherealQuery.data])
  const referenceItems = useMemo(() => referenceItemsQuery.data?.data ?? [], [referenceItemsQuery.data])
  const productReferenceItems = useMemo(
    () => referenceItems.filter((item) => item.item_type === 'product'),
    [referenceItems],
  )
  const serviceReferenceItems = useMemo(
    () => referenceItems.filter((item) => item.item_type === 'service'),
    [referenceItems],
  )

  const expenseTotal = useMemo(
    () => expenseEntries.reduce((total, item) => total + parseAmount(item.amount), 0),
    [expenseEntries],
  )

  const salesTotal = useMemo(
    () =>
      gcashEntries.reduce((total, item) => total + parseAmount(item.sales_amount), 0) +
      coffeeEntries.reduce((total, item) => total + parseAmount(item.price), 0) +
      printEntries.reduce((total, item) => total + parseAmount(item.sales_amount), 0) +
      etherealEntries.reduce((total, item) => total + parseAmount(item.net_amount), 0),
    [coffeeEntries, etherealEntries, gcashEntries, printEntries],
  )

  const profitSnapshot = useMemo(
    () => gcashEntries.reduce((total, item) => total + parseAmount(item.profit_amount), 0) - expenseTotal,
    [expenseTotal, gcashEntries],
  )

  const gcashProfitPreview = useMemo(
    () => parseAmount(gcashSalesAmount) - parseAmount(gcashAmountMoved),
    [gcashAmountMoved, gcashSalesAmount],
  )

  const etherealCashDiscountPreview = useMemo(
    () => (parseAmount(etherealServiceCost) * parseAmount(etherealDiscountPercentage)) / 100,
    [etherealDiscountPercentage, etherealServiceCost],
  )

  const etherealNetPreview = useMemo(
    () => parseAmount(etherealServiceCost) - etherealCashDiscountPreview,
    [etherealCashDiscountPreview, etherealServiceCost],
  )

  const dateInputMax = useMemo(() => formatDateTimeLocal(new Date()), [])
  const dateInputMin = useMemo(() => {
    if (meQuery.data?.role === 'admin' || meQuery.data?.role === 'owner') {
      return undefined
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    return formatDateTimeLocal(startOfToday)
  }, [meQuery.data?.role])

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    await loginMutation.mutateAsync({
      username: String(form.get('username') ?? ''),
      password: String(form.get('password') ?? ''),
    })
  }

  const submitStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBusinessId) {
      return
    }

    const form = new FormData(event.currentTarget)

    await createStaffMutation.mutateAsync({
      full_name: String(form.get('full_name') ?? ''),
      age: Number(form.get('age') ?? 0),
      employment_start_date: String(form.get('employment_start_date') ?? ''),
      employment_end_date: String(form.get('employment_end_date') ?? ''),
      employment_type: String(form.get('employment_type') ?? ''),
      salary: Number(form.get('salary') ?? 0),
      is_active: String(form.get('is_active') ?? '1') === '1',
    })

    event.currentTarget.reset()
  }

  const submitExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBusinessId) {
      return
    }

    const form = new FormData(event.currentTarget)

    await createExpenseMutation.mutateAsync({
      date_issued: String(form.get('date_issued') ?? ''),
      amount: Number(form.get('amount') ?? 0),
      description: String(form.get('description') ?? ''),
      purpose: String(form.get('purpose') ?? 'business') as 'business' | 'business_portfolio' | 'service',
      payment_type: String(form.get('payment_type') ?? 'one_time') as 'one_time' | 'repeat',
      recurrence_reference: String(form.get('recurrence_reference') ?? ''),
    })

    event.currentTarget.reset()
  }

  const submitReferenceItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBusinessId) {
      return
    }

    const form = new FormData(event.currentTarget)

    await createReferenceItemMutation.mutateAsync({
      item_type: String(form.get('item_type') ?? 'product') as 'product' | 'service',
      name: String(form.get('name') ?? ''),
      price: Number(form.get('price') ?? 0),
      description: String(form.get('description') ?? ''),
    })

    event.currentTarget.reset()
  }

  const submitGcash = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBusinessId) {
      return
    }

    const form = new FormData(event.currentTarget)

    await createGcashMutation.mutateAsync({
      transaction_recipient: String(form.get('transaction_recipient') ?? '') || undefined,
      amount_moved: Number(form.get('amount_moved') ?? 0),
      sales_amount: Number(form.get('sales_amount') ?? 0),
      transaction_type: String(form.get('transaction_type') ?? 'cash_in') as 'cash_in' | 'cash_out',
      transaction_date: String(form.get('transaction_date') ?? ''),
    })

    event.currentTarget.reset()
    setGcashAmountMoved('0')
    setGcashSalesAmount('0')
  }

  const submitCoffee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBusinessId) {
      return
    }

    const form = new FormData(event.currentTarget)

    await createCoffeeMutation.mutateAsync({
      price: Number(form.get('price') ?? 0),
      coffee_type: String(form.get('coffee_type') ?? ''),
      size: String(form.get('size') ?? '8oz') as '8oz' | '9oz' | '12oz' | '16oz' | '18oz',
      add_on_price: Number(form.get('add_on_price') ?? 0),
      add_on_description: String(form.get('add_on_description') ?? ''),
      sale_date: String(form.get('sale_date') ?? ''),
    })

    event.currentTarget.reset()
  }

  const submitPrint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBusinessId) {
      return
    }

    const form = new FormData(event.currentTarget)

    await createPrintMutation.mutateAsync({
      job_type: String(form.get('job_type') ?? ''),
      description: String(form.get('description') ?? ''),
      color_mode: String(form.get('color_mode') ?? 'black') as 'black' | 'white',
      print_size: String(form.get('print_size') ?? 'short'),
      paper_count: Number(form.get('paper_count') ?? 1),
      sales_amount: Number(form.get('sales_amount') ?? 0),
      sale_date: String(form.get('sale_date') ?? ''),
    })

    event.currentTarget.reset()
  }

  const submitEthereal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBusinessId) {
      return
    }

    const form = new FormData(event.currentTarget)

    await createEtherealMutation.mutateAsync({
      staff_id: Number(form.get('staff_id') ?? 0),
      service_cost: Number(form.get('service_cost') ?? 0),
      discount_percentage: Number(form.get('discount_percentage') ?? 0),
      customer_name: String(form.get('customer_name') ?? ''),
      discount_type: String(form.get('discount_type') ?? 'promo'),
      service_date: String(form.get('service_date') ?? ''),
    })

    event.currentTarget.reset()
    setEtherealServiceCost('0')
    setEtherealDiscountPercentage('0')
  }

  const submitPortfolioCapital = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const direction = String(form.get('direction') ?? 'add') as 'add' | 'deduct' | 'transfer'
    const targetBusinessId = Number(form.get('target_business_id') ?? 0)

    await createPortfolioCapitalMutation.mutateAsync({
      amount: Number(form.get('amount') ?? 0),
      direction,
      target_business_id: direction === 'transfer' && targetBusinessId ? targetBusinessId : undefined,
      occurred_on: String(form.get('occurred_on') ?? ''),
      notes: String(form.get('notes') ?? ''),
      reauth_username: String(form.get('reauth_username') ?? ''),
      reauth_password: String(form.get('reauth_password') ?? ''),
    })

    event.currentTarget.reset()
  }

  const submitBusinessCapital = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBusinessId) {
      return
    }

    const form = new FormData(event.currentTarget)

    await createBusinessCapitalMutation.mutateAsync({
      amount: Number(form.get('amount') ?? 0),
      direction: String(form.get('direction') ?? 'add') as 'add' | 'deduct',
      occurred_on: String(form.get('occurred_on') ?? ''),
      notes: String(form.get('notes') ?? ''),
    })

    event.currentTarget.reset()
  }

  if (!meQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--surface-page)] px-4 py-8 text-[var(--neutral-espresso)]">
        <section className="w-full max-w-md rounded-2xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] p-8 shadow-[0_18px_44px_rgba(58,9,18,0.1)]">
          <h1 className="text-2xl font-semibold">Parcon FMS</h1>
          <p className="mt-2 text-sm text-[var(--neutral-rosewood)]">Login with your backend user credentials.</p>
          <form onSubmit={submitLogin} className="mt-6 grid gap-3">
            <input name="username" placeholder="Username" required className="dashboard-input" />
            <input name="password" type="password" placeholder="Password" required className="dashboard-input" />
            <button type="submit" disabled={loginMutation.isPending} className="dashboard-button-primary">
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>
          </form>
          {loginMutation.error ? <p className="mt-3 text-sm text-[var(--status-danger-text)]">{loginMutation.error.message}</p> : null}
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--surface-page)] text-[var(--neutral-espresso)]">
      <div className="mx-auto grid w-full max-w-[1460px] gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[var(--neutral-linen)] bg-[var(--surface-raised)] p-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-auto">
          <div className="rounded-xl bg-[var(--surface-card)] p-4">
            <h1 className="text-lg font-semibold text-[var(--burgundy-800)]">Parcon FMS</h1>
            <p className="mt-1 text-xs text-[var(--neutral-rosewood)]">Dashboard workspace</p>
          </div>
          <nav className="mt-4 grid gap-1">
            {navItems.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                  tab === item.value
                    ? 'bg-[var(--burgundy-600)] text-white'
                    : 'text-[var(--neutral-rosewood)] hover:bg-[var(--burgundy-50)] hover:text-[var(--burgundy-800)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="grid gap-6">
          <header className="rounded-2xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] p-5 shadow-[0_8px_24px_rgba(58,9,18,0.07)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--neutral-rosewood)]">Welcome back</p>
                <h2 className="text-2xl font-semibold">{meQuery.data.name}</h2>
                <p className="text-xs text-[var(--burgundy-600)]">Role: {meQuery.data.role}</p>
              </div>
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="dashboard-button-secondary"
              >
                Logout
              </button>
            </div>

            <div className="mt-5 grid gap-2 lg:grid-cols-3">
              {businesses.map((business) => {
                const active = selectedBusinessId === business.id
                return (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => setSelectedBusinessId(business.id)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-[var(--burgundy-600)] bg-[var(--burgundy-50)] text-[var(--burgundy-800)]'
                        : 'border-[var(--neutral-linen)] bg-[var(--surface-card)] text-[var(--neutral-rosewood)] hover:border-[var(--burgundy-400)] hover:bg-[var(--burgundy-50)]'
                    }`}
                  >
                    <p className="text-sm font-semibold">{business.name}</p>
                    <p className="text-xs">{business.slug}</p>
                  </button>
                )
              })}
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className={cardClass}>
              <p className="text-xs uppercase tracking-wider text-[var(--neutral-rosewood)]">Active business</p>
              <p className="mt-2 text-xl font-semibold">{selectedBusinessName ?? 'No business selected'}</p>
            </article>
            <article className={cardClass}>
              <p className="text-xs uppercase tracking-wider text-[var(--neutral-rosewood)]">Sales total</p>
              <p className="mt-2 text-xl font-semibold text-[var(--accent-gold)]">{formatCurrency(salesTotal)}</p>
            </article>
            <article className={cardClass}>
              <p className="text-xs uppercase tracking-wider text-[var(--neutral-rosewood)]">Expenses total</p>
              <p className="mt-2 text-xl font-semibold text-[var(--status-danger-text)]">{formatCurrency(expenseTotal)}</p>
            </article>
            <article className={cardClass}>
              <p className="text-xs uppercase tracking-wider text-[var(--neutral-rosewood)]">Profit snapshot</p>
              <p
                className={`mt-2 text-xl font-semibold ${
                  profitSnapshot >= 0 ? 'text-[var(--teal-mid)]' : 'text-[var(--status-danger-text)]'
                }`}
              >
                {formatCurrency(profitSnapshot)}
              </p>
            </article>
          </section>

          {tab === 'overview' ? (
            <section className="grid gap-4 lg:grid-cols-2">
              <article className={cardClass}>
                <h3 className="text-lg font-semibold">Operations snapshot</h3>
                <ul className="mt-4 grid gap-3 text-sm text-[var(--neutral-rosewood)]">
                  <li className="rounded-lg bg-[var(--burgundy-50)] px-3 py-2">Staff records: {staffEntries.length}</li>
                  <li className="rounded-lg bg-[var(--status-info-bg)] px-3 py-2 text-[var(--status-info-text)]">
                    Capital movements: {(capitalMovementsQuery.data?.data ?? []).length}
                  </li>
                  <li className="rounded-lg bg-[var(--status-warning-bg)] px-3 py-2 text-[var(--status-warning-text)]">
                    Expense entries: {expenseEntries.length}
                  </li>
                  <li className="rounded-lg bg-[var(--status-success-bg)] px-3 py-2 text-[var(--status-success-text)]">
                    Sales entries: {gcashEntries.length + coffeeEntries.length + printEntries.length + etherealEntries.length}
                  </li>
                </ul>
              </article>
              <article className={cardClass}>
                <h3 className="text-lg font-semibold">Analytics-ready layout</h3>
                <p className="mt-3 text-sm text-[var(--neutral-rosewood)]">
                  This dashboard card area is prepared for future charts and cross-business analytics widgets.
                </p>
                <div className="mt-6 grid gap-3">
                  <div className="h-2 rounded-full bg-[var(--neutral-linen)]">
                    <div className="h-2 w-2/3 rounded-full bg-[var(--burgundy-600)]" />
                  </div>
                  <div className="h-2 rounded-full bg-[var(--neutral-linen)]">
                    <div className="h-2 w-1/2 rounded-full bg-[var(--accent-gold)]" />
                  </div>
                  <div className="h-2 rounded-full bg-[var(--neutral-linen)]">
                    <div className="h-2 w-3/4 rounded-full bg-[var(--teal-mid)]" />
                  </div>
                </div>
              </article>
            </section>
          ) : null}

          {tab === 'businesses' ? (
            <section className={cardClass}>
              <h3 className="text-lg font-semibold">Businesses</h3>
              <p className="mt-1 text-sm text-[var(--neutral-rosewood)]">
                Businesses are seeded by default and managed from backend seeders.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {businesses.map((business) => (
                  <article key={business.id} className="rounded-xl border border-[var(--neutral-linen)] p-4">
                    <p className="font-semibold">{business.name}</p>
                    <p className="text-xs text-[var(--neutral-rosewood)]">{business.slug}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {tab === 'staff' ? (
            <section className={cardClass}>
              <h3 className="text-lg font-semibold">Staff</h3>
              <form onSubmit={submitStaff} className={formGridClass}>
                <input name="full_name" placeholder="Full name" required className="dashboard-input" />
                <input name="age" type="number" min="16" placeholder="Age" required className="dashboard-input" />
                <input name="employment_start_date" type="date" required className="dashboard-input" />
                <input name="employment_end_date" type="date" className="dashboard-input" />
                <input name="employment_type" placeholder="Employment type" required className="dashboard-input" />
                <input name="salary" type="number" step="0.01" placeholder="Salary" required className="dashboard-input" />
                <select name="is_active" defaultValue="1" className="dashboard-input">
                  <option value="1">active</option>
                  <option value="0">inactive</option>
                </select>
                <button type="submit" disabled={!selectedBusinessId || createStaffMutation.isPending} className="dashboard-button-primary">
                  Add staff
                </button>
              </form>
              <div className="mt-5 overflow-auto rounded-xl border border-[var(--neutral-linen)]">
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--surface-raised)] text-left text-xs uppercase tracking-wider text-[var(--neutral-rosewood)]">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffEntries.map((staff) => (
                      <tr key={staff.id} className="border-t border-[var(--neutral-linen)]">
                        <td className="px-3 py-2">{staff.full_name}</td>
                        <td className="px-3 py-2">{staff.employment_type}</td>
                        <td className="px-3 py-2">{formatCurrency(parseAmount(staff.salary))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {staffEntries.length === 0 ? <p className="px-3 py-4 text-sm text-[var(--neutral-rosewood)]">No staff yet.</p> : null}
              </div>
            </section>
          ) : null}

          {tab === 'referenceItems' ? (
            <section className={cardClass}>
              <h3 className="text-lg font-semibold">Business Product/Service Items</h3>
              <form onSubmit={submitReferenceItem} className={formGridClass}>
                <div className="md:col-span-2 lg:col-span-3 grid gap-2 sm:grid-cols-2">
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm">
                    <input type="radio" name="item_type" value="product" defaultChecked className="mr-2" />
                    product
                  </label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm">
                    <input type="radio" name="item_type" value="service" className="mr-2" />
                    service
                  </label>
                </div>
                <input name="name" placeholder="Item name" required className="dashboard-input" />
                <input name="price" type="number" step="0.01" min="0" placeholder="Base price" required className="dashboard-input" />
                <input name="description" placeholder="Description (optional)" className="dashboard-input" />
                <button type="submit" disabled={!selectedBusinessId || createReferenceItemMutation.isPending} className="dashboard-button-primary">
                  Save reference item
                </button>
              </form>
              {referenceItemsQuery.isLoading ? <p className="mt-4 text-sm text-[var(--neutral-rosewood)]">Loading reference items...</p> : null}
              <ul className="mt-5 grid gap-2 text-sm">
                {referenceItems.map((item) => (
                  <li key={item.id} className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2">
                    <span className="font-medium">[{item.item_type}] {item.name}</span> — {formatCurrency(parseAmount(item.price))}
                    {item.description ? <span className="text-[var(--neutral-rosewood)]"> · {item.description}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tab === 'expenses' ? (
            <section className={cardClass}>
              <h3 className="text-lg font-semibold">Expenses</h3>
              <form onSubmit={submitExpense} className={formGridClass}>
                <input name="date_issued" type="datetime-local" max={dateInputMax} min={dateInputMin} defaultValue={dateInputMax} required className="dashboard-input" />
                <input name="amount" type="number" step="0.01" placeholder="Amount" required className="dashboard-input" />
                <input name="description" placeholder="Description" required className="dashboard-input" />
                <div className="md:col-span-2 lg:col-span-3 grid gap-2 sm:grid-cols-3">
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="purpose" value="business" defaultChecked className="mr-2" />business</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="purpose" value="business_portfolio" className="mr-2" />business_portfolio</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="purpose" value="service" className="mr-2" />service</label>
                </div>
                <div className="md:col-span-2 lg:col-span-3 grid gap-2 sm:grid-cols-2">
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="payment_type" value="one_time" defaultChecked className="mr-2" />one_time</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="payment_type" value="repeat" className="mr-2" />repeat</label>
                </div>
                <input name="recurrence_reference" placeholder="Recurrence reference" className="dashboard-input" />
                <button
                  type="submit"
                  disabled={!selectedBusinessId || createExpenseMutation.isPending}
                  className="dashboard-button-primary"
                >
                  Add expense
                </button>
              </form>
              {expensesQuery.isLoading ? <p className="mt-4 text-sm text-[var(--neutral-rosewood)]">Loading expenses...</p> : null}
              <ul className="mt-5 grid gap-2 text-sm">
                {expenseEntries.map((expense) => (
                  <li key={expense.id} className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2">
                    {formatDateTimeDisplay(expense.date_issued)} ({formatRelative(expense.date_issued)}): {expense.description} —{' '}
                    <span className="text-[var(--status-danger-text)]">{formatCurrency(parseAmount(expense.amount))}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tab === 'gcash' ? (
            <section className={cardClass}>
              <h3 className="text-lg font-semibold">GCash Sales</h3>
              <form onSubmit={submitGcash} className={formGridClass}>
                <input name="transaction_recipient" placeholder="Recipient (optional)" className="dashboard-input" />
                <input
                  name="amount_moved"
                  type="number"
                  step="0.01"
                  placeholder="Moved cash"
                  required
                  value={gcashAmountMoved}
                  onChange={(event) => setGcashAmountMoved(event.target.value)}
                  className="dashboard-input"
                />
                <input
                  name="sales_amount"
                  type="number"
                  step="0.01"
                  placeholder="Sales amount"
                  required
                  value={gcashSalesAmount}
                  onChange={(event) => setGcashSalesAmount(event.target.value)}
                  className="dashboard-input"
                />
                <input value={gcashProfitPreview.toFixed(2)} readOnly className="dashboard-input bg-[var(--surface-raised)]" />
                <div className="md:col-span-2 lg:col-span-3 grid gap-2 sm:grid-cols-2">
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="transaction_type" value="cash_in" defaultChecked className="mr-2" />cash_in</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="transaction_type" value="cash_out" className="mr-2" />cash_out</label>
                </div>
                <input name="transaction_date" type="datetime-local" max={dateInputMax} min={dateInputMin} defaultValue={dateInputMax} required className="dashboard-input" />
                <button type="submit" disabled={!selectedBusinessId || createGcashMutation.isPending} className="dashboard-button-primary">
                  Add GCash entry
                </button>
              </form>
              <p className="mt-2 text-xs text-[var(--neutral-rosewood)]">Profit is auto-computed from sales amount and moved cash.</p>
              {gcashQuery.isLoading ? <p className="mt-4 text-sm text-[var(--neutral-rosewood)]">Loading GCash sales...</p> : null}
              <ul className="mt-5 grid gap-2 text-sm">
                {gcashEntries.map((sale) => (
                  <li key={sale.id} className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2">
                    {formatDateTimeDisplay(sale.transaction_date)} ({formatRelative(sale.transaction_date)}): {sale.transaction_recipient ?? 'n/a'} —{' '}
                    <span className="text-[var(--accent-gold)]">{formatCurrency(parseAmount(sale.sales_amount))}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tab === 'coffee' ? (
            <section className={cardClass}>
              <h3 className="text-lg font-semibold">Coffee Sales</h3>
              <form onSubmit={submitCoffee} className={formGridClass}>
                <input name="price" type="number" step="0.01" placeholder="Price" required className="dashboard-input" />
                <input name="coffee_type" list="coffee-reference-items" placeholder="Coffee type" required className="dashboard-input" />
                <datalist id="coffee-reference-items">
                  {productReferenceItems.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
                <div className="md:col-span-2 lg:col-span-3 grid gap-2 sm:grid-cols-5">
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="size" value="8oz" defaultChecked className="mr-2" />8oz</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="size" value="9oz" className="mr-2" />9oz</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="size" value="12oz" className="mr-2" />12oz</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="size" value="16oz" className="mr-2" />16oz</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="size" value="18oz" className="mr-2" />18oz</label>
                </div>
                <input name="add_on_price" type="number" step="0.01" min="0" placeholder="Add-ons price" required className="dashboard-input" />
                <input name="add_on_description" placeholder="Add-ons description (optional)" className="dashboard-input" />
                <input name="sale_date" type="datetime-local" max={dateInputMax} min={dateInputMin} defaultValue={dateInputMax} required className="dashboard-input" />
                <button type="submit" disabled={!selectedBusinessId || createCoffeeMutation.isPending} className="dashboard-button-primary">
                  Add coffee sale
                </button>
              </form>
              {coffeeQuery.isLoading ? <p className="mt-4 text-sm text-[var(--neutral-rosewood)]">Loading coffee sales...</p> : null}
              <ul className="mt-5 grid gap-2 text-sm">
                {coffeeEntries.map((sale) => (
                  <li key={sale.id} className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2">
                    {formatDateTimeDisplay(sale.sale_date)} ({formatRelative(sale.sale_date)}): {sale.coffee_type} ({sale.size}) —{' '}
                    <span className="text-[var(--accent-gold)]">{formatCurrency(parseAmount(sale.price))}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tab === 'print' ? (
            <section className={cardClass}>
              <h3 className="text-lg font-semibold">Print Sales</h3>
              <form onSubmit={submitPrint} className={formGridClass}>
                <div className="md:col-span-2 lg:col-span-3 grid gap-2 sm:grid-cols-3">
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="job_type" value="xerox" defaultChecked className="mr-2" />xerox</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="job_type" value="document" className="mr-2" />document</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="job_type" value="other" className="mr-2" />other</label>
                </div>
                <input name="description" list="print-reference-items" placeholder="Description" required className="dashboard-input" />
                <datalist id="print-reference-items">
                  {productReferenceItems.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
                <div className="md:col-span-2 lg:col-span-3 grid gap-2 sm:grid-cols-2">
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="color_mode" value="black" defaultChecked className="mr-2" />black</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="color_mode" value="white" className="mr-2" />white</label>
                </div>
                <div className="md:col-span-2 lg:col-span-3 grid gap-2 sm:grid-cols-4">
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="print_size" value="short" defaultChecked className="mr-2" />short</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="print_size" value="long" className="mr-2" />long</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="print_size" value="a4" className="mr-2" />a4</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="print_size" value="legal" className="mr-2" />legal</label>
                </div>
                <input name="paper_count" type="number" min="1" placeholder="Paper count" required className="dashboard-input" />
                <input name="sales_amount" type="number" step="0.01" placeholder="Sales amount" required className="dashboard-input" />
                <input name="sale_date" type="datetime-local" max={dateInputMax} min={dateInputMin} defaultValue={dateInputMax} required className="dashboard-input" />
                <button type="submit" disabled={!selectedBusinessId || createPrintMutation.isPending} className="dashboard-button-primary">
                  Add print sale
                </button>
              </form>
              {printQuery.isLoading ? <p className="mt-4 text-sm text-[var(--neutral-rosewood)]">Loading print sales...</p> : null}
              <ul className="mt-5 grid gap-2 text-sm">
                {printEntries.map((sale) => (
                  <li key={sale.id} className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2">
                    {formatDateTimeDisplay(sale.sale_date)} ({formatRelative(sale.sale_date)}): {sale.job_type} ({sale.color_mode}, {sale.print_size}, {sale.paper_count}) —{' '}
                    <span className="text-[var(--accent-gold)]">{formatCurrency(parseAmount(sale.sales_amount))}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tab === 'ethereal' ? (
            <section className={cardClass}>
              <h3 className="text-lg font-semibold">Ethereal Sales</h3>
              <form onSubmit={submitEthereal} className={formGridClass}>
                <select name="staff_id" defaultValue="" required className="dashboard-input">
                  <option value="" disabled>
                    Select service provider
                  </option>
                  {staffEntries.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.full_name}
                    </option>
                  ))}
                </select>
                <input name="customer_name" placeholder="Customer name (optional)" className="dashboard-input" />
                <input
                  name="service_cost"
                  type="number"
                  step="0.01"
                  placeholder="Service cost"
                  required
                  value={etherealServiceCost}
                  onChange={(event) => setEtherealServiceCost(event.target.value)}
                  className="dashboard-input"
                />
                <input
                  name="discount_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Discount %"
                  required
                  value={etherealDiscountPercentage}
                  onChange={(event) => setEtherealDiscountPercentage(event.target.value)}
                  className="dashboard-input"
                />
                <div className="md:col-span-2 lg:col-span-3 grid gap-2 sm:grid-cols-3">
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="discount_type" value="family/friends/church-mem" className="mr-2" />family/friends/church-mem</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="discount_type" value="promo" defaultChecked className="mr-2" />promo</label>
                  <label className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2 text-sm"><input type="radio" name="discount_type" value="new-customer" className="mr-2" />new-customer</label>
                </div>
                <input name="service_date" type="datetime-local" max={dateInputMax} min={dateInputMin} defaultValue={dateInputMax} required className="dashboard-input" />
                <button
                  type="submit"
                  disabled={!selectedBusinessId || createEtherealMutation.isPending}
                  className="dashboard-button-primary"
                >
                  Add ethereal sale
                </button>
              </form>
              <p className="mt-2 text-xs text-[var(--neutral-rosewood)]">
                Live preview — cash discount: {formatCurrency(etherealCashDiscountPreview)} | net: {formatCurrency(etherealNetPreview)}
              </p>
              <p className="mt-1 text-xs text-[var(--neutral-rosewood)]">
                Service references: {serviceReferenceItems.slice(0, 3).map((item) => item.name).join(', ') || 'none'}
              </p>
              {etherealQuery.isLoading ? <p className="mt-4 text-sm text-[var(--neutral-rosewood)]">Loading ethereal sales...</p> : null}
              <ul className="mt-5 grid gap-2 text-sm">
                {etherealEntries.map((sale) => (
                  <li key={sale.id} className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2">
                    {formatDateTimeDisplay(sale.service_date)} ({formatRelative(sale.service_date)}): net{' '}
                    <span className="text-[var(--accent-gold)]">{formatCurrency(parseAmount(sale.net_amount))}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tab === 'portfolioCapital' ? (
            <section className={cardClass}>
              <h3 className="text-lg font-semibold">Portfolio Money</h3>
              <form onSubmit={submitPortfolioCapital} className={formGridClass}>
                <input name="amount" type="number" step="0.01" placeholder="Amount" required className="dashboard-input" />
                <select name="direction" defaultValue="add" className="dashboard-input">
                  <option value="add">add</option>
                  <option value="deduct">deduct</option>
                  <option value="transfer">transfer to business</option>
                </select>
                <select name="target_business_id" defaultValue="" className="dashboard-input">
                  <option value="">Transfer target (required for transfer)</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
                <input name="occurred_on" type="date" required className="dashboard-input" />
                <input name="notes" placeholder="Notes" className="dashboard-input" />
                <input name="reauth_username" placeholder="Re-auth username" required className="dashboard-input" />
                <input name="reauth_password" type="password" placeholder="Re-auth password" required className="dashboard-input" />
                <button type="submit" disabled={createPortfolioCapitalMutation.isPending} className="dashboard-button-primary">
                  Save portfolio movement
                </button>
              </form>
              <ul className="mt-5 grid gap-2 text-sm">
                {portfolioMovements.map((movement) => (
                  <li key={movement.id} className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2">
                    {movement.occurred_on}: {movement.direction} — {formatCurrency(parseAmount(movement.amount))}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tab === 'businessCapital' ? (
            <section className={cardClass}>
              <h3 className="text-lg font-semibold">Business Money {selectedBusinessName ? `(${selectedBusinessName})` : ''}</h3>
              <form onSubmit={submitBusinessCapital} className={formGridClass}>
                <input name="amount" type="number" step="0.01" placeholder="Amount" required className="dashboard-input" />
                <select name="direction" defaultValue="add" className="dashboard-input">
                  <option value="add">add from portfolio</option>
                  <option value="deduct">deduct to return portfolio</option>
                </select>
                <input name="occurred_on" type="date" required className="dashboard-input" />
                <input name="notes" placeholder="Notes" className="dashboard-input" />
                <button type="submit" disabled={!selectedBusinessId || createBusinessCapitalMutation.isPending} className="dashboard-button-primary">
                  Save business movement
                </button>
              </form>
              <ul className="mt-5 grid gap-2 text-sm">
                {businessMovements.map((movement) => (
                  <li key={movement.id} className="rounded-lg border border-[var(--neutral-linen)] px-3 py-2">
                    {movement.occurred_on}: {movement.direction} — {formatCurrency(parseAmount(movement.amount))}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  )
}

export default App
