/**
 * Skill Gap Matcher
 * Matches courses to specific skill gaps using direct and semantic matching.
 */

import { cosineSimilarity } from '../../utils/vectorUtils';
import { generateSkillEmbedding } from './embeddingService';
import { fetchCoursesWithEmbeddings, fetchCoursesBySkillName } from './courseRepository';
import { calculateRelevanceScore, generateWhyThisCourse } from './utils';
import { MAX_COURSES_PER_SKILL_GAP, SKILL_SIMILARITY_THRESHOLD } from './config';

/**
 * Get courses that directly match a skill via the course_skills table.
 * 
 * @param {string} skillName - The skill name to search for
 * @returns {Promise<Array>} - Array of matching courses
 */
export const getDirectSkillMatches = async (skillName) => {
  return fetchCoursesBySkillName(skillName);
};

/**
 * Get courses that semantically match a skill via embedding similarity.
 * 
 * @param {string} skillName - The skill name to search for
 * @param {Array} allCoursesWithEmbeddings - Pre-fetched courses with embeddings (optional)
 * @returns {Promise<Array>} - Array of semantically matching courses
 */
export const getSemanticSkillMatches = async (skillName, allCoursesWithEmbeddings = null) => {
  try {
    // Generate embedding for the skill
    let skillEmbedding;
    try {
      skillEmbedding = await generateSkillEmbedding(skillName);
    } catch (error) {
      console.warn('Failed to generate skill embedding:', error.message);
      return [];
    }

    // Get courses with embeddings
    const courses = allCoursesWithEmbeddings || await fetchCoursesWithEmbeddings();
    
    if (courses.length === 0) {
      return [];
    }

    // Calculate similarity scores
    const scoredCourses = courses
      .filter(course => course.embedding && Array.isArray(course.embedding))
      .map(course => {
        const similarity = cosineSimilarity(skillEmbedding, course.embedding);
        return {
          course_id: course.course_id,
          title: course.title,
          code: course.code,
          description: course.description,
          duration: course.duration,
          category: course.category,
          skills: course.skills || [],
          target_outcomes: course.target_outcomes || [],
          match_type: 'semantic',
          match_strength: similarity,
          _similarity: similarity
        };
      })
      .filter(course => course._similarity >= SKILL_SIMILARITY_THRESHOLD)
      .sort((a, b) => b._similarity - a._similarity)
      .slice(0, 5); // Get top 5 semantic matches

    return scoredCourses;
  } catch (error) {
    console.error('Error in getSemanticSkillMatches:', error);
    return [];
  }
};

/**
 * Combine direct and semantic matches, removing duplicates and ranking.
 * 
 * @param {Array} directMatches - Courses from direct skill matching
 * @param {Array} semanticMatches - Courses from semantic matching
 * @param {string} skillLower - Lowercase skill name for additional matching
 * @returns {Array} - Combined and ranked courses
 */
export const combineAndRankCourses = (directMatches, semanticMatches, skillLower) => {
  const courseMap = new Map();

  // Add direct matches first (higher priority)
  directMatches.forEach(course => {
    courseMap.set(course.course_id, {
      ...course,
      relevance_score: calculateRelevanceScore(course.match_strength),
      match_reasons: [`Directly teaches ${course.matched_skill || skillLower}`]
    });
  });

  // Add semantic matches, merging if already exists
  semanticMatches.forEach(course => {
    if (courseMap.has(course.course_id)) {
      // Course already exists from direct match - boost its score
      const existing = courseMap.get(course.course_id);
      existing.relevance_score = Math.min(100, existing.relevance_score + 10);
      existing.match_reasons.push('Strong semantic match to skill');
    } else {
      // New course from semantic match
      courseMap.set(course.course_id, {
        ...course,
        relevance_score: calculateRelevanceScore(course.match_strength),
        match_reasons: ['Semantically related to skill']
      });
    }
  });

  // Convert to array and sort by relevance
  return Array.from(courseMap.values())
    .sort((a, b) => b.relevance_score - a.relevance_score);
};

/**
 * Get courses that address a specific skill gap.
 * Uses both course_skills table matching and semantic similarity.
 * 
 * @param {Object} skillGap - Skill gap object with skill name and optional level info
 * @param {string} skillGap.skill - The skill name to find courses for
 * @param {number} [skillGap.currentLevel] - Current skill level (optional)
 * @param {number} [skillGap.targetLevel] - Target skill level (optional)
 * @param {Array} [allCoursesWithEmbeddings] - Pre-fetched courses with embeddings (optional)
 * @returns {Promise<Array>} - Array of 1-3 courses addressing the skill gap
 * 
 * Requirements: 5.1, 5.2, 5.4
 */
export const getCoursesForSkillGap = async (skillGap, allCoursesWithEmbeddings = null) => {
  if (!skillGap || !skillGap.skill) {
    console.warn('Invalid skill gap provided');
    return [];
  }

  const skillName = skillGap.skill;
  const skillLower = skillName.toLowerCase();

  try {
    // Step 1: Try direct matching via course_skills table (Requirement 5.2)
    const directMatches = await getDirectSkillMatches(skillName);
    
    // Step 2: Get semantic matches via embedding similarity (Requirement 5.2)
    const semanticMatches = await getSemanticSkillMatches(skillName, allCoursesWithEmbeddings);
    
    // Step 3: Combine and deduplicate results
    const combinedCourses = combineAndRankCourses(directMatches, semanticMatches, skillLower);
    
    // Step 4: Limit to 1-3 courses (Requirement 5.1)
    const limitedCourses = combinedCourses.slice(0, MAX_COURSES_PER_SKILL_GAP);
    
    // Step 5: Generate "Why this course" explanations (Requirement 5.4)
    const coursesWithExplanations = limitedCourses.map(course => ({
      ...course,
      why_this_course: generateWhyThisCourse(course, skillGap),
      skill_gap_addressed: skillName
    }));

    return coursesWithExplanations;
  } catch (error) {
    console.error(`Error getting courses for skill gap "${skillName}":`, error);
    return [];
  }
};

/**
 * Get courses for multiple skill gaps at once.
 * Optimized to fetch courses once and reuse for all skill gaps.
 * 
 * @param {Array} skillGaps - Array of skill gap objects
 * @returns {Promise<Object>} - Map of skill name to array of courses
 */
export const getCoursesForMultipleSkillGaps = async (skillGaps) => {
  if (!skillGaps || !Array.isArray(skillGaps) || skillGaps.length === 0) {
    return {};
  }

  try {
    // Fetch all courses with embeddings once
    const allCourses = await fetchCoursesWithEmbeddings();
    
    // Process each skill gap
    const results = {};
    for (const skillGap of skillGaps) {
      if (skillGap && skillGap.skill) {
        results[skillGap.skill] = await getCoursesForSkillGap(skillGap, allCourses);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error getting courses for multiple skill gaps:', error);
    return {};
  }
};
