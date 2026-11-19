-- After SkillPassport 02, export this JSON for the LTE role import.
WITH expected(code,name,family_name,domain_name) AS (VALUES ('WAT_RF06_DR01','Water Resources / WASH Project Associate','Water Resources and WASH Project Support','Environmental Compliance and Public Programmes'),('WAT_RF07_DR01','Water Project Finance & Procurement Associate','Water Project Financial Controls','Water Project Finance and Procurement'),('WAT_RF08_DR01','Water Monitoring Technology Associate','Monitoring Devices and Sensor Evidence','Environmental Data and Analysis'),('WAT_RF03_DR01','Environmental Data Analyst','Environmental Data Analytics','Environmental Data and Analysis'),('WAT_RF04_DR01','Water Treatment Operations Assistant','Treatment Process Operations Support','Water Treatment and Utility Operations'),('WAT_RF05_DR01','Environmental Compliance Support Associate','Environmental Compliance Evidence','Environmental Compliance and Public Programmes'))
SELECT jsonb_object_agg(e.code,ctx.id) AS role_context_ids FROM expected e
JOIN public.role ro ON ro.code=e.code OR ro.name=e.name
JOIN public.role_family_roles ctx ON ctx.role_id=ro.id AND ctx.is_active
JOIN public.role_family_domains fd ON fd.id=ctx.role_family_domain_id
JOIN public.role_families f ON f.id=fd.role_family_id AND f.name=e.family_name
JOIN public.industry_domains ds ON ds.id=fd.industry_domain_id
JOIN public.domains d ON d.id=ds.domain_id AND d.name=e.domain_name;