-- Add Food Safety and Quality Management job opportunities to the database
-- Run this in your Supabase SQL Editor

INSERT INTO opportunities 
(job_title, company_name, department, employment_type, location, mode, stipend_or_salary, experience_level, skills_required, requirements, description, deadline, is_active, status)
VALUES 
-- Food Safety Quality Analyst
(
  'Food Safety Quality Analyst',
  'Nestlé India',
  'Food Science & Quality',
  'full-time',
  'Coimbatore, Tamil Nadu',
  'onsite',
  '₹4.5-6.0 LPA',
  'Entry Level (0-2 years)',
  '["HACCP", "Food Safety", "Quality Management", "Sampling", "Inspection", "FSSAI"]'::jsonb,
  '["B.Sc/M.Sc in Food Science, Microbiology, Botany, or related field", "Knowledge of HACCP and food safety standards", "Understanding of quality inspection techniques", "Good analytical and documentation skills"]'::jsonb,
  'We are looking for a Food Safety Quality Analyst to ensure compliance with food safety standards and conduct quality inspections in our manufacturing facility.',
  '2025-12-31 23:59:00+05:30',
  true,
  'published'
),

-- Quality Control Inspector
(
  'Quality Control Inspector',
  'ITC Limited',
  'Quality Assurance',
  'full-time',
  'Chennai, Tamil Nadu',
  'onsite',
  '₹3.6-5.0 LPA',
  'Entry Level (0-2 years)',
  '["Sampling and Inspection Techniques", "Quality Control", "ISO Standards", "Good Manufacturing Practices"]'::jsonb,
  '["B.Sc in Food Technology, Botany, Chemistry or related field", "Knowledge of sampling and inspection methods", "Understanding of GMP and ISO standards", "Detail-oriented with good documentation skills"]'::jsonb,
  'Join our Quality Assurance team to perform regular quality inspections, sampling, and ensure compliance with quality standards in food manufacturing.',
  '2025-12-15 23:59:00+05:30',
  true,
  'published'
),

-- FSQM Trainee
(
  'Food Safety & Quality Management Trainee',
  'Britannia Industries',
  'Food Safety',
  'internship',
  'Bangalore, Karnataka',
  'onsite',
  '₹15,000-20,000/month',
  'Fresher',
  '["Food Safety", "Quality Management", "HACCP", "Microbiology", "Laboratory Skills"]'::jsonb,
  '["Pursuing or completed B.Sc/M.Sc in Food Science, Microbiology, Botany, Chemistry", "Completed FSQM certification course", "Knowledge of food safety principles", "Willingness to learn and work in food manufacturing environment"]'::jsonb,
  'Internship opportunity for FSQM certified students to gain hands-on experience in food safety protocols, quality testing, and manufacturing processes.',
  '2025-11-30 23:59:00+05:30',
  true,
  'published'
),

-- Quality Assurance Officer
(
  'Quality Assurance Officer',
  'Parle Products',
  'Quality Assurance',
  'full-time',
  'Mumbai, Maharashtra',
  'onsite',
  '₹4.0-5.5 LPA',
  'Entry Level (0-2 years)',
  '["Quality Assurance", "FSSAI Compliance", "Inspection", "Documentation", "Food Safety Standards"]'::jsonb,
  '["B.Sc/M.Sc in Food Science, Food Technology, or related field", "Understanding of FSSAI regulations", "Knowledge of quality assurance processes", "Strong analytical and problem-solving skills"]'::jsonb,
  'Ensure product quality and safety standards are maintained throughout the manufacturing process. Conduct inspections and maintain compliance documentation.',
  '2025-12-20 23:59:00+05:30',
  true,
  'published'
),

-- Food Microbiologist
(
  'Food Microbiologist',
  'Amul (GCMMF)',
  'Research & Quality',
  'full-time',
  'Anand, Gujarat',
  'onsite',
  '₹5.0-7.0 LPA',
  'Entry Level (1-3 years)',
  '["Microbiology", "Food Safety Testing", "Laboratory Analysis", "Quality Control", "Aseptic Techniques"]'::jsonb,
  '["M.Sc in Microbiology, Food Science, Botany or related field", "Experience with microbiological testing", "Knowledge of food safety and hygiene standards", "Laboratory skills and analytical thinking"]'::jsonb,
  'Conduct microbiological analysis of food products, ensure safety standards, and support research in dairy product quality and safety.',
  '2025-11-25 23:59:00+05:30',
  true,
  'published'
),

-- Lab Technician - Food Testing
(
  'Laboratory Technician - Food Testing',
  'SGS India',
  'Laboratory Services',
  'full-time',
  'Pune, Maharashtra',
  'onsite',
  '₹3.0-4.5 LPA',
  'Fresher to 2 years',
  '["Laboratory Skills", "Sampling Techniques", "Chemical Analysis", "Food Testing", "Quality Control"]'::jsonb,
  '["B.Sc in Chemistry, Botany, Food Science or related field", "Laboratory experience preferred", "Knowledge of sampling and testing procedures", "Attention to detail and accuracy"]'::jsonb,
  'Perform chemical and physical testing of food samples, maintain lab equipment, and ensure accurate documentation of test results.',
  '2025-12-10 23:59:00+05:30',
  true,
  'published'
),

-- Agriculture Quality Supervisor
(
  'Agriculture Quality Supervisor',
  'Jain Irrigation Systems',
  'Agriculture & Quality',
  'full-time',
  'Jalgaon, Maharashtra',
  'onsite',
  '₹4.5-6.0 LPA',
  'Entry Level (1-3 years)',
  '["Agriculture", "Quality Inspection", "Crop Management", "Documentation", "Field Inspection"]'::jsonb,
  '["B.Sc in Agriculture, Botany, or related field", "Understanding of crop quality standards", "Field inspection experience preferred", "Good communication and leadership skills"]'::jsonb,
  'Supervise quality control in agricultural production, conduct field inspections, and ensure compliance with quality standards for crops and produce.',
  '2025-12-05 23:59:00+05:30',
  true,
  'published'
),

-- Food Processing Trainee
(
  'Food Processing Quality Trainee',
  'Mother Dairy',
  'Food Processing',
  'internship',
  'Delhi NCR',
  'onsite',
  '₹12,000-18,000/month',
  'Fresher',
  '["Food Processing", "Quality Management", "Hygiene Standards", "Documentation"]'::jsonb,
  '["B.Sc/M.Sc in Food Science, Food Technology, Botany, Chemistry", "Interest in food processing industry", "Knowledge of hygiene and safety practices", "Team player with eagerness to learn"]'::jsonb,
  'Trainee position to learn food processing operations, quality control procedures, and hygiene management in dairy manufacturing.',
  '2025-11-15 23:59:00+05:30',
  true,
  'published'
);

-- Verify insertion
SELECT 
  id, 
  job_title, 
  company_name, 
  department, 
  skills_required,
  employment_type,
  location
FROM opportunities 
WHERE department IN ('Food Science & Quality', 'Quality Assurance', 'Food Safety', 'Laboratory Services', 'Agriculture & Quality', 'Food Processing', 'Research & Quality')
ORDER BY id DESC;
