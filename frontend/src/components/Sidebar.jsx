
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  ShieldCheck,
  ClipboardList,
  LockKeyhole,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, page: "dashboard" },
  { label: "Documents", icon: FileText, page: "documents" },
  { label: "Groups", icon: Users, page: "groups" },
  { label: "Departments", icon: Building2, page: "departments" },
  { label: "Access Management", icon: ShieldCheck, page: "access" },
  { label: "Admin & Audit Trail", icon: ClipboardList, page: "audit" },
];

export default function Sidebar({
  user,
  currentPage,
  setCurrentPage,
  onLogout,
}) {
  const activePage = String(currentPage || "dashboard").toLowerCase();

  const name =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "User";

  const email = user?.email || "";
  const role = String(user?.role || "Member");

  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon" aria-label="TrustVault logo">
          T
        </div>

        <div className="brand-copy">
          <div className="brand-name">TrustVault</div>
          <span className="brand-caption">Secure workspace</span>
        </div>
      </div>

      <div className="sidebar-label">Workspace</div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map(({ label, icon: Icon, page }) => {
          const isActive = activePage === page;

          return (
            <button
              key={page}
              type="button"
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => setCurrentPage(page)}
              aria-current={isActive ? "page" : undefined}
              title={label}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>

              {isActive && (
                <ChevronRight
                  className="nav-chevron"
                  size={15}
                  strokeWidth={2}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-label">Account</div>

        <div className="user-profile">
          <div className="avatar" aria-hidden="true">
            {initial}
          </div>

          <div className="user-details">
            <div className="user-name" title={name}>
              {name}
            </div>

            {email && (
              <div className="user-email" title={email}>
                {email}
              </div>
            )}

            <span className="user-role">{role}</span>
          </div>
        </div>

        <button
          type="button"
          className="nav-item signout-button"
          onClick={onLogout}
          title="Sign out"
        >
          <LogOut size={17} strokeWidth={1.8} />
          <span>Sign out</span>
        </button>

        <div className="secure-workspace">
          <LockKeyhole size={12} />
          <span>Secure workspace</span>
        </div>
      </div>
    </aside>
  );
}
