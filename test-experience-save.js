// Test script to manually save experience change
// Run this in browser console after logging in

const testExperienceSave = async () => {
  const email = 'aditi.sharma@aditya.college.edu';
  
  // The experience data with the change
  const experienceData = [
    {
      id: '9e48d6b0-0ced-44f2-aa2d-2b6f032fb715',
      role: 'market intern', // Changed from "Marketing Intern"
      organization: 'Company',
      start_date: '2024-01-01',
      end_date: '2025-12-31',
      description: '',
      approval_status: 'approved', // Current status
      enabled: true
    }
  ];
  
  console.log('🧪 Testing experience save with data:', experienceData);
  
  // This should trigger the versioning logic
  // Expected: has_pending_edit = true, verified_data = old data, pending_edit_data = new data
};

// Instructions:
// 1. Open browser console (F12)
// 2. Copy and paste this entire script
// 3. Call: testExperienceSave()
// 4. Check console for logs
// 5. Check database: docker exec supabase_db_sp-4 psql -U postgres -d postgres -c "SELECT role, has_pending_edit, verified_data->>'role', pending_edit_data->>'role' FROM experience WHERE id = '9e48d6b0-0ced-44f2-aa2d-2b6f032fb715';"
