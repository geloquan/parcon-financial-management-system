# Not Done

- Full automated validation pass could not be completed in this environment because dependencies are not installed:
  - Frontend lint/build failed due missing Node modules (`eslint`, `react`, etc.).
  - Backend tests failed because `app/backend/vendor/autoload.php` is missing.
- No additional backend or frontend automated tests were added in this task.

## LLM instruction for next query/task

1. Install dependencies first:
   - From repo root: `npm install`
   - From `app/backend`: `composer install`
2. Re-run validation:
   - `npm run frontend:lint`
   - `npm run frontend:build`
   - `cd app/backend && composer test`
3. Manually verify the GCash form flow:
   - Enter sales amount and confirm charged amount auto-sync behavior.
   - Toggle `Mark as debt` and confirm charged amount remains editable.
   - Confirm remarks is required when debt is checked.
   - Confirm transaction date accepts past dates but rejects future dates.
4. Generate/download an all-business sales report PDF and verify metadata shows `Businesses: All Businesses`.
