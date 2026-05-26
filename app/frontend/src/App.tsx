import {useEffect, useMemo, useRef, useState, type FormEvent, useCallback} from 'react'
import { useLogin, useLogout, useMe } from './hooks/use-auth'
import { useBusinesses } from './hooks/use-businesses'
import { useCreateExpense, useExpenses } from './hooks/use-expenses'
import { useCreateGcashSale, useDeleteGcashSale, useGcashSales } from './hooks/use-gcash-sales'
import { useCreateCoffeeSale, useDeleteCoffeeSale, useCoffeeSales } from './hooks/use-coffee-sales'
import { useCreatePrintSale, useDeletePrintSale, usePrintSales } from './hooks/use-print-sales'
import { useCreateEtherealSale, useDeleteEtherealSale, useEtherealSales } from './hooks/use-ethereal-sales'
import { useGenerateSalesReport } from './hooks/use-sales-reports'
import { useCreateStaff, useDeleteStaff, useStaff, useUpdateStaff } from './hooks/use-staff'
import { useCreateStaffDayOff, useDeleteStaffDayOff, useStaffDayOffs } from './hooks/use-staff-day-offs'
import { useCreateStaffAbsence, useDeleteStaffAbsence, useStaffAbsences } from './hooks/use-staff-absences'
import {
  useBusinessReferenceItems,
  useCreateBusinessReferenceItem,
  useDeleteBusinessReferenceItem,
  useUpdateBusinessReferenceItem,
} from './hooks/use-business-reference-items'
import { useCompensationRuns, useCreateCompensationRun, useFinalizeCompensationRun } from './hooks/use-compensation-runs'
import {
  useCreateSalesReport,
  useDownloadPortfolioSalesReport,
  useDownloadSalesReport,
  usePortfolioSalesReports,
  useSalesReports,
} from './hooks/use-sales-reports'
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
import type { SalesReport, SalesReportVersion } from './types/api'
import {
  useCapitalMovements,
  useCreateBusinessCapitalMovement,
  useCreatePortfolioCapitalMovement,
  useSettlePortfolioDebt,
} from './hooks/use-capital-movements'
import { formatCompactDate } from './services/formatDate.ts'
import { ActionErrorPanel, FieldErrorText } from './components/action-error-panel'
import { getFieldErrorsFor } from './services/api-error'

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
  selectedReferenceItemId: string
  price: string
  coffee_type: string
  size: '8oz' | '9oz' | '12oz' | '16oz' | '18oz'
  add_on_price: string
  add_on_description: string
  is_debt: boolean
  charged_amount: string
  remarks: string
  sale_date: string
}

type PrintDraftItem = {
  selectedReferenceItemId: string
  job_type: string
  description: string
  color_mode: 'black' | 'white'
  print_size: string
  paper_count: string
  sales_amount: string
  is_debt: boolean
  charged_amount: string
  remarks: string
  sale_date: string
}

type EtherealDraftItem = {
  selectedReferenceItemId: string
  staff_ids: number[]
  service_name: string
  customer_name: string
  service_cost: string
  discount_percentage: string
  discount_type: string
  is_debt: boolean
  charged_amount: string
  remarks: string
  service_date: string
}

type ReferenceItemFormState = {
  item_type: 'product' | 'service'
  name: string
  price: string
  description: string
}

const makeDateTimeDefault = () => formatDateTimeLocal(new Date())

const createCoffeeDraftItem = (): CoffeeDraftItem => ({
  selectedReferenceItemId: '',
  price: '',
  coffee_type: '',
  size: '8oz',
  add_on_price: '0',
  add_on_description: '',
  is_debt: false,
  charged_amount: '',
  remarks: '',
  sale_date: makeDateTimeDefault(),
})

const createPrintDraftItem = (): PrintDraftItem => ({
  selectedReferenceItemId: '',
  job_type: 'xerox',
  description: '',
  color_mode: 'black',
  print_size: 'short',
  paper_count: '1',
  sales_amount: '',
  is_debt: false,
  charged_amount: '',
  remarks: '',
  sale_date: makeDateTimeDefault(),
})

const createEtherealDraftItem = (): EtherealDraftItem => ({
  selectedReferenceItemId: '',
  staff_ids: [],
  service_name: '',
  customer_name: '',
  service_cost: '0',
  discount_percentage: '0',
  discount_type: 'promo',
  is_debt: false,
  charged_amount: '',
  remarks: '',
  service_date: makeDateTimeDefault(),
})

const createReferenceItemFormState = (): ReferenceItemFormState => ({
  item_type: 'product',
  name: '',
  price: '',
  description: '',
})

const parseAmount = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

const parseNonNegativeAmount = (value: unknown) => {
  return Math.max(parseAmount(value), 0)
}

const toNonNegativeInputValue = (value: string) => {
  if (value.trim() === '') return value
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return value
  return String(Math.max(parsed, 0))
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

// ─── All valid tab values (used for URL validation) ──────────────────────────
const ALL_TABS: Tab[] = [
  'overview', 'businesses', 'staff', 'scheduleAttendance', 'compensation',
  'referenceItems', 'expenses', 'gcash', 'coffee', 'print', 'ethereal',
  'salesReports', 'portfolioCapital', 'businessCapital', 'pdfSalesReports',
]

// ─── URL state helpers ────────────────────────────────────────────────────────
const readUrlState = () => {
  const p = new URLSearchParams(window.location.search)
  const tabParam = p.get('tab') as Tab | null
  const rawMode = p.get('mode')
  const normalizedMode: 'today' | 'specific_date' =
    rawMode === 'specific_date' || rawMode === 'up_to_date' || rawMode === 'by_days'
      ? 'specific_date'
      : 'today'
  return {
    tab: tabParam && ALL_TABS.includes(tabParam) ? tabParam : ('overview' as Tab),
    businessId: p.get('business') ? Number(p.get('business')) : null,
    date: p.get('date') ?? formatDateOnly(new Date()),
    page: p.get('page') ? Math.max(1, Number(p.get('page'))) : 1,
    scope: (p.get('scope') ?? 'portfolio') as 'portfolio' | 'business',
    period: (p.get('period') ?? 'today') as 'today' | 'date_range',
    mode: normalizedMode,
  }
}

const buildSearch = (params: Record<string, string | null | undefined>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') p.set(k, v)
  }
  const s = p.toString()
  return s ? `?${s}` : ''
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
      { value: 'salesReports', label: 'Quick Report', icon: FileText },
    ],
  },
  {
    label: 'Capital',
    items: [
      { value: 'portfolioCapital', label: 'Portfolio Money', icon: BanknoteArrowUp },
      { value: 'businessCapital', label: 'Business Money', icon: BanknoteArrowDown },
      { value: 'pdfSalesReports', label: 'Sales Reports', icon: FileText },
    ],
  },
]

// Tabs where switching the active business mid-session is relevant and safe
const SHOW_BUSINESS_SELECTOR_TABS: Tab[] = [
  'overview',
  'staff',
  'scheduleAttendance',
  'compensation',
  'referenceItems',
  'expenses',
  'businessCapital',
  'pdfSalesReports',
]

// ─── Shared class constants ───────────────────────────────────────────────────
const cardClass =
  'rounded-xl border border-[var(--neutral-linen)] bg-[var(--surface-card)] p-6 shadow-[0_4px_20px_rgba(58,9,18,0.06)]'

const formGridClass = 'mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3'

// Pill-style radio/checkbox option
// Uses CSS has-[:checked] so the label reacts to the actual DOM checked state —
// works for both controlled (checked=) and uncontrolled (defaultChecked) inputs.
const optionPillClass =
  'flex cursor-pointer select-none items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all ' +
  'border-[var(--neutral-linen)] bg-[var(--surface-card)] text-[var(--neutral-rosewood)] ' +
  'hover:border-[var(--burgundy-400)] hover:bg-[var(--burgundy-50)] hover:text-[var(--burgundy-800)] ' +
  'focus-within:border-[var(--burgundy-600)] focus-within:ring-2 focus-within:ring-[var(--burgundy-100)] ' +
  'has-[:checked]:border-[var(--burgundy-600)] has-[:checked]:bg-[var(--burgundy-50)] ' +
  'has-[:checked]:text-[var(--burgundy-800)] has-[:checked]:shadow-[inset_0_0_0_1px_var(--burgundy-600)]'

type ReportIncludeSection =
  | 'staff'
  | 'schedule_attendance'
  | 'compensation'
  | 'reference_items'
  | 'expenses'
  | 'sales_gcash'
  | 'sales_coffee'
  | 'sales_print'
  | 'sales_ethereal'
  | 'portfolio_business_money'

const reportIncludeSectionOptions: Array<{ value: ReportIncludeSection; label: string }> = [
  { value: 'staff', label: 'Staff' },
  { value: 'schedule_attendance', label: 'Schedule & Attendance' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'reference_items', label: 'Reference Items' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'sales_gcash', label: 'Sales: GCash' },
  { value: 'sales_coffee', label: 'Sales: Coffee' },
  { value: 'sales_print', label: 'Sales: Print' },
  { value: 'sales_ethereal', label: 'Sales: Ethereal' },
  { value: 'portfolio_business_money', label: 'Portfolio/Business Money' },
]

const defaultReportIncludeSections = reportIncludeSectionOptions.map((option) => option.value)
const salesIncludeSections: ReportIncludeSection[] = ['sales_gcash', 'sales_coffee', 'sales_print', 'sales_ethereal']

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
  const _initial = readUrlState()

  const [tab, setTabState] = useState<Tab>(_initial.tab)
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(_initial.businessId)

  const [gcashRecipient, setGcashRecipient] = useState('')
  const [gcashReferenceItemId, setGcashReferenceItemId] = useState('')
  const [gcashAmountMoved, setGcashAmountMoved] = useState('0')
  const [gcashSalesAmount, setGcashSalesAmount] = useState('0')
  const [gcashIsDebt, setGcashIsDebt] = useState(false)
  const [gcashChargedAmount, setGcashChargedAmount] = useState('')
  const [gcashRemarks, setGcashRemarks] = useState('')
  const [coffeeItems, setCoffeeItems] = useState<CoffeeDraftItem[]>([createCoffeeDraftItem()])
  const [printItems, setPrintItems] = useState<PrintDraftItem[]>([createPrintDraftItem()])
  const [etherealItems, setEtherealItems] = useState<EtherealDraftItem[]>([createEtherealDraftItem()])
  const [portfolioAmountPreview, setPortfolioAmountPreview] = useState('0')
  const [portfolioDirectionPreview, setPortfolioDirectionPreview] = useState<'add' | 'deduct' | 'transfer' | 'debt'>('add')
  const [portfolioNotes, setPortfolioNotes] = useState('')
  const [portfolioRemarks, setPortfolioRemarks] = useState('')
  const [businessAmountPreview, setBusinessAmountPreview] = useState('0')
  const [businessDirectionPreview, setBusinessDirectionPreview] = useState<'add' | 'deduct'>('add')
  const [scheduleDateFilter, setScheduleDateFilter] = useState<string>(_initial.date)
  const [compensationMode, setCompensationMode] = useState<'today' | 'specific_date'>(_initial.mode)
  const [salesReportPage, setSalesReportPage] = useState(_initial.page)
  const [pdfReportScope, setPdfReportScope] = useState<'business' | 'all_businesses'>('all_businesses')
  const [pdfBusinessId, setPdfBusinessId] = useState<number | null>(_initial.businessId)
  const [reportScope, setReportScope] = useState<'portfolio' | 'business'>(_initial.scope)
  const [reportPeriod, setReportPeriod] = useState<'today' | 'date_range'>(_initial.period)
  const [actionGuidance, setActionGuidance] = useState<string | null>(null)

  const [latestSalesReport, setLatestSalesReport] = useState<SalesReport | null>(null)
  const [editingReferenceItemId, setEditingReferenceItemId] = useState<number | null>(null)
  const [editingReferenceItemForm, setEditingReferenceItemForm] = useState<ReferenceItemFormState>(createReferenceItemFormState())
  const [moneyReauthModalOpen, setMoneyReauthModalOpen] = useState(false)
  const [moneyReauthUsername, setMoneyReauthUsername] = useState('')
  const [moneyReauthPassword, setMoneyReauthPassword] = useState('')

  const moneyReauthResolverRef = useRef<((credentials: MoneyReauthCredentials | null) => void) | null>(null)

  const prevTabRef = useRef<Tab>(_initial.tab)

  const setTab = useCallback((next: Tab) => {
    setTabState(next)
  }, [])

  const meQuery = useMe()
  const loginMutation = useLogin()
  const logoutMutation = useLogout()

  const businessesQuery = useBusinesses()
  const businesses = useMemo(() => businessesQuery.data?.data ?? [], [businessesQuery.data])

  useEffect(() => {
    const isTabChange = prevTabRef.current !== tab
    prevTabRef.current = tab

    const params: Record<string, string | null> = {
      // Omit `tab` from URL when it's the default to keep the root URL clean
      tab: tab !== 'overview' ? tab : null,
      // Include business for every tab that uses it
      business: selectedBusinessId ? String(selectedBusinessId) : null,
      // Tab-specific context params
      date:   tab === 'scheduleAttendance' ? scheduleDateFilter : null,
      page:   tab === 'pdfSalesReports' && salesReportPage > 1 ? String(salesReportPage) : null,
      scope:  tab === 'salesReports' ? reportScope : null,
      period: tab === 'salesReports' ? reportPeriod : null,
      mode:   tab === 'compensation' && compensationMode !== 'today' ? compensationMode : null,
    }

    const url = window.location.pathname + buildSearch(params)

    if (isTabChange) {
      // Push so the browser back button navigates between tabs
      window.history.pushState({ tab }, '', url)
    } else {
      // Replace for filter/context tweaks — no history spam
      window.history.replaceState({ tab }, '', url)
    }
  }, [tab, selectedBusinessId, scheduleDateFilter, salesReportPage, reportScope, reportPeriod, compensationMode])

// ── Sync URL → state (browser back / forward) ───────────────────────────────
  useEffect(() => {
    const onPopState = () => {
      const s = readUrlState()
      setTabState(s.tab)
      setSelectedBusinessId(s.businessId)
      setScheduleDateFilter(s.date)
      setSalesReportPage(s.page)
      setReportScope(s.scope)
      setReportPeriod(s.period)
      setCompensationMode(s.mode)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, []) // intentionally empty — only registers/unregisters the listener

  const staffQuery = useStaff(selectedBusinessId)
  const createStaffMutation = useCreateStaff(selectedBusinessId)
  const updateStaffMutation = useUpdateStaff(selectedBusinessId)
  const deleteStaffMutation = useDeleteStaff(selectedBusinessId)
  const staffDayOffsQuery = useStaffDayOffs(selectedBusinessId, scheduleDateFilter)
  const createStaffDayOffMutation = useCreateStaffDayOff(selectedBusinessId, scheduleDateFilter)
  const deleteStaffDayOffMutation = useDeleteStaffDayOff(selectedBusinessId, scheduleDateFilter)
  const staffAbsencesQuery = useStaffAbsences(selectedBusinessId, scheduleDateFilter)
  const createStaffAbsenceMutation = useCreateStaffAbsence(selectedBusinessId, scheduleDateFilter)
  const deleteStaffAbsenceMutation = useDeleteStaffAbsence(selectedBusinessId, scheduleDateFilter)
  const compensationRunsQuery = useCompensationRuns(selectedBusinessId)
  const createCompensationRunMutation = useCreateCompensationRun(selectedBusinessId)
  const finalizeCompensationRunMutation = useFinalizeCompensationRun(selectedBusinessId)
  const expensesQuery = useExpenses(selectedBusinessId)
  const createExpenseMutation = useCreateExpense(selectedBusinessId)
  const gcashQuery = useGcashSales(selectedBusinessId)
  const createGcashMutation = useCreateGcashSale(selectedBusinessId)
  const deleteGcashMutation = useDeleteGcashSale(selectedBusinessId)
  const coffeeQuery = useCoffeeSales(selectedBusinessId)
  const createCoffeeMutation = useCreateCoffeeSale(selectedBusinessId)
  const deleteCoffeeMutation = useDeleteCoffeeSale(selectedBusinessId)
  const printQuery = usePrintSales(selectedBusinessId)
  const createPrintMutation = useCreatePrintSale(selectedBusinessId)
  const deletePrintMutation = useDeletePrintSale(selectedBusinessId)
  const etherealQuery = useEtherealSales(selectedBusinessId)
  const createEtherealMutation = useCreateEtherealSale(selectedBusinessId)
  const deleteEtherealMutation = useDeleteEtherealSale(selectedBusinessId)
  const referenceItemsQuery = useBusinessReferenceItems(selectedBusinessId)
  const createReferenceItemMutation = useCreateBusinessReferenceItem(selectedBusinessId)
  const updateReferenceItemMutation = useUpdateBusinessReferenceItem(selectedBusinessId)
  const deleteReferenceItemMutation = useDeleteBusinessReferenceItem(selectedBusinessId)
  const capitalMovementsQuery = useCapitalMovements()
  const createPortfolioCapitalMutation = useCreatePortfolioCapitalMovement()
  const settlePortfolioDebtMutation = useSettlePortfolioDebt()
  const createBusinessCapitalMutation = useCreateBusinessCapitalMovement(selectedBusinessId)
  const generateSalesReportMutation = useGenerateSalesReport()
  const salesReportsQuery = useSalesReports(pdfBusinessId, salesReportPage, pdfReportScope, { enabled: pdfReportScope === 'business' && Boolean(pdfBusinessId) })
  const portfolioSalesReportsQuery = usePortfolioSalesReports(salesReportPage, { enabled: pdfReportScope === 'all_businesses' })
  const createSalesReportMutation = useCreateSalesReport(salesReportPage, pdfReportScope)
  const downloadSalesReportMutation = useDownloadSalesReport()
  const downloadPortfolioSalesReportMutation = useDownloadPortfolioSalesReport()

  const selectedBusinessName = useMemo(
    () => selectedBusinessId ? businesses.find((b) => b.id === selectedBusinessId)?.name ?? null : 'All businesses',
    [businesses, selectedBusinessId],
  )

  const portfolioMovements = useMemo(
    () => (capitalMovementsQuery.data?.data ?? []).filter((m) => m.source_type === 'portfolio'),
    [capitalMovementsQuery.data],
  )

  const businessMovements = useMemo(
    () => {
      const allMovements = capitalMovementsQuery.data?.data ?? []
      if (!selectedBusinessId) {
        return allMovements.filter((movement) => movement.source_type === 'business' || movement.target_business_id !== null)
      }

      return allMovements.filter(
        (movement) => movement.source_business_id === selectedBusinessId || movement.target_business_id === selectedBusinessId,
      )
    },
    [capitalMovementsQuery.data, selectedBusinessId],
  )

  const staffEntries = useMemo(() => staffQuery.data?.data ?? [], [staffQuery.data])
  const staffDayOffEntries = useMemo(() => staffDayOffsQuery.data?.data ?? [], [staffDayOffsQuery.data])
  const staffAbsenceEntries = useMemo(() => staffAbsencesQuery.data?.data ?? [], [staffAbsencesQuery.data])
  const compensationRuns = useMemo(() => compensationRunsQuery.data?.data ?? [], [compensationRunsQuery.data])
  const expenseEntries = useMemo(() => expensesQuery.data?.data ?? [], [expensesQuery.data])
  const gcashEntries = useMemo(() => gcashQuery.data?.data ?? [], [gcashQuery.data])
  const coffeeEntries = useMemo(() => coffeeQuery.data?.data ?? [], [coffeeQuery.data])
  const printEntries = useMemo(() => printQuery.data?.data ?? [], [printQuery.data])
  const etherealEntries = useMemo(() => etherealQuery.data?.data ?? [], [etherealQuery.data])
  const referenceItems = useMemo(() => referenceItemsQuery.data?.data ?? [], [referenceItemsQuery.data])
  const salesReportVersions = useMemo(
    () => (pdfReportScope === 'all_businesses' ? portfolioSalesReportsQuery.data?.data ?? [] : salesReportsQuery.data?.data ?? []),
    [pdfReportScope, portfolioSalesReportsQuery.data, salesReportsQuery.data],
  )
  const productReferenceItems = useMemo(() => referenceItems.filter((i) => i.item_type === 'product'), [referenceItems])
  const serviceReferenceItems = useMemo(() => referenceItems.filter((i) => i.item_type === 'service'), [referenceItems])
  const referenceItemById = useMemo(() => new Map(referenceItems.map((item) => [String(item.id), item])), [referenceItems])
  const userRoles = useMemo(() => {
    const data = meQuery.data

    if (!data) return []

    if (Array.isArray(data.roles) && data.roles.length > 0) {
      return data.roles
    }

    return data.role ? [data.role] : []
  }, [meQuery.data])

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
      const amt = parseAmount(m.amount)

      if (m.source_type === 'portfolio' && m.direction === 'transfer' && (!selectedBusinessId || m.target_business_id === selectedBusinessId)) {
        return bal + amt
      }

      if (m.source_type === 'business' && (!selectedBusinessId || m.source_business_id === selectedBusinessId)) {
        return m.direction === 'add' ? bal + amt : bal - amt
      }

      return bal
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

  const showActionGuidance = useCallback((message: string) => {
    setActionGuidance(message)
  }, [])

  const handleGcashSalesAmountChange = useCallback((value: string) => {
    const nextSalesAmount = toNonNegativeInputValue(value)
    setGcashSalesAmount(nextSalesAmount)
    if (!gcashIsDebt) {
      setGcashChargedAmount((previousChargedAmount) => (
        previousChargedAmount.trim() === '' || previousChargedAmount === gcashSalesAmount
          ? nextSalesAmount
          : previousChargedAmount
      ))
    }
  }, [gcashIsDebt, gcashSalesAmount])

  const handleGcashDebtToggle = useCallback((checked: boolean) => {
    setGcashIsDebt(checked)
    if (!checked) {
      setGcashChargedAmount((previousChargedAmount) => (
        previousChargedAmount.trim() === ''
          ? gcashSalesAmount
          : previousChargedAmount
      ))
    }
  }, [gcashSalesAmount])

  const requireBusinessSelection = useCallback(
    (action: string) => {
      if (selectedBusinessId) return true
      showActionGuidance(`Select a business first to ${action}.`)
      return false
    },
    [selectedBusinessId, showActionGuidance],
  )

  useEffect(() => {
    if (selectedBusinessId) {
      setActionGuidance(null)
    }
  }, [selectedBusinessId])

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

  const submitLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loginMutation.isPending) {
      showActionGuidance('Login is already processing. Please wait.')
      return
    }
    const f = new FormData(e.currentTarget)
    await loginMutation.mutateAsync({
      username: String(f.get('username') ?? ''),
      password: String(f.get('password') ?? ''),
    })
  }

  const submitStaff = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!requireBusinessSelection('add staff')) return
    if (createStaffMutation.isPending) {
      showActionGuidance('Staff creation is already processing. Please wait.')
      return
    }
    const f = new FormData(e.currentTarget)
    await createStaffMutation.mutateAsync({
      full_name: String(f.get('full_name') ?? ''),
      age: parseNonNegativeAmount(f.get('age')),
      employment_start_date: String(f.get('employment_start_date') ?? ''),
      employment_end_date: String(f.get('employment_end_date') ?? ''),
      employment_type: String(f.get('employment_type') ?? ''),
      salary: parseNonNegativeAmount(f.get('salary')),
      commission_rate_percent: parseNonNegativeAmount(f.get('commission_rate_percent')),
      is_active: String(f.get('is_active') ?? '1') === '1',
    })
    e.currentTarget.reset()
  }

  const markStaffInactive = async (staffId: number) => {
    if (!requireBusinessSelection('update staff status')) return
    if (updateStaffMutation.isPending) {
      showActionGuidance('A staff update is already processing. Please wait.')
      return
    }
    const target = staffEntries.find((entry) => entry.id === staffId)
    if (!target?.is_active) {
      showActionGuidance('This staff member is already inactive.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    await updateStaffMutation.mutateAsync({
      staffId,
      payload: { is_active: false, ...reauth },
    })
  }

  const endStaffEmployment = async (staffId: number) => {
    if (!requireBusinessSelection('end employment')) return
    if (updateStaffMutation.isPending) {
      showActionGuidance('A staff update is already processing. Please wait.')
      return
    }
    const target = staffEntries.find((entry) => entry.id === staffId)
    if (target?.employment_end_date) {
      showActionGuidance('Employment is already ended for this staff member.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    await updateStaffMutation.mutateAsync({
      staffId,
      payload: { is_active: false, employment_end_date: formatDateOnly(new Date()), ...reauth },
    })
  }

  const voidStaffRecord = async (staffId: number) => {
    if (!requireBusinessSelection('remove staff')) return
    if (deleteStaffMutation.isPending) {
      showActionGuidance('Staff removal is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    await deleteStaffMutation.mutateAsync({ staffId, payload: reauth })
  }

  const submitStaffDayOff = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!requireBusinessSelection('add day off')) return
    if (createStaffDayOffMutation.isPending) {
      showActionGuidance('Day-off creation is already processing. Please wait.')
      return
    }
    const f = new FormData(e.currentTarget)
    await createStaffDayOffMutation.mutateAsync({
      staff_id: Number(f.get('staff_id') ?? 0),
      day_off_on: String(f.get('attendance_date') ?? ''),
      notes: String(f.get('notes') ?? ''),
    })
    setScheduleDateFilter(String(f.get('attendance_date') ?? formatDateOnly(new Date())))
  }

  const submitStaffAbsence = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!requireBusinessSelection('add absence')) return
    if (createStaffAbsenceMutation.isPending) {
      showActionGuidance('Absence creation is already processing. Please wait.')
      return
    }
    const f = new FormData(e.currentTarget)
    await createStaffAbsenceMutation.mutateAsync({
      staff_id: Number(f.get('staff_id') ?? 0),
      absent_on: String(f.get('attendance_date') ?? ''),
      notes: String(f.get('notes') ?? ''),
    })
    setScheduleDateFilter(String(f.get('attendance_date') ?? formatDateOnly(new Date())))
  }

  const removeStaffDayOff = async (dayOffId: number) => {
    if (!requireBusinessSelection('remove day off')) return
    if (deleteStaffDayOffMutation.isPending) {
      showActionGuidance('Day-off removal is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    await deleteStaffDayOffMutation.mutateAsync({ dayOffId, payload: reauth })
  }

  const removeStaffAbsence = async (absenceId: number) => {
    if (!requireBusinessSelection('remove absence')) return
    if (deleteStaffAbsenceMutation.isPending) {
      showActionGuidance('Absence removal is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    await deleteStaffAbsenceMutation.mutateAsync({ absenceId, payload: reauth })
  }

  const submitCompensationRun = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!requireBusinessSelection('compute compensation')) return
    if (createCompensationRunMutation.isPending) {
      showActionGuidance('Compensation computation is already processing. Please wait.')
      return
    }
    const f = new FormData(e.currentTarget)
    const mode = String(f.get('computation_mode') ?? 'today') as 'today' | 'specific_date'
    await createCompensationRunMutation.mutateAsync({
      computation_mode: mode,
      cutoff_date: mode === 'specific_date'
        ? String(f.get('cutoff_date') ?? formatDateOnly(new Date()))
        : undefined,
    })
  }

  const finalizeCompensationRun = async (runId: number) => {
    if (!requireBusinessSelection('finalize compensation')) return
    if (finalizeCompensationRunMutation.isPending) {
      showActionGuidance('Compensation finalization is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    finalizeCompensationRunMutation.reset()
    try {
      await finalizeCompensationRunMutation.mutateAsync({ runId, payload: reauth })
    } catch {
      // Error is presented via ActionErrorPanel.
    }
  }

  const settleDebtMovement = async (movementId: number) => {
    if (settlePortfolioDebtMutation.isPending) {
      showActionGuidance('Debt settlement is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return

    settlePortfolioDebtMutation.reset()
    try {
      await settlePortfolioDebtMutation.mutateAsync({ movementId, payload: reauth })
    } catch {
      // Error is presented via ActionErrorPanel.
    }
  }

  const triggerDownloadSalesReport = async (report: SalesReportVersion) => {
    if (downloadSalesReportMutation.isPending || downloadPortfolioSalesReportMutation.isPending) {
      showActionGuidance('A report download is already processing. Please wait.')
      return
    }
    const reportScope = report.metadata.report_scope ?? report.details.report_scope ?? 'business'
    const download = reportScope === 'all_businesses'
      ? await downloadPortfolioSalesReportMutation.mutateAsync(report.id)
      : await downloadSalesReportMutation.mutateAsync({ businessId: report.business_id, reportId: report.id })
    const url = URL.createObjectURL(download.blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = download.filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const submitExpense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!requireBusinessSelection('add expense')) return
    if (createExpenseMutation.isPending) {
      showActionGuidance('Expense creation is already processing. Please wait.')
      return
    }
    const form = e.currentTarget
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const f = new FormData(form)
    await createExpenseMutation.mutateAsync({
      date_issued: String(f.get('date_issued') ?? ''),
      amount: parseNonNegativeAmount(f.get('amount')),
      description: String(f.get('description') ?? ''),
      purpose: String(f.get('purpose') ?? 'business') as 'business' | 'business_portfolio' | 'service',
      recurrence_reference: String(f.get('recurrence_reference') ?? ''),
      proof: f.get('proof') instanceof File && (f.get('proof') as File).size > 0 ? (f.get('proof') as File) : null,
      ...reauth,
    })
    e.currentTarget.reset()
  }

  const submitReferenceItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!requireBusinessSelection('add reference item')) return
    if (createReferenceItemMutation.isPending) {
      showActionGuidance('Reference item creation is already processing. Please wait.')
      return
    }
    const f = new FormData(e.currentTarget)
    await createReferenceItemMutation.mutateAsync({
      item_type: String(f.get('item_type') ?? 'product') as 'product' | 'service',
      name: String(f.get('name') ?? ''),
      price: parseNonNegativeAmount(f.get('price')),
      description: String(f.get('description') ?? ''),
    })
    e.currentTarget.reset()
  }

  const beginReferenceItemEdit = (itemId: number) => {
    const item = referenceItems.find((entry) => entry.id === itemId)
    if (!item) return

    setEditingReferenceItemId(itemId)
    setEditingReferenceItemForm({
      item_type: item.item_type,
      name: item.name,
      price: String(parseAmount(item.price)),
      description: item.description ?? '',
    })
  }

  const cancelReferenceItemEdit = () => {
    setEditingReferenceItemId(null)
    setEditingReferenceItemForm(createReferenceItemFormState())
  }

  const saveReferenceItemEdit = async () => {
    if (!selectedBusinessId || !editingReferenceItemId) return
    const reauth = await requestMoneyReauth()
    if (!reauth) return

    await updateReferenceItemMutation.mutateAsync({
      itemId: editingReferenceItemId,
      payload: {
        item_type: editingReferenceItemForm.item_type,
        name: editingReferenceItemForm.name,
        price: parseNonNegativeAmount(editingReferenceItemForm.price),
        description: editingReferenceItemForm.description,
        ...reauth,
      },
    })

    cancelReferenceItemEdit()
  }

  const removeReferenceItem = async (itemId: number) => {
    if (!requireBusinessSelection('remove reference item')) return
    if (deleteReferenceItemMutation.isPending) {
      showActionGuidance('Reference item removal is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    await deleteReferenceItemMutation.mutateAsync({
      itemId,
      payload: reauth,
    })
    if (editingReferenceItemId === itemId) {
      cancelReferenceItemEdit()
    }
  }

  const submitGcash = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (createGcashMutation.isPending) {
      showActionGuidance('GCash sale creation is already processing. Please wait.')
      return
    }
    const form = e.currentTarget
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const f = new FormData(form)
    const selectedReferenceItem = gcashReferenceItemId ? referenceItemById.get(gcashReferenceItemId) : undefined
    await createGcashMutation.mutateAsync({
      transaction_recipient: gcashRecipient.trim() || undefined,
      reference_item_name: selectedReferenceItem?.name,
      reference_item_original_price: selectedReferenceItem ? parseAmount(selectedReferenceItem.price) : undefined,
      amount_moved: parseNonNegativeAmount(f.get('amount_moved')),
      sales_amount: parseNonNegativeAmount(f.get('sales_amount')),
      is_debt: gcashIsDebt,
      charged_amount: gcashIsDebt
        ? (gcashChargedAmount.trim() ? parseNonNegativeAmount(gcashChargedAmount) : undefined)
        : parseNonNegativeAmount(gcashChargedAmount || f.get('sales_amount')),
      remarks: gcashRemarks.trim() || undefined,
      transaction_type: String(f.get('transaction_type') ?? 'cash_in') as 'cash_in' | 'cash_out',
      transaction_date: String(f.get('transaction_date') ?? ''),
      ...reauth,
    })
    form.reset()
    setGcashRecipient('')
    setGcashReferenceItemId('')
    setGcashAmountMoved('0')
    setGcashSalesAmount('0')
    setGcashIsDebt(false)
    setGcashChargedAmount('')
    setGcashRemarks('')
  }
  const voidGcashSale = async (saleId: number) => {
    if (!requireBusinessSelection('remove GCash sale')) return
    if (deleteGcashMutation.isPending) {
      showActionGuidance('GCash sale removal is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    await deleteGcashMutation.mutateAsync({ saleId, payload: reauth })
  }

  const submitCoffee = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!requireBusinessSelection('add coffee sale')) return
    if (createCoffeeMutation.isPending) {
      showActionGuidance('Coffee sale creation is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const entries = coffeeItems.map((item) => {
      const selectedReferenceItem = item.selectedReferenceItemId
        ? referenceItemById.get(item.selectedReferenceItemId)
        : undefined

      return {
        ...(selectedReferenceItem
          ? {
            reference_item_name: selectedReferenceItem.name,
            reference_item_original_price: parseAmount(selectedReferenceItem.price),
          }
          : {}),
        price: parseNonNegativeAmount(item.price),
        coffee_type: item.coffee_type,
        size: item.size,
        add_on_price: parseNonNegativeAmount(item.add_on_price),
        add_on_description: item.add_on_description,
        is_debt: item.is_debt,
        charged_amount: item.charged_amount.trim() ? parseNonNegativeAmount(item.charged_amount) : undefined,
        remarks: item.remarks.trim() || undefined,
        sale_date: new Date(item.sale_date).toISOString(),
      }
    })
    await createCoffeeMutation.mutateAsync({ ...entries[0], entries, ...reauth })
    setCoffeeItems([createCoffeeDraftItem()])
  }

  const voidCoffeeSale = async (saleId: number) => {
    if (!requireBusinessSelection('remove coffee sale')) return
    if (deleteCoffeeMutation.isPending) {
      showActionGuidance('Coffee sale removal is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    await deleteCoffeeMutation.mutateAsync({ saleId, payload: reauth })
  }

  const submitPrint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!requireBusinessSelection('add print sale')) return
    if (createPrintMutation.isPending) {
      showActionGuidance('Print sale creation is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const entries = printItems.map((item) => {
      const selectedReferenceItem = item.selectedReferenceItemId
        ? referenceItemById.get(item.selectedReferenceItemId)
        : undefined

      return {
        ...(selectedReferenceItem
          ? {
            reference_item_name: selectedReferenceItem.name,
            reference_item_original_price: parseAmount(selectedReferenceItem.price),
          }
          : {}),
        job_type: item.job_type,
        description: item.description,
        color_mode: item.color_mode,
        print_size: item.print_size,
        paper_count: parseNonNegativeAmount(item.paper_count || 1),
        sales_amount: parseNonNegativeAmount(item.sales_amount),
        is_debt: item.is_debt,
        charged_amount: item.charged_amount.trim() ? parseNonNegativeAmount(item.charged_amount) : undefined,
        remarks: item.remarks.trim() || undefined,
        sale_date: new Date(item.sale_date).toISOString(),
      }
    })
    await createPrintMutation.mutateAsync({ ...entries[0], entries, ...reauth })
    setPrintItems([createPrintDraftItem()])
  }

  const voidPrintSale = async (saleId: number) => {
    if (!requireBusinessSelection('remove print sale')) return
    if (deletePrintMutation.isPending) {
      showActionGuidance('Print sale removal is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    await deletePrintMutation.mutateAsync({ saleId, payload: reauth })
  }

  const submitEthereal = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!requireBusinessSelection('add ethereal sale')) return
    if (createEtherealMutation.isPending) {
      showActionGuidance('Ethereal sale creation is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const entries = etherealItems.map((item) => {
      const selectedReferenceItem = item.selectedReferenceItemId
        ? referenceItemById.get(item.selectedReferenceItemId)
        : undefined

      return {
        ...(selectedReferenceItem
          ? {
            reference_item_name: selectedReferenceItem.name,
            reference_item_original_price: parseAmount(selectedReferenceItem.price),
          }
          : {}),
        staff_ids: item.staff_ids,
        service_name: item.service_name,
        service_cost: parseNonNegativeAmount(item.service_cost),
        discount_percentage: parseNonNegativeAmount(item.discount_percentage),
        customer_name: item.customer_name,
        discount_type: item.discount_type,
        is_debt: item.is_debt,
        charged_amount: item.charged_amount.trim() ? parseNonNegativeAmount(item.charged_amount) : undefined,
        remarks: item.remarks.trim() || undefined,
        service_date: item.service_date,
      }
    })
    await createEtherealMutation.mutateAsync({
      ...entries[0],
      staff_id: entries[0].staff_ids[0],
      staff_ids: entries[0].staff_ids,
      entries,
      ...reauth,
    })
    setEtherealItems([createEtherealDraftItem()])
  }

  const voidEtherealSale = async (saleId: number) => {
    if (!requireBusinessSelection('remove ethereal sale')) return
    if (deleteEtherealMutation.isPending) {
      showActionGuidance('Ethereal sale removal is already processing. Please wait.')
      return
    }
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    await deleteEtherealMutation.mutateAsync({ saleId, payload: reauth })
  }

  const submitPortfolioCapital = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (createPortfolioCapitalMutation.isPending) {
      showActionGuidance('Portfolio capital movement is already processing. Please wait.')
      return
    }
    createPortfolioCapitalMutation.reset()
    const form = e.currentTarget            // ← capture BEFORE any await
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const f = new FormData(form)
    const direction = String(f.get('direction') ?? 'add') as 'add' | 'deduct' | 'transfer' | 'debt'
    const targetBusinessId = Number(f.get('target_business_id') ?? 0)
    await createPortfolioCapitalMutation.mutateAsync({
      amount: parseNonNegativeAmount(f.get('amount')),
      direction,
      target_business_id: direction === 'transfer' && targetBusinessId ? targetBusinessId : undefined,
      occurred_on: String(f.get('occurred_on') ?? ''),
      notes: portfolioNotes.trim() || undefined,
      remarks: direction === 'debt' ? portfolioRemarks.trim() : undefined,
      ...reauth,
    })
    e.currentTarget.reset()
    setPortfolioAmountPreview('0')
    setPortfolioDirectionPreview('add')
    setPortfolioNotes('')
    setPortfolioRemarks('')
  }

  const submitBusinessCapital = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!requireBusinessSelection('add business capital movement')) return
    if (createBusinessCapitalMutation.isPending) {
      showActionGuidance('Business capital movement is already processing. Please wait.')
      return
    }
    createBusinessCapitalMutation.reset()
    const form = e.currentTarget            // ← capture BEFORE any await
    const reauth = await requestMoneyReauth()
    if (!reauth) return
    const f = new FormData(form)
    await createBusinessCapitalMutation.mutateAsync({
      amount: parseNonNegativeAmount(f.get('amount')),
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
    if (generateSalesReportMutation.isPending) {
      showActionGuidance('Report generation is already processing. Please wait.')
      return
    }
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

  const submitPdfSalesReport = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (createSalesReportMutation.isPending) {
      showActionGuidance('Report generation is already processing. Please wait.')
      return
    }

    const f = new FormData(e.currentTarget)
    const reportScope = String(f.get('report_scope') ?? 'business') as 'business' | 'all_businesses'
    const includeSections = f
      .getAll('include_sections')
      .map((value) => String(value))
      .filter((value): value is ReportIncludeSection =>
        defaultReportIncludeSections.includes(value as ReportIncludeSection),
      )
    const selectedPdfBusinessId = Number(f.get('business_id') ?? 0)
    const fallbackBusinessId = businesses[0]?.id ?? null

    if (includeSections.length === 0) {
      showActionGuidance('Select at least one optional content section before generating the report.')
      return
    }

    const hasSelectedSalesContent = salesIncludeSections.some((section) => includeSections.includes(section))
    const hasSelectedCompensationContent = includeSections.includes('compensation')
    const reportType: 'sales' | 'compensation' | 'combined' = hasSelectedSalesContent && hasSelectedCompensationContent
      ? 'combined'
      : hasSelectedCompensationContent
        ? 'compensation'
        : 'sales'

    const requestBusinessId = reportScope === 'business'
      ? (selectedPdfBusinessId > 0 ? selectedPdfBusinessId : null)
      : (selectedPdfBusinessId > 0 ? selectedPdfBusinessId : fallbackBusinessId)
    if (!requestBusinessId) {
      showActionGuidance('Select a business to generate a business-scoped report.')
      return
    }

    await createSalesReportMutation.mutateAsync({
      businessId: requestBusinessId,
      payload: {
        start_date: String(f.get('start_date') ?? ''),
        end_date: String(f.get('end_date') ?? ''),
        document_title: String(f.get('document_title') ?? '').trim() || undefined,
        report_type: reportType,
        report_scope: reportScope,
        include_sections: includeSections,
      },
    })

    e.currentTarget.reset()
    setPdfReportScope(reportScope)
    setPdfBusinessId(requestBusinessId)
    setSalesReportPage(1)
  }

  const submitMoneyReauthModal = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    resolveMoneyReauth({
      reauth_username: moneyReauthUsername,
      reauth_password: moneyReauthPassword,
    })
  }

  const moneyReauthFieldLabels: Record<string, string> = {
    reauth_username: 'Re-auth username',
    reauth_password: 'Re-auth password',
  }

  const portfolioMovementFieldLabels: Record<string, string> = {
    amount: 'Amount',
    direction: 'Direction',
    target_business_id: 'Transfer target',
    occurred_on: 'Date',
    notes: 'Notes',
    remarks: 'Debt remarks',
    ...moneyReauthFieldLabels,
  }

  const businessMovementFieldLabels: Record<string, string> = {
    amount: 'Amount',
    direction: 'Direction',
    occurred_on: 'Date',
    notes: 'Notes',
    ...moneyReauthFieldLabels,
  }

  const portfolioMovementFieldErrors = {
    amount: getFieldErrorsFor(createPortfolioCapitalMutation.error, 'amount'),
    direction: getFieldErrorsFor(createPortfolioCapitalMutation.error, 'direction'),
    target_business_id: getFieldErrorsFor(createPortfolioCapitalMutation.error, 'target_business_id'),
    occurred_on: getFieldErrorsFor(createPortfolioCapitalMutation.error, 'occurred_on'),
    notes: getFieldErrorsFor(createPortfolioCapitalMutation.error, 'notes'),
    remarks: getFieldErrorsFor(createPortfolioCapitalMutation.error, 'remarks'),
  }

  const businessMovementFieldErrors = {
    amount: getFieldErrorsFor(createBusinessCapitalMutation.error, 'amount'),
    direction: getFieldErrorsFor(createBusinessCapitalMutation.error, 'direction'),
    occurred_on: getFieldErrorsFor(createBusinessCapitalMutation.error, 'occurred_on'),
    notes: getFieldErrorsFor(createBusinessCapitalMutation.error, 'notes'),
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
              <button type="submit" className="dashboard-button-primary mt-1">
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
      <datalist id="quick-number-values">
        <option value="0" />
        <option value="1" />
        <option value="5" />
        <option value="10" />
        <option value="50" />
        <option value="100" />
        <option value="500" />
        <option value="1000" />
      </datalist>
      <div className="mx-auto grid w-full max-w-[1460px] gap-6 px-4 py-6 lg:grid-cols-[240px_minmax(0,1fr)]">

        {actionGuidance ? (
          <div className="lg:col-span-2 rounded-lg border border-[var(--status-info-border)] bg-[var(--status-info-bg)] px-4 py-3 text-sm text-[var(--status-info-text)]">
            {actionGuidance}
          </div>
        ) : null}

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
                  <p className="text-xs text-[var(--neutral-rosewood)]">@{meQuery.data.username}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(userRoles.length > 0 ? userRoles : [meQuery.data.role]).map((role) => (
                      <span
                        key={role}
                        className="inline-block rounded-full bg-[var(--burgundy-50)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--burgundy-800)]"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (logoutMutation.isPending) {
                    showActionGuidance('Logout is already processing. Please wait.')
                    return
                  }
                  logoutMutation.mutate()
                }}
                className="dashboard-button-secondary"
              >
                {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>

            {/* Business selector */}
            {businesses.length > 0 && SHOW_BUSINESS_SELECTOR_TABS.includes(tab) && (
              <div className="mt-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--neutral-rosewood)]">
                  Business filter
                </p>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Select business explicitly
                  <select
                    value={selectedBusinessId ?? ''}
                    onChange={(event) => setSelectedBusinessId(event.target.value ? Number(event.target.value) : null)}
                    className="dashboard-input"
                  >
                    <option value="">All businesses (default)</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name} ({business.slug})
                      </option>
                    ))}
                  </select>
                </label>
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
                  <input name="age" type="number" list="quick-number-values" required className="dashboard-input" />
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
                  Salary (per day)
                  <input name="salary" type="number" list="quick-number-values" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Commission (% per service)
                  <input name="commission_rate_percent" type="number" list="quick-number-values" defaultValue="0" required className="dashboard-input" />
                </label>
                <label className="md:col-span-2 lg:col-span-3 grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Status
                  <select name="is_active" defaultValue="1" className="dashboard-input">
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </label>
                <button type="submit" className="dashboard-button-primary">
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
                      {['Name', 'Type', 'Daily salary', 'Commission %', 'Status', 'Actions'].map((h) => (
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
                        <td className="px-4 py-3 tabular-nums text-[var(--neutral-rosewood)]">{Number(staff.commission_rate_percent).toFixed(2)}%</td>
                        <td className="px-4 py-3">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              staff.is_active
                                ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                                : 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]'
                            }`}>
                              {staff.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => markStaffInactive(staff.id)}

                              className="rounded-md bg-[var(--status-warning-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--status-warning-text)]"
                            >
                              Inactive
                            </button>
                            <button
                              type="button"
                              onClick={() => endStaffEmployment(staff.id)}

                              className="rounded-md bg-[var(--status-danger-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--status-danger-text)]"
                            >
                              End
                            </button>
                            <button
                              type="button"
                              onClick={() => voidStaffRecord(staff.id)}

                              className="rounded-md bg-[var(--burgundy-50)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--burgundy-800)]"
                            >
                              Void
                            </button>
                          </div>
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
                description="Staff are present by default. Mark only day-off and absent records."
              />
              <form onSubmit={submitStaffDayOff} className={formGridClass}>
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
                  Date
                  <input name="attendance_date" type="date" defaultValue={scheduleDateFilter} required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Notes (optional)
                  <input name="notes" className="dashboard-input" />
                </label>
                <button
                  type="submit"

                  className="dashboard-button-primary"
                >
                  {createStaffDayOffMutation.isPending ? 'Saving…' : 'Mark day-off'}
                </button>
              </form>

              <SectionDivider label="Mark absent" />
              <form onSubmit={submitStaffAbsence} className={formGridClass}>
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
                  Date
                  <input name="attendance_date" type="date" defaultValue={scheduleDateFilter} required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Notes (optional)
                  <input name="notes" className="dashboard-input" />
                </label>
                <button
                  type="submit"

                  className="dashboard-button-primary"
                >
                  {createStaffAbsenceMutation.isPending ? 'Saving…' : 'Mark absent'}
                </button>
              </form>

              <SectionDivider label={`Attendance records (${scheduleDateFilter})`} />
              <div className="mb-3 w-full max-w-xs">
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Date filter
                  <input
                    type="date"
                    value={scheduleDateFilter}
                    onChange={(e) => setScheduleDateFilter(e.target.value)}
                    className="dashboard-input"
                  />
                </label>
              </div>
              {staffDayOffsQuery.isLoading || staffAbsencesQuery.isLoading ? (
                <p className="text-sm text-[var(--neutral-rosewood)]">Loading…</p>
              ) : staffDayOffEntries.length === 0 && staffAbsenceEntries.length === 0 ? (
                <EmptyState label="No day-off or absence records for the selected date." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Day-off</p>
                    <ul className="grid gap-2">
                      {staffDayOffEntries.map((dayOff) => (
                        <li
                          key={dayOff.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--neutral-linen)] px-4 py-3"
                        >
                          <div>
                            <p className="font-medium">{dayOff.staff_name ?? 'Unknown staff'}</p>
                            <p className="text-xs text-[var(--neutral-rosewood)]">{formatDateOnly(dayOff.day_off_on)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeStaffDayOff(dayOff.id)}
                            className="rounded-lg bg-[var(--burgundy-50)] px-3 py-1.5 text-xs font-semibold text-[var(--burgundy-800)]"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Absent</p>
                    <ul className="grid gap-2">
                      {staffAbsenceEntries.map((absence) => (
                        <li
                          key={absence.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--neutral-linen)] px-4 py-3"
                        >
                          <div>
                            <p className="font-medium">{absence.staff_name ?? 'Unknown staff'}</p>
                            <p className="text-xs text-[var(--neutral-rosewood)]">{formatDateOnly(absence.absent_on)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeStaffAbsence(absence.id)}
                            className="rounded-lg bg-[var(--status-danger-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--status-danger-text)]"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* COMPENSATION */}
          {tab === 'compensation' && (
            <section className={cardClass}>
              <SectionHeading
                icon={BanknoteArrowUp}
                title="Payroll"
                description="Run payroll using salary, ethereal commissions, attendance records, and cash-advance deductions."
              />
              <form onSubmit={submitCompensationRun} className={formGridClass}>
                <label className="md:col-span-2 lg:col-span-3 grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Computation mode
                  <select
                    name="computation_mode"
                    value={compensationMode}
                    onChange={(event) => setCompensationMode(event.target.value as 'today' | 'specific_date')}
                    className="dashboard-input"
                  >
                    <option value="today">Today</option>
                    <option value="specific_date">Specific date</option>
                  </select>
                </label>
                {compensationMode === 'specific_date' && (
                  <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                    Specific date
                    <input name="cutoff_date" type="date" defaultValue={formatDateOnly(new Date())} required className="dashboard-input" />
                  </label>
                )}
                <button
                  type="submit"

                  className="dashboard-button-primary"
                >
                  {createCompensationRunMutation.isPending ? 'Computing…' : 'Run payroll'}
                </button>
              </form>
              <ActionErrorPanel
                error={finalizeCompensationRunMutation.error}
                actionLabel="Finalize payout"
                fieldLabels={moneyReauthFieldLabels}
                className="mt-4"
              />

              <SectionDivider label="Payroll runs" />
              {compensationRunsQuery.isLoading ? (
                <p className="text-sm text-[var(--neutral-rosewood)]">Loading…</p>
              ) : compensationRuns.length === 0 ? (
                <EmptyState label="No payroll runs yet." />
              ) : (
                <ul className="grid gap-3">
                  {compensationRuns.map((run) => (
                    <li key={run.id} className="rounded-xl border border-[var(--neutral-linen)] px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {run.computation_mode === 'today' ? 'Today' : 'Specific date'} ·{' '}
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

                          className="mt-2 rounded-lg bg-[var(--burgundy-600)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--burgundy-800)]"
                        >
                          {finalizeCompensationRunMutation.isPending ? 'Finalizing…' : 'Finalize payout'}
                        </button>
                      )}
                      {run.payment_history.length > 0 && (
                        <p className="mt-1 text-xs text-[var(--neutral-rosewood)]">
                          Payment events: {run.payment_history.length} · Last settled deductions:{' '}
                          {run.payment_history[run.payment_history.length - 1]?.settled_deductions.length ?? 0} · Business deduction:{' '}
                          {(run.payment_history[run.payment_history.length - 1]?.business_deduction ?? run.payment_history[run.payment_history.length - 1]?.portfolio_deduction)
                            ? formatCurrency(parseAmount((run.payment_history[run.payment_history.length - 1]?.business_deduction ?? run.payment_history[run.payment_history.length - 1]?.portfolio_deduction)?.amount))
                            : 'N/A'}
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
                <label className="md:col-span-2 lg:col-span-3 grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Item type
                  <select name="item_type" defaultValue="product" className="dashboard-input">
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Item name
                  <input name="name" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Base price
                  <input name="price" type="number" list="quick-number-values" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Description (optional)
                  <input name="description" className="dashboard-input" />
                </label>
                <button type="submit" className="dashboard-button-primary">
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
                      {editingReferenceItemId === item.id ? (
                        <div className="grid w-full gap-3 md:grid-cols-2 lg:grid-cols-4">
                          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                            Type
                            <select
                              value={editingReferenceItemForm.item_type}
                              onChange={(e) =>
                                setEditingReferenceItemForm((prev) => ({
                                  ...prev,
                                  item_type: e.target.value as 'product' | 'service',
                                }))
                              }
                              className="dashboard-input"
                            >
                              <option value="product">Product</option>
                              <option value="service">Service</option>
                            </select>
                          </label>
                          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                            Name
                            <input
                              value={editingReferenceItemForm.name}
                              onChange={(e) => setEditingReferenceItemForm((prev) => ({ ...prev, name: e.target.value }))}
                              className="dashboard-input"
                            />
                          </label>
                          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                            Price
                            <input
                              type="number"
                              value={editingReferenceItemForm.price}
                              onChange={(e) => setEditingReferenceItemForm((prev) => ({ ...prev, price: toNonNegativeInputValue(e.target.value) }))}
                              className="dashboard-input"
                            />
                          </label>
                          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                            Description
                            <input
                              value={editingReferenceItemForm.description}
                              onChange={(e) => setEditingReferenceItemForm((prev) => ({ ...prev, description: e.target.value }))}
                              className="dashboard-input"
                            />
                          </label>
                          <div className="md:col-span-2 lg:col-span-4 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => void saveReferenceItemEdit()}

                              className="dashboard-button-primary"
                            >
                              {updateReferenceItemMutation.isPending ? 'Saving…' : 'Save'}
                            </button>
                            <button type="button" onClick={cancelReferenceItemEdit} className="dashboard-button-secondary">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
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
                          <div className="flex items-center gap-3">
                            <span className="tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(item.price))}</span>
                            <button
                              type="button"
                              onClick={() => beginReferenceItemEdit(item.id)}
                              className="rounded-md bg-[var(--burgundy-50)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--burgundy-800)]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeReferenceItem(item.id)}

                              className="rounded-md border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--status-danger-text)]"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* EXPENSES */}
          {tab === 'expenses' && (
            <section className={cardClass}>
              <SectionHeading icon={ReceiptText} title="Expenses" description="Track business expenses with optional proof images." />
              <form onSubmit={submitExpense} className={formGridClass}>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Date issued
                  <input name="date_issued" type="datetime-local" max={dateInputMax} min={dateInputMin} defaultValue={dateInputMax} required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Amount
                  <input name="amount" type="number" list="quick-number-values" required className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Description
                  <input name="description" required className="dashboard-input" />
                </label>
                <label className="md:col-span-2 lg:col-span-3 grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Purpose
                  <select name="purpose" defaultValue="business" className="dashboard-input">
                    <option value="business">business</option>
                    <option value="business_portfolio">business portfolio</option>
                    <option value="service">service</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Recurrence reference
                  <input name="recurrence_reference" className="dashboard-input" placeholder="Optional recurring batch reference" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Proof image (optional)
                  <input name="proof" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="dashboard-input" />
                </label>
                <button type="submit" className="dashboard-button-primary">
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
                      <div className="flex items-center gap-2">
                        {expense.proof_download_url ? (
                          <a
                            href={expense.proof_download_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-[var(--status-info-border)] bg-[var(--status-info-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--status-info-text)]"
                          >
                            View proof
                          </a>
                        ) : null}
                        <span className="tabular-nums font-semibold text-[var(--status-danger-text)]">
                          {formatCurrency(parseAmount(expense.amount))}
                        </span>
                      </div>
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
                  Copy from reference item (optional)
                  <select
                    value={gcashReferenceItemId}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      const selectedItem = selectedId ? referenceItemById.get(selectedId) : undefined
                      setGcashReferenceItemId(selectedId)
                      if (selectedItem) {
                        const copiedSalesAmount = toNonNegativeInputValue(String(parseAmount(selectedItem.price)))
                        setGcashRecipient(selectedItem.name)
                        setGcashSalesAmount(copiedSalesAmount)
                        if (!gcashIsDebt) {
                          setGcashChargedAmount(copiedSalesAmount)
                        }
                      }
                    }}
                    className="dashboard-input"
                  >
                    <option value="">Manual entry</option>
                    {referenceItems.map((item) => (
                      <option key={item.id} value={String(item.id)}>
                        {item.name} · {formatCurrency(parseAmount(item.price))}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Transaction recipient (optional)
                  <input
                    name="transaction_recipient"
                    value={gcashRecipient}
                    onChange={(e) => setGcashRecipient(e.target.value)}
                    className="dashboard-input"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Moved cash
                  <input name="amount_moved" type="number" list="quick-number-values" required value={gcashAmountMoved} onChange={(e) => setGcashAmountMoved(toNonNegativeInputValue(e.target.value))} className="dashboard-input" />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Sales amount
                  <input
                    name="sales_amount"
                    type="number"
                    list="quick-number-values"
                    required
                    value={gcashSalesAmount}
                    onChange={(e) => handleGcashSalesAmountChange(e.target.value)}
                    className="dashboard-input"
                  />
                </label>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className={optionPillClass}>
                    <input
                      type="checkbox"
                      checked={gcashIsDebt}
                      onChange={(e) => handleGcashDebtToggle(e.target.checked)}
                      className="sr-only"
                    />
                    Mark as debt
                  </label>
                </div>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Charged amount
                  <input
                    type="number"
                    list="quick-number-values"
                    value={gcashChargedAmount}
                    required={!gcashIsDebt}
                    onChange={(e) => setGcashChargedAmount(toNonNegativeInputValue(e.target.value))}
                    className="dashboard-input"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)] md:col-span-2 lg:col-span-2">
                  Remarks
                  <input
                    value={gcashRemarks}
                    required={gcashIsDebt}
                    onChange={(e) => setGcashRemarks(e.target.value)}
                    className="dashboard-input"
                  />
                </label>
                <label className="md:col-span-2 lg:col-span-3 grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Transaction type
                  <select name="transaction_type" defaultValue="cash_in" className="dashboard-input">
                    <option value="cash_in">cash in</option>
                    <option value="cash_out">cash out</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Transaction date
                  <input name="transaction_date" type="datetime-local" max={dateInputMax} defaultValue={dateInputMax} required className="dashboard-input" />
                </label>
                <button type="submit" className="dashboard-button-primary">
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
                        <p className="font-medium">
                          {sale.transaction_recipient ?? 'No recipient'}
                          {sale.is_debt && (
                            <span className="ml-2 inline-block rounded-full bg-[var(--status-warning-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--status-warning-text)]">
                              Debt
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[var(--neutral-rosewood)]">
                          {formatDateTimeDisplay(sale.transaction_date)} · {formatRelative(sale.transaction_date)}
                        </p>
                        {sale.remarks && <p className="text-xs text-[var(--neutral-rosewood)]">Remarks: {sale.remarks}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums font-semibold text-[var(--accent-gold)]">
                          {formatCurrency(parseAmount(sale.charged_amount ?? sale.sales_amount))}
                        </span>
                        <button
                          type="button"
                          onClick={() => voidGcashSale(sale.id)}

                          className="rounded-md bg-[var(--burgundy-50)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--burgundy-800)]"
                        >
                          Void
                        </button>
                      </div>
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
                        Copy from reference item (optional)
                        <select
                          value={item.selectedReferenceItemId}
                          onChange={(e) =>
                            setCoffeeItems((prev) =>
                              prev.map((entry, entryIndex) => {
                                if (entryIndex !== index) return entry
                                const selectedId = e.target.value
                                const selectedItem = selectedId ? referenceItemById.get(selectedId) : undefined

                                if (!selectedItem) {
                                  return { ...entry, selectedReferenceItemId: selectedId }
                                }

                                return {
                                  ...entry,
                                  selectedReferenceItemId: selectedId,
                                  coffee_type: selectedItem.name,
                                  price: String(parseAmount(selectedItem.price)),
                                }
                              }),
                            )
                          }
                          className="dashboard-input"
                        >
                          <option value="">Manual entry</option>
                          {productReferenceItems.map((referenceItem) => (
                            <option key={referenceItem.id} value={String(referenceItem.id)}>
                              {referenceItem.name} · {formatCurrency(parseAmount(referenceItem.price))}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Price
                        <input type="number" list="quick-number-values" required value={item.price} onChange={(e) => setCoffeeItems((prev) => prev.map((en, ei) => ei === index ? { ...en, price: toNonNegativeInputValue(e.target.value) } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Coffee type
                        <input list="coffee-reference-items" required value={item.coffee_type} onChange={(e) => setCoffeeItems((prev) => prev.map((en, ei) => ei === index ? { ...en, coffee_type: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 md:col-span-2 lg:col-span-3 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Size
                        <select
                          value={item.size}
                          onChange={(event) =>
                            setCoffeeItems((prev) => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, size: event.target.value as CoffeeDraftItem['size'] } : entry))
                          }
                          className="dashboard-input"
                        >
                          {(['8oz', '9oz', '12oz', '16oz', '18oz'] as const).map((size) => (
                            <option key={`${size}-${index}`} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Add-on price
                        <input type="number" list="quick-number-values" required value={item.add_on_price} onChange={(e) => setCoffeeItems((prev) => prev.map((en, ei) => ei === index ? { ...en, add_on_price: toNonNegativeInputValue(e.target.value) } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Add-on description
                        <input value={item.add_on_description} onChange={(e) => setCoffeeItems((prev) => prev.map((en, ei) => ei === index ? { ...en, add_on_description: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className={optionPillClass}>
                          <input
                            type="checkbox"
                            checked={item.is_debt}
                            onChange={(e) =>
                              setCoffeeItems((prev) =>
                                prev.map((en, ei) => ei === index ? { ...en, is_debt: e.target.checked } : en),
                              )
                            }
                            className="sr-only"
                          />
                          Mark as debt
                        </label>
                      </div>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Charged amount
                        <input
                          type="number"
                          list="quick-number-values"
                          value={item.charged_amount}
                          required={!item.is_debt}
                          onChange={(e) =>
                            setCoffeeItems((prev) =>
                              prev.map((en, ei) => ei === index ? { ...en, charged_amount: toNonNegativeInputValue(e.target.value) } : en),
                            )
                          }
                          className="dashboard-input"
                        />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)] md:col-span-2 lg:col-span-2">
                        Remarks
                        <input
                          value={item.remarks}
                          required={item.is_debt}
                          onChange={(e) =>
                            setCoffeeItems((prev) =>
                              prev.map((en, ei) => ei === index ? { ...en, remarks: e.target.value } : en),
                            )
                          }
                          className="dashboard-input"
                        />
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
                <button type="submit" className="dashboard-button-primary">
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
                        <p className="font-medium">
                          {sale.coffee_type} <span className="text-xs text-[var(--neutral-rosewood)]">· {sale.size}</span>
                          {sale.is_debt && (
                            <span className="ml-2 inline-block rounded-full bg-[var(--status-warning-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--status-warning-text)]">
                              Debt
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[var(--neutral-rosewood)]">{formatDateTimeDisplay(sale.sale_date)} · {formatRelative(sale.sale_date)}</p>
                        {sale.remarks && <p className="text-xs text-[var(--neutral-rosewood)]">Remarks: {sale.remarks}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums font-semibold text-[var(--accent-gold)]">
                          {formatCurrency(parseAmount(sale.charged_amount ?? sale.total_amount))}
                        </span>
                        <button
                          type="button"
                          onClick={() => voidCoffeeSale(sale.id)}

                          className="rounded-md bg-[var(--burgundy-50)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--burgundy-800)]"
                        >
                          Void
                        </button>
                      </div>
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
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Copy from reference item (optional)</p>
                        <select
                          value={item.selectedReferenceItemId}
                          onChange={(e) =>
                            setPrintItems((prev) =>
                              prev.map((entry, entryIndex) => {
                                if (entryIndex !== index) return entry
                                const selectedId = e.target.value
                                const selectedItem = selectedId ? referenceItemById.get(selectedId) : undefined

                                if (!selectedItem) {
                                  return { ...entry, selectedReferenceItemId: selectedId }
                                }

                                return {
                                  ...entry,
                                  selectedReferenceItemId: selectedId,
                                  description: selectedItem.name,
                                  sales_amount: String(parseAmount(selectedItem.price)),
                                }
                              }),
                            )
                          }
                          className="dashboard-input"
                        >
                          <option value="">Manual entry</option>
                          {productReferenceItems.map((referenceItem) => (
                            <option key={referenceItem.id} value={String(referenceItem.id)}>
                              {referenceItem.name} · {formatCurrency(parseAmount(referenceItem.price))}
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="grid gap-1.5 md:col-span-2 lg:col-span-3 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Job type
                        <select
                          value={item.job_type}
                          onChange={(event) =>
                            setPrintItems((prev) => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, job_type: event.target.value } : entry))
                          }
                          className="dashboard-input"
                        >
                          {(['xerox', 'document', 'other'] as const).map((jobType) => (
                            <option key={`${jobType}-${index}`} value={jobType}>
                              {jobType}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Description
                        <input list="print-reference-items" required value={item.description} onChange={(e) => setPrintItems((prev) => prev.map((en, ei) => ei === index ? { ...en, description: e.target.value } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Color mode
                        <select
                          value={item.color_mode}
                          onChange={(event) =>
                            setPrintItems((prev) => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, color_mode: event.target.value as PrintDraftItem['color_mode'] } : entry))
                          }
                          className="dashboard-input"
                        >
                          <option value="black">black</option>
                          <option value="white">white</option>
                        </select>
                      </label>
                      <label className="grid gap-1.5 md:col-span-2 lg:col-span-3 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Print size
                        <select
                          value={item.print_size}
                          onChange={(event) =>
                            setPrintItems((prev) => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, print_size: event.target.value } : entry))
                          }
                          className="dashboard-input"
                        >
                          {(['short', 'long', 'a4', 'legal'] as const).map((printSize) => (
                            <option key={`${printSize}-${index}`} value={printSize}>
                              {printSize}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Paper count
                        <input type="number" list="quick-number-values" required value={item.paper_count} onChange={(e) => setPrintItems((prev) => prev.map((en, ei) => ei === index ? { ...en, paper_count: toNonNegativeInputValue(e.target.value) } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Sales amount
                        <input type="number" list="quick-number-values" required value={item.sales_amount} onChange={(e) => setPrintItems((prev) => prev.map((en, ei) => ei === index ? { ...en, sales_amount: toNonNegativeInputValue(e.target.value) } : en))} className="dashboard-input" />
                      </label>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className={optionPillClass}>
                          <input
                            type="checkbox"
                            checked={item.is_debt}
                            onChange={(e) =>
                              setPrintItems((prev) =>
                                prev.map((en, ei) => ei === index ? { ...en, is_debt: e.target.checked } : en),
                              )
                            }
                            className="sr-only"
                          />
                          Mark as debt
                        </label>
                      </div>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Charged amount
                        <input
                          type="number"
                          list="quick-number-values"
                          value={item.charged_amount}
                          required={!item.is_debt}
                          onChange={(e) =>
                            setPrintItems((prev) =>
                              prev.map((en, ei) => ei === index ? { ...en, charged_amount: toNonNegativeInputValue(e.target.value) } : en),
                            )
                          }
                          className="dashboard-input"
                        />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)] md:col-span-2 lg:col-span-2">
                        Remarks
                        <input
                          value={item.remarks}
                          required={item.is_debt}
                          onChange={(e) =>
                            setPrintItems((prev) =>
                              prev.map((en, ei) => ei === index ? { ...en, remarks: e.target.value } : en),
                            )
                          }
                          className="dashboard-input"
                        />
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
                <button type="submit" className="dashboard-button-primary">
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
                        <p className="font-medium">
                          {sale.job_type} <span className="text-xs text-[var(--neutral-rosewood)]">· {sale.color_mode} · {sale.print_size} · {sale.paper_count}pg</span>
                          {sale.is_debt && (
                            <span className="ml-2 inline-block rounded-full bg-[var(--status-warning-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--status-warning-text)]">
                              Debt
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[var(--neutral-rosewood)]">{formatDateTimeDisplay(sale.sale_date)} · {formatRelative(sale.sale_date)}</p>
                        {sale.remarks && <p className="text-xs text-[var(--neutral-rosewood)]">Remarks: {sale.remarks}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(sale.charged_amount ?? sale.sales_amount))}</span>
                        <button
                          type="button"
                          onClick={() => voidPrintSale(sale.id)}

                          className="rounded-md bg-[var(--burgundy-50)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--burgundy-800)]"
                        >
                          Void
                        </button>
                      </div>
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
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">Copy from reference item (optional)</p>
                        <select
                          value={item.selectedReferenceItemId}
                          onChange={(e) =>
                            setEtherealItems((prev) =>
                              prev.map((entry, entryIndex) => {
                                if (entryIndex !== index) return entry
                                const selectedId = e.target.value
                                const selectedItem = selectedId ? referenceItemById.get(selectedId) : undefined

                                if (!selectedItem) {
                                  return { ...entry, selectedReferenceItemId: selectedId }
                                }

                                return {
                                  ...entry,
                                  selectedReferenceItemId: selectedId,
                                  service_name: selectedItem.name,
                                  service_cost: String(parseAmount(selectedItem.price)),
                                }
                              }),
                            )
                          }
                          className="dashboard-input"
                        >
                          <option value="">Manual entry</option>
                          {serviceReferenceItems.map((referenceItem) => (
                            <option key={referenceItem.id} value={String(referenceItem.id)}>
                              {referenceItem.name} · {formatCurrency(parseAmount(referenceItem.price))}
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Service name
                        <input
                          value={item.service_name}
                          onChange={(e) => setEtherealItems((prev) => prev.map((en, ei) => ei === index ? { ...en, service_name: e.target.value } : en))}
                          className="dashboard-input"
                        />
                      </label>
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
                        <input type="number" list="quick-number-values" required value={item.service_cost} onChange={(e) => setEtherealItems((prev) => prev.map((en, ei) => ei === index ? { ...en, service_cost: toNonNegativeInputValue(e.target.value) } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Discount %
                        <input type="number" list="quick-number-values" required value={item.discount_percentage} onChange={(e) => setEtherealItems((prev) => prev.map((en, ei) => ei === index ? { ...en, discount_percentage: toNonNegativeInputValue(e.target.value) } : en))} className="dashboard-input" />
                      </label>
                      <label className="grid gap-1.5 md:col-span-2 lg:col-span-3 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Discount type
                        <select
                          value={item.discount_type}
                          onChange={(event) =>
                            setEtherealItems((prev) => prev.map((entry, entryIndex) => entryIndex === index ? { ...entry, discount_type: event.target.value } : entry))
                          }
                          className="dashboard-input"
                        >
                          {(['family/friends/church-mem', 'promo', 'new-customer'] as const).map((discountType) => (
                            <option key={`${discountType}-${index}`} value={discountType}>
                              {discountType}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className={optionPillClass}>
                          <input
                            type="checkbox"
                            checked={item.is_debt}
                            onChange={(e) =>
                              setEtherealItems((prev) =>
                                prev.map((en, ei) => ei === index ? { ...en, is_debt: e.target.checked } : en),
                              )
                            }
                            className="sr-only"
                          />
                          Mark as debt
                        </label>
                      </div>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                        Charged amount
                        <input
                          type="number"
                          list="quick-number-values"
                          value={item.charged_amount}
                          required={!item.is_debt}
                          onChange={(e) =>
                            setEtherealItems((prev) =>
                              prev.map((en, ei) => ei === index ? { ...en, charged_amount: toNonNegativeInputValue(e.target.value) } : en),
                            )
                          }
                          className="dashboard-input"
                        />
                      </label>
                      <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)] md:col-span-2 lg:col-span-2">
                        Remarks
                        <input
                          value={item.remarks}
                          required={item.is_debt}
                          onChange={(e) =>
                            setEtherealItems((prev) =>
                              prev.map((en, ei) => ei === index ? { ...en, remarks: e.target.value } : en),
                            )
                          }
                          className="dashboard-input"
                        />
                      </label>
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
                <button type="submit" className="dashboard-button-primary">
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
                        <p className="font-medium">
                          {sale.service_name ?? 'Service'} · net amount
                          {sale.is_debt && (
                            <span className="ml-2 inline-block rounded-full bg-[var(--status-warning-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--status-warning-text)]">
                              Debt
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[var(--neutral-rosewood)]">{formatDateTimeDisplay(sale.service_date)} · {formatRelative(sale.service_date)}</p>
                        {sale.remarks && <p className="text-xs text-[var(--neutral-rosewood)]">Remarks: {sale.remarks}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(sale.charged_amount ?? sale.net_amount))}</span>
                        <button
                          type="button"
                          onClick={() => voidEtherealSale(sale.id)}

                          className="rounded-md bg-[var(--burgundy-50)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--burgundy-800)]"
                        >
                          Void
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* SALES REPORTS */}
          {tab === 'salesReports' && (
            <section className={cardClass}>
              <SectionHeading icon={FileText} title="Quick Report" description="On-screen sales snapshot by scope and period (no document export)." />
              <form onSubmit={submitSalesReport} className={formGridClass}>
                <label className="md:col-span-2 lg:col-span-3 grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Scope
                  <select
                    name="scope"
                    value={reportScope}
                    onChange={(event) => setReportScope(event.target.value as 'portfolio' | 'business')}
                    className="dashboard-input"
                  >
                    <option value="portfolio">Portfolio</option>
                    <option value="business">Specific business</option>
                  </select>
                </label>
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
                <label className="md:col-span-2 lg:col-span-3 grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Period
                  <select
                    name="period"
                    value={reportPeriod}
                    onChange={(event) => setReportPeriod(event.target.value as 'today' | 'date_range')}
                    className="dashboard-input"
                  >
                    <option value="today">Today</option>
                    <option value="date_range">Date range</option>
                  </select>
                </label>
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
                <button type="submit" className="dashboard-button-primary">
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
                  <input name="amount" type="number" list="quick-number-values" required value={portfolioAmountPreview} onChange={(e) => setPortfolioAmountPreview(toNonNegativeInputValue(e.target.value))} className="dashboard-input" />
                  <FieldErrorText messages={portfolioMovementFieldErrors.amount} />
                </label>
                <label className="md:col-span-2 lg:col-span-3 grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Direction
                  <select
                    name="direction"
                    value={portfolioDirectionPreview}
                    onChange={(event) => setPortfolioDirectionPreview(event.target.value as 'add' | 'deduct' | 'transfer' | 'debt')}
                    className="dashboard-input"
                  >
                    <option value="add">Add</option>
                    <option value="deduct">Deduct</option>
                    <option value="transfer">Transfer to business</option>
                    <option value="debt">Debt</option>
                  </select>
                  <FieldErrorText messages={portfolioMovementFieldErrors.direction} />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Transfer target
                  <select name="target_business_id" defaultValue="" className="dashboard-input">
                    <option value="">Select business (required for transfer)</option>
                    {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <FieldErrorText messages={portfolioMovementFieldErrors.target_business_id} />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Date
                  <input name="occurred_on" type="date" required className="dashboard-input" />
                  <FieldErrorText messages={portfolioMovementFieldErrors.occurred_on} />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Notes {portfolioDirectionPreview === 'transfer' || portfolioDirectionPreview === 'debt' ? '(optional)' : '(required)'}
                  <input
                    name="notes"
                    value={portfolioNotes}
                    required={portfolioDirectionPreview === 'add' || portfolioDirectionPreview === 'deduct'}
                    onChange={(e) => setPortfolioNotes(e.target.value)}
                    className="dashboard-input"
                  />
                  <FieldErrorText messages={portfolioMovementFieldErrors.notes} />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Debt remarks {portfolioDirectionPreview === 'debt' ? '(required)' : '(optional)'}
                  <input
                    name="remarks"
                    value={portfolioRemarks}
                    required={portfolioDirectionPreview === 'debt'}
                    onChange={(e) => setPortfolioRemarks(e.target.value)}
                    className="dashboard-input"
                  />
                  <FieldErrorText messages={portfolioMovementFieldErrors.remarks} />
                </label>
                <button type="submit" className="dashboard-button-primary">
                  {createPortfolioCapitalMutation.isPending ? 'Processing…' : 'Save portfolio movement'}
                </button>
              </form>
              <ActionErrorPanel
                error={createPortfolioCapitalMutation.error}
                actionLabel="Save portfolio movement"
                fieldLabels={portfolioMovementFieldLabels}
                className="mt-4"
              />
              <LivePreview>
                After action: <strong className="font-semibold">{formatCurrency(portfolioAfterPreview)}</strong>
                {' '}(current {formatCurrency(capitalBalances.portfolioBalance)} {portfolioDirectionPreview === 'add' ? '+' : '−'} {formatCurrency(parseAmount(portfolioAmountPreview))})
              </LivePreview>
              <ActionErrorPanel
                error={settlePortfolioDebtMutation.error}
                actionLabel="Settle portfolio debt"
                fieldLabels={moneyReauthFieldLabels}
                className="mt-4"
              />

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
                            : movement.direction === 'debt'
                              ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]'
                              : 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]'
                        }`}>
                          {movement.direction}
                        </span>
                        <p className="text-xs text-[var(--neutral-rosewood)]">{formatCompactDate(movement.occurred_on)}</p>
                        {movement.notes && <p className="text-xs text-[var(--neutral-rosewood)]">Notes: {movement.notes}</p>}
                        {movement.remarks && <p className="text-xs text-[var(--neutral-rosewood)]">Remarks: {movement.remarks}</p>}
                        {movement.direction === 'debt' && (
                          <p className="text-xs text-[var(--neutral-rosewood)]">
                            Status: {movement.debt_status ?? 'outstanding'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-semibold text-[var(--accent-gold)]">{formatCurrency(parseAmount(movement.amount))}</span>
                        {movement.direction === 'debt' && movement.debt_status === 'outstanding' && (
                          <button
                            type="button"
                            onClick={() => settleDebtMovement(movement.id)}

                            className="dashboard-button-secondary"
                          >
                            {settlePortfolioDebtMutation.isPending ? 'Settling…' : 'Settle'}
                          </button>
                        )}
                      </div>
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
                  <input name="amount" type="number" list="quick-number-values" required value={businessAmountPreview} onChange={(e) => setBusinessAmountPreview(toNonNegativeInputValue(e.target.value))} className="dashboard-input" />
                  <FieldErrorText messages={businessMovementFieldErrors.amount} />
                </label>
                <label className="md:col-span-2 lg:col-span-3 grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Direction
                  <select
                    name="direction"
                    value={businessDirectionPreview}
                    onChange={(event) => setBusinessDirectionPreview(event.target.value as 'add' | 'deduct')}
                    className="dashboard-input"
                  >
                    <option value="add">Add from portfolio</option>
                    <option value="deduct">Deduct to portfolio</option>
                  </select>
                  <FieldErrorText messages={businessMovementFieldErrors.direction} />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Date
                  <input name="occurred_on" type="date" required className="dashboard-input" />
                  <FieldErrorText messages={businessMovementFieldErrors.occurred_on} />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                  Notes
                  <input name="notes" className="dashboard-input" />
                  <FieldErrorText messages={businessMovementFieldErrors.notes} />
                </label>
                <button type="submit" className="dashboard-button-primary">
                  {createBusinessCapitalMutation.isPending ? 'Processing…' : 'Save business movement'}
                </button>
              </form>
              <ActionErrorPanel
                error={createBusinessCapitalMutation.error}
                actionLabel="Save business movement"
                fieldLabels={businessMovementFieldLabels}
                className="mt-4"
              />
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
                title="Detail Reports"
                description="Generate versioned PDF 8.5x13 detail reports with optional checkbox-based content sections."
              />
              <>
                <form onSubmit={submitPdfSalesReport} className={formGridClass}>
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
                  <div className="md:col-span-2 lg:col-span-3 grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                      Optional contents
                    </span>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {reportIncludeSectionOptions.map((option) => (
                        <label key={`pdf-section-${option.value}`} className={optionPillClass}>
                          <input
                            name="include_sections"
                            value={option.value}
                            type="checkbox"
                            defaultChecked
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                    <p className="text-[11px] text-[var(--neutral-rosewood)]">
                      Report type is auto-computed from selected sections.
                    </p>
                  </div>
                  <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                    Report scope
                    <select
                      name="report_scope"
                      value={pdfReportScope}
                      onChange={(event) => setPdfReportScope(event.target.value as 'business' | 'all_businesses')}
                      className="dashboard-input"
                    >
                      <option value="all_businesses">All businesses (default)</option>
                      <option value="business">Specific business</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--neutral-rosewood)]">
                    Business
                    <select
                      name="business_id"
                      value={pdfBusinessId ?? ''}
                      onChange={(event) => setPdfBusinessId(event.target.value ? Number(event.target.value) : null)}
                      className="dashboard-input"
                    >
                      <option value="">Select business</option>
                      {businesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"

                    className="dashboard-button-primary"
                  >
                    {createSalesReportMutation.isPending ? 'Generating…' : 'Generate report version'}
                  </button>
                </form>

                <SectionDivider label="Generated versions" />
                {(pdfReportScope === 'all_businesses' ? portfolioSalesReportsQuery : salesReportsQuery).isLoading ? (
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
                            onClick={() => triggerDownloadSalesReport(report)}

                            className="dashboard-button-secondary"
                          >
                            Download PDF
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full border border-[var(--neutral-linen)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-semibold text-[var(--neutral-espresso)]">
                            Range {formatCompactDate(report.start_date)} – {formatCompactDate(report.end_date)}
                          </span>
                          <span className="inline-flex rounded-full border border-[var(--neutral-linen)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-semibold text-[var(--neutral-espresso)]">
                            Business: {report.metadata.business_name ?? 'N/A'}
                          </span>
                          <span className="inline-flex rounded-full border border-[var(--neutral-linen)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-semibold text-[var(--neutral-espresso)]">
                            Scope: {(report.metadata.report_scope ?? report.details.report_scope ?? 'business').replace('_', ' ')}
                          </span>
                          <span className="inline-flex rounded-full border border-[var(--neutral-linen)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-semibold text-[var(--neutral-espresso)]">
                            Type: {report.report_type}
                          </span>
                          <span className="inline-flex rounded-full border border-[var(--neutral-linen)] bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] font-semibold text-[var(--neutral-espresso)]">
                            {formatDateTimeDisplay(report.metadata.generated_at)} · {report.metadata.page_size}
                          </span>
                          {report.report_type !== 'compensation' && (
                            <span className="inline-flex rounded-full border border-[var(--status-info-border)] bg-[var(--status-info-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--status-info-text)]">
                              Overall sales: {formatCurrency(parseAmount(report.details.totals.overall_sales))}
                            </span>
                          )}
                          {report.report_type !== 'sales' && (
                            <span className="inline-flex rounded-full border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--status-success-text)]">
                              Net pay: {formatCurrency(parseAmount(report.details.compensation_totals?.net_pay ?? 0))}
                            </span>
                          )}
                          {(report.details.include_sections ?? []).map((section) => (
                            <span
                              key={`report-section-pill-${report.id}-${section}`}
                              className="inline-flex rounded-full border border-[var(--neutral-linen)] bg-[var(--burgundy-50)] px-2.5 py-1 text-[11px] font-semibold text-[var(--burgundy-800)]"
                            >
                              {section.replaceAll('_', ' ')}
                            </span>
                          ))}
                          {report.pdf_verification && (
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                              report.pdf_verification.status === 'verified'
                                ? 'border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                                : report.pdf_verification.status === 'missing_file'
                                  ? 'border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]'
                                  : 'border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]'
                            }`}>
                              PDF verification: {report.pdf_verification.status.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (salesReportPage <= 1) {
                            showActionGuidance('You are already on the first page.')
                            return
                          }
                          setSalesReportPage((prev) => Math.max(prev - 1, 1))
                        }}
                        className="dashboard-button-secondary"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-[var(--neutral-rosewood)]">Page {salesReportPage}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const hasNextPage = Boolean(
                            pdfReportScope === 'all_businesses'
                              ? portfolioSalesReportsQuery.data?.links?.next
                              : salesReportsQuery.data?.links?.next,
                          )
                          if (!hasNextPage) {
                            showActionGuidance('No additional report pages are available.')
                            return
                          }
                          setSalesReportPage((prev) => prev + 1)
                        }}
                        className="dashboard-button-secondary"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>

              {/*{meQuery.data.role !== 'admin' && meQuery.data.role !== 'owner' ? (*/}
              {/*  <div className="mt-5 rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-4 py-3 text-sm text-[var(--status-warning-text)]">*/}
              {/*    Only admin and owner can view and download exported report files.*/}
              {/*  </div>*/}
              {/*) : (*/}
              {/*)}*/}
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
