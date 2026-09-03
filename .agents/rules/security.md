# Security & Privacy Rules

The VoterSearch application processes voter records and electoral information. Strictly adhere to these security requirements.

## Privacy & Personally Identifiable Information (PII)

1. **PII Masking**: Mask sensitive personal identifiers (such as national IDs, complete phone numbers, or private dates of birth) in logs, crash reports, and public client interfaces.
2. **Access Control**: Public endpoints must only expose publicly disclosable voter roll information according to relevant jurisdiction election laws.
3. **Audit Trails**: Ensure administrative search operations or bulk data exports produce audit records with timestamp, operator ID, and queried criteria.

## Injection & Parameterization

1. **SQL / NoSQL Queries**: Never concatenate raw strings into queries. Always use parameterized queries, prepared statements, or ORM parameter binding to prevent injection attacks.
2. **Input Sanitization**: Sanitize search inputs against XSS and script injection before rendering in HTML or generating reports.

## Secrets & Credentials

1. Never commit `.env` files, API keys, tokens, or database passwords to version control.
2. Store configuration secrets using environment variables or dedicated secret management systems.
