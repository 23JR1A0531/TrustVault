# TrustVault

## Secure Document Sharing Platform

TrustVault is a role-based document-sharing application designed to control access to sensitive documents. It uses a Flask backend, MySQL database, and React frontend.

## Core Goals

- Authenticate users and enforce server-side authorization.
- Allow document owners to share documents with individual users, groups, and departments.
- Support read and edit permissions.
- Revoke access when the relevant user or group membership changes.
- Record security-relevant actions in an audit log.
- Test unauthorized access and permission boundaries.

## Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Python, Flask
- **Database:** MySQL
- **Authentication:** JWT
- **Version control:** Git and GitHub

## Repository Structure

```text
TrustVault/
├── backend/
│   ├── app.py
│   ├── config.py
│   └── database/
│       ├── schema.sql
│       ├── migration_001.sql
│       ├── migration_002.sql
│       └── migration_003_department_document_permissions.sql
├── frontend/
│   └── src/
├── README.md
├── PROMPTS.md
└── THREATS.md
```

## Local Setup

### 1. Prerequisites

Install Python, Node.js with npm, and MySQL.

### 2. Configure environment variables

Create a `.env` file in the project root. Configure the database connection and application/JWT secrets using the variable names expected by `backend/config.py`.

Do not commit `.env` or real credentials.

### 3. Set up the database

Create the `trustvault` database in MySQL. Review `backend/database/schema.sql` and apply the migrations in order:

1. `migration_001.sql`
2. `migration_002.sql`
3. `migration_003_department_document_permissions.sql`

Apply each migration only once, and verify the resulting schema.

### 4. Install backend dependencies

Activate your Python virtual environment and install the dependencies required by the backend. If a dependency file is added to the repository, use it to reproduce the environment.

### 5. Start the backend

From the repository root, run:

```powershell
python .\backend\app.py
```

The local API is expected at `http://127.0.0.1:5000`.

### 6. Start the frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Use the URL printed by Vite.

## API Areas

The backend currently includes routes for authentication, departments, department membership, groups, group membership, document management, document permissions, and audit logs. Consult `backend/app.py` for the implemented route definitions and accepted request formats.

## Security Notes

- Authorization must be enforced on the server for every protected request.
- A hidden frontend control is not an access-control mechanism.
- Membership removal must prevent future access that depended on that membership.
- Secrets, uploaded documents, and local test credentials must not be committed.
- Audit-log integrity and authorization boundaries require dedicated tests.

## Current Verification

During local development, the following checks were performed:

- Flask health endpoint reported a successful database connection.
- Admin and owner authentication worked.
- Department-based read permission was granted to a document.
- A department member could list and read the document.
- After that user's department membership was removed, the direct document request was denied.
- Group-based read permission grant returned success.

These are manual development checks, not a complete automated security test suite. Group revocation, search, audit-chain verification, and broader automated tests remain to be verified.

## Development Status

TrustVault is under active development. Do not treat this repository as production-ready until the remaining security tests, error handling, configuration review, and end-to-end tests are complete.