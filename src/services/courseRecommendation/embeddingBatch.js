/**
 * Embedding Batch Processing
 * Handles parallel generation of multiple embeddings
 */

import { getPagesApiUrl } from '../../utils/pagesUrl';

const EMBEDDING_API_URL = getPagesApiUrl('career');

/**
 * Generate multiple embeddings in parallel
 * Much faster than sequential generation (3x speedup for 3 skills)
 * 
 * @param {Array<string>} texts - Array of texts to generate embeddings for
 * @param {number} maxConcurrent - Maximum concurrent requests (default 5)
 * @returns {Promise<Array<number[]>>} - Array of embedding vectors
 */
export const generateEmbeddingsBatch = async (texts, maxConcurrent = 5) => {
  if (!texts || texts.length === 0) {
    return [];
  }

  // Validate all texts
  const validTexts = texts.filter(text => text && text.trim().length >= 10);
  if (validTexts.length === 0) {
    throw new Error('No valid texts for embedding generation');
  }

  // Process in batches to avoid overwhelming the API
  const results = [];
  for (let i = 0; i < validTexts.length; i += maxConcurrent) {
    const batch = validTexts.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (text) => {
      try {
        const response = await fetch(`${EMBEDDING_API_URL}/generate-embedding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, returnEmbedding: true })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.embedding || !Array.isArray(result.embedding)) {
          throw new Error('Invalid embedding response');
        }

        return result.embedding;
      } catch (error) {
        console.error(`Failed to generate embedding for text: ${text.substring(0, 50)}...`, error);
        return null; // Return null for failed embeddings
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
};

/**
 * Generate embeddings for multiple skills in parallel
 * Wraps each skill with context for better semantic matching
 * 
 * @param {Array<string>} skillNames - Array of skill names
 * @returns {Promise<Array<{skill: string, embedding: number[]}>>} - Skills with embeddings
 */
export const generateSkillEmbeddingsBatch = async (skillNames) => {
  if (!skillNames || skillNames.length === 0) {
    return [];
  }

  // Wrap each skill with context
  const skillTexts = skillNames.map(skill => 
    `Skill: ${skill}. Looking for courses that teach ${skill} skills and competencies.`
  );

  // Generate embeddings in parallel
  const embeddings = await generateEmbeddingsBatch(skillTexts);

  // Combine skills with their embeddings
  return skillNames.map((skill, index) => ({
    skill,
    embedding: embeddings[index]
  })).filter(item => item.embedding !== null); // Filter out failed embeddings
};

/**
 * Generate embeddings for profile and multiple skills in one call
 * Most efficient approach for recommendation generation
 * 
 * @param {string} profileText - Student profile text
 * @param {Array<string>} skillNames - Array of skill names
 * @returns {Promise<{profile: number[], skills: Array<{skill: string, embedding: number[]}>}>}
 */
export const generateProfileAndSkillEmbeddings = async (profileText, skillNames = []) => {
  const texts = [profileText];
  const skillTexts = skillNames.map(skill => 
    `Skill: ${skill}. Looking for courses that teach ${skill} skills and competencies.`
  );
  texts.push(...skillTexts);

  const embeddings = await generateEmbeddingsBatch(texts);

  return {
    profile: embeddings[0],
    skills: skillNames.map((skill, index) => ({
      skill,
      embedding: embeddings[index + 1]
    })).filter(item => item.embedding !== null)
  };
};
