-- Create comprehensive student fee ledger view
CREATE OR REPLACE VIEW public.v_student_fee_ledger_detailed AS
SELECT 
    l.id,
    l.student_id,
    l.fee_structure_id,
    l.fee_head_name,
    l.due_amount,
    l.paid_amount,
    l.balance,
    l.due_date,
    l.payment_status,
    l.is_overdue,
    l.created_at,
    l.updated_at,
    -- Student details
    s.roll_number,
    s.admission_number,
    s.name as student_name,
    s.email as student_email,
    s.college_id,
    s.category,
    s.quota,
    s.contact_number,
    s.grade,
    s.section,
    -- College details
    c.name as college_name,
    c.address as college_address,
    -- Fee structure details
    fs.program_id,
    fs.program_name,
    fs.semester,
    fs.academic_year,
    fs.category as fee_category,
    fs.total_amount as fee_structure_total,
    fs.is_active as fee_structure_active,
    -- Program details
    p.name as program_name_full,
    p.code as program_code,
    p.duration as program_duration,
    -- Department details
    d.name as department_name,
    d.code as department_code,
    -- Payment details (latest payment)
    latest_payment.payment_date,
    latest_payment.payment_method,
    latest_payment.transaction_id,
    latest_payment.payment_amount,
    -- Calculated fields
    CASE 
        WHEN l.balance > 0 AND l.due_date < CURRENT_DATE THEN 'Overdue'
        WHEN l.balance > 0 THEN 'Pending'
        WHEN l.balance = 0 THEN 'Paid'
        ELSE 'Unknown'
    END as status_description,
    CASE 
        WHEN l.due_date < CURRENT_DATE AND l.balance > 0 
        THEN CURRENT_DATE - l.due_date 
        ELSE 0 
    END as days_overdue,
    -- Percentage paid
    CASE 
        WHEN l.due_amount > 0 
        THEN ROUND((l.paid_amount::numeric / l.due_amount::numeric) * 100, 2)
        ELSE 0 
    END as payment_percentage
FROM 
    student_ledgers l
    JOIN students s ON s.user_id = l.student_id
    LEFT JOIN colleges c ON c.id = s.college_id
    JOIN fee_structures fs ON fs.id = l.fee_structure_id
    LEFT JOIN programs p ON p.id = fs.program_id
    LEFT JOIN departments d ON d.id = p.department_id
    LEFT JOIN LATERAL (
        SELECT 
            sp.payment_date,
            sp.payment_method,
            sp.transaction_id,
            sp.amount as payment_amount
        FROM student_payments sp
        WHERE sp.ledger_id = l.id
        ORDER BY sp.payment_date DESC, sp.created_at DESC
        LIMIT 1
    ) latest_payment ON true
ORDER BY 
    c.name, 
    d.name, 
    p.name, 
    s.name, 
    l.due_date;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_ledgers_student_id ON student_ledgers USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_student_ledgers_payment_status ON student_ledgers USING btree (payment_status);
CREATE INDEX IF NOT EXISTS idx_student_ledgers_due_date ON student_ledgers USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_student_ledgers_balance ON student_ledgers USING btree (balance);

-- Grant permissions
GRANT SELECT ON public.v_student_fee_ledger_detailed TO authenticated;
GRANT SELECT ON public.v_student_fee_ledger_detailed TO anon;

-- Create a function to get expenditure summary by college
CREATE OR REPLACE FUNCTION get_expenditure_summary(p_college_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_due_amount NUMERIC,
    total_paid_amount NUMERIC,
    total_balance NUMERIC,
    total_students BIGINT,
    overdue_students BIGINT,
    paid_students BIGINT,
    pending_students BIGINT,
    collection_percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(v.due_amount), 0) as total_due_amount,
        COALESCE(SUM(v.paid_amount), 0) as total_paid_amount,
        COALESCE(SUM(v.balance), 0) as total_balance,
        COUNT(DISTINCT v.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN v.is_overdue THEN v.student_id END) as overdue_students,
        COUNT(DISTINCT CASE WHEN v.balance = 0 THEN v.student_id END) as paid_students,
        COUNT(DISTINCT CASE WHEN v.balance > 0 AND NOT v.is_overdue THEN v.student_id END) as pending_students,
        CASE 
            WHEN SUM(v.due_amount) > 0 
            THEN ROUND((SUM(v.paid_amount) / SUM(v.due_amount)) * 100, 2)
            ELSE 0 
        END as collection_percentage
    FROM v_student_fee_ledger_detailed v
    WHERE (p_college_id IS NULL OR v.college_id = p_college_id);
END;
$$;

-- Create a function to get department-wise expenditure
CREATE OR REPLACE FUNCTION get_department_expenditure(p_college_id UUID DEFAULT NULL)
RETURNS TABLE (
    department_id UUID,
    department_name TEXT,
    department_code TEXT,
    total_due_amount NUMERIC,
    total_paid_amount NUMERIC,
    total_balance NUMERIC,
    student_count BIGINT,
    collection_percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as department_id,
        d.name as department_name,
        d.code as department_code,
        COALESCE(SUM(v.due_amount), 0) as total_due_amount,
        COALESCE(SUM(v.paid_amount), 0) as total_paid_amount,
        COALESCE(SUM(v.balance), 0) as total_balance,
        COUNT(DISTINCT v.student_id) as student_count,
        CASE 
            WHEN SUM(v.due_amount) > 0 
            THEN ROUND((SUM(v.paid_amount) / SUM(v.due_amount)) * 100, 2)
            ELSE 0 
        END as collection_percentage
    FROM departments d
    LEFT JOIN v_student_fee_ledger_detailed v ON v.department_name = d.name
    WHERE (p_college_id IS NULL OR d.college_id = p_college_id)
    GROUP BY d.id, d.name, d.code
    ORDER BY d.name;
END;
$$;

-- Create a function to get program-wise expenditure
CREATE OR REPLACE FUNCTION get_program_expenditure(p_college_id UUID DEFAULT NULL)
RETURNS TABLE (
    program_id UUID,
    program_name TEXT,
    program_code TEXT,
    department_name TEXT,
    total_due_amount NUMERIC,
    total_paid_amount NUMERIC,
    total_balance NUMERIC,
    student_count BIGINT,
    collection_percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as program_id,
        p.name as program_name,
        p.code as program_code,
        d.name as department_name,
        COALESCE(SUM(v.due_amount), 0) as total_due_amount,
        COALESCE(SUM(v.paid_amount), 0) as total_paid_amount,
        COALESCE(SUM(v.balance), 0) as total_balance,
        COUNT(DISTINCT v.student_id) as student_count,
        CASE 
            WHEN SUM(v.due_amount) > 0 
            THEN ROUND((SUM(v.paid_amount) / SUM(v.due_amount)) * 100, 2)
            ELSE 0 
        END as collection_percentage
    FROM programs p
    LEFT JOIN departments d ON d.id = p.department_id
    LEFT JOIN v_student_fee_ledger_detailed v ON v.program_id = p.id
    WHERE (p_college_id IS NULL OR p.college_id = p_college_id)
    GROUP BY p.id, p.name, p.code, d.name
    ORDER BY d.name, p.name;
END;
$$;