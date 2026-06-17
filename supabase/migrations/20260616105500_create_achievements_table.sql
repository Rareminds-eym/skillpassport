-- Create achievements table for learner accomplishments and recognition
-- Similar structure to education and skills tables
-- Date: 2026-06-16

-- Create achievements table
CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "learner_id" "uuid" NOT NULL,
    "title" character varying(200) NOT NULL,
    "description" "text",
    "date" character varying(20),
    "issuer" character varying(150),
    "category" character varying(50),
    "approval_status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "enabled" boolean DEFAULT true,
    "pending_edit_data" "jsonb",
    "has_pending_edit" boolean DEFAULT false,
    "verified_data" "jsonb"
);

-- Set table owner
ALTER TABLE "public"."achievements" OWNER TO "postgres";

-- Add comments for documentation
COMMENT ON TABLE "public"."achievements" IS 'Stores learner achievements, awards, certifications, and recognitions';

COMMENT ON COLUMN "public"."achievements"."title" IS 'Title of the achievement (e.g., "First Place in Coding Competition")';

COMMENT ON COLUMN "public"."achievements"."description" IS 'Detailed description of the achievement';

COMMENT ON COLUMN "public"."achievements"."date" IS 'Date when achievement was received (flexible format)';

COMMENT ON COLUMN "public"."achievements"."issuer" IS 'Organization or entity that issued the achievement';

COMMENT ON COLUMN "public"."achievements"."category" IS 'Category of achievement (e.g., Academic, Sports, Technical, Leadership)';

COMMENT ON COLUMN "public"."achievements"."enabled" IS 'Controls visibility of achievement record in UI (eye icon toggle)';

COMMENT ON COLUMN "public"."achievements"."pending_edit_data" IS 'Stores the edited version of data awaiting verification';

COMMENT ON COLUMN "public"."achievements"."has_pending_edit" IS 'Flag to indicate if there is a pending edit for this record';

COMMENT ON COLUMN "public"."achievements"."verified_data" IS 'Stores the last verified version of the data';

-- Add primary key constraint
ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");

-- Add foreign key constraint to learners table with CASCADE delete
ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE CASCADE;

-- Create index on learner_id for faster queries
CREATE INDEX IF NOT EXISTS "achievements_learner_id_idx" ON "public"."achievements" USING "btree" ("learner_id");

-- Create index on approval_status for filtering
CREATE INDEX IF NOT EXISTS "achievements_approval_status_idx" ON "public"."achievements" USING "btree" ("approval_status");

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS "achievements_created_at_idx" ON "public"."achievements" USING "btree" ("created_at" DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy: Learners can view their own achievements
CREATE POLICY "Learners can view own achievements"
    ON "public"."achievements"
    FOR SELECT
    USING (
        "learner_id" IN (
            SELECT "id" FROM "public"."learners"
            WHERE "user_id" = "auth"."uid"()
        )
    );

-- Policy: Learners can insert their own achievements
CREATE POLICY "Learners can insert own achievements"
    ON "public"."achievements"
    FOR INSERT
    WITH CHECK (
        "learner_id" IN (
            SELECT "id" FROM "public"."learners"
            WHERE "user_id" = "auth"."uid"()
        )
    );

-- Policy: Learners can update their own achievements
CREATE POLICY "Learners can update own achievements"
    ON "public"."achievements"
    FOR UPDATE
    USING (
        "learner_id" IN (
            SELECT "id" FROM "public"."learners"
            WHERE "user_id" = "auth"."uid"()
        )
    );

-- Policy: Learners can delete their own achievements
CREATE POLICY "Learners can delete own achievements"
    ON "public"."achievements"
    FOR DELETE
    USING (
        "learner_id" IN (
            SELECT "id" FROM "public"."learners"
            WHERE "user_id" = "auth"."uid"()
        )
    );

-- Policy: Admins can view all achievements
CREATE POLICY "Admins can view all achievements"
    ON "public"."achievements"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."users"
            WHERE "users"."id" = "auth"."uid"()
            AND ("users"."role" LIKE '%admin%' OR "users"."role" = 'admin')
        )
    );

-- Policy: Admins can update all achievements (for approval)
CREATE POLICY "Admins can update all achievements"
    ON "public"."achievements"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "public"."users"
            WHERE "users"."id" = "auth"."uid"()
            AND ("users"."role" LIKE '%admin%' OR "users"."role" = 'admin')
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_achievements_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "update_achievements_updated_at_trigger"
    BEFORE UPDATE ON "public"."achievements"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_achievements_updated_at"();

-- Grant permissions
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";
