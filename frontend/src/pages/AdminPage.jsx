
import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:5000/api";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "documents", label: "Documents", icon: "▤" },
  { id: "groups", label: "Groups", icon: "◫" },
  { id: "departments", label: "Departments", icon: "⌂" },
  { id: "users", label: "Users", icon: "♙" },
  { id: "history", label: "History", icon: "◷" },
];

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status})`
    );
  }

  return data;
}

function getArray(data, ...keys) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function getId(item) {
  return item?.id ?? item?._id ?? item?.user_id ?? item?.document_id;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

function StatusBadge({ value }) {
  const status = String(value || "Unknown");
  const normalized = status.toLowerCase();

  let className = "status-neutral";

  if (
    ["approved", "active", "verified", "success", "completed"].includes(
      normalized
    )
  ) {
    className = "status-success";
  } else if (
    ["pending", "processing", "in progress"].includes(normalized)
  ) {
    className = "status-pending";
  } else if (
    ["rejected", "blocked", "failed", "inactive", "revoked"].includes(
      normalized
    )
  ) {
    className = "status-danger";
  }

  return <span className={`admin-status ${className}`}>{status}</span>;
}

function EmptyState({ title, description }) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-icon">▤</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function DataTable({ columns, rows, emptyTitle, emptyDescription }) {
  if (!rows.length) {
    return (
      <EmptyState
        title={emptyTitle || "No records found"}
        description={emptyDescription || "Data will appear here when available."}
      />
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={getId(row) ?? row.email ?? row.name ?? index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row)
                    : row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage({
  token,
  user,
  documents: initialDocuments = [],
  logs: initialLogs = [],
  verification,
  busy = false,
  initialTab = "overview",
  onVerify,
  onRefresh,
  onError,
  onNotice,
  onLogsChange,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState(initialDocuments);
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [logs, setLogs] = useState(initialLogs);

  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const [localError, setLocalError] = useState("");
  const [localNotice, setLocalNotice] = useState("");
  const [search, setSearch] = useState("");

  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("viewer");

  const [creating, setCreating] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  const isAdmin =
    String(user?.role || "").toLowerCase() === "admin" ||
    String(user?.role || "").toLowerCase() === "owner";

  const notifyError = useCallback(
    (message) => {
      setLocalError(message);
      setLocalNotice("");
      onError?.(message);
    },
    [onError]
  );

  const notifySuccess = useCallback(
    (message) => {
      setLocalNotice(message);
      setLocalError("");
      onNotice?.(message);
    },
    [onNotice]
  );

  const refresh = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setLocalError("Authentication token is missing. Please log in again.");
      return;
    }

    setLoading(true);
    setLocalError("");

    const endpoints = [
      ["/admin/users", setUsers, ["users", "data"]],
      ["/documents", setDocuments, ["documents", "data"]],
      ["/groups", setGroups, ["groups", "data"]],
      ["/departments", setDepartments, ["departments", "data"]],
      ["/admin/audit", setLogs, ["logs", "audit", "data"]],
    ];

    const results = await Promise.allSettled(
      endpoints.map(([path]) => apiRequest(path, token))
    );

    const errors = [];

    results.forEach((result, index) => {
      const [path, setter, keys] = endpoints[index];

      if (result.status === "fulfilled") {
        const items = getArray(result.value, ...keys);
        setter(items);

        if (path === "/admin/audit") {
          onLogsChange?.(items);
        }
      } else {
        errors.push(`${path}: ${result.reason?.message || "Request failed"}`);
      }
    });

    if (errors.length) {
      setLocalError(errors.join("\n"));
    }

    setLoading(false);
  }, [token, onLogsChange]);

  // Runs when the authentication token or refresh function changes.
  // Stable callbacks in App.jsx prevent accidental repeated requests.
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setActiveTab(initialTab || "overview");
  }, [initialTab]);

  useEffect(() => {
    setDocuments(initialDocuments || []);
  }, [initialDocuments]);

  useEffect(() => {
    setLogs(initialLogs || []);
  }, [initialLogs]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((item) =>
      [
        item.name,
        item.username,
        item.email,
        item.role,
        item.approval_status,
        item.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [users, search]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return documents;

    return documents.filter((item) =>
      [
        item.name,
        item.filename,
        item.title,
        item.owner_name,
        item.owner_email,
        item.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [documents, search]);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return groups.filter((item) =>
      !query ||
      [item.name, item.description, item.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [groups, search]);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return departments.filter((item) =>
      !query ||
      [item.name, item.description, item.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [departments, search]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((item) =>
      !query ||
      [
        item.action,
        item.event,
        item.actor,
        item.user,
        item.email,
        item.resource,
        item.details,
        item.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [logs, search]);

  function startEditing(item) {
    setEditingUserId(getId(item));
    setEditName(item.name || item.username || "");
    setEditRole(item.role || "viewer");
    setLocalError("");
    setLocalNotice("");
  }

  async function saveUser(item) {
    const id = getId(item);

    if (id == null) {
      notifyError("User ID is missing. Cannot update this user.");
      return;
    }

    if (!editName.trim()) {
      notifyError("Username cannot be empty.");
      return;
    }

    setSavingUserId(id);
    setLocalError("");
    setLocalNotice("");

    try {
      // This expects PATCH /api/admin/users/<id> on the backend.
      const updated = await apiRequest(
        `/admin/users/${encodeURIComponent(id)}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: editName.trim(),
            role: editRole,
          }),
        }
      );

      const updatedUser = updated.user || updated.data || updated;

      setUsers((current) =>
        current.map((entry) =>
          String(getId(entry)) === String(id)
            ? { ...entry, ...updatedUser, name: editName.trim(), role: editRole }
            : entry
        )
      );

      setEditingUserId(null);
      notifySuccess("User information updated successfully.");
    } catch (error) {
      notifyError(error.message || "Could not update user.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function setApproval(item, approvalStatus) {
    const id = getId(item);

    if (id == null) {
      notifyError("User ID is missing.");
      return;
    }

    setSavingUserId(id);
    setLocalError("");
    setLocalNotice("");

    try {
      const result = await apiRequest(
        `/admin/users/${encodeURIComponent(id)}/approval`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ approval_status: approvalStatus }),
        }
      );

      setUsers((current) =>
        current.map((entry) =>
          String(getId(entry)) === String(id)
            ? {
                ...entry,
                ...(result.user || result.data || {}),
                approval_status: approvalStatus,
              }
            : entry
        )
      );

      notifySuccess(`User ${approvalStatus.toLowerCase()} successfully.`);
    } catch (error) {
      notifyError(error.message || "Could not update approval status.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function createItem(type) {
    const name = newItemName.trim();

    if (!name) {
      notifyError("Please enter a name.");
      return;
    }

    const endpoint = type === "group" ? "/groups" : "/departments";

    setCreating(true);
    setLocalError("");
    setLocalNotice("");

    try {
      const result = await apiRequest(endpoint, token, {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      const item = result.group || result.department || result.data || result;

      if (type === "group") {
        setGroups((current) => [...current, item]);
      } else {
        setDepartments((current) => [...current, item]);
      }

      setNewItemName("");
      notifySuccess(
        `${type === "group" ? "Group" : "Department"} created successfully.`
      );
    } catch (error) {
      notifyError(
        error.message ||
          `Could not create ${type}. Check whether the backend supports this endpoint.`
      );
    } finally {
      setCreating(false);
    }
  }

  const statCards = [
    {
      label: "Total Users",
      value: users.length,
      icon: "♙",
      color: "blue",
    },
    {
      label: "Documents",
      value: documents.length,
      icon: "▤",
      color: "purple",
    },
    {
      label: "Groups",
      value: groups.length,
      icon: "◫",
      color: "green",
    },
    {
      label: "Departments",
      value: departments.length,
      icon: "⌂",
      color: "orange",
    },
  ];

  const activeTitle =
    NAV_ITEMS.find((item) => item.id === activeTab)?.label || "Overview";

  return (
    <div className="admin-page">
      <style>{`
        .admin-page {
          min-height: 100%;
          padding: 28px;
          color: #172033;
          background: #f5f7fb;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .admin-page * { box-sizing: border-box; }
        .admin-topbar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 26px;
        }
        .admin-eyebrow {
          color: #64748b; font-size: 11px; font-weight: 800;
          letter-spacing: 1.6px; text-transform: uppercase; margin-bottom: 7px;
        }
        .admin-heading { margin: 0; color: #101828; font-size: 29px; font-weight: 800; letter-spacing: -0.8px; }
        .admin-subtitle { margin: 8px 0 0; color: #738096; font-size: 13px; line-height: 1.6; }
        .admin-top-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .admin-btn {
          border: 1px solid #dce3ed; background: white; color: #334155;
          border-radius: 10px; padding: 10px 15px; font-size: 12px;
          font-weight: 750; cursor: pointer; transition: .18s ease;
        }
        .admin-btn:hover { border-color: #9db8ff; transform: translateY(-1px); }
        .admin-btn-primary { color: white; background: #315de8; border-color: #315de8; }
        .admin-btn-primary:hover { background: #244bd0; }
        .admin-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }
        .admin-layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 22px; align-items: start; }
        .admin-sidebar {
          background: #101d45; border-radius: 18px; padding: 15px;
          box-shadow: 0 10px 30px rgba(16,29,69,.08);
        }
        .admin-side-title {
          color: #94a9e7; font-size: 10px; font-weight: 800;
          letter-spacing: 1.5px; text-transform: uppercase; padding: 10px 12px 14px;
        }
        .admin-nav { display: grid; gap: 5px; }
        .admin-nav button {
          width: 100%; display: flex; align-items: center; gap: 12px;
          text-align: left; padding: 12px; border: 0; border-radius: 10px;
          background: transparent; color: #c2cce7; cursor: pointer;
          font-size: 12px; font-weight: 700; transition: .18s ease;
        }
        .admin-nav button:hover { background: rgba(255,255,255,.07); color: white; }
        .admin-nav button.active { color: white; background: #315de8; box-shadow: 0 5px 15px #0b153b; }
        .admin-nav-icon { width: 19px; text-align: center; font-size: 17px; }
        .admin-sidebar-footer { margin-top: 20px; border-top: 1px solid rgba(255,255,255,.12); padding: 15px 8px 5px; color: #a9b7dc; font-size: 11px; line-height: 1.7; overflow-wrap: anywhere; }
        .admin-content { min-width: 0; }
        .admin-panel {
          background: white; border: 1px solid #e7ebf2; border-radius: 17px;
          padding: 22px; margin-bottom: 19px; box-shadow: 0 5px 20px rgba(20,35,70,.025);
        }
        .admin-panel-head {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; flex-wrap: wrap; margin-bottom: 18px;
        }
        .admin-panel-title { margin: 0; color: #172033; font-size: 16px; font-weight: 800; }
        .admin-panel-description { margin: 6px 0 0; color: #8290a5; font-size: 12px; line-height: 1.6; }
        .admin-stats { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; margin-bottom: 19px; }
        .admin-stat { border: 1px solid #e7ebf2; border-radius: 15px; padding: 18px; background: white; min-width: 0; }
        .admin-stat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 17px; }
        .admin-stat-label { color: #7b879a; font-size: 11px; font-weight: 700; }
        .admin-stat-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; font-size: 17px; }
        .stat-blue .admin-stat-icon { background: #edf2ff; color: #315de8; }
        .stat-purple .admin-stat-icon { background: #f2eefe; color: #7953d6; }
        .stat-green .admin-stat-icon { background: #e6f8ef; color: #16865b; }
        .stat-orange .admin-stat-icon { background: #fff2e3; color: #c66b18; }
        .admin-stat-value { font-size: 28px; font-weight: 850; letter-spacing: -1px; color: #15213b; }
        .admin-search {
          width: 100%; max-width: 340px; border: 1px solid #dfe5ef;
          background: #fbfcfe; color: #25334a; border-radius: 10px;
          padding: 10px 12px; outline: none; font: inherit; font-size: 12px;
        }
        .admin-search:focus, .admin-input:focus, .admin-select:focus { border-color: #6e8df5; box-shadow: 0 0 0 3px #315de815; outline: none; }
        .admin-table-wrap { width: 100%; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
        .admin-table th { background: #f8faff; color: #78859a; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .7px; white-space: nowrap; }
        .admin-table th, .admin-table td { padding: 14px 12px; border-bottom: 1px solid #edf0f5; vertical-align: middle; }
        .admin-table tbody tr:last-child td { border-bottom: 0; }
        .admin-table tbody tr:hover { background: #fbfcff; }
        .admin-cell-main { color: #25334a; font-weight: 750; }
        .admin-cell-sub { color: #8995a7; font-size: 11px; margin-top: 4px; overflow-wrap: anywhere; }
        .admin-status { display: inline-flex; align-items: center; padding: 5px 9px; border-radius: 999px; font-size: 10px; font-weight: 800; white-space: nowrap; }
        .status-success { background: #e8f8ef; color: #168253; }
        .status-pending { background: #fff5df; color: #a66b00; }
        .status-danger { background: #ffebeb; color: #c23838; }
        .status-neutral { background: #eef1f6; color: #64748b; }
        .admin-inline-actions { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
        .admin-btn-small { padding: 7px 9px; font-size: 10px; border-radius: 7px; }
        .admin-input, .admin-select { width: 100%; min-width: 100px; padding: 9px 10px; border: 1px solid #dce3ed; border-radius: 8px; color: #26334a; background: white; font: inherit; font-size: 12px; }
        .admin-form-row { display: flex; gap: 9px; width: 100%; max-width: 460px; }
        .admin-alert { border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; font-size: 12px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
        .admin-alert-error { color: #a42d38; background: #fff0f1; border: 1px solid #ffdadd; }
        .admin-alert-success { color: #16714d; background: #eafaf1; border: 1px solid #d1f1df; }
        .admin-empty { text-align: center; padding: 43px 16px; color: #7b879b; }
        .admin-empty-icon { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 14px; margin: 0 auto 13px; background: #eff3ff; color: #315de8; font-size: 22px; }
        .admin-empty h3 { margin: 0 0 7px; color: #34415a; font-size: 14px; }
        .admin-empty p { margin: 0; font-size: 12px; line-height: 1.6; }
        .admin-loading { display: flex; align-items: center; gap: 10px; color: #68778e; font-size: 12px; padding: 16px 0; }
        .admin-dot { width: 7px; height: 7px; background: #315de8; border-radius: 50%; animation: admin-pulse 1s infinite alternate; }
        @keyframes admin-pulse { from { opacity: .35; } to { opacity: 1; } }
        .admin-verification { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; color: #68778e; font-size: 12px; }
        @media (max-width: 1050px) { .admin-stats { grid-template-columns: repeat(2,minmax(0,1fr)); } .admin-layout { grid-template-columns: 190px minmax(0,1fr); } }
        @media (max-width: 720px) {
          .admin-page { padding: 15px; }
          .admin-heading { font-size: 24px; }
          .admin-layout { grid-template-columns: 1fr; }
          .admin-sidebar { padding: 10px; }
          .admin-side-title, .admin-sidebar-footer { display: none; }
          .admin-nav { grid-template-columns: repeat(3,minmax(0,1fr)); }
          .admin-nav button { flex-direction: column; justify-content: center; gap: 5px; text-align: center; padding: 10px 5px; font-size: 10px; }
          .admin-panel { padding: 15px; }
          .admin-stats { gap: 9px; }
          .admin-stat { padding: 13px; }
          .admin-stat-value { font-size: 24px; }
          .admin-search { max-width: 100%; }
        }
      `}</style>

      <header className="admin-topbar">
        <div>
          <div className="admin-eyebrow">TrustVault / Administration</div>
          <h1 className="admin-heading">{activeTitle}</h1>
          <p className="admin-subtitle">
            Manage platform data, users, access and audit activity.
          </p>
        </div>

        <div className="admin-top-actions">
          <button
            className="admin-btn"
            onClick={() => {
              setSearch("");
              refresh();
              onRefresh?.();
            }}
            disabled={loading || busy}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button
            className="admin-btn admin-btn-primary"
            onClick={() => onVerify?.()}
            disabled={busy || !onVerify}
          >
            {busy ? "Verifying..." : "✓ Verify Audit"}
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-side-title">Workspace</div>

          <nav className="admin-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={activeTab === item.id ? "active" : ""}
                onClick={() => {
                  setActiveTab(item.id);
                  setSearch("");
                  setLocalError("");
                  setLocalNotice("");
                }}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            Signed in as
            <br />
            <strong>{user?.name || user?.username || user?.email || "Admin"}</strong>
            <br />
            Role: {user?.role || "admin"}
          </div>
        </aside>

        <main className="admin-content">
          {localError && (
            <div className="admin-alert admin-alert-error" role="alert">
              {localError}
            </div>
          )}

          {localNotice && (
            <div className="admin-alert admin-alert-success" role="status">
              {localNotice}
            </div>
          )}

          {loading && (
            <div className="admin-loading">
              <span className="admin-dot" />
              Loading administration data...
            </div>
          )}

          {activeTab === "overview" && (
            <>
              <div className="admin-stats">
                {statCards.map((stat) => (
                  <div
                    key={stat.label}
                    className={`admin-stat stat-${stat.color}`}
                  >
                    <div className="admin-stat-top">
                      <span className="admin-stat-label">{stat.label}</span>
                      <span className="admin-stat-icon">{stat.icon}</span>
                    </div>
                    <div className="admin-stat-value">{stat.value}</div>
                  </div>
                ))}
              </div>

              <section className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <h2 className="admin-panel-title">Platform overview</h2>
                    <p className="admin-panel-description">
                      A quick snapshot of your TrustVault workspace.
                    </p>
                  </div>
                  <StatusBadge value={isAdmin ? "Admin access" : "Read access"} />
                </div>

                <div className="admin-stats">
                  <div className="admin-stat">
                    <div className="admin-stat-label">Audit entries</div>
                    <div className="admin-stat-value">{logs.length}</div>
                  </div>
                  <div className="admin-stat">
                    <div className="admin-stat-label">Approved users</div>
                    <div className="admin-stat-value">
                      {
                        users.filter(
                          (item) =>
                            String(item.approval_status || "").toLowerCase() ===
                            "approved"
                        ).length
                      }
                    </div>
                  </div>
                </div>

                <div className="admin-verification">
                  <strong>Audit verification:</strong>
                  <StatusBadge
                    value={
                      verification?.valid === true
                        ? "Verified"
                        : verification?.valid === false
                          ? "Failed"
                          : "Not checked"
                    }
                  />
                </div>
              </section>

              <section className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <h2 className="admin-panel-title">Recent activity</h2>
                    <p className="admin-panel-description">
                      Latest audit records available from the backend.
                    </p>
                  </div>
                  <button
                    className="admin-btn"
                    onClick={() => setActiveTab("history")}
                  >
                    View history →
                  </button>
                </div>

                <DataTable
                  columns={[
                    {
                      key: "action",
                      label: "Action",
                      render: (row) => row.action || row.event || "Activity",
                    },
                    {
                      key: "actor",
                      label: "User",
                      render: (row) =>
                        row.actor || row.user || row.email || "System",
                    },
                    {
                      key: "created_at",
                      label: "Date",
                      render: (row) =>
                        formatDate(row.created_at || row.timestamp || row.date),
                    },
                    {
                      key: "status",
                      label: "Status",
                      render: (row) => (
                        <StatusBadge value={row.status || "Recorded"} />
                      ),
                    },
                  ]}
                  rows={logs.slice(0, 5)}
                />
              </section>
            </>
          )}

          {activeTab === "documents" && (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <h2 className="admin-panel-title">Document management</h2>
                  <p className="admin-panel-description">
                    Review documents currently returned by the API.
                  </p>
                </div>
                <input
                  className="admin-search"
                  placeholder="Search documents..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <DataTable
                columns={[
                  {
                    key: "name",
                    label: "Document",
                    render: (row) => (
                      <div>
                        <div className="admin-cell-main">
                          {row.name || row.filename || row.title || "Untitled"}
                        </div>
                        <div className="admin-cell-sub">
                          ID: {getId(row) ?? "—"}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "owner",
                    label: "Owner",
                    render: (row) =>
                      row.owner_name ||
                      row.owner_email ||
                      row.uploaded_by ||
                      "—",
                  },
                  {
                    key: "created_at",
                    label: "Created",
                    render: (row) => formatDate(row.created_at || row.uploaded_at),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (row) => (
                      <StatusBadge value={row.status || "Available"} />
                    ),
                  },
                ]}
                rows={filteredDocuments}
              />
            </section>
          )}

          {activeTab === "groups" && (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <h2 className="admin-panel-title">Groups</h2>
                  <p className="admin-panel-description">
                    View groups and create a group if the API supports it.
                  </p>
                </div>
                <input
                  className="admin-search"
                  placeholder="Search groups..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              {isAdmin && (
                <form
                  className="admin-form-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    createItem("group");
                  }}
                  style={{ marginBottom: 20 }}
                >
                  <input
                    className="admin-input"
                    placeholder="New group name"
                    value={newItemName}
                    onChange={(event) => setNewItemName(event.target.value)}
                  />
                  <button
                    className="admin-btn admin-btn-primary"
                    type="submit"
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "＋ Create"}
                  </button>
                </form>
              )}

              <DataTable
                columns={[
                  {
                    key: "name",
                    label: "Group",
                    render: (row) => (
                      <span className="admin-cell-main">
                        {row.name || row.title || "Unnamed group"}
                      </span>
                    ),
                  },
                  {
                    key: "description",
                    label: "Description",
                    render: (row) => row.description || "—",
                  },
                  {
                    key: "created_at",
                    label: "Created",
                    render: (row) => formatDate(row.created_at),
                  },
                ]}
                rows={filteredGroups}
              />
            </section>
          )}

          {activeTab === "departments" && (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <h2 className="admin-panel-title">Departments</h2>
                  <p className="admin-panel-description">
                    View departments and create one if supported by the API.
                  </p>
                </div>
                <input
                  className="admin-search"
                  placeholder="Search departments..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              {isAdmin && (
                <form
                  className="admin-form-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    createItem("department");
                  }}
                  style={{ marginBottom: 20 }}
                >
                  <input
                    className="admin-input"
                    placeholder="New department name"
                    value={newItemName}
                    onChange={(event) => setNewItemName(event.target.value)}
                  />
                  <button
                    className="admin-btn admin-btn-primary"
                    type="submit"
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "＋ Create"}
                  </button>
                </form>
              )}

              <DataTable
                columns={[
                  {
                    key: "name",
                    label: "Department",
                    render: (row) => (
                      <span className="admin-cell-main">
                        {row.name || row.title || "Unnamed department"}
                      </span>
                    ),
                  },
                  {
                    key: "description",
                    label: "Description",
                    render: (row) => row.description || "—",
                  },
                  {
                    key: "created_at",
                    label: "Created",
                    render: (row) => formatDate(row.created_at),
                  },
                ]}
                rows={filteredDepartments}
              />
            </section>
          )}

          {activeTab === "users" && (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <h2 className="admin-panel-title">User management</h2>
                  <p className="admin-panel-description">
                    Review accounts and edit usernames and roles.
                  </p>
                </div>
                <input
                  className="admin-search"
                  placeholder="Search name, email or role..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              {!isAdmin && (
                <div className="admin-alert admin-alert-error">
                  Your current role does not have administrator privileges.
                </div>
              )}

              <DataTable
                columns={[
                  {
                    key: "name",
                    label: "User",
                    render: (row) => (
                      <div>
                        <div className="admin-cell-main">
                          {row.name || row.username || "Unnamed user"}
                        </div>
                        <div className="admin-cell-sub">
                          {row.email || "No email"}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "role",
                    label: "Role",
                    render: (row) =>
                      editingUserId === getId(row) ? (
                        <select
                          className="admin-select"
                          value={editRole}
                          onChange={(event) => setEditRole(event.target.value)}
                          disabled={!isAdmin}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                      ) : (
                        <StatusBadge value={row.role || "viewer"} />
                      ),
                  },
                  {
                    key: "approval_status",
                    label: "Approval",
                    render: (row) => (
                      <StatusBadge
                        value={row.approval_status || row.status || "Unknown"}
                      />
                    ),
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (row) => {
                      const id = getId(row);
                      const editing = editingUserId === id;
                      const saving = savingUserId === id;
                      const isSelf =
                        String(id) === String(user?.id ?? user?.user_id);

                      return (
                        <div className="admin-inline-actions">
                          {editing ? (
                            <>
                              <input
                                className="admin-input"
                                style={{ width: 135 }}
                                value={editName}
                                onChange={(event) =>
                                  setEditName(event.target.value)
                                }
                                aria-label="Username"
                                disabled={!isAdmin}
                              />
                              <button
                                className="admin-btn admin-btn-primary admin-btn-small"
                                onClick={() => saveUser(row)}
                                disabled={!isAdmin || saving}
                              >
                                {saving ? "Saving..." : "Save"}
                              </button>
                              <button
                                className="admin-btn admin-btn-small"
                                onClick={() => setEditingUserId(null)}
                                disabled={saving}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="admin-btn admin-btn-small"
                                onClick={() => startEditing(row)}
                                disabled={!isAdmin}
                              >
                                Edit
                              </button>

                              {isAdmin &&
                                String(
                                  row.approval_status || ""
                                ).toLowerCase() !== "approved" && (
                                  <button
                                    className="admin-btn admin-btn-small"
                                    onClick={() => setApproval(row, "approved")}
                                    disabled={saving}
                                  >
                                    Approve
                                  </button>
                                )}

                              {isAdmin &&
                                String(
                                  row.approval_status || ""
                                ).toLowerCase() === "approved" && (
                                  <button
                                    className="admin-btn admin-btn-small"
                                    onClick={() => setApproval(row, "pending")}
                                    disabled={saving}
                                  >
                                    Set pending
                                  </button>
                                )}
                            </>
                          )}
                        </div>
                      );
                    },
                  },
                ]}
                rows={filteredUsers}
              />
            </section>
          )}

          {activeTab === "history" && (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <div>
                  <h2 className="admin-panel-title">Audit history</h2>
                  <p className="admin-panel-description">
                    Review the audit records returned by the backend.
                  </p>
                </div>
                <input
                  className="admin-search"
                  placeholder="Search audit activity..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="admin-verification" style={{ marginBottom: 18 }}>
                <strong>Chain verification:</strong>
                <StatusBadge
                  value={
                    verification?.valid === true
                      ? "Verified"
                      : verification?.valid === false
                        ? "Failed"
                        : "Not checked"
                  }
                />
                <button
                  className="admin-btn admin-btn-small"
                  onClick={() => onVerify?.()}
                  disabled={busy || !onVerify}
                >
                  {busy ? "Checking..." : "Verify now"}
                </button>
              </div>

              <DataTable
                columns={[
                  {
                    key: "action",
                    label: "Action",
                    render: (row) => (
                      <div>
                        <div className="admin-cell-main">
                          {row.action || row.event || "Audit event"}
                        </div>
                        <div className="admin-cell-sub">
                          {row.resource || row.details || ""}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "actor",
                    label: "Actor",
                    render: (row) =>
                      row.actor || row.user || row.email || "System",
                  },
                  {
                    key: "created_at",
                    label: "Timestamp",
                    render: (row) =>
                      formatDate(row.created_at || row.timestamp || row.date),
                  },
                  {
                    key: "entryHash",
                    label: "Entry hash",
                    render: (row) => {
                      const hash = row.entry_hash || row.entryHash || row.hash;
                      return hash ? (
                        <span title={hash}>
                          {String(hash).slice(0, 14)}…
                        </span>
                      ) : (
                        "—"
                      );
                    },
                  },
                ]}
                rows={filteredLogs}
              />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
