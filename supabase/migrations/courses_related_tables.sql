-- =====================================================
-- MISSING TABLES FOR COURSES SYSTEM
-- =====================================================

-- =====================================================
-- 1. COURSE MODULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS course_modules (
    module_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    skill_tags JSONB DEFAULT '[]'::jsonb,
    activities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON course_modules(course_id, order_index);

-- =====================================================
-- 2. LESSONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lessons (
    lesson_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    duration VARCHAR(50),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT fk_module FOREIGN KEY (module_id) REFERENCES course_modules(module_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(module_id, order_index);

-- =====================================================
-- 3. LESSON RESOURCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS lesson_resources (
    resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pdf', 'video', 'image', 'document', 'link', 'youtube', 'drive')),
    url TEXT NOT NULL,
    file_size VARCHAR(50),
    thumbnail_url TEXT,
    embed_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT fk_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resources_lesson ON lesson_resources(lesson_id);

-- =====================================================
-- 4. COURSE SKILLS JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS course_skills (
    course_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT fk_course_skill FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT unique_course_skill UNIQUE (course_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_course_skills_course ON course_skills(course_id);
CREATE INDEX IF NOT EXISTS idx_course_skills_name ON course_skills(skill_name);

-- =====================================================
-- 5. COURSE CLASSES JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS course_classes (
    course_class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT fk_course_class FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT unique_course_class UNIQUE (course_id, class_name)
);

CREATE INDEX IF NOT EXISTS idx_course_classes_course ON course_classes(course_id);

-- =====================================================
-- 6. COURSE CO-EDUCATORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS course_co_educators (
    co_educator_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    educator_id UUID NOT NULL,
    educator_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT fk_course_co_edu FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT fk_educator_co_edu FOREIGN KEY (educator_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_co_educator UNIQUE (course_id, educator_id)
);

CREATE INDEX IF NOT EXISTS idx_co_educators_course ON course_co_educators(course_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_modules_updated_at ON course_modules;
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;

-- Trigger for course_modules
CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON course_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for lessons
CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_co_educators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Educators can view their own courses" ON courses;
DROP POLICY IF EXISTS "Educators can insert their own courses" ON courses;
DROP POLICY IF EXISTS "Educators can update their own courses" ON courses;
DROP POLICY IF EXISTS "Educators can delete their own courses" ON courses;
DROP POLICY IF EXISTS "Educators can manage modules of their courses" ON course_modules;
DROP POLICY IF EXISTS "Educators can manage lessons of their courses" ON lessons;
DROP POLICY IF EXISTS "Educators can manage resources of their courses" ON lesson_resources;
DROP POLICY IF EXISTS "Educators can manage skills of their courses" ON course_skills;
DROP POLICY IF EXISTS "Educators can manage classes of their courses" ON course_classes;
DROP POLICY IF EXISTS "Educators can manage co-educators of their courses" ON course_co_educators;

-- Courses policies
CREATE POLICY "Educators can view their own courses"
    ON courses FOR SELECT
    USING (educator_id = auth.uid() OR
           EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()));

CREATE POLICY "Educators can insert their own courses"
    ON courses FOR INSERT
    WITH CHECK (educator_id = auth.uid());

CREATE POLICY "Educators can update their own courses"
    ON courses FOR UPDATE
    USING (educator_id = auth.uid() OR
           EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()));

CREATE POLICY "Educators can delete their own courses"
    ON courses FOR DELETE
    USING (educator_id = auth.uid());

-- Course modules policies
CREATE POLICY "Educators can manage modules of their courses"
    ON course_modules FOR ALL
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_modules.course_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

-- Lessons policies
CREATE POLICY "Educators can manage lessons of their courses"
    ON lessons FOR ALL
    USING (EXISTS (
        SELECT 1 FROM course_modules
        INNER JOIN courses ON courses.course_id = course_modules.course_id
        WHERE course_modules.module_id = lessons.module_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

-- Lesson resources policies
CREATE POLICY "Educators can manage resources of their courses"
    ON lesson_resources FOR ALL
    USING (EXISTS (
        SELECT 1 FROM lessons
        INNER JOIN course_modules ON course_modules.module_id = lessons.module_id
        INNER JOIN courses ON courses.course_id = course_modules.course_id
        WHERE lessons.lesson_id = lesson_resources.lesson_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

-- Course skills policies
CREATE POLICY "Educators can manage skills of their courses"
    ON course_skills FOR ALL
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_skills.course_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

-- Course classes policies
CREATE POLICY "Educators can manage classes of their courses"
    ON course_classes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_classes.course_id
        AND (courses.educator_id = auth.uid() OR
             EXISTS (SELECT 1 FROM course_co_educators WHERE course_id = courses.course_id AND educator_id = auth.uid()))
    ));

-- Co-educators policies
CREATE POLICY "Educators can manage co-educators of their courses"
    ON course_co_educators FOR ALL
    USING (EXISTS (
        SELECT 1 FROM courses
        WHERE courses.course_id = course_co_educators.course_id
        AND courses.educator_id = auth.uid()
    ));
