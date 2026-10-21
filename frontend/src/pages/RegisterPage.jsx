import { useState } from "react";

export default function RegisterPage({ onRegister, onLogin, busy, error }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="auth-layout">
      <section className="auth-art">
        <div className="auth-brand"><span className="brand-icon">T</span> TrustVault</div>
        <div className="auth-art-content">
          <div className="security-art">◆</div>
          <h1>Secure sharing.<br />Clear accountability.</h1>
          <p>Create your workspace account to manage and share documents.</p>
        </div>
        <small className="auth-footer">TRUSTVAULT · SECURE DOCUMENT WORKSPACE</small>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); onRegister({ name, email, password }); }}>
          <span className="eyebrow">GET STARTED</span>
          <h2>Create your account</h2>
          <p className="muted">Set up your TrustVault access.</p>
          {error && <div className="alert-error">{error}</div>}
          <label className="field">Full name
            <input autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </label>
          <label className="field">Email address
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="field">Password
            <input type="password" autoComplete="new-password" minLength="8" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </label>
          <button className="btn btn-primary btn-full" disabled={busy}>{busy ? "Creating account..." : "Create account →"}</button>
          <p className="auth-switch">Already registered? <button type="button" onClick={onLogin}>Sign in</button></p>
        </form>
      </section>
    </main>
  );
}