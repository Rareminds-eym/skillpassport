-- Add Soundarya's MCA and MBA departments.
-- Fixed IDs and upserts make this safe for resets and repeated deployments.
BEGIN;

DO $seed_soundarya_departments$
DECLARE
  v_org_id uuid := '284c9ed9-cd13-584d-b5bc-e198866b917b';
  v_admin_id uuid := '783d8431-a034-5369-ae47-3aca2c4ec618';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations AS org WHERE org.id = v_org_id) THEN
    RAISE EXCEPTION 'Soundarya organization % must exist before its departments are seeded', v_org_id;
  END IF;

  INSERT INTO public.departments
    (id,school_id,college_id,name,code,description,status,created_at,updated_at,metadata,created_by,updated_by)
  VALUES
    (
      '6bf040f0-70d4-5b10-ae17-acde09b23d61',NULL,v_org_id,
      'Department of Computer Applications','MCA',
      'Master of Computer Applications department','active',NOW(),NOW(),
      jsonb_build_object('program','Master of Computer Applications','short_name','MCA','seeded_for','Soundarya Institute of Management and Science'),
      v_admin_id,v_admin_id
    ),
    (
      'e61f768c-b51e-57c7-a600-96161edaf0bd',NULL,v_org_id,
      'Department of Business Administration','MBA',
      'Master of Business Administration department','active',NOW(),NOW(),
      jsonb_build_object('program','Master of Business Administration','short_name','MBA','seeded_for','Soundarya Institute of Management and Science'),
      v_admin_id,v_admin_id
    )
  ON CONFLICT (id) DO UPDATE SET
    school_id=NULL,
    college_id=EXCLUDED.college_id,
    name=EXCLUDED.name,
    code=EXCLUDED.code,
    description=EXCLUDED.description,
    status='active',
    metadata=EXCLUDED.metadata,
    updated_by=EXCLUDED.updated_by,
    updated_at=NOW();
END;
$seed_soundarya_departments$;

COMMIT;
