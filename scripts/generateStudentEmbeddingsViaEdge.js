/**
 * Generate Student Embeddings via Edge Function
 * Calls the deployed generate-embedding edge function
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials!');
  process.exit(1);
}

console.log('✅ Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate embedding for a single student via edge function
 */
async function generateStudentEmbedding(student) {
  try {
    console.log(`📝 Processing: ${student.name || student.email}`);

    // Extract profile data
    const profile = student.profile || {};
    
    // Create text representation
    const text = [
      student.name,
      student.email,
      profile.course,
      profile.branch_field,
      profile.university,
      profile.skill || '',
      Array.isArray(profile.technicalSkills) 
        ? profile.technicalSkills.map(s => s.name || s).join(' ') 
        : '',
      Array.isArray(profile.softSkills) 
        ? profile.softSkills.map(s => s.name || s).join(' ') 
        : '',
      Array.isArray(profile.training) 
        ? profile.training.map(t => t.course).join(' ') 
        : '',
      Array.isArray(profile.experience) 
        ? profile.experience.map(e => `${e.role} ${e.organization}`).join(' ') 
        : '',
      Array.isArray(profile.projects) 
        ? profile.projects.map(p => p.name).join(' ') 
        : ''
    ].filter(Boolean).join(' ');

    if (!text.trim()) {
      console.log(`⚠️ Skipping ${student.email}: No profile data`);
      return { success: false, id: student.id, reason: 'no_data' };
    }

    // Call edge function to generate embedding
    const { data, error } = await supabase.functions.invoke('generate-embedding', {
      body: {
        text,
        table: 'students',
        id: student.id,
        type: 'student'
      }
    });

    if (error) {
      console.error(`❌ Edge function error for ${student.id}:`, error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    if (data && data.success) {
      console.log(`✅ Embedding saved for: ${student.name || student.email}`);
      return { success: true, id: student.id };
    } else {
      console.error('Response data:', data);
      throw new Error(data?.error || 'Unknown error');
    }
  } catch (error) {
    console.error(`❌ Failed for ${student.id}:`, error.message || error);
    return { success: false, id: student.id, error: error.message };
  }
}

/**
 * Generate embeddings for all students
 */
async function generateAllStudentEmbeddings() {
  try {
    console.log('🚀 Starting student embedding generation via edge function!\n');

    // Fetch all students without embeddings
    const { data: students, error } = await supabase
      .from('students')
      .select('id, name, email, profile')
      .is('embedding', null);

    if (error) throw error;

    console.log(`📊 Found ${students.length} students without embeddings\n`);

    if (students.length === 0) {
      console.log('✅ All students already have embeddings!');
      return;
    }

    const results = [];

    // Process each student
    for (const student of students) {
      const result = await generateStudentEmbedding(student);
      results.push(result);

      // Small delay to avoid overwhelming the edge function
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const noData = results.filter(r => r.reason === 'no_data').length;

    console.log('\n📈 Summary:');
    console.log(`✅ Successful: ${successful}`);
    console.log(`⚠️ Skipped (no data): ${noData}`);
    console.log(`❌ Failed: ${failed - noData}`);
    console.log('\n🎉 Student embedding generation complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
generateAllStudentEmbeddings();
