
import { useState } from "react";

export default function RegisterPage({
  onRegister,
  onLogin,
  busy,
  error,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    onRegister({
      name: name.trim(),
      email: email.trim(),
      password,
    });
  }

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
              <span className="emblem-orbit" />
            </div>
          </div>

          <div className="trustvault-wordmark">
            <span>TRUST</span>
            <span>VAULT</span>
          </div>

          <p className="trustvault-caption">A SECURE WORKSPACE</p>

          <div className="trustvault-divider">
            <span />
            <span className="divider-diamond">◆</span>
            <span />
          </div>

          <h1>
            Secure sharing.
            <br />
            <span>Clear accountability.</span>
          </h1>

          <p>
            Create your workspace account to manage and share
            documents securely.
          </p>

          <div className="trust-points">
            <span>✓ Controlled access</span>
            <span>✓ Auditable activity</span>
          </div>
        </div>

        <small className="auth-footer">
          TRUSTVAULT · SECURE DOCUMENT WORKSPACE
        </small>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <span className="eyebrow">GET STARTED</span>

          <h2>Create your account</h2>
          <p className="muted">
            Set up your TrustVault access.
          </p>

          {error && (
            <div className="alert-error" role="alert">
              {error}
            </div>
          )}

          <label className="field">
            Full name
            <input
              type="text"
              name="name"
              autoComplete="name"
              maxLength={100}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
            />
          </label>

          <label className="field">
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              maxLength={255}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="field">
            Password
            <div className="password-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 12 characters"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={busy}
          >
            {busy ? "Creating account..." : "Create account →"}
          </button>

          <p className="auth-switch">
            Already registered?
            <button type="button" onClick={onLogin} disabled={busy}>
              Sign in
            </button>
          </p>

          <p className="register-note">
            New accounts require administrator approval before sign-in.
          </p>
        </form>
      </section>
    </main>
  );
}
