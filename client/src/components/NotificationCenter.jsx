import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api.js";
import "../styles/notification-center.css";

const iconFor = type => ({ message: "✉", assignment: "📝", result: "✓", material: "📚", lesson: "🎥", announcement: "📢", submission: "📥" }[type] || "•");

export default function NotificationCenter({ role }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const auth = useMemo(() => {
    const key = role === "learner" ? "learner" : "tutor";
    try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value?.token ? { token: value.token } : null; } catch { return null; }
  }, [role]);

  const load = useCallback(async () => {
    if (!auth?.token || role === "admin") return;
    try {
      const response = await fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${auth.token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Notifications unavailable");
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch { /* Notification checks must never interrupt workspace use. */ }
  }, [auth, role]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  const openCentre = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread && auth?.token) {
      try {
        await fetch(`${API_URL}/api/notifications/read`, { method: "PATCH", headers: { Authorization: `Bearer ${auth.token}` } });
        setUnread(0);
        setItems(current => current.map(item => ({ ...item, isRead: true })));
      } catch { /* keep the current feed visible */ }
    }
  };

  const follow = item => {
    setOpen(false);
    if (item.path) navigate(item.path);
  };

  if (role === "admin") return null;
  return <div className="th-notification-wrap">
    <button className="th-notification-trigger" onClick={openCentre} aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
      <span aria-hidden="true">🔔</span><span>Notifications</span>{unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
    </button>
    {open && <>
      <button className="th-notification-dismiss" aria-label="Close notifications" onClick={() => setOpen(false)} />
      <section className="th-notification-panel" aria-label="Notification centre">
        <header><div><strong>Notifications</strong><small>{unread ? `${unread} new updates` : "You're all caught up"}</small></div><button onClick={() => { setOpen(false); load(); }} aria-label="Close">×</button></header>
        <div className="th-notification-list">
          {items.length ? items.map(item => <button key={item.id} className={`th-notification-item ${item.isRead ? "read" : "unread"}`} onClick={() => follow(item)}>
            <span className="th-notification-icon">{iconFor(item.type)}</span><span className="th-notification-copy"><strong>{item.title}</strong><small>{item.body}</small><small className="th-notification-meta">{item.className ? `${item.className} · ` : ""}{new Date(item.createdAt).toLocaleString()}</small></span>{!item.isRead && <i />}
          </button>) : <p className="th-notification-empty">New messages, assignments, marks and class updates will appear here.</p>}
        </div>
        <footer><button onClick={() => { setOpen(false); navigate("/inbox"); }}>Open Inbox</button></footer>
      </section>
    </>}
  </div>;
}
