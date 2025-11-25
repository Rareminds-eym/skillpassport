/**
 * Debug script to test college dropdown data flow
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugCollegeUI() {
  console.log('🔍 Debugging College UI Data Flow\n');
  console.log('=' .repeat(60));
  
  // Step 1: Fetch colleges
  console.log('\n📊 Step 1: Fetching colleges from database...');
  const { data: colleges, error } = await supabase
    .from('colleges')
    .select('id, name, city, state')
    .order('name');
  
  if (error) {
    console.error('❌ Error fetching colleges:', error);
    return;
  }
  
  console.log(`✅ Successfully fetched ${colleges?.length || 0} colleges`);
  console.log('\n📋 College Data:');
  colleges.forEach((college, index) => {
    console.log(`\n${index + 1}. ${college.name}`);
    console.log(`   ID: ${college.id}`);
    console.log(`   City: ${college.city || 'N/A'}`);
    console.log(`   State: ${college.state || 'N/A'}`);
    
    // Simulate dropdown option text
    let displayText = college.name;
    if (college.city) displayText += ` - ${college.city}`;
    if (college.state) displayText += `, ${college.state}`;
    console.log(`   Dropdown Text: "${displayText}"`);
  });
  
  // Step 2: Simulate what the UI would render
  console.log('\n' + '='.repeat(60));
  console.log('\n🎨 Step 2: Simulating UI Dropdown Rendering...\n');
  
  console.log('<select name="collegeId">');
  console.log('  <option value="">Choose your college</option>');
  
  if (colleges && colleges.length > 0) {
    colleges.forEach(college => {
      let displayText = college.name;
      if (college.city) displayText += ` - ${college.city}`;
      if (college.state) displayText += `, ${college.state}`;
      console.log(`  <option value="${college.id}">${displayText}</option>`);
    });
  } else {
    console.log('  <option value="" disabled>No colleges available</option>');
  }
  
  console.log('</select>');
  
  // Step 3: Check for potential issues
  console.log('\n' + '='.repeat(60));
  console.log('\n🔍 Step 3: Checking for potential issues...\n');
  
  const issues = [];
  
  if (!colleges || colleges.length === 0) {
    issues.push('❌ No colleges found in database');
  }
  
  colleges.forEach((college, index) => {
    if (!college.id) {
      issues.push(`❌ College ${index + 1} missing ID`);
    }
    if (!college.name || college.name.trim() === '') {
      issues.push(`❌ College ${index + 1} missing or empty name`);
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ No issues found! Data looks good.');
    console.log('\n💡 If colleges are not showing in UI, check:');
    console.log('   1. Is studentType === "college" when modal opens?');
    console.log('   2. Is the modal isOpen prop true?');
    console.log('   3. Check browser console for errors');
    console.log('   4. Check if getAllColleges() is being called');
    console.log('   5. Check React DevTools for colleges state');
  } else {
    console.log('⚠️  Issues found:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Debug complete!\n');
}

debugCollegeUI()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
