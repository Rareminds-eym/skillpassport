# Certificate Fetcher Worker

Cloudflare Worker that fetches certificate pages from external platforms (Udemy, Coursera, etc.) and extracts certificate data.

## Features

- **Browser Rendering**: Uses Cloudflare Browser Rendering (Puppeteer) to render JavaScript-heavy pages like Udemy certificates
- **Fallback Mode**: Falls back to simple fetch if Browser Rendering is not available
- **CORS Support**: Handles CORS for frontend requests
- **Platform Detection**: Extracts platform-specific data (course name, instructor, date)

## Requirements

- **Cloudflare Workers Paid Plan**: Browser Rendering is a paid feature
- **Node.js 18+**
- **Wrangler CLI**

## Setup

1. Install dependencies:
```bash
cd cloudflare-workers/fetch-certificate
npm install
```

2. Login to Cloudflare:
```bash
npx wrangler login
```

3. Deploy the worker:
```bash
npm run deploy
# or
npx wrangler deploy
```

## Configuration

The `wrangler.toml` file configures:
- Worker name and entry point
- Browser Rendering binding (`BROWSER`)
- Node.js compatibility mode

## Usage

Send a POST request with the certificate URL:

```javascript
const response = await fetch('https://fetch-certificate.YOUR-SUBDOMAIN.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://ude.my/UC-xxx-xxx' })
});

const data = await response.json();
// {
//   success: true,
//   metadata: { title, description, ... },
//   platformData: { courseName, instructor, completionDate, ... },
//   usedBrowser: true
// }
```

## Supported Platforms

- Udemy (ude.my, udemy.com)
- Coursera
- LinkedIn Learning
- edX
- Pluralsight
- Udacity
- Skillshare
- Codecademy
- freeCodeCamp

## Browser Rendering Notes

- Browser Rendering has usage limits on the Cloudflare Workers Paid plan
- Each request launches a headless browser, which takes ~2-5 seconds
- The worker waits for the page to fully render before extracting data
- If Browser Rendering is not available, it falls back to simple fetch (which won't work for JS-rendered pages)

## Troubleshooting

### "Browser Rendering not available"
- Ensure you have a Cloudflare Workers Paid plan
- Check that the `[browser]` binding is in `wrangler.toml`
- Redeploy the worker after adding the binding

### Extraction not working
- Check the browser console logs in Cloudflare dashboard
- The page structure may have changed - update the selectors in `fetchWithBrowser()`
