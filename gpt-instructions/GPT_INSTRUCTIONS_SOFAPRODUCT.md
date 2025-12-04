# GPT Instructions - Step 5: SofaProduct

**Goal**: Generate `sofaProduct.json` using the provided **Variant IDs** and **Extra Options**.

## Input Data
*   **Image 3**: **Technical Sheet** (for `seduta`, `schienale`, `meccanica`, `materasso`).
*   **Image 4**: **Optional Material/Mechanic Options Table** (for `materassiExtra`, `meccanismiExtra`).
*   **Variant IDs**: List/JSON mapping Variant Names/Types to DB IDs.

## Instructions
1.  Create the `SofaProduct` object.
2.  **Map Variants**: Populate the `variants` array with the provided **Variant IDs**.
3.  **Extract Technical Specs** (from Image 3):
    *   `seduta`: Extract text from "ASSISE" row.
    *   `schienale`: Extract text from "DOSSIER" row.
    *   `meccanica`: Extract text from "MECANIQUE" row.
    *   `materasso`: Extract text from "MATELAS" row.
4.  **Extract Extra Options** (from Image 4):
    *   `materassiExtra`: For each row in the table, create an object with `name` (e.g., "REVES 30kg") and `price` (e.g., 40).
    *   `meccanismiExtra`: For each row in the table, create an object with `name` (e.g., "ETOILE 35kg") and `price` (e.g., 80).
    *   **NOTE**: These fields are optional. If Image 4 is not provided or empty, omit them.
5.  **Other Fields**:
    *   `name`: Extract product name from Image 1 header (e.g., "CG 32 New Brooklyn").
    *   `photoUrl`: Empty array `[]`.

## Data Model: SofaProduct
```typescript
{
  // id: string; // OMITTED (Auto-generated)
  name: string;
  description?: string;
  variants: string[]; // List of Variant IDs
  photoUrl: string[];
  seduta?: string;
  schienale?: string;
  meccanica?: string;
  materasso?: string;
  materassiExtra?: { name: string; price: number }[];
  meccanismiExtra?: { name: string; price: number }[];
}
```

## Output Format
Return **ONLY** a valid JSON array in a code block.
**DO NOT** include the `id` field.

**Filename**: `sofaProduct.json`

```json
[
  {
    "name": "CG 32 New Brooklyn",
    "description": "...",
    "variants": [
      "VAR_ID_1",
      "VAR_ID_2",
      "VAR_ID_3"
    ],
    "photoUrl": [],
    "seduta": "Poliurethane Expansé densité 30 kg",
    "schienale": "Poliurethane Expansé densité 18 kg",
    "meccanica": "Positano avec sommier...",
    "materasso": "Classic h 17 en polyurethane...",
    "materassiExtra": [
      { "name": "REVES 30kg", "price": 40 },
      { "name": "ETOILE 35kg", "price": 80 }
    ],
    "meccanismiExtra": [
      { "name": "MEDITATION 38kg h 13", "price": 60 },
      { "name": "NUAGE 50kg", "price": 120 }
    ]
  }
]
```

## COMPLETION
This is the final step. All files have been generated.
