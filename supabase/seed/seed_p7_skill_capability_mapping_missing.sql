-- ============================================================================
-- Seed Data: Skill-Capability Mapping for Missing 37 Skills (CORRECTED)
-- Source: Master sheet_csv.csv - Primary Capability ID column
-- Date: 2026-06-24
-- Table: public.skill_capability_mapping
-- Total: 38 mappings (1 skill has multiple capabilities)
-- ============================================================================

INSERT INTO public.skill_capability_mapping (skill_id, capability_id)
SELECT 
  s.id as skill_id,
  c.id as capability_id
FROM public.skills s,
  public.capability_master c,
  (VALUES
    ('AI Solution Readiness Confirmation', 'IND-CAP-16'),
    ('Archive Accepted Subtitle Version and', 'IND-CAP-10'),
    ('Assemble Selected Clips Into Working', 'IND-CAP-03'),
    ('Assign Contribution Source to Encoder', 'IND-CAP-11'),
    ('Attach Annotated Reference Stills Or', 'IND-CAP-06'),
    ('BOQ Bill Verification', 'CIE-CAP-004'),
    ('Block Animation Timing Against Storyboard', 'IND-CAP-08'),
    ('Camera Metadata LUT Matching', 'IND-CAP-07'),
    ('Caption Subtitle Import', 'IND-CAP-10'),
    ('Check Branded-content Mentions Against Sponsorship', 'IND-CAP-02'),
    ('Check SDR/HDR Output Transform Paths', 'IND-CAP-07'),
    ('Close Encoding Job Only After', 'IND-CAP-12'),
    ('Compare Received Plates Against Editorial', 'IND-CAP-05'),
    ('Coordinate Missing Creative Material Or', 'IND-CAP-20'),
    ('Correct Color Pipeline Settings and', 'IND-CAP-07'),
    ('Correct RSS Field Values Or', 'IND-CAP-24'),
    ('Distribution Blocker Notification', 'IND-CAP-09'),
    ('Distribution Readiness Notification', 'IND-CAP-09'),
    ('Document Domain Exceptions Where Quality Improvement', 'IND-CAP-18'),
    ('Document Domain Exceptions Where The', 'IND-CAP-18'),
    ('Drawing RFI Review', 'CIE-CAP-001'),
    ('Drawing RFI Review', 'CIE-CAP-005'),
    ('Drone Remote-Sensing Observation', 'CAP-AFF-012'),
    ('Episode Availability On Target Confirmation', 'IND-CAP-24'),
    ('Escalate Weak Ownership Proof Or', 'IND-CAP-17'),
    ('FM Hard-services Work Order Exception Handoff', 'CAP-REF-07'),
    ('FM Hard-services Work Order Routine Closure', 'CAP-REF-07'),
    ('FM Soft-services and Workplace Exception Handoff', 'CAP-REF-08'),
    ('FM Soft-services and Workplace Routine Closure', 'CAP-REF-08'),
    ('Facility Inspection Safety SLA Exception Handoff', 'CAP-REF-09'),
    ('Facility Inspection Safety SLA Routine Closure', 'CAP-REF-09'),
    ('Failed Rendition Recovery', 'IND-CAP-12'),
    ('Fish Harvest Lot Cold-chain', 'CAP-AFF-008'),
    ('Fixed Defect On Same Retesting', 'IND-CAP-15'),
    ('Grade Approval Confirmation', 'IND-CAP-07'),
    ('HLS Package Publishing', 'IND-CAP-12'),
    ('Heterogeneous Effects Across Key Interpretation', 'IND-CAP-07'),
    ('Interpret Heterogeneous Effects Across Quality', 'IND-CAP-07')
  ) AS t(skill_name, capability_code)
WHERE 
  s.name = t.skill_name
  AND c.code = t.capability_code
  AND NOT EXISTS (
    SELECT 1 FROM public.skill_capability_mapping scm
    WHERE scm.skill_id = s.id AND scm.capability_id = c.id
  );
