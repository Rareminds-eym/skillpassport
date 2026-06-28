-- ============================================================================
-- Seed Data: Role Capability Sequence (Updated for Individual Roles)
-- Source: Master sheet.csv - Individual role capability mappings
-- Date: 2026-06-25
-- Table: public.role_capability_sequence
-- Maps individual roles to their capabilities with learning sequence
-- ============================================================================

INSERT INTO public.role_capability_sequence (
  role_domain_id, capability_id, sequence_step, capability_priority,
  required_level, duration_weeks, created_at
)
VALUES
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_COMP_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-014'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_COMP_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-014'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_COMP_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-014'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-011'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-011'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-011'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_CROP_02_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-011'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-008'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-008'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-008'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-008'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-008'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FISH_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-008'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-009'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-009'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-009'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-009'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-010'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-009'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-010'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-009'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-010'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-010'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-010'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_03_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-010'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_FOREST_03_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-010'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-011'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-011'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_HORT_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-011'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-011'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-011'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-011'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-011'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-012'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-012'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_02_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-012'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_02_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-012'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-012'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-012'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_03_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-012'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_03_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-012'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_INPUT_03_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-012'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_02_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_LIVE_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-008'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-013'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-014'),
    5,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-008'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-013'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-014'),
    5,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-008'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-013'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-014'),
    5,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-008'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-013'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-014'),
    5,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-014'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-014'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-014'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_02_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_02_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-014'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-013'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-013'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'AGR_RF_POST_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_AGR_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-AFF-013'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-001'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-001'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-001'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-004'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-004'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-004'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_BANK_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CREDIT-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-005'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-006'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-005'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-006'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-005'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-006'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_CM_06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-CM-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-005'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-005'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-005'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-005'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-005'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-004'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_PAY_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-PAY-005'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-001'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-002'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-003'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-001'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-002'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-003'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-BANK-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-001'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-002'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-003'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'BCP_RF_X_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_BCP_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-X-003'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_01_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_01_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_01_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_01_DR01_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_04_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_04_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_04_DR01_SP03_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_04_DR01_SP03_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_06_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_06_DR01_SP02_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_06_DR01_SP02_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_06_DR01_SP02_FX03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_06_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_07_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_07_DR01_SP02_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_07_DR01_SP02_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-006'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_08_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-008'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_08_DR01_SP02_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-008'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_08_DR01_SP02_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-008'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_09_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-008'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_09_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-008'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_09_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-008'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_09_DR01_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-008'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP03_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP03_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP03_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP03_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP03_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP03_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP03_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP03_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_10_DR01_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_11_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP01_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP01_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP01_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP01_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP01_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP01_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP01_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP01_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_12_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_13_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP01_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP01_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP01_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP01_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP01_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP01_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP01_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP01_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_14_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'CIE_CIE_RF_15_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_CIE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CIE-CAP-005'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF01_DR04_SP05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF02_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF03_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF03_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF03_DR03_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF04_DR03_SP06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR05_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR05_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF05_DR05_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR05_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR05_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR05_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF07_DR05_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF08_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF08_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF09_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF09_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF09_DR04_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF09_DR04_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF10_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF11_DR05_SP04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF12_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF12_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF13_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF13_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'DAI_RF14_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_DAI_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF03_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF06_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF11_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF12_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF13_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF14_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF17_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF18_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF19_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF20_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF21_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF22_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF23_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF24_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'EDS_RF25_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_EDS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF01_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF01_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF01_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF01_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF02_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF03_DR03_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF03_DR03_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF03_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF04_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF04_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF05_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF05_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF05_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF05_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF06_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF06_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF07_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF07_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF07_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF07_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR09') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR09') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR10') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF09_DR10') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF10_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF10_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF10_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF10_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF10_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF10_DR09') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF11_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF11_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF11_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF11_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF11_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF11_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF12_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF13_DR01_FX01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF13_DR01_FX02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF14_DR03_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF14_DR03_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF14_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF14_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF15_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF15_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF16_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR05_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR05_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF17_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR09') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR09') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR09') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR09') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR10') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR10') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR10') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR10') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR11') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR11') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR11') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR11') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR12') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR12') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR12') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR12') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR13') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR13') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR13') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR13') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR14') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR14') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR14') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF18_DR14') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR09') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR09') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR10') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR10') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR11_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR11_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR11_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF19_DR11_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF20_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF20_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF20_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF20_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR09') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR09') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR10') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR10') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR11') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR11') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR12') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR12') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR13') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR13') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR14') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR14') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR15') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HTT_RF21_DR15') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HTT_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF01_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF02_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF03_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR04_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF06_DR04_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF07_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF09_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF10_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF14_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF15_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF16_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'HWS_RF17_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_HWS_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_06_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_07_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR06') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR07') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_09_DR08') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-15'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_11_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_12_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_13_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_14_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_14_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-20'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_15_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'MEG_MEG_RF_16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_MEG_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-004'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-004'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-004'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-004'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-001'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-002'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-003'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_001_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-004'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_002_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_002_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_002_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_002_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_002_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_002_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_002_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-002'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_002_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-003'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_002_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-004'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_003_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_003_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_003_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_003_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_003_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-005'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_003_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-006'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_004_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_004_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-007'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_005_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-008'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_005_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-008'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_005_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-008'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_006_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-009'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_006_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-009'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_006_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-009'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_007_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-010'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_007_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-010'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_008_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-011'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_008_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-011'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_008_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-011'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_009_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-012'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_009_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-012'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_010_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-013'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_010_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-014'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_010_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-013'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_010_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-014'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_010_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-013'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_010_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-014'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_011_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-015'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_011_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-016'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_011_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-015'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_011_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-016'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_011_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-015'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_011_DR01_SP03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-016'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_012_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-017'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_012_DR02_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-017'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_012_DR02_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-017'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_013_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-018A'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_013_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-018A'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_014_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-018B'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_014_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-018B'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_015_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-018B'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_015_DR01_SP01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-018C'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_015_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-018B'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'PBM_RF_015_DR01_SP02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_PBM_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-018C'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-02'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-03'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-06'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-07'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF06_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF06_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF06_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-08'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF07_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF07_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-09'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF07_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-10'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-11'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF09_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF09_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF09_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-12'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF10_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF10_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-13'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-14'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF10_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-16'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF12_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF12_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-17'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF12_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-18'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF13_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF13_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D05')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-19'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF16_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF16_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-21'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF16_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-22'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF17_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF17_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-23'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF18_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF18_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D06')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-24'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF19_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF19_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF19_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF19_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF19_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF19_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF19_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-25'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF19_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-26'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF20_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF20_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-27'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF21_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF21_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-28'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF22_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-29'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'RCE_RF22_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_RCE_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'IND-CAP-29'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_01_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_01_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_01_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_01_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_02_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_02_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-01'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_02_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D01')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-02'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-03'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_03_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-10'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-03'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_03_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-10'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-03'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_03_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D02')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-10'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-04'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-05'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-06'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-07'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-08'),
    5,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    6,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-10'),
    7,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-04'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-05'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-06'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-07'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-08'),
    5,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    6,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-10'),
    7,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-04'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-05'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-06'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-07'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-08'),
    5,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    6,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-10'),
    7,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-04'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-05'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-06'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-07'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-08'),
    5,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    6,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_04_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D03')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-10'),
    7,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-08'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-08'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-08'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-08'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-05'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-07'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-08'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_05_DR05') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D04')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-03'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-06'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR01') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-10'),
    5,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-03'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-06'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR02') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-10'),
    5,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-03'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-06'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR03') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-10'),
    5,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-03'),
    1,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-04'),
    2,
    'Core',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-06'),
    3,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-09'),
    4,
    'Important',
    'L4',
    8,
    now()
  ),
  (
    (SELECT id FROM public.role_domains WHERE role_id = (SELECT id FROM public.occupations WHERE code = 'REF_RF_REF_08_DR04') AND domain_id = (SELECT id FROM public.domains WHERE code = 'IND_REF_D07')),
    (SELECT id FROM public.capability_master WHERE code = 'CAP-REF-10'),
    5,
    'Important',
    'L4',
    8,
    now()
  );
