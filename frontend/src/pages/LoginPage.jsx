import { useState } from "react";

export default function LoginPage({ onLogin, onRegister, busy, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  return (
    <main className="auth-layout">
      <section className="auth-art">
        <div className="auth-art-content">
          <div className="trustvault-emblem">
            <div className="trustvault-emblem-ring">
              <svg
                viewBox="0 0 100 100"
                role="img"
                aria-label="TrustVault shield logo"
                className="trustvault-shield"
              >
                <path
                  d="M50 8 L83 21 V46 C83 66 69 82 50 92 C31 82 17 66 17 46 V21 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <path
                  d="M35 49 L45 59 L66 37"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M50 22 L70 29 V46 C70 59 62 70 50 77"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity=".4"
                />
              </svg>
              <span className="emblem-orbit"></span>
            </div>
          </div>

          <div className="trustvault-wordmark">
            <span>TRUST</span><span>VAULT</span>
          </div>
          <p className="trustvault-caption">A SECURE WORKSPACE</p>

          <div className="trustvault-divider">
            <span></span><span className="divider-diamond">◆</span><span></span>
          </div>

          <h1>
            Your documents.
            <br />
            <span>Your control.</span>
          </h1>

          <p>
            A secure workspace for document sharing, permissions,
            and verifiable audit trails.
          </p>

          <div className="trust-points">
            <span>✓ Controlled access</span>
            <span>✓ Auditable activity</span>
          </div>
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
          <label className="field">
            Password
            <div className="password-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </label>
          <button className="btn btn-primary btn-full" disabled={busy}>{busy ? "Signing in..." : "Sign in →"}</button>
          <p className="auth-switch">New to TrustVault? <button type="button" onClick={onRegister}>Create an account</button></p>
        </form>
      </section>
    </main>
  );
}