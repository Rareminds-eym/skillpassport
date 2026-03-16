-- Migration: Optimize career_ai_conversations for faster chat loading
-- Date: 2026-03-02
-- Purpose: Add indexes and columns for improved query performance

-- Add message_count column for quick access without parsing JSONB
ALTER TABLE public.career_ai_conversations 
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- Update existing rows with current message count
UPDATE public.career_ai_conversations 
SET message_count = jsonb_array_length(COALESCE(messages, '[]'::jsonb))
WHERE message_count = 0;

-- GIN index on messages JSONB for fast containment queries
CREATE INDEX IF NOT EXISTS idx_career_conversations_messages_gin 
ON public.career_ai_conversations USING GIN (messages);

-- Expression index on last message for conversation preview
CREATE INDEX IF NOT EXISTS idx_career_conversations_last_message 
ON public.career_ai_conversations USING GIN ((messages -> -1));

-- Composite index for efficient conversation listing
CREATE INDEX IF NOT EXISTS idx_career_conversations_student_updated 
ON public.career_ai_conversations (student_id, updated_at DESC, message_count);

-- Function to automatically update message_count on insert/update
CREATE OR REPLACE FUNCTION update_message_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.message_count = jsonb_array_length(COALESCE(NEW.messages, '[]'::jsonb));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep message_count in sync
DROP TRIGGER IF EXISTS trigger_update_message_count ON public.career_ai_conversations;
CREATE TRIGGER trigger_update_message_count
  BEFORE INSERT OR UPDATE OF messages ON public.career_ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_message_count();

-- Add comment for documentation
COMMENT ON COLUMN public.career_ai_conversations.message_count IS 
'Cached count of messages in the conversation for performance optimization';
