# GPT Instructions - Step 5: SofaProduct

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

**Before you start, create this bullet-point plan:**

1. Verify ALL required inputs have been provided by user
2. Extract product name from original price table header
3. Create Italian description of the product
4. Extract technical specifications from Technical Sheet image
5. Parse Extra Mattresses table and create `materassiExtra` array
6. Parse Extra Mechanisms table (if provided) and create `meccanismiExtra` array
7. Map all Variant IDs to the `variants` array
8. Build complete SofaProduct object with ALL fields in correct order
9. Validate JSON structure matches required format exactly
10. Return ONLY the new SofaProduct entries

---

### Detailed Instructions

1. **Create the SofaProduct object** with fields in THIS EXACT ORDER:
   - `name` (string)
   - `description` (string)
   - `variants` (array of string IDs)
   - `photoUrl` (empty array)
   - `seduta` (string)
   - `schienale` (string)
   - `meccanica` (string)
   - `materasso` (string)
   - `materassiExtra` (array of objects with `name` and `price`)
   - `meccanismiExtra` (array of objects with `name` and `price`, optional)

2. **Extract `name`**:
   - Use the product name from the original price table header (e.g., "Deauville", "Bagatelle")
   - This should match the product model you've been working with throughout all steps

3. **Create `description`**:
   - Write a professional Italian description of the sofa bed
   - Include key features: type of mechanism, mattress type, seat padding, comfort level
   - Example: "Divano letto Deauville con meccanica Positano a rete elettrosaldata, materasso in poliuretano espanso e seduta ad alta densità per massimo comfort."

4. **Map `variants`**:
   - Use the Variant IDs provided by the user (e.g., "-OfehqdupQ9PipRGTAWL", "-Ofehqk7oB8Y1Kkbo0Kh")
   - These are the database IDs generated after importing variants.json
   - Create an array with EXACTLY the IDs provided, in the order given

5. **Set `photoUrl`**:
   - Always an empty array: `[]`

6. **Extract `seduta`** (from Technical Sheet):
   - Look for row labeled "ASSISE" or "Seduta" or "Seat"
   - Extract the full text description (e.g., "Poliuretano espanso densità 30 kg")

7. **Extract `schienale`** (from Technical Sheet):
   - Look for row labeled "DOSSIER" or "Schienale" or "Backrest"
   - Extract the full text description (e.g., "Poliuretano espanso densità 18 kg")

8. **Extract `meccanica`** (from Technical Sheet):
   - Look for row labeled "MECANIQUE" or "Meccanica" or "Mechanism"
   - Extract the full text description (e.g., "Positano con rete a maglia in acciaio elettrosaldato")

9. **Extract `materasso`** (from Technical Sheet):
   - Look for row labeled "MATELAS" or "Materasso" or "Mattress"
   - Extract the full text description (e.g., "Classic h 13 in poliuretano espanso densità 25 kg/m³")

10. **Build `materassiExtra`** (from Extra Mattresses image):
    - For EACH row in the table, create an object with ONLY two fields:
      - `name`: The mattress name/model (e.g., "REVES h 13")
      - `price`: The price as a number (e.g., 40)
    - Maintain the order from the table
    - Example structure:
    ```json
    "materassiExtra": [
      { "name": "REVES h 13", "price": 40 },
      { "name": "ETOILE h 13", "price": 80 },
      { "name": "CLASSIC h 18", "price": 50 }
    ]
    ```

11. **Build `meccanismiExtra`** (from Extra Mechanisms image, if provided):
    - For EACH row in the table, create an object with ONLY two fields:
      - `name`: The mechanism name/model (e.g., "Lampolet BL8")
      - `price`: The price as a number (e.g., 80)
    - Maintain the order from the table
    - **ONLY include this field if the user provided the Extra Mechanisms image**
    - **OMIT this field entirely if not provided by the user**

## ⚠️ CRITICAL Requirements

### Field Order (MUST be exactly this)
```
1. name
2. description
3. variants
4. photoUrl
5. seduta
6. schienale
7. meccanica
8. materasso
9. materassiExtra
10. meccanismiExtra (ONLY if provided by user)
```
