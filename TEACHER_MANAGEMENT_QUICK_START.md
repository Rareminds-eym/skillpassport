# Teacher Management - Quick Start Guide

## 🚀 Access the Feature

Navigate to: **School Admin → Teachers → Management**

URL: `/school-admin/teachers/management`

---

## 📋 Three Main Sections

### 1️⃣ Teachers List
View and manage all teachers in your school

**Features:**
- Search by name, email, or Teacher ID
- Filter by onboarding status
- View teacher details and subject expertise
- Update teacher status (verified/active/inactive)

**Quick Stats:**
- Total teachers
- Pending onboarding
- Documents uploaded
- Verified teachers
- Active teachers

---

### 2️⃣ Teacher Onboarding
Add new teachers to your school

**Required Information:**
- ✅ First Name & Last Name
- ✅ Email Address
- ✅ Phone Number (optional)

**Required Documents:**
- 📄 Degree Certificate (PDF/JPG/PNG)
- 🆔 ID Proof (PDF/JPG/PNG)
- 📑 Experience Letters (Multiple files, optional)

**Subject Expertise:**
- Subject Name (e.g., Mathematics, Physics)
- Proficiency Level (Beginner/Intermediate/Advanced/Expert)
- Years of Experience

**Auto-Generated:**
- 🎫 Teacher ID (e.g., ABC-T-0001)
- 📚 Subject Mappings (stored in database)

---

### 3️⃣ Timetable Allocation
Create and manage teacher schedules

**Step 1: Select Teacher**
- Choose from active teachers dropdown

**Step 2: View Workload Summary**
- 📊 Total Periods/Week (Max: 30)
- 🔄 Max Consecutive Classes (Max: 3)
- ⚠️ Active Conflicts

**Step 3: Add Time Slots**
- Day: Monday - Saturday
- Period: 1-10
- Time: Start & End time
- Class: e.g., 10-A, 9-B
- Subject: e.g., Mathematics
- Room: e.g., 101

**Automatic Validation:**
- ✅ Checks 30 periods/week limit
- ✅ Checks 3 consecutive classes limit
- ✅ Detects double booking
- ✅ Identifies time conflicts

---

## ⚠️ Business Rules

### Rule 1: Maximum Periods
**No teacher may exceed 30 periods per week**

- System counts all assigned periods
- Red warning when limit exceeded
- Must remove slots to comply

### Rule 2: Consecutive Classes
**Back-to-back classes allowed maximum 3 times**

- System tracks longest consecutive sequence
- Red warning when >3 consecutive
- Recommended: Add breaks between classes

### Rule 3: No Double Booking
**Same teacher cannot be in two places at once**

- System prevents same day/period assignment
- Conflict logged automatically
- Must resolve before publishing timetable

---

## 🎯 Common Workflows

### Workflow 1: Onboard New Teacher
1. Click **Onboarding** tab
2. Fill personal information
3. Upload degree certificate
4. Upload ID proof
5. Add experience letters (optional)
6. Add subject expertise (at least one)
7. Click **Onboard Teacher**
8. Note the auto-generated Teacher ID
9. Go to **Teachers** tab
10. Find the teacher and update status to **Verified** → **Active**

### Workflow 2: Create Teacher Schedule
1. Click **Timetable** tab
2. Select teacher from dropdown
3. Check current workload (should be 0 initially)
4. Add first time slot:
   - Day: Monday
   - Period: 1
   - Time: 09:00 - 10:00
   - Class: 10-A
   - Subject: Mathematics
   - Room: 101
5. Click **Add Slot**
6. Repeat for all periods
7. Monitor workload indicators
8. Resolve any conflicts shown

### Workflow 3: Resolve Conflicts
1. View conflict alerts (red boxes)
2. Identify conflict type:
   - Max periods exceeded → Remove some slots
   - Consecutive classes exceeded → Add breaks
   - Double booking → Change time/day
3. Delete or modify conflicting slots
4. Workload recalculates automatically
5. Verify green indicators

---

## 📊 Status Indicators

### Teacher Status
- 🟡 **Pending**: Just created, no documents
- 🔵 **Documents Uploaded**: All files uploaded
- 🟢 **Verified**: Admin verified documents
- 🟢 **Active**: Can be assigned to timetable
- ⚪ **Inactive**: Temporarily disabled

### Workload Indicators
- 🟢 **Green**: Within limits (good)
- 🔴 **Red**: Exceeds limits (action required)
- 🔵 **Blue**: Conflicts detected

---

## 🔧 Troubleshooting

### Teacher ID not showing?
- Refresh the page
- Check if school information is set up
- Contact system administrator

### Documents not uploading?
- Check file size (max 10MB recommended)
- Use supported formats: PDF, JPG, PNG
- Check internet connection

### Conflicts not clearing?
- Delete the conflicting slot
- Wait for page to refresh
- Check if another slot is causing the issue

### Workload not updating?
- Refresh the page
- Check if slots were saved successfully
- Verify teacher is selected

---

## 💡 Best Practices

### Onboarding
- ✅ Verify all documents before marking as "Verified"
- ✅ Ensure email addresses are unique
- ✅ Add all subject expertise for better scheduling
- ✅ Keep phone numbers updated

### Timetable
- ✅ Plan schedule before entering data
- ✅ Distribute workload evenly across days
- ✅ Avoid scheduling >3 consecutive periods
- ✅ Leave buffer periods for preparation
- ✅ Assign rooms consistently
- ✅ Review conflicts before publishing

### Maintenance
- ✅ Update teacher status regularly
- ✅ Archive old timetables
- ✅ Review workload distribution monthly
- ✅ Keep subject expertise current

---

## 📞 Need Help?

**Common Questions:**
- How to bulk import teachers? → Coming soon
- How to export timetable? → Coming soon
- How to handle substitute teachers? → Coming soon

**Technical Support:**
- Check the full guide: `TEACHER_MANAGEMENT_GUIDE.md`
- Contact system administrator
- Report bugs to development team

---

## 🎓 Example: Complete Teacher Setup

**Scenario:** Add Math teacher with full schedule

**Step 1: Onboard**
- Name: Rajesh Kumar
- Email: rajesh.kumar@school.edu
- Phone: +91-9876543210
- Upload degree certificate
- Upload ID proof
- Add subjects:
  - Mathematics (Expert, 10 years)
  - Physics (Advanced, 8 years)
- Teacher ID generated: ABC-T-0001

**Step 2: Verify**
- Go to Teachers tab
- Find Rajesh Kumar
- Click View
- Update status: Verified → Active

**Step 3: Schedule**
- Go to Timetable tab
- Select: ABC-T-0001 - Rajesh Kumar
- Add Monday slots:
  - Period 1: 10-A, Mathematics, Room 101
  - Period 2: 10-B, Mathematics, Room 101
  - Period 4: 9-A, Mathematics, Room 102
- Repeat for other days
- Total: 25 periods (within 30 limit)
- Max consecutive: 3 (within limit)
- No conflicts ✅

**Result:** Teacher fully onboarded and scheduled!

---

## 📈 Key Metrics to Monitor

- **Onboarding Rate**: Pending → Active conversion
- **Workload Balance**: Average periods per teacher
- **Conflict Rate**: Number of unresolved conflicts
- **Document Compliance**: % teachers with all documents
- **Schedule Coverage**: % classes with assigned teachers

---

**Last Updated:** November 2024  
**Version:** 1.0  
**Module:** School Admin - Teacher Management
