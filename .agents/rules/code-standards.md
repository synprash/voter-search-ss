# Coding Standards & Best Practices

These rules apply across all source code within the VoterSearch project.

## Code Quality Principles

1. **Readability & Simplicity**: Favor clear, self-explanatory variable and function names over brevity or cryptic abbreviations.
2. **Modular Architecture**: Separate data access, business logic, and presentation layers cleanly. Avoid monolithic files exceeding 400 lines of code.
3. **Type Safety & Validation**:
   - Use explicit typing where supported.
   - Validate all external inputs and query parameters at API and CLI boundaries before processing.
4. **Error Handling**:
   - Use structured error responses with clear codes and sanitized user-facing messages.
   - Never swallow exceptions silently without appropriate logging.

## Testing Guidelines

- Write unit tests for core domain logic and search algorithms.
- Ensure test suites are fast, deterministic, and mock external service calls.
- Include edge cases: empty search inputs, special characters, accented letters, and pagination boundaries.
