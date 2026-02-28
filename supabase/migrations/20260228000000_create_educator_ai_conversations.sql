-- Create educator_ai_conversations table with proper RLS policies
-- Mirrors career_ai_conversations structure but for educators

CREATE TABLE IF NOT EXISTS "public"."educator_ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "educator_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "messages" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "educator_ai_conversations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."educator_ai_conversations" OWNER TO "postgres";

COMMENT ON TABLE "public"."educator_ai_conversations" IS 'Stores Educator AI chat conversations';

-- Add foreign key constraint
ALTER TABLE "public"."educator_ai_conversations"
ADD CONSTRAINT "educator_ai_conversations_educator_id_fkey" 
FOREIGN KEY ("educator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE "public"."educator_ai_conversations" ENABLE ROW LEVEL SECURITY;

-- RLS Policies with proper security (prevents UUID guessing attacks)

-- SELECT: Educators can view only their own conversations
CREATE POLICY "Educators can view own conversations" 
ON "public"."educator_ai_conversations" 
FOR SELECT 
TO authenticated
USING ((SELECT auth.uid()) = educator_id);

-- INSERT: Educators can create conversations for themselves only
CREATE POLICY "Educators can insert own conversations" 
ON "public"."educator_ai_conversations" 
FOR INSERT 
TO authenticated
WITH CHECK ((SELECT auth.uid()) = educator_id);

-- UPDATE: Educators can update only their own conversations
-- WITH CHECK prevents changing ownership during update
CREATE POLICY "Educators can update own conversations" 
ON "public"."educator_ai_conversations" 
FOR UPDATE 
TO authenticated
USING ((SELECT auth.uid()) = educator_id)
WITH CHECK ((SELECT auth.uid()) = educator_id);

-- DELETE: Educators can delete only their own conversations
CREATE POLICY "Educators can delete own conversations" 
ON "public"."educator_ai_conversations" 
FOR DELETE 
TO authenticated
USING ((SELECT auth.uid()) = educator_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS "educator_ai_conversations_educator_id_idx" 
ON "public"."educator_ai_conversations" ("educator_id");

CREATE INDEX IF NOT EXISTS "educator_ai_conversations_updated_at_idx" 
ON "public"."educator_ai_conversations" ("updated_at" DESC);
