import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./DashboardSidebar.css";
import NotificationCenter from "./NotificationCenter.jsx";

const menus = {
  admin: [
    ["Overview", "/admin#overview", "⌂"],
    ["Applications", "/admin#applications", "▤"],
    ["Tuition Centres", "/admin#centres", "▦"],
    ["Private Tutors", "/admin#tutors", "♙"],
    ["Payments", "/admin#payments", "＄"],
  ],
  owner: [
    ["Overview", "/owner-home", "⌂"],
    ["Create Class", "/create-class", "+"],
    ["My Classes", "/owner-my-classes", "▦"],
    ["Teachers", "/owner-teachers", "♙"],
    ["Learners", "/owner-learners", "♧"],
    ["Payments", "/owner-payments", "＄"],
    ["Attendance", "/attendance", "◷"],
    ["Reports", "/owner-reports", "▥"],
    ["Inbox", "/inbox", "✉"],
    ["Settings", "/owner-settings", "⚙"],
  ],
  tutor: [
    ["Overview", "/tutor-dashboard", "⌂"],
    ["Create Class", "/create-class", "+"],
    ["Inbox", "/inbox", "✉"],
    ["Attendance", "/attendance", "◷"],
  ],
  learner: [
    ["Overview", "/learner-dashboard", "⌂"],
    ["My Classes", "/learner/classes", "▦"],
    ["Browse Classes", "/learner/browse-classes", "＋"],
    ["Assignments", "/learner/assignments", "▤"],
    ["Results", "/learner/results", "✓"],
    ["Lessons & Recordings", "/learner/lessons", "▶"],
    ["Announcements", "/learner/announcements", "◉"],
    ["Inbox", "/inbox", "✉"],
    ["Payments", "/learner/payments", "＄"],
    ["Profile", "/learner/profile", "♙"],
  ],
};

export default function DashboardSidebar({ role = "learner" }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const items = menus[role] || menus.learner;
  const logout = () => {
    const key = role === "admin" ? "admin" : role === "learner" ? "learner" : "tutor";
    if (key === "admin") {
      ["adminLoggedIn", "adminToken", "adminUsername"].forEach((k) => localStorage.removeItem(k));
      navigate("/admin-login");
    } else {
      localStorage.removeItem(key);
      navigate(key === "learner" ? "/login" : "/tutor-login");
    }
  };
  return <>
    <button className="th-sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">☰</button>
    <aside className={`th-sidebar ${open ? "is-open" : ""}`}>
      <div className="th-sidebar-brand"><span className="th-brand-mark">T</span><div><strong>TutorHub</strong><small>{role === "admin" ? "Platform control" : role === "owner" ? "Centre workspace" : role === "tutor" ? "Tutor workspace" : "Learner space"}</small></div></div>
      {role !== "admin" && <NotificationCenter role={role} />}
      <div className="th-sidebar-label">WORKSPACE</div>
      <nav>{items.map(([label, path, icon]) => <NavLink key={label} to={path} end={path === "/admin" || path.endsWith("dashboard") || path.endsWith("-home")} onClick={() => setOpen(false)} className={({ isActive }) => `th-sidebar-link ${(role === "admin" ? (window.location.hash || "#overview") === path.slice(path.indexOf("#")) : isActive) ? "active" : ""}`}><span>{icon}</span>{label}</NavLink>)}</nav>
      <div className="th-sidebar-bottom"><div className="th-sidebar-role">{role === "admin" ? "SUPER ADMIN" : role === "owner" ? "CENTRE ADMIN" : role.toUpperCase()}</div><button onClick={logout}>↪ Sign out</button></div>
    </aside>
    {open && <button className="th-sidebar-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}
  </>;
}
