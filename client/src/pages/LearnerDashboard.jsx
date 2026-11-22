import API_URL from "../api.js";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "../styles/learner-overview.css";

export default function LearnerDashboard() {
  const navigate = useNavigate();
  const [learner, setLearner] = useState(null);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const raw = localStorage.getItem("learner");
        if (!raw) { navigate("/login"); return; }
        const current = JSON.parse(raw);
        if (!active) return;
        setLearner(current);
        const programId = current.programId?._id || current.programId;
        if (!programId || !current.grade) throw new Error("Your centre or grade is missing from your learner profile. Please contact your centre.");
        const headers = current.token ? { Authorization: `Bearer ${current.token}` } : {};
        const classResponse = await fetch(`${API_URL}/api/classes/program/${programId}/${encodeURIComponent(String(current.grade).trim())}`, { headers });
        const classData = await classResponse.json();
        if (!classResponse.ok) throw new Error(classData.message || "Could not load your centre classes.");
        const allCentreClasses = Array.isArray(classData) ? classData : [];
        const joined = allCentreClasses.filter(c => (c.learners || []).some(person => String(person._id || person) === String(current._id)));
        if (active) setClasses(joined);
        const assignmentLists = await Promise.all(joined.map(async c => {
          const [qRes, dRes] = await Promise.all([
            fetch(`${API_URL}/api/assignments/class/${c._id}`, { headers }),
            fetch(`${API_URL}/api/document-assignments/class/${c._id}`, { headers })
          ]);
          const [qData, dData] = await Promise.all([qRes.json(), dRes.json()]);
          return [
            ...(Array.isArray(qData) ? qData : []).map(a => ({ ...a, className: c.className, subject: c.subject })),
            ...(Array.isArray(dData) ? dData : []).map(a => ({ ...a, className: c.className, subject: c.subject }))
          ];
        }));
        const allAssignments = assignmentLists.flat();
        if (active) setAssignments(allAssignments);
        try {
          const inboxRes = await fetch(`${API_URL}/api/inbox/conversations`, { headers });
          const inboxData = await inboxRes.json();
          const conversations = inboxData.conversations || [];
          const unread = conversations.reduce((total, conversation) => total + (conversation.messages || []).filter(message => !(message.readBy || []).some(id => String(id) === String(current._id))).length, 0);
          if (active) setUnreadMessages(unread);
        } catch { /* inbox count is optional */ }
      } catch (e) { if (active) setError(e.message || "Could not load your dashboard."); }
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [navigate]);

  const now = new Date();
  const dueSoon = useMemo(() => assignments.filter(a => a.dueDate && new Date(a.dueDate) >= now && new Date(a.dueDate) <= new Date(now.getTime() + 7 * 86400000)).length, [assignments]);
  const activeAssignments = useMemo(() => assignments.filter(a => !a.dueDate || new Date(a.dueDate) >= now).length, [assignments]);

  return <main className="learner-overview">
    <header className="learner-overview-header">
      <div><p className="learner-eyebrow">LEARNER WORKSPACE</p><h1>Welcome back{learner?.name ? `, ${learner.name}` : ""}</h1><p>Here’s what is happening with your learning.</p></div>
      <button className="learner-primary-btn" onClick={() => navigate("/learner/browse-classes")}>Browse centre classes</button>
    </header>
    {error && <div className="learner-alert">{error}</div>}
    {loading ? <div className="learner-panel">Loading your learning overview…</div> : <>
      <section className="learner-stat-grid">
        <article className="learner-stat"><span>Classes joined</span><strong>{classes.length}</strong><small>Your active classrooms</small></article>
        <article className="learner-stat"><span>Active assignments</span><strong>{activeAssignments}</strong><small>Work currently available</small></article>
        <article className="learner-stat"><span>Due soon</span><strong>{dueSoon}</strong><small>Due within the next 7 days</small></article>
        <article className="learner-stat"><span>Unread messages</span><strong>{unreadMessages}</strong><small>Messages waiting for you</small></article>
      </section>
      <section className="learner-panel"><div className="learner-panel-heading"><div><h2>My classrooms</h2><p>Continue learning with your tutors.</p></div><button onClick={() => navigate("/learner/classes")}>View all</button></div>
        {classes.length ? <div className="learner-class-grid">{classes.slice(0, 4).map(c => <article className="learner-class-item" key={c._id}><span className="learner-class-icon">▦</span><div><h3>{c.className || c.subject || "Classroom"}</h3><p>{c.subject || "Subject"} · {c.grade || learner?.grade || "Grade"}</p><small>{c.tutorId ? `Tutor: ${c.tutorId.name || ""} ${c.tutorId.surname || ""}` : "TutorHub classroom"}</small></div><button onClick={() => navigate(`/classroom/${c._id}`)}>Open classroom →</button></article>)}</div> : <p className="learner-empty">You have not joined a class yet. Browse the classes offered by all tutors at your centre.</p>}
      </section>
      <section className="learner-quick-links"><button onClick={() => navigate("/learner/assignments")}>📝 <span><b>Assignments</b><small>View and submit your work</small></span></button><button onClick={() => navigate("/learner/results")}>✓ <span><b>Results</b><small>See marks released by tutors</small></span></button><button onClick={() => navigate("/inbox")}>✉ <span><b>Messages</b><small>{unreadMessages} unread messages</small></span></button></section>
    </>}
  </main>;
}
