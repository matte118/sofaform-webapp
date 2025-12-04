# GPT Instructions - Step 3: Variants

**Goal**: Generate `variants.json` using the provided **Component Data**.

## Input Data
*   **Image 1**: Price Table (for composition) from Step 1.
*   **Image 2**: **Dimensions Table** (for `mattressWidth`, `depth`, `height`).
*   **Component Data**: Complete component objects from the database (with id, name, price, supplier, type, sofaType).

## ⚠️ CRITICAL: Before Starting This Step

**PAUSE and verify you have all required information. Create a checklist:**

- ✅ Do I have the **Component IDs AND full Component objects** from the database?
- ✅ Do I have the **Dimensions Table** (Image 2)?
- ✅ Do I understand the sofa types: DIVANO_3_PL_MAXI, DIVANO_3_PL, DIVANO_2_PL?
- ✅ Do I have the cached component data from Step 2?
- ✅ Am I ready to create variants for EACH sofa type column?

**If ANY answer is NO, STOP and ask the user for missing information.**

## Instructions

**Before you start, create this bullet-point plan:**

1. Extract dimensions from Image 2 for each sofa type (Maxi, 3PL, 2PL)
2. For EACH sofa type:
   - Match components from cache using component names from the price table
   - Collect the **COMPLETE component objects** (NOT just IDs!)
   - Add the fixed transport component object for that sofa type
   - Create one Variant object with all required fields
3. Ensure ALL variants have complete data (no missing fields)
4. Use lowercase `sofaType` values (e.g., "divano_3_pl_maxi")
5. Validate each variant before output

---

### Detailed Instructions

1. **Extract Dimensions** (from Image 2 - Dimensions Table):
   - Map `Larg` (Width) → `mattressWidth`
   - Map `Prof` (Depth) → `depth`
   - Map `Haut` (Height) → `height`
   - Create a dimensions map: `{ "Maxi": { width, depth, height }, "3PL": {...}, "2PL": {...} }`

2. **Create Variants** - One for EACH sofa type column (typically 3):
   - **DIVANO_3_PL_MAXI** (Maxi column):
     - `sofaId`: "" (empty string)
     - `longName`: "divano_3_pl_maxi" (lowercase)
     - `seatsCount`: 3
     - `mattressWidth`: from Maxi row
     - `depth`: from Maxi row
     - `height`: from Maxi row
     - `price`: SUM of all component prices for this variant
     - `components`: Array of **COMPLETE component objects** (with id, name, price, supplier, type)
     - `pricingMode`: "components"
   
   - **DIVANO_3_PL** (3PL column):
     - Same structure, but:
     - `longName`: "divano_3_pl" (lowercase)
     - Dimensions from 3PL column
     - Component objects for 3PL variant
   
   - **DIVANO_2_PL** (2PL column):
     - Same structure, but:
     - `longName`: "divano_2_pl" (lowercase)
     - `seatsCount`: 2
     - Dimensions from 2PL column
     - Component objects for 2PL variant

3. **Map Components to Component Objects**:
   - From the price table, identify which components are used in each sofa type column
   - Match component names against cached component data from Step 2
   - Extract the **COMPLETE object** for each matched component
   - Add the fixed Transport component object for that sofa type
   - Create an array of these objects: `[{...componentObj1}, {...componentObj2}, ..., {...transportObj}]`

4. **Build Complete Variant Objects**:
   - Ensure ALL fields are present in EVERY variant
   - Calculate price as sum of all component prices
   - Validate that all required fields are non-empty/non-null

## ⚠️ CRITICAL Requirements

### SofaType Field Format
**MUST be lowercase with underscores**:
- ✅ `"divano_3_pl_maxi"`
- ✅ `"divano_3_pl"`
- ✅ `"divano_2_pl"`

❌ NOT uppercase: `"DIVANO_3_PL_MAXI"`
❌ NOT mixed case: `"Divano_3_PL_Maxi"`
❌ NOT without underscores: `"divano3plmaxi"`

### Components Array - COMPLETE Objects
**The `components` field MUST contain COMPLETE component objects**, NOT just IDs:

✅ **CORRECT**:
```json
"components": [
  {
    "id": "-OfdmKGZ3_3-WNrgI5tf",
    "name": "Fusto Redael C3205 Bagatelle Divano 3 PL Maxi",
    "price": 46,
    "type": "FUSTO",
    "supplier": { "id": "-OfdYCnlZJEJqgvXCPVu", "name": "Redael" }
  },
  {
    "id": "-Ofabu2A6s4Q_MSrInDh",
    "name": "Trasporto Divano 3 PL Maxi",
    "price": 100,
    "type": "TRASPORTO"
  }
]
```

❌ **INCORRECT** (just IDs):
```json
"components": [
  "-OfdmKGZ3_3-WNrgI5tf",
  "-Ofabu2A6s4Q_MSrInDh"
]
```

❌ **INCORRECT** (missing fields):
```json
"components": [
  {
    "id": "-OfdmKGZ3_3-WNrgI5tf",
    "name": "Fusto Redael..."
  }
]
```

### All Variant Fields MUST be Present
Every variant must have ALL of these fields, in this order:
1. `sofaId` - Empty string ""
2. `longName` - Lowercase sofa type (divano_3_pl_maxi, divano_3_pl, divano_2_pl)
3. `seatsCount` - 3 or 2
4. `mattressWidth` - Number from dimensions table
5. `depth` - Number from dimensions table
6. `height` - Number from dimensions table
7. `price` - Sum of component prices
8. `components` - Array of COMPLETE component objects
9. `pricingMode` - Always "components"

**MISSING ANY FIELD = INVALID VARIANT**

## Fixed Transport Components (MUST Include These!)

Always add the appropriate transport component object to the `components` array:

- **divano_3_pl_maxi**: 
```json
{
  "id": "-Ofabu2A6s4Q_MSrInDh",
  "name": "Trasporto Divano 3 PL Maxi",
  "price": 100,
  "type": "TRASPORTO"
}
```

- **divano_3_pl**: 
```json
{
  "id": "-Ofabu2A6s4Q_MSrInDi",
  "name": "Trasporto Divano 3 PL",
  "price": 90,
  "type": "TRASPORTO"
}
```

- **divano_2_pl**: 
```json
{
  "id": "-Ofabu2A6s4Q_MSrInDj",
  "name": "Trasporto Divano 2 PL",
  "price": 70,
  "type": "TRASPORTO"
}
```

## Data Model: Variant
```typescript
{
  // id: string; // OMITTED (Auto-generated)
  sofaId: string; // "" (empty string)
  longName: string; // LOWERCASE: "divano_3_pl_maxi" | "divano_3_pl" | "divano_2_pl"
  seatsCount: number; // 3 for Maxi/3PL, 2 for 2PL
  mattressWidth: number; // from Image 2 Dimensions Table
  depth: number; // from Image 2 Dimensions Table
  height: number; // from Image 2 Dimensions Table
  price: number; // Sum of all component prices
  components: Component[]; // COMPLETE component objects - [{id, name, price, type, supplier?}, ...]
  pricingMode: "components"; // Always this string
}
```

## Data Model: Component (within Variant)
```typescript
{
  id: string;
  name: string;
  price: number;
  type: string; // UPPERCASE enum value (e.g., "FUSTO", "GOMMA", "TRASPORTO")
  supplier?: { id: string, name: string }; // Optional, omit for TRASPORTO
}
```

## Output Format
Return **ONLY** a valid JSON array in a code block.
**DO NOT** include the `id` field at variant level.

**Filename**: `variants.json`

```json
[
  {
    "sofaId": "",
    "longName": "divano_3_pl_maxi",
    "seatsCount": 3,
    "mattressWidth": 190,
    "depth": 97,
    "height": 92,
    "price": 733.43,
    "components": [
      {
        "id": "-OfdmKGZ3_3-WNrgI5tf",
        "name": "Fusto Redael C3205 Bagatelle Divano 3 PL Maxi",
        "price": 46,
        "type": "FUSTO",
        "supplier": { "id": "-OfdYCnlZJEJqgvXCPVu", "name": "Redael" }
      },
      {
        "id": "-OfdmKSGiVY2DjbeRrzY",
        "name": "Gomma Diflex Bagatelle Divano 3 PL Maxi",
        "price": 135.97,
        "type": "GOMMA",
        "supplier": { "id": "-OfdYCo6LjM3gxk5Erpr", "name": "Diflex" }
      },
      {
        "id": "-Ofabu2A6s4Q_MSrInDh",
        "name": "Trasporto Divano 3 PL Maxi",
        "price": 100,
        "type": "TRASPORTO"
      }
    ],
    "pricingMode": "components"
  },
  {
    "sofaId": "",
    "longName": "divano_3_pl",
    "seatsCount": 3,
    "mattressWidth": 180,
    "depth": 97,
    "height": 92,
    "price": 700.50,
    "components": [
      {
        "id": "-OfdmKGZ3_3-WNrgI5tf",
        "name": "Fusto Redael C3205 Bagatelle Divano 3 PL",
        "price": 45,
        "type": "FUSTO",
        "supplier": { "id": "-OfdYCnlZJEJqgvXCPVu", "name": "Redael" }
      },
      {
        "id": "-Ofabu2A6s4Q_MSrInDi",
        "name": "Trasporto Divano 3 PL",
        "price": 90,
        "type": "TRASPORTO"
      }
    ],
    "pricingMode": "components"
  },
  {
    "sofaId": "",
    "longName": "divano_2_pl",
    "seatsCount": 2,
    "mattressWidth": 140,
    "depth": 97,
    "height": 92,
    "price": 650.25,
    "components": [
      {
        "id": "-OfdmKGZ3_3-WNrgI5tf",
        "name": "Fusto Redael C3205 Bagatelle Divano 2 PL",
        "price": 42,
        "type": "FUSTO",
        "supplier": { "id": "-OfdYCnlZJEJqgvXCPVu", "name": "Redael" }
      },
      {
        "id": "-Ofabu2A6s4Q_MSrInDj",
        "name": "Trasporto Divano 2 PL",
        "price": 70,
        "type": "TRASPORTO"
      }
    ],
    "pricingMode": "components"
  }
]
```

## NEXT STEP
**STOP HERE**. Do not proceed to Step 4 (SofaProduct) until the user provides:

1. ✅ **Variant IDs** - The database IDs generated after importing `variants.json`
2. ✅ **Technical Sheet Image** (Scheda Tecnica) - Contains seduta, schienale, meccanica, materasso
3. ✅ **Extra Mattresses Image** (Materassi Extra) - Table with optional mattresses and prices
4. ⚠️ **Extra Mechanisms Image** (OPTIONAL) (Meccanismi Extra) - Table with optional mechanisms and prices

Once the user provides these inputs, proceed to Step 4 (SofaProduct).

