# Task Summary — 2026-05-22

## What was done
- Added separate backend attendance tables and APIs:
  - `staff_day_offs` and `staff_absences` migrations
  - Models, FormRequests, services, controllers, resources, and routes
- Updated payroll computation:
  - Uses day-off and absence records (no schedule dependency for unpaid computation)
  - Keeps ethereal-only commission calculation
  - Finalizing payroll now creates a portfolio capital deduction movement
- Strengthened payroll finalize authorization and validation:
  - Requires `admin/owner`
  - Requires re-auth credentials in `FinalizeCompensationRunRequest`
- Enabled staff record actions in UI:
  - Inactive action
  - End employment action
  - Void staff record action
- Enabled void/delete actions in UI for sales modules:
  - GCash, Coffee, Print, Ethereal
- Reworked Schedule & Attendance UI flow:
  - Removed schedule creation/swap flow from UI
  - Added day-off and absent mark forms
  - Added day-off and absent record lists with remove actions
- Updated frontend services/hooks/types to support all new actions and APIs.

## What was not done
- Backend automated tests were not executed successfully because backend dependencies cannot be installed in this environment (PHP 8.3 vs required PHP >= 8.4 from lockfile).
- Legacy `staff_schedules` backend endpoints were not removed to avoid breaking existing integrations; UI now uses day-off/absence endpoints instead.

## LLM instruction for next query/task (for unresolved items)
Use this exact instruction for the next task:

"Continue from `task-summary/2026-05-22-staff-sales-payroll/summary.md`. Complete unresolved work by (1) migrating/removing legacy `staff_schedules` backend API usage safely, including any cleanup migration/code path updates, and (2) running full backend validation/tests in a PHP >=8.4 environment with installed Composer dependencies. Keep contract synchronization between frontend and backend and preserve soft-delete behavior."
