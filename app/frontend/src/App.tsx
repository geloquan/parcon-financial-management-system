import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLogin, useLogout, useMe } from './hooks/use-auth'
import { useBusinesses } from './hooks/use-businesses'
import { useCreateExpense, useExpenses } from './hooks/use-expenses'
import { useCreateGcashSale, useGcashSales } from './hooks/use-gcash-sales'
import { useCreateCoffeeSale, useCoffeeSales } from './hooks/use-coffee-sales'
import { useCreatePrintSale, usePrintSales } from './hooks/use-print-sales'
import { useCreateEtherealSale, useEtherealSales } from './hooks/use-ethereal-sales'
import { useGenerateSalesReport } from './hooks/use-sales-reports'
import { useCreateStaff, useStaff } from './hooks/use-staff'
import {
  useCreateStaffSchedule,
  useSwapStaffSchedules,
  useStaffSchedules,
  useUpdateStaffSchedule,
} from './hooks/use-staff-schedules'
import { useBusinessReferenceItems, useCreateBusinessReferenceItem } from './hooks/use-business-reference-items'
import { useCompensationRuns, useCreateCompensationRun, useFinalizeCompensationRun } from './hooks/use-compensation-runs'
import { useCreateSalesReport, useDownloadSalesReport, useSalesReports } from './hooks/use-sales-reports'
import {
  CalendarCheck2,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Building2,
  Coffee,
  LayoutDashboard,
  LogIn,
  NotebookPen,
  Printer,
  ReceiptText,
  Sparkles,
  UserRound,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  ChevronRight,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import type { SalesReport } from './types/api'
import {
  useCapitalMovements,
  useCreateBusinessCapitalMovement,
  useCreatePortfolioCapitalMovement,
} from './hooks/use-capital-movements'
import {formatCompactDate, formatScheduleDate} from "./services/formatDate.ts";

type Tab =
  | 'overview'
  | 'businesses'
  | 'staff'
  | 'scheduleAttendance'
  | 'compensation'
  | 'referenceItems'
  | 'expenses'
  | 'gcash'
  | 'coffee'
  | 'print'
  | 'ethereal'
  | 'salesReports'
  | 'portfolioCapital'
  | 'businessCapital'
  | 'pdfSalesReports'

type MoneyReauthCredentials = {
  reauth_username: string
  reauth_password: string
}

type CoffeeDraftItem = {
  price: string
  coffee_type: string
  size: '8oz' | '9oz' | '12oz' | '16oz' | '18oz'
  add_on_price: string
  add_on_description: string
  sale_date: string
}

type PrintDraftItem = {
  job_type: string
  description: string
  color_mode: 'black' | 'white'
  print_size: string
  paper_count: string
  sales_amount: string
  sale_date: string
}

type EtherealDraftItem = {
  staff_ids: number[]
  customer_name: string
  service_cost: string
  discount_percentage: string
  discount_type: string
  service_date: string
}

const makeDateTimeDefault = () => formatDateTimeLocal(new Date())

const createCoffeeDraftItem = (): CoffeeDraftItem => ({
  price: '',
  coffee_type: '',
  size: '8oz',
  add_on_price: '0',
  add_on_description: '',
  sale_date: makeDateTimeDefault(),
})

const createPrintDraftItem = (): PrintDraftItem => ({
  job_type: 'xerox',
  description: '',
  color_mode: 'black',
  print_size: 'short',
  paper_count: '1',
  sales_amount: '',
  sale_date: makeDateTimeDefault(),
})

const createEtherealDraftItem = (): EtherealDraftItem => ({
  staff_ids: [],
  customer_name: '',
  service_cost: '0',
  discount_percentage: '0',
  discount_type: 'promo',
  service_date: makeDateTimeDefault(),
})

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

const formatDateOnly = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateTimeDisplay = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
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
  if (Number.isNaN(date.getTime())) return 'unknown time'
  const seconds = Math.max(Math.floor((Date.now() - date.getTime()) / 1000), 0)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ─── Nav Groups ──────────────────────────────────────────────────────────────
const navGroups: Array<{
  label: string
  items: Array<{ value: Tab; label: string; icon: LucideIcon }>
}> = [
  {
    label: 'Overview',
    items: [
      { value: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { value: 'businesses', label: 'Businesses', icon: Building2 },
    ],
  },
  {
    label: 'Management',
    items: [
      { value: 'staff', label: 'Staff', icon: UserRound },
      { value: 'scheduleAttendance', label: 'Schedule & Attendance', icon: CalendarCheck2 },
      { value: 'compensation', label: 'Compensation', icon: BanknoteArrowUp },
      { value: 'referenceItems', label: 'Reference Items', icon: NotebookPen },
      { value: 'expenses', label: 'Expenses', icon: ReceiptText },
    ],
  },
  {
    label: 'Sales',
    items: [
      { value: 'gcash', label: 'GCash', icon: Wallet },
      { value: 'coffee', label: 'Coffee', icon: Coffee },
      { value: 'print', label: 'Print', icon: Printer },
      { value: 'ethereal', label: 'Ethereal', icon: Sparkles },
      { value: 'salesReports', label: 'Sales Reports', icon: FileText },
    ],
  },
  {
    label: 'Capital',
    items: [
      { value: 'portfolioCapital', label: 'Portfolio Money', icon: BanknoteArrowUp },
      { value: 'businessCapital', label: 'Business Money', icon: BanknoteArrowDown },
      { value: 'pdfSalesReports', label: 'PDF Sales Reports', icon: FileText },
    ],
  },
]

// ─── Shared class constants ───────────────────────────────────────────────────
const cardClass =
  'rounded-xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] p-6 shadow-[0_4px_20px_rgba(58,9,18,0.06)]'

const formGridClass = 'mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3'

// Pill-style radio/checkbox option
// Uses CSS has-[:checked] so the label reacts to the actual DOM checked state —
// works for both controlled (checked=) and uncontrolled (defaultChecked) inputs.
const optionPillClass =
  'flex cursor-pointer select-none items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ' +
  'border-[var(--neutral-linen)] bg-[var(--surface-card)] text-[var(--neutral-rosewood)] ' +
  'hover:border-[var(--burgundy-200)] hover:text-[var(--burgundy-800)] ' +
  'has-[:checked]:border-[var(--burgundy-600)] has-[:checked]:bg-[var(--burgundy-50)] ' +
  'has-[:checked]:text-[var(--burgundy-800)] has-[:checked]:font-medium'

// Section heading inside a card
function SectionHeading({
                          icon: Icon,
                          title,
                          description,
                        }: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--burgundy-50)]">
        <Icon className="h-4 w-4 text-[var(--burgundy-600)]" />
      </span>
      <div>
        <h3 className="text-lg font-semibold text-[var(--neutral-espresso)]">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-[var(--neutral-rosewood)]">{description}</p>
        ) : null}
      </div>
    </div>
  )
}

// Divider between form and list
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mt-7 mb-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-[var(--neutral-linen)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--neutral-rosewood)]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[var(--neutral-linen)]" />
    </div>
  )
}

// Live preview callout
function LivePreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-lg border border-[var(--status-info-border)] bg-[var(--status-info-bg)] px-4 py-3">
      <ArrowRightLeft className="h-4 w-4 shrink-0 text-[var(--status-info-text)]" />
      <p className="text-xs text-[var(--status-info-text)]">{children}</p>
    </div>
  )
}

// Empty state
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--neutral-linen)] py-10 text-center">
      <p className="text-sm text-[var(--neutral-rosewood)]">{label}</p>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null)
  const [gcashAmountMoved, setGcashAmountMoved] = useState('0')
  const [gcashSalesAmount, setGcashSalesAmount] = useState('0')
  const [coffeeItems, setCoffeeItems] = useState<CoffeeDraftItem[]>([createCoffeeDraftItem()])
  const [printItems, setPrintItems] = useState<PrintDraftItem[]>([createPrintDraftItem()])
  const [etherealItems, setEtherealItems] = useState<EtherealDraftItem[]>([createEtherealDraftItem()])
  const [portfolioAmountPreview, setPortfolioAmountPreview] = useState('0')
  const [portfolioDirectionPreview, setPortfolioDirectionPreview] = useState<'add' | 'deduct' | 'transfer'>('add')
  const [businessAmountPreview, setBusinessAmountPreview] = useState('0')
  const [businessDirectionPreview, setBusinessDirectionPreview] = useState<'add' | 'deduct'>('add')
  const [scheduleDateFilter, setScheduleDateFilter] = useState<string>(formatDateOnly(new Date()))
  const [sourceScheduleId, setSourceScheduleId] = useState('')
  const [targetScheduleId, setTargetScheduleId] = useState('')
  const [compensationMode, setCompensationMode] = useState<'by_days' | 'up_to_date'>('by_days')
  const [salesReportPage, setSalesReportPage] = useState(1)
  const [reportScope, setReportScope] = useState<'portfolio' | 'business'>('portfolio')
  const [reportPeriod, setReportPeriod] = useState<'today' | 'date_range'>('today')
  const [latestSalesReport, setLatestSalesReport] = useState<SalesReport | null>(null)
  const [moneyReauthModalOpen, setMoneyReauthModalOpen] = useState(false)
  const [moneyReauthUsername, setMoneyReauthUsername] = useState('')
  const [moneyReauthPassword, setMoneyReauthPassword] = useState('')

  const moneyReauthResolverRef = useRef<((credentials: MoneyReauthCredentials | null) => void) | null>(null)

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
  const allStaffSchedulesQuery = useStaffSchedules(selectedBusinessId)
  const staffSchedulesQuery = useStaffSchedules(selectedBusinessId, scheduleDateFilter)
  const createStaffScheduleMutation = useCreateStaffSchedule(selectedBusinessId, scheduleDateFilter)
  const updateStaffScheduleMutation = useUpdateStaffSchedule(selectedBusinessId, scheduleDateFilter)
  const swapStaffSchedulesMutation = useSwapStaffSchedules(selectedBusinessId, scheduleDateFilter)
  const compensationRunsQuery = useCompensationRuns(selectedBusinessId)
  const createCompensationRunMutation = useCreateCompensationRun(selectedBusinessId)
  const finalizeCompensationRunMutation = useFinalizeCompensationRun(selectedBusinessId)
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
  const generateSalesReportMutation = useGenerateSalesReport()
  const salesReportsQuery = useSalesReports(selectedBusinessId, salesReportPage)
  const createSalesReportMutation = useCreateSalesReport(selectedBusinessId, salesReportPage)
  const downloadSalesReportMutation = useDownloadSalesReport(selectedBusinessId)

  const selectedBusinessName = useMemo(
    () => businesses.find((b) => b.id === selectedBusinessId)?.name ?? null,
    [businesses, selectedBusinessId],
  )

  const portfolioMovements = useMemo(
    () => (capitalMovementsQuery.data?.data ?? []).filter((m) => m.source_type === 'portfolio'),
    [capitalMovementsQuery.data],
  )

  const businessMovements = useMemo(
    () =>
      (capitalMovementsQuery.data?.data ?? []).filter(
        (m) => m.source_business_id === selectedBusinessId || m.target_business_id === selectedBusinessId,
      ),
    [capitalMovementsQuery.data, selectedBusinessId],
  )

  const staffEntries = useMemo(() => staffQuery.data?.data ?? [], [staffQuery.data])
  const allStaffScheduleEntries = useMemo(() => allStaffSchedulesQuery.data?.data ?? [], [allStaffSchedulesQuery.data])
  const staffScheduleEntries = useMemo(() => staffSchedulesQuery.data?.data ?? [], [staffSchedulesQuery.data])
  const compensationRuns = useMemo(() => compensationRunsQuery.data?.data ?? [], [compensationRunsQuery.data])
  const expenseEntries = useMemo(() => expensesQuery.data?.data ?? [], [expensesQuery.data])
  const gcashEntries = useMemo(() => gcashQuery.data?.data ?? [], [gcashQuery.data])
  const coffeeEntries = useMemo(() => coffeeQuery.data?.data ?? [], [coffeeQuery.data])
  const printEntries = useMemo(() => printQuery.data?.data ?? [], [printQuery.data])
  const etherealEntries = useMemo(() => etherealQuery.data?.data ?? [], [etherealQuery.data])
  const referenceItems = useMemo(() => referenceItemsQuery.data?.data ?? [], [referenceItemsQuery.data])
  const salesReportVersions = useMemo(() => salesReportsQuery.data?.data ?? [], [salesReportsQuery.data])
  const productReferenceItems = useMemo(() => referenceItems.filter((i) => i.item_type === 'product'), [referenceItems])
  const serviceReferenceItems = useMemo(() => referenceItems.filter((i) => i.item_type === 'service'), [referenceItems])
  const unresolvedAttendanceToday = useMemo(
    () => staffScheduleEntries.filter((schedule) => schedule.attendance_status === 'pending'),
    [staffScheduleEntries],
  )

  const expenseTotal = useMemo(
    () => expenseEntries.reduce((t, i) => t + parseAmount(i.amount), 0),
    [expenseEntries],
  )
  const salesTotal = useMemo(
    () =>
      gcashEntries.reduce((t, i) => t + parseAmount(i.sales_amount), 0) +
      coffeeEntries.reduce((t, i) => t + parseAmount(i.total_amount), 0) +
      printEntries.reduce((t, i) => t + parseAmount(i.sales_amount), 0) +
      etherealEntries.reduce((t, i) => t + parseAmount(i.net_amount), 0),
    [coffeeEntries, etherealEntries, gcashEntries, printEntries],
  )
  const profitSnapshot = useMemo(
    () => gcashEntries.reduce((t, i) => t + parseAmount(i.profit_amount), 0) - expenseTotal,
    [expenseTotal, gcashEntries],
  )
  const gcashProfitPreview = useMemo(
    () => parseAmount(gcashSalesAmount) - parseAmount(gcashAmountMoved),
    [gcashAmountMoved, gcashSalesAmount],
  )
  const etherealCashDiscountPreview = useMemo(() => {
    return etherealItems.reduce(
      (total, item) => total + (parseAmount(item.service_cost) * parseAmount(item.discount_percentage)) / 100,
      0,
    )
  }, [etherealItems])
  const etherealNetPreview = useMemo(() => {
    return etherealItems.reduce((total, item) => {
      const serviceCost = parseAmount(item.service_cost)
      const discount = (serviceCost * parseAmount(item.discount_percentage)) / 100
      return total + (serviceCost - discount)
    }, 0)
  }, [etherealItems])
  const coffeeBatchPreview = useMemo(
    () => coffeeItems.reduce((t, i) => t + parseAmount(i.price) + parseAmount(i.add_on_price), 0),
    [coffeeItems],
  )
  const printBatchPreview = useMemo(
    () => printItems.reduce((t, i) => t + parseAmount(i.sales_amount), 0),
    [printItems],
  )

  const capitalBalances = useMemo(() => {
    const all = capitalMovementsQuery.data?.data ?? []
    const portfolioBalance = all.reduce((bal, m) => {
      if (m.source_type !== 'portfolio') return bal
      const amt = parseAmount(m.amount)
      return m.direction === 'add' ? bal + amt : bal - amt
    }, 0)
    const businessBalance = all.reduce((bal, m) => {
      if (m.source_business_id !== selectedBusinessId) return bal
      const amt = parseAmount(m.amount)
      return m.direction === 'add' ? bal + amt : bal - amt
    }, 0)
    return { portfolioBalance, businessBalance }
  }, [capitalMovementsQuery.data, selectedBusinessId])

  const portfolioAfterPreview = useMemo(() => {
    const amt = parseAmount(portfolioAmountPreview)
    return portfolioDirectionPreview === 'add'
      ? capitalBalances.portfolioBalance + amt
      : capitalBalances.portfolioBalance - amt
  }, [capitalBalances.portfolioBalance, portfolioAmountPreview, portfolioDirectionPreview])

  const businessAfterPreview = useMemo(() => {
    const amt = parseAmount(businessAmountPreview)
    return businessDirectionPreview === 'add'
      ? capitalBalances.businessBalance + amt
      : capitalBalances.businessBalance - amt
  }, [businessAmountPreview, businessDirectionPreview, capitalBalances.businessBalance])

  const overviewAnomalies = useMemo(() => {
    const anomalies: string[] = []

    if (capitalBalances.portfolioBalance < 0) {
      anomalies.push(`Portfolio capital is negative (${formatCurrency(capitalBalances.portfolioBalance)}).`)
    }

    if (capitalBalances.businessBalance < 0) {
      anomalies.push(`Business capital is negative (${formatCurrency(capitalBalances.businessBalance)}).`)
    }

    if (profitSnapshot < 0) {
      anomalies.push(`Profit snapshot is negative (${formatCurrency(profitSnapshot)}).`)
    }

    const getDateKey = (value: string) => value.slice(0, 10)
    const today = formatDateOnly(new Date())
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = formatDateOnly(yesterdayDate)

    const salesByDay = new Map<string, number>()
    for (const entry of gcashEntries) {
      salesByDay.set(getDateKey(entry.transaction_date), (salesByDay.get(getDateKey(entry.transaction_date)) ?? 0) + parseAmount(entry.sales_amount))
    }
    for (const entry of coffeeEntries) {
      salesByDay.set(getDateKey(entry.sale_date), (salesByDay.get(getDateKey(entry.sale_date)) ?? 0) + parseAmount(entry.price))
    }
    for (const entry of printEntries) {
      salesByDay.set(getDateKey(entry.sale_date), (salesByDay.get(getDateKey(entry.sale_date)) ?? 0) + parseAmount(entry.sales_amount))
    }
    for (const entry of etherealEntries) {
      salesByDay.set(getDateKey(entry.service_date), (salesByDay.get(getDateKey(entry.service_date)) ?? 0) + parseAmount(entry.net_amount))
    }

    const todaySales = salesByDay.get(today) ?? 0
    const yesterdaySales = salesByDay.get(yesterday) ?? 0
    if (todaySales < yesterdaySales) {
      anomalies.push(`Sales relapsed vs yesterday (${formatCurrency(todaySales)} vs ${formatCurrency(yesterdaySales)}).`)
    }

    return anomalies
  }, [
    capitalBalances.businessBalance,
    capitalBalances.portfolioBalance,
    coffeeEntries,
    etherealEntries,
    gcashEntries,
    printEntries,
    profitSnapshot,
  ])

  const dateInputMax = useMemo(() => formatDateTimeLocal(new Date()), [])
  const dateInputMin = useMemo(() => {
    if (meQuery.data?.role === 'admin' || meQuery.data?.role === 'owner') return undefined
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return formatDateTimeLocal(start)
  }, [meQuery.data?.role])

  useEffect(() => {
    if (!moneyReauthModalOpen) {
      setMoneyReauthUsername(meQuery.data?.username ?? '')
    }
  }, [meQuery.data?.username, moneyReauthModalOpen])

  const requestMoneyReauth = async (): Promise<MoneyReauthCredentials | null> => {
    setMoneyReauthUsername(meQuery.data?.username ?? '')
    setMoneyReauthPassword('')
    setMoneyReauthModalOpen(true)

    return new Promise((resolve) => {
      moneyReauthResolverRef.current = resolve
    })
  }

  const resolveMoneyReauth = (credentials: MoneyReauthCredentials | null) => {
    setMoneyReauthModalOpen(false)
    setMoneyReauthPassword('')
    const resolver = moneyReauthResolverRef.current
    moneyReauthResolverRef.current = null
    resolver?.(credentials)
  }

  // ─── Submit handlers (unchanged) ──────────────────────────────────────────
  const submitLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    await loginMutation.mutateAsync({
      username: String(f.get('username') ?? ''),
      password: String(f.get('password') ?? ''),
    })
  }

  const submitStaff = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBusinessId) return
    const f = new FormData(e.currentTarget)
    await createStaffMutation.mutateAsync({
      full_name: String(f.get('full_name') ?? ''),
      age: Number(f.get('age') ?? 0),
      employment_start_date: String(f.get('employment_start_date') ?? ''),
      employment_end_date: String(f.get('employment_end_date') ?? ''),
      employment_type: String(f.get('employment_type') ?? ''),
      salary: Number(f.get('salary') ?? 0),
      is_active: String(f.get('is_active') ?? '1') === '1',
    })
    e.currentTarget.reset()
  }

  const submitStaffSchedule = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBusinessId) return
    const f = new FormData(e.currentTarget)
    await createStaffScheduleMutation.mutateAsync({
      staff_id: Number(f.get('staff_id') ?? 0),
      scheduled_on: String(f.get('scheduled_on') ?? ''),
      attendance_status: String(f.get('attendance_status') ?? 'pending') as 'pending' | 'present' | 'absent',
      notes: String(f.get('notes') ?? ''),
    })
    e.currentTarget.reset()
    setScheduleDateFilter(formatDateOnly(new Date()))
  }

  const submitSwapStaffSchedule = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBusinessId || !sourceScheduleId || !targetScheduleId) return

    await swapStaffSchedulesMutation.mutateAsync({
      source_schedule_id: Number(sourceScheduleId),
      target_schedule_id: Number(targetScheduleId),
    })

    setSourceScheduleId('')
    setTargetScheduleId('')
  }

  const markAttendance = async (scheduleId: number, attendanceStatus: 'present' | 'absent') => {
    if (!selectedBusinessId) return
    await updateStaffScheduleMutation.mutateAsync({
      scheduleId,
      payload: { attendance_status: attendanceStatus },
    })
  }

  const submitCompensationRun = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBusinessId) return
    const f = new FormData(e.currentTarget)
    const mode = String(f.get('computation_mode') ?? 'by_days') as 'by_days' | 'up_to_date'
    await createCompensationRunMutation.mutateAsync({
      computation_mode: mode,
      number_of_days: mode === 'by_days' ? Number(f.get('number_of_days') ?? 0) : undefined,
      cutoff_date: String(f.get('cutoff_date') ?? formatDateOnly(new Date())),
    })
  }

  const finalizeCompensationRun = async (runId: number) => {
    if (!selectedBusinessId) return
    await finalizeCompensationRunMutation.mutateAsync(runId)
  }

  const triggerDownloadSalesReport = async (reportId: number) => {
    const download = await downloadSalesReportMutation.mutateAsync(reportId)
    const url = URL.createObjectURL(download.blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = download.filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const submitExpense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBusinessId) return
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const f = new FormData(e.currentTarget)
    await createExpenseMutation.mutateAsync({
      date_issued: String(f.get('date_issued') ?? ''),
      amount: Number(f.get('amount') ?? 0),
      description: String(f.get('description') ?? ''),
      purpose: String(f.get('purpose') ?? 'business') as 'business' | 'business_portfolio' | 'service',
      payment_type: String(f.get('payment_type') ?? 'one_time') as 'one_time' | 'repeat',
      recurrence_reference: String(f.get('recurrence_reference') ?? ''),
      ...reauth,
    })
    e.currentTarget.reset()
  }

  const submitReferenceItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBusinessId) return
    const f = new FormData(e.currentTarget)
    await createReferenceItemMutation.mutateAsync({
      item_type: String(f.get('item_type') ?? 'product') as 'product' | 'service',
      name: String(f.get('name') ?? ''),
      price: Number(f.get('price') ?? 0),
      description: String(f.get('description') ?? ''),
    })
    e.currentTarget.reset()
  }

  const submitGcash = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBusinessId) return
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const f = new FormData(e.currentTarget)
    await createGcashMutation.mutateAsync({
      transaction_recipient: String(f.get('transaction_recipient') ?? '') || undefined,
      amount_moved: Number(f.get('amount_moved') ?? 0),
      sales_amount: Number(f.get('sales_amount') ?? 0),
      transaction_type: String(f.get('transaction_type') ?? 'cash_in') as 'cash_in' | 'cash_out',
      transaction_date: String(f.get('transaction_date') ?? ''),
      ...reauth,
    })
    e.currentTarget.reset()
    setGcashAmountMoved('0')
    setGcashSalesAmount('0')
  }

  const submitCoffee = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBusinessId) return
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const entries = coffeeItems.map((item) => ({
      price: Number(item.price || 0),
      coffee_type: item.coffee_type,
      size: item.size,
      add_on_price: Number(item.add_on_price || 0),
      add_on_description: item.add_on_description,
      sale_date: new Date(item.sale_date).toISOString(),
    }))
    await createCoffeeMutation.mutateAsync({ ...entries[0], entries, ...reauth })
    setCoffeeItems([createCoffeeDraftItem()])
  }

  const submitPrint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBusinessId) return
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const entries = printItems.map((item) => ({
      job_type: item.job_type,
      description: item.description,
      color_mode: item.color_mode,
      print_size: item.print_size,
      paper_count: Number(item.paper_count || 1),
      sales_amount: Number(item.sales_amount || 0),
      sale_date: new Date(item.sale_date).toISOString(),
    }))
    await createPrintMutation.mutateAsync({ ...entries[0], entries, ...reauth })
    setPrintItems([createPrintDraftItem()])
  }

  const submitEthereal = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBusinessId) return
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const entries = etherealItems.map((item) => ({
      staff_ids: item.staff_ids,
      service_cost: Number(item.service_cost || 0),
      discount_percentage: Number(item.discount_percentage || 0),
      customer_name: item.customer_name,
      discount_type: item.discount_type,
      service_date: item.service_date,
    }))
    await createEtherealMutation.mutateAsync({
      ...entries[0],
      staff_id: entries[0].staff_ids[0],
      staff_ids: entries[0].staff_ids,
      entries,
      ...reauth,
    })
    setEtherealItems([createEtherealDraftItem()])
  }

  const submitPortfolioCapital = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const f = new FormData(e.currentTarget)
    const direction = String(f.get('direction') ?? 'add') as 'add' | 'deduct' | 'transfer'
    const targetBusinessId = Number(f.get('target_business_id') ?? 0)
    await createPortfolioCapitalMutation.mutateAsync({
      amount: Number(f.get('amount') ?? 0),
      direction,
      target_business_id: direction === 'transfer' && targetBusinessId ? targetBusinessId : undefined,
      occurred_on: String(f.get('occurred_on') ?? ''),
      notes: String(f.get('notes') ?? ''),
      ...reauth,
    })
    e.currentTarget.reset()
    setPortfolioAmountPreview('0')
    setPortfolioDirectionPreview('add')
  }

  const submitBusinessCapital = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBusinessId) return
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const f = new FormData(e.currentTarget)
    await createBusinessCapitalMutation.mutateAsync({
      amount: Number(f.get('amount') ?? 0),
      direction: String(f.get('direction') ?? 'add') as 'add' | 'deduct',
      occurred_on: String(f.get('occurred_on') ?? ''),
      notes: String(f.get('notes') ?? ''),
      ...reauth,
    })
    e.currentTarget.reset()
    setBusinessAmountPreview('0')
    setBusinessDirectionPreview('add')
  }

  const submitSalesReport = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const scope = String(f.get('scope') ?? 'portfolio') as 'portfolio' | 'business'
    const period = String(f.get('period') ?? 'today') as 'today' | 'date_range'
    const businessId = Number(f.get('business_id') ?? 0)

    const report = await generateSalesReportMutation.mutateAsync({
      scope,
      period,
      business_id: scope === 'business' && businessId > 0 ? businessId : undefined,
      start_date: period === 'date_range' ? String(f.get('start_date') ?? '') : undefined,
      end_date: period === 'date_range' ? String(f.get('end_date') ?? '') : undefined,
    })

    setLatestSalesReport(report)
  }

  const submitMoneyReauthModal = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    resolveMoneyReauth({
      reauth_username: moneyReauthUsername,
      reauth_password: moneyReauthPassword,
    })
  }

  // ─── Login screen ─────────────────────────────────────────────────────────
  if (!meQuery.data) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--burgundy-900)] px-4 py-8">
        {/* Decorative background rings */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(133,32,48,0.55) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(196,154,108,0.18) 0%, transparent 60%)',
          }}
        />
        <section className="relative z-10 w-full max-w-sm">
          {/* Brand bar */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--burgundy-600)]">
              <BanknoteArrowUp className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Parcon FMS</h1>
            <p className="mt-1 text-sm text-[var(--burgundy-200)]">Financial Management System</p>
          </div>

          <div className="rounded-2xl border border-[rgba(236,196,202,0.15)] bg-[var(--surface-card)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
            <p className="mb-5 text-sm text-[var(--neutral-rosewood)]">Sign in with your credentials to continue.</p>
            <form onSubmit={submitLogin} className="grid gap-4">
              <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                Username
                <input name="username" required className="dashboard-input" placeholder="Enter username" />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                Password
                <input name="password" type="password" required className="dashboard-input" placeholder="••••••••" />
              </label>
              <button type="submit" disabled={loginMutation.isPending} className="dashboard-button-primary mt-1">
                <span className="inline-flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
                </span>
              </button>
            </form>
            {loginMutation.error ? (
              <p className="mt-4 rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-text)]">
                {loginMutation.error.message}
              </p>
            ) : null}
          </div>
        </section>
      </main>
    )
  }

  // ─── Authenticated shell ───────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[var(--surface-page)] text-[var(--neutral-espresso)]">
      <div className="mx-auto grid w-full max-w-[1460px] gap-6 px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)]">

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside className="rounded-2xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] p-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-auto">
          {/* Brand */}
          <div className="flex items-center gap-3 rounded-xl bg-[var(--burgundy-600)] px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <BanknoteArrowUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Parcon FMS</p>
              <p className="text-[10px] text-white/70">Dashboard workspace</p>
            </div>
          </div>

          {/* Nav groups */}
          <nav className="mt-4 grid gap-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--neutral-rosewood)]">
                  {group.label}
                </p>
                <div className="grid gap-0.5">
                  {group.items.map((item) => {
                    const active = tab === item.value
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setTab(item.value)}
                        className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                          active
                            ? 'bg-[var(--burgundy-50)] font-medium text-[var(--burgundy-800)]'
                            : 'text-[var(--neutral-rosewood)] hover:bg-[var(--surface-raised)] hover:text-[var(--burgundy-800)]'
                        }`}
                      >
                        {/* Active left indicator */}
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--burgundy-600)]" />
                        )}
                        <item.icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            active ? 'text-[var(--burgundy-600)]' : 'text-[var(--neutral-rosewood)] group-hover:text-[var(--burgundy-600)]'
                          }`}
                        />
                        {item.label}
                        {active && <ChevronRight className="ml-auto h-3 w-3 text-[var(--burgundy-400)]" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <section className="grid gap-6 self-start">

          {/* Top header */}
          <header className="rounded-2xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] p-5 shadow-[0_4px_20px_rgba(58,9,18,0.05)]">

            {/* User Greeting */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Avatar initial */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--burgundy-600)] text-sm font-bold text-white">
                  {meQuery.data.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-[var(--neutral-rosewood)]">Welcome back</p>
                  <h2 className="text-lg font-semibold leading-tight">{meQuery.data.name}</h2>
                  <span className="inline-block rounded-full bg-[var(--burgundy-50)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--burgundy-800)]">
                    {meQuery.data.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="dashboard-button-secondary"
              >
                {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>

            {/* Business selector */}
            {businesses.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--neutral-rosewood)]">
                  Active business
                </p>
                <div className="flex flex-wrap gap-2">
                  {businesses.map((business) => {
                    const active = selectedBusinessId === business.id
                    return (
                      <button
                        key={business.id}
                        type="button"
                        onClick={() => setSelectedBusinessId(business.id)}
                        className={`rounded-lg border px-4 py-2 text-left text-sm transition-all ${
                          active
                            ? 'border-[var(--burgundy-600)] bg-[var(--burgundy-600)] text-white shadow-sm'
                            : 'border-[var(--neutral-linen)] bg-[var(--surface-card)] text-[var(--neutral-rosewood)] hover:border-[var(--burgundy-200)] hover:text-[var(--burgundy-800)]'
                        }`}
                      >
                        <p className="font-semibold">{business.name}</p>
                        <p className={`text-[10px] ${active ? 'text-white/70' : 'text-[var(--neutral-rosewood)]'}`}>
                          {business.slug}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </header>

          {/* ── KPI stat cards ────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Active business */}
            <article className="flex items-center gap-4 rounded-xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] px-5 py-4 shadow-[0_4px_20px_rgba(58,9,18,0.05)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--burgundy-50)]">
                <Building2 className="h-5 w-5 text-[var(--burgundy-600)]" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Business</p>
                <p className="truncate text-base font-semibold">{selectedBusinessName ?? '—'}</p>
              </div>
            </article>

            {/* Sales total */}
            <article className="flex items-center gap-4 rounded-xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] px-5 py-4 shadow-[0_4px_20px_rgba(58,9,18,0.05)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--teal-light)]">
                <TrendingUp className="h-5 w-5 text-[var(--teal-dark)]" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Sales total</p>
                <p className="truncate text-base font-semibold text-[var(--accent-gold)]">{formatCurrency(salesTotal)}</p>
              </div>
            </article>

            {/* Expenses total */}
            <article className="flex items-center gap-4 rounded-xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] px-5 py-4 shadow-[0_4px_20px_rgba(58,9,18,0.05)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--status-danger-bg)]">
                <TrendingDown className="h-5 w-5 text-[var(--status-danger-text)]" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Expenses</p>
                <p className="truncate text-base font-semibold text-[var(--status-danger-text)]">{formatCurrency(expenseTotal)}</p>
              </div>
            </article>

            {/* Profit snapshot */}
            <article className="flex items-center gap-4 rounded-xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] px-5 py-4 shadow-[0_4px_20px_rgba(58,9,18,0.05)]">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  profitSnapshot >= 0 ? 'bg-[var(--status-success-bg)]' : 'bg-[var(--status-danger-bg)]'
                }`}
              >
                <ReceiptText
                  className={`h-5 w-5 ${profitSnapshot >= 0 ? 'text-[var(--status-success-text)]' : 'text-[var(--status-danger-text)]'}`}
                />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Profit</p>
                <p
                  className={`truncate text-base font-semibold ${
                    profitSnapshot >= 0 ? 'text-[var(--teal-mid)]' : 'text-[var(--status-danger-text)]'
                  }`}
                >
                  {formatCurrency(profitSnapshot)}
                </p>
              </div>
            </article>
            </div>
          )}

          {/* ── Tab content ──────────────────────────────────────────────── */}

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <section className="grid gap-4 lg:grid-cols-2">
              {/* Operations snapshot */}
              <article className={cardClass}>
                <SectionHeading icon={LayoutDashboard} title="Operations snapshot" />
                <div className="mt-5 grid gap-2">
                  {[
                    { label: 'Staff records', value: staffEntries.length, colorBg: 'bg-[var(--burgundy-50)]', colorText: 'text-[var(--burgundy-800)]' },
                    { label: 'Capital movements', value: (capitalMovementsQuery.data?.data ?? []).length, colorBg: 'bg-[var(--status-info-bg)]', colorText: 'text-[var(--status-info-text)]' },
                    { label: 'Expense entries', value: expenseEntries.length, colorBg: 'bg-[var(--status-warning-bg)]', colorText: 'text-[var(--status-warning-text)]' },
                    { label: 'Sales entries', value: gcashEntries.length + coffeeEntries.length + printEntries.length + etherealEntries.length, colorBg: 'bg-[var(--status-success-bg)]', colorText: 'text-[var(--status-success-text)]' },
                  ].map(({ label, value, colorBg, colorText }) => (
                    <div key={label} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${colorBg}`}>
                      <span className={`text-sm ${colorText}`}>{label}</span>
                      <span className={`text-sm font-bold tabular-nums ${colorText}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </article>

              {/* Capital balances */}
              <article className={cardClass}>
                <SectionHeading icon={BanknoteArrowUp} title="Capital balances" description="Computed from movement history." />
                <div className="mt-5 grid gap-3">
                  <div className="rounded-xl border border-[var(--status-info-border)] bg-[var(--status-info-bg)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--status-info-text)]">Portfolio balance</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--status-info-text)]">
                      {formatCurrency(capitalBalances.portfolioBalance)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--status-success-text)]">
                      Business balance {selectedBusinessName ? `· ${selectedBusinessName}` : ''}
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--status-success-text)]">
                      {formatCurrency(capitalBalances.businessBalance)}
                    </p>
                  </div>
                </div>
              </article>

              {/* Preview card */}
              <article className={`${cardClass} lg:col-span-2`}>
                <SectionHeading icon={ArrowRightLeft} title="Movement preview" description="Balances after current input forms are applied." />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-[var(--burgundy-50)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--burgundy-800)]">Portfolio after preview</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--burgundy-800)]">
                      {formatCurrency(portfolioAfterPreview)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--burgundy-50)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--burgundy-800)]">Business after preview</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--burgundy-800)]">
                      {formatCurrency(businessAfterPreview)}
                    </p>
                  </div>
                </div>
              </article>

              <article className={`${cardClass} lg:col-span-2`}>
                <SectionHeading icon={TrendingDown} title="Anomalies to address" description="Negative values and relapsed day-over-day trends." />
                {overviewAnomalies.length === 0 ? (
                  <div className="mt-5 rounded-lg border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-4 py-3 text-sm text-[var(--status-success-text)]">
                    No anomalies detected for current data.
                  </div>
                ) : (
                  <ul className="mt-5 grid gap-2">
                    {overviewAnomalies.map((anomaly) => (
                      <li
                        key={anomaly}
                        className="rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)]"
                      >
                        {anomaly}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </section>
          )}

          {/* BUSINESSES */}
          {tab === 'businesses' && (
            <section className={cardClass}>
              <SectionHeading
                icon={Building2}
                title="Businesses"
                description="Seeded and managed from backend configuration."
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {businesses.map((business) => (
                  <article
                    key={business.id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--neutral-linen)] p-4 hover:border-[var(--burgundy-200)] hover:bg-[var(--burgundy-50)] transition-colors"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--burgundy-50)]">
                      <Building2 className="h-4 w-4 text-[var(--burgundy-600)]" />
                    </span>
                    <div>
                      <p className="font-semibold">{business.name}</p>
                      <p className="text-xs text-[var(--neutral-rosewood)]">{business.slug}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* STAFF */}
          {tab === 'staff' && (
            <section className={cardClass}>
              <SectionHeading icon={UserRound} title="Staff" description="Manage staff records for the selected business." />
              <form onSubmit={submitStaff} className={formGridClass}>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Full name
                  <input name="full_name" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Age
                  <input name="age" type="number" min="16" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Start date
                  <input name="employment_start_date" type="date" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  End date
                  <input name="employment_end_date" type="date" className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Employment type
                  <input name="employment_type" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Salary
                  <input name="salary" type="number" step="100" required className="dashboard-input" />
                </label>
                <div className="md:col-span-2 lg:col-span-3 grid gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Status</p>
                  <div className="flex gap-2">
                    {(['1', '0'] as const).map((val) => (
                      <label key={val} className={optionPillClass}>
                        <input type="radio" name="is_active" value={val} defaultChecked={val === '1'} className="sr-only" />
                        {val === '1' ? 'Active' : 'Inactive'}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={!selectedBusinessId || createStaffMutation.isPending} className="dashboard-button-primary">
                  {createStaffMutation.isPending ? 'Adding…' : 'Add staff member'}
                </button>
              </form>

              <SectionDivider label="Staff records" />
              {staffEntries.length === 0 ? (
                <EmptyState label="No staff records yet." />
              ) : (
                <div className="overflow-auto rounded-xl border border-[var(--neutral-linen)]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[var(--surface-raised)] text-left">
                    <tr>
                      {['Name', 'Type', 'Salary', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                    </thead>
                    <tbody>
                    {staffEntries.map((staff) => (
                      <tr key={staff.id} className="border-t border-[var(--neutral-linen)] hover:bg-[var(--burgundy-50)] transition-colors">
                        <td className="px-4 py-3 font-medium">{staff.full_name}</td>
                        <td className="px-4 py-3 text-[var(--neutral-rosewood)]">{staff.employment_type}</td>
                        <td className="px-4 py-3 tabular-nums text-[var(--accent-gold)]">{formatCurrency(parseAmount(staff.salary))}</td>
                        <td className="px-4 py-3">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              staff.is_active
                                ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                                : 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]'
                            }`}>
                              {staff.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* SCHEDULE & ATTENDANCE */}
          {tab === 'scheduleAttendance' && (
            <section className={cardClass}>
              <SectionHeading
                icon={CalendarCheck2}
                title="Schedule & Attendance"
                description="Plot staff schedules and mark attendance anytime within the day."
              />
              <form onSubmit={submitStaffSchedule} className={formGridClass}>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Staff
                  <select name="staff_id" required className="dashboard-input">
                    <option value="">Select staff</option>
                    {staffEntries.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Scheduled date
                  <input name="scheduled_on" type="date" defaultValue={scheduleDateFilter} required className="dashboard-input" />
                </label>
                <div className="grid gap-1.5 md:col-span-2 lg:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Attendance</p>
                  <div className="flex gap-2">
                    {(['pending', 'present', 'absent'] as const).map((status, index) => (
                      <label key={status} className={optionPillClass}>
                        <input
                          type="radio"
                          name="attendance_status"
                          value={status}
                          defaultChecked={index === 0}
                          className="sr-only"
                        />
                        {status}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)] md:col-span-2 lg:col-span-3">
                  Notes (optional)
                  <input name="notes" className="dashboard-input" />
                </label>
                <button
                  type="submit"
                  disabled={!selectedBusinessId || createStaffScheduleMutation.isPending}
                  className="dashboard-button-primary"
                >
                  {createStaffScheduleMutation.isPending ? 'Saving…' : 'Save schedule'}
                </button>
              </form>

              <SectionDivider label="Swap plotted dates" />
              <form onSubmit={submitSwapStaffSchedule} className={formGridClass}>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Source schedule
                  <select
                    value={sourceScheduleId}
                    onChange={(e) => setSourceScheduleId(e.target.value)}
                    required
                    className="dashboard-input"
                  >
                    <option value="">Select source schedule</option>
                    {allStaffScheduleEntries.map((schedule) => (
                      <option key={`source-${schedule.id}`} value={schedule.id}>
                        {schedule.staff_name ?? 'Unknown staff'} · {formatScheduleDate(schedule.scheduled_on)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Target schedule
                  <select
                    value={targetScheduleId}
                    onChange={(e) => setTargetScheduleId(e.target.value)}
                    required
                    className="dashboard-input"
                  >
                    <option value="">Select target schedule</option>
                    {allStaffScheduleEntries.map((schedule) => (
                      <option key={`target-${schedule.id}`} value={schedule.id}>
                        {schedule.staff_name ?? 'Unknown staff'} · {formatScheduleDate(schedule.scheduled_on)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={!selectedBusinessId || swapStaffSchedulesMutation.isPending || sourceScheduleId === targetScheduleId}
                  className="dashboard-button-primary"
                >
                  {swapStaffSchedulesMutation.isPending ? 'Swapping…' : 'Swap schedules'}
                </button>
              </form>

              <SectionDivider label={`Attendance prompts (${scheduleDateFilter})`} />
              <div className="mb-3 w-full max-w-xs">
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Prompt date
                  <input
                    type="date"
                    value={scheduleDateFilter}
                    onChange={(e) => setScheduleDateFilter(e.target.value)}
                    className="dashboard-input"
                  />
                </label>
              </div>
              {staffSchedulesQuery.isLoading ? (
                <p className="text-sm text-[var(--neutral-rosewood)]">Loading…</p>
              ) : unresolvedAttendanceToday.length === 0 ? (
                <EmptyState label="No pending attendance prompts for the selected date." />
              ) : (
                <ul className="grid gap-2">
                  {unresolvedAttendanceToday.map((schedule) => (
                    <li
                      key={schedule.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--neutral-linen)] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{schedule.staff_name ?? 'Unknown staff'}</p>
                        <p className="text-xs text-[var(--neutral-rosewood)]">{formatScheduleDate(schedule.scheduled_on)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => markAttendance(schedule.id, 'present')}
                          className="rounded-lg bg-[var(--status-success-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--status-success-text)]"
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => markAttendance(schedule.id, 'absent')}
                          className="rounded-lg bg-[var(--status-danger-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--status-danger-text)]"
                        >
                          Absent
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* COMPENSATION */}
          {tab === 'compensation' && (
            <section className={cardClass}>
              <SectionHeading
                icon={BanknoteArrowUp}
                title="Compensation"
                description="Compute compensation by days or up to cutoff date with attendance and cash-advance deductions."
              />
              <form onSubmit={submitCompensationRun} className={formGridClass}>
                <div className="md:col-span-2 lg:col-span-3 grid gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Computation mode</p>
                  <div className="flex gap-2">
                    {([
                      { value: 'by_days', label: 'By number of days' },
                      { value: 'up_to_date', label: 'Up to specific date' },
                    ] as const).map((mode) => (
                      <label key={mode.value} className={optionPillClass}>
                        <input
                          type="radio"
                          name="computation_mode"
                          value={mode.value}
                          checked={compensationMode === mode.value}
                          onChange={() => setCompensationMode(mode.value)}
                          className="sr-only"
                        />
                        {mode.label}
                      </label>
                    ))}
                  </div>
                </div>
                {compensationMode === 'by_days' && (
                  <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                    Number of days
                    <input name="number_of_days" type="number" min="1" defaultValue="1" required className="dashboard-input" />
                  </label>
                )}
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Cutoff date
                  <input name="cutoff_date" type="date" defaultValue={formatDateOnly(new Date())} required className="dashboard-input" />
                </label>
                <button
                  type="submit"
                  disabled={!selectedBusinessId || createCompensationRunMutation.isPending}
                  className="dashboard-button-primary"
                >
                  {createCompensationRunMutation.isPending ? 'Computing…' : 'Run compensation'}
                </button>
              </form>

              <SectionDivider label="Compensation runs" />
              {compensationRunsQuery.isLoading ? (
                <p className="text-sm text-[var(--neutral-rosewood)]">Loading…</p>
              ) : compensationRuns.length === 0 ? (
                <EmptyState label="No compensation runs yet." />
              ) : (
                <ul className="grid gap-3">
                  {compensationRuns.map((run) => (
                    <li key={run.id} className="rounded-xl border border-[var(--neutral-linen)] px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {run.computation_mode === 'by_days' ? `By days (${run.number_of_days ?? 0})` : 'Up to date'} ·{' '}
                          {formatCompactDate(run.period_start)} – {formatCompactDate(run.period_end)}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            run.payment_status === 'finalized'
                              ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                              : 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]'
                          }`}>
                            {run.payment_status}
                          </span>
                          <span className="text-sm font-semibold text-[var(--teal-mid)]">
                            Net {formatCurrency(parseAmount(run.net_pay))}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-[var(--neutral-rosewood)]">
                        Gross {formatCurrency(parseAmount(run.gross_pay))} · Deductions {formatCurrency(parseAmount(run.total_deductions))}
                      </p>
                      {run.payment_status === 'finalized' ? (
                        <p className="mt-1 text-xs text-[var(--status-success-text)]">
                          Finalized {run.finalized_at ? formatDateTimeDisplay(run.finalized_at) : ''} by {run.finalized_by_name ?? 'Unknown'}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => finalizeCompensationRun(run.id)}
                          disabled={finalizeCompensationRunMutation.isPending}
                          className="mt-2 rounded-lg bg-[var(--burgundy-600)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--burgundy-800)] disabled:opacity-60"
                        >
                          {finalizeCompensationRunMutation.isPending ? 'Finalizing…' : 'Finalize payout'}
                        </button>
                      )}
                      {run.payment_history.length > 0 && (
                        <p className="mt-1 text-xs text-[var(--neutral-rosewood)]">
                          Payment events: {run.payment_history.length} · Last settled deductions:{' '}
                          {run.payment_history[run.payment_history.length - 1]?.settled_deductions.length ?? 0}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* REFERENCE ITEMS */}
          {tab === 'referenceItems' && (
            <section className={cardClass}>
              <SectionHeading icon={NotebookPen} title="Reference Items" description="Product and service catalog for autocomplete and pricing." />
              <form onSubmit={submitReferenceItem} className={formGridClass}>
                <div className="md:col-span-2 lg:col-span-3 grid gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Item type</p>
                  <div className="flex gap-2">
                    {(['product', 'service'] as const).map((t) => (
                      <label key={t} className={optionPillClass}>
                        <input type="radio" name="item_type" value={t} defaultChecked={t === 'product'} className="sr-only" />
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Item name
                  <input name="name" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Base price
                  <input name="price" type="number" step="50" min="0" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Description (optional)
                  <input name="description" className="dashboard-input" />
                </label>
                <button type="submit" disabled={!selectedBusinessId || createReferenceItemMutation.isPending} className="dashboard-button-primary">
                  {createReferenceItemMutation.isPending ? 'Saving…' : 'Save reference item'}
                </button>
              </form>

              <SectionDivider label="Catalog" />
              {referenceItemsQuery.isLoading ? (
                <p className="text-sm text-[var(--neutral-rosewood)]">Loading…</p>
              ) : referenceItems.length === 0 ? (
                <EmptyState label="No reference items yet." />
              ) : (
                <ul className="grid gap-2">
                  {referenceItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between rounded-xl border border-[var(--neutral-linen)] px-4 py-3 hover:bg-[var(--burgundy-50)] transition-colors">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {item.description ? (
                          <span className="ml-2 text-xs text-[var(--neutral-rosewood)]">· {item.description}</span>
                        ) : null}
                        <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          item.item_type === 'product'
                            ? 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]'
                            : 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                        }`}>
                          {item.item_type}
                        </span>
                      </div>
                      <span className="tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(item.price))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* EXPENSES */}
          {tab === 'expenses' && (
            <section className={cardClass}>
              <SectionHeading icon={ReceiptText} title="Expenses" description="Track one-time and recurring business expenses." />
              <form onSubmit={submitExpense} className={formGridClass}>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Date issued
                  <input name="date_issued" type="datetime-local" max={dateInputMax} min={dateInputMin} defaultValue={dateInputMax} required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Amount
                  <input name="amount" type="number" step="100" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Description
                  <input name="description" required className="dashboard-input" />
                </label>
                <div className="md:col-span-2 lg:col-span-3 grid gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Purpose</p>
                  <div className="flex flex-wrap gap-2">
                    {(['business', 'business_portfolio', 'service'] as const).map((p, i) => (
                      <label key={p} className={optionPillClass}>
                        <input type="radio" name="purpose" value={p} defaultChecked={i === 0} className="sr-only" />
                        {p.replace(/_/g, ' ')}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 lg:col-span-3 grid gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Payment type</p>
                  <div className="flex gap-2">
                    {(['one_time', 'repeat'] as const).map((p, i) => (
                      <label key={p} className={optionPillClass}>
                        <input type="radio" name="payment_type" value={p} defaultChecked={i === 0} className="sr-only" />
                        {p.replace('_', ' ')}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Recurrence reference
                  <input name="recurrence_reference" className="dashboard-input" />
                </label>
                <button type="submit" disabled={!selectedBusinessId || createExpenseMutation.isPending} className="dashboard-button-primary">
                  {createExpenseMutation.isPending ? 'Adding…' : 'Add expense'}
                </button>
              </form>

              <SectionDivider label={`${expenseEntries.length} expense${expenseEntries.length === 1 ? '' : 's'} · total ${formatCurrency(expenseTotal)}`} />
              {expensesQuery.isLoading ? (
                <p className="text-sm text-[var(--neutral-rosewood)]">Loading…</p>
              ) : expenseEntries.length === 0 ? (
                <EmptyState label="No expenses recorded yet." />
              ) : (
                <ul className="grid gap-2">
                  {expenseEntries.map((expense) => (
                    <li key={expense.id} className="flex items-center justify-between rounded-xl border border-[var(--neutral-linen)] px-4 py-3 hover:bg-[var(--burgundy-50)] transition-colors">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-xs text-[var(--neutral-rosewood)]">
                          {formatDateTimeDisplay(expense.date_issued)} · {formatRelative(expense.date_issued)}
                        </p>
                      </div>
                      <span className="tabular-nums font-semibold text-[var(--status-danger-text)]">
                        {formatCurrency(parseAmount(expense.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* GCASH */}
          {tab === 'gcash' && (
            <section className={cardClass}>
              <SectionHeading icon={Wallet} title="GCash Sales" description="Manually log GCash cash-in and cash-out transactions." />
              <form onSubmit={submitGcash} className={formGridClass}>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Transaction recipient (optional)
                  <input name="transaction_recipient" className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Moved cash
                  <input name="amount_moved" type="number" step="150" required value={gcashAmountMoved} onChange={(e) => setGcashAmountMoved(e.target.value)} className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Sales amount
                  <input name="sales_amount" type="number" step="150" required value={gcashSalesAmount} onChange={(e) => setGcashSalesAmount(e.target.value)} className="dashboard-input" />
                </label>
                <div className="md:col-span-2 lg:col-span-3 grid gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Transaction type</p>
                  <div className="flex gap-2">
                    {(['cash_in', 'cash_out'] as const).map((t, i) => (
                      <label key={t} className={optionPillClass}>
                        <input type="radio" name="transaction_type" value={t} defaultChecked={i === 0} className="sr-only" />
                        {t.replace('_', ' ')}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Transaction date
                  <input name="transaction_date" type="datetime-local" max={dateInputMax} min={dateInputMin} defaultValue={dateInputMax} required className="dashboard-input" />
                </label>
                <button type="submit" disabled={!selectedBusinessId || createGcashMutation.isPending} className="dashboard-button-primary">
                  {createGcashMutation.isPending ? 'Adding…' : 'Add GCash entry'}
                </button>
              </form>
              <LivePreview>
                Total to be paid: <strong className="font-semibold">{formatCurrency(parseAmount(gcashSalesAmount))}</strong> ·
                {' '}Profit from this transaction: <strong className="font-semibold">{formatCurrency(gcashProfitPreview)}</strong>{' '}
                (sales {formatCurrency(parseAmount(gcashSalesAmount))} − moved {formatCurrency(parseAmount(gcashAmountMoved))})
              </LivePreview>

              <SectionDivider label={`${gcashEntries.length} entr${gcashEntries.length === 1 ? 'y' : 'ies'}`} />
              {gcashQuery.isLoading ? (
                <p className="text-sm text-[var(--neutral-rosewood)]">Loading…</p>
              ) : gcashEntries.length === 0 ? (
                <EmptyState label="No GCash entries yet." />
              ) : (
                <ul className="grid gap-2">
                  {gcashEntries.map((sale) => (
                    <li key={sale.id} className="flex items-center justify-between rounded-xl border border-[var(--neutral-linen)] px-4 py-3 hover:bg-[var(--burgundy-50)] transition-colors">
                      <div>
                        <p className="font-medium">{sale.transaction_recipient ?? 'No recipient'}</p>
                        <p className="text-xs text-[var(--neutral-rosewood)]">
                          {formatDateTimeDisplay(sale.transaction_date)} · {formatRelative(sale.transaction_date)}
                        </p>
                      </div>
                      <span className="tabular-nums font-semibold text-[var(--accent-gold)]">
                        {formatCurrency(parseAmount(sale.sales_amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* COFFEE */}
          {tab === 'coffee' && (
            <section className={cardClass}>
              <SectionHeading icon={Coffee} title="Coffee Sales" description="Log individual coffee orders, including add-ons." />
              <form onSubmit={submitCoffee} className={formGridClass}>
                <datalist id="coffee-reference-items">
                  {productReferenceItems.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
                <div className="md:col-span-2 lg:col-span-3 grid gap-3">
                  {coffeeItems.map((item, index) => (
                    <div
                      key={`coffee-item-${index}`}
                      className="rounded-xl border border-[var(--neutral-linen)] bg-[var(--surface-raised)] p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3"
                    >
                      <div className="md:col-span-2 lg:col-span-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                          Order #{index + 1}
                        </p>
                        {coffeeItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCoffeeItems((prev) => prev.filter((_, i) => i !== index))}
                            className="text-xs text-[var(--status-danger-text)] hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Price
                        <input type="number" step="30" required value={item.price} onChange={(e) => setCoffeeItems((prev) => prev.map((en, ei) => ei === index ? { ...en, price: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Coffee type
                        <input list="coffee-reference-items" required value={item.coffee_type} onChange={(e) => setCoffeeItems((prev) => prev.map((en, ei) => ei === index ? { ...en, coffee_type: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <div className="grid gap-1.5 md:col-span-2 lg:col-span-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Size</p>
                        <div className="flex flex-wrap gap-2">
                          {(['8oz', '9oz', '12oz', '16oz', '18oz'] as const).map((size) => (
                            <label key={`${size}-${index}`} className={optionPillClass}>
                              <input type="radio" name={`coffee-size-${index}`} value={size} checked={item.size === size} onChange={() => setCoffeeItems((prev) => prev.map((en, ei) => ei === index ? { ...en, size } : en))} className="sr-only" />
                              {size}
                            </label>
                          ))}
                        </div>
                      </div>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Add-on price
                        <input type="number" step="0.01" min="0" required value={item.add_on_price} onChange={(e) => setCoffeeItems((prev) => prev.map((en, ei) => ei === index ? { ...en, add_on_price: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Add-on description
                        <input value={item.add_on_description} onChange={(e) => setCoffeeItems((prev) => prev.map((en, ei) => ei === index ? { ...en, add_on_description: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Sale date
                        <input type="datetime-local" max={dateInputMax} min={dateInputMin} required value={item.sale_date} onChange={(e) => setCoffeeItems((prev) => prev.map((en, ei) => ei === index ? { ...en, sale_date: e.target.value } : en))} className="dashboard-input" />
                      </label>
                    </div>
                  ))}
                  <button type="button" onClick={() => setCoffeeItems((prev) => [...prev, createCoffeeDraftItem()])} className="dashboard-button-secondary">
                    + Add another order
                  </button>
                </div>
                <button type="submit" disabled={!selectedBusinessId || createCoffeeMutation.isPending} className="dashboard-button-primary">
                  {createCoffeeMutation.isPending ? 'Submitting…' : 'Add coffee sale'}
                </button>
              </form>
              <LivePreview>
                Total to be paid: <strong className="font-semibold">{formatCurrency(coffeeBatchPreview)}</strong> across {coffeeItems.length} order{coffeeItems.length === 1 ? '' : 's'}
              </LivePreview>

              <SectionDivider label={`${coffeeEntries.length} sale${coffeeEntries.length === 1 ? '' : 's'}`} />
              {coffeeQuery.isLoading ? <p className="text-sm text-[var(--neutral-rosewood)]">Loading…</p> : coffeeEntries.length === 0 ? (
                <EmptyState label="No coffee sales yet." />
              ) : (
                <ul className="grid gap-2">
                  {coffeeEntries.map((sale) => (
                    <li key={sale.id} className="flex items-center justify-between rounded-xl border border-[var(--neutral-linen)] px-4 py-3 hover:bg-[var(--burgundy-50)] transition-colors">
                      <div>
                        <p className="font-medium">{sale.coffee_type} <span className="text-xs text-[var(--neutral-rosewood)]">· {sale.size}</span></p>
                        <p className="text-xs text-[var(--neutral-rosewood)]">{formatDateTimeDisplay(sale.sale_date)} · {formatRelative(sale.sale_date)}</p>
                      </div>
                      <span className="tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(sale.total_amount))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* PRINT */}
          {tab === 'print' && (
            <section className={cardClass}>
              <SectionHeading icon={Printer} title="Print Sales" description="Log xerox, document, and other print jobs." />
              <form onSubmit={submitPrint} className={formGridClass}>
                <datalist id="print-reference-items">
                  {productReferenceItems.map((item) => <option key={item.id} value={item.name} />)}
                </datalist>
                <div className="md:col-span-2 lg:col-span-3 grid gap-3">
                  {printItems.map((item, index) => (
                    <div key={`print-item-${index}`} className="rounded-xl border border-[var(--neutral-linen)] bg-[var(--surface-raised)] p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      <div className="md:col-span-2 lg:col-span-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Job #{index + 1}</p>
                        {printItems.length > 1 && (
                          <button type="button" onClick={() => setPrintItems((prev) => prev.filter((_, i) => i !== index))} className="text-xs text-[var(--status-danger-text)] hover:underline">
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid gap-1.5 md:col-span-2 lg:col-span-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Job type</p>
                        <div className="flex flex-wrap gap-2">
                          {(['xerox', 'document', 'other'] as const).map((jt) => (
                            <label key={`${jt}-${index}`} className={optionPillClass}>
                              <input type="radio" name={`print-job-${index}`} value={jt} checked={item.job_type === jt} onChange={() => setPrintItems((prev) => prev.map((en, ei) => ei === index ? { ...en, job_type: jt } : en))} className="sr-only" />
                              {jt}
                            </label>
                          ))}
                        </div>
                      </div>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Description
                        <input list="print-reference-items" required value={item.description} onChange={(e) => setPrintItems((prev) => prev.map((en, ei) => ei === index ? { ...en, description: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <div className="grid gap-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Color mode</p>
                        <div className="flex gap-2">
                          {(['black', 'white'] as const).map((cm) => (
                            <label key={`${cm}-${index}`} className={optionPillClass}>
                              <input type="radio" name={`print-color-${index}`} value={cm} checked={item.color_mode === cm} onChange={() => setPrintItems((prev) => prev.map((en, ei) => ei === index ? { ...en, color_mode: cm } : en))} className="sr-only" />
                              {cm}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-1.5 md:col-span-2 lg:col-span-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Print size</p>
                        <div className="flex flex-wrap gap-2">
                          {(['short', 'long', 'a4', 'legal'] as const).map((ps) => (
                            <label key={`${ps}-${index}`} className={optionPillClass}>
                              <input type="radio" name={`print-size-${index}`} value={ps} checked={item.print_size === ps} onChange={() => setPrintItems((prev) => prev.map((en, ei) => ei === index ? { ...en, print_size: ps } : en))} className="sr-only" />
                              {ps}
                            </label>
                          ))}
                        </div>
                      </div>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Paper count
                        <input type="number" min="1" required value={item.paper_count} onChange={(e) => setPrintItems((prev) => prev.map((en, ei) => ei === index ? { ...en, paper_count: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Sales amount
                        <input type="number" step="5" required value={item.sales_amount} onChange={(e) => setPrintItems((prev) => prev.map((en, ei) => ei === index ? { ...en, sales_amount: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Sale date
                        <input type="datetime-local" max={dateInputMax} min={dateInputMin} required value={item.sale_date} onChange={(e) => setPrintItems((prev) => prev.map((en, ei) => ei === index ? { ...en, sale_date: e.target.value } : en))} className="dashboard-input" />
                      </label>
                    </div>
                  ))}
                  <button type="button" onClick={() => setPrintItems((prev) => [...prev, createPrintDraftItem()])} className="dashboard-button-secondary">
                    + Add another print job
                  </button>
                </div>
                <button type="submit" disabled={!selectedBusinessId || createPrintMutation.isPending} className="dashboard-button-primary">
                  {createPrintMutation.isPending ? 'Submitting…' : 'Add print sale'}
                </button>
              </form>
              <LivePreview>
                Total to be paid: <strong className="font-semibold">{formatCurrency(printBatchPreview)}</strong> across {printItems.length} job{printItems.length === 1 ? '' : 's'}
              </LivePreview>

              <SectionDivider label={`${printEntries.length} sale${printEntries.length === 1 ? '' : 's'}`} />
              {printQuery.isLoading ? <p className="text-sm text-[var(--neutral-rosewood)]">Loading…</p> : printEntries.length === 0 ? (
                <EmptyState label="No print sales yet." />
              ) : (
                <ul className="grid gap-2">
                  {printEntries.map((sale) => (
                    <li key={sale.id} className="flex items-center justify-between rounded-xl border border-[var(--neutral-linen)] px-4 py-3 hover:bg-[var(--burgundy-50)] transition-colors">
                      <div>
                        <p className="font-medium">{sale.job_type} <span className="text-xs text-[var(--neutral-rosewood)]">· {sale.color_mode} · {sale.print_size} · {sale.paper_count}pg</span></p>
                        <p className="text-xs text-[var(--neutral-rosewood)]">{formatDateTimeDisplay(sale.sale_date)} · {formatRelative(sale.sale_date)}</p>
                      </div>
                      <span className="tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(sale.sales_amount))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ETHEREAL */}
          {tab === 'ethereal' && (
            <section className={cardClass}>
              <SectionHeading icon={Sparkles} title="Ethereal Sales" description="Beauty salon service bookings with discount and provider tracking." />
              <form onSubmit={submitEthereal} className={formGridClass}>
                <div className="md:col-span-2 lg:col-span-3 grid gap-3">
                  {etherealItems.map((item, index) => (
                    <div key={`ethereal-item-${index}`} className="rounded-xl border border-[var(--neutral-linen)] bg-[var(--surface-raised)] p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      <div className="md:col-span-2 lg:col-span-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Service #{index + 1}</p>
                        {etherealItems.length > 1 && (
                          <button type="button" onClick={() => setEtherealItems((prev) => prev.filter((_, i) => i !== index))} className="text-xs text-[var(--status-danger-text)] hover:underline">
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid gap-1.5 md:col-span-2 lg:col-span-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Service provider(s)</p>
                        <div className="flex flex-wrap gap-2">
                          {staffEntries.map((staff) => {
                            const checked = item.staff_ids.includes(staff.id)
                            return (
                              <label key={`ethereal-staff-${staff.id}-${index}`} className={optionPillClass}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setEtherealItems((prev) =>
                                      prev.map((en, ei) => {
                                        if (ei !== index) return en
                                        const next = checked ? en.staff_ids.filter((id) => id !== staff.id) : [...en.staff_ids, staff.id]
                                        return { ...en, staff_ids: next }
                                      }),
                                    )
                                  }}
                                  className="sr-only"
                                />
                                {staff.full_name}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Customer name
                        <input value={item.customer_name} onChange={(e) => setEtherealItems((prev) => prev.map((en, ei) => ei === index ? { ...en, customer_name: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Service cost
                        <input type="number" step="200" required value={item.service_cost} onChange={(e) => setEtherealItems((prev) => prev.map((en, ei) => ei === index ? { ...en, service_cost: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Discount %
                        <input type="number" step="10" min="0" max="100" required value={item.discount_percentage} onChange={(e) => setEtherealItems((prev) => prev.map((en, ei) => ei === index ? { ...en, discount_percentage: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <div className="grid gap-1.5 md:col-span-2 lg:col-span-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Discount type</p>
                        <div className="flex flex-wrap gap-2">
                          {(['family/friends/church-mem', 'promo', 'new-customer'] as const).map((dt) => (
                            <label key={`${dt}-${index}`} className={optionPillClass}>
                              <input type="radio" name={`ethereal-discount-${index}`} value={dt} checked={item.discount_type === dt} onChange={() => setEtherealItems((prev) => prev.map((en, ei) => ei === index ? { ...en, discount_type: dt } : en))} className="sr-only" />
                              {dt}
                            </label>
                          ))}
                        </div>
                      </div>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Service date
                        <input type="datetime-local" max={dateInputMax} min={dateInputMin} required value={item.service_date} onChange={(e) => setEtherealItems((prev) => prev.map((en, ei) => ei === index ? { ...en, service_date: e.target.value } : en))} className="dashboard-input" />
                      </label>
                    </div>
                  ))}
                  <button type="button" onClick={() => setEtherealItems((prev) => [...prev, createEtherealDraftItem()])} className="dashboard-button-secondary">
                    + Add another service
                  </button>
                </div>
                <button type="submit" disabled={!selectedBusinessId || createEtherealMutation.isPending} className="dashboard-button-primary">
                  {createEtherealMutation.isPending ? 'Submitting…' : 'Add ethereal sale'}
                </button>
              </form>
              <LivePreview>
                Cash discount: <strong className="font-semibold">{formatCurrency(etherealCashDiscountPreview)}</strong> · Total to be paid: <strong className="font-semibold">{formatCurrency(etherealNetPreview)}</strong>
                {serviceReferenceItems.length > 0 && <span className="ml-2 opacity-70">· Services: {serviceReferenceItems.slice(0, 3).map((i) => i.name).join(', ')}</span>}
              </LivePreview>

              <SectionDivider label={`${etherealEntries.length} service${etherealEntries.length === 1 ? '' : 's'}`} />
              {etherealQuery.isLoading ? <p className="text-sm text-[var(--neutral-rosewood)]">Loading…</p> : etherealEntries.length === 0 ? (
                <EmptyState label="No ethereal sales yet." />
              ) : (
                <ul className="grid gap-2">
                  {etherealEntries.map((sale) => (
                    <li key={sale.id} className="flex items-center justify-between rounded-xl border border-[var(--neutral-linen)] px-4 py-3 hover:bg-[var(--burgundy-50)] transition-colors">
                      <div>
                        <p className="font-medium">Service · net amount</p>
                        <p className="text-xs text-[var(--neutral-rosewood)]">{formatDateTimeDisplay(sale.service_date)} · {formatRelative(sale.service_date)}</p>
                      </div>
                      <span className="tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(sale.net_amount))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* SALES REPORTS */}
          {tab === 'salesReports' && (
            <section className={cardClass}>
              <SectionHeading icon={FileText} title="Sales Reports" description="Generate on-demand reports by scope and period." />
              <form onSubmit={submitSalesReport} className={formGridClass}>
                <div className="md:col-span-2 lg:col-span-3 grid gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Scope</p>
                  <div className="flex gap-2">
                    {(['portfolio', 'business'] as const).map((scope) => (
                      <label key={scope} className={optionPillClass}>
                        <input
                          type="radio"
                          name="scope"
                          value={scope}
                          checked={reportScope === scope}
                          onChange={() => setReportScope(scope)}
                          className="sr-only"
                        />
                        {scope === 'portfolio' ? 'Portfolio' : 'Specific business'}
                      </label>
                    ))}
                  </div>
                </div>
                {reportScope === 'business' && (
                  <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                    Business
                    <select name="business_id" defaultValue={selectedBusinessId ?? ''} className="dashboard-input">
                      <option value="">Select business</option>
                      {businesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="md:col-span-2 lg:col-span-3 grid gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Period</p>
                  <div className="flex gap-2">
                    {(['today', 'date_range'] as const).map((period) => (
                      <label key={period} className={optionPillClass}>
                        <input
                          type="radio"
                          name="period"
                          value={period}
                          checked={reportPeriod === period}
                          onChange={() => setReportPeriod(period)}
                          className="sr-only"
                        />
                        {period === 'today' ? 'Today' : 'Date range'}
                      </label>
                    ))}
                  </div>
                </div>
                {reportPeriod === 'date_range' && (
                  <>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                      Start date
                      <input name="start_date" type="date" required className="dashboard-input" />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                      End date
                      <input name="end_date" type="date" required className="dashboard-input" />
                    </label>
                  </>
                )}
                <button type="submit" disabled={generateSalesReportMutation.isPending} className="dashboard-button-primary">
                  {generateSalesReportMutation.isPending ? 'Generating…' : 'Generate sales report'}
                </button>
              </form>

              {latestSalesReport && (
                <>
                  <SectionDivider label={`Generated ${formatDateTimeDisplay(latestSalesReport.generated_at)}`} />
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-lg border border-[var(--status-info-border)] bg-[var(--status-info-bg)] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--status-info-text)]">Scope</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--status-info-text)]">
                        {latestSalesReport.scope === 'portfolio' ? 'Portfolio' : latestSalesReport.business_name ?? 'Specific business'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--status-success-text)]">Period</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--status-success-text)]">
                        {formatDateTimeDisplay(latestSalesReport.start_date)} to {formatDateTimeDisplay(latestSalesReport.end_date)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[var(--neutral-linen)] bg-[var(--surface-raised)] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Transactions</p>
                      <p className="mt-1 text-sm font-semibold">{latestSalesReport.totals.total_transactions}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--neutral-linen)] bg-[var(--surface-card)] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">GCash</p>
                      <p className="mt-1 tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(latestSalesReport.totals.gcash_sales_total))}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--neutral-linen)] bg-[var(--surface-card)] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Coffee</p>
                      <p className="mt-1 tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(latestSalesReport.totals.coffee_sales_total))}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--neutral-linen)] bg-[var(--surface-card)] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Print</p>
                      <p className="mt-1 tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(latestSalesReport.totals.print_sales_total))}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--neutral-linen)] bg-[var(--surface-card)] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Ethereal</p>
                      <p className="mt-1 tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(latestSalesReport.totals.ethereal_sales_total))}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--burgundy-200)] bg-[var(--burgundy-50)] px-4 py-3 md:col-span-2 xl:col-span-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--burgundy-800)]">Sales total</p>
                      <p className="mt-1 tabular-nums text-lg font-semibold text-[var(--burgundy-800)]">{formatCurrency(parseAmount(latestSalesReport.totals.sales_total))}</p>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* PORTFOLIO CAPITAL */}
          {tab === 'portfolioCapital' && (
            <section className={cardClass}>
              <SectionHeading icon={BanknoteArrowUp} title="Portfolio Money" description="Re-authentication required. Movements are permanently recorded." />

              {/* Balance callout */}
              <div className="mt-5 rounded-xl border border-[var(--status-info-border)] bg-[var(--status-info-bg)] px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--status-info-text)]">Current portfolio balance</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--status-info-text)]">
                  {formatCurrency(capitalBalances.portfolioBalance)}
                </p>
              </div>

              <form onSubmit={submitPortfolioCapital} className={formGridClass}>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Amount
                  <input name="amount" type="number" step="1000" required value={portfolioAmountPreview} onChange={(e) => setPortfolioAmountPreview(e.target.value)} className="dashboard-input" />
                </label>
                <div className="md:col-span-2 lg:col-span-3 grid gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Direction</p>
                  <div className="flex flex-wrap gap-2">
                    {(['add', 'deduct', 'transfer'] as const).map((d) => (
                      <label key={d} className={optionPillClass}>
                        <input type="radio" name="direction" value={d} checked={portfolioDirectionPreview === d} onChange={() => setPortfolioDirectionPreview(d)} className="sr-only" />
                        {d === 'transfer' ? 'Transfer to business' : d.charAt(0).toUpperCase() + d.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Transfer target
                  <select name="target_business_id" defaultValue="" className="dashboard-input">
                    <option value="">Select business (required for transfer)</option>
                    {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Date
                  <input name="occurred_on" type="date" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Notes
                  <input name="notes" className="dashboard-input" />
                </label>
                <button type="submit" disabled={createPortfolioCapitalMutation.isPending} className="dashboard-button-primary">
                  {createPortfolioCapitalMutation.isPending ? 'Processing…' : 'Save portfolio movement'}
                </button>
              </form>
              <LivePreview>
                After action: <strong className="font-semibold">{formatCurrency(portfolioAfterPreview)}</strong>
                {' '}(current {formatCurrency(capitalBalances.portfolioBalance)} {portfolioDirectionPreview === 'add' ? '+' : '−'} {formatCurrency(parseAmount(portfolioAmountPreview))})
              </LivePreview>

              <SectionDivider label={`${portfolioMovements.length} movement${portfolioMovements.length === 1 ? '' : 's'}`} />
              {portfolioMovements.length === 0 ? (
                <EmptyState label="No portfolio movements yet." />
              ) : (
                <ul className="grid gap-2">
                  {portfolioMovements.map((movement) => (
                    <li key={movement.id} className="flex items-center justify-between rounded-xl border border-[var(--neutral-linen)] px-4 py-3 hover:bg-[var(--burgundy-50)] transition-colors">
                      <div>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          movement.direction === 'add'
                            ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                            : 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]'
                        }`}>
                          {movement.direction}
                        </span>
                        <p className="text-xs text-[var(--neutral-rosewood)]">{formatCompactDate(movement.occurred_on)}</p>
                      </div>
                      <span className="tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(movement.amount))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* BUSINESS CAPITAL */}
          {tab === 'businessCapital' && (
            <section className={cardClass}>
              <SectionHeading
                icon={BanknoteArrowDown}
                title={`Business Money${selectedBusinessName ? ` · ${selectedBusinessName}` : ''}`}
                description="Record capital allocations and returns for this business."
              />

              {/* Balance callout */}
              <div className="mt-5 rounded-xl border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--status-success-text)]">Current business balance</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--status-success-text)]">
                  {formatCurrency(capitalBalances.businessBalance)}
                </p>
              </div>

              <form onSubmit={submitBusinessCapital} className={formGridClass}>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Amount
                  <input name="amount" type="number" step="500" required value={businessAmountPreview} onChange={(e) => setBusinessAmountPreview(e.target.value)} className="dashboard-input" />
                </label>
                <div className="md:col-span-2 lg:col-span-3 grid gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Direction</p>
                  <div className="flex flex-wrap gap-2">
                    {([['add', 'Add from portfolio'], ['deduct', 'Deduct to portfolio']] as const).map(([val, label]) => (
                      <label key={val} className={optionPillClass}>
                        <input type="radio" name="direction" value={val} checked={businessDirectionPreview === val} onChange={() => setBusinessDirectionPreview(val)} className="sr-only" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Date
                  <input name="occurred_on" type="date" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Notes
                  <input name="notes" className="dashboard-input" />
                </label>
                <button type="submit" disabled={!selectedBusinessId || createBusinessCapitalMutation.isPending} className="dashboard-button-primary">
                  {createBusinessCapitalMutation.isPending ? 'Processing…' : 'Save business movement'}
                </button>
              </form>
              <LivePreview>
                After action: <strong className="font-semibold">{formatCurrency(businessAfterPreview)}</strong>
                {' '}(current {formatCurrency(capitalBalances.businessBalance)} {businessDirectionPreview === 'add' ? '+' : '−'} {formatCurrency(parseAmount(businessAmountPreview))})
              </LivePreview>

              <SectionDivider label={`${businessMovements.length} movement${businessMovements.length === 1 ? '' : 's'}`} />
              {businessMovements.length === 0 ? (
                <EmptyState label="No business movements yet." />
              ) : (
                <ul className="grid gap-2">
                  {businessMovements.map((movement) => (
                    <li key={movement.id} className="flex items-center justify-between rounded-xl border border-[var(--neutral-linen)] px-4 py-3 hover:bg-[var(--burgundy-50)] transition-colors">
                      <div>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          movement.direction === 'add'
                            ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                            : 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]'
                        }`}>
                          {movement.direction}
                        </span>
                        <p className="text-xs text-[var(--neutral-rosewood)]">{formatCompactDate(movement.occurred_on)}</p>
                      </div>
                      <span className="tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(movement.amount))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* PDF SALES REPORTS */}
          {tab === 'pdfSalesReports' && (
            <section className={cardClass}>
              <SectionHeading
                icon={FileText}
                title="PDF Sales Reports"
                description="Generate versioned PDF 8.5x13 sales reports with metadata headers/footers."
              />
              {meQuery.data.role !== 'admin' && meQuery.data.role !== 'owner' ? (
                <div className="mt-5 rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-4 py-3 text-sm text-[var(--status-warning-text)]">
                  Only admin and owner can view and download exported report files.
                </div>
              ) : (
                <>
                  <form onSubmit={submitSalesReport} className={formGridClass}>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                      Start date
                      <input name="start_date" type="date" required className="dashboard-input" />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                      End date
                      <input name="end_date" type="date" required className="dashboard-input" />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                      Document title (optional)
                      <input name="document_title" className="dashboard-input" />
                    </label>
                    <button
                      type="submit"
                      disabled={!selectedBusinessId || createSalesReportMutation.isPending}
                      className="dashboard-button-primary"
                    >
                      {createSalesReportMutation.isPending ? 'Generating…' : 'Generate report version'}
                    </button>
                  </form>

                  <SectionDivider label="Generated versions" />
                  {salesReportsQuery.isLoading ? (
                    <p className="text-sm text-[var(--neutral-rosewood)]">Loading…</p>
                  ) : salesReportVersions.length === 0 ? (
                    <EmptyState label="No report versions generated yet." />
                  ) : (
                    <div className="grid gap-3">
                      {salesReportVersions.map((report) => (
                        <article key={report.id} className="rounded-xl border border-[var(--neutral-linen)] px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold">
                              v{report.version} · {report.document_title}
                            </p>
                            <button
                              type="button"
                              onClick={() => triggerDownloadSalesReport(report.id)}
                              disabled={downloadSalesReportMutation.isPending}
                              className="dashboard-button-secondary"
                            >
                              Download PDF
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-[var(--neutral-rosewood)]">
                            Range {formatCompactDate(report.start_date)} – {formatCompactDate(report.end_date)}
                            {formatDateTimeDisplay(report.metadata.generated_at)} · {report.metadata.page_size}
                          </p>
                          <p className="mt-1 text-xs text-[var(--neutral-rosewood)]">
                            Overall sales: {formatCurrency(parseAmount(report.details.totals.overall_sales))}
                          </p>
                        </article>
                      ))}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSalesReportPage((prev) => Math.max(prev - 1, 1))}
                          disabled={salesReportPage <= 1}
                          className="dashboard-button-secondary"
                        >
                          Prev
                        </button>
                        <span className="text-xs text-[var(--neutral-rosewood)]">Page {salesReportPage}</span>
                        <button
                          type="button"
                          onClick={() => setSalesReportPage((prev) => prev + 1)}
                          disabled={!salesReportsQuery.data?.links?.next}
                          className="dashboard-button-secondary"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

        </section>
      </div>

      {moneyReauthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-overlay)] px-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] p-5 shadow-[0_16px_40px_rgba(58,9,18,0.25)]">
            <h3 className="text-base font-semibold text-[var(--neutral-espresso)]">Confirm password to continue</h3>
            <p className="mt-1 text-xs text-[var(--neutral-rosewood)]">Money transactions require re-authentication.</p>
            <form onSubmit={submitMoneyReauthModal} className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                Username
                <input
                  name="reauth_username"
                  required
                  value={moneyReauthUsername}
                  onChange={(e) => setMoneyReauthUsername(e.target.value)}
                  className="dashboard-input"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                Password
                <input
                  name="reauth_password"
                  type="password"
                  required
                  value={moneyReauthPassword}
                  onChange={(e) => setMoneyReauthPassword(e.target.value)}
                  className="dashboard-input"
                  autoFocus
                />
              </label>
              <div className="mt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => resolveMoneyReauth(null)}
                  className="dashboard-button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="dashboard-button-primary">
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
