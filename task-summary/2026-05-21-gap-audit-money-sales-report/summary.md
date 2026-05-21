# Task Summary — Gap Audit + Money Reauth + Sales Report

## Done

- Audited current implementation against `.github/copilot-instructions.md` requirements relevant to requested fixes.
- Added backend re-auth validation contract (`reauth_username`, `reauth_password`) to money-creating endpoints:
  - expenses
  - gcash sales
  - coffee sales
  - print sales
  - ethereal sales
  - business capital movements
  - portfolio capital movements
- Added reusable backend re-auth rules trait for synchronized validation.
- Added on-demand sales report generator backend slice using a job/queue action:
  - request validation
  - controller endpoint (`POST /api/sales_reports/generate`)
  - queue job (`GenerateSalesReportJob`)
  - report service with scope + period filters (`portfolio`/`business`, `today`/`date_range`)
- Added frontend sales report slice:
  - service + hook
  - report tab UI with filters and generated totals display
- Updated sales UI totals to clearly show payable totals in all sales modules.
- Corrected coffee total computation to include add-ons in both list display and overall sales total.
- Added `total_amount` in coffee API resource for contract sync.
- Added instant money re-auth modal (username defaulted from current user, editable) and wired it to all money transaction submits.
- Updated seed data so `GCash` is treated as a business and added `gcash-staff` role.

## Not Done

- Full must-have + extended-module implementation is still incomplete for modules not yet present as full frontend+backend slices, including:
  - schedule & attendance workflows (plot/swap/derived attendance)
  - compensation runs and payroll computation modes
  - full staff cash-advance lifecycle integration in compensation outputs
  - date-range PDF generation/export endpoint and downloadable PDF response
  - complete restoration endpoints strategy for soft-deleted records (not requested in this task)
- Existing backend/frontend environment setup in this sandbox prevented full local validation execution due missing dependencies/tooling setup in session.

### LLM Instruction for Next Task

- Continue the gap audit module-by-module in this order: **Schedule & Attendance → Compensation → PDF Sales Reports**. For each module, implement synchronized backend+frontend contracts in one slice (route, request, service, controller, resource, frontend service/types/UI), then update this summary with completed vs remaining gaps.
