import { z } from "zod";
import type { GatewayAction } from "../types";
import { handleLearningTrack } from "./learning-track";

const schema = z.object({
  userId: z.string().uuid(),
  roleIds: z.array(z.string().uuid()).min(1).max(100),
});
const tracksSchema = z.object({
  tracks: z.array(z.object({ roleId: z.string().optional() })).optional(),
  track: z.object({ roleId: z.string().optional() }).optional(),
});

/** Read-only catalogue action bound to the caller's assessment recommendations. */
export const handleCatalogue: GatewayAction = async (ctx, payload) => {
  const parsed = schema.safeParse(payload);
  if (!parsed.success)
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid catalogue scope" },
    };
  if (parsed.data.userId !== ctx.userId)
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: "User mismatch" },
    };
  const assessment = await handleLearningTrack(ctx, { userId: ctx.userId });
  if (!assessment.ok) return assessment;
  const tracks = tracksSchema.parse(assessment.data);
  const allowed = new Set(
    (tracks.tracks || (tracks.track ? [tracks.track] : [])).map(
      (track) => track.roleId,
    ),
  );
  if (parsed.data.roleIds.some((id) => !allowed.has(id)))
    return {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Role is not recommended for this learner",
      },
    };
  const secret = ctx.env.LTE_CATALOG_SYNC_SECRET;
  if (!ctx.env.SP_DASH_CATALOG_URL || !secret || secret.length < 32)
    return {
      ok: false,
      error: {
        code: "CATALOGUE_UNAVAILABLE",
        message: "Managed catalogue source is not configured",
      },
    };
  const url = new URL("/api/internal/lte/catalog", ctx.env.SP_DASH_CATALOG_URL);
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new Error("Catalogue source requires HTTPS");
  const body = JSON.stringify({ roleIds: [...new Set(parsed.data.roleIds)] });
  const timestamp = String(Date.now());
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(
      `POST\n/api/internal/lte/catalog\n${timestamp}\n${body}`,
    ),
  );
  const response = await fetch(url, {
    method: "POST",
    redirect: "error",
    headers: {
      "Content-Type": "application/json",
      "x-lte-timestamp": timestamp,
      "x-lte-signature": Array.from(new Uint8Array(signature), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join(""),
    },
    body,
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok)
    return {
      ok: false,
      error: {
        code: "CATALOGUE_UNAVAILABLE",
        message: "Managed catalogue source is unavailable",
      },
    };
  const raw = await response.text();
  if (raw.length > 20000000) throw new Error("Catalogue response too large");
  return { ok: true, data: JSON.parse(raw) };
};
