-- Update the opportunities table to match the required schema
-- Run this in your Supabase SQL Editor

-- First, drop the existing opportunities table if it exists
DROP TABLE IF EXISTS opportunities CASCADE;

-- Create the new opportunities table with the correct schema
CREATE TABLE opportunities (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo TEXT,
  employment_type TEXT NOT NULL, -- 'internship', 'full-time', 'part-time', 'contract'
  location TEXT,
  mode TEXT, -- 'onsite', 'remote', 'hybrid'
  stipend_or_salary TEXT,
  experience_required TEXT,
  skills_required JSONB, -- Store skills as JSON array
  description TEXT,
  application_link TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_employment_type ON opportunities(employment_type);
CREATE INDEX IF NOT EXISTS idx_opportunities_mode ON opportunities(mode);
CREATE INDEX IF NOT EXISTS idx_opportunities_active ON opportunities(is_active);
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_name);

-- Create trigger for updating the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to opportunities table
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at 
    BEFORE UPDATE ON opportunities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (if you want to enable it later)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
-- Allow everyone to view active opportunities
DROP POLICY IF EXISTS "Anyone can view active opportunities" ON opportunities;
CREATE POLICY "Anyone can view active opportunities" 
    ON opportunities FOR SELECT 
    USING (is_active = true);

-- Allow authenticated users to view all opportunities
DROP POLICY IF EXISTS "Authenticated users can view all opportunities" ON opportunities;
CREATE POLICY "Authenticated users can view all opportunities" 
    ON opportunities FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow only admins to insert/update/delete opportunities (you can adjust this as needed)
-- For now, let's allow all authenticated users to manage opportunities
DROP POLICY IF EXISTS "Authenticated users can manage opportunities" ON opportunities;
CREATE POLICY "Authenticated users can manage opportunities" 
    ON opportunities FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Insert sample data
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
  '["React", "JavaScript", "CSS"]',
  'Work with our frontend team on real-time UI projects.',
  'https://tcs.com/apply',
  '2025-11-01 23:59:00+05:30'
),
(
  'Software Engineer',
  'Infosys',
  'https://infosys.com/logo.png',
  'full-time',
  'Chennai, India',
  'hybrid',
  '₹4.5 LPA',
  '0–2 years',
  '["Java", "Spring Boot", "MySQL"]',
  'Join our backend development team working on enterprise solutions.',
  'https://infosys.com/careers',
  '2025-12-15 23:59:00+05:30'
),
(
  'Frontend Developer Intern',
  'Flipkart',
  'https://flipkart.com/logo.png',
  'internship',
  'Bangalore, India',
  'onsite',
  '₹15,000/month',
  '0–1 years',
  '["React", "TypeScript", "Redux", "CSS"]',
  'Work on user-facing features for our e-commerce platform.',
  'https://flipkart.com/careers',
  '2025-10-30 23:59:00+05:30'
),
(
  'Data Scientist',
  'Wipro',
  'https://wipro.com/logo.png',
  'full-time',
  'Hyderabad, India',
  'remote',
  '₹6 LPA',
  '1–3 years',
  '["Python", "Machine Learning", "SQL", "TensorFlow"]',
  'Analyze data and build ML models for business insights.',
  'https://wipro.com/careers',
  '2025-11-20 23:59:00+05:30'
),
(
  'Mobile App Developer',
  'Tech Mahindra',
  'https://techmahindra.com/logo.png',
  'full-time',
  'Pune, India',
  'hybrid',
  '₹5 LPA',
  '1–2 years',
  '["React Native", "Flutter", "Android", "iOS"]',
  'Develop cross-platform mobile applications.',
  'https://techmahindra.com/careers',
  '2025-12-01 23:59:00+05:30'
);

-- Add comments for documentation
COMMENT ON TABLE opportunities IS 'Job and internship opportunities for students';
COMMENT ON COLUMN opportunities.skills_required IS 'JSON array of required skills';
COMMENT ON COLUMN opportunities.employment_type IS 'Type of employment: internship, full-time, part-time, contract';
COMMENT ON COLUMN opportunities.mode IS 'Work mode: onsite, remote, hybrid';