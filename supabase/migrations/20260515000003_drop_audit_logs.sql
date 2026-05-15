-- Drop audit_logs table and related objects
-- This removes the audit logging functionality completely

-- Drop policies first
DROP POLICY IF EXISTS "Allow public insert" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow public read" ON public.audit_logs;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_audit_action;
DROP INDEX IF EXISTS public.idx_audit_action_date;
DROP INDEX IF EXISTS public.idx_audit_actor;
DROP INDEX IF EXISTS public.idx_audit_actor_action;
DROP INDEX IF EXISTS public.idx_audit_actorid;
DROP INDEX IF EXISTS public.idx_audit_created;
DROP INDEX IF EXISTS public.idx_audit_createdat;
DROP INDEX IF EXISTS public.idx_audit_ip_trgm;
DROP INDEX IF EXISTS public.idx_audit_target;
DROP INDEX IF EXISTS public.idx_audit_target_trgm;
DROP INDEX IF EXISTS idx_audit_logs_actor;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_created;

-- Drop the table
DROP TABLE IF EXISTS public.audit_logs CASCADE;
