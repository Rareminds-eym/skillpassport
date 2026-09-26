-- ============================================================================
-- Video Portfolio Thumbnail Enhancement Migration
-- ============================================================================
-- Purpose: Add thumbnailType and thumbnailValue columns to support multiple 
--          thumbnail options (color, logo, uploaded image, video frame)
-- Version: 1.1
-- Date: 2026-09-24
-- ============================================================================

-- Add new columns for enhanced thumbnail support
ALTER TABLE public.video_portfolio
  ADD COLUMN IF NOT EXISTS thumbnail_type text DEFAULT 'color' 
    CHECK (thumbnail_type IN ('color', 'logo', 'upload', 'frame')),
  ADD COLUMN IF NOT EXISTS thumbnail_value text;

-- Add comment for new columns
COMMENT ON COLUMN public.video_portfolio.thumbnail_type IS 
  'Type of thumbnail: color (solid color), logo (RM logo), upload (custom image), frame (captured from video)';
  
COMMENT ON COLUMN public.video_portfolio.thumbnail_value IS 
  'Thumbnail value based on type: hex code for color, "rm-logo" for logo, data URL or R2 key for upload/frame';

-- Migrate existing data: set thumbnail_type to 'color' and copy thumbnail_color to thumbnail_value
UPDATE public.video_portfolio
SET 
  thumbnail_type = 'color',
  thumbnail_value = thumbnail_color
WHERE thumbnail_type IS NULL OR thumbnail_value IS NULL;

-- Update the helper function to include new fields
-- First, drop the existing function
DROP FUNCTION IF EXISTS get_learner_video_portfolio(uuid);

-- Then create it with the new signature
CREATE OR REPLACE FUNCTION get_learner_video_portfolio(input_learner_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  tags text[],
  video_url text,
  thumbnail_color text,
  thumbnail_type text,
  thumbnail_value text,
  duration text,
  file_size_bytes bigint,
  mime_type text,
  trim_start integer,
  trim_end integer,
  status text,
  approval_status text,
  show_on_public boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vp.id,
    vp.title,
    vp.description,
    vp.tags,
    vp.video_url,
    vp.thumbnail_color,
    vp.thumbnail_type,
    vp.thumbnail_value,
    vp.duration,
    vp.file_size_bytes,
    vp.mime_type,
    vp.trim_start,
    vp.trim_end,
    vp.status,
    vp.approval_status,
    vp.show_on_public,
    vp.created_at,
    vp.updated_at,
    COUNT(*) OVER() as total_count
  FROM public.video_portfolio vp
  WHERE vp.learner_id = input_learner_id
  ORDER BY vp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Migration Complete
-- ============================================================================
