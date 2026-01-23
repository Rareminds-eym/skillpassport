-- Import College Students from Excel
-- University/College ID: c16a95cf-6ee5-4aa9-8e47-84fbda49611d


-- Student: Aditi Sharma (STU501)
-- Email: aditi.sharma@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: b2c678b3-0eea-4747-95d2-233832689863

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    'b2c678b3-0eea-4747-95d2-233832689863',
    'aditi.sharma@college.edu',
    'Aditi Sharma',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    'b2c678b3-0eea-4747-95d2-233832689863',
    'STU501',
    'Aditi Sharma',
    'aditi.sharma@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BA Psychology',
    'Arts',
    '{"projects": ["Web App", "Research Study"], "internships": ["Startup Intern", "Marketing Intern"], "achievements": ["Sports day medal", "Art competition winner", "Essay competition award"], "skills": ["SPSS", "Documentation"], "timeline": ["Won hackathon", "Joined coding club", "Completed internship"]}'::jsonb
);

-- Student: Rahul Nair (STU502)
-- Email: rahul.nair@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 79b1bd1b-7a1d-4bff-a9b5-d5846c661b6b

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '79b1bd1b-7a1d-4bff-a9b5-d5846c661b6b',
    'rahul.nair@college.edu',
    'Rahul Nair',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '79b1bd1b-7a1d-4bff-a9b5-d5846c661b6b',
    'STU502',
    'Rahul Nair',
    'rahul.nair@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'B.Com',
    'Commerce',
    '{"projects": ["Data Dashboard", "Research Study", "Business Plan"], "internships": ["Startup Intern", "Marketing Intern"], "achievements": ["Math Olympiad rank"], "skills": ["Python", "Team Leadership", "Java"], "timeline": ["Joined coding club", "Presented research paper"]}'::jsonb
);

-- Student: Meera Krishnan (STU503)
-- Email: meera.krishnan@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 5d44750f-328c-4e21-82c4-1320d0fa6098

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '5d44750f-328c-4e21-82c4-1320d0fa6098',
    'meera.krishnan@college.edu',
    'Meera Krishnan',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '5d44750f-328c-4e21-82c4-1320d0fa6098',
    'STU503',
    'Meera Krishnan',
    'meera.krishnan@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'B.Com',
    'Commerce',
    '{"projects": ["Lab Project", "Business Plan"], "internships": ["Startup Intern", "NGO Intern", "Research Intern"], "achievements": ["Sports day medal", "Debate prize", "Essay competition award"], "skills": ["Team Leadership", "Java"], "timeline": ["Completed internship", "Presented research paper"]}'::jsonb
);

-- Student: Vignesh Kumar (STU504)
-- Email: vignesh.kumar@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: a23b7fc5-d021-470b-b134-3eeab9dc3cf8

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    'a23b7fc5-d021-470b-b134-3eeab9dc3cf8',
    'vignesh.kumar@college.edu',
    'Vignesh Kumar',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    'a23b7fc5-d021-470b-b134-3eeab9dc3cf8',
    'STU504',
    'Vignesh Kumar',
    'vignesh.kumar@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BCA',
    'Computers',
    '{"projects": ["Lab Project", "Business Plan"], "internships": ["Research Intern", "Lab Intern", "Startup Intern"], "achievements": ["Essay competition award", "Math Olympiad rank"], "skills": ["Excel", "SPSS", "Java"], "timeline": ["Presented research paper", "Won hackathon"]}'::jsonb
);

-- Student: Ananya Rao (STU505)
-- Email: ananya.rao@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 1ad79b38-88fa-4352-89ac-852f2ebff3a3

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '1ad79b38-88fa-4352-89ac-852f2ebff3a3',
    'ananya.rao@college.edu',
    'Ananya Rao',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '1ad79b38-88fa-4352-89ac-852f2ebff3a3',
    'STU505',
    'Ananya Rao',
    'ananya.rao@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BCA',
    'Computers',
    '{"projects": ["Lab Project", "Research Study"], "internships": ["Startup Intern", "Marketing Intern"], "achievements": ["Sports day medal", "Essay competition award", "Art competition winner"], "skills": ["Java", "Documentation"], "timeline": ["Won hackathon", "Completed internship", "Presented research paper"]}'::jsonb
);

-- Student: Harini S (STU506)
-- Email: harini.s@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 9eeb9a74-5495-4346-83fc-cf25d8490d6e

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '9eeb9a74-5495-4346-83fc-cf25d8490d6e',
    'harini.s@college.edu',
    'Harini S',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '9eeb9a74-5495-4346-83fc-cf25d8490d6e',
    'STU506',
    'Harini S',
    'harini.s@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BA Psychology',
    'Arts',
    '{"projects": ["Data Dashboard", "Web App", "Lab Project"], "internships": ["Startup Intern", "Lab Intern"], "achievements": ["Science quiz winner", "Art competition winner"], "skills": ["SPSS", "Team Leadership", "Documentation"], "timeline": ["Won hackathon", "Presented research paper"]}'::jsonb
);

-- Student: Rohit Menon (STU507)
-- Email: rohit.menon@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 88dd22f0-0776-4941-8766-7979d38ebffe

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '88dd22f0-0776-4941-8766-7979d38ebffe',
    'rohit.menon@college.edu',
    'Rohit Menon',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '88dd22f0-0776-4941-8766-7979d38ebffe',
    'STU507',
    'Rohit Menon',
    'rohit.menon@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'B.Tech CSE',
    'Engineering',
    '{"projects": ["Research Study", "Data Dashboard", "Business Plan"], "internships": ["Lab Intern", "Research Intern", "Startup Intern"], "achievements": ["Science quiz winner", "Math Olympiad rank", "Essay competition award"], "skills": ["Excel", "Python"], "timeline": ["Presented research paper", "Completed internship", "Joined coding club"]}'::jsonb
);

-- Student: Sana Farooq (STU508)
-- Email: sana.farooq@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 7eb19dce-ab56-424d-b8d1-fbf372a14602

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '7eb19dce-ab56-424d-b8d1-fbf372a14602',
    'sana.farooq@college.edu',
    'Sana Farooq',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '7eb19dce-ab56-424d-b8d1-fbf372a14602',
    'STU508',
    'Sana Farooq',
    'sana.farooq@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BA Journalism',
    'Arts',
    '{"projects": ["Business Plan", "Lab Project"], "internships": ["Startup Intern", "Lab Intern"], "achievements": ["Debate prize", "Sports day medal", "Essay competition award"], "skills": ["Java", "SPSS"], "timeline": ["Joined coding club", "Presented research paper"]}'::jsonb
);

-- Student: Arjun Desai (STU509)
-- Email: arjun.desai@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: c84ad412-0162-4096-b5ea-67181b1975ba

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    'c84ad412-0162-4096-b5ea-67181b1975ba',
    'arjun.desai@college.edu',
    'Arjun Desai',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    'c84ad412-0162-4096-b5ea-67181b1975ba',
    'STU509',
    'Arjun Desai',
    'arjun.desai@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BBA',
    'Management',
    '{"projects": ["Web App", "Research Study"], "internships": ["Marketing Intern", "Lab Intern"], "achievements": ["Science quiz winner", "Math Olympiad rank"], "skills": ["SPSS", "Python", "Excel"], "timeline": ["Presented research paper", "Joined coding club"]}'::jsonb
);

-- Student: Priya Joshi (STU510)
-- Email: priya.joshi@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 93e86a4d-4fe8-4903-b68e-8f5a2ded1012

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '93e86a4d-4fe8-4903-b68e-8f5a2ded1012',
    'priya.joshi@college.edu',
    'Priya Joshi',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '93e86a4d-4fe8-4903-b68e-8f5a2ded1012',
    'STU510',
    'Priya Joshi',
    'priya.joshi@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'B.Tech CSE',
    'Engineering',
    '{"projects": ["Web App", "Research Study", "Business Plan"], "internships": ["Research Intern", "NGO Intern", "Marketing Intern"], "achievements": ["Essay competition award"], "skills": ["Team Leadership", "SPSS"], "timeline": ["Joined coding club", "Presented research paper"]}'::jsonb
);

-- Student: Leo Mathew (STU511)
-- Email: leo.mathew@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: d2da03f3-cfa5-493d-b709-6c03617499aa

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    'd2da03f3-cfa5-493d-b709-6c03617499aa',
    'leo.mathew@college.edu',
    'Leo Mathew',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    'd2da03f3-cfa5-493d-b709-6c03617499aa',
    'STU511',
    'Leo Mathew',
    'leo.mathew@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'B.Sc Chemistry',
    'Science',
    '{"projects": ["Web App", "Business Plan"], "internships": ["NGO Intern", "Lab Intern"], "achievements": ["Science quiz winner", "Essay competition award"], "skills": ["SPSS", "Documentation"], "timeline": ["Joined coding club", "Won hackathon", "Presented research paper"]}'::jsonb
);

-- Student: Kavya R (STU512)
-- Email: kavya.r@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 200e7df2-6d31-429f-9af0-e75aa16ac9d7

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '200e7df2-6d31-429f-9af0-e75aa16ac9d7',
    'kavya.r@college.edu',
    'Kavya R',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '200e7df2-6d31-429f-9af0-e75aa16ac9d7',
    'STU512',
    'Kavya R',
    'kavya.r@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BA Journalism',
    'Arts',
    '{"projects": ["Business Plan", "Web App"], "internships": ["Research Intern", "Lab Intern", "Startup Intern"], "achievements": ["Sports day medal", "Math Olympiad rank"], "skills": ["Java", "Excel"], "timeline": ["Joined coding club", "Won hackathon"]}'::jsonb
);

-- Student: Tanvi Gupta (STU513)
-- Email: tanvi.gupta@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 8c9cb581-00eb-4975-b825-7aaf961792c4

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '8c9cb581-00eb-4975-b825-7aaf961792c4',
    'tanvi.gupta@college.edu',
    'Tanvi Gupta',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '8c9cb581-00eb-4975-b825-7aaf961792c4',
    'STU513',
    'Tanvi Gupta',
    'tanvi.gupta@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BCA',
    'Computers',
    '{"projects": ["Research Study", "Business Plan", "Lab Project"], "internships": ["Startup Intern", "Research Intern", "Marketing Intern"], "achievements": ["Math Olympiad rank", "Debate prize", "Science quiz winner"], "skills": ["Java", "Excel"], "timeline": ["Joined coding club", "Presented research paper", "Won hackathon"]}'::jsonb
);

-- Student: Sachin R (STU514)
-- Email: sachin.r@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 9ff6d640-1d40-43c4-b5cc-ca93f28918e0

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '9ff6d640-1d40-43c4-b5cc-ca93f28918e0',
    'sachin.r@college.edu',
    'Sachin R',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '9ff6d640-1d40-43c4-b5cc-ca93f28918e0',
    'STU514',
    'Sachin R',
    'sachin.r@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BBA',
    'Management',
    '{"projects": ["Lab Project", "Data Dashboard", "Web App"], "internships": ["Marketing Intern", "Research Intern", "Startup Intern"], "achievements": ["Art competition winner", "Debate prize", "Science quiz winner"], "skills": ["Excel", "Team Leadership", "Java"], "timeline": ["Completed internship", "Joined coding club"]}'::jsonb
);

-- Student: Smriti B (STU515)
-- Email: smriti.b@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 5dabab55-6eb5-426d-9445-1fddb2b0f114

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '5dabab55-6eb5-426d-9445-1fddb2b0f114',
    'smriti.b@college.edu',
    'Smriti B',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '5dabab55-6eb5-426d-9445-1fddb2b0f114',
    'STU515',
    'Smriti B',
    'smriti.b@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BBA',
    'Management',
    '{"projects": ["Web App", "Research Study", "Business Plan"], "internships": ["Marketing Intern", "NGO Intern", "Lab Intern"], "achievements": ["Essay competition award", "Sports day medal"], "skills": ["SPSS", "Team Leadership", "Excel"], "timeline": ["Joined coding club", "Completed internship"]}'::jsonb
);

-- Student: Nilesh Jain (STU516)
-- Email: nilesh.jain@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 300bcc5d-2fcc-4acc-9252-219e87b40768

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '300bcc5d-2fcc-4acc-9252-219e87b40768',
    'nilesh.jain@college.edu',
    'Nilesh Jain',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '300bcc5d-2fcc-4acc-9252-219e87b40768',
    'STU516',
    'Nilesh Jain',
    'nilesh.jain@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'B.Tech CSE',
    'Engineering',
    '{"projects": ["Web App"], "internships": ["NGO Intern", "Marketing Intern"], "achievements": ["Math Olympiad rank", "Debate prize"], "skills": ["Java", "Python", "Excel"], "timeline": ["Presented research paper"]}'::jsonb
);

-- Student: Mahima Roy (STU517)
-- Email: mahima.roy@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 9ccf0d84-f0ac-4419-ad31-998d952c1652

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '9ccf0d84-f0ac-4419-ad31-998d952c1652',
    'mahima.roy@college.edu',
    'Mahima Roy',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '9ccf0d84-f0ac-4419-ad31-998d952c1652',
    'STU517',
    'Mahima Roy',
    'mahima.roy@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'B.Com',
    'Commerce',
    '{"projects": ["Business Plan", "Web App", "Research Study"], "internships": ["NGO Intern", "Research Intern", "Startup Intern"], "achievements": ["Art competition winner", "Science quiz winner", "Essay competition award"], "skills": ["Python", "SPSS"], "timeline": ["Presented research paper", "Joined coding club"]}'::jsonb
);

-- Student: Ashwin T (STU518)
-- Email: ashwin.t@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 8d7ea78b-af91-4402-ae56-e7117ca2f334

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '8d7ea78b-af91-4402-ae56-e7117ca2f334',
    'ashwin.t@college.edu',
    'Ashwin T',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '8d7ea78b-af91-4402-ae56-e7117ca2f334',
    'STU518',
    'Ashwin T',
    'ashwin.t@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'B.Com',
    'Commerce',
    '{"projects": ["Business Plan", "Lab Project"], "internships": ["Marketing Intern", "Startup Intern"], "achievements": ["Debate prize", "Essay competition award"], "skills": ["Documentation", "Python", "Java"], "timeline": ["Won hackathon", "Completed internship"]}'::jsonb
);

-- Student: Zoya Khan (STU519)
-- Email: zoya.khan@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 7e6e183c-b356-43fb-b219-0fe4b117c701

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '7e6e183c-b356-43fb-b219-0fe4b117c701',
    'zoya.khan@college.edu',
    'Zoya Khan',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '7e6e183c-b356-43fb-b219-0fe4b117c701',
    'STU519',
    'Zoya Khan',
    'zoya.khan@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BA Journalism',
    'Arts',
    '{"projects": ["Data Dashboard", "Business Plan", "Web App"], "internships": ["Research Intern", "Lab Intern", "NGO Intern"], "achievements": ["Science quiz winner", "Art competition winner", "Math Olympiad rank"], "skills": ["Excel", "SPSS", "Java"], "timeline": ["Joined coding club", "Won hackathon", "Completed internship"]}'::jsonb
);

-- Student: Manav L (STU520)
-- Email: manav.l@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 7a7e6eaa-c42d-4494-b744-ae777a8915e2

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '7a7e6eaa-c42d-4494-b744-ae777a8915e2',
    'manav.l@college.edu',
    'Manav L',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '7a7e6eaa-c42d-4494-b744-ae777a8915e2',
    'STU520',
    'Manav L',
    'manav.l@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'B.Com',
    'Commerce',
    '{"projects": ["Business Plan", "Lab Project", "Web App"], "internships": ["Research Intern", "NGO Intern", "Lab Intern"], "achievements": ["Science quiz winner", "Sports day medal"], "skills": ["Java", "Python", "Documentation"], "timeline": ["Won hackathon", "Joined coding club", "Presented research paper"]}'::jsonb
);

-- Student: Ritu Priyadarshini (STU521)
-- Email: ritu.priyadarshini@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 3c48872d-c301-4720-ac8c-c7bd92f2de20

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '3c48872d-c301-4720-ac8c-c7bd92f2de20',
    'ritu.priyadarshini@college.edu',
    'Ritu Priyadarshini',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '3c48872d-c301-4720-ac8c-c7bd92f2de20',
    'STU521',
    'Ritu Priyadarshini',
    'ritu.priyadarshini@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BCA',
    'Computers',
    '{"projects": ["Research Study", "Business Plan", "Lab Project"], "internships": ["Marketing Intern", "NGO Intern"], "achievements": ["Art competition winner", "Debate prize"], "skills": ["SPSS", "Python", "Excel"], "timeline": ["Joined coding club", "Won hackathon", "Completed internship"]}'::jsonb
);

-- Student: Aarav M (STU522)
-- Email: aarav.m@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 7bad017b-5c53-444b-8e22-d5b16470ae69

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '7bad017b-5c53-444b-8e22-d5b16470ae69',
    'aarav.m@college.edu',
    'Aarav M',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '7bad017b-5c53-444b-8e22-d5b16470ae69',
    'STU522',
    'Aarav M',
    'aarav.m@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BA Journalism',
    'Arts',
    '{"projects": ["Business Plan", "Research Study", "Lab Project"], "internships": ["NGO Intern", "Research Intern"], "achievements": ["Art competition winner", "Science quiz winner", "Essay competition award"], "skills": ["Python", "Documentation"], "timeline": ["Joined coding club", "Presented research paper"]}'::jsonb
);

-- Student: Liyana P (STU523)
-- Email: liyana.p@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 0a7e5572-c06d-4f0c-9ce2-82ba1a3f30f9

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '0a7e5572-c06d-4f0c-9ce2-82ba1a3f30f9',
    'liyana.p@college.edu',
    'Liyana P',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '0a7e5572-c06d-4f0c-9ce2-82ba1a3f30f9',
    'STU523',
    'Liyana P',
    'liyana.p@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BCA',
    'Computers',
    '{"projects": ["Business Plan"], "internships": ["Marketing Intern", "NGO Intern", "Startup Intern"], "achievements": ["Sports day medal", "Science quiz winner", "Debate prize"], "skills": ["Java", "Python"], "timeline": ["Presented research paper", "Completed internship", "Joined coding club"]}'::jsonb
);

-- Student: Gokul R (STU524)
-- Email: gokul.r@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 69abb697-aa5a-4026-9630-7ec08cb140c6

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '69abb697-aa5a-4026-9630-7ec08cb140c6',
    'gokul.r@college.edu',
    'Gokul R',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '69abb697-aa5a-4026-9630-7ec08cb140c6',
    'STU524',
    'Gokul R',
    'gokul.r@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'B.Com',
    'Commerce',
    '{"projects": ["Lab Project"], "internships": ["Lab Intern", "Startup Intern"], "achievements": ["Science quiz winner", "Math Olympiad rank", "Debate prize"], "skills": ["Team Leadership", "SPSS"], "timeline": ["Presented research paper", "Completed internship"]}'::jsonb
);

-- Student: Samira J (STU525)
-- Email: samira.j@college.edu / Password: College@123
-- Auth user needs to be created via Supabase Admin API or Dashboard
-- User ID: 03aa5486-05a9-41bc-84db-4c293c8515a9

INSERT INTO public.users (id, email, full_name, role, university_college_id)
VALUES (
    '03aa5486-05a9-41bc-84db-4c293c8515a9',
    'samira.j@college.edu',
    'Samira J',
    'college_student',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
);

INSERT INTO public.students (
    user_id, 
    student_id, 
    full_name, 
    email, 
    university_college_id, 
    education_level,
    college_degree,
    college_stream,
    profile
)
VALUES (
    '03aa5486-05a9-41bc-84db-4c293c8515a9',
    'STU525',
    'Samira J',
    'samira.j@college.edu',
    'c16a95cf-6ee5-4aa9-8e47-84fbda49611d',
    'college',
    'BA Psychology',
    'Arts',
    '{"projects": ["Data Dashboard", "Web App", "Research Study"], "internships": ["Research Intern", "NGO Intern"], "achievements": ["Science quiz winner", "Math Olympiad rank"], "skills": ["Excel", "Documentation", "Java"], "timeline": ["Completed internship"]}'::jsonb
);