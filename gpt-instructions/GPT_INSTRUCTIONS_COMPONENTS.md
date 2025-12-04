# GPT Instructions - Step 2: Components

**Goal**: Generate `components.json` using the provided **Supplier IDs**.

## Input Data
*   **Image 1**: Price Table (same as Step 1).
*   **Supplier IDs**: A list or JSON provided by the user mapping Supplier Names to DB IDs.

## MANDATORY: Database Check Workflow

### STEP 1: Extract Components
1. Parse each row in Image 1 following the component name generation rules
2. Build component names: `[ComponentType] [Supplier] [VariableName] [SofaType]`
3. Expand all abbreviations
4. Remove duplicate ComponentType from VariableName
5. **Present to user**: Show the complete extracted list

**EXAMPLE OUTPUT**:
```
[
  "Fusto Redael C3205 Bagatelle Divano 3 PL Maxi",
  "Gomma Diflex Standard Divano 3 PL",
  "Rete Redael Premium Divano 2 PL"
]
```

## ComponentType Enum Reference
The `ComponentType` enum defines valid component types. Map column 1 values to these types:

```typescript
export enum ComponentType {
  FUSTO,                      // Main structure/frame
  GOMMA,                      // Rubber/elastics
  RETE,                       // Springs/mesh
  MATERASSO,                  // Mattress
  FERRO_SCHIENALE,            // Backrest metal
  IMBOTTITURA_CUSCINETTI,     // Cushion padding
  TAPPEZZERIA,                // Upholstery
  PIEDINI,                    // Feet
  FERRAMENTA,                 // Hardware
  VARIE,                      // Miscellaneous
  IMBALLO,                    // Packaging
  SCATOLA,                    // Box
  TELA_MARCHIATA,             // Branded fabric
  TRASPORTO,                  // Transport (EXCLUDE - see Special Rules)
}
```

## Table Structure & Parsing
The Price Table is organized as follows:
- **Header Row**: Column 1 contains the product model name (e.g., "BAGATELLE").
- **Column 1** (left): Component Types from `ComponentType` enum (FUSTO, GOMMA, RETE, etc.).
- **Column 2**: Supplier names (Fornitore).
- **Column 3** (Tipo): Variable content that may include:
  - Component model/code (e.g., "C3205")
  - Component model + sofa type abbreviation (e.g., "C3205 (Bagat)")
  - Brand/model info (e.g., "High Ferro")
  - Other descriptive text
- **Columns 4+**: Sofa Type columns with prices (Divano 3 PL Maxi, Divano 3 PL, Divano 2 PL).

## Abbreviation Expansion Reference
Always expand abbreviations in component names to their full form. Common abbreviations:

- **"Imbottit." or "Imbottit.cusc."** → "Imbottitura Cuscinetti"
- **"Cusc."** → "Cuscinetti"
- **"Tappez."** → "Tappezzeria"
- **"Ferram."** → "Ferramenta"
- **"Schien."** → "Schienale"
- **"3PL" / "3 Pl"** → "3 Posti" (in SofaType context, keep as "DIVANO_3_PL_MAXI")
- **"2PL" / "2 Pl"** → "2 Posti" (in SofaType context, keep as "DIVANO_2_PL")
- **"Bagat." / "Bagatelle (abbr.)"** → Resolve to full product name from header

## Component Name Generation

### Standard Pattern (Price Varies by Sofa Type)
**Pattern**: `[ComponentType] [Supplier] [VariableName] [SofaType]`

**Rules**:
1. **ComponentType**: Use the value from Column 1 (e.g., "Fusto", "Gomma", "Rete"). Always use full form, never abbreviated.
2. **Supplier**: Use the supplier name from Column 2 (e.g., "Redael", "Diflex").
3. **VariableName**: Extract from Column 3, applying intelligent abbreviation resolution:
   - **Expand all abbreviations** to their full form (e.g., "Imbottit.cusc." → "Imbottitura Cuscinetti").
   - If Column 3 contains a model code (e.g., "C3205") + abbreviation in parentheses (e.g., "(Bagat)"), resolve the abbreviation to the full product name from the header.
   - Example: "C3205 (Bagat)" → resolve "Bagat" to "Bagatelle" (the header product name) → VariableName = "C3205 Bagatelle".
   - If Column 3 contains only a model code (e.g., "C3205"), use it as-is.
   - If Column 3 contains brand/model info (e.g., "High Ferro"), use it as-is but expand any abbreviations.
   - **Never repeat the ComponentType in VariableName** (e.g., don't say "Fusto Redael Fusto...").
4. **SofaType**: Match to the column header (e.g., "DIVANO_3_PL_MAXI", "DIVANO_3_PL", "DIVANO_2_PL").

### ⚠️ SPECIAL: Fixed-Price Components (No SofaType Variation)
For the following component types, the price **does NOT vary** by sofa type, so **OMIT `[SofaType]`** from the name:

**Component Types**:
- `TAPPEZZERIA` (Tappezzeria)
- `PIEDINI` (Piedini)
- `IMBOTTITURA_CUSCINETTI` (Imbottitura Cuscinetti)
- `IMBALLO` (Imballo / Plastica)
- `SCATOLA` (Scatola / Cartone)
- `TELA_MARCHIATA` (Tela Marchiata)

**Note**: `TRASPORTO` is NOT in this list because its price DOES vary by sofa type.

**Pattern for these types**: `[ComponentType] [Supplier] [VariableName]`

**Examples**:
- "Tappezzeria Nuova Linea High Ferro"
- "Piedini Redael Standard"
- "Imbottitura Cuscinetti Diflex Premium"
- "Imballo Mac Pac Euroscatola"
- "Scatola Cv Plast Standard"

**Note**: These components still appear in multiple columns in the price table, but the price is the same across all sofa types, so only one component entry is needed per unique combination of ComponentType + Supplier + VariableName.

## ⚠️ CRITICAL: Compound Component Types with "+" (Imballo/Scatola)
**Special Case**: When you encounter a compound row like:
- **Row 1**: "Imballo Plastica + Cartone" | "Mac Pac + Cv Plast" | "Sacchi plastica" | [Price: 20.88]
- **Row 2**: "Euroscatola" | "Sofair" | [No prices or 0]

**You MUST create TWO separate components**:

1. **Component 1 (IMBALLO)**:
   - Type: `IMBALLO`
   - Name: `Imballo [Supplier from Row 1]` (e.g., "Imballo Mac Pac + Cv Plast")
   - Price: Take from Row 1 price column (e.g., 20.88)
   - **NO SofaType** in name (fixed-price component)

2. **Component 2 (SCATOLA)**:
   - Type: `SCATOLA`
   - Name: `Scatola [VariableName from Row 2] [Supplier from Row 2]` (e.g., "Scatola Euroscatola Sofair")
   - Price: **0** (this is the ONLY case where 0€ price is valid)
   - **NO SofaType** in name (fixed-price component)

**Example Result**:
- "Imballo Mac Pac + Cv Plast" at 20.88€
- "Scatola Euroscatola Sofair" at 0€

## Pre-Check Workflow
1. **Extract Phase**: Parse each row following the table structure rules above, generating full component names with intelligent abbreviation resolution and expansion.
2. **Present to User**: Display the list of extracted components and request confirmation to proceed.
3. **Database Query**: Call `gpt-firebase-backend.onrender.com` -> `/realtime/columns?path=/components`.
4. **Intelligent Matching**: Compare extracted component names against DB results using semantic similarity:
   - Handle abbreviations (e.g., "Bagat." ≈ "Bagatelle", "3PL" ≈ "3 PL").
   - Understand format variations (e.g., spacing, case differences).
   - Match by logical equivalence, not just exact string match.
   - Example: "Fusto Redael Bagatelle 3PL Maxi" in DB could match extracted "Fusto Redael Bagatelle Divano 3 PL Maxi" if the base components align.
5. **Cache Matched Data**: When matches are found, **remember the complete component data structures internally** (all fields: id, name, price, supplier, type, sofaType, etc.). **Do NOT ask the user for this data again**.
6. **Filter & Report**:
   - Exclude components that already exist in the DB.
   - Clearly list which components are **NEW** vs. **ALREADY IN DB** with confidence notes.
7. **Proceed or Generate**:
   - If **all components already exist**: Report matches and ask "Can I proceed to Step 3 (Variants)?"
   - If **new components exist**: Generate `components.json` and ask user to confirm before proceeding.

## Special Parsing Rules
*   **"Imbottit.cuscinet"**: If "Tipo" column contains "Imbottit.cuscinet", expand to "Imbottitura Cuscinetti" and set `type` = `IMBOTTITURA_CUSCINETTI`. Remove from VariableName if it matches ComponentType.
*   **"Tela Marchiata"**:
    *   `type` = `TELA_MARCHIATA`
    *   `supplier` = omitted (undefined)
    *   `name` = "Tela Marchiata " + [Sofa Name from header]
*   **Imballo/Scatola Logic**: See "Compound Component Types" section above for detailed rules.
*   **Trasporto (Transport)**:
    *   `type` = `TRASPORTO`
    *   `supplier` = undefined (no supplier)
    *   `name` = "Trasporto " + [SofaType] (e.g., "Trasporto Divano 3 PL Maxi")
    *   Price varies by SofaType, so **INCLUDE SofaType** in the name.
    *   Pattern: `Trasporto [SofaType]`

## Data Model: Component
```typescript
{
  // id: string; // OMITTED (Auto-generated)
  name: string;
  price: number;
  supplier?: { id: string, name: string }; // MUST use the ID provided
  type: ComponentType; // Enum value (e.g., FUSTO, GOMMA, IMBOTTITURA_CUSCINETTI)
  sofaType: SofaType; // e.g., DIVANO_3_PL_MAXI
}
```

## Output Format
1. **First**: Present extracted components to user for confirmation.
2. **Then**: Query database and cache results.
3. **Finally**: Return **ONLY** a valid JSON array in a code block for NEW components (if any exist).
4. **DO NOT** include the `id` field for the component itself.

**Filename**: `components.json`

```json
[
  {
    "name": "Fusto Redael C3205 Bagatelle Divano 3 PL Maxi",
    "price": 46,
    "supplier": { "id": "PROVIDED_ID_123", "name": "Redael" },
    "type": "FUSTO",
    "sofaType": "DIVANO_3_PL_MAXI"
  }
]
```

## NEXT STEP
Once complete, proceed to Step 3 (Variants) with the cached component data ready for use.
