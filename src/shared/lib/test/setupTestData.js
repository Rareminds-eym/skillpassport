/**
 * Quick Test Data Setup for Supabase
 * 
 * This script helps you quickly add test learner data to your Supabase database
 * so you can see real data instead of the dummy "Sarah Johnson" mock data.
 * 
 * HOW TO USE:
 * 1. Make sure you're logged in as a learner
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file
 * 4. Call: await setupTestData()
 */

import { supabase } from './api';
import { getCurrentUser } from '@/shared/api/authUtils';
import { 
  learnerData as mocklearnerData,
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills
} from "@/shared/lib/test/mockData";

/**
 * Sets up test data for the currently logged-in Supabase user
 */
export async function setupTestData() {
  try {

    // 1. Get current user (via SSO, not Supabase auth)
    const { data: { user }, error: userError } = getCurrentUser();
    
    if (userError || !user) {
      console.error('❌ No Supabase user logged in!', userError);
      return {
        success: false,
        error: 'Please log in first'
      };
    }


    // 2. Check if learner record exists
    const { data: existingLearner, error: checkError } = await supabase
      .from('learners')
      .select('*')
      .eq('userId', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking learner:', checkError);
      return {
        success: false,
        error: checkError.message
      };
    }

    // 3. Build complete profile from mock data
    const profile = {
      // Basic info from mock data
      name: mocklearnerData.name || "Anannya Banerjee",
      department: mocklearnerData.department || "Computer Science Engineering",
      photo: mocklearnerData.photo || "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      verified: mocklearnerData.verified !== undefined ? mocklearnerData.verified : true,
      employabilityScore: mocklearnerData.employabilityScore || 85,
      cgpa: mocklearnerData.cgpa || "8.50",
      yearOfPassing: mocklearnerData.yearOfPassing || "2025",
      passportId: mocklearnerData.passportId || "SKP001",
      email: user.email,
      phone: mocklearnerData.phone || "+91 98765 43210",
      
      // Arrays from mock data
      education: educationData || [],
      training: trainingData || [],
      experience: experienceData || [],
      technicalSkills: technicalSkills || [],
      softSkills: softSkills || [],
      
      // Recent updates
      recentUpdates: [
        {
          id: 1,
          message: "Profile created in Supabase!",
          timestamp: new Date().toISOString(),
          type: "system"
        },
        {
          id: 2,
          message: "Education records imported",
          timestamp: new Date().toISOString(),
          type: "achievement"
        },
        {
          id: 3,
          message: "Skills data synchronized",
          timestamp: new Date().toISOString(),
          type: "achievement"
        }
      ],
      
      // Suggestions
      suggestions: [
        {
          id: 1,
          message: "Complete your profile to 100%",
          priority: 3,
          isActive: true
        },
        {
          id: 2,
          message: "Add your latest projects",
          priority: 2,
          isActive: true
        },
        {
          id: 3,
          message: "Update your skills assessment",
          priority: 1,
          isActive: true
        }
      ],
      
      // Opportunities
      opportunities: [
        {
          id: 1,
          title: "Web Developer Intern",
          company: "TCS",
          type: "internship",
          deadline: "2025-12-15",
          location: "Remote"
        },
        {
          id: 2,
          title: "React Developer",
          company: "Infosys",
          type: "full-time",
          deadline: "2025-11-30",
          location: "Bangalore"
        },
        {
          id: 3,
          title: "AI/ML Research Intern",
          company: "Google",
          type: "internship",
          deadline: "2025-12-20",
          location: "Hyderabad"
        }
      ]
    };

    let learnerId;

    if (existingLearner) {
      // 4a. Update existing learner
      
      const { error: updateError } = await supabase
        .from('learners')
        .update({
          profile: profile,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', user.id);

      if (updateError) {
        console.error('❌ Error updating learner:', updateError);
        return {
          success: false,
          error: updateError.message
        };
      }

      learnerId = existingLearner.id;
    } else {
      // 4b. Create new learner record
      
      const { data: newLearner, error: insertError } = await supabase
        .from('learners')
        .insert({
          userId: user.id,
          universityId: 'UNI001',
          profile: profile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating learner:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      learnerId = newLearner.id;
    }


    return {
      success: true,
      learnerId,
      userId: user.id,
      profile
    };

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

// Also export a function to check current data
export async function checkCurrentData() {
  try {
    const { data: { user } } = getCurrentUser();
    
    if (!user) {
      return null;
    }

    const { data: learner, error } = await supabase
      .from('learners')
      .select('*')
      .eq('userId', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error:', error);
      return null;
    }

    return learner;
  } catch (err) {
    console.error('Error:', err);
    return null;
  }
}

// Export for use in migration
export { setupTestData as default };
