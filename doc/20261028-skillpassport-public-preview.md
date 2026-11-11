# Skillpassport-only generated public preview

Run inside `skillpassport`:

```powershell
npm run preview:public
```

This builds the frontend and runs a Cloudflare Quick Tunnel, the SSO supporting
worker stack, and Skillpassport Pages on 8788. LTE is not started. No domain,
DNS changes, Cloudflare tunnel login, or tunnel certificate is needed.

If the current build is already up to date:

```powershell
npm run pages:dev:public
```

The launcher prints `PUBLIC PREVIEW: https://....trycloudflare.com`.
Wait for Pages to report Ready before opening or sharing that URL.
The URL changes on each launch and stops working when the tunnel stops.

## Preparation

- Install cloudflared and the existing project dependencies.
- Keep local Supabase instances running with required schemas, demo accounts,
  educator/learner mappings, and entitlements. This launcher never resets data.
- Both skillpassport/.dev.vars and sso-worker/.dev.vars must use ENVIRONMENT=local.
- Check Wrangler authentication for remote Workers AI bindings.
- Stop previous SSO and Pages sessions on 8787/8788 before launching. The launcher
  refuses to replace an existing process, and does not start duplicate workers.

## Authentication

The launcher reads the generated URL, writes the exact DEV_PUBLIC_ORIGIN and
APP_URL to the ignored Skillpassport .dev.vars, and updates SSO's local
SKILLPASSPORT_URL, ALLOWED_ORIGINS, and ALLOWED_APP_URLS before starting servers.
On a later run it removes the previous managed preview origin from SSO's lists.
It preserves localhost access, other configuration, and secrets. Production
approved origins are unchanged. Stop with Ctrl+C to stop launched processes.

Normal email/password signup and login use the generated origin. Signup passes
the browser's public origin to SSO so verification emails point back to the
preview. Email delivery still requires the existing email worker credentials.
No new Google OAuth support is added for this preview. Existing Google code and
password-change code are unchanged.

## Basic-preview limitation

Cloudflare documents that Quick Tunnels do not support Server-Sent Events.
This app uses SSE for AI responses; full AI streaming is not supported by this
preview. Use a streaming-capable tunnel or a named Cloudflare Tunnel to validate
that flow. Do not treat loading the page as proof the AI flow works end to end.

Databases and worker services stay private. Keep the PC awake and connected.
No fixed preview.rareminds.in domain is provisioned by this command.
