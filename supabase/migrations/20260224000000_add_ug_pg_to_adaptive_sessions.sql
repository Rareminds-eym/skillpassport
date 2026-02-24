-- Add undergraduate and postgraduate to adaptive_aptitude_sessions grade_level enum

-- First, check if the enum type exists and what values it has
DO $$
BEGIN
  -- Add new values to the enum if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'undergraduate' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grade_level')
  ) THEN
    ALTER TYPE grade_level ADD VALUE 'undergraduate';
    RAISE NOTICE 'Added undergraduate to grade_level';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'postgraduate' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'grade_level')
  ) THEN
    ALTER TYPE grade_level ADD VALUE 'postgraduate';
    RAISE NOTICE 'Added postgraduate to grade_level';
  END IF;
END $$;
