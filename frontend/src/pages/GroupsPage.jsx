import { useState } from "react";

export default function GroupsPage({ groups, onCreate, onAddMember, busy }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="two-column">
      <section className="panel">
        <div className="panel-heading"><div><h2>Create a group</h2><p>Organize document access.</p></div></div>
        <form className="stack-form" onSubmit={(e) => { e.preventDefault(); onCreate({ name, description, department_id: departmentId ? Number(departmentId) : null }); }}>
          <label className="field">Group name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Project Team" /></label>
          <label className="field">Description<input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" /></label>
          <label className="field">Department ID (optional)<input type="number" min="1" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} placeholder="Department ID" /></label>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Creating..." : "Create group"}</button>
        </form>
        <div className="notice">Group creation requires the appropriate backend permissions.</div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>Add a member</h2><p>Add a registered user to a group.</p></div></div>
        <form className="stack-form" onSubmit={(e) => { e.preventDefault(); onAddMember(Number(selectedGroup), { email: email.trim() }); }}>
          <label className="field">Group<select required value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}><option value="">Choose group</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name} (ID: {g.id})</option>)}</select></label>
          <label className="field">Member email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" /></label>
          <button className="btn btn-primary" disabled={busy || !groups.length}>{busy ? "Adding..." : "Add member"}</button>
        </form>
      </section>

      <section className="panel span-two">
        <div className="panel-heading"><div><h2>Your groups</h2><p>{groups.length} groups returned by the server</p></div></div>
        {groups.length ? <div className="simple-list">{groups.map((g) => <div className="simple-list-item" key={g.id}><div className="list-avatar">♧</div><div className="list-main"><strong>{g.name}</strong><small>{g.description || "No description"}</small></div><span className="category-tag">ID: {g.id}</span></div>)}</div> : <div className="empty-state"><h3>No groups available</h3><p>Groups may require admin or owner access.</p></div>}
      </section>
    </div>
  );
}