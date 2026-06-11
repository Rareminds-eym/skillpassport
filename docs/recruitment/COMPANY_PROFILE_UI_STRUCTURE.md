# Company Profile UI Structure

## Organization Settings Page Structure

```
/recruitment/settings
│
├── Tab 1: Company Profile ⭐ NEW
│   ├── Legal Company Name
│   ├── Display/Brand Name
│   ├── Company Description (textarea)
│   ├── Industry (dropdown)
│   ├── Company Size (dropdown)
│   ├── Founded Year (number input)
│   ├── Company Website (URL)
│   └── Headquarters
│       ├── Address (textarea)
│       ├── Country (dropdown)
│       ├── State (dropdown)
│       └── City (dropdown)
│
├── Tab 2: Company Verification ⭐ NEW
│   ├── Registration Details
│   │   ├── Company Registration Number (CIN)
│   │   ├── GST Number (optional)
│   │   ├── Tax Identification Number
│   │   └── Incorporation Date (date picker)
│   │
│   ├── Document Uploads
│   │   ├── Registration Certificate (PDF/Image)
│   │   ├── GST Certificate (PDF/Image)
│   │   └── Business License (PDF/Image)
│   │
│   ├── Verification Status
│   │   ├── Status Badge (Pending/In Review/Verified/Rejected)
│   │   ├── Verification Notes (readonly)
│   │   └── Submit for Verification Button
│   │
│   └── Domain Verification
│       ├── Domain Input
│       ├── Verification Token (readonly)
│       ├── DNS Instructions
│       └── Verify Domain Button
│
├── Tab 3: Contact Information ⭐ NEW
│   ├── Official Company Email
│   ├── Company Phone Number
│   ├── HR Contact Number
│   └── General Support Email
│
├── Tab 4: Recruitment Configuration ⭐ NEW
│   ├── Default Hiring Workflow
│   │   └── Workflow Builder (Drag & Drop)
│   │       - Application → Screening → Interview → Offer → Hired
│   │
│   ├── Interview Stages
│   │   └── Stage Manager
│   │       - Add/Edit/Delete Stages
│   │       - Set Duration
│   │       - Configure Questions
│   │
│   ├── Career Page Settings
│   │   ├── Career Page URL
│   │   └── Enable Career Page Toggle
│   │
│   └── Job Posting Preferences
│       ├── Auto-publish to Career Page (toggle)
│       ├── Require Cover Letter (toggle)
│       └── Application Questions Enabled (toggle)
│
├── Tab 5: Offer Letter Templates ⭐ NEW
│   ├── Template List
│   │   └── For each template:
│   │       - Template Name
│   │       - Is Default Badge
│   │       - Edit/Delete Actions
│   │
│   ├── Create Template Button
│   │
│   └── Template Editor Modal
│       ├── Template Name
│       ├── Rich Text Editor
│       ├── Available Variables Panel
│       │   - {{candidate_name}}
│       │   - {{position_title}}
│       │   - {{salary}}
│       │   - {{start_date}}
│       │   - {{company_name}}
│       └── Preview Pane
│
├── Tab 6: Email Templates 🔧 ENHANCE EXISTING
│   ├── Template Categories
│   │   - Interview Invitation
│   │   - Rejection Email
│   │   - Offer Letter Email
│   │   - Welcome Email
│   │   - Application Received
│   │   - Interview Reminder
│   │
│   ├── Enhancements:
│   │   ├── Add Company Logo
│   │   ├── Brand Colors
│   │   ├── Email Signature
│   │   └── Variable System
│   │
│   └── Preview & Test
│       ├── Live Preview
│       ├── Mobile Preview
│       └── Send Test Email
│
└── Tab 7: Billing & Subscription ⭐ NEW (Admin Only)
    ├── Current Plan
    │   └── Plan details (from existing subscription)
    │
    ├── Billing Contact
    │   ├── Contact Name
    │   ├── Contact Email
    │   └── Contact Phone
    │
    ├── Invoice Address
    │   ├── Address (textarea)
    │   ├── Country
    │   ├── State
    │   ├── City
    │   └── Postal Code
    │
    └── Payment Details
        ├── Payment Method (Card/Bank/UPI)
        ├── Payment Token (masked)
        └── Update Payment Method Button
```

---

## Component Hierarchy

```
AdminDashboard
└── OrgSettings
    ├── TabNavigation
    │   └── Tab[]
    │
    ├── CompanyProfileTab
    │   ├── InfoCard (Basic Info)
    │   ├── InfoCard (Industry & Size)
    │   └── InfoCard (Headquarters)
    │
    ├── CompanyVerificationTab
    │   ├── InfoCard (Registration Details)
    │   ├── DocumentUploadCard[]
    │   ├── VerificationStatusCard
    │   └── DomainVerificationCard
    │
    ├── ContactInformationTab
    │   └── InfoCard (All Contacts)
    │
    ├── RecruitmentConfigTab
    │   ├── HiringWorkflowBuilder
    │   ├── InterviewStageManager
    │   ├── CareerPageSettings
    │   └── JobPostingPreferences
    │
    ├── OfferLetterTemplatesTab
    │   ├── TemplateList
    │   ├── TemplateCard[]
    │   └── TemplateEditorModal
    │       ├── RichTextEditor
    │       ├── VariablesPanel
    │       └── PreviewPane
    │
    ├── EmailTemplatesTab (Existing - Enhanced)
    │   ├── TemplateSelector
    │   ├── TemplateEditor
    │   ├── BrandingSettings
    │   └── PreviewPanel
    │
    └── BillingTab (Admin Only)
        ├── CurrentPlanCard
        ├── BillingContactForm
        ├── InvoiceAddressForm
        └── PaymentMethodCard
```

---

## Reusable Components to Build

### 1. InfoCard
```tsx
<InfoCard
  icon={BuildingOfficeIcon}
  title="Basic Information"
  description="Company legal and display names"
>
  <FormFields />
</InfoCard>
```

### 2. DocumentUploadCard
```tsx
<DocumentUploadCard
  title="Registration Certificate"
  accept="application/pdf,image/*"
  maxSize={5 * 1024 * 1024} // 5MB
  currentUrl={doc.url}
  onUpload={handleUpload}
  onDelete={handleDelete}
  status="uploaded" | "uploading" | "empty"
/>
```

### 3. StatusBadge
```tsx
<StatusBadge 
  status="verified" | "pending" | "in_review" | "rejected"
  size="sm" | "md" | "lg"
/>
```

### 4. VerificationStatusCard
```tsx
<VerificationStatusCard
  status="verified"
  verifiedAt="2024-02-01"
  verificationNotes="All documents verified"
  onSubmit={handleSubmitForVerification}
/>
```

### 5. HiringWorkflowBuilder
```tsx
<HiringWorkflowBuilder
  workflow={currentWorkflow}
  onChange={handleWorkflowChange}
  onSave={handleSave}
/>
```

### 6. InterviewStageManager
```tsx
<InterviewStageManager
  stages={interviewStages}
  onAdd={handleAddStage}
  onEdit={handleEditStage}
  onDelete={handleDeleteStage}
/>
```

### 7. TemplateEditorModal
```tsx
<TemplateEditorModal
  isOpen={isOpen}
  onClose={handleClose}
  template={currentTemplate}
  onSave={handleSaveTemplate}
  availableVariables={variables}
/>
```

### 8. RichTextEditor
```tsx
<RichTextEditor
  content={templateContent}
  onChange={handleContentChange}
  variables={availableVariables}
  onInsertVariable={handleInsertVariable}
/>
```

---

## Form Validation Rules

### Company Profile
- **Legal Name**: Required, 3-255 characters
- **Display Name**: Required, 3-100 characters
- **Industry**: Required, from enum
- **Company Size**: Required, from enum
- **Founded Year**: Optional, 1800-current year
- **Website**: Optional, valid URL
- **Headquarters Country**: Required
- **Headquarters State**: Required
- **Headquarters City**: Required

### Company Verification
- **Registration Number**: Required, alphanumeric
- **GST Number**: Optional, format: 29AAACT1234A1Z5
- **TIN**: Required for tax purposes
- **Incorporation Date**: Required, past date
- **Documents**: Each PDF/Image, max 5MB

### Contact Information
- **Official Email**: Required, valid email
- **Company Phone**: Required, valid phone
- **HR Contact**: Optional, valid phone
- **Support Email**: Optional, valid email

### Templates
- **Template Name**: Required, 3-100 characters
- **Template Content**: Required, min 50 characters
- **Variables**: Must be in format {{variable_name}}

---

## API Endpoints Needed

```typescript
// Company Profile
GET    /api/recruitment/organization/profile?org_id={id}
PUT    /api/recruitment/organization/profile

// Verification
GET    /api/recruitment/organization/verification?org_id={id}
PUT    /api/recruitment/organization/verification
POST   /api/recruitment/organization/verification/submit
POST   /api/recruitment/organization/verification/upload-document

// Contacts
GET    /api/recruitment/organization/contacts?org_id={id}
PUT    /api/recruitment/organization/contacts

// Recruitment Config
GET    /api/recruitment/organization/config?org_id={id}
PUT    /api/recruitment/organization/config

// Offer Templates
GET    /api/recruitment/organization/offer-templates?org_id={id}
POST   /api/recruitment/organization/offer-templates
PUT    /api/recruitment/organization/offer-templates/:id
DELETE /api/recruitment/organization/offer-templates/:id

// Billing (Admin Only)
GET    /api/recruitment/organization/billing?org_id={id}
PUT    /api/recruitment/organization/billing
```

---

## State Management

### React Query Keys
```typescript
const queryKeys = {
  organizationProfile: (orgId: string) => ['organization', 'profile', orgId],
  verification: (orgId: string) => ['organization', 'verification', orgId],
  contacts: (orgId: string) => ['organization', 'contacts', orgId],
  config: (orgId: string) => ['organization', 'config', orgId],
  offerTemplates: (orgId: string) => ['organization', 'offer-templates', orgId],
  billing: (orgId: string) => ['organization', 'billing', orgId],
};
```

### Local State (per tab)
- Form data (useForm from react-hook-form)
- Upload progress
- Validation errors
- Loading states
- Success/error messages

---

## User Flows

### Flow 1: Complete Company Profile (First Time)
1. Admin logs in → Admin Dashboard
2. Clicks "Settings" tab
3. Sees incomplete profile warning
4. Fills Company Profile tab → Save
5. Fills Company Verification tab → Upload docs → Submit for verification
6. Fills Contact Information → Save
7. Configures Recruitment Settings → Save
8. Creates Offer Letter Template → Save
9. Profile completion: 100% ✅

### Flow 2: Update Verification Documents
1. Navigate to Company Verification tab
2. Click "Upload" on document card
3. Select file → Preview → Confirm
4. Document uploads to Supabase Storage
5. URL saved to database
6. Status badge updates
7. "Submit for Verification" button enabled

### Flow 3: Create Offer Letter Template
1. Navigate to Offer Letter Templates tab
2. Click "Create New Template"
3. Modal opens with editor
4. Enter template name
5. Write content in rich text editor
6. Insert variables from panel ({{candidate_name}})
7. Preview template with sample data
8. Save → Template added to list
9. Set as default (optional)

### Flow 4: Domain Verification
1. Navigate to Company Verification → Domain section
2. Enter domain (e.g., techcorp.com)
3. System generates verification token
4. Copy DNS TXT record instructions
5. Add to domain DNS
6. Click "Verify Domain"
7. System checks DNS record
8. Status updates to "Verified" ✅

---

## Mobile Responsiveness

All tabs should be responsive:
- **Desktop (lg+)**: 2-column layout where applicable
- **Tablet (md)**: Single column, full-width cards
- **Mobile (sm)**: Stack all elements, larger touch targets

### Mobile Considerations:
- File upload should support camera capture
- Forms should have proper input types (tel, email, url)
- Drag-and-drop should have tap-based alternative
- Rich text editor should have simplified toolbar

---

## Accessibility

- **Keyboard Navigation**: All forms fully keyboard accessible
- **Screen Readers**: Proper ARIA labels on all inputs
- **Focus Management**: Clear focus indicators
- **Error Messages**: Associated with inputs via aria-describedby
- **File Uploads**: Clear instructions for screen readers
- **Status Badges**: Semantic colors + text, not just color

---

## Performance Optimizations

1. **Lazy Load Tabs**: Only render active tab
2. **Image Optimization**: Compress uploaded logos/documents
3. **Debounce Autosave**: Save form data on blur, not on every keystroke
4. **React Query Caching**: Cache profile data for 5 minutes
5. **Code Splitting**: Lazy load rich text editor
6. **Optimistic Updates**: Update UI immediately, sync in background

---

This structure provides a comprehensive company profile system that can scale with future needs!
