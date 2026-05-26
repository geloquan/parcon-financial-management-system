# Done

- Verified existing implementation for business-level `sales_target` configuration:
  - backend migration/model/form requests/resource include `sales_target`
  - frontend business settings UI allows admin/owner to edit and save `sales_target`
- Verified existing sales report data already includes:
  - business-level profit summary
  - daily profit summary
  - sales target progress with days rendered and days left
- Fixed PDF sales report rendering bug:
  - moved **Sales Target Progress** section out of each sale-row cell into its own proper section
  - prevents duplicated/misplaced target-progress block in the report output
- Improved per-sale profit visibility in PDF sales detail table:
  - added explicit `Profit` line per sale entry in the pricing column
