-- Create trainings table
CREATE TABLE public.trainings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    course_name character varying(200) NOT NULL,
    provider character varying(100) NULL,
    duration character varying(50) NULL,
    status character varying(20) NULL DEFAULT 'completed'::character varying,
    progress integer NULL DEFAULT 100,
    skills_covered text[] NULL,
    start_date date NULL,
    end_date date NULL,
    certificate_url text NULL,
    description text NULL,
    enabled boolean NULL DEFAULT true,
    approval_status character varying(20) NULL DEFAULT 'pending'::character varying,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT trainings_pkey PRIMARY KEY (id),
    CONSTRAINT trainings_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (user_id),
    CONSTRAINT trainings_progress_check CHECK (((progress >= 0) AND (progress <= 100))),
    CONSTRAINT trainings_status_check CHECK (((status)::text = ANY (ARRAY[('completed'::character varying)::text, ('in_progress'::character varying)::text, ('planned'::character varying)::text])))
) TABLESPACE pg_default;

-- Create indexes for trainings
CREATE INDEX IF NOT EXISTS idx_trainings_student_id ON public.trainings USING btree (student_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_trainings_status ON public.trainings USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_trainings_student_lookup ON public.trainings USING btree (student_id, enabled) TABLESPACE pg_default WHERE (enabled = true);

-- Create trigger for trainings
CREATE TRIGGER update_trainings_updated_at 
    BEFORE UPDATE ON trainings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create certificates table
CREATE TABLE public.certificates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    issuer character varying(100) NOT NULL,
    issue_date date NULL,
    expiry_date date NULL,
    credential_id character varying(100) NULL,
    credential_url text NULL,
    description text NULL,
    skills_covered text[] NULL,
    enabled boolean NULL DEFAULT true,
    verified boolean NULL DEFAULT false,
    approval_status character varying(20) NULL DEFAULT 'pending'::character varying,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT certificates_pkey PRIMARY KEY (id),
    CONSTRAINT certificates_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (user_id)
) TABLESPACE pg_default;

-- Create indexes for certificates
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.certificates USING btree (student_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_certificates_student_lookup ON public.certificates USING btree (student_id, enabled) TABLESPACE pg_default WHERE (enabled = true);

-- Create trigger for certificates
CREATE TRIGGER update_certificates_updated_at 
    BEFORE UPDATE ON certificates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create projects table
CREATE TABLE public.projects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    description text NULL,
    technologies text[] NULL,
    project_url text NULL,
    github_url text NULL,
    start_date date NULL,
    end_date date NULL,
    status character varying(20) NULL DEFAULT 'completed'::character varying,
    role character varying(100) NULL,
    team_size integer NULL,
    achievements text[] NULL,
    enabled boolean NULL DEFAULT true,
    featured boolean NULL DEFAULT false,
    approval_status character varying(20) NULL DEFAULT 'pending'::character varying,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT projects_pkey PRIMARY KEY (id),
    CONSTRAINT projects_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (user_id),
    CONSTRAINT projects_status_check CHECK (((status)::text = ANY (ARRAY[('completed'::character varying)::text, ('in_progress'::character varying)::text, ('planned'::character varying)::text])))
) TABLESPACE pg_default;

-- Create indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_student_id ON public.projects USING btree (student_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_projects_student_lookup ON public.projects USING btree (student_id, enabled) TABLESPACE pg_default WHERE (enabled = true);

-- Create trigger for projects
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create education table
CREATE TABLE public.education (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    institution_name character varying(200) NOT NULL,
    degree character varying(100) NULL,
    field_of_study character varying(100) NULL,
    start_date date NULL,
    end_date date NULL,
    grade character varying(20) NULL,
    activities text[] NULL,
    description text NULL,
    enabled boolean NULL DEFAULT true,
    is_current boolean NULL DEFAULT false,
    approval_status character varying(20) NULL DEFAULT 'pending'::character varying,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT education_pkey PRIMARY KEY (id),
    CONSTRAINT education_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (user_id)
) TABLESPACE pg_default;

-- Create indexes for education
CREATE INDEX IF NOT EXISTS idx_education_student_id ON public.education USING btree (student_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_education_student_lookup ON public.education USING btree (student_id, enabled) TABLESPACE pg_default WHERE (enabled = true);

-- Create trigger for education
CREATE TRIGGER update_education_updated_at 
    BEFORE UPDATE ON education 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create experience table
CREATE TABLE public.experience (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    company character varying(200) NOT NULL,
    position character varying(100) NOT NULL,
    employment_type character varying(50) NULL,
    location character varying(100) NULL,
    start_date date NULL,
    end_date date NULL,
    is_current boolean NULL DEFAULT false,
    description text NULL,
    skills_used text[] NULL,
    achievements text[] NULL,
    enabled boolean NULL DEFAULT true,
    approval_status character varying(20) NULL DEFAULT 'pending'::character varying,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT experience_pkey PRIMARY KEY (id),
    CONSTRAINT experience_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (user_id),
    CONSTRAINT experience_employment_type_check CHECK (((employment_type)::text = ANY (ARRAY[('full_time'::character varying)::text, ('part_time'::character varying)::text, ('internship'::character varying)::text, ('contract'::character varying)::text, ('freelance'::character varying)::text])))
) TABLESPACE pg_default;

-- Create indexes for experience
CREATE INDEX IF NOT EXISTS idx_experience_student_id ON public.experience USING btree (student_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_experience_employment_type ON public.experience USING btree (employment_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_experience_student_lookup ON public.experience USING btree (student_id, enabled) TABLESPACE pg_default WHERE (enabled = true);

-- Create trigger for experience
CREATE TRIGGER update_experience_updated_at 
    BEFORE UPDATE ON experience 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();