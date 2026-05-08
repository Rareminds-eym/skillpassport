// api/mentorNotes.js
import { supabase } from '@/shared/api/supabaseClient'
// export const getLoggedInMentor = async (userId) => {
//   // 1️⃣ Check school educator
//   let { data: school, error: schoolErr } = await supabase
//     .from("school_educators")
//     .select("id")
//     .eq("user_id", userId)
//     .maybeSingle();

//   if (school) {
//     return { mentor_type: "school", mentor_id: school.id };
//   }

//   // 2️⃣ Check college lecturer
//   let { data: lecturer, error: lecErr } = await supabase
//     .from("college_lecturers")
//     .select("id")
//     .eq("user_id", userId)
//     .maybeSingle();

//   if (lecturer) {
//     return { mentor_type: "college", mentor_id: lecturer.id };
//   }

//   return null;
// };


// ⭐ Save a new mentor note
export const saveMentorNote = async ({
  learner_id,
  mentor_type,
  school_educator_id,
  college_lecturer_id,
  quick_notes,
  feedback,
  action_points,
}) => {
  const { data, error } = await supabase
    .from("mentor_notes")
    .insert([
      {
        learner_id,
        mentor_type,
        school_educator_id,
        college_lecturer_id,
        quick_notes,
        feedback,
        action_points,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

// ⭐ Fetch learners list
export const getLearners = async () => {
  const { data, error } = await supabase
    .from("learners")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
};

// ⭐ Fetch previous mentor notes with learner names
export const getMentorNotes = async () => {
  const { data, error } = await supabase
    .from("mentor_notes")
    .select(`
      id,
      learner_id,
      feedback,
      action_points,
      quick_notes,
      note_date,
      learners(name)
    `)
    .order("note_date", { ascending: false });

  if (error) throw error;
  return data;
};
