/**
 * Cloudflare Worker to fetch certificate pages from external platforms
 * This bypasses CORS restrictions by acting as a server-side proxy
 * 
 * Deploy: npx wrangler deploy
 */

const ALLOWED_DOMAINS = [
  'udemy.com',
  'coursera.org',
  'linkedin.com',
  'edx.org',
  'pluralsight.com',
  'udacity.com',
  'skillshare.com',
  'codecademy.com',
  'freecodecamp.org',
  'ude.my'
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { url } = await request.json();

      if (!url) {
        return new Response(JSON.stringify({ error: 'URL is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate URL domain
      const urlObj = new URL(url);
      const isAllowed = ALLOWED_DOMAINS.some(domain => urlObj.hostname.includes(domain));

      if (!isAllowed) {
        return new Response(JSON.stringify({ 
          error: 'URL domain not allowed. Only certificate platforms are supported.' 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Expand short URLs
      let fetchUrl = url;
      if (url.includes('ude.my/')) {
        const certId = url.split('ude.my/')[1];
        fetchUrl = `https://www.udemy.com/certificate/${certId}`;
      }

      console.log(`Fetching certificate page: ${fetchUrl}`);

      // Fetch the page with browser-like headers
      const response = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ 
          success: false,
          error: `Certificate not found or invalid (${response.status})`,
          details: `The certificate URL returned ${response.status} ${response.statusText}. Please verify the certificate ID is correct.`
        }), {
          status: 200, // Return 200 so client can read the error message
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const html = await response.text();

      // Extract metadata from HTML
      const extractMeta = (html, property) => {
        const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
        const match = html.match(regex);
        return match ? match[1] : '';
      };

      const extractMetaReverse = (html, property) => {
        const regex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i');
        const match = html.match(regex);
        return match ? match[1] : '';
      };

      const extractTitle = (html) => {
        const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        return match ? match[1].trim() : '';
      };

      const metadata = {
        title: extractTitle(html),
        ogTitle: extractMeta(html, 'og:title') || extractMetaReverse(html, 'og:title'),
        ogDescription: extractMeta(html, 'og:description') || extractMetaReverse(html, 'og:description'),
        description: extractMeta(html, 'description') || extractMetaReverse(html, 'description'),
        ogImage: extractMeta(html, 'og:image') || extractMetaReverse(html, 'og:image'),
        finalUrl: response.url,
      };

      // Platform-specific extraction (limited for JS-rendered pages)
      let platformData = {
        platform: 'unknown',
        needsAiExtraction: true,
      };

      if (fetchUrl.includes('udemy.com')) {
        platformData.platform = 'udemy';
      } else if (fetchUrl.includes('coursera.org')) {
        platformData.platform = 'coursera';
      } else if (fetchUrl.includes('linkedin.com')) {
        platformData.platform = 'linkedin';
      } else if (fetchUrl.includes('edx.org')) {
        platformData.platform = 'edx';
      }

      // Body snippet for reference
      const bodySnippet = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000);

      return new Response(JSON.stringify({
        success: true,
        metadata,
        platformData,
        htmlLength: html.length,
        bodySnippet,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error fetching certificate page:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
