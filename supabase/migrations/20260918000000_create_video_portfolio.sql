-- ============================================================================
-- Video Portfolio Table Migration
-- ============================================================================
-- Purpose: Store learner video portfolio entries with metadata
-- Storage: Video files stored in Cloudflare R2, only R2 keys stored in DB
-- Access: Authorization handled at API level (no RLS)
-- Version: 1.0
-- Date: 2026-09-18
-- ============================================================================

-- ============================================================================
-- Main Table: video_portfolio
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.video_portfolio (
  -- Primary identification
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
  
  -- Video metadata
  title text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  
  -- Storage references (R2 keys, not full URLs)
  video_url text NOT NULL,  -- R2 key: video_portfolio/{user_folder}/{video_id}_{timestamp}.{ext}
  thumbnail_color text DEFAULT '#2D3E5F',  -- Hex color for thumbnail
  
  -- Video properties
  duration text,  -- Format: "4:02"
  file_size_bytes bigint,  -- File size in bytes
  mime_type text DEFAULT 'video/mp4',
  
  -- Trim/editing metadata
  trim_start integer DEFAULT 0,  -- Trim start position (percentage 0-100)
  trim_end integer DEFAULT 100,  -- Trim end position (percentage 0-100)
  
  -- Status and visibility
  status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PROCESSING', 'VERIFIED', 'REJECTED')),
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  show_on_public boolean DEFAULT false,
  
  -- Admin review
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamp with time zone,
  rejection_reason text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT video_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT video_url_not_empty CHECK (char_length(trim(video_url)) > 0),
  CONSTRAINT trim_range_valid CHECK (trim_start >= 0 AND trim_start <= 100 AND trim_end >= 0 AND trim_end <= 100 AND trim_end >= trim_start),
  CONSTRAINT max_tags_limit CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 5)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary lookup by learner
CREATE INDEX idx_video_portfolio_learner_id ON public.video_portfolio(learner_id);

-- Filter by status
CREATE INDEX idx_video_portfolio_status ON public.video_portfolio(status);
CREATE INDEX idx_video_portfolio_approval_status ON public.video_portfolio(approval_status);

-- Public visibility filtering
CREATE INDEX idx_video_portfolio_public ON public.video_portfolio(learner_id, show_on_public) 
WHERE show_on_public = true;

-- Admin review queue
CREATE INDEX idx_video_portfolio_pending_review ON public.video_portfolio(approval_status, created_at) 
WHERE approval_status = 'pending';

-- Full-text search on title and description
CREATE INDEX idx_video_portfolio_search ON public.video_portfolio 
USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
-- Note: RLS is NOT ENABLED for this table.
-- Access control is handled at the API level through authentication middleware
-- and explicit authorization checks in the API handlers.
-- This approach provides more flexibility and is consistent with the current
-- architecture where service-level authorization is performed.
-- ============================================================================

-- ALTER TABLE public.video_portfolio ENABLE ROW LEVEL SECURITY;
-- (Commented out - using API-level authorization instead)

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_portfolio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_portfolio_updated_at
BEFORE UPDATE ON public.video_portfolio
FOR EACH ROW
EXECUTE FUNCTION update_video_portfolio_updated_at();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get learner's video portfolio with count
CREATE OR REPLACE FUNCTION get_learner_video_portfolio(input_learner_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  tags text[],
  video_url text,
  thumbnail_color text,
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

-- Get pending videos for admin review
CREATE OR REPLACE FUNCTION get_pending_video_portfolio(limit_count integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  learner_id uuid,
  learner_name text,
  learner_email text,
  title text,
  description text,
  tags text[],
  video_url text,
  duration text,
  status text,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vp.id,
    vp.learner_id,
    l.name as learner_name,
    u.email as learner_email,
    vp.title,
    vp.description,
    vp.tags,
    vp.video_url,
    vp.duration,
    vp.status,
    vp.created_at
  FROM public.video_portfolio vp
  INNER JOIN public.learners l ON vp.learner_id = l.id
  INNER JOIN public.users u ON l.user_id = u.id
  WHERE vp.approval_status = 'pending'
  ORDER BY vp.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.video_portfolio IS 'Stores learner video portfolio entries for digital passport';
COMMENT ON COLUMN public.video_portfolio.video_url IS 'R2 storage key (not presigned URL). Example: video_portfolio/john_doe_9a754938/video_abc123_1719432000.mp4';
COMMENT ON COLUMN public.video_portfolio.thumbnail_color IS 'Hex color code for video thumbnail background';
COMMENT ON COLUMN public.video_portfolio.trim_start IS 'Video trim start position as percentage (0-100)';
COMMENT ON COLUMN public.video_portfolio.trim_end IS 'Video trim end position as percentage (0-100)';
COMMENT ON COLUMN public.video_portfolio.status IS 'Video processing status: DRAFT, PROCESSING, VERIFIED, REJECTED';
COMMENT ON COLUMN public.video_portfolio.approval_status IS 'Admin approval status: pending, approved, rejected';
COMMENT ON COLUMN public.video_portfolio.show_on_public IS 'Whether to display on public digital passport';

-- ============================================================================
-- Migration Complete
-- ============================================================================
