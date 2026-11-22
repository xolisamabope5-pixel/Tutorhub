import { useEffect, useMemo, useState } from "react";
import API_URL from "../api";

const centreTiers = [
  { max: 15, fee: 300 },
  { max: 30, fee: 600 },
  { max: 60, fee: 1000 },
  { max: 90, fee: 1500 }
];

function getFee(type, count) {
  if (type === "private-tutor") return { fee: 150, custom: false, label: "Independent private tutor" };
  const tier = centreTiers.find((item) => count > 0 && count <= item.max);
  if (!tier) return { fee: null, custom: count > 90, label: count > 90 ? "Custom quote required for more than 90 learners" : "Enter your learner count" };
  return { fee: tier.fee, custom: false, label: `Up to ${tier.max} learners` };
}

export default function TutorRegister() {
  const [form, setForm] = useState({ name: "", surname: "", providerType: "tuition-centre", programName: "", expectedLearners: "", programId: "", email: "", password: "", confirmPassword: "" });
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [activeCentres, setActiveCentres] = useState([]);

  const quote = useMemo(() => getFee(form.providerType, Number(form.expectedLearners || 0)), [form.providerType, form.expectedLearners]);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/platform-settings/owner-payment-details`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (active) setPaymentDetails(data); })
      .catch(() => {});
    fetch(`${API_URL}/api/tutors/active-centres`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (active) setActiveCentres(Array.isArray(data) ? data : []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage("");
  };

  const selectProof = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) { setProof(null); return; }
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) { setMessage("Payment proof must be a PDF, JPG or PNG."); event.target.value = ""; setProof(null); return; }
    if (file.size > 5 * 1024 * 1024) { setMessage("Payment proof must be 5 MB or smaller."); event.target.value = ""; setProof(null); return; }
    setProof(file); setMessage("");
  };

  const submit = async (event) => {
    event.preventDefault(); setMessage(""); setSuccess(false);
    if (form.password.length < 8) return setMessage("Use a password with at least 8 characters.");
    if (form.password !== form.confirmPassword) return setMessage("Your passwords do not match.");
    if (form.providerType === "centre-tutor") {
      if (!form.programId) return setMessage("Choose the tuition centre you work with.");
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/tutors/register-centre-tutor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name.trim(), surname: form.surname.trim(), email: form.email.trim().toLowerCase(), password: form.password, programId: form.programId }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Registration failed.");
        setSuccess(true); setMessage(data.message || "Your application has been submitted.");
      } catch (error) { setMessage(error.message || "Could not connect to TutorHub."); }
      finally { setLoading(false); }
      return;
    }
    if (form.providerType === "tuition-centre" && !form.programName.trim()) return setMessage("Enter your tuition centre name.");
    if (form.providerType === "tuition-centre" && (!Number.isInteger(Number(form.expectedLearners)) || Number(form.expectedLearners) < 1)) return setMessage("Enter the number of learners your centre is bringing.");
    if (!quote.custom && !proof) return setMessage("Upload your TutorHub proof of payment.");

    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("surname", form.surname.trim());
    payload.append("email", form.email.trim().toLowerCase());
    payload.append("password", form.password);
    payload.append("providerType", form.providerType);
    payload.append("role", "owner");
    payload.append("programName", form.providerType === "tuition-centre" ? form.programName.trim() : `${form.name.trim()} ${form.surname.trim()} - Private Tutor`);
    payload.append("expectedLearners", form.expectedLearners || "0");
    if (proof) payload.append("paymentProof", proof);

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/tutors/register`, { method: "POST", body: payload });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed.");
      setSuccess(true); setMessage(data.message || "Your application has been submitted.");
      setProof(null);
    } catch (error) {
      setMessage(error.message || "Could not connect to TutorHub.");
    } finally { setLoading(false); }
  };

  const field = { width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #d7deea", borderRadius: 10, fontSize: 15, background: "#fff" };
  const label = { display: "grid", gap: 7, color: "#27334a", fontWeight: 600, fontSize: 14 };
  const panel = { background: "#f7f9fd", border: "1px solid #e1e7f0", borderRadius: 14, padding: 18, marginTop: 16 };

  return <main style={{ minHeight: "100vh", background: "#f3f6fb", padding: "38px 16px", color: "#17233b" }}>
    <section style={{ maxWidth: 680, margin: "0 auto", background: "#fff", borderRadius: 20, padding: "clamp(22px, 5vw, 42px)", boxShadow: "0 16px 45px rgba(24,45,82,.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}><div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 12, background: "#102d59", color: "white", fontWeight: 800, fontSize: 23 }}>T</div><div><strong style={{ display: "block", fontSize: 19 }}>TutorHub</strong><small style={{ color: "#71809a" }}>Provider registration</small></div></div>
      {success ? <div style={{ textAlign: "center", padding: "34px 8px" }}><div style={{ fontSize: 42, color: "#168451" }}>✓</div><h1 style={{ marginBottom: 8 }}>Application received</h1><p style={{ color: "#64728a", lineHeight: 1.6 }}>{message}</p><p style={{ color: "#64728a" }}>{form.providerType === "centre-tutor" ? "Your application is sent to the tuition centre owner. You can sign in after the owner approves it." : "Your application will appear in Super Admin for review. You can sign in after TutorHub approves your provider account."}</p></div> : <>
        <p style={{ color: "#1b66a5", fontWeight: 800, letterSpacing: 1.3, fontSize: 11 }}>JOIN TUTORHUB</p><h1 style={{ margin: "8px 0", fontSize: "clamp(27px, 5vw, 36px)" }}>Register as a provider</h1><p style={{ color: "#687790", lineHeight: 1.6, marginTop: 0 }}>Create your provider login, choose your provider type and submit your TutorHub subscription payment proof.</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 15 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}><label style={label}>Name<input style={field} name="name" value={form.name} onChange={update} required autoComplete="given-name" /></label><label style={label}>Surname<input style={field} name="surname" value={form.surname} onChange={update} required autoComplete="family-name" /></label></div>
          <label style={label}>I am registering as<select style={field} name="providerType" value={form.providerType} onChange={update}><option value="tuition-centre">Tuition Centre</option><option value="private-tutor">Private Tutor</option><option value="centre-tutor">Tutor Under Tuition Centre</option></select></label>
          {form.providerType === "centre-tutor" && <div style={panel}><h3 style={{ margin: "0 0 12px" }}>Choose your tuition centre</h3><label style={label}>Tuition centre<select style={field} name="programId" value={form.programId} onChange={update} required><option value="">Select the centre you work with</option>{activeCentres.map((centre) => <option key={centre._id} value={centre._id}>{centre.name}{centre.location ? ` — ${centre.location}` : ""}</option>)}</select></label>{activeCentres.length === 0 && <small style={{ color: "#a15b13", display: "block", marginTop: 8 }}>No active tuition centres are currently available for applications.</small>}<p style={{ color: "#687790", lineHeight: 1.5, marginBottom: 0 }}>Your application will be sent to the centre owner. You can sign in only after the owner approves you. No separate TutorHub provider subscription is charged to centre tutors.</p></div>}
          {form.providerType === "tuition-centre" && <div style={panel}><h3 style={{ margin: "0 0 14px" }}>Tuition centre details</h3><label style={label}>Tuition centre name<input style={field} name="programName" value={form.programName} onChange={update} required placeholder="Enter your tuition centre name" /></label><label style={{ ...label, marginTop: 14 }}>Number of learners you are bringing<input style={field} type="number" min="1" max="10000" name="expectedLearners" value={form.expectedLearners} onChange={update} required placeholder="e.g. 25" /></label></div>}
          {form.providerType !== "centre-tutor" && <><div style={panel}><div style={{ color: "#1b66a5", fontWeight: 800, fontSize: 11, letterSpacing: 1 }}>TUTORHUB SUBSCRIPTION</div><h2 style={{ margin: "8px 0 4px", fontSize: 28 }}>{quote.custom ? "Custom quote" : quote.fee === null ? "Price shown here" : `R${quote.fee.toLocaleString("en-ZA")}`}</h2><p style={{ color: "#687790", margin: 0 }}>{form.providerType === "private-tutor" ? "Private tutor monthly subscription" : quote.label}{!quote.custom && quote.fee !== null ? " · per month" : ""}</p>{form.providerType === "tuition-centre" && <small style={{ display: "block", color: "#687790", marginTop: 8 }}>1–15 learners: R300 · 16–30: R600 · 31–60: R1,000 · 61–90: R1,500. More than 90 learners: custom quote from TutorHub.</small>}{quote.custom && <p style={{ color: "#8b5a12", marginBottom: 0 }}>Submit your application first. TutorHub will contact you with the agreed amount and payment instructions.</p>}</div>
          <div style={panel}><h3 style={{ margin: "0 0 12px" }}>Payment to TutorHub</h3>{paymentDetails ? <div style={{ display: "grid", gap: 7, color: "#4e5d75", fontSize: 14 }}><div><b>Bank:</b> {paymentDetails.tutorhubBankName || "Not configured"}</div><div><b>Account holder:</b> {paymentDetails.tutorhubAccountHolder || "Not configured"}</div><div><b>Account number:</b> {paymentDetails.tutorhubAccountNumber || "Not configured"}</div><div><b>Branch code:</b> {paymentDetails.tutorhubBranchCode || "Not configured"}</div></div> : <p style={{ color: "#687790" }}>Payment details will be displayed here when configured by TutorHub.</p>}<label style={{ ...label, marginTop: 16 }}>Proof of payment {quote.custom ? "(upload after TutorHub confirms your quote)" : "(required)"}<input style={{ ...field, padding: 10 }} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={selectProof} required={!quote.custom} /></label>{proof && <small style={{ color: "#168451" }}>Selected: {proof.name}</small>}<small style={{ display: "block", color: "#7b879a", marginTop: 8 }}>PDF, JPG or PNG · Maximum 5 MB.</small></div>
          </>}
          <label style={label}>Email address<input style={field} type="email" name="email" value={form.email} onChange={update} required autoComplete="email" placeholder="you@example.com" /></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}><label style={label}>Create password<input style={field} type="password" name="password" value={form.password} onChange={update} minLength={8} required autoComplete="new-password" /></label><label style={label}>Confirm password<input style={field} type="password" name="confirmPassword" value={form.confirmPassword} onChange={update} minLength={8} required autoComplete="new-password" /></label></div>
          {message && <div role="alert" style={{ background: success ? "#eaf8f0" : "#fff0f0", color: success ? "#176a42" : "#a12b2b", borderRadius: 10, padding: 12, lineHeight: 1.5 }}>{message}</div>}
          <button disabled={loading} type="submit" style={{ border: 0, borderRadius: 11, padding: 15, background: "#102d59", color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "wait" : "pointer", opacity: loading ? .7 : 1 }}>{loading ? "Submitting application…" : "Submit provider application"}</button>
        </form>
      </>}
    </section>
  </main>;
}
