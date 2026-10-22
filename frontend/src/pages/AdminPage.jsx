
import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { Users, History, RefreshCw, Save, X } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function getId(user) {
  return user?.id ?? user?.user_id ?? user?._id;
}

export default function AdminPage({
  token,
  user,
  logs = [],
  onLogsChange,
  onError,
  onNotice,
  onRefresh,
  initialTab = "users",
}) {
  const [tab, setTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState(logs);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState({});

  const role = String(user?.role || "").toLowerCase();
  const isAdmin = ["admin", "owner"].includes(role);

  const showError = useCallback(
    (message) => {
      setError(message);
      onError?.(message);
    },
    [onError]
  );

  const loadUsers = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const result = await api.adminUsers(token);
      const rows = Array.isArray(result)
        ? result
        : result?.users || result?.data?.users || result?.data || [];

      setUsers(Array.isArray(rows) ? rows : []);
    } catch (e) {
      showError(e.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  const loadHistory = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const result = await api.audit(token);
      const rows = Array.isArray(result)
        ? result
        : result?.logs || result?.audit || result?.data?.logs || [];

      const realEntries = Array.isArray(rows) ? rows : [];
      setHistory(realEntries);
      onLogsChange?.(realEntries);
    } catch (e) {
      showError(e.message || "Unable to load audit history.");
    } finally {
      setLoading(false);
    }
  }, [token, showError, onLogsChange]);

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "history") loadHistory();
  }, [tab, loadUsers, loadHistory]);

  useEffect(() => {
    setHistory(Array.isArray(logs) ? logs : []);
  }, [logs]);

  async function saveRole(item) {
    if (!isAdmin) {
      showError("Only an administrator can change user roles.");
      return;
    }

    const id = getId(item);
    const nextRole = edits[id]?.role ?? item.role ?? "viewer";
    const nextName = edits[id]?.name ?? item.name ?? item.username ?? "";

    if (id == null) {
      showError("User ID is missing.");
      return;
    }

    if (!["viewer", "editor", "owner"].includes(nextRole)) {
      showError("Please select a valid role.");
      return;
    }

    setSavingId(id);
    setError("");

    try {
      // Requires PATCH /api/admin/users/<id> on the backend.
      await api.updateUser(token, id, {
        name: nextName.trim(),
        role: nextRole,
      });

      setUsers((current) =>
        current.map((entry) =>
          String(getId(entry)) === String(id)
            ? { ...entry, name: nextName.trim(), role: nextRole }
            : entry
        )
      );

      setEdits((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      onNotice?.("User details saved successfully.");

      // Reload persisted audit records. Never add fake history entries.
      await loadHistory();
    } catch (e) {
      showError(e.message || "Could not save user changes.");
    } finally {
      setSavingId(null);
    }
  }

  const query = search.trim().toLowerCase();

  const visibleUsers = users.filter((item) =>
    [item.name, item.username, item.email, item.role]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );

  const visibleHistory = history.filter((item) =>
    [
      item.action,
      item.event,
      item.actor,
      item.user,
      item.email,
      item.resource,
      item.details,
      item.entry_hash,
      item.entryHash,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );

  return (
    <div className="tv-admin">
      <style>{`
        .tv-admin { color:#172033; font-family:Inter,system-ui,sans-serif; }
        .tv-admin * { box-sizing:border-box; }
        .tv-admin-header { display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:22px; }
        .tv-admin h1 { margin:0;font-size:26px;font-weight:800; }
        .tv-admin-sub { margin:7px 0 0;color:#78869b;font-size:12px; }
        .tv-admin-actions { display:flex;gap:8px;flex-wrap:wrap; }
        .tv-admin-btn { display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid #dce3ed;background:white;color:#34425a;border-radius:9px;padding:10px 13px;font-size:12px;font-weight:700;cursor:pointer; }
        .tv-admin-btn:disabled { opacity:.55;cursor:not-allowed; }
        .tv-admin-btn-primary { background:#315de8;color:white;border-color:#315de8; }
        .tv-admin-tabs { display:flex;gap:8px;border-bottom:1px solid #e3e8f1;margin-bottom:18px; }
        .tv-admin-tab { display:flex;align-items:center;gap:8px;padding:12px 15px;border:0;border-bottom:3px solid transparent;background:transparent;color:#758198;font-weight:750;font-size:12px;cursor:pointer; }
        .tv-admin-tab.active { color:#315de8;border-bottom-color:#315de8; }
        .tv-admin-card { background:white;border:1px solid #e6ebf3;border-radius:14px;padding:20px; }
        .tv-admin-card-head { display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:17px; }
        .tv-admin-card h2 { margin:0;font-size:16px;font-weight:800; }
        .tv-admin-search { width:min(100%,320px);border:1px solid #dce3ed;border-radius:9px;padding:10px 12px;font:inherit;font-size:12px;outline:none; }
        .tv-admin-search:focus { border-color:#315de8; }
        .tv-admin-table-wrap { width:100%;overflow-x:auto; }
        .tv-admin-table { width:100%;border-collapse:collapse;text-align:left;font-size:12px; }
        .tv-admin-table th { padding:13px 10px;background:#f7f9fd;color:#7b879a;font-size:10px;text-transform:uppercase;letter-spacing:.6px;white-space:nowrap; }
        .tv-admin-table td { padding:13px 10px;border-bottom:1px solid #edf0f5;vertical-align:middle; }
        .tv-admin-table tr:last-child td { border-bottom:0; }
        .tv-admin-main { color:#26344b;font-weight:750; }
        .tv-admin-muted { margin-top:4px;color:#8490a3;font-size:11px;overflow-wrap:anywhere; }
        .tv-admin-select { min-width:110px;border:1px solid #dce3ed;border-radius:8px;padding:8px;background:white;font-size:12px; }
        .tv-admin-alert { margin-bottom:14px;padding:12px 14px;border-radius:9px;background:#fff0f1;color:#a52c38;font-size:12px;white-space:pre-wrap; }
        .tv-admin-empty { padding:40px 16px;text-align:center;color:#7b879a;font-size:12px; }
        .tv-admin-empty strong { display:block;color:#34415a;font-size:14px;margin-bottom:7px; }
        .tv-admin-status { display:inline-block;padding:5px 8px;border-radius:6px;background:#eef2ff;color:#315de8;font-size:10px;font-weight:800; }
        @media(max-width:650px) { .tv-admin-card { padding:13px; } .tv-admin h1 { font-size:22px; } }
      `}</style>

      <div className="tv-admin-header">
        <div>
          <h1>{tab === "users" ? "Users" : "History"}</h1>
          <p className="tv-admin-sub">
            {tab === "users"
              ? "Manage user information and access roles."
              : "Real audit records stored by the backend."}
          </p>
        </div>

        <div className="tv-admin-actions">
          <button
            className="tv-admin-btn"
            onClick={() => {
              if (tab === "users") loadUsers();
              else loadHistory();
              onRefresh?.();
            }}
            disabled={loading}
          >
            <RefreshCw size={14} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="tv-admin-tabs">
        <button
          className={`tv-admin-tab ${tab === "users" ? "active" : ""}`}
          onClick={() => {
            setTab("users");
            setSearch("");
          }}
        >
          <Users size={16} /> Users
        </button>

        <button
          className={`tv-admin-tab ${tab === "history" ? "active" : ""}`}
          onClick={() => {
            setTab("history");
            setSearch("");
          }}
        >
          <History size={16} /> History
        </button>
      </div>

      {error && (
        <div className="tv-admin-alert" role="alert">{error}</div>
      )}

      <section className="tv-admin-card">
        <div className="tv-admin-card-head">
          <h2>{tab === "users" ? "All users" : "Audit history"}</h2>
          <input
            className="tv-admin-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tab === "users" ? "Search users..." : "Search history..."}
          />
        </div>

        {tab === "users" ? (
          !visibleUsers.length ? (
            <div className="tv-admin-empty">
              <strong>{loading ? "Loading users..." : "No users found"}</strong>
              {loading ? "Please wait." : "Users returned by the server will appear here."}
            </div>
          ) : (
            <div className="tv-admin-table-wrap">
              <table className="tv-admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Current role</th>
                    <th>Change role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((item, index) => {
                    const id = getId(item) ?? item.email ?? index;
                    const selectedRole = edits[id]?.role ?? item.role ?? "viewer";
                    const selectedName = edits[id]?.name ?? item.name ?? item.username ?? "";

                    return (
                      <tr key={id}>
                        <td>
                          <div className="tv-admin-main">
                            {item.name || item.username || "Unnamed user"}
                          </div>
                          <div className="tv-admin-muted">
                            {item.email || "No email"}
                          </div>
                        </td>

                        <td>
                          <span className="tv-admin-status">
                            {item.role || "viewer"}
                          </span>
                        </td>

                        <td>
                          <select
                            className="tv-admin-select"
                            value={selectedRole}
                            disabled={!isAdmin || savingId === id}
                            onChange={(event) =>
                              setEdits((current) => ({
                                ...current,
                                [id]: {
                                  ...current[id],
                                  name: selectedName,
                                  role: event.target.value,
                                },
                              }))
                            }
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="owner">Owner</option>
                          </select>
                        </td>

                        <td>
                          <button
                            className="tv-admin-btn tv-admin-btn-primary"
                            disabled={
                              !isAdmin ||
                              savingId === id ||
                              (selectedRole === (item.role || "viewer") &&
                                selectedName === (item.name || item.username || ""))
                            }
                            onClick={() => saveRole(item)}
                          >
                            <Save size={13} />
                            {savingId === id ? "Saving..." : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          !visibleHistory.length ? (
            <div className="tv-admin-empty">
              <strong>{loading ? "Loading history..." : "No audit records yet"}</strong>
              {loading
                ? "Please wait while records are fetched."
                : "Nothing is displayed until the backend stores real audit events."}
            </div>
          ) : (
            <div className="tv-admin-table-wrap">
              <table className="tv-admin-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Details</th>
                    <th>Date & time</th>
                    <th>Entry hash</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleHistory.map((item, index) => {
                    const hash = item.entry_hash || item.entryHash || item.hash;

                    return (
                      <tr key={item.id ?? item._id ?? hash ?? index}>
                        <td className="tv-admin-main">
                          {item.action || item.event || "Audit event"}
                        </td>
                        <td>{item.actor || item.user || item.email || "System"}</td>
                        <td>{item.details || item.resource || "—"}</td>
                        <td>{formatDate(item.created_at || item.timestamp || item.date)}</td>
                        <td title={hash || ""}>
                          {hash ? `${String(hash).slice(0, 12)}…` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>
    </div>
  );
}
