---
name: git-workflow
description: >-
  Provides standard Git branch naming, commit message conventions, and release procedures.
  Use this skill when preparing git commits, creating feature branches, opening pull requests,
  or tagging releases for the repository.
---

# Git Workflow & Standards

Use this guide for version control conventions in the VoterSearch project.

## Branching Strategy

- `main`: Production-ready branch. Only merge via reviewed pull requests.
- `develop`: Integration branch for active features.
- Feature branches: `feat/<short-description>` (e.g., `feat/fuzzy-name-search`)
- Fix branches: `fix/<short-description>` (e.g., `fix/pagination-overflow`)
- Chore branches: `chore/<short-description>` (e.g., `chore/mcp-setup`)

## Conventional Commit Format

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <short summary in imperative mood>

[optional body explaining context and rationale]

[optional footer(s) such as Closes #123]
```

### Supported Types
- `feat`: A new user-facing feature or API capability
- `fix`: A bug fix
- `docs`: Documentation changes only
- `style`: Code style changes (formatting, whitespace, no logic change)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, dependency updates, or Antigravity configs

## Pre-Commit Verification
Before committing changes, ensure:
1. All linting and formatting commands pass cleanly.
2. Unit and integration tests run with 0 failures.
3. No unwanted temporary files, secrets, or local credentials are staged (`git status`).
