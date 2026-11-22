import API_URL from "../../api.js";
import { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";

const API = `${API_URL}/api`;
const learnerToken = learner => learner?.token ? { Authorization: `Bearer ${learner.token}` } : {};

export default function LearnerResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const saved = localStorage.getItem("learner");
        if (!saved) throw new Error("Please sign in as a learner to view your results.");
        const learner = JSON.parse(saved);
        const response = await fetch(`${API}/submissions/results/learner/${learner._id}`, { headers: learnerToken(learner) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load results.");
        if (active) setResults(Array.isArray(data) ? data : []);
      } catch (err) { if (active) setError(err.message); }
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, []);

  return <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 18px 48px" }}>
    <BackButton />
    <h1 style={{ color: "#0f172a", marginBottom: 6 }}>My Results</h1>
    <p style={{ color: "#64748b", marginTop: 0 }}>Your tutor's released marks and feedback appear here.</p>
    {loading ? <p>Loading your results…</p> : error ? <p role="alert" style={{ color: "#b91c1c" }}>{error}</p> : results.length === 0 ? <section style={{ padding: 24, border: "1px solid #e2e8f0", borderRadius: 14, background: "white" }}><h2 style={{ marginTop: 0 }}>No results released yet</h2><p style={{ color: "#64748b", marginBottom: 0 }}>Once your tutor marks your work and releases the results, they will appear here.</p></section> : results.map(item => {
      const assignment = item.assignmentId || {};
      const total = Number(assignment.totalMarks) || 0;
      const mark = Number(item.mark) || 0;
      const percentage = total > 0 ? Math.round(mark / total * 1000) / 10 : 0;
      return <article key={item._id} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><h2 style={{ margin: "0 0 6px" }}>{assignment.title || "Assignment"}</h2><span style={{ color: "#64748b", fontSize: 13 }}>Marked and released</span></div><div style={{ textAlign: "right" }}><strong style={{ fontSize: 24, color: "#047857" }}>{mark} / {total}</strong><div style={{ color: "#64748b", fontSize: 13 }}>{percentage}%</div></div></div>
        {item.feedback && <div style={{ marginTop: 16, padding: 14, background: "#f8fafc", borderRadius: 10 }}><strong>Tutor feedback</strong><p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{item.feedback}</p></div>}
        {Array.isArray(item.answers) && item.answers.length > 0 && <details style={{ marginTop: 14 }}><summary style={{ cursor: "pointer", fontWeight: 600 }}>View question marks</summary>{item.answers.map((answer, index) => <div key={`${answer.questionId}-${index}`} style={{ padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>Question {index + 1}: <strong>{answer.marks ?? "—"} marks</strong></div>)}</details>}
      </article>;
    })}
  </main>;
}
