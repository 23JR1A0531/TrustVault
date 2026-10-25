import {
  FileText,
  Search,
  Upload,
  Download,
  Share2,
  Pencil,
  Trash2,
  RefreshCw,
  File,
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

function getDocumentId(document) {
  return document.id ?? document._id ?? document.document_id;
}

function getDocumentTitle(document) {
  return (
    document.title ||
    document.filename ||
    document.original_filename ||
    "Untitled document"
  );
}

export default function DocumentsPage({
  documents = [],
  loading = false,
  searchTerm = "",
  onSearchChange,
  onUpload,
  onDownload,
  onShare,
  onEdit,
  onDelete,
  onRefresh,
}) {
  const filteredDocuments = documents.filter((document) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return true;

    return [
      document.title,
      document.filename,
      document.original_filename,
      document.description,
      document.owner_name,
      document.owner_email,
      document.status,
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1 style={{ marginBottom: 7 }}>Documents</h1>
          <p>
            Securely store, organize, and manage your documents.
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
            onClick={onUpload}
          >
            <Upload size={16} />
            Upload Document
          </button>
        </div>
      </div>

      <section className="panel">
        <div
          className="panel-header"
          style={{ alignItems: "center" }}
        >
          <div>
            <h2>Document Library</h2>
            <p style={{ margin: "6px 0 0", fontSize: 12 }}>
              {filteredDocuments.length} document
              {filteredDocuments.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div
            className="search-box"
            style={{ minWidth: 240, maxWidth: 340 }}
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
              placeholder="Search documents..."
              aria-label="Search documents"
              value={searchTerm}
              onChange={(event) =>
                onSearchChange?.(event.target.value)
              }
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw
              size={28}
              className="loading-icon"
              style={{ margin: "0 auto 12px" }}
            />
            <h3>Loading documents...</h3>
            <p>Please wait while your documents are retrieved.</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <FileText
              size={42}
              style={{ margin: "0 auto 14px", color: "#64748b" }}
            />

            <h3>
              {searchTerm.trim()
                ? "No matching documents"
                : "No documents yet"}
            </h3>

            <p>
              {searchTerm.trim()
                ? "Try another search term."
                : "Upload your first document to get started."}
            </p>

            {!searchTerm.trim() && (
              <button
                type="button"
                className="btn-primary"
                onClick={onUpload}
              >
                <Upload size={15} />
                Upload Document
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Owner</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map((document, index) => {
                  const id = getDocumentId(document);
                  const title = getDocumentTitle(document);

                  const owner =
                    document.owner_name ||
                    document.owner_email ||
                    document.uploaded_by ||
                    document.owner_id ||
                    "—";

                  const status = document.status || "Stored";

                  return (
                    <tr key={id ?? index}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 11,
                            minWidth: 180,
                          }}
                        >
                          <div className="activity-icon">
                            <File size={18} />
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                color: "#f1f5f9",
                                fontWeight: 700,
                                fontSize: 12,
                                overflowWrap: "anywhere",
                              }}
                            >
                              {title}
                            </div>

                            {document.description && (
                              <div
                                style={{
                                  maxWidth: 260,
                                  marginTop: 5,
                                  color: "#94a3b8",
                                  fontSize: 10,
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {document.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>{owner}</td>

                      <td>
                        {formatDate(
                          document.created_at ||
                            document.uploaded_at ||
                            document.createdAt
                        )}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            String(status).toLowerCase() === "active"
                              ? "badge-green"
                              : "badge-blue"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            title="Download document"
                            aria-label={`Download ${title}`}
                            onClick={() => onDownload?.(document)}
                          >
                            <Download size={14} />
                          </button>

                          <button
                            type="button"
                            title="Share document"
                            aria-label={`Share ${title}`}
                            onClick={() => onShare?.(document)}
                          >
                            <Share2 size={14} />
                          </button>

                          <button
                            type="button"
                            title="Edit document"
                            aria-label={`Edit ${title}`}
                            onClick={() => onEdit?.(document)}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            title="Delete document"
                            aria-label={`Delete ${title}`}
                            onClick={() => onDelete?.(document)}
                            style={{
                              color: "#fda4af",
                              borderColor: "#80364b",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`
        .loading-icon {
          animation: trustvault-spin 1.2s linear infinite;
          color: #60a5fa;
        }

        @keyframes trustvault-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}