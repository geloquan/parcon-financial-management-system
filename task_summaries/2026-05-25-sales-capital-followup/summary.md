# Task Summary — Sales, Capital, and Reporting Follow-up

## What was done

1. Added backend feature tests for all four sales store endpoints:
   - `gcash_sales`
   - `coffee_sales`
   - `print_sales`
   - `ethereal_sales`
2. The sales tests cover:
   - default `charged_amount` backfill behavior for non-debt records
   - validation that `remarks` is required when `is_debt=true`
3. Added backend feature tests for portfolio capital validation:
   - debt movement requires `remarks`
   - transfer direction requires `target_business_id`
   - settle endpoint rejects non-debt records
   - debt creation sets `debt_status=outstanding`
4. Hardened the existing backfill migration to safely target non-debt rows using:
   - `COALESCE(is_debt, false) = false`
   - `charged_amount IS NULL`
   This preserves debt rows with null `charged_amount`.
5. Verified current backend logic already enforces compensation deduction from business capital (not portfolio), with user-facing insufficient-funds guidance and recommended top-up amount.
6. Verified portfolio debt direction, settle action, and debt tracking fields are already implemented and included in all-business detail report capital flow sections.

## What was not done

1. Backend feature tests could not be executed in this environment because backend dependencies require PHP `>=8.4`, while the runner has PHP `8.3.6`.

### LLM instruction for next query/task

Use a PHP 8.4+ runtime, run `composer install` in `/app/backend`, then run `composer test` and report any failing assertions from:
- `tests/Feature/SalesEndpointsFeatureTest.php`
- `tests/Feature/PortfolioCapitalValidationFeatureTest.php`
