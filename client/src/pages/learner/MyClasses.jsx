import API_URL from "../../api.js";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClassCard from "../../components/ClassCard";
import BackButton from "../../components/BackButton";

export default function MyClasses() {
  const navigate = useNavigate();
  const [learner, setLearner] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const learnerHeaders = () => {
    let token = "";
    try { token = JSON.parse(localStorage.getItem("learner") || "null")?.token || ""; } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadMyClasses = useCallback(async (learnerData) => {
    const learnerId = learnerData?._id || learnerData?.id;
    if (!learnerId) { setClasses([]); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/classes/browse/learner/${learnerId}`, { headers: learnerHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load your classes.");
      const joined = (Array.isArray(data) ? data : []).filter(cls =>
        (cls.learners || []).some(person => String(person?._id || person) === String(learnerId))
      );
      setClasses(joined);
    } catch (err) { setError(err.message || "Could not load your classes."); setClasses([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("learner") || "null");
      if (!saved) { navigate("/login"); return; }
      setLearner(saved); loadMyClasses(saved);
    } catch { navigate("/login"); }
  }, [navigate, loadMyClasses]);

  return <main className="th-classroom-workspace-panel" style={{ maxWidth: 1100, margin: "24px auto", padding: 24 }}>
    <BackButton />
    <h1>My Classes 📚</h1>
    <p>These are the classes you have joined.</p>
    {loading ? <p>Loading your classes…</p> : error ? <p role="alert" style={{ color: "#b91c1c" }}>{error} <button onClick={() => learner && loadMyClasses(learner)}>Retry</button></p> : classes.length === 0 ? <p>You have not joined any classes yet. Browse classes to find one for your grade.</p> : classes.map(item => <ClassCard key={item._id} classroom={item} buttonText="🚀 Enter Classroom" onClick={() => navigate(`/classroom/${item._id}`)} />)}
  </main>;
}
