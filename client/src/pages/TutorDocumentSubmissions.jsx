import API_URL from "../api.js";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton";

const box = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, boxShadow: "0 3px 12px rgba(15,23,42,.04)" };
const muted = { color: "#64748b", fontSize: 13 };
export default function TutorDocumentSubmissions() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [learners, setLearners] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const headers = () => {
    let token = "";
    try { token = JSON.parse(localStorage.getItem("tutor") || "null")?.token || ""; } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const opts = { headers: headers() };
      const aRes = await fetch(`${API_URL}/api/document-assignments/${id}`, opts);
      const a = await aRes.json();
      if (!aRes.ok) throw new Error(a.message || "Could not find this document assignment.");
      const [cRes, sRes] = await Promise.all([
        fetch(`${API_URL}/api/classes/${a.classId}`, opts),
        fetch(`${API_URL}/api/document-submissions/assignment/${id}`, opts)
      ]);
      const [c, s] = await Promise.all([cRes.json(), sRes.json()]);
      if (!cRes.ok) throw new Error(c.message || "Could not load the classroom learner list.");
      if (!sRes.ok) throw new Error(s.message || "Could not load learner submissions.");
      setAssignment(a); setLearners(Array.isArray(c.learners) ? c.learners : []); setSubmissions(Array.isArray(s) ? s : []);
    } catch (e) { setError(e.message || "Could not load submissions."); }
    finally { setBusy(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  const updateVisibility = async (submissionId, visible) => {
    setNotice("");
    try {
      const res = await fetch(`${API_URL}/api/document-submissions/${submissionId}/visibility`, { method: "PATCH", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ visible }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || "Could not update result visibility.");
      setNotice(data.message); await load();
    } catch (e) { setNotice(e.message); }
  };
  const mark = async (submission) => {
    const raw = window.prompt(`Enter mark out of ${assignment.totalMarks}:`, submission.mark ?? "");
    if (raw === null) return;
    const markValue = Number(raw);
    if (!Number.isFinite(markValue) || markValue < 0 || markValue > Number(assignment.totalMarks)) { setNotice(`Enter a mark between 0 and ${assignment.totalMarks}.`); return; }
    const feedback = window.prompt("Feedback for the learner (optional):", submission.feedback || "");
    if (feedback === null) return;
    try {
      const res = await fetch(`${API_URL}/api/document-submissions/${submission._id}/mark`, { method: "PUT", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ mark: markValue, feedback }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || "Could not save the mark.");
      setNotice("Submission marked. The result is hidden until you release it."); await load();
    } catch (e) { setNotice(e.message); }
  };
  const releaseAll = async (visible) => {
    try {
      const res = await fetch(`${API_URL}/api/document-submissions/assignment/${id}/visibility`, { method: "PATCH", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ visible }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || "Could not update results.");
      setNotice(data.message); await load();
    } catch (e) { setNotice(e.message); }
  };
  const submittedIds = new Set(submissions.map(s => String(s.learnerId?._id || s.learnerId)));
  const outstanding = learners.filter(l => !submittedIds.has(String(l._id)));
  const marked = submissions.filter(s => s.status === "Marked" && s.mark !== null && s.mark !== undefined);
  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 18px 48px" }}>
    <BackButton />
    {busy && !assignment ? <p>Loading submissions…</p> : error ? <div role="alert" style={{ ...box, color: "#b91c1c" }}>{error} <button onClick={load}>Retry</button></div> : assignment && <>
      <div style={{ margin: "18px 0 22px" }}><p style={muted}>Document assignment · {new Date(assignment.dueDate).toLocaleDateString()}</p><h1 style={{ margin: "5px 0" }}>Submissions</h1><h2 style={{ fontSize: 19, margin: 0 }}>{assignment.title}</h2><p style={muted}>Review submitted files, mark learners and release results when ready.</p></div>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
        {[["Expected submissions", learners.length],["Submitted", submissions.length],["Outstanding", outstanding.length],["Marked", marked.length]].map(([label,value]) => <div key={label} style={box}><div style={muted}>{label}</div><div style={{ fontSize: 27, fontWeight: 750, marginTop: 8 }}>{value}</div></div>)}
      </section>
      <section style={{ ...box, marginBottom: 18 }}><div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}><div><strong>Results visibility</strong><p style={muted}>Marks remain hidden until released.</p></div><div style={{ display: "flex", gap: 8 }}><button disabled={!marked.length} onClick={() => releaseAll(true)}>Release all marked</button><button disabled={!marked.length} onClick={() => releaseAll(false)}>Hide all results</button></div></div>{notice && <p role="status">{notice}</p>}</section>
      <section style={box}><h3>Learner submissions</h3>{submissions.length === 0 ? <p style={muted}>No submission yet. Learners who have not submitted are listed as outstanding below.</p> : submissions.map(s => <article key={s._id} style={{ borderTop: "1px solid #e2e8f0", padding: "14px 0", display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}><div><strong>{[s.learnerId?.name,s.learnerId?.surname].filter(Boolean).join(" ") || "Learner"}</strong><p style={muted}>{s.status} · {s.mark == null ? "Not marked" : `${s.mark}/${assignment.totalMarks}`} · {s.files?.length || 0} file(s)</p>{(s.files || []).map((f,i) => <p key={i}><a href={f.url} target="_blank" rel="noreferrer">{f.name || `Submitted file ${i+1}`}</a></p>)}</div><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><button onClick={() => mark(s)}>{s.status === "Marked" ? "Update mark" : "Mark submission"}</button>{s.status === "Marked" && <button onClick={() => updateVisibility(s._id,!s.resultVisible)}>{s.resultVisible ? "Hide result" : "Release result"}</button>}</div></article>)}
        {outstanding.length > 0 && <div style={{ marginTop: 20 }}><h3>Outstanding · {outstanding.length}</h3>{outstanding.map(l => <div key={l._id} style={{ borderTop: "1px solid #e2e8f0", padding: "10px 0", display: "flex", justifyContent: "space-between" }}><span>{[l.name,l.surname].filter(Boolean).join(" ") || "Learner"}</span><strong style={{ color: "#b45309" }}>Not submitted</strong></div>)}</div>}
      </section>
    </>}
  </main>;
}
