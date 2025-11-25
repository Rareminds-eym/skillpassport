DO $$ 
DECLARE 
    recruiter_id uuid := '<YOUR_RECRUITER_ID>'; -- Replace with actual recruiter UUID!
    
    -- Full-Stack Developer candidates
    sarah_user_id uuid := gen_random_uuid();
    michael_user_id uuid := gen_random_uuid();
    
    -- UX Designer candidates
    emma_user_id uuid := gen_random_uuid();
    david_user_id uuid := gen_random_uuid();
    
    -- Data Scientist candidates
    priya_user_id uuid := gen_random_uuid();
    james_user_id uuid := gen_random_uuid();
    
    -- Marketing Manager candidates
    sophia_user_id uuid := gen_random_uuid();
    ryan_user_id uuid := gen_random_uuid();
    
    -- DevOps Engineer candidates
    lucas_user_id uuid := gen_random_uuid();
    olivia_user_id uuid := gen_random_uuid();
    
BEGIN
    RAISE NOTICE '🧹 Cleaning up existing test data...';
    
    -- Delete in correct order (child tables first)
    DELETE FROM applied_jobs WHERE student_id IN (
        SELECT user_id FROM students WHERE email IN (
            'sarah.johnson@example.com', 'michael.chen@example.com',
            'emma.wilson@example.com', 'david.lee@example.com',
            'priya.sharma@example.com', 'james.rodriguez@example.com',
            'sophia.martinez@example.com', 'ryan.oconnor@example.com',
            'lucas.brown@example.com', 'olivia.taylor@example.com'
        )
    );
    
    DELETE FROM certificates WHERE student_id IN (
        SELECT user_id FROM students WHERE email IN (
            'sarah.johnson@example.com', 'michael.chen@example.com',
            'emma.wilson@example.com', 'david.lee@example.com',
            'priya.sharma@example.com', 'james.rodriguez@example.com',
            'sophia.martinez@example.com', 'ryan.oconnor@example.com',
            'lucas.brown@example.com', 'olivia.taylor@example.com'
        )
    );
    
    DELETE FROM trainings WHERE student_id IN (
        SELECT user_id FROM students WHERE email IN (
            'sarah.johnson@example.com', 'michael.chen@example.com',
            'emma.wilson@example.com', 'david.lee@example.com',
            'priya.sharma@example.com', 'james.rodriguez@example.com',
            'sophia.martinez@example.com', 'ryan.oconnor@example.com',
            'lucas.brown@example.com', 'olivia.taylor@example.com'
        )
    );
    
    DELETE FROM skills WHERE student_id IN (
        SELECT user_id FROM students WHERE email IN (
            'sarah.johnson@example.com', 'michael.chen@example.com',
            'emma.wilson@example.com', 'david.lee@example.com',
            'priya.sharma@example.com', 'james.rodriguez@example.com',
            'sophia.martinez@example.com', 'ryan.oconnor@example.com',
            'lucas.brown@example.com', 'olivia.taylor@example.com'
        )
    );
    
    DELETE FROM students WHERE email IN (
        'sarah.johnson@example.com', 'michael.chen@example.com',
        'emma.wilson@example.com', 'david.lee@example.com',
        'priya.sharma@example.com', 'james.rodriguez@example.com',
        'sophia.martinez@example.com', 'ryan.oconnor@example.com',
        'lucas.brown@example.com', 'olivia.taylor@example.com'
    );
    
    DELETE FROM users WHERE email IN (
        'sarah.johnson@example.com', 'michael.chen@example.com',
        'emma.wilson@example.com', 'david.lee@example.com',
        'priya.sharma@example.com', 'james.rodriguez@example.com',
        'sophia.martinez@example.com', 'ryan.oconnor@example.com',
        'lucas.brown@example.com', 'olivia.taylor@example.com'
    );
    
    RAISE NOTICE '✅ Cleanup complete';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Creating fresh test data...';
    RAISE NOTICE '';
    
    -- =============================================
    -- ROLE 1: FULL-STACK DEVELOPER
    -- =============================================
    
    INSERT INTO users (id, email, role, "firstName", "lastName", "isActive")
    VALUES (sarah_user_id, 'sarah.johnson@example.com', 'student', 'Sarah', 'Johnson', true);
    
    INSERT INTO students (id, user_id, email, name, university, branch_field, "currentCgpa", "expectedGraduationDate", "contactNumber", city, state, country, approval_status)
    VALUES (gen_random_uuid(), sarah_user_id, 'sarah.johnson@example.com', 'Sarah Johnson', 'Stanford University', 'Computer Science', 8.70, '2024-05-15', '+1-555-0101', 'San Francisco', 'California', 'United States', 'approved');
    
    INSERT INTO skills (id, student_id, name, level, type, enabled, approval_status) VALUES
    (gen_random_uuid(), sarah_user_id, 'JavaScript', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), sarah_user_id, 'React', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), sarah_user_id, 'TypeScript', 3, 'technical', true, 'approved'),
    (gen_random_uuid(), sarah_user_id, 'Node.js', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), sarah_user_id, 'MongoDB', 3, 'technical', true, 'approved'),
    (gen_random_uuid(), sarah_user_id, 'Git', 4, 'technical', true, 'approved');
    
    INSERT INTO trainings (id, student_id, title, organization, start_date, end_date, approval_status) VALUES
    (gen_random_uuid(), sarah_user_id, 'Full-Stack Web Development Bootcamp', 'Udemy', '2023-01-01', '2023-06-30', 'approved'),
    (gen_random_uuid(), sarah_user_id, 'Advanced React Patterns', 'Frontend Masters', '2023-07-01', '2023-09-30', 'approved'),
    (gen_random_uuid(), sarah_user_id, 'Node.js Microservices', 'LinkedIn Learning', '2023-10-01', '2023-12-31', 'approved');
    
    INSERT INTO certificates (id, student_id, title, issuer, issued_on, enabled, approval_status) VALUES
    (gen_random_uuid(), sarah_user_id, 'Meta Front-End Developer Professional Certificate', 'Meta', '2023-08-15', true, 'approved'),
    (gen_random_uuid(), sarah_user_id, 'Node.js Certified Developer', 'OpenJS Foundation', '2023-11-20', true, 'approved');
    
    INSERT INTO users (id, email, role, "firstName", "lastName", "isActive")
    VALUES (michael_user_id, 'michael.chen@example.com', 'student', 'Michael', 'Chen', true);
    
    INSERT INTO students (id, user_id, email, name, university, branch_field, "currentCgpa", "expectedGraduationDate", "contactNumber", city, state, country, approval_status)
    VALUES (gen_random_uuid(), michael_user_id, 'michael.chen@example.com', 'Michael Chen', 'University of Michigan', 'Information Technology', 7.80, '2024-06-30', '+1-555-0102', 'Ann Arbor', 'Michigan', 'United States', 'approved');
    
    INSERT INTO skills (id, student_id, name, level, type, enabled, approval_status) VALUES
    (gen_random_uuid(), michael_user_id, 'JavaScript', 3, 'technical', true, 'approved'),
    (gen_random_uuid(), michael_user_id, 'React', 3, 'technical', true, 'approved'),
    (gen_random_uuid(), michael_user_id, 'HTML', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), michael_user_id, 'CSS', 4, 'technical', true, 'approved');
    
    INSERT INTO trainings (id, student_id, title, organization, start_date, end_date, approval_status) VALUES
    (gen_random_uuid(), michael_user_id, 'Web Development Fundamentals', 'Coursera', '2023-01-01', '2023-04-30', 'approved'),
    (gen_random_uuid(), michael_user_id, 'JavaScript Bootcamp', 'Udacity', '2023-05-01', '2023-08-31', 'approved');
    
    INSERT INTO certificates (id, student_id, title, issuer, issued_on, enabled, approval_status) VALUES
    (gen_random_uuid(), michael_user_id, 'Certified Scrum Master', 'Scrum Alliance', '2024-02-15', true, 'approved');
    
    INSERT INTO opportunities (job_title, title, company_name, location, employment_type, experience_level, department, skills_required, description, is_active, status, recruiter_id)
    VALUES ('Full-Stack Developer', 'Full-Stack Developer - React & Node.js', 'TechCorp Solutions', 'San Francisco, CA', 'Full-time', 'Mid-level', 'Engineering', 
    '["JavaScript", "React", "TypeScript", "Node.js", "MongoDB", "Git"]'::jsonb,
    'We are seeking a talented Full-Stack Developer to join our growing team.', true, 'published', recruiter_id);
    
    INSERT INTO applied_jobs (student_id, opportunity_id, application_status) VALUES
    (sarah_user_id, currval('opportunities_id_seq'), 'applied'),
    (michael_user_id, currval('opportunities_id_seq'), 'applied');
    
    RAISE NOTICE '✅ Full-Stack Developer role created';
    
    -- =============================================
    -- ROLE 2: UX DESIGNER
    -- =============================================
    
    INSERT INTO users (id, email, role, "firstName", "lastName", "isActive")
    VALUES (emma_user_id, 'emma.wilson@example.com', 'student', 'Emma', 'Wilson', true);
    
    INSERT INTO students (id, user_id, email, name, university, branch_field, "currentCgpa", "expectedGraduationDate", "contactNumber", city, state, country, approval_status)
    VALUES (gen_random_uuid(), emma_user_id, 'emma.wilson@example.com', 'Emma Wilson', 'Rhode Island School of Design', 'Design', 8.50, '2024-05-20', '+1-555-0201', 'Providence', 'Rhode Island', 'United States', 'approved');
    
    INSERT INTO skills (id, student_id, name, level, type, enabled, approval_status) VALUES
    (gen_random_uuid(), emma_user_id, 'Figma', 5, 'technical', true, 'approved'),
    (gen_random_uuid(), emma_user_id, 'Adobe XD', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), emma_user_id, 'User Research', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), emma_user_id, 'Wireframing', 5, 'technical', true, 'approved'),
    (gen_random_uuid(), emma_user_id, 'Prototyping', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), emma_user_id, 'UI Design', 5, 'technical', true, 'approved');
    
    INSERT INTO trainings (id, student_id, title, organization, start_date, end_date, approval_status) VALUES
    (gen_random_uuid(), emma_user_id, 'UX Design Professional Certificate', 'Google', '2023-01-01', '2023-06-30', 'approved'),
    (gen_random_uuid(), emma_user_id, 'Advanced Figma Masterclass', 'Udemy', '2023-07-01', '2023-09-30', 'approved'),
    (gen_random_uuid(), emma_user_id, 'Design Thinking Workshop', 'IDEO', '2023-10-01', '2023-10-15', 'approved');
    
    INSERT INTO certificates (id, student_id, title, issuer, issued_on, enabled, approval_status) VALUES
    (gen_random_uuid(), emma_user_id, 'Google UX Design Professional Certificate', 'Google', '2023-07-10', true, 'approved'),
    (gen_random_uuid(), emma_user_id, 'Adobe Certified Professional in UX Design', 'Adobe', '2023-09-15', true, 'approved');
    
    INSERT INTO users (id, email, role, "firstName", "lastName", "isActive")
    VALUES (david_user_id, 'david.lee@example.com', 'student', 'David', 'Lee', true);
    
    INSERT INTO students (id, user_id, email, name, university, branch_field, "currentCgpa", "expectedGraduationDate", "contactNumber", city, state, country, approval_status)
    VALUES (gen_random_uuid(), david_user_id, 'david.lee@example.com', 'David Lee', 'Boston University', 'Graphic Design', 7.30, '2024-07-15', '+1-555-0202', 'Boston', 'Massachusetts', 'United States', 'approved');
    
    INSERT INTO skills (id, student_id, name, level, type, enabled, approval_status) VALUES
    (gen_random_uuid(), david_user_id, 'Figma', 3, 'technical', true, 'approved'),
    (gen_random_uuid(), david_user_id, 'Photoshop', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), david_user_id, 'Illustrator', 4, 'technical', true, 'approved');
    
    INSERT INTO trainings (id, student_id, title, organization, start_date, end_date, approval_status) VALUES
    (gen_random_uuid(), david_user_id, 'UI and UX Design Basics', 'Coursera', '2023-05-01', '2023-08-31', 'approved');
    
    INSERT INTO opportunities (job_title, title, company_name, location, employment_type, experience_level, department, skills_required, description, is_active, status, recruiter_id)
    VALUES ('UX Designer', 'UX Designer - Product Team', 'DesignHub Inc', 'New York, NY', 'Full-time', 'Junior', 'Design', 
    '["Figma", "Adobe XD", "User Research", "Wireframing", "Prototyping", "UI Design"]'::jsonb,
    'Looking for a creative UX Designer to craft exceptional user experiences.', true, 'published', recruiter_id);
    
    INSERT INTO applied_jobs (student_id, opportunity_id, application_status) VALUES
    (emma_user_id, currval('opportunities_id_seq'), 'applied'),
    (david_user_id, currval('opportunities_id_seq'), 'applied');
    
    RAISE NOTICE '✅ UX Designer role created';
    
    -- =============================================
    -- ROLE 3: DATA SCIENTIST
    -- =============================================
    
    INSERT INTO users (id, email, role, "firstName", "lastName", "isActive")
    VALUES (priya_user_id, 'priya.sharma@example.com', 'student', 'Priya', 'Sharma', true);
    
    INSERT INTO students (id, user_id, email, name, university, branch_field, "currentCgpa", "expectedGraduationDate", "contactNumber", city, state, country, approval_status)
    VALUES (gen_random_uuid(), priya_user_id, 'priya.sharma@example.com', 'Priya Sharma', 'MIT', 'Data Science', 9.10, '2024-05-30', '+1-555-0301', 'Cambridge', 'Massachusetts', 'United States', 'approved');
    
    INSERT INTO skills (id, student_id, name, level, type, enabled, approval_status) VALUES
    (gen_random_uuid(), priya_user_id, 'Python', 5, 'technical', true, 'approved'),
    (gen_random_uuid(), priya_user_id, 'Machine Learning', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), priya_user_id, 'TensorFlow', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), priya_user_id, 'SQL', 5, 'technical', true, 'approved'),
    (gen_random_uuid(), priya_user_id, 'Data Visualization', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), priya_user_id, 'Statistical Analysis', 5, 'technical', true, 'approved');
    
    INSERT INTO trainings (id, student_id, title, organization, start_date, end_date, approval_status) VALUES
    (gen_random_uuid(), priya_user_id, 'Deep Learning Specialization', 'DeepLearning.AI', '2023-01-01', '2023-04-30', 'approved'),
    (gen_random_uuid(), priya_user_id, 'Advanced ML with TensorFlow', 'Coursera', '2023-05-01', '2023-08-31', 'approved'),
    (gen_random_uuid(), priya_user_id, 'Data Science Bootcamp', 'DataCamp', '2023-09-01', '2023-12-31', 'approved');
    
    INSERT INTO certificates (id, student_id, title, issuer, issued_on, enabled, approval_status) VALUES
    (gen_random_uuid(), priya_user_id, 'TensorFlow Developer Certificate', 'Google', '2023-09-20', true, 'approved'),
    (gen_random_uuid(), priya_user_id, 'Machine Learning Specialization', 'Stanford', '2023-05-15', true, 'approved');
    
    INSERT INTO users (id, email, role, "firstName", "lastName", "isActive")
    VALUES (james_user_id, 'james.rodriguez@example.com', 'student', 'James', 'Rodriguez', true);
    
    INSERT INTO students (id, user_id, email, name, university, branch_field, "currentCgpa", "expectedGraduationDate", "contactNumber", city, state, country, approval_status)
    VALUES (gen_random_uuid(), james_user_id, 'james.rodriguez@example.com', 'James Rodriguez', 'UC Berkeley', 'Statistics', 8.00, '2024-06-15', '+1-555-0302', 'Berkeley', 'California', 'United States', 'approved');
    
    INSERT INTO skills (id, student_id, name, level, type, enabled, approval_status) VALUES
    (gen_random_uuid(), james_user_id, 'Python', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), james_user_id, 'R', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), james_user_id, 'SQL', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), james_user_id, 'Statistical Analysis', 4, 'technical', true, 'approved');
    
    INSERT INTO trainings (id, student_id, title, organization, start_date, end_date, approval_status) VALUES
    (gen_random_uuid(), james_user_id, 'Data Analysis with Python', 'IBM', '2023-03-01', '2023-07-31', 'approved'),
    (gen_random_uuid(), james_user_id, 'Statistics Fundamentals', 'Coursera', '2023-08-01', '2023-11-30', 'approved');
    
    INSERT INTO opportunities (job_title, title, company_name, location, employment_type, experience_level, department, skills_required, description, is_active, status, recruiter_id)
    VALUES ('Data Scientist', 'Data Scientist - AI and ML Team', 'DataWorks Analytics', 'Seattle, WA', 'Full-time', 'Mid-level', 'Data Science', 
    '["Python", "Machine Learning", "TensorFlow", "SQL", "Data Visualization", "Statistical Analysis"]'::jsonb,
    'Join our AI team to build cutting-edge machine learning models.', true, 'published', recruiter_id);
    
    INSERT INTO applied_jobs (student_id, opportunity_id, application_status) VALUES
    (priya_user_id, currval('opportunities_id_seq'), 'applied'),
    (james_user_id, currval('opportunities_id_seq'), 'applied');
    
    RAISE NOTICE '✅ Data Scientist role created';
    
    -- =============================================
    -- ROLE 4: MARKETING MANAGER
    -- =============================================
    
    INSERT INTO users (id, email, role, "firstName", "lastName", "isActive")
    VALUES (sophia_user_id, 'sophia.martinez@example.com', 'student', 'Sophia', 'Martinez', true);
    
    INSERT INTO students (id, user_id, email, name, university, branch_field, "currentCgpa", "expectedGraduationDate", "contactNumber", city, state, country, approval_status)
    VALUES (gen_random_uuid(), sophia_user_id, 'sophia.martinez@example.com', 'Sophia Martinez', 'Northwestern University', 'Marketing', 8.30, '2024-05-25', '+1-555-0401', 'Chicago', 'Illinois', 'United States', 'approved');
    
    INSERT INTO skills (id, student_id, name, level, type, enabled, approval_status) VALUES
    (gen_random_uuid(), sophia_user_id, 'Digital Marketing', 5, 'technical', true, 'approved'),
    (gen_random_uuid(), sophia_user_id, 'SEO', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), sophia_user_id, 'Content Strategy', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), sophia_user_id, 'Google Analytics', 5, 'technical', true, 'approved'),
    (gen_random_uuid(), sophia_user_id, 'Social Media Marketing', 5, 'technical', true, 'approved'),
    (gen_random_uuid(), sophia_user_id, 'Email Marketing', 4, 'technical', true, 'approved');
    
    INSERT INTO trainings (id, student_id, title, organization, start_date, end_date, approval_status) VALUES
    (gen_random_uuid(), sophia_user_id, 'Digital Marketing Specialization', 'University of Illinois', '2023-01-01', '2023-06-30', 'approved'),
    (gen_random_uuid(), sophia_user_id, 'Advanced Google Analytics', 'Google', '2023-07-01', '2023-09-30', 'approved'),
    (gen_random_uuid(), sophia_user_id, 'Content Marketing Masterclass', 'HubSpot', '2023-10-01', '2023-12-31', 'approved');
    
    INSERT INTO certificates (id, student_id, title, issuer, issued_on, enabled, approval_status) VALUES
    (gen_random_uuid(), sophia_user_id, 'Google Analytics Individual Qualification', 'Google', '2023-10-05', true, 'approved'),
    (gen_random_uuid(), sophia_user_id, 'HubSpot Content Marketing Certification', 'HubSpot', '2023-12-20', true, 'approved');
    
    INSERT INTO users (id, email, role, "firstName", "lastName", "isActive")
    VALUES (ryan_user_id, 'ryan.oconnor@example.com', 'student', 'Ryan', 'OConnor', true);
    
    INSERT INTO students (id, user_id, email, name, university, branch_field, "currentCgpa", "expectedGraduationDate", "contactNumber", city, state, country, approval_status)
    VALUES (gen_random_uuid(), ryan_user_id, 'ryan.oconnor@example.com', 'Ryan OConnor', 'University of Texas', 'Business Administration', 7.50, '2024-07-10', '+1-555-0402', 'Austin', 'Texas', 'United States', 'approved');
    
    INSERT INTO skills (id, student_id, name, level, type, enabled, approval_status) VALUES
    (gen_random_uuid(), ryan_user_id, 'Digital Marketing', 3, 'technical', true, 'approved'),
    (gen_random_uuid(), ryan_user_id, 'Social Media Marketing', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), ryan_user_id, 'Communication', 4, 'soft', true, 'approved');
    
    INSERT INTO trainings (id, student_id, title, organization, start_date, end_date, approval_status) VALUES
    (gen_random_uuid(), ryan_user_id, 'Marketing Fundamentals', 'Coursera', '2023-06-01', '2023-09-30', 'approved');
    
    INSERT INTO opportunities (job_title, title, company_name, location, employment_type, experience_level, department, skills_required, description, is_active, status, recruiter_id)
    VALUES ('Marketing Manager', 'Marketing Manager - Growth Team', 'GrowthLabs Inc', 'Austin, TX', 'Full-time', 'Mid-level', 'Marketing', 
    '["Digital Marketing", "SEO", "Content Strategy", "Google Analytics", "Social Media Marketing", "Email Marketing"]'::jsonb,
    'Lead our marketing efforts to drive user acquisition and engagement.', true, 'published', recruiter_id);
    
    INSERT INTO applied_jobs (student_id, opportunity_id, application_status) VALUES
    (sophia_user_id, currval('opportunities_id_seq'), 'applied'),
    (ryan_user_id, currval('opportunities_id_seq'), 'applied');
    
    RAISE NOTICE '✅ Marketing Manager role created';
    
    -- =============================================
    -- ROLE 5: DEVOPS ENGINEER
    -- =============================================
    
    INSERT INTO users (id, email, role, "firstName", "lastName", "isActive")
    VALUES (lucas_user_id, 'lucas.brown@example.com', 'student', 'Lucas', 'Brown', true);
    
    INSERT INTO students (id, user_id, email, name, university, branch_field, "currentCgpa", "expectedGraduationDate", "contactNumber", city, state, country, approval_status)
    VALUES (gen_random_uuid(), lucas_user_id, 'lucas.brown@example.com', 'Lucas Brown', 'Georgia Tech', 'Computer Engineering', 8.60, '2024-05-18', '+1-555-0501', 'Atlanta', 'Georgia', 'United States', 'approved');
    
    INSERT INTO skills (id, student_id, name, level, type, enabled, approval_status) VALUES
    (gen_random_uuid(), lucas_user_id, 'Docker', 5, 'technical', true, 'approved'),
    (gen_random_uuid(), lucas_user_id, 'Kubernetes', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), lucas_user_id, 'AWS', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), lucas_user_id, 'CI/CD', 5, 'technical', true, 'approved'),
    (gen_random_uuid(), lucas_user_id, 'Terraform', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), lucas_user_id, 'Linux', 5, 'technical', true, 'approved');
    
    INSERT INTO trainings (id, student_id, title, organization, start_date, end_date, approval_status) VALUES
    (gen_random_uuid(), lucas_user_id, 'DevOps Engineer Bootcamp', 'Udemy', '2023-01-01', '2023-05-31', 'approved'),
    (gen_random_uuid(), lucas_user_id, 'Kubernetes Administrator Course', 'Linux Foundation', '2023-06-01', '2023-09-30', 'approved'),
    (gen_random_uuid(), lucas_user_id, 'AWS Solutions Architect Training', 'AWS', '2023-10-01', '2023-12-31', 'approved');
    
    INSERT INTO certificates (id, student_id, title, issuer, issued_on, enabled, approval_status) VALUES
    (gen_random_uuid(), lucas_user_id, 'AWS Certified Solutions Architect', 'AWS', '2024-01-10', true, 'approved'),
    (gen_random_uuid(), lucas_user_id, 'Certified Kubernetes Administrator', 'Linux Foundation', '2023-10-25', true, 'approved');
    
    INSERT INTO users (id, email, role, "firstName", "lastName", "isActive")
    VALUES (olivia_user_id, 'olivia.taylor@example.com', 'student', 'Olivia', 'Taylor', true);
    
    INSERT INTO students (id, user_id, email, name, university, branch_field, "currentCgpa", "expectedGraduationDate", "contactNumber", city, state, country, approval_status)
    VALUES (gen_random_uuid(), olivia_user_id, 'olivia.taylor@example.com', 'Olivia Taylor', 'Penn State', 'Information Systems', 7.70, '2024-06-20', '+1-555-0502', 'State College', 'Pennsylvania', 'United States', 'approved');
    
    INSERT INTO skills (id, student_id, name, level, type, enabled, approval_status) VALUES
    (gen_random_uuid(), olivia_user_id, 'Docker', 3, 'technical', true, 'approved'),
    (gen_random_uuid(), olivia_user_id, 'AWS', 3, 'technical', true, 'approved'),
    (gen_random_uuid(), olivia_user_id, 'Linux', 4, 'technical', true, 'approved'),
    (gen_random_uuid(), olivia_user_id, 'Git', 4, 'technical', true, 'approved');
    
    INSERT INTO trainings (id, student_id, title, organization, start_date, end_date, approval_status) VALUES
    (gen_random_uuid(), olivia_user_id, 'Introduction to DevOps', 'Coursera', '2023-05-01', '2023-08-31', 'approved'),
    (gen_random_uuid(), olivia_user_id, 'Docker Fundamentals', 'Udemy', '2023-09-01', '2023-11-30', 'approved');
    
    INSERT INTO opportunities (job_title, title, company_name, location, employment_type, experience_level, department, skills_required, description, is_active, status, recruiter_id)
    VALUES ('DevOps Engineer', 'DevOps Engineer - Cloud Infrastructure', 'CloudScale Systems', 'Seattle, WA', 'Full-time', 'Mid-level', 'Engineering', 
    '["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux"]'::jsonb,
    'Build and maintain cloud infrastructure for our high-scale applications.', true, 'published', recruiter_id);
    
    INSERT INTO applied_jobs (student_id, opportunity_id, application_status) VALUES
    (lucas_user_id, currval('opportunities_id_seq'), 'applied'),
    (olivia_user_id, currval('opportunities_id_seq'), 'applied');
    
    RAISE NOTICE '✅ DevOps Engineer role created';
    
    -- =============================================
    -- SUMMARY
    -- =============================================
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉🎉🎉 ALL TEST DATA CREATED SUCCESSFULLY! 🎉🎉🎉';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created: 5 Job Roles | 10 Candidates | 10 Applications';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Roles: Full-Stack Developer, UX Designer, Data Scientist, Marketing Manager, DevOps Engineer';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next: Navigate to /recruitment/requisition/applicants';
    RAISE NOTICE '📈 Then: Click "View AI Recommendations" button';
    RAISE NOTICE '';
    
END $$;

