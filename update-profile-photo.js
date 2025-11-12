// Script to update educator profile photo
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateProfilePhoto() {
  console.log('📸 Updating educator profile photo...\n');

  try {
    const email = 'karthikeyan@rareminds.in';
    
    // You can change this URL to any photo you want
    const newPhotoUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
    
    console.log('📧 Email:', email);
    console.log('🖼️  New Photo URL:', newPhotoUrl);
    
    // Update the photo URL
    const { error } = await supabase
      .from('school_educators')
      .update({ 
        photo_url: newPhotoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (error) {
      console.log('❌ Update failed:', error.message);
      return;
    }

    console.log('✅ Photo URL updated successfully!');
    
    // Verify the update
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('school_educators')
      .select('photo_url, first_name, last_name, email')
      .eq('email', email)
      .single();

    if (fetchError) {
      console.log('❌ Verification failed:', fetchError.message);
    } else {
      console.log('\n📊 Updated profile:');
      console.log({
        name: `${updatedProfile.first_name} ${updatedProfile.last_name}`,
        email: updatedProfile.email,
        photo_url: updatedProfile.photo_url
      });
      
      console.log('\n🎉 Success! Refresh your profile page to see the new photo.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Uncomment the line below and run: node update-profile-photo.js
updateProfilePhoto();