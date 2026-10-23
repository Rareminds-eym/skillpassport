-- Rareminds opportunities imported from the client platform upload workbook.
-- Generated: 2026-10-22. 9 opportunities / 22 configured openings.
-- Organization: Rareminds. Assigned recruiter: Krishna (krishna@rareminds.in).
-- Source: Rareminds_Opportunities_Platform_Upload_Template 1.xlsx.
-- Semicolon-separated lists are stored as JSON arrays. No learner mappings.
-- Stable UUIDs match the reviewed seed. Existing IDs are preserved on rerun.
-- applications_count follows the existing import convention for openings.
-- No users, organizations, recruiters, memberships or applications are created.
-- Missing prerequisites: abort in production.

BEGIN;
SET LOCAL standard_conforming_strings = on;

DO $rareminds_opportunities$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.organizations o
        JOIN public.recruiters r ON r.id = '578fec10-6725-4713-bc36-e4e213c258c8'::uuid
        WHERE o.id = 'd0e361a8-c601-48b0-9ece-c8328f11e09d'::uuid
          AND public.is_org_member(r.user_id, o.id)
    ) THEN
        RAISE EXCEPTION 'Rareminds opportunities: organization, Krishna recruiter record, or active membership is missing. Apply recruitment prerequisites first.';
    END IF;

    INSERT INTO public.opportunities (
        id, organization_id, recruiter_id, title,
        job_title, company_name, department, employment_type,
        location, mode, description, skills_required,
        salary_range_min, salary_range_max, applications_count, deadline,
        status, is_active, application_link, experience_level,
        experience_required, requirements, responsibilities, benefits,
        company_logo, stipend_or_salary, sector
    ) VALUES
        -- MCA-001: QA / Software Test Engineer Trainee
        (
            '604a7360-0698-57c7-8b3a-8e2d5ea34618'::uuid,
            'd0e361a8-c601-48b0-9ece-c8328f11e09d'::uuid,
            '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
            'QA / Software Test Engineer Trainee',
            'QA / Software Test Engineer Trainee',
            'Rareminds',
            'Quality Assurance / Engineering',
            'Full-time',
            'Bengaluru, Karnataka',
            'On-site',
            'Ensure software quality using planned testing, defect reporting, API validation and introductory automation.
Experience category supplied: Fresher / Entry-level',
            '["SDLC/STLC, defect lifecycle, SQL, Postman, browser dev tools", "Selenium/Playwright, Python/Java, Git desirable."]'::jsonb,
            300000,
            600000,
            5,
            '2026-10-31T00:00:00+00:00'::timestamptz,
            'open',
            true,
            NULL,
            'Entry',
            'Fresher / 0–1 year',
            '["MCA fresher or up to 1 year", "practical registration-to-dashboard test assignment may be used."]'::jsonb,
            '["Create test cases", "set up test data", "execute smoke, functional and regression tests", "log reproducible defects", "test APIs with Postman and SQL", "assist with automation."]'::jsonb,
            '["As per Role & Performance"]'::jsonb,
            NULL,
            'Salary',
            'Learning and workforce transformation / EdTech'
        ),
        -- MCA-002: Software Developer Trainee
        (
            'ae3d4965-0a92-58d7-ac8b-daf0468a49e8'::uuid,
            'd0e361a8-c601-48b0-9ece-c8328f11e09d'::uuid,
            '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
            'Software Developer Trainee',
            'Software Developer Trainee',
            'Rareminds',
            'Engineering / Product Development',
            'Full-time',
            'Bengaluru, Karnataka',
            'On-site',
            'Build, test and maintain application features under senior-engineer supervision.
Experience category supplied: Fresher / Entry-level',
            '["Java/Python/JavaScript/C#, OOP, data structures, SQL, Git, HTTP/APIs", "Spring Boot/FastAPI/Node/.NET advantageous."]'::jsonb,
            300000,
            600000,
            2,
            '2026-10-31T00:00:00+00:00'::timestamptz,
            'open',
            true,
            NULL,
            'Entry',
            'Fresher / 0–1 year',
            '["MCA fresher or up to 1 year", "student task-management CRUD API exercise."]'::jsonb,
            '["Develop features and REST endpoints", "write unit tests/docs", "model relational data", "use Git and PRs", "debug and fix defects."]'::jsonb,
            '["As per Role & Performance"]'::jsonb,
            NULL,
            'Salary',
            'Learning and workforce transformation / EdTech'
        ),
        -- MCA-003: Full Stack Developer Trainee
        (
            '8df6e126-d39a-5b02-88ab-05ce6d654d94'::uuid,
            'd0e361a8-c601-48b0-9ece-c8328f11e09d'::uuid,
            '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
            'Full Stack Developer Trainee',
            'Full Stack Developer Trainee',
            'Rareminds',
            'Engineering / Product Development',
            'Full-time',
            'Bengaluru, Karnataka',
            'On-site',
            'Develop responsive user-facing journeys and integrated backend services.
Experience category supplied: Fresher / Entry-level',
            '["HTML, CSS, JavaScript, React or similar, Node/Python/Java, SQL, REST APIs, Git", "TypeScript and accessibility desirable."]'::jsonb,
            300000,
            600000,
            3,
            '2026-10-31T00:00:00+00:00'::timestamptz,
            'open',
            true,
            NULL,
            'Entry',
            'Fresher / 0–1 year',
            '["MCA fresher or up to 1 year", "learner dashboard with backend progress exercise."]'::jsonb,
            '["Build UI components", "connect forms and dashboards to APIs", "implement validation and error handling", "manage database access", "debug and review code."]'::jsonb,
            '["As per Role & Performance"]'::jsonb,
            NULL,
            'Salary',
            'Learning and workforce transformation / EdTech'
        ),
        -- MCA-004: IT Support & Junior DevOps Trainee
        (
            '98ed1b2b-f668-558b-87e1-32cc20b68656'::uuid,
            'd0e361a8-c601-48b0-9ece-c8328f11e09d'::uuid,
            '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
            'IT Support & Junior DevOps Trainee',
            'IT Support & Junior DevOps Trainee',
            'Rareminds',
            'Technology Operations / Engineering',
            'Full-time',
            'Bengaluru, Karnataka',
            'On-site',
            'Support reliable and secure development environments, internal IT and deployment workflows.
Experience category supplied: Fresher / Entry-level',
            '["Windows/Linux, networks, DNS/HTTP, Bash/Python basics, Git, troubleshooting", "Docker, CI and cloud exposure desirable."]'::jsonb,
            300000,
            600000,
            2,
            '2026-10-31T00:00:00+00:00'::timestamptz,
            'open',
            true,
            NULL,
            'Entry',
            'Fresher / 0–1 year',
            '["MCA fresher or up to 1 year", "sample application setup and troubleshooting exercise."]'::jsonb,
            '["Configure machines/access", "resolve tickets", "inspect Linux logs", "verify backups", "assist with CI/CD", "maintain asset and incident documentation."]'::jsonb,
            '["As per Role & Performance"]'::jsonb,
            NULL,
            'Salary',
            'Learning and workforce transformation / EdTech'
        ),
        -- MBA-001: Visual Content & Marketing Associate
        (
            '62ff6021-cd65-58a3-92dd-2b5510b014c2'::uuid,
            'd0e361a8-c601-48b0-9ece-c8328f11e09d'::uuid,
            '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
            'Visual Content & Marketing Associate',
            'Visual Content & Marketing Associate',
            'Rareminds',
            'Creative & Digital Marketing',
            'Full-time',
            'Bengaluru, Karnataka',
            'On-site',
            'Produce consistent visual content supporting campaigns, events and sales enablement.
Experience category supplied: Fresher to 2 years',
            '["Graphic design, typography, Canva/Photoshop/Illustrator/Figma, video editing, campaign awareness, proofreading."]'::jsonb,
            300000,
            600000,
            2,
            '2026-10-31T00:00:00+00:00'::timestamptz,
            'open',
            true,
            NULL,
            'Entry',
            'Fresher–2 years',
            '["Any graduate or relevant qualification", "practical design portfolio essential", "graphics/marketing/content experience 0–2 years."]'::jsonb,
            '["Design posts/carousels/banners", "adapt channel formats", "edit reels", "develop templates", "coordinate campaign assets", "review creative metrics."]'::jsonb,
            '["As per Role & Performance"]'::jsonb,
            NULL,
            'Salary',
            'Learning and workforce transformation / EdTech'
        ),
        -- MBA-002: Digital Growth & Engagement Associate
        (
            'c835475b-55a7-51e0-a1c8-b116db8a0be7'::uuid,
            'd0e361a8-c601-48b0-9ece-c8328f11e09d'::uuid,
            '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
            'Digital Growth & Engagement Associate',
            'Digital Growth & Engagement Associate',
            'Rareminds',
            'Digital Marketing & Growth',
            'Full-time',
            'Bengaluru, Karnataka',
            'On-site',
            'Grow digital communities, organic reach and measurable enquiries through content experimentation.
Experience category supplied: Fresher to 2 years',
            '["Instagram/YouTube/LinkedIn, video editing, copywriting, storytelling, audience analytics, trend recognition, communication."]'::jsonb,
            300000,
            600000,
            1,
            '2026-10-31T00:00:00+00:00'::timestamptz,
            'open',
            true,
            NULL,
            'Entry',
            'Fresher–2 years',
            '["Any graduate with digital content interest", "active portfolio/social media examples preferred", "internships optional."]'::jsonb,
            '["Create reels/shorts", "write hooks", "engage communities", "support campaigns and lead generation", "track reach, watch time, clicks and conversions", "report weekly."]'::jsonb,
            '["As per Role & Performance"]'::jsonb,
            NULL,
            'Salary',
            'Learning and workforce transformation / EdTech'
        ),
        -- MBA-003: Corporate Field Sales Executive
        (
            'dad690b6-32e8-53f5-a9aa-b7efb1a518d3'::uuid,
            'd0e361a8-c601-48b0-9ece-c8328f11e09d'::uuid,
            '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
            'Corporate Field Sales Executive',
            'Corporate Field Sales Executive',
            'Rareminds',
            'Corporate Sales & Partnerships',
            'Full-time',
            'Bengaluru, Karnataka',
            'On-site',
            'Own corporate business development from prospecting to proposals, negotiation and collections coordination.
Work arrangement: Field-based; office reporting as required
Experience category supplied: Fresher to 4 years',
            '["Consultative selling, corporate prospecting, CRM, Excel, proposals, English communication", "Kannada desirable."]'::jsonb,
            300000,
            600000,
            3,
            '2026-10-31T00:00:00+00:00'::timestamptz,
            'open',
            true,
            NULL,
            'Entry',
            '0–4 years; high-potential freshers considered',
            '["Experience in B2B field sales or adjacent sectors preferred", "ability to travel locally and conduct corporate meetings."]'::jsonb,
            '["Identify stakeholders", "conduct field visits", "discover needs", "coordinate demos", "write proposals", "advance CRM opportunities", "forecast pipeline", "support collections."]'::jsonb,
            '["As per Role & Performance"]'::jsonb,
            NULL,
            'Salary',
            'Learning and workforce transformation / EdTech'
        ),
        -- MBA-004: HR, Administration & People Analytics Executive
        (
            '04bc9a96-0a1e-538f-8052-a06760b957de'::uuid,
            'd0e361a8-c601-48b0-9ece-c8328f11e09d'::uuid,
            '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
            'HR, Administration & People Analytics Executive',
            'HR, Administration & People Analytics Executive',
            'Rareminds',
            'HR / Administration / People Analytics',
            'Full-time',
            'Bengaluru, Karnataka',
            'On-site',
            'Run HR operations, recruitment, HR analytics and office administration with accurate records and management MIS.
Experience category supplied: Fresher to 2 years',
            '["Excel/Sheets pivots/lookups, Zoho People/HRMS, payroll inputs, HR MIS, documentation, confidentiality."]'::jsonb,
            25000,
            30000,
            2,
            '2026-10-31T00:00:00+00:00'::timestamptz,
            'open',
            true,
            NULL,
            'Entry',
            'Fresher–2 years',
            '["MBA/PGDM HR", "strong analytical orientation preferred", "fresher to 2 years."]'::jsonb,
            '["Coordinate recruitment/onboarding", "maintain Zoho People records", "reconcile attendance/payroll", "prepare HR dashboards", "manage assets and vendors."]'::jsonb,
            '["As per Role & Performance"]'::jsonb,
            NULL,
            'Salary',
            'Learning and workforce transformation / EdTech'
        ),
        -- MBA-005: Finance & Accounts Executive
        (
            '810c8a50-0984-54ea-b252-366246e94bcb'::uuid,
            'd0e361a8-c601-48b0-9ece-c8328f11e09d'::uuid,
            '578fec10-6725-4713-bc36-e4e213c258c8'::uuid,
            'Finance & Accounts Executive',
            'Finance & Accounts Executive',
            'Rareminds',
            'Finance & Accounts',
            'Full-time',
            'Bengaluru, Karnataka',
            'On-site',
            'Manage billing, receivables/payables, reconciliations, financial MIS and cash-flow visibility.
Experience category supplied: Fresher to 2 years',
            '["Accounting, P&L/BS/CF, Excel/Sheets lookups/pivots, Zoho Books/Tally, GST/TDS, reconciliation and analysis."]'::jsonb,
            28000,
            32000,
            2,
            '2026-10-31T00:00:00+00:00'::timestamptz,
            'open',
            true,
            NULL,
            'Entry',
            'Fresher–2 years',
            '["MBA/PGDM Finance", "B.Com + MBA Finance preferred", "fresher to 2 years."]'::jsonb,
            '["Issue invoices", "monitor collections", "reconcile ledgers/banks", "track vendor payments", "prepare MIS and cash forecasts", "support payroll, GST/TDS and audits."]'::jsonb,
            '["As per Role & Performance"]'::jsonb,
            NULL,
            'Salary',
            'Learning and workforce transformation / EdTech'
        )
    ON CONFLICT (id) DO NOTHING;
END;
$rareminds_opportunities$;

COMMIT;
