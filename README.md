# VoterSearch (मतदार शोध प्रणाली)

A fast, bilingual electoral roll lookup and voter search application for Maharashtra Legislative Assembly Constituency **118 - Chandwad (GEN)** and Parliamentary Constituency **20 - Dindori (ST)**, currently serving **8 Polling Stations (Booths 145, 146, 147, 148, 149, 150, 157, 158)** with **7,203+ Electors**.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Zustand**, and **Supabase / PostgreSQL**, deployed for **Vercel**.

---

## Key Features

- **Bilingual Search Engine**: Search instantaneously in English (`Ambekar`, `Ranjana`), Marathi (`अंबेकर`, `रंजना`), EPIC Card ID (`TTZ6434856`), House Number, or Locality.
- **Dynamic Database-Backed Multi-Select Filter**: Multi-select any combination of booths dynamically queried from the live database (`polling_stations` table). Automatically updates when new booths are imported.
- **Language Switcher**: Toggle the entire application between **English**, **मराठी**, and **Bilingual (दोन्ही)** mode.
- **Dual View Modes**:
  - **Table View**: Dense, sortable table with one-click copy for EPIC IDs, mobile numbers, and quick voter slip preview.
  - **Household / Family Tree Cards View**: Group electors by family unit (`family_id`), displaying family size, hierarchy, and address.
- **Printable Elector Information Slip**: Official Election Commission styled slip with polling station address, section name, and one-click printing.
- **Dynamic Stats Ribbon**: Live metrics for Total Electors, Male Electors, Female Electors, and Households with active booth tags.
- **CSV Data Export**: Export filtered search results to UTF-8 CSV with bilingual headers.
- **Autonomous Ingestion Pipeline**: Native Apple Vision + Tesseract OCR zero-intervention pipeline for importing scanned booth PDF rolls.

---

## Automated Electoral Roll Importing Guide

The repository includes an autonomous, end-to-end ingestion pipeline (`scripts/auto_ingest_pipeline.js`) that imports scanned electoral roll PDFs with **zero manual intervention**.

### 1. How the Pipeline Works

```
raw-files/ (Drop PDFs here)
      │
      ▼
1. Pair Detection: Scans raw-files/ and pairs English & Marathi PDFs by booth number
      │
      ▼
2. Zero Duplicate Work: Queries Supabase and automatically skips already-imported booths
      │
      ▼
3. Metadata Extraction: Extracts Polling Station Name, Address, and Section from Page 1
      │
      ▼
4. English Vision OCR: Native Apple Vision text recognition parses English elector boxes
      │
      ▼
5. Marathi Tesseract OCR: Rasterizes pages & runs Tesseract (mar) with Devanagari transliteration fallback
      │
      ▼
6. Bilingual Merge & Clustering: Merges records by serial number and computes family_id clusters
      │
      ▼
7. Database Batch Upsert: Inserts into Supabase voters table (200/chunk) and updates polling_stations stats
      │
      ▼
8. Sync Local Seed: Updates seed-voters.json, seed-polling-stations.json, and seed-booths.json
      │
      ▼
9. Audit Logging: Records trigger timestamp, elector counts, duration, and status in logs/ingestion_audit_log.json
```

### 2. PDF File Naming Convention

Place your scanned voter roll PDFs inside the `raw-files/` directory. Files must contain the **Booth Number** and the language (`English` or `Marathi`):

```text
raw-files/
├── Booth No 151 - English.pdf
├── Booth No 151 - Marathi.pdf
├── Booth No 152 - English.pdf
└── Booth No 152 - Marathi.pdf
```

*(The scanner supports formats such as `Booth No 151 - English.pdf`, `Booth_151_Marathi.pdf`, `Part 151 English.pdf`, etc.)*

### 3. Importing Commands

#### Mode A: On-Demand CLI Import
To scan `raw-files/` and import all pending booths immediately:
```bash
npm run import:raw
```

**Advanced CLI Flags:**
- **Preview without database changes (Dry Run):**
  ```bash
  npm run import:raw -- --dry-run
  ```
- **Import a specific booth only:**
  ```bash
  npm run import:raw -- --booth 151
  ```
- **Force re-extraction and re-import of existing booths:**
  ```bash
  npm run import:raw -- --force
  ```

#### Mode B: Continuous File Watcher (Zero Intervention)
Keep this command running in a terminal session. Whenever you drag & drop or copy new booth PDFs into `raw-files/`, the pipeline will automatically detect them, wait for the copy to finish (4s debounce), and ingest all data:
```bash
npm run watch:raw
```

#### Mode C: View Ingestion Audit Log
Display a clean table of all previous ingestion runs, trigger types, duration, and number of imported electors:
```bash
npm run audit:log
```

### 4. Audit Log Records

Every import event is recorded with complete metadata in [`logs/ingestion_audit_log.json`](./logs/ingestion_audit_log.json):

```json
{
  "id": "ingest-1788782816814",
  "timestamp": "2026-09-07T12:06:57.000Z",
  "triggerType": "CLI_ON_DEMAND",
  "boothsDetected": [145, 146, 147, 148, 149, 150, 151, 157, 158],
  "boothsAlreadyImported": [145, 146, 147, 148, 149, 150, 157, 158],
  "boothsImported": [151],
  "recordsImported": {
    "total": 980,
    "male": 510,
    "female": 470,
    "boothBreakdown": {
      "151": { "total": 980, "male": 510, "female": 470 }
    }
  },
  "durationSeconds": 64.2,
  "status": "SUCCESS"
}
```

---

## Database Architecture

The application uses a normalized relational schema in Supabase PostgreSQL:

1. **`assemblies` Table**:
   - Stores constituency details (`assembly_no: 118`, `assembly_name_en: "Chandwad"`, `assembly_name_mr: "चांदवड"`, parliamentary details).
2. **`polling_stations` Table**:
   - Stores polling booth details (`part_no`, `station_name_en`, `station_name_mr`, `station_address_en`, `station_address_mr`, `total_electors`, `male_electors`, `female_electors`).
3. **`voters` Table**:
   - Stores elector records normalized with foreign keys `assembly_id` (FK to `assemblies.id`) and `polling_station_id` (FK to `polling_stations.id`).
4. **`voters_view`**:
   - High-performance joined view joining `voters`, `assemblies`, and `polling_stations` for zero-overhead client queries.

---

## Getting Started

### 1. Install Dependencies & Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 2. Build for Production
```bash
npm run build
npm start
```

---

## Documentation & Architecture References

- **Operational Runbook**: [.agents/skills/votersearch-workflows/SKILL.md](./.agents/skills/votersearch-workflows/SKILL.md)
- **Git Conventions**: [.agents/skills/git-workflow/SKILL.md](./.agents/skills/git-workflow/SKILL.md)
- **Coding Standards**: [.agents/rules/code-standards.md](./.agents/rules/code-standards.md)
- **Security & Privacy Rules**: [.agents/rules/security.md](./.agents/rules/security.md)

