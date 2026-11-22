import API_URL from "../api.js";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../components/BackButton";

const API = `${API_URL}/api`;
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, boxShadow: "0 3px 12px rgba(15,23,42,.04)" };
const muted = { color: "#64748b", fontSize: 13 };
const authHeaders = (json = false) => {
    const raw = localStorage.getItem("tutor") || localStorage.getItem("admin");
    let token = "";
    try { token = raw ? JSON.parse(raw).token || "" : ""; } catch { /* invalid local session */ }
    return { ...(json ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};
const pct = value => value === null || value === undefined ? "—" : `${value}%`;

export default function TutorSubmissions() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [visibilityBusy, setVisibilityBusy] = useState(false);
    const [notice, setNotice] = useState("");

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${API}/submissions/analytics/assignment/${id}`, { headers: authHeaders() });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not load assignment performance.");
            setAnalytics(data);
        } catch (err) {
            setError(err.message || "Could not load assignment performance.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

    const setAllResultsVisible = async (visible) => {
        const action = visible ? "release all marked results to learners" : "hide all released results from learners";
        if (!window.confirm(`Are you sure you want to ${action}?`)) return;
        setVisibilityBusy(true); setNotice("");
        try {
            const response = await fetch(`${API}/submissions/assignment/${id}/visibility`, {
                method: "PATCH", headers: authHeaders(true), body: JSON.stringify({ visible })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not update visibility");
            setNotice(data.message); await loadAnalytics();
        } catch (err) { setNotice(err.message); } finally { setVisibilityBusy(false); }
    };

    const setOneResultVisible = async (submissionId, visible) => {
        setVisibilityBusy(true); setNotice("");
        try {
            const response = await fetch(`${API}/submissions/${submissionId}/visibility`, {
                method: "PATCH", headers: authHeaders(true), body: JSON.stringify({ visible })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not update visibility");
            await loadAnalytics();
        } catch (err) { setNotice(err.message); } finally { setVisibilityBusy(false); }
    };

    if (loading) return <main style={{ padding: 24 }}><BackButton /><p>Loading assignment performance…</p></main>;
    if (error) return <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}><BackButton /><div role="alert" style={{ ...card, color: "#b91c1c" }}>{error}<button onClick={loadAnalytics} style={{ marginLeft: 12 }}>Retry</button></div></main>;
    if (!analytics) return null;

    const { assignment, summary, questionAnalysis, submissions, outstandingLearners = [] } = analytics;
    const stats = [
        ["Expected submissions", summary.learnerCount],
        ["Submitted", summary.submittedCount],
        ["Outstanding", summary.notSubmittedCount],
        ["Awaiting marking", summary.pendingMarkingCount],
        ["Average mark", summary.averageMark === null ? "Not marked yet" : `${summary.averageMark} / ${assignment.totalMarks}`],
        ["Class average", pct(summary.averagePercentage)],
        ["Highest mark", summary.highestMark === null ? "—" : `${summary.highestMark} / ${assignment.totalMarks}`],
        ["Lowest mark", summary.lowestMark === null ? "—" : `${summary.lowestMark} / ${assignment.totalMarks}`]
    ];

    return <main style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 48px" }}>
        <BackButton />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", margin: "16px 0 22px" }}>
            <div>
                <p style={{ ...muted, margin: 0 }}>{[assignment.className, assignment.subject, assignment.grade].filter(Boolean).join(" · ")}</p>
                <h1 style={{ margin: "6px 0" }}>Assignment performance</h1>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{assignment.title}</h2>
                <p style={muted}>Question-level results are calculated from marked submissions only.</p>
            </div>
            <button onClick={loadAnalytics} style={{ padding: "10px 14px", borderRadius: 9, border: "1px solid #cbd5e1", background: "white", cursor: "pointer" }}>Refresh results</button>
        </div>

        <section aria-label="Assignment summary" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12, marginBottom: 22 }}>
            {stats.map(([label, value]) => <div key={label} style={card}><div style={muted}>{label}</div><div style={{ fontSize: 23, fontWeight: 750, marginTop: 8, color: "#0f172a" }}>{value}</div></div>)}
        </section>

        <section style={{ ...card, marginBottom: 22 }}>
            <h2 style={{ margin: "0 0 5px", fontSize: 20 }}>Questions that need attention</h2>
            <p style={muted}>A question is flagged when its average score is below 60% of its available marks.</p>
            {questionAnalysis.length === 0 ? <p>No questions were found for this assignment.</p> : questionAnalysis.map(question => <article key={question.questionId} style={{ padding: "14px 0", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <strong>Question {question.questionNumber}</strong>
                    <span style={{ fontWeight: 700, color: question.attentionNeeded ? "#b45309" : "#047857", background: question.attentionNeeded ? "#fef3c7" : "#d1fae5", borderRadius: 20, padding: "5px 10px", fontSize: 12 }}>{question.attentionNeeded ? "Needs attention" : question.averagePercentage === null ? "Awaiting marks" : "On track"}</span>
                </div>
                <p style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>{question.questionText}</p>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", ...muted }}>
                    <span>Average: <b style={{ color: "#0f172a" }}>{question.averageMark === null ? "—" : `${question.averageMark} / ${question.maximumMarks}`}</b></span>
                    <span>Average performance: <b style={{ color: "#0f172a" }}>{pct(question.averagePercentage)}</b></span>
                    <span>Marked responses: <b style={{ color: "#0f172a" }}>{question.markedResponses}</b></span>
                    <span>Full marks: <b style={{ color: "#0f172a" }}>{question.fullCreditCount}</b></span>
                </div>
                {question.averagePercentage !== null && <div style={{ height: 8, borderRadius: 10, background: "#e2e8f0", marginTop: 10, overflow: "hidden" }}><div style={{ width: `${Math.max(0, Math.min(100, question.averagePercentage))}%`, height: "100%", background: question.attentionNeeded ? "#d97706" : "#059669" }} /></div>}
            </article>)}
            {questionAnalysis.some(q => q.attentionNeeded) && <div style={{ background: "#fffbeb", color: "#92400e", borderRadius: 10, padding: 12, marginTop: 12, fontSize: 14 }}>Use the flagged questions to plan revision or reteach the concepts learners found difficult.</div>}
        </section>

        <section style={{ ...card, marginBottom: 20, borderColor: "#bfdbfe" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div><h2 style={{ margin: "0 0 5px", fontSize: 20 }}>Results visibility</h2><p style={{ ...muted, margin: 0 }}>Marks flow into Results automatically after marking, but learners only see them when you release them.</p></div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button disabled={visibilityBusy || summary.markedCount === 0} onClick={() => setAllResultsVisible(true)} style={{ background: "#047857", color: "white", border: 0, borderRadius: 8, padding: "10px 13px", cursor: "pointer" }}>Release all marked results</button>
                    <button disabled={visibilityBusy || summary.markedCount === 0} onClick={() => setAllResultsVisible(false)} style={{ background: "#fff", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 13px", cursor: "pointer" }}>Hide all results</button>
                </div>
            </div>
            {notice && <p role="status" style={{ marginBottom: 0, color: "#1d4ed8" }}>{notice}</p>}
        </section>

        <section style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>Learner submissions</h2>
            {submissions.length === 0 ? <p style={muted}>No submission yet. Learners who have not submitted will appear as outstanding below.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
                <thead><tr style={{ textAlign: "left", color: "#64748b", fontSize: 12 }}><th style={{ padding: 10 }}>Learner</th><th style={{ padding: 10 }}>Status</th><th style={{ padding: 10 }}>Mark</th><th style={{ padding: 10 }}>Percentage</th><th style={{ padding: 10 }}>Visibility</th><th style={{ padding: 10 }}>Action</th></tr></thead>
                <tbody>{submissions.map(submission => <tr key={submission._id} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{[submission.learner?.name, submission.learner?.surname].filter(Boolean).join(" ") || "Learner"}</td>
                    <td style={{ padding: 10 }}>{submission.status}</td>
                    <td style={{ padding: 10 }}>{submission.mark === null || submission.mark === undefined ? "Not marked" : `${submission.mark} / ${assignment.totalMarks}`}</td>
                    <td style={{ padding: 10 }}>{pct(submission.percentage)}</td>
                    <td style={{ padding: 10 }}>{submission.status === "Marked" ? <button disabled={visibilityBusy} onClick={() => setOneResultVisible(submission._id, !submission.resultVisible)} style={{ border: "1px solid #cbd5e1", background: submission.resultVisible ? "#dcfce7" : "#f1f5f9", color: "#0f172a", padding: "7px 9px", borderRadius: 8, cursor: "pointer" }}>{submission.resultVisible ? "Visible · Hide" : "Hidden · Release"}</button> : <span style={muted}>After marking</span>}</td>
                    <td style={{ padding: 10 }}><button onClick={() => navigate(`/mark-submission/${submission._id}`)} style={{ border: 0, background: "#1d4ed8", color: "white", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>{submission.status === "Marked" ? "Review" : "Mark submission"}</button></td>
                </tr>)}</tbody>
            </table></div>}
            {outstandingLearners.length > 0 && <div style={{ marginTop: 22 }}>
                <h3 style={{ fontSize: 16 }}>Outstanding · {outstandingLearners.length}</h3>
                <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ textAlign: "left", color: "#64748b", fontSize: 12 }}><th style={{ padding: 10 }}>Learner</th><th style={{ padding: 10 }}>Status</th></tr></thead><tbody>{outstandingLearners.map(person => <tr key={person._id} style={{ borderTop: "1px solid #e2e8f0" }}><td style={{ padding: 10 }}>{[person.name, person.surname].filter(Boolean).join(" ") || "Learner"}</td><td style={{ padding: 10, color: "#b45309", fontWeight: 600 }}>Not submitted</td></tr>)}</tbody></table></div>
            </div>}
        </section>
    </main>;
}
