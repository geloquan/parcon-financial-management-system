# Task Summary — 2026-05-21 Sales/Expense Contract Updates

## Done
- Updated backend sales/expense requests to enforce:
  - `max now()` for date-time fields
  - `min today()` for non-`admin`/`owner`
  - module-specific validation rules (GCash, Coffee, Print, Ethereal)
- Updated backend sales/expense resources and model casts to return/use datetime values.
- Added backend migrations to:
  - shift expense/sales date columns from date to datetime
  - make GCash recipient nullable
  - add Coffee add-on price + add-on description
  - add Print options (`color_mode`, `print_size`, `paper_count`)
  - add Ethereal `customer_name` + `discount_type`
- Enforced backend GCash rule: moved cash must be less than sales amount.
- Moved GCash profit computation to backend service (auto-computed).
- Added backend business capital guard: block add-from-portfolio movement if portfolio balance is insufficient.
- Added backend business reference-items feature (products/services):
  - migration, model, requests, service, controller, resource, route.
- Updated frontend API types/services for new payload/response contracts.
- Updated frontend `App.tsx` to:
  - use datetime-local inputs on expense/sales forms
  - apply min/max datetime constraints in UI by role
  - auto-preview GCash profit and Ethereal net values
  - show relative date text (seconds/minutes/hours/days ago)
  - use React Query loading states in affected tabs
  - replace several short-option comboboxes with radio-like controls
  - add Reference Items tab and use item references in sales forms.

## Not Done
1. Full rollout of "radio-button-like UI for all <10 option combos" across every remaining area (some non-sales selects still remain as selects).
   - **LLM instruction for next task:**
     - "Scan all frontend forms for `<select>` controls with fewer than 10 options, convert them to the existing radio-like pattern, and keep naming/payload compatibility unchanged."

2. Expanded money-assist computations for all payment scenarios (currently implemented for GCash profit and Ethereal live net preview; not fully generalized for all modules/workflows).
   - **LLM instruction for next task:**
     - "Add consistent live money computation helpers across remaining modules/forms (e.g., print and capital action previews), ensuring no backend contract regression and preserving current color/token conventions."

3. Backend test execution in this environment is blocked by PHP version mismatch (`composer.lock` requires PHP >= 8.4, runner has 8.3.6).
   - **LLM instruction for next task:**
     - "Run backend tests in a PHP 8.4+ environment after dependencies install successfully, then fix any migration/runtime regressions introduced by datetime/schema updates."
