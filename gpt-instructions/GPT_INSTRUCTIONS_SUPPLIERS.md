# GPT Instructions - Step 1: Suppliers

**Goal**: Generate `suppliers.json` from the provided data (Image 1 - Price Table).

## Input Data
*   **Image 1**: Table containing component rows. Look at the **"Fornitore"** (Supplier) column.

## Pre-Check Workflow
1. **Extract Phase**: Scan the "Fornitore" column and extract all unique supplier names (normalize: trim, Title Case).
2. **Present to User**: Display the list of extracted suppliers and request confirmation to proceed.
3. **Database Query**: Call `gpt-firebase-backend.onrender.com` -> `/realtime/columns?path=/suppliers`.
4. **Intelligent Matching**: Compare extracted supplier names against DB results:
   - Use normalized name matching (case-insensitive, trim whitespace).
   - Flag exact matches and similar names.
5. **Cache Matched Data**: When matches are found, **remember the complete supplier data structures internally** (all fields: id, name, contact, etc.). **Do NOT ask the user for this data again**.
6. **Filter & Report**: 
   - Exclude suppliers that already exist in the DB.
   - Clearly list which suppliers are **NEW** vs. **ALREADY IN DB**.
7. **Proceed or Generate**:
   - If **all suppliers already exist**: Report matches and ask "Can I proceed to Step 2 (Components)?"
   - If **new suppliers exist**: Generate `suppliers.json` and ask user to confirm before proceeding.

## Instructions
1. Scan the "Fornitore" column in the provided table.
2. Extract all **unique** supplier names.
3. Normalize names (trim whitespace, Title Case).
4. Ignore empty or "-" values if they don't represent a real supplier.

## Data Model: Supplier
```typescript
{
  // id: string; // OMITTED (Auto-generated)
  name: string; // The extracted name
  contact?: string; // Optional, leave empty if not available
}
```

## Output Format
1. **First**: Present extracted suppliers to user for confirmation.
2. **Then**: Query database and cache results.
3. **Finally**: Return **ONLY** a valid JSON array in a code block for NEW suppliers (if any exist).
4. **DO NOT** include the `id` field.

**Filename**: `suppliers.json`

```json
[
  { "name": "Redael", "contact": "" },
  { "name": "Nuova Linea", "contact": "" }
]
```

## NEXT STEP
Once complete, proceed to Step 2 (Components) with the cached supplier data ready for use.
