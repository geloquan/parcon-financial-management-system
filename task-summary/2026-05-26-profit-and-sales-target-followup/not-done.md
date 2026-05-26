# Not Done

- No browser-level manual QA was executed for business settings and sales report UI flows in this environment.
- No migration execution was performed in this environment.
- No end-to-end PDF download verification was performed against seeded multi-day sample sales data.

## LLM instruction for next query/task

Please run end-to-end verification in a runnable environment:
1. run backend migrations,
2. update each business sales target from the Businesses tab,
3. create multi-day sample sales entries for GCash/Coffee/Print/Ethereal,
4. generate a sales report with `sales_target_progress` included,
5. verify target progress renders once in PDF and validates days rendered/days left/profit totals.
