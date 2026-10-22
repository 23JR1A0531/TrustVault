
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
import AdminPage from "./pages/AdminPage";

const TOKEN_KEY = "trustvault_token";

function getToken(result) {
  return (
    result?.access_token ||
    result?.accessToken ||
    result?.token ||
    result?.data?.access_token ||
    result?.data?.token
  );
}

function getUser(result) {
  return result?.user || result?.data?.user || result?.data || result;
}

function getError(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function unwrapList(result, key) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.[key])) return result[key];
  if (Array.isArray(result?.data?.[key])) return result.data[key];
  return [];
}

export default function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY) || ""
  );
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

  const role = String(user?.role || "viewer").toLowerCase();
  const isAdmin = ["admin", "owner"].includes(role);

  // Stable callbacks: prevent AdminPage refresh effects from looping.
  const handleAdminError = useCallback((message) => {
    setError(message);
  }, []);

  const handleAdminNotice = useCallback((message) => {
    setNotice(message);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) await api.logout(token);
    } catch {
      // Clear the local session even if the logout request fails.
    }

    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setDocuments([]);
    setGroups([]);
    setDepartments([]);
    setLogs([]);
    setVerification(null);
    setPage("Dashboard");
    setAuthError("");
    setError("");
    setNotice("");
  }, [token]);

  const loadData = useCallback(
    async (activeToken) => {
      if (!activeToken) return;

      setError("");

      try {
        const result = await api.documents(activeToken, search);
        setDocuments(unwrapList(result, "documents"));
      } catch (e) {
        setError(getError(e));
      }

      try {
        const result = await api.groups(activeToken);
        setGroups(unwrapList(result, "groups"));
      } catch {
        setGroups([]);
      }

      try {
        const result = await api.departments(activeToken);
        setDepartments(unwrapList(result, "departments"));
      } catch {
        setDepartments([]);
      }
    },
    [search]
  );

  const loadAdminData = useCallback(async () => {
    if (!token) return;

    try {
      const result = await api.audit(token);
      setLogs(unwrapList(result, "logs"));
    } catch (e) {
      setLogs([]);
      setError(getError(e));
    }
  }, [token]);

  // Initialize the authenticated session.
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

        setDocuments(unwrapList(docs, "documents"));
      } catch {
        if (alive) {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken("");
          setUser(null);
        }
      }
    }

    initialize();

    return () => {
      alive = false;
    };
    // Initialize only when the session token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Search documents with a short debounce.
  useEffect(() => {
    if (!token || !user) return;

    let alive = true;

    const timer = setTimeout(() => {
      api.documents(token, search)
        .then((result) => {
          if (alive) setDocuments(unwrapList(result, "documents"));
        })
        .catch((e) => {
          if (alive) setError(getError(e));
        });
    }, 300);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [search, token, user]);

  // Load data required by the selected section.
  useEffect(() => {
    if (!token || !user) return;

    let alive = true;

    if (page === "Groups") {
      api.groups(token)
        .then((result) => {
          if (alive) setGroups(unwrapList(result, "groups"));
        })
        .catch((e) => {
          if (alive) setError(getError(e));
        });
    }

    if (page === "Departments") {
      api.departments(token)
        .then((result) => {
          if (alive) {
            setDepartments(unwrapList(result, "departments"));
          }
        })
        .catch((e) => {
          if (alive) setError(getError(e));
        });
    }

    if (
      page === "Admin Dashboard" ||
      page === "Users / Email" ||
      page === "History"
    ) {
      loadAdminData();
    }

    return () => {
      alive = false;
    };
  }, [page, token, user, loadAdminData]);

  async function handleLogin(credentials) {
    setBusy(true);
    setAuthError("");

    try {
      const result = await api.login(credentials);
      const newToken = getToken(result);

      if (!newToken) {
        throw new Error(
          "Login response did not contain an access token."
        );
      }

      sessionStorage.setItem(TOKEN_KEY, newToken);
      setUser(getUser(result));
      setToken(newToken);
      setPage("Dashboard");
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
      setAuthError("Registration submitted. Please sign in.");
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
      const blob =
        data instanceof Blob
          ? data
          : new Blob([data], {
              type: doc.mime_type || "application/octet-stream",
            });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        doc.original_filename || `${doc.title || "document"}`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(getError(e));
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
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
    if (!deleteDocument) return;

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
    if (!shareDocument) return;

    setBusy(true);

    try {
      if (target === "user") {
        await api.grantUser(token, shareDocument.id, payload);
      } else if (target === "group") {
        await api.grantGroup(token, shareDocument.id, payload);
      } else {
        await api.grantDepartment(token, shareDocument.id, payload);
      }

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
      const result = await api.groups(token);
      setGroups(unwrapList(result, "groups"));
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
      const result = await api.departments(token);
      setDepartments(unwrapList(result, "departments"));
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
      const result = await api.verifyAudit(token);
      setVerification(result?.data || result);
    } catch (e) {
      setVerification({
        valid: false,
        message: getError(e),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleAdminRefresh() {
    await Promise.all([loadData(token), loadAdminData()]);
  }

  const filteredDocuments = useMemo(
    () => documents,
    [documents]
  );

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

  const commonDocumentProps = {
    documents: filteredDocuments,
    onDownload: handleDownload,
    onEdit: setEditDocument,
    onDelete: setDeleteDocument,
    onShare: setShareDocument,
  };

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={(nextPage) => {
          setPage(nextPage);
          setError("");
          setNotice("");
        }}
        user={user}
        onLogout={logout}
      />

      <main className="main-area">
        <Topbar
          page={page}
          search={search}
          setSearch={setSearch}
          onUpload={() => setUploadOpen(true)}
        />

        <div className="page-content">
          {error && (
            <div className="alert-error app-alert">
              <span>{error}</span>
              <button onClick={() => setError("")}>×</button>
            </div>
          )}

          {notice && (
            <div className="alert-success app-alert">
              <span>✓ {notice}</span>
              <button onClick={() => setNotice("")}>×</button>
            </div>
          )}

          {page === "Dashboard" && (
            <DashboardPage
              {...commonDocumentProps}
              onUpload={() => setUploadOpen(true)}
            />
          )}

          {page === "Documents" && (
            <DocumentsPage {...commonDocumentProps} />
          )}

          {page === "Groups" && (
            <GroupsPage
              groups={groups}
              onCreate={handleCreateGroup}
              onAddMember={handleAddGroupMember}
              busy={busy}
            />
          )}

          {page === "Departments" && (
            <DepartmentsPage
              departments={departments}
              onCreate={handleCreateDepartment}
              onAddMember={handleAddDepartmentMember}
              busy={busy}
            />
          )}

          {(page === "Users" ||
            page === "Users / Email" ||
            page === "History" ||
            page === "Admin Dashboard") && (
            <AdminPage
              token={token}
              user={user}
              documents={documents}
              logs={logs}
              verification={verification}
              busy={busy}
              initialTab={page === "History" ? "history" : "users"}
              onVerify={handleVerifyAudit}
              onRefresh={handleAdminRefresh}
              onError={handleAdminError}
              onNotice={handleAdminNotice}
              onLogsChange={setLogs}
            />
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
          busy={busy}
        />
      )}

      {shareDocument && (
        <ShareModal
          document={shareDocument}
          onClose={() => setShareDocument(null)}
          onSubmit={handleShare}
          busy={busy}
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
                onChange={(event) =>
                  setEditDocument({
                    ...editDocument,
                    title: event.target.value,
                  })
                }
              />
            </label>

            <label className="field">
              Category
              <input
                value={editDocument.category || ""}
                onChange={(event) =>
                  setEditDocument({
                    ...editDocument,
                    category: event.target.value,
                  })
                }
              />
            </label>

            <label className="field">
              Description
              <textarea
                rows="3"
                value={editDocument.description || ""}
                onChange={(event) =>
                  setEditDocument({
                    ...editDocument,
                    description: event.target.value,
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
          message={`"${deleteDocument.title}" will be deleted if the server authorizes this action.`}
          onCancel={() => setDeleteDocument(null)}
          onConfirm={handleDelete}
          busy={busy}
        />
      )}
    </div>
  );
}
