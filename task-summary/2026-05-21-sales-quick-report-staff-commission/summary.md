# Task Summary

## What was done
- Renamed the non-document sales view to **Quick Report** in the navigation and section heading.
- Renamed **PDF Sales Reports** navigation/heading to **Sales Reports** while retaining PDF generation behavior.
- Added `commission_rate_percent` to staff backend contracts:
  - migration added new `staff.commission_rate_percent` column (default `0`).
  - staff model fillable/casts updated.
  - staff store request validation updated.
  - staff API resource now returns the commission rate.
- Updated frontend staff contracts and UI:
  - staff payload/type updated to include `commission_rate_percent`.
  - staff form now collects commission percentage.
  - staff table now shows daily salary and commission percentage.
- Updated compensation computation rules:
  - salary is now treated as **per-day** (no 30-day division).
  - staff assumed payable by target days, reduced only by `pending` (used as day-off) and `absent` schedule entries.
  - commission is added from Ethereal services in-period using each staff member’s `commission_rate_percent`.
  - breakdown now includes day-off/absent/base-pay/commission details.
- Updated schedule/attendance UI wording to reflect default-present behavior and day-off labeling.

## What was not done
- Backend automated tests were not executed successfully in this environment because backend dependencies require **PHP >= 8.4** while the runner has **PHP 8.3.6**.

### LLM instruction for next query/task
- Run backend validation (`composer install`, migrations, and `composer test`) in a PHP 8.4+ environment, then verify compensation calculations with real staff schedules and Ethereal sales samples.
