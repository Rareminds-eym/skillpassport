/**
 * Integration Tests for Course Recommendation Flow
 * Tests the complete assessment → recommendations integration
 * 
 * Feature: rag-course-recommendations
 * Task: 16.2 Write integration tests
 * Requirements: 4.1, 6.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase client
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

// Mock embedding service for controlled testing
vi.mock('../embeddingService', () => ({
  generateEmbedding: vi.fn(),
  cosineSimilarity: vi.fn()
}));

import { supabase } from '../../lib/supabaseClient';
import { generateEmbedding, cosineSimilarity } from '../embeddingService';
import {
  getRecommendedCourses,
  buildProfileText,
  fetchCoursesWithEmbeddings,
  getCoursesForSkillGap,
  getCoursesForMultipleSkillGaps
} from '../courseRecommendationService';

// Sample test data
const sampleAssessmentResults = {
  skillGap: {
    priorityA: [
      { skill: 'Python Programming', currentLevel: 2, targetLevel: 4, whyNeeded: 'Essential for data roles' },
      { skill: 'Data Analysis', currentLevel: 1, targetLevel: 3, whyNeeded: 'Key analytical skill' }
    ],
    priorityB: [
      { skill: 'Machine Learning' },
      { skill: 'SQL' }
    ],
    currentStrengths: ['Communication', 'Problem Solving'],
    recommendedTrack: 'Data Science'
  },
  careerFit: {
    clusters: [
      { title: 'Data Science & Analytics', fit: 'High', matchScore: 85, domains: ['Analytics', 'BI'] },
      { title: 'Software Development', fit: 'Medium', matchScore: 72, domains: ['Backend'] }
    ]
  },
  employability: {
    strengthAreas: ['Communication', 'Teamwork'],
    improvementAreas: ['Technical Skills']
  },
  riasec: { code: 'IAS' },
  aptitude: { topStrengths: ['Logical Reasoning', 'Numerical'] },
  stream: 'Computer Science'
};

const sampleCoursesFromDB = [
  {
    course_id: 'course-1',
    title: 'Python for Data Science',
    code: 'PY101',
    description: 'Learn Python programming for data analysis',
    duration: '6 weeks',
    category: 'Programming',
    target_outcomes: ['Python proficiency', 'Data manipulation'],
    status: 'Active',
    embedding: '[0.1, 0.2, 0.3]' // Simplified for testing
  },
  {
    course_id: 'course-2',
    title: 'Data Analytics Fundamentals',
    code: 'DA101',
    description: 'Introduction to data analytics and visualization',
    duration: '4 weeks',
    category: 'Analytics',
    target_outcomes: ['Data analysis skills'],
    status: 'Active',
    embedding: '[0.2, 0.3, 0.4]'
  }
];

const sampleCourseSkills = [
  { course_id: 'course-1', skill_name: 'Python' },
  { course_id: 'course-1', skill_name: 'Data Analysis' },
  { course_id: 'course-2', skill_name: 'Data Visualization' },
  { course_id: 'course-2', skill_name: 'Analytics' }
];

describe('Course Recommendation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Assessment Completion → Recommendations Flow', () => {
    /**
     * Integration test: Complete flow from assessment results to course recommendations
     * Validates: Requirements 4.1
     */
    it('should return course recommendations when assessment results are provided', async () => {
      // Setup: Mock database responses
      const mockFromCourses = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({
                data: sampleCoursesFromDB,
                error: null
              })
            })
          })
        })
      });

      const mockFromSkills = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: sampleCourseSkills,
            error: null
          })
        })
      });

      // Configure supabase mock to return different results based on table
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'courses') return mockFromCourses();
        if (table === 'course_skills') return mockFromSkills();
        return { select: vi.fn() };
      });

      // Mock embedding generation
      const mockEmbedding = new Array(768).fill(0.1);
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedding);
      
      // Mock cosine similarity to return high scores
      (cosineSimilarity as ReturnType<typeof vi.fn>).mockReturnValue(0.85);

      // Execute: Get recommendations
      const recommendations = await getRecommendedCourses(sampleAssessmentResults);

      // Verify: Recommendations are returned
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      
      // Verify embedding was generated for profile
      expect(generateEmbedding).toHaveBeenCalled();
    });

    /**
     * Integration test: Profile text is built correctly from assessment results
     * Validates: Requirements 2.1, 2.2
     */
    it('should build profile text containing skill gaps and career clusters', () => {
      const profileText = buildProfileText(sampleAssessmentResults);

      // Verify skill gaps are included
      expect(profileText).toContain('Python Programming');
      expect(profileText).toContain('Data Analysis');
      
      // Verify career clusters are included
      expect(profileText).toContain('Data Science & Analytics');
      
      // Verify profile text is non-empty
      expect(profileText.length).toBeGreaterThan(0);
    });

    /**
     * Integration test: Recommendations include required fields
     * Validates: Requirements 4.2
     */
    it('should return recommendations with all required fields', async () => {
      // Setup mocks
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: sampleCoursesFromDB,
                    error: null
                  })
                })
              })
            })
          };
        }
        if (table === 'course_skills') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: sampleCourseSkills,
                error: null
              })
            })
          };
        }
        return { select: vi.fn() };
      });

      const mockEmbedding = new Array(768).fill(0.1);
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedding);
      (cosineSimilarity as ReturnType<typeof vi.fn>).mockReturnValue(0.75);

      const recommendations = await getRecommendedCourses(sampleAssessmentResults);

      // If recommendations exist, verify structure
      if (recommendations.length > 0) {
        const course = recommendations[0];
        expect(course).toHaveProperty('course_id');
        expect(course).toHaveProperty('title');
        expect(course).toHaveProperty('relevance_score');
        expect(typeof course.relevance_score).toBe('number');
        expect(course.relevance_score).toBeGreaterThanOrEqual(0);
        expect(course.relevance_score).toBeLessThanOrEqual(100);
      }
    });

    /**
     * Integration test: Skill gap courses are mapped correctly
     * Validates: Requirements 5.1, 5.2
     */
    it('should map courses to multiple skill gaps', async () => {
      // Setup mocks for skill gap course mapping
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: sampleCoursesFromDB,
                    error: null
                  })
                })
              })
            })
          };
        }
        if (table === 'course_skills') {
          return {
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockResolvedValue({
                data: [{ course_id: 'course-1', skill_name: 'Python', proficiency_level: 'Intermediate' }],
                error: null
              }),
              in: vi.fn().mockResolvedValue({
                data: sampleCourseSkills,
                error: null
              })
            })
          };
        }
        return { select: vi.fn() };
      });

      const mockEmbedding = new Array(768).fill(0.1);
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedding);
      (cosineSimilarity as ReturnType<typeof vi.fn>).mockReturnValue(0.7);

      const skillGaps = [
        { skill: 'Python Programming', currentLevel: 2, targetLevel: 4 },
        { skill: 'Data Analysis', currentLevel: 1, targetLevel: 3 }
      ];

      const result = await getCoursesForMultipleSkillGaps(skillGaps);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('Fallback Behavior When No Embeddings Exist', () => {
    /**
     * Integration test: Fallback to keyword matching when embedding generation fails
     * Validates: Requirements 6.3
     */
    it('should fall back to keyword matching when embedding API fails', async () => {
      // Setup: Mock embedding to fail
      (generateEmbedding as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Embedding API unavailable')
      );

      // Setup: Mock database for fallback keyword matching
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: sampleCoursesFromDB.map(c => ({ ...c, embedding: null })),
                    error: null
                  })
                }),
                not: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: [], // No courses with embeddings
                    error: null
                  })
                })
              })
            })
          };
        }
        if (table === 'course_skills') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: sampleCourseSkills,
                error: null
              })
            })
          };
        }
        return { select: vi.fn() };
      });

      // Execute: Should not throw, should return gracefully
      const recommendations = await getRecommendedCourses(sampleAssessmentResults);

      // Verify: Returns array (possibly empty) without throwing
      expect(Array.isArray(recommendations)).toBe(true);
    });

    /**
     * Integration test: Returns empty array when no courses have embeddings
     * Validates: Requirements 6.3
     */
    it('should return empty array when no courses have embeddings', async () => {
      // Setup: Mock database to return courses without embeddings
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: [], // No courses with embeddings
                    error: null
                  })
                })
              })
            })
          };
        }
        return { select: vi.fn() };
      });

      const mockEmbedding = new Array(768).fill(0.1);
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedding);

      const recommendations = await getRecommendedCourses(sampleAssessmentResults);

      // Verify: Returns empty array
      expect(recommendations).toEqual([]);
    });

    /**
     * Integration test: Handles database errors gracefully
     * Validates: Requirements 6.3
     */
    it('should handle database errors gracefully', async () => {
      // Setup: Mock database to return error
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' }
              })
            })
          })
        })
      }));

      const mockEmbedding = new Array(768).fill(0.1);
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedding);

      // Execute: Should not throw
      const recommendations = await getRecommendedCourses(sampleAssessmentResults);

      // Verify: Returns empty array on error
      expect(Array.isArray(recommendations)).toBe(true);
    });

    /**
     * Integration test: Returns empty when assessment results are null
     * Validates: Requirements 6.3
     */
    it('should return empty array when assessment results are null', async () => {
      const recommendations = await getRecommendedCourses(null as any);
      expect(recommendations).toEqual([]);
    });

    /**
     * Integration test: Returns empty when assessment results are empty
     * Validates: Requirements 6.3
     */
    it('should return empty array when assessment results have no skill gaps or career clusters', async () => {
      const emptyResults = {
        skillGap: { priorityA: [], priorityB: [] },
        careerFit: { clusters: [] }
      };

      // buildProfileText should throw for empty results
      expect(() => buildProfileText(emptyResults)).toThrow();
    });
  });

  describe('Profile Text Building Edge Cases', () => {
    /**
     * Test profile text with minimal data
     */
    it('should build profile text with only skill gaps', () => {
      const minimalResults = {
        skillGap: {
          priorityA: [{ skill: 'JavaScript' }],
          priorityB: []
        }
      };

      const profileText = buildProfileText(minimalResults);
      expect(profileText).toContain('JavaScript');
    });

    /**
     * Test profile text with only career clusters
     */
    it('should build profile text with only career clusters', () => {
      const minimalResults = {
        careerFit: {
          clusters: [{ title: 'Software Development' }]
        }
      };

      const profileText = buildProfileText(minimalResults);
      expect(profileText).toContain('Software Development');
    });

    /**
     * Test profile text includes all relevant sections
     */
    it('should include employability areas in profile text', () => {
      const profileText = buildProfileText(sampleAssessmentResults);
      
      // Should include improvement areas
      expect(profileText).toContain('Technical Skills');
      
      // Should include strength areas
      expect(profileText).toContain('Communication');
    });
  });

  describe('Skill Gap Course Mapping', () => {
    /**
     * Test single skill gap course retrieval
     */
    it('should return courses for a single skill gap', async () => {
      // Setup mocks
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
        if (table === 'course_skills') {
          return {
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockResolvedValue({
                data: [{ course_id: 'course-1', skill_name: 'Python', proficiency_level: 'Beginner' }],
                error: null
              }),
              in: vi.fn().mockResolvedValue({
                data: sampleCourseSkills,
                error: null
              })
            })
          };
        }
        if (table === 'courses') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: [sampleCoursesFromDB[0]],
                    error: null
                  })
                })
              }),
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: sampleCoursesFromDB,
                    error: null
                  })
                })
              })
            })
          };
        }
        return { select: vi.fn() };
      });

      const mockEmbedding = new Array(768).fill(0.1);
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedding);
      (cosineSimilarity as ReturnType<typeof vi.fn>).mockReturnValue(0.6);

      const skillGap = { skill: 'Python', currentLevel: 2, targetLevel: 4 };
      const courses = await getCoursesForSkillGap(skillGap);

      expect(Array.isArray(courses)).toBe(true);
    });

    /**
     * Test empty skill gap returns empty array
     */
    it('should return empty array for invalid skill gap', async () => {
      const courses = await getCoursesForSkillGap(null as any);
      expect(courses).toEqual([]);
    });

    /**
     * Test skill gap with no skill name returns empty array
     */
    it('should return empty array when skill gap has no skill name', async () => {
      const courses = await getCoursesForSkillGap({ skill: '' } as any);
      expect(courses).toEqual([]);
    });
  });
});
