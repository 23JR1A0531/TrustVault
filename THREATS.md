# TrustVault – Development Threads and Error Resolution Diary

## 1. Introduction

TrustVault is a secure document-sharing application developed as part of the Snovasys Fresher Hiring Challenge 2026. The main objective of this project is to allow users to upload, manage, share, and access documents securely while maintaining an audit trail of important activities.

During the development process, I faced several issues related to project setup, frontend and backend integration, authentication, access permissions, file upload validation, Git operations, and production deployment preparation.

I approached these issues step by step by checking the error messages, reviewing the relevant code, identifying the cause, updating the implementation, and testing the result wherever possible.

This document records the important development threads, the problems I encountered, the debugging approach I followed, and the results achieved during development.

---

## 2. Project Setup and Environment Configuration

### Problem

At the beginning of development, I needed to organize the project properly and configure the frontend and backend environments. Managing different folders, dependencies, and configuration files required careful attention.

### What I checked

- Project folder structure.
- Frontend and backend locations.
- Package and dependency configuration files.
- Environment variables.
- Local development server configuration.

### How I approached the solution

I organized the project into separate frontend and backend directories. I kept the frontend responsible for the user interface and API requests, while the backend handled authentication, document operations, permissions, and database communication.

I also reviewed the configuration files before running the application so that I could identify setup-related problems more easily.

### Result

The project structure was established, and I continued development with separate frontend and backend components.

---

## 3. Frontend Development Server and Vite Issues

### Problem

During frontend development, I encountered development environment issues involving Vite and the frontend server configuration.

Such issues can prevent the application from starting correctly or make it difficult to access the expected local URL.

### What I checked

- Whether the frontend dependencies were installed.
- Whether the `package.json` file was available in the frontend directory.
- Whether the Vite development server was running.
- Whether the requested port was already occupied.

### How I approached the solution

I checked the frontend directory and its configuration before running the development commands. I also paid attention to the port reported in the terminal rather than assuming that the application was always running on the same port.

When a port is occupied, Vite can select another available port. Therefore, the correct URL must be taken from the terminal output.

### Result

I continued frontend development using the actual development server URL reported by Vite.

**Learning:** Always check the terminal output for the correct port and make sure commands are executed from the correct project directory.

---

## 4. Frontend and Backend Integration

### Problem

TrustVault uses a React frontend and a Python Flask backend. The frontend must send requests in the format expected by the backend.

If the frontend sends incorrect field names, missing values, or values of the wrong type, the backend may reject the request.

### What I checked

- API endpoint URLs.
- HTTP methods such as GET, POST, PUT, and DELETE.
- Request headers.
- JSON request bodies.
- Form data used for document uploads.
- Backend route definitions and validation rules.

### How I approached the solution

I compared the frontend API request with the corresponding backend route. Instead of changing unrelated code, I focused on the endpoint and the specific data being sent.

I also reviewed the shared API helper in `frontend/src/api.js`, which adds the authorization header when a token is provided and handles JSON content types for requests that are not using `FormData`.

### Result

This debugging approach helped me identify request-format and integration issues more precisely.

**Learning:** Frontend and backend implementations must follow the same API contract.

---

## 5. Git Error: Unable to Delete a Directory Inside `.git/objects`

### Problem

During Git operations, I encountered the following message:

`Deletion of directory '.git/objects/02' failed. Should I try again? (y/n)`

This interrupted the Git operation and created uncertainty about whether my repository was in a correct state.

### What I checked

I reopened the terminal and checked the repository status using:

```powershell
git status
```

The output showed:

```text
On branch main
Your branch is ahead of 'origin/main' by 1 commit.
nothing to commit, working tree clean
```

This indicated that the working tree was clean and one local commit had not yet been pushed to the remote repository.

### How I approached the solution

Instead of manually deleting files inside `.git/objects`, I checked the repository status and verified whether the pending commit could be pushed normally.

I then executed:

```powershell
git push origin main
```

### Result

The push completed successfully:

```text
To https://github.com/23JR1A0531/TrustVault.git
   4b6b954..a5acf00  main -> main
```

The local `main` branch was successfully pushed to the remote GitHub repository.

**Learning:** When Git reports an internal repository error, check the repository status before attempting manual changes to Git's internal files.

---

## 6. GitHub Push Verification

### Problem

After making changes to the project, I needed to ensure that the latest code was available in the public GitHub repository.

A local commit alone does not guarantee that the changes have been uploaded to GitHub.

### What I checked

I verified the repository status and the output of the push command.

### How I approached the solution

I used the following command:

```powershell
git push origin main
```

I checked the terminal output to confirm that the remote branch was updated.

### Result

The push output confirmed that the changes reached the remote repository:

```text
main -> main
```

The repository is available at:

https://github.com/23JR1A0531/TrustVault.git

**Learning:** I verify the result of Git operations through terminal output rather than assuming that a command succeeded.

---

## 7. Frontend Production Build Verification

### Problem

Before deploying TrustVault, I needed to confirm that the frontend could be compiled into production files.

A frontend application may work in development but still contain build-time errors.

### What I checked

I checked whether the frontend dependencies and build scripts were configured correctly.

### How I approached the solution

I executed the production build command from the frontend directory:

```powershell
cd frontend
npm run build
```

### Result

The build completed successfully with the following output:

```text
vite v8.3.4 building client environment for production...
✓ 1948 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-R9N-AMoA.css   19.27 kB │ gzip:  5.11 kB
dist/assets/index-FbzG-3zE.js   320.11 kB │ gzip: 91.34 kB
✓ built in 2.69s
```

This confirmed that Vite generated the frontend production build.

**Learning:** A successful production build is an important checkpoint, but it does not by itself prove that every API request or deployed feature works correctly.

---

## 8. Group Permission API – Incorrect Data Type

### Problem

While working on Access Management, I encountered an issue involving group permissions.

The backend expected `group_id` to be an integer, but the value coming from the frontend could be a string.

This type mismatch could cause validation or database-related errors.

### What I checked

I reviewed the frontend permission handler and the backend route that processes group-permission requests.

I checked the type of the group identifier being sent by the frontend.

### How I approached the solution

I updated the frontend handling to convert the identifier to a number before sending it to the backend.

For example:

```javascript
const groupId = Number(selectedGroupId);
```

I then used the converted identifier in the request payload.

I also checked that the selected group identifier was valid before submitting the request.

### Result

The frontend was adjusted to send a numeric group identifier instead of relying on the original string value.

**Verification status:** The type conversion was addressed in the frontend. A successful end-to-end permission update should still be verified separately.

**Learning:** JavaScript form values are often strings, so API fields that require numbers must be converted and validated explicitly.

---

## 9. Group Permission API – 401 Unauthorized Error

### Problem

During group-permission testing, I encountered the following browser console error:

```text
PUT http://127.0.0.1:5000/api/documents/5/group-permissions
401 (UNAUTHORIZED)
```

This indicated that the backend did not accept the request as an authenticated request.

The error was different from a request-body validation error because the server returned HTTP 401.

### What I checked

I considered the following possible causes:

- Whether the user was logged in.
- Whether the authentication token was available.
- Whether the request included the `Authorization` header.
- Whether the token had expired or was invalid.
- Whether the backend authentication middleware accepted the token.

### How I approached the solution

I planned to sign out and sign in again to obtain a fresh token. I also reviewed the shared API helper to check how the bearer token was attached to requests.

The relevant header format is:

```http
Authorization: Bearer <token>
```

If the problem persisted, the next step was to inspect the response body and backend authentication logs to identify the exact reason for rejection.

### Result

The 401 error was identified as an authentication issue requiring token and middleware verification.

**Verification status:** A final successful group-permission request was not confirmed in the available development notes.

**Learning:** HTTP status codes help narrow down the cause of a problem. A 401 response should lead me to investigate authentication before changing the request payload.

---

## 10. Document Upload Route – Undefined Variable Warning

### Problem

While working on the document upload API, I encountered a warning related to the variable `valid`.

The upload route contained validation logic that referenced this variable, creating a problem when the variable was not defined in the relevant execution path.

### What I checked

I reviewed the upload route and examined the validation block that referenced `valid`.

I also reviewed the existing file extension and file size checks.

### How I approached the solution

I removed the stale validation block that depended on the undefined variable while retaining the existing extension allowlist and the 10 MB file-size limit.

The intention was to avoid referencing an undefined variable and keep the existing upload restrictions in place.

### Result

The problematic validation block was removed from the route.

**Verification status:** The updated route still needs to be tested with valid files, disallowed extensions, and files exceeding the size limit to confirm the complete upload flow.

**Learning:** Removing an undefined-variable reference is not enough to prove that an upload endpoint is secure. Every remaining validation rule must also be tested.

---

## 11. Access Management – User, Group, and Department Identifiers

### Problem

TrustVault includes access management for individual users, groups, and departments.

Each operation must send the correct identifier and permission value to the corresponding backend route.

If the wrong identifier or an unexpected data type is sent, the operation may fail.

### What I checked

I reviewed the frontend handlers for:

- Individual user permissions.
- Group permissions.
- Department permissions.

I also checked the expected backend request fields and the supported permission values.

### How I approached the solution

I compared the frontend request payloads with the backend route definitions.

For group and department operations, I adjusted identifier handling to convert the selected identifier to a number when the backend expected an integer.

I also checked the permission values so that they matched the supported values, such as `read` and `edit`, where required by the corresponding route.

For individual user permissions, I checked that the user's email and permission were included in the expected format.

### Result

The request handlers were reviewed and updated to align their identifier handling with the backend expectations.

**Verification status:** Each user, group, and department permission operation must be tested independently before confirming that all access-management features work correctly.

**Learning:** Similar-looking API operations may have different request schemas. I should verify each endpoint individually instead of assuming that one payload format works everywhere.

---

## 12. Authentication Header and Shared API Helper

### Problem

Several protected operations in TrustVault require authentication. If the frontend does not attach the token correctly, the backend may reject the request.

Repeating request-header logic in every component can also make debugging more difficult.

### What I checked

I reviewed the shared API helper in:

`frontend/src/api.js`

I checked how it handled authentication tokens, JSON requests, and `FormData`.

### How I approached the solution

I used the shared request helper to centralize common request handling.

The helper includes the bearer token when a token is supplied and applies a JSON content type to requests that do not use `FormData`.

This distinction is important because file-upload requests should allow the browser to set the multipart boundary rather than forcing a JSON content type.

### Result

The shared helper provides a common place to review authentication headers and request formatting.

**Learning:** Centralizing API request logic makes it easier to maintain consistent behavior and investigate authentication problems.

---

## 13. Document Upload and File Validation

### Problem

The document upload feature must accept supported files while rejecting files that violate the application's restrictions.

The backend must not rely only on the frontend because a client can bypass frontend validation.

### What I checked

I reviewed the upload endpoint and its existing checks for:

- File presence.
- Allowed file extensions.
- Maximum file size.
- Storage handling.
- Error handling during upload.

### How I approached the solution

I retained the extension allowlist and the 10 MB size limit while addressing the undefined-variable warning.

I also considered the importance of handling upload failures safely so that an unsuccessful upload does not leave an inconsistent file-storage state.

### Result

The upload route was adjusted to remove the identified undefined-variable reference while preserving the existing extension and size checks.

**Verification status:** The full upload lifecycle, including invalid files and failed database operations, requires further testing.

**Learning:** File validation must be performed on the backend, and upload failures should be handled without leaving unnecessary files or inconsistent database records.

---

## 14. Database Configuration – Local Development and Cloud Deployment

### Problem

TrustVault uses a database during backend operations. The local development environment and the production hosting environment do not necessarily use the same database connection.

A database running on my own computer cannot automatically be accessed by a backend deployed on a cloud hosting platform.

### What I checked

I reviewed the local database configuration and considered how the deployed backend would connect to its database.

The local MySQL setup was part of development, while the production environment required a database accessible to the deployed backend.

### How I approached the solution

I planned to configure the database connection through environment variables rather than hard-coding local connection details into the production application.

For deployment, I needed a hosted database and the correct production database credentials.

I also needed to ensure that sensitive connection details were not committed to the public GitHub repository.

### Result

The local development configuration was established, and the production database requirement was identified.

**Status:** Production database configuration and end-to-end cloud connectivity remain deployment tasks until successfully tested.

**Learning:** Local database connectivity does not prove that a deployed backend can access the database. Both environments must be configured and tested separately.

---

## 15. Environment Variables and Sensitive Configuration

### Problem

The application requires configuration values for backend operation, authentication, and database connectivity.

Keeping secrets directly in source code can expose sensitive information when the project is pushed to a public repository.

### What I checked

I considered the separation between application code and environment-specific configuration.

I also reviewed the deployment requirements for configuring backend and frontend environment variables.

### How I approached the solution

I used environment-based configuration for values that differ between local development and production.

For deployment, I planned to configure the required variables through the hosting platform's environment settings.

I also kept in mind that private keys, passwords, database credentials, and production authentication secrets must not be published in the README or source code.

### Result

Environment-based configuration was included in the deployment approach.

**Verification status:** Every required production environment variable must be configured and checked during deployment.

**Learning:** Configuration should be separated from source code so that the application can be deployed securely across different environments.

---

## 16. Audit Trail and Hash-Chain Verification

### Problem

One of the main goals of TrustVault is to maintain a traceable record of supported document-sharing and access-related activities.

The audit trail must preserve useful event information and allow the stored hash chain to be checked for integrity.

### What I checked

I reviewed the audit logging implementation and the use of SHA-256 hashing to create audit entry hashes.

I also considered the relationship between an audit entry and the preceding entry in the chain.

### How I approached the solution

I worked with the audit-recording implementation that stores audit information and calculates an entry hash.

I also created test scripts for recording an audit entry and checking the audit chain.

This allowed me to separate two concerns: recording an event and checking whether the stored chain remains consistent.

### Result

The audit-recording implementation and verification tests were developed as part of the project.

**Verification status:** Successful test results for every audit event and every tampering scenario were not confirmed in the available notes.

**Learning:** A hash chain can help detect changes to recorded data, but it does not automatically guarantee that every system activity has been logged or that the audit storage cannot be modified by a sufficiently privileged attacker.

---

## 17. Access-Control Design for Shared Documents

### Problem

A document-sharing application must distinguish between users who can access a document and users who are not authorized to access it.

TrustVault also includes individual user permissions, group permissions, and department permissions.

### What I checked

I considered the need to validate permissions at the backend rather than relying only on whether a button was visible in the frontend.

I also reviewed the supported permission values and the API routes responsible for access management.

### How I approached the solution

I organized the access-management functionality around separate user, group, and department operations.

I checked the relevant route definitions and request fields so that each operation could be handled using its expected inputs.

I also recognized that granting a permission and revoking a permission must be tested independently.

### Result

The access-management implementation was developed and its request handling was reviewed during debugging.

**Verification status:** A complete security test of all roles, permission combinations, and unauthorized requests remains necessary before claiming that every access-control scenario works correctly.

**Learning:** Frontend visibility is not a security boundary. The backend must independently enforce document-access permissions.

---

## 18. Frontend Error Handling and Debugging

### Problem

When an API request fails, the frontend may show an error in the browser console or fail to complete an operation.

The error can originate from authentication, request formatting, validation, server-side logic, or database connectivity.

### What I checked

I reviewed the browser console and the HTTP status code returned by the backend.

I distinguished between authentication errors such as HTTP 401 and errors related to the request body or validation.

### How I approached the solution

I used a step-by-step debugging process:

1. Reproduce the issue.
2. Identify the API endpoint involved.
3. Check the HTTP method and request payload.
4. Review the response status and message.
5. Inspect the relevant frontend handler and backend route.
6. Make a focused change.
7. Retest the operation.

### Result

This approach helped me narrow down problems instead of making unrelated changes throughout the project.

**Learning:** Debugging is more efficient when I isolate the failing operation and investigate the actual response rather than guessing the cause.

---

## 19. Local Testing Before Deployment

### Problem

A project that works on a developer's computer may still fail after deployment because the production environment has different configuration, networking, and database requirements.

### What I checked

I considered the different validation stages required before deployment:

- Frontend production build.
- Backend startup.
- Database connectivity.
- Authentication.
- Document operations.
- Permission enforcement.
- Audit logging.
- Environment-variable configuration.

### How I approached the solution

I verified the frontend build separately and kept track of the issues that still required runtime or integration testing.

I also treated local testing and cloud deployment as separate stages rather than assuming that a successful local build meant the entire application was production-ready.

### Result

The frontend production build was confirmed successful. Other deployment-dependent checks remained part of the release process.

**Learning:** Build verification, API testing, and production testing are different activities, and each provides different evidence about application readiness.

---

## 20. Preparing the Backend for Render

### Problem

The backend must be deployed to a hosting environment where the application can start, read its configuration, and connect to the production database.

The local development environment cannot simply be assumed to work in the cloud.

### What I checked

I identified the backend directory, dependency configuration, application entry point, and production startup requirements.

### How I approached the solution

The planned deployment configuration was:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`, provided that `app.py` defines the Flask application as `app` and Gunicorn is included in the dependencies.

I also identified the need to configure production environment variables and a hosted database connection.

### Result

The deployment configuration was prepared as a plan.

**Status:** A successful Render deployment was not confirmed in the available development notes.

**Learning:** The deployment command must match the actual application entry point and the dependencies installed in the backend environment.

---

## 21. Preparing the Frontend for Vercel

### Problem

The frontend needs a production URL and must communicate with the deployed backend instead of the local development server.

If the API base URL remains set to `127.0.0.1`, a visitor opening the hosted frontend will not reach the developer's local backend.

### What I checked

I reviewed the frontend build configuration and identified the need for a production API base URL.

### How I approached the solution

The planned Vercel configuration was:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL`

The API base URL must point to the deployed backend, and the frontend must use that environment variable when making requests.

I also identified the need to configure backend CORS to permit the actual deployed frontend origin.

### Result

The frontend build was confirmed successful, and the Vercel configuration was identified.

**Status:** A successful Vercel deployment and production API connection were not confirmed in the available notes.

**Learning:** The production frontend URL, backend API URL, and CORS configuration must work together for the deployed application to function.

---

## 22. Understanding the Difference Between Build Errors and Runtime Errors

### Problem

During development, I needed to distinguish errors that prevent the application from building from errors that occur only when a user performs an operation.

For example, a successful frontend build does not guarantee that a protected API request will succeed.

### What I checked

I considered the different stages at which problems can occur:

- Build time.
- Application startup.
- API request execution.
- Authentication.
- Database operations.
- Production networking.

### How I approached the solution

I used the error message and the stage of execution to narrow down the issue.

For example, the successful Vite build confirmed frontend compilation, while the 401 group-permission error required separate investigation of authentication.

### Result

I adopted a more targeted approach to debugging by identifying which layer was responsible for each failure.

**Learning:** The location and timing of an error are important clues when deciding where to investigate.

---

## 23. Maintaining GitHub Repository Readiness

### Problem

For the Snovasys challenge, I needed a public repository containing the project source code and documentation.

I also needed to make sure that the repository could be inspected without exposing private configuration details.

### What I checked

I checked the Git repository status and verified the successful push to the `main` branch.

I also considered the information required in the README, including the project overview, features, technology stack, setup instructions, and demo URL.

### How I approached the solution

I pushed the project changes to GitHub and prepared documentation that explains the project and its development process.

I also recognized that demo credentials, if needed, should belong to a dedicated test account and should not expose real user credentials or production secrets.

### Result

The repository push was confirmed successful. Documentation and deployment details were part of the remaining submission preparation.

**Learning:** A public repository should contain enough information to understand and run the project without exposing sensitive credentials.

---

## 24. Development Approach and Lessons Learned

While developing TrustVault, I learned that errors should be handled systematically instead of by making random changes.

My general debugging process was:

1. Read the error message carefully.
2. Identify the affected component or API route.
3. Check the relevant configuration and code.
4. Compare the expected behavior with the actual behavior.
5. Make the smallest reasonable change.
6. Run the relevant command or repeat the failed operation.
7. Record the result and any remaining work.

I also learned to distinguish between a fix that has been implemented and a fix that has been verified through testing.

For example, the frontend production build and GitHub push were confirmed successful, while the group-permission authentication issue and production deployment required additional verification.

This approach helped me understand the relationship between the frontend, backend, database, authentication system, and deployment environment.

---

## 25. Current Development Status

The following table summarizes the status of the major threads documented above.

| Development thread | Status |
|---|---|
| Project structure and environment setup | Established |
| Frontend production build | Confirmed successful |
| Git repository status check | Completed |
| Git push to `main` | Confirmed successful |
| Group identifier type conversion | Addressed; end-to-end retest required |
| Group-permission HTTP 401 | Investigated; final resolution unconfirmed |
| Undefined `valid` variable in upload route | Problematic block removed; validation tests required |
| Shared API request handling | Reviewed |
| User, group, and department permission handling | Reviewed; independent tests required |
| Audit recording and hash-chain verification | Implemented for testing; full verification unconfirmed |
| Production database configuration | Required for deployment |
| Render backend deployment | Planned; success unconfirmed |
| Vercel frontend deployment | Planned; success unconfirmed |
| Production API connectivity and CORS | Requires deployment testing |

---

## 26. Conclusion

Developing TrustVault gave me practical experience in debugging a full-stack application and understanding how different components interact.

I worked on frontend and backend integration, authentication, access management, document upload validation, Git version control, audit logging, and deployment preparation.

The most important lesson I learned was to investigate errors systematically, identify their actual cause, apply a focused fix, and verify the result before considering the problem solved.

I also understood that security-related features require additional testing. Authentication, document permissions, file validation, and audit logging must be verified through appropriate test cases rather than judged only by whether the interface appears to work.

This development diary records the issues and lessons from the project and provides a foundation for further testing and deployment.

---

**Project Repository:** https://github.com/23JR1A0531/TrustVault.git

**Live Demo:** https://trust-vault-dusky.vercel.app?utm_source=chatgpt.com
