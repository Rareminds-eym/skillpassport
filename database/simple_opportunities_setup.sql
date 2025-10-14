-- Simple opportunities table setup for immediate testing
-- Run this in your Supabase SQL Editor

-- Drop and recreate the table
DROP TABLE IF EXISTS opportunities CASCADE;

-- Create the table with your exact structure
CREATE TABLE opportunities (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo TEXT,
  employment_type TEXT NOT NULL,
  location TEXT,
  mode TEXT,
  stipend_or_salary TEXT,
  experience_required TEXT,
  skills_required JSONB,
  description TEXT,
  application_link TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Disable RLS for now
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;

-- Insert your TCS opportunity
INSERT INTO opportunities 
(title, company_name, company_logo, employment_type, location, mode, stipend_or_salary, experience_required, skills_required, description, application_link, deadline)
VALUES 
(
  'Web Developer Intern',
  'Tata Consultancy Services',
  'https://tcs.com/logo.png',
  'internship',
  'Bangalore, India',
  'onsite',
  '₹10,000/month',
  '0–1 years',
  '["React", "JavaScript", "CSS"]'::jsonb,
  'Work with our frontend team on real-time UI projects.',
  'https://tcs.com/apply',
  '2025-11-01 23:59:00+05:30'
);

-- Verify the data was inserted
SELECT * FROM opportunities;