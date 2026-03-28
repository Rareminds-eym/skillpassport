/**
 * Quick Test Data Setup for Supabase
 * 
 * This script helps you quickly add test student data to your Supabase database
 * so you can see real data instead of the dummy "Sarah Johnson" mock data.
 * 
 * HOW TO USE:
 * 1. Make sure you're logged in as a student
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire file
 * 4. Call: await setupTestData()
 */

import { supabase } from './api';
import { 
  studentData as mockStudentData,
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills
} from '../components/Students/data/mockData';

/**
 * Sets up test data for the currently logged-in Supabase user
 */
export async function setupTestData() {
  try {

    // 1. Get current Supabase user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No Supabase user logged in!', userError);
      return {
        success: false,
        error: 'Please log in first'
      };
    }


    // 2. Check if student record exists
    const { data: existingStudent, error: checkError } = await supabase
      .from('students')
      .select('*')
      .eq('userId', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking student:', checkError);
      return {
        success: false,
        error: checkError.message
      };
    }

    // 3. Build complete profile from mock data
    const profile = {
      // Basic info from mock data
      name: mockStudentData.name || "Anannya Banerjee",
      department: mockStudentData.department || "Computer Science Engineering",
      photo: mockStudentData.photo || "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      verified: mockStudentData.verified !== undefined ? mockStudentData.verified : true,
      employabilityScore: mockStudentData.employabilityScore || 85,
      cgpa: mockStudentData.cgpa || "8.50",
      yearOfPassing: mockStudentData.yearOfPassing || "2025",
      passportId: mockStudentData.passportId || "SKP001",
      email: user.email,
      phone: mockStudentData.phone || "+91 98765 43210",
      
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

    let studentId;

    if (existingStudent) {
      // 4a. Update existing student
      
      const { error: updateError } = await supabase
        .from('students')
        .update({
          profile: profile,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', user.id);

      if (updateError) {
        console.error('❌ Error updating student:', updateError);
        return {
          success: false,
          error: updateError.message
        };
      }

      studentId = existingStudent.id;
    } else {
      // 4b. Create new student record
      
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
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
        console.error('❌ Error creating student:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      studentId = newStudent.id;
    }


    return {
      success: true,
      studentId,
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('userId', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error:', error);
      return null;
    }

    return student;
  } catch (err) {
    console.error('Error:', err);
    return null;
  }
}

// Export for use in migration
export { setupTestData as default };
