# GPT Instructions - Step 4: SofaProduct

**Goal**: Generate `sofaProduct.json` using the provided **Variant IDs**.

## Input Data
*   **Image 3**: **Technical Sheet** (for `seduta`, `schienale`, `meccanica`, `materasso`).
*   **Variant IDs**: List/JSON mapping Variant Names/Types to DB IDs.

## Instructions
1.  Create the `SofaProduct` object.
2.  **Map Variants**: Populate the `variants` array with the provided **Variant IDs**.
3.  **Extract Technical Specs** (from Image 3):
    *   `seduta`: Extract text from "ASSISE" row.
    *   `schienale`: Extract text from "DOSSIER" row.
    *   `meccanica`: Extract text from "MECANIQUE" row.
    *   `materasso`: Extract text from "MATELAS" row.
4.  **Other Fields**:
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
    "materasso": "Classic h 17 en polyurethane..."
  }
]
```

## COMPLETION
This is the final step. All files have been generated.
