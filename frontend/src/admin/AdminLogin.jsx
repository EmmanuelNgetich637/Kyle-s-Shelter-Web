import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { hasAdminToken, loginAdmin } from "../services/adminApi";
import "./admin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (hasAdminToken()) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginAdmin(email, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <Link to="/" className="admin-back-link">
          <ArrowLeft size={17} />
          Back to website
        </Link>

        <div className="admin-brand-mark">
          <LockKeyhole size={25} />
        </div>

        <p className="admin-eyebrow">SHELTER SALES PLATFORM</p>
        <h1>Welcome back.</h1>
        <p className="admin-login-subtitle">
          Sign in to manage customer enquiries and shelter sales.
        </p>

        {error && (
          <div className="admin-alert" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label htmlFor="admin-email">Email address</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="admin-password">Password</label>
          <div className="admin-password-wrap">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="admin-password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button className="admin-primary-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to dashboard"}
          </button>
        </form>

        <p className="admin-login-footer">
          Administrator access only. If you don't have an account, contact
          the system administrator.
        </p>
      </div>
    </main>
  );
}
