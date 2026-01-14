/**
 * JSON parsing utilities for AI responses
 */

/**
 * Extract and parse JSON from AI response content
 * Handles markdown code blocks and raw JSON
 */
export function extractJsonFromResponse(content: string): any {
  let jsonStr = content;
  
  // Method 1: Extract from markdown code block
  const codeBlockMatch = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else {
    // Method 2: Find outermost JSON object
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = content.substring(firstBrace, lastBrace + 1);
    }
  }

  if (!jsonStr || !jsonStr.startsWith('{')) {
    throw new Error('Could not extract JSON from response');
  }

  return parseJsonWithFixes(jsonStr);
}

/**
 * Parse JSON with automatic fixes for common issues
 */
function parseJsonWithFixes(jsonStr: string): any {
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.log('[JSON] Initial parse failed, attempting fixes...');
    
    let fixedJson = jsonStr;
    
    // Remove trailing commas
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    
    // Try to close unclosed brackets
    const openBraces = (fixedJson.match(/{/g) || []).length;
    const closeBraces = (fixedJson.match(/}/g) || []).length;
    const openBrackets = (fixedJson.match(/\[/g) || []).length;
    const closeBrackets = (fixedJson.match(/]/g) || []).length;
    
    if (openBraces > closeBraces || openBrackets > closeBrackets) {
      console.log('[JSON] Attempting to fix truncated JSON...');
      for (let i = 0; i < openBrackets - closeBrackets; i++) fixedJson += ']';
      for (let i = 0; i < openBraces - closeBraces; i++) fixedJson += '}';
    }
    
    try {
      const result = JSON.parse(fixedJson);
      console.log('[JSON] Successfully parsed after fixing');
      return result;
    } catch (e2) {
      console.error('[JSON] Still failed after fix attempt');
      throw new Error('Failed to parse AI response. The response was incomplete.');
    }
  }
}
