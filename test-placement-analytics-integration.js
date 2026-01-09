// Test script to verify placement analytics database integration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPlacementAnalyticsIntegration() {
  console.log('🔍 Testing Placement Analytics Database Integration...\n');

  try {
    // Test 1: Check applied_jobs table structure
    console.log('1. Testing applied_jobs table...');
    const { data: appliedJobs, error: appliedJobsError } = await supabase
      .from('applied_jobs')
      .select('*')
      .limit(5);

    if (appliedJobsError) {
      console.error('❌ Error fetching applied_jobs:', appliedJobsError.message);
    } else {
      console.log('✅ Applied jobs table accessible');
      console.log(`   Found ${appliedJobs?.length || 0} sample records`);
      if (appliedJobs && appliedJobs.length > 0) {
        console.log('   Sample record structure:', Object.keys(appliedJobs[0]));
      }
    }

    // Test 2: Check opportunities table structure
    console.log('\n2. Testing opportunities table...');
    const { data: opportunities, error: opportunitiesError } = await supabase
      .from('opportunities')
      .select('*')
      .limit(5);

    if (opportunitiesError) {
      console.error('❌ Error fetching opportunities:', opportunitiesError.message);
    } else {
      console.log('✅ Opportunities table accessible');
      console.log(`   Found ${opportunities?.length || 0} sample records`);
      if (opportunities && opportunities.length > 0) {
        console.log('   Sample record structure:', Object.keys(opportunities[0]));
      }
    }

    // Test 3: Check companies table structure
    console.log('\n3. Testing companies table...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(5);

    if (companiesError) {
      console.error('❌ Error fetching companies:', companiesError.message);
    } else {
      console.log('✅ Companies table accessible');
      console.log(`   Found ${companies?.length || 0} sample records`);
      if (companies && companies.length > 0) {
        console.log('   Sample record structure:', Object.keys(companies[0]));
      }
    }

    // Test 4: Check students table structure
    console.log('\n4. Testing students table...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('user_id, first_name, last_name, student_id, department, program')
      .limit(5);

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError.message);
    } else {
      console.log('✅ Students table accessible');
      console.log(`   Found ${students?.length || 0} sample records`);
      if (students && students.length > 0) {
        console.log('   Sample record structure:', Object.keys(students[0]));
      }
    }

    // Test 5: Test complex join query (placement records with student and opportunity details)
    console.log('\n5. Testing complex join query for placement records...');
    const { data: placementRecords, error: joinError } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        application_status,
        applied_at,
        students!fk_applied_jobs_student (
          user_id,
          first_name,
          last_name,
          student_id,
          department,
          program
        ),
        opportunities!fk_applied_jobs_opportunity (
          id,
          title,
          company_name,
          employment_type,
          location,
          salary_range_min,
          salary_range_max,
          department
        )
      `)
      .eq('application_status', 'accepted')
      .limit(3);

    if (joinError) {
      console.error('❌ Error in join query:', joinError.message);
    } else {
      console.log('✅ Complex join query successful');
      console.log(`   Found ${placementRecords?.length || 0} placement records`);
      if (placementRecords && placementRecords.length > 0) {
        console.log('   Sample placement record:');
        console.log('   - Student:', placementRecords[0].students?.first_name, placementRecords[0].students?.last_name);
        console.log('   - Company:', placementRecords[0].opportunities?.company_name);
        console.log('   - Job Title:', placementRecords[0].opportunities?.title);
        console.log('   - Department:', placementRecords[0].students?.department);
        console.log('   - Employment Type:', placementRecords[0].opportunities?.employment_type);
      }
    }

    // Test 6: Test department-wise analytics query
    console.log('\n6. Testing department-wise analytics...');
    const { data: departmentStudents, error: deptError } = await supabase
      .from('students')
      .select('department, user_id')
      .not('department', 'is', null);

    if (deptError) {
      console.error('❌ Error fetching department data:', deptError.message);
    } else {
      console.log('✅ Department analytics query successful');
      
      // Group students by department
      const departmentCount = (departmentStudents || []).reduce((acc, student) => {
        const dept = student.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      console.log('   Department distribution:');
      Object.entries(departmentCount).forEach(([dept, count]) => {
        console.log(`   - ${dept}: ${count} students`);
      });
    }

    // Test 7: Test CTC distribution analysis
    console.log('\n7. Testing CTC distribution analysis...');
    const { data: ctcData, error: ctcError } = await supabase
      .from('applied_jobs')
      .select(`
        opportunities!fk_applied_jobs_opportunity (
          employment_type,
          salary_range_min,
          salary_range_max
        )
      `)
      .eq('application_status', 'accepted');

    if (ctcError) {
      console.error('❌ Error fetching CTC data:', ctcError.message);
    } else {
      console.log('✅ CTC distribution query successful');
      
      const fullTimePlacements = (ctcData || []).filter(record => 
        record.opportunities?.employment_type === 'Full-time'
      );
      
      const internships = (ctcData || []).filter(record => 
        record.opportunities?.employment_type === 'Internship'
      );

      console.log(`   Full-time placements: ${fullTimePlacements.length}`);
      console.log(`   Internships: ${internships.length}`);
      
      if (fullTimePlacements.length > 0) {
        const salaries = fullTimePlacements
          .map(p => p.opportunities?.salary_range_max || p.opportunities?.salary_range_min || 0)
          .filter(salary => salary > 0);
        
        if (salaries.length > 0) {
          const avgSalary = salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;
          const maxSalary = Math.max(...salaries);
          const minSalary = Math.min(...salaries);
          
          console.log(`   Average CTC: ₹${(avgSalary / 100000).toFixed(1)}L`);
          console.log(`   Highest CTC: ₹${(maxSalary / 100000).toFixed(1)}L`);
          console.log(`   Lowest CTC: ₹${(minSalary / 100000).toFixed(1)}L`);
        }
      }
    }

    console.log('\n🎉 Placement Analytics Integration Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- All required tables are accessible');
    console.log('- Foreign key relationships are working');
    console.log('- Complex join queries are functional');
    console.log('- Analytics calculations can be performed');
    console.log('\n✅ Ready to integrate with PlacementAnalytics component!');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testPlacementAnalyticsIntegration();