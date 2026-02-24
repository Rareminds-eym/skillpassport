-- Assign permissions to roles based on requirements:
-- demo_admin: All permissions (already has them)
-- demo_basic_student: read:messages, send:messages (NO delete)
-- demo_premium_student: read:messages, send:messages (NO delete)
-- demo_view_only: read:messages ONLY (NO send, NO delete)

-- Get role IDs
DO $$
DECLARE
  admin_role_id uuid := '36f80ba7-80d3-44b5-a8d7-38dcf1f39d01';
  view_only_role_id uuid := 'f817def3-e3d1-46e0-87c2-f883bf88bfa9';
  basic_student_role_id uuid := '066da942-898c-4517-81c1-838e9c9bc21f';
  premium_student_role_id uuid := '4aecc062-98f0-4f4c-aa34-1185a8f6f69e';
  
  read_messages_id uuid := '15dcfa20-8dc5-4aaf-bd63-b5e13f3baae1';
  send_messages_id uuid := '17f99fd0-b53e-40fe-889b-7e23f25d2851';
  delete_messages_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
BEGIN
  -- demo_admin: Add delete:messages permission
  INSERT INTO "public"."rbac_role_permissions" ("role_id", "permission_id", "is_granted", "created_at")
  VALUES (admin_role_id, delete_messages_id, true, now())
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- demo_view_only: Only read:messages (NO send, NO delete)
  INSERT INTO "public"."rbac_role_permissions" ("role_id", "permission_id", "is_granted", "created_at")
  VALUES (view_only_role_id, read_messages_id, true, now())
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- demo_basic_student: read + send (NO delete)
  INSERT INTO "public"."rbac_role_permissions" ("role_id", "permission_id", "is_granted", "created_at")
  VALUES 
    (basic_student_role_id, read_messages_id, true, now()),
    (basic_student_role_id, send_messages_id, true, now())
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  -- demo_premium_student: read + send (NO delete)
  INSERT INTO "public"."rbac_role_permissions" ("role_id", "permission_id", "is_granted", "created_at")
  VALUES 
    (premium_student_role_id, read_messages_id, true, now()),
    (premium_student_role_id, send_messages_id, true, now())
  ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;
