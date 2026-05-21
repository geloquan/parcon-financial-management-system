# Task Summary

## What was done
- Updated backend business capital behavior so business `add` movements no longer check/deduct portfolio balance; business-side movement is stored under the business ledger context.
- Added support for Ethereal multiple providers by introducing `staff_ids` persistence (`ethereal_sales.staff_ids` JSON), request validation, service normalization, and API resource output.
- Added multi-item payload support for Coffee, Print, and Ethereal create actions (`entries` array) in backend FormRequests, services, and controllers while keeping single-entry compatibility.
- Updated frontend Coffee, Print, and Ethereal forms to submit multiple items/services in one action.
- Added live money previews for Coffee and Print batch totals and for portfolio/business capital before-vs-after movement previews.
- Replaced remaining fixed-option `<select>` controls in non-sales forms (staff status and capital directions) with radio-button-like UI.
- Added visible field labels for key updated forms (staff, coffee, print, ethereal, portfolio capital, business capital).
- Ran frontend validation successfully after changes (`npm run frontend:lint`, `npm run frontend:build`).
- Confirmed backend dependency/test blocker remains due PHP mismatch in this environment (requires PHP >= 8.4, runner is 8.3.6).

## What was not done
- Full label rollout across every form in the app (some forms like login, expenses, gcash, and reference items still rely on placeholders/unlabeled controls).
  - **LLM instruction for next task:**
    - "Add explicit visible labels to all remaining frontend form controls (including login, expenses, gcash, and reference items) while preserving existing payload names and validation behavior."

- Full radio-style conversion for all dynamic/select scenarios where option counts may be context-dependent (e.g., transfer target business selector remains a `<select>`).
  - **LLM instruction for next task:**
    - "Audit remaining `<select>` controls and convert those with consistently small option sets to radio-like UI; keep dynamic/high-cardinality selectors as dropdowns unless UX requires otherwise."

- Backend tests were not executed because dependencies cannot be installed on PHP 8.3.6 with current lockfile constraints.
  - **LLM instruction for next task:**
    - "Run `composer install` and backend tests in PHP 8.4+ environment, then fix any failing migrations/runtime issues introduced by these contract updates."
