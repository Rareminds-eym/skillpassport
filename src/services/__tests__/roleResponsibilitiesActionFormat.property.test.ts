/**
 * Property-Based Test: Action-Oriented Format
 * 
 * **Feature: ai-what-youll-do, Property 2: Action-Oriented Format**
 * **Validates: Requirements 1.3**
 * 
 * Property: For any generated responsibility string, the string SHALL start with a verb (action word).
 * 
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * List of common action verbs for job responsibilities
 * This mirrors the implementation in aiCareerPathService.ts
 */
const ACTION_VERBS = [
  'Analyze', 'Build', 'Collaborate', 'Create', 'Design', 'Develop', 'Drive',
  'Evaluate', 'Execute', 'Facilitate', 'Guide', 'Implement', 'Lead', 'Manage',
  'Monitor', 'Optimize', 'Oversee', 'Plan', 'Research', 'Review', 'Support',
  'Test', 'Train', 'Transform', 'Write'
];

/**
 * Check if a string starts with an action verb
 */
function startsWithActionVerb(text: string): boolean {
  const firstWord = text.trim().split(/\s+/)[0];
  return ACTION_VERBS.some(verb => 
    firstWord.toLowerCase() === verb.toLowerCase() ||
    firstWord.toLowerCase().startsWith(verb.toLowerCase())
  );
}

/**
 * Ensure a responsibility starts with an action verb
 * This mirrors the implementation in aiCareerPathService.ts
 */
function ensureActionVerb(responsibility: string): string {
  const trimmed = responsibility.trim();
  if (startsWithActionVerb(trimmed)) {
    return trimmed;
  }
  // Prepend a generic action verb if missing
  return `Manage ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}

/**
 * Get fallback responsibilities when AI is unavailable
 * Mirrors the implementation in aiCareerPathService.ts
 */
function getFallbackResponsibilities(roleName: string): string[] {
  return [
    `Design and develop solutions in the ${roleName} domain`,
    `Collaborate with cross-functional teams on projects`,
    `Continuously learn and apply new skills in your field`
  ];
}

/**
 * Parse AI response to extract exactly 3 responsibilities
 * This mirrors the implementation in aiCareerPathService.ts
 */
function parseResponsibilitiesResponse(content: string, roleName: string): string[] {
  // Try to extract JSON array first
  const jsonMatch = content.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const responsibilities = parsed
          .slice(0, 3)
          .map((item: string) => ensureActionVerb(String(item)));
        
        // Pad with fallback if less than 3
        while (responsibilities.length < 3) {
          responsibilities.push(getFallbackResponsibilities(roleName)[responsibilities.length]);
        }
        return responsibilities;
      }
    } catch (e) {
      // Fall through to line parsing
    }
  }

  // Try to parse numbered or bulleted list
  const lines = content.split('\n')
    .map(line => line.replace(/^[\d\.\-\*\•]+\s*/, '').trim())
    .filter(line => line.length > 10 && line.length < 200);

  if (lines.length >= 3) {
    return lines.slice(0, 3).map(line => ensureActionVerb(line));
  }

  // Return fallback if parsing fails
  return getFallbackResponsibilities(roleName);
}

/**
 * Generator for role names
 */
const roleNameArbitrary = fc.string({ minLength: 3, maxLength: 50 })
  .filter(s => s.trim().length >= 3 && /^[a-zA-Z\s]+$/.test(s));

/**
 * Generator for random strings that do NOT start with action verbs
 * These simulate AI responses that need to be corrected
 */
const nonActionVerbStringArbitrary = fc.string({ minLength: 15, maxLength: 100 })
  .filter(s => {
    const firstWord = s.trim().split(/\s+/)[0];
    return !ACTION_VERBS.some(verb => 
      firstWord.toLowerCase() === verb.toLowerCase() ||
      firstWord.toLowerCase().startsWith(verb.toLowerCase())
    );
  });

/**
 * Generator for strings that start with action verbs
 */
const actionVerbStringArbitrary = fc.tuple(
  fc.constantFrom(...ACTION_VERBS),
  fc.string({ minLength: 10, maxLength: 80 })
).map(([verb, rest]) => `${verb} ${rest}`);

/**
 * Generator for valid JSON array responses with random strings
 */
const jsonArrayResponseArbitrary = fc.array(
  fc.string({ minLength: 15, maxLength: 100 }),
  { minLength: 1, maxLength: 5 }
).map(arr => JSON.stringify(arr));

/**
 * Generator for numbered list responses
 */
const numberedListResponseArbitrary = fc.array(
  fc.string({ minLength: 15, maxLength: 100 }),
  { minLength: 3, maxLength: 5 }
).map(arr => arr.map((item, idx) => `${idx + 1}. ${item}`).join('\n'));

/**
 * Generator for bulleted list responses
 */
const bulletedListResponseArbitrary = fc.array(
  fc.string({ minLength: 15, maxLength: 100 }),
  { minLength: 3, maxLength: 5 }
).map(arr => arr.map(item => `- ${item}`).join('\n'));

describe('Property 2: Action-Oriented Format', () => {
  
  it('should ensure all responsibilities start with action verbs for JSON array responses', () => {
    fc.assert(
      fc.property(
        jsonArrayResponseArbitrary,
        roleNameArbitrary,
        (response, roleName) => {
          const result = parseResponsibilitiesResponse(response, roleName);
          
          // Property: Every responsibility must start with an action verb
          result.forEach((responsibility, index) => {
            expect(
              startsWithActionVerb(responsibility),
              `Responsibility ${index + 1} "${responsibility}" should start with an action verb`
            ).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure all responsibilities start with action verbs for numbered list responses', () => {
    fc.assert(
      fc.property(
        numberedListResponseArbitrary,
        roleNameArbitrary,
        (response, roleName) => {
          const result = parseResponsibilitiesResponse(response, roleName);
          
          // Property: Every responsibility must start with an action verb
          result.forEach((responsibility, index) => {
            expect(
              startsWithActionVerb(responsibility),
              `Responsibility ${index + 1} "${responsibility}" should start with an action verb`
            ).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure all responsibilities start with action verbs for bulleted list responses', () => {
    fc.assert(
      fc.property(
        bulletedListResponseArbitrary,
        roleNameArbitrary,
        (response, roleName) => {
          const result = parseResponsibilitiesResponse(response, roleName);
          
          // Property: Every responsibility must start with an action verb
          result.forEach((responsibility, index) => {
            expect(
              startsWithActionVerb(responsibility),
              `Responsibility ${index + 1} "${responsibility}" should start with an action verb`
            ).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure fallback responsibilities start with action verbs for any role name', () => {
    fc.assert(
      fc.property(
        roleNameArbitrary,
        (roleName) => {
          const result = getFallbackResponsibilities(roleName);
          
          // Property: Every fallback responsibility must start with an action verb
          result.forEach((responsibility, index) => {
            expect(
              startsWithActionVerb(responsibility),
              `Fallback responsibility ${index + 1} "${responsibility}" should start with an action verb`
            ).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should transform non-action-verb strings to start with action verbs', () => {
    fc.assert(
      fc.property(
        nonActionVerbStringArbitrary,
        (input) => {
          const result = ensureActionVerb(input);
          
          // Property: After transformation, the string must start with an action verb
          expect(
            startsWithActionVerb(result),
            `Transformed string "${result}" should start with an action verb`
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve strings that already start with action verbs', () => {
    fc.assert(
      fc.property(
        actionVerbStringArbitrary,
        (input) => {
          const result = ensureActionVerb(input);
          
          // Property: String should still start with an action verb
          expect(
            startsWithActionVerb(result),
            `String "${result}" should start with an action verb`
          ).toBe(true);
          
          // Property: Original action verb should be preserved (not replaced with "Manage")
          const originalFirstWord = input.trim().split(/\s+/)[0];
          const resultFirstWord = result.trim().split(/\s+/)[0];
          expect(resultFirstWord.toLowerCase()).toBe(originalFirstWord.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of empty or whitespace-only strings', () => {
    const emptyStrings = ['', '   ', '\t', '\n'];
    
    emptyStrings.forEach(input => {
      const result = ensureActionVerb(input);
      // After transformation, should start with "Manage" (the default action verb)
      expect(result.startsWith('Manage')).toBe(true);
    });
  });

  it('should handle mixed case action verbs correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ACTION_VERBS),
        fc.constantFrom('UPPER', 'lower', 'Mixed'),
        fc.string({ minLength: 10, maxLength: 50 }),
        (verb, caseType, rest) => {
          let modifiedVerb: string;
          switch (caseType) {
            case 'UPPER':
              modifiedVerb = verb.toUpperCase();
              break;
            case 'lower':
              modifiedVerb = verb.toLowerCase();
              break;
            default:
              modifiedVerb = verb;
          }
          
          const input = `${modifiedVerb} ${rest}`;
          const result = ensureActionVerb(input);
          
          // Property: Should recognize action verbs regardless of case
          expect(
            startsWithActionVerb(result),
            `String "${result}" should start with an action verb`
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
