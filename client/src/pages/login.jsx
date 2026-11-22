import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/learners/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("learner", JSON.stringify({ ...data.learner, token: data.token }));
      navigate("/learner-dashboard");
    } catch (err) { setError(err.message || "Could not connect to TutorHub"); }
    finally { setLoading(false); }
  };

  return <main className="th-register-page"><section className="th-register-shell">
    <header className="th-register-header"><div className="th-register-logo">T</div><div><span>TutorHub</span><small>Learner sign in</small></div></header>
    <p className="th-register-eyebrow">WELCOME BACK</p><h1>Sign in to TutorHub</h1><p className="th-register-muted">Use the email address connected to your learner account.</p>
    <form className="th-register-form" onSubmit={handleSubmit}>
      <label>Email address<input required type="text" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><small className="th-register-muted">Existing accounts can continue using their previous username.</small>
      <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/></label>
      <button className="th-register-primary" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      {error && <div className="th-register-message" role="alert">{error}</div>}
    </form>
  </section></main>;
}
