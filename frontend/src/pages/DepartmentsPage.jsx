import { useState } from "react";

export default function DepartmentsPage({ departments, onCreate, onAddMember, busy }) {
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="two-column">
      <section className="panel">
        <div className="panel-heading"><div><h2>Create department</h2><p>Set up a workspace department.</p></div></div>
        <form className="stack-form" onSubmit={(e) => { e.preventDefault(); onCreate({ name: name.trim() }); }}>
          <label className="field">Department name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering" /></label>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Creating..." : "Create department"}</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>Assign a member</h2><p>Assign a registered user to a department.</p></div></div>
        <form className="stack-form" onSubmit={(e) => { e.preventDefault(); onAddMember({ email: email.trim(), department_id: Number(departmentId) }); }}>
          <label className="field">Department<select required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}><option value="">Choose department</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name} (ID: {d.id})</option>)}</select></label>
          <label className="field">Member email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" /></label>
          <button className="btn btn-primary" disabled={busy || !departments.length}>{busy ? "Assigning..." : "Assign member"}</button>
        </form>
      </section>

      <section className="panel span-two">
        <div className="panel-heading"><div><h2>Departments</h2><p>{departments.length} departments returned by the server</p></div></div>
        {departments.length ? <div className="simple-list">{departments.map((d) => <div className="simple-list-item" key={d.id}><div className="list-avatar">▦</div><div className="list-main"><strong>{d.name}</strong><small>{d.created_at ? new Date(d.created_at).toLocaleDateString() : "Department"}</small></div><span className="category-tag">ID: {d.id}</span></div>)}</div> : <div className="empty-state"><h3>No departments available</h3><p>Department management may require administrator access.</p></div>}
      </section>
    </div>
  );
}