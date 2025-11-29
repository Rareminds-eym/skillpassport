/**
 * Generate Demo Attendance Data for Delhi Public School
 * Run this script to populate attendance data for the last 30 days
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

const SCHOOL_ID = '550e8400-e29b-41d4-a716-446655440000'; // Delhi Public School

async function generateDemoAttendance() {
  console.log('🚀 Starting demo attendance data generation...\n');

  try {
    // Fetch all students for the school
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, roll_number, grade, section')
      .eq('school_id', SCHOOL_ID);

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }

    if (!students || students.length === 0) {
      console.log('⚠️  No students found for this school');
      return;
    }

    console.log(`✅ Found ${students.length} students\n`);

    const attendanceRecords = [];
    const today = new Date();

    // Generate attendance for last 30 days
    for (const student of students) {
      console.log(`📝 Generating attendance for: ${student.name} (${student.roll_number})`);

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Skip weekends (0 = Sunday, 6 = Saturday)
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue;
        }

        // Generate random attendance status
        // 85% present, 5% absent, 5% late, 5% excused
        const random = Math.random();
        let status, timeIn, timeOut, remarks;

        if (random < 0.85) {
          status = 'present';
          // Random time between 8:00 and 8:30 AM
          const minutesOffset = Math.floor(Math.random() * 30);
          timeIn = `08:${minutesOffset.toString().padStart(2, '0')}:00`;
          // Random time between 3:00 and 3:30 PM
          const minutesOffsetOut = Math.floor(Math.random() * 30);
          timeOut = `15:${minutesOffsetOut.toString().padStart(2, '0')}:00`;
          remarks = null;
        } else if (random < 0.90) {
          status = 'absent';
          timeIn = null;
          timeOut = null;
          remarks = 'Absent without notice';
        } else if (random < 0.95) {
          status = 'late';
          // Random time between 8:30 and 9:00 AM
          const minutesOffset = 30 + Math.floor(Math.random() * 30);
          timeIn = `08:${minutesOffset.toString().padStart(2, '0')}:00`;
          const minutesOffsetOut = Math.floor(Math.random() * 30);
          timeOut = `15:${minutesOffsetOut.toString().padStart(2, '0')}:00`;
          remarks = 'Arrived late';
        } else {
          status = 'excused';
          timeIn = null;
          timeOut = null;
          remarks = 'Medical leave';
        }

        // Random mode
        const modeRandom = Math.random();
        const mode = modeRandom < 0.7 ? 'manual' : modeRandom < 0.85 ? 'rfid' : 'biometric';

        attendanceRecords.push({
          student_id: student.id,
          school_id: SCHOOL_ID,
          date: date.toISOString().split('T')[0],
          status,
          time_in: timeIn,
          time_out: timeOut,
          mode,
          marked_by: 'system',
          remarks,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    console.log(`\n📊 Generated ${attendanceRecords.length} attendance records`);
    console.log('💾 Inserting into database...\n');

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = attendanceRecords.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('attendance_records')
        .upsert(batch, { 
          onConflict: 'student_id,date',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, insertError);
      } else {
        console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
      }
    }

    // Verify the data
    console.log('\n📈 Verifying attendance data...\n');
    
    for (const student of students) {
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('student_id', student.id)
        .eq('school_id', SCHOOL_ID);

      if (!error && records) {
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const late = records.filter(r => r.status === 'late').length;
        const excused = records.filter(r => r.status === 'excused').length;
        const percentage = ((present + late + excused) / total * 100).toFixed(1);

        console.log(`${student.name} (${student.roll_number}):`);
        console.log(`  Total: ${total} | Present: ${present} | Absent: ${absent} | Late: ${late} | Excused: ${excused}`);
        console.log(`  Attendance: ${percentage}%\n`);
      }
    }

    console.log('✨ Demo attendance data generation complete!');
    console.log('🎉 You can now view the attendance reports in the UI');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
generateDemoAttendance();
