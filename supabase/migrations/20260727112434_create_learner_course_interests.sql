    -- Create learner_course_interests table for capturing learner interest in recommended courses
    -- Records one interest per learner per course, from any supported learner
    -- recommendation entry point
    -- This is not enrollment, click history, or analytics
    -- Date: 2026-07-27

    -- Create learner_course_interests table
    CREATE TABLE IF NOT EXISTS "public"."learner_course_interests" (
        "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
        "user_id" "uuid" NOT NULL,
        "course_id" "uuid" NOT NULL,
        "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
    );

    -- Set table owner
    ALTER TABLE "public"."learner_course_interests" OWNER TO "postgres";

    -- Add comments for documentation
    COMMENT ON TABLE "public"."learner_course_interests" IS 'Stores learner interest in recommended courses captured from supported learner recommendation entry points. One record per learner per course.';

    COMMENT ON COLUMN "public"."learner_course_interests"."user_id" IS 'The authenticated user who expressed interest, resolved server-side from the session. Holds the same value as users.id. The foreign key to learners.user_id ensures only users with a learner profile can create interest records.';

    COMMENT ON COLUMN "public"."learner_course_interests"."course_id" IS 'Course the learner expressed interest in';

    COMMENT ON COLUMN "public"."learner_course_interests"."created_at" IS 'Timestamp of first interest. Rows are immutable; repeat interest, including from a different entry point, does not update this value.';

    -- Add primary key constraint
    ALTER TABLE ONLY "public"."learner_course_interests"
        ADD CONSTRAINT "learner_course_interests_pkey" PRIMARY KEY ("id");

    -- Enforce one interest record per learner per course
    ALTER TABLE ONLY "public"."learner_course_interests"
        ADD CONSTRAINT "learner_course_interests_user_id_course_id_key" UNIQUE ("user_id", "course_id");

    -- Add foreign key constraint to learners table with CASCADE delete
    -- The authenticated user's id is stored directly. Referencing learners.user_id
    -- (UNIQUE) rather than users.id ensures only users with a learner profile can
    -- create interest records - a reference to users.id would accept any
    -- authenticated user, including educators and administrators.
    ALTER TABLE ONLY "public"."learner_course_interests"
        ADD CONSTRAINT "learner_course_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."learners"("user_id") ON DELETE CASCADE;

    -- Add foreign key constraint to courses table with CASCADE delete
    ALTER TABLE ONLY "public"."learner_course_interests"
        ADD CONSTRAINT "learner_course_interests_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE CASCADE;

    -- Create index on course_id for per-course interest reporting
    -- user_id lookups are served by the left prefix of the unique constraint index
    CREATE INDEX IF NOT EXISTS "idx_learner_course_interests_course_id" ON "public"."learner_course_interests" USING "btree" ("course_id");

    -- Enable Row Level Security (RLS)
    ALTER TABLE "public"."learner_course_interests" ENABLE ROW LEVEL SECURITY;

    -- No RLS policies are created.
    -- This project authenticates through external SSO, not Supabase Auth, so
    -- auth.uid() always returns NULL and any policy based on it would deny all
    -- access. All reads and writes go through Pages Functions using the service
    -- role key, which bypasses RLS. RLS remains enabled so that no other role can
    -- reach this table directly.

    -- Grant permissions
    GRANT ALL ON TABLE "public"."learner_course_interests" TO "anon";
    GRANT ALL ON TABLE "public"."learner_course_interests" TO "authenticated";
    GRANT ALL ON TABLE "public"."learner_course_interests" TO "service_role";
