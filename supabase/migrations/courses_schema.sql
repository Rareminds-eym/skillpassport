-- =====================================================
-- COURSES MANAGEMENT SCHEMA
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS lesson_resources CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;
DROP TABLE IF EXISTS course_classes CASCADE;
DROP TABLE IF EXISTS course_skills CASCADE;
DROP TABLE IF EXISTS course_co_educators CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- =====================================================
-- 1. COURSES TABLE
-- =====================================================
CREATE TABLE courses (
    course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    thumbnail VARCHAR(500),
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Active', 'Draft', 'Upcoming', 'Archived')),
    duration VARCHAR(50) NOT NULL,
    enrollment_count INTEGER DEFAULT 0,
    completion_rate INTEGER DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    evidence_pending INTEGER DEFAULT 0,
    skills_mapped INTEGER DEFAULT 0,
    total_skills INTEGER DEFAULT 0,
    educator_id UUID NOT NULL,
    educator_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    CONSTRAINT fk_educator FOREIGN KEY (educator_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_courses_educator ON courses(educator_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_code ON courses(code);

-- =====================================================
-- 2. COURSE TARGET OUTCOMES (as JSONB)
-- =====================================================
ALTER TABLE courses ADD COLUMN target_outcomes JSONB DEFAULT '[]'::jsonb;

-- =====================================================
-- 3. COURSE MODULES TABLE
-- =====================================================
CREATE TABLE course_modules (
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

CREATE INDEX idx_modules_course ON course_modules(course_id);
CREATE INDEX idx_modules_order ON course_modules(course_id, order_index);

-- =====================================================
-- 4. LESSONS TABLE
-- =====================================================
CREATE TABLE lessons (
    lesson_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT, -- Rich HTML content
    duration VARCHAR(50),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT fk_module FOREIGN KEY (module_id) REFERENCES course_modules(module_id) ON DELETE CASCADE
);

CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, order_index);

-- =====================================================
-- 5. LESSON RESOURCES TABLE
-- =====================================================
CREATE TABLE lesson_resources (
    resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pdf', 'video', 'image', 'document', 'link', 'youtube', 'drive')),
    url TEXT NOT NULL,
    file_size VARCHAR(50),
    thumbnail_url TEXT,
    embed_url TEXT, -- For YouTube/Vimeo embeds
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT fk_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE
);

CREATE INDEX idx_resources_lesson ON lesson_resources(lesson_id);

-- =====================================================
-- 6. COURSE SKILLS JUNCTION TABLE
-- =====================================================
CREATE TABLE course_skills (
    course_skill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT fk_course_skill FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT unique_course_skill UNIQUE (course_id, skill_name)
);

CREATE INDEX idx_course_skills_course ON course_skills(course_id);
CREATE INDEX idx_course_skills_name ON course_skills(skill_name);

-- =====================================================
-- 7. COURSE CLASSES JUNCTION TABLE
-- =====================================================
CREATE TABLE course_classes (
    course_class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT fk_course_class FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT unique_course_class UNIQUE (course_id, class_name)
);

CREATE INDEX idx_course_classes_course ON course_classes(course_id);

-- =====================================================
-- 8. COURSE CO-EDUCATORS TABLE
-- =====================================================
CREATE TABLE course_co_educators (
    co_educator_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    educator_id UUID NOT NULL,
    educator_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    CONSTRAINT fk_course_co_edu FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT fk_educator_co_edu FOREIGN KEY (educator_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_co_educator UNIQUE (course_id, educator_id)
);

CREATE INDEX idx_co_educators_course ON course_co_educators(course_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for courses
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- =====================================================
-- HELPFUL VIEWS
-- =====================================================

-- View for course summary with counts
CREATE OR REPLACE VIEW course_summary AS
SELECT
    c.course_id,
    c.title,
    c.code,
    c.description,
    c.status,
    c.duration,
    c.educator_id,
    c.educator_name,
    c.enrollment_count,
    c.completion_rate,
    c.evidence_pending,
    c.created_at,
    c.updated_at,
    COUNT(DISTINCT cm.module_id) as module_count,
    COUNT(DISTINCT l.lesson_id) as lesson_count,
    COUNT(DISTINCT lr.resource_id) as resource_count,
    COALESCE(json_agg(DISTINCT cs.skill_name) FILTER (WHERE cs.skill_name IS NOT NULL), '[]') as skills,
    COALESCE(json_agg(DISTINCT cc.class_name) FILTER (WHERE cc.class_name IS NOT NULL), '[]') as classes
FROM courses c
LEFT JOIN course_modules cm ON c.course_id = cm.course_id
LEFT JOIN lessons l ON cm.module_id = l.module_id
LEFT JOIN lesson_resources lr ON l.lesson_id = lr.lesson_id
LEFT JOIN course_skills cs ON c.course_id = cs.course_id
LEFT JOIN course_classes cc ON c.course_id = cc.course_id
GROUP BY c.course_id;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get course with all related data
CREATE OR REPLACE FUNCTION get_course_full_details(course_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'course', row_to_json(c),
        'modules', (
            SELECT json_agg(
                json_build_object(
                    'module', row_to_json(cm),
                    'lessons', (
                        SELECT json_agg(
                            json_build_object(
                                'lesson', row_to_json(l),
                                'resources', (
                                    SELECT json_agg(row_to_json(lr))
                                    FROM lesson_resources lr
                                    WHERE lr.lesson_id = l.lesson_id
                                    ORDER BY lr.order_index
                                )
                            )
                        )
                        FROM lessons l
                        WHERE l.module_id = cm.module_id
                        ORDER BY l.order_index
                    )
                )
            )
            FROM course_modules cm
            WHERE cm.course_id = c.course_id
            ORDER BY cm.order_index
        ),
        'skills', (
            SELECT json_agg(cs.skill_name)
            FROM course_skills cs
            WHERE cs.course_id = c.course_id
        ),
        'classes', (
            SELECT json_agg(cc.class_name)
            FROM course_classes cc
            WHERE cc.course_id = c.course_id
        ),
        'co_educators', (
            SELECT json_agg(json_build_object('id', cce.educator_id, 'name', cce.educator_name))
            FROM course_co_educators cce
            WHERE cce.course_id = c.course_id
        )
    ) INTO result
    FROM courses c
    WHERE c.course_id = course_uuid;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE courses IS 'Main courses table containing course information';
COMMENT ON TABLE course_modules IS 'Course modules/sections';
COMMENT ON TABLE lessons IS 'Individual lessons within modules';
COMMENT ON TABLE lesson_resources IS 'Learning resources attached to lessons (files, links, videos)';
COMMENT ON TABLE course_skills IS 'Skills covered in the course';
COMMENT ON TABLE course_classes IS 'Classes/groups enrolled in the course';
COMMENT ON TABLE course_co_educators IS 'Co-educators who can manage the course';
