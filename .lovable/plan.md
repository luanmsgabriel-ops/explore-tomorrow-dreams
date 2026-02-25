

## Plan: Add client name and destination fields to the "Create Link" flow

Currently, the "Criar Link" button creates a review record with no client info (`phone_number: 'link'`, no name or destination). The fix is to show a dialog that collects **client name** and **destination** before creating the link.

### Changes to `src/components/admin/ReviewManager.tsx`:

1. **Add state** for a "create link" dialog:
   - `showCreateLinkForm: boolean`
   - `linkClientName: string`
   - `linkDestination: string`

2. **Modify the "Criar Link" button** to open the dialog instead of calling `createReviewLink()` directly.

3. **Update `createReviewLink()`** to include `client_name` and `destination_name` in the insert, and validate that both fields are filled.

4. **Add a Dialog** (similar to the existing send form dialog) with two inputs: client name and destination name, plus a "Criar e Copiar Link" button.

5. **Reset the form fields** after successful creation.

### No database changes needed
The `travel_reviews` table already has `client_name` and `destination_name` columns that are nullable. The page `/avaliacao/:id` already reads and displays these fields.

