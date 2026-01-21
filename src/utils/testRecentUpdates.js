import { supabase } from '../lib/supabaseClient';

/**
 * Test utility to verify recent updates functionality
 */
export const testRecentUpdates = {
  /**
   * Test database connection and table structure
   */
  async testConnection() {
    try {
      const { data, error, count } = await supabase
        .from('recent_updates')
        .select('*', { count: 'exact' });

      if (error) {
        console.error('❌ Connection test failed:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('❌ Connection test error:', err);
      return false;
    }
  },

  /**
   * Create sample data for testing
   */
  async createSampleData(studentEmail = 'student@test.com') {
    try {
      // First check if student exists
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', studentEmail)
        .single();

      if (studentError) {
        console.error('❌ Student not found:', studentError);
        return false;
      }

      const sampleUpdates = {
        updates: [
          {
            id: 'test-1',
            message: 'Your profile has been viewed 15 times this week',
            timestamp: '2 hours ago',
            type: 'profile_view',
          },
          {
            id: 'test-2',
            message: 'New software engineering internship matches your skills',
            timestamp: '1 day ago',
            type: 'opportunity_match',
          },
          {
            id: 'test-3',
            message: 'You completed React Advanced Concepts course',
            timestamp: '3 days ago',
            type: 'course_completion',
          },
          {
            id: 'test-4',
            message: 'Your technical skills assessment score improved by 15%',
            timestamp: '1 week ago',
            type: 'assessment_improvement',
          },
        ],
      };

      const { data, error } = await supabase.from('recent_updates').upsert(
        {
          student_id: studentData.id,
          updates: sampleUpdates,
        },
        {
          onConflict: 'student_id',
        }
      );

      if (error) {
        console.error('❌ Failed to create sample data:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('❌ Error creating sample data:', err);
      return false;
    }
  },

  /**
   * Run all tests
   */
  async runAllTests(studentEmail) {
    const connectionTest = await this.testConnection();
    if (!connectionTest) {
      return false;
    }

    const sampleDataTest = await this.createSampleData(studentEmail);
    if (!sampleDataTest) {
      return false;
    }

    return true;
  },
};

// Export for use in browser console or other components
window.testRecentUpdates = testRecentUpdates;
