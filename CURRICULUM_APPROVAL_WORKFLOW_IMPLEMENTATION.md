# Curriculum Approval Workflow Implementation

## Overview

This implementation provides a complete curriculum approval workflow that differentiates between affiliated and private colleges, using existing database tables without creating new ones.

## Key Features

### 🏛️ **Affiliated Colleges**
- **Request Approval**: Replace "Publish" button with "Request Approval"
- **University Review**: Requests sent to affiliated University Admins only
- **Auto-Publishing**: Upon approval, curriculum is automatically published
- **Notification System**: Automated notifications for request submission and decisions

### 🏫 **Private Colleges**
- **Direct Publishing**: Allow direct publishing without approval
- **Self-Approval**: College admins can approve and publish their own curricula
- **No External Dependencies**: Complete autonomy over curriculum management

### 🎓 **University Admin Interface**
- **Syllabus Approval Dashboard**: `/university-admin/courses/syllabus`
- **Pending Requests**: View all pending approval requests from affiliated colleges
- **Review Interface**: Approve/reject with feedback notes
- **Statistics Dashboard**: Track approval metrics and history

## Database Schema

### Modified Tables

#### `college_curriculums` table (existing)
```sql
-- New approval workflow columns
ALTER TABLE college_curriculums 
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'draft' 
    CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected', 'published'));
ADD COLUMN requested_by UUID REFERENCES users(id);
ADD COLUMN request_date TIMESTAMP;
ADD COLUMN request_message TEXT;
ADD COLUMN reviewed_by UUID REFERENCES users(id);
ADD COLUMN review_date TIMESTAMP;
ADD COLUMN review_notes TEXT;
ADD COLUMN university_id UUID;
ADD COLUMN published_date TIMESTAMP;
```

### Helper Functions

#### `check_college_affiliation()`
- Returns college affiliation status for current user
- Used by frontend to determine UI behavior

#### `submit_curriculum_for_approval()`
- Submits curriculum for university approval
- Validates college affiliation
- Creates notifications for university admins

#### `review_curriculum()`
- University admin function to approve/reject
- Auto-publishes upon approval
- Sends notifications to requester

### Views

#### `curriculum_approval_dashboard`
- University admin view of all approval requests
- Includes college, course, and requester details
- Filtered by university affiliation

#### `college_curriculum_status`
- College admin view of curriculum status
- Shows affiliation status and approval progress

## Frontend Implementation

### College Admin Interface

#### Updated Components
- **CurriculumBuilder.tsx**: Main curriculum builder page
- **CollegeCurriculumBuilderUI.tsx**: UI component with approval logic
- **curriculumApprovalService.ts**: Service for approval operations

#### Key Changes
1. **Affiliation Check**: Automatically detects if college is affiliated
2. **Dynamic Buttons**: Shows "Request Approval" vs "Publish" based on affiliation
3. **Status Tracking**: Displays approval status and progress
4. **Request Modal**: Interface for submitting approval requests with messages

### University Admin Interface

#### Existing Components
- **SyllabusApproval.tsx**: Complete approval dashboard
- **Comprehensive UI**: Grid/list views, filtering, pagination
- **Review Modal**: Approve/reject interface with feedback

#### Features
- **Statistics Cards**: Total, pending, approved, rejected, published counts
- **Search & Filter**: By college, department, status, date
- **Batch Operations**: Efficient review of multiple requests
- **Real-time Updates**: Live status updates and notifications

## Security & Permissions

### Row Level Security (RLS)
```sql
-- College admins can view their curriculum
CREATE POLICY "College admins can view their curriculum" ON college_curriculums
    FOR SELECT USING (college_id IN (SELECT college_id FROM users WHERE id = auth.uid()));

-- University admins can view affiliated college curriculum
CREATE POLICY "University admins can view affiliated college curriculum" ON college_curriculums
    FOR SELECT USING (university_id IN (SELECT university_id FROM users WHERE id = auth.uid()));

-- University admins can update curriculum for approval
CREATE POLICY "University admins can update curriculum for approval" ON college_curriculums
    FOR UPDATE USING (university_id IN (SELECT university_id FROM users WHERE id = auth.uid()));
```

### Authorization Checks
- **College Affiliation**: Verified before allowing approval requests
- **University Admin Role**: Required for reviewing curricula
- **Ownership Validation**: Users can only act on their organization's data

## Workflow Process

### For Affiliated Colleges

1. **Create Curriculum**: College admin creates curriculum in draft status
2. **Complete Content**: Add units, learning outcomes, assessments
3. **Request Approval**: Click "Request Approval" button
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

## API Endpoints

### College Admin APIs
- `checkCollegeAffiliation()`: Check if college is affiliated
- `submitForApproval(curriculumId, message)`: Submit for approval
- `getCurriculumStatus(curriculumId)`: Get approval status

### University Admin APIs
- `getApprovalRequests(filters)`: Get pending/all requests
- `getApprovalStatistics()`: Get approval metrics
- `approveCurriculum(requestId, notes)`: Approve curriculum
- `rejectCurriculum(requestId, notes)`: Reject curriculum

## Deployment

### Database Migration
```bash
# Apply the migration
supabase db push --linked

# Or use the deployment script
./deploy-curriculum-approval-workflow.bat
```

### Frontend Updates
- Updated curriculum service methods
- Enhanced UI components with approval logic
- New approval service for API calls

## Testing Scenarios

### Test Cases

#### Affiliated College Workflow
1. **Create curriculum** as college admin
2. **Verify "Request Approval" button** appears (not "Publish")
3. **Submit approval request** with message
4. **Check university admin dashboard** for new request
5. **Approve request** as university admin
6. **Verify auto-publishing** and notification

#### Private College Workflow
1. **Create curriculum** as college admin
2. **Verify "Approve" and "Publish" buttons** appear
3. **Approve curriculum** directly
4. **Publish curriculum** directly
5. **Verify published status**

#### University Admin Dashboard
1. **View pending requests** from affiliated colleges
2. **Filter and search** requests
3. **Review curriculum details**
4. **Approve/reject** with feedback
5. **View approval statistics**

## Configuration

### Environment Variables
- No additional environment variables required
- Uses existing Supabase configuration

### Database Setup
- Requires existing `curriculum`, `users`, `university_colleges` tables
- Migration adds approval workflow columns
- Creates helper functions and views

## Monitoring & Analytics

### Approval Metrics
- Total requests submitted
- Approval/rejection rates
- Average review time
- College-wise statistics

### Performance Monitoring
- Database query performance
- API response times
- User interaction analytics

## Future Enhancements

### Potential Improvements
1. **Bulk Approval**: Approve multiple curricula at once
2. **Approval Templates**: Pre-defined approval criteria
3. **Version Control**: Track curriculum changes and versions
4. **Advanced Notifications**: Email/SMS notifications
5. **Approval Workflows**: Multi-level approval processes
6. **Integration APIs**: External system integrations

### Scalability Considerations
- Database indexing for large datasets
- Caching for frequently accessed data
- Background job processing for notifications
- API rate limiting and throttling

## Support & Maintenance

### Documentation
- API documentation with examples
- User guides for college and university admins
- Troubleshooting guides

### Monitoring
- Error tracking and logging
- Performance monitoring
- User feedback collection

---

## Quick Start Guide

### For College Admins
1. Navigate to `/college-admin/academics/curriculum`
2. Create or edit a curriculum
3. Add units and learning outcomes
4. Click "Request Approval" (affiliated) or "Approve" → "Publish" (private)

### For University Admins
1. Navigate to `/university-admin/courses/syllabus`
2. Review pending approval requests
3. Click "Approve" or "Reject" with feedback
4. Monitor approval statistics and history

### For Developers
1. Run `./deploy-curriculum-approval-workflow.bat`
2. Test both affiliated and private college workflows
3. Verify university admin dashboard functionality
4. Check notifications and auto-publishing

---

**Implementation Status**: ✅ Complete and Ready for Testing

**Last Updated**: January 13, 2026