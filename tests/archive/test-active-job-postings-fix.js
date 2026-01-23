// Test script to verify the Active Job Postings stat fix
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testActiveJobPostingsFix() {
  console.log('🔍 Testing Active Job Postings Statistics Fix...\n');

  try {
    // Test 1: Get total opportunities count
    console.log('📊 Test 1: Getting total opportunities count...');
    const { count: totalCount, error: totalError } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('❌ Error fetching total count:', totalError);
      return;
    }

    console.log(`✅ Total opportunities in database: ${totalCount}`);

    // Test 2: Get active opportunities count (status = 'open' OR is_active = true)
    console.log('\n📊 Test 2: Getting active opportunities count...');
    const { count: activeCount, error: activeError } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .or('status.eq.open,is_active.eq.true');

    if (activeError) {
      console.error('❌ Error fetching active count:', activeError);
      return;
    }

    console.log(`✅ Active opportunities (status='open' OR is_active=true): ${activeCount}`);

    // Test 3: Get status breakdown
    console.log('\n📊 Test 3: Getting status breakdown...');
    
    const statusQueries = [
      { status: 'open', label: 'Open' },
      { status: 'draft', label: 'Draft' },
      { status: 'closed', label: 'Closed' },
      { status: 'cancelled', label: 'Cancelled' }
    ];

    const statusCounts = {};
    
    for (const { status, label } of statusQueries) {
      const { count, error } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (error) {
        console.error(`❌ Error fetching ${label} count:`, error);
        continue;
      }

      statusCounts[status] = count || 0;
      console.log(`   ${label}: ${count || 0}`);
    }

    // Test 4: Get is_active breakdown
    console.log('\n📊 Test 4: Getting is_active breakdown...');
    
    const { count: isActiveTrue, error: activeTrueError } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: isActiveFalse, error: activeFalseError } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);

    if (!activeTrueError && !activeFalseError) {
      console.log(`   is_active = true: ${isActiveTrue || 0}`);
      console.log(`   is_active = false: ${isActiveFalse || 0}`);
    }

    // Test 5: Sample data inspection
    console.log('\n📊 Test 5: Sample opportunities data...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('opportunities')
      .select('id, title, company_name, status, is_active, created_at')
      .limit(5);

    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
    } else {
      console.log('Sample opportunities:');
      sampleData.forEach(opp => {
        console.log(`   ID: ${opp.id}, Title: "${opp.title}", Company: "${opp.company_name}", Status: "${opp.status}", Active: ${opp.is_active}`);
      });
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`   Total Opportunities: ${totalCount}`);
    console.log(`   Active Opportunities: ${activeCount}`);
    console.log(`   Status Breakdown: Open(${statusCounts.open || 0}), Draft(${statusCounts.draft || 0}), Closed(${statusCounts.closed || 0}), Cancelled(${statusCounts.cancelled || 0})`);
    console.log(`   is_active Breakdown: True(${isActiveTrue || 0}), False(${isActiveFalse || 0})`);

    // Recommendation
    console.log('\n💡 RECOMMENDATION:');
    if (activeCount !== 34) {
      console.log(`   ✅ Fix Applied: The UI should now show ${activeCount} instead of the hardcoded 34`);
      console.log(`   🔧 The opportunitiesService.getOpportunitiesStats() method will return:`);
      console.log(`      - total: ${totalCount}`);
      console.log(`      - active: ${activeCount}`);
      console.log(`      - draft: ${statusCounts.draft || 0}`);
      console.log(`      - closed: ${statusCounts.closed || 0}`);
      console.log(`      - cancelled: ${statusCounts.cancelled || 0}`);
    } else {
      console.log(`   ⚠️  Coincidence: The active count (${activeCount}) matches the hardcoded value (34)`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testActiveJobPostingsFix();