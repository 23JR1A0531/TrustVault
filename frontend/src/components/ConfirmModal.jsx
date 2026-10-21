export default function ConfirmModal({ title, message, onCancel, onConfirm, busy }) {
  return (
    <div className="modal-backdrop">
      <div className="modal confirm-modal">
        <div className="confirm-icon">!</div>
        <h2>{title || "Are you sure?"}</h2>
        <p>{message || "This action cannot be undone."}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" disabled={busy} onClick={onConfirm}>
            {busy ? "Please wait..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}