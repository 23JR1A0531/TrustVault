import { useMemo, useState } from "react";
import {
  Users,
  Plus,
  RefreshCw,
  UserPlus,
  Pencil,
  Trash2,
  X,
  Search,
  Check,
  ShieldCheck,
} from "lucide-react";
import { api } from "../api";

export default function GroupsPage({
  groups = [],
  loading = false,
  token = "",
  user = null,
  onCreateGroup,
  onAddMember,
  onRemoveMember,
  onUpdateGroup,
  onDeleteGroup,
  onRefresh,
  onNotice,
  onError,
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");

  const [editingGroup, setEditingGroup] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const [searchingUsers, setSearchingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyGroupId, setBusyGroupId] = useState(null);
  const [error, setError] = useState("");

  const role = String(user?.role || "").toLowerCase();
  const canManage = ["admin", "owner"].includes(role);

  const styles = useMemo(
    () => ({
      page: {
        color: "#F4F7FF",
        fontFamily: "Inter, system-ui, sans-serif",
      },
      heading: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        marginBottom: 22,
      },
      title: {
        margin: 0,
        fontSize: 27,
        fontWeight: 800,
        letterSpacing: "-.5px",
        color: "#F8FAFF",
      },
      subtitle: {
        margin: "7px 0 0",
        color: "#A8BCE0",
        fontSize: 13,
      },
      actions: {
        display: "flex",
        gap: 9,
        flexWrap: "wrap",
      },
      button: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        border: "1px solid #30496F",
        background: "#111D34",
        color: "#F4F7FF",
        borderRadius: 9,
        padding: "10px 13px",
        fontSize: 12,
        fontWeight: 750,
        cursor: "pointer",
      },
      primary: {
        background: "linear-gradient(135deg, #2563EB, #1747C7)",
        borderColor: "#3978FF",
        color: "#FFFFFF",
        boxShadow: "0 3px 12px rgba(37, 99, 235, 0.2)",
      },
      danger: {
        color: "#FF777F",
        borderColor: "#873541",
        background: "#211522",
      },
      card: {
        background:
          "linear-gradient(145deg, #142747 0%, #0D172B 55%, #080E1D 100%)",
        border: "1px solid #29456E",
        borderRadius: 15,
        padding: 20,
        boxShadow:
          "0 4px 18px rgba(17, 69, 160, 0.12), inset 0 1px 0 rgba(120, 170, 255, 0.04)",
        color: "#F4F7FF",
      },
      field: {
        display: "grid",
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        color: "#DCE7FA",
      },
      input: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #30496F",
        borderRadius: 9,
        padding: "11px 12px",
        font: "inherit",
        fontSize: 13,
        outlineColor: "#D9B44A",
        background: "#0B1528",
        color: "#F8FAFF",
      },
      muted: {
        color: "#A8BCE0",
        fontSize: 12,
      },
      member: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        border: "1px solid #293F60",
        borderRadius: 9,
        padding: "8px 10px",
        marginTop: 7,
        minWidth: 0,
        background: "rgba(8, 17, 33, 0.7)",
        color: "#F4F7FF",
      },
      iconBox: {
        display: "grid",
        placeItems: "center",
        width: 38,
        height: 38,
        borderRadius: 11,
        background: "linear-gradient(145deg, #4B3B13, #29220F)",
        border: "1px solid #A67C20",
        color: "#FFD45C",
        flexShrink: 0,
        boxShadow: "0 0 12px rgba(255, 196, 54, 0.08)",
      },
      overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(3, 8, 19, 0.78)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 1000,
      },
      modal: {
        width: "min(100%, 500px)",
        background: "linear-gradient(145deg, #142747 0%, #0A1222 100%)",
        border: "1px solid #30496F",
        color: "#F4F7FF",
        borderRadius: 16,
        padding: 22,
        boxShadow: "0 18px 60px rgba(0, 0, 0, 0.45)",
        maxHeight: "90vh",
        overflowY: "auto",
      },
      modalHead: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginBottom: 18,
        color: "#F8FAFF",
      },
      alert: {
        background: "#321923",
        border: "1px solid #813747",
        color: "#FFB8C0",
        borderRadius: 9,
        padding: 11,
        fontSize: 12,
        marginBottom: 14,
      },
      userOption: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        padding: 11,
        background: "#101D33",
        border: "1px solid #293F60",
        borderRadius: 9,
        cursor: "pointer",
        color: "#F4F7FF",
      },
    }),
    []
  );

  function groupId(group) {
    return group?.id ?? group?._id ?? group?.group_id;
  }

  function getGroupName(group) {
    return group?.name ?? group?.group_name ?? "Unnamed Group";
  }

  function membersOf(group) {
    if (Array.isArray(group?.members)) return group.members;
    if (Array.isArray(group?.users)) return group.users;
    return [];
  }

  function memberId(member) {
    return member?.id ?? member?.user_id ?? member?._id;
  }

  function memberName(member) {
    return member?.name ?? member?.full_name ?? member?.username ?? "Registered user";
  }

  function showError(message) {
    setError(message);
    onError?.(message);
  }

  function closeMemberModal() {
    setSelectedGroup(null);
    setUserSearch("");
    setUserResults([]);
    setSelectedUserIds([]);
    setError("");
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");

    if (!groupName.trim()) {
      showError("Please enter a group name.");
      return;
    }

    if (!onCreateGroup) {
      showError("Create-group handler is not connected.");
      return;
    }

    setSubmitting(true);

    try {
      await onCreateGroup({
        name: groupName.trim(),
        description: description.trim(),
      });

      setGroupName("");
      setDescription("");
      setShowCreateForm(false);
      onNotice?.("Group created successfully.");
      onRefresh?.();
    } catch (err) {
      showError(err?.message || "Unable to create the group.");
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
    const id = memberId(person);

    if (id == null) return;

    const normalizedId = String(id);
    const currentIds = membersOf(selectedGroup).map((member) =>
      String(memberId(member))
    );

    if (currentIds.includes(normalizedId)) {
      setError("This user is already a member of the group.");
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

    if (!selectedGroup) {
      showError("Select a group first.");
      return;
    }

    if (!selectedUserIds.length) {
      showError("Search and select at least one registered user.");
      return;
    }

    if (!onAddMember) {
      showError("Add-member handler is not connected.");
      return;
    }

    setSubmitting(true);

    try {
      for (const id of selectedUserIds) {
        await onAddMember(selectedGroup, id);
      }

      closeMemberModal();
      onNotice?.("Selected members added successfully.");
      onRefresh?.();
    } catch (err) {
      showError(err?.message || "Unable to add selected members.");
    } finally {
      setSubmitting(false);
    }
  }

  function beginEdit(group) {
    setEditingGroup(group);
    setEditName(getGroupName(group));
    setEditDescription(group?.description || "");
    setError("");
  }

  async function saveEdit(event) {
    event.preventDefault();

    if (!editingGroup || !editName.trim()) {
      showError("Group name is required.");
      return;
    }

    const id = groupId(editingGroup);
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: editName.trim(),
        description: editDescription.trim(),
      };

      if (onUpdateGroup) {
        await onUpdateGroup(id, payload);
      } else if (token) {
        await api.updateGroup(token, id, payload);
      } else {
        throw new Error("Update handler is not connected yet.");
      }

      setEditingGroup(null);
      onNotice?.("Group updated successfully.");
      onRefresh?.();
    } catch (err) {
      showError(err?.message || "Could not update the group.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteGroup(group) {
    const id = groupId(group);

    if (
      !window.confirm(
        `Delete "${getGroupName(group)}"? Its group membership and access grants may also be removed.`
      )
    ) {
      return;
    }

    setBusyGroupId(id);
    setError("");

    try {
      if (onDeleteGroup) {
        await onDeleteGroup(id);
      } else if (token) {
        await api.deleteGroup(token, id);
      } else {
        throw new Error("Delete handler is not connected yet.");
      }

      onNotice?.("Group deleted.");
      onRefresh?.();
    } catch (err) {
      showError(err?.message || "Could not delete the group.");
    } finally {
      setBusyGroupId(null);
    }
  }

  async function removeMember(group, member) {
    if (!onRemoveMember) {
      showError("Remove-member handler is not connected.");
      return;
    }

    const id = memberId(member);

    if (
      !window.confirm(
        `Remove ${memberName(member)} from ${getGroupName(group)}?`
      )
    ) {
      return;
    }

    try {
      await onRemoveMember(group, id);
      onNotice?.("Member removed.");
      onRefresh?.();
    } catch (err) {
      showError(err?.message || "Could not remove member.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <div>
          <h1 style={styles.title}>Groups</h1>
          <p style={styles.subtitle}>
            Organize registered users and manage group membership.
          </p>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.button}
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={15} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            style={{ ...styles.button, ...styles.primary }}
            onClick={() => {
              setError("");
              setShowCreateForm(true);
            }}
          >
            <Plus size={16} />
            Create Group
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            ...styles.alert,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            style={{
              marginLeft: "auto",
              border: 0,
              background: "transparent",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {showCreateForm && (
        <div style={styles.overlay}>
          <form onSubmit={handleCreate} style={styles.modal}>
            <div style={styles.modalHead}>
              <div>
                <h2 style={{ margin: 0, fontSize: 19 }}>Create group</h2>
                <p style={styles.subtitle}>
                  Give this group a clear name and purpose.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={styles.button}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <label style={styles.field}>
                Group name
                <input
                  style={styles.input}
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  maxLength={100}
                  required
                  placeholder="e.g. Finance Team"
                />
              </label>

              <label style={styles.field}>
                Description
                <textarea
                  style={{
                    ...styles.input,
                    minHeight: 90,
                    resize: "vertical",
                  }}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={500}
                  placeholder="What is this group for?"
                />
              </label>

              <div
                style={{
                  ...styles.actions,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  style={styles.button}
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{ ...styles.button, ...styles.primary }}
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : <><Plus size={15} /> Create group</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {selectedGroup && (
        <div style={styles.overlay}>
          <form onSubmit={handleAddMembers} style={styles.modal}>
            <div style={styles.modalHead}>
              <div>
                <h2 style={{ margin: 0, fontSize: 19 }}>
                  Manage Group Members
                </h2>
                <p style={styles.subtitle}>
                  Group: {getGroupName(selectedGroup)}
                </p>
              </div>

              <button
                type="button"
                style={styles.button}
                onClick={closeMemberModal}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <label style={styles.field}>
              Search registered users by name or email
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: 11,
                    top: 12,
                    color: "#A8BCE0",
                  }}
                />
                <input
                  style={{ ...styles.input, paddingLeft: 35 }}
                  value={userSearch}
                  onChange={(event) => searchUsers(event.target.value)}
                  placeholder="Type at least 2 characters..."
                />
              </div>
            </label>

            {searchingUsers && (
              <p style={styles.muted}>Searching registered users...</p>
            )}

            {!searchingUsers &&
              userSearch.trim().length >= 2 &&
              userResults.length === 0 && (
                <p style={styles.muted}>
                  No matching active, approved users found.
                </p>
              )}

            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {userResults.map((person, index) => {
                const id = memberId(person);
                const normalizedId = String(id ?? "");
                const existingIds = membersOf(selectedGroup).map((member) =>
                  String(memberId(member))
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
                      ...styles.userOption,
                      borderColor: selected ? "#D9B44A" : "#293F60",
                      background: selected ? "#202B35" : "#101D33",
                      opacity: alreadyMember ? 0.55 : 1,
                      cursor: alreadyMember ? "not-allowed" : "pointer",
                    }}
                  >
                    <ShieldCheck
                      size={18}
                      color={selected ? "#FFD45C" : "#8CA8D8"}
                    />

                    <span style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: 13 }}>
                        {memberName(person)}
                      </strong>
                      <span
                        style={{
                          display: "block",
                          color: "#A8BCE0",
                          fontSize: 12,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {person.email || "No email"} · {person.role || "viewer"}
                      </span>
                      {alreadyMember && (
                        <span style={{ color: "#FFD45C", fontSize: 11 }}>
                          Already a member
                        </span>
                      )}
                    </span>

                    {selected && <Check size={18} color="#FFD45C" />}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 16 }}>
              <p style={styles.muted}>
                Selected: {selectedUserIds.length} user
                {selectedUserIds.length === 1 ? "" : "s"}
              </p>
            </div>

            <div
              style={{
                ...styles.actions,
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <button
                type="button"
                style={styles.button}
                onClick={closeMemberModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={{ ...styles.button, ...styles.primary }}
                disabled={submitting || selectedUserIds.length === 0}
              >
                {submitting ? (
                  "Adding..."
                ) : (
                  <>
                    <UserPlus size={15} /> Add selected
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingGroup && (
        <div style={styles.overlay}>
          <form onSubmit={saveEdit} style={styles.modal}>
            <div style={styles.modalHead}>
              <div>
                <h2 style={{ margin: 0, fontSize: 19 }}>Edit group</h2>
                <p style={styles.subtitle}>
                  Update the group name or description.
                </p>
              </div>

              <button
                type="button"
                style={styles.button}
                onClick={() => setEditingGroup(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <label style={styles.field}>
                Group name
                <input
                  style={styles.input}
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  maxLength={100}
                  required
                />
              </label>

              <label style={styles.field}>
                Description
                <textarea
                  style={{
                    ...styles.input,
                    minHeight: 90,
                    resize: "vertical",
                  }}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  maxLength={500}
                />
              </label>

              <div
                style={{
                  ...styles.actions,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  style={styles.button}
                  onClick={() => setEditingGroup(null)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{ ...styles.button, ...styles.primary }}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : <><Check size={15} /> Save changes</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {groups.length === 0 ? (
        <div
          style={{
            ...styles.card,
            textAlign: "center",
            padding: "48px 20px",
          }}
        >
          <div
            style={{
              ...styles.iconBox,
              margin: "0 auto 12px",
              width: 48,
              height: 48,
            }}
          >
            <Users size={22} />
          </div>

          <h3 style={{ margin: "0 0 7px", fontSize: 16 }}>
            {loading ? "Loading groups..." : "No groups yet"}
          </h3>

          <p style={{ ...styles.muted, margin: 0 }}>
            {loading
              ? "Please wait while groups are loaded."
              : "Create a group to organize users and share documents with a team."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
            gap: 14,
          }}
        >
          {groups.map((group, index) => {
            const id = groupId(group);
            const members = membersOf(group);

            return (
              <section key={id ?? index} style={styles.card}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div style={styles.iconBox}>
                    <Users size={19} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        margin: "1px 0 5px",
                        fontSize: 16,
                        fontWeight: 800,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {getGroupName(group)}
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        color: "#A8BCE0",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {group.description || "No description provided."}
                    </p>
                  </div>

                  <span
                    style={{
                      background: "#202F49",
                      color: "#DCE7FA",
                      padding: "5px 8px",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {members.length} member{members.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: "1px solid #293F60",
                  }}
                >
                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.primary }}
                    onClick={() => {
                      setSelectedGroup(group);
                      setError("");
                    }}
                  >
                    <UserPlus size={14} /> Manage members
                  </button>

                  {canManage && (
                    <button
                      type="button"
                      style={styles.button}
                      onClick={() => beginEdit(group)}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  )}

                  {canManage && (
                    <button
                      type="button"
                      style={{ ...styles.button, ...styles.danger }}
                      disabled={busyGroupId === id}
                      onClick={() => deleteGroup(group)}
                    >
                      <Trash2 size={14} />
                      {busyGroupId === id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>

                <div style={{ marginTop: 17 }}>
                  <h3
                    style={{
                      margin: "0 0 9px",
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#DCE7FA",
                    }}
                  >
                    GROUP MEMBERS
                  </h3>

                  {members.length === 0 ? (
                    <p style={{ ...styles.muted, margin: 0 }}>
                      No members assigned yet.
                    </p>
                  ) : (
                    members.map((member, memberIndex) => (
                      <div
                        key={memberId(member) ?? memberIndex}
                        style={styles.member}
                      >
                        <div
                          style={{
                            ...styles.iconBox,
                            width: 32,
                            height: 32,
                            borderRadius: 9,
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {memberName(member).slice(0, 1).toUpperCase()}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong
                            style={{
                              display: "block",
                              fontSize: 12,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {memberName(member)}
                          </strong>

                          <span
                            style={{
                              color: "#A8BCE0",
                              fontSize: 11,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {member.email || "Registered member"}
                          </span>
                        </div>

                        {canManage && (
                          <button
                            type="button"
                            title="Remove member"
                            aria-label="Remove member"
                            style={{
                              ...styles.button,
                              padding: 7,
                              ...styles.danger,
                            }}
                            onClick={() => removeMember(group, member)}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}