import { useMemo, useState, type FormEvent } from 'react'
import { useLogin, useLogout, useMe } from './hooks/use-auth'
import { useBusinesses, useCreateBusiness } from './hooks/use-businesses'
import { useCreateExpense, useExpenses } from './hooks/use-expenses'
import { useCreateGcashSale, useGcashSales } from './hooks/use-gcash-sales'
import './App.css'

type Tab = 'businesses' | 'expenses' | 'gcash'

function App() {
  const [tab, setTab] = useState<Tab>('businesses')
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null)

  const meQuery = useMe()
  const loginMutation = useLogin()
  const logoutMutation = useLogout()

  const businessesQuery = useBusinesses()
  const createBusinessMutation = useCreateBusiness()
  const expensesQuery = useExpenses(selectedBusinessId)
  const createExpenseMutation = useCreateExpense(selectedBusinessId)
  const gcashQuery = useGcashSales(selectedBusinessId)
  const createGcashMutation = useCreateGcashSale(selectedBusinessId)

  const businesses = useMemo(() => businessesQuery.data?.data ?? [], [businessesQuery.data])

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    await loginMutation.mutateAsync({
      username: String(form.get('username') ?? ''),
      password: String(form.get('password') ?? ''),
    })
  }

  const submitBusiness = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    await createBusinessMutation.mutateAsync({
      name: String(form.get('name') ?? ''),
      slug: String(form.get('slug') ?? ''),
      description: String(form.get('description') ?? ''),
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
        <button type="button" className={tab === 'expenses' ? 'active' : ''} onClick={() => setTab('expenses')}>
          Expenses
        </button>
        <button type="button" className={tab === 'gcash' ? 'active' : ''} onClick={() => setTab('gcash')}>
          GCash
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
          <form onSubmit={submitBusiness} className="form-grid">
            <input name="name" placeholder="Business name" required />
            <input name="slug" placeholder="Slug (e.g. coffee)" required />
            <input name="description" placeholder="Description (optional)" />
            <button type="submit" disabled={createBusinessMutation.isPending}>
              Add business
            </button>
          </form>
          <ul>
            {businesses.map((business) => (
              <li key={business.id}>
                {business.name} <small>({business.slug})</small>
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
            <input name="amount_moved" type="number" step="0.01" placeholder="Amount moved" required />
            <input name="sales_amount" type="number" step="0.01" placeholder="Sales amount" required />
            <input name="profit_amount" type="number" step="0.01" placeholder="Profit amount" required />
            <select name="transaction_type" defaultValue="cash_in">
              <option value="cash_in">cash_in</option>
              <option value="cash_out">cash_out</option>
            </select>
            <input name="transaction_date" type="date" required />
            <button type="submit" disabled={!selectedBusinessId || createGcashMutation.isPending}>
              Add GCash sale
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
    </main>
  )
}

export default App
