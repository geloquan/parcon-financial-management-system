# Copilot Instructions — Business Portfolio Management System

## Repository Intent (Read First)

This is a monorepo for a multi-business financial management platform owned by a single portfolio entity. One portfolio owns one or more businesses. Capital flows between the portfolio and its businesses. Each business has its own sales sources, expense tracking, staff, schedules, and compensation logic.

Follow `README.md`, `app/frontend/README.md`, and `app/backend/README.md` before proposing or implementing changes. Keep all changes aligned with the active baseline APIs and the current domain model: portfolio → business → module.

---

## Monorepo Scope

- `app/frontend` — React + TypeScript + Vite UI.
- `app/backend` — Laravel 11 API + PostgreSQL domain.

Treat frontend and backend as one product surface. UI behavior and API contracts must evolve together.

---

## Domain Model Overview

```
Portfolio (parent)
 └── Business (child, many per portfolio)
      ├── Source of Sales (GCash / Coffee / Print / Ethereal)
      ├── Capital (funded from portfolio)
      ├── Expenses
      ├── Staff
      ├── Schedules & Attendance
      └── Compensation Runs
```

### Portfolio
The root entity. Owns all businesses. Has its own capital pool. Capital transfers flow from portfolio → business or business → portfolio. Accessing portfolio capital requires username and password confirmation (re-auth guard).

### Businesses
Each business operates independently under the portfolio. Current registered businesses:

| Business | Sales Source Module |
|---|---|
| Coffee shop | `Coffee` |
| Print shop | `Print` |
| Ethereal (beauty salon) | `Ethereal` |

GCash transaction logging is shared across businesses and is not yet tied to a payment gateway (manual entry only). See **Future Improvements** for planned GCash API integration.

---

## Shared Delivery Rules (Frontend + Backend)

- Always inspect existing code patterns first; do not invent new architecture.
- Prefer small, focused changes that preserve existing structure.
- Do not introduce new libraries unless explicitly requested.
- Ask clarifying questions before large or cross-cutting changes.
- Propose a short plan before implementation.
- Prefer incremental commits.
- Do not add unnecessary comments.
- Do not implement tests unless explicitly requested.

---

## Contract-First Synchronization Rules

- Any UI change that affects data shape, validation, filtering, pagination, or workflow state must trigger matching API contract updates.
- Frontend must not be constrained by current API limitations; when UX needs new fields or flows, extend the backend accordingly.
- Backend must not ship request/response formats that block intended UI interactions.
- Keep request and response contracts synchronized for every feature:
  - **FormRequest** (backend validation/input contract) must match UI form intent.
  - **JSON response** (API Resource/output contract) must match UI rendering and state needs.
- When contract changes are made, update all affected layers in the same task: route, FormRequest, service, controller, resource, and frontend service/types/components.

---

## Frontend Standards

- Use functional components only.
- Use explicit TypeScript types; avoid `any`.
- Use `async/await`; avoid promise chaining.
- Keep business logic outside UI components.
- Isolate API calls in frontend service modules.
- Naming:
  - camelCase for variables, functions, and API values consumed in frontend code.
  - PascalCase for components and classes.
  - kebab-case for file names.

---

## Backend Standards (Laravel API)

- Every backend feature must traverse impacted layers: migration (if needed) → model → FormRequest → service → controller → route → resource.
- Keep controllers thin; business logic belongs in services.
- Use FormRequest per action (`store`, `update`, etc.) with explicit `authorize()` and `rules()`.
- Return API Resources or collections — not raw models.
- Apply middleware and authorization consistently at route and policy/request levels.
- All models must use **soft deletion** (`SoftDeletes` trait + `deleted_at` column). Hard deletes are not permitted in application logic.
- Naming:
  - snake_case for API endpoints and backend payload keys.

---

## Validation and Response Coupling

For each create/update flow, align these three artifacts:

1. Frontend form model and UI validation rules.
2. Backend FormRequest rules and authorization.
3. API Resource JSON response consumed by frontend.

If frontend adds or changes a field, backend must accept/validate it in FormRequest, process it in service logic, and return it (or derived state) in the JSON response where needed by UI. If backend introduces a field or state, frontend must expose or handle it where relevant.

---

## User Roles and Access Control

Roles are enforced on the backend. Frontend-only role enforcement is not sufficient.

| Role | Scope | Access |
|---|---|---|
| `admin` | System-wide | All businesses, all modules, portfolio capital, user management |
| `owner` | System-wide | All businesses, all modules, portfolio capital |
| `{business}-staff` | Business-scoped | Only the assigned business modules (e.g. `ethereal-staff`, `coffee-staff`, `print-staff`) |

- Staff roles are prefixed with the business slug (e.g. `ethereal-staff`).
- Portfolio capital actions (add, deduct, transfer) require the `admin` or `owner` role **plus** re-authentication (username + password confirmation at the point of action).
- Route middleware and policies must enforce business-scoped access for staff roles — a `coffee-staff` user must never access Ethereal or Print data.

---

## Source of Sales Modules

Each module lives under its business context. All sales entries are soft-deletable.

### GCash (manual transaction log)
Fields: transaction recipient, amount moved, sales amount, profit from transaction, transaction type (`cash_in` / `cash_out`), date, business ID.

> GCash API integration is deferred to future improvements. Do not build any gateway coupling now.

### Coffee
Fields: price, coffee type, size, add-ons (multi-select or free text), date, business ID.

### Print
Fields: job type (`xerox` / `document` / other), description, sales amount, date, business ID.

### Ethereal (beauty salon)
Fields: service cost, discount percentage, computed cash discount, net amount, service provider (staff FK), date, business ID.

---

## Capital Management

### Portfolio Capital
- Requires re-authentication (username + password) before any write action.
- Actions: add funds, deduct funds, transfer to a specific business.
- All movements are recorded with amount, direction, target (if transfer), and timestamp.

### Business Capital
- Actions: receive transfer from portfolio (add), return funds to portfolio (deduct).
- Balance is computed from movement history — do not store a mutable balance field.
- All movements are soft-deletable and auditable.

---

## Date-Range Reports (PDF)

- Reports are filtered by a user-supplied date range (start date, end date).
- PDF generation is triggered per module or per business based on the report context.
- Reports are generated server-side and returned as a downloadable PDF response.
- Do not store generated PDFs permanently; generate on demand.
- Report content must reflect soft-deleted records as excluded (use only active records unless otherwise specified).

---

## Extended Modules

### Staff Management
Fields: full name, age, employment start date, employment end date (nullable), employment type, salary (base), is_active flag, business ID.

Debts (cash advance):
- A staff member may have one or more cash advance records.
- Each advance has: amount, date issued, remaining balance, status (`pending` / `settled`).
- Advances are deducted from salary during compensation computation.

### Schedule & Attendance

- Schedules are plotted manually per employee per date (not auto-generated from a template).
- Dates can be updated at any time.
- Schedules support swap/exchange between two employees: swapping assigns one employee's plotted date to another and vice versa.
- Attendance is derived from the schedule; an employee is considered present for a scheduled date unless marked otherwise.

### Compensation Module

- Computation is based on attendance justified against the schedule.
- Deducts outstanding cash advances from gross pay.
- Supports two computation modes:
  - **By number of days** — pay for a fixed count of days regardless of date range.
  - **Up to a specific date** — pay from the last pay date up to a chosen cutoff date.
- Output: gross pay, total deductions (advances), net pay, per-employee breakdown.
- Compensation runs are soft-deletable and linked to a date range and business.

### Expenses

Fields: date issued, amount, description, purpose (`business` / `business_portfolio` / `service`), payment type (`one_time` / `repeat`), business ID.

- Description values are persisted to the database and surfaced as autocomplete suggestions on future entries.
- Repeat expenses carry a recurrence reference but are stored as individual records per occurrence.
- All expenses are soft-deletable.

---

## Must-Haves

### Authentication
- Standard login (username/password).
- Re-authentication guard for portfolio capital write actions.
- Session or token-based auth consistent with the existing baseline.

### Scheduled Data Backup
- Triggered automatically at **12:00 AM daily**.
- Backup target: local storage.
- Backup scope: full database dump.
- Implement as a Laravel scheduled command; do not rely on external cron without documenting the setup.
- Never log credentials or connection secrets in backup output.

### Soft Deletion
- All models use `SoftDeletes`.
- All list endpoints exclude soft-deleted records by default.
- Restoration endpoints may be added per module when explicitly requested.

### User Roles
- Roles: `admin`, `owner`, `{business}-staff`.
- Enforced at the backend via middleware and policies.
- Frontend may conditionally render UI elements based on role, but must never rely on frontend role checks as the sole access control.

---

## Security and Data Safety

- Never log secrets, tokens, or credentials.
- Never hardcode credentials in source code.
- Validate all user input on the backend even if the frontend validates first.
- Never rely on frontend-only role enforcement.
- Portfolio capital actions must require re-authentication at the point of action, not just at login.

---

## File Upload Pattern (When Applicable)

- Default to PDF-only uploads unless requirements specify otherwise.
- Default maximum size: 1MB unless requirements specify otherwise.
- Store file paths (not public URLs); keep storage handling inside services.

---

## Done Criteria per Feature

- Frontend UI, services, and types updated for intended UX.
- Backend FormRequest and API Resource updated to match UX contract.
- Route, controller, service, model, and migration changes completed where applicable.
- Soft deletion applied to all new models.
- Role-based access enforced at the backend for the feature scope.
- No contract mismatch between submitted frontend data and returned backend JSON.

---

## Future Improvements

> Items in this section are acknowledged but must **not** be implemented until explicitly requested. Do not scaffold, stub, or partially implement any of the following.

### GCash API Integration
Replace manual GCash transaction logging with a live payment gateway integration. Transaction data (recipient, amount, type, status) will be pulled or confirmed via the GCash API rather than entered by hand.

### Asset Management
Track physical and non-physical assets per business.

Fields: business ID, asset name, brand, vendor (nullable), cost (nullable), acquisition date, condition, notes.

- Assets are scoped to a specific business under the portfolio.
- Soft-deletable.
- No depreciation computation in this initial version.
