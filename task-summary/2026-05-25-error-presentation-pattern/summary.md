# Task Summary — Reusable App-Wide Error Presentation Pattern

## What was done
- Added a reusable API error model/parser to preserve backend validation details (action message + per-field errors):
  - `app/frontend/src/services/api-error.ts`
- Updated API client to throw structured `ApiRequestError` instead of flattening errors into a single string:
  - `app/frontend/src/services/api-client.ts`
- Added reusable non-alert error UI components:
  - `ActionErrorPanel` (action-level + field-level details)
  - `FieldErrorText` (inline field-level details)
  - File: `app/frontend/src/components/action-error-panel.tsx`
- Applied the reusable error pattern to **compensation finalization**:
  - Removed `window.alert(...)`
  - Added `ActionErrorPanel` for finalize payout failures
  - File: `app/frontend/src/App.tsx`
- Applied the reusable error pattern to **portfolio debt settlement**:
  - Removed `window.alert(...)`
  - Added `ActionErrorPanel` for settle debt failures
  - File: `app/frontend/src/App.tsx`
- Applied the reusable error pattern to **capital movement forms**:
  - Portfolio capital form: action-level panel + inline per-field errors
  - Business capital form: action-level panel + inline per-field errors
  - File: `app/frontend/src/App.tsx`
- Validation completed:
  - `npm run frontend:lint` ✅
  - `npm run frontend:build` ✅

## What was not done
- Backend automated tests could not run because backend dependencies are not installed in this environment:
  - `composer test` fails due to missing `app/backend/vendor/autoload.php`.

### LLM instruction for next query/task
Use an environment with PHP and Composer dependencies installed for `app/backend`, then run:
1. `cd /home/runner/work/parcon-financial-management-system/parcon-financial-management-system/app/backend`
2. `composer install`
3. `composer test`
If PHP version conflicts appear (e.g., package requirements >= 8.4), switch to a compatible PHP runtime before testing.
