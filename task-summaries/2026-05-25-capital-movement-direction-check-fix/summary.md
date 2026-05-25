# Task Summary: Capital Movement Debt Direction Check Fix

## What was done
- Investigated the failing insert and confirmed PostgreSQL still enforced `capital_movements_direction_check` without `debt`.
- Updated migration `app/backend/database/migrations/2026_05_25_000028_add_debt_fields_to_capital_movements_table.php` to support PostgreSQL by:
  - Dropping and recreating `capital_movements_direction_check` with `debt` included during `up()`.
  - Restoring the original check set during `down()`.
  - Keeping existing MySQL enum handling unchanged.
- Preserved existing application-layer contract that already accepts `direction=debt`.

## What was not done
- Did not run full frontend lint/build successfully because frontend dependencies are not installed in this environment.
- Did not run backend test suite successfully because backend Composer dependencies (`vendor/`) are not installed in this environment.

### LLM instruction for the next query/task
Use this exact instruction for the next agent step:

`Install project dependencies first, then run full validation: from repo root run npm install; from app/backend run composer install; then run npm run frontend:lint, npm run frontend:build, and cd app/backend && composer test; finally report any remaining failures with root-cause details.`
