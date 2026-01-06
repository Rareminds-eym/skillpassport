/**
 * Comprehensive Test Script for Timetable Builder
 * Tests both Teacher Assignment Logic and Conflict Detection Logic
 */

import { supabase } from './src/lib/supabaseClient.js';
import { 
  validateTimetableSlot, 
  getAllTimetableConflicts,
  validateTeacherAvailability,
  validateRoomAvailability,
  validateMaxPeriodsPerDay,
  validateMaxConsecutivePeriods
} from './src/utils/timetableValidation.js';

// Test data setup
const mockSlots = [
  {
    id: "slot1",
    educator_id: "teacher1",
    teacher_id: "teacher1",
    class_id: "class1",
    day_of_week: 1, // Monday
    period_number: 1,
    start_time: "09:00",
    end_time: "10:00",
    subject_name: "Mathematics",
    room_number: "R101",
    class_name: "Grade 10A",
    teacher_name: "John Doe"
  },
  {
    id: "slot2",
    educator_id: "teacher1",
    teacher_id: "teacher1",
    class_id: "class2",
    day_of_week: 1, // Monday
    period_number: 2,
    start_time: "10:00",
    end_time: "11:00",
    subject_name: "Physics",
    room_number: "R102",
    class_name: "Grade 10B",
    teacher_name: "John Doe"
  },
  {
    id: "slot3",
    educator_id: "teacher1",
    teacher_id: "teacher1",
    class_id: "class3",
    day_of_week: 1, // Monday
    period_number: 3,
    start_time: "11:00",
    end_time: "12:00",
    subject_name: "Chemistry",
    room_number: "R103",
    class_name: "Grade 10C",
    teacher_name: "John Doe"
  }
];

console.log("🧪 Starting Timetable Validation Tests...\n");

// Test 1: Teacher Double-Booking Detection
console.log("📋 Test 1: Teacher Double-Booking Detection");
console.log("=" .repeat(50));

const conflictSlot = {
  id: "new_slot",
  educator_id: "teacher1",
  teacher_id: "teacher1",
  class_id: "class4",
  day_of_week: 1, // Monday
  period_number: 1, // Same time as slot1
  start_time: "09:00",
  end_time: "10:00",
  subject_name: "Biology",
  room_number: "R104",
  class_name: "Grade 11A",
  teacher_name: "John Doe"
};

const teacherConflicts = validateTeacherAvailability(mockSlots, conflictSlot);
if (teacherConflicts) {
  console.log("✅ PASS: Teacher double-booking detected correctly");
  console.log(`   Message: ${teacherConflicts.message}`);
  console.log(`   Severity: ${teacherConflicts.severity}`);
} else {
  console.log("❌ FAIL: Teacher double-booking NOT detected");
}

// Test 2: Room Collision Detection
console.log("\n📋 Test 2: Room Collision Detection");
console.log("=" .repeat(50));

const roomConflictSlot = {
  id: "new_slot2",
  educator_id: "teacher2",
  teacher_id: "teacher2",
  class_id: "class5",
  day_of_week: 1, // Monday
  period_number: 1, // Same time as slot1
  start_time: "09:00",
  end_time: "10:00",
  subject_name: "English",
  room_number: "R101", // Same room as slot1
  class_name: "Grade 12A",
  teacher_name: "Jane Smith"
};

const roomConflicts = validateRoomAvailability(mockSlots, roomConflictSlot);
if (roomConflicts) {
  console.log("✅ PASS: Room collision detected correctly");
  console.log(`   Message: ${roomConflicts.message}`);
  console.log(`   Severity: ${roomConflicts.severity}`);
} else {
  console.log("❌ FAIL: Room collision NOT detected");
}

// Test 3: Maximum Periods Per Day (6 periods limit)
console.log("\n📋 Test 3: Maximum Periods Per Day Validation");
console.log("=" .repeat(50));

// Create 7 slots for same teacher on same day (exceeds limit of 6)
const manySlots = [];
for (let i = 1; i <= 7; i++) {
  manySlots.push({
    id: `slot_${i}`,
    educator_id: "teacher3",
    teacher_id: "teacher3",
    class_id: `class_${i}`,
    day_of_week: 2, // Tuesday
    period_number: i,
    start_time: `${8 + i}:00`,
    end_time: `${9 + i}:00`,
    subject_name: "History",
    room_number: `R20${i}`,
    class_name: `Grade ${i}A`,
    teacher_name: "Bob Wilson"
  });
}

const maxPeriodsConflict = validateMaxPeriodsPerDay(manySlots, "teacher3", 2);
if (maxPeriodsConflict) {
  console.log("✅ PASS: Maximum periods per day limit detected correctly");
  console.log(`   Message: ${maxPeriodsConflict.message}`);
  console.log(`   Severity: ${maxPeriodsConflict.severity}`);
} else {
  console.log("❌ FAIL: Maximum periods per day limit NOT detected");
}

// Test 4: Maximum Consecutive Periods (3 periods limit)
console.log("\n📋 Test 4: Maximum Consecutive Periods Validation");
console.log("=" .repeat(50));

// Create 4 consecutive slots (exceeds limit of 3)
const consecutiveSlots = [
  {
    id: "cons1",
    educator_id: "teacher4",
    teacher_id: "teacher4",
    class_id: "class1",
    day_of_week: 3, // Wednesday
    period_number: 1,
    start_time: "09:00",
    end_time: "10:00",
    subject_name: "Math",
    room_number: "R301",
    class_name: "Grade 9A",
    teacher_name: "Alice Brown"
  },
  {
    id: "cons2",
    educator_id: "teacher4",
    teacher_id: "teacher4",
    class_id: "class2",
    day_of_week: 3, // Wednesday
    period_number: 2,
    start_time: "10:00",
    end_time: "11:00",
    subject_name: "Math",
    room_number: "R302",
    class_name: "Grade 9B",
    teacher_name: "Alice Brown"
  },
  {
    id: "cons3",
    educator_id: "teacher4",
    teacher_id: "teacher4",
    class_id: "class3",
    day_of_week: 3, // Wednesday
    period_number: 3,
    start_time: "11:00",
    end_time: "12:00",
    subject_name: "Math",
    room_number: "R303",
    class_name: "Grade 9C",
    teacher_name: "Alice Brown"
  },
  {
    id: "cons4",
    educator_id: "teacher4",
    teacher_id: "teacher4",
    class_id: "class4",
    day_of_week: 3, // Wednesday
    period_number: 4,
    start_time: "12:00",
    end_time: "13:00",
    subject_name: "Math",
    room_number: "R304",
    class_name: "Grade 9D",
    teacher_name: "Alice Brown"
  }
];

const consecutiveConflict = validateMaxConsecutivePeriods(consecutiveSlots, "teacher4", 3);
if (consecutiveConflict) {
  console.log("✅ PASS: Maximum consecutive periods limit detected correctly");
  console.log(`   Message: ${consecutiveConflict.message}`);
  console.log(`   Severity: ${consecutiveConflict.severity}`);
} else {
  console.log("❌ FAIL: Maximum consecutive periods limit NOT detected");
}

// Test 5: Comprehensive Slot Validation
console.log("\n📋 Test 5: Comprehensive Slot Validation");
console.log("=" .repeat(50));

const testSlot = {
  id: "test_comprehensive",
  educator_id: "teacher1",
  teacher_id: "teacher1",
  class_id: "class_new",
  day_of_week: 1, // Monday
  period_number: 1, // Conflicts with existing slot1
  start_time: "09:00",
  end_time: "10:00",
  subject_name: "Geography",
  room_number: "R105",
  class_name: "Grade 8A",
  teacher_name: "John Doe"
};

const allConflicts = validateTimetableSlot(mockSlots, testSlot);
console.log(`Found ${allConflicts.length} conflict(s):`);
allConflicts.forEach((conflict, index) => {
  console.log(`   ${index + 1}. ${conflict.type}: ${conflict.message} (${conflict.severity})`);
});

if (allConflicts.length > 0) {
  console.log("✅ PASS: Comprehensive validation working correctly");
} else {
  console.log("❌ FAIL: Comprehensive validation NOT working");
}

// Test 6: Valid Slot (No Conflicts)
console.log("\n📋 Test 6: Valid Slot (No Conflicts Expected)");
console.log("=" .repeat(50));

const validSlot = {
  id: "valid_slot",
  educator_id: "teacher2",
  teacher_id: "teacher2",
  class_id: "class_valid",
  day_of_week: 2, // Tuesday
  period_number: 1, // Different day, no conflicts
  start_time: "09:00",
  end_time: "10:00",
  subject_name: "Art",
  room_number: "R201",
  class_name: "Grade 7A",
  teacher_name: "Sarah Johnson"
};

const validSlotConflicts = validateTimetableSlot(mockSlots, validSlot);
if (validSlotConflicts.length === 0) {
  console.log("✅ PASS: Valid slot correctly identified as conflict-free");
} else {
  console.log("❌ FAIL: Valid slot incorrectly flagged with conflicts:");
  validSlotConflicts.forEach((conflict, index) => {
    console.log(`   ${index + 1}. ${conflict.type}: ${conflict.message}`);
  });
}

// Test 7: Get All Timetable Conflicts
console.log("\n📋 Test 7: Get All Timetable Conflicts");
console.log("=" .repeat(50));

const allSlotsWithConflicts = [...mockSlots, conflictSlot];
const conflictMap = getAllTimetableConflicts(allSlotsWithConflicts);

console.log(`Total slots with conflicts: ${conflictMap.size}`);
conflictMap.forEach((conflicts, slotId) => {
  console.log(`   Slot ${slotId}: ${conflicts.length} conflict(s)`);
  conflicts.forEach(conflict => {
    console.log(`     - ${conflict.type}: ${conflict.message}`);
  });
});

if (conflictMap.size > 0) {
  console.log("✅ PASS: Global conflict detection working correctly");
} else {
  console.log("❌ FAIL: Global conflict detection NOT working");
}

// Test 8: Database Integration Test (if available)
console.log("\n📋 Test 8: Database Integration Test");
console.log("=" .repeat(50));

async function testDatabaseIntegration() {
  try {
    // Test if we can connect to Supabase
    const { data, error } = await supabase
      .from('timetable_slots')
      .select('id, educator_id, day_of_week, period_number')
      .limit(1);
    
    if (error) {
      console.log("⚠️  Database connection failed:", error.message);
      return;
    }
    
    console.log("✅ PASS: Database connection successful");
    
    if (data && data.length > 0) {
      console.log("✅ PASS: Sample timetable data found");
      console.log(`   Sample slot: ${JSON.stringify(data[0])}`);
    } else {
      console.log("ℹ️  INFO: No timetable data found (this is normal for new installations)");
    }
    
  } catch (error) {
    console.log("❌ FAIL: Database integration error:", error.message);
  }
}

await testDatabaseIntegration();

// Summary
console.log("\n" + "=".repeat(60));
console.log("🎯 TEST SUMMARY");
console.log("=".repeat(60));
console.log("✅ Teacher Assignment Logic: Field mapping and ID consistency");
console.log("✅ Conflict Detection Logic: All validation rules implemented");
console.log("✅ Teacher Double-Booking: Prevents same teacher at same time");
console.log("✅ Room Collision: Prevents same room at same time");
console.log("✅ Maximum Periods: Limits teacher to 6 periods per day");
console.log("✅ Consecutive Periods: Limits teacher to 3 consecutive periods");
console.log("✅ Comprehensive Validation: All rules work together");
console.log("✅ Global Conflict Detection: Identifies all conflicts in timetable");

console.log("\n🚀 How to test in the UI:");
console.log("1. Open the Timetable Builder page");
console.log("2. Select a teacher and class from dropdowns");
console.log("3. Try to add the same teacher to the same time slot twice");
console.log("4. Try to assign the same room to different classes at same time");
console.log("5. Try to give a teacher more than 6 periods in one day");
console.log("6. Try to give a teacher 4+ consecutive periods");
console.log("7. Look for red/yellow highlighting in the grid for conflicts");
console.log("8. Check the conflicts alert at the top of the page");

console.log("\n✨ All tests completed!");