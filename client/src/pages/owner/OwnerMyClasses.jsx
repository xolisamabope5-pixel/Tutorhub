import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../../api.js";

export default function OwnerMyClasses() {
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClasses = useCallback(async (ownerData) => {
    if (!ownerData?.id) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/classes/tutor/${ownerData.id}`, {
        headers: { Authorization: `Bearer ${ownerData.token || ""}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load your classes.");
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load your classes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let saved;
    try { saved = JSON.parse(localStorage.getItem("tutor") || "null"); } catch { saved = null; }
    if (!saved || saved.role !== "owner") {
      navigate("/tutor-login", { replace: true });
      return;
    }
    setOwner(saved);
    loadClasses(saved);
  }, [navigate, loadClasses]);

  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 22px 48px", width: "100%", boxSizing: "border-box" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
      <div><p style={{ margin: "0 0 6px", color: "#64748b", fontWeight: 700, letterSpacing: 1, fontSize: 12 }}>CENTRE WORKSPACE</p><h1 style={{ margin: 0, color: "#142746" }}>My Classes</h1><p style={{ margin: "8px 0 0", color: "#64748b" }}>All classrooms you have created for your tuition centre.</p></div>
      <button onClick={() => navigate("/create-class")} style={{ border: 0, borderRadius: 10, background: "#12396b", color: "white", padding: "12px 18px", fontWeight: 700, cursor: "pointer" }}>+ Create Class</button>
    </div>
    {loading ? <p>Loading your classes…</p> : error ? <div role="alert" style={{ padding: 16, borderRadius: 12, background: "#fff1f1", color: "#a12626" }}>{error}<button onClick={() => owner && loadClasses(owner)} style={{ marginLeft: 12 }}>Try again</button></div> : classes.length === 0 ? <section style={{ padding: 34, border: "1px dashed #cbd5e1", borderRadius: 16, textAlign: "center", background: "#f8fafc" }}><h3 style={{ marginTop: 0 }}>You haven't created any classes yet</h3><p style={{ color: "#64748b" }}>Create your first classroom and start adding learners.</p><button onClick={() => navigate("/create-class")} style={{ border: 0, borderRadius: 9, background: "#12396b", color: "white", padding: "11px 16px", fontWeight: 700, cursor: "pointer" }}>Create your first class</button></section> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>{classes.map((item) => <article key={item._id} style={{ border: "1px solid #e2e8f0", borderRadius: 15, padding: 19, background: "white", boxShadow: "0 5px 18px rgba(15, 35, 65, .05)" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}><h3 style={{ margin: "0 0 12px", color: "#172b4d" }}>{item.className}</h3><span style={{ fontSize: 11, background: "#edf4ff", color: "#24558a", padding: "5px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{item.grade}</span></div><p style={{ margin: "5px 0", color: "#475569" }}><b>Subject:</b> {item.subject}</p><p style={{ margin: "5px 0", color: "#475569" }}><b>Learners:</b> {item.learners?.length || 0}</p>{item.description && <p style={{ color: "#64748b", lineHeight: 1.5 }}>{item.description}</p>}<button onClick={() => navigate(`/tutor-classroom/${item._id}`)} style={{ width: "100%", marginTop: 10, border: 0, borderRadius: 9, background: "#12396b", color: "white", padding: 11, fontWeight: 700, cursor: "pointer" }}>Open Classroom</button></article>)}</div>}
  </main>;
}
