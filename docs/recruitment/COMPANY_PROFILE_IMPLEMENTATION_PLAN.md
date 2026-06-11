# Company Profile Implementation Plan

## Overview
Comprehensive company profile management system with verification, contacts, recruitment configuration, and billing.

---

## Database Schema (✅ Created)

### Tables Created:
1. **Extended `organizations` table** - Company profile fields
2. **`company_verification`** - Legal documents and verification
3. **`company_contacts`** - Contact information
4. **`recruitment_configuration`** - Hiring workflows and preferences
5. **`offer_letter_templates`** - Customizable templates
6. **`company_subscription_details`** - Billing information

**Migration File**: `supabase/migrations/20260603_add_company_profile_tables.sql`

---

## Implementation Phases

### Phase 1: Backend APIs ✅ COMPLETE

#### 1.1 Company Profile API ✅
**File**: `functions/api/recruitment/organization/profile.ts`

- ✅ GET /api/recruitment/organization/profile - Fetch complete company profile with completion percentage
- ✅ PUT /api/recruitment/organization/profile - Update company profile fields

#### 1.2 Company Verification API ✅
**File**: `functions/api/recruitment/organization/verification.ts`

- ✅ GET /api/recruitment/organization/verification - Fetch verification details and documents
- ✅ PUT /api/recruitment/organization/verification - Update verification details
- ✅ POST /api/recruitment/organization/verification/submit - Submit for verification review
- ✅ POST /api/recruitment/organization/verification/verify-domain - Initiate domain verification

#### 1.3 Company Contacts API ✅
**File**: `functions/api/recruitment/organization/contacts.ts`

- ✅ GET /api/recruitment/organization/contacts - Fetch contact information
- ✅ PUT /api/recruitment/organization/contacts - Update contact information with validation

#### 1.4 Recruitment Configuration API ✅
**File**: `functions/api/recruitment/organization/config.ts`

- ✅ GET /api/recruitment/organization/config - Fetch config with defaults
- ✅ PUT /api/recruitment/organization/config - Update workflows, interview stages, preferences

#### 1.5 Offer Letter Templates API ✅
**File**: `functions/api/recruitment/organization/offer-templates.ts`

- ✅ GET /api/recruitment/organization/offer-templates - Fetch all or specific template
- ✅ POST /api/recruitment/organization/offer-templates - Create new template
- ✅ PUT /api/recruitment/organization/offer-templates - Update existing template
- ✅ DELETE /api/recruitment/organization/offer-templates - Delete template (with default protection)

#### 1.6 Billing API ✅
**File**: `functions/api/recruitment/organization/billing.ts`

- ✅ GET /api/recruitment/organization/billing - Fetch billing info (admin-only)
- ✅ PUT /api/recruitment/organization/billing - Update billing info (admin-only)
- ✅ POST /api/recruitment/organization/billing/generate-invoice - Placeholder for future

#### 1.7 Document Upload API ✅
**File**: `functions/api/recruitment/organization/upload-document.ts`

- ✅ POST /api/recruitment/organization/upload-document - Upload verification documents
- ✅ DELETE /api/recruitment/organization/upload-document - Remove uploaded documents
- ✅ File type and size validation included

---

### Phase 2: Frontend Services ✅ COMPLETE

#### 2.1 Organization Service ✅
**File**: `src/entities/recruitment/api/organizationService.ts`

- ✅ Profile management (getOrganizationProfile, updateOrganizationProfile)
- ✅ Verification management (get, update, submit, verifyDomain)
- ✅ Contacts management (get, update)
- ✅ Configuration management (get, update)
- ✅ Offer templates CRUD (get, create, update, delete)
- ✅ Billing management (get, update - admin-only)
- ✅ Document upload/delete with FormData support

#### 2.2 React Query Hooks ✅
**File**: `src/entities/recruitment/model/useOrganizationProfile.ts`

- ✅ useOrganizationProfile - Fetch profile with completion percentage
- ✅ useUpdateOrganizationProfile - Update profile mutation
- ✅ useCompanyVerification - Fetch verification data
- ✅ useUpdateCompanyVerification - Update verification mutation
- ✅ useSubmitVerification - Submit for review
- ✅ useVerifyDomain - Domain verification
- ✅ useCompanyContacts - Fetch contacts
- ✅ useUpdateCompanyContacts - Update contacts mutation
- ✅ useRecruitmentConfiguration - Fetch config
- ✅ useUpdateRecruitmentConfiguration - Update config mutation
- ✅ useOfferTemplates - Fetch all templates
- ✅ useOfferTemplate - Fetch single template
- ✅ useCreateOfferTemplate - Create template mutation
- ✅ useUpdateOfferTemplate - Update template mutation
- ✅ useDeleteOfferTemplate - Delete template mutation
- ✅ useBillingInformation - Fetch billing (admin-only)
- ✅ useUpdateBillingInformation - Update billing mutation
- ✅ useUploadDocument - Document upload mutation
- ✅ useDeleteDocument - Document delete mutation

#### 2.3 Query Keys ✅
- ✅ Added organization query keys to `src/shared/lib/queryKeys/recruitment.ts`
- ✅ Exported all hooks and services from `src/entities/recruitment/index.ts`

---

### Phase 3: UI Components ✅ COMPLETE

#### 3.1 Enhanced OrgSettings Component ✅ COMPLETE
**File**: `src/features/org-recruitment/ui/OrgSettings.tsx`

- ✅ Updated to support 6 tabs (Company Profile, Verification, Contacts, Configuration, Offer Templates, Billing)
- ✅ Admin-only tab filtering for Billing
- ✅ Responsive tab navigation
- ✅ All tabs integrated and functional

#### 3.2 Tab Components ✅ COMPLETE

**All Tabs Implemented:**
- ✅ **CompanyProfileTab** - Basic company info, logo upload, headquarters location, profile completion
- ✅ **CompanyVerificationTab** - Registration details, document uploads, domain verification, status badges
- ✅ **CompanyContactsTab** - Official email, company phone, HR contact phone, support email with validation
- ✅ **RecruitmentConfigurationTab** - Hiring workflow builder, interview stages manager, career page settings, job posting preferences
- ✅ **OfferTemplatesTab** - CRUD for offer letter templates with variables, default template management, modal editor
- ✅ **BillingTab** - Billing contact, invoice address, payment method, GST number (admin-only)

#### 3.2 New UI Components

##### CompanyProfileForm.tsx
```typescript
// Form for company basic information
// Fields: legal_name, display_name, description, etc.
```

##### CompanyVerificationForm.tsx
```typescript
// Verification details and document uploads
// Status indicators, document previews
```

##### DocumentUploadCard.tsx
```typescript
// Reusable document upload component
// Preview, delete, re-upload
```

##### HiringWorkflowBuilder.tsx
```typescript
// Visual workflow stage builder
// Drag-and-drop stages
// Stage configuration modal
```

##### InterviewStageManager.tsx
```typescript
// Manage interview stages
// Add/edit/delete stages
// Set duration, questions
```

##### OfferLetterTemplateEditor.tsx
```typescript
// Rich text editor for offer letters
// Variable insertion ({{candidate_name}}, {{position}}, etc.)
// Template preview
```

##### BillingInformationForm.tsx
```typescript
// Billing contact and address
// Payment method selection
// Admin-only access
```

#### 3.3 Shared UI Components

##### StatusBadge.tsx
```typescript
// Verification status badges
// Colors: pending, in_review, verified, rejected
```

##### InfoCard.tsx
```typescript
// Reusable info card with icon
// Used across all tabs
```

---

### Phase 4: Document Management (Priority: MEDIUM)

#### 4.1 Supabase Storage Buckets
Create buckets:
- `company-documents` - Verification documents
- `offer-letter-templates` - Template files
- `organization-logos` - Company logos (existing)

#### 4.2 Document Service
**File**: `src/shared/api/documentService.ts`

```typescript
export const uploadDocument = async (file: File, bucket: string, path: string) => { ... }
export const deleteDocument = async (bucket: string, path: string) => { ... }
export const getDocumentUrl = (bucket: string, path: string) => { ... }
```

---

### Phase 5: Validation & Security (Priority: HIGH)

#### 5.1 Input Validation
- Zod schemas for all forms
- File type/size validation
- Required field validation

#### 5.2 Role-Based Access
- **Admin-only**: Verification, Billing
- **Admin & Recruiter**: View company profile
- **RLS policies**: Already implemented in migration

#### 5.3 Document Security
- Signed URLs for document access
- Expiry on document URLs
- Virus scanning (optional)

---

## Implementation Order

### Week 1: Foundation
1. ✅ Run migration to create tables
2. Create backend APIs (profile, verification, contacts)
3. Create frontend services
4. Create React Query hooks

### Week 2: Basic UI
1. Enhance OrgSettings with new tabs
2. Build CompanyProfileForm
3. Build CompanyVerificationForm
4. Build ContactInformationForm

### Week 3: Advanced Features
1. Build HiringWorkflowBuilder
2. Build InterviewStageManager
3. Build OfferLetterTemplateEditor
4. Integrate document uploads

### Week 4: Polish & Testing
1. Build BillingInformationForm
2. Add validation & error handling
3. Test all flows
4. Add loading states & animations

---

## Testing Checklist

### Backend
- [ ] Profile CRUD operations
- [ ] Document upload/delete
- [ ] Verification status updates
- [ ] RLS policies working correctly
- [ ] Admin-only access enforced

### Frontend
- [ ] All forms submit correctly
- [ ] Documents upload successfully
- [ ] Real-time updates working
- [ ] Error handling graceful
- [ ] Loading states smooth
- [ ] Responsive on mobile

### Integration
- [ ] Org context provides correct data
- [ ] Members see correct permissions
- [ ] Verification workflow works
- [ ] Templates save and load correctly
- [ ] Billing updates persist

---

## Sample Data Structure

### Organization Profile
```json
{
  "id": "uuid",
  "legal_name": "TechCorp Private Limited",
  "display_name": "TechCorp",
  "description": "Leading tech company...",
  "industry": "Technology",
  "company_size": "51-200",
  "founded_year": 2015,
  "website_url": "https://techcorp.com",
  "headquarters_address": "123 Tech Street",
  "headquarters_country": "India",
  "headquarters_state": "Karnataka",
  "headquarters_city": "Bangalore",
  "logo_url": "https://..."
}
```

### Company Verification
```json
{
  "organization_id": "uuid",
  "registration_number": "U12345KA2015PTC123456",
  "gst_number": "29AAACT1234A1Z5",
  "tax_identification_number": "AAACT1234A",
  "incorporation_date": "2015-01-15",
  "registration_certificate_url": "https://...",
  "gst_certificate_url": "https://...",
  "business_license_url": "https://...",
  "verification_status": "verified",
  "verification_notes": "All documents verified",
  "verified_at": "2024-02-01T10:00:00Z",
  "domain_verification_status": "verified",
  "verified_domain": "techcorp.com"
}
```

### Recruitment Configuration
```json
{
  "organization_id": "uuid",
  "default_hiring_workflow": [
    {"stage": "application", "name": "Application", "order": 1},
    {"stage": "screening", "name": "Screening", "order": 2},
    {"stage": "interview", "name": "Interview", "order": 3},
    {"stage": "offer", "name": "Offer", "order": 4},
    {"stage": "hired", "name": "Hired", "order": 5}
  ],
  "interview_stages": [
    {"id": "phone_screen", "name": "Phone Screening", "duration": 30},
    {"id": "technical", "name": "Technical Interview", "duration": 60}
  ],
  "career_page_url": "https://techcorp.com/careers",
  "career_page_enabled": true,
  "job_posting_preferences": {
    "auto_post_to_career_page": true,
    "require_cover_letter": false
  }
}
```

---

## Email Template Enhancement

### Existing Templates (Already in DB)
From `EmailTemplateSettings.tsx`:
- Interview Invitation
- Rejection Email
- Offer Letter Email
- Welcome Email
- Application Received
- Interview Reminder

### Enhancements Needed
1. **Organization Branding**
   - Add company logo to emails
   - Use company colors
   - Include company signature

2. **Variable System**
   - {{candidate_name}}
   - {{position_title}}
   - {{interview_date}}
   - {{company_name}}
   - {{recruiter_name}}

3. **Template Preview**
   - Live preview with sample data
   - Mobile preview
   - Send test email

4. **Version Control**
   - Template history
   - Revert to previous version
   - A/B testing

---

## Next Steps

1. **Run the migration**:
   ```bash
   supabase migration up
   ```

2. **Start with Backend APIs** (Phase 1)
   - Create organization profile endpoints
   - Test with Postman/Thunder Client

3. **Build Frontend Services** (Phase 2)
   - Create service functions
   - Add React Query hooks

4. **Implement UI Components** (Phase 3)
   - Start with CompanyProfileForm
   - Add tabs to OrgSettings

5. **Test End-to-End**
   - Create test organization
   - Fill all profile sections
   - Submit for verification

---

## Questions to Answer

1. **Verification Process**:
   - Who reviews verification submissions?
   - Auto-verify or manual review?
   - Verification SLA (how long)?

2. **Domain Verification**:
   - DNS-based or email-based?
   - Auto-verify corporate email domains?

3. **Billing Integration**:
   - Payment gateway (Razorpay/Stripe)?
   - Automatic billing or manual?
   - Invoice generation?

4. **Templates**:
   - Allow custom HTML in templates?
   - Rich text editor (Quill/TipTap)?
   - Template marketplace?

5. **Career Page**:
   - Hosted on our platform or external link?
   - Custom domain support?
   - Public API for job listings?

---

## Dependencies

- Supabase (Database & Storage)
- React Query (Data fetching)
- React Hook Form (Form management)
- Zod (Validation)
- TailwindCSS (Styling)
- Heroicons (Icons)
- React Router (Navigation)

**Optional**:
- TipTap/Quill (Rich text editor)
- React DnD (Drag and drop for workflows)
- React PDF (PDF generation for documents)
- Chart.js (Analytics for recruitment metrics)

---

## Success Metrics

- **Completion Rate**: % of orgs with complete profiles
- **Verification Rate**: % of orgs verified
- **Time to Verify**: Average days to verification
- **Template Usage**: % of orgs using custom templates
- **Document Upload Success**: % successful uploads

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Large file uploads fail | Chunked uploads, retry logic |
| Document security breach | Signed URLs, virus scanning |
| Complex workflow builder | Start simple, iterate based on feedback |
| Template editor bugs | Use battle-tested library (TipTap) |
| Slow verification process | Automated checks, clear SLA |

---

**Status**: Ready for implementation
**Last Updated**: 2026-06-03
**Next Review**: After Phase 1 completion
