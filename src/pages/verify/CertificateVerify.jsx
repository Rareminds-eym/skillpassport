import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { BadgeCheck, AlertCircle, SearchX } from "lucide-react";

const credentialPattern = /^LTE-[0-9A-HJKMNP-TV-Z]{16}$/;
const responseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("valid"), credentialId: z.string(), issuer: z.literal("Rareminds LTE"), learnerName: z.string(), title: z.string(), subtitle: z.string().nullable(), levelLabel: z.string().nullable(), badge: z.string().nullable(), completionDate: z.string().datetime({ offset: true }), issuedAt: z.string().datetime({ offset: true }) }),
  z.object({ status: z.literal("revoked"), credentialId: z.string(), issuer: z.literal("Rareminds LTE"), revokedAt: z.string().datetime({ offset: true }).nullable() }),
  z.object({ status: z.literal("not_found"), credentialId: z.string(), issuer: z.literal("Rareminds LTE") }),
]);
const date = value => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export default function CertificateVerify() {
  const { credentialId = "" } = useParams();
  const [result, setResult] = useState({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    document.body.classList.add("hide-zoho-widget");
    return () => document.body.classList.remove("hide-zoho-widget");
  }, []);
  useEffect(() => {
    const existing = document.head.querySelector('meta[name="robots"]');
    const previous = existing?.getAttribute("content");
    const meta = existing ?? document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex, nofollow");
    if (!existing) document.head.append(meta);
    return () => { if (existing) { if (previous === null) meta.removeAttribute("content"); else meta.setAttribute("content", previous); } else meta.remove(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    if (!credentialPattern.test(credentialId)) { setResult({ status: "malformed" }); return () => controller.abort(); }
    setResult({ status: "loading" });
    let active = true;
    const timer = setTimeout(() => controller.abort(), 15_000);
    const load = async () => {
      try {
        const base = import.meta.env.VITE_LTE_APP_URL;
        if (!base) throw new Error("Verification API is not configured");
        const response = await fetch(`${base.replace(/\/+$/, "")}/api/v1/public/certificates/${encodeURIComponent(credentialId)}`, { signal: controller.signal, credentials: "omit" });
        if (!response.ok) throw new Error("Verification unavailable");
        const data = responseSchema.parse(await response.json());
        if (data.credentialId !== credentialId) throw new Error("Credential mismatch");
        if (active) setResult(data);
      } catch { if (active) setResult({ status: "error" }); }
      finally { clearTimeout(timer); }
    };
    void load();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [credentialId, attempt]);
  const status = result.status;
  const headings = { loading: "Checking certificate…", valid: "Verified achievement", revoked: "Certificate revoked", not_found: "Certificate not found", malformed: "Invalid credential ID", error: "Verification unavailable" };
  const Icon = status === "valid" ? BadgeCheck : status === "not_found" ? SearchX : AlertCircle;
  return <div className="min-h-screen bg-slate-50 px-5 py-16 sm:py-24"><section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">SkillPassport · Certificate verification</p>
    <div className="mt-8 flex items-center gap-3"><Icon aria-hidden="true" className={status === "valid" ? "h-8 w-8 text-emerald-700" : "h-8 w-8 text-slate-600"} /><h1 className="text-3xl font-semibold text-slate-900" aria-live="polite">{headings[status]}</h1></div>
    {status === "loading" && <p role="status" className="mt-6 animate-pulse text-slate-600">Checking the issuer’s official record.</p>}
    {status === "valid" && <><p className="mt-8 text-sm text-slate-500">Issued by {result.issuer}</p><h2 className="mt-2 break-words font-serif text-4xl text-slate-900">{result.learnerName}</h2><p className="mt-6 text-xl font-medium text-slate-800">{result.title}</p><p className="mt-2 text-slate-600">{result.subtitle}</p><dl className="mt-8 grid grid-cols-2 gap-6 border-t border-slate-200 pt-6">{[["Level", result.levelLabel], ["Badge", result.badge], ["Completed", date(result.completionDate)], ["Issued", date(result.issuedAt)]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-800">{value}</dd></div>)}</dl></>}
    {status === "revoked" && <p className="mt-6 text-slate-600">This credential is no longer valid.{result.revokedAt && ` Revoked on ${date(result.revokedAt)}.`}</p>}
    {status === "not_found" && <p className="mt-6 text-slate-600">No issued certificate matches this credential ID. Check the link with the person who shared it.</p>}
    {status === "malformed" && <p className="mt-6 text-slate-600">This link does not contain a valid LTE credential ID.</p>}
    {status === "error" && <div className="mt-6"><p className="text-slate-600">We couldn’t reach the issuer. Please try again.</p><button type="button" className="mt-4 rounded-lg bg-slate-900 px-5 py-3 font-medium text-white" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
    <p className="mt-10 break-all border-t border-slate-200 pt-5 font-mono text-xs text-slate-500">{credentialId}</p>
  </section></div>;
}
