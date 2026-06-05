import { apiPost } from '@/shared/api/apiClient';

export const mentorNotesService = {
  async deleteMentorNote(id: string) {
    // Use backend API instead of direct Supabase call
    const data = await apiPost('/college-admin/mentors', {
      action: 'deleteMentorNote',
      noteId: id,
    });
    return data;
  }
};
