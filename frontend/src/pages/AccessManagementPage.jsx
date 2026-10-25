import { useState } from "react";
import {
  ShieldCheck,
  Users,
  Building2,
  UserRound,
  RefreshCw,
  Search,
  LockKeyhole,
} from "lucide-react";

const permissionOptions = [
  { value: "read", label: "Read" },
  { value: "edit", label: "Edit" },
];

export default function AccessManagementPage({
  documents = [],
  groups = [],
  departments = [],
  onGrantAccess,
  onRevokeAccess,
  onRefresh,
  loading = false,
}) {
  const [targetType, setTargetType] = useState("user");
  const [documentId, setDocumentId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [permission, setPermission] = useState("read");
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedDocuments = documents.filter((document) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return true;

    return [
      document.title,
      document.filename,
      document.original_filename,
      document.description,
    ].some((value) =>
      String(value || "").toLowerCase().includes(query)
    );
  });

  const targetList =
    targetType === "group"
      ? groups
      : targetType === "department"
        ? departments
        : [];

  function getDocumentId(document) {
    return document.id ?? document._id ?? document.document_id;
  }

  function getDocumentName(document) {
    return (
      document.title ||
      document.filename ||
      document.original_filename ||
      "Untitled document"
    );
  }

  function getTargetId(target) {
    return String(
      target.id ??
        target._id ??
        target.user_id ??
        target.group_id ??
        target.department_id ??
        ""
    );
  }

  function getTargetName(target) {
    return (
      target.name ||
      target.username ||
      target.email ||
      target.group_name ||
      target.department_name ||
      "Unnamed"
    );
  }

  function resetMessages() {
    setMessage("");
    setError("");
  }

  async function handleGrant(event) {
    event.preventDefault();
    resetMessages();

    if (!documentId) {
      setError("Please select a document.");
      return;
    }

    if (!targetId.trim()) {
      setError(
        targetType === "user"
          ? "Enter the registered user's email address."
          : "Please select a group or department."
      );
      return;
    }

    if (!onGrantAccess) {
      setError("Access grant handler is not configured in App.jsx.");
      return;
    }

    setSubmitting(true);

    try {
      await onGrantAccess({
        documentId,
        targetType,
        targetId: targetId.trim(),
        permission,
      });

      setMessage("Access permission updated successfully.");
      setTargetId("");
    } catch (err) {
      setError(err?.message || "Unable to grant access.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(event) {
    event.preventDefault();
    resetMessages();

    if (!documentId || !targetId.trim()) {
      setError("Select a document and enter the target email or ID first.");
      return;
    }

    if (targetType === "user" && !/^\d+$/.test(targetId.trim())) {
      setError("For revoke, enter the user's numeric ID (not their email).");
      return;
    }

    if (!onRevokeAccess) {
      setError("Access revoke handler is not configured in App.jsx.");
      return;
    }

    setSubmitting(true);

    try {
      await onRevokeAccess({
        documentId,
        targetType,
        targetId: targetId.trim(),
      });

      setMessage("Access revoke request completed.");
      setTargetId("");
    } catch (err) {
      setError(err?.message || "Unable to revoke access.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1 style={{ marginBottom: 7 }}>Access Management</h1>
          <p>
            Grant and revoke document access for users, groups,
            and departments.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Documents</div>
          <div className="stat-number">{documents.length}</div>
          <div className="stat-caption">
            Documents available to this page
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Groups</div>
          <div className="stat-number">{groups.length}</div>
          <div className="stat-caption">
            Groups available for sharing
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Departments</div>
          <div className="stat-number">{departments.length}</div>
          <div className="stat-caption">
            Departments available for sharing
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="alert-success" role="status">
          {message}
        </div>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Manage Document Permissions</h2>
            <p style={{ margin: "6px 0 0", fontSize: 12 }}>
              Choose a document, target, and permission level.
            </p>
          </div>

          <ShieldCheck size={23} color="#f5c451" />
        </div>

        <form onSubmit={handleGrant}>
          <label className="field">
            Select Document

            <select
              value={documentId}
              onChange={(event) => {
                setDocumentId(event.target.value);
                resetMessages();
              }}
              required
            >
              <option value="">Choose a document</option>

              {documents.map((document, index) => {
                const id = getDocumentId(document);

                return (
                  <option key={id ?? index} value={id} disabled={!id}>
                    {getDocumentName(document)}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="field">Share With</label>

          <div className="access-grid" style={{ marginBottom: 20 }}>
            {[
              { value: "user", label: "Individual User", icon: UserRound },
              { value: "group", label: "Group", icon: Users },
              {
                value: "department",
                label: "Department",
                icon: Building2,
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = targetType === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  className="access-card"
                  onClick={() => {
                    setTargetType(item.value);
                    setTargetId("");
                    resetMessages();
                  }}
                  style={{
                    cursor: "pointer",
                    color: active ? "#f5c451" : "#e2e8f0",
                    borderColor: active ? "#80631c" : "#263653",
                    textAlign: "left",
                  }}
                >
                  <Icon size={23} />

                  <h3 style={{ marginTop: 12 }}>
                    {item.label}
                  </h3>

                  <p style={{ marginBottom: 0 }}>
                    {item.value === "user"
                      ? "Share with one registered user."
                      : item.value === "group"
                        ? "Share with a group of users."
                        : "Share with a department."}
                  </p>
                </button>
              );
            })}
          </div>

          {targetType === "user" ? (
            <label className="field">
              User email to grant access / numeric User ID to revoke access

              <input
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
                placeholder="Grant: user@example.com | Revoke: numeric user ID"
                autoComplete="off"
                required
              />
              <small style={{ display: "block", marginTop: 6, color: "#94a3b8" }}>
                For Grant Access, enter the user's email. For Revoke Access, enter that user's numeric ID.
              </small>
            </label>
          ) : (
            <label className="field">
              Select {targetType === "group" ? "Group" : "Department"}

              <select
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
                required
              >
                <option value="">
                  Choose {targetType === "group" ? "a group" : "a department"}
                </option>

                {targetList.map((target, index) => {
                  const id = getTargetId(target);

                  return (
                    <option key={id || index} value={id} disabled={!id}>
                      {getTargetName(target)}
                    </option>
                  );
                })}
              </select>
            </label>
          )}

          <label className="field">
            Permission Level

            <select
              value={permission}
              onChange={(event) => setPermission(event.target.value)}
            >
              {permissionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: 14,
              borderRadius: 10,
              background: "#132a2a",
              border: "1px solid #245348",
              marginBottom: 20,
            }}
          >
            <LockKeyhole
              size={20}
              color="#6ee7b7"
              style={{ flexShrink: 0 }}
            />

            <div>
              <strong style={{ color: "#a7f3d0", fontSize: 12 }}>
                Permission-based access
              </strong>

              <p style={{ margin: "5px 0 0", fontSize: 11 }}>
                The backend must enforce the selected permission.
                This interface does not itself secure a document.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || loading}
            >
              <ShieldCheck size={16} />
              {submitting ? "Updating..." : "Grant Access"}
            </button>

            <button
              type="button"
              className="btn-danger"
              disabled={submitting || loading}
              onClick={handleRevoke}
            >
              Revoke Access
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Available Documents</h2>
            <p style={{ margin: "6px 0 0", fontSize: 12 }}>
              Select a document above to manage its permissions.
            </p>
          </div>
        </div>

        <div
          className="search-box"
          style={{ marginBottom: 18, maxWidth: 380 }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              pointerEvents: "none",
            }}
          />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search document names..."
          />
        </div>

        {selectedDocuments.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck
              size={36}
              style={{ margin: "0 auto 12px", color: "#64748b" }}
            />
            <h3>No documents found</h3>
            <p>Try another search or load documents from the backend.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Document ID</th>
                  <th>Owner</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {selectedDocuments.map((document, index) => {
                  const id = getDocumentId(document);

                  return (
                    <tr key={id ?? index}>
                      <td>{getDocumentName(document)}</td>
                      <td>
                        <code style={{ fontSize: 10 }}>
                          {id ?? "Not available"}
                        </code>
                      </td>
                      <td>
                        {document.owner_name ||
                          document.owner_email ||
                          document.owner_id ||
                          "—"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setDocumentId(String(id ?? ""));
                            resetMessages();
                          }}
                          disabled={!id}
                        >
                          Select Document
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}