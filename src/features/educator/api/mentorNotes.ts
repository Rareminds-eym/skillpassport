import { apiPost } from '@/shared/api/apiClient';

export const saveMentorNote = async ({
  learner_id,
  mentor_type,
  school_educator_id,
  college_lecturer_id,
  quick_notes,
  feedback,
  action_points,
}) => {
  const res = await apiPost('/educator/actions', {
    action: 'save-mentor-note',
    learner_id, mentor_type, school_educator_id, college_lecturer_id,
    quick_notes, feedback, action_points,
  });
  if (!res?.data) throw new Error('Failed to save mentor note');
  return res.data;
};

export const getLearners = async () => {
  const res = await apiPost('/educator/actions', { action: 'get-mentor-learners' });
  return res?.data || [];
};

export const getMentorNotes = async () => {
  const res = await apiPost('/educator/actions', { action: 'get-mentor-notes' });
  return res?.data || [];
};
