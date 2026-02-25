-- Seed file for PG Adaptive Aptitude Questions
-- Generated from PG_Adaptive_Aptitude_750_Mixed_Dimensions_NoCase_NO_DUPLICATES.xlsx

-- Insert section for PG
INSERT INTO personal_assessment_sections (id, name, title, description, grade_level, order_number)
VALUES (
  gen_random_uuid(),
  'Adaptive Aptitude Test - PG',
  'Adaptive Aptitude Test - PG',
  'Adaptive aptitude assessment for postgraduate students',
  'college',
  1
)
ON CONFLICT (name) DO NOTHING;

-- Get section_id for questions
DO $$
DECLARE
  v_section_id UUID;
BEGIN
  SELECT id INTO v_section_id FROM personal_assessment_sections WHERE name = 'Adaptive Aptitude Test - PG' AND grade_level = 'college';

  IF v_section_id IS NULL THEN
    RAISE EXCEPTION 'Section not found for PG';
  END IF;

  -- Insert questions
  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 21, 84, 88, 352, ?',
    'mcq',
    '{"A": "454", "B": "340", "C": "356", "D": "316"}'::jsonb,
    '"C"'::jsonb,
    1,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=164, Q4=138. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "0.2695", "B": "0.0993", "C": "-0.5587", "D": "-0.1585"}'::jsonb,
    '"D"'::jsonb,
    2,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 37, 44, 58, 79, ?',
    'mcq',
    '{"A": "107", "B": "124", "C": "120", "D": "87"}'::jsonb,
    '"A"'::jsonb,
    3,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 8 distinct items?',
    'mcq',
    '{"A": "336", "B": "334", "C": "270", "D": "382"}'::jsonb,
    '"A"'::jsonb,
    4,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[21,9],[21,?]], find ?',
    'mcq',
    '{"A": "59", "B": "65", "C": "51", "D": "54"}'::jsonb,
    '"C"'::jsonb,
    5,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 12, 18, 30, 48, ?',
    'mcq',
    '{"A": "73", "B": "72", "C": "83", "D": "71"}'::jsonb,
    '"B"'::jsonb,
    6,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -2x^2 + 17x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "4.5292", "B": "4.25", "C": "4.3229", "D": "4.4831"}'::jsonb,
    '"B"'::jsonb,
    7,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (131 + 23) × 8 − 6',
    'mcq',
    '{"A": "1226", "B": "1322", "C": "988", "D": "1316"}'::jsonb,
    '"A"'::jsonb,
    8,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 22, 29, 43, 64, ?',
    'mcq',
    '{"A": "60", "B": "96", "C": "100", "D": "92"}'::jsonb,
    '"D"'::jsonb,
    9,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 13 distinct items?',
    'mcq',
    '{"A": "18832", "B": "18446", "C": "17160", "D": "17384"}'::jsonb,
    '"C"'::jsonb,
    10,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For Boolean variables x,y,z, how many truth assignments satisfy (x OR y) AND (NOT x OR z)?',
    'mcq',
    '{"A": "4", "B": "14", "C": "10", "D": "9"}'::jsonb,
    '"A"'::jsonb,
    11,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[16,9],[7,?]], find ?',
    'mcq',
    '{"A": "38", "B": "32", "C": "27", "D": "36"}'::jsonb,
    '"B"'::jsonb,
    12,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_5(125) = k, what is k?',
    'mcq',
    '{"A": "3", "B": "4", "C": "2", "D": "1"}'::jsonb,
    '"A"'::jsonb,
    13,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 8th term of an AP with first term 33 and common difference 8.',
    'mcq',
    '{"A": "89", "B": "75", "C": "74", "D": "115"}'::jsonb,
    '"A"'::jsonb,
    14,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.2, what is the expected number of successes in 20 trials?',
    'mcq',
    '{"A": "4.6198", "B": "3.922", "C": "4.0", "D": "4.2968"}'::jsonb,
    '"C"'::jsonb,
    15,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 49, 64, 81, 100, ?',
    'mcq',
    '{"A": "114", "B": "157", "C": "110", "D": "121"}'::jsonb,
    '"D"'::jsonb,
    16,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=42, |B|=38, and |A∩B|=26. What is |A∪B|?',
    'mcq',
    '{"A": "64", "B": "54", "C": "66", "D": "52"}'::jsonb,
    '"B"'::jsonb,
    17,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=134, current value=111. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "82.3634", "B": "82.7595", "C": "82.84", "D": "83.1534"}'::jsonb,
    '"C"'::jsonb,
    18,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_10(1000000) = k, what is k?',
    'mcq',
    '{"A": "18", "B": "12", "C": "6", "D": "4"}'::jsonb,
    '"C"'::jsonb,
    19,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 4x + 27 = 43',
    'mcq',
    '{"A": "0", "B": "6", "C": "4", "D": "16"}'::jsonb,
    '"C"'::jsonb,
    20,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A GP has first term 10 and ratio 5. What is the 6th term?',
    'mcq',
    '{"A": "28168", "B": "31250", "C": "35381", "D": "35966"}'::jsonb,
    '"B"'::jsonb,
    21,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 27, 30, 36, 45, ?',
    'mcq',
    '{"A": "68", "B": "45", "C": "44", "D": "57"}'::jsonb,
    '"D"'::jsonb,
    22,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (92 + 30) × 3 − 2',
    'mcq',
    '{"A": "454", "B": "364", "C": "327", "D": "399"}'::jsonb,
    '"B"'::jsonb,
    23,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many truth assignments satisfy ((x AND y) OR z) AND ((NOT y) OR x) for x,y,z ∈ {0,1}?',
    'mcq',
    '{"A": "1", "B": "3", "C": "14", "D": "4"}'::jsonb,
    '"D"'::jsonb,
    24,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 40, 45, 55, 70, ?',
    'mcq',
    '{"A": "103", "B": "102", "C": "110", "D": "90"}'::jsonb,
    '"D"'::jsonb,
    25,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 52 and standard deviation 23. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.3682", "B": "0.5216", "C": "0.3659", "D": "0.4423"}'::jsonb,
    '"D"'::jsonb,
    26,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 36, 49, 64, 81, ?',
    'mcq',
    '{"A": "84", "B": "100", "C": "107", "D": "108"}'::jsonb,
    '"B"'::jsonb,
    27,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=105, Q4=113. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "0.0762", "B": "0.7219", "C": "0.1361", "D": "0.029"}'::jsonb,
    '"A"'::jsonb,
    28,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[3,2],[3,6]]?',
    'mcq',
    '{"A": "22", "B": "6", "C": "12", "D": "20"}'::jsonb,
    '"C"'::jsonb,
    29,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[7,2],[6,8]]?',
    'mcq',
    '{"A": "24", "B": "32", "C": "48", "D": "44"}'::jsonb,
    '"D"'::jsonb,
    30,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[19,16],[9,?]], find ?',
    'mcq',
    '{"A": "44", "B": "56", "C": "60", "D": "50"}'::jsonb,
    '"A"'::jsonb,
    31,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=130, |B|=66, |A∩B|=29, compute |A∪B|.',
    'mcq',
    '{"A": "167", "B": "184", "C": "171", "D": "209"}'::jsonb,
    '"A"'::jsonb,
    32,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=107, current value=137. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "128.04", "B": "128.2563", "C": "127.9604", "D": "127.7809"}'::jsonb,
    '"A"'::jsonb,
    33,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 11 distinct items?',
    'mcq',
    '{"A": "7268", "B": "7920", "C": "8696", "D": "7907"}'::jsonb,
    '"B"'::jsonb,
    34,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=148, Y=135, Z=95. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.1635", "B": "0.5949", "C": "0.1936", "D": "0.3915"}'::jsonb,
    '"D"'::jsonb,
    35,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 42, 48, 60, 78, ?',
    'mcq',
    '{"A": "109", "B": "92", "C": "102", "D": "116"}'::jsonb,
    '"C"'::jsonb,
    36,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many truth assignments satisfy (x OR y OR z) AND (NOT x OR NOT z) for x,y,z ∈ {0,1}?',
    'mcq',
    '{"A": "1", "B": "5", "C": "3", "D": "13"}'::jsonb,
    '"B"'::jsonb,
    37,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_10(100000) = k, what is k?',
    'mcq',
    '{"A": "5", "B": "13", "C": "2", "D": "3"}'::jsonb,
    '"A"'::jsonb,
    38,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.18, what is the expected number of successes in 25 trials?',
    'mcq',
    '{"A": "4.5", "B": "5.0191", "C": "4.3797", "D": "4.2111"}'::jsonb,
    '"A"'::jsonb,
    39,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (108 + 75) × 7 − 7',
    'mcq',
    '{"A": "1142", "B": "1367", "C": "1294", "D": "1274"}'::jsonb,
    '"D"'::jsonb,
    40,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=69, |B|=45, and |A∩B|=16. What is |A∪B|?',
    'mcq',
    '{"A": "112", "B": "115", "C": "98", "D": "80"}'::jsonb,
    '"C"'::jsonb,
    41,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=25 with 0≤x≤10, 0≤y≤11, 0≤z≤11?',
    'mcq',
    '{"A": "39", "B": "45", "C": "36", "D": "26"}'::jsonb,
    '"C"'::jsonb,
    42,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 4 and ratio 3, what is the 7th term?',
    'mcq',
    '{"A": "2916", "B": "2784", "C": "3003", "D": "2561"}'::jsonb,
    '"A"'::jsonb,
    43,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 13 distinct items?',
    'mcq',
    '{"A": "138392", "B": "164292", "C": "188164", "D": "154440"}'::jsonb,
    '"D"'::jsonb,
    44,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Series: 18, 23, 33, 48, ?. Find next term.',
    'mcq',
    '{"A": "50", "B": "56", "C": "42", "D": "68"}'::jsonb,
    '"D"'::jsonb,
    45,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=93, Q4=74. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.5234", "B": "-0.1185", "C": "-0.2043", "D": "-0.5111"}'::jsonb,
    '"C"'::jsonb,
    46,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=137, Y=90, Z=128. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.4362", "B": "0.122", "C": "0.6884", "D": "0.3859"}'::jsonb,
    '"D"'::jsonb,
    47,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 11th term of an AP with first term 17 and common difference 6.',
    'mcq',
    '{"A": "84", "B": "47", "C": "77", "D": "78"}'::jsonb,
    '"C"'::jsonb,
    48,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 8 distinct items?',
    'mcq',
    '{"A": "1805", "B": "1412", "C": "1820", "D": "1680"}'::jsonb,
    '"D"'::jsonb,
    49,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.19, what is the expected number of successes in 30 trials?',
    'mcq',
    '{"A": "5.4309", "B": "5.7", "C": "5.4711", "D": "6.3543"}'::jsonb,
    '"B"'::jsonb,
    50,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (50 + 48) × 6 − 2',
    'mcq',
    '{"A": "568", "B": "513", "C": "586", "D": "575"}'::jsonb,
    '"C"'::jsonb,
    51,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=93, current value=98. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "105.531", "B": "105.3253", "C": "105.354", "D": "105.38"}'::jsonb,
    '"D"'::jsonb,
    52,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=109, Q4=80. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.0687", "B": "-0.5188", "C": "-0.2661", "D": "-0.7618"}'::jsonb,
    '"C"'::jsonb,
    53,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=166, Y=93, Z=116. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.4427", "B": "0.053", "C": "0.0129", "D": "1.0005"}'::jsonb,
    '"A"'::jsonb,
    54,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=145, Q4=95. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.1261", "B": "-0.6793", "C": "-0.1391", "D": "-0.3448"}'::jsonb,
    '"D"'::jsonb,
    55,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[23,9],[9,?]], find ?',
    'mcq',
    '{"A": "37", "B": "42", "C": "41", "D": "27"}'::jsonb,
    '"C"'::jsonb,
    56,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.17, what is the expected number of successes in 15 trials?',
    'mcq',
    '{"A": "2.4579", "B": "2.55", "C": "2.2332", "D": "2.2209"}'::jsonb,
    '"B"'::jsonb,
    57,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 19, 57, 60, 180, ?',
    'mcq',
    '{"A": "211", "B": "141", "C": "183", "D": "187"}'::jsonb,
    '"C"'::jsonb,
    58,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=18 with 0≤x≤7, 0≤y≤9, 0≤z≤11?',
    'mcq',
    '{"A": "54", "B": "41", "C": "68", "D": "52"}'::jsonb,
    '"D"'::jsonb,
    59,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (115 + 42) × 8 − 9',
    'mcq',
    '{"A": "1270", "B": "1247", "C": "1238", "D": "1035"}'::jsonb,
    '"B"'::jsonb,
    60,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 4 and ratio 2, what is the 6th term?',
    'mcq',
    '{"A": "162", "B": "149", "C": "128", "D": "154"}'::jsonb,
    '"C"'::jsonb,
    61,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=99, Q4=116. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "0.0937", "B": "0.6649", "C": "0.1717", "D": "0.479"}'::jsonb,
    '"C"'::jsonb,
    62,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 11th term of an AP with first term 42 and common difference 10.',
    'mcq',
    '{"A": "170", "B": "142", "C": "176", "D": "139"}'::jsonb,
    '"B"'::jsonb,
    63,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=121, current value=167. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "138.02", "B": "137.9407", "C": "138.3437", "D": "138.7018"}'::jsonb,
    '"A"'::jsonb,
    64,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 33, 39, 51, 69, ?',
    'mcq',
    '{"A": "93", "B": "81", "C": "89", "D": "88"}'::jsonb,
    '"A"'::jsonb,
    65,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 16, 25, 36, 49, ?',
    'mcq',
    '{"A": "58", "B": "64", "C": "80", "D": "53"}'::jsonb,
    '"B"'::jsonb,
    66,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 9th term of an AP with first term 19 and common difference 8.',
    'mcq',
    '{"A": "65", "B": "113", "C": "83", "D": "77"}'::jsonb,
    '"C"'::jsonb,
    67,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -4x^2 + 40x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "4.9465", "B": "5.1233", "C": "5.175", "D": "5.0"}'::jsonb,
    '"D"'::jsonb,
    68,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 37, 40, 46, 55, ?',
    'mcq',
    '{"A": "73", "B": "45", "C": "67", "D": "59"}'::jsonb,
    '"C"'::jsonb,
    69,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 17, 102, 108, 648, ?',
    'mcq',
    '{"A": "722", "B": "654", "C": "700", "D": "712"}'::jsonb,
    '"B"'::jsonb,
    70,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=17 with 0≤x≤10, 0≤y≤11, 0≤z≤8?',
    'mcq',
    '{"A": "61", "B": "66", "C": "55", "D": "77"}'::jsonb,
    '"D"'::jsonb,
    71,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=161, Q4=78. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "0.0734", "B": "-0.5155", "C": "0.174", "D": "0.0532"}'::jsonb,
    '"B"'::jsonb,
    72,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 10x + 23 = 83',
    'mcq',
    '{"A": "3", "B": "6", "C": "14", "D": "2"}'::jsonb,
    '"B"'::jsonb,
    73,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 4, what will be the code after 125 days?',
    'mcq',
    '{"A": "3", "B": "0", "C": "7", "D": "2"}'::jsonb,
    '"A"'::jsonb,
    74,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -6x^2 + 24x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "2.3148", "B": "2.0", "C": "1.8775", "D": "1.7701"}'::jsonb,
    '"B"'::jsonb,
    75,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 6 and ratio 4, what is the 8th term?',
    'mcq',
    '{"A": "103890", "B": "96673", "C": "92054", "D": "98304"}'::jsonb,
    '"D"'::jsonb,
    76,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=109, Y=126, Z=119. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.1483", "B": "0.3079", "C": "0.5766", "D": "0.2077"}'::jsonb,
    '"B"'::jsonb,
    77,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[26,17],[9,?]], find ?',
    'mcq',
    '{"A": "50", "B": "41", "C": "46", "D": "52"}'::jsonb,
    '"D"'::jsonb,
    78,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[14,17],[11,?]], find ?',
    'mcq',
    '{"A": "42", "B": "62", "C": "43", "D": "32"}'::jsonb,
    '"A"'::jsonb,
    79,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=16 with 0≤x≤10, 0≤y≤7, 0≤z≤11?',
    'mcq',
    '{"A": "60", "B": "72", "C": "98", "D": "100"}'::jsonb,
    '"B"'::jsonb,
    80,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 15, 75, 80, 400, ?',
    'mcq',
    '{"A": "367", "B": "411", "C": "337", "D": "405"}'::jsonb,
    '"D"'::jsonb,
    81,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=135, Y=136, Z=99. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.3855", "B": "0.3649", "C": "0.4876", "D": "0.8015"}'::jsonb,
    '"B"'::jsonb,
    82,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=21 with 0≤x≤10, 0≤y≤11, 0≤z≤10?',
    'mcq',
    '{"A": "54", "B": "66", "C": "46", "D": "55"}'::jsonb,
    '"B"'::jsonb,
    83,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=132, current value=139. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "105.3", "B": "104.7371", "C": "105.2534", "D": "105.1262"}'::jsonb,
    '"A"'::jsonb,
    84,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 9th term of an AP with first term 36 and common difference 8.',
    'mcq',
    '{"A": "101", "B": "100", "C": "120", "D": "82"}'::jsonb,
    '"B"'::jsonb,
    85,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 2, what will be the code after 37 days?',
    'mcq',
    '{"A": "4", "B": "7", "C": "3", "D": "16"}'::jsonb,
    '"A"'::jsonb,
    86,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 6th term of an AP with first term 34 and common difference 4.',
    'mcq',
    '{"A": "46", "B": "55", "C": "50", "D": "54"}'::jsonb,
    '"D"'::jsonb,
    87,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=72, |B|=55, |A∩B|=45, compute |A∪B|.',
    'mcq',
    '{"A": "81", "B": "82", "C": "106", "D": "124"}'::jsonb,
    '"B"'::jsonb,
    88,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=44, |B|=59, and |A∩B|=28. What is |A∪B|?',
    'mcq',
    '{"A": "75", "B": "62", "C": "83", "D": "61"}'::jsonb,
    '"A"'::jsonb,
    89,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 9 distinct items?',
    'mcq',
    '{"A": "3024", "B": "2264", "C": "3293", "D": "3236"}'::jsonb,
    '"A"'::jsonb,
    90,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 5, 9, 17, 29, ?',
    'mcq',
    '{"A": "45", "B": "38", "C": "29", "D": "49"}'::jsonb,
    '"A"'::jsonb,
    91,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_3(81) = k, what is k?',
    'mcq',
    '{"A": "6", "B": "12", "C": "10", "D": "4"}'::jsonb,
    '"D"'::jsonb,
    92,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 5, what will be the code after 89 days?',
    'mcq',
    '{"A": "6", "B": "11", "C": "3", "D": "5"}'::jsonb,
    '"C"'::jsonb,
    93,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=71, |B|=55, |A∩B|=41, compute |A∪B|.',
    'mcq',
    '{"A": "69", "B": "85", "C": "52", "D": "78"}'::jsonb,
    '"B"'::jsonb,
    94,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 11 distinct items?',
    'mcq',
    '{"A": "56287", "B": "52925", "C": "51204", "D": "55440"}'::jsonb,
    '"D"'::jsonb,
    95,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_5(625) = k, what is k?',
    'mcq',
    '{"A": "6", "B": "2", "C": "0", "D": "4"}'::jsonb,
    '"D"'::jsonb,
    96,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[27,19],[16,?]], find ?',
    'mcq',
    '{"A": "64", "B": "40", "C": "62", "D": "71"}'::jsonb,
    '"C"'::jsonb,
    97,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 9x + 18 = 54',
    'mcq',
    '{"A": "4", "B": "0", "C": "8", "D": "14"}'::jsonb,
    '"A"'::jsonb,
    98,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=16 with 0≤x≤9, 0≤y≤7, 0≤z≤8?',
    'mcq',
    '{"A": "51", "B": "49", "C": "44", "D": "55"}'::jsonb,
    '"C"'::jsonb,
    99,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 8th term of an AP with first term 13 and common difference 10.',
    'mcq',
    '{"A": "88", "B": "71", "C": "83", "D": "93"}'::jsonb,
    '"C"'::jsonb,
    100,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 82 and standard deviation 19. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.2317", "B": "0.4352", "C": "0.532", "D": "0.1327"}'::jsonb,
    '"A"'::jsonb,
    101,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 35, 40, 50, 65, ?',
    'mcq',
    '{"A": "79", "B": "94", "C": "88", "D": "85"}'::jsonb,
    '"D"'::jsonb,
    102,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute log_5(125).',
    'mcq',
    '{"A": "3", "B": "17", "C": "24", "D": "12"}'::jsonb,
    '"A"'::jsonb,
    103,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.2, what is the expected number of successes in 12 trials?',
    'mcq',
    '{"A": "2.4", "B": "1.8685", "C": "2.5004", "D": "1.8579"}'::jsonb,
    '"A"'::jsonb,
    104,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=121, Y=111, Z=133. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.3315", "B": "0.3804", "C": "0.7768", "D": "0.998"}'::jsonb,
    '"A"'::jsonb,
    105,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[19,20],[22,?]], find ?',
    'mcq',
    '{"A": "74", "B": "61", "C": "48", "D": "71"}'::jsonb,
    '"B"'::jsonb,
    106,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[13,17],[18,?]], find ?',
    'mcq',
    '{"A": "36", "B": "39", "C": "46", "D": "48"}'::jsonb,
    '"D"'::jsonb,
    107,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=25 with 0≤x≤8, 0≤y≤7, 0≤z≤7?',
    'mcq',
    '{"A": "4", "B": "2", "C": "1", "D": "0"}'::jsonb,
    '"D"'::jsonb,
    108,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -6x^2 + 35x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "2.2392", "B": "2.917", "C": "2.3696", "D": "2.6153"}'::jsonb,
    '"B"'::jsonb,
    109,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=16 with 0≤x≤7, 0≤y≤7, 0≤z≤8?',
    'mcq',
    '{"A": "37", "B": "29", "C": "27", "D": "28"}'::jsonb,
    '"D"'::jsonb,
    110,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 4x + 16 = 32',
    'mcq',
    '{"A": "0", "B": "6", "C": "8", "D": "4"}'::jsonb,
    '"D"'::jsonb,
    111,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 5x + 11 = 41',
    'mcq',
    '{"A": "6", "B": "0", "C": "2", "D": "1"}'::jsonb,
    '"A"'::jsonb,
    112,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 5, what will be the code after 155 days?',
    'mcq',
    '{"A": "2", "B": "6", "C": "7", "D": "8"}'::jsonb,
    '"B"'::jsonb,
    113,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=22 with 0≤x≤7, 0≤y≤10, 0≤z≤10?',
    'mcq',
    '{"A": "21", "B": "19", "C": "33", "D": "31"}'::jsonb,
    '"A"'::jsonb,
    114,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 9th term of an AP with first term 24 and common difference 10.',
    'mcq',
    '{"A": "82", "B": "121", "C": "118", "D": "104"}'::jsonb,
    '"D"'::jsonb,
    115,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 9th term of an AP with first term 26 and common difference 5.',
    'mcq',
    '{"A": "71", "B": "73", "C": "38", "D": "66"}'::jsonb,
    '"D"'::jsonb,
    116,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find next term: 33, 36, 42, 51, ?',
    'mcq',
    '{"A": "56", "B": "53", "C": "63", "D": "39"}'::jsonb,
    '"C"'::jsonb,
    117,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 6 and ratio 2, what is the 6th term?',
    'mcq',
    '{"A": "177", "B": "244", "C": "188", "D": "192"}'::jsonb,
    '"D"'::jsonb,
    118,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=92, current value=154. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "167.39", "B": "167.4862", "C": "167.0697", "D": "167.6808"}'::jsonb,
    '"A"'::jsonb,
    119,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items from 11 distinct items?',
    'mcq',
    '{"A": "59812", "B": "55440", "C": "56764", "D": "58934"}'::jsonb,
    '"B"'::jsonb,
    120,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 28, 33, 43, 58, ?',
    'mcq',
    '{"A": "78", "B": "71", "C": "70", "D": "79"}'::jsonb,
    '"A"'::jsonb,
    121,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 68 and standard deviation 16. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.3228", "B": "0.3588", "C": "0.2353", "D": "0.7878"}'::jsonb,
    '"C"'::jsonb,
    122,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 39, 44, 54, 69, ?',
    'mcq',
    '{"A": "83", "B": "85", "C": "75", "D": "89"}'::jsonb,
    '"D"'::jsonb,
    123,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 9 and ratio 3, what is the 6th term?',
    'mcq',
    '{"A": "2111", "B": "2187", "C": "2429", "D": "2535"}'::jsonb,
    '"B"'::jsonb,
    124,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 9, 27, 30, 90, ?',
    'mcq',
    '{"A": "115", "B": "93", "C": "86", "D": "80"}'::jsonb,
    '"B"'::jsonb,
    125,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 4 and ratio 3, what is the 5th term?',
    'mcq',
    '{"A": "324", "B": "347", "C": "326", "D": "313"}'::jsonb,
    '"A"'::jsonb,
    126,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (60 + 89) × 6 − 3',
    'mcq',
    '{"A": "854", "B": "995", "C": "818", "D": "891"}'::jsonb,
    '"D"'::jsonb,
    127,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 7, 12, 22, 37, ?',
    'mcq',
    '{"A": "70", "B": "45", "C": "57", "D": "69"}'::jsonb,
    '"C"'::jsonb,
    128,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (121 + 39) × 9 − 9',
    'mcq',
    '{"A": "1431", "B": "1248", "C": "1455", "D": "1181"}'::jsonb,
    '"A"'::jsonb,
    129,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=21 with 0≤x≤11, 0≤y≤9, 0≤z≤9?',
    'mcq',
    '{"A": "50", "B": "45", "C": "56", "D": "29"}'::jsonb,
    '"B"'::jsonb,
    130,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=110, current value=146. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "132.7791", "B": "132.6639", "C": "132.73", "D": "132.5809"}'::jsonb,
    '"C"'::jsonb,
    131,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 12x + 32 = 0, what is the larger root?',
    'mcq',
    '{"A": "14", "B": "2", "C": "5", "D": "8"}'::jsonb,
    '"D"'::jsonb,
    132,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 16, 112, 119, 833, ?',
    'mcq',
    '{"A": "780", "B": "700", "C": "796", "D": "840"}'::jsonb,
    '"D"'::jsonb,
    133,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_5(3125) = k, what is k?',
    'mcq',
    '{"A": "6", "B": "5", "C": "13", "D": "9"}'::jsonb,
    '"B"'::jsonb,
    134,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days coded Mon=1,...,Sun=7. If today code=6, what is the code after 176 days?',
    'mcq',
    '{"A": "6", "B": "7", "C": "11", "D": "19"}'::jsonb,
    '"B"'::jsonb,
    135,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (39 + 76) × 4 − 2',
    'mcq',
    '{"A": "501", "B": "469", "C": "458", "D": "384"}'::jsonb,
    '"C"'::jsonb,
    136,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 66 and standard deviation 16. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.1853", "B": "0.2424", "C": "0.0385", "D": "0.1932"}'::jsonb,
    '"B"'::jsonb,
    137,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 6x + 23 = 77',
    'mcq',
    '{"A": "9", "B": "8", "C": "2", "D": "11"}'::jsonb,
    '"A"'::jsonb,
    138,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days coded Mon=1,...,Sun=7. If today code=6, what is the code after 124 days?',
    'mcq',
    '{"A": "1", "B": "18", "C": "4", "D": "16"}'::jsonb,
    '"C"'::jsonb,
    139,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 20, 25, 35, 50, ?',
    'mcq',
    '{"A": "66", "B": "44", "C": "42", "D": "70"}'::jsonb,
    '"D"'::jsonb,
    140,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=116, Q4=76. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.4594", "B": "-0.9807", "C": "-0.3448", "D": "-0.5615"}'::jsonb,
    '"C"'::jsonb,
    141,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=127, Y=108, Z=116. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.1663", "B": "0.0574", "C": "0.3618", "D": "0.6917"}'::jsonb,
    '"C"'::jsonb,
    142,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 6, 12, 24, 42, ?',
    'mcq',
    '{"A": "42", "B": "48", "C": "76", "D": "66"}'::jsonb,
    '"D"'::jsonb,
    143,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=157, Y=94, Z=75. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "1.1012", "B": "0.4316", "C": "0.4816", "D": "0.7965"}'::jsonb,
    '"C"'::jsonb,
    144,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=71, |B|=48, and |A∩B|=20. What is |A∪B|?',
    'mcq',
    '{"A": "83", "B": "99", "C": "116", "D": "77"}'::jsonb,
    '"B"'::jsonb,
    145,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[4,2],[1,5]]?',
    'mcq',
    '{"A": "28", "B": "18", "C": "17", "D": "16"}'::jsonb,
    '"B"'::jsonb,
    146,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=142, Q4=105. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.2021", "B": "0.4123", "C": "-0.2606", "D": "-0.3892"}'::jsonb,
    '"C"'::jsonb,
    147,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=90, Q2=84, Q3=86, Q4=80. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "340", "B": "312", "C": "350", "D": "323"}'::jsonb,
    '"A"'::jsonb,
    148,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=124, |B|=62, |A∩B|=52, compute |A∪B|.',
    'mcq',
    '{"A": "134", "B": "114", "C": "144", "D": "96"}'::jsonb,
    '"A"'::jsonb,
    149,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 8th term of an AP with first term 23 and common difference 4.',
    'mcq',
    '{"A": "51", "B": "61", "C": "63", "D": "67"}'::jsonb,
    '"A"'::jsonb,
    150,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=24 with 0≤x≤11, 0≤y≤10, 0≤z≤8?',
    'mcq',
    '{"A": "24", "B": "31", "C": "22", "D": "21"}'::jsonb,
    '"D"'::jsonb,
    151,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (35 + 36) × 7 − 9',
    'mcq',
    '{"A": "488", "B": "362", "C": "431", "D": "354"}'::jsonb,
    '"A"'::jsonb,
    152,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 10th term of an AP with first term 29 and common difference 11.',
    'mcq',
    '{"A": "128", "B": "114", "C": "170", "D": "106"}'::jsonb,
    '"A"'::jsonb,
    153,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 13, 91, 98, 686, ?',
    'mcq',
    '{"A": "630", "B": "823", "C": "553", "D": "693"}'::jsonb,
    '"D"'::jsonb,
    154,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 6 and ratio 3, what is the 8th term?',
    'mcq',
    '{"A": "13122", "B": "12844", "C": "14189", "D": "14978"}'::jsonb,
    '"A"'::jsonb,
    155,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 8x + 13 = 45',
    'mcq',
    '{"A": "8", "B": "3", "C": "4", "D": "2"}'::jsonb,
    '"C"'::jsonb,
    156,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=18 with 0≤x≤10, 0≤y≤12, 0≤z≤8?',
    'mcq',
    '{"A": "78", "B": "62", "C": "94", "D": "102"}'::jsonb,
    '"A"'::jsonb,
    157,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 7, 14, 28, 49, ?',
    'mcq',
    '{"A": "77", "B": "89", "C": "87", "D": "92"}'::jsonb,
    '"A"'::jsonb,
    158,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[20,17],[10,?]], find ?',
    'mcq',
    '{"A": "41", "B": "52", "C": "47", "D": "51"}'::jsonb,
    '"C"'::jsonb,
    159,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 26, 33, 47, 68, ?',
    'mcq',
    '{"A": "128", "B": "76", "C": "96", "D": "80"}'::jsonb,
    '"C"'::jsonb,
    160,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 8, 14, 26, 44, ?',
    'mcq',
    '{"A": "42", "B": "60", "C": "74", "D": "68"}'::jsonb,
    '"D"'::jsonb,
    161,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=22 with 0≤x≤8, 0≤y≤10, 0≤z≤9?',
    'mcq',
    '{"A": "19", "B": "21", "C": "27", "D": "26"}'::jsonb,
    '"B"'::jsonb,
    162,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 20, 26, 38, 56, ?',
    'mcq',
    '{"A": "83", "B": "80", "C": "88", "D": "58"}'::jsonb,
    '"B"'::jsonb,
    163,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 81, 100, 121, 144, ?',
    'mcq',
    '{"A": "172", "B": "169", "C": "143", "D": "157"}'::jsonb,
    '"B"'::jsonb,
    164,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=138, Q2=161, Q3=88, Q4=110. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "475", "B": "497", "C": "541", "D": "449"}'::jsonb,
    '"B"'::jsonb,
    165,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 29, 33, 41, 53, ?',
    'mcq',
    '{"A": "69", "B": "63", "C": "81", "D": "71"}'::jsonb,
    '"A"'::jsonb,
    166,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.24, what is the expected number of successes in 30 trials?',
    'mcq',
    '{"A": "7.5391", "B": "6.8571", "C": "7.1066", "D": "7.2"}'::jsonb,
    '"D"'::jsonb,
    167,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.26, what is the expected number of successes in 15 trials?',
    'mcq',
    '{"A": "3.9359", "B": "4.1517", "C": "4.1997", "D": "3.9"}'::jsonb,
    '"D"'::jsonb,
    168,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_2(256) = k, what is k?',
    'mcq',
    '{"A": "18", "B": "13", "C": "8", "D": "10"}'::jsonb,
    '"C"'::jsonb,
    169,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=154, Q2=94, Q3=148, Q4=76. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "434", "B": "472", "C": "532", "D": "568"}'::jsonb,
    '"B"'::jsonb,
    170,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_5(78125) = k, what is k?',
    'mcq',
    '{"A": "19", "B": "9", "C": "7", "D": "13"}'::jsonb,
    '"C"'::jsonb,
    171,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items from 17 distinct items?',
    'mcq',
    '{"A": "57120", "B": "47592", "C": "40731", "D": "55349"}'::jsonb,
    '"A"'::jsonb,
    172,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days coded Mon=1,...,Sun=7. If today code=4, what is the code after 113 days?',
    'mcq',
    '{"A": "9", "B": "5", "C": "6", "D": "3"}'::jsonb,
    '"B"'::jsonb,
    173,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 64, 81, 100, 121, ?',
    'mcq',
    '{"A": "144", "B": "110", "C": "120", "D": "148"}'::jsonb,
    '"A"'::jsonb,
    174,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 37 and standard deviation 11. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.4249", "B": "0.2139", "C": "0.43", "D": "0.2973"}'::jsonb,
    '"D"'::jsonb,
    175,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 7 and ratio 3, what is the 6th term?',
    'mcq',
    '{"A": "1843", "B": "1785", "C": "1633", "D": "1701"}'::jsonb,
    '"D"'::jsonb,
    176,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 14 distinct items?',
    'mcq',
    '{"A": "214881", "B": "240240", "C": "236326", "D": "248981"}'::jsonb,
    '"B"'::jsonb,
    177,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[17,19],[9,?]], find ?',
    'mcq',
    '{"A": "51", "B": "45", "C": "49", "D": "50"}'::jsonb,
    '"B"'::jsonb,
    178,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.26, what is the expected number of successes in 25 trials?',
    'mcq',
    '{"A": "6.7381", "B": "6.1638", "C": "7.0289", "D": "6.5"}'::jsonb,
    '"D"'::jsonb,
    179,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (160 + 60) × 5 − 5',
    'mcq',
    '{"A": "1054", "B": "1095", "C": "865", "D": "1085"}'::jsonb,
    '"B"'::jsonb,
    180,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=163, Q4=66. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.5951", "B": "-0.7138", "C": "-0.3542", "D": "-1.2167"}'::jsonb,
    '"A"'::jsonb,
    181,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Count integer solutions to x+y+z=26 with 0≤x≤10, 0≤y≤9, 0≤z≤13.',
    'mcq',
    '{"A": "40", "B": "28", "C": "31", "D": "14"}'::jsonb,
    '"B"'::jsonb,
    182,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=125, current value=131. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "104.8", "B": "105.0234", "C": "105.4587", "D": "104.584"}'::jsonb,
    '"A"'::jsonb,
    183,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 2, what will be the code after 78 days?',
    'mcq',
    '{"A": "5", "B": "11", "C": "9", "D": "3"}'::jsonb,
    '"D"'::jsonb,
    184,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 11, 44, 48, 192, ?',
    'mcq',
    '{"A": "223", "B": "189", "C": "196", "D": "212"}'::jsonb,
    '"C"'::jsonb,
    185,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 9x + 27 = 63',
    'mcq',
    '{"A": "4", "B": "2", "C": "7", "D": "14"}'::jsonb,
    '"A"'::jsonb,
    186,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=69, |B|=44, and |A∩B|=23. What is |A∪B|?',
    'mcq',
    '{"A": "90", "B": "106", "C": "93", "D": "122"}'::jsonb,
    '"A"'::jsonb,
    187,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=138, current value=163. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "118.4519", "B": "118.12", "C": "117.995", "D": "117.8241"}'::jsonb,
    '"B"'::jsonb,
    188,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 54 and standard deviation 12. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.0605", "B": "0.0448", "C": "0.2222", "D": "0.1343"}'::jsonb,
    '"C"'::jsonb,
    189,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[30,21],[16,?]], find ?',
    'mcq',
    '{"A": "70", "B": "77", "C": "47", "D": "67"}'::jsonb,
    '"D"'::jsonb,
    190,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -3x^2 + 46x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "8.2221", "B": "7.851", "C": "7.4342", "D": "7.667"}'::jsonb,
    '"D"'::jsonb,
    191,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=18 with 0≤x≤10, 0≤y≤9, 0≤z≤12?',
    'mcq',
    '{"A": "120", "B": "78", "C": "88", "D": "98"}'::jsonb,
    '"C"'::jsonb,
    192,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=161, Q2=135, Q3=101, Q4=128. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "510", "B": "635", "C": "581", "D": "525"}'::jsonb,
    '"D"'::jsonb,
    193,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (145 + 68) × 3 − 5',
    'mcq',
    '{"A": "646", "B": "758", "C": "634", "D": "480"}'::jsonb,
    '"C"'::jsonb,
    194,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 44, 51, 65, 86, ?',
    'mcq',
    '{"A": "106", "B": "126", "C": "133", "D": "114"}'::jsonb,
    '"D"'::jsonb,
    195,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=23 with 0≤x≤10, 0≤y≤12, 0≤z≤9?',
    'mcq',
    '{"A": "63", "B": "51", "C": "48", "D": "45"}'::jsonb,
    '"D"'::jsonb,
    196,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[5,0],[4,6]]?',
    'mcq',
    '{"A": "21", "B": "30", "C": "35", "D": "23"}'::jsonb,
    '"B"'::jsonb,
    197,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 87 and standard deviation 24. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.9182", "B": "0.4429", "C": "0.1288", "D": "0.2759"}'::jsonb,
    '"D"'::jsonb,
    198,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.27, what is the expected number of successes in 20 trials?',
    'mcq',
    '{"A": "5.3691", "B": "5.4", "C": "5.2591", "D": "5.0442"}'::jsonb,
    '"B"'::jsonb,
    199,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=124, current value=161. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "129.6534", "B": "129.5916", "C": "129.84", "D": "129.6409"}'::jsonb,
    '"C"'::jsonb,
    200,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=178, Q2=106, Q3=77, Q4=115. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "487", "B": "572", "C": "348", "D": "476"}'::jsonb,
    '"D"'::jsonb,
    201,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 10 and ratio 4, what is the 8th term?',
    'mcq',
    '{"A": "171982", "B": "158198", "C": "181368", "D": "163840"}'::jsonb,
    '"D"'::jsonb,
    202,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (54 + 49) × 6 − 5',
    'mcq',
    '{"A": "613", "B": "563", "C": "608", "D": "562"}'::jsonb,
    '"A"'::jsonb,
    203,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=84, |B|=54, and |A∩B|=34. What is |A∪B|?',
    'mcq',
    '{"A": "126", "B": "104", "C": "99", "D": "90"}'::jsonb,
    '"B"'::jsonb,
    204,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=142, Y=82, Z=133. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.2987", "B": "0.1312", "C": "0.1176", "D": "0.3978"}'::jsonb,
    '"D"'::jsonb,
    205,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 100, 121, 144, 169, ?',
    'mcq',
    '{"A": "206", "B": "189", "C": "196", "D": "177"}'::jsonb,
    '"C"'::jsonb,
    206,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 1, what will be the code after 83 days?',
    'mcq',
    '{"A": "11", "B": "3", "C": "13", "D": "7"}'::jsonb,
    '"D"'::jsonb,
    207,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[7,1],[4,5]]?',
    'mcq',
    '{"A": "31", "B": "32", "C": "36", "D": "29"}'::jsonb,
    '"A"'::jsonb,
    208,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=135, Q2=111, Q3=85, Q4=89. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "420", "B": "410", "C": "326", "D": "378"}'::jsonb,
    '"A"'::jsonb,
    209,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Series: 22, 26, 34, 46, ?. Find next term.',
    'mcq',
    '{"A": "70", "B": "62", "C": "92", "D": "44"}'::jsonb,
    '"B"'::jsonb,
    210,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=113, Q2=90, Q3=84, Q4=112. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "444", "B": "399", "C": "471", "D": "333"}'::jsonb,
    '"B"'::jsonb,
    211,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=24 with 0≤x≤11, 0≤y≤9, 0≤z≤8?',
    'mcq',
    '{"A": "1", "B": "15", "C": "16", "D": "8"}'::jsonb,
    '"B"'::jsonb,
    212,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=112, current value=170. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "151.9712", "B": "151.79", "C": "152.2429", "D": "152.2482"}'::jsonb,
    '"B"'::jsonb,
    213,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 14, 70, 75, 375, ?',
    'mcq',
    '{"A": "462", "B": "340", "C": "380", "D": "339"}'::jsonb,
    '"C"'::jsonb,
    214,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=133, Q2=141, Q3=139, Q4=93. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "468", "B": "469", "C": "506", "D": "489"}'::jsonb,
    '"C"'::jsonb,
    215,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.28, what is the expected number of successes in 12 trials?',
    'mcq',
    '{"A": "3.36", "B": "2.7672", "C": "3.2359", "D": "3.3186"}'::jsonb,
    '"A"'::jsonb,
    216,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 63 and standard deviation 15. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.0921", "B": "0.2381", "C": "0.5182", "D": "0.3092"}'::jsonb,
    '"B"'::jsonb,
    217,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.25, what is the expected number of successes in 25 trials?',
    'mcq',
    '{"A": "6.3787", "B": "5.9121", "C": "6.25", "D": "6.2103"}'::jsonb,
    '"C"'::jsonb,
    218,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=128, Q4=61. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.793", "B": "-0.5234", "C": "-0.3897", "D": "-0.7801"}'::jsonb,
    '"B"'::jsonb,
    219,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=46, |B|=58, and |A∩B|=18. What is |A∪B|?',
    'mcq',
    '{"A": "96", "B": "70", "C": "86", "D": "101"}'::jsonb,
    '"C"'::jsonb,
    220,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 9x + 20 = 65',
    'mcq',
    '{"A": "10", "B": "5", "C": "3", "D": "6"}'::jsonb,
    '"B"'::jsonb,
    221,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=80, |B|=65, and |A∩B|=17. What is |A∪B|?',
    'mcq',
    '{"A": "94", "B": "149", "C": "128", "D": "168"}'::jsonb,
    '"C"'::jsonb,
    222,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 79 and standard deviation 10. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.5452", "B": "0.2439", "C": "0.3078", "D": "0.1266"}'::jsonb,
    '"D"'::jsonb,
    223,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[26,11],[17,?]], find ?',
    'mcq',
    '{"A": "70", "B": "54", "C": "44", "D": "48"}'::jsonb,
    '"B"'::jsonb,
    224,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 8x + 18 = 66',
    'mcq',
    '{"A": "6", "B": "9", "C": "10", "D": "3"}'::jsonb,
    '"A"'::jsonb,
    225,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.24, what is the expected number of successes in 15 trials?',
    'mcq',
    '{"A": "4.0215", "B": "3.6", "C": "3.2674", "D": "3.9784"}'::jsonb,
    '"B"'::jsonb,
    226,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 13, 19, 31, 49, ?',
    'mcq',
    '{"A": "91", "B": "73", "C": "75", "D": "70"}'::jsonb,
    '"B"'::jsonb,
    227,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=148, Y=110, Z=106. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.8896", "B": "0.4688", "C": "0.5225", "D": "0.4066"}'::jsonb,
    '"D"'::jsonb,
    228,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[32,10],[20,?]], find ?',
    'mcq',
    '{"A": "68", "B": "46", "C": "56", "D": "62"}'::jsonb,
    '"D"'::jsonb,
    229,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 9 distinct items?',
    'mcq',
    '{"A": "442", "B": "504", "C": "606", "D": "454"}'::jsonb,
    '"B"'::jsonb,
    230,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[6,3],[4,5]]?',
    'mcq',
    '{"A": "26", "B": "12", "C": "18", "D": "30"}'::jsonb,
    '"C"'::jsonb,
    231,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_10(1000000000) = k, what is k?',
    'mcq',
    '{"A": "2", "B": "5", "C": "9", "D": "10"}'::jsonb,
    '"C"'::jsonb,
    232,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (110 + 78) × 3 − 2',
    'mcq',
    '{"A": "529", "B": "562", "C": "596", "D": "702"}'::jsonb,
    '"B"'::jsonb,
    233,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤9, 0≤y≤9, 0≤z≤12?',
    'mcq',
    '{"A": "11", "B": "6", "C": "16", "D": "9"}'::jsonb,
    '"B"'::jsonb,
    234,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[3,0],[4,5]]?',
    'mcq',
    '{"A": "11", "B": "14", "C": "21", "D": "15"}'::jsonb,
    '"D"'::jsonb,
    235,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 16, 23, 37, 58, ?',
    'mcq',
    '{"A": "104", "B": "80", "C": "86", "D": "72"}'::jsonb,
    '"C"'::jsonb,
    236,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.27, what is the expected number of successes in 25 trials?',
    'mcq',
    '{"A": "6.2008", "B": "7.0136", "C": "6.6799", "D": "6.75"}'::jsonb,
    '"D"'::jsonb,
    237,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=164, Q4=141. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.1402", "B": "-0.5989", "C": "-0.0872", "D": "-0.0727"}'::jsonb,
    '"A"'::jsonb,
    238,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[21,17],[7,?]], find ?',
    'mcq',
    '{"A": "53", "B": "37", "C": "45", "D": "55"}'::jsonb,
    '"C"'::jsonb,
    239,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=151, Y=138, Z=160. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.3363", "B": "0.0319", "C": "0.683", "D": "0.1762"}'::jsonb,
    '"A"'::jsonb,
    240,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 26, 34, 50, 74, ?',
    'mcq',
    '{"A": "102", "B": "134", "C": "101", "D": "106"}'::jsonb,
    '"D"'::jsonb,
    241,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 7, 11, 19, 31, ?',
    'mcq',
    '{"A": "47", "B": "53", "C": "37", "D": "49"}'::jsonb,
    '"A"'::jsonb,
    242,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 10, 15, 25, 40, ?',
    'mcq',
    '{"A": "61", "B": "55", "C": "70", "D": "60"}'::jsonb,
    '"D"'::jsonb,
    243,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=18 with 0≤x≤10, 0≤y≤11, 0≤z≤10?',
    'mcq',
    '{"A": "110", "B": "90", "C": "88", "D": "56"}'::jsonb,
    '"B"'::jsonb,
    244,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_10(10000000) = k, what is k?',
    'mcq',
    '{"A": "7", "B": "12", "C": "10", "D": "9"}'::jsonb,
    '"A"'::jsonb,
    245,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=100, Y=99, Z=113. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.2725", "B": "0.6705", "C": "0.4393", "D": "0.3205"}'::jsonb,
    '"D"'::jsonb,
    246,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 81, 100, 121, 144, ?. Find next.',
    'mcq',
    '{"A": "154", "B": "166", "C": "169", "D": "135"}'::jsonb,
    '"C"'::jsonb,
    247,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 6x + 12 = 42',
    'mcq',
    '{"A": "5", "B": "2", "C": "17", "D": "1"}'::jsonb,
    '"A"'::jsonb,
    248,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 14, 56, 60, 240, ?',
    'mcq',
    '{"A": "229", "B": "216", "C": "244", "D": "300"}'::jsonb,
    '"C"'::jsonb,
    249,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=91, current value=145. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "158.9032", "B": "159.9905", "C": "159.5652", "D": "159.34"}'::jsonb,
    '"D"'::jsonb,
    250,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=102, current value=118. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "115.6042", "B": "115.69", "C": "116.0348", "D": "115.0983"}'::jsonb,
    '"B"'::jsonb,
    251,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For the numbers 15, 22, 29, 34, 53, what is the median?',
    'mcq',
    '{"A": "15", "B": "29", "C": "28", "D": "13"}'::jsonb,
    '"B"'::jsonb,
    252,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 8th term of an AP with first term 35 and common difference 6.',
    'mcq',
    '{"A": "65", "B": "82", "C": "77", "D": "64"}'::jsonb,
    '"C"'::jsonb,
    253,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -3x^2 + 29x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "4.833", "B": "4.7253", "C": "5.057", "D": "5.0565"}'::jsonb,
    '"A"'::jsonb,
    254,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 7 and ratio 2, what is the 7th term?',
    'mcq',
    '{"A": "499", "B": "448", "C": "328", "D": "503"}'::jsonb,
    '"B"'::jsonb,
    255,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 34, 41, 55, 76, ?',
    'mcq',
    '{"A": "104", "B": "80", "C": "113", "D": "88"}'::jsonb,
    '"A"'::jsonb,
    256,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 13x + 11 = 115',
    'mcq',
    '{"A": "6", "B": "20", "C": "8", "D": "10"}'::jsonb,
    '"C"'::jsonb,
    257,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=53, |B|=34, and |A∩B|=25. What is |A∪B|?',
    'mcq',
    '{"A": "62", "B": "61", "C": "86", "D": "78"}'::jsonb,
    '"A"'::jsonb,
    258,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 13 distinct items?',
    'mcq',
    '{"A": "1716", "B": "1778", "C": "2020", "D": "1717"}'::jsonb,
    '"A"'::jsonb,
    259,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 14, 20, 32, 50, ?',
    'mcq',
    '{"A": "76", "B": "56", "C": "69", "D": "74"}'::jsonb,
    '"D"'::jsonb,
    260,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=153, Q4=81. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.8974", "B": "-0.4706", "C": "-0.427", "D": "-0.808"}'::jsonb,
    '"B"'::jsonb,
    261,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=110, Q2=142, Q3=130, Q4=148. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "602", "B": "640", "C": "544", "D": "530"}'::jsonb,
    '"D"'::jsonb,
    262,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.27, what is the expected number of successes in 30 trials?',
    'mcq',
    '{"A": "7.7548", "B": "8.2559", "C": "8.0608", "D": "8.1"}'::jsonb,
    '"D"'::jsonb,
    263,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤11, 0≤y≤8, 0≤z≤12?',
    'mcq',
    '{"A": "24", "B": "22", "C": "25", "D": "21"}'::jsonb,
    '"D"'::jsonb,
    264,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 25, 36, 49, 64, ?',
    'mcq',
    '{"A": "91", "B": "103", "C": "81", "D": "97"}'::jsonb,
    '"C"'::jsonb,
    265,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 14, 18, 26, 38, ?',
    'mcq',
    '{"A": "54", "B": "60", "C": "78", "D": "43"}'::jsonb,
    '"A"'::jsonb,
    266,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_5(15625) = k, what is k?',
    'mcq',
    '{"A": "14", "B": "8", "C": "6", "D": "12"}'::jsonb,
    '"C"'::jsonb,
    267,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (86 + 78) × 9 − 6',
    'mcq',
    '{"A": "1470", "B": "1515", "C": "1728", "D": "1457"}'::jsonb,
    '"A"'::jsonb,
    268,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items from 11 distinct items?',
    'mcq',
    '{"A": "6999", "B": "7296", "C": "8305", "D": "7920"}'::jsonb,
    '"D"'::jsonb,
    269,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 5 and ratio 4, what is the 5th term?',
    'mcq',
    '{"A": "1280", "B": "1560", "C": "1133", "D": "1378"}'::jsonb,
    '"A"'::jsonb,
    270,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -7x^2 + 17x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.7688", "B": "1.3517", "C": "1.3044", "D": "1.214"}'::jsonb,
    '"D"'::jsonb,
    271,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 8th term of an AP with first term 44 and common difference 10.',
    'mcq',
    '{"A": "114", "B": "104", "C": "121", "D": "112"}'::jsonb,
    '"A"'::jsonb,
    272,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[20,19],[8,?]], find ?',
    'mcq',
    '{"A": "37", "B": "47", "C": "43", "D": "65"}'::jsonb,
    '"B"'::jsonb,
    273,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 14, 98, 105, 735, ?',
    'mcq',
    '{"A": "742", "B": "838", "C": "706", "D": "728"}'::jsonb,
    '"A"'::jsonb,
    274,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[5,1],[0,9]]?',
    'mcq',
    '{"A": "45", "B": "38", "C": "61", "D": "35"}'::jsonb,
    '"A"'::jsonb,
    275,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items from 12 distinct items?',
    'mcq',
    '{"A": "10722", "B": "11574", "C": "10140", "D": "11880"}'::jsonb,
    '"D"'::jsonb,
    276,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_5(1953125) = k, what is k?',
    'mcq',
    '{"A": "13", "B": "17", "C": "8", "D": "9"}'::jsonb,
    '"D"'::jsonb,
    277,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_3(243) = k, what is k?',
    'mcq',
    '{"A": "5", "B": "13", "C": "15", "D": "11"}'::jsonb,
    '"A"'::jsonb,
    278,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=18 with 0≤x≤8, 0≤y≤11, 0≤z≤9?',
    'mcq',
    '{"A": "62", "B": "61", "C": "57", "D": "58"}'::jsonb,
    '"A"'::jsonb,
    279,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find next term: 19, 23, 31, 43, ?',
    'mcq',
    '{"A": "45", "B": "41", "C": "59", "D": "48"}'::jsonb,
    '"C"'::jsonb,
    280,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 17, 119, 126, 882, ?',
    'mcq',
    '{"A": "780", "B": "767", "C": "1081", "D": "889"}'::jsonb,
    '"D"'::jsonb,
    281,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 1, what will be the code after 157 days?',
    'mcq',
    '{"A": "4", "B": "10", "C": "2", "D": "12"}'::jsonb,
    '"A"'::jsonb,
    282,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=25 with 0≤x≤11, 0≤y≤11, 0≤z≤11?',
    'mcq',
    '{"A": "29", "B": "53", "C": "45", "D": "40"}'::jsonb,
    '"C"'::jsonb,
    283,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 22, 110, 115, 575, ?',
    'mcq',
    '{"A": "440", "B": "535", "C": "580", "D": "640"}'::jsonb,
    '"C"'::jsonb,
    284,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=22 with 0≤x≤9, 0≤y≤9, 0≤z≤9?',
    'mcq',
    '{"A": "23", "B": "21", "C": "26", "D": "22"}'::jsonb,
    '"B"'::jsonb,
    285,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[5,3],[6,8]]?',
    'mcq',
    '{"A": "22", "B": "19", "C": "14", "D": "21"}'::jsonb,
    '"A"'::jsonb,
    286,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Count integer solutions to x+y+z=24 with 0≤x≤16, 0≤y≤10, 0≤z≤13.',
    'mcq',
    '{"A": "112", "B": "113", "C": "118", "D": "123"}'::jsonb,
    '"C"'::jsonb,
    287,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 12th term of an AP with first term 24 and common difference 9.',
    'mcq',
    '{"A": "109", "B": "137", "C": "123", "D": "133"}'::jsonb,
    '"C"'::jsonb,
    288,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items from 18 distinct items?',
    'mcq',
    '{"A": "4637", "B": "4896", "C": "4834", "D": "4251"}'::jsonb,
    '"B"'::jsonb,
    289,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=24 with 0≤x≤9, 0≤y≤9, 0≤z≤8?',
    'mcq',
    '{"A": "10", "B": "6", "C": "7", "D": "16"}'::jsonb,
    '"B"'::jsonb,
    290,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=67, |B|=48, |A∩B|=22, compute |A∪B|.',
    'mcq',
    '{"A": "103", "B": "84", "C": "93", "D": "138"}'::jsonb,
    '"C"'::jsonb,
    291,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A GP has first term 8 and ratio 5. What is the 9th term?',
    'mcq',
    '{"A": "3125000", "B": "3592534", "C": "2835978", "D": "3304249"}'::jsonb,
    '"A"'::jsonb,
    292,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=160, Q4=146. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "0.3681", "B": "-0.2172", "C": "-0.162", "D": "-0.0875"}'::jsonb,
    '"D"'::jsonb,
    293,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=121, current value=114. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "94.2601", "B": "94.0742", "C": "94.6612", "D": "94.21"}'::jsonb,
    '"D"'::jsonb,
    294,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[5,2],[2,5]]?',
    'mcq',
    '{"A": "25", "B": "28", "C": "19", "D": "21"}'::jsonb,
    '"D"'::jsonb,
    295,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 7 and ratio 2, what is the 6th term?',
    'mcq',
    '{"A": "239", "B": "202", "C": "224", "D": "246"}'::jsonb,
    '"C"'::jsonb,
    296,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (64 + 81) × 8 − 6',
    'mcq',
    '{"A": "1350", "B": "1060", "C": "1240", "D": "1154"}'::jsonb,
    '"D"'::jsonb,
    297,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=144, current value=121. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "83.6895", "B": "84.0619", "C": "84.03", "D": "84.0971"}'::jsonb,
    '"C"'::jsonb,
    298,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=22 with 0≤x≤11, 0≤y≤12, 0≤z≤10?',
    'mcq',
    '{"A": "74", "B": "77", "C": "79", "D": "63"}'::jsonb,
    '"B"'::jsonb,
    299,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For the numbers 39, 45, 49, 51, 56, what is the median?',
    'mcq',
    '{"A": "49", "B": "37", "C": "50", "D": "46"}'::jsonb,
    '"A"'::jsonb,
    300,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=23 with 0≤x≤12, 0≤y≤13, 0≤z≤11?',
    'mcq',
    '{"A": "93", "B": "119", "C": "86", "D": "101"}'::jsonb,
    '"D"'::jsonb,
    301,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_3(19683) = k, what is k?',
    'mcq',
    '{"A": "9", "B": "19", "C": "3", "D": "13"}'::jsonb,
    '"A"'::jsonb,
    302,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 7, what will be the code after 146 days?',
    'mcq',
    '{"A": "8", "B": "6", "C": "0", "D": "12"}'::jsonb,
    '"B"'::jsonb,
    303,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 33 and standard deviation 16. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.4848", "B": "0.5884", "C": "0.4249", "D": "1.1747"}'::jsonb,
    '"A"'::jsonb,
    304,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -5x^2 + 34x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "3.6451", "B": "3.2631", "C": "3.7441", "D": "3.4"}'::jsonb,
    '"D"'::jsonb,
    305,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.31, what is the expected number of successes in 20 trials?',
    'mcq',
    '{"A": "6.3756", "B": "6.2994", "C": "5.5534", "D": "6.2"}'::jsonb,
    '"D"'::jsonb,
    306,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 2 items from 12 distinct items?',
    'mcq',
    '{"A": "48", "B": "74", "C": "54", "D": "66"}'::jsonb,
    '"D"'::jsonb,
    307,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[27,22],[20,?]], find ?',
    'mcq',
    '{"A": "97", "B": "57", "C": "93", "D": "69"}'::jsonb,
    '"D"'::jsonb,
    308,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=155, Y=145, Z=138. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.9953", "B": "0.2576", "C": "0.0499", "D": "0.3539"}'::jsonb,
    '"D"'::jsonb,
    309,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Pattern series: 15, 75, 81, 405, ?. Find next term.',
    'mcq',
    '{"A": "411", "B": "365", "C": "354", "D": "528"}'::jsonb,
    '"A"'::jsonb,
    310,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 121, 144, 169, 196, ?',
    'mcq',
    '{"A": "199", "B": "225", "C": "237", "D": "223"}'::jsonb,
    '"B"'::jsonb,
    311,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 11th term of an AP with first term 34 and common difference 6.',
    'mcq',
    '{"A": "94", "B": "109", "C": "97", "D": "100"}'::jsonb,
    '"A"'::jsonb,
    312,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=115, Y=137, Z=139. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.2941", "B": "0.2362", "C": "0.0117", "D": "0.3751"}'::jsonb,
    '"A"'::jsonb,
    313,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.31, what is the expected number of successes in 15 trials?',
    'mcq',
    '{"A": "4.9618", "B": "4.896", "C": "4.615", "D": "4.65"}'::jsonb,
    '"D"'::jsonb,
    314,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 16, 24, 40, 64, ?',
    'mcq',
    '{"A": "94", "B": "128", "C": "96", "D": "86"}'::jsonb,
    '"C"'::jsonb,
    315,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (116 + 76) × 4 − 5',
    'mcq',
    '{"A": "774", "B": "763", "C": "790", "D": "611"}'::jsonb,
    '"B"'::jsonb,
    316,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=44, |B|=42, and |A∩B|=18. What is |A∪B|?',
    'mcq',
    '{"A": "56", "B": "82", "C": "68", "D": "70"}'::jsonb,
    '"C"'::jsonb,
    317,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Pattern series: 15, 105, 109, 763, ?. Find next term.',
    'mcq',
    '{"A": "767", "B": "530", "C": "697", "D": "717"}'::jsonb,
    '"A"'::jsonb,
    318,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_2(512) = k, what is k?',
    'mcq',
    '{"A": "9", "B": "8", "C": "21", "D": "13"}'::jsonb,
    '"A"'::jsonb,
    319,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=122, Q4=73. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.2532", "B": "0.1098", "C": "-0.4016", "D": "-0.5677"}'::jsonb,
    '"C"'::jsonb,
    320,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=125, current value=109. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "87.2", "B": "87.3789", "C": "86.7205", "D": "87.1337"}'::jsonb,
    '"A"'::jsonb,
    321,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -7x^2 + 32x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.8645", "B": "2.5371", "C": "2.1455", "D": "2.286"}'::jsonb,
    '"D"'::jsonb,
    322,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -5x^2 + 33x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "2.632", "B": "3.3", "C": "3.8057", "D": "3.4823"}'::jsonb,
    '"B"'::jsonb,
    323,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 21, 126, 132, 792, ?',
    'mcq',
    '{"A": "986", "B": "785", "C": "798", "D": "762"}'::jsonb,
    '"C"'::jsonb,
    324,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=173, Q2=175, Q3=86, Q4=109. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "543", "B": "451", "C": "608", "D": "595"}'::jsonb,
    '"A"'::jsonb,
    325,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 18, 23, 33, 48, ?',
    'mcq',
    '{"A": "80", "B": "54", "C": "68", "D": "62"}'::jsonb,
    '"C"'::jsonb,
    326,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[9,0],[4,5]]?',
    'mcq',
    '{"A": "36", "B": "27", "C": "45", "D": "50"}'::jsonb,
    '"C"'::jsonb,
    327,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 46, 54, 70, 94, ?',
    'mcq',
    '{"A": "122", "B": "142", "C": "132", "D": "126"}'::jsonb,
    '"D"'::jsonb,
    328,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=70, |B|=44, and |A∩B|=25. What is |A∪B|?',
    'mcq',
    '{"A": "81", "B": "98", "C": "89", "D": "85"}'::jsonb,
    '"C"'::jsonb,
    329,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=133, Q4=142. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "0.7598", "B": "0.0677", "C": "0.1655", "D": "0.0356"}'::jsonb,
    '"B"'::jsonb,
    330,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=158, Y=109, Z=157. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.1843", "B": "1.0539", "C": "0.3726", "D": "0.527"}'::jsonb,
    '"C"'::jsonb,
    331,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=59, |B|=84, |A∩B|=47, compute |A∪B|.',
    'mcq',
    '{"A": "96", "B": "126", "C": "103", "D": "104"}'::jsonb,
    '"A"'::jsonb,
    332,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Series: 18, 27, 45, 72, ?. Find next term.',
    'mcq',
    '{"A": "108", "B": "84", "C": "90", "D": "74"}'::jsonb,
    '"A"'::jsonb,
    333,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 27, 35, 51, 75, ?',
    'mcq',
    '{"A": "91", "B": "121", "C": "105", "D": "107"}'::jsonb,
    '"D"'::jsonb,
    334,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=111, Y=157, Z=85. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.4031", "B": "0.6143", "C": "0.6518", "D": "0.3144"}'::jsonb,
    '"D"'::jsonb,
    335,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -4x^2 + 34x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "3.97", "B": "4.25", "C": "4.6467", "D": "4.7176"}'::jsonb,
    '"B"'::jsonb,
    336,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For the numbers 12, 33, 44, 47, 51, what is the median?',
    'mcq',
    '{"A": "65", "B": "36", "C": "44", "D": "38"}'::jsonb,
    '"C"'::jsonb,
    337,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[27,21],[15,?]], find ?',
    'mcq',
    '{"A": "56", "B": "50", "C": "58", "D": "63"}'::jsonb,
    '"D"'::jsonb,
    338,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 32, 40, 56, 80, ?',
    'mcq',
    '{"A": "112", "B": "132", "C": "116", "D": "92"}'::jsonb,
    '"A"'::jsonb,
    339,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 10 distinct items?',
    'mcq',
    '{"A": "36902", "B": "31752", "C": "35068", "D": "30240"}'::jsonb,
    '"D"'::jsonb,
    340,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 45, 53, 69, 93, ?',
    'mcq',
    '{"A": "116", "B": "125", "C": "143", "D": "109"}'::jsonb,
    '"B"'::jsonb,
    341,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=93, |B|=93, |A∩B|=19, compute |A∪B|.',
    'mcq',
    '{"A": "206", "B": "167", "C": "155", "D": "183"}'::jsonb,
    '"B"'::jsonb,
    342,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute log_10(100000000000).',
    'mcq',
    '{"A": "5", "B": "11", "C": "9", "D": "20"}'::jsonb,
    '"B"'::jsonb,
    343,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_2(1024) = k, what is k?',
    'mcq',
    '{"A": "14", "B": "16", "C": "10", "D": "15"}'::jsonb,
    '"C"'::jsonb,
    344,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=170, Q4=149. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.1235", "B": "-0.7233", "C": "0.1112", "D": "-0.4629"}'::jsonb,
    '"A"'::jsonb,
    345,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[9,2],[0,9]]?',
    'mcq',
    '{"A": "81", "B": "75", "C": "95", "D": "77"}'::jsonb,
    '"A"'::jsonb,
    346,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 23, 115, 120, 600, ?',
    'mcq',
    '{"A": "633", "B": "741", "C": "552", "D": "605"}'::jsonb,
    '"D"'::jsonb,
    347,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=127, Q4=75. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.2684", "B": "-0.5147", "C": "-0.4094", "D": "-0.1993"}'::jsonb,
    '"C"'::jsonb,
    348,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=110, Q4=145. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "0.5565", "B": "0.2164", "C": "0.3182", "D": "0.5771"}'::jsonb,
    '"C"'::jsonb,
    349,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 15 distinct items?',
    'mcq',
    '{"A": "419088", "B": "360360", "C": "299304", "D": "401491"}'::jsonb,
    '"B"'::jsonb,
    350,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 11th term of an AP with first term 20 and common difference 8.',
    'mcq',
    '{"A": "112", "B": "92", "C": "100", "D": "96"}'::jsonb,
    '"C"'::jsonb,
    351,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=31 with 0≤x≤13, 0≤y≤11, 0≤z≤13?',
    'mcq',
    '{"A": "32", "B": "28", "C": "10", "D": "37"}'::jsonb,
    '"B"'::jsonb,
    352,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -8x^2 + 24x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.5", "B": "1.7555", "C": "1.2756", "D": "0.8942"}'::jsonb,
    '"A"'::jsonb,
    353,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=124, Q2=113, Q3=87, Q4=140. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "474", "B": "494", "C": "464", "D": "433"}'::jsonb,
    '"C"'::jsonb,
    354,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=160, Q2=179, Q3=119, Q4=108. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "590", "B": "507", "C": "566", "D": "610"}'::jsonb,
    '"C"'::jsonb,
    355,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 12 distinct items?',
    'mcq',
    '{"A": "9822", "B": "11880", "C": "10568", "D": "10462"}'::jsonb,
    '"B"'::jsonb,
    356,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -5x^2 + 22x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "2.0163", "B": "2.5819", "C": "2.2", "D": "2.1567"}'::jsonb,
    '"C"'::jsonb,
    357,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 1, what will be the code after 107 days?',
    'mcq',
    '{"A": "3", "B": "15", "C": "7", "D": "0"}'::jsonb,
    '"A"'::jsonb,
    358,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 39, 46, 60, 81, ?',
    'mcq',
    '{"A": "101", "B": "107", "C": "109", "D": "90"}'::jsonb,
    '"C"'::jsonb,
    359,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Cubes pattern: 1000, 1331, 1728, 2197, ?. Find next.',
    'mcq',
    '{"A": "2482", "B": "2744", "C": "2936", "D": "2360"}'::jsonb,
    '"B"'::jsonb,
    360,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -4x^2 + 47x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "5.6152", "B": "5.7907", "C": "5.875", "D": "6.3415"}'::jsonb,
    '"C"'::jsonb,
    361,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤11, 0≤y≤12, 0≤z≤11?',
    'mcq',
    '{"A": "34", "B": "45", "C": "63", "D": "59"}'::jsonb,
    '"B"'::jsonb,
    362,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=29 with 0≤x≤12, 0≤y≤13, 0≤z≤10?',
    'mcq',
    '{"A": "38", "B": "36", "C": "34", "D": "28"}'::jsonb,
    '"D"'::jsonb,
    363,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -6x^2 + 42x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "3.4471", "B": "3.5", "C": "3.1078", "D": "3.8402"}'::jsonb,
    '"B"'::jsonb,
    364,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 11, 16, 26, 41, ?',
    'mcq',
    '{"A": "49", "B": "54", "C": "61", "D": "50"}'::jsonb,
    '"C"'::jsonb,
    365,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=75, |B|=102, |A∩B|=38, compute |A∪B|.',
    'mcq',
    '{"A": "117", "B": "152", "C": "139", "D": "115"}'::jsonb,
    '"C"'::jsonb,
    366,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 13, 18, 28, 43, ?',
    'mcq',
    '{"A": "63", "B": "73", "C": "77", "D": "61"}'::jsonb,
    '"A"'::jsonb,
    367,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 22, 154, 161, 1127, ?',
    'mcq',
    '{"A": "1135", "B": "1217", "C": "970", "D": "1134"}'::jsonb,
    '"D"'::jsonb,
    368,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.32, what is the expected number of successes in 25 trials?',
    'mcq',
    '{"A": "8.2482", "B": "8.1978", "C": "8.0", "D": "8.1955"}'::jsonb,
    '"C"'::jsonb,
    369,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Pattern series: 29, 174, 182, 1092, ?. Find next term.',
    'mcq',
    '{"A": "1112", "B": "1196", "C": "1014", "D": "1100"}'::jsonb,
    '"D"'::jsonb,
    370,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[28,11],[9,?]], find ?',
    'mcq',
    '{"A": "53", "B": "54", "C": "48", "D": "46"}'::jsonb,
    '"C"'::jsonb,
    371,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute determinant of [[5,8],[7,7]].',
    'mcq',
    '{"A": "-7", "B": "-23", "C": "-21", "D": "-15"}'::jsonb,
    '"C"'::jsonb,
    372,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 6, what will be the code after 44 days?',
    'mcq',
    '{"A": "7", "B": "1", "C": "9", "D": "3"}'::jsonb,
    '"B"'::jsonb,
    373,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 8x + 20 = 100',
    'mcq',
    '{"A": "10", "B": "6", "C": "12", "D": "24"}'::jsonb,
    '"A"'::jsonb,
    374,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=152, Q4=129. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "0.3692", "B": "-0.1513", "C": "0.1505", "D": "-0.0623"}'::jsonb,
    '"B"'::jsonb,
    375,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -8x^2 + 38x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "2.451", "B": "2.3028", "C": "2.0439", "D": "2.375"}'::jsonb,
    '"D"'::jsonb,
    376,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 20, 180, 189, 1701, ?',
    'mcq',
    '{"A": "1826", "B": "1726", "C": "1908", "D": "1710"}'::jsonb,
    '"D"'::jsonb,
    377,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[6,5],[5,7]]?',
    'mcq',
    '{"A": "11", "B": "15", "C": "25", "D": "17"}'::jsonb,
    '"D"'::jsonb,
    378,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=80, |B|=31, and |A∩B|=23. What is |A∪B|?',
    'mcq',
    '{"A": "88", "B": "103", "C": "80", "D": "82"}'::jsonb,
    '"A"'::jsonb,
    379,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_3(59049) = k, what is k?',
    'mcq',
    '{"A": "10", "B": "6", "C": "8", "D": "16"}'::jsonb,
    '"A"'::jsonb,
    380,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (144 + 31) × 9 − 2',
    'mcq',
    '{"A": "1423", "B": "1372", "C": "1723", "D": "1573"}'::jsonb,
    '"D"'::jsonb,
    381,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=115, Q2=158, Q3=90, Q4=137. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "518", "B": "476", "C": "500", "D": "462"}'::jsonb,
    '"C"'::jsonb,
    382,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=31 with 0≤x≤9, 0≤y≤10, 0≤z≤13?',
    'mcq',
    '{"A": "11", "B": "3", "C": "13", "D": "9"}'::jsonb,
    '"B"'::jsonb,
    383,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days coded Mon=1,...,Sun=7. If today code=6, what is the code after 152 days?',
    'mcq',
    '{"A": "13", "B": "0", "C": "7", "D": "4"}'::jsonb,
    '"D"'::jsonb,
    384,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 15 distinct items?',
    'mcq',
    '{"A": "29800", "B": "30734", "C": "32633", "D": "32760"}'::jsonb,
    '"D"'::jsonb,
    385,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[24,19],[24,?]], find ?',
    'mcq',
    '{"A": "77", "B": "67", "C": "60", "D": "59"}'::jsonb,
    '"B"'::jsonb,
    386,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (38 + 89) × 5 − 7',
    'mcq',
    '{"A": "728", "B": "628", "C": "675", "D": "651"}'::jsonb,
    '"B"'::jsonb,
    387,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=116, Q4=78. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.2832", "B": "-0.3276", "C": "-0.5478", "D": "0.1727"}'::jsonb,
    '"B"'::jsonb,
    388,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Pattern series: 23, 161, 167, 1169, ?. Find next term.',
    'mcq',
    '{"A": "1122", "B": "1409", "C": "1270", "D": "1175"}'::jsonb,
    '"D"'::jsonb,
    389,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -6x^2 + 41x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "3.5373", "B": "3.5151", "C": "3.1262", "D": "3.417"}'::jsonb,
    '"D"'::jsonb,
    390,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -6x^2 + 40x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "3.333", "B": "2.7756", "C": "3.0569", "D": "2.7973"}'::jsonb,
    '"A"'::jsonb,
    391,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For the numbers 19, 31, 35, 52, 54, what is the median?',
    'mcq',
    '{"A": "43", "B": "26", "C": "14", "D": "35"}'::jsonb,
    '"D"'::jsonb,
    392,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 59 and standard deviation 28. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.7701", "B": "0.5723", "C": "0.4746", "D": "0.7315"}'::jsonb,
    '"C"'::jsonb,
    393,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[28,21],[19,?]], find ?',
    'mcq',
    '{"A": "86", "B": "66", "C": "59", "D": "68"}'::jsonb,
    '"D"'::jsonb,
    394,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=29 with 0≤x≤11, 0≤y≤9, 0≤z≤13?',
    'mcq',
    '{"A": "27", "B": "21", "C": "15", "D": "17"}'::jsonb,
    '"C"'::jsonb,
    395,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=90, |B|=63, and |A∩B|=37. What is |A∪B|?',
    'mcq',
    '{"A": "111", "B": "116", "C": "121", "D": "126"}'::jsonb,
    '"B"'::jsonb,
    396,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[4,5],[0,4]]?',
    'mcq',
    '{"A": "22", "B": "32", "C": "0", "D": "16"}'::jsonb,
    '"D"'::jsonb,
    397,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 42, 47, 57, 72, ?',
    'mcq',
    '{"A": "89", "B": "92", "C": "93", "D": "104"}'::jsonb,
    '"B"'::jsonb,
    398,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=149, Q2=93, Q3=139, Q4=150. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "475", "B": "561", "C": "543", "D": "531"}'::jsonb,
    '"D"'::jsonb,
    399,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 16, 144, 153, 1377, ?',
    'mcq',
    '{"A": "1044", "B": "1386", "C": "1442", "D": "1142"}'::jsonb,
    '"B"'::jsonb,
    400,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (154 + 72) × 9 − 7',
    'mcq',
    '{"A": "2051", "B": "2027", "C": "2423", "D": "1961"}'::jsonb,
    '"B"'::jsonb,
    401,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=110, Q2=143, Q3=96, Q4=136. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "440", "B": "435", "C": "567", "D": "485"}'::jsonb,
    '"D"'::jsonb,
    402,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 13, 65, 70, 350, ?',
    'mcq',
    '{"A": "395", "B": "289", "C": "333", "D": "355"}'::jsonb,
    '"D"'::jsonb,
    403,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=132, current value=133. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "100.76", "B": "101.0734", "C": "100.4638", "D": "101.0676"}'::jsonb,
    '"A"'::jsonb,
    404,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 14x + 25 = 109',
    'mcq',
    '{"A": "10", "B": "6", "C": "2", "D": "11"}'::jsonb,
    '"B"'::jsonb,
    405,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=27 with 0≤x≤10, 0≤y≤11, 0≤z≤10?',
    'mcq',
    '{"A": "14", "B": "15", "C": "21", "D": "11"}'::jsonb,
    '"B"'::jsonb,
    406,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=123, Y=93, Z=147. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.6286", "B": "0.3388", "C": "0.6702", "D": "0.4732"}'::jsonb,
    '"B"'::jsonb,
    407,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -7x^2 + 20x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.649", "B": "0.8525", "C": "1.429", "D": "1.0804"}'::jsonb,
    '"C"'::jsonb,
    408,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 8, 16, 32, 56, ?',
    'mcq',
    '{"A": "79", "B": "82", "C": "88", "D": "70"}'::jsonb,
    '"C"'::jsonb,
    409,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 6 and ratio 5, what is the 7th term?',
    'mcq',
    '{"A": "93750", "B": "102300", "C": "95487", "D": "86724"}'::jsonb,
    '"A"'::jsonb,
    410,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -4x^2 + 23x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "2.5436", "B": "2.7025", "C": "2.875", "D": "2.8125"}'::jsonb,
    '"C"'::jsonb,
    411,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (93 + 88) × 8 − 6',
    'mcq',
    '{"A": "1794", "B": "1552", "C": "1452", "D": "1442"}'::jsonb,
    '"D"'::jsonb,
    412,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 19, 27, 43, 67, ?',
    'mcq',
    '{"A": "114", "B": "101", "C": "99", "D": "133"}'::jsonb,
    '"C"'::jsonb,
    413,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A GP has first term 6 and ratio 4. What is the 8th term?',
    'mcq',
    '{"A": "98304", "B": "89099", "C": "120510", "D": "92720"}'::jsonb,
    '"A"'::jsonb,
    414,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[8,0],[5,4]]?',
    'mcq',
    '{"A": "20", "B": "34", "C": "32", "D": "44"}'::jsonb,
    '"C"'::jsonb,
    415,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days coded Mon=1,...,Sun=7. If today code=4, what is the code after 238 days?',
    'mcq',
    '{"A": "7", "B": "4", "C": "1", "D": "16"}'::jsonb,
    '"B"'::jsonb,
    416,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[6,6],[2,10]]?',
    'mcq',
    '{"A": "43", "B": "34", "C": "44", "D": "48"}'::jsonb,
    '"D"'::jsonb,
    417,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 11th term of an AP with first term 18 and common difference 12.',
    'mcq',
    '{"A": "144", "B": "138", "C": "112", "D": "126"}'::jsonb,
    '"B"'::jsonb,
    418,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[5,3],[2,9]]?',
    'mcq',
    '{"A": "41", "B": "37", "C": "36", "D": "39"}'::jsonb,
    '"D"'::jsonb,
    419,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=167, Q2=114, Q3=160, Q4=137. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "664", "B": "631", "C": "551", "D": "578"}'::jsonb,
    '"D"'::jsonb,
    420,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[27,20],[19,?]], find ?',
    'mcq',
    '{"A": "69", "B": "70", "C": "74", "D": "66"}'::jsonb,
    '"D"'::jsonb,
    421,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=68, |B|=69, |A∩B|=43, compute |A∪B|.',
    'mcq',
    '{"A": "100", "B": "102", "C": "107", "D": "94"}'::jsonb,
    '"D"'::jsonb,
    422,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days coded Mon=1,...,Sun=7. If today code=4, what is the code after 56 days?',
    'mcq',
    '{"A": "14", "B": "4", "C": "10", "D": "6"}'::jsonb,
    '"B"'::jsonb,
    423,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 10x + 31 = 141',
    'mcq',
    '{"A": "23", "B": "17", "C": "11", "D": "9"}'::jsonb,
    '"C"'::jsonb,
    424,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[8,2],[1,6]]?',
    'mcq',
    '{"A": "51", "B": "46", "C": "64", "D": "66"}'::jsonb,
    '"B"'::jsonb,
    425,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 6 and ratio 4, what is the 6th term?',
    'mcq',
    '{"A": "6144", "B": "5436", "C": "6204", "D": "6846"}'::jsonb,
    '"A"'::jsonb,
    426,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 6, what will be the code after 81 days?',
    'mcq',
    '{"A": "3", "B": "9", "C": "1", "D": "8"}'::jsonb,
    '"A"'::jsonb,
    427,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 8 and ratio 4, what is the 6th term?',
    'mcq',
    '{"A": "8128", "B": "8972", "C": "6364", "D": "8192"}'::jsonb,
    '"D"'::jsonb,
    428,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=105, |B|=112, |A∩B|=90, compute |A∪B|.',
    'mcq',
    '{"A": "128", "B": "121", "C": "127", "D": "132"}'::jsonb,
    '"C"'::jsonb,
    429,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=174, Q2=153, Q3=163, Q4=103. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "569", "B": "667", "C": "534", "D": "593"}'::jsonb,
    '"D"'::jsonb,
    430,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=71, |B|=69, and |A∩B|=26. What is |A∪B|?',
    'mcq',
    '{"A": "106", "B": "92", "C": "114", "D": "124"}'::jsonb,
    '"C"'::jsonb,
    431,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=190, Q2=103, Q3=107, Q4=114. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "532", "B": "464", "C": "514", "D": "445"}'::jsonb,
    '"C"'::jsonb,
    432,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=132, |B|=114, |A∩B|=106, compute |A∪B|.',
    'mcq',
    '{"A": "197", "B": "167", "C": "140", "D": "154"}'::jsonb,
    '"C"'::jsonb,
    433,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.31, what is the expected number of successes in 25 trials?',
    'mcq',
    '{"A": "8.0779", "B": "7.6358", "C": "7.75", "D": "7.9281"}'::jsonb,
    '"C"'::jsonb,
    434,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 3, what will be the code after 59 days?',
    'mcq',
    '{"A": "0", "B": "16", "C": "6", "D": "18"}'::jsonb,
    '"C"'::jsonb,
    435,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=119, Y=99, Z=155. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.319", "B": "0.3933", "C": "0.5748", "D": "0.6493"}'::jsonb,
    '"A"'::jsonb,
    436,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Cubes pattern: 343, 512, 729, 1000, ?. Find next.',
    'mcq',
    '{"A": "1220", "B": "1353", "C": "1303", "D": "1331"}'::jsonb,
    '"D"'::jsonb,
    437,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.32, what is the expected number of successes in 20 trials?',
    'mcq',
    '{"A": "6.4", "B": "6.6", "C": "6.9564", "D": "5.912"}'::jsonb,
    '"A"'::jsonb,
    438,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days coded Mon=1,...,Sun=7. If today code=6, what is the code after 72 days?',
    'mcq',
    '{"A": "4", "B": "0", "C": "1", "D": "9"}'::jsonb,
    '"C"'::jsonb,
    439,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 14x + 23 = 163',
    'mcq',
    '{"A": "0", "B": "16", "C": "12", "D": "10"}'::jsonb,
    '"D"'::jsonb,
    440,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=81, |B|=56, and |A∩B|=25. What is |A∪B|?',
    'mcq',
    '{"A": "112", "B": "92", "C": "108", "D": "134"}'::jsonb,
    '"A"'::jsonb,
    441,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 69 and standard deviation 12. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.6964", "B": "0.4602", "C": "0.1739", "D": "0.0677"}'::jsonb,
    '"C"'::jsonb,
    442,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 15, 22, 36, 57, ?',
    'mcq',
    '{"A": "92", "B": "82", "C": "81", "D": "85"}'::jsonb,
    '"D"'::jsonb,
    443,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=174, Y=101, Z=142. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.4173", "B": "0.3607", "C": "0.533", "D": "0.698"}'::jsonb,
    '"A"'::jsonb,
    444,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 89 and standard deviation 15. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.4524", "B": "0.5062", "C": "0.2552", "D": "0.1685"}'::jsonb,
    '"D"'::jsonb,
    445,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 44, 50, 62, 80, ?',
    'mcq',
    '{"A": "112", "B": "104", "C": "107", "D": "123"}'::jsonb,
    '"B"'::jsonb,
    446,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 8x + 28 = 68',
    'mcq',
    '{"A": "5", "B": "1", "C": "9", "D": "11"}'::jsonb,
    '"A"'::jsonb,
    447,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=118, |B|=57, |A∩B|=22, compute |A∪B|.',
    'mcq',
    '{"A": "111", "B": "117", "C": "153", "D": "186"}'::jsonb,
    '"C"'::jsonb,
    448,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 3 items from 13 distinct items?',
    'mcq',
    '{"A": "312", "B": "322", "C": "286", "D": "301"}'::jsonb,
    '"C"'::jsonb,
    449,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 14, 84, 90, 540, ?',
    'mcq',
    '{"A": "490", "B": "446", "C": "546", "D": "538"}'::jsonb,
    '"C"'::jsonb,
    450,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=30 with 0≤x≤12, 0≤y≤11, 0≤z≤11?',
    'mcq',
    '{"A": "3", "B": "15", "C": "7", "D": "19"}'::jsonb,
    '"B"'::jsonb,
    451,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 6th term of an AP with first term 21 and common difference 7.',
    'mcq',
    '{"A": "49", "B": "56", "C": "66", "D": "46"}'::jsonb,
    '"B"'::jsonb,
    452,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 8th term of an AP with first term 36 and common difference 9.',
    'mcq',
    '{"A": "115", "B": "99", "C": "83", "D": "81"}'::jsonb,
    '"B"'::jsonb,
    453,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (112 + 92) × 4 − 3',
    'mcq',
    '{"A": "743", "B": "753", "C": "796", "D": "813"}'::jsonb,
    '"D"'::jsonb,
    454,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[5,0],[2,6]]?',
    'mcq',
    '{"A": "48", "B": "37", "C": "30", "D": "36"}'::jsonb,
    '"C"'::jsonb,
    455,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 17, 24, 38, 59, ?',
    'mcq',
    '{"A": "101", "B": "69", "C": "87", "D": "115"}'::jsonb,
    '"C"'::jsonb,
    456,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 6 items can be formed from 16 distinct items?',
    'mcq',
    '{"A": "5651738", "B": "6321113", "C": "5562696", "D": "5765760"}'::jsonb,
    '"D"'::jsonb,
    457,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 11 and ratio 5, what is the 8th term?',
    'mcq',
    '{"A": "859375", "B": "815045", "C": "824358", "D": "765681"}'::jsonb,
    '"A"'::jsonb,
    458,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 18, 126, 133, 931, ?',
    'mcq',
    '{"A": "938", "B": "778", "C": "863", "D": "988"}'::jsonb,
    '"A"'::jsonb,
    459,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a grid rule, missing value ? = a + 2b − c. If a=31, b=23, c=22, find ?',
    'mcq',
    '{"A": "53", "B": "52", "C": "55", "D": "61"}'::jsonb,
    '"C"'::jsonb,
    460,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 8x + 17 = 97',
    'mcq',
    '{"A": "10", "B": "22", "C": "20", "D": "3"}'::jsonb,
    '"A"'::jsonb,
    461,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=132, Q4=118. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.5963", "B": "0.0787", "C": "0.0413", "D": "-0.1061"}'::jsonb,
    '"D"'::jsonb,
    462,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 20, 30, 50, 80, ?',
    'mcq',
    '{"A": "146", "B": "138", "C": "116", "D": "120"}'::jsonb,
    '"D"'::jsonb,
    463,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.39, what is the expected number of successes in 12 trials?',
    'mcq',
    '{"A": "4.2409", "B": "4.68", "C": "4.804", "D": "4.2373"}'::jsonb,
    '"B"'::jsonb,
    464,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 14 distinct items?',
    'mcq',
    '{"A": "24024", "B": "22370", "C": "23529", "D": "24983"}'::jsonb,
    '"A"'::jsonb,
    465,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=107, current value=122. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "114.5931", "B": "114.2271", "C": "114.1102", "D": "114.02"}'::jsonb,
    '"D"'::jsonb,
    466,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute determinant of [[13,4],[0,13]].',
    'mcq',
    '{"A": "127", "B": "103", "C": "185", "D": "169"}'::jsonb,
    '"D"'::jsonb,
    467,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 4, what will be the code after 97 days?',
    'mcq',
    '{"A": "15", "B": "3", "C": "1", "D": "5"}'::jsonb,
    '"B"'::jsonb,
    468,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[9,5],[3,6]]?',
    'mcq',
    '{"A": "34", "B": "31", "C": "39", "D": "33"}'::jsonb,
    '"C"'::jsonb,
    469,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 5, what will be the code after 151 days?',
    'mcq',
    '{"A": "5", "B": "6", "C": "8", "D": "2"}'::jsonb,
    '"D"'::jsonb,
    470,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[9,2],[3,10]]?',
    'mcq',
    '{"A": "85", "B": "79", "C": "97", "D": "84"}'::jsonb,
    '"D"'::jsonb,
    471,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 6 items from 20 distinct items?',
    'mcq',
    '{"A": "26046042", "B": "27127661", "C": "27147800", "D": "27907200"}'::jsonb,
    '"D"'::jsonb,
    472,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Cubes pattern: 1331, 1728, 2197, 2744, ?. Find next.',
    'mcq',
    '{"A": "3378", "B": "3375", "C": "3048", "D": "3323"}'::jsonb,
    '"B"'::jsonb,
    473,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_5(48828125) = k, what is k?',
    'mcq',
    '{"A": "12", "B": "11", "C": "21", "D": "9"}'::jsonb,
    '"B"'::jsonb,
    474,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 41, 48, 62, 83, ?',
    'mcq',
    '{"A": "104", "B": "111", "C": "113", "D": "129"}'::jsonb,
    '"B"'::jsonb,
    475,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_3(729) = k, what is k?',
    'mcq',
    '{"A": "6", "B": "2", "C": "18", "D": "8"}'::jsonb,
    '"A"'::jsonb,
    476,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=124, current value=189. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "152.42", "B": "151.8756", "C": "152.7022", "D": "152.1903"}'::jsonb,
    '"A"'::jsonb,
    477,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For the numbers 18, 33, 42, 49, 55, what is the median?',
    'mcq',
    '{"A": "42", "B": "66", "C": "56", "D": "52"}'::jsonb,
    '"A"'::jsonb,
    478,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -5x^2 + 24x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "2.2937", "B": "2.4", "C": "2.2114", "D": "2.6815"}'::jsonb,
    '"B"'::jsonb,
    479,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=133, Y=182, Z=136. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.2949", "B": "0.5211", "C": "0.0993", "D": "0.5583"}'::jsonb,
    '"A"'::jsonb,
    480,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤12, 0≤y≤10, 0≤z≤10?',
    'mcq',
    '{"A": "28", "B": "24", "C": "30", "D": "26"}'::jsonb,
    '"A"'::jsonb,
    481,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 12, 20, 36, 60, ?',
    'mcq',
    '{"A": "116", "B": "80", "C": "114", "D": "92"}'::jsonb,
    '"D"'::jsonb,
    482,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 34 and SD 16. Find coefficient of variation (SD/mean), round to 4 decimals.',
    'mcq',
    '{"A": "0.6874", "B": "0.4706", "C": "1.306", "D": "0.3501"}'::jsonb,
    '"B"'::jsonb,
    483,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 15x + 27 = 192',
    'mcq',
    '{"A": "7", "B": "11", "C": "5", "D": "13"}'::jsonb,
    '"B"'::jsonb,
    484,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 6 and ratio 5, what is the 8th term?',
    'mcq',
    '{"A": "468750", "B": "484075", "C": "585512", "D": "515941"}'::jsonb,
    '"A"'::jsonb,
    485,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[7,6],[6,10]]?',
    'mcq',
    '{"A": "28", "B": "34", "C": "27", "D": "31"}'::jsonb,
    '"B"'::jsonb,
    486,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=66, |B|=64, and |A∩B|=35. What is |A∪B|?',
    'mcq',
    '{"A": "71", "B": "95", "C": "99", "D": "83"}'::jsonb,
    '"B"'::jsonb,
    487,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=178, Q4=101. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.3467", "B": "-0.4542", "C": "-0.0805", "D": "-0.4326"}'::jsonb,
    '"D"'::jsonb,
    488,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 11 and ratio 5, what is the 5th term?',
    'mcq',
    '{"A": "6537", "B": "6439", "C": "6209", "D": "6875"}'::jsonb,
    '"D"'::jsonb,
    489,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 1, what will be the code after 147 days?',
    'mcq',
    '{"A": "1", "B": "6", "C": "9", "D": "3"}'::jsonb,
    '"A"'::jsonb,
    490,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[30,19],[9,?]], find ?',
    'mcq',
    '{"A": "74", "B": "72", "C": "58", "D": "61"}'::jsonb,
    '"C"'::jsonb,
    491,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=124, Q2=157, Q3=113, Q4=80. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "474", "B": "519", "C": "494", "D": "540"}'::jsonb,
    '"A"'::jsonb,
    492,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=58, |B|=65, and |A∩B|=44. What is |A∪B|?',
    'mcq',
    '{"A": "91", "B": "66", "C": "79", "D": "103"}'::jsonb,
    '"C"'::jsonb,
    493,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a grid rule, missing value ? = a + 2b − c. If a=39, b=10, c=25, find ?',
    'mcq',
    '{"A": "48", "B": "34", "C": "29", "D": "61"}'::jsonb,
    '"B"'::jsonb,
    494,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[32,19],[14,?]], find ?',
    'mcq',
    '{"A": "49", "B": "91", "C": "55", "D": "65"}'::jsonb,
    '"D"'::jsonb,
    495,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 19, 133, 140, 980, ?',
    'mcq',
    '{"A": "767", "B": "1057", "C": "757", "D": "987"}'::jsonb,
    '"D"'::jsonb,
    496,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=181, Q4=115. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.5592", "B": "-0.2175", "C": "-0.3646", "D": "-0.4158"}'::jsonb,
    '"C"'::jsonb,
    497,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 4, what will be the code after 78 days?',
    'mcq',
    '{"A": "2", "B": "5", "C": "13", "D": "15"}'::jsonb,
    '"B"'::jsonb,
    498,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 11x + 33 = 132',
    'mcq',
    '{"A": "21", "B": "9", "C": "7", "D": "17"}'::jsonb,
    '"B"'::jsonb,
    499,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 35, 42, 56, 77, ?',
    'mcq',
    '{"A": "143", "B": "105", "C": "125", "D": "75"}'::jsonb,
    '"B"'::jsonb,
    500,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Pattern series: 27, 216, 221, 1768, ?. Find next term.',
    'mcq',
    '{"A": "1773", "B": "1835", "C": "1831", "D": "1640"}'::jsonb,
    '"A"'::jsonb,
    501,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 35, 43, 59, 83, ?',
    'mcq',
    '{"A": "107", "B": "116", "C": "115", "D": "105"}'::jsonb,
    '"C"'::jsonb,
    502,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_10(10000000000) = k, what is k?',
    'mcq',
    '{"A": "12", "B": "7", "C": "10", "D": "3"}'::jsonb,
    '"C"'::jsonb,
    503,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=112, current value=150. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "133.93", "B": "133.6182", "C": "134.0982", "D": "134.2767"}'::jsonb,
    '"A"'::jsonb,
    504,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=33 with 0≤x≤11, 0≤y≤11, 0≤z≤13?',
    'mcq',
    '{"A": "4", "B": "6", "C": "8", "D": "18"}'::jsonb,
    '"B"'::jsonb,
    505,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 12th term of an AP with first term 32 and common difference 9.',
    'mcq',
    '{"A": "157", "B": "155", "C": "131", "D": "130"}'::jsonb,
    '"C"'::jsonb,
    506,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.38, what is the expected number of successes in 15 trials?',
    'mcq',
    '{"A": "5.2431", "B": "5.7", "C": "5.993", "D": "5.1989"}'::jsonb,
    '"B"'::jsonb,
    507,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For the numbers 26, 38, 49, 50, 55, what is the median?',
    'mcq',
    '{"A": "67", "B": "19", "C": "49", "D": "51"}'::jsonb,
    '"C"'::jsonb,
    508,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 93 and SD 16. Find coefficient of variation (SD/mean), round to 4 decimals.',
    'mcq',
    '{"A": "0.0097", "B": "0.6719", "C": "0.3528", "D": "0.172"}'::jsonb,
    '"D"'::jsonb,
    509,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 16x + 22 = 182',
    'mcq',
    '{"A": "12", "B": "10", "C": "3", "D": "15"}'::jsonb,
    '"B"'::jsonb,
    510,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=134, Q2=148, Q3=165, Q4=119. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "566", "B": "680", "C": "538", "D": "492"}'::jsonb,
    '"A"'::jsonb,
    511,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=41, |B|=38, and |A∩B|=30. What is |A∪B|?',
    'mcq',
    '{"A": "49", "B": "45", "C": "53", "D": "44"}'::jsonb,
    '"A"'::jsonb,
    512,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -6x^2 + 23x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.917", "B": "1.6089", "C": "2.2118", "D": "1.4948"}'::jsonb,
    '"A"'::jsonb,
    513,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=59, |B|=35, and |A∩B|=11. What is |A∪B|?',
    'mcq',
    '{"A": "97", "B": "77", "C": "90", "D": "83"}'::jsonb,
    '"D"'::jsonb,
    514,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 12th term of an AP with first term 39 and common difference 8.',
    'mcq',
    '{"A": "142", "B": "127", "C": "121", "D": "125"}'::jsonb,
    '"B"'::jsonb,
    515,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 9x + 25 = 97',
    'mcq',
    '{"A": "5", "B": "11", "C": "0", "D": "8"}'::jsonb,
    '"D"'::jsonb,
    516,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days coded Mon=1,...,Sun=7. If today code=3, what is the code after 60 days?',
    'mcq',
    '{"A": "13", "B": "10", "C": "7", "D": "28"}'::jsonb,
    '"C"'::jsonb,
    517,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[9,4],[3,8]]?',
    'mcq',
    '{"A": "38", "B": "78", "C": "60", "D": "50"}'::jsonb,
    '"C"'::jsonb,
    518,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=44, |B|=43, and |A∩B|=31. What is |A∪B|?',
    'mcq',
    '{"A": "62", "B": "56", "C": "49", "D": "64"}'::jsonb,
    '"B"'::jsonb,
    519,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 7th term of an AP with first term 23 and common difference 10.',
    'mcq',
    '{"A": "59", "B": "109", "C": "83", "D": "68"}'::jsonb,
    '"C"'::jsonb,
    520,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a grid rule, missing value ? = a + 2b − c. If a=14, b=25, c=12, find ?',
    'mcq',
    '{"A": "59", "B": "52", "C": "58", "D": "30"}'::jsonb,
    '"B"'::jsonb,
    521,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=144, Q2=142, Q3=154, Q4=116. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "556", "B": "605", "C": "546", "D": "484"}'::jsonb,
    '"A"'::jsonb,
    522,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=128, |B|=69, |A∩B|=31, compute |A∪B|.',
    'mcq',
    '{"A": "143", "B": "210", "C": "109", "D": "166"}'::jsonb,
    '"D"'::jsonb,
    523,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 11, 21, 41, 71, ?',
    'mcq',
    '{"A": "81", "B": "117", "C": "128", "D": "111"}'::jsonb,
    '"D"'::jsonb,
    524,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (132 + 61) × 7 − 2',
    'mcq',
    '{"A": "1639", "B": "1231", "C": "1446", "D": "1349"}'::jsonb,
    '"D"'::jsonb,
    525,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 2, what will be the code after 154 days?',
    'mcq',
    '{"A": "2", "B": "5", "C": "4", "D": "12"}'::jsonb,
    '"A"'::jsonb,
    526,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 21, 147, 154, 1078, ?',
    'mcq',
    '{"A": "869", "B": "1085", "C": "1166", "D": "865"}'::jsonb,
    '"B"'::jsonb,
    527,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=24 with 0≤x≤14, 0≤y≤10, 0≤z≤11?',
    'mcq',
    '{"A": "77", "B": "68", "C": "103", "D": "65"}'::jsonb,
    '"A"'::jsonb,
    528,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=145, Q2=165, Q3=141, Q4=144. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "520", "B": "619", "C": "662", "D": "595"}'::jsonb,
    '"D"'::jsonb,
    529,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 14x + 21 = 175',
    'mcq',
    '{"A": "13", "B": "1", "C": "5", "D": "11"}'::jsonb,
    '"D"'::jsonb,
    530,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 20, 26, 38, 56, ?',
    'mcq',
    '{"A": "56", "B": "80", "C": "74", "D": "75"}'::jsonb,
    '"B"'::jsonb,
    531,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 8 and ratio 3, what is the 7th term?',
    'mcq',
    '{"A": "6171", "B": "4930", "C": "5832", "D": "4542"}'::jsonb,
    '"C"'::jsonb,
    532,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days coded Mon=1,...,Sun=7. If today code=5, what is the code after 190 days?',
    'mcq',
    '{"A": "20", "B": "6", "C": "10", "D": "1"}'::jsonb,
    '"B"'::jsonb,
    533,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=60, |B|=60, and |A∩B|=10. What is |A∪B|?',
    'mcq',
    '{"A": "117", "B": "110", "C": "78", "D": "121"}'::jsonb,
    '"B"'::jsonb,
    534,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 114 and SD 10. Find coefficient of variation (SD/mean), round to 4 decimals.',
    'mcq',
    '{"A": "0.1116", "B": "0.342", "C": "0.5056", "D": "0.0877"}'::jsonb,
    '"D"'::jsonb,
    535,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_2(64) = k, what is k?',
    'mcq',
    '{"A": "6", "B": "7", "C": "2", "D": "12"}'::jsonb,
    '"A"'::jsonb,
    536,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For the numbers 16, 22, 39, 45, 53, what is the median?',
    'mcq',
    '{"A": "51", "B": "54", "C": "39", "D": "12"}'::jsonb,
    '"C"'::jsonb,
    537,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Count integer solutions to x+y+z=37 with 0≤x≤13, 0≤y≤11, 0≤z≤15.',
    'mcq',
    '{"A": "9", "B": "6", "C": "2", "D": "10"}'::jsonb,
    '"B"'::jsonb,
    538,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 22, 198, 207, 1863, ?',
    'mcq',
    '{"A": "2075", "B": "1872", "C": "1720", "D": "1988"}'::jsonb,
    '"B"'::jsonb,
    539,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 83 and standard deviation 28. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.0607", "B": "0.1278", "C": "0.2852", "D": "0.3373"}'::jsonb,
    '"D"'::jsonb,
    540,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -9x^2 + 48x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "2.3361", "B": "2.7165", "C": "2.4385", "D": "2.667"}'::jsonb,
    '"D"'::jsonb,
    541,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 11 and ratio 4, what is the 8th term?',
    'mcq',
    '{"A": "173750", "B": "155452", "C": "200759", "D": "180224"}'::jsonb,
    '"D"'::jsonb,
    542,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 9th term of an AP with first term 24 and common difference 11.',
    'mcq',
    '{"A": "111", "B": "94", "C": "100", "D": "112"}'::jsonb,
    '"D"'::jsonb,
    543,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[7,2],[2,5]]?',
    'mcq',
    '{"A": "31", "B": "21", "C": "26", "D": "37"}'::jsonb,
    '"A"'::jsonb,
    544,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=124, Q2=138, Q3=137, Q4=145. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "592", "B": "544", "C": "490", "D": "560"}'::jsonb,
    '"B"'::jsonb,
    545,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 23, 184, 192, 1536, ?',
    'mcq',
    '{"A": "1468", "B": "1824", "C": "1834", "D": "1544"}'::jsonb,
    '"D"'::jsonb,
    546,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=104, current value=125. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "120.2594", "B": "120.19", "C": "119.9139", "D": "120.7792"}'::jsonb,
    '"B"'::jsonb,
    547,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[17,14],[20,?]], find ?',
    'mcq',
    '{"A": "43", "B": "69", "C": "51", "D": "59"}'::jsonb,
    '"C"'::jsonb,
    548,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -7x^2 + 37x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "3.1205", "B": "2.9934", "C": "2.643", "D": "3.1015"}'::jsonb,
    '"C"'::jsonb,
    549,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 42, 51, 69, 96, ?',
    'mcq',
    '{"A": "156", "B": "132", "C": "116", "D": "120"}'::jsonb,
    '"B"'::jsonb,
    550,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[15,12],[12,?]], find ?',
    'mcq',
    '{"A": "39", "B": "49", "C": "36", "D": "43"}'::jsonb,
    '"A"'::jsonb,
    551,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Count integer solutions to x+y+z=34 with 0≤x≤15, 0≤y≤11, 0≤z≤10.',
    'mcq',
    '{"A": "3", "B": "6", "C": "8", "D": "18"}'::jsonb,
    '"B"'::jsonb,
    552,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=147, current value=162. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "110.2", "B": "110.2632", "C": "110.5805", "D": "110.4218"}'::jsonb,
    '"A"'::jsonb,
    553,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 89 and standard deviation 29. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.5183", "B": "0.2685", "C": "0.0714", "D": "0.3258"}'::jsonb,
    '"D"'::jsonb,
    554,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_3(6561) = k, what is k?',
    'mcq',
    '{"A": "12", "B": "15", "C": "8", "D": "10"}'::jsonb,
    '"C"'::jsonb,
    555,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=148, current value=112. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "75.68", "B": "75.3955", "C": "75.4218", "D": "75.6404"}'::jsonb,
    '"A"'::jsonb,
    556,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=138, Q4=118. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.0504", "B": "0.2446", "C": "-0.1449", "D": "0.2609"}'::jsonb,
    '"C"'::jsonb,
    557,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 7, what will be the code after 133 days?',
    'mcq',
    '{"A": "7", "B": "4", "C": "6", "D": "10"}'::jsonb,
    '"A"'::jsonb,
    558,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 12th term of an AP with first term 43 and common difference 9.',
    'mcq',
    '{"A": "98", "B": "102", "C": "112", "D": "142"}'::jsonb,
    '"D"'::jsonb,
    559,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 83 and standard deviation 22. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.5206", "B": "0.3188", "C": "0.7888", "D": "0.2651"}'::jsonb,
    '"D"'::jsonb,
    560,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Count integer solutions to x+y+z=27 with 0≤x≤13, 0≤y≤10, 0≤z≤16.',
    'mcq',
    '{"A": "94", "B": "81", "C": "88", "D": "84"}'::jsonb,
    '"C"'::jsonb,
    561,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[18,10],[24,?]], find ?',
    'mcq',
    '{"A": "53", "B": "66", "C": "40", "D": "52"}'::jsonb,
    '"D"'::jsonb,
    562,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=153, Y=174, Z=109. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.3509", "B": "0.7759", "C": "0.1009", "D": "0.5177"}'::jsonb,
    '"A"'::jsonb,
    563,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 20, 200, 210, 2100, ?',
    'mcq',
    '{"A": "2017", "B": "2210", "C": "2333", "D": "2110"}'::jsonb,
    '"D"'::jsonb,
    564,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=157, current value=166. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "105.73", "B": "105.5953", "C": "105.4095", "D": "106.2387"}'::jsonb,
    '"A"'::jsonb,
    565,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=134, Q2=165, Q3=120, Q4=149. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "582", "B": "630", "C": "520", "D": "568"}'::jsonb,
    '"D"'::jsonb,
    566,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=52, |B|=77, and |A∩B|=44. What is |A∪B|?',
    'mcq',
    '{"A": "85", "B": "72", "C": "67", "D": "73"}'::jsonb,
    '"A"'::jsonb,
    567,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (89 + 71) × 8 − 7',
    'mcq',
    '{"A": "1279", "B": "1413", "C": "1013", "D": "1273"}'::jsonb,
    '"D"'::jsonb,
    568,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=61, |B|=68, and |A∩B|=37. What is |A∪B|?',
    'mcq',
    '{"A": "82", "B": "92", "C": "107", "D": "62"}'::jsonb,
    '"B"'::jsonb,
    569,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=131, |B|=61, |A∩B|=20, compute |A∪B|.',
    'mcq',
    '{"A": "179", "B": "172", "C": "171", "D": "142"}'::jsonb,
    '"B"'::jsonb,
    570,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 22, 32, 52, 82, ?',
    'mcq',
    '{"A": "90", "B": "122", "C": "123", "D": "137"}'::jsonb,
    '"B"'::jsonb,
    571,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (121 + 102) × 8 − 7',
    'mcq',
    '{"A": "1777", "B": "2077", "C": "1932", "D": "1849"}'::jsonb,
    '"A"'::jsonb,
    572,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'An AP has first term 69 and common difference 16. What is the 12th term?',
    'mcq',
    '{"A": "214", "B": "217", "C": "272", "D": "245"}'::jsonb,
    '"D"'::jsonb,
    573,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[14,17],[10,?]], find ?',
    'mcq',
    '{"A": "37", "B": "51", "C": "39", "D": "41"}'::jsonb,
    '"D"'::jsonb,
    574,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=103, |B|=97, |A∩B|=47, compute |A∪B|.',
    'mcq',
    '{"A": "189", "B": "197", "C": "153", "D": "121"}'::jsonb,
    '"C"'::jsonb,
    575,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=183, Y=134, Z=95. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.4442", "B": "0.3702", "C": "0.5436", "D": "0.5903"}'::jsonb,
    '"A"'::jsonb,
    576,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 144, 169, 196, 225, ?',
    'mcq',
    '{"A": "312", "B": "251", "C": "198", "D": "256"}'::jsonb,
    '"D"'::jsonb,
    577,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[6,6],[5,6]]?',
    'mcq',
    '{"A": "5", "B": "11", "C": "12", "D": "6"}'::jsonb,
    '"D"'::jsonb,
    578,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=192, Y=146, Z=145. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.6903", "B": "0.4966", "C": "0.6238", "D": "0.3975"}'::jsonb,
    '"D"'::jsonb,
    579,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 13, 117, 126, 1134, ?',
    'mcq',
    '{"A": "1149", "B": "1231", "C": "1143", "D": "1347"}'::jsonb,
    '"C"'::jsonb,
    580,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 2, what will be the code after 153 days?',
    'mcq',
    '{"A": "9", "B": "2", "C": "1", "D": "7"}'::jsonb,
    '"C"'::jsonb,
    581,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 256, 289, 324, 361, ?. Find next.',
    'mcq',
    '{"A": "262", "B": "370", "C": "400", "D": "337"}'::jsonb,
    '"C"'::jsonb,
    582,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 11 and ratio 5, what is the 7th term?',
    'mcq',
    '{"A": "147755", "B": "153841", "C": "167695", "D": "171875"}'::jsonb,
    '"D"'::jsonb,
    583,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[7,2],[0,9]]?',
    'mcq',
    '{"A": "63", "B": "73", "C": "77", "D": "59"}'::jsonb,
    '"A"'::jsonb,
    584,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 19, 28, 46, 73, ?',
    'mcq',
    '{"A": "96", "B": "127", "C": "109", "D": "91"}'::jsonb,
    '"C"'::jsonb,
    585,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=184, Y=185, Z=152. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.7514", "B": "0.1652", "C": "0.5921", "D": "0.3532"}'::jsonb,
    '"D"'::jsonb,
    586,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Squares pattern: 169, 196, 225, 256, ?. Find next.',
    'mcq',
    '{"A": "310", "B": "289", "C": "239", "D": "296"}'::jsonb,
    '"B"'::jsonb,
    587,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=134, current value=190. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "141.6943", "B": "142.2382", "C": "141.1511", "D": "141.79"}'::jsonb,
    '"D"'::jsonb,
    588,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 12th term of an AP with first term 42 and common difference 13.',
    'mcq',
    '{"A": "195", "B": "185", "C": "215", "D": "197"}'::jsonb,
    '"B"'::jsonb,
    589,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 3 items from 19 distinct items?',
    'mcq',
    '{"A": "969", "B": "954", "C": "971", "D": "1041"}'::jsonb,
    '"A"'::jsonb,
    590,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A GP has first term 6 and ratio 4. What is the 5th term?',
    'mcq',
    '{"A": "1376", "B": "1222", "C": "1496", "D": "1536"}'::jsonb,
    '"D"'::jsonb,
    591,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[21,16],[10,?]], find ?',
    'mcq',
    '{"A": "65", "B": "47", "C": "33", "D": "59"}'::jsonb,
    '"B"'::jsonb,
    592,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 8 and ratio 5, what is the 7th term?',
    'mcq',
    '{"A": "104110", "B": "149590", "C": "117754", "D": "125000"}'::jsonb,
    '"D"'::jsonb,
    593,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -12x^2 + 46x + 5, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.8161", "B": "1.917", "C": "2.1899", "D": "2.9106"}'::jsonb,
    '"B"'::jsonb,
    594,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Count integer solutions to x+y+z=28 with 0≤x≤18, 0≤y≤12, 0≤z≤16.',
    'mcq',
    '{"A": "148", "B": "169", "C": "206", "D": "166"}'::jsonb,
    '"D"'::jsonb,
    595,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=189, Q2=186, Q3=138, Q4=135. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "689", "B": "488", "C": "641", "D": "648"}'::jsonb,
    '"D"'::jsonb,
    596,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=134, Q4=86. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.3582", "B": "-0.6708", "C": "0.1176", "D": "-0.5889"}'::jsonb,
    '"A"'::jsonb,
    597,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 23, 138, 144, 864, ?',
    'mcq',
    '{"A": "870", "B": "767", "C": "804", "D": "810"}'::jsonb,
    '"A"'::jsonb,
    598,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 25, 34, 52, 79, ?',
    'mcq',
    '{"A": "111", "B": "87", "C": "115", "D": "107"}'::jsonb,
    '"C"'::jsonb,
    599,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days coded Mon=1,...,Sun=7. If today code=4, what is the code after 246 days?',
    'mcq',
    '{"A": "5", "B": "7", "C": "4", "D": "9"}'::jsonb,
    '"A"'::jsonb,
    600,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_5(244140625) = k, what is k?',
    'mcq',
    '{"A": "12", "B": "17", "C": "6", "D": "24"}'::jsonb,
    '"A"'::jsonb,
    601,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 4, what will be the code after 146 days?',
    'mcq',
    '{"A": "13", "B": "5", "C": "9", "D": "3"}'::jsonb,
    '"D"'::jsonb,
    602,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Count integer solutions to x+y+z=37 with 0≤x≤18, 0≤y≤16, 0≤z≤12.',
    'mcq',
    '{"A": "55", "B": "46", "C": "49", "D": "69"}'::jsonb,
    '"A"'::jsonb,
    603,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For the numbers 16, 19, 29, 31, 51, what is the median?',
    'mcq',
    '{"A": "33", "B": "38", "C": "35", "D": "29"}'::jsonb,
    '"D"'::jsonb,
    604,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=37 with 0≤x≤11, 0≤y≤13, 0≤z≤14?',
    'mcq',
    '{"A": "3", "B": "9", "C": "5", "D": "1"}'::jsonb,
    '"A"'::jsonb,
    605,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[31,13],[21,?]], find ?',
    'mcq',
    '{"A": "72", "B": "65", "C": "58", "D": "87"}'::jsonb,
    '"B"'::jsonb,
    606,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[10,3],[1,6]]?',
    'mcq',
    '{"A": "57", "B": "35", "C": "50", "D": "77"}'::jsonb,
    '"A"'::jsonb,
    607,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[9,4],[1,6]]?',
    'mcq',
    '{"A": "53", "B": "54", "C": "60", "D": "50"}'::jsonb,
    '"D"'::jsonb,
    608,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 8th term of an AP with first term 50 and common difference 14.',
    'mcq',
    '{"A": "148", "B": "196", "C": "166", "D": "140"}'::jsonb,
    '"A"'::jsonb,
    609,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -9x^2 + 36x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.7066", "B": "2.0", "C": "1.9158", "D": "2.4953"}'::jsonb,
    '"B"'::jsonb,
    610,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 10x + 30 = 100',
    'mcq',
    '{"A": "7", "B": "9", "C": "12", "D": "5"}'::jsonb,
    '"A"'::jsonb,
    611,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=190, Q2=168, Q3=122, Q4=99. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "715", "B": "606", "C": "570", "D": "579"}'::jsonb,
    '"D"'::jsonb,
    612,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 10th term of an AP with first term 48 and common difference 10.',
    'mcq',
    '{"A": "152", "B": "92", "C": "138", "D": "172"}'::jsonb,
    '"C"'::jsonb,
    613,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.46, what is the expected number of successes in 25 trials?',
    'mcq',
    '{"A": "11.1697", "B": "11.2827", "C": "11.5", "D": "11.8491"}'::jsonb,
    '"C"'::jsonb,
    614,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 20, 30, 50, 80, ?',
    'mcq',
    '{"A": "160", "B": "131", "C": "138", "D": "120"}'::jsonb,
    '"D"'::jsonb,
    615,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 22, 30, 46, 70, ?',
    'mcq',
    '{"A": "102", "B": "118", "C": "114", "D": "80"}'::jsonb,
    '"A"'::jsonb,
    616,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=200, Y=162, Z=188. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.3636", "B": "0.2365", "C": "1.0062", "D": "0.8687"}'::jsonb,
    '"A"'::jsonb,
    617,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=135, Q4=106. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.456", "B": "-0.9071", "C": "-0.2148", "D": "-0.8983"}'::jsonb,
    '"C"'::jsonb,
    618,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=167, Y=137, Z=145. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.6093", "B": "0.1078", "C": "0.3719", "D": "0.1157"}'::jsonb,
    '"C"'::jsonb,
    619,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 6 items can be formed from 15 distinct items?',
    'mcq',
    '{"A": "4019966", "B": "3649089", "C": "4010303", "D": "3603600"}'::jsonb,
    '"D"'::jsonb,
    620,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_3(2187) = k, what is k?',
    'mcq',
    '{"A": "12", "B": "13", "C": "9", "D": "7"}'::jsonb,
    '"D"'::jsonb,
    621,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[23,23],[18,?]], find ?',
    'mcq',
    '{"A": "64", "B": "68", "C": "74", "D": "62"}'::jsonb,
    '"A"'::jsonb,
    622,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 7, what will be the code after 137 days?',
    'mcq',
    '{"A": "2", "B": "7", "C": "4", "D": "0"}'::jsonb,
    '"C"'::jsonb,
    623,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 8th term of an AP with first term 20 and common difference 7.',
    'mcq',
    '{"A": "53", "B": "43", "C": "69", "D": "67"}'::jsonb,
    '"C"'::jsonb,
    624,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=135, current value=117. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "86.67", "B": "86.7967", "C": "86.5732", "D": "86.6943"}'::jsonb,
    '"A"'::jsonb,
    625,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find next term: 39, 46, 60, 81, ?',
    'mcq',
    '{"A": "127", "B": "109", "C": "112", "D": "85"}'::jsonb,
    '"B"'::jsonb,
    626,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 84 and SD 40. Find coefficient of variation (SD/mean), round to 4 decimals.',
    'mcq',
    '{"A": "0.0795", "B": "0.2274", "C": "0.4762", "D": "0.0706"}'::jsonb,
    '"C"'::jsonb,
    627,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=184, Q2=145, Q3=123, Q4=163. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "579", "B": "477", "C": "615", "D": "692"}'::jsonb,
    '"C"'::jsonb,
    628,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[30,22],[19,?]], find ?',
    'mcq',
    '{"A": "73", "B": "71", "C": "47", "D": "59"}'::jsonb,
    '"B"'::jsonb,
    629,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 35, 45, 65, 95, ?',
    'mcq',
    '{"A": "114", "B": "145", "C": "135", "D": "132"}'::jsonb,
    '"C"'::jsonb,
    630,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -6x^2 + 47x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "4.0385", "B": "3.8381", "C": "4.1291", "D": "3.917"}'::jsonb,
    '"D"'::jsonb,
    631,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items from 15 distinct items?',
    'mcq',
    '{"A": "37554", "B": "34224", "C": "32760", "D": "35052"}'::jsonb,
    '"C"'::jsonb,
    632,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a grid rule, missing value ? = a + 2b − c. If a=36, b=16, c=17, find ?',
    'mcq',
    '{"A": "81", "B": "51", "C": "42", "D": "57"}'::jsonb,
    '"B"'::jsonb,
    633,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=173, Q2=195, Q3=121, Q4=176. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "587", "B": "665", "C": "521", "D": "628"}'::jsonb,
    '"B"'::jsonb,
    634,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 10th term of an AP with first term 40 and common difference 12.',
    'mcq',
    '{"A": "186", "B": "102", "C": "148", "D": "150"}'::jsonb,
    '"C"'::jsonb,
    635,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 3, what will be the code after 84 days?',
    'mcq',
    '{"A": "9", "B": "3", "C": "8", "D": "0"}'::jsonb,
    '"B"'::jsonb,
    636,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[22,11],[27,?]], find ?',
    'mcq',
    '{"A": "60", "B": "67", "C": "52", "D": "58"}'::jsonb,
    '"A"'::jsonb,
    637,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Series: 29, 38, 56, 83, ?. Find next term.',
    'mcq',
    '{"A": "119", "B": "167", "C": "117", "D": "124"}'::jsonb,
    '"A"'::jsonb,
    638,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 12 distinct items?',
    'mcq',
    '{"A": "95040", "B": "93122", "C": "102902", "D": "103532"}'::jsonb,
    '"A"'::jsonb,
    639,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute determinant of [[13,7],[2,6]].',
    'mcq',
    '{"A": "64", "B": "57", "C": "58", "D": "68"}'::jsonb,
    '"A"'::jsonb,
    640,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -10x^2 + 45x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.9419", "B": "2.3785", "C": "2.25", "D": "2.1467"}'::jsonb,
    '"C"'::jsonb,
    641,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 4, what will be the code after 62 days?',
    'mcq',
    '{"A": "3", "B": "7", "C": "5", "D": "13"}'::jsonb,
    '"A"'::jsonb,
    642,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 90 and standard deviation 17. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.0195", "B": "0.1889", "C": "0.3774", "D": "0.3444"}'::jsonb,
    '"B"'::jsonb,
    643,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 7th term of an AP with first term 35 and common difference 9.',
    'mcq',
    '{"A": "89", "B": "73", "C": "97", "D": "111"}'::jsonb,
    '"A"'::jsonb,
    644,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a grid rule, missing value ? = a + 2b − c. If a=33, b=22, c=11, find ?',
    'mcq',
    '{"A": "93", "B": "66", "C": "80", "D": "67"}'::jsonb,
    '"B"'::jsonb,
    645,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=90, |B|=61, and |A∩B|=39. What is |A∪B|?',
    'mcq',
    '{"A": "119", "B": "112", "C": "82", "D": "125"}'::jsonb,
    '"B"'::jsonb,
    646,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=36 with 0≤x≤14, 0≤y≤12, 0≤z≤15?',
    'mcq',
    '{"A": "21", "B": "25", "C": "33", "D": "16"}'::jsonb,
    '"A"'::jsonb,
    647,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (129 + 97) × 2 − 7',
    'mcq',
    '{"A": "353", "B": "497", "C": "470", "D": "445"}'::jsonb,
    '"D"'::jsonb,
    648,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[22,19],[20,?]], find ?',
    'mcq',
    '{"A": "49", "B": "61", "C": "85", "D": "52"}'::jsonb,
    '"B"'::jsonb,
    649,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=130, Q4=100. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.2984", "B": "-0.2308", "C": "-0.1434", "D": "-0.1406"}'::jsonb,
    '"B"'::jsonb,
    650,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 38, 48, 68, 98, ?',
    'mcq',
    '{"A": "138", "B": "115", "C": "144", "D": "127"}'::jsonb,
    '"A"'::jsonb,
    651,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[8,6],[5,12]]?',
    'mcq',
    '{"A": "52", "B": "66", "C": "62", "D": "69"}'::jsonb,
    '"B"'::jsonb,
    652,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 90 and standard deviation 14. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.0838", "B": "0.1556", "C": "0.0745", "D": "0.3799"}'::jsonb,
    '"B"'::jsonb,
    653,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -8x^2 + 26x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.5653", "B": "2.0448", "C": "1.625", "D": "1.7006"}'::jsonb,
    '"C"'::jsonb,
    654,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[16,20],[13,?]], find ?',
    'mcq',
    '{"A": "49", "B": "55", "C": "56", "D": "60"}'::jsonb,
    '"A"'::jsonb,
    655,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 19, 30, 52, 85, ?',
    'mcq',
    '{"A": "117", "B": "143", "C": "145", "D": "129"}'::jsonb,
    '"D"'::jsonb,
    656,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=137, current value=164. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "119.71", "B": "119.7537", "C": "120.0275", "D": "119.922"}'::jsonb,
    '"A"'::jsonb,
    657,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[9,5],[3,8]]?',
    'mcq',
    '{"A": "63", "B": "64", "C": "57", "D": "54"}'::jsonb,
    '"C"'::jsonb,
    658,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 11th term of an AP with first term 43 and common difference 12.',
    'mcq',
    '{"A": "164", "B": "163", "C": "113", "D": "184"}'::jsonb,
    '"B"'::jsonb,
    659,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 14, 21, 35, 56, ?',
    'mcq',
    '{"A": "97", "B": "84", "C": "58", "D": "83"}'::jsonb,
    '"B"'::jsonb,
    660,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 11x + 19 = 96',
    'mcq',
    '{"A": "13", "B": "7", "C": "9", "D": "19"}'::jsonb,
    '"B"'::jsonb,
    661,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.47, what is the expected number of successes in 20 trials?',
    'mcq',
    '{"A": "8.9049", "B": "9.4", "C": "9.4491", "D": "9.5423"}'::jsonb,
    '"B"'::jsonb,
    662,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤13, 0≤y≤13, 0≤z≤11?',
    'mcq',
    '{"A": "55", "B": "53", "C": "60", "D": "59"}'::jsonb,
    '"A"'::jsonb,
    663,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 48, 57, 75, 102, ?',
    'mcq',
    '{"A": "176", "B": "138", "C": "144", "D": "134"}'::jsonb,
    '"B"'::jsonb,
    664,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=187, Q2=149, Q3=128, Q4=104. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "508", "B": "515", "C": "616", "D": "568"}'::jsonb,
    '"D"'::jsonb,
    665,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=139, Q2=149, Q3=102, Q4=102. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "498", "B": "512", "C": "500", "D": "492"}'::jsonb,
    '"D"'::jsonb,
    666,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=30 with 0≤x≤12, 0≤y≤11, 0≤z≤14?',
    'mcq',
    '{"A": "32", "B": "36", "C": "31", "D": "46"}'::jsonb,
    '"B"'::jsonb,
    667,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=47, |B|=45, and |A∩B|=38. What is |A∪B|?',
    'mcq',
    '{"A": "63", "B": "54", "C": "43", "D": "72"}'::jsonb,
    '"B"'::jsonb,
    668,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a GP with first term 8 and ratio 4, what is the 5th term?',
    'mcq',
    '{"A": "2048", "B": "2102", "C": "1994", "D": "2060"}'::jsonb,
    '"A"'::jsonb,
    669,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[7,4],[5,11]]?',
    'mcq',
    '{"A": "57", "B": "62", "C": "69", "D": "58"}'::jsonb,
    '"A"'::jsonb,
    670,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (164 + 86) × 7 − 8',
    'mcq',
    '{"A": "1742", "B": "1446", "C": "1756", "D": "1619"}'::jsonb,
    '"A"'::jsonb,
    671,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=199, Q4=162. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "0.3758", "B": "-0.8508", "C": "-0.1859", "D": "-0.473"}'::jsonb,
    '"C"'::jsonb,
    672,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 7th term of an AP with first term 25 and common difference 7.',
    'mcq',
    '{"A": "67", "B": "47", "C": "81", "D": "65"}'::jsonb,
    '"A"'::jsonb,
    673,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 8th term of an AP with first term 49 and common difference 12.',
    'mcq',
    '{"A": "127", "B": "133", "C": "140", "D": "119"}'::jsonb,
    '"B"'::jsonb,
    674,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Series: 24, 32, 48, 72, ?. Find next term.',
    'mcq',
    '{"A": "104", "B": "96", "C": "95", "D": "106"}'::jsonb,
    '"A"'::jsonb,
    675,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_10(1000000000000) = k, what is k?',
    'mcq',
    '{"A": "12", "B": "26", "C": "22", "D": "18"}'::jsonb,
    '"A"'::jsonb,
    676,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 23, 230, 240, 2400, ?',
    'mcq',
    '{"A": "2410", "B": "2520", "C": "2506", "D": "2529"}'::jsonb,
    '"A"'::jsonb,
    677,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 16, 26, 46, 76, ?',
    'mcq',
    '{"A": "128", "B": "127", "C": "110", "D": "116"}'::jsonb,
    '"D"'::jsonb,
    678,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 6th term of an AP with first term 32 and common difference 7.',
    'mcq',
    '{"A": "57", "B": "58", "C": "67", "D": "80"}'::jsonb,
    '"C"'::jsonb,
    679,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 19, 29, 49, 79, ?',
    'mcq',
    '{"A": "124", "B": "119", "C": "115", "D": "79"}'::jsonb,
    '"B"'::jsonb,
    680,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 15x + 30 = 135',
    'mcq',
    '{"A": "9", "B": "13", "C": "1", "D": "7"}'::jsonb,
    '"D"'::jsonb,
    681,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=48, |B|=33, and |A∩B|=24. What is |A∪B|?',
    'mcq',
    '{"A": "61", "B": "52", "C": "57", "D": "83"}'::jsonb,
    '"C"'::jsonb,
    682,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.48, what is the expected number of successes in 25 trials?',
    'mcq',
    '{"A": "12.0", "B": "11.8132", "C": "12.2836", "D": "11.8245"}'::jsonb,
    '"A"'::jsonb,
    683,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_10(100000000) = k, what is k?',
    'mcq',
    '{"A": "8", "B": "11", "C": "22", "D": "0"}'::jsonb,
    '"A"'::jsonb,
    684,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items from 13 distinct items?',
    'mcq',
    '{"A": "1814", "B": "1716", "C": "1664", "D": "1770"}'::jsonb,
    '"B"'::jsonb,
    685,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.48, what is the expected number of successes in 20 trials?',
    'mcq',
    '{"A": "9.6", "B": "9.8775", "C": "9.1199", "D": "9.1739"}'::jsonb,
    '"A"'::jsonb,
    686,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (165 + 101) × 4 − 2',
    'mcq',
    '{"A": "1118", "B": "1204", "C": "1062", "D": "1109"}'::jsonb,
    '"C"'::jsonb,
    687,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=203, Q2=110, Q3=170, Q4=112. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "593", "B": "631", "C": "595", "D": "607"}'::jsonb,
    '"C"'::jsonb,
    688,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=35 with 0≤x≤13, 0≤y≤11, 0≤z≤13?',
    'mcq',
    '{"A": "18", "B": "8", "C": "6", "D": "0"}'::jsonb,
    '"C"'::jsonb,
    689,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'What is the determinant of [[6,5],[4,12]]?',
    'mcq',
    '{"A": "52", "B": "46", "C": "40", "D": "62"}'::jsonb,
    '"A"'::jsonb,
    690,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[32,12],[18,?]], find ?',
    'mcq',
    '{"A": "68", "B": "60", "C": "63", "D": "62"}'::jsonb,
    '"D"'::jsonb,
    691,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For the numbers 15, 16, 31, 35, 54, what is the median?',
    'mcq',
    '{"A": "4", "B": "31", "C": "58", "D": "40"}'::jsonb,
    '"B"'::jsonb,
    692,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 43 and standard deviation 28. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "1.0228", "B": "0.6512", "C": "0.4733", "D": "0.3108"}'::jsonb,
    '"B"'::jsonb,
    693,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 59 and standard deviation 22. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.6687", "B": "0.6958", "C": "0.3729", "D": "0.2667"}'::jsonb,
    '"C"'::jsonb,
    694,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 25, 225, 234, 2106, ?',
    'mcq',
    '{"A": "2042", "B": "1851", "C": "1947", "D": "2115"}'::jsonb,
    '"D"'::jsonb,
    695,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Pattern series: 28, 280, 287, 2870, ?. Find next term.',
    'mcq',
    '{"A": "2891", "B": "2166", "C": "2877", "D": "2987"}'::jsonb,
    '"C"'::jsonb,
    696,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find next term: 44, 51, 65, 86, ?',
    'mcq',
    '{"A": "124", "B": "132", "C": "114", "D": "159"}'::jsonb,
    '"C"'::jsonb,
    697,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=180, Q2=135, Q3=138, Q4=155. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "460", "B": "624", "C": "534", "D": "608"}'::jsonb,
    '"D"'::jsonb,
    698,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=63, |B|=66, and |A∩B|=36. What is |A∪B|?',
    'mcq',
    '{"A": "73", "B": "93", "C": "110", "D": "85"}'::jsonb,
    '"B"'::jsonb,
    699,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=31 with 0≤x≤15, 0≤y≤12, 0≤z≤14?',
    'mcq',
    '{"A": "66", "B": "74", "C": "48", "D": "72"}'::jsonb,
    '"A"'::jsonb,
    700,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 5, what will be the code after 108 days?',
    'mcq',
    '{"A": "1", "B": "0", "C": "4", "D": "3"}'::jsonb,
    '"A"'::jsonb,
    701,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=156, Y=178, Z=105. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.2994", "B": "0.3554", "C": "0.8753", "D": "0.0111"}'::jsonb,
    '"B"'::jsonb,
    702,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 15x + 23 = 173',
    'mcq',
    '{"A": "13", "B": "10", "C": "7", "D": "3"}'::jsonb,
    '"B"'::jsonb,
    703,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=82, |B|=71, and |A∩B|=21. What is |A∪B|?',
    'mcq',
    '{"A": "132", "B": "124", "C": "125", "D": "126"}'::jsonb,
    '"A"'::jsonb,
    704,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 5, what will be the code after 73 days?',
    'mcq',
    '{"A": "1", "B": "5", "C": "6", "D": "13"}'::jsonb,
    '"A"'::jsonb,
    705,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 16, 128, 136, 1088, ?',
    'mcq',
    '{"A": "1096", "B": "872", "C": "1108", "D": "1016"}'::jsonb,
    '"A"'::jsonb,
    706,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=88, |B|=78, and |A∩B|=39. What is |A∪B|?',
    'mcq',
    '{"A": "141", "B": "121", "C": "111", "D": "127"}'::jsonb,
    '"D"'::jsonb,
    707,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.49, what is expected successes in 30 trials?',
    'mcq',
    '{"A": "14.7", "B": "14.8758", "C": "14.758", "D": "14.6206"}'::jsonb,
    '"A"'::jsonb,
    708,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Given |A|=91, |B|=92, |A∩B|=21, compute |A∪B|.',
    'mcq',
    '{"A": "148", "B": "154", "C": "162", "D": "168"}'::jsonb,
    '"C"'::jsonb,
    709,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 84 and standard deviation 18. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.2143", "B": "0.4719", "C": "0.0459", "D": "0.3255"}'::jsonb,
    '"A"'::jsonb,
    710,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=191, Q4=173. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "-0.1707", "B": "-0.3229", "C": "-0.0942", "D": "0.5732"}'::jsonb,
    '"C"'::jsonb,
    711,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=204, Q2=141, Q3=133, Q4=140. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "662", "B": "638", "C": "646", "D": "618"}'::jsonb,
    '"D"'::jsonb,
    712,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 17x + 19 = 138',
    'mcq',
    '{"A": "6", "B": "7", "C": "10", "D": "3"}'::jsonb,
    '"B"'::jsonb,
    713,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[29,15],[11,?]], find ?',
    'mcq',
    '{"A": "43", "B": "55", "C": "54", "D": "62"}'::jsonb,
    '"B"'::jsonb,
    714,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items from 19 distinct items?',
    'mcq',
    '{"A": "6317", "B": "5814", "C": "5094", "D": "7389"}'::jsonb,
    '"B"'::jsonb,
    715,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 1, what will be the code after 87 days?',
    'mcq',
    '{"A": "6", "B": "0", "C": "2", "D": "4"}'::jsonb,
    '"D"'::jsonb,
    716,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 39, 47, 63, 87, ?',
    'mcq',
    '{"A": "133", "B": "99", "C": "119", "D": "137"}'::jsonb,
    '"C"'::jsonb,
    717,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (131 + 83) × 7 − 3',
    'mcq',
    '{"A": "1273", "B": "1495", "C": "1626", "D": "1681"}'::jsonb,
    '"B"'::jsonb,
    718,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 17 distinct items?',
    'mcq',
    '{"A": "55656", "B": "63480", "C": "57120", "D": "69706"}'::jsonb,
    '"C"'::jsonb,
    719,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=157, Q4=145. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "0.4998", "B": "-0.6244", "C": "-0.0764", "D": "0.3015"}'::jsonb,
    '"C"'::jsonb,
    720,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=29 with 0≤x≤14, 0≤y≤12, 0≤z≤11?',
    'mcq',
    '{"A": "45", "B": "49", "C": "53", "D": "27"}'::jsonb,
    '"A"'::jsonb,
    721,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 6 items from 21 distinct items?',
    'mcq',
    '{"A": "39070080", "B": "40161677", "C": "42542056", "D": "36119139"}'::jsonb,
    '"A"'::jsonb,
    722,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term: 50, 58, 74, 98, ?',
    'mcq',
    '{"A": "124", "B": "126", "C": "115", "D": "130"}'::jsonb,
    '"D"'::jsonb,
    723,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Evaluate: (149 + 74) × 9 − 7',
    'mcq',
    '{"A": "2009", "B": "2000", "C": "1892", "D": "1528"}'::jsonb,
    '"B"'::jsonb,
    724,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the 6th term of an AP with first term 45 and common difference 14.',
    'mcq',
    '{"A": "115", "B": "118", "C": "133", "D": "124"}'::jsonb,
    '"A"'::jsonb,
    725,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a grid rule, missing value ? = a + 2b − c. If a=21, b=14, c=21, find ?',
    'mcq',
    '{"A": "22", "B": "33", "C": "21", "D": "28"}'::jsonb,
    '"D"'::jsonb,
    726,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 11x + 25 = 168',
    'mcq',
    '{"A": "23", "B": "7", "C": "17", "D": "13"}'::jsonb,
    '"D"'::jsonb,
    727,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=193, Q2=128, Q3=121, Q4=103. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "473", "B": "589", "C": "606", "D": "545"}'::jsonb,
    '"D"'::jsonb,
    728,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=151, Y=171, Z=135. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.5474", "B": "0.5951", "C": "0.3304", "D": "0.0268"}'::jsonb,
    '"C"'::jsonb,
    729,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Data table (units): Q1=145, Q2=159, Q3=104, Q4=164. What is the total for the year (Q1+Q2+Q3+Q4)?',
    'mcq',
    '{"A": "595", "B": "572", "C": "570", "D": "518"}'::jsonb,
    '"B"'::jsonb,
    730,
    TRUE,
    'Step 1: Identify relevant numbers from the table.
Step 2: Apply the calculation (sum/ratio/change).
Step 3: Match the computed value with the option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Series: 14, 25, 47, 80, ?. Find next term.',
    'mcq',
    '{"A": "139", "B": "124", "C": "163", "D": "70"}'::jsonb,
    '"B"'::jsonb,
    731,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤14, 0≤y≤15, 0≤z≤14?',
    'mcq',
    '{"A": "112", "B": "144", "C": "147", "D": "134"}'::jsonb,
    '"D"'::jsonb,
    732,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 19, 27, 43, 67, ?',
    'mcq',
    '{"A": "91", "B": "95", "C": "77", "D": "99"}'::jsonb,
    '"D"'::jsonb,
    733,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a 2×2 grid, bottom-right equals sum of other three. If grid is [[32,19],[13,?]], find ?',
    'mcq',
    '{"A": "67", "B": "60", "C": "70", "D": "64"}'::jsonb,
    '"D"'::jsonb,
    734,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 36 and standard deviation 25. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.6944", "B": "0.4148", "C": "0.7859", "D": "0.7262"}'::jsonb,
    '"A"'::jsonb,
    735,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=45, |B|=74, and |A∩B|=21. What is |A∪B|?',
    'mcq',
    '{"A": "96", "B": "85", "C": "98", "D": "89"}'::jsonb,
    '"C"'::jsonb,
    736,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Category values: X=160, Y=146, Z=131. What is X''s share X/(X+Y+Z)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.0745", "B": "0.7061", "C": "0.4358", "D": "0.3661"}'::jsonb,
    '"D"'::jsonb,
    737,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -7x^2 + 29x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.8079", "B": "1.7428", "C": "2.071", "D": "2.4136"}'::jsonb,
    '"C"'::jsonb,
    738,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded Mon=1,...,Sun=7. If today has code 7, what will be the code after 97 days?',
    'mcq',
    '{"A": "14", "B": "2", "C": "12", "D": "6"}'::jsonb,
    '"D"'::jsonb,
    739,
    TRUE,
    'Step 1: Convert the conditions into constraints.
Step 2: Evaluate logically to isolate the required value.
Step 3: Choose the option that satisfies all constraints.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 20, 27, 41, 62, ?',
    'mcq',
    '{"A": "95", "B": "72", "C": "90", "D": "89"}'::jsonb,
    '"C"'::jsonb,
    740,
    TRUE,
    'Step 1: Identify transformation rules.
Step 2: Apply the rule consistently.
Step 3: Confirm by checking earlier terms.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=133, current value=193. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "144.763", "B": "145.11", "C": "145.0421", "D": "144.7341"}'::jsonb,
    '"B"'::jsonb,
    741,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items from 20 distinct items?',
    'mcq',
    '{"A": "1727431", "B": "1860480", "C": "1602918", "D": "1917548"}'::jsonb,
    '"B"'::jsonb,
    742,
    TRUE,
    'Step 1: Track relationships systematically.
Step 2: Eliminate contradictions.
Step 3: Arrive at the unique numeric conclusion.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Index calculation: base value=158, current value=156. Compute index = (current/base)×100. (round to 2 decimals)',
    'mcq',
    '{"A": "98.1835", "B": "98.1541", "C": "98.73", "D": "98.0463"}'::jsonb,
    '"C"'::jsonb,
    743,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 36 and standard deviation 26. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.7222", "B": "1.0479", "C": "0.5827", "D": "0.8898"}'::jsonb,
    '"A"'::jsonb,
    744,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Series: 14, 22, 38, 62, ?. Find next term.',
    'mcq',
    '{"A": "91", "B": "86", "C": "94", "D": "98"}'::jsonb,
    '"C"'::jsonb,
    745,
    TRUE,
    'Step 1: Detect the underlying pattern in the sequence/structure.
Step 2: Apply the pattern to the next step.
Step 3: Select the matching numeric option.',
    '{"grade": "PG", "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If probability of success is 0.48, what is the expected number of successes in 30 trials?',
    'mcq',
    '{"A": "14.6744", "B": "14.4", "C": "14.7211", "D": "15.0973"}'::jsonb,
    '"B"'::jsonb,
    746,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Quarter values: Q1=174, Q4=150. Compute proportional change (Q4−Q1)/Q1. (round to 4 decimals)',
    'mcq',
    '{"A": "0.537", "B": "0.0294", "C": "0.0214", "D": "-0.1379"}'::jsonb,
    '"D"'::jsonb,
    747,
    TRUE,
    'Step 1: Read the given data carefully.
Step 2: Perform the required aggregation/comparison.
Step 3: Compute the value and select the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -11x^2 + 47x + 5, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.8029", "B": "1.6084", "C": "2.1897", "D": "2.136"}'::jsonb,
    '"D"'::jsonb,
    748,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 75 and standard deviation 14. Compute coefficient of variation (sd/mean). (round to 4 decimals)',
    'mcq',
    '{"A": "0.1867", "B": "0.2074", "C": "0.2568", "D": "0.4194"}'::jsonb,
    '"A"'::jsonb,
    749,
    TRUE,
    'Step 1: Identify the quantitative relationship.
Step 2: Apply the appropriate formula.
Step 3: Compute the numeric result and match the option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value starts at 332, increases by 25% then decreases by 10%. What is the final value? (round to 2 decimals)',
    'mcq',
    '{"A": "373.0757", "B": "373.6036", "C": "374.4456", "D": "373.5"}'::jsonb,
    '"D"'::jsonb,
    750,
    TRUE,
    'Step 1: Translate the statement into an equation/expression.
Step 2: Solve systematically.
Step 3: Verify and select the correct value.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

END $$;