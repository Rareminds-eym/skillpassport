-- Fix college_subject_attendance_summary view to include faculty_name in latest_status subquery.
-- Previously, the subquery did not filter by faculty_name, causing other faculties' latest sessions
-- (even if in the future or scheduled) to overwrite the current faculty's session status.

CREATE OR REPLACE VIEW "public"."college_subject_attendance_summary" AS
 SELECT "subject_name" AS "subject",
    "subject_code",
    "department_name" AS "department",
    "program_name" AS "course",
    "program_code",
    "semester",
    "section",
    "faculty_name" AS "faculty",
    "faculty_id",
    "count"(DISTINCT "id") AS "total_sessions",
    COALESCE("avg"("attendance_percentage"), (0)::numeric) AS "avg_attendance_percentage",
    COALESCE("sum"("present_count"), (0)::bigint) AS "total_present_count",
    COALESCE("sum"("absent_count"), (0)::bigint) AS "total_absent_count",
    COALESCE("sum"("late_count"), (0)::bigint) AS "total_late_count",
    COALESCE("sum"("excused_count"), (0)::bigint) AS "total_excused_count",
    "min"("date") AS "first_date",
    "max"("date") AS "last_date",
    COALESCE(( SELECT "college_attendance_sessions"."status"
           FROM "public"."college_attendance_sessions"
          WHERE (("college_attendance_sessions"."subject_name")::"text" = ("ats"."subject_name")::"text")
            AND (("college_attendance_sessions"."department_name")::"text" = ("ats"."department_name")::"text")
            AND (("college_attendance_sessions"."program_name")::"text" = ("ats"."program_name")::"text")
            AND ("college_attendance_sessions"."semester" = "ats"."semester")
            AND (("college_attendance_sessions"."section")::"text" = ("ats"."section")::"text")
            AND ("college_attendance_sessions"."college_id" = "ats"."college_id")
            AND (
              ("college_attendance_sessions"."faculty_name")::"text" = ("ats"."faculty_name")::"text"
              OR ("college_attendance_sessions"."faculty_name" IS NULL AND "ats"."faculty_name" IS NULL)
            )
          ORDER BY "college_attendance_sessions"."date" DESC, "college_attendance_sessions"."start_time" DESC
         LIMIT 1), 'scheduled'::character varying) AS "latest_status",
    COALESCE("max"("total_learners"), 0) AS "total_learners",
    "college_id",
    "course_type"
   FROM "public"."college_attendance_sessions" "ats"
  GROUP BY "subject_name", "subject_code", "department_name", "program_name", "program_code", "semester", "section", "faculty_name", "faculty_id", "college_id", "course_type";

ALTER VIEW "public"."college_subject_attendance_summary" OWNER TO "postgres";
GRANT ALL ON TABLE "public"."college_subject_attendance_summary" TO "anon";
GRANT ALL ON TABLE "public"."college_subject_attendance_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."college_subject_attendance_summary" TO "service_role";
