# Task Summary — Compensation, Portfolio Debt, and All-Business Reports

## What was done
- Updated compensation finalization UX to surface backend guidance when business funds are insufficient, including the recommended top-up amount coming from backend validation details.
- Confirmed and aligned payroll history labeling to business-funded deduction (with backward-compatible fallback for older records).
- Expanded portfolio capital frontend flow to support `debt` direction.
- Added required debt remarks input handling for debt creation in portfolio money.
- Added portfolio debt settlement action in frontend movement list.
- Added frontend API/hook support for settling debt records via `/portfolio_capital/movements/{id}/settle`.
- Updated backend debt settlement behavior so settling a debt also records a matching portfolio `add` movement (funds returned), while retaining the original debt record with settled status.
- Added backend feature test coverage to verify debt settlement marks the debt as settled and creates a portfolio inflow record.
- Updated all-business sales detail report capital outflow aggregation to include debt movements and adjusted PDF label accordingly.
- Added frontend type coverage for all-business capital flow detail payload fields (`who/what/where`, debt status, remarks, totals).

## What was not done
- Did not add a dedicated frontend inline error panel/toast system for API validation details across all modules (current update uses alert messaging for key compensation/debt flows).
- Did not run successful frontend/backend full validations in this environment because dependencies are not installed (`eslint`/frontend packages missing and backend `vendor` missing).

### LLM instruction for next query/task
Implement a reusable app-wide error presentation pattern (non-alert UI) that can display backend validation details per field and per action, then apply it to compensation finalization, portfolio debt settlement, and capital movement forms.
