-- LOCAL SYNTHETIC DEMO. Beginner skills are unverified, approved only for local display.

BEGIN;

DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.learners WHERE user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3'::uuid AND email='arjun.srinivasan27@example.com') THEN RAISE EXCEPTION 'Apply Arjun learner profile first'; END IF; END $$;

INSERT INTO public.skills(id,learner_id,name,type,level,proficiency_level,description,verified,enabled,approval_status,has_pending_edit)
SELECT 'a11d45b4-ec80-59f9-9993-d59254a17f68'::uuid,l.id,'Material and Energy Balances','technical',2,'Beginner','Set up simple steady-state material and energy balances for classroom chemical-process problems. Authored unverified local demo profile; competence has not been independently assessed.',false,true,'approved',false
FROM public.learners l WHERE l.user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3'::uuid AND l.email='arjun.srinivasan27@example.com'
AND NOT EXISTS(SELECT 1 FROM public.skills s WHERE s.learner_id=l.id AND lower(s.name)=lower('Material and Energy Balances'))
ON CONFLICT(id) DO NOTHING;

INSERT INTO public.skills(id,learner_id,name,type,level,proficiency_level,description,verified,enabled,approval_status,has_pending_edit)
SELECT '4ca89e65-07f9-56b9-b898-6ac127c45701'::uuid,l.id,'Fluid Mechanics','technical',2,'Beginner','Interpret flow rate, pressure drop and basic pumping concepts in supervised water-system exercises. Authored unverified local demo profile; competence has not been independently assessed.',false,true,'approved',false
FROM public.learners l WHERE l.user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3'::uuid AND l.email='arjun.srinivasan27@example.com'
AND NOT EXISTS(SELECT 1 FROM public.skills s WHERE s.learner_id=l.id AND lower(s.name)=lower('Fluid Mechanics'))
ON CONFLICT(id) DO NOTHING;

INSERT INTO public.skills(id,learner_id,name,type,level,proficiency_level,description,verified,enabled,approval_status,has_pending_edit)
SELECT '0838c11e-20f7-5f80-8bb0-c70afcb7f04b'::uuid,l.id,'Heat Transfer','technical',2,'Beginner','Apply introductory conduction, convection and heat-exchanger concepts to classroom calculations. Authored unverified local demo profile; competence has not been independently assessed.',false,true,'approved',false
FROM public.learners l WHERE l.user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3'::uuid AND l.email='arjun.srinivasan27@example.com'
AND NOT EXISTS(SELECT 1 FROM public.skills s WHERE s.learner_id=l.id AND lower(s.name)=lower('Heat Transfer'))
ON CONFLICT(id) DO NOTHING;

INSERT INTO public.skills(id,learner_id,name,type,level,proficiency_level,description,verified,enabled,approval_status,has_pending_edit)
SELECT 'ddfff7da-071e-501a-b1e8-edcd2eef3dc3'::uuid,l.id,'Mass Transfer and Separation Processes','technical',2,'Beginner','Explain introductory diffusion, absorption, filtration and membrane separation concepts. Authored unverified local demo profile; competence has not been independently assessed.',false,true,'approved',false
FROM public.learners l WHERE l.user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3'::uuid AND l.email='arjun.srinivasan27@example.com'
AND NOT EXISTS(SELECT 1 FROM public.skills s WHERE s.learner_id=l.id AND lower(s.name)=lower('Mass Transfer and Separation Processes'))
ON CONFLICT(id) DO NOTHING;

INSERT INTO public.skills(id,learner_id,name,type,level,proficiency_level,description,verified,enabled,approval_status,has_pending_edit)
SELECT '8ac9a445-d797-5b5c-bdf3-0bdc732b62da'::uuid,l.id,'Process Flow Diagram Interpretation','technical',2,'Beginner','Read basic process-flow diagrams, identify unit operations and trace stream connections. Authored unverified local demo profile; competence has not been independently assessed.',false,true,'approved',false
FROM public.learners l WHERE l.user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3'::uuid AND l.email='arjun.srinivasan27@example.com'
AND NOT EXISTS(SELECT 1 FROM public.skills s WHERE s.learner_id=l.id AND lower(s.name)=lower('Process Flow Diagram Interpretation'))
ON CONFLICT(id) DO NOTHING;

INSERT INTO public.skills(id,learner_id,name,type,level,proficiency_level,description,verified,enabled,approval_status,has_pending_edit)
SELECT '28a0c27b-41f1-56d0-a5e5-5b7270760fca'::uuid,l.id,'Chemical Process Safety','technical',2,'Beginner','Identify basic chemical handling hazards, interpret safety data sheets and follow supervised laboratory procedures. Authored unverified local demo profile; competence has not been independently assessed.',false,true,'approved',false
FROM public.learners l WHERE l.user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3'::uuid AND l.email='arjun.srinivasan27@example.com'
AND NOT EXISTS(SELECT 1 FROM public.skills s WHERE s.learner_id=l.id AND lower(s.name)=lower('Chemical Process Safety'))
ON CONFLICT(id) DO NOTHING;

COMMIT;
