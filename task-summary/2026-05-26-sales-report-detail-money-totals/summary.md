# Task Summary: Sales Report Detail PDF — Date-Range-Independent Money Totals

## What was done
- Updated backend sales report detail data assembly to include `capital_money_totals` for:
  - `portfolio_money_total` (all-time computation from active capital movement records)
  - `business_money_total` (all-time computation from active capital movement records)
  - `business_breakdown` (all-time per-business totals)
- Updated PDF template (`sales-report-version.blade.php`) to show a new section:
  - **Portfolio & Business Money Totals (Not Date-Range Filtered)**
  - Includes portfolio all-time total, business all-time total, and per-business all-time breakdown.
- Kept existing date-range-based capital flow movement summary and detail table intact.

## What was not done
- No frontend UI changes were made (the enhancement is rendered in generated PDF output).
- No new automated report-specific tests were added in this task.
- Full backend test execution could not be completed in this environment because backend dependencies (`vendor/`) are missing.

### LLM instruction for next query/task
Run this next to fully verify end-to-end behavior:

1. Install dependencies in an environment with required toolchain:
   - `cd /home/runner/work/parcon-financial-management-system/parcon-financial-management-system/app/backend && composer install`
2. Execute backend tests:
   - `composer test`
3. Manually generate a **Detail Report** PDF with **Portfolio/Business money** included, then confirm:
   - all-time portfolio and business totals are present;
   - totals are unchanged when changing report date range;
   - date-range capital movement table still changes according to selected dates.
