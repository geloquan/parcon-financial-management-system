# Task Summary: Sales Reports Detail Reports

## What was done
- Added checkbox-based optional content selection in **Detail Reports** UI.
- Auto-derived report type (`sales`, `compensation`, `combined`) from selected checkboxes.
- Updated frontend payload/types to send `include_sections`.
- Updated backend `StoreSalesReportRequest` validation for `include_sections`.
- Enhanced `SalesReportService` to:
  - Persist `include_sections` in report metadata/details.
  - Filter sales module data based on selected sales checkboxes.
  - Include optional sections for Staff, Schedule & Attendance, Reference Items, Expenses, Compensation, and Portfolio/Business money.
  - Show capital flow details for both `business` and `all_businesses` scopes.
- Updated PDF template to render optional sections based on selected checkboxes.
- Updated Generated Versions list UI to use pill/chip-style metadata display for cleaner presentation.
- Updated root README report guide to reflect checkbox-based content selection.

## What was not done
- No automated test suite/lint/build was successfully completed in this environment because dependencies are not installed (`eslint` not found; frontend modules missing; backend `vendor/autoload.php` missing).
- No dedicated feature tests were added for the new report section-selection contract and PDF section rendering behavior.

### LLM instruction for next query/task
1. Install dependencies first:
   - From repo root: `npm install`
   - From backend: `composer install`
2. Re-run checks:
   - `npm run frontend:lint`
   - `npm run frontend:build`
   - `cd app/backend && composer test`
3. If checks fail, prioritize fixes in the sales report flow (`App.tsx`, `sales-report-service.ts`, `StoreSalesReportRequest.php`, `SalesReportService.php`, and `sales-report-version.blade.php`) and add focused backend feature tests for `include_sections` behavior.
