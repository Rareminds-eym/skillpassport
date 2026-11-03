import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import CertificateVerify from "../../pages/verify/CertificateVerify";
const id = "LTE-0123456789ABCDEF";
function mount(credentialId = id) { return render(<MemoryRouter initialEntries={[`/verify/${credentialId}`]}><Routes><Route path="/verify/:credentialId" element={<CertificateVerify />} /></Routes></MemoryRouter>); }
beforeEach(() => { vi.stubEnv("VITE_LTE_APP_URL", "https://lte.test"); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it.each(["valid", "revoked", "not_found"])("renders the public %s state without login", async status => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status, credentialId: id, issuer: "Rareminds LTE", learnerName: "Ada", title: "Problem solving", subtitle: "Engineering", levelLabel: "Level 1", badge: "skilled", completionDate: "2026-10-08T00:00:00Z", issuedAt: "2026-10-08T00:00:00Z", revokedAt: "2026-10-09T00:00:00Z" }) }); vi.stubGlobal("fetch", fetcher);
  mount(); const labels = { valid: "Verified achievement", revoked: "Certificate revoked", not_found: "Certificate not found" };
  expect(await screen.findByRole("heading", { name: labels[status] })).toBeInTheDocument();
  expect(document.querySelector('meta[name="robots"]').content).toContain("noindex");
  expect(fetcher).toHaveBeenCalledWith(`https://lte.test/api/v1/public/certificates/${id}`, expect.objectContaining({ credentials: "omit" }));
  if (status !== "valid") expect(screen.queryByText("Ada")).not.toBeInTheDocument();
});
it("rejects malformed IDs without a network call", async () => { const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher); mount("bad"); expect(await screen.findByText("Invalid credential ID")).toBeInTheDocument(); expect(fetcher).not.toHaveBeenCalled(); });
it("shows a retry action for network failures", async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error("Network")); vi.stubGlobal("fetch", fetcher); mount();
  fireEvent.click(await screen.findByRole("button", { name: "Try again" })); await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
});
it("fails closed on malformed issuer responses", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "valid" }) })); mount(); expect(await screen.findByText("Verification unavailable")).toBeInTheDocument(); });
it("removes page-only browser state when the page unmounts", () => { vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {}))); const view = mount(); expect(document.body).toHaveClass("hide-zoho-widget"); view.unmount(); expect(document.querySelector('meta[name="robots"]')).toBeNull(); expect(document.body).not.toHaveClass("hide-zoho-widget"); });
