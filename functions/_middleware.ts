/**
 * Global CORS Middleware & Auth Core Browser Request Router for Cloudflare Pages Functions
 */

import { validateFileSizeConfig } from "./api/storage/config/fileSizeLimits";
import { getAuthInstance } from "./lib/auth";
import { getCorsHeaders } from "./lib/cors";
import type { PagesFunction } from "./lib/types";

// Validate file size configuration at worker initialization
try {
  validateFileSizeConfig();
  console.log("✅ [Backend] File size configuration validated successfully");
} catch (error) {
  console.error("❌ [Backend] File size configuration validation failed:", error);
  throw error;
}

export const onRequest: PagesFunction = async (context) => {
  const origin = context.request.headers.get("Origin");

  // Handle CORS preflight requests
  if (context.request.method === "OPTIONS") {
    const corsHeaders = getCorsHeaders(origin);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const url = new URL(context.request.url);
  let path = url.pathname;

  if (path.endsWith("/") && path.length > 1) {
    path = path.slice(0, -1);
  }

  // --- Delegate Browser Auth Routes to Auth Core ---
  if (
    context.env.SSO_SERVICE &&
    (path.startsWith("/api/auth/") || path.startsWith("/api/v1/auth/")) &&
    path !== "/api/auth/generate-lte-code" &&
    path !== "/api/v1/auth/generate-lte-code"
  ) {
    try {
      const auth = getAuthInstance(context.env);
      return await auth.handleBrowserRequest(context.request);
    } catch (err) {
      console.error("[Middleware] Auth Core browser route handling error:", err);
    }
  }

  // --- Edge-Level Auth Guard ---
  const exactGuestRoutes = ["/login", "/signup", "/forgot-password", "/internal-testing"];
  const isGuestRoute =
    exactGuestRoutes.includes(path) ||
    path.startsWith("/login/") ||
    path.startsWith("/signup/") ||
    path.startsWith("/signin/") ||
    path.startsWith("/register/");

  if (isGuestRoute && context.env.SSO_SERVICE) {
    const cookieHeader = context.request.headers.get("Cookie");
    let refreshToken = null;

    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)__Host-rm-refresh=([^;]+)/) ||
                    cookieHeader.match(/(?:^|;\s*)rm_sso_session=([^;]+)/);
      if (match) refreshToken = match[1];
    }

    if (refreshToken && typeof (context.env.SSO_SERVICE as any).validateSession === "function") {
      try {
        const { valid, roles } = await (context.env.SSO_SERVICE as any).validateSession(refreshToken);

        if (valid && roles.length > 0) {
          const rawReturnUrl = url.searchParams.get("returnUrl") || url.searchParams.get("redirect");
          let targetPath: string | null = null;

          if (
            rawReturnUrl &&
            rawReturnUrl.startsWith("/") &&
            !rawReturnUrl.startsWith("//") &&
            !rawReturnUrl.includes("://")
          ) {
            const returnNormalized = rawReturnUrl.split("?")[0];
            const isGuestReturn =
              exactGuestRoutes.includes(returnNormalized) ||
              returnNormalized.startsWith("/signup/") ||
              returnNormalized.startsWith("/signin/") ||
              returnNormalized.startsWith("/register/") ||
              returnNormalized.startsWith("/login");
            if (!isGuestReturn) {
              targetPath = rawReturnUrl;
            }
          }

          if (!targetPath) {
            const EDGE_ROLE_DASHBOARD_MAP: Record<string, string> = {
              learner: "/learner/dashboard",
              educator: "/educator/dashboard",
              school_educator: "/educator/dashboard",
              college_educator: "/educator/dashboard",
              college_admin: "/college-admin/dashboard",
              school_admin: "/school-admin/dashboard",
              university_admin: "/university-admin/dashboard",
              recruiter: "/recruitment/overview",
              hr: "/recruitment/overview",
              company_admin: "/recruitment/overview",
              admin: "/",
              owner: "/",
            };
            const primaryRole = roles[0] ?? "learner";
            targetPath = EDGE_ROLE_DASHBOARD_MAP[primaryRole] ?? "/";
          }

          return Response.redirect(new URL(targetPath, url.origin).toString(), 302);
        }
      } catch (err) {
        console.error("[Edge Guard] Session validation failed:", err);
      }
    }
  }

  const response = await context.next();

  if (response.status === 101) {
    return response;
  }

  const corsHeaders = getCorsHeaders(origin);
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
