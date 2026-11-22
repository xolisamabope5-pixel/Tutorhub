import { useEffect, useMemo, useState } from "react";
import API_URL from "../api";
import "./Register.css";

export default function Register() {
  const [step, setStep] = useState(1);
  const [providerType, setProviderType] = useState("");
  const [providers, setProviders] = useState([]);
  const [providerId, setProviderId] = useState("");
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [proof, setProof] = useState(null);
  const [form, setForm] = useState({ name: "", surname: "", grade: "", email: "", password: "", confirmPassword: "", subject: "", tuitionOption: "" });

  const api = useMemo(() => API_URL || "http://localhost:5000", []);

  useEffect(() => {
    if (!providerType) return;
    let cancelled = false;
    fetch(`${api}/api/programs/providers?type=${providerType}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setProviders(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setMessage("We could not load providers. Please try again."); });
    return () => { cancelled = true; };
  }, [providerType, api]);

  const chooseProvider = async (id) => {
    setProviderId(id); setProvider(null); setMessage("");
    if (!id) return;
    try {
      const response = await fetch(`${api}/api/programs/providers/${id}/options`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load provider details");
      setProvider(data);
      setForm(prev => ({ ...prev, subject: data.subjects?.[0] || "", tuitionOption: data.tuitionOptions?.[0] || "" }));
      setStep(3);
    } catch (error) { setMessage(error.message); }
  };

  const update = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setMessage("");
    if (form.password !== form.confirmPassword) return setMessage("Your passwords do not match.");
    if (!proof) return setMessage("Please upload your payment proof.");
    if (!provider) return setMessage("Please choose a provider first.");
    setLoading(true);
    try {
      const body = new FormData();
      Object.entries({ name: form.name, surname: form.surname, grade: form.grade, email: form.email, password: form.password, providerType, programId: providerId, subjects: form.subject, tuitionOption: form.tuitionOption }).forEach(([key, value]) => body.append(key, value || ""));
      body.append("paymentProof", proof);
      const response = await fetch(`${api}/api/learners/register`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration could not be submitted.");
      setMessage("Application submitted successfully. Your selected provider will review it and notify you.");
      setStep(4);
    } catch (error) { setMessage(error.message || "Could not connect to TutorHub."); }
    finally { setLoading(false); }
  };

  return <main className="th-register-page">
    <section className="th-register-shell">
      <header className="th-register-header"><div className="th-register-logo">T</div><div><span>TutorHub</span><small>Find the right learning support</small></div></header>
      <div className="th-register-progress"><span className={step >= 1 ? "done" : ""}>1</span><i/><span className={step >= 2 ? "done" : ""}>2</span><i/><span className={step >= 3 ? "done" : ""}>3</span></div>
      {step === 1 && <>
        <p className="th-register-eyebrow">LEARNER REGISTRATION</p><h1>Let's get you started.</h1><p className="th-register-muted">Just a few details to help you find the right tuition provider.</p>
        <form onSubmit={e => { e.preventDefault(); setStep(2); }} className="th-register-form">
          <div className="th-register-grid"><label>Name<input required name="name" value={form.name} onChange={update} placeholder="Your name"/></label><label>Surname<input required name="surname" value={form.surname} onChange={update} placeholder="Your surname"/></label></div>
          <label>Current grade<select required name="grade" value={form.grade} onChange={update}><option value="">Choose your grade</option>{["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12","Adult learner"].map(g=><option key={g}>{g}</option>)}</select></label>
          <label>Email address<input required type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com"/></label>
          <div className="th-register-grid"><label>Password<input required minLength="8" type="password" name="password" value={form.password} onChange={update} placeholder="At least 8 characters"/></label><label>Confirm password<input required type="password" name="confirmPassword" value={form.confirmPassword} onChange={update} placeholder="Repeat password"/></label></div>
          <button className="th-register-primary">Continue <span>→</span></button>
        </form>
      </>}
      {step === 2 && <>
        <p className="th-register-eyebrow">CHOOSE YOUR PROVIDER</p><h1>Who would you like to learn with?</h1><p className="th-register-muted">Choose the type of provider you want to join. You can browse the available options next.</p>
        <div className="th-provider-type-grid"><button onClick={()=>{setProviderType("tuition-centre");setProviderId("");setProvider(null);}} className={providerType === "tuition-centre" ? "selected" : ""}><span className="th-provider-icon">▦</span><strong>Tuition Centre</strong><small>Join an organised tuition centre with its own tutors and classes.</small></button><button onClick={()=>{setProviderType("private-tutor");setProviderId("");setProvider(null);}} className={providerType === "private-tutor" ? "selected" : ""}><span className="th-provider-icon">♙</span><strong>Private Tutor</strong><small>Learn directly with an independent private tutor.</small></button></div>
        {providerType && <div className="th-provider-list"><label>Available {providerType === "tuition-centre" ? "tuition centres" : "private tutors"}<select value={providerId} onChange={e=>chooseProvider(e.target.value)}><option value="">Select a provider</option>{providers.map(p=><option key={p._id} value={p._id}>{p.name}{p.location ? ` — ${p.location}` : ""}</option>)}</select></label>{providers.length === 0 && <small>No approved providers are currently listed in this category.</small>}</div>}
        <button className="th-register-back" onClick={()=>setStep(1)}>← Back</button>
      </>}
      {step === 3 && provider && <>
        <p className="th-register-eyebrow">YOUR SELECTED PROVIDER</p><h1>{provider.name}</h1><p className="th-register-muted">Review the available options and payment details before submitting your application.</p>
        <div className="th-provider-summary"><span>{provider.providerType === "private-tutor" ? "PRIVATE TUTOR" : "TUITION CENTRE"}</span>{provider.location && <p>{provider.location}</p>}{provider.description && <p>{provider.description}</p>}</div>
        <form onSubmit={submit} className="th-register-form">
          {provider.subjects?.length > 0 && <label>Choose subject<select name="subject" value={form.subject} onChange={update}>{provider.subjects.map(s=><option key={s} value={s}>{s}</option>)}</select></label>}
          {provider.tuitionOptions?.length > 0 && <label>Tuition option<select name="tuitionOption" value={form.tuitionOption} onChange={update}>{provider.tuitionOptions.map(s=><option key={s} value={s}>{s}</option>)}</select></label>}
          {provider.monthlyFee > 0 && <div className="th-provider-fee"><small>Provider's listed monthly fee</small><strong>R{Number(provider.monthlyFee).toFixed(2)}</strong></div>}
          <div className="th-provider-bank"><h3>Payment details</h3><p><span>Bank</span><strong>{provider.bankName || "Contact provider"}</strong></p><p><span>Account holder</span><strong>{provider.accountHolder || "Contact provider"}</strong></p><p><span>Account number</span><strong>{provider.accountNumber || "Contact provider"}</strong></p>{provider.branchCode && <p><span>Branch code</span><strong>{provider.branchCode}</strong></p>}</div>
          <label>Upload payment proof (PDF, JPG or PNG)<input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e=>setProof(e.target.files?.[0] || null)}/></label>
          <button disabled={loading} className="th-register-primary">{loading ? "Submitting application…" : "Submit application"}</button>
        </form><button className="th-register-back" onClick={()=>setStep(2)}>← Choose another provider</button>
      </>}
      {step === 4 && <div className="th-register-success"><div>✓</div><h1>Application submitted</h1><p>{message}</p><p className="th-register-muted">Your provider will review your application and payment proof. You can sign in using your email address once your application is approved.</p></div>}
      {message && step !== 4 && <div className="th-register-message" role="alert">{message}</div>}
    </section>
  </main>;
}
