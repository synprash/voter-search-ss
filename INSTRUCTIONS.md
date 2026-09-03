# VoterSearch: Developer & Operating Instructions

This guide provides technical onboarding, development workflows, and customization guidelines for **VoterSearch**.

---

## 1. Quick Start

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build
```bash
npm run build
npm start
```

---

## 2. Key Documentation Links

- **Requirements & Specifications**: [REQUIREMENTS.md](file:///REQUIREMENTS.md)
- **Operational Runbooks & Skills**:
  - [VoterSearch Workflows Skill](file:///.agents/skills/votersearch-workflows/SKILL.md) (PDF extraction, OCR geometry, bilingual merging, Supabase)
  - [Git Workflow Skill](file:///.agents/skills/git-workflow/SKILL.md) (branching, conventional commits)
- **Agent Operating Rules**: [AGENTS.md](file:///AGENTS.md)
- **Coding Standards**: [.agents/rules/code-standards.md](file:///.agents/rules/code-standards.md)
- **Security & PII Rules**: [.agents/rules/security.md](file:///.agents/rules/security.md)
- **Supabase Migration**: [supabase/migrations/20260903000000_init_bilingual_voter_schema.sql](file:///supabase/migrations/20260903000000_init_bilingual_voter_schema.sql)

---

## 3. Data Pipeline & Extraction

The application includes a native Apple Vision OCR extraction tool and bilingual alignment script:

1. **Compile Native OCR Parser**:
   ```bash
   swiftc -O scripts/parse_pdf_to_json.swift -o scripts/parse_tool
   ```

2. **Extract New PDF**:
   ```bash
   ./scripts/parse_tool "raw-files/Booth No 158-English.pdf" src/lib/data/booth-158-english-raw.json
   ```

3. **Rebuild Bilingual Dataset**:
   ```bash
   node scripts/build_bilingual_dataset.js
   ```

---

## 4. Connecting to Supabase

1. Open your project on [Supabase](https://supabase.com).
2. Execute the migration SQL in [init_bilingual_voter_schema.sql](file:///supabase/migrations/20260903000000_init_bilingual_voter_schema.sql).
3. Create `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
*(Note: If no credentials are provided, the app continues to operate seamlessly using the 1,263-elector local seed dataset).*
