
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import GroupsPage from "./pages/GroupsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import AuditPage from "./pages/AuditPage";
import AccessManagementPage from "./pages/AccessManagementPage";

import UploadModal from "./components/UploadModal";
import ShareModal from "./components/ShareModal";
import ConfirmModal from "./components/ConfirmModal";

const TOKEN_KEY = "trustvault_token";

const unwrap = (result, key) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.[key])) return result[key];
  if (Array.isArray(result?.data?.[key])) return result.data[key];
  if (Array.isArray(result?.data)) return result.data;
  return [];
};

const getToken = (result) =>
  result?.access_token ||
  result?.accessToken ||
  result?.token ||
  result?.data?.access_token ||
  "";

const getUser = (result) =>
  result?.user || result?.data?.user || result?.data || result;

const getDocumentId = (doc) =>
  doc?.id ?? doc?._id ?? doc?.document_id ?? doc?.documentId;

const PAGE_IDS = [
  "dashboard",
  "documents",
  "groups",
  "departments",
  "access",
  "audit",
];

export default function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY) || ""
  );
  const [user, setUser] = useState(null);
  const [authPage, setAuthPage] = useState("login");
  const [authError, setAuthError] = useState("");

  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");

  const [documents, setDocuments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [verification, setVerification] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [shareDocument, setShareDocument] = useState(null);
  const [editDocument, setEditDocument] = useState(null);
  const [deleteDocument, setDeleteDocument] = useState(null);

  const role = String(user?.role || "viewer").toLowerCase();
  const isAdmin = role === "admin" || role === "owner";

  const showError = (e) =>
    setError(e?.message || "Something went wrong.");

  const navigate = (nextPage) => {
    const normalized = String(nextPage || "dashboard").toLowerCase();

    if (!PAGE_IDS.includes(normalized)) return;

    setPage(normalized);
    setError("");
    setNotice("");
  };

  const loadDocuments = useCallback(async (activeToken, query = "") => {
    const result = await api.documents(activeToken, query);
    setDocuments(unwrap(result, "documents"));
  }, []);

  const loadGroups = useCallback(async (activeToken) => {
    const result = await api.groups(activeToken);
    setGroups(unwrap(result, "groups"));
  }, []);

  const loadDepartments = useCallback(async (activeToken) => {
    const result = await api.departments(activeToken);
    setDepartments(unwrap(result, "departments"));
  }, []);

  const loadAudit = useCallback(async (activeToken) => {
    const result = await api.audit(activeToken);
    setLogs(unwrap(result, "logs"));
  }, []);

  const refreshWorkspace = useCallback(async (activeToken, activeUser, activePage) => {
    await loadDocuments(activeToken, search);

    if (activePage === "groups" || activePage === "dashboard") {
      await loadGroups(activeToken);
    }

    if (
      activeUser &&
      ["admin", "owner"].includes(
        String(activeUser.role || "").toLowerCase()
      )
    ) {
      if (activePage === "departments" || activePage === "dashboard") {
        await loadDepartments(activeToken);
      }

      if (activePage === "audit" || activePage === "dashboard") {
        await loadAudit(activeToken);
      }
    }
  }, [loadDocuments, loadGroups, loadDepartments, loadAudit, search]);

  const logout = useCallback(async () => {
    try {
      if (token) await api.logout(token);
    } catch {
      // Clear local session even if logout request fails.
    }

    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setDocuments([]);
    setGroups([]);
    setDepartments([]);
    setLogs([]);
    setVerification(null);
    setSearch("");
    setPage("dashboard");
    setError("");
    setNotice("");
    setAuthError("");
    setAuthPage("login");
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let active = true;

    async function initialize() {
      try {
        const result = await api.me(token);
        if (!active) return;

        const currentUser = getUser(result);
        setUser(currentUser);

        const documentResult = await api.documents(token);
        if (!active) return;
        setDocuments(unwrap(documentResult, "documents"));
      } catch (e) {
        if (!active) return;

        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
        setAuthError(
          e.message || "Session expired. Please sign in again."
        );
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;

    let active = true;

    async function loadCurrentPage() {
      try {
        if (page === "documents") {
          await loadDocuments(token, search);
        }

        if (page === "groups") {
          await loadGroups(token);
        }

        if (page === "departments" && isAdmin) {
          await loadDepartments(token);
        }

        if (page === "audit" && isAdmin) {
          await loadAudit(token);
        }

        if (page === "dashboard") {
          await loadGroups(token);

          if (isAdmin) {
            await loadDepartments(token);
            await loadAudit(token);
          }
        }
      } catch (e) {
        if (active) showError(e);
      }
    }

    loadCurrentPage();

    return () => {
      active = false;
    };
  }, [
    token,
    user,
    page,
    search,
    isAdmin,
    loadDocuments,
    loadGroups,
    loadDepartments,
    loadAudit,
  ]);

  async function handleLogin(credentials) {
    setBusy(true);
    setAuthError("");

    try {
      const result = await api.login(credentials);
      const newToken = getToken(result);

      if (!newToken) {
        throw new Error(
          "Login response did not include an access token."
        );
      }

      sessionStorage.setItem(TOKEN_KEY, newToken);
      setUser(getUser(result));
      setToken(newToken);
      setPage("dashboard");
      setSearch("");
      setError("");
      setNotice("");
    } catch (e) {
      setAuthError(e.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(details) {
    setBusy(true);
    setAuthError("");

    try {
      await api.register(details);
      setAuthPage("login");
      setAuthError(
        "Registration submitted. If approval is required, wait for an administrator to approve your account."
      );
    } catch (e) {
      setAuthError(e.message || "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(formData) {
    setBusy(true);
    setError("");

    try {
      await api.upload(token, formData);
      setUploadOpen(false);
      setNotice("Document uploaded successfully.");
      await loadDocuments(token, search);
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(doc) {
    try {
      const documentId = getDocumentId(doc);
      if (!documentId) throw new Error("Document ID is missing.");

      const blob = await api.download(token, documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        doc.original_filename || doc.filename || doc.title || "document";

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      showError(e);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    if (!editDocument) return;

    const documentId = getDocumentId(editDocument);
    if (!documentId) {
      showError(new Error("Document ID is missing."));
      return;
    }

    setBusy(true);

    try {
      await api.edit(token, documentId, {
        title: editDocument.title,
        category: editDocument.category,
        description: editDocument.description || "",
      });

      setEditDocument(null);
      setNotice("Document updated.");
      await loadDocuments(token, search);
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteDocument) return;

    const documentId = getDocumentId(deleteDocument);
    if (!documentId) {
      showError(new Error("Document ID is missing."));
      return;
    }

    setBusy(true);

    try {
      await api.remove(token, documentId);
      setDeleteDocument(null);
      setNotice("Document deleted.");
      await loadDocuments(token, search);
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleShare(target, payload) {
    if (!shareDocument) return;

    const documentId = getDocumentId(shareDocument);
    if (!documentId) {
      showError(new Error("Document ID is missing."));
      return;
    }

    setBusy(true);

    try {
      if (target === "user") {
        await api.grantUser(token, documentId, payload);
      } else if (target === "group") {
        await api.grantGroup(token, documentId, payload);
      } else if (target === "department") {
        await api.grantDepartment(token, documentId, payload);
      } else {
        throw new Error("Unsupported access target.");
      }

      setShareDocument(null);
      setNotice("Access permission saved.");
      await loadDocuments(token, search);
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateGroup(payload) {
    setBusy(true);

    try {
      await api.createGroup(token, payload);
      await loadGroups(token);
      setNotice("Group created.");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddGroupMember(group, selectedUserId) {
    const groupId = group?.id ?? group?._id ?? group?.group_id ?? group;
    const userId = selectedUserId?.id ?? selectedUserId?.user_id ?? selectedUserId?._id ?? selectedUserId;
    if (!groupId || !userId) {
      throw new Error("Group ID or user ID is missing.");
    }

    setBusy(true);
    try {
      await api.addGroupMember(token, groupId, { user_id: userId });
      await loadGroups(token);
      setNotice("Group member added.");
    } catch (e) {
      showError(e);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveGroupMember(group, selectedUserId) {
    const groupId = group?.id ?? group?._id ?? group?.group_id ?? group;
    const userId = selectedUserId?.id ?? selectedUserId?.user_id ?? selectedUserId?._id ?? selectedUserId;
    if (!groupId || !userId) throw new Error("Group ID or user ID is missing.");

    setBusy(true);
    try {
      await api.removeGroupMember(token, groupId, userId);
      await loadGroups(token);
      setNotice("Group member removed.");
    } catch (e) {
      showError(e);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateDepartment(payload) {
    setBusy(true);

    try {
      await api.createDepartment(token, payload);
      await loadDepartments(token);
      setNotice("Department created.");
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddDepartmentMember(payload) {
    setBusy(true);
    try {
      await api.addDepartmentMember(token, payload);
      await loadDepartments(token);
      setNotice("Department member assigned.");
    } catch (e) {
      showError(e);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveDepartmentMember(department, selectedUserId) {
    const departmentId = department?.id ?? department?._id ?? department?.department_id ?? department;
    const userId = selectedUserId?.id ?? selectedUserId?.user_id ?? selectedUserId?._id ?? selectedUserId;
    if (!departmentId || !userId) throw new Error("Department ID or user ID is missing.");
    setBusy(true);
    try {
      await api.removeDepartmentMember(token, departmentId, userId);
      await loadDepartments(token);
      setNotice("Department member removed.");
    } catch (e) {
      showError(e);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateDepartment(department, payload) {
    const departmentId = department?.id ?? department?._id ?? department?.department_id;
    if (!departmentId) throw new Error("Department ID is missing.");
    setBusy(true);
    try {
      await api.updateDepartment(token, departmentId, payload);
      await loadDepartments(token);
      setNotice("Department updated.");
    } catch (e) {
      showError(e);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDepartment(department) {
    const departmentId = department?.id ?? department?._id ?? department?.department_id;
    if (!departmentId) throw new Error("Department ID is missing.");
    setBusy(true);
    try {
      await api.deleteDepartment(token, departmentId);
      await loadDepartments(token);
      setNotice("Department deleted.");
    } catch (e) {
      showError(e);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyAudit() {
    setBusy(true);

    try {
      const result = await api.verifyAudit(token);
      setVerification(result?.data || result);
    } catch (e) {
      setVerification({ valid: false, message: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleGrantAccess({ documentId, targetType, targetId, permission }) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const numericDocumentId = Number(documentId);
      if (!Number.isInteger(numericDocumentId) || numericDocumentId <= 0) {
        throw new Error("Please select a valid document.");
      }

      if (!["read", "edit"].includes(permission)) {
        throw new Error("Permission must be Read or Edit.");
      }

      if (targetType === "user") {
        const email = String(targetId || "").trim().toLowerCase();
        if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
          throw new Error("Enter a valid registered user's email address.");
        }

        await api.grantUser(token, numericDocumentId, {
          email,
          permission,
        });
      } else if (targetType === "group") {
        const groupId = Number(targetId);
        if (!Number.isInteger(groupId) || groupId <= 0) {
          throw new Error("Please select a valid group.");
        }

        await api.grantGroup(token, numericDocumentId, {
          group_id: groupId,
          permission,
        });
      } else if (targetType === "department") {
        const departmentId = Number(targetId);
        if (!Number.isInteger(departmentId) || departmentId <= 0) {
          throw new Error("Please select a valid department.");
        }

        await api.grantDepartment(token, numericDocumentId, {
          department_id: departmentId,
          permission,
        });
      } else {
        throw new Error("Unsupported access target.");
      }

      setNotice("Access permission saved.");
      await loadDocuments(token, search);
    } catch (e) {
      showError(e);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function handleRevokeAccess({ documentId, targetType, targetId }) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const numericDocumentId = Number(documentId);
      if (!Number.isInteger(numericDocumentId) || numericDocumentId <= 0) {
        throw new Error("Please select a valid document.");
      }

      const numericTargetId = Number(targetId);
      if (!Number.isInteger(numericTargetId) || numericTargetId <= 0) {
        throw new Error(
          targetType === "user"
            ? "For user revoke, enter the user's numeric ID."
            : targetType === "group"
              ? "Please select a valid group."
              : "Please select a valid department."
        );
      }

      if (targetType === "user") {
        await api.revokeUser(token, numericDocumentId, numericTargetId);
      } else if (targetType === "group") {
        await api.revokeGroup(token, numericDocumentId, numericTargetId);
      } else if (targetType === "department") {
        await api.revokeDepartment(token, numericDocumentId, numericTargetId);
      } else {
        throw new Error("Unsupported access target.");
      }

      setNotice("Access permission revoked.");
      await loadDocuments(token, search);
    } catch (e) {
      showError(e);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return authPage === "login" ? (
      <LoginPage
        onLogin={handleLogin}
        onRegister={() => {
          setAuthError("");
          setAuthPage("register");
        }}
        busy={busy}
        error={authError}
      />
    ) : (
      <RegisterPage
        onRegister={handleRegister}
        onLogin={() => {
          setAuthError("");
          setAuthPage("login");
        }}
        busy={busy}
        error={authError}
      />
    );
  }

  const documentProps = {
    documents,
    onDownload: handleDownload,
    onEdit: setEditDocument,
    onDelete: setDeleteDocument,
    onShare: setShareDocument,
  };

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        currentPage={page}
        setCurrentPage={navigate}
        onLogout={logout}
      />

      <main className="main-area">
        <Topbar
          currentPage={page}
          user={user}
          searchTerm={search}
          onSearchChange={setSearch}
          onUpload={() => setUploadOpen(true)}
        />

        <div className="page-content">
          {error && (
            <div className="alert-error app-alert" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")}>×</button>
            </div>
          )}

          {notice && (
            <div className="alert-success app-alert" role="status">
              <span>✓ {notice}</span>
              <button type="button" onClick={() => setNotice("")}>×</button>
            </div>
          )}

          {page === "dashboard" && (
            <DashboardPage
              user={user}
              documents={documents}
              groups={groups}
              departments={departments}
              auditLogs={logs}
              onNavigate={navigate}
              onUpload={() => setUploadOpen(true)}
              onDownload={handleDownload}
              onShare={setShareDocument}
            />
          )}

          {page === "documents" && (
            <DocumentsPage
              {...documentProps}
              loading={busy}
              searchTerm={search}
              onSearchChange={setSearch}
              onUpload={() => setUploadOpen(true)}
              onRefresh={() => loadDocuments(token, search)}
            />
          )}

          {page === "groups" && (
            <GroupsPage
              groups={groups}
              loading={busy}
              token={token}
              user={user}
              onCreateGroup={handleCreateGroup}
              onAddMember={handleAddGroupMember}
              onRemoveMember={handleRemoveGroupMember}
              onRefresh={() => loadGroups(token)}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {page === "departments" && (
            isAdmin ? (
              <DepartmentsPage
                departments={departments}
                loading={busy}
                token={token}
                user={user}
                onCreateDepartment={handleCreateDepartment}
                onAddMember={handleAddDepartmentMember}
                onRemoveMember={handleRemoveDepartmentMember}
                onUpdateDepartment={handleUpdateDepartment}
                onDeleteDepartment={handleDeleteDepartment}
                onRefresh={() => loadDepartments(token)}
                onNotice={setNotice}
                onError={showError}
              />
            ) : (
              <section className="panel">
                <h2>Access restricted</h2>
                <p>Department management requires administrator access.</p>
              </section>
            )
          )}

          {page === "access" && (
            <AccessManagementPage
              documents={documents}
              groups={groups}
              departments={departments}
              onGrantAccess={handleGrantAccess}
              onRevokeAccess={handleRevokeAccess}
              onRefresh={() => loadDocuments(token, search)}
              loading={busy}
            />
          )}

          {page === "audit" && (
            isAdmin ? (
              <AuditPage
                auditLogs={logs}
                logs={logs}
                loading={busy}
                verification={verification}
                onVerify={handleVerifyAudit}
                onRefresh={() => loadAudit(token)}
                busy={busy}
              />
            ) : (
              <section className="panel">
                <h2>Access restricted</h2>
                <p>Audit logs require administrator permissions.</p>
              </section>
            )
          )}
        </div>

        <footer className="app-footer">
          <span>TrustVault © {new Date().getFullYear()}</span>
          <span>Secure document workspace</span>
        </footer>
      </main>

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onSubmit={handleUpload}
          onUpload={handleUpload}
          busy={busy}
          loading={busy}
        />
      )}

      {shareDocument && (
        <ShareModal
          document={shareDocument}
          groups={groups}
          departments={departments}
          onClose={() => setShareDocument(null)}
          onSubmit={handleShare}
          onShare={handleShare}
          busy={busy}
          loading={busy}
        />
      )}

      {editDocument && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={handleEditSubmit}>
            <div className="modal-heading">
              <div>
                <h2>Edit document</h2>
                <p>Update document details.</p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setEditDocument(null)}
              >
                ×
              </button>
            </div>

            <label className="field">
              Title
              <input
                required
                value={editDocument.title || ""}
                onChange={(e) =>
                  setEditDocument({ ...editDocument, title: e.target.value })
                }
              />
            </label>

            <label className="field">
              Category
              <input
                value={editDocument.category || ""}
                onChange={(e) =>
                  setEditDocument({ ...editDocument, category: e.target.value })
                }
              />
            </label>

            <label className="field">
              Description
              <textarea
                rows="3"
                value={editDocument.description || ""}
                onChange={(e) =>
                  setEditDocument({
                    ...editDocument,
                    description: e.target.value,
                  })
                }
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditDocument(null)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteDocument && (
        <ConfirmModal
          title="Delete document?"
          message={`"${deleteDocument.title || deleteDocument.filename || "This document"}" will be deleted if the server authorizes this action.`}
          onCancel={() => setDeleteDocument(null)}
          onClose={() => setDeleteDocument(null)}
          onConfirm={handleDelete}
          busy={busy}
          loading={busy}
        />
      )}
    </div>
  );
}
