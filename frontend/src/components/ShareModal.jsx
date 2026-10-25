import { useEffect, useState } from "react";
import {
  X,
  UserRound,
  Users,
  Building2,
  ShieldCheck,
  Share2,
} from "lucide-react";

const accessTypes = [
  { value: "user", label: "Individual User", icon: UserRound },
  { value: "group", label: "Group", icon: Users },
  { value: "department", label: "Department", icon: Building2 },
];

export default function ShareModal({
  document,
  groups = [],
  departments = [],
  onClose,
  onShare,
  loading = false,
}) {
  const [accessType, setAccessType] = useState("user");
  const [targetId, setTargetId] = useState("");
  const [permission, setPermission] = useState("read");
  const [error, setError] = useState("");

  const targets =
    accessType === "group"
      ? groups
      : accessType === "department"
        ? departments
        : [];

  useEffect(() => {
    setTargetId("");
    setError("");
  }, [accessType]);

  function getTargetId(item) {
    return String(
      item.id ??
        item._id ??
        item.user_id ??
        item.group_id ??
        item.department_id ??
        ""
    );
  }

  function getTargetName(item) {
    return (
      item.name ||
      item.username ||
      item.email ||
      item.department_name ||
      item.group_name ||
      "Unnamed"
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!targetId.trim()) {
      setError(
        accessType === "user"
          ? "Enter the user's ID or email."
          : "Please select a target."
      );
      return;
    }

    try {
      await onShare?.({
        accessType,
        targetId: targetId.trim(),
        permission,
        document,
      });
    } catch (err) {
      setError(err?.message || "Unable to update document permissions.");
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose?.();
        }
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        <div className="modal-heading">
          <div>
            <h2 id="share-modal-title">Share Document</h2>
            <p>
              Manage access to{" "}
              <strong style={{ color: "#f1f5f9" }}>
                {document?.title || document?.filename || "this document"}
              </strong>
            </p>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close share dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field">Share with</label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            {accessTypes.map((type) => {
              const Icon = type.icon;
              const active = accessType === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setAccessType(type.value)}
                  className={active ? "btn-primary" : "btn-secondary"}
                  style={{
                    padding: "12px 6px",
                    display: "grid",
                    justifyItems: "center",
                    gap: "7px",
                    fontSize: "10px",
                  }}
                  disabled={loading}
                >
                  <Icon size={19} />
                  {type.label}
                </button>
              );
            })}
          </div>

          {accessType === "user" ? (
            <label className="field">
              User ID or Email
              <input
                type="text"
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
                placeholder="Enter user ID or email"
                required
              />
            </label>
          ) : (
            <label className="field">
              {accessType === "group" ? "Select Group" : "Select Department"}

              <select
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
                required
              >
                <option value="">
                  Choose {accessType === "group" ? "a group" : "a department"}
                </option>

                {targets.map((item, index) => {
                  const id = getTargetId(item);

                  return (
                    <option key={id || index} value={id} disabled={!id}>
                      {getTargetName(item)}
                    </option>
                  );
                })}
              </select>
            </label>
          )}

          <label className="field">
            Permission Level
            <select
              value={permission}
              onChange={(event) => setPermission(event.target.value)}
            >
              <option value="read">Read — View document</option>
              <option value="write">Write — Modify document</option>
              <option value="admin">Admin — Manage access</option>
            </select>
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "13px",
              marginTop: "8px",
              background: "#132a2a",
              border: "1px solid #245348",
              borderRadius: "10px",
            }}
          >
            <ShieldCheck
              size={19}
              color="#6ee7b7"
              style={{ flexShrink: 0 }}
            />

            <div>
              <strong style={{ color: "#a7f3d0", fontSize: "12px" }}>
                Permission-based sharing
              </strong>
              <p style={{ margin: "5px 0 0", fontSize: "11px" }}>
                Share only with the intended recipient. Access depends on
                permissions enforced by the server.
              </p>
            </div>
          </div>

          {error && (
            <div className="alert-error" role="alert" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              <Share2 size={16} />
              {loading ? "Sharing..." : "Grant Access"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}