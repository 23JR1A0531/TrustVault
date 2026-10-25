import { useState } from "react";
import {
  Building2,
  Plus,
  RefreshCw,
  UserPlus,
  X,
  Users,
  ShieldCheck,
  Pencil,
  Trash2,
  Search,
  Check,
} from "lucide-react";
import { api } from "../api";

export default function DepartmentsPage({
  departments = [],
  loading = false,
  token = "",
  user = null,
  onCreateDepartment,
  onAddMember,
  onRemoveMember,
  onRefresh,
  onUpdateDepartment,
  onDeleteDepartment,
  onNotice,
  onError,
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [description, setDescription] = useState("");

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const canManage = ["admin", "owner"].includes(
    String(user?.role || "").toLowerCase()
  );

  function getDepartmentId(department) {
    return (
      department?.id ??
      department?._id ??
      department?.department_id
    );
  }

  function getDepartmentName(department) {
    return (
      department?.name ??
      department?.department_name ??
      "Unnamed Department"
    );
  }

  function getMembers(department) {
    if (Array.isArray(department?.members)) {
      return department.members;
    }

    if (Array.isArray(department?.users)) {
      return department.users;
    }

    return [];
  }

  function getUserId(person) {
    return person?.id ?? person?.user_id ?? person?._id;
  }

  function getUserName(person) {
    return (
      person?.name ??
      person?.full_name ??
      person?.username ??
      "Registered user"
    );
  }

  function showError(message) {
    setError(message);
    onError?.(message);
  }

  function closeMemberSelector() {
    setSelectedDepartment(null);
    setUserSearch("");
    setUserResults([]);
    setSelectedUserIds([]);
    setError("");
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");

    if (!departmentName.trim()) {
      showError("Please enter a department name.");
      return;
    }

    if (!onCreateDepartment) {
      showError("Create-department handler is not connected.");
      return;
    }

    setSubmitting(true);

    try {
      await onCreateDepartment({
        name: departmentName.trim(),
        description: description.trim(),
      });

      setDepartmentName("");
      setDescription("");
      setShowCreateForm(false);
      onNotice?.("Department created successfully.");
      onRefresh?.();
    } catch (err) {
      showError(err?.message || "Unable to create department.");
    } finally {
      setSubmitting(false);
    }
  }

  function openEditDepartment(department) {
    setError("");
    setEditingDepartment(department);
    setEditName(getDepartmentName(department));
    setEditDescription(department?.description || "");
  }

  async function handleUpdateDepartment(event) {
    event.preventDefault();
    setError("");

    if (!editName.trim()) {
      showError("Please enter a department name.");
      return;
    }

    if (!onUpdateDepartment) {
      showError("Update callback is not connected.");
      return;
    }

    setSubmitting(true);

    try {
      await onUpdateDepartment(editingDepartment, {
        name: editName.trim(),
        description: editDescription.trim(),
      });

      setEditingDepartment(null);
      onNotice?.("Department updated successfully.");
      onRefresh?.();
    } catch (err) {
      showError(err?.message || "Unable to update department.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDepartment(department) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${getDepartmentName(department)}"?`
    );

    if (!confirmed) return;

    if (!onDeleteDepartment) {
      showError("Delete callback is not connected.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await onDeleteDepartment(department);
      onNotice?.("Department deleted.");
      onRefresh?.();
    } catch (err) {
      showError(err?.message || "Unable to delete department.");
    } finally {
      setSubmitting(false);
    }
  }

  async function searchUsers(value) {
    setUserSearch(value);
    setError("");

    if (!token || value.trim().length < 2) {
      setUserResults([]);
      return;
    }

    setSearchingUsers(true);

    try {
      const result = await api.searchActiveUsers(token, value.trim());

      const rows = Array.isArray(result)
        ? result
        : result?.users || result?.data?.users || result?.data || [];

      setUserResults(Array.isArray(rows) ? rows : []);
    } catch (err) {
      showError(err?.message || "Could not search registered users.");
      setUserResults([]);
    } finally {
      setSearchingUsers(false);
    }
  }

  function toggleUserSelection(person) {
    const id = getUserId(person);

    if (id == null) return;

    const normalizedId = String(id);
    const existingIds = getMembers(selectedDepartment).map((member) =>
      String(getUserId(member))
    );

    if (existingIds.includes(normalizedId)) {
      showError("This user is already a department member.");
      return;
    }

    setSelectedUserIds((current) =>
      current.includes(normalizedId)
        ? current.filter((item) => item !== normalizedId)
        : [...current, normalizedId]
    );

    setError("");
  }

  async function handleAddMembers(event) {
    event.preventDefault();
    setError("");

    if (!selectedDepartment) {
      showError("Select a department first.");
      return;
    }

    if (selectedUserIds.length === 0) {
      showError("Search and select at least one registered user.");
      return;
    }

    if (!onAddMember) {
      showError("Add-member handler is not connected.");
      return;
    }

    const departmentId = getDepartmentId(selectedDepartment);

    if (!departmentId) {
      showError("Department ID is missing.");
      return;
    }

    setSubmitting(true);

    try {
      for (const userId of selectedUserIds) {
        await onAddMember({
          department_id: departmentId,
          user_id: userId,
        });
      }

      closeMemberSelector();
      onNotice?.("Selected department members added.");
      onRefresh?.();
    } catch (err) {
      showError(err?.message || "Unable to add department members.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMember(department, member) {
    const userId = getUserId(member);

    if (!userId) {
      showError("Member ID is missing.");
      return;
    }

    if (!onRemoveMember) {
      showError("Remove-member handler is not connected.");
      return;
    }

    if (
      !window.confirm(
        `Remove ${getUserName(member)} from ${getDepartmentName(department)}?`
      )
    ) {
      return;
    }

    setError("");

    try {
      await onRemoveMember(department, userId);
      onNotice?.("Department member removed.");
      onRefresh?.();
    } catch (err) {
      showError(err?.message || "Unable to remove department member.");
    }
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <h1 style={{ marginBottom: 7 }}>Departments</h1>
          <p>
            Organize users into departments and manage membership.
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
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setError("");
              setShowCreateForm(true);
            }}
          >
            <Plus size={16} />
            Create Department
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: 0,
              color: "inherit",
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Department Directory</h2>
            <p style={{ margin: "6px 0 0", fontSize: 12 }}>
              {departments.length} department
              {departments.length === 1 ? "" : "s"} available
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw
              size={28}
              style={{ margin: "0 auto 12px", color: "#60a5fa" }}
            />
            <h3>Loading departments...</h3>
          </div>
        ) : departments.length === 0 ? (
          <div className="empty-state">
            <Building2
              size={42}
              style={{ margin: "0 auto 14px", color: "#64748b" }}
            />
            <h3>No departments created</h3>
            <p>
              Create a department to organize users and manage access.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={15} />
              Create First Department
            </button>
          </div>
        ) : (
          <div className="departments-grid">
            {departments.map((department, index) => {
              const id = getDepartmentId(department);
              const members = getMembers(department);

              return (
                <article
                  className="department-card"
                  key={id ?? index}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 12,
                        color: "#f5c451",
                        background: "#352c17",
                        border: "1px solid #80631c",
                      }}
                    >
                      <Building2 size={23} />
                    </div>

                    <span className="badge badge-gold">
                      {members.length ||
                        department.member_count ||
                        department.members_count ||
                        0}{" "}
                      members
                    </span>
                  </div>

                  <h3 style={{ overflowWrap: "anywhere" }}>
                    {getDepartmentName(department)}
                  </h3>

                  <p style={{ minHeight: 40, overflowWrap: "anywhere" }}>
                    {department.description ||
                      "No department description provided."}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      marginBottom: 17,
                      color: "#94a3b8",
                      fontSize: 11,
                    }}
                  >
                    <ShieldCheck size={14} color="#6ee7b7" />
                    Department-based access
                  </div>

                  {canManage && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 14,
                      }}
                    >
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: "center" }}
                        disabled={!id || submitting}
                        onClick={() => openEditDepartment(department)}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        style={{
                          flex: 1,
                          justifyContent: "center",
                          color: "#fda4af",
                        }}
                        disabled={!id || submitting}
                        onClick={() => handleDeleteDepartment(department)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: "100%", marginTop: 9 }}
                    disabled={!id || submitting}
                    onClick={() => {
                      setError("");
                      setSelectedDepartment(department);
                      setUserSearch("");
                      setUserResults([]);
                      setSelectedUserIds([]);
                    }}
                  >
                    <UserPlus size={15} />
                    Manage Members
                  </button>

                  {members.length > 0 && (
                    <div style={{ marginTop: 17 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          marginBottom: 8,
                          color: "#94a3b8",
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: 1,
                        }}
                      >
                        <Users size={13} />
                        MEMBERS
                      </div>

                      {members.slice(0, 4).map((member, memberIndex) => (
                        <div
                          key={getUserId(member) ?? memberIndex}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 0",
                            borderTop: "1px solid #263653",
                            fontSize: 11,
                          }}
                        >
                          <div
                            className="avatar"
                            style={{ width: 28, height: 28 }}
                          >
                            {getUserName(member).charAt(0).toUpperCase()}
                          </div>

                          <span
                            style={{
                              flex: 1,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {getUserName(member)}
                            {member.email ? (
                              <small
                                style={{
                                  display: "block",
                                  color: "#94a3b8",
                                }}
                              >
                                {member.email}
                              </small>
                            ) : null}
                          </span>

                          {canManage && (
                            <button
                              type="button"
                              title="Remove member"
                              aria-label="Remove member"
                              onClick={() =>
                                handleRemoveMember(department, member)
                              }
                              style={{
                                padding: 5,
                                color: "#fda4af",
                                background: "transparent",
                                border: 0,
                                cursor: "pointer",
                              }}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}

                      {members.length > 4 && (
                        <p style={{ marginTop: 8, fontSize: 10 }}>
                          +{members.length - 4} more members
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Create Department Modal */}
      {showCreateForm && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-department-title"
          >
            <div className="modal-heading">
              <div>
                <h2 id="create-department-title">Create Department</h2>
                <p>Add a department to your TrustVault workspace.</p>
              </div>

              <button
                type="button"
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
                disabled={submitting}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <label className="field">
                Department Name
                <input
                  type="text"
                  value={departmentName}
                  onChange={(event) =>
                    setDepartmentName(event.target.value)
                  }
                  placeholder="e.g. Engineering"
                  maxLength={120}
                  required
                />
              </label>

              <label className="field">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the department"
                  rows={3}
                  maxLength={1000}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Department"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDepartment && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-department-title"
          >
            <div className="modal-heading">
              <div>
                <h2 id="edit-department-title">Edit Department</h2>
                <p>Update the department name and description.</p>
              </div>

              <button
                type="button"
                className="close-btn"
                onClick={() => setEditingDepartment(null)}
                disabled={submitting}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment}>
              <label className="field">
                Department Name
                <input
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  maxLength={120}
                  required
                />
              </label>

              <label className="field">
                Description
                <textarea
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(event.target.value)
                  }
                  rows={3}
                  maxLength={1000}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingDepartment(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Department Member Selector */}
      {selectedDepartment && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="department-member-title"
          >
            <div className="modal-heading">
              <div>
                <h2 id="department-member-title">
                  Manage Department Members
                </h2>
                <p>
                  Department:{" "}
                  <strong style={{ color: "#f1f5f9" }}>
                    {getDepartmentName(selectedDepartment)}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                className="close-btn"
                onClick={closeMemberSelector}
                disabled={submitting}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMembers}>
              <label className="field">
                Search registered users by name or email
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: 11,
                      top: 12,
                      color: "#94a3b8",
                    }}
                  />

                  <input
                    style={{ paddingLeft: 36 }}
                    type="text"
                    value={userSearch}
                    onChange={(event) => searchUsers(event.target.value)}
                    placeholder="Type at least 2 characters..."
                  />
                </div>
              </label>

              {searchingUsers && (
                <p style={{ fontSize: 12 }}>Searching registered users...</p>
              )}

              {!searchingUsers &&
                userSearch.trim().length >= 2 &&
                userResults.length === 0 && (
                  <p style={{ fontSize: 12 }}>
                    No matching active, approved users found.
                  </p>
                )}

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  marginTop: 12,
                  maxHeight: 260,
                  overflowY: "auto",
                }}
              >
                {userResults.map((person, index) => {
                  const id = getUserId(person);
                  const normalizedId = String(id ?? "");
                  const existingIds = getMembers(selectedDepartment).map(
                    (member) => String(getUserId(member))
                  );
                  const alreadyMember = existingIds.includes(normalizedId);
                  const selected = selectedUserIds.includes(normalizedId);

                  return (
                    <button
                      key={normalizedId || index}
                      type="button"
                      disabled={alreadyMember}
                      onClick={() => toggleUserSelection(person)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        textAlign: "left",
                        padding: 11,
                        border: `1px solid ${
                          selected ? "#D9B44A" : "#30496F"
                        }`,
                        borderRadius: 9,
                        background: selected ? "#202B35" : "#0B1528",
                        color: "#F4F7FF",
                        cursor: alreadyMember ? "not-allowed" : "pointer",
                        opacity: alreadyMember ? 0.6 : 1,
                      }}
                    >
                      <ShieldCheck
                        size={18}
                        color={selected ? "#FFD45C" : "#8CA8D8"}
                      />

                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: "block", fontSize: 13 }}>
                          {getUserName(person)}
                        </strong>
                        <span
                          style={{
                            display: "block",
                            fontSize: 12,
                            color: "#A8BCE0",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {person.email || "No email"} ·{" "}
                          {person.role || "viewer"}
                        </span>
                        {alreadyMember && (
                          <small style={{ color: "#FFD45C" }}>
                            Already a member
                          </small>
                        )}
                      </span>

                      {selected && <Check size={18} color="#FFD45C" />}
                    </button>
                  );
                })}
              </div>

              <p style={{ fontSize: 12, marginTop: 14 }}>
                Selected: {selectedUserIds.length} user
                {selectedUserIds.length === 1 ? "" : "s"}
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeMemberSelector}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || selectedUserIds.length === 0}
                >
                  {submitting ? "Adding..." : "Add Selected"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}