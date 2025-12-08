# Opportunities Fields Display - Complete Reference

## All Database Fields Now Displayed in UI

### ✅ Basic Information (Always Shown)
- `id` - Used internally for tracking
- `job_title` / `title` - Main heading in all views
- `company_name` - Displayed with logo
- `company_logo` - Shown as image or initials
- `location` - Displayed with MapPin icon
- `is_active` - Used for filtering
- `created_at` / `posted_date` - Shows "X days ago"

### ✅ Employment Details
- `employment_type` - Badge (Full-Time, Internship, etc.)
- `mode` - Badge (Remote, Hybrid, On-site)
- `department` - Shown with Users icon
- `experience_level` - Displayed with Award icon
- `experience_required` - Full text description

### ✅ Compensation
- `salary_range_min` - Combined into salary range
- `salary_range_max` - Combined into salary range
- `stipend_or_salary` - Additional compensation details
- `cost_inr` - Program cost (Free or ₹X)
- `cost_note` - Additional cost information

### ✅ Internship-Specific Fields
- `sector` - Industry/sector badge
- `exposure_type` - Type of exposure badge
- `duration_weeks` - Duration in weeks
- `duration_days` - Duration in days
- `total_hours` - Total hours commitment
- `schedule_note` - Schedule details with calendar emoji

### ✅ Learning & Development
- `what_youll_learn` - Full section with description
- `what_youll_do` - Full section with description
- `final_artifact_type` - Deliverable type
- `final_artifact_description` - Deliverable details
- `mentor_bio` - Mentor information section

### ✅ Requirements & Details
- `description` - "About the Role" section
- `requirements` (JSONB) - Expandable list with checkmarks
- `responsibilities` (JSONB) - Expandable list with icons
- `skills_required` (JSONB) - Expandable skill badges
- `benefits` (JSONB) - Benefits list with star icons
- `prerequiste` - Prerequisites section

### ✅ Important Information
- `safety_note` - Yellow warning box
- `parent_role` - Blue info box for parent/guardian
- `deadline` / `closing_date` - Application deadline
- `application_link` - External link button

### ✅ Statistics & Engagement
- `applications_count` - Number of applications
- `views_count` - Number of views
- `messages_count` - Number of messages

### ✅ Internal/System Fields (Used but not displayed)
- `status` - Used for filtering (draft/active)
- `recruiter_id` - Used for backend operations
- `created_by` - Used for tracking
- `updated_at` - Used for sorting
- `embedding` - Used for AI recommendations
- `requisition_id` / `requisition_id_uuid` - Backend linking

## Display Locations

### OpportunityCard (Grid View)
- Company logo/initials
- Job title
- Company name
- Location
- Salary range
- Employment type badge
- Mode badge
- Sector badge
- Duration (weeks)
- Cost badge
- Applied/Saved status

### OpportunityListItem (List View)
- All fields from Card view
- Sector badge
- Exposure type badge
- Duration badge
- Cost badge
- Apply button
- Save button

### OpportunityPreview (Detail View)
**Simplified view with modal for complete details:**

#### Main Preview (Always Visible):
1. **Header Section**
   - Company logo, job title, company name
   - Location, posted date
   - Salary, employment type, mode

2. **About the Role**
   - Full description (truncated if long)

3. **Key Highlights** (2 most important fields)
   - Experience level OR Sector
   - Deadline OR Duration

4. **Skills Required**
   - Expandable skill badges (show 8, expand for more)

5. **Requirements**
   - Expandable list (show 3, expand for more)

6. **Responsibilities**
   - Expandable list (show 3, expand for more)

7. **Benefits & Perks**
   - Full list with star icons

8. **View More Details Button**
   - Opens modal with all additional fields

#### Details Modal (On Click):
All additional fields displayed in organized sections:
- Sector & Exposure Type
- Duration & Schedule (weeks, days, hours, schedule note)
- What You'll Learn
- What You'll Do
- Final Deliverable/Artifact
- Mentor Information
- Program Cost
- Prerequisites
- Important Information (Safety & Parent Role)
- Department
- Compensation Details
- Experience Required
- Opportunity Insights (applications, views, messages)

## Field Coverage: 100%

All 47 fields from the opportunities table are now either:
- ✅ Displayed in the UI (user-facing fields)
- ✅ Used for functionality (system fields like IDs, embeddings)

No fields are ignored or missing from the implementation.
