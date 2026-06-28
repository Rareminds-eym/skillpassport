-- Enable RLS on app_config (if not already enabled)
-- NOTE: The initial INSERT for maintenance_mode is in supabase/seed/seed_app_config.sql (seed file, not migration)
ALTER TABLE "public"."app_config" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent re-run safety)
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."app_config";
DROP POLICY IF EXISTS "Enable all for rm_admin and super_admin" ON "public"."app_config";
DROP POLICY IF EXISTS "Enable all for super_admin and platform_admin" ON "public"."app_config";

-- Create policy to allow anyone to read the app config
CREATE POLICY "Enable read access for all users" ON "public"."app_config"
    FOR SELECT
    USING (true);

-- Create policy to allow super_admin to insert/update the app config
CREATE POLICY "Enable all for super_admin" ON "public"."app_config"
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() ->> 'role' = 'super_admin') 
        OR ((auth.jwt() -> 'roles') ? 'super_admin')
        OR (EXISTS (
            SELECT 1 FROM "public"."admin_users" au 
            WHERE au.id = auth.uid() 
            AND au.admin_role = 'super_admin'
        ))
    )
    WITH CHECK (
        (auth.jwt() ->> 'role' = 'super_admin') 
        OR ((auth.jwt() -> 'roles') ? 'super_admin')
        OR (EXISTS (
            SELECT 1 FROM "public"."admin_users" au 
            WHERE au.id = auth.uid() 
            AND au.admin_role = 'super_admin'
        ))
    );

-- Enable Realtime for the table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'app_config'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
    END IF;
END $$;
