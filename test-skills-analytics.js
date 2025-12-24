/**
 * Test script for Skills Analytics Service
 * Run this to verify the dynamic skills analysis is working
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test the skills analytics functionality
 */
async function testSkillsAnalytics() {
  console.log('🔍 Testing Skills Analytics Service...\n');

  try {
    // Test 1: Check opportunities table structure
    console.log('1. Checking opportunities table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('opportunities')
      .select('skills_required')
      .limit(1);

    if (tableError) {
      console.error('❌ Error accessing opportunities table:', tableError);
      return;
    }
    console.log('✅ Opportunities table accessible\n');

    // Test 2: Fetch sample opportunities with skills
    console.log('2. Fetching sample opportunities...');
    const { data: opportunities, error: oppsError } = await supabase
      .from('opportunities')
      .select('job_title, skills_required')
      .eq('is_active', true)
      .not('skills_required', 'is', null)
      .limit(5);

    if (oppsError) {
      console.error('❌ Error fetching opportunities:', oppsError);
      return;
    }

    console.log(`✅ Found ${opportunities?.length || 0} opportunities with skills`);
    if (opportunities && opportunities.length > 0) {
      console.log('Sample opportunities:');
      opportunities.forEach((opp, index) => {
        console.log(`  ${index + 1}. ${opp.job_title}: ${JSON.stringify(opp.skills_required)}`);
      });
    }
    console.log('');

    // Test 3: Analyze skills demand
    console.log('3. Analyzing skills demand...');
    const skillCounts = {};
    let totalOpportunities = 0;

    const { data: allOpportunities, error: allOppsError } = await supabase
      .from('opportunities')
      .select('skills_required')
      .eq('is_active', true)
      .not('skills_required', 'is', null);

    if (allOppsError) {
      console.error('❌ Error fetching all opportunities:', allOppsError);
      return;
    }

    totalOpportunities = allOpportunities?.length || 0;
    console.log(`📊 Analyzing ${totalOpportunities} opportunities...`);

    if (allOpportunities) {
      allOpportunities.forEach(opportunity => {
        if (opportunity.skills_required && Array.isArray(opportunity.skills_required)) {
          opportunity.skills_required.forEach(skill => {
            if (skill && typeof skill === 'string') {
              const normalizedSkill = skill.trim();
              if (normalizedSkill) {
                skillCounts[normalizedSkill] = (skillCounts[normalizedSkill] || 0) + 1;
              }
            }
          });
        }
      });
    }

    // Test 4: Display top skills
    console.log('4. Top 5 Skills in Demand:');
    const topSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({
        skill,
        count,
        percentage: Math.round((count / totalOpportunities) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (topSkills.length > 0) {
      console.log('🏆 Results:');
      topSkills.forEach((skill, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔹';
        console.log(`  ${medal} ${skill.skill}: ${skill.count} opportunities (${skill.percentage}%)`);
      });
    } else {
      console.log('❌ No skills data found');
    }

    console.log('\n✅ Skills Analytics test completed successfully!');
    console.log(`📈 Total skills analyzed: ${Object.keys(skillCounts).length}`);
    console.log(`📊 Total opportunities: ${totalOpportunities}`);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testSkillsAnalytics();