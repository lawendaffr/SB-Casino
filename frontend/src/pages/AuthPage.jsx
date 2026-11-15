import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";
import { useApp } from "../AppContext.jsx";

export default function AuthPage() {
  const navigate = useNavigate();
  const { refreshUser, setIsAuthenticated } = useApp();
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");

  async function submitLogin(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("Logging in...");
    try {
      const tokens = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") })
      }, false);
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
      setIsAuthenticated(true);
      await refreshUser();
      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = form.get("username");
    setBusy(true);
    setMessage("Creating account...");
    try {
      const result = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email: form.get("email"), password: form.get("password") })
      }, false);
      setLoginUsername(username);
      setMode("login");
      setMessage(`Account created! Welcome, ${result.username}. You can now log in.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setMessage("");
  }

  return <main className="page-main auth-page">
    <header className="page-heading"><p className="page-eyebrow">ACCOUNT</p><h1>Account</h1></header>
    <section className="panel auth-card">
      <div className="auth-tabs">
        <button type="button" aria-pressed={mode === "login"} onClick={() => switchMode("login")}>Login</button>
        <button type="button" aria-pressed={mode === "register"} onClick={() => switchMode("register")}>Register</button>
      </div>
      {mode === "login" ? <form onSubmit={submitLogin}>
        <h2>Login</h2>
        <label htmlFor="login-username">Username</label>
        <input id="login-username" name="username" autoComplete="username" value={loginUsername} onChange={(event) => setLoginUsername(event.target.value)} required />
        <label htmlFor="login-password">Password</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required />
        <button type="submit" disabled={busy}>Login</button>
      </form> : <form onSubmit={submitRegister}>
        <h2>Register</h2>
        <label htmlFor="register-username">Username</label>
        <input id="register-username" name="username" autoComplete="username" required />
        <label htmlFor="register-email">Email</label>
        <input id="register-email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="register-password">Password</label>
        <input id="register-password" name="password" type="password" autoComplete="new-password" required />
        <button type="submit" disabled={busy}>Create Account</button>
      </form>}
      <p id="auth-message" role="status">{message}</p>
    </section>
  </main>;
}
