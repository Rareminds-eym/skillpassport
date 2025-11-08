/**
 * Generate Embeddings for Students
 * Uses Transformers.js (FREE) - No API keys needed!
 */

import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';
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

// Initialize embedding model
let embeddingPipeline = null;

async function initializeModel() {
  if (!embeddingPipeline) {
    console.log('🔄 Loading embedding model...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('✅ Model loaded!\n');
  }
  return embeddingPipeline;
}

/**
 * Generate embedding for a single student
 */
async function generateStudentEmbedding(student) {
  try {
    console.log(`📝 Processing: ${student.name || student.email}`);

    // Extract profile data
    const profile = student.profile || {};
    
    // Create text representation from student profile
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

    // Generate embedding
    const model = await initializeModel();
    const output = await model(text, { pooling: 'mean', normalize: true });
    
    // Convert to array and pad to 1536 dimensions
    let embedding = Array.from(output.data);
    while (embedding.length < 1536) {
      embedding.push(0);
    }
    embedding = embedding.slice(0, 1536);

    // Save to database
    const { error } = await supabase
      .from('students')
      .update({ embedding })
      .eq('id', student.id);

    if (error) throw error;

    console.log(`✅ Embedding saved for: ${student.name || student.email}`);
    return { success: true, id: student.id };
  } catch (error) {
    console.error(`❌ Failed for ${student.id}:`, error.message);
    return { success: false, id: student.id, error: error.message };
  }
}

/**
 * Generate embeddings for all students
 */
async function generateAllStudentEmbeddings() {
  try {
    console.log('🚀 Starting FREE student embedding generation!\n');
    
    await initializeModel();

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

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
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
