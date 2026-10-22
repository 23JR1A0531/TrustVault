
import {
  LayoutDashboard,
  Files,
  Users,
  Building2,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Documents", icon: Files },
  { label: "Groups", icon: Users },
  { label: "Departments", icon: Building2 },
  { label: "Admin Dashboard", icon: ShieldCheck, adminOnly: true },
];

export default function Sidebar({ page, setPage, user, onLogout }) {
  const role = String(user?.role || "viewer").toLowerCase();
  const isAdmin = ["admin", "owner"].includes(role);

  const visibleItems = menuItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const isActive = (label) => {
    if (label === "Admin Dashboard") {
      return [
        "Admin Dashboard",
        "Users / Email",
        "History",
      ].includes(page);
    }

    return page === label;
  };

  const initials = (
    user?.name ||
    user?.username ||
    user?.email ||
    "U"
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <aside className="tv-sidebar">
      <style>{`
        .tv-sidebar {
          width: 235px;
          min-width: 235px;
          min-height: 100vh;
          height: 100%;
          background: #101a30;
          border-right: 1px solid #26334d;
          color: #f5f7ff;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          position: relative;
          z-index: 20;
        }

        .tv-sidebar * {
          box-sizing: border-box;
        }

        .tv-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 25px 20px 30px;
        }

        .tv-brand-logo {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 12px;
          background: #f5d477;
          color: #101a30;
          display: grid;
          place-items: center;
          font-size: 21px;
          font-weight: 900;
          box-shadow: 0 5px 16px #00000020;
        }

        .tv-brand-name {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -.5px;
          color: #ffffff;
        }

        .tv-brand-subtitle {
          font-size: 11px;
          color: #aab8d4;
          margin-top: 4px;
        }

        .tv-section-label {
          padding: 0 23px 14px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #f5d477;
        }

        .tv-nav {
          padding: 0 12px;
          display: grid;
          gap: 6px;
        }

        .tv-nav-button {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          min-height: 46px;
          padding: 12px 13px;
          border: 1px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          color: #c1cbe0;
          background: transparent;
          font: inherit;
          font-size: 12px;
          font-weight: 550;
          transition: background .18s ease, color .18s ease,
            border-color .18s ease;
        }

        .tv-nav-button:hover {
          color: #ffffff;
          background: #ffffff0c;
          border-color: #ffffff0c;
        }

        .tv-nav-button.tv-active {
          color: #ffffff;
          background: linear-gradient(100deg, #203e7c, #172e5c);
          border-color: #36558a;
          box-shadow: inset 3px 0 #f5d477, 0 4px 12px #00000012;
          font-weight: 750;
        }

        .tv-nav-icon {
          display: grid;
          place-items: center;
          width: 20px;
          flex-shrink: 0;
        }

        .tv-nav-text {
          flex: 1;
        }

        .tv-nav-chevron {
          color: #f5d477;
          flex-shrink: 0;
        }

        .tv-sidebar-spacer {
          flex: 1;
          min-height: 40px;
        }

        .tv-sidebar-bottom {
          margin: 12px 13px 0;
          border-top: 1px solid #293650;
          padding: 20px 3px 17px;
        }

        .tv-user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          min-width: 0;
        }

        .tv-avatar {
          width: 37px;
          height: 37px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          background: #24457e;
          border: 1px solid #5477bd;
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
        }

        .tv-user-details {
          flex: 1;
          min-width: 0;
        }

        .tv-user-name {
          color: #ffffff;
          font-size: 12px;
          font-weight: 750;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tv-user-email {
          color: #9fafd0;
          font-size: 10px;
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tv-role-pill {
          display: inline-flex;
          align-items: center;
          margin-top: 6px;
          padding: 3px 7px;
          border-radius: 5px;
          background: #ffffff0d;
          color: #f5d477;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .6px;
        }

        .tv-logout {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          width: 100%;
          padding: 11px 9px;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          color: #d0d8e9;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 650;
          text-align: left;
          transition: .18s ease;
        }

        .tv-logout:hover {
          color: #ffd5d5;
          background: #f0444412;
          border-color: #f0444420;
        }

        .tv-sidebar-footer {
          padding: 0 9px;
          color: #7283a6;
          font-size: 9px;
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .tv-sidebar {
            width: 205px;
            min-width: 205px;
          }

          .tv-brand {
            padding-left: 15px;
            padding-right: 12px;
          }

          .tv-nav {
            padding: 0 9px;
          }
        }

        @media (max-width: 600px) {
          .tv-sidebar {
            width: 72px;
            min-width: 72px;
            padding: 0 5px;
          }

          .tv-brand {
            justify-content: center;
            padding: 18px 0 23px;
          }

          .tv-brand-logo {
            width: 39px;
            height: 39px;
          }

          .tv-brand-copy,
          .tv-section-label,
          .tv-nav-text,
          .tv-nav-chevron,
          .tv-user-details,
          .tv-logout-text,
          .tv-sidebar-footer {
            display: none;
          }

          .tv-nav {
            padding: 0 3px;
            gap: 8px;
          }

          .tv-nav-button {
            justify-content: center;
            padding: 13px 5px;
            min-height: 45px;
          }

          .tv-nav-icon {
            width: auto;
          }

          .tv-sidebar-bottom {
            margin: 10px 0 0;
            padding: 14px 0;
          }

          .tv-user-card {
            justify-content: center;
          }

          .tv-avatar {
            width: 35px;
            height: 35px;
          }

          .tv-logout {
            justify-content: center;
            padding: 12px 0;
          }
        }
      `}</style>

      {/* Brand */}
      <div className="tv-brand">
        <div className="tv-brand-logo">T</div>

        <div className="tv-brand-copy">
          <div className="tv-brand-name">TrustVault</div>
          <div className="tv-brand-subtitle">Secure workspace</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="tv-section-label">WORKSPACE</div>

      <nav className="tv-nav" aria-label="Main navigation">
        {visibleItems.map(({ label, icon: Icon }) => {
          const active = isActive(label);

          return (
            <button
              key={label}
              type="button"
              className={`tv-nav-button ${active ? "tv-active" : ""}`}
              onClick={() => setPage(label)}
              aria-current={active ? "page" : undefined}
              title={label}
            >
              <span className="tv-nav-icon">
                <Icon size={17} strokeWidth={active ? 2.3 : 1.8} />
              </span>

              <span className="tv-nav-text">{label}</span>

              {active && (
                <ChevronRight
                  className="tv-nav-chevron"
                  size={14}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="tv-sidebar-spacer" />

      {/* Signed-in user */}
      <div className="tv-sidebar-bottom">
        <div className="tv-user-card">
          <div className="tv-avatar">{initials}</div>

          <div className="tv-user-details">
            <div className="tv-user-name">
              {user?.name || user?.username || "User"}
            </div>

            {user?.email && (
              <div className="tv-user-email">{user.email}</div>
            )}

            <span className="tv-role-pill">{role}</span>
          </div>
        </div>

        <button
          type="button"
          className="tv-logout"
          onClick={() => onLogout?.()}
          title="Sign out"
        >
          <LogOut size={16} />
          <span className="tv-logout-text">Sign out</span>
        </button>

        <div className="tv-sidebar-footer">
          TrustVault · Secure document workspace
        </div>
      </div>
    </aside>
  );
}
