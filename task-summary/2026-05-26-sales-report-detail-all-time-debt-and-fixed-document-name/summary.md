# Task Summary: Sales Report Detail Reports — All-Time Debt Context and Fixed Financial Document Name

## What was done
- Updated backend sales report detail generation to always assign a fixed document title format:
  - `FINANCIAL REPORTS: <scope/business> | <report_type> | <included sections>`
- Updated backend download filename fallback to derive from the fixed report document title.
- Updated sales detail entry payload metadata for all sales modules (GCash, Coffee, Print, Ethereal) to include debt context fields (`is_debt`, `charged_amount`, `remarks`) so debt information is present in the PDF detail report entries.
- Updated all-time capital money totals computation to also include all-time debt totals:
  - `debts_outstanding`
  - `debts_settled`
- Updated PDF template (`sales-report-version.blade.php`) to show all-time debt totals in the **Portfolio & Business Money Totals (Not Date-Range Filtered)** table.
- Updated frontend API type contract (`SalesReportVersion.details`) to include `capital_money_totals` with all-time debt totals and business breakdown.

## What was not done
- Did not modify the frontend Detail Reports form to remove or repurpose the optional `document_title` input, even though backend now enforces a fixed generated financial report title.
- Did not add or run successful full lint/build/test validations in this environment because dependencies are not installed (`eslint` missing, frontend packages missing, backend `vendor/` missing).
- Did not add dedicated automated tests for fixed-title composition, all-time debt totals computation, or debt metadata rendering in report entries.

### LLM instruction for next query/task
1. Align UI with backend-enforced naming by either removing the custom document title input or showing it as read-only preview of the generated fixed title.
2. Install dependencies and run validations:
   - `cd /home/runner/work/parcon-financial-management-system/parcon-financial-management-system && npm install`
   - `npm run frontend:lint`
   - `npm run frontend:build`
   - `cd /home/runner/work/parcon-financial-management-system/parcon-financial-management-system/app/backend && composer install && composer test`
3. Add focused backend tests for:
   - fixed `document_title` format generation,
   - all-time debt totals under `capital_money_totals`,
   - debt metadata fields (`is_debt`, `charged_amount`, `remarks`) appearing in detail report payload.
