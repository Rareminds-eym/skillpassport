-- =====================================================
-- FIX COURSE_SKILLS RLS POLICY FOR INSERT OPERATIONS
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Educators can manage skills of their courses" ON course_skills;

-- Create separate policies for different operations
-- SELECT policy
CREATE POLICY "Educators can view skills of their courses"
    ON course_skills FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_skills.course_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

-- INSERT policy (uses WITH CHECK instead of USING)
CREATE POLICY "Educators can insert skills for their courses"
    ON course_skills FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_skills.course_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

-- UPDATE policy
CREATE POLICY "Educators can update skills of their courses"
    ON course_skills FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_skills.course_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

-- DELETE policy
CREATE POLICY "Educators can delete skills of their courses"
    ON course_skills FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_skills.course_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

COMMENT ON POLICY "Educators can view skills of their courses" ON course_skills IS 'Allows educators to view skills of courses they own or co-educate';
COMMENT ON POLICY "Educators can insert skills for their courses" ON course_skills IS 'Allows educators to insert skills for courses they own or co-educate';
COMMENT ON POLICY "Educators can update skills of their courses" ON course_skills IS 'Allows educators to update skills of courses they own or co-educate';
COMMENT ON POLICY "Educators can delete skills of their courses" ON course_skills IS 'Allows educators to delete skills of courses they own or co-educate';
