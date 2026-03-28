/**
 * Property-Based Test: Response Count Invariant
 * 
 * **Feature: ai-what-youll-do, Property 1: Response Count Invariant**
 * **Validates: Requirements 1.2**
 * 
 * Property: For any valid AI response, the responsibilities array SHALL contain exactly 3 items.
 * 
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * List of common action verbs for job responsibilities
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
 */
function ensureActionVerb(responsibility: string): string {
  const trimmed = responsibility.trim();
  if (startsWithActionVerb(trimmed)) {
    return trimmed;
  }
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
 * Generator for valid JSON array responses with 1-5 items
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
  { minLength: 1, maxLength: 5 }
).map(arr => arr.map((item, idx) => `${idx + 1}. ${item}`).join('\n'));

/**
 * Generator for bulleted list responses
 */
const bulletedListResponseArbitrary = fc.array(
  fc.string({ minLength: 15, maxLength: 100 }),
  { minLength: 1, maxLength: 5 }
).map(arr => arr.map(item => `- ${item}`).join('\n'));

/**
 * Generator for malformed/empty responses
 */
const malformedResponseArbitrary = fc.oneof(
  fc.constant(''),
  fc.constant('{}'),
  fc.constant('null'),
  fc.constant('undefined'),
  fc.string({ minLength: 0, maxLength: 50 })
);

describe('Property 1: Response Count Invariant', () => {
  
  it('should always return exactly 3 responsibilities for valid JSON array responses', () => {
    fc.assert(
      fc.property(
        jsonArrayResponseArbitrary,
        roleNameArbitrary,
        (response, roleName) => {
          const result = parseResponsibilitiesResponse(response, roleName);
          
          // Property: Result must always contain exactly 3 items
          expect(result).toHaveLength(3);
          expect(Array.isArray(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always return exactly 3 responsibilities for numbered list responses', () => {
    fc.assert(
      fc.property(
        numberedListResponseArbitrary,
        roleNameArbitrary,
        (response, roleName) => {
          const result = parseResponsibilitiesResponse(response, roleName);
          
          // Property: Result must always contain exactly 3 items
          expect(result).toHaveLength(3);
          expect(Array.isArray(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always return exactly 3 responsibilities for bulleted list responses', () => {
    fc.assert(
      fc.property(
        bulletedListResponseArbitrary,
        roleNameArbitrary,
        (response, roleName) => {
          const result = parseResponsibilitiesResponse(response, roleName);
          
          // Property: Result must always contain exactly 3 items
          expect(result).toHaveLength(3);
          expect(Array.isArray(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always return exactly 3 responsibilities for malformed responses (fallback)', () => {
    fc.assert(
      fc.property(
        malformedResponseArbitrary,
        roleNameArbitrary,
        (response, roleName) => {
          const result = parseResponsibilitiesResponse(response, roleName);
          
          // Property: Result must always contain exactly 3 items (fallback)
          expect(result).toHaveLength(3);
          expect(Array.isArray(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return exactly 3 fallback responsibilities for any role name', () => {
    fc.assert(
      fc.property(
        roleNameArbitrary,
        (roleName) => {
          const result = getFallbackResponsibilities(roleName);
          
          // Property: Fallback must always contain exactly 3 items
          expect(result).toHaveLength(3);
          expect(Array.isArray(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of JSON array with more than 3 items', () => {
    const manyItemsResponse = JSON.stringify([
      'Design and implement solutions',
      'Collaborate with team members',
      'Analyze requirements carefully',
      'Test and validate code',
      'Document all processes'
    ]);
    
    const result = parseResponsibilitiesResponse(manyItemsResponse, 'Developer');
    
    // Property: Even with more items, result must be exactly 3
    expect(result).toHaveLength(3);
  });

  it('should handle edge case of JSON array with fewer than 3 items', () => {
    const fewItemsResponse = JSON.stringify([
      'Design and implement solutions'
    ]);
    
    const result = parseResponsibilitiesResponse(fewItemsResponse, 'Developer');
    
    // Property: Even with fewer items, result must be padded to exactly 3
    expect(result).toHaveLength(3);
  });
});
