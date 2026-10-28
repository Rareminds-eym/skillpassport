-- Commit the enum value before functions use it (PostgreSQL enum transaction rule).
ALTER TYPE public.ai_worksheet_difficulty ADD VALUE IF NOT EXISTS 'mixed';
