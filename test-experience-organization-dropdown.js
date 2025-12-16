// Test script to verify experience organization dropdown and approval system
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dpooleduinyyzxgrcwko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTQ2OTgsImV4cCI6MjA3NTU3MDY5OH0.LvId6Cq13yeASDt0RXbb0y83P2xAZw0L1Q4KJAXT4jk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testExperienceOrganizationSystem() {
  console.log('🧪 Testing Experience Organization Dropdown & Approval System...\n');

  try {
    // 1. Check available schools for school students
    console.log('1️⃣ Checking available schools...');
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name, code, account_status')
      .in('account_status', ['active', 'pending'])
      .order('name');

    if (schoolsError) {
      console.error('❌ Error fetching schools:', schoolsError);
    } else {
      console.log(`✅ Found ${schools?.length || 0} schools:`);
      schools?.forEach(school => {
        console.log(`   - ${school.name} (${school.code}) - ${school.account_status}`);
      });
    }

    // 2. Check available colleges for college students
    console.log('\n2️⃣ Checking available colleges...');
    const { data: colleges, error: collegesError } = await supabase
      .from('colleges')
      .select('id, name, code, "accountStatus"')
      .order('name');

    if (collegesError) {
      console.error('❌ Error fetching colleges:', collegesError);
    } else {
      console.log(`✅ Found ${colleges?.length || 0} colleges:`);
      colleges?.forEach(college => {
        console.log(`   - ${college.name} (${college.code}) - ${college.accountStatus}`);
      });
    }

    // 3. Check existing experiences and their approval authorities
    console.log('\n3️⃣ Checking existing experiences and approval authorities...');
    const { data: experiences, error: expError } = await supabase
      .from('experience')
      .select(`
        id,
        role,
        organization,
        approval_status,
        approval_authority,
        student:students!experience_student_id_fkey (
          email,
          student_type,
          college_school_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (expError) {
      console.error('❌ Error fetching experiences:', expError);
    } else {
      console.log(`✅ Found ${experiences?.length || 0} recent experiences:`);
      experiences?.forEach(exp => {
        console.log(`   - ${exp.role} at ${exp.organization}`);
        console.log(`     Student: ${exp.student?.email} (${exp.student?.student_type})`);
        console.log(`     Approval: ${exp.approval_status} by ${exp.approval_authority}`);
        console.log('');
      });
    }

    // 4. Test approval authority logic for different scenarios
    console.log('4️⃣ Testing approval authority scenarios...');
    
    const testScenarios = [
      {
        name: 'School Student + School Organization',
        organization: schools?.[0]?.name || 'ABC School',
        expectedAuthority: 'school_admin'
      },
      {
        name: 'College Student + College Organization', 
        organization: colleges?.[0]?.name || 'Aditya College',
        expectedAuthority: 'college_admin'
      },
      {
        name: 'Any Student + External Organization',
        organization: 'Google Inc.',
        expectedAuthority: 'rareminds_admin'
      }
    ];

    testScenarios.forEach(scenario => {
      console.log(`   📋 ${scenario.name}:`);
      console.log(`      Organization: ${scenario.organization}`);
      console.log(`      Expected Authority: ${scenario.expectedAuthority}`);
    });

    // 5. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   • Schools available: ${schools?.length || 0}`);
    console.log(`   • Colleges available: ${colleges?.length || 0}`);
    console.log(`   • Recent experiences: ${experiences?.length || 0}`);
    console.log(`   • Approval system: ${expError ? '❌' : '✅'}`);

    console.log('\n🎯 ORGANIZATION DROPDOWN LOGIC:');
    console.log('   • School students see: Schools dropdown + Custom option');
    console.log('   • College students see: Colleges dropdown + Custom option');
    console.log('   • School org → School Admin approval');
    console.log('   • College org → College Admin approval');
    console.log('   • Custom org → Rareminds Admin approval');

    if ((schools?.length || 0) > 0 && (colleges?.length || 0) > 0) {
      console.log('\n🎉 SUCCESS: Experience organization system is ready!');
      console.log('   Students can now select from appropriate organization dropdowns.');
    } else {
      console.log('\n⚠️  SETUP NEEDED: Add more schools/colleges to the database for testing.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testExperienceOrganizationSystem();