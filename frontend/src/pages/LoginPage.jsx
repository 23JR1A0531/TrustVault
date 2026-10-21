import { useState } from "react";

export default function LoginPage({ onLogin, onRegister, busy, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="auth-layout">
      <section className="auth-art">
        <div className="auth-brand"><span className="brand-icon">T</span> TrustVault</div>
        <div className="auth-art-content">
          <div className="security-art">◆</div>
          <h1>Your documents.<br />Your control.</h1>
          <p>A secure workspace for document sharing, permissions, and verifiable audit trails.</p>
          <div className="trust-points"><span>✓ Controlled access</span><span>✓ Auditable activity</span></div>
        </div>
        <small className="auth-footer">TRUSTVAULT · SECURE DOCUMENT WORKSPACE</small>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); onLogin({ email, password }); }}>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to TrustVault</h2>
          <p className="muted">Enter your credentials to access your workspace.</p>
          {error && <div className="alert-error">{error}</div>}
          <label className="field">Email address
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="field">Password
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
          </label>
          <button className="btn btn-primary btn-full" disabled={busy}>{busy ? "Signing in..." : "Sign in →"}</button>
          <p className="auth-switch">New to TrustVault? <button type="button" onClick={onRegister}>Create an account</button></p>
        </form>
      </section>
    </main>
  );
}