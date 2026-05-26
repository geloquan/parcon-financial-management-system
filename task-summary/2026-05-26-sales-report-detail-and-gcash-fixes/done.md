# Done

- Updated PDF sales report detail metadata display so all-business scope now shows `Businesses: All Businesses` instead of a single business name.
- Updated GCash form behavior so selecting a reference item copies price into both `Sales amount` and `Charged amount`.
- Updated GCash `Sales amount` input behavior to auto-sync `Charged amount` when it is blank or still matching the previous sales value.
- Kept `Charged amount` editable even when `Mark as debt` is checked.
- Updated GCash transaction date rules to allow historical dates while still preventing future dates:
  - Frontend: removed minimum bound on GCash transaction date input.
  - Backend: removed `after_or_equal:today` restriction for non-admin/owner from `StoreGcashSaleRequest`.
