-- Simple script to create the notifications table
-- Run this in your Supabase SQL editor to fix the curriculum review 400 error

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assessment_id UUID NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NULL,
    status CHARACTER VARYING(20) NULL DEFAULT 'sent'::CHARACTER VARYING,
    metadata JSONB NULL DEFAULT '{}'::jsonb,
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) 
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT notifications_status_check CHECK (
        ((status)::text = ANY ((ARRAY['scheduled'::CHARACTER VARYING, 'sent'::CHARACTER VARYING, 'cancelled'::CHARACTER VARYING])::text[]))
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created 
    ON public.notifications USING btree (recipient_id, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;