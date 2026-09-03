---
name: votersearch-workflows
description: >-
  Provides end-to-end procedures for extracting scanned electoral roll PDFs, merging bilingual
  voter data, managing the Supabase database schema, configuring Zustand search filters, and
  extending the VoterSearch Next.js application. Use this skill when parsing new booth PDFs,
  modifying search algorithms, updating translations, or enhancing voter database schemas.
---

# VoterSearch Workflows & Operational Runbook

This skill provides step-by-step instructions for operating, maintaining, and extending the **VoterSearch** bilingual electoral system.

---

## 1. Electoral Roll Ingestion & Extraction Workflow

The application extracts data from scanned PDF electoral rolls located in `raw-files/` using the native macOS Apple Vision OCR tool.

### Step 1: Compiling the OCR Tool
The extraction tool is built in Swift using the system's native Vision framework:
```bash
swiftc -O scripts/parse_pdf_to_json.swift -o scripts/parse_tool
```

### Step 2: Extracting a Booth PDF
Run the tool against any booth PDF to produce raw bounding-box parsed JSON:
```bash
./scripts/parse_tool "raw-files/Booth No 158-English.pdf" src/lib/data/booth-158-english-raw.json
./scripts/parse_tool "raw-files/Booth No 157-English.pdf" src/lib/data/booth-157-english-raw.json
```

### OCR Grid Geometry Reference
Indian electoral rolls are arranged in a **3-column × 10-row grid** (30 voter cards per page).
The parser calculates row and column positions using normalized coordinates:
- **Column Formula**: `col = min(2, max(0, floor((midX - 0.02) / 0.32)))`
- **Row Formula**: `row = min(9, max(0, floor((0.965 - midY) / 0.0915)))`
- Header cutoff: `midY > 0.968` (Assembly Constituency, Section Name, Part No)
- Footer cutoff: `midY < 0.035` (Publication Date, Page Numbers)

---

## 2. Bilingual Data Alignment & Compilation

Once raw OCR JSON files are extracted, run the alignment script to pair English and Marathi records:
```bash
node scripts/build_bilingual_dataset.js
```

### Key Alignment Rules:
1. **Serial Number Parity**: Elector serial numbers (1..N) are identical between English and Marathi versions of the same booth roll.
2. **EPIC Matching**: Normalizes EPIC card numbers (e.g. `TTZ6434856`).
3. **Household Grouping**: Assigns `family_id` based on address proximity and serial grouping.
4. **Relationship Normalization**:
   - `Husband's Name` ⇄ `पतीचे नाव` ⇄ Role: `Spouse` / `पत्नी`
   - `Father's Name` ⇄ `वडिलांचे नाव` ⇄ Role: `Son/Daughter` / `मुलगा/मुलगी`
   - `Mother's Name` ⇄ `आईचे नाव`
5. **Output**: Writes verified data to:
   - `src/lib/data/seed-voters.json` (all 1,263+ voters)
   - `src/lib/data/seed-booths.json` (booth and polling station metadata)

---

## 3. Database Management & Supabase Migration

The Supabase schema supports bilingual fields with GIN full-text search indexes.

### Executing Migrations
Run the SQL migration script located at:
[`supabase/migrations/20260903000000_init_bilingual_voter_schema.sql`](file:///Users/prashantk/dev/electionapps/VoterSearch/supabase/migrations/20260903000000_init_bilingual_voter_schema.sql)

### Table Structure:
- **`booths`**: Polling station address, part number, constituency numbers and names (EN & MR), elector counts.
- **`sections`**: Polling area section names (EN & MR) mapped to booths.
- **`voters`**: Elector records with `voter_name_en`, `voter_name_mr`, `relative_name_en`, `relative_name_mr`, `epic_no`, `age`, `gender_en`, `gender_mr`, `family_id`, and `polling_station_en`.

### Offline / Local Fallback Architecture
The app operates in dual mode:
- **With Supabase**: If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are provided in `.env.local`, the client queries Supabase directly.
- **Without Supabase**: The app automatically uses the bundled `seed-voters.json` dataset seamlessly without any setup required.

---

## 4. Frontend & State Management Architecture

### Zustand Store (`src/lib/store/use-voter-store.ts`)
Controls the application state:
- `language`: `'en' | 'mr' | 'bilingual'`
- `viewMode`: `'table' | 'family'`
- `filters`: `{ query, partNo, gender, ageBracket, familyId }`
- `selectedVoter`: Active voter selected for modal preview
- `getFilteredVoters()`: Performs client-side bilingual search matching:
  - English & Marathi names
  - Relative names
  - EPIC card numbers
  - House numbers & addresses
  - Household IDs & Serial numbers

### i18n Localization (`src/lib/i18n/translations.ts`)
To add or modify UI strings, update the `translations` object for `en` and `mr`.

---

## 5. Adding New Booths to VoterSearch

To add another booth (e.g. Booth 159):
1. Place the PDF files in `raw-files/` (e.g. `Booth No 159-English.pdf` and `Booth No 159-Marathi.pdf`).
2. Run OCR:
   ```bash
   ./scripts/parse_tool "raw-files/Booth No 159-English.pdf" src/lib/data/booth-159-english-raw.json
   ```
3. Add the processing block to `scripts/build_bilingual_dataset.js`.
4. Rebuild the dataset:
   ```bash
   node scripts/build_bilingual_dataset.js
   ```
5. Rebuild and verify Next.js:
   ```bash
   npm run build
   ```
