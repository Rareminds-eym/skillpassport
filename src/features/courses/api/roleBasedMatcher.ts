/**
 * Role-Based Course Matcher
 * Uses RAG (Retrieval-Augmented Generation) with vector similarity
 * to match courses to specific job roles.
 * 
 * This is optimized for the CareerTrackModal use case where we need
 * to quickly match 4 courses to a specific role.
 */

import { cosineSimilarity } from "@/shared/lib/vectorUtils";
import { generateEmbedding } from './embeddingService';
import { calculateRelevanceScore } from './utils';
import { parseEmbedding } from './utils';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('role-based-matcher');

/**
 * Match courses to a specific job role using RAG.
 * 
 * @param {string} roleName - Job role name (e.g., "Junior Accountant")
 * @param {string} clusterTitle - Career cluster (e.g., "Finance, Accounting & Business Management")
 * @param {Array} courses - Array of course objects from database
 * @param {number} limit - Number of courses to return (default 4)
 * @returns {Promise<Array>} - Top matched courses with relevance scores
 */
export const matchCoursesForRole = async (roleName, clusterTitle = '', courses = [], limit = 4) => {
  // Validate inputs
  if (!roleName || roleName.trim() === '') {
    return [];
  }

  if (!courses || courses.length === 0) {
    return [];
  }

  try {
    // Step 1: Pre-filter courses by domain relevance
    const domainKeywords = extractDomainKeywords(roleName, clusterTitle);
    const relevantCourses = preFilterCoursesByDomain(courses, roleName, clusterTitle, domainKeywords);
    
    // If we have enough relevant courses, use only those; otherwise use all
    const coursesToMatch = relevantCourses.length >= limit * 2 ? relevantCourses : courses;

    // Step 2: Build role context text for embedding
    const roleContext = buildRoleContext(roleName, clusterTitle);

    // Step 3: Generate embedding for the role
    let roleEmbedding;
    try {
      roleEmbedding = await generateEmbedding(roleContext);
      
      // Debug: Check if embedding is valid
      const sum = roleEmbedding.reduce((a, b) => a + Math.abs(b), 0);
      const avg = sum / roleEmbedding.length;
    } catch (error) {
      logger.error('Failed to generate role embedding', error instanceof Error ? error : new Error(String(error)));
      // Fallback to keyword matching
      return fallbackKeywordMatching(roleName, clusterTitle, coursesToMatch, limit);
    }

    // Step 4: Parse and filter courses that have embeddings
    const coursesWithEmbeddings = coursesToMatch
      .map(course => ({
        ...course,
        embedding: parseEmbedding(course.embedding)
      }))
      .filter(course => {
        const hasEmbedding = course.embedding && Array.isArray(course.embedding);
        return hasEmbedding;
      });

    // Debug: Check first course embedding
    if (coursesWithEmbeddings.length > 0) {
      const firstCourse = coursesWithEmbeddings[0];
      const sum = firstCourse.embedding.reduce((a, b) => a + Math.abs(b), 0);
      const avg = sum / firstCourse.embedding.length;
    }

    if (coursesWithEmbeddings.length === 0) {
      return fallbackKeywordMatching(roleName, clusterTitle, coursesToMatch, limit);
    }

    // Step 5: Calculate similarity scores
    const scoredCourses = coursesWithEmbeddings.map(course => {
      const similarity = cosineSimilarity(roleEmbedding, course.embedding);
      const relevanceScore = calculateRelevanceScore(similarity);

      return {
        course_id: course.course_id,
        title: course.title,
        code: course.code,
        description: course.description,
        duration: course.duration,
        category: course.category,
        skills: course.skills || [],
        target_outcomes: course.target_outcomes || [],
        thumbnail: course.thumbnail,
        relevance_score: relevanceScore,
        match_reason: `Matched to ${roleName} role`,
        _similarity: similarity
      };
    });

    // Step 6: Sort by similarity and return top N
    const topMatches = scoredCourses
      .sort((a, b) => b._similarity - a._similarity)
      .slice(0, limit)
      .map(({ _similarity, ...course }) => course);

    return topMatches;
  } catch (error) {
    logger.error('Error in role-based matching', error instanceof Error ? error : new Error(String(error)));
    // Fallback to keyword matching on error
    return fallbackKeywordMatching(roleName, clusterTitle, courses, limit);
  }
};

/**
 * Pre-filter courses by domain relevance before RAG matching.
 * This ensures we only match against courses that are relevant to the role's domain.
 * 
 * @param {Array} courses - All available courses
 * @param {string} roleName - Job role name
 * @param {string} clusterTitle - Career cluster
 * @param {string[]} domainKeywords - Domain-specific keywords
 * @returns {Array} - Filtered courses that match the domain
 */
function preFilterCoursesByDomain(courses, roleName, clusterTitle, domainKeywords) {
  if (domainKeywords.length === 0) {
    // No domain keywords, return all courses
    return courses;
  }

  // Create search text from role and cluster
  const searchTerms = [
    ...roleName.toLowerCase().split(/\s+/),
    ...clusterTitle.toLowerCase().split(/\s+/),
    ...domainKeywords.map(k => k.toLowerCase())
  ].filter(term => term.length > 2);

  // Filter courses that match domain keywords
  const filtered = courses.filter(course => {
    const courseText = `${course.title} ${course.description || ''} ${(course.skills || []).join(' ')} ${course.category || ''}`.toLowerCase();
    
    // Check if course matches any domain keyword
    const domainMatch = domainKeywords.some(keyword => 
      courseText.includes(keyword.toLowerCase())
    );

    // Check if course matches role/cluster terms
    const roleMatch = searchTerms.some(term => 
      courseText.includes(term)
    );

    return domainMatch || roleMatch;
  });

  return filtered;
}

/**
 * Build rich context text for role embedding.
 * This helps the embedding capture the semantic meaning of the role.
 * 
 * @param {string} roleName - Job role name
 * @param {string} clusterTitle - Career cluster
 * @returns {string} - Rich context text
 */
function buildRoleContext(roleName, clusterTitle) {
  const parts = [];

  // Core role information - repeat for emphasis
  parts.push(`Job Role: ${roleName}`);
  parts.push(`Position: ${roleName}`);
  parts.push(`Career: ${roleName}`);

  // Add cluster context if available - repeat for emphasis
  if (clusterTitle && clusterTitle.trim() !== '') {
    parts.push(`Career Field: ${clusterTitle}`);
    parts.push(`Industry: ${clusterTitle}`);
    parts.push(`Domain: ${clusterTitle}`);
  }

  // Extract key domain keywords from role and cluster
  const domainKeywords = extractDomainKeywords(roleName, clusterTitle);
  if (domainKeywords.length > 0) {
    parts.push(`Key skills: ${domainKeywords.join(', ')}`);
    parts.push(`Required knowledge: ${domainKeywords.join(', ')}`);
  }

  // Add context about what we're looking for
  parts.push(`Looking for courses that teach skills and knowledge required for ${roleName} position.`);
  parts.push(`Courses should cover technical skills, tools, and competencies needed in this role.`);
  parts.push(`Training for ${roleName} career path.`);

  return parts.join(' ');
}

/**
 * Extract domain-specific keywords from role and cluster.
 * This helps emphasize the specific domain in the embedding.
 * 
 * @param {string} roleName - Job role name
 * @param {string} clusterTitle - Career cluster
 * @returns {string[]} - Array of domain keywords
 */
function extractDomainKeywords(roleName, clusterTitle) {
  const keywords = [];
  const text = `${roleName} ${clusterTitle}`.toLowerCase();

  // Finance/Accounting domain
  if (text.includes('account') || text.includes('finance') || text.includes('audit')) {
    keywords.push('accounting', 'finance', 'bookkeeping', 'financial analysis', 'taxation', 'auditing', 'Excel', 'Tally', 'GST');
  }

  // Technology domain
  if (text.includes('software') || text.includes('developer') || text.includes('engineer') || text.includes('programmer')) {
    keywords.push('programming', 'coding', 'software development', 'algorithms', 'data structures');
  }

  // Business/Management domain
  if (text.includes('business') || text.includes('management') || text.includes('manager')) {
    keywords.push('business management', 'leadership', 'strategy', 'operations', 'project management');
  }

  // Marketing domain
  if (text.includes('marketing') || text.includes('sales')) {
    keywords.push('marketing', 'digital marketing', 'sales', 'branding', 'customer relations');
  }

  // Data/Analytics domain
  if (text.includes('data') || text.includes('analyst')) {
    keywords.push('data analysis', 'statistics', 'Excel', 'SQL', 'data visualization');
  }

  // HR domain
  if (text.includes('hr') || text.includes('human resource')) {
    keywords.push('human resources', 'recruitment', 'employee relations', 'payroll', 'compliance');
  }

  return keywords;
}

/**
 * Fallback keyword-based matching when RAG fails.
 * Uses domain-aware text matching against role name and cluster.
 * 
 * @param {string} roleName - Job role name
 * @param {string} clusterTitle - Career cluster
 * @param {Array} courses - Array of courses
 * @param {number} limit - Number of courses to return
 * @returns {Array} - Matched courses
 */
function fallbackKeywordMatching(roleName, clusterTitle, courses, limit) {
  // Extract keywords from role and cluster
  const basicKeywords = [
    ...roleName.toLowerCase().split(/\s+/),
    ...clusterTitle.toLowerCase().split(/\s+/)
  ].filter(word => word.length > 2); // Filter out short words

  // Add domain-specific keywords
  const domainKeywords = extractDomainKeywords(roleName, clusterTitle);
  const allKeywords = [...basicKeywords, ...domainKeywords.map(k => k.toLowerCase())];

  // Score courses by keyword matches with domain emphasis
  const scoredCourses = courses.map(course => {
    const courseText = `${course.title} ${course.description || ''} ${(course.skills || []).join(' ')} ${course.category || ''}`.toLowerCase();

    let matchCount = 0;
    let domainMatchCount = 0;

    // Count basic keyword matches
    basicKeywords.forEach(keyword => {
      if (courseText.includes(keyword)) {
        matchCount++;
      }
    });

    // Count domain keyword matches (weighted higher)
    domainKeywords.forEach(keyword => {
      if (courseText.includes(keyword.toLowerCase())) {
        domainMatchCount++;
        matchCount += 2; // Domain keywords count double
      }
    });

    return {
      course_id: course.course_id,
      title: course.title,
      code: course.code,
      description: course.description,
      duration: course.duration,
      category: course.category,
      skills: course.skills || [],
      target_outcomes: course.target_outcomes || [],
      thumbnail: course.thumbnail,
      relevance_score: Math.min(100, Math.round((matchCount / (allKeywords.length * 1.5)) * 100)),
      match_reason: domainMatchCount > 0 ? `Strong domain match for ${roleName}` : `Keyword match for ${roleName}`,
      _matchCount: matchCount,
      _domainMatchCount: domainMatchCount
    };
  });

  // Return top matches, prioritizing domain matches
  const topMatches = scoredCourses
    .filter(c => c._matchCount > 0)
    .sort((a, b) => {
      // First sort by domain matches
      if (b._domainMatchCount !== a._domainMatchCount) {
        return b._domainMatchCount - a._domainMatchCount;
      }
      // Then by total matches
      return b._matchCount - a._matchCount;
    })
    .slice(0, limit)
    .map(({ _matchCount, _domainMatchCount, ...course }) => course);

  // If still no matches, return top N courses by popularity/category
  if (topMatches.length === 0) {
    return courses.slice(0, limit).map(course => ({
      course_id: course.course_id,
      title: course.title,
      code: course.code,
      description: course.description,
      duration: course.duration,
      category: course.category,
      skills: course.skills || [],
      target_outcomes: course.target_outcomes || [],
      thumbnail: course.thumbnail,
      relevance_score: 50,
      match_reason: `Recommended course`
    }));
  }

  return topMatches;
}
