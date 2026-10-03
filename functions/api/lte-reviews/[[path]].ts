import { withAuth } from "../../lib/auth";

const UUID = "[0-9a-fA-F-]{36}";
const readRoute = new RegExp(
  `^(queue|stats|operations|operations/scopes|operations/${UUID}|${UUID}|${UUID}/files/${UUID}/download)$`,
);
const writeRoute = new RegExp(
  `^(${UUID}/(start|complete|return)|operations/${UUID}/reassign)$`,
);

export const onRequest = withAuth(async (context) => {
  const { request, env } = context;
  if (env.HUMAN_REVIEW_AVAILABLE !== "true")
    return new Response("Not found", { status: 404 });
  if (context.data.user.membership_status !== "active")
    return new Response("Forbidden", { status: 403 });
  const source = new URL(request.url);
  const path = source.pathname.replace(/^\/api\/lte-reviews\//, "");
  if (
    !(request.method === "GET" && readRoute.test(path)) &&
    !(request.method === "POST" && writeRoute.test(path))
  ) {
    return new Response("Not found", { status: 404 });
  }
  const base = new URL(env.LTE_APP_URL);
  if (
    base.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(base.hostname)
  )
    return new Response("Upstream misconfigured", { status: 503 });
  const target = new URL(`/api/v1/reviews/${path}`, base);
  target.search = source.search;
  const headers = new Headers();
  for (const name of [
    "Authorization",
    "Content-Type",
    "Idempotency-Key",
    "X-Request-ID",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Browser origin/CSRF are validated by SkillPassport auth. The upstream is a
  // fixed server-to-server request using the original verified bearer token.
  headers.set("X-RM-CSRF", "1");
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "POST" ? request.body : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
      duplex: "half",
    } as RequestInit);
    if (upstream.status >= 300 && upstream.status < 400)
      return new Response("Unexpected upstream redirect", { status: 502 });
    const responseHeaders = new Headers();
    for (const name of [
      "Content-Type",
      "Content-Disposition",
      "Content-Length",
      "Retry-After",
      "X-Request-ID",
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set("Cache-Control", "private, no-store");
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        error: {
          code: "REVIEW_UPSTREAM_UNAVAILABLE",
          message:
            "Review service unavailable. Retry using the same submission.",
        },
      },
      { status: 503 },
    );
  }
});
