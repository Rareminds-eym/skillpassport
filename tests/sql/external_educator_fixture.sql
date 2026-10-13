-- Isolated disposable database fixture. Never apply to an application/linked database.
CREATE TABLE public.users(id uuid PRIMARY KEY,email text,"organizationId" uuid,"isActive" boolean DEFAULT true,role text,metadata jsonb DEFAULT '{}');
CREATE TABLE public.organizations(id uuid PRIMARY KEY,name text,organization_type text,admin_id uuid);
CREATE TABLE public.departments(id uuid PRIMARY KEY,college_id uuid,name text);
CREATE TABLE public.programs(id uuid PRIMARY KEY,department_id uuid,name text,code text,specializations text[] DEFAULT '{}');
CREATE TABLE public.program_sections(id uuid PRIMARY KEY,department_id uuid,program_id uuid,semester integer,section text,academic_year text,status text DEFAULT 'active');
CREATE TABLE public.courses(course_id uuid PRIMARY KEY,title text,code text,description text,duration text,status text,deleted_at timestamptz);
CREATE TABLE public.organization_staff(id uuid PRIMARY KEY,user_id uuid,organization_id uuid,role text,account_status text,first_name text,last_name text,phone text,qualification text,metadata jsonb DEFAULT '{}',updated_at timestamptz DEFAULT now());
CREATE TABLE public.organization_staff_assignments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),staff_id uuid,college_id uuid,department_id uuid,program_id uuid,section_id uuid,assigned_courses jsonb DEFAULT '[]',start_date date,end_date date,is_active boolean DEFAULT true,assigned_by uuid,notes text,metadata jsonb DEFAULT '{}',created_at timestamptz DEFAULT now());
CREATE TABLE public.learners(id uuid PRIMARY KEY,user_id uuid,name text,roll_number text,college_id uuid,program_id uuid,semester integer,section text,specialization text,is_deleted boolean DEFAULT false);
CREATE TABLE "public"."college_attendance_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "subject_name" character varying(255) NOT NULL,
    "subject_code" character varying(50),
    "course_type" character varying(20),
    "faculty_id" "uuid",
    "faculty_name" character varying(255) NOT NULL,
    "department_name" character varying(255) NOT NULL,
    "program_name" character varying(255) NOT NULL,
    "program_code" character varying(50),
    "semester" integer NOT NULL,
    "section" character varying(10) NOT NULL,
    "room_number" character varying(50),
    "academic_year" character varying(20) DEFAULT '2024-25'::character varying,
    "total_learners" integer DEFAULT 0,
    "present_count" integer DEFAULT 0,
    "absent_count" integer DEFAULT 0,
    "late_count" integer DEFAULT 0,
    "excused_count" integer DEFAULT 0,
    "attendance_percentage" numeric(5,2) DEFAULT 0.00,
    "status" character varying(20) DEFAULT 'scheduled'::character varying,
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "college_id" "uuid" NOT NULL,
    CONSTRAINT "college_attendance_sessions_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('scheduled'::character varying)::"text", ('ongoing'::character varying)::"text", ('completed'::character varying)::"text", ('cancelled'::character varying)::"text"])))
);
CREATE TABLE "public"."college_attendance_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "learner_id" "uuid",
    "learner_name" character varying(255) NOT NULL,
    "roll_number" character varying(50) NOT NULL,
    "department_name" character varying(255) NOT NULL,
    "program_name" character varying(255) NOT NULL,
    "semester" integer NOT NULL,
    "section" character varying(10) NOT NULL,
    "date" "date" NOT NULL,
    "status" character varying(20) NOT NULL,
    "time_in" time without time zone,
    "time_out" time without time zone,
    "subject_name" character varying(255) NOT NULL,
    "subject_code" character varying(50),
    "faculty_id" "uuid",
    "faculty_name" character varying(255) NOT NULL,
    "location" character varying(255),
    "remarks" "text",
    "marked_by" "uuid",
    "marked_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "college_id" "uuid" NOT NULL,
    CONSTRAINT "college_attendance_records_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('present'::character varying)::"text", ('absent'::character varying)::"text", ('late'::character varying)::"text", ('excused'::character varying)::"text"])))
);

-- Existing attendance bulk-import migration prerequisites.
ALTER TABLE public.college_attendance_sessions ADD COLUMN program_id uuid;
ALTER TABLE public.college_attendance_records ADD COLUMN program_id uuid, ADD COLUMN program_code varchar(50);

-- Primary keys are defined by later ALTER statements in the baseline schema.
ALTER TABLE public.college_attendance_sessions ADD PRIMARY KEY (id);
ALTER TABLE public.college_attendance_records ADD PRIMARY KEY (id);
