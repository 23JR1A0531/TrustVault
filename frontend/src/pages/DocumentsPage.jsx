import DocumentTable from "../components/DocumentTable";

export default function DocumentsPage({ documents, onDownload, onEdit, onDelete, onShare }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div><h2>All documents</h2><p>Search, manage, download, and share your documents.</p></div>
        <span className="count-pill">{documents.length} documents</span>
      </div>
      <DocumentTable documents={documents} onDownload={onDownload} onEdit={onEdit} onDelete={onDelete} onShare={onShare} />
    </section>
  );
}