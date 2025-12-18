# Certificate Fetcher Cloudflare Worker

This Cloudflare Worker fetches certificate pages from external learning platforms (Udemy, Coursera, LinkedIn Learning, etc.) to bypass CORS restrictions.

## Deployment

### Prerequisites
- Node.js installed
- Cloudflare account
- Wrangler CLI: `npm install -g wrangler`

### Steps

1. **Login to Cloudflare:**
   ```bash
   npx wrangler login
   ```

2. **Deploy the worker:**
   ```bash
   cd cloudflare-workers/fetch-certificate
   npx wrangler deploy
   ```

3. **Note the worker URL** (e.g., `https://fetch-certificate.your-subdomain.workers.dev`)

4. **Add to your .env file:**
   ```
   VITE_CLOUDFLARE_CERTIFICATE_WORKER_URL=https://fetch-certificate.your-subdomain.workers.dev
   ```

## Usage

The worker accepts POST requests with a JSON body:

```javascript
const response = await fetch('https://fetch-certificate.your-subdomain.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://www.udemy.com/certificate/UC-xxx' })
});

const data = await response.json();
// {
//   success: true,
//   metadata: { title, ogTitle, ogDescription, ... },
//   platformData: { platform, courseName, instructor, completionDate },
//   bodySnippet: "..."
// }
```

## Supported Platforms

- Udemy (udemy.com, ude.my)
- Coursera (coursera.org)
- LinkedIn Learning (linkedin.com)
- edX (edx.org)
- Pluralsight (pluralsight.com)
- Udacity (udacity.com)
- Skillshare (skillshare.com)
- Codecademy (codecademy.com)
- freeCodeCamp (freecodecamp.org)

## Security

The worker only allows requests to the whitelisted certificate platforms above. Any other domains will return a 403 error.
