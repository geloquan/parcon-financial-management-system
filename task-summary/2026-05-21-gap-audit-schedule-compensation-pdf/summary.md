# Task Summary — 2026-05-21 Gap Audit (Schedule & Attendance → Compensation → PDF Sales Reports)

## What was done

### 1) Schedule & Attendance (backend + frontend synchronized slice)
- Added backend schedule-attendance contract layer:
  - Migration: `staff_schedules` with soft delete, business/staff relations, attendance status, timestamped marking.
  - Model: `StaffSchedule`.
  - Requests: `StoreStaffScheduleRequest`, `UpdateStaffScheduleRequest`.
  - Service: `StaffScheduleService`.
  - Controller: `StaffScheduleController`.
  - Resource: `StaffScheduleResource`.
  - Routes: `businesses/{business}/staff_schedules` (`index/store/update/destroy`).
- Added frontend schedule-attendance contract layer:
  - Types: `StaffSchedule`.
  - Service/hook: `staff-schedule-service.ts`, `use-staff-schedules.ts`.
  - UI tab: **Schedule & Attendance** with:
    - schedule plotting form,
    - date-filtered attendance prompt list,
    - quick present/absent marking.
- Attendance prompt behavior added so attendance can be asked/updated anytime during the day.

### 2) Compensation (backend + frontend synchronized slice)
- Added backend compensation contract layer:
  - Migration: `compensation_runs` with soft delete.
  - Model: `CompensationRun`.
  - Request: `StoreCompensationRunRequest`.
  - Service: `CompensationRunService`.
  - Controller: `CompensationRunController`.
  - Resource: `CompensationRunResource`.
  - Routes: `businesses/{business}/compensation_runs` (`index/store/destroy`).
- Added compensation logic for:
  - `by_days` mode,
  - `up_to_date` mode,
  - attendance-based payable computation,
  - cash-advance deduction integration,
  - per-employee breakdown and totals.
- Added frontend compensation contract layer:
  - Types: `CompensationRun`, `CompensationBreakdownItem`.
  - Service/hook: `compensation-run-service.ts`, `use-compensation-runs.ts`.
  - UI tab: **Compensation** with mode selection, run creation, and run summaries.

### 3) PDF Sales Reports (backend + frontend synchronized slice)
- Added backend report-version contract layer:
  - Migration: `sales_report_versions` with soft delete and per-business versioning.
  - Model: `SalesReportVersion`.
  - Request: `StoreSalesReportRequest`.
  - Service: `SalesReportService`.
  - Controller: `SalesReportController`.
  - Resource: `SalesReportVersionResource`.
  - Routes:
    - `businesses/{business}/sales_reports` (`index/store`, role: `admin,owner`),
    - `businesses/{business}/sales_reports/{salesReportVersion}/download` (`admin,owner`).
- Implemented report generation details:
  - versioned report records,
  - metadata and report detail payloads,
  - on-demand downloadable PDF generation,
  - PDF page size set to 8.5x13 inches (`MediaBox 612x936`),
  - report metadata/details printed in document body as header/footer details.
- Added frontend report contract/UI:
  - Type: `SalesReportVersion`.
  - Service/hook: `sales-report-service.ts`, `use-sales-reports.ts`.
  - UI tab: **PDF Sales Reports** with:
    - report generation form,
    - version list,
    - metadata display,
    - download button,
    - simple pagination controls.

### Additional UI concerns addressed
- User Greeting remains global in app shell.
- Business Selector remains globally accessible.
- KPI stat cards were changed from global display to **overview-only** display.
- Overview now includes an **Anomalies to address** section (negative finances + day-over-day sales relapse check).

### Validation executed
- Frontend lint: `npm run frontend:lint` ✅
- Frontend build: `npm run frontend:build` ✅
- Backend dependency install/tests: blocked by PHP version mismatch (`composer.lock` requires PHP >=8.4, runner has 8.3.6).
- Backend syntax check (`php -l`) for all newly added backend PHP files ✅
- CodeQL check executed (no JavaScript alerts) ✅

## What was not done

1. Full swap/exchange workflow UI/API for Schedule & Attendance (current slice includes plotting + attendance marking, but no dedicated two-employee swap operation endpoint/UI yet).
   - **LLM instruction for next task:**
     - "Add a dedicated schedule swap workflow (request, service, route, UI interaction) that atomically exchanges plotted schedule dates between two staff records within the same business context."

2. Compensation payout finalization workflow (e.g., marking deducted cash advances as settled and recording payment release state) was not added in this slice.
   - **LLM instruction for next task:**
     - "Extend compensation runs with payout finalization so settled deductions update staff cash-advance balances/status and expose run payment status/history in API + UI."

3. Backend integration/runtime validation via Laravel test suite and migrations was not run in this environment due PHP 8.3.6 incompatibility with locked dependencies requiring PHP >=8.4.
   - **LLM instruction for next task:**
     - "Run `composer install`, `php artisan migrate`, and `composer test` on PHP 8.4+; then fix any runtime/migration issues in schedule, compensation, and sales-report modules."
