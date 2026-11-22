import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";

export default function TutorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/tutors/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed. Check your email and password.");
      localStorage.removeItem("learner");
      localStorage.setItem("tutor", JSON.stringify({ ...data.tutor, token: data.token }));
      navigate(data.tutor.role === "owner" ? "/owner-dashboard" : "/tutor-dashboard");
    } catch (err) {
      setError(err.message || "Could not connect to TutorHub. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="th-register-page">
      <section className="th-register-shell">
        <header className="th-register-header">
          <div className="th-register-logo">T</div>
          <div><span>TutorHub</span><small>Tutor & tuition centre sign in</small></div>
        </header>
        <p className="th-register-eyebrow">WELCOME BACK</p>
        <h1>Sign in to your workspace</h1>
        <p className="th-register-muted">Manage your classrooms, learners, assignments and lessons from one place.</p>
        <form className="th-register-form" onSubmit={handleLogin}>
          <label>Email address<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" /></label>
          <button className="th-register-primary" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
          {error && <div className="th-register-message" role="alert">{error}</div>}
        </form>
        <p className="th-register-muted th-tutor-login-footnote">Are you a learner? <a href="/login">Sign in here</a>.</p>
      </section>
    </main>
  );
}
