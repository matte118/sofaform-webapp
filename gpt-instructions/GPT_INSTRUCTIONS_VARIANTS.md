# GPT Instructions - Step 3: Variants

**Goal**: Generate `variants.json` using the provided **Component Data**.

## Input Data
*   **Image 1**: Price Table (for composition) from Step 1.
*   **Image 2**: **Dimensions Table** (for `mattressWidth`, `depth`, `height`).
*   **Component Data**: Complete component objects from the database (with id, name, price, supplier, type, sofaType).

## Instructions
1.  Create one `Variant` for each column in the Price Table (typically 3: Maxi, 3PL, 2PL).
2.  **Map Components**:
    *   Use the **complete Component objects** from the database to populate the `components` array.
    *   **CRITICAL**: The `components` array must contain **full Component objects**, NOT just IDs.
    *   Each component object must include: `id`, `name`, `price`, `supplier` (if applicable), and **`type` (in UPPERCASE)**.
    *   **CRITICAL**: Add the **Fixed Transport Component** corresponding to the sofa type (see below for complete transport component objects).
3.  **Map Dimensions** (from Image 2):
    *   Look at the "DIMENSIONS" table in Image 2.
    *   Map `Larg` (Width) -> `mattressWidth`.
    *   Map `Prof` (Depth) -> `depth`.
    *   Map `Haut` (Height) -> `height`.
    *   Ensure you map the correct column (Maxi vs 3PL vs 2PL).
4.  **Set Fields**:
    *   `longName`: MUST be a lowcamel case string of type `SofaType` (e.g., "divano_3_pl_maxi")
    *   `seatsCount`: 3 for Maxi/3PL, 2 for 2PL.
    *   `sofaId`: "" (empty string).

## Fixed Transport Components (Include these!)
You must include the appropriate transport component object in the `components` array:

**DIVANO_3_PL_MAXI**:
```json
{
  "id": "-Ofabu2A6s4Q_MSrInDh",
  "name": "Trasporto Divano 3 PL Maxi",
  "price": 100,
  "type": "TRASPORTO"
}
```

**DIVANO_3_PL**:
```json
{
  "id": "-Ofabu2A6s4Q_MSrInDi",
  "name": "Trasporto Divano 3 PL",
  "price": 90,
  "type": "TRASPORTO"
}
```

**DIVANO_2_PL**:
```json
{
  "id": "-Ofabu2A6s4Q_MSrInDj",
  "name": "Trasporto Divano 2 PL",
  "price": 70,
  "type": "TRASPORTO"
}
```

**Note**: Trasporto components do NOT have a `supplier` field.

## Data Model: Variant
```typescript
{
  // id: string; // OMITTED (Auto-generated)
  sofaId: string; // ""
  longName: SofaType; // e.g. "DIVANO_3_PL_MAXI"
  price: number; // Sum of components
  components: Component[]; // Array of COMPLETE Component objects (NOT just IDs!)
  seatsCount: number;
  mattressWidth: number; // from Image 2
  depth: number; // from Image 2
  height: number; // from Image 2
  pricingMode: "components";
}
```

## Data Model: Component (for reference)
**CRITICAL**: Components in the `components` array MUST include these 5 fields:
```typescript
{
  id: string;
  name: string;
  price: number;
  type: string; // UPPERCASE enum value (e.g., "FUSTO", "GOMMA", "TRASPORTO", "IMBOTTITURA_CUSCINETTI")
  supplier?: { id: string, name: string }; // Optional, omit for TRASPORTO
}
```

## ComponentType Values Reference
When setting the `type` field, use these uppercase enum values:

- `FUSTO` - Main structure/frame
- `GOMMA` - Rubber/elastics
- `RETE` - Springs/mesh
- `MATERASSO` - Mattress
- `FERRO_SCHIENALE` - Backrest metal
- `IMBOTTITURA_CUSCINETTI` - Cushion padding
- `TAPPEZZERIA` - Upholstery
- `PIEDINI` - Feet
- `FERRAMENTA` - Hardware
- `VARIE` - Miscellaneous
- `IMBALLO` - Packaging
- `SCATOLA` - Box
- `TELA_MARCHIATA` - Branded fabric
- `TRASPORTO` - Transport

## Output Format
Return **ONLY** a valid JSON array in a code block.
**DO NOT** include the `id` field.

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
        "name": "Fusto Redael Bagatelle Divano 3 PL Maxi",
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

