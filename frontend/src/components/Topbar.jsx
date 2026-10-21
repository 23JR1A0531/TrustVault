export default function Topbar({ page, search, setSearch, onUpload }) {
  return (
    <header className="topbar">
      <div>
        <div className="breadcrumb">Workspace / {page}</div>
        <h1>{page}</h1>
      </div>

      <div className="topbar-actions">
        <label className="search-box">
          <span>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
          />
        </label>
        <button className="btn btn-primary" onClick={onUpload}>
          + Upload
        </button>
      </div>
    </header>
  );
}