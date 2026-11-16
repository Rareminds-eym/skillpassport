-- Disposable PostgreSQL contract fixture. Never run against an application database.
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE TABLE organization_members(user_id uuid,organization_id uuid,status text,can_manage boolean);
CREATE FUNCTION has_recruitment_permission(p_user_id uuid,p_org_id uuid,p_permission text) RETURNS boolean LANGUAGE sql AS $$
 SELECT EXISTS(SELECT 1 FROM organization_members WHERE user_id=p_user_id AND organization_id=p_org_id AND status='active' AND can_manage AND p_permission='manage_candidates') $$;
CREATE TABLE opportunities(id uuid PRIMARY KEY,organization_id uuid,status text);
CREATE TABLE applied_jobs(id uuid PRIMARY KEY,opportunity_id uuid,learner_id uuid,application_status text,updated_by uuid,updated_at timestamptz,interview_scheduled_at timestamptz,UNIQUE(opportunity_id,learner_id));
CREATE TABLE pipeline_candidates(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),candidate_name text,candidate_email text,candidate_phone text,source text,added_by text,added_by_uuid uuid,next_action text,recruiter_notes text,organization_id uuid,opportunity_id uuid,learner_id uuid,status text,stage text,previous_stage text,stage_changed_at timestamptz,stage_changed_by text,updated_at timestamptz,UNIQUE(opportunity_id,learner_id));
CREATE TABLE pipeline_activities(id bigserial PRIMARY KEY,candidate_uuid uuid,learner_id uuid,activity_type text,from_stage text,to_stage text,performed_by text,activity_details jsonb);
CREATE TABLE shortlists(id text PRIMARY KEY,organization_id uuid,created_by text);
CREATE TABLE shortlist_candidates(id bigserial PRIMARY KEY,shortlist_id text REFERENCES shortlists(id),learner_id uuid,added_by text,notes text,UNIQUE(shortlist_id,learner_id));
INSERT INTO organization_members VALUES('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','active',true);
INSERT INTO opportunities VALUES('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','open'),('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','open');
INSERT INTO applied_jobs(id,opportunity_id,learner_id,application_status) VALUES('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','applied'),('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','applied');
INSERT INTO pipeline_candidates(id,organization_id,opportunity_id,learner_id,status,stage) VALUES('60000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','active','sourced'),('60000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','active','sourced');
INSERT INTO shortlists VALUES('qa-list','20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001'),('foreign-list','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002');
