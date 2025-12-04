# GPT Instructions - Step 4: SofaProduct

**Goal**: Generate `sofaProduct.json` using the provided **Variant IDs** and **Extra Options**.

## ⚠️ CRITICAL: Required User Input
**DO NOT proceed with this step until the user provides ALL of the following**:

1. ✅ **REQUIRED**: Image of the **Technical Sheet** (Scheda Tecnica)
   - Contains: seduta, schienale, meccanica, materasso specifications
   
2. ✅ **REQUIRED**: Image of the **Extra Mattresses** table (Materassi Extra)
   - Contains: list of optional mattresses with names and prices
   
3. ✅ **REQUIRED**: **Variant IDs** from the database
   - The IDs generated after importing variants.json
   
4. ⚠️ **OPTIONAL**: Image of the **Extra Mechanisms** table (Meccanismi Extra)
   - Contains: list of optional mechanisms with names and prices
   - If not provided, omit the `meccanismiExtra` field

**If the user has not provided these inputs, STOP and ask them to provide the missing items.**

## Input Data Summary
*   **Image 1**: **Technical Sheet** (Scheda Tecnica) - for `seduta`, `schienale`, `meccanica`, `materasso`.
*   **Image 2**: **Extra Mattresses Table** (Materassi Extra) - for `materassiExtra`.
*   **Image 3** (Optional): **Extra Mechanisms Table** (Meccanismi Extra) - for `meccanismiExtra`.
*   **Variant IDs**: List/JSON mapping Variant Names/Types to their database IDs.

## Instructions
1.  **Verify Input**: Ensure all required inputs have been provided by the user.
2.  Create the `SofaProduct` object.
3.  **Map Variants**: Populate the `variants` array with the provided **Variant IDs**.
4.  **Extract Technical Specs** (from Technical Sheet image):
    *   `seduta`: Extract text from "ASSISE" or "Seduta" row.
    *   `schienale`: Extract text from "DOSSIER" or "Schienale" row.
    *   `meccanica`: Extract text from "MECANIQUE" or "Meccanica" row.
    *   `materasso`: Extract text from "MATELAS" or "Materasso" row.
5.  **Extract Extra Mattresses** (from Extra Mattresses image):
    *   `materassiExtra`: For each row in the table, create an object with `name` and `price`.
    *   Example: `{ "name": "REVES 30kg", "price": 40 }`
6.  **Extract Extra Mechanisms** (from Extra Mechanisms image, if provided):
    *   `meccanismiExtra`: For each row in the table, create an object with `name` and `price`.
    *   Example: `{ "name": "LA 13", "price": 60 }`
    *   **NOTE**: This field is optional. If the image is not provided, omit this field entirely.
7.  **Other Fields**:
    *   `name`: Extract product name from the original price table header (e.g., "Bagatelle").
    *   `description`: Create a brief Italian description of the sofa bed.
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
