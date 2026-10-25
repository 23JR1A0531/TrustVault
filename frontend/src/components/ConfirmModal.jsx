import { AlertTriangle, X, Trash2 } from "lucide-react";

export default function ConfirmModal({
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  function handleSubmit(event) {
    event.preventDefault();
    onConfirm?.();
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose?.();
        }
      }}
    >
      <section
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        style={{ maxWidth: "440px" }}
      >
        <div className="modal-heading">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "43px",
                height: "43px",
                display: "grid",
                placeItems: "center",
                borderRadius: "12px",
                color: danger ? "#fda4af" : "#f5c451",
                background: danger ? "#451b2a" : "#352c17",
                border: `1px solid ${danger ? "#80364b" : "#80631c"}`,
              }}
            >
              {danger ? (
                <Trash2 size={21} />
              ) : (
                <AlertTriangle size={21} />
              )}
            </div>

            <div>
              <h2 id="confirm-modal-title" style={{ marginBottom: "5px" }}>
                {title}
              </h2>

              <span style={{ color: "#94a3b8", fontSize: "11px" }}>
                Please confirm your action
              </span>
            </div>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close confirmation dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p
          id="confirm-modal-message"
          style={{
            color: "#cbd5e1",
            fontSize: "13px",
            lineHeight: 1.7,
            overflowWrap: "anywhere",
          }}
        >
          {message}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </button>

            <button
              type="submit"
              className={danger ? "btn-danger" : "btn-primary"}
              disabled={loading}
            >
              {loading ? "Please wait..." : confirmText}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}