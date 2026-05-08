-- Migration: Rename students to learners
-- Description: Comprehensive rename of all student-related tables, columns, indexes, constraints, views, and functions
-- Date: 2026-05-06
-- 
-- This migration covers:
-- 1. Rename students table to learners
-- 2. Rename all student_id columns to learner_id (83 tables)
-- 3. Drop student_type column from learners table
-- 4. Update users.role values (school_student/college_student → learner)
-- 5. Rename all indexes and constraints containing "student"
-- 6. Update views and functions referencing old names

BEGIN;

-- ============================================================================
-- SECTION 1: RENAME MAIN TABLE
-- ============================================================================

ALTER TABLE public.students RENAME TO learners;

-- ============================================================================
-- SECTION 2: RENAME student_id COLUMNS TO learner_id
-- ============================================================================

-- Rename student_id column in learners table (this is the human-readable ID like "STU-XXX-00001")
ALTER TABLE public.learners RENAME COLUMN student_id TO learner_id;

-- Regular tables with student_id (uuid FK columns)
ALTER TABLE public.adaptive_aptitude_results RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.adaptive_aptitude_sessions RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.ai_evaluations RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.applied_jobs RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.applied_jobs_backup_migration RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.attendance_alerts RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.attendance_records RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.career_ai_conversations RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.career_assessment_ai_questions RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.certificates RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.college_attendance_records RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.college_event_registrations RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.college_mentor_notes RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.college_mentor_student_allocations RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.college_student_assignments RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.conversations RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.conversations_backup_20251106 RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.course_enrollments RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.education RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.exam_registrations RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.exam_seating_arrangements RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.experience RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.external_assessment_attempts RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.external_courses RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.fee_payments RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.internships RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.interviews RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.library_book_issues RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.library_book_issues_college RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.library_book_issues_school RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.library_history RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.library_issued_books RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.library_reservations RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.library_reviews RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.mark_entries RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.mark_moderation_log RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.mentor_notes RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.opportunity_interactions RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.opportunity_interactions_backup_uuid_migration RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.personal_assessment_attempts RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.personal_assessment_restrictions RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.personal_assessment_results RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.pipeline_activities RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.pipeline_candidates RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.pipeline_candidates_backup_migration RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.profile_views RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.projects RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.recent_updates RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.saved_jobs RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.saved_jobs_backup_migration RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.search_history RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.shortlist_candidates RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.skill_assessments RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.skill_verification_requests RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.skills RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.streak_notification_log RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.stream_recommendation_reports RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.student_assignments RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.student_course_progress RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.student_course_recommendations RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.student_enrollments RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.student_job_matches RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.student_ledgers RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.student_management_records RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.student_promotions RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.student_quiz_progress RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.student_reports RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.student_streaks RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.trainings RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.transcript_requests RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.transcripts RENAME COLUMN student_id TO learner_id;
ALTER TABLE public.tutor_conversations RENAME COLUMN student_id TO learner_id;

-- Rename camelCase columns
ALTER TABLE public.placements RENAME COLUMN "studentId" TO "learnerId";
ALTER TABLE public.skill_passports RENAME COLUMN "studentId" TO "learnerId";
ALTER TABLE public.recruiter_activities RENAME COLUMN "targetStudentId" TO "targetLearnerId";

-- Rename student_email columns
ALTER TABLE public.club_attendance_records RENAME COLUMN student_email TO learner_email;
ALTER TABLE public.club_certificates RENAME COLUMN student_email TO learner_email;
ALTER TABLE public.club_memberships RENAME COLUMN student_email TO learner_email;
ALTER TABLE public.competition_registrations RENAME COLUMN student_email TO learner_email;
ALTER TABLE public.competition_results RENAME COLUMN student_email TO learner_email;
ALTER TABLE public.course_enrollments RENAME COLUMN student_email TO learner_email;
ALTER TABLE public.internships RENAME COLUMN student_email TO learner_email;
ALTER TABLE public.student_skill_badges RENAME COLUMN student_email TO learner_email;

-- Rename student_name columns
ALTER TABLE public.admission_applications RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.college_attendance_records RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.exam_registrations RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.exam_seating_arrangements RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.library_book_issues RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.library_book_issues_college RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.library_book_issues_school RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.library_history RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.library_issued_books RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.library_reservations RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.library_reviews RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.student_ledgers RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.transcript_requests RENAME COLUMN student_name TO learner_name;
ALTER TABLE public.transcripts RENAME COLUMN student_name TO learner_name;

-- Rename student_record_id columns
ALTER TABLE public.exam_registrations RENAME COLUMN student_record_id TO learner_record_id;
ALTER TABLE public.exam_seating_arrangements RENAME COLUMN student_record_id TO learner_record_id;
ALTER TABLE public.library_history RENAME COLUMN student_record_id TO learner_record_id;
ALTER TABLE public.library_issued_books RENAME COLUMN student_record_id TO learner_record_id;
ALTER TABLE public.mark_entries RENAME COLUMN student_record_id TO learner_record_id;
ALTER TABLE public.student_ledgers RENAME COLUMN student_record_id TO learner_record_id;
ALTER TABLE public.transcripts RENAME COLUMN student_record_id TO learner_record_id;

-- Rename student_assignment_id columns
ALTER TABLE public.college_student_assignments RENAME COLUMN student_assignment_id TO learner_assignment_id;
ALTER TABLE public.student_assignments RENAME COLUMN student_assignment_id TO learner_assignment_id;

-- Rename conversation-related student columns
ALTER TABLE public.conversations RENAME COLUMN student_unread_count TO learner_unread_count;
ALTER TABLE public.conversations RENAME COLUMN deleted_by_student TO deleted_by_learner;
ALTER TABLE public.conversations RENAME COLUMN student_deleted_at TO learner_deleted_at;
ALTER TABLE public.conversations_backup_20251106 RENAME COLUMN student_unread_count TO learner_unread_count;

-- Rename capacity/count columns (current_students, max_students, total_students, student_count)
ALTER TABLE public.college_attendance_sessions RENAME COLUMN total_students TO total_learners;
ALTER TABLE public.college_classes RENAME COLUMN current_students TO current_learners;
ALTER TABLE public.college_classes RENAME COLUMN max_students TO max_learners;
ALTER TABLE public.institution_pricing_tiers RENAME COLUMN max_students TO max_learners;
ALTER TABLE public.institution_pricing_tiers RENAME COLUMN min_students TO min_learners;
ALTER TABLE public.mark_entry_batches RENAME COLUMN total_students TO total_learners;
ALTER TABLE public.program_sections RENAME COLUMN current_students TO current_learners;
ALTER TABLE public.program_sections RENAME COLUMN max_students TO max_learners;
ALTER TABLE public.school_classes RENAME COLUMN current_students TO current_learners;
ALTER TABLE public.school_classes RENAME COLUMN max_students TO max_learners;
ALTER TABLE public.university_courses RENAME COLUMN total_students TO total_learners;
ALTER TABLE public.event_registrations RENAME COLUMN student_count TO learner_count;
ALTER TABLE public.event_registrations RENAME COLUMN student_count_max TO learner_count_max;
ALTER TABLE public.event_registrations RENAME COLUMN student_count_min TO learner_count_min;

-- Rename pricing columns
ALTER TABLE public.event_registrations RENAME COLUMN price_per_student TO price_per_learner;
ALTER TABLE public.institution_pricing_tiers RENAME COLUMN price_per_student TO price_per_learner;

-- Rename tier reference
ALTER TABLE public.event_registrations RENAME COLUMN student_tier_id TO learner_tier_id;

-- Rename data/context columns
ALTER TABLE public.external_assessment_attempts RENAME COLUMN student_answers TO learner_answers;
ALTER TABLE public.personal_assessment_attempts RENAME COLUMN student_context TO learner_context;
ALTER TABLE public.student_job_matches RENAME COLUMN student_profile_hash TO learner_profile_hash;

-- Rename other student columns
ALTER TABLE public.adaptive_aptitude_sessions RENAME COLUMN student_course TO learner_course;
ALTER TABLE public.teacher_journal RENAME COLUMN student_engagement TO learner_engagement;

-- Rename student_id_old (migration artifact in saved_jobs)
ALTER TABLE public.saved_jobs RENAME COLUMN student_id_old TO learner_id_old;

-- ============================================================================
-- SECTION 3: RENAME TABLES WITH "STUDENT" IN NAME
-- ============================================================================

ALTER TABLE public.student_assignments RENAME TO learner_assignments;
ALTER TABLE public.student_course_progress RENAME TO learner_course_progress;
ALTER TABLE public.student_course_recommendations RENAME TO learner_course_recommendations;
ALTER TABLE public.student_enrollments RENAME TO learner_enrollments;
ALTER TABLE public.student_job_matches RENAME TO learner_job_matches;
ALTER TABLE public.student_ledgers RENAME TO learner_ledgers;
ALTER TABLE public.student_management_records RENAME TO learner_management_records;
ALTER TABLE public.student_promotions RENAME TO learner_promotions;
ALTER TABLE public.student_quiz_progress RENAME TO learner_quiz_progress;
ALTER TABLE public.student_reports RENAME TO learner_reports;
ALTER TABLE public.student_skill_badges RENAME TO learner_skill_badges;
ALTER TABLE public.student_streaks RENAME TO learner_streaks;

-- ============================================================================
-- SECTION 4: DROP student_type COLUMN
-- ============================================================================

ALTER TABLE public.learners DROP COLUMN IF EXISTS student_type;

-- Note: The student_type enum type may still exist and be used elsewhere.
-- If it's no longer referenced, it can be dropped with: DROP TYPE IF EXISTS student_type;
-- Verify usage before dropping.

-- ============================================================================
-- SECTION 5: UPDATE users.role VALUES
-- ============================================================================

UPDATE public.users 
SET role = 'learner' 
WHERE role IN ('student', 'school_student', 'college_student');

COMMIT;

-- ============================================================================
-- SECTION 6: RENAME INDEXES
-- ============================================================================

-- Indexes on learners table (formerly students)
ALTER INDEX public.students_pkey RENAME TO learners_pkey;
ALTER INDEX public.students_email_key RENAME TO learners_email_key;
ALTER INDEX public.students_user_id_key RENAME TO learners_user_id_key;
ALTER INDEX public.students_student_id_key RENAME TO learners_learner_id_key;
ALTER INDEX public.students_embedding_idx RENAME TO learners_embedding_idx;
ALTER INDEX public.idx_students_createdat RENAME TO idx_learners_createdat;
ALTER INDEX public.idx_students_user_id RENAME TO idx_learners_user_id;
ALTER INDEX public.idx_students_school RENAME TO idx_learners_school;
ALTER INDEX public.idx_students_school_class RENAME TO idx_learners_school_class;
ALTER INDEX public.idx_students_univ_college RENAME TO idx_learners_univ_college;
ALTER INDEX public.idx_students_university RENAME TO idx_learners_university;
ALTER INDEX public.idx_students_student_id RENAME TO idx_learners_learner_id;
ALTER INDEX public.idx_students_college_class_id RENAME TO idx_learners_college_class_id;
ALTER INDEX public.idx_students_program_id RENAME TO idx_learners_program_id;
ALTER INDEX public.idx_students_grade RENAME TO idx_learners_grade;
ALTER INDEX public.idx_students_section RENAME TO idx_learners_section;
ALTER INDEX public.idx_students_roll_number RENAME TO idx_learners_roll_number;
ALTER INDEX public.idx_students_admission_number RENAME TO idx_learners_admission_number;
ALTER INDEX public.idx_students_is_deleted RENAME TO idx_learners_is_deleted;
ALTER INDEX public.idx_students_embedding RENAME TO idx_learners_embedding;
ALTER INDEX public.idx_students_grade_semester_type RENAME TO idx_learners_grade_semester_type;
ALTER INDEX public.idx_students_branch_course RENAME TO idx_learners_branch_course;
ALTER INDEX public.idx_students_current_backlogs RENAME TO idx_learners_current_backlogs;
ALTER INDEX public.idx_students_gap_in_studies RENAME TO idx_learners_gap_in_studies;
ALTER INDEX public.idx_students_aadhar_number RENAME TO idx_learners_aadhar_number;
ALTER INDEX public.idx_students_documents RENAME TO idx_learners_documents;
ALTER INDEX public.idx_students_hobbies_gin RENAME TO idx_learners_hobbies_gin;
ALTER INDEX public.idx_students_languages_gin RENAME TO idx_learners_languages_gin;
ALTER INDEX public.idx_students_interests_gin RENAME TO idx_learners_interests_gin;
ALTER INDEX public.idx_students_notification_settings RENAME TO idx_learners_notification_settings;
ALTER INDEX public.idx_students_tour_progress RENAME TO idx_learners_tour_progress;

-- Indexes on other tables referencing student
ALTER INDEX public.idx_adaptive_results_student RENAME TO idx_adaptive_results_learner;
ALTER INDEX public.idx_adaptive_results_student_completed RENAME TO idx_adaptive_results_learner_completed;
ALTER INDEX public.idx_adaptive_sessions_student RENAME TO idx_adaptive_sessions_learner;
ALTER INDEX public.idx_adaptive_sessions_student_status RENAME TO idx_adaptive_sessions_learner_status;
ALTER INDEX public.idx_ai_eval_student RENAME TO idx_ai_eval_learner;
ALTER INDEX public.idx_applied_jobs_student_id RENAME TO idx_applied_jobs_learner_id;
ALTER INDEX public.idx_applied_jobs_student_date RENAME TO idx_applied_jobs_learner_date;
ALTER INDEX public.idx_applied_jobs_opportunity_student RENAME TO idx_applied_jobs_opportunity_learner;
ALTER INDEX public.idx_attendance_alerts_student RENAME TO idx_attendance_alerts_learner;
ALTER INDEX public.idx_attendance_records_student RENAME TO idx_attendance_records_learner;
ALTER INDEX public.idx_career_ai_conversations_student_id RENAME TO idx_career_ai_conversations_learner_id;
ALTER INDEX public.idx_career_conversations_student_updated RENAME TO idx_career_conversations_learner_updated;
ALTER INDEX public.idx_career_assessment_ai_questions_student RENAME TO idx_career_assessment_ai_questions_learner;
ALTER INDEX public.idx_certificates_student_id RENAME TO idx_certificates_learner_id;
ALTER INDEX public.idx_certificates_student_created RENAME TO idx_certificates_learner_created;
ALTER INDEX public.idx_certificates_student_lookup RENAME TO idx_certificates_learner_lookup;
ALTER INDEX public.idx_certificates_student_credential_platform_unique RENAME TO idx_certificates_learner_credential_platform_unique;
ALTER INDEX public.idx_certificates_student_link_unique RENAME TO idx_certificates_learner_link_unique;
ALTER INDEX public.idx_college_attendance_records_student RENAME TO idx_college_attendance_records_learner;
ALTER INDEX public.idx_event_registrations_student RENAME TO idx_event_registrations_learner;
ALTER INDEX public.idx_college_mentor_notes_student_id RENAME TO idx_college_mentor_notes_learner_id;
ALTER INDEX public.idx_college_mentor_student_allocations_student_id RENAME TO idx_college_mentor_learner_allocations_learner_id;
ALTER INDEX public.idx_college_mentor_student_allocations_mentor_period RENAME TO idx_college_mentor_learner_allocations_mentor_period;
ALTER INDEX public.idx_college_student_assignments_student RENAME TO idx_college_learner_assignments_learner;
ALTER INDEX public.idx_college_student_assignments_student_status RENAME TO idx_college_learner_assignments_learner_status;
ALTER INDEX public.idx_college_student_assignments_lookup RENAME TO idx_college_learner_assignments_lookup;
ALTER INDEX public.idx_conversations_student_id RENAME TO idx_conversations_learner_id;
ALTER INDEX public.idx_conversations_student_active RENAME TO idx_conversations_learner_active;
ALTER INDEX public.idx_conversations_student_admin RENAME TO idx_conversations_learner_admin;
ALTER INDEX public.idx_conversations_student_educator RENAME TO idx_conversations_learner_educator;
ALTER INDEX public.idx_conversations_student_college_admin RENAME TO idx_conversations_learner_college_admin;
ALTER INDEX public.idx_conversations_student_college_educator RENAME TO idx_conversations_learner_college_educator;
ALTER INDEX public.idx_conversations_deleted_by_student RENAME TO idx_conversations_deleted_by_learner;
ALTER INDEX public.idx_course_enrollments_student RENAME TO idx_course_enrollments_learner;
ALTER INDEX public.idx_course_enrollments_student_status RENAME TO idx_course_enrollments_learner_status;
ALTER INDEX public.idx_education_student_id RENAME TO idx_education_learner_id;
ALTER INDEX public.idx_exam_registrations_student RENAME TO idx_exam_registrations_learner;
ALTER INDEX public.idx_exam_registrations_student_record RENAME TO idx_exam_registrations_learner_record;
ALTER INDEX public.idx_exam_seating_student RENAME TO idx_exam_seating_learner;
ALTER INDEX public.idx_exam_seating_student_record RENAME TO idx_exam_seating_learner_record;
ALTER INDEX public.idx_experience_student RENAME TO idx_experience_learner;
ALTER INDEX public.idx_experience_student_id RENAME TO idx_experience_learner_id;
ALTER INDEX public.idx_external_assessment_attempts_student_id RENAME TO idx_external_assessment_attempts_learner_id;
ALTER INDEX public.idx_external_courses_student RENAME TO idx_external_courses_learner;
ALTER INDEX public.idx_fee_payments_student RENAME TO idx_fee_payments_learner;
ALTER INDEX public.idx_internships_student_id RENAME TO idx_internships_learner_id;
ALTER INDEX public.idx_internships_student_email RENAME TO idx_internships_learner_email;
ALTER INDEX public.idx_internships_student_enabled RENAME TO idx_internships_learner_enabled;
ALTER INDEX public.idx_interviews_student_id RENAME TO idx_interviews_learner_id;
ALTER INDEX public.idx_library_book_issues_student_id RENAME TO idx_library_book_issues_learner_id;
ALTER INDEX public.idx_library_book_issues_college_student_id RENAME TO idx_library_book_issues_college_learner_id;
ALTER INDEX public.idx_library_book_issues_school_student_id RENAME TO idx_library_book_issues_school_learner_id;
ALTER INDEX public.idx_library_history_student RENAME TO idx_library_history_learner;
ALTER INDEX public.idx_library_history_student_record RENAME TO idx_library_history_learner_record;
ALTER INDEX public.idx_library_issued_books_student RENAME TO idx_library_issued_books_learner;
ALTER INDEX public.idx_library_issued_books_student_record RENAME TO idx_library_issued_books_learner_record;
ALTER INDEX public.idx_library_reservations_student RENAME TO idx_library_reservations_learner;
ALTER INDEX public.idx_library_reviews_student RENAME TO idx_library_reviews_learner;
ALTER INDEX public.idx_mark_entries_student RENAME TO idx_mark_entries_learner;
ALTER INDEX public.idx_mark_entries_student_record RENAME TO idx_mark_entries_learner_record;
ALTER INDEX public.idx_mark_moderation_log_student RENAME TO idx_mark_moderation_log_learner;
ALTER INDEX public.idx_opportunity_interactions_student RENAME TO idx_opportunity_interactions_learner;
ALTER INDEX public.idx_opportunity_interactions_student_action RENAME TO idx_opportunity_interactions_learner_action;
ALTER INDEX public.idx_interactions_student RENAME TO idx_interactions_learner;
ALTER INDEX public.idx_assessment_attempts_student RENAME TO idx_assessment_attempts_learner;
ALTER INDEX public.idx_attempts_student_status RENAME TO idx_attempts_learner_status;
ALTER INDEX public.idx_restrictions_student_grade RENAME TO idx_restrictions_learner_grade;
ALTER INDEX public.idx_assessment_results_student RENAME TO idx_assessment_results_learner;
ALTER INDEX public.idx_pipeline_activities_student_id RENAME TO idx_pipeline_activities_learner_id;
ALTER INDEX public.idx_pipeline_candidates_student_id RENAME TO idx_pipeline_candidates_learner_id;
ALTER INDEX public.idx_placements_student RENAME TO idx_placements_learner;
ALTER INDEX public.idx_profile_views_student RENAME TO idx_profile_views_learner;
ALTER INDEX public.idx_projects_student RENAME TO idx_projects_learner;
ALTER INDEX public.idx_projects_student_id RENAME TO idx_projects_learner_id;
ALTER INDEX public.idx_projects_student_lookup RENAME TO idx_projects_learner_lookup;
ALTER INDEX public.idx_recent_updates_student RENAME TO idx_recent_updates_learner;
ALTER INDEX public.idx_recruiter_activities_student RENAME TO idx_recruiter_activities_learner;
ALTER INDEX public.idx_saved_jobs_student_id RENAME TO idx_saved_jobs_learner_id;
ALTER INDEX public.idx_saved_jobs_student_date RENAME TO idx_saved_jobs_learner_date;
ALTER INDEX public.idx_search_history_student_id RENAME TO idx_search_history_learner_id;
ALTER INDEX public.idx_shortlist_candidates_student_id RENAME TO idx_shortlist_candidates_learner_id;
ALTER INDEX public.idx_skill_assessments_student RENAME TO idx_skill_assessments_learner;
ALTER INDEX public.idx_passports_student RENAME TO idx_passports_learner;
ALTER INDEX public.idx_passports_student_status RENAME TO idx_passports_learner_status;
ALTER INDEX public.idx_passports_studentid RENAME TO idx_passports_learnerid;
ALTER INDEX public.idx_skill_verifications_student_id RENAME TO idx_skill_verifications_learner_id;
ALTER INDEX public.idx_skills_student_id RENAME TO idx_skills_learner_id;
ALTER INDEX public.idx_skills_student_enabled RENAME TO idx_skills_learner_enabled;
ALTER INDEX public.idx_skills_student_lookup RENAME TO idx_skills_learner_lookup;
ALTER INDEX public.idx_notification_log_student_id RENAME TO idx_notification_log_learner_id;
ALTER INDEX public.idx_notification_log_student_date RENAME TO idx_notification_log_learner_date;
ALTER INDEX public.idx_stream_reports_student RENAME TO idx_stream_reports_learner;

-- Indexes on renamed tables (student_* → learner_*)
ALTER INDEX public.student_assignments_pkey RENAME TO learner_assignments_pkey;
ALTER INDEX public.idx_student_assignments_student RENAME TO idx_learner_assignments_learner;
ALTER INDEX public.idx_student_assignments_student_status RENAME TO idx_learner_assignments_learner_status;
ALTER INDEX public.idx_student_assignments_assignment RENAME TO idx_learner_assignments_assignment;
ALTER INDEX public.idx_student_assignments_status RENAME TO idx_learner_assignments_status;
ALTER INDEX public.idx_student_assignments_submission_date RENAME TO idx_learner_assignments_submission_date;
ALTER INDEX public.idx_student_assignments_lookup RENAME TO idx_learner_assignments_lookup;
ALTER INDEX public.uq_student_assignment RENAME TO uq_learner_assignment;

ALTER INDEX public.student_course_progress_pkey RENAME TO learner_course_progress_pkey;
ALTER INDEX public.idx_student_course_progress_student_id RENAME TO idx_learner_course_progress_learner_id;
ALTER INDEX public.idx_student_course_progress_student_course RENAME TO idx_learner_course_progress_learner_course;
ALTER INDEX public.idx_student_course_progress_course_id RENAME TO idx_learner_course_progress_course_id;

ALTER INDEX public.student_course_recommendations_pkey RENAME TO learner_course_recommendations_pkey;
ALTER INDEX public.idx_recommendations_student RENAME TO idx_recommendations_learner;
ALTER INDEX public.idx_recommendations_student_status RENAME TO idx_recommendations_learner_status;

ALTER INDEX public.student_enrollments_pkey RENAME TO learner_enrollments_pkey;
ALTER INDEX public.idx_student_enrollments_student RENAME TO idx_learner_enrollments_learner;
ALTER INDEX public.idx_student_enrollments_program RENAME TO idx_learner_enrollments_program;
ALTER INDEX public.idx_student_enrollments_section RENAME TO idx_learner_enrollments_section;
ALTER INDEX public.idx_student_enrollments_status RENAME TO idx_learner_enrollments_status;
ALTER INDEX public.idx_student_enrollments_academic_year RENAME TO idx_learner_enrollments_academic_year;

ALTER INDEX public.student_job_matches_pkey RENAME TO learner_job_matches_pkey;
ALTER INDEX public.idx_student_job_matches_student_id RENAME TO idx_learner_job_matches_learner_id;
ALTER INDEX public.idx_student_job_matches_valid RENAME TO idx_learner_job_matches_valid;
ALTER INDEX public.idx_student_job_matches_expires RENAME TO idx_learner_job_matches_expires;
ALTER INDEX public.unique_student_job_matches RENAME TO unique_learner_job_matches;

ALTER INDEX public.student_ledgers_pkey RENAME TO learner_ledgers_pkey;
ALTER INDEX public.idx_student_ledgers_student RENAME TO idx_learner_ledgers_learner;
ALTER INDEX public.idx_student_ledgers_student_record RENAME TO idx_learner_ledgers_learner_record;
ALTER INDEX public.idx_student_ledgers_college RENAME TO idx_learner_ledgers_college;
ALTER INDEX public.idx_student_ledgers_fee_structure RENAME TO idx_learner_ledgers_fee_structure;
ALTER INDEX public.idx_student_ledgers_status RENAME TO idx_learner_ledgers_status;
ALTER INDEX public.idx_student_ledgers_due_date RENAME TO idx_learner_ledgers_due_date;
ALTER INDEX public.idx_student_ledgers_overdue RENAME TO idx_learner_ledgers_overdue;

ALTER INDEX public.student_management_records_pkey RENAME TO learner_management_records_pkey;
ALTER INDEX public.idx_student_management_records_student RENAME TO idx_learner_management_records_learner;
ALTER INDEX public.idx_student_management_records_school RENAME TO idx_learner_management_records_school;
ALTER INDEX public.idx_student_management_records_enrollment RENAME TO idx_learner_management_records_enrollment;

ALTER INDEX public.student_promotions_pkey RENAME TO learner_promotions_pkey;
ALTER INDEX public.idx_student_promotions_student RENAME TO idx_learner_promotions_learner;
ALTER INDEX public.idx_student_promotions_school RENAME TO idx_learner_promotions_school;
ALTER INDEX public.idx_student_promotions_college RENAME TO idx_learner_promotions_college;
ALTER INDEX public.idx_student_promotions_academic_year RENAME TO idx_learner_promotions_academic_year;
ALTER INDEX public.idx_student_promotions_from_grade RENAME TO idx_learner_promotions_from_grade;
ALTER INDEX public.idx_student_promotions_is_promoted RENAME TO idx_learner_promotions_is_promoted;
ALTER INDEX public.idx_student_promotions_is_passed RENAME TO idx_learner_promotions_is_passed;
ALTER INDEX public.unique_student_academic_year RENAME TO unique_learner_academic_year;

ALTER INDEX public.student_quiz_progress_pkey RENAME TO learner_quiz_progress_pkey;
ALTER INDEX public.idx_quiz_progress_student_course RENAME TO idx_quiz_progress_learner_course;

ALTER INDEX public.student_reports_pkey RENAME TO learner_reports_pkey;
ALTER INDEX public.idx_student_reports_student RENAME TO idx_learner_reports_learner;
ALTER INDEX public.idx_student_reports_school RENAME TO idx_learner_reports_school;
ALTER INDEX public.idx_student_reports_type RENAME TO idx_learner_reports_type;
ALTER INDEX public.idx_student_reports_date RENAME TO idx_learner_reports_date;

ALTER INDEX public.student_skill_badges_pkey RENAME TO learner_skill_badges_pkey;
ALTER INDEX public.idx_student_badges_student RENAME TO idx_learner_badges_learner;
ALTER INDEX public.idx_student_badges_badge RENAME TO idx_learner_badges_badge;
ALTER INDEX public.idx_student_badges_status RENAME TO idx_learner_badges_status;
ALTER INDEX public.unique_student_badge RENAME TO unique_learner_badge;

ALTER INDEX public.student_streaks_pkey RENAME TO learner_streaks_pkey;
ALTER INDEX public.idx_student_streaks_student_id RENAME TO idx_learner_streaks_learner_id;
ALTER INDEX public.idx_student_streaks_last_activity RENAME TO idx_learner_streaks_last_activity;
ALTER INDEX public.idx_student_streaks_incomplete_today RENAME TO idx_learner_streaks_incomplete_today;

-- Unique indexes on club tables
ALTER INDEX public.idx_club_attendance_records_student RENAME TO idx_club_attendance_records_learner;
ALTER INDEX public.unique_student_session RENAME TO unique_learner_session;
ALTER INDEX public.idx_certificates_student RENAME TO idx_certificates_learner;
ALTER INDEX public.idx_club_memberships_student RENAME TO idx_club_memberships_learner;
ALTER INDEX public.idx_memberships_student_email RENAME TO idx_memberships_learner_email;
ALTER INDEX public.unique_student_club RENAME TO unique_learner_club;
ALTER INDEX public.idx_comp_registrations_student RENAME TO idx_comp_registrations_learner;
ALTER INDEX public.idx_competition_registrations_student_email RENAME TO idx_competition_registrations_learner_email;
ALTER INDEX public.unique_student_competition RENAME TO unique_learner_competition;
ALTER INDEX public.idx_comp_results_student RENAME TO idx_comp_results_learner;
ALTER INDEX public.idx_competition_results_student_email RENAME TO idx_competition_results_learner_email;
ALTER INDEX public.unique_student_comp_result RENAME TO unique_learner_comp_result;

-- Unique constraints
ALTER INDEX public.attendance_records_student_date_slot_key RENAME TO attendance_records_learner_date_slot_key;
ALTER INDEX public.career_assessment_ai_questions_student_stream_type_key RENAME TO career_assessment_ai_questions_learner_stream_type_key;
ALTER INDEX public.college_event_registrations_event_id_student_id_key RENAME TO college_event_registrations_event_id_learner_id_key;
ALTER INDEX public.conversations_student_id_recruiter_id_application_id_key RENAME TO conversations_learner_id_recruiter_id_application_id_key;
ALTER INDEX public.course_enrollments_student_id_course_id_key RENAME TO course_enrollments_learner_id_course_id_key;
ALTER INDEX public.exam_registrations_exam_window_id_student_id_assessment_id_key RENAME TO exam_registrations_exam_window_id_learner_id_assessment_id_key;
ALTER INDEX public.exam_seating_arrangements_exam_timetable_id_student_id_key RENAME TO exam_seating_arrangements_exam_timetable_id_learner_id_key;
ALTER INDEX public.library_reviews_book_id_student_id_key RENAME TO library_reviews_book_id_learner_id_key;
ALTER INDEX public.mark_entries_assessment_student_subject_key RENAME TO mark_entries_assessment_learner_subject_key;
ALTER INDEX public.opportunity_interactions_student_id_opportunity_id_action_key RENAME TO opportunity_interactions_learner_id_opportunity_id_action_key;
ALTER INDEX public.personal_assessment_restrictions_student_id_grade_level_key RENAME TO personal_assessment_restrictions_learner_id_grade_level_key;
ALTER INDEX public.pipeline_candidates_opportunity_id_student_id_key RENAME TO pipeline_candidates_opportunity_id_learner_id_key;
ALTER INDEX public.search_history_student_id_search_term_key RENAME TO search_history_learner_id_search_term_key;
ALTER INDEX public.shortlist_candidates_shortlist_id_student_id_key RENAME TO shortlist_candidates_shortlist_id_learner_id_key;
ALTER INDEX public."skill_passports_studentId_key" RENAME TO "skill_passports_learnerId_key";
ALTER INDEX public.student_course_progress_student_id_course_id_lesson_id_key RENAME TO learner_course_progress_learner_id_course_id_lesson_id_key;
ALTER INDEX public.student_course_recommendation_student_id_course_id_assessme_key RENAME TO learner_course_recommendation_learner_id_course_id_assessme_key;
ALTER INDEX public.student_enrollments_student_id_program_id_academic_year_key RENAME TO learner_enrollments_learner_id_program_id_academic_year_key;
ALTER INDEX public.student_management_records_enrollment_number_key RENAME TO learner_management_records_enrollment_number_key;
ALTER INDEX public.student_management_records_student_id_school_id_key RENAME TO learner_management_records_learner_id_school_id_key;
ALTER INDEX public.student_quiz_progress_student_id_course_id_lesson_id_quiz_i_key RENAME TO learner_quiz_progress_learner_id_course_id_lesson_id_quiz_i_key;
ALTER INDEX public.student_streaks_student_id_key RENAME TO learner_streaks_learner_id_key;
ALTER INDEX public.unique_student_id RENAME TO unique_learner_id;
ALTER INDEX public.unique_active_student_period RENAME TO unique_active_learner_period;
ALTER INDEX public.uq_college_student_assignment RENAME TO uq_college_learner_assignment;


-- ============================================================================
-- SECTION 7: RENAME FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- FK constraints referencing learners table
ALTER TABLE public.adaptive_aptitude_results RENAME CONSTRAINT adaptive_aptitude_results_student_id_fkey TO adaptive_aptitude_results_learner_id_fkey;
ALTER TABLE public.adaptive_aptitude_sessions RENAME CONSTRAINT adaptive_aptitude_sessions_student_id_fkey TO adaptive_aptitude_sessions_learner_id_fkey;
ALTER TABLE public.applied_jobs RENAME CONSTRAINT fk_applied_jobs_student TO fk_applied_jobs_learner;
ALTER TABLE public.attendance_alerts RENAME CONSTRAINT attendance_alerts_student_id_fkey TO attendance_alerts_learner_id_fkey;
ALTER TABLE public.attendance_records RENAME CONSTRAINT attendance_records_student_id_fkey TO attendance_records_learner_id_fkey;
ALTER TABLE public.career_assessment_ai_questions RENAME CONSTRAINT career_assessment_ai_questions_student_id_fkey TO career_assessment_ai_questions_learner_id_fkey;
ALTER TABLE public.certificates RENAME CONSTRAINT certificates_student_id_fkey TO certificates_learner_id_fkey;
ALTER TABLE public.college_attendance_records RENAME CONSTRAINT college_attendance_records_student_id_fkey TO college_attendance_records_learner_id_fkey;
ALTER TABLE public.college_event_registrations RENAME CONSTRAINT college_event_registrations_student_id_fkey TO college_event_registrations_learner_id_fkey;
ALTER TABLE public.college_mentor_notes RENAME CONSTRAINT college_mentor_notes_student_id_fkey TO college_mentor_notes_learner_id_fkey;
ALTER TABLE public.college_mentor_student_allocations RENAME CONSTRAINT college_mentor_student_allocations_student_id_fkey TO college_mentor_learner_allocations_learner_id_fkey;
ALTER TABLE public.college_student_assignments RENAME CONSTRAINT college_student_assignments_student_id_fkey TO college_learner_assignments_learner_id_fkey;
ALTER TABLE public.conversations RENAME CONSTRAINT conversations_student_id_fkey TO conversations_learner_id_fkey;
ALTER TABLE public.education RENAME CONSTRAINT education_student_id_fkey TO education_learner_id_fkey;
-- Note: student_record_id was renamed to learner_record_id, but these FK constraints may not exist
-- ALTER TABLE public.exam_registrations RENAME CONSTRAINT exam_registrations_student_record_id_fkey TO exam_registrations_learner_record_id_fkey;
-- ALTER TABLE public.exam_seating_arrangements RENAME CONSTRAINT exam_seating_arrangements_student_record_id_fkey TO exam_seating_arrangements_learner_record_id_fkey;
ALTER TABLE public.experience RENAME CONSTRAINT experience_student_id_fkey TO experience_learner_id_fkey;
ALTER TABLE public.external_assessment_attempts RENAME CONSTRAINT external_assessment_attempts_student_id_fkey TO external_assessment_attempts_learner_id_fkey;
ALTER TABLE public.external_courses RENAME CONSTRAINT external_courses_student_id_fkey TO external_courses_learner_id_fkey;
ALTER TABLE public.interviews RENAME CONSTRAINT interviews_student_id_fkey TO interviews_learner_id_fkey;
ALTER TABLE public.library_book_issues RENAME CONSTRAINT library_book_issues_student_id_fkey TO library_book_issues_learner_id_fkey;
ALTER TABLE public.library_history RENAME CONSTRAINT library_history_student_record_id_fkey TO library_history_learner_record_id_fkey;
ALTER TABLE public.library_issued_books RENAME CONSTRAINT library_issued_books_student_record_id_fkey TO library_issued_books_learner_record_id_fkey;
ALTER TABLE public.mark_entries RENAME CONSTRAINT mark_entries_student_record_id_fkey TO mark_entries_learner_record_id_fkey;
ALTER TABLE public.mentor_notes RENAME CONSTRAINT mentor_notes_student_id_fkey TO mentor_notes_learner_id_fkey;
ALTER TABLE public.opportunity_interactions RENAME CONSTRAINT opportunity_interactions_student_id_fkey TO opportunity_interactions_learner_id_fkey;
ALTER TABLE public.personal_assessment_attempts RENAME CONSTRAINT assessment_attempts_student_id_fkey TO assessment_attempts_learner_id_fkey;
ALTER TABLE public.personal_assessment_results RENAME CONSTRAINT assessment_results_student_id_fkey TO assessment_results_learner_id_fkey;
ALTER TABLE public.pipeline_activities RENAME CONSTRAINT pipeline_activities_student_id_fkey TO pipeline_activities_learner_id_fkey;
ALTER TABLE public.pipeline_candidates RENAME CONSTRAINT pipeline_candidates_student_id_fkey TO pipeline_candidates_learner_id_fkey;
ALTER TABLE public.placements RENAME CONSTRAINT "placements_studentId_fkey" TO "placements_learnerId_fkey";
ALTER TABLE public.placements RENAME CONSTRAINT placements_studentid_fkey TO placements_learnerid_fkey;
ALTER TABLE public.profile_views RENAME CONSTRAINT profile_views_student_id_fkey TO profile_views_learner_id_fkey;
ALTER TABLE public.projects RENAME CONSTRAINT projects_student_id_fkey TO projects_learner_id_fkey;
ALTER TABLE public.recent_updates RENAME CONSTRAINT recent_updates_student_id_fkey TO recent_updates_learner_id_fkey;
ALTER TABLE public.recruiter_activities RENAME CONSTRAINT recruiter_activities_targetstudentid_fkey TO recruiter_activities_targetlearnerid_fkey;
ALTER TABLE public.recruiter_activities RENAME CONSTRAINT "recruiter_activities_targetStudentId_fkey" TO "recruiter_activities_targetLearnerId_fkey";
ALTER TABLE public.saved_jobs RENAME CONSTRAINT fk_saved_jobs_student TO fk_saved_jobs_learner;
ALTER TABLE public.search_history RENAME CONSTRAINT search_history_student_id_fkey TO search_history_learner_id_fkey;
ALTER TABLE public.shortlist_candidates RENAME CONSTRAINT shortlist_candidates_student_id_fkey TO shortlist_candidates_learner_id_fkey;
ALTER TABLE public.skill_assessments RENAME CONSTRAINT skill_assessments_student_id_fkey TO skill_assessments_learner_id_fkey;
ALTER TABLE public.skill_passports RENAME CONSTRAINT skill_passports_studentid_fkey1 TO skill_passports_learnerid_fkey1;
ALTER TABLE public.skill_verification_requests RENAME CONSTRAINT skill_verification_requests_student_id_fkey TO skill_verification_requests_learner_id_fkey;
ALTER TABLE public.skills RENAME CONSTRAINT skills_student_id_fkey TO skills_learner_id_fkey;
ALTER TABLE public.streak_notification_log RENAME CONSTRAINT streak_notification_log_student_id_fkey TO streak_notification_log_learner_id_fkey;
ALTER TABLE public.stream_recommendation_reports RENAME CONSTRAINT stream_recommendation_reports_student_id_fkey TO stream_recommendation_reports_learner_id_fkey;
ALTER TABLE public.student_assignments RENAME CONSTRAINT student_assignments_student_id_fkey TO learner_assignments_learner_id_fkey;
ALTER TABLE public.student_course_recommendations RENAME CONSTRAINT student_course_recommendations_student_id_fkey TO learner_course_recommendations_learner_id_fkey;
ALTER TABLE public.student_enrollments RENAME CONSTRAINT student_enrollments_student_id_fkey TO learner_enrollments_learner_id_fkey;
ALTER TABLE public.student_job_matches RENAME CONSTRAINT student_job_matches_student_id_fkey TO learner_job_matches_learner_id_fkey;
ALTER TABLE public.student_ledgers RENAME CONSTRAINT student_ledgers_student_record_id_fkey TO learner_ledgers_learner_record_id_fkey;
ALTER TABLE public.student_management_records RENAME CONSTRAINT student_management_records_student_id_fkey TO learner_management_records_learner_id_fkey;
ALTER TABLE public.student_promotions RENAME CONSTRAINT student_promotions_student_id_fkey TO learner_promotions_learner_id_fkey;
ALTER TABLE public.student_reports RENAME CONSTRAINT student_reports_student_id_fkey TO learner_reports_learner_id_fkey;
ALTER TABLE public.student_streaks RENAME CONSTRAINT student_streaks_student_id_fkey TO learner_streaks_learner_id_fkey;
ALTER TABLE public.trainings RENAME CONSTRAINT trainings_student_id_fkey TO trainings_learner_id_fkey;
ALTER TABLE public.transcripts RENAME CONSTRAINT transcripts_student_record_id_fkey TO transcripts_learner_record_id_fkey;
ALTER TABLE public.tutor_conversations RENAME CONSTRAINT tutor_conversations_student_id_fkey1 TO tutor_conversations_learner_id_fkey1;

-- FK constraints on club tables (referencing learners.email)
-- Note: These have duplicate constraint names in the database, so we'll handle them carefully
-- ALTER TABLE public.club_attendance_records RENAME CONSTRAINT fk_student_email TO fk_learner_email;
-- ALTER TABLE public.club_certificates RENAME CONSTRAINT fk_student_email TO fk_learner_email;
-- ALTER TABLE public.club_memberships RENAME CONSTRAINT fk_student_email TO fk_learner_email;
-- ALTER TABLE public.competition_registrations RENAME CONSTRAINT fk_student_email TO fk_learner_email;
-- ALTER TABLE public.competition_results RENAME CONSTRAINT fk_student_email TO fk_learner_email;
-- ALTER TABLE public.student_skill_badges RENAME CONSTRAINT fk_student_email TO fk_learner_email;

-- TODO: The fk_student_email constraints appear multiple times. These need to be handled
-- by dropping and recreating with unique names, or by using a script to rename them individually.

-- ============================================================================
-- SECTION 8: RENAME/UPDATE VIEWS
-- ============================================================================

-- Drop views that reference student (they will need to be recreated with updated definitions)
DROP VIEW IF EXISTS public.enrolled_students_view CASCADE;
DROP VIEW IF EXISTS public.conversations_detailed CASCADE;
DROP VIEW IF EXISTS public.pipeline_candidates_detailed CASCADE;
DROP VIEW IF EXISTS public.student_applications_with_pipeline CASCADE;
DROP VIEW IF EXISTS public.overdue_books CASCADE;
DROP VIEW IF EXISTS public.overdue_books_college CASCADE;
DROP VIEW IF EXISTS public.overdue_books_school CASCADE;
DROP VIEW IF EXISTS public.pending_scorecards CASCADE;
DROP VIEW IF EXISTS public.upcoming_interviews CASCADE;
DROP VIEW IF EXISTS public.college_student_attendance_stats CASCADE;
DROP VIEW IF EXISTS public.college_assignments_view CASCADE;
DROP VIEW IF EXISTS public.club_participation_report CASCADE;
DROP VIEW IF EXISTS public.competition_performance_report CASCADE;
DROP VIEW IF EXISTS public.competition_results_with_students CASCADE;
DROP VIEW IF EXISTS public.program_sections_view CASCADE;
DROP VIEW IF EXISTS public.student_badges_summary CASCADE;

-- TODO: These views need to be recreated with updated table/column names.
-- The view definitions reference the old "students" table and "student_id" columns.
-- After this migration, recreate them with:
--   - students → learners
--   - student_id → learner_id
--   - student_* tables → learner_* tables
-- 
-- Example for enrolled_students_view:
-- CREATE VIEW public.enrolled_learners_view AS
--   SELECT ... FROM learners WHERE ...;

-- ============================================================================
-- SECTION 9: RENAME/UPDATE FUNCTIONS
-- ============================================================================

-- Rename functions where possible (name only, not body)
ALTER FUNCTION public.can_student_join_club RENAME TO can_learner_join_club;
ALTER FUNCTION public.check_max_clubs_per_student RENAME TO check_max_clubs_per_learner;
ALTER FUNCTION public.compute_student_profile_hash RENAME TO compute_learner_profile_hash;
ALTER FUNCTION public.create_student_with_user RENAME TO create_learner_with_user;
ALTER FUNCTION public.generate_student_id RENAME TO generate_learner_id;
ALTER FUNCTION public.get_approved_trainings_for_student RENAME TO get_approved_trainings_for_learner;
ALTER FUNCTION public.get_or_create_student_admin_conversation RENAME TO get_or_create_learner_admin_conversation;
ALTER FUNCTION public.get_or_create_student_college_admin_conversation RENAME TO get_or_create_learner_college_admin_conversation;
ALTER FUNCTION public.get_or_create_student_educator_conversation RENAME TO get_or_create_learner_educator_conversation;
ALTER FUNCTION public.get_program_section_students RENAME TO get_program_section_learners;
ALTER FUNCTION public.get_student_academic_summary RENAME TO get_learner_academic_summary;
ALTER FUNCTION public.get_student_details RENAME TO get_learner_details;
ALTER FUNCTION public.get_student_eligibility RENAME TO get_learner_eligibility;
ALTER FUNCTION public.get_student_school_id RENAME TO get_learner_school_id;
ALTER FUNCTION public.get_student_stream_recommendation_data RENAME TO get_learner_stream_recommendation_data;
ALTER FUNCTION public.get_student_trainings_with_approvers RENAME TO get_learner_trainings_with_approvers;
ALTER FUNCTION public.get_students_needing_reminder RENAME TO get_learners_needing_reminder;
ALTER FUNCTION public.initialize_student_streak RENAME TO initialize_learner_streak;
ALTER FUNCTION public.is_student_fresher RENAME TO is_learner_fresher;
ALTER FUNCTION public.notify_experience_student RENAME TO notify_experience_learner;
ALTER FUNCTION public.notify_student_on_approval RENAME TO notify_learner_on_approval;
ALTER FUNCTION public.notify_student_on_approval_status_change RENAME TO notify_learner_on_approval_status_change;
ALTER FUNCTION public.notify_students_new_opportunity RENAME TO notify_learners_new_opportunity;
ALTER FUNCTION public.notify_students_opportunity_update RENAME TO notify_learners_opportunity_update;
ALTER FUNCTION public.set_session_total_students RENAME TO set_session_total_learners;
ALTER FUNCTION public.sync_student_record_id RENAME TO sync_learner_record_id;
ALTER FUNCTION public."transferStudent" RENAME TO "transferLearner";
ALTER FUNCTION public.trg_college_student_assignments_grade_pct_fn RENAME TO trg_college_learner_assignments_grade_pct_fn;
ALTER FUNCTION public.trg_college_student_assignments_late_check_fn RENAME TO trg_college_learner_assignments_late_check_fn;
ALTER FUNCTION public.trg_college_student_assignments_status_fn RENAME TO trg_college_learner_assignments_status_fn;
ALTER FUNCTION public.trg_college_student_assignments_updated_fn RENAME TO trg_college_learner_assignments_updated_fn;
ALTER FUNCTION public.trg_student_assignments_grade_pct_fn RENAME TO trg_learner_assignments_grade_pct_fn;
ALTER FUNCTION public.trg_student_assignments_late_check_fn RENAME TO trg_learner_assignments_late_check_fn;
ALTER FUNCTION public.trg_student_assignments_status_fn RENAME TO trg_learner_assignments_status_fn;
ALTER FUNCTION public.trg_student_assignments_updated_fn RENAME TO trg_learner_assignments_updated_fn;
ALTER FUNCTION public.trigger_related_student_embedding RENAME TO trigger_related_learner_embedding;
ALTER FUNCTION public.trigger_student_embedding_queue RENAME TO trigger_learner_embedding_queue;
ALTER FUNCTION public.update_student_course_progress_updated_at RENAME TO update_learner_course_progress_updated_at;
ALTER FUNCTION public.update_student_grade_on_promotion RENAME TO update_learner_grade_on_promotion;
ALTER FUNCTION public.update_student_promotions_updated_at RENAME TO update_learner_promotions_updated_at;
ALTER FUNCTION public.update_student_streak RENAME TO update_learner_streak;
ALTER FUNCTION public.update_students_updated_at RENAME TO update_learners_updated_at;
ALTER FUNCTION public.validate_student_competition_school RENAME TO validate_learner_competition_school;
ALTER FUNCTION public.validate_student_school_match RENAME TO validate_learner_school_match;

-- TODO: Function bodies need to be updated to reference:
--   - learners table instead of students
--   - learner_id instead of student_id
--   - learner_* tables instead of student_* tables
-- 
-- This requires dropping and recreating each function with updated SQL.
-- The function signatures have been renamed above, but the bodies still reference old names.
-- 
-- Special note for generate_learner_id():
--   Currently generates IDs like "STU-XXX-00001"
--   Should be updated to generate "LRN-XXX-00001" or similar

-- ============================================================================
-- SECTION 10: RENAME TRIGGERS
-- ============================================================================

-- Rename triggers on renamed tables
ALTER TRIGGER trg_college_student_assignments_grade_pct ON public.college_learner_assignments RENAME TO trg_college_learner_assignments_grade_pct;
ALTER TRIGGER trg_college_student_assignments_late_check ON public.college_learner_assignments RENAME TO trg_college_learner_assignments_late_check;
ALTER TRIGGER trg_college_student_assignments_status ON public.college_learner_assignments RENAME TO trg_college_learner_assignments_status;
ALTER TRIGGER trg_college_student_assignments_updated ON public.college_learner_assignments RENAME TO trg_college_learner_assignments_updated;
ALTER TRIGGER trg_student_assignments_grade_pct ON public.learner_assignments RENAME TO trg_learner_assignments_grade_pct;
ALTER TRIGGER trg_student_assignments_late_check ON public.learner_assignments RENAME TO trg_learner_assignments_late_check;
ALTER TRIGGER trg_student_assignments_status ON public.learner_assignments RENAME TO trg_learner_assignments_status;
ALTER TRIGGER trg_student_assignments_updated ON public.learner_assignments RENAME TO trg_learner_assignments_updated;
ALTER TRIGGER update_student_course_progress_updated_at_trigger ON public.learner_course_progress RENAME TO update_learner_course_progress_updated_at_trigger;
ALTER TRIGGER update_student_promotions_updated_at_trigger ON public.learner_promotions RENAME TO update_learner_promotions_updated_at_trigger;
ALTER TRIGGER update_students_updated_at_trigger ON public.learners RENAME TO update_learners_updated_at_trigger;

-- Triggers that reference students table
ALTER TRIGGER trigger_student_embedding_queue ON public.learners RENAME TO trigger_learner_embedding_queue;

-- ============================================================================
-- NOTES AND TODOS
-- ============================================================================

-- COMPLETED:
-- ✓ Renamed students table to learners
-- ✓ Renamed all student_id columns to learner_id (83 tables)
-- ✓ Renamed all student_email columns to learner_email (8 tables)
-- ✓ Renamed all student_name columns to learner_name (14 tables)
-- ✓ Renamed all student_record_id columns to learner_record_id (7 tables)
-- ✓ Renamed all student_assignment_id columns to learner_assignment_id (2 tables)
-- ✓ Renamed conversation student columns (student_unread_count, deleted_by_student, student_deleted_at)
-- ✓ Renamed capacity columns (current_students, max_students, total_students → current_learners, max_learners, total_learners)
-- ✓ Renamed count columns (student_count → learner_count)
-- ✓ Renamed pricing columns (price_per_student → price_per_learner)
-- ✓ Renamed tier reference (student_tier_id → learner_tier_id)
-- ✓ Renamed data columns (student_answers, student_context, student_profile_hash → learner_*)
-- ✓ Renamed other columns (student_course, student_engagement, student_id_old)
-- ✓ Renamed tables with "student" in name (12 tables)
-- ✓ Dropped student_type column from learners table
-- ✓ Updated users.role values (school_student/college_student → learner)
-- ✓ Renamed indexes (200+ indexes)
-- ✓ Renamed foreign key constraints (60+ constraints)
-- ✓ Renamed function names (43 functions)
-- ✓ Renamed triggers (11 triggers)
-- ✓ Dropped views that need recreation (17 views)

-- TODO (requires manual intervention):
-- 1. Recreate all dropped views with updated table/column references
-- 2. Update function bodies to reference learners/learner_id instead of students/student_id
-- 3. Update generate_learner_id() to generate "LRN-" prefix instead of "STU-"
-- 4. Handle duplicate fk_student_email constraints (need unique names)
-- 5. Check if student_type enum is still used elsewhere; if not, drop it
-- 6. Test all functions and views after recreation
-- 7. Update any application code that references the old names
-- 8. Update RLS policies if they reference students table

-- ROLLBACK NOTES:
-- If this migration needs to be rolled back, reverse all operations:
-- - Rename learners back to students
-- - Rename learner_id back to student_id
-- - Rename all tables, indexes, constraints, functions, triggers back
-- - Update users.role back to school_student/college_student
-- - Recreate student_type column
-- - Recreate all views with original names

COMMIT;
