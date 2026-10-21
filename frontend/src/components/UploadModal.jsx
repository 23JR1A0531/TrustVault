import { useState } from "react";

export default function UploadModal({ onClose, onSubmit, busy }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);

  function submit(e) {
    e.preventDefault();
    if (!file) return;
    const data = new FormData();
    data.append("title", title.trim() || file.name);
    data.append("category", category);
    data.append("description", description);
    data.append("file", file);
    onSubmit(data);
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-heading">
          <div><h2>Upload document</h2><p>Add a document to your vault.</p></div>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <label className="field">
          Document title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Project Agreement" />
        </label>

        <label className="field">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>General</option>
            <option>Legal</option>
            <option>Finance</option>
            <option>HR</option>
            <option>Projects</option>
            <option>Personal</option>
          </select>
        </label>

        <label className="field">
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" placeholder="Optional description" />
        </label>

        <label className="file-drop">
          <span className="upload-symbol">↑</span>
          <strong>{file ? file.name : "Choose a PDF or image"}</strong>
          <small>PDF, PNG or JPEG · Maximum 10 MB</small>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || !file}>
            {busy ? "Uploading..." : "Upload document"}
          </button>
        </div>
      </form>
    </div>
  );
}