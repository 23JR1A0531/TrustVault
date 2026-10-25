import { useMemo, useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Search,
  Fingerprint,
  Clock3,
} from "lucide-react";

function getActorName(log) {
  return (
    log.actor_name ||
    log.user_name ||
    log.username ||
    log.name ||
    "Unknown user"
  );
}

function getActorEmail(log) {
  return (
    log.actor_email ||
    log.user_email ||
    log.email ||
    "Not available"
  );
}

function getTimestamp(log) {
  return (
    log.created_at ||
    log.timestamp ||
    log.event_time ||
    log.modified_at ||
    log.updated_at ||
    null
  );
}

function formatDateTime(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function getAction(log) {
  return (
    log.action ||
    log.event_type ||
    log.event ||
    "Unknown action"
  );
}

function getOutcome(log) {
  const outcome = log.outcome ?? log.status ?? log.result;

  if (outcome === true) return "Success";
  if (outcome === false) return "Failed";
  if (!outcome) return "Not recorded";

  return String(outcome);
}

function getDocumentName(log) {
  return (
    log.document_name ||
    log.filename ||
    log.document_title ||
    log.document_id ||
    "Not available"
  );
}

function getDetails(log) {
  const details = log.details ?? log.description ?? log.metadata;

  if (details == null || details === "") {
    return "No details recorded";
  }

  if (typeof details === "string") return details;

  try {
    return JSON.stringify(details);
  } catch {
    return "Details unavailable";
  }
}

function getEntryHash(log) {
  return (
    log.entry_hash ||
    log.entryHash ||
    log.hash ||
    "Not available"
  );
}

function getLogId(log, index) {
  return log.id ?? log._id ?? log.audit_id ?? index;
}

export default function AuditPage({
  auditLogs = [],
  loading = false,
  verification,
  onVerify,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const logs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = auditLogs.filter((log) => {
      if (!query) return true;

      const searchableValues = [
        getActorName(log),
        getActorEmail(log),
        getTimestamp(log),
        getAction(log),
        getOutcome(log),
        getDocumentName(log),
        getDetails(log),
        getEntryHash(log),
      ];

      return searchableValues.some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      const dateA = new Date(getTimestamp(a) || 0).getTime();
      const dateB = new Date(getTimestamp(b) || 0).getTime();

      return dateB - dateA;
    });
  }, [auditLogs, searchTerm]);

  const verificationPassed =
    verification?.valid === true ||
    verification?.verified === true ||
    verification?.is_valid === true;

  const verificationAvailable = verification != null;

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1 style={{ marginBottom: 7 }}>Audit Logs</h1>
          <p>
            Track who modified documents, when changes happened,
            and the outcome of each recorded action.
          </p>
        </div>

        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onVerify}
            disabled={loading}
          >
            <ShieldCheck size={16} />
            Verify Audit Chain
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Audit Events</div>
          <div className="stat-number">{auditLogs.length}</div>
          <div className="stat-caption">
            Events returned by the backend
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Integrity Verification</div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginTop: 12,
              color: !verificationAvailable
                ? "#f5c451"
                : verificationPassed
                  ? "#6ee7b7"
                  : "#fda4af",
              fontSize: 17,
              fontWeight: 800,
            }}
          >
            {!verificationAvailable ? (
              <ShieldCheck size={22} />
            ) : verificationPassed ? (
              <CheckCircle2 size={22} />
            ) : (
              <XCircle size={22} />
            )}

            {!verificationAvailable
              ? "Not checked"
              : verificationPassed
                ? "Verified"
                : "Check failed"}
          </div>

          <div className="stat-caption">
            Based on the backend verification response
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Latest Recorded Event</div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginTop: 12,
              fontSize: 15,
              fontWeight: 700,
              color: "#f5c451",
            }}
          >
            <Clock3 size={20} />

            {auditLogs.length
              ? formatDateTime(
                  [...auditLogs]
                    .sort(
                      (a, b) =>
                        new Date(getTimestamp(b) || 0) -
                        new Date(getTimestamp(a) || 0)
                    )[0] &&
                    getTimestamp(
                      [...auditLogs].sort(
                        (a, b) =>
                          new Date(getTimestamp(b) || 0) -
                          new Date(getTimestamp(a) || 0)
                      )[0]
                    )
                )
              : "No events"}
          </div>

          <div className="stat-caption">
            Based on recorded timestamps
          </div>
        </div>
      </div>

      {verificationAvailable && (
        <section
          className={`verification-card ${
            verificationPassed ? "valid" : "invalid"
          }`}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {verificationPassed ? (
              <CheckCircle2
                size={24}
                color="#6ee7b7"
                style={{ flexShrink: 0 }}
              />
            ) : (
              <XCircle
                size={24}
                color="#fda4af"
                style={{ flexShrink: 0 }}
              />
            )}

            <div>
              <h3>
                {verificationPassed
                  ? "Audit Chain Verification Successful"
                  : "Audit Chain Verification Not Successful"}
              </h3>

              <p style={{ fontSize: 12, marginBottom: 0 }}>
                {verification.message ||
                  verification.detail ||
                  "Verification response received from the backend."}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Document Modification History</h2>
            <p style={{ margin: "6px 0 0", fontSize: 12 }}>
              Modified By, Email and Date & Time appear first.
            </p>
          </div>

          <div
            className="search-box"
            style={{ minWidth: 220, maxWidth: 330 }}
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
              placeholder="Search name, email, action..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search audit logs"
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw
              size={28}
              style={{ margin: "0 auto 12px", color: "#60a5fa" }}
            />
            <h3>Loading audit logs...</h3>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <Fingerprint
              size={42}
              style={{ margin: "0 auto 14px", color: "#64748b" }}
            />

            <h3>
              {searchTerm
                ? "No matching audit records"
                : "No audit records available"}
            </h3>

            <p>
              {searchTerm
                ? "Try searching with a different term."
                : "Records will appear here when returned by the backend."}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Modified By</th>
                  <th>Email</th>
                  <th>Date & Time</th>
                  <th>Action</th>
                  <th>Outcome</th>
                  <th>Document</th>
                  <th>Details</th>
                  <th>Entry Hash</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log, index) => {
                  const outcome = getOutcome(log);
                  const hash = getEntryHash(log);

                  const successful =
                    ["success", "successful", "completed", "true"].includes(
                      String(outcome).toLowerCase()
                    );

                  const failed =
                    ["failed", "failure", "error", "false"].includes(
                      String(outcome).toLowerCase()
                    );

                  return (
                    <tr key={getLogId(log, index)}>
                      <td>
                        <div
                          style={{
                            minWidth: 145,
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                          }}
                        >
                          <div
                            className="avatar"
                            style={{
                              width: 32,
                              height: 32,
                              flexShrink: 0,
                            }}
                          >
                            {getActorName(log)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <strong
                            style={{
                              fontSize: 12,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {getActorName(log)}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            minWidth: 160,
                            display: "block",
                            color: "#93c5fd",
                            fontSize: 11,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {getActorEmail(log)}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            minWidth: 160,
                            display: "block",
                            color: "#f5c451",
                            fontSize: 11,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDateTime(getTimestamp(log))}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-blue">
                          {String(getAction(log)).replaceAll("_", " ")}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            successful
                              ? "badge-green"
                              : failed
                                ? "badge-red"
                                : ""
                          }`}
                        >
                          {outcome}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            display: "block",
                            minWidth: 150,
                            maxWidth: 220,
                            fontSize: 11,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {getDocumentName(log)}
                        </span>
                      </td>

                      <td>
                        <span
                          title={getDetails(log)}
                          style={{
                            display: "block",
                            minWidth: 180,
                            maxWidth: 280,
                            color: "#cbd5e1",
                            fontSize: 11,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {getDetails(log)}
                        </span>
                      </td>

                      <td>
                        <code
                          title={hash}
                          style={{
                            display: "block",
                            minWidth: 150,
                            maxWidth: 220,
                            color: "#a5b4fc",
                            fontSize: 10,
                            overflowWrap: "anywhere",
                            whiteSpace: "normal",
                          }}
                        >
                          {hash}
                        </code>
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