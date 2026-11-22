import API_URL from "../../api.js";
import { useCallback, useEffect, useState } from "react";
import BackButton from "../../components/BackButton";

const card = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 5px 18px rgba(15, 35, 65, .045)"
};
const muted = { color: "#64748b", fontSize: 13 };
const percent = value => value === null || value === undefined ? "Not marked" : `${Number(value).toFixed(1)}%`;

function Reports() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchReports = useCallback(async () => {
        let owner;
        try { owner = JSON.parse(localStorage.getItem("tutor") || "null"); } catch { owner = null; }
        if (!owner?.id || !owner?.token || owner.role !== "owner") {
            setError("Please sign in with your tuition centre owner account to view reports.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_URL}/api/reports/owner/${owner.id}`, {
                headers: { Authorization: `Bearer ${owner.token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not load reports.");
            setReport(data);
        } catch (err) {
            setError(err.message || "Could not load reports.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    if (loading) return <main style={{ maxWidth: 1150, margin: "0 auto", padding: 24 }}><BackButton /><p>Loading centre reports…</p></main>;
    if (error) return <main style={{ maxWidth: 1150, margin: "0 auto", padding: 24 }}><BackButton /><section role="alert" style={{ ...card, color: "#991b1b", background: "#fff7f7" }}><h2>Reports could not load</h2><p>{error}</p><button onClick={fetchReports} style={buttonStyle}>Try again</button></section></main>;
    if (!report) return null;

    const assignmentReports = report.assignmentReports || [];
    const metricCards = [
        ["Total learners", report.totalLearners ?? 0],
        ["Total tutors", report.totalTeachers ?? 0],
        ["Paid payments", report.paidPayments ?? 0],
        ["Pending payments", report.pendingPayments ?? 0],
        ["Revenue collected", `R${Number(report.revenue || 0).toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`],
        ["Centre assignment average", percent(report.centreAveragePercentage)]
    ];

    return <main style={{ maxWidth: 1180, margin: "0 auto", padding: "26px 22px 50px", width: "100%", boxSizing: "border-box" }}>
        <BackButton />
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", margin: "18px 0 22px" }}>
            <div>
                <p style={{ ...muted, letterSpacing: 1, fontWeight: 800, margin: "0 0 6px" }}>CENTRE PERFORMANCE</p>
                <h1 style={{ color: "#142746", margin: 0 }}>Reports & Analytics</h1>
                <p style={{ color: "#64748b", margin: "8px 0 0" }}>{report.program?.name || "Tuition centre"} · Learner, payment and assignment performance.</p>
            </div>
            <button onClick={fetchReports} style={buttonStyle}>↻ Refresh reports</button>
        </header>

        <section aria-label="Centre overview" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: 13, marginBottom: 22 }}>
            {metricCards.map(([label, value]) => <article key={label} style={card}><p style={{ ...muted, margin: 0 }}>{label}</p><strong style={{ display: "block", fontSize: 27, color: "#142746", marginTop: 9 }}>{value}</strong></article>)}
        </section>

        <section style={{ ...card, marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div><h2 style={{ margin: "0 0 5px", color: "#142746" }}>Average per assignment</h2><p style={{ ...muted, margin: 0 }}>Average percentage is calculated from marked learner submissions only. Unmarked work is not counted.</p></div>
                <div style={{ background: "#eff6ff", color: "#1d4ed8", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>{report.markedAssignmentCount || 0} of {report.assignmentCount || 0} assignments marked</div>
            </div>

            {assignmentReports.length === 0 ? <div style={{ padding: "34px 12px", textAlign: "center", color: "#64748b" }}><h3 style={{ color: "#334155" }}>No assignments yet</h3><p>Assignment averages will appear here after tutors create assignments and mark learner submissions.</p></div> : <div style={{ marginTop: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", ...muted, margin: "0 0 9px 0" }}><span>Assignment</span><span>Average performance</span></div>
                {assignmentReports.map(item => {
                    const value = item.averagePercentage;
                    const width = value === null ? 0 : Math.max(0, Math.min(100, value));
                    return <article key={`${item.kind}-${item.id}`} style={{ padding: "15px 0", borderTop: "1px solid #edf2f7" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 9 }}>
                            <div style={{ minWidth: 220, flex: 1 }}>
                                <strong style={{ color: "#172b4d" }}>{item.title}</strong>
                                <p style={{ ...muted, margin: "4px 0 0" }}>{[item.className, item.subject, item.grade, item.kind].filter(Boolean).join(" · ")}</p>
                            </div>
                            <div style={{ textAlign: "right", minWidth: 130 }}>
                                <strong style={{ fontSize: 19, color: value === null ? "#94a3b8" : value < 50 ? "#b45309" : "#047857" }}>{percent(value)}</strong>
                                <p style={{ ...muted, margin: "3px 0 0" }}>{item.averageMark === null ? "No marked submissions" : `Average mark: ${item.averageMark} / ${item.totalMarks}`}</p>
                            </div>
                        </div>
                        <div role="img" aria-label={`${item.title}: ${percent(value)} average`} style={{ height: 13, background: "#e8eef5", borderRadius: 20, overflow: "hidden" }}>
                            <div style={{ width: `${width}%`, height: "100%", borderRadius: 20, background: value === null ? "#cbd5e1" : value < 50 ? "#d97706" : value < 60 ? "#ca8a04" : "#0f9f78", transition: "width .25s ease" }} />
                        </div>
                        <p style={{ ...muted, margin: "6px 0 0" }}>{item.markedCount} marked · {item.submittedCount} submitted · {item.learnerCount} learners in class</p>
                    </article>;
                })}
                <div style={{ display: "flex", justifyContent: "space-between", ...muted, marginTop: 14 }}><span>0%</span><span>50%</span><span>100%</span></div>
            </div>}
        </section>

        <section style={{ ...card, marginBottom: 22 }}>
            <h2 style={{ margin: "0 0 6px", color: "#142746" }}>Attendance reports</h2>
            <p style={{ ...muted, margin: "0 0 14px" }}>Attendance for classes you personally teach. Tutors can send their own class reports to you through Inbox.</p>
            {(report.attendanceReports || []).length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}><thead><tr style={{ textAlign: "left", color: "#64748b", fontSize: 12 }}><th style={thStyle}>Learner</th><th style={thStyle}>Lessons recorded</th><th style={thStyle}>Attended</th><th style={thStyle}>Attendance</th><th style={thStyle}>Minutes attended</th></tr></thead><tbody>{report.attendanceReports.map(row => <tr key={row.learnerId}><td style={tdStyle}><strong>{row.learnerName}</strong></td><td style={tdStyle}>{row.lessonsHeld}</td><td style={tdStyle}>{row.attended}</td><td style={tdStyle}><strong>{row.attendancePercentage}%</strong></td><td style={tdStyle}>{row.totalMinutes}</td></tr>)}</tbody></table><button style={{ ...buttonStyle, marginTop: 12 }} onClick={() => { const rows = [["Learner","Lessons recorded","Attended","Attendance %","Minutes attended"], ...(report.attendanceReports || []).map(r => [r.learnerName,r.lessonsHeld,r.attended,r.attendancePercentage,r.totalMinutes])]; const csv = rows.map(row => row.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(",")).join("\n"); const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); const a=document.createElement("a");a.href=url;a.download="tutorhub-attendance-report.csv";a.click();URL.revokeObjectURL(url); }}>Export attendance CSV</button></div> : <p style={{ color: "#64748b" }}>No completed attendance sessions have been recorded yet.</p>}
        </section>

        <section style={card}>
            <h2 style={{ margin: "0 0 6px", color: "#142746" }}>Assignment performance details</h2>
            <p style={{ ...muted, margin: "0 0 14px" }}>Includes online and document-based assignments across classes in this centre.</p>
            {assignmentReports.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
                <thead><tr style={{ textAlign: "left", color: "#64748b", fontSize: 12 }}><th style={thStyle}>Assignment</th><th style={thStyle}>Class</th><th style={thStyle}>Marked</th><th style={thStyle}>Submitted</th><th style={thStyle}>Average mark</th><th style={thStyle}>Average %</th></tr></thead>
                <tbody>{assignmentReports.map(item => <tr key={`row-${item.kind}-${item.id}`}><td style={tdStyle}><strong>{item.title}</strong><div style={muted}>{item.kind}</div></td><td style={tdStyle}>{item.className}</td><td style={tdStyle}>{item.markedCount}</td><td style={tdStyle}>{item.submittedCount}</td><td style={tdStyle}>{item.averageMark === null ? "—" : `${item.averageMark} / ${item.totalMarks}`}</td><td style={tdStyle}><strong>{percent(item.averagePercentage)}</strong></td></tr>)}</tbody>
            </table></div> : <p style={{ color: "#64748b" }}>There are no assignment records to display yet.</p>}
        </section>
    </main>;
}

const buttonStyle = { border: 0, borderRadius: 9, background: "#12396b", color: "white", padding: "11px 16px", fontWeight: 700, cursor: "pointer" };
const thStyle = { padding: "12px 10px", borderBottom: "1px solid #e2e8f0" };
const tdStyle = { padding: "13px 10px", borderBottom: "1px solid #edf2f7", color: "#334155", fontSize: 14, verticalAlign: "top" };

export default Reports;
