-- =====================================================
-- INCREASE THUMBNAIL FIELD LENGTH
-- =====================================================
-- This migration increases the thumbnail field from VARCHAR(500) to TEXT
-- to support longer image URLs and data URIs

ALTER TABLE courses
ALTER COLUMN thumbnail TYPE TEXT;

COMMENT ON COLUMN courses.thumbnail IS 'Course thumbnail/icon - supports URLs of any length including data URIs';
