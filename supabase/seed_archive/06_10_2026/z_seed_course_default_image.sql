UPDATE public.courses
SET
  thumbnail = 'https://storage-sp.rareminds.in/courses/Default/default.jpg',
  updated_at = NOW()
WHERE course_type = 'course';