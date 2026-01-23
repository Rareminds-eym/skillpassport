# 🧪 Timetable Builder Testing Guide

This guide will help you verify that both **Teacher Assignment Logic** and **Conflict Detection Logic** are working properly.

## 🚀 Quick Start Testing

### Prerequisites
1. Make sure you have teachers created in the system
2. Make sure you have classes created in the system
3. Make sure you have subjects created in the curriculum
4. Navigate to the Timetable Builder page

## 📋 Test Cases

### Test 1: Teacher Double-Booking Prevention ✅
**What it tests:** Same teacher cannot be assigned to multiple classes at the same time

**Steps:**
1. Select a teacher from the "Teacher Load" dropdown
2. Select a class from the "Classes in School" dropdown
3. Click on an empty cell (e.g., Monday Period 1)
4. Fill in subject and room, click "Add Slot"
5. **Now try to add the SAME teacher to the SAME time slot (Monday Period 1) with a different class**
6. You should see an error: "This teacher is already assigned to [Class] ([Subject]) at this time slot"

**Expected Result:** ❌ Error message prevents duplicate assignment

---

### Test 2: Room Collision Detection ✅
**What it tests:** Same room cannot be used by multiple classes at the same time

**Steps:**
1. Add a slot with Teacher A, Class A, Room R101, Monday Period 1
2. Try to add another slot with Teacher B, Class B, **Same Room R101**, Monday Period 1
3. You should see an error: "Room R101 is already occupied by [Class] ([Subject]) at this time"

**Expected Result:** ❌ Error message prevents room collision

---

### Test 3: Maximum Periods Per Day (6 periods limit) ⚠️
**What it tests:** Teacher cannot have more than 6 periods in one day

**Steps:**
1. Select one teacher
2. Add 6 slots for the same teacher on the same day (e.g., Monday Periods 1-6)
3. Try to add a 7th slot for the same teacher on the same day
4. You should see an error: "Teacher has 7 periods on this day. Maximum 6 allowed"

**Expected Result:** ❌ Error message prevents exceeding daily limit

---

### Test 4: Maximum Consecutive Periods (3 periods limit) ⚠️
**What it tests:** Teacher cannot have more than 3 consecutive periods

**Steps:**
1. Select one teacher
2. Add 3 consecutive slots (e.g., Monday Periods 1, 2, 3)
3. Try to add a 4th consecutive slot (Monday Period 4)
4. You should see an error: "Teacher has 4 consecutive periods. Maximum 3 allowed"

**Expected Result:** ❌ Error message prevents too many consecutive periods

---

### Test 5: Visual Conflict Indicators 🎨
**What it tests:** Conflicts are visually highlighted in the timetable grid

**Steps:**
1. Create some conflicting slots using the above methods
2. Look at the timetable grid
3. Conflicting slots should be highlighted in **red** (errors) or **yellow** (warnings)
4. Check the conflicts alert at the top of the page

**Expected Result:** 
- 🔴 Red highlighting for error conflicts
- 🟡 Yellow highlighting for warning conflicts
- ⚠️ Conflicts alert banner at the top

---

### Test 6: Drag & Drop Validation 🖱️
**What it tests:** Moving slots via drag & drop also validates conflicts

**Steps:**
1. Create a valid slot (e.g., Teacher A, Monday Period 1)
2. Create another slot for the same teacher (e.g., Teacher A, Tuesday Period 1)
3. Try to drag the Tuesday slot to Monday Period 1 (where Teacher A already has a slot)
4. You should see an error preventing the move

**Expected Result:** ❌ Drag & drop prevented with error message

---

### Test 7: Edit Slot Validation ✏️
**What it tests:** Editing existing slots also validates conflicts

**Steps:**
1. Create two slots with different teachers at different times
2. Click on one slot to edit it
3. Try to change the teacher to match another slot's teacher at the same time
4. You should see an error preventing the update

**Expected Result:** ❌ Edit prevented with error message

---

## 🔧 Browser Console Testing

### Option 1: Run the test script
1. Open browser developer tools (F12)
2. Go to Console tab
3. Copy and paste the contents of `test-timetable-browser.js`
4. Press Enter to run the tests

### Option 2: Manual console checks
```javascript
// Check if validation functions are loaded
console.log(typeof validateTimetableSlot);
console.log(typeof getAllTimetableConflicts);

// Test with sample data
const testSlot = {
  educator_id: "test123",
  teacher_id: "test123",
  day_of_week: 1,
  period_number: 1,
  class_name: "Test Class",
  subject_name: "Test Subject",
  room_number: "R101"
};

const conflicts = validateTimetableSlot([], testSlot);
console.log("Conflicts found:", conflicts);
```

## 🎯 What to Look For

### ✅ Working Correctly:
- Error messages appear when trying to create conflicts
- Red/yellow highlighting on conflicting slots
- Conflicts alert banner shows at the top
- Drag & drop is prevented for conflicting moves
- Edit operations validate before saving

### ❌ Not Working:
- No error messages when creating obvious conflicts
- Slots can be double-booked without warnings
- Same room can be assigned to multiple classes
- No visual indicators for conflicts
- Drag & drop allows invalid moves

## 🐛 Troubleshooting

### If tests fail:
1. **Check browser console for errors**
   - Open F12 → Console tab
   - Look for red error messages

2. **Verify data setup**
   - Make sure teachers exist in the system
   - Make sure classes exist with room numbers
   - Make sure subjects exist in curriculum

3. **Check network requests**
   - Open F12 → Network tab
   - Look for failed API calls to Supabase

4. **Verify database schema**
   - Check if `timetable_slots` table exists
   - Check if foreign key relationships are correct

## 📊 Expected Results Summary

| Test Case | Expected Behavior | Status |
|-----------|------------------|---------|
| Teacher Double-Booking | ❌ Prevented with error | ✅ Should work |
| Room Collision | ❌ Prevented with error | ✅ Should work |
| Max Periods/Day | ⚠️ Warning at 6+ periods | ✅ Should work |
| Max Consecutive | ⚠️ Warning at 3+ consecutive | ✅ Should work |
| Visual Indicators | 🔴🟡 Red/yellow highlighting | ✅ Should work |
| Drag & Drop | ❌ Invalid moves prevented | ✅ Should work |
| Edit Validation | ❌ Invalid edits prevented | ✅ Should work |

## 🎉 Success Criteria

The timetable builder is working correctly if:
- ✅ All 7 test cases pass
- ✅ Visual feedback is clear and immediate
- ✅ Error messages are helpful and specific
- ✅ No conflicts can be created through any method (add, edit, drag)
- ✅ Existing conflicts are clearly highlighted

---

**Need help?** Check the browser console for detailed error messages and validation results.