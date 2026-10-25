# TrustVault

**Secure Document Sharing with an Auditable Access Trail**

TrustVault is a web application for uploading and managing documents, sharing them with selected users, groups, and departments, and reviewing security-relevant activity through audit logs.

> **Security note:** Never publish real admin passwords, JWT secrets, database credentials, or `.env` files in this repository. The README explains how to configure an administrator safely; it does not contain production credentials.

Live Demo

Evaluator Access

A dedicated demo administrator account will be provided for the Snovasys evaluation team.

Login URL: https://trust-vault-dusky.vercel.app

Email: yamuna1654@gmail.com

Password: Yamuna@12345

The administrator dashboard provides access to the available user-management and audit-log features. Please verify document permissions, group and department access controls, permission revocation, and audit-log integrity.

## Main Features

- User registration and login using JWT authentication.
- Role-aware access for administrators and document owners/users.
- Upload, list, download, and delete documents.
- Grant and revoke document access for an individual user by email.
- Support `read` and `edit` permission levels.
- Create and manage groups and group membership.
- Grant and revoke document access for groups.
- Create and manage departments and department membership.
- Grant and revoke document access for departments.
- Admin views for user management and audit activity.
- Audit records for supported security-relevant actions, including document deletion and permission changes.
- Audit-log verification to help detect changes to the recorded audit chain.
- File type and upload-size validation.
- Protected API routes that check authentication and authorization.

**Audit-log limitation:** The audit trail records actions that the application explicitly sends to the audit logger. It is not a guarantee that every possible system-level or database-level change is automatically captured. Audit verification can report integrity problems in the recorded chain; it cannot prevent every form of tampering.

## Technology Stack

- **Frontend:** React, Vite, JavaScript/TypeScript as used in the current frontend source.
- **Backend:** Python, Flask, Flask-JWT-Extended.
- **Database:** MySQL for the current local project.
- **HTTP/API:** REST-style Flask endpoints.
- **Version control:** Git and GitHub.
- **Deployment plan:** Frontend on Vercel; Flask backend on Render; a separately hosted MySQL database.

> The production database and hosting configuration must be completed before the deployed application can work end-to-end. A local MySQL address such as `127.0.0.1` is not reachable by a cloud-hosted backend.

## Project Structure

The repository currently follows this general structure. Confirm exact filenames in VS Code before treating this as a complete file inventory.

```text
TrustVault/
├── backend/
│   ├── app.py                 # Flask API routes and application logic
│   ├── requirements.txt       # Python dependencies
│   └── ...                    # Other backend configuration or database files, if present
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React application and UI workflows
│   │   ├── api.js             # Shared API request helper
│   │   └── ...                # Other pages/components/styles
│   ├── package.json
│   └── vite.config.*          # Vite configuration, if present
├── .gitignore
├── README.md
├── prompts.md
└── threads.md
```

## Run Locally

### 1. Backend

Open PowerShell at the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

Create/configure the backend environment file according to the variables read by `backend/app.py`. Use your own local MySQL database settings and a strong, private JWT secret. Do not commit the environment file.

Start the backend using the command supported by the current application, for example:

```powershell
python backend\app.py
```

If the app expects to be started from inside `backend`, use:

```powershell
cd backend
python app.py
```

### 2. Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

For a production build:

```powershell
npm run build
```

The production build was verified locally with Vite and generated the `frontend/dist` output directory.

## Administrator Login

1. Start the backend and make sure the database schema is initialized.
2. Create or seed an administrator account using the project's supported setup/seed process.
3. Open the website and sign in with that administrator account.
4. Confirm that the returned account role is `admin` and that the admin-only user/audit pages are visible.

**Do not rely on a public, hard-coded admin email/password.** If a development seed account exists, keep its password private, change it before any public demo, and document the setup procedure—not the secret. Never add real credentials to README, prompts, screenshots, Git history, or `.env.example`.

## Permission Model

- **User permission:** select a target user's email and choose `read` or `edit`.
- **Group permission:** select an existing group and choose `read` or `edit`.
- **Department permission:** select an existing department and choose `read` or `edit`.
- **Revoke:** remove the active permission through the relevant revoke action.
- The backend must enforce the permission on every protected document endpoint; hiding a button in the frontend alone is not access control.

## Audit Trail

The admin audit interface is intended to help review actions performed in the application. Depending on the action and implementation, entries may include the actor, action, resource, outcome, timestamp, and relevant details. The project includes audit listing and verification functionality.

For a security demo, test both successful and denied operations. Confirm that a user without permission cannot read or download another user's document, even by calling the API directly.

## Deployment Overview

1. Push the tested code to GitHub.
2. Deploy the Flask backend on Render with the correct backend root directory, dependency install command, start command, and environment variables.
3. Configure a hosted MySQL database and update the backend database connection settings.
4. Deploy `frontend/` on Vercel.
5. Set the frontend's API base URL to the deployed backend URL.
6. Configure backend CORS to allow the exact Vercel origin.
7. Test registration/login, document operations, user/group/department permissions, revoke actions, and admin audit verification on the live site.

The frontend and backend have separate deployment URLs, but users can be given only the frontend URL. The frontend calls the backend behind the scenes.

## Security Checklist

- [ ] `.env`, passwords, JWT secrets, and database credentials are not committed.
- [ ] No real private documents or personal data are committed.
- [ ] `.venv`, `node_modules`, and generated build files are ignored as appropriate.
- [ ] The administrator account uses a private, strong password.
- [ ] Backend authorization is tested independently of frontend controls.
- [ ] The hosted database is configured and backed up appropriately.
- [ ] Audit verification and permission-denial cases are tested after deployment.

## Documentation

- [`prompts.md`](prompts.md) — curated examples of the prompts used to plan and build the project.
- [`threads.md`](threads.md) — development issues encountered and the troubleshooting steps used.
