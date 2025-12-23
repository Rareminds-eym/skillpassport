# Set Cloudflare Worker Secrets

Run these commands in the career-api directory:

## 1. Set VITE_SUPABASE_URL
```bash
cd d:\Rareminds\GITEX\sp\cloudflare-workers\career-api
npx wrangler secret put VITE_SUPABASE_URL
```
When prompted, paste your Supabase URL (get from browser console)

## 2. Set VITE_SUPABASE_ANON_KEY
```bash
npx wrangler secret put VITE_SUPABASE_ANON_KEY
```
When prompted, paste your Supabase anon key

## 3. Set SUPABASE_SERVICE_ROLE_KEY
```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```
Get this from: Supabase Dashboard → Settings → API → service_role (secret key)

## 4. Set VITE_OPENROUTER_API_KEY
```bash
npx wrangler secret put VITE_OPENROUTER_API_KEY
```
When prompted, paste your OpenRouter API key

## 5. Verify secrets are set
```bash
npx wrangler secret list
```

## 6. Redeploy worker
```bash
npm run deploy
```

---

**Note**: Use `npx wrangler` instead of just `wrangler` since it's not installed globally.
