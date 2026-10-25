
import { Search, ShieldCheck, Upload } from "lucide-react";

const pageTitles = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Workspace / Dashboard",
  },
  documents: {
    title: "Documents",
    subtitle: "Workspace / Documents",
  },
  groups: {
    title: "Groups",
    subtitle: "Workspace / Groups",
  },
  departments: {
    title: "Departments",
    subtitle: "Workspace / Departments",
  },
  access: {
    title: "Access Management",
    subtitle: "Workspace / Access Management",
  },
  audit: {
    title: "Admin & Audit Trail",
    subtitle: "Workspace / Admin & Audit Trail",
  },
};

export default function Topbar({
  currentPage = "dashboard",
  user,
  searchTerm = "",
  onSearchChange,
  onUpload,
}) {
  const page = pageTitles[String(currentPage).toLowerCase()] ||
    pageTitles.dashboard;

  const displayName =
    user?.name ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "User";

  const initial = displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="topbar">
      <div className="topbar-heading">
        <div className="topbar-subtitle">{page.subtitle}</div>
        <h1 className="topbar-title">{page.title}</h1>
      </div>

      <div className="topbar-actions">
        {currentPage === "documents" && (
          <label className="search-box">
            <Search className="search-icon" size={15} />
            <input
              type="search"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(event) =>
                onSearchChange?.(event.target.value)
              }
              aria-label="Search documents"
            />
          </label>
        )}

        {currentPage === "dashboard" && (
          <>
            <label className="search-box">
              <Search className="search-icon" size={15} />
              <input
                type="search"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(event) =>
                  onSearchChange?.(event.target.value)
                }
                aria-label="Search documents"
              />
            </label>

            <button
              type="button"
              className="btn btn-primary topbar-upload"
              onClick={onUpload}
            >
              <Upload size={14} />
              Upload
            </button>
          </>
        )}

        <div className="secure-indicator" title="Secure workspace">
          <ShieldCheck size={15} />
          <span>SECURE</span>
        </div>

        <div
          className="topbar-avatar"
          title={`${displayName}${user?.email ? ` · ${user.email}` : ""}`}
          aria-label={`Signed in as ${displayName}`}
        >
          {initial}
        </div>
      </div>
    </header>
  );
}
