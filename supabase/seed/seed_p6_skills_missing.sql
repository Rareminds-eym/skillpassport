-- ============================================================================
-- Seed Data: Missing Skills (37 skills) with Tags
-- Source: Master sheet.xlsx - Skill Master sheet
-- Date: 2026-06-24
-- Tags: Skill Type categorization
-- ============================================================================

INSERT INTO public.skills (name, description, type, level, verified, enabled, approval_status, tags, created_at, updated_at) VALUES
  ('AI Solution Readiness Confirmation', 'Confirm AI solution readiness with owner evidence and acceptance checklist', 'technical', NULL, false, true, 'pending', '["technical-skill"]', now(), now()),
  ('Archive Accepted Subtitle Version and', 'Archive accepted subtitle version and rejected-line corrections', 'technical', NULL, false, true, 'pending', '["operational-skill"]', now(), now()),
  ('Assemble Selected Clips Into Working', 'Assemble selected clips into working timeline sections', 'technical', NULL, false, true, 'pending', '["technical", "operational-skill"]', now(), now()),
  ('Assign Contribution Source to Encoder', 'Assign contribution source to encoder input', 'technical', NULL, false, true, 'pending', '["technical-skill"]', now(), now()),
  ('Attach Annotated Reference Stills Or', 'Attach annotated reference stills or clips for changes', 'technical', NULL, false, true, 'pending', '["technical-skill"]', now(), now()),
  ('BOQ Bill Verification', 'Match executed quantities to BOQ items with technical evidence', 'technical', NULL, false, true, 'pending', '["quality", "audit-skill"]', now(), now()),
  ('Block Animation Timing Against Storyboard', 'Block animation timing against storyboard beat and camera move', 'technical', NULL, false, true, 'pending', '["technical-skill"]', now(), now()),
  ('Camera Metadata LUT Matching', 'Match camera source metadata to input device transforms', 'technical', NULL, false, true, 'pending', '["technical-skill"]', now(), now()),
  ('Caption Subtitle Import', 'Import caption or subtitle file against picture reference', 'technical', NULL, false, true, 'pending', '["operational-skill"]', now(), now()),
  ('Check Branded-content Mentions Against Sponsorship', 'Check branded-content mentions against sponsorship disclosure', 'technical', NULL, false, true, 'pending', '["quality", "audit-skill"]', now(), now()),
  ('Check SDR/HDR Output Transform Paths', 'Check SDR/HDR output transform paths against delivery target', 'technical', NULL, false, true, 'pending', '["quality", "audit-skill"]', now(), now()),
  ('Close Encoding Job Only After', 'Close encoding job only after monitoring shows stable playback', 'technical', NULL, false, true, 'pending', '["quality", "audit-skill"]', now(), now()),
  ('Compare Received Plates Against Editorial', 'Compare received plates against editorial pull list', 'technical', NULL, false, true, 'pending', '["quality", "audit-skill"]', now(), now()),
  ('Coordinate Missing Creative Material Or', 'Coordinate missing creative material or agency approval', 'technical', NULL, false, true, 'pending', '["decision-skill"]', now(), now()),
  ('Correct Color Pipeline Settings and', 'Correct color pipeline settings and document changes', 'technical', NULL, false, true, 'pending', '["technical-skill"]', now(), now()),
  ('Correct RSS Field Values Or', 'Correct RSS field values or asset links', 'technical', NULL, false, true, 'pending', '["operational-skill"]', now(), now()),
  ('Distribution Blocker Notification', 'Notify release or distribution owner of readiness/blockage', 'technical', NULL, false, true, 'pending', '["decision-skill"]', now(), now()),
  ('Distribution Readiness Notification', 'Notify release or distribution owner for go-live', 'technical', NULL, false, true, 'pending', '["decision-skill"]', now(), now()),
  ('Document Domain Exceptions Where Quality Improvement', 'Improve quality of domain exceptions documentation', 'technical', NULL, false, true, 'pending', '["quality", "audit-skill"]', now(), now()),
  ('Document Domain Exceptions Where The', 'Document domain exceptions where processing is constrained', 'technical', NULL, false, true, 'pending', '["operational-skill"]', now(), now()),
  ('Drawing RFI Review', 'Review drawings and RFI and prepare recommendations', 'technical', NULL, false, true, 'pending', '["quality", "audit-skill"]', now(), now()),
  ('Drone Remote-Sensing Observation', 'Prepare geotagged crop observation outputs from drones', 'technical', NULL, false, true, 'pending', '["operational-skill"]', now(), now()),
  ('Episode Availability On Target Confirmation', 'Confirm episode availability on target platform', 'technical', NULL, false, true, 'pending', '["quality", "audit-skill"]', now(), now()),
  ('Escalate Weak Ownership Proof Or', 'Escalate weak ownership proof or high-risk conflicts', 'technical', NULL, false, true, 'pending', '["decision-skill"]', now(), now()),
  ('FM Hard-services Work Order Exception Handoff', 'Identify missing issues and prepare escalation handoff', 'technical', NULL, false, true, 'pending', '["decision-skill"]', now(), now()),
  ('FM Hard-services Work Order Routine Closure', 'Complete routine evidence loop and prepare closure', 'technical', NULL, false, true, 'pending', '["operational-skill"]', now(), now()),
  ('FM Soft-services and Workplace Exception Handoff', 'Identify missing issues and prepare escalation handoff', 'technical', NULL, false, true, 'pending', '["decision-skill"]', now(), now()),
  ('FM Soft-services and Workplace Routine Closure', 'Complete routine evidence loop and prepare closure', 'technical', NULL, false, true, 'pending', '["operational-skill"]', now(), now()),
  ('Facility Inspection Safety SLA Exception Handoff', 'Identify missing issues and prepare escalation handoff', 'technical', NULL, false, true, 'pending', '["decision-skill"]', now(), now()),
  ('Facility Inspection Safety SLA Routine Closure', 'Complete routine evidence loop and prepare closure', 'technical', NULL, false, true, 'pending', '["operational-skill"]', now(), now()),
  ('Failed Rendition Recovery', 'Restart failed rendition or isolate bad source segment', 'technical', NULL, false, true, 'pending', '["technical", "operational-skill"]', now(), now()),
  ('Fish Harvest Lot Cold-chain', 'Prepare harvest lot and cold-chain records', 'technical', NULL, false, true, 'pending', '["operational-skill"]', now(), now()),
  ('Fixed Defect On Same Retesting', 'Retest fixed defect on same and adjacent devices', 'technical', NULL, false, true, 'pending', '["quality", "audit-skill"]', now(), now()),
  ('Grade Approval Confirmation', 'Confirm grade approval evidence before moving master', 'technical', NULL, false, true, 'pending', '["quality", "audit-skill"]', now(), now()),
  ('HLS Package Publishing', 'Publish validated HLS package to staging or CDN', 'technical', NULL, false, true, 'pending', '["technical-skill"]', now(), now()),
  ('Heterogeneous Effects Across Key Interpretation', 'Interpret heterogeneous effects across key cohorts', 'technical', NULL, false, true, 'pending', '["decision-skill"]', now(), now()),
  ('Interpret Heterogeneous Effects Across Quality', 'Improve quality of heterogeneous effects interpretation', 'technical', NULL, false, true, 'pending', '["quality", "audit-skill"]', now(), now());