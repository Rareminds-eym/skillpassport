-- Increase employability_readiness column size to prevent "value too long" errors
-- The AI can return longer strings than the original VARCHAR(50) limit
-- This fixes the error: "value too long for type character varying(50)"

ALTER TABLE personal_assessment_results 
ALTER COLUMN employability_readiness TYPE VARCHAR(255);
