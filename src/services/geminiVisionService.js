/**
 * Gemini Vision Service for Certificate Extraction
 * Uses Google Gemini 1.5 Flash for accurate OCR and data extraction
 */

// Use gemini-pro-vision for image analysis
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent';

/**
 * Get Gemini API key from environment
 */
const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || null;
};

/**
 * Check if Gemini API is configured
 */
export const isGeminiConfigured = () => {
  return !!getApiKey();
};

/**
 * Extract certificate data from image using Gemini Vision
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} mimeType - Image MIME type (e.g., 'image/png', 'image/jpeg')
 * @param {string} platformName - Name of the certificate platform
 * @param {string} platformId - ID of the platform (udemy, coursera, etc.)
 * @returns {Promise<Object>} Extracted certificate data
 */
export const extractCertificateWithGemini = async (imageBase64, mimeType, platformName, platformId) => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  // Platform-specific extraction hints
  const platformHints = {
    udemy: `
UDEMY CERTIFICATE FORMAT:
- Certificate ID: Starts with "UC-" followed by a UUID (e.g., UC-12345678-1234-1234-1234-123456789012)
- Location: Look at the BOTTOM of the certificate for "Certificate no:" or "Reference Number:"
- URL: Short format "ude.my/UC-xxxxx" usually appears near the QR code
- The ID in the URL should EXACTLY match the Certificate ID`,
    coursera: `
COURSERA CERTIFICATE FORMAT:
- Verification URL: coursera.org/verify/XXXXX
- Certificate ID is alphanumeric
- Usually at the bottom of the certificate`,
    linkedin: `
LINKEDIN LEARNING FORMAT:
- Certificate URL in footer
- May show linkedin.com/learning/certificates/...`,
    edx: `
EDX CERTIFICATE FORMAT:
- URL: courses.edx.org/certificates/...
- Certificate ID is alphanumeric`,
    other: `Look for any verification URL or certificate ID shown on the certificate.`
  };

  const platformHint = platformHints[platformId] || platformHints.other;

  const prompt = `You are an expert OCR system specialized in reading certificates. Analyze this ${platformName} certificate image and extract ALL text with 100% accuracy.

${platformHint}

TASK: Read the certificate carefully and extract:

1. COURSE TITLE - The main course/certification name (usually the largest text)
2. STUDENT NAME - The recipient's name 
3. INSTRUCTOR - Look for "Instructor:", "Taught by:", "By:" (may be multiple names)
4. COMPLETION DATE - Convert to YYYY-MM-DD format
5. CERTIFICATE ID - THIS IS CRITICAL:
   - Read EVERY character exactly as shown
   - For Udemy: starts with "UC-" followed by UUID
   - Look at the bottom of the certificate
   - Double-check each character
6. CERTIFICATE URL - Look for:
   - "ude.my/UC-..." (Udemy)
   - "coursera.org/verify/..." (Coursera)
   - Any verification URL
7. SKILLS - Technologies, tools, or topics mentioned

IMPORTANT RULES:
- Read the certificate ID character by character - accuracy is critical
- If you see "ude.my/UC-xxx", return the full URL as "https://ude.my/UC-xxx"
- The certificate ID and URL ID must match exactly
- Only extract what you can clearly see - don't guess

Return ONLY this JSON (no markdown, no explanation):
{
  "courseTitle": "exact course name from certificate",
  "studentName": "recipient name",
  "instructor": "instructor name(s) or empty string if not visible",
  "completionDate": "YYYY-MM-DD",
  "certificateId": "EXACT certificate ID - every character matters",
  "certificateUrl": "https://... full URL",
  "skills": ["skill1", "skill2"],
  "category": "Technology"
}`;

  try {
    console.log('🔍 Calling Gemini Vision API for certificate extraction...');
    
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBase64
              }
            },
            {
              text: prompt
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('No content in Gemini response');
    }

    console.log('📄 Gemini raw response:', responseText);

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', responseText);
      throw new Error('No JSON found in Gemini response');
    }

    const extracted = JSON.parse(jsonMatch[0]);
    console.log('✅ Gemini extraction successful:', extracted);
    
    return extracted;
  } catch (error) {
    console.error('Gemini Vision extraction error:', error);
    throw error;
  }
};

export default {
  extractCertificateWithGemini,
  isGeminiConfigured
};
