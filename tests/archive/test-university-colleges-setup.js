/**
 * Test script to verify university_colleges table setup
 * Run this after creating the table to ensure everything works correctly
 */

import { supabase } from './src/lib/supabaseClient.js';
import {
    getCollegesByUniversity,
    addCollegeToUniversity,
    getAvailableColleges,
    getUniversityCollegeStats
} from './src/services/universityCollegeService.js';

async function testUniversityCollegesSetup() {
    console.log('🧪 Testing University Colleges Setup...\n');

    try {
        // Test 1: Check if table exists and has data
        console.log('1️⃣ Checking university_colleges table...');
        const { data: tableData, error: tableError } = await supabase
            .from('university_colleges')
            .select('*')
            .limit(5);

        if (tableError) {
            console.error('❌ Table check failed:', tableError.message);
            return;
        }

        console.log(`✅ Table exists with ${tableData.length} sample records`);
        if (tableData.length > 0) {
            console.log('Sample record:', JSON.stringify(tableData[0], null, 2));
        }

        // Test 2: Check organizations table for colleges
        console.log('\n2️⃣ Checking available colleges in organizations table...');
        const { data: orgsData, error: orgsError } = await supabase
            .from('organizations')
            .select('id, name, city, state, organization_type, approval_status')
            .eq('organization_type', 'college')
            .eq('approval_status', 'approved')
            .limit(5);

        if (orgsError) {
            console.error('❌ Organizations check failed:', orgsError.message);
            return;
        }

        console.log(`✅ Found ${orgsData.length} approved colleges in organizations table`);
        orgsData.forEach(org => {
            console.log(`  - ${org.name} (${org.city}, ${org.state})`);
        });

        // Test 3: Check universities
        console.log('\n3️⃣ Checking universities in organizations table...');
        const { data: universitiesData, error: universitiesError } = await supabase
            .from('organizations')
            .select('id, name, organization_type')
            .eq('organization_type', 'university')
            .limit(3);

        if (universitiesError) {
            console.error('❌ Universities check failed:', universitiesError.message);
            return;
        }

        console.log(`✅ Found ${universitiesData.length} universities`);
        universitiesData.forEach(uni => {
            console.log(`  - ${uni.name} (ID: ${uni.id})`);
        });

        // Test 4: Test service functions (if we have a university)
        if (universitiesData.length > 0) {
            const testUniversityId = universitiesData[0].id;
            console.log(`\n4️⃣ Testing service functions with university: ${universitiesData[0].name}`);

            // Test getCollegesByUniversity
            console.log('Testing getCollegesByUniversity...');
            const collegesResult = await getCollegesByUniversity(testUniversityId);
            if (collegesResult.success) {
                console.log(`✅ Found ${collegesResult.data.length} colleges for this university`);
            } else {
                console.log(`⚠️ No colleges found or error: ${collegesResult.error}`);
            }

            // Test getAvailableColleges
            console.log('Testing getAvailableColleges...');
            const availableResult = await getAvailableColleges(testUniversityId);
            if (availableResult.success) {
                console.log(`✅ Found ${availableResult.data.length} available colleges to add`);
            } else {
                console.log(`⚠️ Error getting available colleges: ${availableResult.error}`);
            }

            // Test getUniversityCollegeStats
            console.log('Testing getUniversityCollegeStats...');
            const statsResult = await getUniversityCollegeStats(testUniversityId);
            if (statsResult.success) {
                console.log('✅ College stats:', statsResult.data);
            } else {
                console.log(`⚠️ Error getting stats: ${statsResult.error}`);
            }
        }

        // Test 5: Check RLS policies
        console.log('\n5️⃣ Checking RLS policies...');
        const { data: policiesData, error: policiesError } = await supabase
            .rpc('pg_policies')
            .eq('tablename', 'university_colleges');

        if (!policiesError && policiesData) {
            console.log(`✅ Found ${policiesData.length} RLS policies for university_colleges table`);
        } else {
            console.log('⚠️ Could not check RLS policies (this is normal for non-admin users)');
        }

        console.log('\n🎉 University Colleges setup test completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Navigate to: http://localhost:3000/university-admin/colleges/registration');
        console.log('2. Login as a university admin');
        console.log('3. Try adding a college using the "Add College" button');
        console.log('4. Verify the college appears in the list');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run the test
testUniversityCollegesSetup();