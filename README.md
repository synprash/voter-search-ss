# VoterSearch (मतदार शोध प्रणाली)

A fast, bilingual electoral roll lookup and voter search application for Maharashtra Legislative Assembly Constituency **118 - Chandwad (GEN)** and Parliamentary Constituency **20 - Dindori (ST)**, covering Booths **157** and **158**.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Zustand**, and **Supabase / PostgreSQL**, deployed for **Vercel**.

---

## Key Features

- **Bilingual Search Engine**: Search instantaneously in English (`Ambekar`, `Ranjana`), Marathi (`अंबेकर`, `रंजना`), EPIC Card ID (`TTZ6434856`), House Number, or Locality.
- **Language Switcher**: Toggle the entire application between **English**, **मराठी**, and **Bilingual (दोन्ही)** mode.
- **Dual View Modes**:
  - **Table View**: Dense, sortable table with one-click copy for EPIC IDs and quick voter slip preview.
  - **Household / Family Tree Cards View**: Group electors by family unit (`family_id`), displaying family size, hierarchy, and address.
- **Printable Elector Information Slip**: Official Election Commission styled slip with polling station address, section name, and one-click printing.
- **Dynamic Stats Ribbon**: Live metrics for Total Electors, Male Electors, Female Electors, and Households.
- **CSV Data Export**: Export search results to UTF-8 CSV with bilingual headers.
- **Zero-Dependency Native OCR**: Extracts scanned PDF electoral rolls using macOS native Apple Vision framework.

---

## Documentation & Architecture

- **System Requirements Specification**: [REQUIREMENTS.md](./REQUIREMENTS.md)
- **Developer Instructions**: [INSTRUCTIONS.md](./INSTRUCTIONS.md)
- **Operational Runbook**: [.agents/skills/votersearch-workflows/SKILL.md](./.agents/skills/votersearch-workflows/SKILL.md)
- **Git Conventions**: [.agents/skills/git-workflow/SKILL.md](./.agents/skills/git-workflow/SKILL.md)
- **Coding Standards**: [.agents/rules/code-standards.md](./.agents/rules/code-standards.md)
- **Security & Privacy Rules**: [.agents/rules/security.md](./.agents/rules/security.md)
- **Supabase Migration**: [supabase/migrations/20260903000000_init_bilingual_voter_schema.sql](./supabase/migrations/20260903000000_init_bilingual_voter_schema.sql)

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
