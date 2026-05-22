# Task Summary — 2026-05-22 (Follow-up)

## What was done
- Removed remaining legacy `staff_schedules` code paths:
  - Deleted legacy backend controller/service/model/resource/request classes.
  - Deleted legacy frontend schedule service/hook and related API type.
- Enforced re-auth requirements for end/void/update-sensitive actions:
  - Added `portfolio.reauth` middleware to update/destroy routes for sales, expenses, reference items, compensation run void, and attendance removals.
  - Updated frontend action handlers and mutation payloads to always request and send `reauth_username` + `reauth_password` for those actions.
- Ensured re-auth username is prefilled from authenticated user details in the modal flow.
- Updated payroll computation mode contract:
  - Replaced `by_days` / `up_to_date` flow with `today` / `specific_date`.
  - Removed frontend "number of days" input and switched to today/specific-date UI.
  - Updated backend request rules and service logic to compute payroll for a single target date.
  - Added cleanup migration to convert existing values and enforce new mode constraints.
- Updated all frontend query hooks to accept `queryOptions` for staleness/refetch controls.
- Removed all numeric input `step` constraints, removed range restrictions on number inputs, added predefined quick-value datalist, and enforced non-negative numeric submission/input behavior.

## What was not done
- Full local lint/build/test validation could not be completed in this environment because dependencies are not installed (`eslint`, `react`, `vite`, and backend `vendor/autoload.php` are missing).
- Backend PHP >=8.4 + Composer dependency validation was not executed in this environment.

## LLM instruction for next query/task (for unresolved items)
Use this exact instruction for the next task:

"Continue from `task-summary/2026-05-22-staff-sales-payroll-follow-up/summary.md`. Validate this branch in a fully prepared environment by installing frontend/backend dependencies, running frontend lint/build, running backend tests on PHP >=8.4, executing migrations (including compensation mode cleanup), and reporting any remaining contract/runtime issues with exact failing commands and fixes."
