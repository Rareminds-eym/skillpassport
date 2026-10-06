-- Dev educator fixtures copied from production.
-- College: test.college.educator@rareminds.in
-- School: test.school.educator@rareminds.in
-- Missing optional actor references are NULL; original account and organization IDs are retained.
BEGIN;

INSERT INTO "public"."users" ("email", "organizationId", "isActive", "metadata", "createdAt", "updatedAt", "id", "firstName", "lastName", "last_activity_at", "role", "temporary_password", "password_changed", "phone", "user_metadata") VALUES
  ('test.college.educator@rareminds.in', 'd325841a-7350-45ca-853d-6107e0c57224', true, '{"roles": ["Lecturer"], "source": "college_admin_added", "addedBy": "788f5a76-ede4-497c-bfff-3c2291348df6", "fullName": "test educator N", "collegeId": "d325841a-7350-45ca-853d-6107e0c57224", "staffRole": "lecturer", "entityType": "college_staff"}', '2026-10-01 09:23:11.336878+00', '2026-10-01 09:23:11.336878+00', 'fcd52c03-3a09-48cd-8594-d062971533a6', 'Test', 'Educator n', NULL, 'college_educator', NULL, false, NULL, '{}'),
  ('test.school.educator@rareminds.in', '01d58214-1542-426c-862c-827e219b9899', true, '{}', '2026-10-01 09:30:28.725182+00', '2026-10-01 09:32:14.055+00', '201960e7-b0d1-4dd0-9d1b-a4ff9b02b968', NULL, NULL, NULL, 'school_educator', NULL, false, NULL, '{}')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."users_shadow" ("id", "email", "created_at", "updated_at") VALUES
  ('201960e7-b0d1-4dd0-9d1b-a4ff9b02b968', 'test.school.educator@rareminds.in', '2026-10-01 09:32:12.578009+00', '2026-10-01 09:32:12.578009+00')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."organization_members" ("id", "user_id", "organization_id", "role", "status", "created_at", "updated_at") VALUES
  ('656f2f57-ea2a-49c5-a90f-6fda36786dea', '201960e7-b0d1-4dd0-9d1b-a4ff9b02b968', '01d58214-1542-426c-862c-827e219b9899', 'member', 'active', '2026-10-01 09:30:31.011532+00', '2026-10-01 09:32:13.348+00'),
  ('ba158f35-f0bd-46af-97c3-11ee8cbbb0c6', 'fcd52c03-3a09-48cd-8594-d062971533a6', 'd325841a-7350-45ca-853d-6107e0c57224', 'member', 'active', '2026-10-01 09:23:14.970912+00', '2026-10-01 09:23:14.814+00')
ON CONFLICT DO NOTHING;

INSERT INTO "public"."college_lecturers" ("id", "collegeId", "employeeId", "department", "specialization", "qualification", "experienceYears", "dateOfJoining", "accountStatus", "createdAt", "updatedAt", "metadata", "user_id", "degree_certificate_url", "id_proof_url", "experience_letters_url", "first_name", "last_name", "email", "phone", "address", "date_of_birth", "gender", "designation", "subject_expertise", "temporary_password", "password_created_at", "created_by", "verification_status", "verified_by", "verified_at") VALUES
  ('eca80ce2-c645-4e52-8b93-5897b4da166f', 'd325841a-7350-45ca-853d-6107e0c57224', 'FAC2006', 'Computer Science & Engineering', NULL, NULL, NULL, NULL, 'active', '2026-10-01 09:23:11.379992+00', '2026-10-01 09:23:11.379992+00', '{"role": "lecturer", "email": "test.college.educator@rareminds.in", "phone": null, "roles": ["Lecturer"], "last_name": "Educator n", "created_by": "cetedi2854@abowned.com", "first_name": "Test", "password_created_at": "2026-10-01T09:23:11.340Z"}', 'fcd52c03-3a09-48cd-8594-d062971533a6', 'https://storage-sp.rareminds.in/uploads/788f5a76-ede4-497c-bfff-3c2291348df6/1790846565389-0f07fae2a84e491b.png', 'https://storage-sp.rareminds.in/uploads/788f5a76-ede4-497c-bfff-3c2291348df6/1790846572328-5a8ed1e393f34108.png', '["https://storage-sp.rareminds.in/uploads/788f5a76-ede4-497c-bfff-3c2291348df6/1790846579734-bcf805d91c6e46b0.png"]', NULL, NULL, 'test.college.educator@rareminds.in', NULL, NULL, NULL, NULL, NULL, '[{"name": "Maths", "proficiency": "intermediate", "years_experience": 3}]', NULL, NULL, NULL, 'pending', NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "public"."school_educators" ("id", "user_id", "school_id", "employee_id", "specialization", "qualification", "experience_years", "date_of_joining", "account_status", "created_at", "updated_at", "metadata", "designation", "department", "first_name", "last_name", "email", "phone_number", "dob", "gender", "address", "city", "state", "country", "pincode", "subjects_handled", "resume_url", "id_proof_url", "photo_url", "verification_status", "verified_by", "verified_at", "role", "onboarding_status", "degree_certificate_url", "experience_letters_url", "subject_expertise", "teacher_id") VALUES
  ('1b769705-46e1-4c87-aceb-8ecfe7aa1003', '201960e7-b0d1-4dd0-9d1b-a4ff9b02b968', '01d58214-1542-426c-862c-827e219b9899', 'EMP001', 'Biology', 'Science', 1, '2026-10-01', 'active', '2026-10-01 09:30:28.848906+00', '2026-10-01 09:30:28.848906+00', '{"source": "school_admin_added", "created_by": "393dc3a9-3980-4c02-a1c0-e88892386cb2"}', 'Senior Teacher', 'Science', 'Test', 'Name', 'test.school.educator@rareminds.in', '+91 98765 4345', '2000-01-01', 'male', NULL, 'Mumbai', 'Maharastra', 'India', '400001', '{Science}', NULL, NULL, NULL, NULL, NULL, NULL, 'subject_teacher', 'active', NULL, NULL, '[{"name": "Science", "proficiency": "intermediate", "years_experience": 1}]', 'TES-T-0001')
ON CONFLICT DO NOTHING;

COMMIT;
