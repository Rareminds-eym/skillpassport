import { supabase } from '../lib/supabaseClient';
import userApiService from './userApiService';

// ==================== INTERVIEW CRUD OPERATIONS ====================

/**
 * Get all interviews
 */
export const getInterviews = async () => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return { data: null, error };
  }
};

/**
 * Get a single interview by ID
 */
export const getInterviewById = async (interviewId: string) => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching interview:', error);
    return { data: null, error };
  }
};

/**
 * Get interviews for a specific student
 */
export const getInterviewsForStudent = async (studentId: string) => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching student interviews:', error);
    return { data: null, error };
  }
};

/**
 * Get upcoming interviews
 */
export const getUpcomingInterviews = async () => {
  try {
    const { data, error } = await supabase
      .from('upcoming_interviews')
      .select('*');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching upcoming interviews:', error);
    return { data: null, error };
  }
};

/**
 * Get pending scorecards
 */
export const getPendingScorecards = async () => {
  try {
    const { data, error } = await supabase
      .from('pending_scorecards')
      .select('*');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching pending scorecards:', error);
    return { data: null, error };
  }
};

/**
 * Create a new interview
 */
export const createInterview = async (interviewData: {
  id: string;
  student_id?: string;
  candidate_name: string;
  candidate_email?: string;
  candidate_phone?: string;
  job_title: string;
  interviewer: string;
  interviewer_email?: string;
  date: string;
  duration?: number;
  status?: string;
  type: string;
  meeting_type?: string;
  meeting_link?: string;
  meeting_notes?: string;
  created_by?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .insert([interviewData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating interview:', error);
    return { data: null, error };
  }
};

/**
 * Update an interview
 */
export const updateInterview = async (
  interviewId: string,
  updates: Partial<{
    candidate_name: string;
    candidate_email: string;
    candidate_phone: string;
    job_title: string;
    interviewer: string;
    interviewer_email: string;
    date: string;
    duration: number;
    status: string;
    type: string;
    meeting_type: string;
    meeting_link: string;
    meeting_notes: string;
    reminders_sent: number;
    completed_date: string;
    scorecard: any;
  }>
) => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .update(updates)
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating interview:', error);
    return { data: null, error };
  }
};

/**
 * Delete an interview
 */
export const deleteInterview = async (interviewId: string) => {
  try {
    const { error } = await supabase
      .from('interviews')
      .delete()
      .eq('id', interviewId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting interview:', error);
    return { error };
  }
};

/**
 * Update interview status
 */
export const updateInterviewStatus = async (
  interviewId: string,
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'pending'
) => {
  try {
    const updates: any = { status };

    // If completing, set completed_date
    if (status === 'completed') {
      updates.completed_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('interviews')
      .update(updates)
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating interview status:', error);
    return { data: null, error };
  }
};

/**
 * Update interview scorecard
 */
export const updateScorecard = async (
  interviewId: string,
  scorecard: {
    technical_skills?: number;
    communication?: number;
    problem_solving?: number;
    cultural_fit?: number;
    overall_rating?: number;
    notes?: string;
    recommendation?: 'proceed' | 'maybe' | 'reject';
  }
) => {
  try {
    const { data, error } = await supabase
      .from('interviews')
      .update({
        scorecard,
        status: 'completed',
        completed_date: new Date().toISOString()
      })
      .eq('id', interviewId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating scorecard:', error);
    return { data: null, error };
  }
};

// ==================== INTERVIEW REMINDER OPERATIONS ====================

/**
 * Log interview reminder
 */
export const logInterviewReminder = async (reminderData: {
  interview_id: string;
  sent_to: string;
  reminder_type: 'interview_reminder' | 'follow_up' | 'scorecard_reminder';
  status?: 'sent' | 'delivered' | 'failed';
}) => {
  try {
    const { data, error } = await supabase
      .from('interview_reminders')
      .insert([reminderData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error logging reminder:', error);
    return { data: null, error };
  }
};

/**
 * Get reminder history for an interview
 */
export const getReminderHistory = async (interviewId: string) => {
  try {
    const { data, error } = await supabase
      .from('interview_reminders')
      .select('*')
      .eq('interview_id', interviewId)
      .order('sent_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching reminder history:', error);
    return { data: null, error };
  }
};

/**
 * Send interview reminder (increment count and log)
 */
export const sendInterviewReminder = async (
  interviewId: string,
  currentReminderCount: number,
  recipientInfo: string
) => {
  try {
    // Update reminders count
    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        reminders_sent: currentReminderCount + 1
      })
      .eq('id', interviewId);

    if (updateError) throw updateError;

    // Log reminder
    const { data, error: logError } = await logInterviewReminder({
      interview_id: interviewId,
      sent_to: recipientInfo,
      reminder_type: 'interview_reminder'
    });

    if (logError) throw logError;

    return { data, error: null };
  } catch (error) {
    console.error('Error sending reminder:', error);
    return { data: null, error };
  }
};

/**
 * Send interview reminder via Edge Function
 */
export const sendReminder = async (interviewId: string, recipientEmail?: string, recipientName?: string) => {
  try {
    // Get interview details if email/name not provided
    let email = recipientEmail;
    let name = recipientName;

    if (!email || !name) {
      const { data: interview, error } = await getInterviewById(interviewId);
      if (error || !interview) {
        return { data: null, error: 'Interview not found' };
      }
      email = email || interview.candidate_email;
      name = name || interview.candidate_name;
    }

    if (!email || !name) {
      return { data: null, error: 'Recipient email and name are required' };
    }

    // Call the Cloudflare Worker via userApiService

    try {
      const data = await userApiService.sendInterviewReminder({
        interviewId,
        recipientEmail: email,
        recipientName: name
      });

      return { data, error: null };
    } catch (error) {
      console.error('Interview reminder error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { data: null, error };
    }
  } catch (error) {
    console.error('Error sending reminder:', error);
    console.error('Error message:', error?.message);
    console.error('Error context:', error?.context);
    return { data: null, error };
  }
};

// ==================== ANALYTICS & STATISTICS ====================

/**
 * Get interview statistics
 */
export const getInterviewStatistics = async () => {
  try {
    const { data: allInterviews, error } = await getInterviews();

    if (error) throw error;

    const now = new Date();
    const upcoming = allInterviews?.filter(
      i => new Date(i.date) > now && i.status !== 'completed' && i.status !== 'cancelled'
    ) || [];

    const completed = allInterviews?.filter(i => i.status === 'completed') || [];

    const pendingScorecards = completed.filter(
      i => !i.scorecard || !i.scorecard.overall_rating
    );

    const scoredInterviews = completed.filter(
      i => i.scorecard && i.scorecard.overall_rating
    );

    const avgRating = scoredInterviews.length > 0
      ? scoredInterviews.reduce((sum, i) => sum + i.scorecard.overall_rating, 0) / scoredInterviews.length
      : 0;

    return {
      data: {
        total: allInterviews?.length || 0,
        upcoming: upcoming.length,
        completed: completed.length,
        pendingScorecards: pendingScorecards.length,
        avgRating: avgRating.toFixed(2),
        byStatus: {
          scheduled: allInterviews?.filter(i => i.status === 'scheduled').length || 0,
          confirmed: allInterviews?.filter(i => i.status === 'confirmed').length || 0,
          completed: completed.length,
          cancelled: allInterviews?.filter(i => i.status === 'cancelled').length || 0,
          pending: allInterviews?.filter(i => i.status === 'pending').length || 0
        }
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    return { data: null, error };
  }
};
