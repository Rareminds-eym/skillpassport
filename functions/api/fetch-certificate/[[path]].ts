/**
 * Fetch Certificate API - Pages Function
 * Fetches certificate pages from external platforms (bypasses CORS)
 * 
 * Endpoints:
 * - POST / - Fetch certificate page HTML and metadata
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse } from '../../../src/functions-lib';

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

// ==================== FETCH CERTIFICATE ====================

async function handleFetchCertificate(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await request.json() as { url?: string };
  const { url } = body;

  if (!url) {
    return jsonResponse({ error: 'URL is required' }, 400);
  }

  // Validate URL domain
  const urlObj = new URL(url);
  const isAllowed = ALLOWED_DOMAINS.some(domain => urlObj.hostname.includes(domain));

  if (!isAllowed) {
    return jsonResponse({ 
      error: 'URL domain not allowed. Only certificate platforms are supported.' 
    }, 403);
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
    return jsonResponse({ 
      success: false,
      error: `Certificate not found or invalid (${response.status})`,
      details: `The certificate URL returned ${response.status} ${response.statusText}. Please verify the certificate ID is correct.`
    }, 200); // Return 200 so client can read the error message
  }

  const html = await response.text();

  // Extract metadata from HTML
  const extractMeta = (html: string, property: string) => {
    const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : '';
  };

  const extractMetaReverse = (html: string, property: string) => {
    const regex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : '';
  };

  const extractTitle = (html: string) => {
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

  return jsonResponse({
    success: true,
    metadata,
    platformData,
    htmlLength: html.length,
    bodySnippet,
  });
}

// ==================== MAIN HANDLER ====================

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Health check
    if (path === '/api/fetch-certificate' || path === '/api/fetch-certificate/') {
      if (request.method === 'GET') {
        return jsonResponse({
          status: 'ok',
          service: 'fetch-certificate',
          endpoints: ['POST /'],
          allowedDomains: ALLOWED_DOMAINS,
          timestamp: new Date().toISOString()
        });
      }
      // POST to root - fetch certificate
      return await handleFetchCertificate(request);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  } catch (error) {
    console.error('Fetch Certificate API Error:', error);
    return jsonResponse({ 
      error: (error as Error).message || 'Internal server error' 
    }, 500);
  }
};
