// Quick database fix for missing requisition_id column
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/"/g, '');
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.VITE_SUPABASE_ANON_KEY
);

async function quickFix() {
  console.log('🔧 Applying Quick Database Fix...\n');

  try {
    // Step 1: Add requisition_id column
    console.log('1️⃣ Adding requisition_id column to opportunities table...');
    
    const { data: addColumnResult, error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE opportunities 
        ADD COLUMN IF NOT EXISTS requisition_id TEXT REFERENCES requisitions(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_opportunities_requisition_id ON opportunities(requisition_id);
      `
    });

    if (addColumnError) {
      console.error('❌ Error adding column:', addColumnError);
      console.log('\n⚠️  You need to run this manually in Supabase SQL Editor:');
      console.log('ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS requisition_id TEXT;');
      return;
    }

    console.log('✅ Column added successfully');

    // Step 2: Create requisitions for existing opportunities
    console.log('\n2️⃣ Creating requisitions for existing opportunities...');
    
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('id, job_title, title, department, location, employment_type, is_active, description, created_at, recruiter_id')
      .is('requisition_id', null);

    if (oppError) {
      console.error('❌ Error fetching opportunities:', oppError);
      return;
    }

    console.log(`Found ${opportunities.length} opportunities without requisitions`);

    // Create requisitions
    for (const opp of opportunities) {
      const requisitionData = {
        id: `req_opp_${opp.id}`,
        title: opp.job_title || opp.title || 'Untitled Position',
        department: opp.department || 'General',
        location: opp.location || 'Not Specified',
        job_type: opp.employment_type || 'full_time',
        status: opp.is_active ? 'active' : 'closed',
        priority: 'medium',
        description: opp.description || '',
        salary_range: 'Not Specified',
        created_date: opp.created_at || new Date().toISOString(),
        owner: opp.recruiter_id || 'system',
        hiring_manager: opp.recruiter_id || 'system'
      };

      const { error: insertError } = await supabase
        .from('requisitions')
        .insert(requisitionData)
        .onConflict('id');

      if (insertError && !insertError.message.includes('duplicate key')) {
        console.error(`❌ Error creating requisition for opportunity ${opp.id}:`, insertError);
      }
    }

    console.log('✅ Requisitions created');

    // Step 3: Link opportunities to requisitions
    console.log('\n3️⃣ Linking opportunities to requisitions...');
    
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE opportunities 
        SET requisition_id = 'req_opp_' || id::TEXT 
        WHERE requisition_id IS NULL;
      `
    });

    if (updateError) {
      console.error('❌ Error linking opportunities:', updateError);
      return;
    }

    console.log('✅ Opportunities linked to requisitions');

    // Step 4: Verify the fix
    console.log('\n4️⃣ Verifying the fix...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('opportunities')
      .select('id, requisition_id')
      .limit(5);

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
      return;
    }

    const withReqId = verifyData.filter(o => o.requisition_id).length;
    console.log(`✅ ${withReqId}/${verifyData.length} opportunities now have requisition_id`);

    console.log('\n🎉 Quick fix completed! The "Error Loading Applications" should now be resolved.');
    console.log('\n💡 Next steps:');
    console.log('1. Test the application loading in your app');
    console.log('2. Run the full pipeline integration script for complete setup');

  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.log('\n⚠️  Manual fix required. Please run the SQL script in Supabase SQL Editor:');
    console.log('database/fix_pipeline_integration_complete.sql');
  }
}

quickFix();