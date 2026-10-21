import StatCard from "../components/StatCard";
import DocumentTable from "../components/DocumentTable";

export default function DashboardPage({ documents, onDownload, onEdit, onDelete, onShare, onUpload }) {
  const totalSize = documents.reduce((sum, doc) => sum + (Number(doc.file_size) || 0), 0);
  const recent = [...documents].slice(0, 5);

  return (
    <>
      <section className="welcome-banner">
        <div><span className="eyebrow">YOUR WORKSPACE</span><h2>Everything important, in one secure place.</h2><p>Manage documents and control who can access them.</p></div>
        <button className="btn btn-light" onClick={onUpload}>＋ Upload document</button>
      </section>

      <div className="stats-grid">
        <StatCard label="Total documents" value={documents.length} icon="▤" description="Documents available to you" />
        <StatCard label="Storage used" value={totalSize >= 1048576 ? `${(totalSize / 1048576).toFixed(1)} MB` : `${(totalSize / 1024).toFixed(0)} KB`} icon="◫" description="Combined document size" />
        <StatCard label="Categories" value={new Set(documents.map((d) => d.category).filter(Boolean)).size} icon="▦" description="Categories in your vault" />
      </div>

      <section className="panel">
        <div className="panel-heading"><div><h2>Recent documents</h2><p>Your latest available documents</p></div></div>
        <DocumentTable documents={recent} onDownload={onDownload} onEdit={onEdit} onDelete={onDelete} onShare={onShare} />
      </section>
    </>
  );
}