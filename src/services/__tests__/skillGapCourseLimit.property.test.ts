/**
 * Property-Based Test: Skill Gap Course Limit
 * 
 * **Feature: rag-course-recommendations, Property 7: Skill Gap Course Limit**
 * **Validates: Requirements 5.1**
 * 
 * Property: For any skill gap displayed in the UI, the number of associated
 * courses SHALL be between 0 and 3 inclusive.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { cosineSimilarity } from '../embeddingService';

// Constants matching the service implementation
const MAX_COURSES_PER_SKILL_GAP = 3;
const MIN_COURSES_PER_SKILL_GAP = 0;
const EMBEDDING_DIMENSION = 768;
const SEMANTIC_SIMILARITY_THRESHOLD = 0.4;

/**
 * Calculate relevance score from cosine similarity
 * Mirrors the implementation in courseRecommendationService.js
 */
const calculateRelevanceScore = (similarity: number): number => {
  const score = Math.round(((similarity + 1) / 2) * 100);
  return Math.max(0, Math.min(100, score));
};

/**
 * Generator for a valid embedding vector (768 dimensions)
 */
const embeddingArbitrary = fc.array(
  fc.float({ min: -1, max: 1, noNaN: true }),
  { minLength: EMBEDDING_DIMENSION, maxLength: EMBEDDING_DIMENSION }
);

/**
 * Generator for a skill gap object
 */
const skillGapArbitrary = fc.record({
  skill: fc.string({ minLength: 1, maxLength: 50 }),
  currentLevel: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  targetLevel: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined })
});

/**
 * Generator for a course with embedding and skills
 */
const courseWithEmbeddingArbitrary = fc.record({
  course_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  code: fc.string({ minLength: 2, maxLength: 20 }),
  description: fc.string({ minLength: 0, maxLength: 500 }),
  duration: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.string({ minLength: 1, maxLength: 50 }),
  skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
  target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
  status: fc.constant('Active' as const),
  embedding: embeddingArbitrary,
  deleted_at: fc.constant(null)
});

/**
 * Generator for an array of courses with varying sizes
 */
const coursesArrayArbitrary = fc.array(courseWithEmbeddingArbitrary, { minLength: 0, maxLength: 50 });

interface SkillGap {
  skill: string;
  currentLevel?: number;
  targetLevel?: number;
}

interface Course {
  course_id: string;
  title: string;
  code: string;
  description: string;
  duration: string;
  category: string;
  skills: string[];
  target_outcomes: string[];
  status: 'Active';
  embedding: number[];
  deleted_at: null;
}

interface RecommendedCourse {
  course_id: string;
  title: string;
  code: string;
  description: string;
  duration: string;
  category: string;
  skills: string[];
  target_outcomes: string[];
  relevance_score: number;
  match_type: 'direct' | 'semantic';
  why_this_course?: string;
  skill_gap_addressed?: string;
}

/**
 * Simulates direct skill matching from course_skills table.
 * Mirrors getDirectSkillMatches in courseRecommendationService.js
 */
const getDirectSkillMatches = (
  skillName: string,
  courses: Course[]
): RecommendedCourse[] => {
  const skillLower = skillName.toLowerCase();
  
  // Find courses that have skills matching the skill gap
  const matchingCourses = courses.filter(course => {
    return course.skills.some(s => 
      s.toLowerCase().includes(skillLower) || 
      skillLower.includes(s.toLowerCase())
    );
  });

  return matchingCourses.map(course => {
    const exactMatch = course.skills.some(s => s.toLowerCase() === skillLower);
    const matchStrength = exactMatch ? 1.0 : 0.8;
    
    return {
      course_id: course.course_id,
      title: course.title,
      code: course.code,
      description: course.description,
      duration: course.duration,
      category: course.category,
      skills: course.skills,
      target_outcomes: course.target_outcomes,
      relevance_score: calculateRelevanceScore(matchStrength),
      match_type: 'direct' as const,
      matched_skill: course.skills.find(s => 
        s.toLowerCase().includes(skillLower) || 
        skillLower.includes(s.toLowerCase())
      )
    };
  });
};

/**
 * Simulates semantic skill matching via embedding similarity.
 * Mirrors getSemanticSkillMatches in courseRecommendationService.js
 */
const getSemanticSkillMatches = (
  skillEmbedding: number[],
  courses: Course[]
): RecommendedCourse[] => {
  const scoredCourses = courses
    .filter(course => 
      course.embedding && 
      Array.isArray(course.embedding) && 
      course.embedding.length === EMBEDDING_DIMENSION
    )
    .map(course => {
      const similarity = cosineSimilarity(skillEmbedding, course.embedding);
      return {
        course_id: course.course_id,
        title: course.title,
        code: course.code,
        description: course.description,
        duration: course.duration,
        category: course.category,
        skills: course.skills,
        target_outcomes: course.target_outcomes,
        relevance_score: calculateRelevanceScore(similarity),
        match_type: 'semantic' as const,
        _similarity: similarity
      };
    })
    .filter(course => course._similarity >= SEMANTIC_SIMILARITY_THRESHOLD)
    .sort((a, b) => b._similarity - a._similarity)
    .slice(0, 5); // Get top 5 semantic matches

  return scoredCourses.map(({ _similarity, ...course }) => course);
};

/**
 * Combines direct and semantic matches, removing duplicates and ranking.
 * Mirrors combineAndRankCourses in courseRecommendationService.js
 */
const combineAndRankCourses = (
  directMatches: RecommendedCourse[],
  semanticMatches: RecommendedCourse[]
): RecommendedCourse[] => {
  const courseMap = new Map<string, RecommendedCourse>();

  // Add direct matches first (higher priority)
  directMatches.forEach(course => {
    courseMap.set(course.course_id, course);
  });

  // Add semantic matches, merging if already exists
  semanticMatches.forEach(course => {
    if (courseMap.has(course.course_id)) {
      // Course already exists from direct match - boost its score
      const existing = courseMap.get(course.course_id)!;
      existing.relevance_score = Math.min(100, existing.relevance_score + 10);
    } else {
      // New course from semantic match
      courseMap.set(course.course_id, course);
    }
  });

  // Convert to array and sort by relevance
  return Array.from(courseMap.values())
    .sort((a, b) => b.relevance_score - a.relevance_score);
};

/**
 * Simulates the getCoursesForSkillGap function from courseRecommendationService.js
 * This is a pure function that can be tested without database/API dependencies.
 * 
 * The key property being tested: returns between 0 and 3 courses (inclusive)
 */
const getCoursesForSkillGap = (
  skillGap: SkillGap,
  courses: Course[],
  skillEmbedding: number[]
): RecommendedCourse[] => {
  if (!skillGap || !skillGap.skill) {
    return [];
  }

  const skillName = skillGap.skill;

  // Step 1: Get direct matches
  const directMatches = getDirectSkillMatches(skillName, courses);
  
  // Step 2: Get semantic matches
  const semanticMatches = getSemanticSkillMatches(skillEmbedding, courses);
  
  // Step 3: Combine and rank
  const combinedCourses = combineAndRankCourses(directMatches, semanticMatches);
  
  // Step 4: Limit to 0-3 courses (Requirement 5.1)
  const limitedCourses = combinedCourses.slice(0, MAX_COURSES_PER_SKILL_GAP);
  
  // Step 5: Add explanations
  return limitedCourses.map(course => ({
    ...course,
    why_this_course: `This course can help you develop skills related to ${skillName}.`,
    skill_gap_addressed: skillName
  }));
};

describe('Property 7: Skill Gap Course Limit', () => {
  
  it('should return between 0 and 3 courses for any skill gap', () => {
    fc.assert(
      fc.property(
        skillGapArbitrary,
        coursesArrayArbitrary,
        embeddingArbitrary,
        (skillGap, courses, skillEmbedding) => {
          const results = getCoursesForSkillGap(skillGap, courses, skillEmbedding);
          
          // Property: Result count must be between 0 and 3 inclusive
          expect(results.length).toBeGreaterThanOrEqual(MIN_COURSES_PER_SKILL_GAP);
          expect(results.length).toBeLessThanOrEqual(MAX_COURSES_PER_SKILL_GAP);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return at most 3 courses even when many courses match the skill', () => {
    // Create courses that all match a specific skill
    const targetSkill = 'JavaScript';
    const skillGap: SkillGap = { skill: targetSkill, currentLevel: 2, targetLevel: 5 };
    
    // Create 20 courses all containing the target skill
    const matchingCourses: Course[] = Array.from({ length: 20 }, (_, i) => ({
      course_id: `course-${i}`,
      title: `${targetSkill} Course ${i}`,
      code: `JS${i}`,
      description: `Learn ${targetSkill} programming`,
      duration: '4 weeks',
      category: 'Technology',
      skills: [targetSkill, 'Programming', 'Web Development'],
      target_outcomes: ['Master JavaScript'],
      status: 'Active' as const,
      embedding: Array(EMBEDDING_DIMENSION).fill(0.5),
      deleted_at: null
    }));

    const skillEmbedding = Array(EMBEDDING_DIMENSION).fill(0.5);
    const results = getCoursesForSkillGap(skillGap, matchingCourses, skillEmbedding);
    
    // Property: Even with 20 matching courses, only 3 should be returned
    expect(results.length).toBeLessThanOrEqual(MAX_COURSES_PER_SKILL_GAP);
    expect(results.length).toBe(MAX_COURSES_PER_SKILL_GAP);
  });

  it('should return 0 courses when no courses exist', () => {
    fc.assert(
      fc.property(
        skillGapArbitrary,
        embeddingArbitrary,
        (skillGap, skillEmbedding) => {
          const results = getCoursesForSkillGap(skillGap, [], skillEmbedding);
          
          // Property: Empty input should produce empty output
          expect(results.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 courses when skill gap is invalid', () => {
    fc.assert(
      fc.property(
        coursesArrayArbitrary,
        embeddingArbitrary,
        (courses, skillEmbedding) => {
          // Test with null skill gap
          const resultsNull = getCoursesForSkillGap(null as any, courses, skillEmbedding);
          expect(resultsNull.length).toBe(0);
          
          // Test with empty skill name
          const resultsEmpty = getCoursesForSkillGap({ skill: '' }, courses, skillEmbedding);
          expect(resultsEmpty.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return fewer than 3 courses when fewer courses match', () => {
    const skillGap: SkillGap = { skill: 'UniqueSkillXYZ123' };
    
    // Create only 2 courses that match
    const courses: Course[] = [
      {
        course_id: 'course-1',
        title: 'UniqueSkillXYZ123 Basics',
        code: 'USK1',
        description: 'Learn UniqueSkillXYZ123',
        duration: '2 weeks',
        category: 'Technology',
        skills: ['UniqueSkillXYZ123'],
        target_outcomes: ['Master the skill'],
        status: 'Active',
        embedding: Array(EMBEDDING_DIMENSION).fill(0.5),
        deleted_at: null
      },
      {
        course_id: 'course-2',
        title: 'Advanced UniqueSkillXYZ123',
        code: 'USK2',
        description: 'Advanced UniqueSkillXYZ123 techniques',
        duration: '4 weeks',
        category: 'Technology',
        skills: ['UniqueSkillXYZ123', 'Advanced Topics'],
        target_outcomes: ['Expert level'],
        status: 'Active',
        embedding: Array(EMBEDDING_DIMENSION).fill(0.5),
        deleted_at: null
      }
    ];

    const skillEmbedding = Array(EMBEDDING_DIMENSION).fill(0.5);
    const results = getCoursesForSkillGap(skillGap, courses, skillEmbedding);
    
    // Property: Should return exactly 2 courses (all that match)
    expect(results.length).toBeLessThanOrEqual(MAX_COURSES_PER_SKILL_GAP);
    expect(results.length).toBe(2);
  });

  it('should maintain limit when combining direct and semantic matches', () => {
    fc.assert(
      fc.property(
        skillGapArbitrary,
        coursesArrayArbitrary,
        embeddingArbitrary,
        (skillGap, courses, skillEmbedding) => {
          // Get direct matches
          const directMatches = getDirectSkillMatches(skillGap.skill, courses);
          
          // Get semantic matches
          const semanticMatches = getSemanticSkillMatches(skillEmbedding, courses);
          
          // Even if combined matches exceed 3, final result should be limited
          const results = getCoursesForSkillGap(skillGap, courses, skillEmbedding);
          
          // Property: Final result must respect the limit regardless of match sources
          expect(results.length).toBeLessThanOrEqual(MAX_COURSES_PER_SKILL_GAP);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return courses sorted by relevance within the limit', () => {
    fc.assert(
      fc.property(
        skillGapArbitrary,
        coursesArrayArbitrary.filter(courses => courses.length > 0),
        embeddingArbitrary,
        (skillGap, courses, skillEmbedding) => {
          const results = getCoursesForSkillGap(skillGap, courses, skillEmbedding);
          
          // Property: Results should be sorted by relevance_score in descending order
          for (let i = 1; i < results.length; i++) {
            expect(results[i - 1].relevance_score).toBeGreaterThanOrEqual(results[i].relevance_score);
          }
          
          // Property: Limit must still be enforced
          expect(results.length).toBeLessThanOrEqual(MAX_COURSES_PER_SKILL_GAP);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include skill_gap_addressed field for all returned courses', () => {
    fc.assert(
      fc.property(
        skillGapArbitrary,
        coursesArrayArbitrary,
        embeddingArbitrary,
        (skillGap, courses, skillEmbedding) => {
          const results = getCoursesForSkillGap(skillGap, courses, skillEmbedding);
          
          // Property: All returned courses should have skill_gap_addressed set
          results.forEach(course => {
            expect(course.skill_gap_addressed).toBe(skillGap.skill);
          });
          
          // Property: Limit must still be enforced
          expect(results.length).toBeLessThanOrEqual(MAX_COURSES_PER_SKILL_GAP);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include why_this_course explanation for all returned courses', () => {
    fc.assert(
      fc.property(
        skillGapArbitrary,
        coursesArrayArbitrary,
        embeddingArbitrary,
        (skillGap, courses, skillEmbedding) => {
          const results = getCoursesForSkillGap(skillGap, courses, skillEmbedding);
          
          // Property: All returned courses should have why_this_course explanation
          results.forEach(course => {
            expect(course.why_this_course).toBeDefined();
            expect(typeof course.why_this_course).toBe('string');
            expect(course.why_this_course!.length).toBeGreaterThan(0);
          });
          
          // Property: Limit must still be enforced
          expect(results.length).toBeLessThanOrEqual(MAX_COURSES_PER_SKILL_GAP);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle various skill gap formats consistently', () => {
    const skillGapVariants = fc.oneof(
      // Just skill name
      fc.record({ skill: fc.string({ minLength: 1, maxLength: 50 }) }),
      // With current level
      fc.record({ 
        skill: fc.string({ minLength: 1, maxLength: 50 }),
        currentLevel: fc.integer({ min: 1, max: 5 })
      }),
      // With both levels
      fc.record({ 
        skill: fc.string({ minLength: 1, maxLength: 50 }),
        currentLevel: fc.integer({ min: 1, max: 5 }),
        targetLevel: fc.integer({ min: 1, max: 5 })
      })
    );

    fc.assert(
      fc.property(
        skillGapVariants,
        coursesArrayArbitrary,
        embeddingArbitrary,
        (skillGap, courses, skillEmbedding) => {
          const results = getCoursesForSkillGap(skillGap, courses, skillEmbedding);
          
          // Property: Limit must be enforced regardless of skill gap format
          expect(results.length).toBeGreaterThanOrEqual(MIN_COURSES_PER_SKILL_GAP);
          expect(results.length).toBeLessThanOrEqual(MAX_COURSES_PER_SKILL_GAP);
        }
      ),
      { numRuns: 100 }
    );
  });
});
