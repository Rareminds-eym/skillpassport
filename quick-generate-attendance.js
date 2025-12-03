// Quick Demo Attendance Generator
// Copy your Supabase credentials below and run: node quick-generate-attendance.js

const SUPABASE_URL = 'https://iqvvvvvvvvvvvvvv.supabase.co'; // Replace with your URL
const SUPABASE_KEY = 'your-anon-key-here'; // Replace with your anon key
const SCHOOL_ID = '550e8400-e29b-41d4-a716-446655440000';

async function generateAttendance() {
  console.log('🚀 Generating demo attendance data...\n');

  try {
    // Fetch students
    const studentsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/students?school_id=eq.${SCHOOL_ID}&select=id,name,roll_number,grade,section`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const students = await studentsResponse.json();
    console.log(`✅ Found ${students.length} students\n`);

    const records = [];
    const today = new Date();

    for (const student of students) {
      console.log(`📝 ${student.name} (${student.roll_number})`);

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayOfWeek = date.getDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const random = Math.random();
        let status, timeIn, timeOut, remarks;

        if (random < 0.85) {
          status = 'present';
          timeIn = `08:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}:00`;
          timeOut = `15:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}:00`;
        } else if (random < 0.90) {
          status = 'absent';
          remarks = 'Absent without notice';
        } else if (random < 0.95) {
          status = 'late';
          timeIn = `08:${(30 + Math.floor(Math.random() * 30)).toString().padStart(2, '0')}:00`;
          timeOut = `15:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}:00`;
          remarks = 'Arrived late';
        } else {
          status = 'excused';
          remarks = 'Medical leave';
        }

        const mode = Math.random() < 0.7 ? 'manual' : Math.random() < 0.85 ? 'rfid' : 'biometric';

        records.push({
          student_id: student.id,
          school_id: SCHOOL_ID,
          date: date.toISOString().split('T')[0],
          status,
          time_in: timeIn || null,
          time_out: timeOut || null,
          mode,
          marked_by: 'system',
          remarks: remarks || null,
        });
      }
    }

    console.log(`\n📊 Generated ${records.length} records`);
    console.log('💾 Inserting into database...\n');

    // Insert in batches
    for (let i = 0; i < records.length; i += 100) {
      const batch = records.slice(i, i + 100);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/attendance_records`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=ignore-duplicates',
        },
        body: JSON.stringify(batch),
      });

      if (response.ok) {
        console.log(`✅ Batch ${Math.floor(i / 100) + 1} inserted`);
      } else {
        const error = await response.text();
        console.error(`❌ Error:`, error);
      }
    }

    console.log('\n✨ Complete! Refresh your Attendance & Reports page.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateAttendance();
