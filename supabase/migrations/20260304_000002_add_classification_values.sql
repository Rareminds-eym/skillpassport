-- Migration: Add new classification enum values
-- Created: 2026-03-04
-- Description: Adds Arts and Science, Biotechnology & Research, Clinical & Diagnostic, 
--              Digital Health & AI, Engineering, Entrepreneurship, Management, 
--              Medical Device & Equipment, and Regulatory & Compliance to classification enum

-- Add new values to the classification enum
ALTER TYPE public.classification ADD VALUE IF NOT EXISTS 'arts_and_science';
ALTER TYPE public.classification ADD VALUE IF NOT EXISTS 'biotechnology_research';
ALTER TYPE public.classification ADD VALUE IF NOT EXISTS 'clinical_diagnostic';
ALTER TYPE public.classification ADD VALUE IF NOT EXISTS 'digital_health_ai';
ALTER TYPE public.classification ADD VALUE IF NOT EXISTS 'engineering';
ALTER TYPE public.classification ADD VALUE IF NOT EXISTS 'entrepreneurship';
ALTER TYPE public.classification ADD VALUE IF NOT EXISTS 'management';
ALTER TYPE public.classification ADD VALUE IF NOT EXISTS 'medical_device_equipment';
ALTER TYPE public.classification ADD VALUE IF NOT EXISTS 'regulatory_compliance';
