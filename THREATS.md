## TrustVault — Threat Model and Security Controls

### 1. Purpose

This document identifies security threats relevant to TrustVault, a secure document-sharing platform. It records intended controls and the current verification status. A control must not be considered fully effective until the relevant tests have passed.

### 2. Assets to Protect

- User accounts and authentication tokens
- Uploaded documents and document metadata
- Individual, group, and department permissions
- Department and group membership records
- Audit logs and their integrity
- Database credentials, JWT secrets, and application configuration

### 3. Threat Register

| ID | Threat | Potential Impact | Intended Mitigation | Verification Status |
|---|---|---|---|---|
| T01 | Unauthorized document access | Confidential documents exposed | Check authorization on every protected document request | Department-based read access tested; broader negative tests pending |
| T02 | Privilege escalation | A viewer gains owner or admin capabilities | Enforce roles and ownership on the server; do not trust client-supplied roles | Requires dedicated automated tests |
| T03 | Stale access after membership removal | Former group or department members retain access | Evaluate current membership during authorization | Department membership revocation manually tested; group revocation pending |
| T04 | Unauthorized permission changes | Users grant access without authority | Restrict permission-management routes to authorized actors | Owner restriction observed during a manual API test; broader tests pending |
| T05 | Expired or invalid authentication token | Invalid sessions access protected resources | Validate JWTs and current user status on protected routes | Login and token expiry behavior require dedicated tests |
| T06 | Unauthorized file upload | Malicious or unsupported files enter storage | Validate file type, size, and content; store files outside public web paths | Upload validation requires dedicated security tests |
| T07 | Sensitive file exposure | Private documents become publicly accessible | Use private storage and an authorized download endpoint | Requires download and storage security tests |
| T08 | Audit-log tampering | Security investigations become unreliable | Use integrity-linked audit records and restrict audit access | Audit-chain verification pending |
| T09 | Database or application secret exposure | Account takeover or data compromise | Keep secrets in environment configuration and exclude `.env` from Git | `.gitignore` includes `.env`; repository history still needs review |
| T10 | Injection or malformed input | Data exposure, corruption, or application errors | Use parameterized database queries and validate request inputs | Requires broader automated input tests |
| T11 | Cross-user permission leakage | One user's grants affect another user unexpectedly | Test ownership, individual grants, group grants, and department grants independently | Full cross-user test suite pending |
| T12 | Excessive file size or resource exhaustion | Service becomes unavailable | Enforce upload size limits and handle oversized requests safely | Requires dedicated boundary tests |

### 4. Trust Boundaries

1. **Browser to API:** All client input is untrusted. The server must authenticate the caller and authorize each protected action.
2. **API to database:** Database queries must use parameterized values. Database credentials must remain private.
3. **API to file storage:** Uploaded files must not become publicly accessible by guessing a storage path or URL.
4. **Permission relationships:** A permission is valid only when the relevant user, document, group, or department relationships are valid at request time.
5. **Audit records:** Only authorized actors should be able to inspect audit information; ordinary users must not be able to rewrite the audit history.

### 5. Security Verification Performed

The following checks were manually performed in the local development environment:

- The health endpoint reported a successful database connection.
- Admin and owner authentication succeeded.
- An owner granted `read` permission to a document for a department.
- A member of that department could list and retrieve the document.
- After the member was removed from the department, a direct document request was denied.
- An owner granted `read` permission to a group.

These results demonstrate specific behaviors only. They do not establish that the complete application is secure.

### 6. Outstanding Security Tests

- Verify that non-admin users cannot add or remove group members.
- Verify that group membership revocation immediately blocks access granted only through that group.
- Verify that individual permission revocation blocks future access.
- Verify that `read` permission cannot be used to edit or delete a document.
- Verify that viewers cannot grant permissions or modify other users' documents.
- Verify access to document downloads after permission revocation.
- Verify invalid, expired, and revoked JWT behavior.
- Verify upload type, file signature, size, and malformed-input handling.
- Verify audit hash-chain integrity and behavior after a tampered record.
- Add automated positive and negative cross-user authorization tests.

### 7. Incident Response Considerations

If unauthorized access is detected:

1. Restrict the affected account or permission.
2. Preserve relevant logs and affected document metadata.
3. Review audit records and recent permission changes.
4. Rotate compromised secrets when necessary.
5. Re-run the relevant authorization tests before restoring access.

### 8. Limitations

This threat model is a development document, not an independent security audit. The application must not be considered production-ready until outstanding tests are completed, findings are resolved, and the results are documented.