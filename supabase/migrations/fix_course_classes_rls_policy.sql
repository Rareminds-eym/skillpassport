-- =====================================================
-- FIX COURSE_CLASSES RLS POLICY FOR INSERT OPERATIONS
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Educators can manage classes of their courses" ON course_classes;

-- Create separate policies for different operations
-- SELECT policy
CREATE POLICY "Educators can view classes of their courses"
    ON course_classes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_classes.course_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

-- INSERT policy (uses WITH CHECK instead of USING)
CREATE POLICY "Educators can insert classes for their courses"
    ON course_classes FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_classes.course_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

-- UPDATE policy
CREATE POLICY "Educators can update classes of their courses"
    ON course_classes FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_classes.course_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

-- DELETE policy
CREATE POLICY "Educators can delete classes of their courses"
    ON course_classes FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_classes.course_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

COMMENT ON POLICY "Educators can view classes of their courses" ON course_classes IS 'Allows educators to view classes of courses they own or co-educate';
COMMENT ON POLICY "Educators can insert classes for their courses" ON course_classes IS 'Allows educators to insert classes for courses they own or co-educate';
COMMENT ON POLICY "Educators can update classes of their courses" ON course_classes IS 'Allows educators to update classes of courses they own or co-educate';
COMMENT ON POLICY "Educators can delete classes of their courses" ON course_classes IS 'Allows educators to delete classes of courses they own or co-educate';
