# Debug: PDF Grade and School Still Showing Dash

## Current Status
Grade and School fields are still showing "—" in the PDF even though data exists in the database.

## Debugging Steps Added

### 1. Console Logging
Added console.log statements to track data flow:

**In PrintViewCollege.jsx:**
```javascript
console.log('PrintViewCollege - studentInfo received:', studentInfo);
console.log('PrintViewCollege - safeStudentInfo after getSafeStudentInfo:', safeStudentInfo);
```

**In CoverPage.jsx:**
```javascript
console.log('CoverPage - studentInfo received:', studentInfo);
console.log('CoverPage - safeStudentInfo created:', safeStudentInfo);
```

### 2. What to Check in Browser Console

When you click "Download PDF", look for these console logs:

1. **ReportHeader studentInfo** - This shows what data is available in the main view
2. **PrintViewCollege - studentInfo received** - This shows what's passed to print view
3. **CoverPage - studentInfo received** - This shows what reaches the cover page

## Expected Data Structure

The `studentInfo` object should contain:
```javascript
{
  name: "Karthik6",
  regNo: "...",
  college: "...",  // or school name
  school: "...",   // school name
  stream: "High School (Grades 9-10)",
  grade: "10",     // or whatever grade
  branchField: "...",
  courseName: "..."
}
```

## Possible Issues

### Issue 1: Data Not Loaded Yet
The PDF might be generated before `fetchStudentInfo()` completes.

**Solution**: Ensure PDF generation waits for data to load.

### Issue 2: Field Names Mismatch
The database might use different field names than expected.

**Check**: 
- Is it `grade` or `class`?
- Is it `school` or `school_name`?

### Issue 3: Data in Different Location
The grade/school might be in `studentInfo.college` but not in `studentInfo.school`.

**Solution**: Update fallback logic in getSafeStudentInfo.

### Issue 4: Empty String vs Null
The fields might be empty strings `""` instead of null, which would pass the truthy check.

**Solution**: Add trim() check: `studentInfo?.grade?.trim()`

## Next Steps

1. **Check Console Logs**: Open browser console and click "Download PDF"
2. **Share Console Output**: Copy the console logs showing studentInfo data
3. **Check Database**: Verify the actual field names in the students table
4. **Check Timing**: See if data is loaded when PDF is generated

## Quick Fix to Try

If the data is in `studentInfo` but not showing, try this in CoverPage.jsx:

```javascript
const safeStudentInfo = {
  name: studentInfo?.name || '—',
  regNo: studentInfo?.regNo || '—',
  college: studentInfo?.college || studentInfo?.school || '—',
  stream: studentInfo?.stream || '—',
  grade: studentInfo?.grade?.toString() || studentInfo?.class || '—',
  school: studentInfo?.school || studentInfo?.college || studentInfo?.schoolName || '—'
};
```

This adds more fallback options for different field names.
