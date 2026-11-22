import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../api.js";

const quickLinks = [
  { title: "Create Class", detail: "Set up a new classroom", icon: "+", path: "/create-class" },
  { title: "My Classes", detail: "Open and manage your classrooms", icon: "▦", path: "/owner-my-classes" },
  { title: "Teachers", detail: "Manage your teaching team", icon: "♙", path: "/owner-teachers" },
  { title: "Learners", detail: "View your registered learners", icon: "♧", path: "/owner-learners" },
  { title: "Payments", detail: "Manage learner payments", icon: "R", path: "/owner-payments" },
  { title: "Reports", detail: "Review centre activity", icon: "▤", path: "/owner-reports" },
  { title: "Inbox", detail: "Messages and attachments", icon: "✉", path: "/inbox" },
  { title: "Settings", detail: "Manage your centre details", icon: "⚙", path: "/owner-settings" },
];

export default function OwnerHome() {
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("tutor") || "null"); } catch { saved = null; }
    if (!saved || saved.role !== "owner") {
      navigate("/tutor-login", { replace: true });
      return;
    }
    setOwner(saved);
    const headers = { Authorization: `Bearer ${saved.token || ""}` };
    Promise.all([
      fetch(`${API_URL}/api/provider-workspace/dashboard`, { headers }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.message || "Could not load your centre dashboard."); return d; }),
      fetch(`${API_URL}/api/tutors/centre-applications`, { headers }).then(async (r) => r.ok ? r.json() : []),
    ]).then(([workspace, tutorApps]) => {
      setDashboard(workspace);
      setApplications(Array.isArray(tutorApps) ? tutorApps.filter((a) => a.status === "Pending") : []);
    }).catch((e) => setError(e.message || "Could not load your dashboard.")).finally(() => setLoading(false));
  }, [navigate]);

  const stats = useMemo(() => ({
    classes: dashboard?.classes?.length ?? dashboard?.classCount ?? 0,
    teachers: dashboard?.tutors?.length ?? dashboard?.teacherCount ?? 0,
    learners: dashboard?.learners?.length ?? dashboard?.learnerCount ?? 0,
  }), [dashboard]);

  const reviewApplication = async (id, action) => {
    if (!owner?.token || busyId) return;
    setBusyId(id);
    try {
      const response = await fetch(`${API_URL}/api/tutors/centre-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${owner.token}` },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not update this application.");
      setApplications((items) => items.filter((item) => item._id !== id));
    } catch (e) { setError(e.message); }
    finally { setBusyId(""); }
  };

  return <main className="th-owner-home">
    <header className="th-owner-welcome">
      <div><span className="th-owner-eyebrow">CENTRE WORKSPACE</span><h1>Good day{owner?.name ? `, ${owner.name}` : ""}.</h1><p>Here’s what’s happening in your tuition centre.</p></div>
      <button onClick={() => navigate("/create-class")}>+ Create Class</button>
    </header>
    {error && <div className="th-owner-error" role="alert">{error}</div>}
    {loading ? <div className="th-owner-loading">Loading your workspace…</div> : <>
      <section className="th-owner-stats">
        <article><span>Classes</span><strong>{stats.classes}</strong><small>Your classrooms</small></article>
        <article><span>Teachers</span><strong>{stats.teachers}</strong><small>Teaching team</small></article>
        <article><span>Learners</span><strong>{stats.learners}</strong><small>Across your centre</small></article>
        <article><span>Pending tutor applications</span><strong>{applications.length}</strong><small>Awaiting your review</small></article>
      </section>
      <section className="th-owner-section"><div className="th-owner-section-title"><div><span>QUICK ACCESS</span><h2>Manage your centre</h2></div></div><div className="th-owner-links">{quickLinks.map((link) => <button key={link.path} className="th-owner-link" onClick={() => navigate(link.path)}><span className="th-owner-link-icon">{link.icon}</span><span><b>{link.title}</b><small>{link.detail}</small></span><i>→</i></button>)}</div></section>
      <section className="th-owner-section"><div className="th-owner-section-title"><div><span>TEAM MANAGEMENT</span><h2>Tutor applications</h2><p>Approve tutors who want to join your tuition centre.</p></div><b className="th-owner-count">{applications.length} pending</b></div>
        {applications.length === 0 ? <div className="th-owner-empty">No pending tutor applications right now.</div> : <div className="th-owner-applications">{applications.map((app) => <article key={app._id}><div><b>{app.name} {app.surname}</b><small>{app.email}</small></div><div className="th-owner-actions"><button disabled={busyId === app._id} onClick={() => reviewApplication(app._id, "approve")}>Approve</button><button className="reject" disabled={busyId === app._id} onClick={() => reviewApplication(app._id, "reject")}>Reject</button></div></article>)}</div>}
      </section>
    </>}
    <style>{`
      .th-owner-home{max-width:1400px;margin:0 auto;padding:34px clamp(18px,4vw,48px) 60px;color:#172b49;box-sizing:border-box;min-height:100vh}
      .th-owner-welcome{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:28px}.th-owner-eyebrow,.th-owner-section-title>div>span{font-size:10px;font-weight:850;letter-spacing:1.5px;color:#4775a8}.th-owner-welcome h1{font-size:clamp(26px,3vw,34px);margin:8px 0;color:#122e55}.th-owner-welcome p,.th-owner-section-title p{color:#718096;margin:0}.th-owner-welcome>button,.th-owner-actions button{border:0;border-radius:9px;background:#173e6d;color:white;padding:12px 17px;font-weight:750;cursor:pointer}.th-owner-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:32px}.th-owner-stats article{background:#fff;border:1px solid #e5ebf3;border-radius:14px;padding:19px;box-shadow:0 5px 18px #19385b08}.th-owner-stats span,.th-owner-stats small{display:block;color:#718096;font-size:12px}.th-owner-stats strong{display:block;font-size:30px;color:#173e6d;margin:10px 0 5px}.th-owner-section{margin:28px 0}.th-owner-section-title{display:flex;justify-content:space-between;align-items:end;gap:15px;margin-bottom:15px}.th-owner-section-title h2{font-size:21px;margin:5px 0;color:#17365e}.th-owner-count{background:#eaf1fa;color:#234d7b;border-radius:30px;padding:8px 12px;font-size:12px}.th-owner-links{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}.th-owner-link{display:flex;align-items:center;gap:12px;text-align:left;background:#fff;border:1px solid #e5ebf3;border-radius:13px;padding:15px;cursor:pointer;color:#1b3557;min-width:0}.th-owner-link:hover{border-color:#9bb6d7;box-shadow:0 6px 18px #19385b0d;transform:translateY(-1px)}.th-owner-link-icon{width:38px;height:38px;display:grid;place-items:center;background:#edf3fb;color:#1d4a7d;border-radius:10px;font-size:19px;font-weight:800;flex:0 0 38px}.th-owner-link b,.th-owner-link small{display:block}.th-owner-link b{font-size:13px}.th-owner-link small{font-size:11px;color:#7b899d;margin-top:4px}.th-owner-link i{margin-left:auto;color:#7890ad;font-style:normal}.th-owner-empty,.th-owner-loading{background:#fff;border:1px dashed #ccd7e5;border-radius:13px;padding:24px;color:#74849a;text-align:center}.th-owner-applications{background:#fff;border:1px solid #e5ebf3;border-radius:13px;padding:0 18px}.th-owner-applications article{display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap;padding:15px 0;border-bottom:1px solid #edf1f6}.th-owner-applications article:last-child{border-bottom:0}.th-owner-applications small{display:block;color:#74849a;margin-top:4px}.th-owner-actions{display:flex;gap:8px}.th-owner-actions button{padding:9px 13px;font-size:12px}.th-owner-actions button.reject{background:#fff0f0;color:#a12c35}.th-owner-actions button:disabled{opacity:.55;cursor:wait}.th-owner-error{padding:12px 15px;border-radius:10px;background:#fff0f0;color:#a12c35;margin-bottom:16px}
      @media(max-width:1000px){.th-owner-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.th-owner-links{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.th-owner-home{padding-top:62px}.th-owner-stats{gap:9px}.th-owner-stats article{padding:14px}.th-owner-stats strong{font-size:25px}.th-owner-links{grid-template-columns:1fr}.th-owner-welcome>button{width:100%}}
    `}</style>
  </main>;
}
