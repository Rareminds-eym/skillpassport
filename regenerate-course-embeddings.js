/**
 * Regenerate Course Embeddings
 * 
 * This script regenerates embeddings for all courses using the correct model
 * (text-embedding-3-small, 1536 dimensions) to match role embeddings.
 * 
 * Calls OpenRouter API directly to avoid worker credit issues.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const openrouterKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

if (!openrouterKey) {
  console.error('❌ Missing OPENROUTER_API_KEY!');
  console.error('Please set OPENROUTER_API_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate embedding using OpenRouter API directly
 */
async function generateEmbedding(text) {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://skillpassport.rareminds.in',
      'X-Title': 'SkillPassport Course Embeddings',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text.slice(0, 8000), // Max 8K tokens
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
    throw new Error(`Invalid OpenRouter response: ${JSON.stringify(data)}`);
  }
  
  return data.data[0].embedding;
}

async function regenerateEmbeddings() {
  console.log('🚀 Starting course embedding regeneration...\n');
  console.log('📡 Using OpenRouter API directly (text-embedding-3-small, 1536 dimensions)\n');

  // Fetch all active courses
  const { data: courses, error } = await supabase
    .from('courses')
    .select('course_id, title, description, category, target_outcomes')
    .eq('status', 'Active')
    .is('deleted_at', null)
    .order('title');

  if (error) {
    console.error('❌ Error fetching courses:', error);
    return;
  }

  console.log(`📚 Found ${courses.length} courses to process\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const progress = `[${i + 1}/${courses.length}]`;

    // Build course text for embedding
    const text = [
      course.title,
      course.description || '',
      course.category ? `Category: ${course.category}` : '',
      course.target_outcomes && Array.isArray(course.target_outcomes) && course.target_outcomes.length > 0 
        ? `Outcomes: ${course.target_outcomes.join(', ')}` 
        : ''
    ].filter(Boolean).join('. ');

    try {
      // Generate new embedding via OpenRouter
      const embedding = await generateEmbedding(text);

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response');
      }

      // Update course with new embedding
      const { error: updateError } = await supabase
        .from('courses')
        .update({ embedding })
        .eq('course_id', course.course_id);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ ${progress} ${course.title} (${embedding.length} dimensions)`);
      successCount++;

    } catch (err) {
      console.error(`❌ ${progress} ${course.title}: ${err.message}`);
      errors.push({ course: course.title, error: err.message });
      errorCount++;
    }

    // Rate limiting - wait 200ms between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📚 Total: ${courses.length}`);
  console.log('='.repeat(60));

  if (errors.length > 0 && errors.length <= 5) {
    console.log('\n⚠️  Errors:');
    errors.forEach(e => console.log(`   - ${e.course}: ${e.error}`));
  }

  if (successCount === courses.length) {
    console.log('\n🎉 All embeddings regenerated successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Hard refresh your browser (Ctrl+Shift+R)');
    console.log('   2. Click different job roles in the assessment results');
    console.log('   3. Verify courses are now relevant and different per role');
  } else if (successCount > 0) {
    console.log('\n⚠️  Some embeddings failed. You may want to re-run this script.');
  } else {
    console.log('\n❌ All embeddings failed. Check your OPENROUTER_API_KEY and account credits.');
  }
}

// Run the script
regenerateEmbeddings().catch(console.error);
