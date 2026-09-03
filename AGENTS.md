# Antigravity Project Instructions & Guidelines: VoterSearch

Welcome to the **VoterSearch** project repository. This file defines the core operating instructions and behavioral guidelines for AI agents working in this codebase.

## 1. Project Overview

**VoterSearch** is an application designed to enable fast, accurate, and secure voter lookup and electoral data search across constituency registers, polling stations, and voter rolls.

## 2. Agent Operating Instructions

When executing tasks in this workspace:
- **Planning Mode**: For multi-file changes or architecture design, create and maintain an implementation plan before writing production code.
- **Code Standards**: Adhere strictly to the workspace rules defined in [.agents/rules/code-standards.md](file:///.agents/rules/code-standards.md).
- **Security & Privacy**: Treat all voter information with strict confidentiality. Follow guidelines in [.agents/rules/security.md](file:///.agents/rules/security.md). Never hardcode secrets or unmasked PII.
- **File Integrity**: Preserve existing comments, docstrings, and established architecture unless explicitly requested to refactor.
- **Verification**: Run unit tests, linting, and manual validation after making changes before completing a task.

## 3. Workspace Customizations

This repository uses the Antigravity customization structure located under `.agents/`:
- **Skills**: Modular workflows under [.agents/skills/](file:///.agents/skills/) (e.g. `votersearch-workflows`, `git-workflow`).
- **Rules**: Contextual guidelines under [.agents/rules/](file:///.agents/rules/).
- **MCP Servers**: Tool integrations declared in [.agents/mcp_config.json](file:///.agents/mcp_config.json).
- **Lifecycle Hooks**: Configured in [.agents/hooks.json](file:///.agents/hooks.json).

For developer instructions and setup steps, see [INSTRUCTIONS.md](file:///INSTRUCTIONS.md).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
