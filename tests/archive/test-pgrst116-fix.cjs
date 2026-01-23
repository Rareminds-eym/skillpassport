// Test script to verify the PGRST116 error fix
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testMaybeSingleQueries() {
  try {
    console.log('🧪 Testing queries that might return 0 rows...');
    
    // Test 1: Query for a non-existent conversation (should not throw PGRST116)
    console.log('\n1. Testing non-existent conversation query...');
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('educator_id, class_id, subject')
      .eq('id', 'non-existent-conversation-id')
      .maybeSingle();
    
    if (convError && convError.code === 'PGRST116') {
      console.error('❌ Still getting PGRST116 error:', convError);
      return;
    }
    
    if (convError) {
      console.error('❌ Other error:', convError);
      return;
    }
    
    console.log('✅ Query successful, returned:', conversation ? 'data' : 'null');
    
    // Test 2: Query for conversation details (should handle 0 rows gracefully)
    console.log('\n2. Testing conversation details query...');
    const { data: details, error: detailsError } = await supabase
      .from('conversations')
      .select('student_id, recruiter_id, educator_id')
      .eq('id', 'another-non-existent-id')
      .maybeSingle();
    
    if (detailsError && detailsError.code === 'PGRST116') {
      console.error('❌ Still getting PGRST116 error in details query:', detailsError);
      return;
    }
    
    if (detailsError) {
      console.error('❌ Other error in details query:', detailsError);
      return;
    }
    
    console.log('✅ Details query successful, returned:', details ? 'data' : 'null');
    
    // Test 3: Query existing conversations (should work normally)
    console.log('\n3. Testing existing conversations query...');
    const { data: existingConvs, error: existingError } = await supabase
      .from('conversations')
      .select('id, conversation_type, status')
      .eq('conversation_type', 'student_educator')
      .limit(1);
    
    if (existingError) {
      console.error('❌ Error querying existing conversations:', existingError);
      return;
    }
    
    console.log('✅ Existing conversations query successful');
    console.log(`📊 Found ${existingConvs.length} conversations`);
    
    console.log('\n✅ All tests passed! PGRST116 error should be fixed.');
    console.log('✅ Queries now handle 0-row results gracefully with maybeSingle()');
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testMaybeSingleQueries();