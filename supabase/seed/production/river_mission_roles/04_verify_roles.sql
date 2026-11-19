-- Read-only production verification after importing role SQL and embeddings.
WITH expected(code,name,industry_name,domain_name,family_name) AS (VALUES
('RMR-ROLE-01','Water Quality Tester','Water & Environmental Services','Water Quality & Laboratory Science','Water Quality Analyst'),
('RMR-ROLE-02','Water Cleaning Engineer','Water & Environmental Services','Water & Environmental Engineering','Water Treatment Engineer'),
('RMR-ROLE-03','River Protection Expert','Water & Environmental Services','Environmental Research & River Protection','Environmental Scientist'),
('RMR-ROLE-04','Rain & Flood Expert','Water & Environmental Services','Hydrology & Watershed Science','Hydrologist'),
('RMR-ROLE-05','Water Plant Operator','Water & Environmental Services','Water Infrastructure Operations','Water Treatment Plant Operator'),
('RMR-ROLE-06','Water Safety Officer','Water & Environmental Services','Water Quality & Public Safety','Water Quality Compliance Officer'),
('RMR-ROLE-07','Water Project Manager','Water & Environmental Services','Water Operations & Planning','Water Infrastructure Project Manager'),
('RMR-ROLE-08','Community Water Helper','Water & Environmental Services','Community Water & Environmental Programmes','Community Water Programme Coordinator'),
('WAT_RF01_DR01','Water Quality Field Assistant','Water Resources, Environment and Public Utilities','Water Quality Field and Laboratory Evidence','Field Sampling and Site Monitoring'),
('WAT_RF02_DR01','Water Quality Laboratory Assistant','Water Resources, Environment and Public Utilities','Water Quality Field and Laboratory Evidence','Laboratory Sampling and Quality Control'),
('WAT_RF03_DR01','Environmental Data Analyst','Water Resources, Environment and Public Utilities','Environmental Data and Analysis','Environmental Data Analytics'),
('WAT_RF04_DR01','Water Treatment Operations Assistant','Water Resources, Environment and Public Utilities','Water Treatment and Utility Operations','Treatment Process Operations Support'),
('WAT_RF05_DR01','Environmental Compliance Support Associate','Water Resources, Environment and Public Utilities','Environmental Compliance and Public Programmes','Environmental Compliance Evidence'),
('WAT_RF06_DR01','Water Resources / WASH Project Associate','Water Resources, Environment and Public Utilities','Environmental Compliance and Public Programmes','Water Resources and WASH Project Support'),
('WAT_RF07_DR01','Water Project Finance & Procurement Associate','Water Resources, Environment and Public Utilities','Water Project Finance and Procurement','Water Project Financial Controls'),
('WAT_RF08_DR01','Water Monitoring Technology Associate','Water Resources, Environment and Public Utilities','Environmental Data and Analysis','Monitoring Devices and Sensor Evidence'),
('WAT_RF09_DR01','Environmental Communication Associate','Water Resources, Environment and Public Utilities','Environmental Compliance and Public Programmes','Environmental Communication and Outreach'))
SELECT e.code,e.name,ro.id AS role_id,ctx.id AS context_id,
 ctx.riasec_code_string,ctx.is_active,
 ctx.aptitude_profile IS NOT NULL AND ctx.big_five_profile IS NOT NULL
 AND ctx.work_values_profile IS NOT NULL AND ctx.aptitude_assessment IS NOT NULL
 AND ctx.big5_assessment IS NOT NULL AND ctx.work_values_assessment IS NOT NULL AS has_six_profiles,
 emb.entity_id IS NOT NULL AS has_embedding,
 vector_dims(emb.embedding) AS embedding_dimensions
FROM expected e
LEFT JOIN public.role ro ON ro.code=e.code OR ro.name=e.name
LEFT JOIN public.role_family_roles ctx ON ctx.role_id=ro.id
 AND ctx.role_family_domain_id IN (
  SELECT fd.id FROM public.role_family_domains fd
  JOIN public.role_families f ON f.id=fd.role_family_id
  JOIN public.industry_domains ds ON ds.id=fd.industry_domain_id
  JOIN public.domains d ON d.id=ds.domain_id
  JOIN public.industries i ON i.id=ds.industry_id
  WHERE f.name=e.family_name AND d.name=e.domain_name AND i.name=e.industry_name)
LEFT JOIN public.embeddings emb ON emb.entity_type='role' AND emb.entity_id=ctx.id
ORDER BY e.code;
