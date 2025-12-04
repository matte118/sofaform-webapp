# GPT Instructions - Step 3: Variants

**Goal**: Generate `variants.json` using the provided **Component IDs**.

## Input Data
*   **Image 1**: Price Table (for composition) from Step 1.
*   **Image 2**: **Dimensions Table** (for `mattressWidth`, `depth`, `height`).
*   **Component IDs**: List/JSON mapping Component Names to DB IDs.

## Instructions
1.  Create one `Variant` for each column in the Price Table (typically 3: Maxi, 3PL, 2PL).
2.  **Map Components**:
    *   Use the provided **Component IDs** to populate the `components` array.
    *   **CRITICAL**: Add the **Fixed Transport ID** corresponding to the sofa type (these are constant and provided below).
3.  **Map Dimensions** (from Image 2):
    *   Look at the "DIMENSIONS" table in Image 2.
    *   Map `Larg` (Width) -> `mattressWidth`.
    *   Map `Prof` (Depth) -> `depth`.
    *   Map `Haut` (Height) -> `height`.
    *   Ensure you map the correct column (Maxi vs 3PL vs 2PL).
4.  **Set Fields**:
    *   `longName`: MUST be the `sofaType` (e.g., "DIVANO_3PL_MAXI").
    *   `seatsCount`: 3 for Maxi/3PL, 2 for 2PL.
    *   `sofaId`: "" (empty string).

## Fixed Transport IDs (Include these!)
*   **DIVANO_3PL_MAXI**: `-Ofabu2A6s4Q_MSrInDh`
*   **DIVANO_3PL**: `-Ofabu2A6s4Q_MSrInDi`
*   **DIVANO_2PL**: `-Ofabu2A6s4Q_MSrInDj`

## Data Model: Variant
```typescript
{
  // id: string; // OMITTED (Auto-generated)
  sofaId: string; // ""
  sofaType: SofaType; // e.g. DIVANO_3PL_MAXI
  longName: string; // e.g. "DIVANO_3PL_MAXI" (same as sofaType)
  price: number; // Sum of components
  components: string[]; // List of IDs (Component IDs + Transport ID)
  seatsCount: number;
  mattressWidth: number; // from Image 2
  depth: number; // from Image 2
  height: number; // from Image 2
  pricingMode: "components";
}
```

## Output Format
Return **ONLY** a valid JSON array in a code block.
**DO NOT** include the `id` field.

**Filename**: `variants.json`

```json
[
  {
    "sofaId": "",
    "sofaType": "DIVANO_3PL_MAXI",
    "longName": "DIVANO_3PL_MAXI",
    "seatsCount": 3,
    "mattressWidth": 190,
    "depth": 97,
    "height": 92,
    "price": 733.43,
    "components": [
      "COMP_ID_1",
      "COMP_ID_2",
      "-Ofabu2A6s4Q_MSrInDh"
    ],
    "pricingMode": "components"
  }
]
```

## NEXT STEP
**STOP**. Do not proceed to SofaProduct. Wait for the user to provide the **Variant IDs** generated from the database import and the pictures containing the **Extra Mattresses** + **Extra Meccanismi** and the **Technical Sheet**. 
