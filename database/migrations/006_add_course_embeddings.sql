-- Migration: Add embedding column to courses table for RAG-based course recommendations
-- Requirements: 1.3, 6.5
-- Created: 2025-12-06

-- The pgvector extension is already enabled in the database
-- Add embedding column to courses table (768 dimensions for Gemini text-embedding-004)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create IVFFlat index for fast cosine similarity search
-- Using 100 lists as specified in the design document
-- Note: IVFFlat requires at least some data to build the index effectively
-- The index will be created but may need to be rebuilt after data is populated
CREATE INDEX IF NOT EXISTS courses_embedding_idx 
ON courses USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add a comment to document the column purpose
COMMENT ON COLUMN courses.embedding IS 'Vector embedding (768 dimensions) for semantic similarity search using Gemini text-embedding-004';
