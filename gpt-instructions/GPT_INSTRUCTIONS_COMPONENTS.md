# GPT Instructions - Step 2: Components

**Goal**: Generate `components.json` using the provided **Supplier IDs**.

## Input Data
*   **Image 1**: Price Table (same as Step 1).
*   **Supplier IDs**: A list or JSON provided by the user mapping Supplier Names to DB IDs.

## Instructions
1.  Parse each row in the table to create a `Component`.
2.  **Map Supplier**: Use the provided **Supplier IDs**. The `supplier` field MUST be an object `{ id: "...", name: "..." }`.
3.  **Generate Name**: Follow the pattern: `[Type] [Supplier] [Model/Code] [SofaType]`.
    *   Example: "Fusto Redael CG27 Divano 3 PL Maxi"
4.  **Deduplicate**: Create a separate component for each `SofaType` column (Divano 3 PL Maxi, Divano 3 PL, Divano 2 PL) if the price or usage differs.

## Special Parsing Rules
*   **"Imbottit.cuscinet"**: If "Tipo" column contains "Imbottit.cuscinet", set `type` = `IMBOTTITURA_CUSCINETTI`.
*   **"Tela Marchiata"**:
    *   `type` = `TELA_MARCHIATA`
    *   `supplier` = omitted (undefined)
    *   `name` = "Tela Marchiata " + [Sofa Name]
*   **Imballo/Scatola Logic**:
    *   If "Imballo" row has a price and "Scatola" row is empty/zero:
        *   "Imballo" gets the full price.
        *   "Scatola" gets price 0.
    *   Both are distinct components.
*   **Transport**: **EXCLUDE** rows labeled "Trasporto". Do NOT create components for them (they are fixed and exist in DB).

## Data Model: Component
```typescript
{
  // id: string; // OMITTED (Auto-generated)
  name: string;
  price: number;
  supplier?: { id: string, name: string }; // MUST use the ID provided
  type: ComponentType; // Enum value (e.g., FUSTO, GOMMA, IMBOTTITURA_CUSCINETTI)
  sofaType: SofaType; // e.g., DIVANO_3PL_MAXI
}
```

## Output Format
Return **ONLY** a valid JSON array in a code block.
**DO NOT** include the `id` field for the component itself.

**Filename**: `components.json`

```json
[
  {
    "name": "Fusto Redael CG27 Divano 3 PL Maxi",
    "price": 120,
    "supplier": { "id": "PROVIDED_ID_123", "name": "Redael" },
    "type": "FUSTO",
    "sofaType": "DIVANO_3PL_MAXI"
  }
]
```

## NEXT STEP
**STOP**. Do not proceed to variants. Wait for the user to provide the **Component IDs** generated from the database import.
