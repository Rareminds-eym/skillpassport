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
  const result: any = await apiPost('/educator-copilot/actions', {
    action: 'saveMentorNote',
    learner_id,
    mentor_type,
    school_educator_id,
    college_lecturer_id,
    quick_notes,
    feedback,
    action_points,
  });

  return result?.data;
};

export const getLearners = async () => {
  const result: any = await apiPost('/educator-copilot/actions', {
    action: 'getLearners',
  });

  return result?.data;
};

export const getMentorNotes = async () => {
  const result: any = await apiPost('/educator-copilot/actions', {
    action: 'getMentorNotes',
  });

  return result?.data;
};
