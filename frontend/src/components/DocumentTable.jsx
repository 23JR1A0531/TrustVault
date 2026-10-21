function formatSize(bytes) {
  if (!bytes) return "—";
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentTable({
  documents = [],
  onDownload,
  onEdit,
  onDelete,
  onShare,
}) {
  if (!documents.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">▤</div>
        <h3>No documents found</h3>
        <p>Upload a document or change your search.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>DOCUMENT</th>
            <th>CATEGORY</th>
            <th>SIZE</th>
            <th>UPLOADED</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>
                <div className="document-name">
                  <span className="file-icon">PDF</span>
                  <div>
                    <strong>{doc.title}</strong>
                    <small>{doc.original_filename || "Document"}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className="category-tag">{doc.category || "General"}</span>
              </td>
              <td>{formatSize(doc.file_size)}</td>
              <td>
                {doc.created_at
                  ? new Date(doc.created_at).toLocaleDateString()
                  : "—"}
              </td>
              <td>
                <div className="action-buttons">
                  <button title="Download" onClick={() => onDownload(doc)}>↓</button>
                  <button title="Edit" onClick={() => onEdit(doc)}>✎</button>
                  <button title="Share" onClick={() => onShare(doc)}>↗</button>
                  <button title="Delete" className="danger-text" onClick={() => onDelete(doc)}>×</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}