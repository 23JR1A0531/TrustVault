import {
  FileText,
  Users,
  Building2,
  ShieldCheck,
  Upload,
  ArrowUpRight,
  Clock3,
  Activity,
  LockKeyhole,
} from "lucide-react";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDocumentName(document) {
  return (
    document.title ||
    document.filename ||
    document.original_filename ||
    "Untitled document"
  );
}

export default function DashboardPage({
  user,
  documents = [],
  groups = [],
  departments = [],
  auditLogs = [],
  onNavigate,
  onUpload,
}) {
  const name =
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "User";

  const stats = [
    {
      label: "Total Documents",
      value: documents.length,
      description: "Documents in your workspace",
      icon: FileText,
      color: "#60a5fa",
      target: "documents",
    },
    {
      label: "Groups",
      value: groups.length,
      description: "Available collaboration groups",
      icon: Users,
      color: "#c4b5fd",
      target: "groups",
    },
    {
      label: "Departments",
      value: departments.length,
      description: "Organizational departments",
      icon: Building2,
      color: "#f5c451",
      target: "departments",
    },
    {
      label: "Audit Events",
      value: auditLogs.length,
      description: "Events currently loaded",
      icon: ShieldCheck,
      color: "#6ee7b7",
      target: "audit",
    },
  ];

  const recentDocuments = [...documents]
    .sort((a, b) => {
      const dateA = new Date(
        a.updated_at || a.created_at || a.uploaded_at || 0
      ).getTime();

      const dateB = new Date(
        b.updated_at || b.created_at || b.uploaded_at || 0
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 5);

  const recentActivity = [...auditLogs].slice(0, 5);

  return (
    <div>
      <section className="welcome-banner">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                color: "#f5c451",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "1.5px",
                marginBottom: "13px",
              }}
            >
              YOUR SECURE WORKSPACE
            </div>

            <h1>
              Welcome back, {name}
            </h1>

            <p>
              Manage documents, control access, and review activity from
              one secure workspace.
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="btn-gold"
                onClick={onUpload}
              >
                <Upload size={16} />
                Upload Document
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => onNavigate?.("documents")}
              >
                View Documents
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>

          <div
            style={{
              width: "74px",
              height: "74px",
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: "20px",
              background: "#ffffff0b",
              border: "1px solid #ffffff20",
              color: "#f5c451",
            }}
          >
            <LockKeyhole size={37} strokeWidth={1.5} />
          </div>
        </div>
      </section>

      <div className="page-heading">
        <div>
          <h2 style={{ marginBottom: "6px" }}>Workspace Overview</h2>
          <p>Here's a summary of the data currently available to you.</p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            color: "#94a3b8",
            fontSize: "11px",
          }}
        >
          <Activity size={15} color="#6ee7b7" />
          Live workspace data
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <button
              key={stat.label}
              type="button"
              className="stat-card"
              onClick={() => onNavigate?.(stat.target)}
              style={{
                textAlign: "left",
                cursor: "pointer",
                color: "inherit",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "17px",
                }}
              >
                <span className="stat-label">{stat.label}</span>

                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "11px",
                    color: stat.color,
                    background: `${stat.color}15`,
                    border: `1px solid ${stat.color}35`,
                  }}
                >
                  <Icon size={19} />
                </div>
              </div>

              <div className="stat-number">{stat.value}</div>

              <div className="stat-caption">{stat.description}</div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "12px",
                  color: stat.color,
                }}
              >
                <ArrowUpRight size={17} />
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent Documents</h2>
              <p style={{ margin: "6px 0 0", fontSize: "12px" }}>
                Recently updated documents
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigate?.("documents")}
            >
              View all
              <ArrowUpRight size={14} />
            </button>
          </div>

          {recentDocuments.length === 0 ? (
            <div className="empty-state">
              <FileText
                size={35}
                style={{ margin: "0 auto 13px", color: "#64748b" }}
              />
              <h3>No documents yet</h3>
              <p>Upload a document to get started.</p>

              <button
                type="button"
                className="btn-primary"
                onClick={onUpload}
              >
                <Upload size={15} />
                Upload Document
              </button>
            </div>
          ) : (
            <div className="activity-list">
              {recentDocuments.map((document, index) => (
                <div className="activity-item" key={document.id || document._id || index}>
                  <div className="activity-icon">
                    <FileText size={18} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        color: "#e2e8f0",
                        fontSize: "12px",
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {getDocumentName(document)}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "7px",
                        marginTop: "7px",
                        color: "#94a3b8",
                        fontSize: "10px",
                      }}
                    >
                      <Clock3 size={12} />

                      {formatDate(
                        document.updated_at ||
                          document.created_at ||
                          document.uploaded_at
                      )}
                    </div>
                  </div>

                  <span className="badge badge-blue">
                    {document.status || "Stored"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent Activity</h2>
              <p style={{ margin: "6px 0 0", fontSize: "12px" }}>
                Latest available audit events
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigate?.("audit")}
            >
              Audit Trail
              <ArrowUpRight size={14} />
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <ShieldCheck
                size={35}
                style={{ margin: "0 auto 13px", color: "#64748b" }}
              />
              <h3>No activity loaded</h3>
              <p>
                Audit events will appear here when available to your account.
              </p>
            </div>
          ) : (
            <div className="activity-list">
              {recentActivity.map((log, index) => {
                const action =
                  log.action ||
                  log.event_type ||
                  log.event ||
                  "Workspace event";

                return (
                  <div
                    className="activity-item"
                    key={log.id || log._id || index}
                  >
                    <div className="activity-icon">
                      <ShieldCheck size={18} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          color: "#e2e8f0",
                          fontSize: "12px",
                          fontWeight: 700,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {String(action).replaceAll("_", " ")}
                      </div>

                      <div
                        style={{
                          marginTop: "6px",
                          color: "#94a3b8",
                          fontSize: "11px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {log.username ||
                          log.user_email ||
                          log.user_id ||
                          "Workspace user"}
                      </div>

                      <div
                        style={{
                          marginTop: "5px",
                          color: "#64748b",
                          fontSize: "10px",
                        }}
                      >
                        {formatDate(
                          log.created_at || log.timestamp || log.event_time
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section
        className="panel"
        style={{
          marginTop: "20px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div className="activity-icon">
          <ShieldCheck size={21} />
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: "5px" }}>Security & Auditability</h3>
          <p style={{ margin: 0, fontSize: "12px" }}>
            Review access permissions and inspect the audit trail to track
            document-related activity.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => onNavigate?.("access")}
        >
          Manage Access
        </button>
      </section>
    </div>
  );
}