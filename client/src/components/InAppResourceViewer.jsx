import { useEffect, useState } from "react";
import API_URL from "../api";

const resolveResourceUrl = value => {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^(https?:|blob:|data:)/i.test(raw)) return raw;
  const path = raw.replace(/^\.\//, "").replace(/^\//, "");
  // Files stored by the Express upload service live on the API host, not the Vite host.
  if (path.startsWith("uploads/") || path.startsWith("api/")) return `${API_URL}/${path}`;
  // Cloudinary/public storage keys are normally absolute; retain other app-relative URLs.
  return `${API_URL}/${path}`;
};

export default function InAppResourceViewer() {
  const [resource, setResource] = useState(null);
  useEffect(() => {
    const open = event => {
      const detail = event.detail || {};
      if (detail.url) setResource({ url: resolveResourceUrl(detail.url), title: detail.title || "TutorHub document" });
    };
    const intercept = event => {
      const anchor = event.target?.closest?.('a[target="_blank"]');
      if (!anchor) return;
      const raw = anchor.getAttribute("href") || anchor.href;
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:")) return;
      event.preventDefault();
      event.stopPropagation();
      setResource({ url: resolveResourceUrl(raw), title: anchor.getAttribute("aria-label") || anchor.textContent?.trim() || "TutorHub document" });
    };
    window.addEventListener("tutorhub:open-resource", open);
    document.addEventListener("click", intercept, true);
    return () => {
      window.removeEventListener("tutorhub:open-resource", open);
      document.removeEventListener("click", intercept, true);
    };
  }, []);
  if (!resource) return null;
  return <div style={{ position: "fixed", inset: 0, zIndex: 5000, background: "#020617ed", display: "flex", flexDirection: "column", padding: 14 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, color: "white", padding: "4px 2px 12px" }}>
      <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resource.title}</strong>
      <div style={{ display: "flex", gap: 8 }}><a href={resource.url} download target="_blank" rel="noreferrer" style={{ color: "white", padding: "8px 12px" }}>Download</a><button onClick={() => setResource(null)} style={{ border: 0, borderRadius: 8, padding: "9px 14px", cursor: "pointer", flexShrink: 0 }}>Close ✕</button></div>
    </div>
    <iframe title={resource.title} src={resource.url} allow="fullscreen; autoplay; clipboard-write" allowFullScreen style={{ width: "100%", flex: 1, minHeight: 0, border: 0, borderRadius: 10, background: "white" }} />
  </div>;
}
