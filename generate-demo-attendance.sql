-- Generate Demo Attendance Data for Delhi Public School
-- School ID: 550e8400-e29b-41d4-a716-446655440000

-- This script generates realistic attendance data for the last 30 days
-- for all 8 students in the school

DO $$
DECLARE
    v_school_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    v_student RECORD;
    v_date DATE;
    v_status TEXT;
    v_random FLOAT;
    v_time_in TIME;
    v_time_out TIME;
BEGIN
    -- Loop through each student
    FOR v_student IN 
        SELECT id, name, roll_number, grade, section 
        FROM students 
        WHERE school_id = v_school_id
    LOOP
        -- Generate attendance for last 30 days
        FOR i IN 0..29 LOOP
            v_date := CURRENT_DATE - i;
            
            -- Skip weekends (Saturday and Sunday)
            IF EXTRACT(DOW FROM v_date) NOT IN (0, 6) THEN
                -- Generate random attendance status
                -- 85% present, 5% absent, 5% late, 5% excused
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
                
                -- Insert attendance record (without mode field to avoid constraint issues)
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
                    v_date,
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
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Generated attendance for student: %', v_student.name;
    END LOOP;
    
    RAISE NOTICE 'Demo attendance data generation complete!';
END $$;

-- Verify the data
SELECT 
    s.name,
    s.roll_number,
    COUNT(*) as total_records,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
    SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_count,
    ROUND(
        (SUM(CASE WHEN a.status IN ('present', 'late', 'excused') THEN 1 ELSE 0 END)::NUMERIC / 
        COUNT(*)::NUMERIC * 100), 
        2
    ) as attendance_percentage
FROM students s
LEFT JOIN attendance_records a ON s.id = a.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY s.id, s.name, s.roll_number
ORDER BY s.name;
