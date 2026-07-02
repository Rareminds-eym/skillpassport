-- Create organization_email_templates table
-- Stores customized email templates for recruitment communications

CREATE TABLE IF NOT EXISTS organization_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_type TEXT NOT NULL CHECK (template_type IN ('invitation', 'role_change', 'welcome')),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one template per type per organization
    UNIQUE(organization_id, template_type)
);

-- Create index for faster lookups
CREATE INDEX idx_org_email_templates_org_id ON organization_email_templates(organization_id);
CREATE INDEX idx_org_email_templates_type ON organization_email_templates(template_type);

-- Enable RLS
ALTER TABLE organization_email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow organization admins to manage their templates
CREATE POLICY "Organization admins can view their email templates"
    ON organization_email_templates
    FOR SELECT
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization admins can insert their email templates"
    ON organization_email_templates
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization admins can update their email templates"
    ON organization_email_templates
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization admins can delete their email templates"
    ON organization_email_templates
    FOR DELETE
    USING (
        organization_id IN (
            SELECT om.organization_id 
            FROM organization_members om
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('owner', 'admin')
        )
    );

-- Add comment
COMMENT ON TABLE organization_email_templates IS 'Stores customized email templates for recruitment communications';
COMMENT ON COLUMN organization_email_templates.template_type IS 'Type of email template: invitation, role_change, or welcome';
COMMENT ON COLUMN organization_email_templates.subject IS 'Email subject line with variable placeholders like {{organization_name}}';
COMMENT ON COLUMN organization_email_templates.body IS 'Email body content with variable placeholders';
