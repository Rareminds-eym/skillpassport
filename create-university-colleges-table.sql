-- Create university_colleges table to map colleges to universities
-- This table establishes the relationship between universities and their affiliated colleges


-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_univ_colleges_university 
ON public.university_colleges USING btree (university_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_univ_colleges_college 
ON public.university_colleges USING btree (college_id) TABLESPACE pg_default;

-- Create trigger for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for university_colleges table
DROP TRIGGER IF EXISTS update_university_colleges_updated_at ON university_colleges;
CREATE TRIGGER update_university_colleges_updated_at 
    BEFORE UPDATE ON university_colleges 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE university_colleges ENABLE ROW LEVEL SECURITY;

-- Policy for university admins to see their colleges
CREATE POLICY "University admins can view their colleges" ON university_colleges
    FOR SELECT USING (
        university_id IN (
            SELECT organizationId FROM users WHERE id = auth.uid()
        )
    );

-- Policy for university admins to insert colleges
CREATE POLICY "University admins can insert colleges" ON university_colleges
    FOR INSERT WITH CHECK (
        university_id IN (
            SELECT organizationId FROM users WHERE id = auth.uid()
        )
    );

-- Policy for university admins to update their colleges
CREATE POLICY "University admins can update their colleges" ON university_colleges
    FOR UPDATE USING (
        university_id IN (
            SELECT organizationId FROM users WHERE id = auth.uid()
        )
    );

-- Policy for university admins to delete their colleges
CREATE POLICY "University admins can delete their colleges" ON university_colleges
    FOR DELETE USING (
        university_id IN (
            SELECT organizationId FROM users WHERE id = auth.uid()
        )
    );

-- Insert sample data from existing organizations table
-- This will populate the university_colleges table with existing college data
INSERT INTO university_colleges (university_id, college_id, name, code, dean_email, dean_phone, account_status, created_by, metadata)
SELECT 
    -- For now, we'll need to manually set a university_id or create a mapping
    -- This is a placeholder - you'll need to update with actual university IDs
    (SELECT id FROM organizations WHERE organization_type = 'university' LIMIT 1) as university_id,
    id as college_id, -- Reference to the original organization
    name,
    COALESCE(code, UPPER(LEFT(REPLACE(name, ' ', ''), 6))) as code, -- Generate code if not exists
    email as dean_email,
    phone as dean_phone,
    CASE 
        WHEN approval_status = 'approved' THEN 'active'
        WHEN approval_status = 'pending' THEN 'pending'
        ELSE 'inactive'
    END as account_status,
    admin_id as created_by,
    jsonb_build_object(
        'city', city,
        'state', state,
        'address', address,
        'website', website,
        'description', description,
        'admin_id', admin_id,
        'approval_status', approval_status
    ) as metadata
FROM organizations 
WHERE organization_type = 'college'
ON CONFLICT (university_id, code) DO NOTHING;

COMMENT ON TABLE university_colleges IS 'Maps colleges to their parent universities in the university-college hierarchy';
COMMENT ON COLUMN university_colleges.university_id IS 'References the parent university organization';
COMMENT ON COLUMN university_colleges.college_id IS 'References the original college organization';
COMMENT ON COLUMN university_colleges.code IS 'Unique college code within the university';
COMMENT ON COLUMN university_colleges.metadata IS 'Additional college information from the original organization';