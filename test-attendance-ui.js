// Test Attendance Data Fetch in Browser Console
// Open browser console and paste this code to test

const SCHOOL_ID = '550e8400-e29b-41d4-a716-446655440000';
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your URL
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY'; // Replace with your anon key

async function testAttendanceData() {
  console.log('🧪 Testing attendance data fetch...\n');
  
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  console.log('Date range:', startDate, 'to', endDate);
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/attendance_records?school_id=eq.${SCHOOL_ID}&date=gte.${startDate}&date=lte.${endDate}&select=*,student:students(*)&order=date.desc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    
    const data = await response.json();
    
    console.log('✅ Response status:', response.status);
    console.log('📊 Total records:', data.length);
    console.log('📝 Sample record:', data[0]);
    
    if (data.length === 0) {
      console.warn('⚠️  No records found!');
    } else {
      // Group by student
      const byStudent = {};
      data.forEach(record => {
        const studentName = record.student?.name || 'Unknown';
        if (!byStudent[studentName]) {
          byStudent[studentName] = [];
        }
        byStudent[studentName].push(record);
      });
      
      console.log('\n📈 Records by student:');
      Object.entries(byStudent).forEach(([name, records]) => {
        console.log(`  ${name}: ${records.length} records`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testAttendanceData();
