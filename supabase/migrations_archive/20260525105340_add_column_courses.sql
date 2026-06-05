CREATE TYPE public.plan_type AS ENUM (
  'freemium',
  'basic',
  'professional',
  'premium'
);
ALTER TABLE public.courses
ADD COLUMN plan_type public.plan_type DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_plan_type
ON public.courses USING btree (plan_type) TABLESPACE pg_default;

-- Step 1: Create the enum FIRST
CREATE TYPE public.course_type AS ENUM (
  'course',
  'webinar'
);

-- Step 2: Then alter the table
ALTER TABLE public.courses
ADD COLUMN course_type public.course_type NOT NULL DEFAULT 'course'::public.course_type,
ADD COLUMN issued_on date NULL DEFAULT NULL;

-- Step 3: Then indexes
CREATE INDEX IF NOT EXISTS idx_courses_course_type
ON public.courses USING btree (course_type) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_courses_issued_on
ON public.courses USING btree (issued_on) TABLESPACE pg_default;

