# Done

- Verified the requested scope is already implemented across backend and frontend:
  - per-business `sales_target` setting (migration, model, requests, resource, UI update flow)
  - profit totals by module/business
  - daily profit summary
  - sales target progress data including days rendered and days left
  - sales report include option `sales_target_progress`
- Fixed PDF report rendering issue:
  - moved **Sales Target Progress** into its own report section
  - removed duplicated nested rendering from inside each sales detail row
  - target progress now renders once per report when included
