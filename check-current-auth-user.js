// This script helps identify which user is currently logged in
// Run this in the browser console while logged in

console.log('=== Checking Current Auth User ===');

// Get Supabase client from window (if available)
if (typeof supabase !== 'undefined') {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
        if (error) {
            console.error('Error:', error);
            return;
        }
        
        if (!user) {
            console.log('❌ No user logged in');
            return;
        }
        
        console.log('✅ Current user:', {
            id: user.id,
            email: user.email,
            created_at: user.created_at
        });
        
        // Check school_educators
        supabase
            .from('school_educators')
            .select('*')
            .eq('user_id', user.id)
            .single()
            .then(({ data: educator, error: eduError }) => {
                if (educator) {
                    console.log('✅ Found in school_educators:', educator);
                } else {
                    console.log('⚠️ Not in school_educators');
                    
                    // Check schools table
                    supabase
                        .from('schools')
                        .select('*')
                        .eq('email', user.email)
                        .single()
                        .then(({ data: school, error: schoolError }) => {
                            if (school) {
                                console.log('✅ Found in schools:', school);
                            } else {
                                console.log('❌ Not found in schools either');
                                console.log('Error:', schoolError);
                            }
                        });
                }
            });
    });
} else {
    console.log('❌ Supabase client not found. Copy and paste this into browser console while on the app.');
}
