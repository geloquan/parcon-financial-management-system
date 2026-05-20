import { useMemo, useState, type FormEvent } from 'react'
import { useLogin, useLogout, useMe } from './hooks/use-auth'
import { useBusinesses } from './hooks/use-businesses'
import { useCreateExpense, useExpenses } from './hooks/use-expenses'
import { useCreateGcashSale, useGcashSales } from './hooks/use-gcash-sales'
import { useCreateCoffeeSale, useCoffeeSales } from './hooks/use-coffee-sales'
import { useCreatePrintSale, usePrintSales } from './hooks/use-print-sales'
import { useCreateEtherealSale, useEtherealSales } from './hooks/use-ethereal-sales'
import { useCreateStaff, useStaff } from './hooks/use-staff'
import {
  useCapitalMovements,
  useCreateBusinessCapitalMovement,
  useCreatePortfolioCapitalMovement,
} from './hooks/use-capital-movements'
import './App.css'

type Tab =
  | 'businesses'
  | 'staff'
  | 'expenses'
  | 'gcash'
  | 'coffee'
  | 'print'
  | 'ethereal'
  | 'portfolioCapital'
  | 'businessCapital'

function App() {
  const [tab, setTab] = useState<Tab>('businesses')
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null)

  const meQuery = useMe()
  const loginMutation = useLogin()
  const logoutMutation = useLogout()

  const businessesQuery = useBusinesses()
  const businesses = useMemo(() => businessesQuery.data?.data ?? [], [businessesQuery.data])

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

  const submitGcash = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedBusinessId) {
      return
    }

    const form = new FormData(event.currentTarget)

    await createGcashMutation.mutateAsync({
      transaction_recipient: String(form.get('transaction_recipient') ?? ''),
      amount_moved: Number(form.get('amount_moved') ?? 0),
      sales_amount: Number(form.get('sales_amount') ?? 0),
      profit_amount: Number(form.get('profit_amount') ?? 0),
      transaction_type: String(form.get('transaction_type') ?? 'cash_in') as 'cash_in' | 'cash_out',
      transaction_date: String(form.get('transaction_date') ?? ''),
    })

    event.currentTarget.reset()
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
      size: String(form.get('size') ?? ''),
      add_ons: String(form.get('add_ons') ?? ''),
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
      service_date: String(form.get('service_date') ?? ''),
    })

    event.currentTarget.reset()
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
      <main className="screen">
        <section className="card">
          <h1>Parcon FMS</h1>
          <p className="helper">Login with your backend user credentials.</p>
          <form onSubmit={submitLogin} className="form-grid">
            <input name="username" placeholder="Username" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>
          </form>
          {loginMutation.error ? <p className="error">{loginMutation.error.message}</p> : null}
        </section>
      </main>
    )
  }

  return (
    <main className="screen">
      <header className="card header">
        <div>
          <h1>Parcon FMS</h1>
          <p className="helper">
            {meQuery.data.name} ({meQuery.data.role})
          </p>
        </div>
        <button type="button" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
          Logout
        </button>
      </header>

      <nav className="tabs">
        <button type="button" className={tab === 'businesses' ? 'active' : ''} onClick={() => setTab('businesses')}>
          Businesses
        </button>
        <button type="button" className={tab === 'staff' ? 'active' : ''} onClick={() => setTab('staff')}>
          Staff
        </button>
        <button type="button" className={tab === 'expenses' ? 'active' : ''} onClick={() => setTab('expenses')}>
          Expenses
        </button>
        <button type="button" className={tab === 'gcash' ? 'active' : ''} onClick={() => setTab('gcash')}>
          GCash
        </button>
        <button type="button" className={tab === 'coffee' ? 'active' : ''} onClick={() => setTab('coffee')}>
          Coffee
        </button>
        <button type="button" className={tab === 'print' ? 'active' : ''} onClick={() => setTab('print')}>
          Print
        </button>
        <button type="button" className={tab === 'ethereal' ? 'active' : ''} onClick={() => setTab('ethereal')}>
          Ethereal
        </button>
        <button
          type="button"
          className={tab === 'portfolioCapital' ? 'active' : ''}
          onClick={() => setTab('portfolioCapital')}
        >
          Portfolio Money
        </button>
        <button
          type="button"
          className={tab === 'businessCapital' ? 'active' : ''}
          onClick={() => setTab('businessCapital')}
        >
          Business Money
        </button>
      </nav>

      <section className="card">
        <label htmlFor="business-id">Active business</label>
        <select
          id="business-id"
          value={selectedBusinessId ?? ''}
          onChange={(event) => setSelectedBusinessId(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="">Select business</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
      </section>

      {tab === 'businesses' ? (
        <section className="card">
          <h2>Businesses</h2>
          <p className="helper">Businesses are seeded by default and managed from the backend seeder.</p>
          <ul>
            {businesses.map((business) => (
              <li key={business.id}>
                {business.name} <small>({business.slug})</small>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'staff' ? (
        <section className="card">
          <h2>Staff</h2>
          <form onSubmit={submitStaff} className="form-grid">
            <input name="full_name" placeholder="Full name" required />
            <input name="age" type="number" min="16" placeholder="Age" required />
            <input name="employment_start_date" type="date" required />
            <input name="employment_end_date" type="date" />
            <input name="employment_type" placeholder="Employment type" required />
            <input name="salary" type="number" step="0.01" placeholder="Salary" required />
            <select name="is_active" defaultValue="1">
              <option value="1">active</option>
              <option value="0">inactive</option>
            </select>
            <button type="submit" disabled={!selectedBusinessId || createStaffMutation.isPending}>
              Add staff
            </button>
          </form>
          <ul>
            {(staffQuery.data?.data ?? []).map((staff) => (
              <li key={staff.id}>
                {staff.full_name} — {staff.employment_type} — {staff.salary}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'expenses' ? (
        <section className="card">
          <h2>Expenses</h2>
          <form onSubmit={submitExpense} className="form-grid">
            <input name="date_issued" type="date" required />
            <input name="amount" type="number" step="0.01" placeholder="Amount" required />
            <input name="description" placeholder="Description" required />
            <select name="purpose" defaultValue="business">
              <option value="business">business</option>
              <option value="business_portfolio">business_portfolio</option>
              <option value="service">service</option>
            </select>
            <select name="payment_type" defaultValue="one_time">
              <option value="one_time">one_time</option>
              <option value="repeat">repeat</option>
            </select>
            <input name="recurrence_reference" placeholder="Recurrence reference" />
            <button type="submit" disabled={!selectedBusinessId || createExpenseMutation.isPending}>
              Add expense
            </button>
          </form>
          <ul>
            {(expensesQuery.data?.data ?? []).map((expense) => (
              <li key={expense.id}>
                {expense.date_issued}: {expense.description} — {expense.amount}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'gcash' ? (
        <section className="card">
          <h2>GCash Sales</h2>
          <form onSubmit={submitGcash} className="form-grid">
            <input name="transaction_recipient" placeholder="Recipient" required />
            <input name="amount_moved" type="number" step="0.01" placeholder="Moved cash" required />
            <input name="sales_amount" type="number" step="0.01" placeholder="Sales amount" required />
            <input name="profit_amount" type="number" step="0.01" placeholder="Profit" required />
            <select name="transaction_type" defaultValue="cash_in">
              <option value="cash_in">cash_in</option>
              <option value="cash_out">cash_out</option>
            </select>
            <input name="transaction_date" type="date" required />
            <button type="submit" disabled={!selectedBusinessId || createGcashMutation.isPending}>
              Add GCash entry
            </button>
          </form>
          <ul>
            {(gcashQuery.data?.data ?? []).map((sale) => (
              <li key={sale.id}>
                {sale.transaction_date}: {sale.transaction_recipient} — {sale.sales_amount}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'coffee' ? (
        <section className="card">
          <h2>Coffee Sales</h2>
          <form onSubmit={submitCoffee} className="form-grid">
            <input name="price" type="number" step="0.01" placeholder="Price" required />
            <input name="coffee_type" placeholder="Coffee type" required />
            <input name="size" placeholder="Size" required />
            <input name="add_ons" placeholder="Add-ons" />
            <input name="sale_date" type="date" required />
            <button type="submit" disabled={!selectedBusinessId || createCoffeeMutation.isPending}>
              Add coffee sale
            </button>
          </form>
          <ul>
            {(coffeeQuery.data?.data ?? []).map((sale) => (
              <li key={sale.id}>
                {sale.sale_date}: {sale.coffee_type} ({sale.size}) — {sale.price}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'print' ? (
        <section className="card">
          <h2>Print Sales</h2>
          <form onSubmit={submitPrint} className="form-grid">
            <select name="job_type" defaultValue="xerox">
              <option value="xerox">xerox</option>
              <option value="document">document</option>
              <option value="other">other</option>
            </select>
            <input name="description" placeholder="Description" required />
            <input name="sales_amount" type="number" step="0.01" placeholder="Sales amount" required />
            <input name="sale_date" type="date" required />
            <button type="submit" disabled={!selectedBusinessId || createPrintMutation.isPending}>
              Add print sale
            </button>
          </form>
          <ul>
            {(printQuery.data?.data ?? []).map((sale) => (
              <li key={sale.id}>
                {sale.sale_date}: {sale.job_type} — {sale.sales_amount}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'ethereal' ? (
        <section className="card">
          <h2>Ethereal Sales</h2>
          <form onSubmit={submitEthereal} className="form-grid">
            <select name="staff_id" defaultValue="" required>
              <option value="" disabled>
                Select service provider
              </option>
              {(staffQuery.data?.data ?? []).map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.full_name}
                </option>
              ))}
            </select>
            <input name="service_cost" type="number" step="0.01" placeholder="Service cost" required />
            <input
              name="discount_percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Discount %"
              required
            />
            <input name="service_date" type="date" required />
            <button type="submit" disabled={!selectedBusinessId || createEtherealMutation.isPending}>
              Add ethereal sale
            </button>
          </form>
          <ul>
            {(etherealQuery.data?.data ?? []).map((sale) => (
              <li key={sale.id}>
                {sale.service_date}: cost {sale.service_cost}, discount {sale.cash_discount}, net {sale.net_amount}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'portfolioCapital' ? (
        <section className="card">
          <h2>Portfolio Money</h2>
          <form onSubmit={submitPortfolioCapital} className="form-grid">
            <input name="amount" type="number" step="0.01" placeholder="Amount" required />
            <select name="direction" defaultValue="add">
              <option value="add">add</option>
              <option value="deduct">deduct</option>
              <option value="transfer">transfer to business</option>
            </select>
            <select name="target_business_id" defaultValue="">
              <option value="">Transfer target (required for transfer)</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
            <input name="occurred_on" type="date" required />
            <input name="notes" placeholder="Notes" />
            <input name="reauth_username" placeholder="Re-auth username" required />
            <input name="reauth_password" type="password" placeholder="Re-auth password" required />
            <button type="submit" disabled={createPortfolioCapitalMutation.isPending}>
              Save portfolio movement
            </button>
          </form>
          <ul>
            {portfolioMovements.map((movement) => (
              <li key={movement.id}>
                {movement.occurred_on}: {movement.direction} — {movement.amount}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'businessCapital' ? (
        <section className="card">
          <h2>Business Money {selectedBusinessName ? `(${selectedBusinessName})` : ''}</h2>
          <form onSubmit={submitBusinessCapital} className="form-grid">
            <input name="amount" type="number" step="0.01" placeholder="Amount" required />
            <select name="direction" defaultValue="add">
              <option value="add">add from portfolio</option>
              <option value="deduct">deduct to return portfolio</option>
            </select>
            <input name="occurred_on" type="date" required />
            <input name="notes" placeholder="Notes" />
            <button type="submit" disabled={!selectedBusinessId || createBusinessCapitalMutation.isPending}>
              Save business movement
            </button>
          </form>
          <ul>
            {businessMovements.map((movement) => (
              <li key={movement.id}>
                {movement.occurred_on}: {movement.direction} — {movement.amount}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}

export default App
