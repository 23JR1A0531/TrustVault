import { useState } from "react";

export default function ShareModal({ document, onClose, onSubmit, busy }) {
  const [target, setTarget] = useState("user");
  const [email, setEmail] = useState("");
  const [groupId, setGroupId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [permission, setPermission] = useState("read");

  function submit(e) {
    e.preventDefault();
    const payload =
      target === "user"
        ? { email: email.trim(), permission }
        : target === "group"
          ? { group_id: Number(groupId), permission }
          : { department_id: Number(departmentId), permission };

    onSubmit(target, payload);
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-heading">
          <div><h2>Share document</h2><p>{document?.title}</p></div>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <label className="field">
          Share with
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="user">Individual user</option>
            <option value="group">Group</option>
            <option value="department">Department</option>
          </select>
        </label>

        {target === "user" && (
          <label className="field">User email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </label>
        )}

        {target === "group" && (
          <label className="field">Group ID
            <input type="number" min="1" required value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="Enter group ID" />
          </label>
        )}

        {target === "department" && (
          <label className="field">Department ID
            <input type="number" min="1" required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} placeholder="Enter department ID" />
          </label>
        )}

        <label className="field">
          Permission
          <select value={permission} onChange={(e) => setPermission(e.target.value)}>
            <option value="read">Read only</option>
            <option value="edit">Can edit</option>
          </select>
        </label>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Sharing..." : "Share document"}</button>
        </div>
      </form>
    </div>
  );
}