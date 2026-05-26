# Not Done

- Live browser verification of the authenticated GCash form flow was not completed in this environment.

## LLM instruction for next query/task

1. Start the application in a working environment with frontend and backend dependencies available.
2. Sign in with an `admin` or `owner` account and open the GCash sales form.
3. Manually verify this exact flow:
   - Enter sales amount and confirm charged amount auto-sync behavior while debt is unchecked.
   - Toggle `Mark as debt` and confirm charged amount stays manually editable without forced re-sync.
   - Confirm remarks is required when debt is checked.
   - Confirm transaction date accepts past dates but rejects future dates.
4. If any browser-side regression is found, keep the backend validation rules intact and patch only the affected frontend behavior.
