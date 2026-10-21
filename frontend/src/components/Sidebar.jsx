export default function Sidebar({ page, setPage, user, onLogout }) {
  const items = [
    ["Dashboard", "⌂"],
    ["Documents", "▤"],
    ["Groups", "♧"],
    ["Departments", "▦"],
    ["Audit Logs", "◷"],
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">T</div>
        <div>
          <strong>TrustVault</strong>
          <small>Secure workspace</small>
        </div>
      </div>

      <div className="nav-label">WORKSPACE</div>

      {items.map(([name, icon]) => (
        <button
          key={name}
          className={`nav-item ${page === name ? "active" : ""}`}
          onClick={() => setPage(name)}
        >
          <span>{icon}</span>
          {name}
        </button>
      ))}

      <div className="sidebar-bottom">
        <div className="user-mini">
          <div className="avatar">
            {(user?.name || user?.email || "U")[0].toUpperCase()}
          </div>
          <div className="user-info">
            <strong>{user?.name || "User"}</strong>
            <small>{user?.role || "Member"}</small>
          </div>
        </div>
        <button className="nav-item logout" onClick={onLogout}>
          ↪ Sign out
        </button>
      </div>
    </aside>
  );
}