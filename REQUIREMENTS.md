# VoterSearch: System Requirements Specification (SRS)

This document establishes the official functional, technical, and operational requirements for the **VoterSearch** application.

---

## 1. Project Overview & Objectives

**VoterSearch** is a fast, privacy-conscious, bilingual web application designed to search, filter, and inspect electoral roll data for Maharashtra Legislative Assembly Constituency **118 - Chandwad (GEN)** and Parliamentary Constituency **20 - Dindori (ST)**, covering Booths **157** and **158**.

### Core Goals
- Enable instantaneous search across 1,200+ electors in both **English** and **Marathi (Devanagari)** scripts.
- Support dual browsing modes: a high-density **Table View** and a **Household / Family Tree View**.
- Provide official, printable **Voter Information Slips** with polling station directions.
- Ingest and normalize scanned image PDF electoral rolls via a native OCR pipeline into a structured PostgreSQL/Supabase database.

---

## 2. Functional Requirements

### 2.1 Bilingual Search & Querying
- **FR-1.1 Unified Search**: The search engine must match queries against:
  - English Elector Name (`voter_name_en`)
  - Marathi Elector Name (`voter_name_mr`)
  - Relative Name in English & Marathi (`relative_name_en`, `relative_name_mr`)
  - EPIC / Voter ID Card Number (`epic_no`, exact and partial prefix matching)
  - House Number & Locality Address (`house_no`, `address_en`, `address_mr`)
  - Serial Number within Part (`serial_no`)
  - Household / Family ID (`family_id`)
- **FR-1.2 Debounced Instant Search**: Search queries must execute client-side with sub-50ms latency using Zustand and in-memory indexing, with API route fallback.

### 2.2 UI Language Switcher (i18n)
- **FR-2.1 Three Display Modes**:
  1. **English**: All UI headers, filters, buttons, and elector names rendered in English.
  2. **Marathi (मराठी)**: All UI labels and elector names rendered in Marathi Devanagari script.
  3. **Bilingual (दोन्ही)**: Simultaneous rendering showing English names with Marathi script underneath.
- **FR-2.2 State Persistence**: Language selection must be managed via Zustand and persist across filter and view mode toggles.

### 2.3 Filtering & Facets
- **FR-3.1 Booth / Part Selector**: Filter by All Booths, Booth 158 (Chandwad), or Booth 157 (Chandwad).
- **FR-3.2 Household ID**: Direct numeric filter for a specific family/household unit (e.g. `#160`).
- **FR-3.3 Gender Facet**: Filter by All, Male (`पुरुष`), Female (`महिला`), or Third Gender (`तृतीय पंथी`).
- **FR-3.4 Age Brackets**: Filter by standard demographic brackets: `18–25`, `26–40`, `41–60`, and `61+`.
- **FR-3.5 Filter Reset**: One-click action to clear all active search terms and facet filters.

### 2.4 Presentation Views
- **FR-4.1 Table View**:
  - Columns: Household #, Serial #, Voter Name, EPIC ID, Age, Gender, Relation, Relative Name, Address, Actions.
  - Sticky table headers with responsive horizontal scroll for mobile and desktop.
  - One-click copy-to-clipboard for EPIC card numbers with visual confirmation toast.
  - Pagination controls (25 electors per page) with record count indicators.
- **FR-4.2 Household / Family Tree Cards View**:
  - Groups electors sharing the same `family_id`.
  - Header displays Household Number, primary address, and member count badge.
  - Member tiles show relationship role (`Head`, `Spouse`, `Son/Daughter`, `Member`), age, gender, and EPIC.
- **FR-4.3 Printable Voter Slip Modal**:
  - Official Election Commission styled slip showing Polling Station name, address, section, serial number, and EPIC.
  - Print button executing print-optimized CSS (`window.print()`) that renders only the slip card.

### 2.5 Data Export
- **FR-5.1 CSV Export**: Export current filtered search results to UTF-8 CSV with bilingual headers and BOM support for Microsoft Excel compatibility.

---

## 3. Data & Extraction Pipeline Requirements

### 3.1 Input Sources
- Scanned PDF rolls located in `raw-files/`:
  - `Booth No 158-English.pdf` & `Booth No 158-Marathi.pdf` (604 electors)
  - `Booth No 157-English.pdf` & `Booth No 157-Marathi.pdf` (659 electors)

### 3.2 OCR & Ingestion Pipeline
- **DR-2.1 Native OCR**: High-accuracy text recognition via macOS native Apple Vision framework (`VNRecognizeTextRequest`) using `scripts/parse_pdf_to_json.swift`.
- **DR-2.2 Grid Mathematical Normalization**:
  - Voter rolls are laid out in a 3-column × 10-row grid per page.
  - Column index: `col = floor((midX - 0.02) / 0.32)`
  - Row index: `row = floor((0.965 - midY) / 0.0915)`
- **DR-2.3 Bilingual Alignment**:
  - Pair English and Marathi records using elector `serial_no` (1..N) and normalized `epic_no`.
  - Compile merged records into `src/lib/data/seed-voters.json` and booth metadata in `src/lib/data/seed-booths.json`.

---

## 4. Technical Architecture & Stack

| Layer | Technology | Specification |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3+ (App Router) | React 19, TypeScript 5, Turbopack |
| **Styling** | Tailwind CSS v4 | Responsive utility classes + `@media print` rules |
| **State Store** | Zustand 5 | Client-side search filters, view modes, and language state |
| **Database** | PostgreSQL / Supabase | GIN full-text indexes, UUID primary keys, connection pooling |
| **Extraction** | Swift + Apple Vision | Zero-dependency native macOS OCR tool |
| **Deployment** | Vercel Platform | Zero build warnings, edge-compatible static & dynamic routes |

---

## 5. Security & Privacy Requirements

- **SR-1 PII Protection**: Never expose private contact numbers or unmasked identification data beyond standard public electoral roll fields.
- **SR-2 Read-Only Enforcement**: Database connection roles for public lookup must operate with read-only permissions (`SELECT`).
- **SR-3 Parameterized Queries**: All Supabase database queries must use prepared statements or the Supabase client query builder to eliminate SQL injection vulnerabilities.
- **SR-4 Secret Hygiene**: Supabase Service Role keys must never be exposed to the client bundle. Only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is allowed on the client.
