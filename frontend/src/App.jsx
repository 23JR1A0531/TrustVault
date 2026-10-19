
import { useState } from "react";
import { loginUser, registerUser, getCurrentUser } from "./api";
import "./App.css";

const INITIAL_FORM = {
  name: "",
  email: "john123@gmail.com",
  password: "",
};

function App() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(INITIAL_FORM);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "register") {
        await registerUser(form);
        setSuccess("Account created! Please sign in.");
        setMode("login");
        setForm({ ...INITIAL_FORM, email: form.email });
      } else {
        const result = await loginUser(form);
        const current = await getCurrentUser(result.access_token);

        setUser(current.user);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setUser(null);
    setForm(INITIAL_FORM);
    setError("");
    setSuccess("");
    setMode("login");
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setForm({ ...INITIAL_FORM });
  }

  if (user) {
    return (
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-icon">T</span>
            TrustVault
          </div>

          <div className="side-label">WORKSPACE</div>
          <div className="nav-item active">▦ <span>Overview</span></div>
          <div className="nav-item">▤ <span>My Documents</span></div>
          <div className="nav-item">♧ <span>Shared with me</span></div>
          <div className="nav-item">◷ <span>Activity logs</span></div>

          <div className="sidebar-bottom">
            <div className="security-card">
              <span className="security-icon">✦</span>
              <strong>Your files, protected.</strong>
              <p>Access is verified by the server.</p>
            </div>

            <div className="profile">
              <div className="avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <strong>{user.name}</strong>
                <span>{user.role}</span>
              </div>
              <button
                className="logout-button"
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
              >
                ↗
              </button>
            </div>
          </div>
        </aside>

        <main className="dashboard">
          <header className="topbar">
            <div className="breadcrumb">
              Workspace <span>/</span> Overview
            </div>
            <div className="secure-status">
              <span /> Secure session
            </div>
          </header>

          <section className="welcome">
            <div>
              <p className="eyebrow">YOUR PRIVATE WORKSPACE</p>
              <h1>Good to see you, {user.name.split(" ")[0]}.</h1>
              <p className="subtitle">
                Your documents and access, all in one place.
              </p>
            </div>
            <div className="welcome-mark">T<span>V</span></div>
          </section>

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-icon blue">▤</div>
              <p>My documents</p>
              <h2>—</h2>
              <span>Document API not connected yet</span>
            </article>

            <article className="stat-card">
              <div className="stat-icon violet">♧</div>
              <p>Shared with me</p>
              <h2>—</h2>
              <span>Access-based document view</span>
            </article>

            <article className="stat-card">
              <div className="stat-icon green">✓</div>
              <p>Account status</p>
              <h2 className="status-value">Active</h2>
              <span>Authenticated by the server</span>
            </article>
          </section>

          <section className="content-card">
            <div className="section-heading">
              <div>
                <h2>Workspace overview</h2>
                <p>Your secure document workspace is ready.</p>
              </div>
              <span className="role-chip">{user.role}</span>
            </div>

            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <h3>Your workspace starts here</h3>
              <p>
                Document upload and permission management are the next
                features to connect.
              </p>
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>
              TrustVault <span className="footer-dot">•</span> Secure Document Sharing
            </span>
            <span>Signed in as {user.email}</span>
          </footer>
        </main>
      </div>
    );
  }

  return (
    <main className="auth-layout">
      <section className="auth-visual">
        <div className="visual-brand">
          <span className="brand-icon">T</span>
          TrustVault
        </div>

        <div className="visual-content">
          <div className="visual-badge"><span /> PRIVATE BY DESIGN</div>
          <h1>Your documents.<br />Your <span>control.</span></h1>
          <p>
            A secure workspace to organize documents, manage access,
            and keep every important action accountable.
          </p>

          <div className="visual-features">
            <div>
              <span className="feature-check">✓</span>
              <span>
                <strong>Controlled access</strong>
                <small>Permissions checked on every request</small>
              </span>
            </div>
            <div>
              <span className="feature-check">✓</span>
              <span>
                <strong>Private by default</strong>
                <small>Your files aren't public links</small>
              </span>
            </div>
            <div>
              <span className="feature-check">✓</span>
              <span>
                <strong>Accountable activity</strong>
                <small>Built for traceable document actions</small>
              </span>
            </div>
          </div>
        </div>

        <div className="visual-footer">
          TRUST IS BUILT INTO EVERY REQUEST <span>© 2026</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="mobile-brand">
          <span className="brand-icon">T</span>
          TrustVault
        </div>

        <div className="auth-form-wrap">
          <div className="form-heading">
            <p className="eyebrow">
              {mode === "login" ? "WELCOME BACK" : "GET STARTED"}
            </p>
            <h2>
              {mode === "login"
                ? "Sign in to your vault"
                : "Create your account"}
            </h2>
            <p>
              {mode === "login"
                ? "Enter your details to access your workspace."
                : "Set up your secure document workspace."}
            </p>
          </div>

          <div className="mode-switch">
            <button
              type="button"
              className={mode === "login" ? "selected" : ""}
              onClick={() => changeMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "register" ? "selected" : ""}
              onClick={() => changeMode("register")}
            >
              Create account
            </button>
          </div>

          {error && (
            <div className="message error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="message success-message" role="status">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <label>
                Full name
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Your full name"
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={255}
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                placeholder={
                  mode === "login" ? "Enter your password" : "At least 12 characters"
                }
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "register" ? 12 : undefined}
                maxLength={128}
                required
              />
            </label>

            <button className="submit-button" type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in securely"
                  : "Create account"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="form-security">
            <span>▣</span>
            Your account is protected by server-side authentication.
          </div>
        </div>

        <div className="auth-bottom">
          TrustVault <span>·</span> Secure document sharing
        </div>
      </section>
    </main>
  );
}

export default App;
