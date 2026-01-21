/**
 * Course Recommendation Configuration
 * Central configuration for the course recommendation system.
 */

// API URL for embedding generation (uses career-api Cloudflare worker)
export const EMBEDDING_API_URL =
  import.meta.env.VITE_EMBEDDING_API_URL || import.meta.env.VITE_CAREER_API_URL;

// API URL for career-api worker (field keywords, embeddings, etc.)
export const CAREER_API_URL = import.meta.env.VITE_CAREER_API_URL;

// Maximum courses to return in recommendations (Requirement 3.2)
export const MAX_RECOMMENDATIONS = 10;

// Minimum cosine similarity to include in results
export const MIN_SIMILARITY_THRESHOLD = 0.3;

// Maximum courses per skill gap (Requirement 5.1)
export const MAX_COURSES_PER_SKILL_GAP = 3;

// Minimum courses to return per skill gap if available
export const MIN_COURSES_PER_SKILL_GAP = 1;

// Higher threshold for skill-specific matching
export const SKILL_SIMILARITY_THRESHOLD = 0.4;

// Default relevance score for fallback recommendations
export const DEFAULT_FALLBACK_SCORE = 70;
