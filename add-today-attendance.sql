-- Add attendance data for TODAY for all students
-- This will make the Daily Summary tab show data immediately

DO $$
DECLARE
    v_school_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    v_student RECORD;
    v_status TEXT;
    v_random FLOAT;
    v_time_in TIME;
    v_time_out TIME;
BEGIN
    -- Loop through each student
    FOR v_student IN 
        SELECT id, name, roll_number 
        FROM students 
        WHERE school_id = v_school_id
    LOOP
        -- Generate random attendance status for today
        v_random := RANDOM();
        
        IF v_random < 0.85 THEN
            v_status := 'present';
            v_time_in := '08:00:00'::TIME + (RANDOM() * INTERVAL '30 minutes');
            v_time_out := '15:00:00'::TIME + (RANDOM() * INTERVAL '30 minutes');
        ELSIF v_random < 0.90 THEN
            v_status := 'absent';
            v_time_in := NULL;
            v_time_out := NULL;
        ELSIF v_random < 0.95 THEN
            v_status := 'late';
            v_time_in := '08:30:00'::TIME + (RANDOM() * INTERVAL '30 minutes');
            v_time_out := '15:00:00'::TIME + (RANDOM() * INTERVAL '30 minutes');
        ELSE
            v_status := 'excused';
            v_time_in := NULL;
            v_time_out := NULL;
        END IF;
        
        -- Insert today's attendance
        INSERT INTO attendance_records (
            student_id,
            school_id,
            date,
            status,
            time_in,
            time_out,
            remarks
        ) VALUES (
            v_student.id,
            v_school_id,
            CURRENT_DATE,
            v_status,
            v_time_in,
            v_time_out,
            CASE 
                WHEN v_status = 'absent' THEN 'Absent without notice'
                WHEN v_status = 'late' THEN 'Arrived late'
                WHEN v_status = 'excused' THEN 'Medical leave'
                ELSE NULL
            END
        )
        ON CONFLICT (student_id, date) DO NOTHING;
        
        RAISE NOTICE 'Added today attendance for: %', v_student.name;
    END LOOP;
    
    RAISE NOTICE 'Today attendance data added successfully!';
END $$;

-- Verify today's data
SELECT 
    s.name,
    s.roll_number,
    ar.status,
    ar.time_in,
    ar.time_out
FROM attendance_records ar
JOIN students s ON ar.student_id = s.id
WHERE ar.school_id = '550e8400-e29b-41d4-a716-446655440000'
AND ar.date = CURRENT_DATE
ORDER BY s.name;
