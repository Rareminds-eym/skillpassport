// Test script to verify clearing photo URL works
import { supabase } from './src/lib/supabaseClient.js';

async function testClearPhoto() {
  console.log('🧪 Testing photo URL clearing...');
  
  const email = 'karthikeyan@rareminds.in';
  
  try {
    // First, get current profile
    console.log('📋 Getting current profile...');
    const { data: currentProfile, error: fetchError } = await supabase
      .from('school_educators')
      .select('photo_url, first_name, last_name')
      .eq('email', email)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching profile:', fetchError);
      return;
    }
    
    console.log('Current photo_url:', currentProfile.photo_url);
    
    // Test clearing photo URL
    console.log('🗑️ Clearing photo URL...');
    const { error: updateError } = await supabase
      .from('school_educators')
      .update({ 
        photo_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);
    
    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return;
    }
    
    // Verify the change
    console.log('✅ Verifying the change...');
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('school_educators')
      .select('photo_url')
      .eq('email', email)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }
    
    console.log('Updated photo_url:', updatedProfile.photo_url);
    
    if (updatedProfile.photo_url === null) {
      console.log('✅ SUCCESS: Photo URL successfully cleared!');
    } else {
      console.log('❌ FAILED: Photo URL was not cleared');
    }
    
    // Emit event to refresh header
    console.log('📢 Emitting profile update event...');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('educatorProfileUpdated'));
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testClearPhoto();