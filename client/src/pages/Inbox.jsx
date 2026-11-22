import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API_URL from "../api";
import "./Inbox.css";

function session() {
  if (localStorage.getItem("adminLoggedIn") === "true") {
    const token = localStorage.getItem("adminToken");
    try { const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); return { key: "admin", value: { id: payload.id, role: "admin" }, token }; } catch { return { key: "admin", value: {}, token }; }
  }
  for (const key of ["learner", "tutor"]) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      if (value) return { key, value, token: value.token || localStorage.getItem(`${key}Token`) };
    } catch { /* ignore malformed legacy session */ }
  }
  return null;
}

export default function Inbox() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useMemo(session, []);
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const headers = { "Content-Type": "application/json", ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}) };

  useEffect(() => {
    if (!auth?.token) { setError("Please sign in again to use Inbox. Your current session does not include a secure messaging token."); setLoading(false); return; }
    Promise.all([
      fetch(`${API_URL}/api/inbox/contacts`, { headers }).then(r => r.json().then(d => { if (!r.ok) throw new Error(d.message); return d.contacts || []; })),
      fetch(`${API_URL}/api/inbox/conversations`, { headers }).then(r => r.json().then(d => { if (!r.ok) throw new Error(d.message); return d.conversations || []; }))
    ]).then(([c, v]) => { setContacts(c); setConversations(v); }).catch(e => setError(e.message || "Inbox could not be loaded.")).finally(() => setLoading(false));
  }, []);

  const openConversation = async (conversation) => {
    try {
      const r = await fetch(`${API_URL}/api/inbox/conversations/${conversation._id}`, { headers });
      const d = await r.json(); if (!r.ok) throw new Error(d.message);
      setActive(d.conversation); setMessages(d.conversation.messages || []);
      fetch(`${API_URL}/api/inbox/conversations/${conversation._id}/read`, { method: "PATCH", headers });
    } catch (e) { setError(e.message); }
  };

  useEffect(() => {
    const targetId = new URLSearchParams(location.search).get("conversation");
    if (!targetId || !conversations.length || active?._id === targetId) return;
    const target = conversations.find(item => String(item._id) === String(targetId));
    if (target) openConversation(target);
  }, [location.search, conversations, active?._id]);

  const startConversation = async (contact) => {
    try {
      const r = await fetch(`${API_URL}/api/inbox/conversations`, { method: "POST", headers, body: JSON.stringify({ userId: contact.userId, role: contact.role }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.message);
      setActive(d.conversation); setMessages(d.conversation.messages || []);
      setConversations(old => [d.conversation, ...old.filter(x => x._id !== d.conversation._id)]);
    } catch (e) { setError(e.message); }
  };

  const send = async (e) => {
    e.preventDefault(); if ((!draft.trim() && !attachment) || !active) return;
    const body = draft.trim();
    const form = new FormData();
    form.append("body", body);
    if (attachment) form.append("attachment", attachment);
    setDraft(""); setAttachment(null);
    try {
      const r = await fetch(`${API_URL}/api/inbox/conversations/${active._id}/messages`, {
        method: "POST",
        headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {},
        body: form
      });
      const d = await r.json(); if (!r.ok) throw new Error(d.message);
      setMessages(old => [...old, d.message]);
      setConversations(old => [active, ...old.filter(x => x._id !== active._id)]);
    } catch (e) { setDraft(body); setError(e.message); }
  };

  const filteredContacts = contacts.filter(c => `${c.name} ${c.surname} ${c.businessName || ""}`.toLowerCase().includes(search.toLowerCase()));
  const other = active?.participants?.find(p => String(p.userId) !== String(auth?.value?._id || auth?.value?.id));
  const displayName = (p) => { const c = contacts.find(x => String(x.userId) === String(p?.userId)); return c ? `${c.name} ${c.surname}` : p?.role === "learner" ? "Learner" : "TutorHub contact"; };

  return <main className="th-inbox-page">
    <header className="th-inbox-heading"><div><span className="th-inbox-kicker">TUTORHUB MESSAGES</span><h1>Inbox</h1><p>Private conversations with your TutorHub contacts.</p></div><button onClick={() => navigate(-1)} className="th-inbox-back">← Back</button></header>
    {error && <div className="th-inbox-alert">{error}<button onClick={() => setError("")}>Dismiss</button></div>}
    <section className="th-inbox-shell">
      <aside className="th-inbox-contacts"><div className="th-inbox-search"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people or conversations" /></div>
        <div className="th-inbox-section-label">CONVERSATIONS</div>
        {conversations.map(c => { const p = c.participants.find(x => String(x.userId) !== String(auth?.value?._id || auth?.value?.id)); return <button className={`th-inbox-person ${active?._id === c._id ? "selected" : ""}`} key={c._id} onClick={() => openConversation(c)}><span className="th-inbox-avatar">{(displayName(p)[0] || "T").toUpperCase()}</span><span><strong>{displayName(p)}</strong><small>{c.messages?.[0]?.body || "Open conversation"}</small></span></button>; })}
        <div className="th-inbox-section-label th-inbox-people-label">AVAILABLE CONTACTS</div>
        {filteredContacts.map(c => <button className="th-inbox-person" key={`${c.role}-${c.userId}`} onClick={() => startConversation(c)}><span className="th-inbox-avatar">{(c.name?.[0] || "T").toUpperCase()}</span><span><strong>{c.name} {c.surname}</strong><small>{c.role === "owner" ? "Centre administrator" : c.role === "teacher" ? "Tutor" : "Learner"}</small></span><b className="th-inbox-plus">+</b></button>)}
        {!loading && !filteredContacts.length && !conversations.length && <p className="th-inbox-empty">No contacts are available yet.</p>}
      </aside>
      <section className="th-inbox-chat">{active ? <>
        <header className="th-inbox-chat-head"><span className="th-inbox-avatar">{(displayName(other)[0] || "T").toUpperCase()}</span><div><strong>{displayName(other)}</strong><small>Private TutorHub conversation</small></div></header>
        <div className="th-inbox-messages">{messages.map(m => <div key={m._id} className={`th-inbox-bubble ${String(m.senderId) === String(auth?.value?._id || auth?.value?.id) ? "mine" : "theirs"}`}>{m.body && <p>{m.body}</p>}{m.attachmentUrl && <div className="th-inbox-attachment">{(m.attachmentMimeType || "").startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(m.attachmentName || "") ? <><a href={(String(m.attachmentUrl).startsWith("http") ? m.attachmentUrl : `${API_URL}${m.attachmentUrl}`)} download={m.attachmentName || true}><img src={(String(m.attachmentUrl).startsWith("http") ? m.attachmentUrl : `${API_URL}${m.attachmentUrl}`)} alt={m.attachmentName || "Message attachment"}/></a><a href={(String(m.attachmentUrl).startsWith("http") ? m.attachmentUrl : `${API_URL}${m.attachmentUrl}`)} download={m.attachmentName || true}>Download image</a></> : <a href={(String(m.attachmentUrl).startsWith("http") ? m.attachmentUrl : `${API_URL}${m.attachmentUrl}`)} download={m.attachmentName || true}>📎 {m.attachmentName || "Download attachment"}</a>}</div>}<time>{new Date(m.createdAt).toLocaleString()}</time></div>)}{!messages.length && <p className="th-inbox-empty">This conversation is ready. Send the first message.</p>}</div>
        <form className="th-inbox-compose" onSubmit={send}><div className="th-inbox-compose-tools"><label className="th-inbox-attach">＋ Attach file<input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" onChange={e => { const file=e.target.files?.[0] || null; if(file && file.size > 12*1024*1024){setError("Attachments must be 12 MB or smaller.");e.target.value="";setAttachment(null);return;}setAttachment(file);}}/></label>{attachment && <span className="th-inbox-file-picked">{attachment.name}<button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment">×</button></span>}</div><small className="th-inbox-attachment-hint">Attach images or documents (PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP) · 12 MB max.</small><textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a message…" maxLength={5000} rows={2}/><button disabled={!draft.trim() && !attachment}>Send</button></form>
      </> : <div className="th-inbox-welcome"><div className="th-inbox-welcome-icon">✉</div><h2>Your conversations</h2><p>Select an existing conversation or choose a contact to start a new one.</p></div>}</section>
    </section>
    {loading && <p className="th-inbox-loading">Loading your inbox…</p>}
  </main>;
}
