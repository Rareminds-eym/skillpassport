# Curriculum Approval Workflow - Complete Implementation Guide

## Overview

This implementation provides a complete curriculum approval workflow that differentiates between affiliated and private colleges. Instead of creating new tables, it adds required columns to existing tables and creates necessary functions, views, and triggers.

## 🎯 Key Features

### 🏛️ **Affiliated Colleges**
- **Request Approval Button**: Replaces "Publish" button with "Request Approval"
- **University Review**: Requests sent only to affiliated University Admins
- **Auto-Publishing**: Upon approval, curriculum is automatically published
- **Notification System**: Automated notifications for request submission and decisions

### 🏫 **Private Colleges**
- **Direct Approval**: "Approve Curriculum" button for self-approval
- **Direct Publishing**: "Publish Curriculum" button after approval
- **Complete Autonomy**: No external dependencies for curriculum management

### 🎓 **University Admin Interface**
- **Syllabus Approval Dashboard**: `/university-admin/courses/syllabus`
- **Pending Requests**: View all pending approval requests from affiliated colleges
- **Review Interface**: Approve/reject with feedback notes
- **Statistics Dashboard**: Track approval metrics and history

## 📊 Database Schema Changes

### Modified Tables

#### `college_curriculums` table
```sql
-- New approval workflow columns added
ALTER TABLE college_curriculums 
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'draft' 
    CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected', 'published'));
ADD COLUMN requested_by UUID REFERENCES users(id);
ADD COLUMN request_date TIMESTAMP;
ADD COLUMN request_message TEXT;
ADD COLUMN reviewed_by UUID REFERENCES users(id);
ADD COLUMN review_date TIMESTAMP;
ADD COLUMN review_notes TEXT;
ADD COLUMN university_id UUID REFERENCES organizations(id);
ADD COLUMN published_date TIMESTAMP;
```

### Helper Functions

#### `check_college_affiliation()`
- Returns college affiliation status for current user
- Used by frontend to determine UI behavior (Request Approval vs Approve/Publish)

#### `submit_curriculum_for_approval()`
- Submits curriculum for university approval
- Validates college affiliation
- Creates notifications for university admins
- Updates curriculum status to 'pending_approval'

#### `review_curriculum()`
- University admin function to approve/reject curricula
- Auto-publishes upon approval (status becomes 'published')
- Sends notifications to requester
- Records reviewer details and feedback

### Views

#### `curriculum_approval_dashboard`
- University admin view of all approval requests
- Includes college, course, and requester details
- Filtered by university affiliation
- Used by university admin dashboard

#### `college_curriculum_status`
- College admin view of curriculum status
- Shows affiliation status and approval progress
- Used by college admin interface

## 🔧 Frontend Implementation

### College Admin Interface Changes

#### Dynamic Button Logic
```typescript
// Affiliated colleges see "Request Approval"
{collegeAffiliation.isAffiliated && !collegeAffiliation.loading && (
  <button onClick={handleRequestApproval}>
    <PaperAirplaneIcon className="h-4 w-4" />
    Request Approval
  </button>
)}

// Private colleges see "Approve" then "Publish"
{!collegeAffiliation.isAffiliated && !collegeAffiliation.loading && (
  <button onClick={handleApprove}>
    <CheckCircleIcon className="h-4 w-4" />
    Approve Curriculum
  </button>
)}
```

#### Status Tracking
- **Draft**: Initial state, can be edited
- **Pending Approval**: Submitted to university, waiting for review
- **Approved**: Approved by university (affiliated) or self-approved (private)
- **Published**: Active and available to students/faculty
- **Rejected**: Rejected by university, needs revision

#### Request Modal
- Interface for submitting approval requests with optional messages
- Shows university name and approval process information
- Confirmation of submission with next steps

### University Admin Interface

#### Existing Components (Already Implemented)
- **SyllabusApproval.tsx**: Complete approval dashboard
- **Comprehensive UI**: Grid/list views, filtering, pagination
- **Review Modal**: Approve/reject interface with feedback
- **Statistics Cards**: Total, pending, approved, rejected, published counts

## 🔒 Security & Permissions

### Row Level Security (RLS)
```sql
-- College admins can view their curriculum
CREATE POLICY "College admins can view their curriculum" ON college_curriculums
    FOR SELECT USING (college_id IN (SELECT organizationId FROM users WHERE id = auth.uid()));

-- University admins can view affiliated college curriculum
CREATE POLICY "University admins can view affiliated college curriculum" ON college_curriculums
    FOR SELECT USING (university_id IN (SELECT organizationId FROM users WHERE id = auth.uid()));

-- University admins can update curriculum for approval
CREATE POLICY "University admins can update curriculum for approval" ON college_curriculums
    FOR UPDATE USING (university_id IN (SELECT organizationId FROM users WHERE id = auth.uid()));
```

### Authorization Checks
- **College Affiliation**: Verified before allowing approval requests
- **University Admin Role**: Required for reviewing curricula
- **Ownership Validation**: Users can only act on their organization's data

## 🔄 Workflow Process

### For Affiliated Colleges

1. **Create Curriculum**: College admin creates curriculum in draft status
2. **Complete Content**: Add units, learning outcomes, assessments
3. **Request Approval**: Click "Request Approval" button (replaces Publish)
4. **Submit Request**: Add optional message and submit to university
5. **University Review**: University admin reviews in syllabus approval dashboard
6. **Decision**: University admin approves/rejects with feedback
7. **Auto-Publish**: Upon approval, curriculum is automatically published
8. **Notification**: College admin receives approval/rejection notification

### For Private Colleges

1. **Create Curriculum**: College admin creates curriculum in draft status
2. **Complete Content**: Add units, learning outcomes, assessments
3. **Self-Approve**: Click "Approve Curriculum" button (internal approval)
4. **Publish**: Click "Publish Curriculum" button to make active
5. **Active Status**: Curriculum is immediately available to students/faculty

## 🚀 Deployment

### Step 1: Apply Database Changes
```bash
# Run the deployment script
./deploy-curriculum-approval-workflow-complete.bat

# Or apply manually
supabase db push --file curriculum_approval_workflow_complete_implementation.sql
```

### Step 2: Verify Implementation
1. **Check Database**: Verify new columns and functions are created
2. **Test Affiliation Check**: Ensure `check_college_affiliation()` works
3. **Test Approval Flow**: Submit and review a test curriculum
4. **Verify UI Changes**: Check button behavior for affiliated vs private colleges

## 🧪 Testing Scenarios

### Test Case 1: Affiliated College Workflow
1. **Login** as college admin from affiliated college
2. **Create curriculum** with units and learning outcomes
3. **Verify "Request Approval" button** appears (not "Publish")
4. **Submit approval request** with message
5. **Login** as university admin
6. **Check dashboard** for new request at `/university-admin/courses/syllabus`
7. **Approve request** with feedback
8. **Verify auto-publishing** and notification to college admin

### Test Case 2: Private College Workflow
1. **Login** as college admin from private college
2. **Create curriculum** with units and learning outcomes
3. **Verify "Approve Curriculum" button** appears
4. **Click approve** - status should change to "approved"
5. **Verify "Publish Curriculum" button** appears
6. **Click publish** - status should change to "published"
7. **Verify curriculum** is now active

### Test Case 3: University Admin Dashboard
1. **Login** as university admin
2. **Navigate** to `/university-admin/courses/syllabus`
3. **View pending requests** from affiliated colleges
4. **Filter and search** requests by college, department, status
5. **Review curriculum details** in modal
6. **Approve/reject** with feedback notes
7. **View approval statistics** and history

## 📋 Configuration

### Environment Variables
- No additional environment variables required
- Uses existing Supabase configuration
- Leverages existing authentication system

### Database Requirements
- Existing `organizations` table for colleges and universities
- Existing `university_colleges` table for affiliation mapping
- Existing `users` table with role-based access
- Existing `college_curriculums` table (modified with new columns)

## 📈 Monitoring & Analytics

### Approval Metrics Available
- Total requests submitted per university
- Approval/rejection rates by college
- Average review time by university admin
- College-wise curriculum statistics
- Monthly/quarterly approval trends

### Performance Monitoring
- Database query performance with new indexes
- API response times for approval functions
- User interaction analytics on approval buttons
- Notification delivery success rates

## 🔧 Troubleshooting

### Common Issues

#### Issue: "Request Approval" button not showing
**Solution**: Check college affiliation in `university_colleges` table
```sql
SELECT * FROM university_colleges WHERE college_id = 'your-college-id';
```

#### Issue: University admin can't see pending requests
**Solution**: Verify user role and university assignment
```sql
SELECT role, organizationId FROM users WHERE id = 'university-admin-id';
```

#### Issue: Auto-publishing not working after approval
**Solution**: Check `review_curriculum` function execution
```sql
SELECT approval_status, published_date FROM college_curriculums WHERE id = 'curriculum-id';
```

### Debug Queries

```sql
-- Check affiliation status
SELECT * FROM check_college_affiliation();

-- View approval dashboard data
SELECT * FROM curriculum_approval_dashboard WHERE approval_status = 'pending_approval';

-- Check curriculum status
SELECT * FROM college_curriculum_status WHERE curriculum_id = 'your-curriculum-id';
```

## 🎯 Success Criteria

### ✅ Implementation Complete When:
1. **Affiliated colleges** see "Request Approval" instead of "Publish"
2. **Private colleges** see "Approve" → "Publish" workflow
3. **University admins** can review and approve/reject requests
4. **Auto-publishing** works upon approval
5. **Notifications** are sent for all status changes
6. **RLS policies** properly restrict access
7. **Dashboard views** show correct data
8. **All test scenarios** pass successfully

## 📚 API Reference

### College Admin APIs
```typescript
// Check if college is affiliated
const affiliation = await curriculumApprovalService.checkCollegeAffiliation();

// Submit for approval (affiliated colleges)
const result = await curriculumApprovalService.submitForApproval(curriculumId, message);

// Get curriculum status
const status = await curriculumApprovalService.getCurriculumStatus(curriculumId);
```

### University Admin APIs
```typescript
// Get pending approval requests
const requests = await curriculumApprovalService.getApprovalRequests(universityId, filters);

// Approve curriculum
const result = await curriculumApprovalService.approveCurriculum(requestId, notes);

// Reject curriculum
const result = await curriculumApprovalService.rejectCurriculum(requestId, notes);

// Get approval statistics
const stats = await curriculumApprovalService.getApprovalStatistics(universityId);
```

## 🎉 Conclusion

This implementation provides a complete curriculum approval workflow that:

- ✅ **Uses existing tables** without creating new ones
- ✅ **Differentiates between affiliated and private colleges**
- ✅ **Provides appropriate UI for each college type**
- ✅ **Implements secure approval workflow**
- ✅ **Includes comprehensive university admin dashboard**
- ✅ **Maintains data integrity with RLS policies**
- ✅ **Provides performance optimization with indexes**
- ✅ **Includes thorough testing and monitoring capabilities**

The workflow is now ready for production use and can handle the curriculum approval process efficiently for both affiliated and private colleges.

---

**Implementation Status**: ✅ Complete and Ready for Production

**Last Updated**: January 13, 2026

**Version**: 1.0.0