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
  async fetch(request, env, ctx) {
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
          error: `Failed to fetch page: ${response.status} ${response.statusText}` 
        }), {
          status: response.status,
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

      const extractH1 = (html) => {
        const match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
        return match ? match[1].trim() : '';
      };

      const metadata = {
        title: extractTitle(html),
        h1: extractH1(html),
        ogTitle: extractMeta(html, 'og:title') || extractMetaReverse(html, 'og:title'),
        ogDescription: extractMeta(html, 'og:description') || extractMetaReverse(html, 'og:description'),
        description: extractMeta(html, 'description') || extractMetaReverse(html, 'description'),
        ogImage: extractMeta(html, 'og:image') || extractMetaReverse(html, 'og:image'),
        finalUrl: response.url,
      };

      // Platform-specific extraction
      let platformData = {};

      if (fetchUrl.includes('udemy.com')) {
        // Udemy uses React/Next.js - data is often in __NEXT_DATA__ or window.__INITIAL_STATE__
        let courseName = null;
        let instructor = null;
        let completionDate = null;
        let studentName = null;

        // Try to extract from Next.js data
        const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
        if (nextDataMatch) {
          try {
            const nextData = JSON.parse(nextDataMatch[1]);
            // Navigate through Next.js props structure
            const pageProps = nextData?.props?.pageProps;
            if (pageProps) {
              courseName = pageProps.courseName || pageProps.course?.title || pageProps.certificate?.courseName;
              instructor = pageProps.instructorName || pageProps.instructor?.name || pageProps.certificate?.instructorName;
              completionDate = pageProps.completionDate || pageProps.certificate?.completionDate;
              studentName = pageProps.studentName || pageProps.certificate?.studentName;
            }
          } catch (e) {
            console.log('Failed to parse __NEXT_DATA__:', e.message);
          }
        }

        // Try to extract from window.__INITIAL_STATE__ or similar
        const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/i) ||
                                  html.match(/window\.UD\s*=\s*({[\s\S]*?});?\s*<\/script>/i);
        if (initialStateMatch && !courseName) {
          try {
            const stateData = JSON.parse(initialStateMatch[1]);
            courseName = stateData.certificate?.courseName || stateData.course?.title;
            instructor = stateData.certificate?.instructorName || stateData.instructor?.name;
            completionDate = stateData.certificate?.completionDate;
          } catch (e) {
            console.log('Failed to parse initial state:', e.message);
          }
        }

        // Try embedded JSON patterns in script tags
        const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
        for (const script of scriptMatches) {
          if (courseName && instructor) break;
          
          // Look for course title patterns in inline scripts
          const courseMatch = script.match(/"course_?[Tt]itle"\s*:\s*"([^"]+)"/i) ||
                             script.match(/"title"\s*:\s*"([^"]+)"[^}]*"_class"\s*:\s*"course"/i);
          if (courseMatch && !courseName) {
            courseName = courseMatch[1];
          }

          const instructorMatch = script.match(/"instructor_?[Nn]ame"\s*:\s*"([^"]+)"/i) ||
                                  script.match(/"visible_instructors"\s*:\s*\[\s*\{[^}]*"display_name"\s*:\s*"([^"]+)"/i);
          if (instructorMatch && !instructor) {
            instructor = instructorMatch[1];
          }

          const dateMatch = script.match(/"completion_?[Dd]ate"\s*:\s*"([^"]+)"/i);
          if (dateMatch && !completionDate) {
            completionDate = dateMatch[1];
          }
        }

        // Try JSON-LD structured data
        const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
        for (const jsonScript of jsonLdMatches) {
          if (courseName && instructor) break;
          try {
            const jsonContent = jsonScript.replace(/<script[^>]*>|<\/script>/gi, '');
            const jsonData = JSON.parse(jsonContent);
            
            if (jsonData['@type'] === 'Course' || jsonData.name) {
              courseName = courseName || jsonData.name;
              if (jsonData.instructor) {
                instructor = instructor || (typeof jsonData.instructor === 'string' 
                  ? jsonData.instructor 
                  : jsonData.instructor.name);
              }
            }
          } catch (e) {
            // JSON parse failed, continue
          }
        }

        // Fallback: Try HTML patterns (less reliable for React apps)
        if (!courseName) {
          const htmlPatterns = [
            /data-purpose="certificate-title"[^>]*>([^<]+)</i,
            /class="[^"]*certificate[^"]*title[^"]*"[^>]*>([^<]+)</i,
            /class="[^"]*course-title[^"]*"[^>]*>([^<]+)</i,
          ];
          for (const pattern of htmlPatterns) {
            const match = html.match(pattern);
            if (match && match[1] && !match[1].includes('Udemy Course Completion')) {
              courseName = match[1].trim();
              break;
            }
          }
        }

        // Mark if we need AI extraction (Udemy pages are JS-rendered)
        const needsAiExtraction = !courseName || courseName.includes('Udemy Course Completion');

        platformData = {
          platform: 'udemy',
          courseName: needsAiExtraction ? null : courseName,
          instructor,
          completionDate,
          studentName,
          needsAiExtraction,
        };
      } else if (fetchUrl.includes('coursera.org')) {
        let courseName = null;
        let instructor = null;
        let completionDate = null;

        // Coursera patterns
        const coursePatterns = [
          /class="[^"]*course-name[^"]*"[^>]*>([^<]+)</i,
          /<h1[^>]*>([^<]+)</i,
          /"name"\s*:\s*"([^"]+)"/i,
        ];
        
        for (const pattern of coursePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            courseName = match[1].trim();
            break;
          }
        }

        // Try JSON-LD for Coursera
        const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
        if (jsonLdMatch) {
          for (const jsonScript of jsonLdMatch) {
            try {
              const jsonContent = jsonScript.replace(/<script[^>]*>|<\/script>/gi, '');
              const jsonData = JSON.parse(jsonContent);
              
              if (jsonData.name) {
                courseName = courseName || jsonData.name;
              }
              if (jsonData.creator) {
                instructor = instructor || (Array.isArray(jsonData.creator) 
                  ? jsonData.creator[0]?.name 
                  : jsonData.creator?.name);
              }
            } catch (e) {
              // JSON parse failed
            }
          }
        }

        platformData = {
          platform: 'coursera',
          courseName,
          instructor,
          completionDate,
        };
      } else if (fetchUrl.includes('linkedin.com')) {
        let courseName = null;
        let instructor = null;

        // LinkedIn Learning patterns
        const coursePatterns = [
          /<h1[^>]*>([^<]+)</i,
          /class="[^"]*course-title[^"]*"[^>]*>([^<]+)</i,
        ];
        
        for (const pattern of coursePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            courseName = match[1].trim();
            break;
          }
        }

        platformData = { 
          platform: 'linkedin',
          courseName,
          instructor,
        };
      } else if (fetchUrl.includes('edx.org')) {
        let courseName = null;
        
        const coursePatterns = [
          /<h1[^>]*>([^<]+)</i,
          /"name"\s*:\s*"([^"]+)"/i,
        ];
        
        for (const pattern of coursePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            courseName = match[1].trim();
            break;
          }
        }

        platformData = {
          platform: 'edx',
          courseName,
        };
      }

      // Body snippet for AI processing (strip HTML tags)
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
