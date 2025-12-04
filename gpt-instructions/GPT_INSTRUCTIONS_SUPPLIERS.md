# GPT Instructions - Step 1: Suppliers

**Goal**: Generate `suppliers.json` from the provided data (Image 1 - Price Table).

## Input Data
*   **Image 1**: Table containing component rows. Look at the **"Fornitore"** (Supplier) column.

## Instructions
1.  Scan the "Fornitore" column in the provided table.
2.  Extract all **unique** supplier names.
3.  Normalize names (trim whitespace, Title Case).
4.  Ignore empty or "-" values if they don't represent a real supplier.

## Data Model: Supplier
```typescript
{
  // id: string; // OMITTED (Auto-generated)
  name: string; // The extracted name
  contact?: string; // Optional, leave empty if not available
}
```

## Output Format
Return **ONLY** a valid JSON array in a code block.
**DO NOT** include the `id` field.

**Filename**: `suppliers.json`

```json
[
  { "name": "Redael", "contact": "" },
  { "name": "Nuova Linea", "contact": "" }
]
```

## NEXT STEP
**STOP**. Do not proceed to components. Wait for the user to provide the **Supplier IDs** generated from the database import.
