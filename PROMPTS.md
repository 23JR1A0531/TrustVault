# TrustVault — Development Prompts

> This document is a reconstructed record of my TrustVault project development. It contains prompts written in simple English based on the project tasks and recoverable development history. The wording is not an exact transcript of every original chat message.

## 1. Understand the Snovasys Challenge

**Prompt:**

I am taking part in the Snovasys Fresher Hiring Challenge. Help me understand the TrustVault problem statement before I start coding.

The goal is to build a secure document-sharing application with a real audit trail.

Explain the requirements in simple English. List the main features, expected demo flow, and submission requirements.

Separate essential features from optional improvements. Do not assume a feature is completed until I test it.

## 2. Plan the Project

**Prompt:**

I am a student building TrustVault within a limited time. Create a practical development plan covering frontend, backend, database, authentication, document management, permissions, audit logs, testing, documentation, and deployment.

Break the work into small steps. Explain what I should build first and how I should test each feature.

Prioritize a working application instead of adding many unfinished features.

## 3. Choose the Application Architecture

**Prompt:**

Help me design the architecture for TrustVault using the technologies already present in my project.

Explain how the React frontend communicates with the Flask backend and how the backend connects to MySQL.

Show the flow for login, document upload, sharing, permission revocation, and audit-log verification.

Keep authentication and authorization checks on the backend.

## 4. Create the GitHub Repository

**Prompt:**

Guide me through maintaining my TrustVault project in a public GitHub repository.

Explain how to check the repository URL, current branch, working tree, and commit status.

Tell me which files should be committed and which files must remain private.

Never include passwords, API keys, database credentials, environment files, or private documents in the repository.

## 5. Set Up the Development Environment

**Prompt:**

Help me set up TrustVault on Windows using VS Code and PowerShell.

Check the Python, Node.js, npm, and Git environment. Explain how to activate the Python virtual environment and install the dependencies.

Give me commands one at a time and explain what each command does.

When an error occurs, ask me to share the actual terminal output before suggesting a fix.

## 6. Organize the Project Structure

**Prompt:**

Help me organize the existing TrustVault repository into frontend and backend folders.

Explain the purpose of important files such as the Flask application, React application, shared API helper, components, requirements file, and package configuration.

Check existing filenames before creating new files. Avoid duplicate components and unnecessary restructuring.

Keep the documentation consistent with the actual project.

## 7. Design the TrustVault Brand

**Prompt:**

Help me create a professional identity for TrustVault, a secure document-sharing application.

Suggest a memorable tagline and a logo concept that communicates trust, documents, security, and traceability.

Use royal blue, navy, white, gold, and sky blue as the main colors.

Keep the design professional enough for a company evaluator and consistent across the login page, dashboard, and sidebar.

## 8. Design the Login Page

**Prompt:**

Help me design a professional and creative login page for TrustVault.

Use a dark-blue or royal-blue visual area with gold and sky-blue accents and a clean white login panel.

Include the product name, tagline, email field, password field, and clear login action.

Make the page responsive and easy to use. Connect the interface to the real authentication API rather than using fake login behavior.

## 9. Design the Main Dashboard

**Prompt:**

Help me create a professional dashboard for TrustVault after login.

Keep the sidebar dark blue and the main content area white or light colored. Use gold accents carefully.

Provide clear navigation for documents, uploads, access management, users, groups, departments, and audit activity wherever these features exist.

Show real backend data. Handle loading, empty, success, and error states properly.

## 10. Plan the First Working Demo

**Prompt:**

Help me prepare a simple but convincing TrustVault demonstration.

Start with login, upload a sample document, view the document, and share it with another user.

Grant read access and verify that the recipient can access the document. Revoke the permission and verify that access stops.

Finally, inspect the audit logs and verify the audit chain if the implemented feature supports it.

Do not use mock data as proof that a backend feature works.

## 11. Implement Authentication

**Prompt:**

Help me implement user registration and login in the existing Flask backend.

Validate required fields and handle missing or invalid request data safely.

Use password hashing instead of storing plaintext passwords.

After successful login, return a JWT token and the user's safe profile information.

Protect private routes and never expose passwords, password hashes, or secret configuration in API responses.

## 12. Implement Role-Based Access Control

**Prompt:**

Help me implement role-based access control for TrustVault using the roles supported by the existing application.

Check the user's role on the backend before allowing administrator-only operations.

Do not depend only on hiding buttons or pages in React.

Return suitable HTTP status codes for authentication failures and authorization failures.

Test both allowed and denied requests.

## 13. Protect Administrator Routes

**Prompt:**

Review the administrator routes in TrustVault.

Require a valid authentication token and the appropriate administrator role for protected user-management and audit operations.

Verify that a normal user cannot access these endpoints by calling the API directly.

Keep development credentials private. Explain how to configure a demo administrator account without publishing its password in GitHub.

## 14. Configure the MySQL Database

**Prompt:**

Help me connect the Flask backend to the MySQL database used by my local TrustVault project.

Inspect the existing database configuration before changing it.

Use environment variables for database credentials. Explain how to create the database, initialize tables, and diagnose connection failures.

Do not print database passwords in logs.

Explain why the local database address will need to be replaced with a reachable hosted database address during deployment.

## 15. Design the Document Data Model

**Prompt:**

Help me review the data model used to store TrustVault documents.

Identify the fields needed for document ownership, title, metadata, storage location, and timestamps according to the existing implementation.

Use stable document identifiers in API routes.

Explain how document records relate to access permissions and audit records.

Handle requests for documents that do not exist without exposing internal server details.

## 16. Implement Document Upload

**Prompt:**

Help me implement a protected document-upload endpoint in Flask.

Validate the uploaded file and the metadata required by the current application.

Use an allowlist of supported file extensions and enforce the configured upload-size limit.

Use safe filenames and do not trust the original filename supplied by the browser.

Return clear success and error responses. Record the upload in the audit log if the implemented audit system supports that event.

## 17. Fix Upload Validation

**Prompt:**

Review the file-validation logic in my upload route.

Check for missing filenames, unsupported file extensions, oversized files, and variables that may be referenced before they are defined.

Preserve the intended file-extension and size checks while fixing the actual error.

Explain the difference between checking a file extension and verifying its real content.

Test an accepted file and rejected files after making the change.

## 18. List and Search Documents

**Prompt:**

Help me implement the document-listing functionality in TrustVault.

Return only documents that the signed-in user is allowed to access.

Keep the API response consistent with the frontend.

Handle empty results and failed requests correctly.

Make sure document identifiers and metadata are consistent throughout the application.

Test the listing behavior with different users.

## 19. Download Documents Securely

**Prompt:**

Help me implement a protected document-download endpoint.

Before returning a file, verify that the requester owns the document or has an active permission that allows access.

Do not allow a user to download another user's document simply by guessing its ID.

Return a safe response for missing documents and denied access.

Test the endpoint with an owner, an authorized recipient, and a user without permission.

## 20. Delete Documents Safely

**Prompt:**

Help me implement document deletion with backend authorization.

Check whether the requester owns the document or has the required authority before deleting it.

Handle document metadata, stored files, related permissions, and audit records consistently with the existing design.

Return a useful response when the document does not exist.

Test that an unauthorized user cannot delete another user's document.

## 21. Implement Audit Logging

**Prompt:**

Help me implement an audit trail for important actions in TrustVault.

Record supported actions such as document operations and permission changes.

Include the actor, action, resource, outcome, timestamp, and other useful details when supported by the existing database schema.

Keep passwords, tokens, and sensitive document contents out of audit records.

Test that the expected audit entries appear after supported actions.

## 22. Implement Audit-Chain Verification

**Prompt:**

Help me review the audit-chain implementation in TrustVault.

Explain how audit entries are hashed and linked to previous entries according to the current code.

Verify that the integrity-checking function checks the stored chain correctly.

Return a meaningful verification result.

Do not claim that a hash chain prevents every possible form of tampering. Explain its actual security limitations.

Test the verification behavior and keep the verification endpoint protected.

## 23. Build the Audit Dashboard

**Prompt:**

Help me build an administrator audit dashboard that displays real audit data from the backend.

Show available details such as the event time, action, resource, actor, outcome, and description.

Include an audit-verification action if the backend supports it.

Handle loading, empty results, and failed requests.

Use the TrustVault color theme of dark blue, white, gold, and sky blue.

Do not show invented events or fake audit counts.

## 24. Implement Individual User Permissions

**Prompt:**

Help me add document-sharing permissions for individual users in TrustVault.

Allow an authorized document owner to enter the recipient's email and grant either `read` or `edit` permission.

Display the current permissions and provide a revoke option.

Validate the email and permission values in both the frontend and backend.

Make sure the backend checks the permission before allowing document access.

## 25. Define Read and Edit Permissions

**Prompt:**

Help me define the difference between read and edit permissions in TrustVault.

A user with read permission should not automatically be allowed to modify or delete a document.

An edit permission should allow only the operations intended by the application.

Keep the permission values consistent between the React frontend and Flask backend.

Test that read-only users cannot perform unauthorized modifications.

## 26. Revoke Individual User Permissions

**Prompt:**

Help me implement permission revocation for an individual user.

Check that the requester is authorized to manage access to the selected document.

Identify the correct document and target user.

Remove or deactivate the relevant permission according to the existing data model.

Record the revocation in the audit log if supported.

After revocation, verify that the recipient can no longer access the document through protected endpoints.

## 27. Create and Manage Groups

**Prompt:**

Help me implement group management in TrustVault.

Allow authorized users to create groups, view existing groups, and manage group membership according to the application's permissions.

Use consistent group IDs throughout the frontend and backend.

Validate required group details and handle duplicate or invalid requests safely.

Explain how groups can be used to share documents with multiple users.

## 28. Grant Group Permissions

**Prompt:**

Help me allow an authorized document owner to grant access to a selected group.

Support `read` and `edit` permission levels where implemented.

Make sure the frontend sends the group ID and permission in the exact format expected by the Flask API.

Validate the request on the backend and reject invalid group IDs or unsupported permission values.

Test that authorized group members receive only the access permitted by the application.

## 29. Revoke Group Permissions

**Prompt:**

Help me implement the ability to revoke document access granted to a group.

Identify the correct document and group.

Check the requester's authority before changing the permission.

Update the active permission state and refresh the frontend permission list after success.

Record the revocation in the audit log if supported.

Test that group access stops after revocation.

## 30. Create and Manage Departments

**Prompt:**

Help me implement department management in TrustVault.

Allow authorized users to create and view departments and manage department membership according to the existing application design.

Use consistent department identifiers between the frontend and backend.

Validate the submitted department details and return clear errors for invalid requests.

Keep department management separate from group management where their purposes or data models differ.

## 31. Grant Department Permissions

**Prompt:**

Help me implement document permissions for a selected department.

Allow an authorized requester to grant `read` or `edit` permission to a department if those values are supported by the backend.

Check that the frontend sends the correct department ID and permission.

Convert the selected ID to the correct data type when required by the API.

Test the permission using an authorized department member and a user who does not belong to that department.

## 32. Revoke Department Permissions

**Prompt:**

Help me implement department permission revocation.

Validate the document ID and department ID before sending the request.

Check authorization on the backend before revoking access.

Refresh the displayed permissions after a successful request.

Record the supported revocation event in the audit trail.

Test that access granted through the department no longer works after revocation.

## 33. Build the React Frontend

**Prompt:**

Help me build the TrustVault frontend using the framework and dependencies already configured in my repository.

Keep the UI consistent with the existing project design.

Use reusable components where helpful and preserve existing working functionality.

Use the shared API helper if the project already has one.

Do not rewrite unrelated pages while fixing a specific component.

Run the production build after making frontend changes.

## 34. Fix the Shared API Helper

**Prompt:**

Review the shared API request helper used by my React frontend.

Make sure protected API requests include the correct Bearer token.

Set the JSON content type for JSON requests, but do not force it for FormData uploads.

Handle HTTP errors consistently and show useful messages to the user.

Keep the API base URL configurable so that it can be changed for cloud deployment.

Explain how to test the helper with login, document upload, and permission requests.

## 35. Handle Login State and Logout

**Prompt:**

Help me keep TrustVault's login state consistent.

After a successful login, show the correct interface based on the authenticated user's role.

Ensure protected pages do not display private information to signed-out users.

Clear authentication state during logout.

Handle expired or invalid tokens with a useful message.

Test login, protected navigation, and logout without breaking existing functionality.

## 36. Improve Form Validation

**Prompt:**

Review the forms used for login, registration, document upload, and access management.

Validate required fields and display clear messages for invalid input.

Make sure the frontend field names match the backend API request fields.

Prevent accidental duplicate submissions where appropriate.

Remember that frontend validation does not replace backend security validation.

Test both successful requests and invalid inputs.

## 37. Improve Error Handling

**Prompt:**

Help me make TrustVault's error messages clear and consistent.

Distinguish between invalid input, authentication failure, authorization failure, missing resources, and server errors.

Do not display internal Python tracebacks or secret configuration in the browser.

Keep detailed diagnostic information in appropriate server logs.

Make sure the frontend handles failed API responses without incorrectly displaying a success message.

## 38. Build the Document Upload Page

**Prompt:**

Help me build a clean document-upload page for TrustVault.

Include the fields and file inputs expected by the existing backend.

Show the accepted file types and upload-size limit only when they match the actual backend configuration.

Display a loading state while the upload is in progress.

After success, refresh the document list and show a confirmation.

If the backend rejects the file, display a clear error message.

## 39. Build the Document List

**Prompt:**

Help me display the documents available to the signed-in user.

Show useful document information without exposing private server file paths.

Provide download or delete actions only where appropriate.

Handle loading, empty results, and API failures separately.

Refresh the list after upload, deletion, or relevant permission changes.

Make sure the backend independently enforces access control for every operation.

## 40. Keep the Interface Consistent

**Prompt:**

Review the TrustVault interface and keep the design consistent across the login page, dashboard, document pages, access management, and audit dashboard.

Use a dark-blue or royal-blue sidebar, a light content area, gold accents, and sky-blue highlights.

Keep buttons, spacing, headings, and error messages consistent.

Make sure the interface remains usable on different screen sizes.

Avoid redesigning unrelated pages when fixing a specific feature.

## 41. Debug Frontend and Backend Errors

**Prompt:**

I will share my React code, Flask route, browser console error, or terminal output.

Help me identify the actual cause of the error before changing anything.

Check the API URL, HTTP method, request payload, headers, authentication token, and expected response.

Give me the smallest safe fix and tell me exactly which file to update.

Do not guess about code that I have not shared. After the fix, give me a command or test to verify the result.

## 42. Debug an Invalid Document Request

**Prompt:**

Help me debug a request for a document ID that does not exist.

Inspect the Flask route and audit-logging function before changing the code.

Return a suitable not-found response instead of an uncontrolled server error.

Check whether the failed operation should be recorded in the audit log.

Handle database errors safely without hiding the original problem.

After fixing the issue, test the same request again and record the actual result.

## 43. Run Backend Tests

**Prompt:**

Help me run the TrustVault backend tests using the test framework configured in my repository.

Show me how to run the complete test suite and how to rerun an individual failed test.

Group the results by authentication, authorization, document management, permissions, and audit logging where applicable.

Explain each failure using the actual test output.

Do not claim that the entire application is secure just because the tests pass.

## 44. Test Authorization Boundaries

**Prompt:**

Help me verify that users cannot access operations that their roles do not permit.

Test missing or invalid authentication tokens and valid tokens belonging to users without the required role.

Check administrator-only endpoints and protected document operations.

Use the backend response to verify the result rather than relying only on frontend buttons.

Keep the security checks in place while fixing any failures.

## 45. Test Document Permissions

**Prompt:**

Help me test document access using separate owner, authorized-recipient, and unauthorized-user accounts.

Verify access before permission is granted, after permission is granted, and after permission is revoked.

Test document viewing or downloading through the API.

Confirm that unauthorized users cannot obtain private document contents.

Record the expected and actual results for each test.

## 46. Review Application Security

**Prompt:**

Review the security-sensitive parts of my existing TrustVault code.

Check JWT authentication, administrator authorization, document ownership, user permissions, group permissions, department permissions, file validation, and audit logging.

Identify confirmed issues separately from possible risks that still need testing.

Do not remove security checks just to make an endpoint work.

Give me a practical checklist for testing the application before the evaluator demo.

## 47. Explain Audit-Log Limitations

**Prompt:**

Help me explain the security benefits and limitations of TrustVault's audit trail.

Describe which application actions are recorded by the current implementation.

Explain how hash-chain verification helps identify changes to recorded audit entries.

Do not claim that every possible database or system-level modification is automatically recorded.

Distinguish between detecting possible tampering and preventing all tampering.

Use simple English suitable for my project README and technical interview.

## 48. Prepare the Snovasys Project Demo

**Prompt:**

Help me prepare a clear demonstration of TrustVault for the Snovasys hiring challenge.

Start with the project introduction and administrator login.

Demonstrate document upload, document management, individual permissions, group permissions, and department permissions where implemented.

Show how access can be revoked and how the audit trail can be reviewed.

Explain what the evaluator should observe at each step.

Do not demonstrate untested features as if they are working.

## 49. Prepare the Technical Explanation

**Prompt:**

Help me explain TrustVault in simple English during a technical interview.

Explain the frontend, backend, database, JWT authentication, document permissions, group and department access, and audit logging.

Explain why authorization must be checked by the backend.

Describe how audit-chain verification works according to my implementation.

Prepare possible follow-up questions and answers without claiming features that are not implemented.

## 50. Review API Route Contracts

**Prompt:**

Compare the API calls in my React frontend with the corresponding Flask route definitions.

Check the endpoint URL, HTTP method, request-body keys, data types, required headers, and expected response.

Verify that permission values such as `read` and `edit` match the backend validation.

Check whether group and department IDs must be numeric.

Suggest a focused fix when the frontend and backend do not agree.

## 51. Debug Access Management

**Prompt:**

I will share my Access Management component and the browser error.

Help me identify whether the problem is in the frontend form, request payload, API helper, or backend validation.

Check user emails, document IDs, group IDs, department IDs, and permission values.

Preserve existing grant and revoke functionality.

Tell me exactly which handler or route needs changing and how to test the fix.

## 52. Debug a 401 Unauthorized Error

**Prompt:**

My browser Network panel shows a protected API request returning `401 Unauthorized`.

Help me determine whether the authentication token is missing, expired, invalid, or rejected by the backend.

Check whether the request includes the correct `Authorization: Bearer` header.

Explain how to sign in again and test with a fresh token.

If the problem continues, inspect the backend JWT error response and logs.

Do not confuse an authentication error with a request-validation error.

## 53. Fix Group and Department ID Types

**Prompt:**

Help me debug permission requests where the backend expects numeric group or department IDs but the frontend may send strings.

Compare the exact JSON payload with the Flask route's validation rules.

Convert IDs safely when required and reject invalid values.

Keep the permission values consistent with the backend.

Test granting and revoking access after the change.

## 54. Fix the Git Push Error Safely

**Prompt:**

Git displays an error when trying to delete a directory under `.git/objects` and asks whether it should retry.

Tell me how to stop safely if the same error repeats.

Do not ask me to manually delete `.git` or its object files.

Help me check `git status`, confirm whether the local commit is preserved, and verify the branch status.

Recommend the next Git command only after reviewing the actual output.

## 55. Commit and Push the Final Changes

**Prompt:**

Help me commit the tested TrustVault changes and push them to GitHub.

First inspect `git status` and review the changed files.

Make sure environment files, passwords, database credentials, private documents, backups, and dependency folders are not accidentally committed.

Stage only the intended files.

Explain the commit and push commands, then help me verify whether the remote branch was updated successfully.

## 56. Build the Frontend for Production

**Prompt:**

Help me build the React/Vite frontend for production.

Open the existing `frontend` directory and run the configured build command.

Explain any build errors using the actual terminal output.

Confirm whether the build completed and generated the `dist` directory.

Do not treat a successful frontend build as proof that the backend or database is already deployed.

## 57. Deploy TrustVault

**Prompt:**

Guide me through deploying TrustVault step by step using the existing GitHub repository.

Deploy the Flask backend on Render and the React/Vite frontend on Vercel if the repository configuration supports that setup.

Configure a hosted MySQL database because the local database cannot be reached directly by the cloud backend.

Set the required environment variables and configure CORS for the deployed frontend.

Explain every button and setting clearly. Do not invent deployment URLs or claim that the site is live until it has been tested.

## 58. Prepare the Final README and Evaluator Access

**Prompt:**

Help me prepare the final TrustVault README for the Snovasys evaluation team.

Include the project overview, real features, technology stack, project structure, setup instructions, permissions, audit logging, testing, and deployment information.

Add a live demo URL only after deployment succeeds.

Explain how the evaluator can sign in using an authorized demo administrator account.

Never invent credentials or publish a real password, JWT secret, or database password in the public repository.

Clearly distinguish completed features from work that still needs testing or deployment.