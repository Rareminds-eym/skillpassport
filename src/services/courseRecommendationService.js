/**
 * Course Recommendation Service
 * Provides RAG-based course recommendations using vector similarity search
 * to match student assessment profiles with platform courses.
 * 
 * Feature: rag-course-recommendations
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4
 */

import { supabase } from '../lib/supabaseClient';
import { cosineSimilarity, generateEmbedding } from './embeddingService';

// Configuration
const MAX_RECOMMENDATIONS = 10; // Maximum courses to return (Requirement 3.2)
const MIN_SIMILARITY_THRESHOLD = 0.3; // Minimum cosine similarity to include

/**
 * Build a composite text representation of the student's profile
 * from assessment results for embedding generation.
 * 
 * Includes skill gaps, career clusters, and employability areas
 * with skill gaps and career clusters weighted as primary factors.
 * 
 * @param {Object} assessmentResults - Assessment results from Gemini analysis
 * @returns {string} - Composite profile text for embedding
 * 
 * Requirements: 2.1, 2.2
 */
export const buildProfileText = (assessmentResults) => {
  if (!assessmentResults) {
    throw new Error('Assessment results are required');
  }

  const parts = [];

  // Priority 1: Skill Gaps (Primary Factor - Requirement 2.2)
  const skillGap = assessmentResults.skillGap;
  if (skillGap) {
    // Priority A skills (most important)
    if (skillGap.priorityA && Array.isArray(skillGap.priorityA) && skillGap.priorityA.length > 0) {
      const priorityASkills = skillGap.priorityA
        .map(s => s.skill)
        .filter(Boolean)
        .join(', ');
      if (priorityASkills) {
        parts.push(`Priority Skills to Develop: ${priorityASkills}`);
      }
    }

    // Priority B skills (secondary)
    if (skillGap.priorityB && Array.isArray(skillGap.priorityB) && skillGap.priorityB.length > 0) {
      const priorityBSkills = skillGap.priorityB
        .map(s => s.skill)
        .filter(Boolean)
        .join(', ');
      if (priorityBSkills) {
        parts.push(`Secondary Skills to Develop: ${priorityBSkills}`);
      }
    }

    // Current strengths
    if (skillGap.currentStrengths && Array.isArray(skillGap.currentStrengths) && skillGap.currentStrengths.length > 0) {
      parts.push(`Current Strengths: ${skillGap.currentStrengths.join(', ')}`);
    }

    // Recommended learning track
    if (skillGap.recommendedTrack) {
      parts.push(`Recommended Learning Track: ${skillGap.recommendedTrack}`);
    }
  }

  // Priority 2: Career Clusters (Primary Factor - Requirement 2.2)
  const careerFit = assessmentResults.careerFit;
  if (careerFit && careerFit.clusters && Array.isArray(careerFit.clusters)) {
    // Get top career cluster (highest fit)
    const topClusters = careerFit.clusters
      .filter(c => c && c.title)
      .slice(0, 3); // Top 3 clusters

    if (topClusters.length > 0) {
      const clusterTitles = topClusters.map(c => c.title).join(', ');
      parts.push(`Career Interests: ${clusterTitles}`);

      // Add domains from top cluster
      const topCluster = topClusters[0];
      if (topCluster.domains && Array.isArray(topCluster.domains) && topCluster.domains.length > 0) {
        parts.push(`Target Domains: ${topCluster.domains.join(', ')}`);
      }

      // Add entry-level roles from top cluster
      if (topCluster.roles && topCluster.roles.entry && Array.isArray(topCluster.roles.entry)) {
        parts.push(`Target Roles: ${topCluster.roles.entry.join(', ')}`);
      }
    }
  }

  // Priority 3: Employability Areas
  const employability = assessmentResults.employability;
  if (employability) {
    // Improvement areas
    if (employability.improvementAreas && Array.isArray(employability.improvementAreas) && employability.improvementAreas.length > 0) {
      parts.push(`Areas to Improve: ${employability.improvementAreas.join(', ')}`);
    }

    // Strength areas
    if (employability.strengthAreas && Array.isArray(employability.strengthAreas) && employability.strengthAreas.length > 0) {
      parts.push(`Employability Strengths: ${employability.strengthAreas.join(', ')}`);
    }
  }

  // Additional context: RIASEC code
  const riasec = assessmentResults.riasec;
  if (riasec && riasec.code) {
    parts.push(`RIASEC Profile: ${riasec.code}`);
  }

  // Additional context: Aptitude strengths
  const aptitude = assessmentResults.aptitude;
  if (aptitude && aptitude.topStrengths && Array.isArray(aptitude.topStrengths)) {
    parts.push(`Aptitude Strengths: ${aptitude.topStrengths.join(', ')}`);
  }

  // Additional context: Stream/field of study
  if (assessmentResults.stream) {
    parts.push(`Field of Study: ${assessmentResults.stream}`);
  }

  if (parts.length === 0) {
    throw new Error('Assessment results must contain skill gaps or career clusters');
  }

  return parts.join('\n\n');
};


/**
 * Fetch all active courses with embeddings from the database.
 * Only returns courses that have embeddings and are active.
 * 
 * @returns {Promise<Array>} - Array of courses with embeddings
 * 
 * Requirements: 3.3
 */
export const fetchCoursesWithEmbeddings = async () => {
  try {
    // Fetch active courses with embeddings
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        course_id,
        title,
        code,
        description,
        duration,
        category,
        target_outcomes,
        status,
        embedding
      `)
      .eq('status', 'Active')
      .not('embedding', 'is', null)
      .is('deleted_at', null);

    if (error) {
      console.error('Failed to fetch courses with embeddings:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!courses || courses.length === 0) {
      return [];
    }

    // Fetch skills for each course
    const courseIds = courses.map(c => c.course_id);
    const { data: skillsData, error: skillsError } = await supabase
      .from('course_skills')
      .select('course_id, skill_name')
      .in('course_id', courseIds);

    if (skillsError) {
      console.warn('Failed to fetch course skills:', skillsError.message);
    }

    // Group skills by course_id
    const skillsByCourse = {};
    if (skillsData) {
      skillsData.forEach(s => {
        if (!skillsByCourse[s.course_id]) {
          skillsByCourse[s.course_id] = [];
        }
        skillsByCourse[s.course_id].push(s.skill_name);
      });
    }

    // Combine courses with their skills and parse embeddings
    return courses.map(course => ({
      ...course,
      skills: skillsByCourse[course.course_id] || [],
      // Parse embedding from string format '[0.1, 0.2, ...]' to array
      embedding: parseEmbedding(course.embedding)
    }));
  } catch (error) {
    console.error('Error fetching courses with embeddings:', error);
    throw error;
  }
};

/**
 * Parse embedding from database format to array
 * Handles both string format '[0.1, 0.2, ...]' and array format
 * 
 * @param {string|Array} embedding - Embedding in database format
 * @returns {number[]|null} - Parsed embedding array or null
 */
const parseEmbedding = (embedding) => {
  if (!embedding) return null;
  
  // If already an array, return as-is
  if (Array.isArray(embedding)) return embedding;
  
  // If string, parse it
  if (typeof embedding === 'string') {
    try {
      // Handle pgvector format: '[0.1,0.2,...]'
      const parsed = JSON.parse(embedding);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Try parsing without JSON (raw pgvector format)
      try {
        const cleaned = embedding.replace(/[\[\]]/g, '');
        return cleaned.split(',').map(Number);
      } catch {
        console.warn('Failed to parse embedding:', embedding.substring(0, 50));
        return null;
      }
    }
  }
  
  return null;
};

/**
 * Calculate relevance score from cosine similarity
 * Converts similarity (-1 to 1) to percentage (0 to 100)
 * 
 * @param {number} similarity - Cosine similarity value
 * @returns {number} - Relevance score 0-100
 * 
 * Requirements: 3.4
 */
const calculateRelevanceScore = (similarity) => {
  // Cosine similarity ranges from -1 to 1
  // Convert to 0-100 scale where 1 = 100, 0 = 50, -1 = 0
  const score = Math.round(((similarity + 1) / 2) * 100);
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, score));
};

/**
 * Generate match reasons based on course and profile data
 * 
 * @param {Object} course - Course object
 * @param {Object} assessmentResults - Assessment results
 * @returns {string[]} - Array of match reasons
 */
const generateMatchReasons = (course, assessmentResults) => {
  const reasons = [];
  
  // Check skill overlap
  const courseSkills = course.skills || [];
  const skillGap = assessmentResults.skillGap;
  
  if (skillGap) {
    // Check priority A skills
    const priorityASkills = (skillGap.priorityA || []).map(s => s.skill?.toLowerCase());
    const matchedPriorityA = courseSkills.filter(s => 
      priorityASkills.some(ps => ps && s.toLowerCase().includes(ps))
    );
    if (matchedPriorityA.length > 0) {
      reasons.push(`Addresses priority skill: ${matchedPriorityA[0]}`);
    }
    
    // Check priority B skills
    const priorityBSkills = (skillGap.priorityB || []).map(s => s.skill?.toLowerCase());
    const matchedPriorityB = courseSkills.filter(s => 
      priorityBSkills.some(ps => ps && s.toLowerCase().includes(ps))
    );
    if (matchedPriorityB.length > 0 && reasons.length < 2) {
      reasons.push(`Develops skill: ${matchedPriorityB[0]}`);
    }
  }
  
  // Check career cluster alignment
  const careerFit = assessmentResults.careerFit;
  if (careerFit && careerFit.clusters && careerFit.clusters.length > 0) {
    const topCluster = careerFit.clusters[0];
    if (topCluster.domains) {
      const courseDesc = (course.description || '').toLowerCase();
      const matchedDomain = topCluster.domains.find(d => 
        courseDesc.includes(d.toLowerCase())
      );
      if (matchedDomain && reasons.length < 3) {
        reasons.push(`Relevant to ${matchedDomain} domain`);
      }
    }
  }
  
  // Default reason based on semantic match
  if (reasons.length === 0) {
    reasons.push('Matches your career profile');
  }
  
  return reasons;
};

/**
 * Identify which skill gaps a course addresses
 * 
 * @param {Object} course - Course object
 * @param {Object} assessmentResults - Assessment results
 * @returns {string[]} - Array of skill gap names addressed
 */
const identifySkillGapsAddressed = (course, assessmentResults) => {
  const addressed = [];
  const courseSkills = (course.skills || []).map(s => s.toLowerCase());
  const courseDesc = (course.description || '').toLowerCase();
  const courseTitle = (course.title || '').toLowerCase();
  
  const skillGap = assessmentResults.skillGap;
  if (!skillGap) return addressed;
  
  // Check priority A skills
  (skillGap.priorityA || []).forEach(s => {
    if (!s.skill) return;
    const skillLower = s.skill.toLowerCase();
    const matches = courseSkills.some(cs => cs.includes(skillLower) || skillLower.includes(cs)) ||
                   courseDesc.includes(skillLower) ||
                   courseTitle.includes(skillLower);
    if (matches) {
      addressed.push(s.skill);
    }
  });
  
  // Check priority B skills
  (skillGap.priorityB || []).forEach(s => {
    if (!s.skill) return;
    const skillLower = s.skill.toLowerCase();
    const matches = courseSkills.some(cs => cs.includes(skillLower) || skillLower.includes(cs)) ||
                   courseDesc.includes(skillLower) ||
                   courseTitle.includes(skillLower);
    if (matches && !addressed.includes(s.skill)) {
      addressed.push(s.skill);
    }
  });
  
  return addressed;
};


/**
 * Get recommended courses for a student based on their assessment results.
 * Uses vector similarity search to find semantically similar courses.
 * 
 * @param {Object} assessmentResults - Assessment results from Gemini analysis
 * @returns {Promise<Array<RecommendedCourse>>} - Array of recommended courses with relevance scores
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
      .filter(course => course.embedding && Array.isArray(course.embedding))
      .map(course => {
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
          _similarity: similarity // Keep for sorting
        };
      })
      // Filter by minimum threshold
      .filter(course => course._similarity >= MIN_SIMILARITY_THRESHOLD);

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
 * Fallback to keyword-based matching when embedding generation fails.
 * Uses course_skills table and text matching.
 * 
 * @param {Object} assessmentResults - Assessment results
 * @returns {Promise<Array>} - Array of matched courses
 * 
 * Requirements: 6.3
 */
const fallbackKeywordMatching = async (assessmentResults) => {
  try {
    // Extract keywords from assessment results
    const keywords = [];
    
    // Add skill gap keywords
    const skillGap = assessmentResults.skillGap;
    if (skillGap) {
      (skillGap.priorityA || []).forEach(s => s.skill && keywords.push(s.skill));
      (skillGap.priorityB || []).forEach(s => s.skill && keywords.push(s.skill));
    }
    
    // Add career cluster keywords
    const careerFit = assessmentResults.careerFit;
    if (careerFit && careerFit.clusters) {
      careerFit.clusters.forEach(c => {
        if (c.title) keywords.push(c.title);
        if (c.domains) keywords.push(...c.domains);
      });
    }
    
    if (keywords.length === 0) {
      return [];
    }

    // Search for courses matching these keywords
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        course_id,
        title,
        code,
        description,
        duration,
        category,
        target_outcomes,
        status
      `)
      .eq('status', 'Active')
      .is('deleted_at', null)
      .limit(MAX_RECOMMENDATIONS);

    if (error || !courses) {
      console.error('Fallback query failed:', error?.message);
      return [];
    }

    // Fetch skills for courses
    const courseIds = courses.map(c => c.course_id);
    const { data: skillsData } = await supabase
      .from('course_skills')
      .select('course_id, skill_name')
      .in('course_id', courseIds);

    // Group skills by course
    const skillsByCourse = {};
    (skillsData || []).forEach(s => {
      if (!skillsByCourse[s.course_id]) {
        skillsByCourse[s.course_id] = [];
      }
      skillsByCourse[s.course_id].push(s.skill_name);
    });

    // Score courses by keyword matches
    const scoredCourses = courses.map(course => {
      const courseSkills = skillsByCourse[course.course_id] || [];
      const courseText = `${course.title} ${course.description || ''} ${courseSkills.join(' ')}`.toLowerCase();
      
      let matchCount = 0;
      keywords.forEach(keyword => {
        if (courseText.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      });
      
      return {
        course_id: course.course_id,
        title: course.title,
        code: course.code,
        description: course.description,
        duration: course.duration,
        category: course.category,
        skills: courseSkills,
        target_outcomes: course.target_outcomes || [],
        relevance_score: Math.min(100, Math.round((matchCount / keywords.length) * 100)),
        match_reasons: ['Matched by keywords'],
        skill_gaps_addressed: [],
        _matchCount: matchCount
      };
    });

    // Return top matches
    return scoredCourses
      .filter(c => c._matchCount > 0)
      .sort((a, b) => b._matchCount - a._matchCount)
      .slice(0, MAX_RECOMMENDATIONS)
      .map(({ _matchCount, ...course }) => course);
  } catch (error) {
    console.error('Fallback keyword matching failed:', error);
    return [];
  }
};

// Configuration for skill gap course mapping
const MAX_COURSES_PER_SKILL_GAP = 3; // Maximum courses per skill gap (Requirement 5.1)
const MIN_COURSES_PER_SKILL_GAP = 1; // Minimum courses to return if available

/**
 * Get courses that address a specific skill gap.
 * Uses both course_skills table matching and semantic similarity.
 * 
 * @param {Object} skillGap - Skill gap object with skill name and optional level info
 * @param {string} skillGap.skill - The skill name to find courses for
 * @param {number} [skillGap.currentLevel] - Current skill level (optional)
 * @param {number} [skillGap.targetLevel] - Target skill level (optional)
 * @param {Array} [allCoursesWithEmbeddings] - Pre-fetched courses with embeddings (optional, for performance)
 * @returns {Promise<Array<RecommendedCourse>>} - Array of 1-3 courses addressing the skill gap
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
 * Get courses that directly match a skill via the course_skills table.
 * 
 * @param {string} skillName - The skill name to search for
 * @returns {Promise<Array>} - Array of matching courses
 */
const getDirectSkillMatches = async (skillName) => {
  try {
    const skillLower = skillName.toLowerCase();
    
    // Query course_skills table for matching skills
    const { data: skillMatches, error: skillError } = await supabase
      .from('course_skills')
      .select('course_id, skill_name, proficiency_level')
      .ilike('skill_name', `%${skillLower}%`);

    if (skillError) {
      console.warn('Error querying course_skills:', skillError.message);
      return [];
    }

    if (!skillMatches || skillMatches.length === 0) {
      return [];
    }

    // Get unique course IDs
    const courseIds = [...new Set(skillMatches.map(s => s.course_id))];

    // Fetch course details for matching courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        course_id,
        title,
        code,
        description,
        duration,
        category,
        target_outcomes,
        status
      `)
      .in('course_id', courseIds)
      .eq('status', 'Active')
      .is('deleted_at', null);

    if (coursesError || !courses) {
      console.warn('Error fetching courses for skill matches:', coursesError?.message);
      return [];
    }

    // Fetch all skills for these courses
    const { data: allSkills } = await supabase
      .from('course_skills')
      .select('course_id, skill_name')
      .in('course_id', courseIds);

    // Group skills by course
    const skillsByCourse = {};
    (allSkills || []).forEach(s => {
      if (!skillsByCourse[s.course_id]) {
        skillsByCourse[s.course_id] = [];
      }
      skillsByCourse[s.course_id].push(s.skill_name);
    });

    // Calculate match strength based on skill name similarity
    return courses.map(course => {
      const courseSkills = skillsByCourse[course.course_id] || [];
      const matchedSkill = skillMatches.find(s => s.course_id === course.course_id);
      
      // Calculate how closely the skill matches
      const exactMatch = courseSkills.some(s => s.toLowerCase() === skillLower);
      const partialMatch = courseSkills.some(s => 
        s.toLowerCase().includes(skillLower) || skillLower.includes(s.toLowerCase())
      );
      
      return {
        course_id: course.course_id,
        title: course.title,
        code: course.code,
        description: course.description,
        duration: course.duration,
        category: course.category,
        skills: courseSkills,
        target_outcomes: course.target_outcomes || [],
        match_type: 'direct',
        match_strength: exactMatch ? 1.0 : (partialMatch ? 0.8 : 0.6),
        matched_skill: matchedSkill?.skill_name,
        proficiency_level: matchedSkill?.proficiency_level
      };
    });
  } catch (error) {
    console.error('Error in getDirectSkillMatches:', error);
    return [];
  }
};

/**
 * Get courses that semantically match a skill via embedding similarity.
 * 
 * @param {string} skillName - The skill name to search for
 * @param {Array} allCoursesWithEmbeddings - Pre-fetched courses with embeddings (optional)
 * @returns {Promise<Array>} - Array of semantically matching courses
 */
const getSemanticSkillMatches = async (skillName, allCoursesWithEmbeddings = null) => {
  try {
    // Generate embedding for the skill
    let skillEmbedding;
    try {
      const skillText = `Skill: ${skillName}. Looking for courses that teach ${skillName} skills and competencies.`;
      skillEmbedding = await generateEmbedding(skillText);
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
      .filter(course => course._similarity >= 0.4) // Higher threshold for skill-specific matching
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
const combineAndRankCourses = (directMatches, semanticMatches, skillLower) => {
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
  const combined = Array.from(courseMap.values())
    .sort((a, b) => b.relevance_score - a.relevance_score);

  return combined;
};

/**
 * Generate a "Why this course" explanation based on skill overlap.
 * 
 * @param {Object} course - Course object
 * @param {Object} skillGap - Skill gap object
 * @returns {string} - Explanation of why this course addresses the skill gap
 * 
 * Requirements: 5.4
 */
const generateWhyThisCourse = (course, skillGap) => {
  const skillName = skillGap.skill;
  const courseSkills = course.skills || [];
  const matchedSkill = course.matched_skill;
  
  // Check for direct skill match
  if (matchedSkill) {
    if (matchedSkill.toLowerCase() === skillName.toLowerCase()) {
      return `This course directly covers ${skillName}, helping you build proficiency in this area.`;
    }
    return `This course teaches ${matchedSkill}, which is closely related to ${skillName}.`;
  }
  
  // Check for skill overlap in course skills
  const relatedSkills = courseSkills.filter(s => 
    s.toLowerCase().includes(skillName.toLowerCase()) || 
    skillName.toLowerCase().includes(s.toLowerCase())
  );
  
  if (relatedSkills.length > 0) {
    return `This course covers ${relatedSkills.slice(0, 2).join(' and ')}, which will help develop your ${skillName} skills.`;
  }
  
  // Check course title/description for relevance
  const courseTitle = course.title || '';
  const courseDesc = course.description || '';
  
  if (courseTitle.toLowerCase().includes(skillName.toLowerCase())) {
    return `This course focuses on ${skillName} as indicated by its title and curriculum.`;
  }
  
  if (courseDesc.toLowerCase().includes(skillName.toLowerCase())) {
    return `This course content addresses ${skillName} concepts and applications.`;
  }
  
  // Default explanation based on semantic match
  if (course.match_type === 'semantic') {
    return `This course content is semantically aligned with ${skillName} development.`;
  }
  
  return `This course can help you develop skills related to ${skillName}.`;
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

/**
 * Save course recommendations to the database.
 * Creates records in student_course_recommendations table.
 * 
 * @param {string} studentId - Student's user_id
 * @param {Array} recommendations - Array of recommended courses from getRecommendedCourses
 * @param {string} assessmentResultId - ID of the assessment result (optional)
 * @param {string} recommendationType - Type: 'assessment', 'skill_gap', 'career_path', 'manual'
 * @returns {Promise<Array>} - Array of saved recommendation records
 */
export const saveRecommendations = async (
  studentId,
  recommendations,
  assessmentResultId = null,
  recommendationType = 'assessment'
) => {
  if (!studentId || !recommendations || recommendations.length === 0) {
    console.warn('Missing required parameters for saving recommendations');
    return [];
  }

  try {
    // Prepare records for insertion
    const records = recommendations.map(rec => ({
      student_id: studentId,
      course_id: rec.course_id,
      assessment_result_id: assessmentResultId,
      relevance_score: rec.relevance_score,
      match_reasons: rec.match_reasons || [],
      skill_gaps_addressed: rec.skill_gaps_addressed || [],
      recommendation_type: recommendationType,
      status: 'active',
      recommended_at: new Date().toISOString()
    }));

    // Upsert to handle duplicates (update if exists)
    const { data, error } = await supabase
      .from('student_course_recommendations')
      .upsert(records, {
        onConflict: 'student_id,course_id,assessment_result_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Failed to save recommendations:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error saving recommendations:', error);
    throw error;
  }
};

/**
 * Get saved recommendations for a student from the database.
 * 
 * @param {string} studentId - Student's user_id
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status ('active', 'enrolled', 'dismissed', 'completed')
 * @param {string} options.assessmentResultId - Filter by specific assessment result
 * @param {boolean} options.includeCourseDetails - Join with courses table for full details
 * @returns {Promise<Array>} - Array of recommendation records
 */
export const getSavedRecommendations = async (studentId, options = {}) => {
  if (!studentId) {
    console.warn('Student ID required to get saved recommendations');
    return [];
  }

  try {
    let query = supabase
      .from('student_course_recommendations')
      .select(`
        *,
        course:courses(
          course_id,
          title,
          code,
          description,
          duration,
          category,
          status
        )
      `)
      .eq('student_id', studentId)
      .order('relevance_score', { ascending: false });

    // Apply filters
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.assessmentResultId) {
      query = query.eq('assessment_result_id', options.assessmentResultId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get saved recommendations:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting saved recommendations:', error);
    return [];
  }
};

/**
 * Update recommendation status (e.g., when student enrolls or dismisses).
 * 
 * @param {string} recommendationId - ID of the recommendation record
 * @param {string} status - New status: 'active', 'enrolled', 'dismissed', 'completed'
 * @param {string} dismissedReason - Reason for dismissal (optional)
 * @returns {Promise<Object>} - Updated recommendation record
 */
export const updateRecommendationStatus = async (recommendationId, status, dismissedReason = null) => {
  if (!recommendationId || !status) {
    throw new Error('Recommendation ID and status are required');
  }

  const validStatuses = ['active', 'enrolled', 'dismissed', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'dismissed') {
      updateData.dismissed_at = new Date().toISOString();
      updateData.dismissed_reason = dismissedReason;
    }

    const { data, error } = await supabase
      .from('student_course_recommendations')
      .update(updateData)
      .eq('id', recommendationId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update recommendation status:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    throw error;
  }
};

/**
 * Get recommendations and save them to the database.
 * Combines getRecommendedCourses with saveRecommendations.
 * 
 * @param {string} studentId - Student's user_id
 * @param {Object} assessmentResults - Assessment results from Gemini analysis
 * @param {string} assessmentResultId - ID of the assessment result record
 * @returns {Promise<Array>} - Array of recommended courses (also saved to DB)
 */
export const getAndSaveRecommendations = async (studentId, assessmentResults, assessmentResultId = null) => {
  if (!studentId || !assessmentResults) {
    console.warn('Student ID and assessment results required');
    return [];
  }

  try {
    // Get recommendations
    const recommendations = await getRecommendedCourses(assessmentResults);
    
    if (recommendations.length === 0) {
      return [];
    }

    // Save to database
    await saveRecommendations(studentId, recommendations, assessmentResultId, 'assessment');
    
    return recommendations;
  } catch (error) {
    console.error('Error in getAndSaveRecommendations:', error);
    // Return recommendations even if save fails
    return await getRecommendedCourses(assessmentResults);
  }
};

/**
 * Fetch courses by skill type (technical or soft) with embeddings.
 * 
 * @param {string} skillType - 'technical' or 'soft'
 * @returns {Promise<Array>} - Array of courses with embeddings
 */
export const fetchCoursesBySkillType = async (skillType) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        course_id,
        title,
        code,
        description,
        duration,
        category,
        target_outcomes,
        status,
        skill_type,
        embedding
      `)
      .eq('status', 'Active')
      .eq('skill_type', skillType)
      .not('embedding', 'is', null)
      .is('deleted_at', null);

    if (error) {
      console.error(`Failed to fetch ${skillType} courses:`, error.message);
      return [];
    }

    if (!courses || courses.length === 0) {
      return [];
    }

    // Fetch skills for each course
    const courseIds = courses.map(c => c.course_id);
    const { data: skillsData } = await supabase
      .from('course_skills')
      .select('course_id, skill_name')
      .in('course_id', courseIds);

    // Group skills by course_id
    const skillsByCourse = {};
    if (skillsData) {
      skillsData.forEach(s => {
        if (!skillsByCourse[s.course_id]) {
          skillsByCourse[s.course_id] = [];
        }
        skillsByCourse[s.course_id].push(s.skill_name);
      });
    }

    return courses.map(course => ({
      ...course,
      skills: skillsByCourse[course.course_id] || [],
      embedding: parseEmbedding(course.embedding)
    }));
  } catch (error) {
    console.error(`Error fetching ${skillType} courses:`, error);
    return [];
  }
};

/**
 * Get recommended courses separated by skill type (technical vs soft).
 * Fetches and ranks each type independently to ensure both are represented.
 * 
 * @param {Object} assessmentResults - Assessment results from Gemini analysis
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
      fetchCoursesBySkillType('soft')
    ]);

    // Score and rank technical courses
    const rankedTechnical = technicalCourses
      .filter(course => course.embedding && Array.isArray(course.embedding))
      .map(course => {
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
          _similarity: similarity
        };
      })
      .sort((a, b) => b._similarity - a._similarity)
      .slice(0, maxPerType)
      .map(({ _similarity, ...course }) => course);

    // Score and rank soft courses
    const rankedSoft = softCourses
      .filter(course => course.embedding && Array.isArray(course.embedding))
      .map(course => {
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
          _similarity: similarity
        };
      })
      .sort((a, b) => b._similarity - a._similarity)
      .slice(0, maxPerType)
      .map(({ _similarity, ...course }) => course);

    return {
      technical: rankedTechnical,
      soft: rankedSoft
    };
  } catch (error) {
    console.error('Error getting courses by type:', error);
    return { technical: [], soft: [] };
  }
};

/**
 * Fallback fetch by type when embedding fails.
 * Returns top courses by category without similarity ranking.
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
        .limit(maxPerType)
    ]);

    return {
      technical: (technicalResult.data || []).map(c => ({
        ...c,
        skills: [],
        relevance_score: 70,
        match_reasons: ['Recommended course'],
        skill_gaps_addressed: []
      })),
      soft: (softResult.data || []).map(c => ({
        ...c,
        skills: [],
        relevance_score: 70,
        match_reasons: ['Recommended course'],
        skill_gaps_addressed: []
      }))
    };
  } catch (error) {
    console.error('Fallback fetch by type failed:', error);
    return { technical: [], soft: [] };
  }
};

// Default export for convenience
export default {
  buildProfileText,
  fetchCoursesWithEmbeddings,
  fetchCoursesBySkillType,
  getRecommendedCourses,
  getRecommendedCoursesByType,
  getCoursesForSkillGap,
  getCoursesForMultipleSkillGaps,
  saveRecommendations,
  getSavedRecommendations,
  updateRecommendationStatus,
  getAndSaveRecommendations
};
