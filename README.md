# Parcon Financial Management System

Business portfolio management monorepo for the Parcon financial platform.

## Applications
- `app/frontend` — React + TypeScript + Vite user interface
- `app/backend` — Laravel API for portfolio, business, sales, expenses, staff, compensation, capital, and report workflows

## Guide: Get a PDF report as an admin/owner

This flow is available only to users with the `admin` or `owner` role.

1. Sign in using an `admin` or `owner` account.
2. Select the target business from the business selector in the app.
3. Open the **Sales Reports** item in the sidebar under the **Capital** group.
4. In **Detail Reports**, enter the `Start date` and `End date`.
5. Optionally enter a `Document title`.
6. Choose one or more `Optional contents` checkboxes (Staff, Schedule & Attendance, Compensation, Reference Items, Expenses, Sales modules, and Portfolio/Business money).
   - Report type is auto-computed from your selected content.
7. Click **Generate report version**.
8. Wait for the new entry to appear under **Generated versions**.
9. Click **Download PDF** on the generated version you want.

## Notes
- PDF reports are generated per selected business.
- The exported file is a versioned PDF report.
- `Combined` includes both sales and compensation details.
- If no report appears, confirm a business is selected and the chosen date range contains records for that business.
- Non-`admin` and non-`owner` users can see the screen warning, but they cannot view or download exported report files.
