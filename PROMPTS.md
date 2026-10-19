# PROMPTS.md

## TrustVault — AI Assistance and Development Log

This file documents the AI-assisted development workflow for TrustVault. It records the kinds of prompts used, the resulting development work, and the verification needed before accepting a change.

**Important:** This is a development log, not a claim that every item below has been independently completed or tested. Update it as work progresses.

## 1. Project Planning

**Prompt objective:** Plan a secure document-sharing platform for the Snovasys Fresher Hiring Challenge.

**Development focus:**
- Define user roles and document ownership.
- Design individual, group, and department permissions.
- Require server-side authorization.
- Plan audit logging and security testing.
- Organize backend, frontend, database, and documentation work.

## 2. Backend and Database

**Prompt objective:** Build and review Flask API routes backed by MySQL.

**Development focus:**
- User registration, login, and JWT validation.
- Document upload, listing, retrieval, editing, and deletion.
- Individual document permissions.
- Group and department membership management.
- Group-based and department-based document permissions.
- Database migrations and error handling.

**Verification:** Compile the Python application, apply migrations, check database connectivity, and test each route with authorized and unauthorized users.

## 3. Authorization and Revocation

**Prompt objective:** Check that document access depends on current permissions and membership.

**Development focus:**
- Prevent users from accessing documents they do not own or have permission to read.
- Check read and edit permissions separately.
- Ensure removing a department or group membership prevents future access that depended on that membership.
- Avoid relying on frontend visibility for security.

**Manual verification performed:** Department-based document read access worked for a department member. After the member was removed from the department, a subsequent direct document request was denied.

**Remaining verification:** Group membership revocation, individual permission revocation, edit authorization, and broader cross-user negative tests.

## 4. Frontend and API Integration

**Prompt objective:** Develop a usable React interface and connect it to the Flask API.

**Development focus:**
- Authentication and dashboard.
- Document upload and management.
- Permission management.
- Group and department management.
- Audit-log views for administrators.
- Loading, validation, and API error states.

**Verification:** Confirm each UI action calls the correct API and handles success and failure responses correctly. Do not mark a page or workflow complete until it has been tested.

## 5. Security Documentation

**Prompt objective:** Identify threats and document practical mitigations.

**Development focus:**
- Broken access control and privilege escalation.
- Token expiry and account status.
- Unauthorized document downloads.
- Membership and permission revocation.
- Audit-log tampering.
- Secret and uploaded-file exposure.

See `THREATS.md` for the threat register and verification status.

## 6. Development Rules

1. Review existing code before replacing entire files.
2. Make focused changes instead of unnecessary rewrites.
3. Run syntax checks and relevant tests after changes.
4. Verify API behavior with real responses.
5. Record failed tests and corrections honestly.
6. Never include passwords, JWTs, API keys, or other secrets in commits.
7. Create meaningful Git commits after verified milestones.
8. Update this file when significant AI-assisted work or corrections occur.

## 7. Commit and Evidence Log

Record actual commit hashes and test evidence as the project progresses.

| Milestone | Evidence |
|---|---|
| Initial repository setup | Check Git history |
| Backend and frontend checkpoint | `be1cb78` — checkpoint commit |
| Department permission migration | `migration_003_department_document_permissions.sql` |
| Department read and revocation test | Manually verified during local development |
| Group permission grant | API returned success; access and revocation still require verification |
| Automated security tests | Pending verification |

## 8. Limitations

This file does not reproduce a complete transcript of every AI interaction. Add significant prompts, code-review findings, corrections, and verified outcomes as they occur. Never claim that a suggested test passed unless it was actually run and its result recorded.