-- Update skills table
UPDATE public.skills
SET 
  verified = TRUE,
  approval_status = 'approved',
  updated_at = NOW()
FROM public.students
WHERE 
  skills.student_id = students.id
  AND students.email IN (
    'rahul.v@gmail.com',
    'priya.nair@gmail.com',
    'karthik.r@gmail.com',
    'sneha.g@gmail.com',
    'arjun.shah@gmail.com',
    'diya.kapoor@gmail.com',
    'ananya.iye@gmail.com',
    'rohan.mehta07@gmail.com',
    'kabir.singh09@gmail.com',
    'ishita.verma12@gmail.com',
    'sham.mehta07@gmail.com',
    'arjun.patel12@gmail.com',
    'aman.kumar@learner.com',
    'neha.sharma@learner.com',
    'vikram.naidu@learner.com',
    'pooja.agarwal@learner.com',
    'rakesh.menon@learner.com',
    'tanya.singh@learner.com'
  );

-- Update trainings table
UPDATE public.trainings
SET 
  approval_status = 'approved',
  updated_at = NOW()
FROM public.students
WHERE 
  trainings.student_id = students.id
  AND students.email IN (
    'rahul.v@gmail.com',
    'priya.nair@gmail.com',
    'karthik.r@gmail.com',
    'sneha.g@gmail.com',
    'arjun.shah@gmail.com',
    'diya.kapoor@gmail.com',
    'ananya.iye@gmail.com',
    'rohan.mehta07@gmail.com',
    'kabir.singh09@gmail.com',
    'ishita.verma12@gmail.com',
    'sham.mehta07@gmail.com',
    'arjun.patel12@gmail.com',
    'aman.kumar@learner.com',
    'neha.sharma@learner.com',
    'vikram.naidu@learner.com',
    'pooja.agarwal@learner.com',
    'rakesh.menon@learner.com',
    'tanya.singh@learner.com'
  );

-- Update projects table
UPDATE public.projects
SET 
  approval_status = 'verified',
  updated_at = NOW()
FROM public.students
WHERE 
  projects.student_id = students.id
  AND students.email IN (
    'rahul.v@gmail.com',
    'priya.nair@gmail.com',
    'karthik.r@gmail.com',
    'sneha.g@gmail.com',
    'arjun.shah@gmail.com',
    'diya.kapoor@gmail.com',
    'ananya.iye@gmail.com',
    'rohan.mehta07@gmail.com',
    'kabir.singh09@gmail.com',
    'ishita.verma12@gmail.com',
    'sham.mehta07@gmail.com',
    'arjun.patel12@gmail.com',
    'aman.kumar@learner.com',
    'neha.sharma@learner.com',
    'vikram.naidu@learner.com',
    'pooja.agarwal@learner.com',
    'rakesh.menon@learner.com',
    'tanya.singh@learner.com'
  );

-- Update certificates table
UPDATE public.certificates
SET 
  approval_status = 'verified',
  updated_at = NOW()
FROM public.students
WHERE 
  certificates.student_id = students.id
  AND students.email IN (
    'rahul.v@gmail.com',
    'priya.nair@gmail.com',
    'karthik.r@gmail.com',
    'sneha.g@gmail.com',
    'arjun.shah@gmail.com',
    'diya.kapoor@gmail.com',
    'ananya.iye@gmail.com',
    'rohan.mehta07@gmail.com',
    'kabir.singh09@gmail.com',
    'ishita.verma12@gmail.com',
    'sham.mehta07@gmail.com',
    'arjun.patel12@gmail.com',
    'aman.kumar@learner.com',
    'neha.sharma@learner.com',
    'vikram.naidu@learner.com',
    'pooja.agarwal@learner.com',
    'rakesh.menon@learner.com',
    'tanya.singh@learner.com'
  );

-- Update experience table
UPDATE public.experience
SET 
  verified = TRUE,
  approval_status = 'approved',
  updated_at = NOW()
FROM public.students
WHERE 
  experience.student_id = students.id
  AND students.email IN (
    'rahul.v@gmail.com',
    'priya.nair@gmail.com',
    'karthik.r@gmail.com',
    'sneha.g@gmail.com',
    'arjun.shah@gmail.com',
    'diya.kapoor@gmail.com',
    'ananya.iye@gmail.com',
    'rohan.mehta07@gmail.com',
    'kabir.singh09@gmail.com',
    'ishita.verma12@gmail.com',
    'sham.mehta07@gmail.com',
    'arjun.patel12@gmail.com',
    'aman.kumar@learner.com',
    'neha.sharma@learner.com',
    'vikram.naidu@learner.com',
    'pooja.agarwal@learner.com',
    'rakesh.menon@learner.com',
    'tanya.singh@learner.com'
  );

-- Update education table
UPDATE public.education
SET 
  approval_status = 'approved',
  updated_at = NOW()
FROM public.students
WHERE 
  education.student_id = students.id
  AND students.email IN (
    'rahul.v@gmail.com',
    'priya.nair@gmail.com',
    'karthik.r@gmail.com',
    'sneha.g@gmail.com',
    'arjun.shah@gmail.com',
    'diya.kapoor@gmail.com',
    'ananya.iye@gmail.com',
    'rohan.mehta07@gmail.com',
    'kabir.singh09@gmail.com',
    'ishita.verma12@gmail.com',
    'sham.mehta07@gmail.com',
    'arjun.patel12@gmail.com',
    'aman.kumar@learner.com',
    'neha.sharma@learner.com',
    'vikram.naidu@learner.com',
    'pooja.agarwal@learner.com',
    'rakesh.menon@learner.com',
    'tanya.singh@learner.com'
  );