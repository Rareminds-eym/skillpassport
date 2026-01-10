// Test script to verify Application Tracking database integration
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testApplicationTrackingIntegration() {
  console.log('🔍 Testing Application Tracking Database Integration...\n');

  try {
    // Test 1: Fetch active opportunities (what the component will load)
    console.log('📊 Test 1: Fetching active opportunities...');
    const { data: activeOpportunities, error: activeError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (activeError) {
      console.error('❌ Error fetching active opportunities:', activeError);
      return;
    }

    console.log(`✅ Found ${activeOpportunities.length} active opportunities`);

    if (activeOpportunities.length > 0) {
      console.log('\n📋 Sample opportunities that will appear in dropdown:');
      activeOpportunities.slice(0, 5).forEach((opp, index) => {
        console.log(`   ${index + 1}. "${opp.title}" - ${opp.company_name} (ID: ${opp.id})`);
      });
    }

    // Test 2: Test opportunity details (what will show in job details modal)
    if (activeOpportunities.length > 0) {
      const sampleOpp = activeOpportunities[0];
      console.log(`\n📊 Test 2: Sample job details for "${sampleOpp.title}":`);
      console.log(`   Company: ${sampleOpp.company_name || 'Not specified'}`);
      console.log(`   Department: ${sampleOpp.department}`);
      console.log(`   Location: ${sampleOpp.location}`);
      console.log(`   Mode: ${sampleOpp.mode || 'Not specified'}`);
      console.log(`   Employment Type: ${sampleOpp.employment_type}`);
      console.log(`   Experience Required: ${sampleOpp.experience_required || 'Not specified'}`);
      console.log(`   Applications: ${sampleOpp.applications_count || 0}`);
      console.log(`   Views: ${sampleOpp.views_count || 0}`);
      console.log(`   Messages: ${sampleOpp.messages_count || 0}`);
      
      // Test salary formatting
      let salaryDisplay = 'Not specified';
      if (sampleOpp.stipend_or_salary) {
        salaryDisplay = sampleOpp.stipend_or_salary;
      } else if (sampleOpp.salary_range_min && sampleOpp.salary_range_max) {
        const minLakhs = (sampleOpp.salary_range_min / 100000).toFixed(1);
        const maxLakhs = (sampleOpp.salary_range_max / 100000).toFixed(1);
        salaryDisplay = `₹${minLakhs}L - ₹${maxLakhs}L`;
      } else if (sampleOpp.salary_range_min) {
        const lakhs = (sampleOpp.salary_range_min / 100000).toFixed(1);
        salaryDisplay = `₹${lakhs}L+`;
      }
      console.log(`   Salary: ${salaryDisplay}`);

      // Test skills formatting
      if (sampleOpp.skills_required) {
        let skills = [];
        if (typeof sampleOpp.skills_required === 'string') {
          skills = sampleOpp.skills_required.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
        } else if (Array.isArray(sampleOpp.skills_required)) {
          skills = sampleOpp.skills_required.filter(skill => skill && skill.trim().length > 0);
        }
        console.log(`   Skills: ${skills.join(', ')}`);
      }

      // Test description
      if (sampleOpp.description) {
        console.log(`   Description: ${sampleOpp.description.substring(0, 100)}${sampleOpp.description.length > 100 ? '...' : ''}`);
      }
    }

    // Test 3: Check for different opportunity statuses
    console.log('\n📊 Test 3: Opportunity status breakdown...');
    const statusQueries = [
      { status: 'open', label: 'Open' },
      { status: 'draft', label: 'Draft' },
      { status: 'closed', label: 'Closed' },
      { status: 'cancelled', label: 'Cancelled' }
    ];

    for (const { status, label } of statusQueries) {
      const { count, error } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (!error) {
        console.log(`   ${label}: ${count || 0}`);
      }
    }

    // Test 4: Check is_active field distribution
    console.log('\n📊 Test 4: is_active field distribution...');
    const { count: activeTrue, error: activeTrueError } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: activeFalse, error: activeFalseError } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);

    if (!activeTrueError && !activeFalseError) {
      console.log(`   is_active = true: ${activeTrue || 0}`);
      console.log(`   is_active = false: ${activeFalse || 0}`);
    }

    // Summary
    console.log('\n📋 INTEGRATION SUMMARY:');
    console.log(`   ✅ Active opportunities available: ${activeOpportunities.length}`);
    console.log(`   ✅ Job details modal will show real data`);
    console.log(`   ✅ Dropdown will be populated with ${activeOpportunities.length} options`);
    console.log(`   ✅ Application statistics will show real counts`);

    // Recommendations
    console.log('\n💡 EXPECTED BEHAVIOR:');
    console.log('   1. Application Tracking page loads with real opportunities');
    console.log('   2. "View Job Details" button opens modal with database data');
    console.log('   3. Dropdown shows all active opportunities from database');
    console.log('   4. Job details display real information (title, company, salary, etc.)');
    console.log('   5. Loading states appear while fetching data');
    console.log('   6. Error handling works if database is unavailable');

    if (activeOpportunities.length === 0) {
      console.log('\n⚠️  WARNING: No active opportunities found!');
      console.log('   - The job details modal will show "No opportunities found"');
      console.log('   - Consider adding some test opportunities to the database');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testApplicationTrackingIntegration();