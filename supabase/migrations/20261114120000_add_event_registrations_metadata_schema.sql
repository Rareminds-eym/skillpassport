-- ============================================================================
-- Migration: Add event_id, metadata, and JSON Schema constraints
-- Features:
--   1. Enables pg_jsonschema extension.
--   2. Adds event_id and metadata columns if not already present.
--   3. Enforces Event ID regex format (EVT-XX-XXXXXX-YYYY-NNN).
--   4. Unified metadata JSON schema constraint keyed strictly by event_id:
--        - EVT-RM-EDU100-2026-002 (100k Educators)
--        - EVT-RM-LRN100-2026-001 (100k Learners)
--        - EVT-RM-EXPR26-2026-001 (Expressions Unlimited 2026)
--   5. Creates B-Tree and GIN indexes for query performance.
-- ============================================================================

-- 1. Enable JSON Schema validation extension
CREATE EXTENSION IF NOT EXISTS pg_jsonschema;

-- 2. Add the 2 columns if they don't already exist
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS event_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Enforce Event ID format (EVT-XX-XXXXXX-YYYY-NNN)
ALTER TABLE public.event_registrations
DROP CONSTRAINT IF EXISTS check_event_id_format;

ALTER TABLE public.event_registrations
ADD CONSTRAINT check_event_id_format
    CHECK (event_id IS NULL OR event_id ~ '^(EVT-[A-Z0-9]{2}|RM-EVT)-[A-Z0-9]{6}-[0-9]{4}-[0-9]{3}$');

-- 4. Clean up any existing individual or legacy metadata constraints
ALTER TABLE public.event_registrations
DROP CONSTRAINT IF EXISTS check_childrens_day_metadata_jsonschema;

ALTER TABLE public.event_registrations
DROP CONSTRAINT IF EXISTS check_event_metadata_jsonschema;

-- 5. Unified metadata JSON schema constraint keyed strictly by event_id
ALTER TABLE public.event_registrations
ADD CONSTRAINT check_event_metadata_jsonschema CHECK (
  CASE
    -- -----------------------------------------------------------------
    -- 100k Educators (EVT-RM-EDU100-2026-002)
    -- Requires only event_code and educator_type
    -- -----------------------------------------------------------------
    WHEN event_id = 'EVT-RM-EDU100-2026-002' THEN
      json_matches_schema(
        '{
          "type": "object",
          "required": ["event_code", "event_data"],
          "properties": {
            "event_code": {
              "type": "string",
              "const": "100k_educators"
            },
            "event_data": {
              "type": "object",
              "required": ["educator_type"],
              "properties": {
                "educator_type": { "type": "string" }
              }
            }
          }
        }'::json,
        metadata::json
      )

    -- -----------------------------------------------------------------
    -- 100k Learners (EVT-RM-LRN100-2026-001)
    -- Requires only event_code and learner_type
    -- -----------------------------------------------------------------
    WHEN event_id = 'EVT-RM-LRN100-2026-001' THEN
      json_matches_schema(
        '{
          "type": "object",
          "required": ["event_code", "event_data"],
          "properties": {
            "event_code": {
              "type": "string",
              "const": "100k_learners"
            },
            "event_data": {
              "type": "object",
              "required": ["learner_type"],
              "properties": {
                "learner_type": { "type": "string" }
              }
            }
          }
        }'::json,
        metadata::json
      )

    -- -----------------------------------------------------------------
    -- Expressions Unlimited 2026 (EVT-RM-EXPR26-2026-001)
    -- -----------------------------------------------------------------
    WHEN event_id = 'EVT-RM-EXPR26-2026-001' THEN
      json_matches_schema(
        '{
          "type": "object",
          "required": ["event_code", "event_data"],
          "properties": {
            "event_code": {
              "type": "string",
              "enum": ["expressions_unlimited_2026", "childrens_day_2026"]
            },
            "source": { "type": "string" },
            "tracking": { "type": "object" },
            "referral": { "type": "object" },
            "event_data": {
              "type": "object",
              "required": ["child", "guardian", "expression", "artifact", "consents"],
              "properties": {
                "child": {
                  "type": "object",
                  "required": ["displayName", "ageGroup"],
                  "properties": {
                    "displayName": { "type": "string", "minLength": 1 },
                    "ageGroup": {
                      "type": "string",
                      "enum": ["5-8", "9-12", "13-17"]
                    }
                  },
                  "additionalProperties": false
                },
                "guardian": {
                  "type": "object",
                  "required": ["guardianName"],
                  "properties": {
                    "guardianName": { "type": "string", "minLength": 1 }
                  },
                  "additionalProperties": false
                },
                "expression": {
                  "type": "object",
                  "required": ["category", "title", "description"],
                  "properties": {
                    "category": { "type": "string", "minLength": 1 },
                    "title": { "type": "string", "minLength": 1, "maxLength": 60 },
                    "description": { "type": "string", "minLength": 1 },
                    "accessibilitySupport": { "type": "string" }
                  },
                  "additionalProperties": false
                },
                "artifact": {
                  "type": "object",
                  "required": ["fileName", "fileSize", "fileType", "category"],
                  "properties": {
                    "fileName": { "type": "string", "minLength": 1 },
                    "fileSize": { "type": "string", "minLength": 1 },
                    "fileType": { "type": "string", "minLength": 1 },
                    "mimeType": { "type": "string" },
                    "category": {
                      "type": "string",
                      "enum": ["image", "video", "document", "other"]
                    },
                    "fileId": { "type": "string" },
                    "previewUrl": { "type": "string" },
                    "r2Url": { "type": "string" },
                    "objectKey": { "type": "string" },
                    "externalLink": { "type": "string" }
                  },
                  "additionalProperties": false
                },
                "consents": {
                  "type": "object",
                  "required": ["guardianAuthority", "originalityAndRules"],
                  "properties": {
                    "guardianAuthority": { "type": "boolean", "const": true },
                    "originalityAndRules": { "type": "boolean", "const": true },
                    "publicDisplayOptional": { "type": "boolean" },
                    "promotionalReuseOptional": { "type": "boolean" },
                    "marketingUpdatesOptional": { "type": "boolean" }
                  },
                  "additionalProperties": false
                },
                "moderation_status": {
                  "type": "string",
                  "enum": [
                    "Pending Review",
                    "Under Review",
                    "Eligible",
                    "Shortlisted",
                    "Awarded",
                    "Correction Requested",
                    "Rejected"
                  ]
                },
                "reviewer": { "type": "string" },
                "withdrawn": { "type": "boolean" },
                "phone_verified": { "type": "boolean" }
              },
              "additionalProperties": false
            }
          },
          "additionalProperties": false
        }'::json,
        metadata::json
      )

    -- Any other event ID allows generic JSON without blocking
    ELSE true
  END
);

-- 6. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id
ON public.event_registrations (event_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_metadata
ON public.event_registrations USING gin (metadata);

-- 7. Documentation comments
COMMENT ON COLUMN public.event_registrations.event_id IS
'Canonical Event ID (e.g. EVT-RM-EDU100-2026-002, EVT-RM-LRN100-2026-001, EVT-RM-EXPR26-2026-001)';

COMMENT ON COLUMN public.event_registrations.metadata IS
'Project-specific minimal metadata validated by event_id via pg_jsonschema';
