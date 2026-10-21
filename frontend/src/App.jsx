import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import UploadModal from "./components/UploadModal";
import ShareModal from "./components/ShareModal";
import ConfirmModal from "./components/ConfirmModal";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import GroupsPage from "./pages/GroupsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import AuditPage from "./pages/AuditPage";

const TOKEN_KEY = "trustvault_token";

function getToken(result) {
  return result?.access_token || result?.accessToken || result?.token || result?.data?.access_token || result?.data?.token;
}

function getUser(result) {
  return result?.user || result?.data?.user || result?.data || result;
}

function getError(error) {
  return error?.message || "Something went wrong. Please try again.";
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [authPage, setAuthPage] = useState("login");
  const [authError, setAuthError] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shareDocument, setShareDocument] = useState(null);
  const [editDocument, setEditDocument] = useState(null);
  const [deleteDocument, setDeleteDocument] = useState(null);

  const isAdmin = ["admin", "owner"].includes(String(user?.role || "").toLowerCase());

  const logout = useCallback(async () => {
    try {
      if (token) await api.logout(token);
    } catch {
      // Clear local session even if the server logout request fails.
    }
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setDocuments([]);
    setGroups([]);
    setDepartments([]);
    setLogs([]);
    setPage("Dashboard");
    setAuthError("");
    setError("");
  }, [token]);

  const loadData = useCallback(async (activeToken) => {
    setError("");
    const result = await api.documents(activeToken, search);
    setDocuments(Array.isArray(result) ? result : result?.documents || result?.data?.documents || []);

    try {
      const r = await api.groups(activeToken);
      setGroups(Array.isArray(r) ? r : r?.groups || r?.data?.groups || []);
    } catch {
      setGroups([]);
    }

    if (["admin", "owner"].includes(String(user?.role || "").toLowerCase())) {
      try {
        const r = await api.departments(activeToken);
        setDepartments(Array.isArray(r) ? r : r?.departments || r?.data?.departments || []);
      } catch {
        setDepartments([]);
      }
    }
  }, [search, user?.role]);

  useEffect(() => {
    if (!token) return;
    let alive = true;

    async function initialize() {
      try {
        const result = await api.me(token);
        if (!alive) return;
        setUser(getUser(result));
        const docs = await api.documents(token, search);
        if (!alive) return;
        setDocuments(Array.isArray(docs) ? docs : docs?.documents || docs?.data?.documents || []);
      } catch {
        if (alive) {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken("");
          setUser(null);
        }
      }
    }

    initialize();
    return () => { alive = false; };
  }, [token]); // Initialize the session when the token changes.

  useEffect(() => {
    if (!token || !user) return;
    const timer = setTimeout(() => {
      api.documents(token, search)
        .then((r) => setDocuments(Array.isArray(r) ? r : r?.documents || r?.data?.documents || []))
        .catch((e) => setError(getError(e)));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, token, user]);

  useEffect(() => {
    if (!token || !user) return;
    if (page === "Groups") {
      api.groups(token)
        .then((r) => setGroups(Array.isArray(r) ? r : r?.groups || r?.data?.groups || []))
        .catch((e) => setError(getError(e)));
    }
    if (page === "Departments" && isAdmin) {
      api.departments(token)
        .then((r) => setDepartments(Array.isArray(r) ? r : r?.departments || r?.data?.departments || []))
        .catch((e) => setError(getError(e)));
    }
    if (page === "Audit Logs" && isAdmin) {
      api.audit(token)
        .then((r) => setLogs(Array.isArray(r) ? r : r?.logs || r?.data?.logs || []))
        .catch((e) => setError(getError(e)));
    }
  }, [page, token, user, isAdmin]);

  async function handleLogin(credentials) {
    setBusy(true);
    setAuthError("");
    try {
      const result = await api.login(credentials);
      const newToken = getToken(result);
      if (!newToken) throw new Error("Login response did not contain an access token. Check your backend login response.");
      sessionStorage.setItem(TOKEN_KEY, newToken);
      setUser(getUser(result));
      setToken(newToken);
    } catch (e) {
      setAuthError(getError(e));
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
      setAuthError("Account created if registration succeeded. Please sign in.");
    } catch (e) {
      setAuthError(getError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(formData) {
    setBusy(true);
    try {
      await api.upload(token, formData);
      setUploadOpen(false);
      setNotice("Document uploaded successfully.");
      await loadData(token);
    } catch (e) {
      setError(getError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(doc) {
    try {
      const data = await api.download(token, doc.id);
      const blob = data instanceof Blob ? data : new Blob([data], { type: doc.mime_type || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.original_filename || `${doc.title || "document"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(getError(e));
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editDocument) return;
    setBusy(true);
    try {
      await api.edit(token, editDocument.id, {
        title: editDocument.title,
        category: editDocument.category,
        description: editDocument.description || "",
      });
      setEditDocument(null);
      setNotice("Document updated.");
      await loadData(token);
    } catch (e) {
      setError(getError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await api.remove(token, deleteDocument.id);
      setDeleteDocument(null);
      setNotice("Document deleted.");
      await loadData(token);
    } catch (e) {
      setError(getError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleShare(target, payload) {
    setBusy(true);
    try {
      if (target === "user") await api.grantUser(token, shareDocument.id, payload);
      else if (target === "group") await api.grantGroup(token, shareDocument.id, payload);
      else await api.grantDepartment(token, shareDocument.id, payload);
      setShareDocument(null);
      setNotice("Sharing permission saved.");
    } catch (e) {
      setError(getError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateGroup(payload) {
    setBusy(true);
    try {
      await api.createGroup(token, payload);
      const r = await api.groups(token);
      setGroups(Array.isArray(r) ? r : r?.groups || r?.data?.groups || []);
      setNotice("Group created.");
    } catch (e) {
      setError(getError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleAddGroupMember(id, payload) {
    setBusy(true);
    try {
      await api.addGroupMember(token, id, payload);
      setNotice("Group member added.");
    } catch (e) {
      setError(getError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateDepartment(payload) {
    setBusy(true);
    try {
      await api.createDepartment(token, payload);
      const r = await api.departments(token);
      setDepartments(Array.isArray(r) ? r : r?.departments || r?.data?.departments || []);
      setNotice("Department created.");
    } catch (e) {
      setError(getError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleAddDepartmentMember(payload) {
    setBusy(true);
    try {
      await api.addDepartmentMember(token, payload);
      setNotice("Department member assigned.");
    } catch (e) {
      setError(getError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyAudit() {
    setBusy(true);
    setVerification(null);
    try {
      const r = await api.verifyAudit(token);
      setVerification(r?.data || r);
    } catch (e) {
      setVerification({ valid: false, message: getError(e) });
    } finally {
      setBusy(false);
    }
  }

  const filteredDocuments = useMemo(() => documents, [documents]);

  if (!token) {
    return authPage === "login" ? (
      <LoginPage onLogin={handleLogin} onRegister={() => { setAuthError(""); setAuthPage("register"); }} busy={busy} error={authError} />
    ) : (
      <RegisterPage onRegister={handleRegister} onLogin={() => { setAuthError(""); setAuthPage("login"); }} busy={busy} error={authError} />
    );
  }

  const commonDocumentProps = {
    documents: filteredDocuments,
    onDownload: handleDownload,
    onEdit: setEditDocument,
    onDelete: setDeleteDocument,
    onShare: setShareDocument,
  };

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={(p) => { setPage(p); setError(""); setNotice(""); }} user={user} onLogout={logout} />

      <main className="main-area">
        <Topbar page={page} search={search} setSearch={setSearch} onUpload={() => setUploadOpen(true)} />

        <div className="page-content">
          {error && <div className="alert-error app-alert"><span>{error}</span><button onClick={() => setError("")}>×</button></div>}
          {notice && <div className="alert-success app-alert"><span>✓ {notice}</span><button onClick={() => setNotice("")}>×</button></div>}

          {page === "Dashboard" && <DashboardPage {...commonDocumentProps} onUpload={() => setUploadOpen(true)} />}
          {page === "Documents" && <DocumentsPage {...commonDocumentProps} />}
          {page === "Groups" && <GroupsPage groups={groups} onCreate={handleCreateGroup} onAddMember={handleAddGroupMember} busy={busy} />}
          {page === "Departments" && (
            isAdmin
              ? <DepartmentsPage departments={departments} onCreate={handleCreateDepartment} onAddMember={handleAddDepartmentMember} busy={busy} />
              : <section className="panel"><h2>Access restricted</h2><p className="muted">Department management requires administrator permissions.</p></section>
          )}
          {page === "Audit Logs" && (
            isAdmin
              ? <AuditPage logs={logs} verification={verification} onVerify={handleVerifyAudit} busy={busy} />
              : <section className="panel"><h2>Access restricted</h2><p className="muted">Audit logs require administrator permissions.</p></section>
          )}
        </div>

        <footer className="app-footer"><span>TrustVault © {new Date().getFullYear()}</span><span>Secure document workspace</span></footer>
      </main>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onSubmit={handleUpload} busy={busy} />}
      {shareDocument && <ShareModal document={shareDocument} onClose={() => setShareDocument(null)} onSubmit={handleShare} busy={busy} />}

      {editDocument && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={handleEditSubmit}>
            <div className="modal-heading"><div><h2>Edit document</h2><p>Update document details.</p></div><button type="button" className="close-btn" onClick={() => setEditDocument(null)}>×</button></div>
            <label className="field">Title<input required value={editDocument.title || ""} onChange={(e) => setEditDocument({ ...editDocument, title: e.target.value })} /></label>
            <label className="field">Category<input value={editDocument.category || ""} onChange={(e) => setEditDocument({ ...editDocument, category: e.target.value })} /></label>
            <label className="field">Description<textarea rows="3" value={editDocument.description || ""} onChange={(e) => setEditDocument({ ...editDocument, description: e.target.value })} /></label>
            <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditDocument(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button></div>
          </form>
        </div>
      )}

      {deleteDocument && (
        <ConfirmModal
          title="Delete document?"
          message={`"${deleteDocument.title}" will be deleted if the server authorizes this action.`}
          onCancel={() => setDeleteDocument(null)}
          onConfirm={handleDelete}
          busy={busy}
        />
      )}
    </div>
  );
}