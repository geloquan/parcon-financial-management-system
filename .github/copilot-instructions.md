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

# Color scheme context:
# Color Palette — Parcon Financial Management System

> **Scope**: This document governs every color decision across the web and mobile application — components, typography, data visualizations, status indicators, and dark mode variants. Treat it as the single source of truth. No color may be hardcoded outside this system.

---

## 1. Design Intent

The palette is built around **Burgundy as the primary brand color**, projecting authority, trustworthiness, and financial seriousness — consistent with the domain (capital management, payroll, expenses, multi-business portfolios). Supporting colors are warm-neutral and purposefully restrained so financial data — numbers, charts, status badges — always dominates visually over decoration.

**Three core rules before anything else:**

1. **Never introduce a color not in this document.** If a situation isn't covered, bring it to the design decision layer first.
2. **Color encodes meaning, not aesthetics.** Burgundy = brand/action. Gold = profit/positive financial. Teal = income/growth. Red = danger/loss. Amber = warning/pending. Green = success/paid.
3. **Contrast is non-negotiable.** Every foreground/background pair must meet **WCAG AA minimum (4.5:1 for text, 3:1 for UI components)**. Verified pairs are listed in Section 6.

---

## 2. Color Tokens

All colors are defined as CSS custom properties on `:root`. **Use the token name in code — never the raw hex.**

### 2.1 Primary Ramp — Burgundy

The full seven-stop ramp from which all primary usage is drawn.

```css
:root {
  --burgundy-50:  #F7ECEE;   /* Blush — tinted surfaces, row highlights        */
  --burgundy-100: #ECC4CA;   /* Soft rose — hover fills, input tints            */
  --burgundy-200: #D98A95;   /* Mid rose — decorative dividers, illustrations   */
  --burgundy-400: #B94757;   /* Light burgundy — secondary buttons, hover state */
  --burgundy-600: #852030;   /* Core burgundy — PRIMARY BRAND COLOR             */
  --burgundy-800: #5C1220;   /* Deep burgundy — pressed states, dark text       */
  --burgundy-900: #3A0912;   /* Wine — darkest text on light, dark mode fills   */
}
```

**Stop-by-stop usage rules:**

| Stop | Hex | Permitted uses | Never use for |
|------|-----|----------------|---------------|
| `50` | `#F7ECEE` | Selected row bg, badge fill, input focus tint, sidebar active item bg | Text, borders, anything needing contrast |
| `100` | `#ECC4CA` | Hover fills on light surfaces, skeleton loaders, decorative pills | Primary text, icon fills |
| `200` | `#D98A95` | Divider lines on dark surfaces, illustration accents | Body text, interactive elements |
| `400` | `#B94757` | Secondary/ghost button label color, hover border, chart secondary series | Primary CTA background |
| `600` | `#852030` | Primary button bg, active nav indicator, focus ring color, filled badges | Dark mode page backgrounds |
| `800` | `#5C1220` | Primary button pressed state, heading text on light, dark mode card borders | Light mode body text (too dark) |
| `900` | `#3A0912` | Dark mode filled card backgrounds, extreme contrast text | Light mode use (fails WCAG on white) |

---

### 2.2 Supporting Palette

Fixed-value tokens — these do not have full ramps. Use only the defined stop.

```css
:root {
  /* Neutrals */
  --neutral-ivory:    #F5F2EE;   /* Primary page background (light mode)          */
  --neutral-linen:    #E0DBD5;   /* Card border, divider on ivory                 */
  --neutral-rosewood: #7A6A5A;   /* Secondary text, labels, placeholder           */
  --neutral-espresso: #2C2422;   /* Primary text (light mode), dark sidebar bg    */

  /* Accent */
  --accent-gold:      #C49A6C;   /* Profit figures, net totals, positive currency */
  --accent-gold-deep: #3A2210;   /* Text on gold fills                            */

  /* Secondary brand */
  --teal-mid:         #2D7A6B;   /* Income tags, positive trend indicators        */
  --teal-light:       #DAFAF5;   /* Teal badge fill background                    */
  --teal-dark:        #0B3D34;   /* Teal text on light fill, teal dark mode text  */

  /* Deep navy — informational */
  --navy-mid:         #1A3A56;   /* Info-level elements, chart data lines         */
  --navy-light:       #B5D4F4;   /* Navy badge/pill fill                          */
  --navy-dark:        #042C53;   /* Text on navy fills                            */
}
```

---

### 2.3 Semantic / Status Tokens

These map to system states across all modules (sales, expenses, payroll, attendance). **Never repurpose these for brand decoration.**

```css
:root {
  /* Success — Paid, Completed, Active employee */
  --status-success-bg:     #EAF3DE;
  --status-success-border: #C0DD97;
  --status-success-text:   #27500A;
  --status-success-solid:  #639922;

  /* Warning — Pending, Unconfirmed, Upcoming schedule */
  --status-warning-bg:     #FAEEDA;
  --status-warning-border: #FAC775;
  --status-warning-text:   #633806;
  --status-warning-solid:  #BA7517;

  /* Danger — Overdue, Failed, Terminated, Cash-out deficit */
  --status-danger-bg:      #FCEBEB;
  --status-danger-border:  #F7C1C1;
  --status-danger-text:    #791F1F;
  --status-danger-solid:   #E24B4A;

  /* Info — Neutral notices, system messages, GCash transaction type */
  --status-info-bg:        #E6F1FB;
  --status-info-border:    #B5D4F4;
  --status-info-text:      #0C447C;
  --status-info-solid:     #378ADD;
}
```

---

### 2.4 Background & Surface Tokens

```css
:root {
  /* Light mode surfaces */
  --surface-page:       #F5F2EE;   /* App-wide page background                  */
  --surface-card:       #FFFFFF;   /* Card, modal, dropdown background          */
  --surface-raised:     #F7ECEE;   /* Slightly elevated surface (sidebar, panel)*/
  --surface-overlay:    rgba(58, 9, 18, 0.45);  /* Modal backdrop               */

  /* Dark mode surfaces — applied via [data-theme="dark"] */
  --surface-page-dark:  #1A1010;
  --surface-card-dark:  #2C1A1D;
  --surface-raised-dark:#3A0912;
}
```

---

## 3. Typography Color Rules

**Rule: Never use raw black (`#000000`) or raw white (`#FFFFFF`) for text.** Always use the tokens below.

| Context | Light mode token | Dark mode token |
|---------|-----------------|-----------------|
| Headings (h1–h3) | `--neutral-espresso` `#2C2422` | `--burgundy-50` `#F7ECEE` |
| Body text | `--neutral-espresso` `#2C2422` | `--burgundy-100` `#ECC4CA` |
| Secondary / labels | `--neutral-rosewood` `#7A6A5A` | `--burgundy-200` `#D98A95` |
| Placeholder / hint | `--neutral-linen` `#E0DBD5` with opacity 0.8 | `--burgundy-800` `#5C1220` |
| Link / interactive | `--burgundy-600` `#852030` | `--burgundy-400` `#B94757` |
| Destructive link | `--status-danger-text` `#791F1F` | `--status-danger-bg` `#FCEBEB` |

**Text on colored backgrounds — mandatory pairings:**

| Background | Required text color |
|------------|-------------------|
| `--burgundy-600` (primary button) | `#FFFFFF` |
| `--burgundy-50` (badge/tag fill) | `--burgundy-800` `#5C1220` |
| `--accent-gold` | `--accent-gold-deep` `#3A2210` |
| `--teal-light` | `--teal-dark` `#0B3D34` |
| `--status-success-bg` | `--status-success-text` `#27500A` |
| `--status-warning-bg` | `--status-warning-text` `#633806` |
| `--status-danger-bg` | `--status-danger-text` `#791F1F` |
| `--status-info-bg` | `--status-info-text` `#0C447C` |

> ⚠️ **Never mix ramps on colored backgrounds.** If the fill is burgundy, the text must be from the burgundy ramp. Mixing ramps (e.g., teal fill with burgundy text) fails contrast in dark mode unpredictably.

---

## 4. Component-Level Usage

### 4.1 Buttons

```
Primary button:
  background:       --burgundy-600
  color:            #FFFFFF
  hover background: --burgundy-400
  active/pressed:   --burgundy-800
  focus ring:       --burgundy-600 at 3px offset, 0.35 opacity

Secondary / ghost button:
  background:       transparent
  border:           1.5px solid --burgundy-600
  color:            --burgundy-600
  hover background: --burgundy-50
  hover border:     --burgundy-800

Destructive button:
  background:       --status-danger-solid
  color:            #FFFFFF
  hover:            darken 10%

Disabled (any variant):
  background:       --neutral-linen
  color:            --neutral-rosewood
  border:           --neutral-linen
  cursor:           not-allowed
```

### 4.2 Navigation & Sidebar

```
Sidebar background (light):   --surface-raised   (#F7ECEE)
Sidebar background (dark):    --surface-raised-dark (#3A0912)
Nav item — default:           color --neutral-rosewood
Nav item — hover:             background --burgundy-50, color --burgundy-800
Nav item — active/selected:   background --burgundy-600, color #FFFFFF
Nav item — active indicator:  3px left border --burgundy-600
Business name label:          color --burgundy-600, font-weight 500
Role badge (e.g. coffee-staff): background --burgundy-50, color --burgundy-800
```

### 4.3 Data Tables

```
Table header:         background --surface-raised, color --neutral-rosewood, font-size 11px uppercase
Row default:          background transparent
Row hover:            background --burgundy-50
Row selected:         background --burgundy-100, left border 2px --burgundy-600
Border (row divider): 0.5px --neutral-linen
Positive value (profit, income):  color --accent-gold
Negative value (expense, debit):  color --status-danger-text
Zero / neutral:                   color --neutral-espresso
```

### 4.4 Form Inputs

```
Input background:     --surface-card (#FFFFFF)
Input border default: 0.5px --neutral-linen
Input border hover:   1px --neutral-rosewood
Input border focus:   1.5px --burgundy-600
Input focus ring:     0 0 0 3px rgba(133, 32, 48, 0.2)
Input label:          --neutral-rosewood, 12px, uppercase, letter-spacing 0.05em
Input error state:    border --status-danger-solid, label --status-danger-text
Input success state:  border --status-success-solid
Placeholder text:     --neutral-rosewood at 60% opacity
```

### 4.5 Badges & Pills

Rules: background always from the `-bg` token, border from `-border`, text from `-text`. No exceptions.

```
Paid / Active / Completed:    success tokens
Pending / Unconfirmed:        warning tokens
Overdue / Failed / Terminated: danger tokens
GCash Cash-in / Info notice:  info tokens
Business-branded tag:         --burgundy-50 bg, --burgundy-800 text
Portfolio-level tag:          --neutral-espresso bg, --burgundy-50 text
```

### 4.6 Cards & Panels

```
Standard card:
  background:     --surface-card (#FFFFFF)
  border:         0.5px --neutral-linen
  border-radius:  10px (desktop), 8px (mobile)

Metric / KPI card:
  background:     --surface-raised (#F7ECEE)
  border:         none
  label:          --neutral-rosewood, 11px
  value:          --neutral-espresso, 22px, font-weight 500

Profit/revenue figure specifically:
  value color:    --accent-gold (#C49A6C)

Expense/deduction figure specifically:
  value color:    --burgundy-600 (#852030)

Modal backdrop:   --surface-overlay (rgba 58,9,18 at 0.45)
Modal card:       --surface-card, border 0.5px --neutral-linen, shadow none
```

---

## 5. Module-Specific Rules

### 5.1 GCash (Business)

GCash is a standalone business under the portfolio. Its transaction types carry specific visual treatments.

```
Cash-in transaction:    leading icon color --teal-mid, amount color --teal-mid
Cash-out transaction:   leading icon color --status-danger-text, amount color --status-danger-text
Profit from transaction: --accent-gold
GCash balance total:    --neutral-espresso (large), --neutral-rosewood (label)
GCash business tag/badge: --status-info-bg, --status-info-text
```

### 5.2 Coffee, Print, Ethereal (Sales Modules)

Each business does not get a unique brand color — the system uses a single palette. Differentiation is by **label** and **business selector**, not color.

```
Sale row:          standard table rules
Add-on item line:  --neutral-rosewood, 12px, indented
Discount line:     --status-warning-text, prefixed with "−"
Total line:        --neutral-espresso, font-weight 500, border-top 0.5px --neutral-linen
```

### 5.3 Payroll & Compensation

```
Base salary:           --neutral-espresso
Overtime / bonus:      --accent-gold
Deduction / debt:      --status-danger-text, prefixed with "−"
Net pay (final):       --burgundy-600, font-weight 500, slightly larger
Pay period label:      --neutral-rosewood, 11px
Unpaid (no show):      --neutral-linen, strikethrough text
```

### 5.4 Expenses

```
One-time expense:      --neutral-espresso
Recurring expense:     --status-warning-text, with repeat icon
Business-purpose:      --teal-mid tag
Portfolio-purpose:     --navy-mid tag
Service-purpose:       --burgundy-200 tag
Description (lookup):  --neutral-rosewood, italic, 13px
```

### 5.5 Portfolio Capital

Portfolio capital is a sensitive, privileged module. Visual weight must reinforce its elevated status.

```
Portfolio balance:     --neutral-espresso (value), extra-large size, --accent-gold underline accent
Transfer to business:  --status-info-bg row, --status-info-text label
Return from business:  --status-success-bg row, --status-success-text label
Auth gate UI:          card uses --surface-raised, input border --burgundy-600, CTA --burgundy-800
```

### 5.6 Schedule & Attendance

```
Present day cell:      --status-success-bg bg
Absent day cell:       --status-danger-bg bg
Rest day:              --neutral-linen bg, --neutral-rosewood text
Swapped schedule:      --status-warning-bg bg, dashed border --status-warning-solid
Today indicator:       dot --burgundy-600, underline --burgundy-600
```

---

## 6. Verified Contrast Pairs (WCAG AA)

These pairings are pre-verified. Use only these combinations for interactive and textual UI.

| Foreground | Background | Ratio | Use |
|-----------|------------|-------|-----|
| `#FFFFFF` | `#852030` | 7.2:1 ✅ | Primary button text |
| `#2C2422` | `#F5F2EE` | 10.4:1 ✅ | Body text on page bg |
| `#2C2422` | `#FFFFFF` | 12.6:1 ✅ | Body text on card |
| `#5C1220` | `#F7ECEE` | 8.1:1 ✅ | Text on burgundy-50 fill |
| `#27500A` | `#EAF3DE` | 7.3:1 ✅ | Success badge text |
| `#633806` | `#FAEEDA` | 6.9:1 ✅ | Warning badge text |
| `#791F1F` | `#FCEBEB` | 7.1:1 ✅ | Danger badge text |
| `#0C447C` | `#E6F1FB` | 7.4:1 ✅ | Info badge text |
| `#3A2210` | `#C49A6C` | 4.8:1 ✅ | Text on gold accent |
| `#7A6A5A` | `#FFFFFF` | 4.6:1 ✅ | Secondary label on white card |
| `#852030` | `#FFFFFF` | 7.2:1 ✅ | Brand link on white |

> ❌ **Do not use:** `--burgundy-400` (`#B94757`) as text on white — it fails AA at 3.9:1. Use only as background fill or large heading (18px+, bold).

---

## 7. Dark Mode

Dark mode is activated via `[data-theme="dark"]` on the root element.

**Override tokens only — do not rewrite component CSS:**

```css
[data-theme="dark"] {
  --surface-page:   #1A1010;
  --surface-card:   #2C1A1D;
  --surface-raised: #3A0912;

  /* Text */
  --text-primary:   #F7ECEE;
  --text-secondary: #D98A95;
  --text-hint:      #7A5460;

  /* Borders */
  --border-default: rgba(236, 196, 202, 0.12);
  --border-emphasis:#ECC4CA;

  /* Primary button stays the same hue but shifts lighter */
  --btn-primary-bg: #B94757;
  --btn-primary-text: #F7ECEE;

  /* Status backgrounds deepen */
  --status-success-bg:  #173404;
  --status-warning-bg:  #412402;
  --status-danger-bg:   #501313;
  --status-info-bg:     #042C53;
}
```

**Dark mode rules:**
- Tinted surfaces (`--burgundy-50`) invert to `--burgundy-900` — never keep light fills in dark mode.
- Gold accent (`--accent-gold`) remains unchanged — it reads well on both dark and light.
- `--teal-mid` shifts to `--teal-light` for text in dark mode to preserve contrast.
- Status badge backgrounds use the deepened tokens above; text colors use the light fills (`-bg` token of the opposite mode).

---

## 8. Data Visualization

Charts and graphs follow these color assignments. **Sequence is fixed** — do not reassign by preference.

| Series | Role | Color | Hex |
|--------|------|-------|-----|
| 1 | Revenue / Income | Burgundy solid | `#852030` |
| 2 | Profit / Net | Gold | `#C49A6C` |
| 3 | Expenses | Rosewood muted | `#7A6A5A` |
| 4 | GCash volume | Info blue | `#378ADD` |
| 5 | Payroll cost | Warning amber | `#BA7517` |
| 6 | Target / Budget | Teal | `#2D7A6B` |

- **Gridlines**: `--neutral-linen` at 40% opacity
- **Axis labels**: `--neutral-rosewood`, 11px
- **Tooltip background**: `--surface-card`, border `--neutral-linen`, shadow-none
- **Zero line**: `--neutral-espresso` at 30% opacity, 1px dashed
- **Positive bar fill**: series color at 100% opacity
- **Negative bar fill**: series color at 45% opacity, striped pattern overlay

---

## 9. PDF Export

Date-range PDF reports use a **print-safe subset** of this palette. Screen-only tokens (`--surface-overlay`, transparency-based borders) are replaced.

```
Page background:       #FFFFFF (forced white)
Primary heading:       #852030 (burgundy-600)
Section heading:       #5C1220 (burgundy-800)
Body text:             #2C2422 (espresso)
Table header bg:       #F7ECEE (burgundy-50)
Table header text:     #5C1220 (burgundy-800)
Table row divider:     #E0DBD5 (linen)
Positive value:        #C49A6C (gold)
Negative value:        #791F1F (danger text)
Footer text:           #7A6A5A (rosewood)
Logo/brand accent:     #852030
```

> PDFs must never use transparency, `rgba()`, or CSS variable syntax — all values must be resolved hex at export time.

---

## 10. What Is Forbidden

These patterns are explicitly banned regardless of context:

- ❌ Hardcoded hex values in component files — always use tokens
- ❌ Raw `#000000` or `#FFFFFF` for text
- ❌ `--burgundy-400` (`#B94757`) as small text on white — fails WCAG AA
- ❌ Any color outside this document introduced without a documented token
- ❌ Using semantic status colors (success/warning/danger/info) for branding or decoration
- ❌ Mixing ramp families on the same colored surface (e.g., teal fill + burgundy text)
- ❌ Applying opacity to text to simulate a lighter tone — use the designated lighter token instead
- ❌ Using `--accent-gold` for anything other than profit/net financial figures and chart series 2
- ❌ Dark mode surfaces that retain light-mode tinted fills without override

---

## 11. Token Quick Reference (Copy-Paste)

```
/* --- PRIMARY --- */
--burgundy-50: #F7ECEE;
--burgundy-100: #ECC4CA;
--burgundy-200: #D98A95;
--burgundy-400: #B94757;
--burgundy-600: #852030;
--burgundy-800: #5C1220;
--burgundy-900: #3A0912;

/* --- NEUTRALS --- */
--neutral-ivory: #F5F2EE;
--neutral-linen: #E0DBD5;
--neutral-rosewood: #7A6A5A;
--neutral-espresso: #2C2422;

/* --- ACCENT --- */
--accent-gold: #C49A6C;
--accent-gold-deep: #3A2210;

/* --- SECONDARY BRAND --- */
--teal-mid: #2D7A6B;
--teal-light: #DAFAF5;
--teal-dark: #0B3D34;
--navy-mid: #1A3A56;
--navy-light: #B5D4F4;
--navy-dark: #042C53;

/* --- STATUS --- */
--status-success-bg: #EAF3DE;
--status-success-border: #C0DD97;
--status-success-text: #27500A;
--status-success-solid: #639922;

--status-warning-bg: #FAEEDA;
--status-warning-border: #FAC775;
--status-warning-text: #633806;
--status-warning-solid: #BA7517;

--status-danger-bg: #FCEBEB;
--status-danger-border: #F7C1C1;
--status-danger-text: #791F1F;
--status-danger-solid: #E24B4A;

--status-info-bg: #E6F1FB;
--status-info-border: #B5D4F4;
--status-info-text: #0C447C;
--status-info-solid: #378ADD;

/* --- SURFACES --- */
--surface-page: #F5F2EE;
--surface-card: #FFFFFF;
--surface-raised: #F7ECEE;
--surface-overlay: rgba(58, 9, 18, 0.45);
```
