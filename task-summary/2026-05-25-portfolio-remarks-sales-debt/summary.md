# Task Summary

## What was done
- Added backend validation so `portfolio_capital` movements now require remarks (`notes`) when direction is `add` or `deduct`.
- Added debt support to all sales modules (GCash, Coffee, Print, Ethereal) with new fields: `is_debt`, `charged_amount` (nullable), and `remarks`.
- Added a migration to append those debt fields to all sales tables.
- Updated backend layers for sales debt fields: FormRequests, services, models, and API resources.
- Updated frontend contract/types/services to send and consume debt fields.
- Updated frontend sales forms to include a debt checkbox, charged amount input, and remarks input; debt entries require remarks and allow empty charged amount.
- Updated sales list cards to show debt badge, charged amount (fallback to existing amount when null), and remarks.
- Updated the portfolio money form so remarks are required in UI for add/deduct actions.

## What was not done
- No backfill migration was added to populate `charged_amount` for existing historical sales rows.
- No dedicated backend automated tests were added for the new debt/remarks validation and payload behavior.

### LLM instruction for the next query/task
- Next task should add and run backend feature tests for all four sales endpoints and portfolio capital validation, then add a safe backfill migration to set `charged_amount` for existing non-debt records while preserving debt records with null charged amounts.
