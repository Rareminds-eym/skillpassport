/**
 * Recommendation Service
 * Main service for generating course recommendations from assessment results.
 * Uses optimized batch processing and multi-layer caching.
 */

import { supabase } from '../../lib/supabaseClient';
import { cosineSimilarity } from '../../utils/vectorUtils';
import { buildProfileText } from './profileBuilder';
import { generateEmbedding } from './embeddingService';
import { generateProfileAndSkillEmbeddings } from './embeddingBatch';
import {
  fetchCoursesWithEmbeddings,
  fetchCoursesBySkillType,
  fetchBasicCourses,
} from './courseRepository';
import { getDomainKeywordsWithCache } from './fieldDomainService.js';
import { calculateRelevanceScore, generateMatchReasons, identifySkillGapsAddressed } from './utils';
import { MAX_RECOMMENDATIONS, MIN_SIMILARITY_THRESHOLD, DEFAULT_FALLBACK_SCORE } from './config';

/**
 * Fallback to keyword-based matching when embedding generation fails.
 * Uses course_skills table and text matching.
 *
 * @param {Object} assessmentResults - Assessment results
 * @returns {Promise<Array>} - Array of matched courses
 *
 * Requirements: 6.3
 */
export const fallbackKeywordMatching = async (assessmentResults) => {
  try {
    // Extract keywords from assessment results
    const keywords = [];
    const fieldKeywords = []; // High-priority field-specific keywords

    // Add AI-generated field-specific keywords (highest priority)
    const stream = assessmentResults.stream || assessmentResults.branch_field;
    if (stream) {
      try {
        const domainKeywords = await getDomainKeywordsWithCache(stream);
        if (domainKeywords) {
          // Split AI-generated keywords and add to fieldKeywords
          const aiKeywords = domainKeywords.split(',').map((k) => k.trim().toLowerCase());
          fieldKeywords.push(...aiKeywords);
        }
      } catch (error) {
        console.warn('Failed to get AI keywords for fallback, using pattern matching');
      }
    }

    // Add skill gap keywords
    const skillGap = assessmentResults.skillGap;
    if (skillGap) {
      (skillGap.priorityA || []).forEach((s) => s.skill && keywords.push(s.skill));
      (skillGap.priorityB || []).forEach((s) => s.skill && keywords.push(s.skill));
    }

    // Add career cluster keywords
    const careerFit = assessmentResults.careerFit;
    if (careerFit && careerFit.clusters) {
      careerFit.clusters.forEach((c) => {
        if (c.title) keywords.push(c.title);
        if (c.domains) keywords.push(...c.domains);
      });
    }

    if (keywords.length === 0 && fieldKeywords.length === 0) {
      return [];
    }

    // Fetch basic courses
    const courses = await fetchBasicCourses(MAX_RECOMMENDATIONS);

    if (courses.length === 0) {
      return [];
    }

    // Score courses by keyword matches with field-specific boosting
    const scoredCourses = courses.map((course) => {
      const courseText =
        `${course.title} ${course.description || ''} ${(course.skills || []).join(' ')}`.toLowerCase();

      let matchCount = 0;
      let fieldMatchCount = 0;

      // Count field-specific keyword matches (weighted 2x)
      fieldKeywords.forEach((keyword) => {
        if (courseText.includes(keyword.toLowerCase())) {
          fieldMatchCount++;
        }
      });

      // Count general keyword matches
      keywords.forEach((keyword) => {
        if (courseText.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      });

      // Calculate weighted match score (field keywords count double)
      const totalMatches = fieldMatchCount * 2 + matchCount;
      const totalKeywords = fieldKeywords.length * 2 + keywords.length;

      return {
        course_id: course.course_id,
        title: course.title,
        code: course.code,
        description: course.description,
        duration: course.duration,
        category: course.category,
        skills: course.skills || [],
        target_outcomes: course.target_outcomes || [],
        relevance_score: Math.min(100, Math.round((totalMatches / totalKeywords) * 100)),
        match_reasons:
          fieldMatchCount > 0 ? ['Matched by field-specific keywords'] : ['Matched by keywords'],
        skill_gaps_addressed: [],
        _matchCount: totalMatches,
        _fieldMatchCount: fieldMatchCount,
      };
    });

    // Return top matches (prioritize field matches)
    return scoredCourses
      .filter((c) => c._matchCount > 0)
      .sort((a, b) => {
        // First sort by field matches, then by total matches
        if (b._fieldMatchCount !== a._fieldMatchCount) {
          return b._fieldMatchCount - a._fieldMatchCount;
        }
        return b._matchCount - a._matchCount;
      })
      .slice(0, MAX_RECOMMENDATIONS)
      .map(({ _matchCount, _fieldMatchCount, ...course }) => course);
  } catch (error) {
    console.error('Fallback keyword matching failed:', error);
    return [];
  }
};

/**
 * Get recommended courses for a student based on their assessment results.
 * Uses vector similarity search to find semantically similar courses.
 *
 * @param {Object} assessmentResults - Assessment results from AI analysis
 * @returns {Promise<Array>} - Array of recommended courses with relevance scores
 *
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4
 */
export const getRecommendedCourses = async (assessmentResults) => {
  if (!assessmentResults) {
    console.warn('No assessment results provided for course recommendations');
    return [];
  }

  try {
    // Step 1: Build profile text from assessment results (Requirement 2.1)
    let profileText;
    try {
      profileText = buildProfileText(assessmentResults);
    } catch (error) {
      console.warn('Failed to build profile text:', error.message);
      return [];
    }

    // Step 2: Generate embedding for the student profile (Requirement 2.3)
    let profileEmbedding;
    try {
      profileEmbedding = await generateEmbedding(profileText);
    } catch (error) {
      console.error('Failed to generate profile embedding:', error.message);
      // Fall back to keyword-based matching if embedding fails
      return await fallbackKeywordMatching(assessmentResults);
    }

    // Step 3: Fetch courses with embeddings (Requirement 3.3 - Active only)
    const courses = await fetchCoursesWithEmbeddings();

    if (courses.length === 0) {
      return [];
    }

    // Step 4: Calculate similarity scores for each course (Requirement 3.1)
    const scoredCourses = courses
      .filter((course) => course.embedding && Array.isArray(course.embedding))
      .map((course) => {
        const similarity = cosineSimilarity(profileEmbedding, course.embedding);
        const relevanceScore = calculateRelevanceScore(similarity);

        return {
          course_id: course.course_id,
          title: course.title,
          code: course.code,
          description: course.description,
          duration: course.duration,
          category: course.category,
          skills: course.skills,
          target_outcomes: course.target_outcomes || [],
          relevance_score: relevanceScore,
          match_reasons: generateMatchReasons(course, assessmentResults),
          skill_gaps_addressed: identifySkillGapsAddressed(course, assessmentResults),
          _similarity: similarity, // Keep for sorting
        };
      })
      // Filter by minimum threshold
      .filter((course) => course._similarity >= MIN_SIMILARITY_THRESHOLD);

    // Step 5: Sort by similarity and limit to top 10 (Requirement 3.2)
    const recommendations = scoredCourses
      .sort((a, b) => b._similarity - a._similarity)
      .slice(0, MAX_RECOMMENDATIONS)
      .map(({ _similarity, ...course }) => course); // Remove internal similarity field

    return recommendations;
  } catch (error) {
    console.error('Error getting course recommendations:', error);
    // Return empty array on error rather than throwing
    return [];
  }
};

/**
 * Fallback fetch by type when embedding fails.
 * Returns top courses by category without similarity ranking.
 *
 * @param {number} maxPerType - Maximum courses per type
 * @returns {Promise<{technical: Array, soft: Array}>}
 */
const fallbackFetchByType = async (maxPerType) => {
  try {
    const [technicalResult, softResult] = await Promise.all([
      supabase
        .from('courses')
        .select('course_id, title, code, description, duration, category, skill_type')
        .eq('status', 'Active')
        .eq('skill_type', 'technical')
        .is('deleted_at', null)
        .limit(maxPerType),
      supabase
        .from('courses')
        .select('course_id, title, code, description, duration, category, skill_type')
        .eq('status', 'Active')
        .eq('skill_type', 'soft')
        .is('deleted_at', null)
        .limit(maxPerType),
    ]);

    return {
      technical: (technicalResult.data || []).map((c) => ({
        ...c,
        skills: [],
        relevance_score: DEFAULT_FALLBACK_SCORE,
        match_reasons: ['Recommended course'],
        skill_gaps_addressed: [],
      })),
      soft: (softResult.data || []).map((c) => ({
        ...c,
        skills: [],
        relevance_score: DEFAULT_FALLBACK_SCORE,
        match_reasons: ['Recommended course'],
        skill_gaps_addressed: [],
      })),
    };
  } catch (error) {
    console.error('Fallback fetch by type failed:', error);
    return { technical: [], soft: [] };
  }
};

/**
 * Get recommended courses separated by skill type (technical vs soft).
 * Fetches and ranks each type independently to ensure both are represented.
 *
 * @param {Object} assessmentResults - Assessment results from AI analysis
 * @param {number} maxPerType - Maximum courses per skill type (default 5)
 * @returns {Promise<{technical: Array, soft: Array}>} - Courses separated by type
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export const getRecommendedCoursesByType = async (assessmentResults, maxPerType = 5) => {
  if (!assessmentResults) {
    console.warn('No assessment results provided');
    return { technical: [], soft: [] };
  }

  try {
    // Build profile text
    let profileText;
    try {
      profileText = buildProfileText(assessmentResults);
    } catch (error) {
      console.warn('Failed to build profile text:', error.message);
      return { technical: [], soft: [] };
    }

    // Generate profile embedding
    let profileEmbedding;
    try {
      profileEmbedding = await generateEmbedding(profileText);
    } catch (error) {
      console.error('Failed to generate profile embedding:', error.message);
      // Fallback to simple fetch without similarity ranking
      return await fallbackFetchByType(maxPerType);
    }

    // Fetch technical and soft courses separately
    const [technicalCourses, softCourses] = await Promise.all([
      fetchCoursesBySkillType('technical'),
      fetchCoursesBySkillType('soft'),
    ]);

    // Score and rank technical courses
    const rankedTechnical = technicalCourses
      .filter((course) => course.embedding && Array.isArray(course.embedding))
      .map((course) => {
        const similarity = cosineSimilarity(profileEmbedding, course.embedding);
        return {
          course_id: course.course_id,
          title: course.title,
          code: course.code,
          description: course.description,
          duration: course.duration,
          category: course.category,
          skills: course.skills,
          skill_type: 'technical',
          target_outcomes: course.target_outcomes || [],
          relevance_score: calculateRelevanceScore(similarity),
          match_reasons: generateMatchReasons(course, assessmentResults),
          skill_gaps_addressed: identifySkillGapsAddressed(course, assessmentResults),
          _similarity: similarity,
        };
      })
      .sort((a, b) => b._similarity - a._similarity)
      .slice(0, maxPerType)
      .map(({ _similarity, ...course }) => course);

    // Score and rank soft courses
    const rankedSoft = softCourses
      .filter((course) => course.embedding && Array.isArray(course.embedding))
      .map((course) => {
        const similarity = cosineSimilarity(profileEmbedding, course.embedding);
        return {
          course_id: course.course_id,
          title: course.title,
          code: course.code,
          description: course.description,
          duration: course.duration,
          category: course.category,
          skills: course.skills,
          skill_type: 'soft',
          target_outcomes: course.target_outcomes || [],
          relevance_score: calculateRelevanceScore(similarity),
          match_reasons: generateMatchReasons(course, assessmentResults),
          skill_gaps_addressed: identifySkillGapsAddressed(course, assessmentResults),
          _similarity: similarity,
        };
      })
      .sort((a, b) => b._similarity - a._similarity)
      .slice(0, maxPerType)
      .map(({ _similarity, ...course }) => course);

    return {
      technical: rankedTechnical,
      soft: rankedSoft,
    };
  } catch (error) {
    console.error('Error getting courses by type:', error);
    return { technical: [], soft: [] };
  }
};
