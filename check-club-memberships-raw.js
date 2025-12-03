import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkMemberships() {
    console.log('🔍 Checking club_memberships table with service role...\n');
    
    const studentEmail = 'litikesh@rareminds.in';
    
    const { data, error } = await supabase
        .from('club_memberships')
        .select('*')
        .eq('student_email', studentEmail);
    
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (data && data.length > 0) {
        console.log(`\n✅ Found ${data.length} memberships`);
        data.forEach((m, idx) => {
            console.log(`\n${idx + 1}.`, m);
        });
    } else {
        console.log('\n⚠️  No memberships found in club_memberships table');
        console.log('The view might be using a different source or the data is stored elsewhere.');
    }
}

checkMemberships().catch(console.error);
