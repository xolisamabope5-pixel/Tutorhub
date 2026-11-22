import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";
import "../styles/admin-fresh.css";

const NAV = [
  ["overview", "Overview", "▦"], ["applications", "Applications", "▣"],
  ["centres", "Tuition Centres", "⌂"], ["private-tutors", "Private Tutors", "♙"],
  ["centre-tutors", "Centre Tutors", "♧"], ["payments", "Payments", "R"],
  ["settings", "Platform Settings", "⚙"], ["password", "Change Password", "⌑"]
];
const money = (n) => `R${Number(n || 0).toLocaleString("en-ZA")}`;

export default function Admin() {
  const navigate = useNavigate();
  const [view, setView] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [providers, setProviders] = useState([]);
  const [centreTutors, setCentreTutors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newUsername: localStorage.getItem("adminUsername") || "", newPassword: "", confirmPassword: "" });

  const headers = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}` }), []);
  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
    if (response.status === 401 || response.status === 403) { localStorage.removeItem("adminToken"); localStorage.removeItem("adminLoggedIn"); navigate("/admin-login"); throw new Error("Your admin session expired. Please sign in again."); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "The request could not be completed.");
    return data;
  }, [headers, navigate]);

  const loadOverview = useCallback(async () => setOverview(await request("/api/admin/overview")), [request]);
  const loadProviders = useCallback(async () => setProviders(await request("/api/admin/providers")), [request]);
  const loadCentreTutors = useCallback(async () => setCentreTutors(await request("/api/admin/centre-tutors")), [request]);
  const loadPayments = useCallback(async () => setPayments(await request("/api/owner-payments/")), [request]);
  const loadSettings = useCallback(async () => setSettings(await request("/api/platform-settings")), [request]);

  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") !== "true" || !localStorage.getItem("adminToken")) { navigate("/admin-login"); return; }
    loadOverview().catch((e) => setError(e.message));
  }, [navigate, loadOverview]);

  useEffect(() => {
    const onHash = () => { const key = window.location.hash.slice(1); setView(NAV.some(([id]) => id === key) ? key : "overview"); };
    window.addEventListener("hashchange", onHash); onHash(); return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    setError(""); setBusy(true);
    const task = view === "applications" || view === "centres" || view === "private-tutors" ? loadProviders
      : view === "centre-tutors" ? loadCentreTutors : view === "payments" ? loadPayments
      : view === "settings" ? loadSettings : view === "overview" ? loadOverview : null;
    Promise.resolve(task?.()).catch((e) => setError(e.message)).finally(() => setBusy(false));
  }, [view, loadProviders, loadCentreTutors, loadPayments, loadSettings, loadOverview]);

  const select = (id) => { setView(id); window.history.replaceState(null, "", `/admin#${id}`); window.scrollTo(0, 0); };
  const logout = () => { ["adminLoggedIn", "adminToken", "adminUsername"].forEach((k) => localStorage.removeItem(k)); navigate("/admin-login"); };
  const act = async (provider, action) => {
    if (action === "approve" && (!provider.paymentProof || !window.confirm("Have you opened the proof and independently verified the TutorHub payment?"))) return;
    if (action !== "approve" && !window.confirm(`Confirm ${action} for ${provider.businessName}?`)) return;
    try { setBusy(true); await request(`/api/admin/providers/${provider.programId || `legacy-${provider.ownerId}`}/review`, { method: "PATCH", body: JSON.stringify({ action, paymentVerified: action === "approve", note: "Reviewed in Super Admin." }) }); await Promise.all([loadProviders(), loadOverview()]); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const saveSettings = async (e) => { e.preventDefault(); try { setBusy(true); await request("/api/platform-settings", { method: "PUT", body: JSON.stringify(settings) }); setError("Settings saved successfully."); } catch (x) { setError(x.message); } finally { setBusy(false); } };
  const changePassword = async (e) => { e.preventDefault(); if (passwordForm.newPassword !== passwordForm.confirmPassword) { setError("New passwords do not match."); return; } try { setBusy(true); const data = await request("/api/admin/change-login", { method: "PUT", body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newUsername: passwordForm.newUsername, newPassword: passwordForm.newPassword }) }); if (data.token) localStorage.setItem("adminToken", data.token); localStorage.setItem("adminUsername", passwordForm.newUsername); setPasswordForm({ currentPassword: "", newUsername: passwordForm.newUsername, newPassword: "", confirmPassword: "" }); setError("Admin login updated successfully."); } catch (x) { setError(x.message); } finally { setBusy(false); } };

  const centres = providers.filter((p) => p.providerType === "tuition-centre");
  const privateTutors = providers.filter((p) => p.providerType === "private-tutor");
  const applications = providers.filter((p) => p.status === "Pending");
  const stats = overview || {};
  const title = NAV.find(([id]) => id === view)?.[1] || "Overview";
  const card = (label, value, hint) => <article className="th-admin-stat" key={label}><span>{label}</span><strong>{value ?? "—"}</strong><small>{hint || "Platform total"}</small></article>;
  const providerRows = (rows) => rows.length ? <div className="th-admin-table-wrap"><table className="th-admin-table"><thead><tr><th>Provider</th><th>Contact</th><th>Status</th><th>Learners</th><th>Subscription</th><th>Actions</th></tr></thead><tbody>{rows.map((p) => <tr key={p._id}><td><b>{p.businessName}</b><small>{p.providerType === "private-tutor" ? "Independent private tutor" : "Tuition centre"}</small></td><td>{p.ownerName}<small>{p.email}</small></td><td><span className={`th-status ${String(p.status).toLowerCase()}`}>{p.status}</span></td><td>{p.learnerCount ?? 0}</td><td>{p.customQuoteRequired ? "Custom quote" : `${money(p.platformFee)}/month`}</td><td className="th-actions">{p.paymentProof && <button onClick={() => window.dispatchEvent(new CustomEvent("tutorhub:open-resource", { detail: { url: p.paymentProof.startsWith("http") ? p.paymentProof : `${API_URL}/uploads/${p.paymentProof}`, title: `Payment proof — ${p.businessName}` } }))}>View proof</button>}{p.status !== "Active" && <button onClick={() => act(p, "approve")}>Approve</button>}{p.status !== "Rejected" && <button className="secondary" onClick={() => act(p, "reject")}>Reject</button>}{p.status === "Active" && <button className="danger" onClick={() => act(p, "block")}>Block</button>}{p.status === "Blocked" && <button onClick={() => act(p, "unblock")}>Unblock</button>}</td></tr>)}</tbody></table></div> : <div className="th-admin-empty">Nothing to show in this section yet.</div>;

  return <div className="th-admin-shell">
    <aside className="th-admin-sidebar"><div className="th-admin-brand"><span>T</span><div><b>TutorHub</b><small>Super Admin</small></div></div><nav>{NAV.map(([id, label, icon]) => <button key={id} className={view === id ? "selected" : ""} onClick={() => select(id)}><i>{icon}</i>{label}</button>)}</nav><button className="th-admin-signout" onClick={logout}>↪ Sign Out</button></aside>
    <main className="th-admin-main"><header className="th-admin-top"><div><small>SUPER ADMIN / WORKSPACE</small><h1>{title}</h1></div><span className="th-admin-user">{localStorage.getItem("adminUsername") || "Administrator"}</span></header>
      {error && <div className="th-admin-alert" role="status">{error}</div>}
      {busy && <div className="th-admin-loading">Updating workspace…</div>}
      {view === "overview" && <section className="th-admin-content"><p className="th-admin-intro">A snapshot of TutorHub platform activity.</p><div className="th-admin-stats">{card("Tuition centres", stats.totalCentres)}{card("Independent private tutors", stats.privateTutors)}{card("Centre tutors", stats.totalTutors)}{card("Total learners", stats.totalLearners)}{card("Centre learners", stats.centreLearners)}{card("Private tutor learners", stats.privateTutorLearners)}{card("Pending centre applications", stats.pendingCentres)}{card("Pending centre tutor applications", stats.pendingCentreTutorApplications)}{card("Pending private tutor applications", stats.pendingPrivateTutors)}{card("Active centres", stats.activeCentres)}{card("Blocked centres", stats.blockedCentres)}</div></section>}
      {view === "applications" && <section className="th-admin-content"><div className="th-admin-section-head"><div><p>REVIEW QUEUE</p><h2>Provider applications</h2><span>Only new tuition centre and independent tutor applications appear here.</span></div><b>{applications.length} pending</b></div>{providerRows(applications)}</section>}
      {view === "centres" && <section className="th-admin-content"><div className="th-admin-section-head"><div><p>PROVIDER DIRECTORY</p><h2>Tuition centres</h2><span>Approved and pending centre accounts.</span></div><b>{centres.length} centres</b></div>{providerRows(centres)}</section>}
      {view === "private-tutors" && <section className="th-admin-content"><div className="th-admin-section-head"><div><p>PROVIDER DIRECTORY</p><h2>Independent private tutors</h2><span>Standalone tutor provider accounts.</span></div><b>{privateTutors.length} tutors</b></div>{providerRows(privateTutors)}</section>}
      {view === "centre-tutors" && <section className="th-admin-content"><div className="th-admin-section-head"><div><p>TEAM DIRECTORY</p><h2>Centre tutors</h2><span>Tutors who have applied to work under a tuition centre.</span></div><b>{centreTutors.length} tutors</b></div>{centreTutors.length ? <div className="th-admin-table-wrap"><table className="th-admin-table"><thead><tr><th>Tutor</th><th>Email</th><th>Centre</th><th>Status</th><th>Actions</th></tr></thead><tbody>{centreTutors.map((t) => <tr key={t._id}><td>{t.name} {t.surname}</td><td>{t.email}</td><td>{t.programName || "—"}</td><td><span className={`th-status ${String(t.status).toLowerCase()}`}>{t.status}</span></td><td><small>Reviewed by centre owner</small></td></tr>)}</tbody></table></div> : <div className="th-admin-empty">No centre tutors have registered yet.</div>}</section>}
      {view === "payments" && <section className="th-admin-content"><div className="th-admin-section-head"><div><p>FINANCE</p><h2>Provider payments</h2><span>Payment records submitted by provider accounts.</span></div></div>{payments.length ? <div className="th-admin-table-wrap"><table className="th-admin-table"><thead><tr><th>Provider</th><th>Period</th><th>Amount</th><th>Status</th></tr></thead><tbody>{payments.map((p) => <tr key={p._id}><td>{p.ownerId?.name || p.owner?.name || "Provider"}</td><td>{p.month} {p.year}</td><td>{money(p.amount)}</td><td>{p.status}</td></tr>)}</tbody></table></div> : <div className="th-admin-empty">No provider payment records found.</div>}</section>}
      {view === "settings" && <section className="th-admin-content"><h2>Platform settings</h2><p className="th-admin-intro">Manage platform identity and TutorHub payment details.</p><form className="th-admin-form" onSubmit={saveSettings}>{[["platformName","Platform name"],["tagline","Tagline"],["currency","Currency"],["tutorhubBankName","Bank name"],["tutorhubAccountHolder","Account holder"],["tutorhubAccountNumber","Account number"],["tutorhubBranchCode","Branch code"]].map(([key,label]) => <label key={key}>{label}<input value={settings[key] || ""} onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}/></label>)}<button disabled={busy}>Save settings</button></form></section>}
      {view === "password" && <section className="th-admin-content"><h2>Change Super Admin login</h2><p className="th-admin-intro">Update the username and password used to access this workspace.</p><form className="th-admin-form" onSubmit={changePassword}><label>Current password<input type="password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((s) => ({ ...s, currentPassword: e.target.value }))}/></label><label>New username<input required value={passwordForm.newUsername} onChange={(e) => setPasswordForm((s) => ({ ...s, newUsername: e.target.value }))}/></label><label>New password<input type="password" minLength={8} required value={passwordForm.newPassword} onChange={(e) => setPasswordForm((s) => ({ ...s, newPassword: e.target.value }))}/></label><label>Confirm new password<input type="password" minLength={8} required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((s) => ({ ...s, confirmPassword: e.target.value }))}/></label><button disabled={busy}>Update login</button></form></section>}
    </main>
  </div>;
}
