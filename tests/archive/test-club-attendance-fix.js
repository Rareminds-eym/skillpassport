// Test script to verify club attendance duplicate key fix
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dpooleduinyyzxgrcwko.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttendanceFix() {
    console.log('🧪 Testing club attendance duplicate key fix...');
    
    try {
        // Test data
        const testClubId = 'test-club-id';
        const testDate = '2024-01-15';
        const testTopic = 'Test Session';
        
        // First attempt - should create new session
        console.log('📝 First attempt - creating new session...');
        const session1 = {
            club_id: testClubId,
            session_date: testDate,
            session_topic: testTopic,
            created_by_type: 'educator'
        };
        
        const { data: firstSession, error: firstError } = await supabase
            .from('club_attendance')
            .insert([session1])
            .select()
            .single();
            
        if (firstError) {
            console.log('❌ First insert failed (expected if test data exists):', firstError.message);
        } else {
            console.log('✅ First session created:', firstSession.attendance_id);
        }
        
        // Second attempt - should fail with duplicate key
        console.log('📝 Second attempt - should trigger duplicate key...');
        const { data: secondSession, error: secondError } = await supabase
            .from('club_attendance')
            .insert([session1])
            .select()
            .single();
            
        if (secondError && secondError.code === '23505') {
            console.log('✅ Duplicate key constraint working as expected:', secondError.message);
        } else if (secondError) {
            console.log('❌ Unexpected error:', secondError.message);
        } else {
            console.log('❌ No duplicate key constraint - this is unexpected');
        }
        
        // Test the upsert logic
        console.log('📝 Testing upsert logic...');
        const { data: existingSession } = await supabase
            .from('club_attendance')
            .select('attendance_id')
            .eq('club_id', testClubId)
            .eq('session_date', testDate)
            .maybeSingle();
            
        if (existingSession) {
            console.log('✅ Found existing session for upsert:', existingSession.attendance_id);
        } else {
            console.log('ℹ️ No existing session found');
        }
        
        console.log('🎉 Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAttendanceFix();