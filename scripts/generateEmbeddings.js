/**
 * Generate Embeddings for Opportunities
 * Uses Transformers.js (FREE) - No API keys needed!
 * Run this script once to populate embeddings for existing opportunities
 */

import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialize Supabase with environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials!');
  console.error('Please add these to your .env file:');
  console.error('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

console.log('✅ Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize embedding model (downloads on first run, cached after)
let embeddingPipeline = null;

async function initializeModel() {
  if (!embeddingPipeline) {
    console.log('🔄 Loading embedding model (first run may take a minute)...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2' // Fast, lightweight model
    );
    console.log('✅ Model loaded!\n');
  }
  return embeddingPipeline;
}

/**
 * Generate embedding for a single opportunity
 */
async function generateOpportunityEmbedding(opportunity) {
  try {
    console.log(`📝 Processing: ${opportunity.job_title || opportunity.title}`);

    // Create text representation
    const text = [
      opportunity.title,
      opportunity.job_title,
      opportunity.company_name,
      opportunity.department,
      opportunity.description,
      opportunity.experience_level,
      opportunity.employment_type,
      opportunity.location,
      opportunity.mode,
      Array.isArray(opportunity.skills_required) 
        ? opportunity.skills_required.join(' ') 
        : '',
      Array.isArray(opportunity.requirements) 
        ? opportunity.requirements.join(' ') 
        : '',
      Array.isArray(opportunity.responsibilities) 
        ? opportunity.responsibilities.join(' ') 
        : ''
    ].filter(Boolean).join(' ');

    // Generate embedding using Transformers.js (FREE!)
    const model = await initializeModel();
    const output = await model(text, { pooling: 'mean', normalize: true });
    
    // Convert to array and ensure 1536 dimensions (pad with zeros if needed)
    let embedding = Array.from(output.data);
    
    // MiniLM model outputs 384 dimensions, pad to 1536 for compatibility
    while (embedding.length < 1536) {
      embedding.push(0);
    }
    embedding = embedding.slice(0, 1536); // Ensure exactly 1536

    // Save to database
    const { error } = await supabase
      .from('opportunities')
      .update({ embedding })
      .eq('id', opportunity.id);

    if (error) throw error;

    console.log(`✅ Embedding saved for: ${opportunity.job_title || opportunity.title}`);
    return { success: true, id: opportunity.id };
  } catch (error) {
    console.error(`❌ Failed for ${opportunity.id}:`, error.message);
    return { success: false, id: opportunity.id, error: error.message };
  }
}

/**
 * Generate embeddings for all opportunities
 */
async function generateAllEmbeddings() {
  try {
    console.log('🚀 Starting FREE embedding generation with Transformers.js!');
    console.log('🆓 No API keys needed - completely free!\n');
    
    // Initialize model first
    await initializeModel();

    // Fetch all opportunities without embeddings
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('*')
      .is('embedding', null)
      .eq('is_active', true);

    if (error) throw error;

    console.log(`📊 Found ${opportunities.length} opportunities without embeddings\n`);

    if (opportunities.length === 0) {
      console.log('✅ All opportunities already have embeddings!');
      return;
    }

    const results = [];

    // Process each opportunity (with delay to avoid rate limits)
    for (const opp of opportunities) {
      const result = await generateOpportunityEmbedding(opp);
      results.push(result);

      // Small delay for stability (no API rate limits!)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n📈 Summary:');
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('\n🎉 Embedding generation complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
generateAllEmbeddings();
