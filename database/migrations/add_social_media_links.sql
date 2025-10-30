-- Migration: Add social media and professional links to students table
-- Created: 2025-10-29
-- Description: Adds columns for GitHub, Portfolio, and various social media links

-- Add GitHub link
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'github_link'
    ) THEN
        ALTER TABLE public.students ADD COLUMN github_link TEXT;
    END IF;
END $$;

-- Add Portfolio link
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'portfolio_link'
    ) THEN
        ALTER TABLE public.students ADD COLUMN portfolio_link TEXT;
    END IF;
END $$;

-- Add LinkedIn link
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'linkedin_link'
    ) THEN
        ALTER TABLE public.students ADD COLUMN linkedin_link TEXT;
    END IF;
END $$;

-- Add Twitter/X link
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'twitter_link'
    ) THEN
        ALTER TABLE public.students ADD COLUMN twitter_link TEXT;
    END IF;
END $$;

-- Add Instagram link
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'instagram_link'
    ) THEN
        ALTER TABLE public.students ADD COLUMN instagram_link TEXT;
    END IF;
END $$;

-- Add Facebook link
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'facebook_link'
    ) THEN
        ALTER TABLE public.students ADD COLUMN facebook_link TEXT;
    END IF;
END $$;

-- Add other social links (JSONB for flexibility)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'other_social_links'
    ) THEN
        ALTER TABLE public.students ADD COLUMN other_social_links JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.students.github_link IS 'GitHub profile URL';
COMMENT ON COLUMN public.students.portfolio_link IS 'Personal portfolio website URL';
COMMENT ON COLUMN public.students.linkedin_link IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.students.twitter_link IS 'Twitter/X profile URL';
COMMENT ON COLUMN public.students.instagram_link IS 'Instagram profile URL';
COMMENT ON COLUMN public.students.facebook_link IS 'Facebook profile URL';
COMMENT ON COLUMN public.students.other_social_links IS 'JSONB array for additional social media links';

-- Verify the migration
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'students' 
    AND column_name IN (
        'github_link', 
        'portfolio_link', 
        'linkedin_link', 
        'twitter_link', 
        'instagram_link', 
        'facebook_link', 
        'other_social_links'
    )
ORDER BY column_name;
