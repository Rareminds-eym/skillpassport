-- Add delete:messages permission
INSERT INTO "public"."rbac_permissions" ("id", "permission_key", "name", "description", "category", "action", "subject", "field", "icon", "sort_order", "created_at", "updated_at") 
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'delete:messages', 'Delete Messages', 'Delete message conversations', 'messages', 'delete', 'Messages', null, '🗑️', '32', now(), now())
ON CONFLICT (id) DO NOTHING;
