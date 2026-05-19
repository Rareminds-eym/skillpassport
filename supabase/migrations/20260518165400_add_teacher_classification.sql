-- Add 'teacher' to classification enum
-- This migration adds the 'teacher' classification type to the existing classification enum
-- without removing any existing values

ALTER TYPE "public"."classification" ADD VALUE 'teacher' AFTER 'regulatory_compliance';
