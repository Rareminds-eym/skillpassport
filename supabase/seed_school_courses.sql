-- Seed file for School Courses
-- Generated from School_Fixed_As_Courses_Template.xlsx
-- Includes classification column and course_skills mapping

-- Insert courses
INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_001',
  'Systems Thinking Kickstart ',
  'Practice-based course for Grade 6 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '20',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_002',
  'Learning How to Learn - Basics ',
  'Practice-based course for Grade 6 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '20',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_003',
  'Cyber Ethics - Basics ',
  'Practice-based course for Grade 6 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '20',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_004',
  'Innovation Thinking Foundation ',
  'Practice-based course for Grade 6 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '20',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_005',
  'Research Tech Tools - Starter ',
  'Practice-based course for Grade 6 to build technology capability through activities, reflection, and real-world tasks.',
  '20',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_006',
  'Visual Communication Starter ',
  'Practice-based course for Grade 6 to build communication capability through activities, reflection, and real-world tasks.',
  '20',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_007',
  'Research Mini-Project: Foundation ',
  'Practice-based course for Grade 6 to build project lab capability through activities, reflection, and real-world tasks.',
  '40',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_008',
  'Entrepreneurship Ecosystem - Level 1 ',
  'Practice-based course for Grade 6 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '20',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_009',
  'Email & Messaging Starter ',
  'Practice-based course for Grade 6 to build communication capability through activities, reflection, and real-world tasks.',
  '20',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_010',
  'Investment Mindset - Foundation ',
  'Practice-based course for Grade 6 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '20',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_011',
  'Stress Management - Kickstart ',
  'Practice-based course for Grade 6 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '20',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_012',
  'Capstone Planning - Kickstart ',
  'Practice-based course for Grade 6 to build career readiness capability through activities, reflection, and real-world tasks.',
  '20',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_013',
  'Teamwork Foundations - Level 1 ',
  'Practice-based course for Grade 6 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '20',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_014',
  'Product Build Challenge: Level 1 ',
  'Practice-based course for Grade 6 to build project lab capability through activities, reflection, and real-world tasks.',
  '40',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_015',
  'Systems Thinking Foundation ',
  'Practice-based course for Grade 6 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '20',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_016',
  'Wellbeing & Balance - Foundation ',
  'Practice-based course for Grade 6 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '20',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_017',
  'Cyberbullying Prevention - Starter ',
  'Practice-based course for Grade 6 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '20',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_018',
  'Ethical Reasoning Foundation ',
  'Practice-based course for Grade 6 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '20',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_019',
  'No-Code Tools - Foundation ',
  'Practice-based course for Grade 6 to build technology capability through activities, reflection, and real-world tasks.',
  '20',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_020',
  'Voice & Diction Kickstart ',
  'Practice-based course for Grade 6 to build communication capability through activities, reflection, and real-world tasks.',
  '20',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_021',
  'Service Improvement Project: Level 1 ',
  'Practice-based course for Grade 6 to build project lab capability through activities, reflection, and real-world tasks.',
  '40',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_022',
  'Service Design - Foundation ',
  'Practice-based course for Grade 6 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '20',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_023',
  'Negotiation Basics ',
  'Practice-based course for Grade 6 to build communication capability through activities, reflection, and real-world tasks.',
  '20',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_024',
  'Entrepreneur Finance - Foundation ',
  'Practice-based course for Grade 6 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '20',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G6_025',
  'Self-Discipline - Kickstart ',
  'Practice-based course for Grade 6 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '20',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_001',
  'Learning How to Learn - Level 2 ',
  'Practice-based course for Grade 7 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '25',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_002',
  'Delegation - Core ',
  'Practice-based course for Grade 7 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '25',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_003',
  'Leadership Pathways - Level 2 ',
  'Practice-based course for Grade 7 to build career readiness capability through activities, reflection, and real-world tasks.',
  '25',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_004',
  'Creative Thinking Core ',
  'Practice-based course for Grade 7 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '25',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_005',
  'Innovation Thinking Level 2 ',
  'Practice-based course for Grade 7 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '25',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_006',
  'Pricing & Value - Level 2 ',
  'Practice-based course for Grade 7 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '25',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_007',
  'Self-Confidence - Practice ',
  'Practice-based course for Grade 7 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '25',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_008',
  'Visual Communication Level 2 ',
  'Practice-based course for Grade 7 to build communication capability through activities, reflection, and real-world tasks.',
  '25',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_009',
  'Visual Communication Toolkit ',
  'Practice-based course for Grade 7 to build communication capability through activities, reflection, and real-world tasks.',
  '25',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_010',
  'Consulting Basics - Practice ',
  'Practice-based course for Grade 7 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '25',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_011',
  'Business Simulation: Practice ',
  'Practice-based course for Grade 7 to build project lab capability through activities, reflection, and real-world tasks.',
  '40',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_012',
  'Collaboration Tools - Core ',
  'Practice-based course for Grade 7 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '25',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  4,
  4
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_013',
  'Entrepreneur Pitch Lab: Toolkit ',
  'Practice-based course for Grade 7 to build project lab capability through activities, reflection, and real-world tasks.',
  '40',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_014',
  'Digital Marketing - Level 2 ',
  'Practice-based course for Grade 7 to build technology capability through activities, reflection, and real-world tasks.',
  '25',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_015',
  'Learning How to Learn - Toolkit ',
  'Practice-based course for Grade 7 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '25',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_016',
  'Facilitation - Level 2 ',
  'Practice-based course for Grade 7 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '25',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_017',
  'Resume Basics - Build-Up ',
  'Practice-based course for Grade 7 to build career readiness capability through activities, reflection, and real-world tasks.',
  '25',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_018',
  'Analytical Thinking Toolkit ',
  'Practice-based course for Grade 7 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '25',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_019',
  'Design Thinking Toolkit ',
  'Practice-based course for Grade 7 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '25',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_020',
  'Pricing & Value - Practice ',
  'Practice-based course for Grade 7 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '25',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_021',
  'Goal Setting - Core ',
  'Practice-based course for Grade 7 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '25',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_022',
  'Group Discussion Level 2 ',
  'Practice-based course for Grade 7 to build communication capability through activities, reflection, and real-world tasks.',
  '25',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_023',
  'Debate & Argumentation Toolkit ',
  'Practice-based course for Grade 7 to build communication capability through activities, reflection, and real-world tasks.',
  '25',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_024',
  'Product Thinking - Level 2 ',
  'Practice-based course for Grade 7 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '25',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G7_025',
  'Business Simulation: Level 2 ',
  'Practice-based course for Grade 7 to build project lab capability through activities, reflection, and real-world tasks.',
  '40',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_001',
  'Decision Making Workshop ',
  'Practice-based course for Grade 8 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_002',
  'Entrepreneur Pitch Lab: Structured ',
  'Practice-based course for Grade 8 to build project lab capability through activities, reflection, and real-world tasks.',
  '40',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_003',
  'Mentoring Skills - Workshop ',
  'Practice-based course for Grade 8 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '30',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_004',
  'Active Listening Skills Lab ',
  'Practice-based course for Grade 8 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_005',
  'Marketing Fundamentals - Applied ',
  'Practice-based course for Grade 8 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '30',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_006',
  'Pricing & Value - Skills Lab ',
  'Practice-based course for Grade 8 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_007',
  'Self-Confidence - Structured ',
  'Practice-based course for Grade 8 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_008',
  'Data Visualization - Skills Lab ',
  'Practice-based course for Grade 8 to build technology capability through activities, reflection, and real-world tasks.',
  '30',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_009',
  'Professional Etiquette - Level 3 ',
  'Practice-based course for Grade 8 to build career readiness capability through activities, reflection, and real-world tasks.',
  '30',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_010',
  'Critical Thinking Workshop ',
  'Practice-based course for Grade 8 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_011',
  'School Improvement Consulting: Workshop ',
  'Practice-based course for Grade 8 to build project lab capability through activities, reflection, and real-world tasks.',
  '40',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_012',
  'Self-Confidence - Level 3 ',
  'Practice-based course for Grade 8 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_013',
  'Narrative Writing Structured ',
  'Practice-based course for Grade 8 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_014',
  'Cyberbullying Prevention - Level 3 ',
  'Practice-based course for Grade 8 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_015',
  'Design Thinking Applied ',
  'Practice-based course for Grade 8 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_016',
  'Sustainability Challenge: Workshop ',
  'Practice-based course for Grade 8 to build project lab capability through activities, reflection, and real-world tasks.',
  '40',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_017',
  'Community Leadership - Structured ',
  'Practice-based course for Grade 8 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '30',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_018',
  'Group Discussion Skills Lab ',
  'Practice-based course for Grade 8 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_019',
  'Business Models - Structured ',
  'Practice-based course for Grade 8 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '30',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_020',
  'Investment Mindset - Applied ',
  'Practice-based course for Grade 8 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_021',
  'Growth Mindset - Level 3 ',
  'Practice-based course for Grade 8 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_022',
  'No-Code Tools - Workshop ',
  'Practice-based course for Grade 8 to build technology capability through activities, reflection, and real-world tasks.',
  '30',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_023',
  'Capstone Planning - Applied ',
  'Practice-based course for Grade 8 to build career readiness capability through activities, reflection, and real-world tasks.',
  '30',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_024',
  'Case Study Thinking Level 3 ',
  'Practice-based course for Grade 8 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_025',
  'Design Challenge: Skills Lab ',
  'Practice-based course for Grade 8 to build project lab capability through activities, reflection, and real-world tasks.',
  '40',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_026',
  'Accountability - Workshop ',
  'Practice-based course for Grade 8 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_027',
  'Report Writing Level 3 ',
  'Practice-based course for Grade 8 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_028',
  'Responsible Sharing - Level 3 ',
  'Practice-based course for Grade 8 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_029',
  'Creative Thinking Workshop ',
  'Practice-based course for Grade 8 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G8_030',
  'Research Mini-Project: Level 3 ',
  'Practice-based course for Grade 8 to build project lab capability through activities, reflection, and real-world tasks.',
  '40',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'middle_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_001',
  'Entrepreneurship Ecosystem - Challenge ',
  'Practice-based course for Grade 9 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '30',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_002',
  'Scientific Thinking Studio ',
  'Practice-based course for Grade 9 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_003',
  'Storytelling Real-World ',
  'Practice-based course for Grade 9 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_004',
  'Smart Spending - Real-World ',
  'Practice-based course for Grade 9 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_005',
  'Goal Setting - Essentials ',
  'Practice-based course for Grade 9 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_006',
  'Robotics Concepts - Challenge ',
  'Practice-based course for Grade 9 to build technology capability through activities, reflection, and real-world tasks.',
  '30',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_007',
  'Responsible Sharing - Real-World ',
  'Practice-based course for Grade 9 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_008',
  'Career Mapping - Essentials ',
  'Practice-based course for Grade 9 to build career readiness capability through activities, reflection, and real-world tasks.',
  '30',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_009',
  'Research Mini-Project: Challenge ',
  'Practice-based course for Grade 9 to build project lab capability through activities, reflection, and real-world tasks.',
  '45',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_010',
  'Facilitation - Essentials ',
  'Practice-based course for Grade 9 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '30',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_011',
  'Learning How to Learn - Intermediate ',
  'Practice-based course for Grade 9 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_012',
  'Presentation Design Intermediate ',
  'Practice-based course for Grade 9 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_013',
  'Design Thinking Studio ',
  'Practice-based course for Grade 9 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_014',
  'Industry Case Simulation: Challenge ',
  'Practice-based course for Grade 9 to build project lab capability through activities, reflection, and real-world tasks.',
  '45',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_015',
  'Customer Thinking - Challenge ',
  'Practice-based course for Grade 9 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '30',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_016',
  'Strategy Basics Intermediate ',
  'Practice-based course for Grade 9 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_017',
  'Report Writing Real-World ',
  'Practice-based course for Grade 9 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_018',
  'Business Finance Basics - Essentials ',
  'Practice-based course for Grade 9 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_019',
  'Learning How to Learn - Challenge ',
  'Practice-based course for Grade 9 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_020',
  'Robotics Concepts - Intermediate ',
  'Practice-based course for Grade 9 to build technology capability through activities, reflection, and real-world tasks.',
  '30',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_021',
  'Media Literacy - Studio ',
  'Practice-based course for Grade 9 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_022',
  'Entrepreneur Pathways - Studio ',
  'Practice-based course for Grade 9 to build career readiness capability through activities, reflection, and real-world tasks.',
  '30',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_023',
  'Research Mini-Project: Studio ',
  'Practice-based course for Grade 9 to build project lab capability through activities, reflection, and real-world tasks.',
  '45',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_024',
  'Ethical Leadership - Real-World ',
  'Practice-based course for Grade 9 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '30',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_025',
  'Habit Building - Challenge ',
  'Practice-based course for Grade 9 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_026',
  'Negotiation Challenge ',
  'Practice-based course for Grade 9 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_027',
  'Strategy Basics Challenge ',
  'Practice-based course for Grade 9 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_028',
  'Cross-Functional Team Challenge: Intermediate ',
  'Practice-based course for Grade 9 to build project lab capability through activities, reflection, and real-world tasks.',
  '45',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_029',
  'Service Design - Real-World ',
  'Practice-based course for Grade 9 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '30',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G9_030',
  'Case Study Thinking Challenge ',
  'Practice-based course for Grade 9 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_001',
  'Growth Mindset - Frameworks ',
  'Practice-based course for Grade 10 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '35',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_002',
  'Analytical Thinking Simulation ',
  'Practice-based course for Grade 10 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '35',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_003',
  'College & Pathways - Simulation ',
  'Practice-based course for Grade 10 to build career readiness capability through activities, reflection, and real-world tasks.',
  '35',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_004',
  'App Thinking - Frameworks ',
  'Practice-based course for Grade 10 to build technology capability through activities, reflection, and real-world tasks.',
  '35',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_005',
  'Professional Writing Masterclass ',
  'Practice-based course for Grade 10 to build communication capability through activities, reflection, and real-world tasks.',
  '35',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_006',
  'Entrepreneur Pitch Lab: Frameworks ',
  'Practice-based course for Grade 10 to build project lab capability through activities, reflection, and real-world tasks.',
  '45',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_007',
  'Data Reasoning Masterclass ',
  'Practice-based course for Grade 10 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '35',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_008',
  'Operations Basics - Frameworks ',
  'Practice-based course for Grade 10 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '35',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_009',
  'Business Finance Basics - Advanced ',
  'Practice-based course for Grade 10 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '35',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_010',
  'Community Impact Project: Frameworks ',
  'Practice-based course for Grade 10 to build project lab capability through activities, reflection, and real-world tasks.',
  '45',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_011',
  'Storytelling Professional ',
  'Practice-based course for Grade 10 to build communication capability through activities, reflection, and real-world tasks.',
  '35',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_012',
  'Feedback Skills - Professional ',
  'Practice-based course for Grade 10 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '35',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_013',
  'Cyberbullying Prevention - Masterclass ',
  'Practice-based course for Grade 10 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '35',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_014',
  'Accountability - Professional ',
  'Practice-based course for Grade 10 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '35',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_015',
  'Stress Management - Masterclass ',
  'Practice-based course for Grade 10 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '35',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_016',
  'Systems Thinking Professional ',
  'Practice-based course for Grade 10 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '35',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_017',
  'Workplace Communication - Advanced ',
  'Practice-based course for Grade 10 to build career readiness capability through activities, reflection, and real-world tasks.',
  '35',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_018',
  'Digital Design - Professional ',
  'Practice-based course for Grade 10 to build technology capability through activities, reflection, and real-world tasks.',
  '35',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_019',
  'Negotiation Masterclass ',
  'Practice-based course for Grade 10 to build communication capability through activities, reflection, and real-world tasks.',
  '35',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_020',
  'Capstone Project: Masterclass ',
  'Practice-based course for Grade 10 to build project lab capability through activities, reflection, and real-world tasks.',
  '45',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_021',
  'Strategy Basics Professional ',
  'Practice-based course for Grade 10 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '35',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_022',
  'Roles & Functions - Simulation ',
  'Practice-based course for Grade 10 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '35',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_023',
  'Saving & Investing - Masterclass ',
  'Practice-based course for Grade 10 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '35',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_024',
  'Product Build Challenge: Frameworks ',
  'Practice-based course for Grade 10 to build project lab capability through activities, reflection, and real-world tasks.',
  '45',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_025',
  'Group Discussion Advanced ',
  'Practice-based course for Grade 10 to build communication capability through activities, reflection, and real-world tasks.',
  '35',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_026',
  'Community Leadership - Professional ',
  'Practice-based course for Grade 10 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '35',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_027',
  'Digital Productivity Tools - Advanced ',
  'Practice-based course for Grade 10 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '35',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_028',
  'Emotional Intelligence - Simulation ',
  'Practice-based course for Grade 10 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '35',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_029',
  'Habit Building - Simulation ',
  'Practice-based course for Grade 10 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '35',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G10_030',
  'Logical Reasoning Simulation ',
  'Practice-based course for Grade 10 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '35',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'high_school'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_001',
  'Scientific Thinking Industry-Ready ',
  'Practice-based course for Grade 11 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '35',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_002',
  'Analytical Thinking Strategic ',
  'Practice-based course for Grade 11 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '35',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_003',
  'Voice & Diction Industry-Ready ',
  'Practice-based course for Grade 11 to build communication capability through activities, reflection, and real-world tasks.',
  '35',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_004',
  'Data Literacy - Leadership ',
  'Practice-based course for Grade 11 to build technology capability through activities, reflection, and real-world tasks.',
  '35',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_005',
  'Money Basics - Strategic ',
  'Practice-based course for Grade 11 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '35',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_006',
  'Communication Confidence - Pro Lab ',
  'Practice-based course for Grade 11 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '35',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_007',
  'Portfolio Building - Leadership ',
  'Practice-based course for Grade 11 to build career readiness capability through activities, reflection, and real-world tasks.',
  '35',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_008',
  'Entrepreneurship Ecosystem - Deep Dive ',
  'Practice-based course for Grade 11 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '35',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_009',
  'Cyber Ethics - Industry-Ready ',
  'Practice-based course for Grade 11 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '35',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_010',
  'Stress Management - Industry-Ready ',
  'Practice-based course for Grade 11 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '35',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_011',
  'Active Listening Deep Dive ',
  'Practice-based course for Grade 11 to build communication capability through activities, reflection, and real-world tasks.',
  '35',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_012',
  'Data Story Project: Industry-Ready ',
  'Practice-based course for Grade 11 to build project lab capability through activities, reflection, and real-world tasks.',
  '50',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_013',
  'Conflict Resolution - Strategic ',
  'Practice-based course for Grade 11 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '35',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_014',
  'Industry Case Simulation: Industry-Ready ',
  'Practice-based course for Grade 11 to build project lab capability through activities, reflection, and real-world tasks.',
  '50',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_015',
  'Design Thinking Deep Dive ',
  'Practice-based course for Grade 11 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '35',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_016',
  'Data Reasoning Leadership ',
  'Practice-based course for Grade 11 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '35',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  4,
  4
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_017',
  'Body Language Leadership ',
  'Practice-based course for Grade 11 to build communication capability through activities, reflection, and real-world tasks.',
  '35',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_018',
  'Internet of Things - Strategic ',
  'Practice-based course for Grade 11 to build technology capability through activities, reflection, and real-world tasks.',
  '35',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_019',
  'Smart Spending - Deep Dive ',
  'Practice-based course for Grade 11 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '35',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_020',
  'Emotional Intelligence - Pro Lab ',
  'Practice-based course for Grade 11 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '35',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_021',
  'Presentation Defense - Pro Lab ',
  'Practice-based course for Grade 11 to build career readiness capability through activities, reflection, and real-world tasks.',
  '35',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_022',
  'Economics Basics - Industry-Ready ',
  'Practice-based course for Grade 11 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '35',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_023',
  'Digital Wellbeing - Industry-Ready ',
  'Practice-based course for Grade 11 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '35',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_024',
  'Communication Confidence - Industry-Ready ',
  'Practice-based course for Grade 11 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '35',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_025',
  'Presentation Design Leadership ',
  'Practice-based course for Grade 11 to build communication capability through activities, reflection, and real-world tasks.',
  '35',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_026',
  'Community Impact Project: Strategic ',
  'Practice-based course for Grade 11 to build project lab capability through activities, reflection, and real-world tasks.',
  '50',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_027',
  'Conflict Resolution - Deep Dive ',
  'Practice-based course for Grade 11 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '35',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_028',
  'Community Impact Project: Pro Lab ',
  'Practice-based course for Grade 11 to build project lab capability through activities, reflection, and real-world tasks.',
  '50',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_029',
  'Ethical Reasoning Pro Lab ',
  'Practice-based course for Grade 11 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '35',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G11_030',
  'Logical Reasoning Deep Dive ',
  'Practice-based course for Grade 11 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '35',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_001',
  'Digital Design - Capstone ',
  'Practice-based course for Grade 12 to build technology capability through activities, reflection, and real-world tasks.',
  '30',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_002',
  'Email & Messaging Portfolio ',
  'Practice-based course for Grade 12 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_003',
  'Product Build Challenge: Capstone ',
  'Practice-based course for Grade 12 to build project lab capability through activities, reflection, and real-world tasks.',
  '50',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_004',
  'Privacy & Security - Capstone ',
  'Practice-based course for Grade 12 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_005',
  'Entrepreneur Pitch Lab: Portfolio ',
  'Practice-based course for Grade 12 to build project lab capability through activities, reflection, and real-world tasks.',
  '50',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_006',
  'Decision Making Future-Ready ',
  'Practice-based course for Grade 12 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_007',
  'Stakeholder Management - Future-Ready ',
  'Practice-based course for Grade 12 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '30',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_008',
  'Career Exploration - Expert ',
  'Practice-based course for Grade 12 to build career readiness capability through activities, reflection, and real-world tasks.',
  '30',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_009',
  'Body Language Capstone ',
  'Practice-based course for Grade 12 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_010',
  'Economics Basics - Expert ',
  'Practice-based course for Grade 12 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '30',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_011',
  'Growth Mindset - Expert ',
  'Practice-based course for Grade 12 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_012',
  'Analytical Thinking Expert ',
  'Practice-based course for Grade 12 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_013',
  'Financial Decision Making - Capstone ',
  'Practice-based course for Grade 12 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_014',
  'Focus & Attention - Portfolio ',
  'Practice-based course for Grade 12 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_015',
  'Research Tech Tools - Future-Ready ',
  'Practice-based course for Grade 12 to build technology capability through activities, reflection, and real-world tasks.',
  '30',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_016',
  'Confident Speaking Portfolio ',
  'Practice-based course for Grade 12 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_017',
  'Community Impact Project: Portfolio ',
  'Practice-based course for Grade 12 to build project lab capability through activities, reflection, and real-world tasks.',
  '50',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_018',
  'Password Hygiene - Capstone ',
  'Practice-based course for Grade 12 to build digital literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Digital Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Practice safe and ethical online behavior", "manage privacy", "evaluate information", "use tools responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_019',
  'AI Use-Case Project: Future-Ready ',
  'Practice-based course for Grade 12 to build project lab capability through activities, reflection, and real-world tasks.',
  '50',
  'Project Lab',
  'technical',
  NULL,
  0,
  'Active',
  NULL,
  '["Deliver a project artifact", "collaborate", "present outcomes", "reflect and iterate based on feedback."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_020',
  'Innovation Thinking Expert ',
  'Practice-based course for Grade 12 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_021',
  'Community Leadership - Future-Ready ',
  'Practice-based course for Grade 12 to build leadership & collaboration capability through activities, reflection, and real-world tasks.',
  '30',
  'Leadership & Collaboration',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Collaborate in teams", "manage conflict", "give/receive feedback", "lead responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_022',
  'Personal Branding - Capstone ',
  'Practice-based course for Grade 12 to build career readiness capability through activities, reflection, and real-world tasks.',
  '30',
  'Career Readiness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Explore pathways", "build portfolio artifacts", "prepare for interviews/internships", "develop professional behavior."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_023',
  'Visual Communication Portfolio ',
  'Practice-based course for Grade 12 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_024',
  'Quality & Process - Capstone ',
  'Practice-based course for Grade 12 to build industry awareness capability through activities, reflection, and real-world tasks.',
  '30',
  'Industry Awareness',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand workplace functions", "connect learning to real-world contexts", "explore roles and industries."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_025',
  'Emotional Intelligence - Capstone ',
  'Practice-based course for Grade 12 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_026',
  'Innovation Thinking Defense ',
  'Practice-based course for Grade 12 to build thinking skills capability through activities, reflection, and real-world tasks.',
  '30',
  'Thinking Skills',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Analyze situations", "identify causes", "generate solutions", "justify decisions using evidence."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  3,
  3
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_027',
  'Credit & Debt - Capstone ',
  'Practice-based course for Grade 12 to build financial literacy capability through activities, reflection, and real-world tasks.',
  '30',
  'Financial Literacy',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Use money concepts", "budget and plan", "make informed choices", "understand value and risk."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_028',
  'Resilience - Expert ',
  'Practice-based course for Grade 12 to build personal mastery capability through activities, reflection, and real-world tasks.',
  '30',
  'Personal Mastery',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Build self-awareness", "manage time and emotions", "sustain habits", "improve resilience and focus."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_029',
  'AI Awareness - Future-Ready ',
  'Practice-based course for Grade 12 to build technology capability through activities, reflection, and real-world tasks.',
  '30',
  'Technology',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Understand emerging tech", "apply data/digital tools", "build simple solutions", "use technology responsibly."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  2,
  2
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;

INSERT INTO courses (
  code, title, description, duration, category, skill_type, university, 
  credits, status, thumbnail, target_outcomes, classification,
  approval_status, enrollment_count, completion_rate, evidence_pending, 
  skills_mapped, total_skills
) VALUES (
  'G12_030',
  'Persuasive Speaking Defense ',
  'Practice-based course for Grade 12 to build communication capability through activities, reflection, and real-world tasks.',
  '30',
  'Communication',
  'soft',
  NULL,
  0,
  'Active',
  NULL,
  '["Speak with clarity", "structure ideas", "present confidently", "listen and respond effectively."]'::jsonb,
  'higher_secondary'::classification,
  'pending',
  0,
  0,
  0,
  1,
  1
) ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  category = EXCLUDED.category,
  skill_type = EXCLUDED.skill_type,
  university = EXCLUDED.university,
  credits = EXCLUDED.credits,
  status = EXCLUDED.status,
  thumbnail = EXCLUDED.thumbnail,
  target_outcomes = EXCLUDED.target_outcomes,
  classification = EXCLUDED.classification,
  skills_mapped = EXCLUDED.skills_mapped,
  total_skills = EXCLUDED.total_skills;


-- Insert course_skills (mapped by course code)
-- Skills are auto-generated based on course content analysis

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G6_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Systems Thinking', 'Beginner'
FROM courses
WHERE code = 'G6_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G6_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G6_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G6_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Beginner'
FROM courses
WHERE code = 'G6_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Ethical Reasoning', 'Beginner'
FROM courses
WHERE code = 'G6_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G6_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Creativity', 'Beginner'
FROM courses
WHERE code = 'G6_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G6_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Beginner'
FROM courses
WHERE code = 'G6_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Research Skills', 'Beginner'
FROM courses
WHERE code = 'G6_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Beginner'
FROM courses
WHERE code = 'G6_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G6_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Research Skills', 'Beginner'
FROM courses
WHERE code = 'G6_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G6_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Entrepreneurship', 'Beginner'
FROM courses
WHERE code = 'G6_008'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G6_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G6_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Beginner'
FROM courses
WHERE code = 'G6_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G6_011'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Self-Management', 'Beginner'
FROM courses
WHERE code = 'G6_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G6_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Beginner'
FROM courses
WHERE code = 'G6_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Beginner'
FROM courses
WHERE code = 'G6_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Beginner'
FROM courses
WHERE code = 'G6_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G6_014'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G6_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Systems Thinking', 'Beginner'
FROM courses
WHERE code = 'G6_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G6_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G6_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Health & Wellness', 'Beginner'
FROM courses
WHERE code = 'G6_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G6_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Beginner'
FROM courses
WHERE code = 'G6_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G6_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G6_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Beginner'
FROM courses
WHERE code = 'G6_019'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Beginner'
FROM courses
WHERE code = 'G6_019'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G6_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G6_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G6_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G6_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G6_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G6_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Beginner'
FROM courses
WHERE code = 'G6_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Self-Management', 'Beginner'
FROM courses
WHERE code = 'G6_025'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G6_025'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G7_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Beginner'
FROM courses
WHERE code = 'G7_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Beginner'
FROM courses
WHERE code = 'G7_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Beginner'
FROM courses
WHERE code = 'G7_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Beginner'
FROM courses
WHERE code = 'G7_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G7_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G7_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G7_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Creativity', 'Beginner'
FROM courses
WHERE code = 'G7_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G7_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G7_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Beginner'
FROM courses
WHERE code = 'G7_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G7_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G7_008'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G7_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G7_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G7_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Entrepreneurship', 'Beginner'
FROM courses
WHERE code = 'G7_011'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G7_011'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G7_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Beginner'
FROM courses
WHERE code = 'G7_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Beginner'
FROM courses
WHERE code = 'G7_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Beginner'
FROM courses
WHERE code = 'G7_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G7_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Beginner'
FROM courses
WHERE code = 'G7_014'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Beginner'
FROM courses
WHERE code = 'G7_014'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G7_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Beginner'
FROM courses
WHERE code = 'G7_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Beginner'
FROM courses
WHERE code = 'G7_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Beginner'
FROM courses
WHERE code = 'G7_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G7_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G7_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G7_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G7_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G7_019'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Creativity', 'Beginner'
FROM courses
WHERE code = 'G7_019'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G7_019'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G7_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Beginner'
FROM courses
WHERE code = 'G7_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G7_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G7_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G7_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G7_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G7_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Entrepreneurship', 'Beginner'
FROM courses
WHERE code = 'G7_025'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G7_025'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G8_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G8_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G8_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Beginner'
FROM courses
WHERE code = 'G8_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Beginner'
FROM courses
WHERE code = 'G8_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Beginner'
FROM courses
WHERE code = 'G8_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G8_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G8_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G8_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G8_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Beginner'
FROM courses
WHERE code = 'G8_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G8_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Beginner'
FROM courses
WHERE code = 'G8_008'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Beginner'
FROM courses
WHERE code = 'G8_008'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G8_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G8_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G8_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G8_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G8_011'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G8_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G8_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Writing', 'Beginner'
FROM courses
WHERE code = 'G8_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G8_014'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Beginner'
FROM courses
WHERE code = 'G8_014'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G8_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Creativity', 'Beginner'
FROM courses
WHERE code = 'G8_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G8_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G8_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Environmental Awareness', 'Beginner'
FROM courses
WHERE code = 'G8_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Beginner'
FROM courses
WHERE code = 'G8_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Beginner'
FROM courses
WHERE code = 'G8_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Beginner'
FROM courses
WHERE code = 'G8_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G8_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Entrepreneurship', 'Beginner'
FROM courses
WHERE code = 'G8_019'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G8_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Beginner'
FROM courses
WHERE code = 'G8_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G8_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Beginner'
FROM courses
WHERE code = 'G8_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Beginner'
FROM courses
WHERE code = 'G8_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Self-Management', 'Beginner'
FROM courses
WHERE code = 'G8_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G8_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G8_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G8_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G8_025'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Beginner'
FROM courses
WHERE code = 'G8_026'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Beginner'
FROM courses
WHERE code = 'G8_027'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Writing', 'Beginner'
FROM courses
WHERE code = 'G8_027'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G8_028'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Beginner'
FROM courses
WHERE code = 'G8_028'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Beginner'
FROM courses
WHERE code = 'G8_029'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Beginner'
FROM courses
WHERE code = 'G8_029'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Research Skills', 'Beginner'
FROM courses
WHERE code = 'G8_030'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Beginner'
FROM courses
WHERE code = 'G8_030'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Entrepreneurship', 'Intermediate'
FROM courses
WHERE code = 'G9_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G9_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G9_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Scientific Method', 'Intermediate'
FROM courses
WHERE code = 'G9_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G9_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G9_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Intermediate'
FROM courses
WHERE code = 'G9_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Intermediate'
FROM courses
WHERE code = 'G9_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Intermediate'
FROM courses
WHERE code = 'G9_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Intermediate'
FROM courses
WHERE code = 'G9_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G9_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Intermediate'
FROM courses
WHERE code = 'G9_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G9_008'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G9_008'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Research Skills', 'Intermediate'
FROM courses
WHERE code = 'G9_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Intermediate'
FROM courses
WHERE code = 'G9_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Intermediate'
FROM courses
WHERE code = 'G9_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Intermediate'
FROM courses
WHERE code = 'G9_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Intermediate'
FROM courses
WHERE code = 'G9_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Intermediate'
FROM courses
WHERE code = 'G9_011'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G9_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Intermediate'
FROM courses
WHERE code = 'G9_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G9_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Creativity', 'Intermediate'
FROM courses
WHERE code = 'G9_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G9_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Intermediate'
FROM courses
WHERE code = 'G9_014'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G9_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G9_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G9_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G9_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G9_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Writing', 'Intermediate'
FROM courses
WHERE code = 'G9_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G9_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Intermediate'
FROM courses
WHERE code = 'G9_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Entrepreneurship', 'Intermediate'
FROM courses
WHERE code = 'G9_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Intermediate'
FROM courses
WHERE code = 'G9_019'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Intermediate'
FROM courses
WHERE code = 'G9_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Intermediate'
FROM courses
WHERE code = 'G9_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G9_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Intermediate'
FROM courses
WHERE code = 'G9_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G9_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G9_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Research Skills', 'Intermediate'
FROM courses
WHERE code = 'G9_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Intermediate'
FROM courses
WHERE code = 'G9_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Intermediate'
FROM courses
WHERE code = 'G9_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Intermediate'
FROM courses
WHERE code = 'G9_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Intermediate'
FROM courses
WHERE code = 'G9_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Intermediate'
FROM courses
WHERE code = 'G9_025'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G9_026'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G9_027'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G9_027'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Intermediate'
FROM courses
WHERE code = 'G9_028'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G9_029'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G9_029'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G9_030'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G9_030'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Intermediate'
FROM courses
WHERE code = 'G10_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G10_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G10_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G10_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G10_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Intermediate'
FROM courses
WHERE code = 'G10_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Intermediate'
FROM courses
WHERE code = 'G10_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G10_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Writing', 'Intermediate'
FROM courses
WHERE code = 'G10_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Intermediate'
FROM courses
WHERE code = 'G10_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G10_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G10_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Intermediate'
FROM courses
WHERE code = 'G10_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G10_008'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G10_008'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G10_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Intermediate'
FROM courses
WHERE code = 'G10_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Entrepreneurship', 'Intermediate'
FROM courses
WHERE code = 'G10_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Intermediate'
FROM courses
WHERE code = 'G10_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G10_011'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Intermediate'
FROM courses
WHERE code = 'G10_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Intermediate'
FROM courses
WHERE code = 'G10_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Intermediate'
FROM courses
WHERE code = 'G10_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G10_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Intermediate'
FROM courses
WHERE code = 'G10_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Intermediate'
FROM courses
WHERE code = 'G10_014'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Intermediate'
FROM courses
WHERE code = 'G10_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G10_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Systems Thinking', 'Intermediate'
FROM courses
WHERE code = 'G10_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G10_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G10_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Intermediate'
FROM courses
WHERE code = 'G10_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Intermediate'
FROM courses
WHERE code = 'G10_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G10_019'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Intermediate'
FROM courses
WHERE code = 'G10_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G10_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G10_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G10_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G10_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G10_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Intermediate'
FROM courses
WHERE code = 'G10_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Intermediate'
FROM courses
WHERE code = 'G10_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Intermediate'
FROM courses
WHERE code = 'G10_025'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Intermediate'
FROM courses
WHERE code = 'G10_026'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Intermediate'
FROM courses
WHERE code = 'G10_026'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Intermediate'
FROM courses
WHERE code = 'G10_026'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G10_027'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Intermediate'
FROM courses
WHERE code = 'G10_027'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Intermediate'
FROM courses
WHERE code = 'G10_028'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Intermediate'
FROM courses
WHERE code = 'G10_029'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Intermediate'
FROM courses
WHERE code = 'G10_030'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Intermediate'
FROM courses
WHERE code = 'G10_030'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G11_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G11_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Scientific Method', 'Advanced'
FROM courses
WHERE code = 'G11_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G11_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G11_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G11_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Advanced'
FROM courses
WHERE code = 'G11_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Advanced'
FROM courses
WHERE code = 'G11_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Advanced'
FROM courses
WHERE code = 'G11_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G11_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Advanced'
FROM courses
WHERE code = 'G11_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G11_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Advanced'
FROM courses
WHERE code = 'G11_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Advanced'
FROM courses
WHERE code = 'G11_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Entrepreneurship', 'Advanced'
FROM courses
WHERE code = 'G11_008'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G11_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Advanced'
FROM courses
WHERE code = 'G11_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Ethical Reasoning', 'Advanced'
FROM courses
WHERE code = 'G11_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Advanced'
FROM courses
WHERE code = 'G11_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G11_011'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Advanced'
FROM courses
WHERE code = 'G11_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Advanced'
FROM courses
WHERE code = 'G11_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Advanced'
FROM courses
WHERE code = 'G11_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Advanced'
FROM courses
WHERE code = 'G11_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Advanced'
FROM courses
WHERE code = 'G11_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Advanced'
FROM courses
WHERE code = 'G11_014'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G11_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Creativity', 'Advanced'
FROM courses
WHERE code = 'G11_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G11_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G11_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Advanced'
FROM courses
WHERE code = 'G11_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G11_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Advanced'
FROM courses
WHERE code = 'G11_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G11_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Advanced'
FROM courses
WHERE code = 'G11_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Advanced'
FROM courses
WHERE code = 'G11_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Advanced'
FROM courses
WHERE code = 'G11_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G11_019'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Advanced'
FROM courses
WHERE code = 'G11_019'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Advanced'
FROM courses
WHERE code = 'G11_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G11_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Advanced'
FROM courses
WHERE code = 'G11_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Advanced'
FROM courses
WHERE code = 'G11_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G11_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Advanced'
FROM courses
WHERE code = 'G11_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Health & Wellness', 'Advanced'
FROM courses
WHERE code = 'G11_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G11_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Advanced'
FROM courses
WHERE code = 'G11_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G11_025'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Advanced'
FROM courses
WHERE code = 'G11_025'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Advanced'
FROM courses
WHERE code = 'G11_025'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Advanced'
FROM courses
WHERE code = 'G11_026'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Advanced'
FROM courses
WHERE code = 'G11_027'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Advanced'
FROM courses
WHERE code = 'G11_027'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Advanced'
FROM courses
WHERE code = 'G11_027'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Advanced'
FROM courses
WHERE code = 'G11_028'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G11_029'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G11_029'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G11_030'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G11_030'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Advanced'
FROM courses
WHERE code = 'G12_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Advanced'
FROM courses
WHERE code = 'G12_001'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G12_002'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Advanced'
FROM courses
WHERE code = 'G12_003'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G12_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Advanced'
FROM courses
WHERE code = 'G12_004'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Advanced'
FROM courses
WHERE code = 'G12_005'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G12_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G12_006'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Advanced'
FROM courses
WHERE code = 'G12_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Advanced'
FROM courses
WHERE code = 'G12_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Advanced'
FROM courses
WHERE code = 'G12_007'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Advanced'
FROM courses
WHERE code = 'G12_008'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G12_009'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Advanced'
FROM courses
WHERE code = 'G12_010'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Advanced'
FROM courses
WHERE code = 'G12_011'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G12_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G12_012'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G12_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Advanced'
FROM courses
WHERE code = 'G12_013'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Advanced'
FROM courses
WHERE code = 'G12_014'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Advanced'
FROM courses
WHERE code = 'G12_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Research Skills', 'Advanced'
FROM courses
WHERE code = 'G12_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Advanced'
FROM courses
WHERE code = 'G12_015'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G12_016'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Advanced'
FROM courses
WHERE code = 'G12_017'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G12_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Advanced'
FROM courses
WHERE code = 'G12_018'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Project Management', 'Advanced'
FROM courses
WHERE code = 'G12_019'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G12_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Creativity', 'Advanced'
FROM courses
WHERE code = 'G12_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G12_020'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Collaboration', 'Advanced'
FROM courses
WHERE code = 'G12_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Leadership', 'Advanced'
FROM courses
WHERE code = 'G12_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Public Speaking', 'Advanced'
FROM courses
WHERE code = 'G12_021'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G12_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G12_022'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G12_023'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G12_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G12_024'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Advanced'
FROM courses
WHERE code = 'G12_025'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Critical Thinking', 'Advanced'
FROM courses
WHERE code = 'G12_026'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Creativity', 'Advanced'
FROM courses
WHERE code = 'G12_026'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G12_026'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Decision Making', 'Advanced'
FROM courses
WHERE code = 'G12_027'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Financial Literacy', 'Advanced'
FROM courses
WHERE code = 'G12_027'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Emotional Intelligence', 'Advanced'
FROM courses
WHERE code = 'G12_028'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Digital Literacy', 'Advanced'
FROM courses
WHERE code = 'G12_029'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Data Analysis', 'Advanced'
FROM courses
WHERE code = 'G12_029'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

INSERT INTO course_skills (course_id, skill_name, proficiency_level)
SELECT course_id, 'Communication', 'Advanced'
FROM courses
WHERE code = 'G12_030'
ON CONFLICT (course_id, skill_name) DO UPDATE SET
  proficiency_level = EXCLUDED.proficiency_level;

