import { supabase } from '@/shared/api/supabaseClient';

export const collegeEventRegistrationsService = {
  async createRegistration(eventId: string, studentId: string) {
    const { error } = await supabase
      .from('college_event_registrations')
      .insert({
        event_id: eventId,
        student_id: studentId
      });
    
    if (error) throw error;
  },

  async deleteRegistration(registrationId: string) {
    const { error } = await supabase
      .from('college_event_registrations')
      .delete()
      .eq('id', registrationId);
    
    if (error) throw error;
  },

  async updateAttendance(registrationId: string, attended: boolean) {
    const { error } = await supabase
      .from('college_event_registrations')
      .update({ attended })
      .eq('id', registrationId);
    
    if (error) throw error;
  }
};
