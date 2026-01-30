/**
 * JSON Parsing and Repair Utilities
 */

/**
 * Repair and parse JSON from AI responses
 * Handles common issues like markdown formatting, trailing commas, etc.
 */
export function repairAndParseJSON(text: string): any {
  // Clean markdown
  let cleaned = text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  // Find JSON boundaries
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No JSON object found in response');
  }
  cleaned = cleaned.substring(startIdx, endIdx + 1);

  // Try parsing as-is first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('⚠️ Initial JSON parse failed, attempting repair...');
  }

  // Repair common issues
  cleaned = cleaned
    .replace(/,\s*]/g, ']')           // Remove trailing commas in arrays
    .replace(/,\s*}/g, '}')           // Remove trailing commas in objects
    .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
    .replace(/\n/g, ' ')              // Remove newlines
    .replace(/\r/g, '')               // Remove carriage returns
    .replace(/\t/g, ' ')              // Replace tabs with spaces
    .replace(/"\s*\n\s*"/g, '", "')   // Fix broken string arrays
    .replace(/}\s*{/g, '},{')         // Fix missing commas between objects
    .replace(/]\s*\[/g, '],[')        // Fix missing commas between arrays
    .replace(/"\s+"/g, '","');        // Fix missing commas between strings

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log('⚠️ Repair attempt 1 failed, trying more aggressive repair...');
  }

  // More aggressive: try to extract just the questions array
  const questionsMatch = cleaned.match(/"questions"\s*:\s*\[([\s\S]*)\]/);
  if (questionsMatch) {
    try {
      const questionsStr = questionsMatch[1];
      const questions: any[] = [];
      
      // Split by },{ pattern
      const parts = questionsStr.split(/}\s*,\s*{/);
      for (let i = 0; i < parts.length; i++) {
        let part = parts[i].trim();
        if (!part.startsWith('{')) part = '{' + part;
        if (!part.endsWith('}')) part = part + '}';
        
        try {
          const q = JSON.parse(part);
          questions.push(q);
        } catch (qe) {
          console.log(`⚠️ Skipping malformed question ${i + 1}`);
        }
      }
      
      if (questions.length > 0) {
        console.log(`✅ Recovered ${questions.length} questions from malformed JSON`);
        return { questions };
      }
    } catch (e) {
      console.log('⚠️ Questions extraction failed');
    }
  }

  throw new Error('Failed to parse JSON after all repair attempts');
}

/**
 * Parse AI response for adaptive questions (array format)
 */
export function parseAIArrayResponse(content: string): any[] {
  // Clean markdown
  let cleaned = content
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  // Find JSON array boundaries
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No JSON array found in response');
  }
  cleaned = cleaned.substring(startIdx, endIdx + 1);

  // Try parsing as-is first
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not an array');
    }
    return parsed;
  } catch (e) {
    console.log('⚠️ Initial JSON parse failed, attempting repair...');
    console.log('📄 Raw cleaned content (first 500 chars):', cleaned.substring(0, 500));
  }

  // Repair common issues
  cleaned = cleaned
    .replace(/,\s*]/g, ']')
    .replace(/,\s*}/g, '}')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ');

  try {
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (e) {
    console.error('❌ Failed to parse AI response after repair attempts');
    console.error('📄 Repaired content (first 500 chars):', cleaned.substring(0, 500));
    throw new Error('Failed to parse AI response after repair attempts');
  }
}
