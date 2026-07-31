-- Seed: Insert initial maintenance_mode config value
-- This is a seed file (DML only), not a migration (DDL only).
INSERT INTO "public"."app_config" ("key", "value") 
VALUES ('maintenance_mode', 'false')
ON CONFLICT ("key") DO NOTHING;
