import { useState } from "react";
import { Upload, FileText, X, ShieldCheck } from "lucide-react";

export default function UploadModal({
  onClose,
  onUpload,
  loading = false,
}) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a document to upload.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a document title.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("description", description.trim());

    onUpload?.(formData);
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setError("");

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("File size must be 20 MB or less.");
      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);

    if (!title.trim()) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        <div className="modal-heading">
          <div>
            <h2 id="upload-modal-title">Upload Document</h2>
            <p>Store your files securely in TrustVault.</p>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close upload dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field">
            Document Title
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter document title"
              maxLength={200}
              required
            />
          </label>

          <label className="field">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this document about?"
              rows={3}
              maxLength={2000}
            />
          </label>

          <label
            htmlFor="trustvault-file"
            style={{
              display: "grid",
              justifyItems: "center",
              gap: "12px",
              padding: "28px 18px",
              marginBottom: "18px",
              border: "1px dashed #4266a3",
              borderRadius: "12px",
              background: "#0a1325",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {file ? (
              <FileText size={34} color="#f5c451" />
            ) : (
              <Upload size={34} color="#60a5fa" />
            )}

            <strong style={{ fontSize: "13px", overflowWrap: "anywhere" }}>
              {file ? file.name : "Choose a file to upload"}
            </strong>

            <span style={{ color: "#94a3b8", fontSize: "11px" }}>
              {file
                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                : "Maximum file size: 20 MB"}
            </span>

            <input
              id="trustvault-file"
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
              disabled={loading}
            />
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px",
              marginBottom: "15px",
              borderRadius: "9px",
              background: "#132a2a",
              color: "#a7f3d0",
              fontSize: "11px",
            }}
          >
            <ShieldCheck size={17} />
            Your upload will be processed by the TrustVault backend.
          </div>

          {error && (
            <div className="alert-error" role="alert">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              <Upload size={16} />
              {loading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}