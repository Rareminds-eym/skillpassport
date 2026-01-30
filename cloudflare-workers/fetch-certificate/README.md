# Fetch Certificate Worker

Server-side proxy to fetch certificate pages from external learning platforms, bypassing CORS restrictions.

## Purpose

This worker acts as a CORS proxy to fetch certificate pages from platforms like Udemy, Coursera, LinkedIn Learning, etc. It extracts metadata that can be used for automated certificate verification.

## Endpoint

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | POST | Fetch certificate page and extract metadata |

## Environment Variables

**This worker requires NO environment variables.**

It's a standalone proxy service with no external dependencies.

## Setup Instructions

### 1. Install Dependencies
```bash
cd cloudflare-workers/fetch-certificate
npm install
```

### 2. Deploy
```bash
npx wrangler deploy
```

### 3. Update Frontend Environment
```env
VITE_CERTIFICATE_FETCH_URL=https://fetch-certificate.your-subdomain.workers.dev
```

## Supported Platforms

| Platform | Domain | Notes |
|----------|--------|-------|
| Udemy | `udemy.com`, `ude.my` | Short URLs auto-expanded |
| Coursera | `coursera.org` | |
| LinkedIn Learning | `linkedin.com` | |
| edX | `edx.org` | |
| Pluralsight | `pluralsight.com` | |
| Udacity | `udacity.com` | |
| Skillshare | `skillshare.com` | |
| Codecademy | `codecademy.com` | |
| freeCodeCamp | `freecodecamp.org` | |

## Features

### URL Validation
- Checks domain against whitelist
- Prevents abuse to non-certificate sites
- Returns 403 for unauthorized domains

### Short URL Expansion
Automatically expands short URLs:
- `ude.my/{id}` → `udemy.com/certificate/{id}`

### Metadata Extraction
Extracts from HTML:
- `<title>` tag
- Open Graph metadata (og:title, og:description, og:image)
- Meta description
- Final URL (after redirects)

### Platform Detection
Identifies certificate platform:
- `udemy`
- `coursera`
- `linkedin`
- `edx`
- `unknown`

### Body Snippet
Returns cleaned text snippet (5000 chars) for AI processing:
- Removes `<script>` and `<style>` tags
- Strips HTML tags
- Normalizes whitespace

## Request Format

```javascript
POST /
Content-Type: application/json

{
  "url": "https://www.udemy.com/certificate/UC-abc123/"
}
```

## Response Format

### Success
```json
{
  "success": true,
  "metadata": {
    "title": "Certificate of Completion",
    "ogTitle": "John Doe has completed React Course",
    "ogDescription": "Certificate awarded on Dec 19, 2023",
    "description": "Official certificate of completion",
    "ogImage": "https://example.com/cert.jpg",
    "finalUrl": "https://www.udemy.com/certificate/UC-abc123/"
  },
  "platformData": {
    "platform": "udemy",
    "needsAiExtraction": true
  },
  "htmlLength": 45678,
  "bodySnippet": "Certificate of Completion This certifies that John Doe has completed React Course..."
}
```

### Error - Invalid Domain
```json
{
  "error": "URL domain not allowed. Only certificate platforms are supported."
}
```

### Error - Certificate Not Found
```json
{
  "success": false,
  "error": "Certificate not found or invalid (404)",
  "details": "The certificate URL returned 404 Not Found. Please verify the certificate ID is correct."
}
```

## Usage Example

### Frontend Integration
```javascript
async function fetchCertificate(url) {
  const response = await fetch('https://fetch-certificate.your-subdomain.workers.dev', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Title:', data.metadata.ogTitle);
    console.log('Platform:', data.platformData.platform);
    // Process metadata...
  } else {
    console.error('Error:', data.error);
  }
}

// Fetch Udemy certificate
fetchCertificate('https://ude.my/UC-abc123');

// Fetch Coursera certificate
fetchCertificate('https://www.coursera.org/account/accomplishments/certificate/ABC123');
```

## Browser-Like Headers

The worker includes authentic browser headers to avoid bot detection:
- User-Agent: Chrome 120 on Windows
- Accept: HTML, XHTML, XML
- Accept-Language: en-US

## Limitations

### JavaScript-Rendered Content
Many modern certificate pages are rendered client-side with JavaScript. This worker fetches raw HTML only, which may have limited content.

For full extraction, the `bodySnippet` and `needsAiExtraction: true` flag indicate that AI processing of the content may be required.

### Certificate Validation
This worker does NOT validate whether certificates are authentic. It only fetches and parses the publicly accessible page.

For verification, you should:
1. Extract metadata using this worker
2. Process with AI to extract details
3. Optionally verify with platform's API (if available)

## Development

```bash
# Start local dev server
npm run dev

# Test locally
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.udemy.com/certificate/UC-test/"}'

# View logs
npm run tail
```

## Security

- ✅ Domain whitelist prevents abuse
- ✅ CORS enabled for all origins
- ✅ No sensitive data stored
- ✅ No authentication required
- ⚠️ Public endpoint - consider rate limiting for production

## Adding New Platforms

To support additional certificate platforms:

1. Add domain to `ALLOWED_DOMAINS` array:
```javascript
const ALLOWED_DOMAINS = [
  'udemy.com',
  'coursera.org',
  'newplatform.com',  // Add here
  // ...
];
```

2. Add platform detection:
```javascript
if (fetchUrl.includes('newplatform.com')) {
  platformData.platform = 'newplatform';
}
```

3. Redeploy:
```bash
npx wrangler deploy
```

## Notes

- **No environment variables needed** - completely standalone
- Handles redirects automatically
- Returns 200 status even for errors (for easier frontend handling)
- HTML length varies (typically 20KB - 200KB)
- Some platforms may block bots - success not guaranteed
- Designed for metadata extraction, not full scraping
