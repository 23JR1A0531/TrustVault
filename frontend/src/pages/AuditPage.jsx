export default function AuditPage({ logs, verification, onVerify, busy }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div><h2>Audit trail</h2><p>Review recorded document and access activity.</p></div>
        <button className="btn btn-primary" onClick={onVerify} disabled={busy}>{busy ? "Verifying..." : "Verify hash chain"}</button>
      </div>

      {verification && (
        <div className={`verification ${verification.valid ? "verified" : "verification-failed"}`}>
          <strong>{verification.valid ? "✓ Audit chain verified" : "⚠ Verification failed"}</strong>
          <p>{verification.message || "Verification response received from the server."}</p>
          {verification.checked_entries != null && <small>Entries checked: {verification.checked_entries}</small>}
        </div>
      )}

      {logs.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>EVENT</th><th>USER</th><th>RESOURCE</th><th>TIME</th><th>HASH</th></tr></thead>
            <tbody>{logs.map((log, i) => (
              <tr key={log.id ?? i}>
                <td><span className="category-tag">{log.action || log.event_type || log.event || "Activity"}</span></td>
                <td>{log.user_email || log.email || log.user_id || "—"}</td>
                <td>{log.resource_type || log.document_id || log.resource_id || "—"}</td>
                <td>{log.created_at || log.timestamp ? new Date(log.created_at || log.timestamp).toLocaleString() : "—"}</td>
                <td><code className="hash-text">{String(log.entry_hash || log.hash || "—").slice(0, 14)}</code></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <div className="empty-state"><h3>No audit records available</h3><p>Records will appear here if your account has audit access.</p></div>}
    </section>
  );
}