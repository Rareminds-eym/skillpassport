import { apiError } from "../../lib/response";
import { createRefreshCookie } from "../../lib/cookies";
import { ssoGenerateAuthorizationCode } from "../../lib/sso-client";
import { getCorsHeaders, handleCorsPreflightRequest } from "../../lib/cors";
import type { Env } from "../../lib/types";

interface SilentSsoResponse {
  redirectUrl: string;
  codeExpiresAt: string | null;
}

const LTE_CALLBACK_PATH = "/auth/callback";
const DEFAULT_LTE_APP_URL = "http://127.0.0.1:8789";

function getLteAppUrl(env: Env): string {
  const configuredUrl = env.LTE_APP_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }
  return DEFAULT_LTE_APP_URL;
}

function buildRedirectUrl(lteAppUrl: string, code: string, state: string): string {
  const url = new URL(`${lteAppUrl}${LTE_CALLBACK_PATH}`);
  url.searchParams.set("code", code);
  url.searchParams.set("state", state);
  return url.toString();
}

function normalizeExpiry(expiresAt?: string, codeExpiresAt?: string): string | null {
  return codeExpiresAt ?? expiresAt ?? null;
}

export async function onRequestOptions(context: { request: Request }): Promise<Response> {
  return handleCorsPreflightRequest(context.request);
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const origin = request.headers.get("Origin") ?? null;
  const cors = getCorsHeaders(origin);

  // 1. Extract refresh token from cookie
  let refreshToken: string | undefined;
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const refreshCookie = cookies.find((c) => c.startsWith("refresh_token="));
    if (refreshCookie) {
      refreshToken = refreshCookie.substring("refresh_token=".length);
    }
  }

  if (!refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized", code: "MISSING_REFRESH_TOKEN" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const ip = request.headers.get("CF-Connecting-IP") || undefined;
  const ua = request.headers.get("User-Agent") || undefined;

  try {
    const ssoService = env.SSO_SERVICE as any;

    // 2. Validate session and get fresh access token from sso-worker
    const result = await ssoService.refreshSession(refreshToken, ip, ua);
    if (!result.access_token) {
      return new Response(JSON.stringify({ error: "Session validation failed", code: "REFRESH_FAILED" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // 3. Generate authorization code for LTE
    const lteAppUrl = getLteAppUrl(env);
    const redirectUri = `${lteAppUrl}${LTE_CALLBACK_PATH}`;

    const codeResult = await ssoGenerateAuthorizationCode(env, {
      accessToken: result.access_token,
      targetApp: "lte",
      redirectUri,
      ip,
      ua,
    });

    if (!codeResult.code || !codeResult.state) {
      return new Response(
        JSON.stringify({ error: "Failed to generate auth code", code: "SSO_CODE_GENERATION_FAILED" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...cors },
        },
      );
    }

    // 4. Return new tokens & redirect URI
    const responseData: SilentSsoResponse = {
      redirectUrl: codeResult.redirectUrl ?? buildRedirectUrl(lteAppUrl, codeResult.code, codeResult.state),
      codeExpiresAt: normalizeExpiry(codeResult.expiresAt, codeResult.codeExpiresAt),
    };

    const headers = new Headers({
      "Content-Type": "application/json",
      ...cors,
    });

    // Set updated refresh_token cookie back on SkillPassport's domain
    if (result.refresh_token) {
      headers.append("Set-Cookie", createRefreshCookie(result.refresh_token, request, env));
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error("[Silent SSO] Error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal server error", code: "SERVER_ERROR" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }
}
