import { useMemo, useState } from "react";
import {
  Search,
  Users,
  UserPlus,
  UserMinus,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

export default function MemberSelector({
  users = [],
  memberIds = [],
  loading = false,
  submitting = false,
  onAddMembers,
  onRemoveMembers,
  onClose,
  title = "Manage Members",
  description = "",
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState("");

  const getId = (user) =>
    String(user?.id ?? user?._id ?? user?.user_id ?? "");

  const getName = (user) =>
    user?.name ?? user?.full_name ?? user?.username ?? "Registered user";

  const getEmail = (user) => user?.email ?? "";

  const currentMemberIds = useMemo(
    () => new Set(memberIds.map(String)),
    [memberIds]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        getName(user).toLowerCase().includes(query) ||
        getEmail(user).toLowerCase().includes(query);

      return matchesSearch && Boolean(getId(user));
    });
  }, [users, search]);

  function toggleUser(user) {
    const id = getId(user);

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );

    setError("");
  }

  async function handleAdd() {
    const ids = selectedIds.filter(
      (id) => !currentMemberIds.has(id)
    );

    if (!ids.length) {
      setError("Select at least one user who is not already a member.");
      return;
    }

    setError("");

    try {
      await onAddMembers?.(ids);
      setSelectedIds([]);
    } catch (err) {
      setError(err?.message || "Unable to add selected members.");
    }
  }

  async function handleRemove() {
    const ids = selectedIds.filter((id) =>
      currentMemberIds.has(id)
    );

    if (!ids.length) {
      setError("Select at least one existing member to remove.");
      return;
    }

    setError("");

    try {
      await onRemoveMembers?.(ids);
      setSelectedIds([]);
    } catch (err) {
      setError(err?.message || "Unable to remove selected members.");
    }
  }

  const selectedMemberCount = selectedIds.filter((id) =>
    currentMemberIds.has(id)
  ).length;

  const selectedNonMemberCount = selectedIds.filter(
    (id) => !currentMemberIds.has(id)
  ).length;

  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-selector-title"
      >
        <div className="modal-heading">
          <div>
            <h2 id="member-selector-title">{title}</h2>
            <p>
              {description ||
                "Search registered users and manage membership."}
            </p>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <label className="field">
          Search users
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: 13,
                color: "#94a3b8",
              }}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email..."
              style={{ paddingLeft: 36 }}
            />
          </div>
        </label>

        {error && (
          <div className="alert-error" role="alert">
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "14px 0 10px",
          }}
        >
          <span
            style={{
              color: "#94a3b8",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            REGISTERED USERS
          </span>

          <span style={{ color: "#94a3b8", fontSize: 11 }}>
            {selectedIds.length} selected
          </span>
        </div>

        <div
          style={{
            maxHeight: 320,
            overflowY: "auto",
            border: "1px solid #263653",
            borderRadius: 10,
          }}
        >
          {loading ? (
            <div className="empty-state">
              <RefreshCw size={24} />
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <Users
                size={30}
                style={{ margin: "0 auto 10px", color: "#64748b" }}
              />
              <h3>No users found</h3>
              <p>
                {search
                  ? "Try another name or email."
                  : "Registered users will appear here when connected."}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const id = getId(user);
              const isMember = currentMemberIds.has(id);
              const isSelected = selectedIds.includes(id);

              return (
                <label
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    cursor: "pointer",
                    borderBottom: "1px solid #263653",
                    background: isSelected
                      ? "rgba(59,130,246,0.10)"
                      : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={submitting}
                    onChange={() => toggleUser(user)}
                  />

                  <div
                    className="avatar"
                    style={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                    }}
                  >
                    {getName(user).charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {getName(user)}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {getEmail(user)}
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      isMember ? "badge-gold" : ""
                    }`}
                    style={{ flexShrink: 0 }}
                  >
                    {isMember ? "Member" : "Not a member"}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <div
          className="modal-actions"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 18,
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRemove}
            disabled={
              submitting ||
              loading ||
              selectedMemberCount === 0
            }
          >
            <UserMinus size={15} />
            Remove selected
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleAdd}
              disabled={
                submitting ||
                loading ||
                selectedNonMemberCount === 0
              }
            >
              <UserPlus size={15} />
              Add selected
            </button>
          </div>
        </div>

        {submitting && (
          <p style={{ fontSize: 11, color: "#94a3b8" }}>
            Updating membership...
          </p>
        )}
      </section>
    </div>
  );
}