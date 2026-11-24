-- Extend only the disposable decision fixture with the actual notification-trigger contract.
ALTER TABLE opportunities ADD COLUMN title text;
ALTER TABLE pipeline_candidates ADD COLUMN id_old bigint;
ALTER TABLE pipeline_activities ADD COLUMN pipeline_candidate_id bigint;
CREATE TABLE users(id uuid PRIMARY KEY);
CREATE TABLE learners(id uuid PRIMARY KEY,user_id uuid REFERENCES users(id));
CREATE TABLE notifications(id bigserial PRIMARY KEY,recipient_id uuid REFERENCES users(id),type text NOT NULL,title text NOT NULL,message text NOT NULL,read boolean,created_at timestamptz);
INSERT INTO users VALUES('70000000-0000-4000-8000-000000000001');
INSERT INTO learners VALUES('50000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001');
CREATE TRIGGER pipeline_activity_notification_trigger AFTER INSERT ON pipeline_activities FOR EACH ROW EXECUTE FUNCTION create_notification_from_pipeline_activity();
DO $$ BEGIN
 BEGIN
  INSERT INTO pipeline_activities(candidate_uuid,activity_type,to_stage) VALUES('60000000-0000-4000-8000-000000000001','stage_change','sourced');
  RAISE EXCEPTION 'Positive control: legacy trigger should fail sourced title constraint';
 EXCEPTION WHEN not_null_violation THEN NULL; END;
 IF EXISTS(SELECT 1 FROM notifications) THEN RAISE EXCEPTION 'Failed activity left notification behind'; END IF;
END $$;
