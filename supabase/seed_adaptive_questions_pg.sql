-- Seed file for PG Adaptive Aptitude Questions
-- Generated from PG_Adaptive_Aptitude_750_No_Case_Type.xlsx

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
    'In a geometric progression starting with 3 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "56", "B": "96", "C": "44", "D": "48"}'::jsonb,
    '"D"'::jsonb,
    1,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (504) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 7x + 13, what is f(4)?',
    'mcq',
    '{"A": "46", "B": "41", "C": "38", "D": "43"}'::jsonb,
    '"B"'::jsonb,
    2,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0826) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 3 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "96", "B": "44", "C": "48", "D": "56"}'::jsonb,
    '"C"'::jsonb,
    3,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3368) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 5x + 12, what is f(4)?',
    'mcq',
    '{"A": "37", "B": "32", "C": "29", "D": "34"}'::jsonb,
    '"B"'::jsonb,
    4,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (528) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 4 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "60", "B": "128", "C": "64", "D": "72"}'::jsonb,
    '"C"'::jsonb,
    5,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.128) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 14, what is f(4)?',
    'mcq',
    '{"A": "63", "B": "68", "C": "71", "D": "66"}'::jsonb,
    '"D"'::jsonb,
    6,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3302) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "160", "B": "88", "C": "80", "D": "76"}'::jsonb,
    '"C"'::jsonb,
    7,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (729) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 9x + 9, what is f(4)?',
    'mcq',
    '{"A": "42", "B": "50", "C": "47", "D": "45"}'::jsonb,
    '"D"'::jsonb,
    8,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2658) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "80", "B": "160", "C": "88", "D": "76"}'::jsonb,
    '"A"'::jsonb,
    9,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3442) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 4x + 20, what is f(4)?',
    'mcq',
    '{"A": "33", "B": "41", "C": "38", "D": "36"}'::jsonb,
    '"D"'::jsonb,
    10,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (569) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "160", "B": "80", "C": "88", "D": "76"}'::jsonb,
    '"B"'::jsonb,
    11,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2463) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 5x + 7, what is f(4)?',
    'mcq',
    '{"A": "24", "B": "27", "C": "32", "D": "29"}'::jsonb,
    '"B"'::jsonb,
    12,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.332) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 4 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "72", "B": "60", "C": "128", "D": "64"}'::jsonb,
    '"D"'::jsonb,
    13,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (439) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 17, what is f(4)?',
    'mcq',
    '{"A": "61", "B": "58", "C": "66", "D": "63"}'::jsonb,
    '"A"'::jsonb,
    14,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0943) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 4 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "128", "B": "64", "C": "72", "D": "60"}'::jsonb,
    '"B"'::jsonb,
    15,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3449) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 11, what is f(4)?',
    'mcq',
    '{"A": "60", "B": "68", "C": "63", "D": "65"}'::jsonb,
    '"C"'::jsonb,
    16,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (800) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 6 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "192", "B": "96", "C": "104", "D": "92"}'::jsonb,
    '"B"'::jsonb,
    17,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2143) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 9x + 7, what is f(4)?',
    'mcq',
    '{"A": "40", "B": "48", "C": "43", "D": "45"}'::jsonb,
    '"C"'::jsonb,
    18,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3168) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 6 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "192", "B": "104", "C": "96", "D": "92"}'::jsonb,
    '"C"'::jsonb,
    19,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (756) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 16, what is f(4)?',
    'mcq',
    '{"A": "68", "B": "73", "C": "65", "D": "70"}'::jsonb,
    '"A"'::jsonb,
    20,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1954) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 6 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "92", "B": "192", "C": "96", "D": "104"}'::jsonb,
    '"C"'::jsonb,
    21,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3372) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 6x + 13, what is f(4)?',
    'mcq',
    '{"A": "37", "B": "39", "C": "42", "D": "34"}'::jsonb,
    '"A"'::jsonb,
    22,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (553) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 6 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "192", "B": "104", "C": "96", "D": "92"}'::jsonb,
    '"C"'::jsonb,
    23,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0827) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 12x + 21, what is f(4)?',
    'mcq',
    '{"A": "71", "B": "66", "C": "74", "D": "69"}'::jsonb,
    '"D"'::jsonb,
    24,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3582) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 4 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "64", "B": "72", "C": "60", "D": "128"}'::jsonb,
    '"A"'::jsonb,
    25,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (534) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 8, what is f(4)?',
    'mcq',
    '{"A": "60", "B": "57", "C": "62", "D": "65"}'::jsonb,
    '"A"'::jsonb,
    26,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2063) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "160", "B": "88", "C": "76", "D": "80"}'::jsonb,
    '"D"'::jsonb,
    27,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3504) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 12x + 14, what is f(4)?',
    'mcq',
    '{"A": "67", "B": "64", "C": "62", "D": "59"}'::jsonb,
    '"C"'::jsonb,
    28,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (699) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 6 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "92", "B": "96", "C": "104", "D": "192"}'::jsonb,
    '"B"'::jsonb,
    29,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2118) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 8x + 11, what is f(4)?',
    'mcq',
    '{"A": "48", "B": "45", "C": "40", "D": "43"}'::jsonb,
    '"D"'::jsonb,
    30,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3527) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A sample of size 14 has mean 55. After adding value 30, what is the new mean?',
    'mcq',
    '{"A": "53.33", "B": "52.401", "C": "53.676", "D": "54.467"}'::jsonb,
    '"A"'::jsonb,
    31,
    TRUE,
    'Step 1: Identify the key concept (Quant - StatisticsBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (53.33) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A box has 8 red and 4 blue balls. Two balls are drawn without replacement. What is P(both red)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.325", "B": "0.516", "C": "0.329", "D": "0.4242"}'::jsonb,
    '"D"'::jsonb,
    32,
    TRUE,
    'Step 1: Identify the key concept (Quant - BasicProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.4242) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A deposit of 15000 grows at 10% compounded annually for 2 years. What is the future value?',
    'mcq',
    '{"A": "18150.0", "B": "18122.102", "C": "18073.853", "D": "18195.524"}'::jsonb,
    '"A"'::jsonb,
    33,
    TRUE,
    'Step 1: Identify the key concept (Quant - TimeValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (18150.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value starts at 1531 and increases by 8% then decreases by 5%. What is the final value?',
    'mcq',
    '{"A": "1573.314", "B": "1569.973", "C": "1573.839", "D": "1570.81"}'::jsonb,
    '"D"'::jsonb,
    34,
    TRUE,
    'Step 1: Identify the key concept (Quant - Percentages).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1570.81) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A deposit of 12000 grows at 8% compounded annually for 4 years. What is the future value?',
    'mcq',
    '{"A": "16295.488", "B": "16277.632", "C": "16325.87", "D": "16364.771"}'::jsonb,
    '"C"'::jsonb,
    35,
    TRUE,
    'Step 1: Identify the key concept (Quant - TimeValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (16325.87) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A sample of size 19 has mean 66. After adding value 70, what is the new mean?',
    'mcq',
    '{"A": "65.712", "B": "65.682", "C": "66.567", "D": "66.2"}'::jsonb,
    '"D"'::jsonb,
    36,
    TRUE,
    'Step 1: Identify the key concept (Quant - StatisticsBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (66.2) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A deposit of 5000 grows at 10% compounded annually for 3 years. What is the future value?',
    'mcq',
    '{"A": "6584.24", "B": "6655.0", "C": "6591.405", "D": "6665.643"}'::jsonb,
    '"B"'::jsonb,
    37,
    TRUE,
    'Step 1: Identify the key concept (Quant - TimeValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6655.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A box has 6 red and 6 blue balls. Two balls are drawn without replacement. What is P(both red)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.41", "B": "0.2273", "C": "0.136", "D": "0.293"}'::jsonb,
    '"B"'::jsonb,
    38,
    TRUE,
    'Step 1: Identify the key concept (Quant - BasicProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2273) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A box has 5 red and 3 blue balls. Two balls are drawn without replacement. What is P(both red)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.3571", "B": "0.416", "C": "0.507", "D": "0.493"}'::jsonb,
    '"A"'::jsonb,
    39,
    TRUE,
    'Step 1: Identify the key concept (Quant - BasicProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3571) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 6x + 28 = 76',
    'mcq',
    '{"A": "12", "B": "4", "C": "0", "D": "8"}'::jsonb,
    '"D"'::jsonb,
    40,
    TRUE,
    'Step 1: Identify the key concept (Quant - Algebra).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A sample of size 13 has mean 55. After adding value 65, what is the new mean?',
    'mcq',
    '{"A": "56.906", "B": "55.71", "C": "55.223", "D": "55.026"}'::jsonb,
    '"B"'::jsonb,
    41,
    TRUE,
    'Step 1: Identify the key concept (Quant - StatisticsBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (55.71) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 11x + 29 = 172',
    'mcq',
    '{"A": "13", "B": "19", "C": "15", "D": "9"}'::jsonb,
    '"A"'::jsonb,
    42,
    TRUE,
    'Step 1: Identify the key concept (Quant - Algebra).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (13) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A sample of size 10 has mean 48. After adding value 32, what is the new mean?',
    'mcq',
    '{"A": "46.55", "B": "45.748", "C": "47.722", "D": "46.984"}'::jsonb,
    '"A"'::jsonb,
    43,
    TRUE,
    'Step 1: Identify the key concept (Quant - StatisticsBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (46.55) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 7x + 20 = 41',
    'mcq',
    '{"A": "13", "B": "3", "C": "5", "D": "1"}'::jsonb,
    '"B"'::jsonb,
    44,
    TRUE,
    'Step 1: Identify the key concept (Quant - Algebra).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A sample of size 11 has mean 64. After adding value 63, what is the new mean?',
    'mcq',
    '{"A": "63.702", "B": "63.402", "C": "63.92", "D": "63.493"}'::jsonb,
    '"C"'::jsonb,
    45,
    TRUE,
    'Step 1: Identify the key concept (Quant - StatisticsBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (63.92) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value starts at 1330 and increases by 8% then decreases by 8%. What is the final value?',
    'mcq',
    '{"A": "1321.49", "B": "1322.69", "C": "1321.369", "D": "1315.944"}'::jsonb,
    '"A"'::jsonb,
    46,
    TRUE,
    'Step 1: Identify the key concept (Quant - Percentages).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1321.49) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value starts at 741 and increases by 10% then decreases by 12%. What is the final value?',
    'mcq',
    '{"A": "722.506", "B": "713.975", "C": "717.29", "D": "717.793"}'::jsonb,
    '"C"'::jsonb,
    47,
    TRUE,
    'Step 1: Identify the key concept (Quant - Percentages).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (717.29) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A box has 3 red and 6 blue balls. Two balls are drawn without replacement. What is P(both red)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.272", "B": "0.011", "C": "0.003", "D": "0.0833"}'::jsonb,
    '"D"'::jsonb,
    48,
    TRUE,
    'Step 1: Identify the key concept (Quant - BasicProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0833) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A sample of size 8 has mean 64. After adding value 78, what is the new mean?',
    'mcq',
    '{"A": "66.114", "B": "65.56", "C": "65.267", "D": "64.363"}'::jsonb,
    '"B"'::jsonb,
    49,
    TRUE,
    'Step 1: Identify the key concept (Quant - StatisticsBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (65.56) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 5x + 15 = 55',
    'mcq',
    '{"A": "14", "B": "16", "C": "8", "D": "4"}'::jsonb,
    '"C"'::jsonb,
    50,
    TRUE,
    'Step 1: Identify the key concept (Quant - Algebra).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A sample of size 15 has mean 53. After adding value 33, what is the new mean?',
    'mcq',
    '{"A": "51.75", "B": "51.356", "C": "52.056", "D": "50.965"}'::jsonb,
    '"A"'::jsonb,
    51,
    TRUE,
    'Step 1: Identify the key concept (Quant - StatisticsBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (51.75) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A box has 3 red and 3 blue balls. Two balls are drawn without replacement. What is P(both red)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.371", "B": "0.299", "C": "0.045", "D": "0.2"}'::jsonb,
    '"D"'::jsonb,
    52,
    TRUE,
    'Step 1: Identify the key concept (Quant - BasicProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A box has 8 red and 5 blue balls. Two balls are drawn without replacement. What is P(both red)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.51", "B": "0.359", "C": "0.217", "D": "0.458"}'::jsonb,
    '"B"'::jsonb,
    53,
    TRUE,
    'Step 1: Identify the key concept (Quant - BasicProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.359) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value starts at 1969 and increases by 8% then decreases by 10%. What is the final value?',
    'mcq',
    '{"A": "1920.452", "B": "1913.87", "C": "1916.655", "D": "1907.666"}'::jsonb,
    '"B"'::jsonb,
    54,
    TRUE,
    'Step 1: Identify the key concept (Quant - Percentages).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1913.87) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A deposit of 12000 grows at 12% compounded annually for 4 years. What is the future value?',
    'mcq',
    '{"A": "18925.717", "B": "18882.23", "C": "18920.013", "D": "18910.841"}'::jsonb,
    '"B"'::jsonb,
    55,
    TRUE,
    'Step 1: Identify the key concept (Quant - TimeValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (18882.23) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A box has 6 red and 8 blue balls. Two balls are drawn without replacement. What is P(both red)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.09", "B": "0.277", "C": "0.254", "D": "0.1648"}'::jsonb,
    '"D"'::jsonb,
    56,
    TRUE,
    'Step 1: Identify the key concept (Quant - BasicProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1648) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value starts at 1039 and increases by 9% then decreases by 5%. What is the final value?',
    'mcq',
    '{"A": "1073.105", "B": "1081.114", "C": "1075.88", "D": "1079.689"}'::jsonb,
    '"C"'::jsonb,
    57,
    TRUE,
    'Step 1: Identify the key concept (Quant - Percentages).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1075.88) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value starts at 1492 and increases by 12% then decreases by 8%. What is the final value?',
    'mcq',
    '{"A": "1540.965", "B": "1531.361", "C": "1533.446", "D": "1537.36"}'::jsonb,
    '"D"'::jsonb,
    58,
    TRUE,
    'Step 1: Identify the key concept (Quant - Percentages).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1537.36) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A box has 4 red and 4 blue balls. Two balls are drawn without replacement. What is P(both red)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.291", "B": "0.2143", "C": "0.156", "D": "0.053"}'::jsonb,
    '"B"'::jsonb,
    59,
    TRUE,
    'Step 1: Identify the key concept (Quant - BasicProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2143) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A box has 5 red and 4 blue balls. Two balls are drawn without replacement. What is P(both red)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.167", "B": "0.078", "C": "0.2778", "D": "0.435"}'::jsonb,
    '"C"'::jsonb,
    60,
    TRUE,
    'Step 1: Identify the key concept (Quant - BasicProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2778) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 12x + 28 = 136',
    'mcq',
    '{"A": "9", "B": "11", "C": "12", "D": "19"}'::jsonb,
    '"A"'::jsonb,
    61,
    TRUE,
    'Step 1: Identify the key concept (Quant - Algebra).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 7x + 30 = 93',
    'mcq',
    '{"A": "11", "B": "15", "C": "9", "D": "7"}'::jsonb,
    '"C"'::jsonb,
    62,
    TRUE,
    'Step 1: Identify the key concept (Quant - Algebra).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A sample of size 16 has mean 69. After adding value 47, what is the new mean?',
    'mcq',
    '{"A": "68.874", "B": "67.71", "C": "66.605", "D": "68.724"}'::jsonb,
    '"B"'::jsonb,
    63,
    TRUE,
    'Step 1: Identify the key concept (Quant - StatisticsBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (67.71) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A box has 7 red and 5 blue balls. Two balls are drawn without replacement. What is P(both red)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.3182", "B": "0.268", "C": "0.209", "D": "0.464"}'::jsonb,
    '"A"'::jsonb,
    64,
    TRUE,
    'Step 1: Identify the key concept (Quant - BasicProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3182) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A sample of size 16 has mean 50. After adding value 88, what is the new mean?',
    'mcq',
    '{"A": "51.854", "B": "52.24", "C": "51.441", "D": "53.34"}'::jsonb,
    '"B"'::jsonb,
    65,
    TRUE,
    'Step 1: Identify the key concept (Quant - StatisticsBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (52.24) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 4x + 12 = 52',
    'mcq',
    '{"A": "18", "B": "0", "C": "6", "D": "10"}'::jsonb,
    '"D"'::jsonb,
    66,
    TRUE,
    'Step 1: Identify the key concept (Quant - Algebra).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (10) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 8x + 11 = 83',
    'mcq',
    '{"A": "15", "B": "6", "C": "13", "D": "9"}'::jsonb,
    '"D"'::jsonb,
    67,
    TRUE,
    'Step 1: Identify the key concept (Quant - Algebra).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Solve for x: 6x + 25 = 97',
    'mcq',
    '{"A": "12", "B": "7", "C": "14", "D": "17"}'::jsonb,
    '"A"'::jsonb,
    68,
    TRUE,
    'Step 1: Identify the key concept (Quant - Algebra).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (12) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A deposit of 8000 grows at 12% compounded annually for 2 years. What is the future value?',
    'mcq',
    '{"A": "10049.1", "B": "10035.2", "C": "10133.954", "D": "9995.264"}'::jsonb,
    '"B"'::jsonb,
    69,
    TRUE,
    'Step 1: Identify the key concept (Quant - TimeValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (10035.2) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A deposit of 5000 grows at 8% compounded annually for 3 years. What is the future value?',
    'mcq',
    '{"A": "6298.56", "B": "6293.225", "C": "6346.237", "D": "6272.232"}'::jsonb,
    '"A"'::jsonb,
    70,
    TRUE,
    'Step 1: Identify the key concept (Quant - TimeValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6298.56) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A sample of size 12 has mean 54. After adding value 71, what is the new mean?',
    'mcq',
    '{"A": "54.112", "B": "55.026", "C": "54.73", "D": "55.31"}'::jsonb,
    '"D"'::jsonb,
    71,
    TRUE,
    'Step 1: Identify the key concept (Quant - StatisticsBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (55.31) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value starts at 334 and increases by 9% then decreases by 10%. What is the final value?',
    'mcq',
    '{"A": "323.966", "B": "327.65", "C": "332.682", "D": "330.759"}'::jsonb,
    '"B"'::jsonb,
    72,
    TRUE,
    'Step 1: Identify the key concept (Quant - Percentages).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (327.65) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A sample of size 19 has mean 67. After adding value 43, what is the new mean?',
    'mcq',
    '{"A": "65.245", "B": "65.531", "C": "65.8", "D": "66.087"}'::jsonb,
    '"C"'::jsonb,
    73,
    TRUE,
    'Step 1: Identify the key concept (Quant - StatisticsBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (65.8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A box has 5 red and 8 blue balls. Two balls are drawn without replacement. What is P(both red)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.1282", "B": "0.035", "C": "0.196", "D": "0.325"}'::jsonb,
    '"A"'::jsonb,
    74,
    TRUE,
    'Step 1: Identify the key concept (Quant - BasicProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1282) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A deposit of 5000 grows at 10% compounded annually for 4 years. What is the future value?',
    'mcq',
    '{"A": "7381.439", "B": "7297.807", "C": "7278.234", "D": "7320.5"}'::jsonb,
    '"D"'::jsonb,
    75,
    TRUE,
    'Step 1: Identify the key concept (Quant - TimeValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7320.5) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A deposit of 5000 grows at 8% compounded annually for 2 years. What is the future value?',
    'mcq',
    '{"A": "5832.0", "B": "5828.474", "C": "5836.633", "D": "5775.325"}'::jsonb,
    '"A"'::jsonb,
    76,
    TRUE,
    'Step 1: Identify the key concept (Quant - TimeValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5832.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A deposit of 20000 grows at 12% compounded annually for 2 years. What is the future value?',
    'mcq',
    '{"A": "25088.0", "B": "25080.087", "C": "25155.429", "D": "25132.173"}'::jsonb,
    '"A"'::jsonb,
    77,
    TRUE,
    'Step 1: Identify the key concept (Quant - TimeValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (25088.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value starts at 1746 and increases by 8% then decreases by 10%. What is the final value?',
    'mcq',
    '{"A": "1700.606", "B": "1691.652", "C": "1701.373", "D": "1697.11"}'::jsonb,
    '"D"'::jsonb,
    78,
    TRUE,
    'Step 1: Identify the key concept (Quant - Percentages).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1697.11) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A deposit of 8000 grows at 8% compounded annually for 3 years. What is the future value?',
    'mcq',
    '{"A": "10060.048", "B": "10063.192", "C": "10077.7", "D": "10076.828"}'::jsonb,
    '"C"'::jsonb,
    79,
    TRUE,
    'Step 1: Identify the key concept (Quant - TimeValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (10077.7) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value starts at 1092 and increases by 18% then decreases by 15%. What is the final value?',
    'mcq',
    '{"A": "1098.276", "B": "1095.28", "C": "1096.646", "D": "1096.001"}'::jsonb,
    '"B"'::jsonb,
    80,
    TRUE,
    'Step 1: Identify the key concept (Quant - Percentages).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1095.28) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 9 distinct items?',
    'mcq',
    '{"A": "2903", "B": "3174", "C": "3024", "D": "3444"}'::jsonb,
    '"C"'::jsonb,
    81,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3024) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Letters are valued A=1,...,Z=26. What is the sum for the word INFER?',
    'mcq',
    '{"A": "14", "B": "52", "C": "90", "D": "63"}'::jsonb,
    '"B"'::jsonb,
    82,
    TRUE,
    'Step 1: Identify the key concept (Logic - CodingNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (52) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 9, 16, 30, 51, ?',
    'mcq',
    '{"A": "79", "B": "83", "C": "63", "D": "78"}'::jsonb,
    '"A"'::jsonb,
    83,
    TRUE,
    'Step 1: Identify the key concept (Logic - NumberSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (79) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 9, 17, 33, 57, ?',
    'mcq',
    '{"A": "89", "B": "65", "C": "90", "D": "91"}'::jsonb,
    '"A"'::jsonb,
    84,
    TRUE,
    'Step 1: Identify the key concept (Logic - NumberSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (89) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Letters are valued A=1,...,Z=26. What is the sum for the word BAYES?',
    'mcq',
    '{"A": "16", "B": "32", "C": "41", "D": "52"}'::jsonb,
    '"D"'::jsonb,
    85,
    TRUE,
    'Step 1: Identify the key concept (Logic - CodingNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (52) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Letters are valued A=1,...,Z=26. What is the sum for the word LOGIC?',
    'mcq',
    '{"A": "46", "B": "70", "C": "34", "D": "52"}'::jsonb,
    '"A"'::jsonb,
    86,
    TRUE,
    'Step 1: Identify the key concept (Logic - CodingNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (46) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 7 distinct items?',
    'mcq',
    '{"A": "953", "B": "1010", "C": "840", "D": "741"}'::jsonb,
    '"C"'::jsonb,
    87,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (840) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 6, what will be the code after 71 days?',
    'mcq',
    '{"A": "11", "B": "5", "C": "9", "D": "7"}'::jsonb,
    '"D"'::jsonb,
    88,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 3, what will be the code after 101 days?',
    'mcq',
    '{"A": "6", "B": "2", "C": "0", "D": "10"}'::jsonb,
    '"A"'::jsonb,
    89,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 2 items can be formed from 11 distinct items?',
    'mcq',
    '{"A": "100", "B": "122", "C": "93", "D": "110"}'::jsonb,
    '"D"'::jsonb,
    90,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (110) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 2 items can be formed from 8 distinct items?',
    'mcq',
    '{"A": "45", "B": "56", "C": "51", "D": "67"}'::jsonb,
    '"B"'::jsonb,
    91,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (56) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 5, 8, 14, 23, ?',
    'mcq',
    '{"A": "35", "B": "17", "C": "49", "D": "40"}'::jsonb,
    '"A"'::jsonb,
    92,
    TRUE,
    'Step 1: Identify the key concept (Logic - NumberSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (35) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Letters are valued A=1,...,Z=26. What is the sum for the word DATA?',
    'mcq',
    '{"A": "43", "B": "18", "C": "6", "D": "26"}'::jsonb,
    '"D"'::jsonb,
    93,
    TRUE,
    'Step 1: Identify the key concept (Logic - CodingNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (26) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Letters are valued A=1,...,Z=26. What is the sum for the word MODEL?',
    'mcq',
    '{"A": "55", "B": "23", "C": "46", "D": "49"}'::jsonb,
    '"D"'::jsonb,
    94,
    TRUE,
    'Step 1: Identify the key concept (Logic - CodingNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (49) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 7 distinct items?',
    'mcq',
    '{"A": "202", "B": "210", "C": "205", "D": "260"}'::jsonb,
    '"B"'::jsonb,
    95,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (210) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 9, 14, 24, 39, ?',
    'mcq',
    '{"A": "41", "B": "54", "C": "31", "D": "59"}'::jsonb,
    '"D"'::jsonb,
    96,
    TRUE,
    'Step 1: Identify the key concept (Logic - NumberSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (59) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 2 items can be formed from 9 distinct items?',
    'mcq',
    '{"A": "72", "B": "46", "C": "98", "D": "48"}'::jsonb,
    '"A"'::jsonb,
    97,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (72) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 10, 13, 19, 28, ?',
    'mcq',
    '{"A": "47", "B": "34", "C": "58", "D": "40"}'::jsonb,
    '"D"'::jsonb,
    98,
    TRUE,
    'Step 1: Identify the key concept (Logic - NumberSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (40) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 10, 15, 25, 40, ?',
    'mcq',
    '{"A": "61", "B": "60", "C": "69", "D": "32"}'::jsonb,
    '"B"'::jsonb,
    99,
    TRUE,
    'Step 1: Identify the key concept (Logic - NumberSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (60) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 10 distinct items?',
    'mcq',
    '{"A": "720", "B": "724", "C": "888", "D": "688"}'::jsonb,
    '"A"'::jsonb,
    100,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (720) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 2 items can be formed from 10 distinct items?',
    'mcq',
    '{"A": "106", "B": "130", "C": "90", "D": "94"}'::jsonb,
    '"C"'::jsonb,
    101,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (90) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 7, 11, 19, 31, ?',
    'mcq',
    '{"A": "49", "B": "65", "C": "39", "D": "47"}'::jsonb,
    '"D"'::jsonb,
    102,
    TRUE,
    'Step 1: Identify the key concept (Logic - NumberSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (47) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 8 distinct items?',
    'mcq',
    '{"A": "1569", "B": "1877", "C": "1844", "D": "1680"}'::jsonb,
    '"D"'::jsonb,
    103,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1680) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 3, what will be the code after 81 days?',
    'mcq',
    '{"A": "9", "B": "7", "C": "5", "D": "13"}'::jsonb,
    '"B"'::jsonb,
    104,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 5, what will be the code after 89 days?',
    'mcq',
    '{"A": "9", "B": "3", "C": "4", "D": "0"}'::jsonb,
    '"B"'::jsonb,
    105,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 7, what will be the code after 88 days?',
    'mcq',
    '{"A": "10", "B": "2", "C": "8", "D": "4"}'::jsonb,
    '"D"'::jsonb,
    106,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (4) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 4, what will be the code after 68 days?',
    'mcq',
    '{"A": "6", "B": "2", "C": "4", "D": "5"}'::jsonb,
    '"B"'::jsonb,
    107,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 8 distinct items?',
    'mcq',
    '{"A": "326", "B": "365", "C": "352", "D": "336"}'::jsonb,
    '"D"'::jsonb,
    108,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (336) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 11 distinct items?',
    'mcq',
    '{"A": "7920", "B": "7266", "C": "8561", "D": "5810"}'::jsonb,
    '"A"'::jsonb,
    109,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7920) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 10, 14, 22, 34, ?',
    'mcq',
    '{"A": "50", "B": "60", "C": "24", "D": "44"}'::jsonb,
    '"A"'::jsonb,
    110,
    TRUE,
    'Step 1: Identify the key concept (Logic - NumberSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (50) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 2, what will be the code after 92 days?',
    'mcq',
    '{"A": "0", "B": "2", "C": "3", "D": "5"}'::jsonb,
    '"C"'::jsonb,
    111,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 11 distinct items?',
    'mcq',
    '{"A": "990", "B": "1144", "C": "730", "D": "906"}'::jsonb,
    '"A"'::jsonb,
    112,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (990) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 7, what will be the code after 102 days?',
    'mcq',
    '{"A": "3", "B": "1", "C": "8", "D": "4"}'::jsonb,
    '"D"'::jsonb,
    113,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (4) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 6, what will be the code after 105 days?',
    'mcq',
    '{"A": "10", "B": "4", "C": "12", "D": "6"}'::jsonb,
    '"D"'::jsonb,
    114,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 8, 16, 32, 56, ?',
    'mcq',
    '{"A": "92", "B": "104", "C": "88", "D": "64"}'::jsonb,
    '"C"'::jsonb,
    115,
    TRUE,
    'Step 1: Identify the key concept (Logic - NumberSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (88) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 6, 9, 15, 24, ?',
    'mcq',
    '{"A": "36", "B": "44", "C": "45", "D": "22"}'::jsonb,
    '"A"'::jsonb,
    116,
    TRUE,
    'Step 1: Identify the key concept (Logic - NumberSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (36) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 5, what will be the code after 109 days?',
    'mcq',
    '{"A": "2", "B": "1", "C": "4", "D": "0"}'::jsonb,
    '"A"'::jsonb,
    117,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 10 distinct items?',
    'mcq',
    '{"A": "3926", "B": "5320", "C": "4764", "D": "5040"}'::jsonb,
    '"D"'::jsonb,
    118,
    TRUE,
    'Step 1: Identify the key concept (Logic - BasicCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5040) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 1, what will be the code after 109 days?',
    'mcq',
    '{"A": "8", "B": "9", "C": "3", "D": "5"}'::jsonb,
    '"D"'::jsonb,
    119,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Days are coded as Mon=1,...,Sun=7. If today has code 4, what will be the code after 56 days?',
    'mcq',
    '{"A": "0", "B": "4", "C": "2", "D": "3"}'::jsonb,
    '"B"'::jsonb,
    120,
    TRUE,
    'Step 1: Identify the key concept (Logic - CalendarArithmetic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (4) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [73, 94, 65]. What is weighted score?',
    'mcq',
    '{"A": "78.192", "B": "77.591", "C": "77.7", "D": "78.57"}'::jsonb,
    '"C"'::jsonb,
    121,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (77.7) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'An option yields +11924 with probability 0.29 and -4060 otherwise. What is expected value?',
    'mcq',
    '{"A": "384.883", "B": "367.379", "C": "764.71", "D": "575.36"}'::jsonb,
    '"D"'::jsonb,
    122,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ExpectedValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (575.36) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [82, 62, 86]. What is weighted score?',
    'mcq',
    '{"A": "77.36", "B": "76.8", "C": "76.96", "D": "76.077"}'::jsonb,
    '"B"'::jsonb,
    123,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (76.8) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'An option yields +2945 with probability 0.47 and -5577 otherwise. What is expected value?',
    'mcq',
    '{"A": "-1635.312", "B": "-1933.328", "C": "-1571.66", "D": "-1340.417"}'::jsonb,
    '"C"'::jsonb,
    124,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ExpectedValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-1571.66) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [53, 54, 80]. What is weighted score?',
    'mcq',
    '{"A": "57.145", "B": "58.921", "C": "58.7", "D": "58.54"}'::jsonb,
    '"C"'::jsonb,
    125,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (58.7) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Fixed cost=64743, price/unit=1077, variable cost/unit=702. What is the break-even quantity (ceil)?',
    'mcq',
    '{"A": "173", "B": "204", "C": "309", "D": "243"}'::jsonb,
    '"A"'::jsonb,
    126,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BreakEven).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (173) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [77, 84, 74]. What is weighted score?',
    'mcq',
    '{"A": "79.332", "B": "78.988", "C": "78.5", "D": "78.188"}'::jsonb,
    '"C"'::jsonb,
    127,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (78.5) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Fixed cost=33505, price/unit=468, variable cost/unit=201. What is the break-even quantity (ceil)?',
    'mcq',
    '{"A": "126", "B": "11", "C": "63", "D": "186"}'::jsonb,
    '"A"'::jsonb,
    128,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BreakEven).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (126) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'An option yields +7253 with probability 0.55 and -2940 otherwise. What is expected value?',
    'mcq',
    '{"A": "2666.15", "B": "2741.626", "C": "2872.989", "D": "2912.575"}'::jsonb,
    '"A"'::jsonb,
    129,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ExpectedValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2666.15) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Fixed cost=42571, price/unit=1058, variable cost/unit=837. What is the break-even quantity (ceil)?',
    'mcq',
    '{"A": "193", "B": "39", "C": "389", "D": "298"}'::jsonb,
    '"A"'::jsonb,
    130,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BreakEven).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (193) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Fixed cost=72807, price/unit=874, variable cost/unit=209. What is the break-even quantity (ceil)?',
    'mcq',
    '{"A": "217", "B": "176", "C": "110", "D": "210"}'::jsonb,
    '"C"'::jsonb,
    131,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BreakEven).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (110) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [62, 53, 67]. What is weighted score?',
    'mcq',
    '{"A": "60.3", "B": "59.892", "C": "61.114", "D": "61.18"}'::jsonb,
    '"A"'::jsonb,
    132,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (60.3) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Fixed cost=68593, price/unit=520, variable cost/unit=395. What is the break-even quantity (ceil)?',
    'mcq',
    '{"A": "833", "B": "549", "C": "651", "D": "612"}'::jsonb,
    '"B"'::jsonb,
    133,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BreakEven).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (549) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'An option yields +10147 with probability 0.51 and -4817 otherwise. What is expected value?',
    'mcq',
    '{"A": "3271.814", "B": "3195.478", "C": "2765.246", "D": "2814.64"}'::jsonb,
    '"D"'::jsonb,
    134,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ExpectedValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2814.64) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Fixed cost=37090, price/unit=966, variable cost/unit=748. What is the break-even quantity (ceil)?',
    'mcq',
    '{"A": "273", "B": "53", "C": "247", "D": "171"}'::jsonb,
    '"D"'::jsonb,
    135,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BreakEven).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (171) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [81, 79, 60]. What is weighted score?',
    'mcq',
    '{"A": "75.778", "B": "76.2", "C": "77.692", "D": "75.975"}'::jsonb,
    '"B"'::jsonb,
    136,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (76.2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Fixed cost=24454, price/unit=1124, variable cost/unit=304. What is the break-even quantity (ceil)?',
    'mcq',
    '{"A": "33", "B": "26", "C": "25", "D": "30"}'::jsonb,
    '"D"'::jsonb,
    137,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BreakEven).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (30) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'An option yields +4937 with probability 0.68 and -1876 otherwise. What is expected value?',
    'mcq',
    '{"A": "2877.4", "B": "2756.84", "C": "2986.356", "D": "3164.466"}'::jsonb,
    '"B"'::jsonb,
    138,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ExpectedValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2756.84) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [64, 69, 93]. What is weighted score?',
    'mcq',
    '{"A": "70.629", "B": "71.022", "C": "70.463", "D": "71.3"}'::jsonb,
    '"D"'::jsonb,
    139,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (71.3) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Fixed cost=52758, price/unit=844, variable cost/unit=489. What is the break-even quantity (ceil)?',
    'mcq',
    '{"A": "4", "B": "208", "C": "13", "D": "149"}'::jsonb,
    '"D"'::jsonb,
    140,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BreakEven).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (149) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [86, 92, 52]. What is weighted score?',
    'mcq',
    '{"A": "81.065", "B": "79.785", "C": "81.0", "D": "81.441"}'::jsonb,
    '"C"'::jsonb,
    141,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (81.0) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [84, 71, 74]. What is weighted score?',
    'mcq',
    '{"A": "78.1", "B": "77.299", "C": "79.152", "D": "78.868"}'::jsonb,
    '"A"'::jsonb,
    142,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (78.1) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [88, 75, 70]. What is weighted score?',
    'mcq',
    '{"A": "80.656", "B": "80.5", "C": "81.532", "D": "78.911"}'::jsonb,
    '"B"'::jsonb,
    143,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (80.5) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [68, 65, 95]. What is weighted score?',
    'mcq',
    '{"A": "72.697", "B": "72.74", "C": "72.5", "D": "74.005"}'::jsonb,
    '"C"'::jsonb,
    144,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (72.5) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'An option yields +3430 with probability 0.26 and -2535 otherwise. What is expected value?',
    'mcq',
    '{"A": "-1009.968", "B": "-984.1", "C": "-1199.647", "D": "-1072.611"}'::jsonb,
    '"B"'::jsonb,
    145,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ExpectedValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-984.1) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A project is scored with weights [0.5, 0.3, 0.2] on criteria scores [85, 65, 86]. What is weighted score?',
    'mcq',
    '{"A": "79.2", "B": "78.11", "C": "78.528", "D": "79.622"}'::jsonb,
    '"A"'::jsonb,
    146,
    TRUE,
    'Step 1: Identify the key concept (CritThink - WeightedScore).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (79.2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Fixed cost=43666, price/unit=657, variable cost/unit=276. What is the break-even quantity (ceil)?',
    'mcq',
    '{"A": "185", "B": "115", "C": "111", "D": "268"}'::jsonb,
    '"B"'::jsonb,
    147,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BreakEven).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (115) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'An option yields +11738 with probability 0.69 and -2115 otherwise. What is expected value?',
    'mcq',
    '{"A": "7443.57", "B": "7563.348", "C": "7518.714", "D": "7925.861"}'::jsonb,
    '"A"'::jsonb,
    148,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ExpectedValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7443.57) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'An option yields +8437 with probability 0.37 and -3990 otherwise. What is expected value?',
    'mcq',
    '{"A": "636.506", "B": "437.546", "C": "756.067", "D": "607.99"}'::jsonb,
    '"D"'::jsonb,
    149,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ExpectedValue).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (607.99) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Fixed cost=73671, price/unit=818, variable cost/unit=661. What is the break-even quantity (ceil)?',
    'mcq',
    '{"A": "470", "B": "594", "C": "639", "D": "542"}'::jsonb,
    '"A"'::jsonb,
    150,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BreakEven).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (470) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "76", "B": "80", "C": "88", "D": "160"}'::jsonb,
    '"B"'::jsonb,
    151,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (765) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 7, what is f(5)?',
    'mcq',
    '{"A": "77", "B": "72", "C": "74", "D": "69"}'::jsonb,
    '"B"'::jsonb,
    152,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1768) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 4 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "72", "B": "64", "C": "128", "D": "60"}'::jsonb,
    '"B"'::jsonb,
    153,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3392) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 5x + 14, what is f(5)?',
    'mcq',
    '{"A": "36", "B": "41", "C": "44", "D": "39"}'::jsonb,
    '"D"'::jsonb,
    154,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (707) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 4 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "60", "B": "72", "C": "64", "D": "128"}'::jsonb,
    '"C"'::jsonb,
    155,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1358) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 12, what is f(5)?',
    'mcq',
    '{"A": "77", "B": "79", "C": "82", "D": "74"}'::jsonb,
    '"A"'::jsonb,
    156,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3234) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "80", "B": "88", "C": "76", "D": "160"}'::jsonb,
    '"A"'::jsonb,
    157,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (601) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 18, what is f(5)?',
    'mcq',
    '{"A": "73", "B": "75", "C": "70", "D": "78"}'::jsonb,
    '"A"'::jsonb,
    158,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.146) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 4 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "72", "B": "60", "C": "64", "D": "128"}'::jsonb,
    '"C"'::jsonb,
    159,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3333) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 10x + 7, what is f(5)?',
    'mcq',
    '{"A": "62", "B": "57", "C": "54", "D": "59"}'::jsonb,
    '"B"'::jsonb,
    160,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (822) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 4 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "128", "B": "72", "C": "60", "D": "64"}'::jsonb,
    '"D"'::jsonb,
    161,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1774) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 8x + 9, what is f(5)?',
    'mcq',
    '{"A": "46", "B": "54", "C": "51", "D": "49"}'::jsonb,
    '"D"'::jsonb,
    162,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3243) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "80", "B": "160", "C": "88", "D": "76"}'::jsonb,
    '"A"'::jsonb,
    163,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (735) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 8x + 11, what is f(5)?',
    'mcq',
    '{"A": "48", "B": "53", "C": "51", "D": "56"}'::jsonb,
    '"C"'::jsonb,
    164,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2081) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "120", "B": "108", "C": "112", "D": "224"}'::jsonb,
    '"C"'::jsonb,
    165,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3333) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 18, what is f(5)?',
    'mcq',
    '{"A": "73", "B": "70", "C": "75", "D": "78"}'::jsonb,
    '"A"'::jsonb,
    166,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (520) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 4 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "60", "B": "128", "C": "72", "D": "64"}'::jsonb,
    '"D"'::jsonb,
    167,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 10x + 10, what is f(5)?',
    'mcq',
    '{"A": "65", "B": "57", "C": "60", "D": "62"}'::jsonb,
    '"C"'::jsonb,
    168,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3627) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "108", "B": "112", "C": "120", "D": "224"}'::jsonb,
    '"B"'::jsonb,
    169,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (649) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 9x + 21, what is f(5)?',
    'mcq',
    '{"A": "63", "B": "71", "C": "66", "D": "68"}'::jsonb,
    '"C"'::jsonb,
    170,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.163) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 4 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "128", "B": "72", "C": "60", "D": "64"}'::jsonb,
    '"D"'::jsonb,
    171,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3245) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 6x + 14, what is f(5)?',
    'mcq',
    '{"A": "44", "B": "41", "C": "49", "D": "46"}'::jsonb,
    '"A"'::jsonb,
    172,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (686) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "108", "B": "112", "C": "120", "D": "224"}'::jsonb,
    '"B"'::jsonb,
    173,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.067) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 7x + 19, what is f(5)?',
    'mcq',
    '{"A": "59", "B": "51", "C": "56", "D": "54"}'::jsonb,
    '"D"'::jsonb,
    174,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3299) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "112", "B": "120", "C": "224", "D": "108"}'::jsonb,
    '"A"'::jsonb,
    175,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (648) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 7x + 13, what is f(5)?',
    'mcq',
    '{"A": "50", "B": "53", "C": "48", "D": "45"}'::jsonb,
    '"C"'::jsonb,
    176,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 4 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "128", "B": "72", "C": "64", "D": "60"}'::jsonb,
    '"C"'::jsonb,
    177,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3186) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 14x + 22, what is f(5)?',
    'mcq',
    '{"A": "97", "B": "89", "C": "92", "D": "94"}'::jsonb,
    '"C"'::jsonb,
    178,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (604) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "160", "B": "88", "C": "76", "D": "80"}'::jsonb,
    '"D"'::jsonb,
    179,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2763) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 8x + 19, what is f(5)?',
    'mcq',
    '{"A": "61", "B": "64", "C": "56", "D": "59"}'::jsonb,
    '"D"'::jsonb,
    180,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3521) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 7x + 12 = 0, what is the larger root?',
    'mcq',
    '{"A": "0", "B": "6", "C": "4", "D": "5"}'::jsonb,
    '"C"'::jsonb,
    181,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (4) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 2 items from 12 distinct items?',
    'mcq',
    '{"A": "63", "B": "66", "C": "59", "D": "74"}'::jsonb,
    '"B"'::jsonb,
    182,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (66) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 77 and standard deviation 22. What is the coefficient of variation? (sd/mean, round to 4 decimals)',
    'mcq',
    '{"A": "0.161", "B": "0.341", "C": "0.2857", "D": "0.23"}'::jsonb,
    '"C"'::jsonb,
    183,
    TRUE,
    'Step 1: Identify the key concept (Quant - DescriptiveStats).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2857) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 7x + 10 = 0, what is the larger root?',
    'mcq',
    '{"A": "3", "B": "5", "C": "1", "D": "4"}'::jsonb,
    '"B"'::jsonb,
    184,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a population of 185, 131 satisfy event B and 73 satisfy both A and B. What is P(A|B)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.454", "B": "0.5573", "C": "0.616", "D": "0.748"}'::jsonb,
    '"B"'::jsonb,
    185,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConditionalProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.5573) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 5 items from 10 distinct items?',
    'mcq',
    '{"A": "252", "B": "248", "C": "216", "D": "180"}'::jsonb,
    '"A"'::jsonb,
    186,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (252) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 80 and standard deviation 5. What is the coefficient of variation? (sd/mean, round to 4 decimals)',
    'mcq',
    '{"A": "0.132", "B": "0.197", "C": "0.261", "D": "0.0625"}'::jsonb,
    '"D"'::jsonb,
    187,
    TRUE,
    'Step 1: Identify the key concept (Quant - DescriptiveStats).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0625) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 17x + 72 = 0, what is the larger root?',
    'mcq',
    '{"A": "11", "B": "9", "C": "7", "D": "12"}'::jsonb,
    '"B"'::jsonb,
    188,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a population of 125, 52 satisfy event B and 21 satisfy both A and B. What is P(A|B)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.527", "B": "0.4038", "C": "0.584", "D": "0.308"}'::jsonb,
    '"B"'::jsonb,
    189,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConditionalProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.4038) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a population of 149, 69 satisfy event B and 21 satisfy both A and B. What is P(A|B)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.23", "B": "0.202", "C": "0.357", "D": "0.3043"}'::jsonb,
    '"D"'::jsonb,
    190,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConditionalProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3043) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 2 items from 7 distinct items?',
    'mcq',
    '{"A": "24", "B": "14", "C": "25", "D": "21"}'::jsonb,
    '"D"'::jsonb,
    191,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (21) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a population of 163, 70 satisfy event B and 21 satisfy both A and B. What is P(A|B)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.438", "B": "0.361", "C": "0.3", "D": "0.471"}'::jsonb,
    '"C"'::jsonb,
    192,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConditionalProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 32 and standard deviation 10. What is the coefficient of variation? (sd/mean, round to 4 decimals)',
    'mcq',
    '{"A": "0.393", "B": "0.3125", "C": "0.409", "D": "0.231"}'::jsonb,
    '"B"'::jsonb,
    193,
    TRUE,
    'Step 1: Identify the key concept (Quant - DescriptiveStats).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3125) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 14x + 48 = 0, what is the larger root?',
    'mcq',
    '{"A": "8", "B": "5", "C": "10", "D": "7"}'::jsonb,
    '"A"'::jsonb,
    194,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a population of 124, 99 satisfy event B and 58 satisfy both A and B. What is P(A|B)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.675", "B": "0.528", "C": "0.476", "D": "0.5859"}'::jsonb,
    '"D"'::jsonb,
    195,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConditionalProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.5859) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 5 items from 8 distinct items?',
    'mcq',
    '{"A": "53", "B": "47", "C": "44", "D": "56"}'::jsonb,
    '"D"'::jsonb,
    196,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (56) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 10x + 24 = 0, what is the larger root?',
    'mcq',
    '{"A": "12", "B": "2", "C": "6", "D": "9"}'::jsonb,
    '"C"'::jsonb,
    197,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 7x + 6 = 0, what is the larger root?',
    'mcq',
    '{"A": "2", "B": "4", "C": "6", "D": "0"}'::jsonb,
    '"C"'::jsonb,
    198,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 12x + 35 = 0, what is the larger root?',
    'mcq',
    '{"A": "7", "B": "11", "C": "1", "D": "4"}'::jsonb,
    '"A"'::jsonb,
    199,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_5(78125) = k, what is k?',
    'mcq',
    '{"A": "9", "B": "8", "C": "4", "D": "7"}'::jsonb,
    '"D"'::jsonb,
    200,
    TRUE,
    'Step 1: Identify the key concept (Quant - LogExp).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a population of 148, 117 satisfy event B and 70 satisfy both A and B. What is P(A|B)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.524", "B": "0.529", "C": "0.5983", "D": "0.677"}'::jsonb,
    '"C"'::jsonb,
    201,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConditionalProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.5983) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_3(27) = k, what is k?',
    'mcq',
    '{"A": "3", "B": "1", "C": "9", "D": "4"}'::jsonb,
    '"A"'::jsonb,
    202,
    TRUE,
    'Step 1: Identify the key concept (Quant - LogExp).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 5 items from 9 distinct items?',
    'mcq',
    '{"A": "131", "B": "124", "C": "126", "D": "118"}'::jsonb,
    '"C"'::jsonb,
    203,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (126) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a population of 113, 79 satisfy event B and 72 satisfy both A and B. What is P(A|B)? (round to 4 decimals)',
    'mcq',
    '{"A": "1.015", "B": "0.771", "C": "0.754", "D": "0.9114"}'::jsonb,
    '"D"'::jsonb,
    204,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConditionalProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.9114) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 2 items from 9 distinct items?',
    'mcq',
    '{"A": "28", "B": "46", "C": "48", "D": "36"}'::jsonb,
    '"D"'::jsonb,
    205,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (36) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 5 items from 12 distinct items?',
    'mcq',
    '{"A": "906", "B": "815", "C": "792", "D": "582"}'::jsonb,
    '"C"'::jsonb,
    206,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (792) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_2(16) = k, what is k?',
    'mcq',
    '{"A": "2", "B": "5", "C": "6", "D": "4"}'::jsonb,
    '"D"'::jsonb,
    207,
    TRUE,
    'Step 1: Identify the key concept (Quant - LogExp).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (4) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 5x + 4 = 0, what is the larger root?',
    'mcq',
    '{"A": "4", "B": "8", "C": "7", "D": "12"}'::jsonb,
    '"A"'::jsonb,
    208,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (4) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 79 and standard deviation 11. What is the coefficient of variation? (sd/mean, round to 4 decimals)',
    'mcq',
    '{"A": "0.307", "B": "0.057", "C": "0.232", "D": "0.1392"}'::jsonb,
    '"D"'::jsonb,
    209,
    TRUE,
    'Step 1: Identify the key concept (Quant - DescriptiveStats).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1392) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 36 and standard deviation 5. What is the coefficient of variation? (sd/mean, round to 4 decimals)',
    'mcq',
    '{"A": "0.29", "B": "0.074", "C": "0.1389", "D": "0.295"}'::jsonb,
    '"C"'::jsonb,
    210,
    TRUE,
    'Step 1: Identify the key concept (Quant - DescriptiveStats).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1389) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 4 items from 12 distinct items?',
    'mcq',
    '{"A": "562", "B": "520", "C": "495", "D": "479"}'::jsonb,
    '"C"'::jsonb,
    211,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (495) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 49 and standard deviation 10. What is the coefficient of variation? (sd/mean, round to 4 decimals)',
    'mcq',
    '{"A": "0.2041", "B": "0.296", "C": "0.075", "D": "0.317"}'::jsonb,
    '"A"'::jsonb,
    212,
    TRUE,
    'Step 1: Identify the key concept (Quant - DescriptiveStats).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2041) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 4 items from 10 distinct items?',
    'mcq',
    '{"A": "210", "B": "172", "C": "258", "D": "194"}'::jsonb,
    '"A"'::jsonb,
    213,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (210) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a population of 147, 68 satisfy event B and 36 satisfy both A and B. What is P(A|B)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.586", "B": "0.5294", "C": "0.395", "D": "0.582"}'::jsonb,
    '"B"'::jsonb,
    214,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConditionalProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.5294) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_5(390625) = k, what is k?',
    'mcq',
    '{"A": "12", "B": "8", "C": "7", "D": "9"}'::jsonb,
    '"B"'::jsonb,
    215,
    TRUE,
    'Step 1: Identify the key concept (Quant - LogExp).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a population of 134, 91 satisfy event B and 59 satisfy both A and B. What is P(A|B)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.699", "B": "0.562", "C": "0.743", "D": "0.6484"}'::jsonb,
    '"D"'::jsonb,
    216,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConditionalProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.6484) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 3 items from 9 distinct items?',
    'mcq',
    '{"A": "102", "B": "84", "C": "81", "D": "80"}'::jsonb,
    '"B"'::jsonb,
    217,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (84) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 3 items from 10 distinct items?',
    'mcq',
    '{"A": "108", "B": "98", "C": "132", "D": "120"}'::jsonb,
    '"D"'::jsonb,
    218,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (120) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 12x + 27 = 0, what is the larger root?',
    'mcq',
    '{"A": "11", "B": "7", "C": "6", "D": "9"}'::jsonb,
    '"D"'::jsonb,
    219,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 15x + 56 = 0, what is the larger root?',
    'mcq',
    '{"A": "4", "B": "10", "C": "2", "D": "8"}'::jsonb,
    '"D"'::jsonb,
    220,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 68 and standard deviation 9. What is the coefficient of variation? (sd/mean, round to 4 decimals)',
    'mcq',
    '{"A": "0.061", "B": "0.068", "C": "0.1324", "D": "0.057"}'::jsonb,
    '"C"'::jsonb,
    221,
    TRUE,
    'Step 1: Identify the key concept (Quant - DescriptiveStats).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1324) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 5x + 6 = 0, what is the larger root?',
    'mcq',
    '{"A": "2", "B": "5", "C": "7", "D": "3"}'::jsonb,
    '"D"'::jsonb,
    222,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 11x + 30 = 0, what is the larger root?',
    'mcq',
    '{"A": "0", "B": "6", "C": "8", "D": "5"}'::jsonb,
    '"B"'::jsonb,
    223,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 13x + 42 = 0, what is the larger root?',
    'mcq',
    '{"A": "15", "B": "5", "C": "7", "D": "11"}'::jsonb,
    '"C"'::jsonb,
    224,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a population of 196, 181 satisfy event B and 133 satisfy both A and B. What is P(A|B)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.7348", "B": "0.617", "C": "0.646", "D": "0.555"}'::jsonb,
    '"A"'::jsonb,
    225,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConditionalProbability).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.7348) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If log_2(8) = k, what is k?',
    'mcq',
    '{"A": "6", "B": "3", "C": "1", "D": "5"}'::jsonb,
    '"B"'::jsonb,
    226,
    TRUE,
    'Step 1: Identify the key concept (Quant - LogExp).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A dataset has mean 71 and standard deviation 17. What is the coefficient of variation? (sd/mean, round to 4 decimals)',
    'mcq',
    '{"A": "0.059", "B": "0.31", "C": "0.132", "D": "0.2394"}'::jsonb,
    '"D"'::jsonb,
    227,
    TRUE,
    'Step 1: Identify the key concept (Quant - DescriptiveStats).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2394) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 9x + 14 = 0, what is the larger root?',
    'mcq',
    '{"A": "10", "B": "6", "C": "3", "D": "7"}'::jsonb,
    '"D"'::jsonb,
    228,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ways to choose 5 items from 11 distinct items?',
    'mcq',
    '{"A": "368", "B": "447", "C": "433", "D": "462"}'::jsonb,
    '"D"'::jsonb,
    229,
    TRUE,
    'Step 1: Identify the key concept (Quant - Combinatorics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (462) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For x^2 - 11x + 24 = 0, what is the larger root?',
    'mcq',
    '{"A": "4", "B": "8", "C": "6", "D": "10"}'::jsonb,
    '"B"'::jsonb,
    230,
    TRUE,
    'Step 1: Identify the key concept (Quant - Quadratics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 7, 14, 28, 49, ?',
    'mcq',
    '{"A": "61", "B": "92", "C": "77", "D": "60"}'::jsonb,
    '"C"'::jsonb,
    231,
    TRUE,
    'Step 1: Identify the key concept (Logic - AdvancedSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (77) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=68, |B|=38, and |A∩B|=14. What is |A∪B|?',
    'mcq',
    '{"A": "128", "B": "110", "C": "120", "D": "92"}'::jsonb,
    '"D"'::jsonb,
    232,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (92) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 12 distinct items?',
    'mcq',
    '{"A": "11880", "B": "10425", "C": "14724", "D": "14998"}'::jsonb,
    '"A"'::jsonb,
    233,
    TRUE,
    'Step 1: Identify the key concept (Logic - Permutations).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (11880) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=67, |B|=30, and |A∩B|=13. What is |A∪B|?',
    'mcq',
    '{"A": "79", "B": "84", "C": "82", "D": "86"}'::jsonb,
    '"B"'::jsonb,
    234,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (84) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=53, |B|=64, and |A∩B|=12. What is |A∪B|?',
    'mcq',
    '{"A": "81", "B": "109", "C": "69", "D": "105"}'::jsonb,
    '"D"'::jsonb,
    235,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (105) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=22 with 0≤x≤12, 0≤y≤9, 0≤z≤11?',
    'mcq',
    '{"A": "65", "B": "63", "C": "25", "D": "74"}'::jsonb,
    '"A"'::jsonb,
    236,
    TRUE,
    'Step 1: Identify the key concept (Logic - LogicConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (65) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 9 distinct items?',
    'mcq',
    '{"A": "562", "B": "481", "C": "504", "D": "514"}'::jsonb,
    '"C"'::jsonb,
    237,
    TRUE,
    'Step 1: Identify the key concept (Logic - Permutations).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (504) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=40, |B|=51, and |A∩B|=24. What is |A∪B|?',
    'mcq',
    '{"A": "67", "B": "47", "C": "77", "D": "62"}'::jsonb,
    '"A"'::jsonb,
    238,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (67) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=63, |B|=48, and |A∩B|=23. What is |A∪B|?',
    'mcq',
    '{"A": "48", "B": "96", "C": "88", "D": "70"}'::jsonb,
    '"C"'::jsonb,
    239,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (88) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=17 with 0≤x≤10, 0≤y≤9, 0≤z≤11?',
    'mcq',
    '{"A": "52", "B": "134", "C": "88", "D": "86"}'::jsonb,
    '"D"'::jsonb,
    240,
    TRUE,
    'Step 1: Identify the key concept (Logic - LogicConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (86) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 7, 12, 22, 37, ?',
    'mcq',
    '{"A": "60", "B": "43", "C": "39", "D": "57"}'::jsonb,
    '"D"'::jsonb,
    241,
    TRUE,
    'Step 1: Identify the key concept (Logic - AdvancedSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (57) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 7, 16, 34, 61, ?',
    'mcq',
    '{"A": "95", "B": "85", "C": "117", "D": "97"}'::jsonb,
    '"D"'::jsonb,
    242,
    TRUE,
    'Step 1: Identify the key concept (Logic - AdvancedSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (97) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=18 with 0≤x≤11, 0≤y≤8, 0≤z≤8?',
    'mcq',
    '{"A": "79", "B": "53", "C": "41", "D": "63"}'::jsonb,
    '"B"'::jsonb,
    243,
    TRUE,
    'Step 1: Identify the key concept (Logic - LogicConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (53) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=46, |B|=42, and |A∩B|=33. What is |A∪B|?',
    'mcq',
    '{"A": "77", "B": "55", "C": "60", "D": "17"}'::jsonb,
    '"B"'::jsonb,
    244,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (55) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=79, |B|=49, and |A∩B|=19. What is |A∪B|?',
    'mcq',
    '{"A": "103", "B": "87", "C": "147", "D": "109"}'::jsonb,
    '"D"'::jsonb,
    245,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (109) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=48, |B|=51, and |A∩B|=40. What is |A∪B|?',
    'mcq',
    '{"A": "29", "B": "43", "C": "59", "D": "83"}'::jsonb,
    '"C"'::jsonb,
    246,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (59) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 14, 20, 32, 50, ?',
    'mcq',
    '{"A": "87", "B": "84", "C": "74", "D": "38"}'::jsonb,
    '"C"'::jsonb,
    247,
    TRUE,
    'Step 1: Identify the key concept (Logic - AdvancedSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (74) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 6, 15, 33, 60, ?',
    'mcq',
    '{"A": "96", "B": "105", "C": "130", "D": "85"}'::jsonb,
    '"A"'::jsonb,
    248,
    TRUE,
    'Step 1: Identify the key concept (Logic - AdvancedSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (96) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=64, |B|=44, and |A∩B|=26. What is |A∪B|?',
    'mcq',
    '{"A": "108", "B": "82", "C": "58", "D": "66"}'::jsonb,
    '"B"'::jsonb,
    249,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (82) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤10, 0≤y≤10, 0≤z≤8?',
    'mcq',
    '{"A": "6", "B": "16", "C": "2", "D": "9"}'::jsonb,
    '"A"'::jsonb,
    250,
    TRUE,
    'Step 1: Identify the key concept (Logic - LogicConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=51, |B|=63, and |A∩B|=35. What is |A∪B|?',
    'mcq',
    '{"A": "69", "B": "65", "C": "59", "D": "79"}'::jsonb,
    '"D"'::jsonb,
    251,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (79) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 13, 22, 40, 67, ?',
    'mcq',
    '{"A": "75", "B": "98", "C": "91", "D": "103"}'::jsonb,
    '"D"'::jsonb,
    252,
    TRUE,
    'Step 1: Identify the key concept (Logic - AdvancedSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (103) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 12, 17, 27, 42, ?',
    'mcq',
    '{"A": "42", "B": "62", "C": "54", "D": "44"}'::jsonb,
    '"B"'::jsonb,
    253,
    TRUE,
    'Step 1: Identify the key concept (Logic - AdvancedSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (62) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 14, 18, 26, 38, ?',
    'mcq',
    '{"A": "32", "B": "67", "C": "54", "D": "42"}'::jsonb,
    '"C"'::jsonb,
    254,
    TRUE,
    'Step 1: Identify the key concept (Logic - AdvancedSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (54) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=79, |B|=47, and |A∩B|=35. What is |A∪B|?',
    'mcq',
    '{"A": "91", "B": "77", "C": "103", "D": "55"}'::jsonb,
    '"A"'::jsonb,
    255,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (91) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=45, |B|=68, and |A∩B|=11. What is |A∪B|?',
    'mcq',
    '{"A": "82", "B": "102", "C": "76", "D": "142"}'::jsonb,
    '"B"'::jsonb,
    256,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (102) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=52, |B|=32, and |A∩B|=26. What is |A∪B|?',
    'mcq',
    '{"A": "78", "B": "62", "C": "75", "D": "58"}'::jsonb,
    '"D"'::jsonb,
    257,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (58) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=21 with 0≤x≤12, 0≤y≤10, 0≤z≤10?',
    'mcq',
    '{"A": "95", "B": "76", "C": "52", "D": "59"}'::jsonb,
    '"B"'::jsonb,
    258,
    TRUE,
    'Step 1: Identify the key concept (Logic - LogicConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (76) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=62, |B|=47, and |A∩B|=24. What is |A∪B|?',
    'mcq',
    '{"A": "55", "B": "66", "C": "105", "D": "85"}'::jsonb,
    '"D"'::jsonb,
    259,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (85) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=61, |B|=37, and |A∩B|=26. What is |A∪B|?',
    'mcq',
    '{"A": "72", "B": "42", "C": "34", "D": "90"}'::jsonb,
    '"A"'::jsonb,
    260,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (72) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=17 with 0≤x≤9, 0≤y≤7, 0≤z≤10?',
    'mcq',
    '{"A": "30", "B": "52", "C": "40", "D": "60"}'::jsonb,
    '"B"'::jsonb,
    261,
    TRUE,
    'Step 1: Identify the key concept (Logic - LogicConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (52) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 14, 19, 29, 44, ?',
    'mcq',
    '{"A": "96", "B": "64", "C": "76", "D": "73"}'::jsonb,
    '"B"'::jsonb,
    262,
    TRUE,
    'Step 1: Identify the key concept (Logic - AdvancedSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (64) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 13, 19, 31, 49, ?',
    'mcq',
    '{"A": "51", "B": "85", "C": "73", "D": "55"}'::jsonb,
    '"C"'::jsonb,
    263,
    TRUE,
    'Step 1: Identify the key concept (Logic - AdvancedSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (73) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=63, |B|=41, and |A∩B|=25. What is |A∪B|?',
    'mcq',
    '{"A": "79", "B": "55", "C": "107", "D": "93"}'::jsonb,
    '"A"'::jsonb,
    264,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (79) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=16 with 0≤x≤8, 0≤y≤10, 0≤z≤10?',
    'mcq',
    '{"A": "66", "B": "75", "C": "107", "D": "85"}'::jsonb,
    '"B"'::jsonb,
    265,
    TRUE,
    'Step 1: Identify the key concept (Logic - LogicConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (75) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 11, 20, 38, 65, ?',
    'mcq',
    '{"A": "101", "B": "108", "C": "121", "D": "79"}'::jsonb,
    '"A"'::jsonb,
    266,
    TRUE,
    'Step 1: Identify the key concept (Logic - AdvancedSeries).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (101) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=57, |B|=68, and |A∩B|=51. What is |A∪B|?',
    'mcq',
    '{"A": "74", "B": "100", "C": "104", "D": "36"}'::jsonb,
    '"A"'::jsonb,
    267,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (74) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=45, |B|=43, and |A∩B|=15. What is |A∪B|?',
    'mcq',
    '{"A": "69", "B": "57", "C": "60", "D": "73"}'::jsonb,
    '"D"'::jsonb,
    268,
    TRUE,
    'Step 1: Identify the key concept (Logic - SetCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (73) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=20 with 0≤x≤8, 0≤y≤8, 0≤z≤12?',
    'mcq',
    '{"A": "39", "B": "50", "C": "45", "D": "25"}'::jsonb,
    '"C"'::jsonb,
    269,
    TRUE,
    'Step 1: Identify the key concept (Logic - LogicConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=24 with 0≤x≤9, 0≤y≤11, 0≤z≤10?',
    'mcq',
    '{"A": "8", "B": "31", "C": "28", "D": "6"}'::jsonb,
    '"C"'::jsonb,
    270,
    TRUE,
    'Step 1: Identify the key concept (Logic - LogicConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (28) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.131, risk-free=0.05, volatility=0.165. (round to 3 decimals)',
    'mcq',
    '{"A": "0.357", "B": "0.567", "C": "0.426", "D": "0.491"}'::jsonb,
    '"D"'::jsonb,
    271,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.491) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.192, risk-free=0.05, volatility=0.249. (round to 3 decimals)',
    'mcq',
    '{"A": "0.64", "B": "0.57", "C": "0.75", "D": "0.451"}'::jsonb,
    '"B"'::jsonb,
    272,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.57) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Decision yields payoff 19908 with probability 0.61 else 12046. What is EV?',
    'mcq',
    '{"A": "16717.919", "B": "17326.384", "C": "16841.82", "D": "17012.698"}'::jsonb,
    '"C"'::jsonb,
    273,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DecisionTreeEV).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (16841.82) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.178, risk-free=0.05, volatility=0.223. (round to 3 decimals)',
    'mcq',
    '{"A": "0.515", "B": "0.574", "C": "0.64", "D": "0.522"}'::jsonb,
    '"B"'::jsonb,
    274,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.574) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A KPI changes from 59 to 64. What is proportional change Δ/base? (round to 4 decimals)',
    'mcq',
    '{"A": "0.151", "B": "0.234", "C": "-0.0", "D": "0.0847"}'::jsonb,
    '"D"'::jsonb,
    275,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Sensitivity).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0847) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.194, risk-free=0.05, volatility=0.307. (round to 3 decimals)',
    'mcq',
    '{"A": "0.407", "B": "0.469", "C": "0.331", "D": "0.525"}'::jsonb,
    '"B"'::jsonb,
    276,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.469) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.175, risk-free=0.05, volatility=0.178. (round to 3 decimals)',
    'mcq',
    '{"A": "0.827", "B": "0.702", "C": "0.615", "D": "0.636"}'::jsonb,
    '"B"'::jsonb,
    277,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.702) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A KPI changes from 95 to 110. What is proportional change Δ/base? (round to 4 decimals)',
    'mcq',
    '{"A": "0.259", "B": "0.068", "C": "0.1579", "D": "0.242"}'::jsonb,
    '"C"'::jsonb,
    278,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Sensitivity).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1579) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.21, risk-free=0.05, volatility=0.349. (round to 3 decimals)',
    'mcq',
    '{"A": "0.373", "B": "0.458", "C": "0.526", "D": "0.377"}'::jsonb,
    '"B"'::jsonb,
    279,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.458) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.193, risk-free=0.05, volatility=0.21. (round to 3 decimals)',
    'mcq',
    '{"A": "0.681", "B": "0.562", "C": "0.618", "D": "0.749"}'::jsonb,
    '"A"'::jsonb,
    280,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.681) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A KPI changes from 112 to 122. What is proportional change Δ/base? (round to 4 decimals)',
    'mcq',
    '{"A": "0.244", "B": "0.183", "C": "0.263", "D": "0.0893"}'::jsonb,
    '"D"'::jsonb,
    281,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Sensitivity).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0893) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.144, risk-free=0.05, volatility=0.294. (round to 3 decimals)',
    'mcq',
    '{"A": "0.395", "B": "0.32", "C": "0.508", "D": "0.409"}'::jsonb,
    '"B"'::jsonb,
    282,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.32) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A KPI changes from 107 to 127. What is proportional change Δ/base? (round to 4 decimals)',
    'mcq',
    '{"A": "0.275", "B": "0.348", "C": "0.328", "D": "0.1869"}'::jsonb,
    '"D"'::jsonb,
    283,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Sensitivity).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1869) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A KPI changes from 65 to 73. What is proportional change Δ/base? (round to 4 decimals)',
    'mcq',
    '{"A": "0.049", "B": "0.02", "C": "0.289", "D": "0.1231"}'::jsonb,
    '"D"'::jsonb,
    284,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Sensitivity).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1231) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Decision yields payoff 19577 with probability 0.5 else 3310. What is EV?',
    'mcq',
    '{"A": "11443.5", "B": "11226.88", "C": "11303.056", "D": "11196.883"}'::jsonb,
    '"A"'::jsonb,
    285,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DecisionTreeEV).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (11443.5) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A KPI changes from 106 to 114. What is proportional change Δ/base? (round to 4 decimals)',
    'mcq',
    '{"A": "0.0755", "B": "0.152", "C": "0.135", "D": "0.131"}'::jsonb,
    '"A"'::jsonb,
    286,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Sensitivity).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0755) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.174, risk-free=0.05, volatility=0.276. (round to 3 decimals)',
    'mcq',
    '{"A": "0.449", "B": "0.604", "C": "0.507", "D": "0.378"}'::jsonb,
    '"A"'::jsonb,
    287,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.449) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.198, risk-free=0.05, volatility=0.203. (round to 3 decimals)',
    'mcq',
    '{"A": "0.729", "B": "0.867", "C": "0.892", "D": "0.809"}'::jsonb,
    '"A"'::jsonb,
    288,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.729) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.163, risk-free=0.05, volatility=0.229. (round to 3 decimals)',
    'mcq',
    '{"A": "0.543", "B": "0.692", "C": "0.614", "D": "0.493"}'::jsonb,
    '"D"'::jsonb,
    289,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.493) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Decision yields payoff 5618 with probability 0.36 else 9542. What is EV?',
    'mcq',
    '{"A": "8269.233", "B": "8129.36", "C": "8236.089", "D": "8208.893"}'::jsonb,
    '"B"'::jsonb,
    290,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DecisionTreeEV).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8129.36) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Decision yields payoff 12905 with probability 0.43 else 4832. What is EV?',
    'mcq',
    '{"A": "8156.881", "B": "8660.569", "C": "8303.39", "D": "8280.871"}'::jsonb,
    '"C"'::jsonb,
    291,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DecisionTreeEV).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8303.39) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A KPI changes from 69 to 74. What is proportional change Δ/base? (round to 4 decimals)',
    'mcq',
    '{"A": "0.139", "B": "0.02", "C": "0.0725", "D": "0.138"}'::jsonb,
    '"C"'::jsonb,
    292,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Sensitivity).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0725) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Decision yields payoff 12076 with probability 0.34 else 6747. What is EV?',
    'mcq',
    '{"A": "8558.86", "B": "8416.077", "C": "8794.781", "D": "8519.16"}'::jsonb,
    '"A"'::jsonb,
    293,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DecisionTreeEV).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8558.86) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A KPI changes from 57 to 77. What is proportional change Δ/base? (round to 4 decimals)',
    'mcq',
    '{"A": "0.195", "B": "0.429", "C": "0.3509", "D": "0.421"}'::jsonb,
    '"C"'::jsonb,
    294,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Sensitivity).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3509) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A KPI changes from 54 to 72. What is proportional change Δ/base? (round to 4 decimals)',
    'mcq',
    '{"A": "0.452", "B": "0.476", "C": "0.3333", "D": "0.254"}'::jsonb,
    '"C"'::jsonb,
    295,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Sensitivity).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3333) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Decision yields payoff 5735 with probability 0.36 else 5825. What is EV?',
    'mcq',
    '{"A": "5758.844", "B": "5792.6", "C": "5745.76", "D": "5912.491"}'::jsonb,
    '"B"'::jsonb,
    296,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DecisionTreeEV).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5792.6) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Compute Sharpe ratio given return=0.177, risk-free=0.05, volatility=0.128. (round to 3 decimals)',
    'mcq',
    '{"A": "0.919", "B": "0.992", "C": "1.112", "D": "1.059"}'::jsonb,
    '"B"'::jsonb,
    297,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RiskAdjustedReturn).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.992) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Decision yields payoff 13631 with probability 0.66 else 2712. What is EV?',
    'mcq',
    '{"A": "10089.02", "B": "9918.54", "C": "9902.567", "D": "9841.866"}'::jsonb,
    '"B"'::jsonb,
    298,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DecisionTreeEV).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9918.54) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A KPI changes from 42 to 56. What is proportional change Δ/base? (round to 4 decimals)',
    'mcq',
    '{"A": "0.147", "B": "0.3333", "C": "0.258", "D": "0.21"}'::jsonb,
    '"B"'::jsonb,
    299,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Sensitivity).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3333) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Decision yields payoff 5352 with probability 0.67 else 2651. What is EV?',
    'mcq',
    '{"A": "4609.181", "B": "4260.462", "C": "4237.34", "D": "4460.67"}'::jsonb,
    '"D"'::jsonb,
    300,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DecisionTreeEV).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (4460.67) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 2, "time_target_sec": 63}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "88", "B": "76", "C": "160", "D": "80"}'::jsonb,
    '"D"'::jsonb,
    301,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (787) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 10x + 14, what is f(6)?',
    'mcq',
    '{"A": "79", "B": "76", "C": "74", "D": "71"}'::jsonb,
    '"C"'::jsonb,
    302,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1005) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "128", "B": "136", "C": "124", "D": "256"}'::jsonb,
    '"A"'::jsonb,
    303,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3306) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 18, what is f(6)?',
    'mcq',
    '{"A": "93", "B": "98", "C": "101", "D": "96"}'::jsonb,
    '"D"'::jsonb,
    304,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (636) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "160", "B": "88", "C": "76", "D": "80"}'::jsonb,
    '"D"'::jsonb,
    305,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1655) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 14x + 16, what is f(6)?',
    'mcq',
    '{"A": "97", "B": "100", "C": "105", "D": "102"}'::jsonb,
    '"B"'::jsonb,
    306,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3494) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 6 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "104", "B": "96", "C": "192", "D": "92"}'::jsonb,
    '"B"'::jsonb,
    307,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (680) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 17, what is f(6)?',
    'mcq',
    '{"A": "100", "B": "97", "C": "92", "D": "95"}'::jsonb,
    '"D"'::jsonb,
    308,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1976) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "76", "B": "80", "C": "88", "D": "160"}'::jsonb,
    '"B"'::jsonb,
    309,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3276) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 7x + 12, what is f(6)?',
    'mcq',
    '{"A": "59", "B": "54", "C": "56", "D": "51"}'::jsonb,
    '"B"'::jsonb,
    310,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (795) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "112", "B": "120", "C": "108", "D": "224"}'::jsonb,
    '"A"'::jsonb,
    311,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0806) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 14x + 23, what is f(6)?',
    'mcq',
    '{"A": "109", "B": "112", "C": "107", "D": "104"}'::jsonb,
    '"C"'::jsonb,
    312,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3494) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "256", "B": "136", "C": "128", "D": "124"}'::jsonb,
    '"C"'::jsonb,
    313,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (826) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 12, what is f(6)?',
    'mcq',
    '{"A": "83", "B": "80", "C": "78", "D": "75"}'::jsonb,
    '"C"'::jsonb,
    314,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1969) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "256", "B": "124", "C": "136", "D": "128"}'::jsonb,
    '"D"'::jsonb,
    315,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3479) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 8x + 9, what is f(6)?',
    'mcq',
    '{"A": "59", "B": "57", "C": "62", "D": "54"}'::jsonb,
    '"B"'::jsonb,
    316,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (765) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "124", "B": "136", "C": "128", "D": "256"}'::jsonb,
    '"C"'::jsonb,
    317,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2667) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 9, what is f(6)?',
    'mcq',
    '{"A": "77", "B": "80", "C": "75", "D": "72"}'::jsonb,
    '"C"'::jsonb,
    318,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3201) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "80", "B": "160", "C": "88", "D": "76"}'::jsonb,
    '"A"'::jsonb,
    319,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (652) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 15x + 12, what is f(6)?',
    'mcq',
    '{"A": "107", "B": "99", "C": "102", "D": "104"}'::jsonb,
    '"C"'::jsonb,
    320,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2207) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "124", "B": "256", "C": "136", "D": "128"}'::jsonb,
    '"D"'::jsonb,
    321,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3278) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 12x + 15, what is f(6)?',
    'mcq',
    '{"A": "89", "B": "92", "C": "87", "D": "84"}'::jsonb,
    '"C"'::jsonb,
    322,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (699) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "124", "B": "136", "C": "256", "D": "128"}'::jsonb,
    '"D"'::jsonb,
    323,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2966) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 9x + 22, what is f(6)?',
    'mcq',
    '{"A": "81", "B": "76", "C": "78", "D": "73"}'::jsonb,
    '"B"'::jsonb,
    324,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3304) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 6 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "192", "B": "104", "C": "92", "D": "96"}'::jsonb,
    '"D"'::jsonb,
    325,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (923) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 12x + 18, what is f(6)?',
    'mcq',
    '{"A": "95", "B": "92", "C": "90", "D": "87"}'::jsonb,
    '"C"'::jsonb,
    326,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2656) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "112", "B": "224", "C": "108", "D": "120"}'::jsonb,
    '"A"'::jsonb,
    327,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3497) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 6x + 11, what is f(6)?',
    'mcq',
    '{"A": "52", "B": "49", "C": "47", "D": "44"}'::jsonb,
    '"C"'::jsonb,
    328,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (704) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 5 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "88", "B": "160", "C": "76", "D": "80"}'::jsonb,
    '"D"'::jsonb,
    329,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2579) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 18, what is f(6)?',
    'mcq',
    '{"A": "86", "B": "84", "C": "81", "D": "89"}'::jsonb,
    '"B"'::jsonb,
    330,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3453) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A test has sensitivity 0.95 and specificity 0.9. Prevalence is 0.01. What is P(Disease | Positive)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.188", "B": "0.034", "C": "0.272", "D": "0.0876"}'::jsonb,
    '"D"'::jsonb,
    331,
    TRUE,
    'Step 1: Identify the key concept (Quant - Bayes).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0876) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A test has sensitivity 0.9 and specificity 0.95. Prevalence is 0.1. What is P(Disease | Positive)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.5", "B": "0.6667", "C": "0.738", "D": "0.553"}'::jsonb,
    '"B"'::jsonb,
    332,
    TRUE,
    'Step 1: Identify the key concept (Quant - Bayes).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.6667) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -1x^2 + 6x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "3.0", "B": "2.684", "C": "3.149", "D": "3.147"}'::jsonb,
    '"A"'::jsonb,
    333,
    TRUE,
    'Step 1: Identify the key concept (Quant - Optimization).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A discrete variable X takes values 0,1,2 with probabilities 0.3,0.5,0.2. What is E[X]? (round to 3 decimals)',
    'mcq',
    '{"A": "0.745", "B": "0.9", "C": "0.969", "D": "0.782"}'::jsonb,
    '"B"'::jsonb,
    334,
    TRUE,
    'Step 1: Identify the key concept (Quant - DiscreteRandomVar).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A discrete variable X takes values 0,1,2 with probabilities 0.3,0.4,0.3. What is E[X]? (round to 3 decimals)',
    'mcq',
    '{"A": "1.157", "B": "1.0", "C": "1.193", "D": "0.948"}'::jsonb,
    '"B"'::jsonb,
    335,
    TRUE,
    'Step 1: Identify the key concept (Quant - DiscreteRandomVar).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A line passes through (4,38) and (10,58). What is its slope? (round to 3 decimals)',
    'mcq',
    '{"A": "3.605", "B": "3.333", "C": "3.559", "D": "3.24"}'::jsonb,
    '"B"'::jsonb,
    336,
    TRUE,
    'Step 1: Identify the key concept (Quant - RegressionBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3.333) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A discrete variable X takes values 0,1,2 with probabilities 0.2,0.5,0.3. What is E[X]? (round to 3 decimals)',
    'mcq',
    '{"A": "1.0", "B": "1.044", "C": "1.1", "D": "1.036"}'::jsonb,
    '"C"'::jsonb,
    337,
    TRUE,
    'Step 1: Identify the key concept (Quant - DiscreteRandomVar).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.1) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[1,1],[4,5]].',
    'mcq',
    '{"A": "6", "B": "7", "C": "9", "D": "1"}'::jsonb,
    '"D"'::jsonb,
    338,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A line passes through (4,17) and (9,43). What is its slope? (round to 3 decimals)',
    'mcq',
    '{"A": "5.363", "B": "5.2", "C": "5.037", "D": "5.316"}'::jsonb,
    '"B"'::jsonb,
    339,
    TRUE,
    'Step 1: Identify the key concept (Quant - RegressionBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5.2) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A discrete variable X takes values 0,1,2 with probabilities 0.2,0.4,0.4. What is E[X]? (round to 3 decimals)',
    'mcq',
    '{"A": "1.032", "B": "1.274", "C": "1.2", "D": "1.047"}'::jsonb,
    '"C"'::jsonb,
    340,
    TRUE,
    'Step 1: Identify the key concept (Quant - DiscreteRandomVar).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.2) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[1,5],[2,5]].',
    'mcq',
    '{"A": "9", "B": "-5", "C": "7", "D": "-10"}'::jsonb,
    '"B"'::jsonb,
    341,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-5) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A discrete variable X takes values 0,1,2 with probabilities 0.4,0.3,0.3. What is E[X]? (round to 3 decimals)',
    'mcq',
    '{"A": "0.815", "B": "0.954", "C": "0.969", "D": "0.9"}'::jsonb,
    '"D"'::jsonb,
    342,
    TRUE,
    'Step 1: Identify the key concept (Quant - DiscreteRandomVar).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A line passes through (3,32) and (8,58). What is its slope? (round to 3 decimals)',
    'mcq',
    '{"A": "5.111", "B": "5.2", "C": "5.531", "D": "5.108"}'::jsonb,
    '"B"'::jsonb,
    343,
    TRUE,
    'Step 1: Identify the key concept (Quant - RegressionBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5.2) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -4x^2 + 6x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "0.75", "B": "0.892", "C": "0.603", "D": "0.874"}'::jsonb,
    '"A"'::jsonb,
    344,
    TRUE,
    'Step 1: Identify the key concept (Quant - Optimization).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.75) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A test has sensitivity 0.85 and specificity 0.9. Prevalence is 0.01. What is P(Disease | Positive)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.206", "B": "0.0791", "C": "0.174", "D": "0.186"}'::jsonb,
    '"B"'::jsonb,
    345,
    TRUE,
    'Step 1: Identify the key concept (Quant - Bayes).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0791) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A line passes through (4,37) and (9,65). What is its slope? (round to 3 decimals)',
    'mcq',
    '{"A": "5.385", "B": "5.433", "C": "5.6", "D": "5.469"}'::jsonb,
    '"C"'::jsonb,
    346,
    TRUE,
    'Step 1: Identify the key concept (Quant - RegressionBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5.6) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[3,2],[0,5]].',
    'mcq',
    '{"A": "19", "B": "13", "C": "15", "D": "31"}'::jsonb,
    '"C"'::jsonb,
    347,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (15) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A line passes through (1,33) and (6,44). What is its slope? (round to 3 decimals)',
    'mcq',
    '{"A": "2.2", "B": "2.254", "C": "2.271", "D": "2.077"}'::jsonb,
    '"A"'::jsonb,
    348,
    TRUE,
    'Step 1: Identify the key concept (Quant - RegressionBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2.2) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[3,0],[3,6]].',
    'mcq',
    '{"A": "26", "B": "14", "C": "20", "D": "18"}'::jsonb,
    '"D"'::jsonb,
    349,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (18) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[2,5],[1,6]].',
    'mcq',
    '{"A": "7", "B": "8", "C": "3", "D": "9"}'::jsonb,
    '"A"'::jsonb,
    350,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A discrete variable X takes values 0,1,2 with probabilities 0.2,0.3,0.5. What is E[X]? (round to 3 decimals)',
    'mcq',
    '{"A": "1.3", "B": "1.211", "C": "1.19", "D": "1.206"}'::jsonb,
    '"A"'::jsonb,
    351,
    TRUE,
    'Step 1: Identify the key concept (Quant - DiscreteRandomVar).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.3) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A test has sensitivity 0.95 and specificity 0.95. Prevalence is 0.1. What is P(Disease | Positive)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.793", "B": "0.526", "C": "0.6786", "D": "0.763"}'::jsonb,
    '"C"'::jsonb,
    352,
    TRUE,
    'Step 1: Identify the key concept (Quant - Bayes).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.6786) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[3,3],[0,3]].',
    'mcq',
    '{"A": "15", "B": "9", "C": "13", "D": "7"}'::jsonb,
    '"B"'::jsonb,
    353,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -6x^2 + 19x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.708", "B": "1.432", "C": "1.583", "D": "1.699"}'::jsonb,
    '"C"'::jsonb,
    354,
    TRUE,
    'Step 1: Identify the key concept (Quant - Optimization).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.583) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A line passes through (1,33) and (3,39). What is its slope? (round to 3 decimals)',
    'mcq',
    '{"A": "3.0", "B": "2.926", "C": "2.877", "D": "3.189"}'::jsonb,
    '"A"'::jsonb,
    355,
    TRUE,
    'Step 1: Identify the key concept (Quant - RegressionBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A test has sensitivity 0.85 and specificity 0.95. Prevalence is 0.02. What is P(Disease | Positive)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.326", "B": "0.319", "C": "0.344", "D": "0.2576"}'::jsonb,
    '"D"'::jsonb,
    356,
    TRUE,
    'Step 1: Identify the key concept (Quant - Bayes).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2576) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A discrete variable X takes values 0,1,2 with probabilities 0.3,0.3,0.4. What is E[X]? (round to 3 decimals)',
    'mcq',
    '{"A": "1.263", "B": "1.1", "C": "1.169", "D": "1.173"}'::jsonb,
    '"B"'::jsonb,
    357,
    TRUE,
    'Step 1: Identify the key concept (Quant - DiscreteRandomVar).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.1) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -1x^2 + 18x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "9.183", "B": "9.0", "C": "9.119", "D": "9.164"}'::jsonb,
    '"B"'::jsonb,
    358,
    TRUE,
    'Step 1: Identify the key concept (Quant - Optimization).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -5x^2 + 19x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.9", "B": "2.06", "C": "1.796", "D": "2.251"}'::jsonb,
    '"A"'::jsonb,
    359,
    TRUE,
    'Step 1: Identify the key concept (Quant - Optimization).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -5x^2 + 4x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "0.4", "B": "0.288", "C": "0.287", "D": "0.24"}'::jsonb,
    '"A"'::jsonb,
    360,
    TRUE,
    'Step 1: Identify the key concept (Quant - Optimization).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.4) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A line passes through (4,12) and (7,34). What is its slope? (round to 3 decimals)',
    'mcq',
    '{"A": "7.007", "B": "7.437", "C": "7.333", "D": "7.525"}'::jsonb,
    '"C"'::jsonb,
    361,
    TRUE,
    'Step 1: Identify the key concept (Quant - RegressionBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7.333) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A discrete variable X takes values 0,1,2 with probabilities 0.4,0.5,0.1. What is E[X]? (round to 3 decimals)',
    'mcq',
    '{"A": "0.7", "B": "0.513", "C": "0.773", "D": "0.598"}'::jsonb,
    '"A"'::jsonb,
    362,
    TRUE,
    'Step 1: Identify the key concept (Quant - DiscreteRandomVar).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.7) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[4,2],[4,6]].',
    'mcq',
    '{"A": "18", "B": "16", "C": "30", "D": "12"}'::jsonb,
    '"B"'::jsonb,
    363,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (16) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[1,2],[3,4]].',
    'mcq',
    '{"A": "-6", "B": "0", "C": "4", "D": "-2"}'::jsonb,
    '"D"'::jsonb,
    364,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-2) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A test has sensitivity 0.95 and specificity 0.97. Prevalence is 0.05. What is P(Disease | Positive)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.625", "B": "0.554", "C": "0.731", "D": "0.552"}'::jsonb,
    '"A"'::jsonb,
    365,
    TRUE,
    'Step 1: Identify the key concept (Quant - Bayes).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.625) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[2,0],[0,4]].',
    'mcq',
    '{"A": "10", "B": "15", "C": "8", "D": "3"}'::jsonb,
    '"C"'::jsonb,
    366,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[3,5],[4,4]].',
    'mcq',
    '{"A": "-16", "B": "-20", "C": "-8", "D": "-14"}'::jsonb,
    '"C"'::jsonb,
    367,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -4x^2 + 15x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "1.875", "B": "1.993", "C": "1.679", "D": "2.02"}'::jsonb,
    '"A"'::jsonb,
    368,
    TRUE,
    'Step 1: Identify the key concept (Quant - Optimization).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.875) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = -2x^2 + 11x + 1, at what x is f(x) maximized? (round to 3 decimals)',
    'mcq',
    '{"A": "2.478", "B": "2.75", "C": "2.839", "D": "2.885"}'::jsonb,
    '"B"'::jsonb,
    369,
    TRUE,
    'Step 1: Identify the key concept (Quant - Optimization).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2.75) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A test has sensitivity 0.95 and specificity 0.9. Prevalence is 0.1. What is P(Disease | Positive)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.437", "B": "0.5135", "C": "0.61", "D": "0.321"}'::jsonb,
    '"B"'::jsonb,
    370,
    TRUE,
    'Step 1: Identify the key concept (Quant - Bayes).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.5135) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A test has sensitivity 0.9 and specificity 0.95. Prevalence is 0.05. What is P(Disease | Positive)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.585", "B": "0.307", "C": "0.4865", "D": "0.42"}'::jsonb,
    '"C"'::jsonb,
    371,
    TRUE,
    'Step 1: Identify the key concept (Quant - Bayes).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.4865) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A line passes through (5,24) and (8,40). What is its slope? (round to 3 decimals)',
    'mcq',
    '{"A": "5.474", "B": "5.471", "C": "5.269", "D": "5.333"}'::jsonb,
    '"D"'::jsonb,
    372,
    TRUE,
    'Step 1: Identify the key concept (Quant - RegressionBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5.333) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[5,1],[3,4]].',
    'mcq',
    '{"A": "27", "B": "5", "C": "17", "D": "11"}'::jsonb,
    '"C"'::jsonb,
    373,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (17) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A line passes through (4,19) and (9,29). What is its slope? (round to 3 decimals)',
    'mcq',
    '{"A": "1.929", "B": "1.681", "C": "1.658", "D": "2.0"}'::jsonb,
    '"D"'::jsonb,
    374,
    TRUE,
    'Step 1: Identify the key concept (Quant - RegressionBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[5,0],[0,4]].',
    'mcq',
    '{"A": "20", "B": "28", "C": "34", "D": "27"}'::jsonb,
    '"A"'::jsonb,
    375,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (20) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A line passes through (2,39) and (7,66). What is its slope? (round to 3 decimals)',
    'mcq',
    '{"A": "5.253", "B": "5.276", "C": "5.536", "D": "5.4"}'::jsonb,
    '"D"'::jsonb,
    376,
    TRUE,
    'Step 1: Identify the key concept (Quant - RegressionBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5.4) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A line passes through (1,26) and (5,54). What is its slope? (round to 3 decimals)',
    'mcq',
    '{"A": "6.926", "B": "6.856", "C": "7.0", "D": "7.273"}'::jsonb,
    '"C"'::jsonb,
    377,
    TRUE,
    'Step 1: Identify the key concept (Quant - RegressionBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A test has sensitivity 0.9 and specificity 0.95. Prevalence is 0.01. What is P(Disease | Positive)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.1538", "B": "0.077", "C": "0.242", "D": "0.229"}'::jsonb,
    '"A"'::jsonb,
    378,
    TRUE,
    'Step 1: Identify the key concept (Quant - Bayes).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1538) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the determinant of matrix [[5,2],[1,5]].',
    'mcq',
    '{"A": "33", "B": "23", "C": "24", "D": "7"}'::jsonb,
    '"B"'::jsonb,
    379,
    TRUE,
    'Step 1: Identify the key concept (Quant - Matrices).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (23) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A test has sensitivity 0.85 and specificity 0.95. Prevalence is 0.05. What is P(Disease | Positive)? (round to 4 decimals)',
    'mcq',
    '{"A": "0.421", "B": "0.589", "C": "0.4722", "D": "0.661"}'::jsonb,
    '"C"'::jsonb,
    380,
    TRUE,
    'Step 1: Identify the key concept (Quant - Bayes).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.4722) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=45, |B|=57, and |A∩B|=32. What is |A∪B|?',
    'mcq',
    '{"A": "70", "B": "68", "C": "56", "D": "66"}'::jsonb,
    '"A"'::jsonb,
    381,
    TRUE,
    'Step 1: Identify the key concept (Logic - InclusionExclusion).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (70) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=20 with 0≤x≤10, 0≤y≤8, 0≤z≤8?',
    'mcq',
    '{"A": "38", "B": "23", "C": "26", "D": "28"}'::jsonb,
    '"D"'::jsonb,
    382,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (28) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence defined by a0=5, a1=4, and a(n)=a(n-1)+a(n-2). What is a4?',
    'mcq',
    '{"A": "13", "B": "36", "C": "22", "D": "28"}'::jsonb,
    '"C"'::jsonb,
    383,
    TRUE,
    'Step 1: Identify the key concept (Logic - Recurrences).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (22) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=74, |B|=30, and |A∩B|=13. What is |A∪B|?',
    'mcq',
    '{"A": "91", "B": "77", "C": "103", "D": "76"}'::jsonb,
    '"A"'::jsonb,
    384,
    TRUE,
    'Step 1: Identify the key concept (Logic - InclusionExclusion).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (91) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many edges are in a complete graph with 13 vertices?',
    'mcq',
    '{"A": "67", "B": "78", "C": "95", "D": "63"}'::jsonb,
    '"B"'::jsonb,
    385,
    TRUE,
    'Step 1: Identify the key concept (Logic - GraphCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (78) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=20 with 0≤x≤11, 0≤y≤10, 0≤z≤11?',
    'mcq',
    '{"A": "86", "B": "70", "C": "126", "D": "42"}'::jsonb,
    '"A"'::jsonb,
    386,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (86) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=29 with 0≤x≤10, 0≤y≤9, 0≤z≤8?',
    'mcq',
    '{"A": "0", "B": "10", "C": "2", "D": "6"}'::jsonb,
    '"A"'::jsonb,
    387,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence defined by a0=2, a1=5, and a(n)=a(n-1)+a(n-2). What is a4?',
    'mcq',
    '{"A": "9", "B": "19", "C": "27", "D": "17"}'::jsonb,
    '"B"'::jsonb,
    388,
    TRUE,
    'Step 1: Identify the key concept (Logic - Recurrences).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (19) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many edges are in a complete graph with 8 vertices?',
    'mcq',
    '{"A": "54", "B": "8", "C": "28", "D": "38"}'::jsonb,
    '"C"'::jsonb,
    389,
    TRUE,
    'Step 1: Identify the key concept (Logic - GraphCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (28) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤12, 0≤y≤10, 0≤z≤12?',
    'mcq',
    '{"A": "41", "B": "37", "C": "34", "D": "45"}'::jsonb,
    '"D"'::jsonb,
    390,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=27 with 0≤x≤9, 0≤y≤12, 0≤z≤8?',
    'mcq',
    '{"A": "26", "B": "20", "C": "6", "D": "16"}'::jsonb,
    '"C"'::jsonb,
    391,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=55, |B|=45, and |A∩B|=30. What is |A∪B|?',
    'mcq',
    '{"A": "70", "B": "76", "C": "78", "D": "60"}'::jsonb,
    '"A"'::jsonb,
    392,
    TRUE,
    'Step 1: Identify the key concept (Logic - InclusionExclusion).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (70) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=23 with 0≤x≤8, 0≤y≤13, 0≤z≤11?',
    'mcq',
    '{"A": "43", "B": "28", "C": "56", "D": "54"}'::jsonb,
    '"D"'::jsonb,
    393,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (54) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence defined by a0=2, a1=6, and a(n)=a(n-1)+a(n-2). What is a4?',
    'mcq',
    '{"A": "32", "B": "22", "C": "14", "D": "29"}'::jsonb,
    '"B"'::jsonb,
    394,
    TRUE,
    'Step 1: Identify the key concept (Logic - Recurrences).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (22) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=79, |B|=35, and |A∩B|=28. What is |A∪B|?',
    'mcq',
    '{"A": "77", "B": "94", "C": "48", "D": "86"}'::jsonb,
    '"D"'::jsonb,
    395,
    TRUE,
    'Step 1: Identify the key concept (Logic - InclusionExclusion).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (86) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence defined by a0=4, a1=6, and a(n)=a(n-1)+a(n-2). What is a4?',
    'mcq',
    '{"A": "12", "B": "26", "C": "32", "D": "16"}'::jsonb,
    '"B"'::jsonb,
    396,
    TRUE,
    'Step 1: Identify the key concept (Logic - Recurrences).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (26) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=23 with 0≤x≤13, 0≤y≤12, 0≤z≤12?',
    'mcq',
    '{"A": "85", "B": "143", "C": "113", "D": "139"}'::jsonb,
    '"C"'::jsonb,
    397,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (113) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=66, |B|=47, and |A∩B|=28. What is |A∪B|?',
    'mcq',
    '{"A": "98", "B": "85", "C": "105", "D": "97"}'::jsonb,
    '"B"'::jsonb,
    398,
    TRUE,
    'Step 1: Identify the key concept (Logic - InclusionExclusion).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (85) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤12, 0≤y≤11, 0≤z≤11?',
    'mcq',
    '{"A": "47", "B": "40", "C": "57", "D": "45"}'::jsonb,
    '"D"'::jsonb,
    399,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=19 with 0≤x≤8, 0≤y≤8, 0≤z≤10?',
    'mcq',
    '{"A": "36", "B": "22", "C": "50", "D": "56"}'::jsonb,
    '"A"'::jsonb,
    400,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (36) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many edges are in a complete graph with 11 vertices?',
    'mcq',
    '{"A": "39", "B": "55", "C": "47", "D": "93"}'::jsonb,
    '"B"'::jsonb,
    401,
    TRUE,
    'Step 1: Identify the key concept (Logic - GraphCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (55) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=49, |B|=36, and |A∩B|=15. What is |A∪B|?',
    'mcq',
    '{"A": "40", "B": "84", "C": "61", "D": "70"}'::jsonb,
    '"D"'::jsonb,
    402,
    TRUE,
    'Step 1: Identify the key concept (Logic - InclusionExclusion).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (70) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤13, 0≤y≤9, 0≤z≤10?',
    'mcq',
    '{"A": "28", "B": "23", "C": "44", "D": "34"}'::jsonb,
    '"A"'::jsonb,
    403,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (28) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence defined by a0=5, a1=5, and a(n)=a(n-1)+a(n-2). What is a4?',
    'mcq',
    '{"A": "35", "B": "25", "C": "10", "D": "34"}'::jsonb,
    '"B"'::jsonb,
    404,
    TRUE,
    'Step 1: Identify the key concept (Logic - Recurrences).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (25) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence defined by a0=1, a1=3, and a(n)=a(n-1)+a(n-2). What is a4?',
    'mcq',
    '{"A": "11", "B": "25", "C": "16", "D": "33"}'::jsonb,
    '"A"'::jsonb,
    405,
    TRUE,
    'Step 1: Identify the key concept (Logic - Recurrences).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (11) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=25 with 0≤x≤10, 0≤y≤13, 0≤z≤11?',
    'mcq',
    '{"A": "55", "B": "59", "C": "31", "D": "46"}'::jsonb,
    '"A"'::jsonb,
    406,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (55) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=29 with 0≤x≤9, 0≤y≤8, 0≤z≤11?',
    'mcq',
    '{"A": "0", "B": "2", "C": "8", "D": "4"}'::jsonb,
    '"A"'::jsonb,
    407,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=77, |B|=50, and |A∩B|=28. What is |A∪B|?',
    'mcq',
    '{"A": "92", "B": "99", "C": "87", "D": "127"}'::jsonb,
    '"B"'::jsonb,
    408,
    TRUE,
    'Step 1: Identify the key concept (Logic - InclusionExclusion).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (99) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=45, |B|=59, and |A∩B|=16. What is |A∪B|?',
    'mcq',
    '{"A": "97", "B": "84", "C": "88", "D": "48"}'::jsonb,
    '"C"'::jsonb,
    409,
    TRUE,
    'Step 1: Identify the key concept (Logic - InclusionExclusion).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (88) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many edges are in a complete graph with 7 vertices?',
    'mcq',
    '{"A": "21", "B": "25", "C": "28", "D": "39"}'::jsonb,
    '"A"'::jsonb,
    410,
    TRUE,
    'Step 1: Identify the key concept (Logic - GraphCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (21) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a group, |A|=63, |B|=67, and |A∩B|=53. What is |A∪B|?',
    'mcq',
    '{"A": "77", "B": "75", "C": "62", "D": "87"}'::jsonb,
    '"A"'::jsonb,
    411,
    TRUE,
    'Step 1: Identify the key concept (Logic - InclusionExclusion).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (77) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence defined by a0=1, a1=2, and a(n)=a(n-1)+a(n-2). What is a4?',
    'mcq',
    '{"A": "10", "B": "24", "C": "23", "D": "8"}'::jsonb,
    '"D"'::jsonb,
    412,
    TRUE,
    'Step 1: Identify the key concept (Logic - Recurrences).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many edges are in a complete graph with 9 vertices?',
    'mcq',
    '{"A": "46", "B": "36", "C": "44", "D": "2"}'::jsonb,
    '"B"'::jsonb,
    413,
    TRUE,
    'Step 1: Identify the key concept (Logic - GraphCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (36) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence defined by a0=4, a1=4, and a(n)=a(n-1)+a(n-2). What is a4?',
    'mcq',
    '{"A": "20", "B": "50", "C": "40", "D": "38"}'::jsonb,
    '"A"'::jsonb,
    414,
    TRUE,
    'Step 1: Identify the key concept (Logic - Recurrences).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (20) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=19 with 0≤x≤9, 0≤y≤9, 0≤z≤8?',
    'mcq',
    '{"A": "34", "B": "40", "C": "41", "D": "36"}'::jsonb,
    '"D"'::jsonb,
    415,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (36) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=24 with 0≤x≤13, 0≤y≤12, 0≤z≤11?',
    'mcq',
    '{"A": "94", "B": "60", "C": "98", "D": "90"}'::jsonb,
    '"D"'::jsonb,
    416,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (90) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence defined by a0=5, a1=6, and a(n)=a(n-1)+a(n-2). What is a4?',
    'mcq',
    '{"A": "28", "B": "24", "C": "37", "D": "21"}'::jsonb,
    '"A"'::jsonb,
    417,
    TRUE,
    'Step 1: Identify the key concept (Logic - Recurrences).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (28) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many edges are in a complete graph with 10 vertices?',
    'mcq',
    '{"A": "56", "B": "33", "C": "44", "D": "45"}'::jsonb,
    '"D"'::jsonb,
    418,
    TRUE,
    'Step 1: Identify the key concept (Logic - GraphCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=23 with 0≤x≤13, 0≤y≤12, 0≤z≤9?',
    'mcq',
    '{"A": "43", "B": "87", "C": "75", "D": "63"}'::jsonb,
    '"C"'::jsonb,
    419,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (75) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=24 with 0≤x≤12, 0≤y≤9, 0≤z≤11?',
    'mcq',
    '{"A": "45", "B": "49", "C": "31", "D": "60"}'::jsonb,
    '"A"'::jsonb,
    420,
    TRUE,
    'Step 1: Identify the key concept (Logic - PuzzlesNumeric).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two-asset portfolio: weight w=0.38 in asset1 (return 0.178) and (1-w) in asset2 (return 0.122). What is expected return? (round to 4 decimals)',
    'mcq',
    '{"A": "0.208", "B": "0.065", "C": "0.296", "D": "0.1433"}'::jsonb,
    '"D"'::jsonb,
    421,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Portfolio).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1433) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 7x + 7y ≤ 62, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "3", "B": "8", "C": "7", "D": "16"}'::jsonb,
    '"B"'::jsonb,
    422,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two-asset portfolio: weight w=0.55 in asset1 (return 0.115) and (1-w) in asset2 (return 0.12). What is expected return? (round to 4 decimals)',
    'mcq',
    '{"A": "0.28", "B": "0.1173", "C": "0.057", "D": "0.184"}'::jsonb,
    '"B"'::jsonb,
    423,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Portfolio).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1173) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Posterior P(state)=computed from prior 0.1, sens=0.9, spec=0.95. Action yields benefit 51268 if state true, costs 12539 regardless. Compute expected net value. (round to 2 decimals)',
    'mcq',
    '{"A": "20532.749", "B": "21639.67", "C": "22124.22", "D": "20534.579"}'::jsonb,
    '"B"'::jsonb,
    424,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BayesDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (21639.67) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 3x + 3y ≤ 53, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "9", "B": "17", "C": "13", "D": "25"}'::jsonb,
    '"B"'::jsonb,
    425,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (17) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Posterior P(state)=computed from prior 0.32, sens=0.9, spec=0.95. Action yields benefit 49180 if state true, costs 12947 regardless. Compute expected net value. (round to 2 decimals)',
    'mcq',
    '{"A": "31508.282", "B": "30285.644", "C": "30568.279", "D": "31040.08"}'::jsonb,
    '"D"'::jsonb,
    426,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BayesDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (31040.08) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two-asset portfolio: weight w=0.71 in asset1 (return 0.148) and (1-w) in asset2 (return 0.112). What is expected return? (round to 4 decimals)',
    'mcq',
    '{"A": "0.034", "B": "0.293", "C": "0.076", "D": "0.1376"}'::jsonb,
    '"D"'::jsonb,
    427,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Portfolio).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1376) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two-asset portfolio: weight w=0.73 in asset1 (return 0.074) and (1-w) in asset2 (return 0.115). What is expected return? (round to 4 decimals)',
    'mcq',
    '{"A": "0.0851", "B": "0.0", "C": "0.143", "D": "0.147"}'::jsonb,
    '"A"'::jsonb,
    428,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Portfolio).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0851) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two-asset portfolio: weight w=0.78 in asset1 (return 0.16) and (1-w) in asset2 (return 0.121). What is expected return? (round to 4 decimals)',
    'mcq',
    '{"A": "0.241", "B": "0.067", "C": "0.1514", "D": "0.314"}'::jsonb,
    '"C"'::jsonb,
    429,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Portfolio).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1514) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two-asset portfolio: weight w=0.77 in asset1 (return 0.119) and (1-w) in asset2 (return 0.068). What is expected return? (round to 4 decimals)',
    'mcq',
    '{"A": "0.029", "B": "0.1073", "C": "0.175", "D": "0.243"}'::jsonb,
    '"B"'::jsonb,
    430,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Portfolio).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1073) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 3x + 4y ≤ 75, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "25", "B": "17", "C": "19", "D": "35"}'::jsonb,
    '"A"'::jsonb,
    431,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (25) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two-asset portfolio: weight w=0.78 in asset1 (return 0.151) and (1-w) in asset2 (return 0.157). What is expected return? (round to 4 decimals)',
    'mcq',
    '{"A": "0.228", "B": "0.061", "C": "0.063", "D": "0.1523"}'::jsonb,
    '"D"'::jsonb,
    432,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Portfolio).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1523) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 5x + 4y ≤ 49, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "21", "B": "6", "C": "9", "D": "1"}'::jsonb,
    '"C"'::jsonb,
    433,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 3x + 4y ≤ 57, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "13", "B": "7", "C": "25", "D": "19"}'::jsonb,
    '"D"'::jsonb,
    434,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (19) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 8x + 8y ≤ 41, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "5", "B": "9", "C": "13", "D": "4"}'::jsonb,
    '"A"'::jsonb,
    435,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 7x + 5y ≤ 76, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "4", "B": "10", "C": "20", "D": "12"}'::jsonb,
    '"B"'::jsonb,
    436,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (10) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 6x + 10y ≤ 84, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "22", "B": "2", "C": "12", "D": "14"}'::jsonb,
    '"D"'::jsonb,
    437,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (14) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Posterior P(state)=computed from prior 0.25, sens=0.9, spec=0.95. Action yields benefit 40463 if state true, costs 13541 regardless. Compute expected net value. (round to 2 decimals)',
    'mcq',
    '{"A": "21141.57", "B": "21179.142", "C": "21414.17", "D": "21527.79"}'::jsonb,
    '"A"'::jsonb,
    438,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BayesDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (21141.57) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 6x + 8y ≤ 47, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "5", "B": "7", "C": "23", "D": "6"}'::jsonb,
    '"B"'::jsonb,
    439,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 6x + 5y ≤ 85, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "21", "B": "14", "C": "18", "D": "22"}'::jsonb,
    '"B"'::jsonb,
    440,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (14) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Posterior P(state)=computed from prior 0.12, sens=0.9, spec=0.95. Action yields benefit 28523 if state true, costs 12802 regardless. Compute expected net value. (round to 2 decimals)',
    'mcq',
    '{"A": "7464.34", "B": "6873.406", "C": "7292.473", "D": "6523.116"}'::jsonb,
    '"A"'::jsonb,
    441,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BayesDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7464.34) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two-asset portfolio: weight w=0.64 in asset1 (return 0.11) and (1-w) in asset2 (return 0.06). What is expected return? (round to 4 decimals)',
    'mcq',
    '{"A": "0.166", "B": "0.178", "C": "0.286", "D": "0.092"}'::jsonb,
    '"D"'::jsonb,
    442,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Portfolio).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.092) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Posterior P(state)=computed from prior 0.26, sens=0.9, spec=0.95. Action yields benefit 27716 if state true, costs 11086 regardless. Compute expected net value. (round to 2 decimals)',
    'mcq',
    '{"A": "12360.614", "B": "12845.9", "C": "12868.331", "D": "13333.849"}'::jsonb,
    '"B"'::jsonb,
    443,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BayesDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (12845.9) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Posterior P(state)=computed from prior 0.15, sens=0.9, spec=0.95. Action yields benefit 52033 if state true, costs 5034 regardless. Compute expected net value. (round to 2 decimals)',
    'mcq',
    '{"A": "34736.202", "B": "35208.568", "C": "34540.39", "D": "34486.292"}'::jsonb,
    '"C"'::jsonb,
    444,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BayesDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (34540.39) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Posterior P(state)=computed from prior 0.33, sens=0.9, spec=0.95. Action yields benefit 53080 if state true, costs 15427 regardless. Compute expected net value. (round to 2 decimals)',
    'mcq',
    '{"A": "31535.178", "B": "33658.896", "C": "32806.523", "D": "32272.73"}'::jsonb,
    '"D"'::jsonb,
    445,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BayesDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (32272.73) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 2x + 10y ≤ 87, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "43", "B": "38", "C": "45", "D": "40"}'::jsonb,
    '"A"'::jsonb,
    446,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (43) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Posterior P(state)=computed from prior 0.3, sens=0.9, spec=0.95. Action yields benefit 54855 if state true, costs 7944 regardless. Compute expected net value. (round to 2 decimals)',
    'mcq',
    '{"A": "41245.576", "B": "42155.967", "C": "39288.638", "D": "40616.16"}'::jsonb,
    '"D"'::jsonb,
    447,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BayesDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (40616.16) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two-asset portfolio: weight w=0.46 in asset1 (return 0.11) and (1-w) in asset2 (return 0.143). What is expected return? (round to 4 decimals)',
    'mcq',
    '{"A": "0.073", "B": "0.282", "C": "0.1278", "D": "0.26"}'::jsonb,
    '"C"'::jsonb,
    448,
    TRUE,
    'Step 1: Identify the key concept (CritThink - Portfolio).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1278) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize integer x subject to 3x + 3y ≤ 79, x,y≥0 integers. What is maximum x?',
    'mcq',
    '{"A": "26", "B": "16", "C": "25", "D": "32"}'::jsonb,
    '"A"'::jsonb,
    449,
    TRUE,
    'Step 1: Identify the key concept (CritThink - LinearTradeoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (26) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Posterior P(state)=computed from prior 0.12, sens=0.9, spec=0.95. Action yields benefit 35703 if state true, costs 17322 regardless. Compute expected net value. (round to 2 decimals)',
    'mcq',
    '{"A": "8045.92", "B": "9564.896", "C": "8523.544", "D": "7257.102"}'::jsonb,
    '"A"'::jsonb,
    450,
    TRUE,
    'Step 1: Identify the key concept (CritThink - BayesDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8045.92) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 3, "time_target_sec": 81}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 9 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "140", "B": "144", "C": "152", "D": "288"}'::jsonb,
    '"B"'::jsonb,
    451,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (934) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 9, what is f(7)?',
    'mcq',
    '{"A": "100", "B": "97", "C": "105", "D": "102"}'::jsonb,
    '"A"'::jsonb,
    452,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1553) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 6 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "96", "B": "192", "C": "104", "D": "92"}'::jsonb,
    '"A"'::jsonb,
    453,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3303) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 8x + 18, what is f(7)?',
    'mcq',
    '{"A": "74", "B": "76", "C": "79", "D": "71"}'::jsonb,
    '"A"'::jsonb,
    454,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (928) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "128", "B": "256", "C": "124", "D": "136"}'::jsonb,
    '"A"'::jsonb,
    455,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1845) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 15x + 13, what is f(7)?',
    'mcq',
    '{"A": "118", "B": "115", "C": "123", "D": "120"}'::jsonb,
    '"A"'::jsonb,
    456,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3338) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "120", "B": "112", "C": "224", "D": "108"}'::jsonb,
    '"B"'::jsonb,
    457,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (885) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 18, what is f(7)?',
    'mcq',
    '{"A": "95", "B": "92", "C": "100", "D": "97"}'::jsonb,
    '"A"'::jsonb,
    458,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1756) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 9 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "140", "B": "144", "C": "288", "D": "152"}'::jsonb,
    '"B"'::jsonb,
    459,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3297) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 15x + 24, what is f(7)?',
    'mcq',
    '{"A": "134", "B": "129", "C": "126", "D": "131"}'::jsonb,
    '"B"'::jsonb,
    460,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (772) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "256", "B": "136", "C": "128", "D": "124"}'::jsonb,
    '"C"'::jsonb,
    461,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.092) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 16, what is f(7)?',
    'mcq',
    '{"A": "98", "B": "90", "C": "93", "D": "95"}'::jsonb,
    '"C"'::jsonb,
    462,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3626) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 6 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "92", "B": "96", "C": "104", "D": "192"}'::jsonb,
    '"B"'::jsonb,
    463,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (952) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 14x + 22, what is f(7)?',
    'mcq',
    '{"A": "120", "B": "125", "C": "117", "D": "122"}'::jsonb,
    '"A"'::jsonb,
    464,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1286) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 9 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "288", "B": "140", "C": "144", "D": "152"}'::jsonb,
    '"C"'::jsonb,
    465,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3553) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 7x + 12, what is f(7)?',
    'mcq',
    '{"A": "63", "B": "58", "C": "61", "D": "66"}'::jsonb,
    '"C"'::jsonb,
    466,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (998) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 9 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "288", "B": "152", "C": "140", "D": "144"}'::jsonb,
    '"D"'::jsonb,
    467,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1369) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 8x + 23, what is f(7)?',
    'mcq',
    '{"A": "79", "B": "76", "C": "84", "D": "81"}'::jsonb,
    '"A"'::jsonb,
    468,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3333) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 9 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "144", "B": "288", "C": "140", "D": "152"}'::jsonb,
    '"A"'::jsonb,
    469,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1100) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 9x + 24, what is f(7)?',
    'mcq',
    '{"A": "84", "B": "87", "C": "89", "D": "92"}'::jsonb,
    '"B"'::jsonb,
    470,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2087) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "256", "B": "128", "C": "124", "D": "136"}'::jsonb,
    '"B"'::jsonb,
    471,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.344) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 23, what is f(7)?',
    'mcq',
    '{"A": "105", "B": "102", "C": "97", "D": "100"}'::jsonb,
    '"D"'::jsonb,
    472,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (684) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "112", "B": "120", "C": "224", "D": "108"}'::jsonb,
    '"A"'::jsonb,
    473,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2733) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 15x + 11, what is f(7)?',
    'mcq',
    '{"A": "121", "B": "113", "C": "116", "D": "118"}'::jsonb,
    '"C"'::jsonb,
    474,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3244) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 9 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "152", "B": "144", "C": "140", "D": "288"}'::jsonb,
    '"B"'::jsonb,
    475,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (947) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 8x + 22, what is f(7)?',
    'mcq',
    '{"A": "78", "B": "75", "C": "80", "D": "83"}'::jsonb,
    '"A"'::jsonb,
    476,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1898) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 9 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "140", "B": "288", "C": "152", "D": "144"}'::jsonb,
    '"D"'::jsonb,
    477,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3294) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 9, what is f(7)?',
    'mcq',
    '{"A": "97", "B": "100", "C": "102", "D": "105"}'::jsonb,
    '"B"'::jsonb,
    478,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (885) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "128", "B": "136", "C": "256", "D": "124"}'::jsonb,
    '"A"'::jsonb,
    479,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2564) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 15x + 16, what is f(7)?',
    'mcq',
    '{"A": "118", "B": "123", "C": "121", "D": "126"}'::jsonb,
    '"C"'::jsonb,
    480,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.337) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 4 and 2. What is the largest eigenvalue?',
    'mcq',
    '{"A": "2", "B": "6", "C": "0", "D": "4"}'::jsonb,
    '"D"'::jsonb,
    481,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (4) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 7 and 2. What is the largest eigenvalue?',
    'mcq',
    '{"A": "11", "B": "3", "C": "5", "D": "7"}'::jsonb,
    '"D"'::jsonb,
    482,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 37, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "342.969", "B": "342.25", "C": "341.348", "D": "338.96"}'::jsonb,
    '"B"'::jsonb,
    483,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (342.25) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-state Markov chain has P(1→1)=0.62 and P(2→1)=0.22. If the chain starts in state 1, what is P(in state 1 after 1 step)?',
    'mcq',
    '{"A": "0.429", "B": "0.547", "C": "0.801", "D": "0.62"}'::jsonb,
    '"D"'::jsonb,
    484,
    TRUE,
    'Step 1: Identify the key concept (Quant - MarkovBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.62) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a z-test: x̄=54, μ0=54, σ=4, n=49. Compute z = (x̄-μ0)/(σ/√n). (round to 3 decimals)',
    'mcq',
    '{"A": "0.119", "B": "0.182", "C": "0.086", "D": "0.0"}'::jsonb,
    '"D"'::jsonb,
    485,
    TRUE,
    'Step 1: Identify the key concept (Quant - HypothesisTest).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For standard normal Z, approximate P(Z < 1.00).',
    'mcq',
    '{"A": "0.992", "B": "0.8413", "C": "0.953", "D": "0.787"}'::jsonb,
    '"B"'::jsonb,
    486,
    TRUE,
    'Step 1: Identify the key concept (Quant - ContinuousDistributions).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.8413) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 3 and 9. What is the largest eigenvalue?',
    'mcq',
    '{"A": "13", "B": "17", "C": "5", "D": "9"}'::jsonb,
    '"D"'::jsonb,
    487,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-state Markov chain has P(1→1)=0.75 and P(2→1)=0.12. If the chain starts in state 1, what is P(in state 1 after 1 step)?',
    'mcq',
    '{"A": "0.579", "B": "0.864", "C": "0.75", "D": "0.827"}'::jsonb,
    '"C"'::jsonb,
    488,
    TRUE,
    'Step 1: Identify the key concept (Quant - MarkovBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.75) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 32, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "256.0", "B": "256.117", "C": "254.319", "D": "255.088"}'::jsonb,
    '"A"'::jsonb,
    489,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (256.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-state Markov chain has P(1→1)=0.83 and P(2→1)=0.38. If the chain starts in state 1, what is P(in state 1 after 1 step)?',
    'mcq',
    '{"A": "0.899", "B": "0.77", "C": "0.83", "D": "0.759"}'::jsonb,
    '"C"'::jsonb,
    490,
    TRUE,
    'Step 1: Identify the key concept (Quant - MarkovBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.83) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 33, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "272.25", "B": "271.499", "C": "274.349", "D": "272.929"}'::jsonb,
    '"A"'::jsonb,
    491,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (272.25) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 7 and 7. What is the largest eigenvalue?',
    'mcq',
    '{"A": "5", "B": "7", "C": "3", "D": "15"}'::jsonb,
    '"B"'::jsonb,
    492,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 23, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "130.283", "B": "132.25", "C": "130.974", "D": "133.689"}'::jsonb,
    '"B"'::jsonb,
    493,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (132.25) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 20, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "100.0", "B": "100.784", "C": "99.818", "D": "96.086"}'::jsonb,
    '"A"'::jsonb,
    494,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (100.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 10, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "23.473", "B": "23.695", "C": "23.748", "D": "25.0"}'::jsonb,
    '"D"'::jsonb,
    495,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (25.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 30, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "225.624", "B": "225.0", "C": "227.983", "D": "224.752"}'::jsonb,
    '"B"'::jsonb,
    496,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (225.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 14, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "49.0", "B": "49.229", "C": "48.489", "D": "47.238"}'::jsonb,
    '"A"'::jsonb,
    497,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (49.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a z-test: x̄=52, μ0=54, σ=5, n=64. Compute z = (x̄-μ0)/(σ/√n). (round to 3 decimals)',
    'mcq',
    '{"A": "-3.36", "B": "-3.2", "C": "-3.09", "D": "-3.076"}'::jsonb,
    '"B"'::jsonb,
    498,
    TRUE,
    'Step 1: Identify the key concept (Quant - HypothesisTest).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-3.2) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 36, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "323.117", "B": "320.18", "C": "324.0", "D": "323.823"}'::jsonb,
    '"C"'::jsonb,
    499,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (324.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-state Markov chain has P(1→1)=0.69 and P(2→1)=0.18. If the chain starts in state 1, what is P(in state 1 after 1 step)?',
    'mcq',
    '{"A": "0.744", "B": "0.776", "C": "0.69", "D": "0.534"}'::jsonb,
    '"C"'::jsonb,
    500,
    TRUE,
    'Step 1: Identify the key concept (Quant - MarkovBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.69) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a z-test: x̄=55, μ0=53, σ=5, n=49. Compute z = (x̄-μ0)/(σ/√n). (round to 3 decimals)',
    'mcq',
    '{"A": "2.654", "B": "2.8", "C": "3.015", "D": "3.191"}'::jsonb,
    '"B"'::jsonb,
    501,
    TRUE,
    'Step 1: Identify the key concept (Quant - HypothesisTest).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2.8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-state Markov chain has P(1→1)=0.89 and P(2→1)=0.33. If the chain starts in state 1, what is P(in state 1 after 1 step)?',
    'mcq',
    '{"A": "1.053", "B": "1.065", "C": "0.739", "D": "0.89"}'::jsonb,
    '"D"'::jsonb,
    502,
    TRUE,
    'Step 1: Identify the key concept (Quant - MarkovBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.89) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-state Markov chain has P(1→1)=0.61 and P(2→1)=0.34. If the chain starts in state 1, what is P(in state 1 after 1 step)?',
    'mcq',
    '{"A": "0.484", "B": "0.61", "C": "0.695", "D": "0.528"}'::jsonb,
    '"B"'::jsonb,
    503,
    TRUE,
    'Step 1: Identify the key concept (Quant - MarkovBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.61) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 3 and 3. What is the largest eigenvalue?',
    'mcq',
    '{"A": "11", "B": "3", "C": "7", "D": "4"}'::jsonb,
    '"B"'::jsonb,
    504,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 3 and 7. What is the largest eigenvalue?',
    'mcq',
    '{"A": "4", "B": "3", "C": "7", "D": "11"}'::jsonb,
    '"C"'::jsonb,
    505,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 26, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "170.156", "B": "165.201", "C": "168.588", "D": "169.0"}'::jsonb,
    '"D"'::jsonb,
    506,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (169.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 5 and 2. What is the largest eigenvalue?',
    'mcq',
    '{"A": "11", "B": "9", "C": "13", "D": "5"}'::jsonb,
    '"D"'::jsonb,
    507,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 2 and 9. What is the largest eigenvalue?',
    'mcq',
    '{"A": "8", "B": "13", "C": "9", "D": "12"}'::jsonb,
    '"C"'::jsonb,
    508,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a z-test: x̄=48, μ0=52, σ=4, n=64. Compute z = (x̄-μ0)/(σ/√n). (round to 3 decimals)',
    'mcq',
    '{"A": "-8.0", "B": "-8.198", "C": "-8.11", "D": "-8.17"}'::jsonb,
    '"A"'::jsonb,
    509,
    TRUE,
    'Step 1: Identify the key concept (Quant - HypothesisTest).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-8.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-state Markov chain has P(1→1)=0.69 and P(2→1)=0.16. If the chain starts in state 1, what is P(in state 1 after 1 step)?',
    'mcq',
    '{"A": "0.56", "B": "0.69", "C": "0.634", "D": "0.633"}'::jsonb,
    '"B"'::jsonb,
    510,
    TRUE,
    'Step 1: Identify the key concept (Quant - MarkovBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.69) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 15, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "54.731", "B": "56.25", "C": "56.975", "D": "55.994"}'::jsonb,
    '"B"'::jsonb,
    511,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (56.25) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 4 and 9. What is the largest eigenvalue?',
    'mcq',
    '{"A": "3", "B": "9", "C": "11", "D": "7"}'::jsonb,
    '"B"'::jsonb,
    512,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (9) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a z-test: x̄=49, μ0=50, σ=4, n=49. Compute z = (x̄-μ0)/(σ/√n). (round to 3 decimals)',
    'mcq',
    '{"A": "-1.75", "B": "-1.614", "C": "-1.589", "D": "-1.912"}'::jsonb,
    '"A"'::jsonb,
    513,
    TRUE,
    'Step 1: Identify the key concept (Quant - HypothesisTest).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-1.75) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-state Markov chain has P(1→1)=0.89 and P(2→1)=0.2. If the chain starts in state 1, what is P(in state 1 after 1 step)?',
    'mcq',
    '{"A": "0.966", "B": "0.89", "C": "0.958", "D": "0.835"}'::jsonb,
    '"B"'::jsonb,
    514,
    TRUE,
    'Step 1: Identify the key concept (Quant - MarkovBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.89) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-state Markov chain has P(1→1)=0.8 and P(2→1)=0.14. If the chain starts in state 1, what is P(in state 1 after 1 step)?',
    'mcq',
    '{"A": "0.8", "B": "0.736", "C": "0.96", "D": "0.725"}'::jsonb,
    '"A"'::jsonb,
    515,
    TRUE,
    'Step 1: Identify the key concept (Quant - MarkovBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-state Markov chain has P(1→1)=0.62 and P(2→1)=0.34. If the chain starts in state 1, what is P(in state 1 after 1 step)?',
    'mcq',
    '{"A": "0.62", "B": "0.535", "C": "0.712", "D": "0.678"}'::jsonb,
    '"A"'::jsonb,
    516,
    TRUE,
    'Step 1: Identify the key concept (Quant - MarkovBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.62) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 8 and 7. What is the largest eigenvalue?',
    'mcq',
    '{"A": "4", "B": "8", "C": "0", "D": "2"}'::jsonb,
    '"B"'::jsonb,
    517,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a z-test: x̄=50, μ0=51, σ=4, n=64. Compute z = (x̄-μ0)/(σ/√n). (round to 3 decimals)',
    'mcq',
    '{"A": "-2.0", "B": "-1.848", "C": "-2.104", "D": "-2.079"}'::jsonb,
    '"A"'::jsonb,
    518,
    TRUE,
    'Step 1: Identify the key concept (Quant - HypothesisTest).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-2.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 40, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "397.455", "B": "400.305", "C": "400.0", "D": "401.207"}'::jsonb,
    '"C"'::jsonb,
    519,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (400.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a z-test: x̄=48, μ0=50, σ=4, n=36. Compute z = (x̄-μ0)/(σ/√n). (round to 3 decimals)',
    'mcq',
    '{"A": "-3.107", "B": "-2.932", "C": "-3.091", "D": "-3.0"}'::jsonb,
    '"D"'::jsonb,
    520,
    TRUE,
    'Step 1: Identify the key concept (Quant - HypothesisTest).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-3.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 3 and 5. What is the largest eigenvalue?',
    'mcq',
    '{"A": "3", "B": "5", "C": "6", "D": "13"}'::jsonb,
    '"B"'::jsonb,
    521,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 19, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "89.605", "B": "90.25", "C": "87.579", "D": "90.53"}'::jsonb,
    '"B"'::jsonb,
    522,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (90.25) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 2 and 5. What is the largest eigenvalue?',
    'mcq',
    '{"A": "9", "B": "7", "C": "6", "D": "5"}'::jsonb,
    '"D"'::jsonb,
    523,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 6 and 6. What is the largest eigenvalue?',
    'mcq',
    '{"A": "10", "B": "8", "C": "6", "D": "4"}'::jsonb,
    '"C"'::jsonb,
    524,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A diagonal matrix has diagonal entries 6 and 3. What is the largest eigenvalue?',
    'mcq',
    '{"A": "12", "B": "6", "C": "8", "D": "4"}'::jsonb,
    '"B"'::jsonb,
    525,
    TRUE,
    'Step 1: Identify the key concept (Quant - EigenValues).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a z-test: x̄=48, μ0=54, σ=6, n=36. Compute z = (x̄-μ0)/(σ/√n). (round to 3 decimals)',
    'mcq',
    '{"A": "-5.884", "B": "-5.786", "C": "-5.851", "D": "-6.0"}'::jsonb,
    '"D"'::jsonb,
    526,
    TRUE,
    'Step 1: Identify the key concept (Quant - HypothesisTest).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-6.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-state Markov chain has P(1→1)=0.75 and P(2→1)=0.18. If the chain starts in state 1, what is P(in state 1 after 1 step)?',
    'mcq',
    '{"A": "0.821", "B": "0.555", "C": "0.75", "D": "0.685"}'::jsonb,
    '"C"'::jsonb,
    527,
    TRUE,
    'Step 1: Identify the key concept (Quant - MarkovBasics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.75) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 28, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "194.374", "B": "193.739", "C": "196.324", "D": "196.0"}'::jsonb,
    '"D"'::jsonb,
    528,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (196.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 39, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "376.502", "B": "379.606", "C": "380.088", "D": "380.25"}'::jsonb,
    '"D"'::jsonb,
    529,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (380.25) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Maximize product xy subject to x + y = 22, x,y>0. What is the maximum value of xy?',
    'mcq',
    '{"A": "121.215", "B": "121.0", "C": "120.259", "D": "121.89"}'::jsonb,
    '"B"'::jsonb,
    530,
    TRUE,
    'Step 1: Identify the key concept (Quant - Lagrange).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (121.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For Boolean variables x,y,z, how many truth assignments satisfy (x OR y) AND (NOT x OR z)?',
    'mcq',
    '{"A": "6", "B": "4", "C": "8", "D": "0"}'::jsonb,
    '"B"'::jsonb,
    531,
    TRUE,
    'Step 1: Identify the key concept (Logic - BooleanCounting).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (4) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 12 distinct items?',
    'mcq',
    '{"A": "95040", "B": "95700", "C": "101252", "D": "91788"}'::jsonb,
    '"A"'::jsonb,
    532,
    TRUE,
    'Step 1: Identify the key concept (Logic - CombinatorialLogic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (95040) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=32 with 0≤x≤11, 0≤y≤9, 0≤z≤12?',
    'mcq',
    '{"A": "4", "B": "11", "C": "1", "D": "7"}'::jsonb,
    '"C"'::jsonb,
    533,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 15, 23, 39, 63, ?',
    'mcq',
    '{"A": "111", "B": "71", "C": "95", "D": "97"}'::jsonb,
    '"C"'::jsonb,
    534,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (95) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤13, 0≤y≤9, 0≤z≤12?',
    'mcq',
    '{"A": "67", "B": "77", "C": "45", "D": "57"}'::jsonb,
    '"C"'::jsonb,
    535,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 15, 26, 48, 81, ?',
    'mcq',
    '{"A": "177", "B": "173", "C": "141", "D": "125"}'::jsonb,
    '"D"'::jsonb,
    536,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (125) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 10 distinct items?',
    'mcq',
    '{"A": "30240", "B": "31801", "C": "26588", "D": "31468"}'::jsonb,
    '"A"'::jsonb,
    537,
    TRUE,
    'Step 1: Identify the key concept (Logic - CombinatorialLogic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (30240) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 13 distinct items?',
    'mcq',
    '{"A": "1716", "B": "1468", "C": "1581", "D": "1802"}'::jsonb,
    '"A"'::jsonb,
    538,
    TRUE,
    'Step 1: Identify the key concept (Logic - CombinatorialLogic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1716) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 14 distinct items?',
    'mcq',
    '{"A": "25267", "B": "28152", "C": "26452", "D": "24024"}'::jsonb,
    '"D"'::jsonb,
    539,
    TRUE,
    'Step 1: Identify the key concept (Logic - CombinatorialLogic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (24024) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 10, 21, 43, 76, ?',
    'mcq',
    '{"A": "122", "B": "136", "C": "132", "D": "120"}'::jsonb,
    '"D"'::jsonb,
    540,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (120) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 18, 25, 39, 60, ?',
    'mcq',
    '{"A": "110", "B": "88", "C": "103", "D": "74"}'::jsonb,
    '"B"'::jsonb,
    541,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (88) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=23 with 0≤x≤12, 0≤y≤10, 0≤z≤12?',
    'mcq',
    '{"A": "63", "B": "83", "C": "101", "D": "77"}'::jsonb,
    '"D"'::jsonb,
    542,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (77) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=24 with 0≤x≤10, 0≤y≤9, 0≤z≤13?',
    'mcq',
    '{"A": "44", "B": "36", "C": "45", "D": "53"}'::jsonb,
    '"C"'::jsonb,
    543,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 15, 21, 33, 51, ?',
    'mcq',
    '{"A": "66", "B": "75", "C": "119", "D": "57"}'::jsonb,
    '"B"'::jsonb,
    544,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (75) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=23 with 0≤x≤9, 0≤y≤13, 0≤z≤12?',
    'mcq',
    '{"A": "80", "B": "75", "C": "81", "D": "84"}'::jsonb,
    '"B"'::jsonb,
    545,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (75) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 12, 23, 45, 78, ?',
    'mcq',
    '{"A": "106", "B": "94", "C": "86", "D": "122"}'::jsonb,
    '"D"'::jsonb,
    546,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (122) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 14, 23, 41, 68, ?',
    'mcq',
    '{"A": "152", "B": "104", "C": "82", "D": "121"}'::jsonb,
    '"B"'::jsonb,
    547,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (104) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 14 distinct items?',
    'mcq',
    '{"A": "2184", "B": "2158", "C": "2333", "D": "1939"}'::jsonb,
    '"A"'::jsonb,
    548,
    TRUE,
    'Step 1: Identify the key concept (Logic - CombinatorialLogic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2184) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 15, 25, 45, 75, ?',
    'mcq',
    '{"A": "69", "B": "115", "C": "101", "D": "123"}'::jsonb,
    '"B"'::jsonb,
    549,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (115) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 18, 24, 36, 54, ?',
    'mcq',
    '{"A": "108", "B": "78", "C": "62", "D": "90"}'::jsonb,
    '"B"'::jsonb,
    550,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (78) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤13, 0≤y≤14, 0≤z≤10?',
    'mcq',
    '{"A": "89", "B": "43", "C": "85", "D": "55"}'::jsonb,
    '"D"'::jsonb,
    551,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (55) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 14 distinct items?',
    'mcq',
    '{"A": "254042", "B": "240761", "C": "240240", "D": "243980"}'::jsonb,
    '"C"'::jsonb,
    552,
    TRUE,
    'Step 1: Identify the key concept (Logic - CombinatorialLogic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (240240) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=27 with 0≤x≤9, 0≤y≤11, 0≤z≤11?',
    'mcq',
    '{"A": "19", "B": "7", "C": "24", "D": "15"}'::jsonb,
    '"D"'::jsonb,
    553,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (15) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=22 with 0≤x≤11, 0≤y≤12, 0≤z≤12?',
    'mcq',
    '{"A": "118", "B": "93", "C": "50", "D": "100"}'::jsonb,
    '"D"'::jsonb,
    554,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (100) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤13, 0≤y≤10, 0≤z≤14?',
    'mcq',
    '{"A": "83", "B": "55", "C": "64", "D": "53"}'::jsonb,
    '"B"'::jsonb,
    555,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (55) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 11 distinct items?',
    'mcq',
    '{"A": "45594", "B": "55440", "C": "52364", "D": "61146"}'::jsonb,
    '"B"'::jsonb,
    556,
    TRUE,
    'Step 1: Identify the key concept (Logic - CombinatorialLogic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (55440) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤11, 0≤y≤14, 0≤z≤14?',
    'mcq',
    '{"A": "34", "B": "78", "C": "55", "D": "120"}'::jsonb,
    '"B"'::jsonb,
    557,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (78) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 13 distinct items?',
    'mcq',
    '{"A": "133998", "B": "154440", "C": "112920", "D": "137945"}'::jsonb,
    '"B"'::jsonb,
    558,
    TRUE,
    'Step 1: Identify the key concept (Logic - CombinatorialLogic).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (154440) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 14, 22, 38, 62, ?',
    'mcq',
    '{"A": "116", "B": "94", "C": "92", "D": "42"}'::jsonb,
    '"B"'::jsonb,
    559,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (94) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 15, 22, 36, 57, ?',
    'mcq',
    '{"A": "47", "B": "85", "C": "71", "D": "69"}'::jsonb,
    '"B"'::jsonb,
    560,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (85) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=22 with 0≤x≤14, 0≤y≤13, 0≤z≤10?',
    'mcq',
    '{"A": "115", "B": "117", "C": "99", "D": "92"}'::jsonb,
    '"B"'::jsonb,
    561,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (117) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=22 with 0≤x≤12, 0≤y≤9, 0≤z≤12?',
    'mcq',
    '{"A": "75", "B": "61", "C": "101", "D": "54"}'::jsonb,
    '"A"'::jsonb,
    562,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (75) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=30 with 0≤x≤12, 0≤y≤10, 0≤z≤11?',
    'mcq',
    '{"A": "13", "B": "14", "C": "0", "D": "10"}'::jsonb,
    '"D"'::jsonb,
    563,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (10) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=24 with 0≤x≤9, 0≤y≤13, 0≤z≤11?',
    'mcq',
    '{"A": "83", "B": "42", "C": "55", "D": "89"}'::jsonb,
    '"C"'::jsonb,
    564,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (55) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=25 with 0≤x≤13, 0≤y≤9, 0≤z≤11?',
    'mcq',
    '{"A": "75", "B": "45", "C": "44", "D": "35"}'::jsonb,
    '"B"'::jsonb,
    565,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤14, 0≤y≤12, 0≤z≤12?',
    'mcq',
    '{"A": "91", "B": "70", "C": "71", "D": "145"}'::jsonb,
    '"A"'::jsonb,
    566,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (91) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=25 with 0≤x≤10, 0≤y≤9, 0≤z≤10?',
    'mcq',
    '{"A": "17", "B": "15", "C": "14", "D": "9"}'::jsonb,
    '"B"'::jsonb,
    567,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (15) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤14, 0≤y≤10, 0≤z≤10?',
    'mcq',
    '{"A": "45", "B": "35", "C": "30", "D": "55"}'::jsonb,
    '"A"'::jsonb,
    568,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤11, 0≤y≤14, 0≤z≤12?',
    'mcq',
    '{"A": "70", "B": "96", "C": "55", "D": "78"}'::jsonb,
    '"D"'::jsonb,
    569,
    TRUE,
    'Step 1: Identify the key concept (Logic - ConstraintSatisfaction).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (78) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Find the next term in the series: 13, 23, 43, 73, ?',
    'mcq',
    '{"A": "67", "B": "163", "C": "134", "D": "113"}'::jsonb,
    '"D"'::jsonb,
    570,
    TRUE,
    'Step 1: Identify the key concept (Logic - ModularPatterns).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (113) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 95 and 55 with weight 0.61 on objective1. Compute utility.',
    'mcq',
    '{"A": "77.97", "B": "80.045", "C": "79.4", "D": "80.727"}'::jsonb,
    '"C"'::jsonb,
    571,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (79.4) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two actions A1 payoffs [7, -9, 20] across 3 states, A2 payoffs [23, 18, 12]. Under maximin, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "2", "B": "4", "C": "1", "D": "3"}'::jsonb,
    '"A"'::jsonb,
    572,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RobustDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 85 and 95 with weight 0.43 on objective1. Compute utility.',
    'mcq',
    '{"A": "92.08", "B": "88.477", "C": "90.316", "D": "90.7"}'::jsonb,
    '"D"'::jsonb,
    573,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (90.7) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 93 and 96 with weight 0.47 on objective1. Compute utility.',
    'mcq',
    '{"A": "94.373", "B": "95.628", "C": "96.031", "D": "94.59"}'::jsonb,
    '"D"'::jsonb,
    574,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (94.59) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 81 and 80 with weight 0.46 on objective1. Compute utility.',
    'mcq',
    '{"A": "80.46", "B": "81.198", "C": "81.228", "D": "82.839"}'::jsonb,
    '"A"'::jsonb,
    575,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (80.46) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 91 and 69 with weight 0.64 on objective1. Compute utility.',
    'mcq',
    '{"A": "83.08", "B": "84.128", "C": "82.573", "D": "83.663"}'::jsonb,
    '"A"'::jsonb,
    576,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (83.08) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two actions A1 payoffs [6, -6, 0] across 3 states, A2 payoffs [-10, 28, 12]. Under maximin, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "2", "B": "1", "C": "3", "D": "4"}'::jsonb,
    '"B"'::jsonb,
    577,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RobustDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two actions A1 payoffs [-9, 26, 8] across 3 states, A2 payoffs [4, 23, 22]. Under maximin, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "4", "B": "3", "C": "1", "D": "2"}'::jsonb,
    '"D"'::jsonb,
    578,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RobustDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Players mix with p=0.49 (row chooses R1) and q=0.41 (col chooses C1). Payoffs to row: [[3,10],[3,6]]. Compute expected payoff to row. (round to 3 decimals)',
    'mcq',
    '{"A": "6.347", "B": "6.237", "C": "5.926", "D": "5.202"}'::jsonb,
    '"C"'::jsonb,
    579,
    TRUE,
    'Step 1: Identify the key concept (CritThink - GamePayoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5.926) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 48 and 75 with weight 0.5 on objective1. Compute utility.',
    'mcq',
    '{"A": "60.838", "B": "60.929", "C": "61.5", "D": "60.691"}'::jsonb,
    '"C"'::jsonb,
    580,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (61.5) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Players mix with p=0.75 (row chooses R1) and q=0.41 (col chooses C1). Payoffs to row: [[5,7],[8,3]]. Compute expected payoff to row. (round to 3 decimals)',
    'mcq',
    '{"A": "5.556", "B": "5.898", "C": "5.74", "D": "6.404"}'::jsonb,
    '"B"'::jsonb,
    581,
    TRUE,
    'Step 1: Identify the key concept (CritThink - GamePayoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5.898) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 48 and 89 with weight 0.57 on objective1. Compute utility.',
    'mcq',
    '{"A": "67.247", "B": "66.611", "C": "66.585", "D": "65.63"}'::jsonb,
    '"D"'::jsonb,
    582,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (65.63) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two actions A1 payoffs [-7, 21, 9] across 3 states, A2 payoffs [-10, 17, 12]. Under maximin, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "3", "B": "2", "C": "4", "D": "1"}'::jsonb,
    '"D"'::jsonb,
    583,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RobustDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 49 and 41 with weight 0.59 on objective1. Compute utility.',
    'mcq',
    '{"A": "45.977", "B": "45.044", "C": "45.248", "D": "45.72"}'::jsonb,
    '"D"'::jsonb,
    584,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45.72) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Players mix with p=0.78 (row chooses R1) and q=0.26 (col chooses C1). Payoffs to row: [[3,4],[4,0]]. Compute expected payoff to row. (round to 3 decimals)',
    'mcq',
    '{"A": "3.478", "B": "3.146", "C": "3.641", "D": "3.435"}'::jsonb,
    '"B"'::jsonb,
    585,
    TRUE,
    'Step 1: Identify the key concept (CritThink - GamePayoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3.146) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Players mix with p=0.54 (row chooses R1) and q=0.58 (col chooses C1). Payoffs to row: [[0,7],[8,-2]]. Compute expected payoff to row. (round to 3 decimals)',
    'mcq',
    '{"A": "3.139", "B": "3.336", "C": "2.908", "D": "3.922"}'::jsonb,
    '"B"'::jsonb,
    586,
    TRUE,
    'Step 1: Identify the key concept (CritThink - GamePayoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3.336) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Players mix with p=0.25 (row chooses R1) and q=0.28 (col chooses C1). Payoffs to row: [[4,2],[6,-1]]. Compute expected payoff to row. (round to 3 decimals)',
    'mcq',
    '{"A": "1.36", "B": "1.223", "C": "1.266", "D": "1.895"}'::jsonb,
    '"A"'::jsonb,
    587,
    TRUE,
    'Step 1: Identify the key concept (CritThink - GamePayoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.36) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 43 and 72 with weight 0.54 on objective1. Compute utility.',
    'mcq',
    '{"A": "55.289", "B": "56.34", "C": "53.856", "D": "56.114"}'::jsonb,
    '"B"'::jsonb,
    588,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (56.34) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two actions A1 payoffs [30, -1, 9] across 3 states, A2 payoffs [30, 9, -10]. Under maximin, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "2", "B": "1", "C": "3", "D": "4"}'::jsonb,
    '"B"'::jsonb,
    589,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RobustDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two actions A1 payoffs [23, -4, 5] across 3 states, A2 payoffs [3, -4, 20]. Under maximin, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "4", "B": "2", "C": "3", "D": "1"}'::jsonb,
    '"B"'::jsonb,
    590,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RobustDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Players mix with p=0.49 (row chooses R1) and q=0.31 (col chooses C1). Payoffs to row: [[2,3],[9,-2]]. Compute expected payoff to row. (round to 3 decimals)',
    'mcq',
    '{"A": "1.836", "B": "2.152", "C": "2.037", "D": "2.147"}'::jsonb,
    '"C"'::jsonb,
    591,
    TRUE,
    'Step 1: Identify the key concept (CritThink - GamePayoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2.037) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Players mix with p=0.42 (row chooses R1) and q=0.37 (col chooses C1). Payoffs to row: [[7,-2],[9,8]]. Compute expected payoff to row. (round to 3 decimals)',
    'mcq',
    '{"A": "5.229", "B": "5.748", "C": "5.413", "D": "5.293"}'::jsonb,
    '"C"'::jsonb,
    592,
    TRUE,
    'Step 1: Identify the key concept (CritThink - GamePayoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5.413) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 86 and 35 with weight 0.66 on objective1. Compute utility.',
    'mcq',
    '{"A": "67.203", "B": "69.112", "C": "69.224", "D": "68.66"}'::jsonb,
    '"D"'::jsonb,
    593,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (68.66) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 38 and 52 with weight 0.56 on objective1. Compute utility.',
    'mcq',
    '{"A": "45.28", "B": "44.16", "C": "45.067", "D": "44.876"}'::jsonb,
    '"B"'::jsonb,
    594,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (44.16) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two actions A1 payoffs [26, 22, 23] across 3 states, A2 payoffs [6, -2, 10]. Under maximin, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "1", "B": "2", "C": "4", "D": "3"}'::jsonb,
    '"A"'::jsonb,
    595,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RobustDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two actions A1 payoffs [4, -4, -4] across 3 states, A2 payoffs [21, 20, 10]. Under maximin, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "4", "B": "1", "C": "3", "D": "2"}'::jsonb,
    '"D"'::jsonb,
    596,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RobustDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Players mix with p=0.65 (row chooses R1) and q=0.45 (col chooses C1). Payoffs to row: [[-3,-4],[3,-2]]. Compute expected payoff to row. (round to 3 decimals)',
    'mcq',
    '{"A": "-2.22", "B": "-2.283", "C": "-1.811", "D": "-2.482"}'::jsonb,
    '"A"'::jsonb,
    597,
    TRUE,
    'Step 1: Identify the key concept (CritThink - GamePayoff).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (-2.22) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 55 and 55 with weight 0.4 on objective1. Compute utility.',
    'mcq',
    '{"A": "55.679", "B": "55.0", "C": "55.377", "D": "56.369"}'::jsonb,
    '"B"'::jsonb,
    598,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (55.0) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two actions A1 payoffs [-2, -10, 13] across 3 states, A2 payoffs [16, 26, 24]. Under maximin, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "3", "B": "4", "C": "2", "D": "1"}'::jsonb,
    '"C"'::jsonb,
    599,
    TRUE,
    'Step 1: Identify the key concept (CritThink - RobustDecision).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A utility combines two objective scores 97 and 93 with weight 0.38 on objective1. Compute utility.',
    'mcq',
    '{"A": "95.467", "B": "94.52", "C": "93.818", "D": "96.072"}'::jsonb,
    '"B"'::jsonb,
    600,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MultiObjective).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (94.52) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 4, "time_target_sec": 99}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 10 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "156", "B": "320", "C": "160", "D": "168"}'::jsonb,
    '"C"'::jsonb,
    601,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (820) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 22, what is f(8)?',
    'mcq',
    '{"A": "123", "B": "126", "C": "131", "D": "128"}'::jsonb,
    '"B"'::jsonb,
    602,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1862) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "224", "B": "112", "C": "108", "D": "120"}'::jsonb,
    '"B"'::jsonb,
    603,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3409) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 9x + 23, what is f(8)?',
    'mcq',
    '{"A": "92", "B": "95", "C": "100", "D": "97"}'::jsonb,
    '"B"'::jsonb,
    604,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1086) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "112", "B": "120", "C": "224", "D": "108"}'::jsonb,
    '"A"'::jsonb,
    605,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2118) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 24, what is f(8)?',
    'mcq',
    '{"A": "112", "B": "117", "C": "114", "D": "109"}'::jsonb,
    '"A"'::jsonb,
    606,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3423) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 9 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "140", "B": "144", "C": "288", "D": "152"}'::jsonb,
    '"B"'::jsonb,
    607,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (867) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 15x + 10, what is f(8)?',
    'mcq',
    '{"A": "127", "B": "135", "C": "132", "D": "130"}'::jsonb,
    '"D"'::jsonb,
    608,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1347) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "224", "B": "108", "C": "120", "D": "112"}'::jsonb,
    '"D"'::jsonb,
    609,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3147) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 10, what is f(8)?',
    'mcq',
    '{"A": "103", "B": "95", "C": "98", "D": "100"}'::jsonb,
    '"C"'::jsonb,
    610,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1009) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 10 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "320", "B": "168", "C": "156", "D": "160"}'::jsonb,
    '"D"'::jsonb,
    611,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0766) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 15x + 18, what is f(8)?',
    'mcq',
    '{"A": "140", "B": "143", "C": "138", "D": "135"}'::jsonb,
    '"C"'::jsonb,
    612,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3255) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "256", "B": "136", "C": "128", "D": "124"}'::jsonb,
    '"C"'::jsonb,
    613,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (874) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 12x + 22, what is f(8)?',
    'mcq',
    '{"A": "120", "B": "118", "C": "115", "D": "123"}'::jsonb,
    '"B"'::jsonb,
    614,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1202) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 7 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "108", "B": "120", "C": "112", "D": "224"}'::jsonb,
    '"C"'::jsonb,
    615,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3192) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 17x + 13, what is f(8)?',
    'mcq',
    '{"A": "154", "B": "146", "C": "151", "D": "149"}'::jsonb,
    '"D"'::jsonb,
    616,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (934) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 9 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "152", "B": "288", "C": "140", "D": "144"}'::jsonb,
    '"D"'::jsonb,
    617,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0991) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 8x + 23, what is f(8)?',
    'mcq',
    '{"A": "84", "B": "89", "C": "87", "D": "92"}'::jsonb,
    '"C"'::jsonb,
    618,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3436) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 9 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "288", "B": "144", "C": "140", "D": "152"}'::jsonb,
    '"B"'::jsonb,
    619,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (940) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 14x + 15, what is f(8)?',
    'mcq',
    '{"A": "127", "B": "129", "C": "132", "D": "124"}'::jsonb,
    '"A"'::jsonb,
    620,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2254) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 10 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "160", "B": "320", "C": "156", "D": "168"}'::jsonb,
    '"A"'::jsonb,
    621,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3316) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 17, what is f(8)?',
    'mcq',
    '{"A": "126", "B": "118", "C": "123", "D": "121"}'::jsonb,
    '"D"'::jsonb,
    622,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (767) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "128", "B": "256", "C": "124", "D": "136"}'::jsonb,
    '"A"'::jsonb,
    623,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1546) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 10, what is f(8)?',
    'mcq',
    '{"A": "111", "B": "114", "C": "116", "D": "119"}'::jsonb,
    '"B"'::jsonb,
    624,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3425) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 10 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "160", "B": "156", "C": "168", "D": "320"}'::jsonb,
    '"A"'::jsonb,
    625,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (875) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 13x + 18, what is f(8)?',
    'mcq',
    '{"A": "124", "B": "122", "C": "127", "D": "119"}'::jsonb,
    '"B"'::jsonb,
    626,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1244) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 8 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "124", "B": "256", "C": "136", "D": "128"}'::jsonb,
    '"D"'::jsonb,
    627,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3338) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 15x + 17, what is f(8)?',
    'mcq',
    '{"A": "137", "B": "139", "C": "134", "D": "142"}'::jsonb,
    '"A"'::jsonb,
    628,
    TRUE,
    'Step 1: Identify the key concept (DI - Totals).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1078) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'In a geometric progression starting with 10 and ratio 2, what is the 5th term?',
    'mcq',
    '{"A": "156", "B": "320", "C": "168", "D": "160"}'::jsonb,
    '"D"'::jsonb,
    629,
    TRUE,
    'Step 1: Identify the key concept (DI - Growth).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1853) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'If f(x) = 11x + 22, what is f(8)?',
    'mcq',
    '{"A": "110", "B": "107", "C": "115", "D": "112"}'::jsonb,
    '"A"'::jsonb,
    630,
    TRUE,
    'Step 1: Identify the key concept (DI - Share).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3256) with the correct option.',
    '{"grade": "PG", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 2.08, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.424", "B": "0.654", "C": "0.481", "D": "0.539"}'::jsonb,
    '"C"'::jsonb,
    631,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.481) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 1.33, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.588", "B": "0.752", "C": "0.834", "D": "0.583"}'::jsonb,
    '"B"'::jsonb,
    632,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.752) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=3.0 per unit time, find P(N(2)=3). (round to 4 decimals)',
    'mcq',
    '{"A": "0.154", "B": "0.2", "C": "0.169", "D": "0.0892"}'::jsonb,
    '"D"'::jsonb,
    633,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0892) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=1.2 per unit time, find P(N(3)=2). (round to 4 decimals)',
    'mcq',
    '{"A": "0.036", "B": "0.303", "C": "0.32", "D": "0.1771"}'::jsonb,
    '"D"'::jsonb,
    634,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1771) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Prior Beta(4,4). Observed 12 successes and 10 failures. What is posterior mean? (round to 4 decimals)',
    'mcq',
    '{"A": "0.477", "B": "0.456", "C": "0.728", "D": "0.5333"}'::jsonb,
    '"D"'::jsonb,
    635,
    TRUE,
    'Step 1: Identify the key concept (Quant - BayesianUpdate).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.5333) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a population with σ=8, what is the standard error of the mean for n=100? (σ/√n, round to 3 decimals)',
    'mcq',
    '{"A": "0.877", "B": "0.8", "C": "0.616", "D": "0.952"}'::jsonb,
    '"B"'::jsonb,
    636,
    TRUE,
    'Step 1: Identify the key concept (Quant - Asymptotics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a population with σ=10, what is the standard error of the mean for n=100? (σ/√n, round to 3 decimals)',
    'mcq',
    '{"A": "0.85", "B": "1.0", "C": "0.912", "D": "0.948"}'::jsonb,
    '"B"'::jsonb,
    637,
    TRUE,
    'Step 1: Identify the key concept (Quant - Asymptotics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 1.31, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.588", "B": "0.846", "C": "0.945", "D": "0.763"}'::jsonb,
    '"D"'::jsonb,
    638,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.763) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=1.2 per unit time, find P(N(1)=1). (round to 4 decimals)',
    'mcq',
    '{"A": "0.183", "B": "0.481", "C": "0.252", "D": "0.3614"}'::jsonb,
    '"D"'::jsonb,
    639,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3614) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a population with σ=15, what is the standard error of the mean for n=400? (σ/√n, round to 3 decimals)',
    'mcq',
    '{"A": "0.685", "B": "0.75", "C": "0.628", "D": "0.594"}'::jsonb,
    '"B"'::jsonb,
    640,
    TRUE,
    'Step 1: Identify the key concept (Quant - Asymptotics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.75) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=2.0 per unit time, find P(N(3)=0). (round to 4 decimals)',
    'mcq',
    '{"A": "0.057", "B": "0.072", "C": "0.159", "D": "0.0025"}'::jsonb,
    '"D"'::jsonb,
    641,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0025) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = 4x^2, what is the gradient (derivative) at x=2?',
    'mcq',
    '{"A": "4", "B": "22", "C": "8", "D": "16"}'::jsonb,
    '"D"'::jsonb,
    642,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConvexOpt).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (16) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a population with σ=8, what is the standard error of the mean for n=144? (σ/√n, round to 3 decimals)',
    'mcq',
    '{"A": "0.667", "B": "0.517", "C": "0.563", "D": "0.607"}'::jsonb,
    '"A"'::jsonb,
    643,
    TRUE,
    'Step 1: Identify the key concept (Quant - Asymptotics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.667) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Prior Beta(3,5). Observed 15 successes and 16 failures. What is posterior mean? (round to 4 decimals)',
    'mcq',
    '{"A": "0.4615", "B": "0.642", "C": "0.54", "D": "0.519"}'::jsonb,
    '"A"'::jsonb,
    644,
    TRUE,
    'Step 1: Identify the key concept (Quant - BayesianUpdate).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.4615) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 1.74, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.457", "B": "0.403", "C": "0.474", "D": "0.575"}'::jsonb,
    '"D"'::jsonb,
    645,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.575) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a population with σ=15, what is the standard error of the mean for n=225? (σ/√n, round to 3 decimals)',
    'mcq',
    '{"A": "1.0", "B": "0.891", "C": "1.068", "D": "0.92"}'::jsonb,
    '"A"'::jsonb,
    646,
    TRUE,
    'Step 1: Identify the key concept (Quant - Asymptotics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.0) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a population with σ=12, what is the standard error of the mean for n=225? (σ/√n, round to 3 decimals)',
    'mcq',
    '{"A": "0.638", "B": "0.854", "C": "0.897", "D": "0.8"}'::jsonb,
    '"D"'::jsonb,
    647,
    TRUE,
    'Step 1: Identify the key concept (Quant - Asymptotics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 3.83, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.064", "B": "0.102", "C": "0.261", "D": "0.394"}'::jsonb,
    '"C"'::jsonb,
    648,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.261) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a population with σ=10, what is the standard error of the mean for n=144? (σ/√n, round to 3 decimals)',
    'mcq',
    '{"A": "0.833", "B": "0.775", "C": "0.719", "D": "0.767"}'::jsonb,
    '"A"'::jsonb,
    649,
    TRUE,
    'Step 1: Identify the key concept (Quant - Asymptotics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.833) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 3.05, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.499", "B": "0.19", "C": "0.459", "D": "0.328"}'::jsonb,
    '"D"'::jsonb,
    650,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.328) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 3.97, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.096", "B": "0.422", "C": "0.252", "D": "0.083"}'::jsonb,
    '"C"'::jsonb,
    651,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.252) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Prior Beta(4,2). Observed 11 successes and 17 failures. What is posterior mean? (round to 4 decimals)',
    'mcq',
    '{"A": "0.561", "B": "0.4412", "C": "0.372", "D": "0.365"}'::jsonb,
    '"B"'::jsonb,
    652,
    TRUE,
    'Step 1: Identify the key concept (Quant - BayesianUpdate).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.4412) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = 6x^2, what is the gradient (derivative) at x=3?',
    'mcq',
    '{"A": "31", "B": "20", "C": "38", "D": "36"}'::jsonb,
    '"D"'::jsonb,
    653,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConvexOpt).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (36) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 2.76, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.443", "B": "0.31", "C": "0.362", "D": "0.268"}'::jsonb,
    '"C"'::jsonb,
    654,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.362) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=1.2 per unit time, find P(N(2)=0). (round to 4 decimals)',
    'mcq',
    '{"A": "0.0907", "B": "0.276", "C": "0.19", "D": "0.008"}'::jsonb,
    '"A"'::jsonb,
    655,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0907) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Prior Beta(5,1). Observed 17 successes and 18 failures. What is posterior mean? (round to 4 decimals)',
    'mcq',
    '{"A": "0.45", "B": "0.5366", "C": "0.445", "D": "0.59"}'::jsonb,
    '"B"'::jsonb,
    656,
    TRUE,
    'Step 1: Identify the key concept (Quant - BayesianUpdate).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.5366) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=1.5 per unit time, find P(N(3)=0). (round to 4 decimals)',
    'mcq',
    '{"A": "0.133", "B": "0.142", "C": "0.084", "D": "0.0111"}'::jsonb,
    '"D"'::jsonb,
    657,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0111) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = 5x^2, what is the gradient (derivative) at x=3?',
    'mcq',
    '{"A": "37", "B": "30", "C": "38", "D": "36"}'::jsonb,
    '"B"'::jsonb,
    658,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConvexOpt).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (30) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=2.0 per unit time, find P(N(3)=2). (round to 4 decimals)',
    'mcq',
    '{"A": "0.0446", "B": "0.102", "C": "0.179", "D": "0.136"}'::jsonb,
    '"A"'::jsonb,
    659,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0446) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 2.74, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.365", "B": "0.313", "C": "0.217", "D": "0.441"}'::jsonb,
    '"A"'::jsonb,
    660,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.365) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = 4x^2, what is the gradient (derivative) at x=1?',
    'mcq',
    '{"A": "14", "B": "24", "C": "8", "D": "2"}'::jsonb,
    '"C"'::jsonb,
    661,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConvexOpt).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Prior Beta(1,2). Observed 8 successes and 18 failures. What is posterior mean? (round to 4 decimals)',
    'mcq',
    '{"A": "0.115", "B": "0.3103", "C": "0.453", "D": "0.39"}'::jsonb,
    '"B"'::jsonb,
    662,
    TRUE,
    'Step 1: Identify the key concept (Quant - BayesianUpdate).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3103) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 3.39, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.295", "B": "0.206", "C": "0.492", "D": "0.385"}'::jsonb,
    '"A"'::jsonb,
    663,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.295) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 4.11, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.243", "B": "0.315", "C": "0.178", "D": "0.302"}'::jsonb,
    '"A"'::jsonb,
    664,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.243) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=3.0 per unit time, find P(N(3)=3). (round to 4 decimals)',
    'mcq',
    '{"A": "0.015", "B": "0.155", "C": "0.154", "D": "0.103"}'::jsonb,
    '"A"'::jsonb,
    665,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.015) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=3.0 per unit time, find P(N(1)=1). (round to 4 decimals)',
    'mcq',
    '{"A": "0.244", "B": "0.081", "C": "0.1494", "D": "0.326"}'::jsonb,
    '"C"'::jsonb,
    666,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.1494) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Prior Beta(4,1). Observed 15 successes and 17 failures. What is posterior mean? (round to 4 decimals)',
    'mcq',
    '{"A": "0.375", "B": "0.629", "C": "0.348", "D": "0.5135"}'::jsonb,
    '"D"'::jsonb,
    667,
    TRUE,
    'Step 1: Identify the key concept (Quant - BayesianUpdate).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.5135) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = 5x^2, what is the gradient (derivative) at x=1?',
    'mcq',
    '{"A": "16", "B": "4", "C": "3", "D": "10"}'::jsonb,
    '"D"'::jsonb,
    668,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConvexOpt).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (10) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=2.5 per unit time, find P(N(1)=2). (round to 4 decimals)',
    'mcq',
    '{"A": "0.2565", "B": "0.106", "C": "0.185", "D": "0.096"}'::jsonb,
    '"A"'::jsonb,
    669,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2565) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a population with σ=15, what is the standard error of the mean for n=100? (σ/√n, round to 3 decimals)',
    'mcq',
    '{"A": "1.38", "B": "1.695", "C": "1.5", "D": "1.615"}'::jsonb,
    '"C"'::jsonb,
    670,
    TRUE,
    'Step 1: Identify the key concept (Quant - Asymptotics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1.5) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=2.0 per unit time, find P(N(1)=2). (round to 4 decimals)',
    'mcq',
    '{"A": "0.2707", "B": "0.187", "C": "0.396", "D": "0.348"}'::jsonb,
    '"A"'::jsonb,
    671,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2707) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = 6x^2, what is the gradient (derivative) at x=1?',
    'mcq',
    '{"A": "6", "B": "16", "C": "12", "D": "10"}'::jsonb,
    '"C"'::jsonb,
    672,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConvexOpt).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (12) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Prior Beta(4,6). Observed 12 successes and 19 failures. What is posterior mean? (round to 4 decimals)',
    'mcq',
    '{"A": "0.494", "B": "0.3902", "C": "0.31", "D": "0.459"}'::jsonb,
    '"B"'::jsonb,
    673,
    TRUE,
    'Step 1: Identify the key concept (Quant - BayesianUpdate).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.3902) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=2.5 per unit time, find P(N(1)=1). (round to 4 decimals)',
    'mcq',
    '{"A": "0.119", "B": "0.4", "C": "0.022", "D": "0.2052"}'::jsonb,
    '"D"'::jsonb,
    674,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.2052) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For an exponential distribution with sample mean 3.49, what is the MLE of λ? (λ=1/mean, round to 3 decimals)',
    'mcq',
    '{"A": "0.351", "B": "0.287", "C": "0.165", "D": "0.182"}'::jsonb,
    '"B"'::jsonb,
    675,
    TRUE,
    'Step 1: Identify the key concept (Quant - MLE).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.287) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Prior Beta(3,1). Observed 18 successes and 11 failures. What is posterior mean? (round to 4 decimals)',
    'mcq',
    '{"A": "0.535", "B": "0.763", "C": "0.802", "D": "0.6364"}'::jsonb,
    '"D"'::jsonb,
    676,
    TRUE,
    'Step 1: Identify the key concept (Quant - BayesianUpdate).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.6364) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a population with σ=12, what is the standard error of the mean for n=400? (σ/√n, round to 3 decimals)',
    'mcq',
    '{"A": "0.6", "B": "0.446", "C": "0.759", "D": "0.504"}'::jsonb,
    '"A"'::jsonb,
    677,
    TRUE,
    'Step 1: Identify the key concept (Quant - Asymptotics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.6) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a Poisson process with rate λ=1.5 per unit time, find P(N(3)=1). (round to 4 decimals)',
    'mcq',
    '{"A": "0.05", "B": "0.158", "C": "0.217", "D": "0.213"}'::jsonb,
    '"A"'::jsonb,
    678,
    TRUE,
    'Step 1: Identify the key concept (Quant - StochasticProcess).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.05) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For a population with σ=10, what is the standard error of the mean for n=225? (σ/√n, round to 3 decimals)',
    'mcq',
    '{"A": "0.842", "B": "0.511", "C": "0.667", "D": "0.567"}'::jsonb,
    '"C"'::jsonb,
    679,
    TRUE,
    'Step 1: Identify the key concept (Quant - Asymptotics).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.667) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'For f(x) = 2x^2, what is the gradient (derivative) at x=4?',
    'mcq',
    '{"A": "20", "B": "2", "C": "16", "D": "19"}'::jsonb,
    '"C"'::jsonb,
    680,
    TRUE,
    'Step 1: Identify the key concept (Quant - ConvexOpt).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (16) with the correct option.',
    '{"grade": "PG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many bits are needed to uniquely encode 8 distinct states? (log2, exact)',
    'mcq',
    '{"A": "7", "B": "5", "C": "3", "D": "11"}'::jsonb,
    '"C"'::jsonb,
    681,
    TRUE,
    'Step 1: Identify the key concept (Logic - EntropyStyle).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (3) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 15 distinct items?',
    'mcq',
    '{"A": "2659", "B": "2116", "C": "2754", "D": "2730"}'::jsonb,
    '"D"'::jsonb,
    682,
    TRUE,
    'Step 1: Identify the key concept (Logic - CountingProofStyle).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2730) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=33 with 0≤x≤14, 0≤y≤11, 0≤z≤11?',
    'mcq',
    '{"A": "14", "B": "10", "C": "18", "D": "26"}'::jsonb,
    '"B"'::jsonb,
    683,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (10) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=32 with 0≤x≤11, 0≤y≤15, 0≤z≤14?',
    'mcq',
    '{"A": "60", "B": "45", "C": "33", "D": "53"}'::jsonb,
    '"B"'::jsonb,
    684,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 13 distinct items?',
    'mcq',
    '{"A": "15404", "B": "17488", "C": "13886", "D": "17160"}'::jsonb,
    '"D"'::jsonb,
    685,
    TRUE,
    'Step 1: Identify the key concept (Logic - CountingProofStyle).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (17160) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many bits are needed to uniquely encode 16 distinct states? (log2, exact)',
    'mcq',
    '{"A": "12", "B": "8", "C": "4", "D": "6"}'::jsonb,
    '"C"'::jsonb,
    686,
    TRUE,
    'Step 1: Identify the key concept (Logic - EntropyStyle).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (4) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many bits are needed to uniquely encode 32 distinct states? (log2, exact)',
    'mcq',
    '{"A": "5", "B": "4", "C": "7", "D": "6"}'::jsonb,
    '"A"'::jsonb,
    687,
    TRUE,
    'Step 1: Identify the key concept (Logic - RamseyLite).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤10, 0≤y≤14, 0≤z≤14?',
    'mcq',
    '{"A": "28", "B": "66", "C": "52", "D": "56"}'::jsonb,
    '"B"'::jsonb,
    688,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (66) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=25 with 0≤x≤12, 0≤y≤13, 0≤z≤14?',
    'mcq',
    '{"A": "80", "B": "140", "C": "116", "D": "50"}'::jsonb,
    '"C"'::jsonb,
    689,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (116) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many bits are needed to uniquely encode 64 distinct states? (log2, exact)',
    'mcq',
    '{"A": "9", "B": "14", "C": "10", "D": "6"}'::jsonb,
    '"D"'::jsonb,
    690,
    TRUE,
    'Step 1: Identify the key concept (Logic - EntropyStyle).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=34 with 0≤x≤13, 0≤y≤13, 0≤z≤10?',
    'mcq',
    '{"A": "20", "B": "6", "C": "0", "D": "1"}'::jsonb,
    '"B"'::jsonb,
    691,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=31 with 0≤x≤12, 0≤y≤14, 0≤z≤14?',
    'mcq',
    '{"A": "21", "B": "62", "C": "55", "D": "46"}'::jsonb,
    '"C"'::jsonb,
    692,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (55) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=25 with 0≤x≤15, 0≤y≤13, 0≤z≤15?',
    'mcq',
    '{"A": "127", "B": "163", "C": "195", "D": "159"}'::jsonb,
    '"B"'::jsonb,
    693,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (163) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤12, 0≤y≤14, 0≤z≤14?',
    'mcq',
    '{"A": "141", "B": "127", "C": "91", "D": "68"}'::jsonb,
    '"C"'::jsonb,
    694,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (91) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤11, 0≤y≤12, 0≤z≤13?',
    'mcq',
    '{"A": "59", "B": "29", "C": "45", "D": "69"}'::jsonb,
    '"C"'::jsonb,
    695,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=32 with 0≤x≤10, 0≤y≤14, 0≤z≤10?',
    'mcq',
    '{"A": "24", "B": "4", "C": "8", "D": "6"}'::jsonb,
    '"D"'::jsonb,
    696,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (6) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=31 with 0≤x≤11, 0≤y≤11, 0≤z≤13?',
    'mcq',
    '{"A": "15", "B": "6", "C": "17", "D": "5"}'::jsonb,
    '"A"'::jsonb,
    697,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (15) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=31 with 0≤x≤10, 0≤y≤12, 0≤z≤12?',
    'mcq',
    '{"A": "5", "B": "24", "C": "10", "D": "6"}'::jsonb,
    '"C"'::jsonb,
    698,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (10) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 3 items can be formed from 12 distinct items?',
    'mcq',
    '{"A": "1320", "B": "1568", "C": "1524", "D": "1314"}'::jsonb,
    '"A"'::jsonb,
    699,
    TRUE,
    'Step 1: Identify the key concept (Logic - CountingProofStyle).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1320) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤10, 0≤y≤14, 0≤z≤15?',
    'mcq',
    '{"A": "155", "B": "99", "C": "109", "D": "79"}'::jsonb,
    '"B"'::jsonb,
    700,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (99) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=33 with 0≤x≤11, 0≤y≤11, 0≤z≤15?',
    'mcq',
    '{"A": "15", "B": "11", "C": "23", "D": "24"}'::jsonb,
    '"A"'::jsonb,
    701,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (15) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=29 with 0≤x≤13, 0≤y≤14, 0≤z≤13?',
    'mcq',
    '{"A": "126", "B": "89", "C": "78", "D": "46"}'::jsonb,
    '"C"'::jsonb,
    702,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (78) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=34 with 0≤x≤11, 0≤y≤11, 0≤z≤12?',
    'mcq',
    '{"A": "3", "B": "11", "C": "6", "D": "1"}'::jsonb,
    '"D"'::jsonb,
    703,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 4 items can be formed from 15 distinct items?',
    'mcq',
    '{"A": "39942", "B": "28465", "C": "36620", "D": "32760"}'::jsonb,
    '"D"'::jsonb,
    704,
    TRUE,
    'Step 1: Identify the key concept (Logic - CountingProofStyle).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (32760) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many ordered arrangements of 5 items can be formed from 15 distinct items?',
    'mcq',
    '{"A": "384121", "B": "273208", "C": "360360", "D": "268400"}'::jsonb,
    '"C"'::jsonb,
    705,
    TRUE,
    'Step 1: Identify the key concept (Logic - CountingProofStyle).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (360360) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=29 with 0≤x≤15, 0≤y≤12, 0≤z≤12?',
    'mcq',
    '{"A": "78", "B": "94", "C": "66", "D": "88"}'::jsonb,
    '"C"'::jsonb,
    706,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (66) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=27 with 0≤x≤13, 0≤y≤11, 0≤z≤15?',
    'mcq',
    '{"A": "101", "B": "90", "C": "120", "D": "126"}'::jsonb,
    '"B"'::jsonb,
    707,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (90) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤12, 0≤y≤10, 0≤z≤10?',
    'mcq',
    '{"A": "4", "B": "14", "C": "34", "D": "28"}'::jsonb,
    '"D"'::jsonb,
    708,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (28) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤11, 0≤y≤12, 0≤z≤13?',
    'mcq',
    '{"A": "54", "B": "66", "C": "44", "D": "73"}'::jsonb,
    '"B"'::jsonb,
    709,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (66) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=27 with 0≤x≤14, 0≤y≤11, 0≤z≤13?',
    'mcq',
    '{"A": "77", "B": "78", "C": "60", "D": "98"}'::jsonb,
    '"B"'::jsonb,
    710,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (78) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤14, 0≤y≤11, 0≤z≤14?',
    'mcq',
    '{"A": "78", "B": "63", "C": "34", "D": "56"}'::jsonb,
    '"A"'::jsonb,
    711,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (78) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤14, 0≤y≤15, 0≤z≤14?',
    'mcq',
    '{"A": "134", "B": "133", "C": "159", "D": "150"}'::jsonb,
    '"A"'::jsonb,
    712,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (134) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=25 with 0≤x≤13, 0≤y≤13, 0≤z≤13?',
    'mcq',
    '{"A": "135", "B": "181", "C": "117", "D": "115"}'::jsonb,
    '"C"'::jsonb,
    713,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (117) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=32 with 0≤x≤10, 0≤y≤10, 0≤z≤11?',
    'mcq',
    '{"A": "8", "B": "0", "C": "2", "D": "14"}'::jsonb,
    '"B"'::jsonb,
    714,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=33 with 0≤x≤14, 0≤y≤10, 0≤z≤14?',
    'mcq',
    '{"A": "21", "B": "15", "C": "18", "D": "27"}'::jsonb,
    '"A"'::jsonb,
    715,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (21) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=28 with 0≤x≤15, 0≤y≤13, 0≤z≤14?',
    'mcq',
    '{"A": "153", "B": "119", "C": "99", "D": "59"}'::jsonb,
    '"B"'::jsonb,
    716,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (119) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=27 with 0≤x≤15, 0≤y≤12, 0≤z≤11?',
    'mcq',
    '{"A": "50", "B": "78", "C": "52", "D": "30"}'::jsonb,
    '"B"'::jsonb,
    717,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (78) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=33 with 0≤x≤13, 0≤y≤11, 0≤z≤13?',
    'mcq',
    '{"A": "20", "B": "16", "C": "22", "D": "15"}'::jsonb,
    '"D"'::jsonb,
    718,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (15) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=26 with 0≤x≤10, 0≤y≤11, 0≤z≤13?',
    'mcq',
    '{"A": "61", "B": "13", "C": "45", "D": "47"}'::jsonb,
    '"C"'::jsonb,
    719,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (45) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'How many integer solutions (x,y,z) satisfy x+y+z=31 with 0≤x≤13, 0≤y≤10, 0≤z≤15?',
    'mcq',
    '{"A": "48", "B": "36", "C": "58", "D": "12"}'::jsonb,
    '"B"'::jsonb,
    720,
    TRUE,
    'Step 1: Identify the key concept (Logic - ComplexConstraints).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (36) with the correct option.',
    '{"grade": "PG", "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=17, r1=36 with discount γ=0.77. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "43.797", "B": "44.72", "C": "44.462", "D": "46.35"}'::jsonb,
    '"B"'::jsonb,
    721,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (44.72) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'State ''good'' prob=0.42 with payoff 22092 if invest, ''bad'' payoff -1260 if invest; do-nothing payoff 0. Compute EVPI. (round to 2 decimals)',
    'mcq',
    '{"A": "1887.799", "B": "730.8", "C": "39.841", "D": "89.624"}'::jsonb,
    '"B"'::jsonb,
    722,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ValueOfInformation).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (730.8) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'State ''good'' prob=0.57 with payoff 15680 if invest, ''bad'' payoff 3073 if invest; do-nothing payoff 0. Compute EVPI. (round to 2 decimals)',
    'mcq',
    '{"A": "3.123", "B": "0.0", "C": "380.861", "D": "309.551"}'::jsonb,
    '"B"'::jsonb,
    723,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ValueOfInformation).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (0.0) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'State ''good'' prob=0.47 with payoff 45265 if invest, ''bad'' payoff -19794 if invest; do-nothing payoff 0. Compute EVPI. (round to 2 decimals)',
    'mcq',
    '{"A": "10554.513", "B": "10701.466", "C": "9930.831", "D": "10490.82"}'::jsonb,
    '"D"'::jsonb,
    724,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ValueOfInformation).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (10490.82) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=23, r1=31 with discount γ=0.83. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "47.981", "B": "48.73", "C": "49.307", "D": "48.088"}'::jsonb,
    '"B"'::jsonb,
    725,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (48.73) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=8, r1=32 with discount γ=0.72. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "31.04", "B": "29.488", "C": "30.979", "D": "31.745"}'::jsonb,
    '"A"'::jsonb,
    726,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (31.04) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=35, r1=28 with discount γ=0.82. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "58.227", "B": "58.529", "C": "59.51", "D": "57.96"}'::jsonb,
    '"D"'::jsonb,
    727,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (57.96) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Payoffs: A1=[39, 39] across states S1,S2; A2=[38, 19]. Using minimax regret, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "1", "B": "4", "C": "3", "D": "2"}'::jsonb,
    '"A"'::jsonb,
    728,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MinimaxRegret).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Payoffs: A1=[34, 50] across states S1,S2; A2=[19, 35]. Using minimax regret, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "4", "B": "2", "C": "1", "D": "3"}'::jsonb,
    '"C"'::jsonb,
    729,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MinimaxRegret).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'State ''good'' prob=0.56 with payoff 24052 if invest, ''bad'' payoff -12890 if invest; do-nothing payoff 0. Compute EVPI. (round to 2 decimals)',
    'mcq',
    '{"A": "6427.314", "B": "5519.756", "C": "5401.715", "D": "5671.6"}'::jsonb,
    '"D"'::jsonb,
    730,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ValueOfInformation).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5671.6) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Payoffs: A1=[24, 22] across states S1,S2; A2=[41, 48]. Using minimax regret, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "1", "B": "3", "C": "2", "D": "4"}'::jsonb,
    '"C"'::jsonb,
    731,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MinimaxRegret).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'State ''good'' prob=0.41 with payoff 18947 if invest, ''bad'' payoff -17808 if invest; do-nothing payoff 0. Compute EVPI. (round to 2 decimals)',
    'mcq',
    '{"A": "7768.27", "B": "8254.544", "C": "7391.95", "D": "6243.545"}'::jsonb,
    '"A"'::jsonb,
    732,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ValueOfInformation).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (7768.27) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Payoffs: A1=[50, 29] across states S1,S2; A2=[53, 49]. Using minimax regret, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "2", "B": "1", "C": "3", "D": "4"}'::jsonb,
    '"A"'::jsonb,
    733,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MinimaxRegret).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=28, r1=13 with discount γ=0.79. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "38.716", "B": "38.404", "C": "38.27", "D": "37.298"}'::jsonb,
    '"C"'::jsonb,
    734,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (38.27) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Payoffs: A1=[60, 27] across states S1,S2; A2=[45, 31]. Using minimax regret, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "2", "B": "1", "C": "4", "D": "3"}'::jsonb,
    '"B"'::jsonb,
    735,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MinimaxRegret).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (1) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=19, r1=20 with discount γ=0.9. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "38.792", "B": "37.0", "C": "36.427", "D": "36.465"}'::jsonb,
    '"B"'::jsonb,
    736,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (37.0) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=22, r1=9 with discount γ=0.81. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "29.29", "B": "30.867", "C": "28.435", "D": "30.743"}'::jsonb,
    '"A"'::jsonb,
    737,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (29.29) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Payoffs: A1=[45, 19] across states S1,S2; A2=[60, 27]. Using minimax regret, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "1", "B": "4", "C": "2", "D": "3"}'::jsonb,
    '"C"'::jsonb,
    738,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MinimaxRegret).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=17, r1=12 with discount γ=0.77. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "25.668", "B": "27.335", "C": "26.24", "D": "26.348"}'::jsonb,
    '"C"'::jsonb,
    739,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (26.24) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'State ''good'' prob=0.22 with payoff 39618 if invest, ''bad'' payoff -17421 if invest; do-nothing payoff 0. Compute EVPI. (round to 2 decimals)',
    'mcq',
    '{"A": "7827.493", "B": "9010.897", "C": "8001.209", "D": "8715.96"}'::jsonb,
    '"D"'::jsonb,
    740,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ValueOfInformation).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (8715.96) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Payoffs: A1=[28, 20] across states S1,S2; A2=[47, 18]. Using minimax regret, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "2", "B": "4", "C": "1", "D": "3"}'::jsonb,
    '"A"'::jsonb,
    741,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MinimaxRegret).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Payoffs: A1=[19, 30] across states S1,S2; A2=[56, 34]. Using minimax regret, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "4", "B": "2", "C": "3", "D": "1"}'::jsonb,
    '"B"'::jsonb,
    742,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MinimaxRegret).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=7, r1=23 with discount γ=0.78. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "24.171", "B": "24.051", "C": "24.94", "D": "25.677"}'::jsonb,
    '"C"'::jsonb,
    743,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (24.94) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=20, r1=10 with discount γ=0.89. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "28.9", "B": "27.373", "C": "29.154", "D": "30.847"}'::jsonb,
    '"A"'::jsonb,
    744,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (28.9) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=14, r1=40 with discount γ=0.91. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "50.4", "B": "50.802", "C": "50.134", "D": "48.753"}'::jsonb,
    '"A"'::jsonb,
    745,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (50.4) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'State ''good'' prob=0.77 with payoff 21022 if invest, ''bad'' payoff -3597 if invest; do-nothing payoff 0. Compute EVPI. (round to 2 decimals)',
    'mcq',
    '{"A": "827.31", "B": "316.108", "C": "39.696", "D": "858.217"}'::jsonb,
    '"A"'::jsonb,
    746,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ValueOfInformation).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (827.31) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Payoffs: A1=[10, 32] across states S1,S2; A2=[54, 15]. Using minimax regret, choose action index (1 for A1, 2 for A2).',
    'mcq',
    '{"A": "2", "B": "1", "C": "4", "D": "3"}'::jsonb,
    '"A"'::jsonb,
    747,
    TRUE,
    'Step 1: Identify the key concept (CritThink - MinimaxRegret).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (2) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=23, r1=22 with discount γ=0.84. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "42.216", "B": "41.48", "C": "42.015", "D": "43.166"}'::jsonb,
    '"B"'::jsonb,
    748,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (41.48) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A 2-step reward has r0=37, r1=30 with discount γ=0.75. Compute discounted return r0 + γ·r1.',
    'mcq',
    '{"A": "59.186", "B": "59.98", "C": "60.314", "D": "59.5"}'::jsonb,
    '"D"'::jsonb,
    749,
    TRUE,
    'Step 1: Identify the key concept (CritThink - DynamicPolicy).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (59.5) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'State ''good'' prob=0.54 with payoff 28536 if invest, ''bad'' payoff -12896 if invest; do-nothing payoff 0. Compute EVPI. (round to 2 decimals)',
    'mcq',
    '{"A": "6620.453", "B": "5932.16", "C": "6749.968", "D": "5942.098"}'::jsonb,
    '"B"'::jsonb,
    750,
    TRUE,
    'Step 1: Identify the key concept (CritThink - ValueOfInformation).
Step 2: Apply the correct method/formula to compute the result.
Step 3: Match the computed value (5932.16) with the correct option.',
    '{"grade": "PG", "dimension": "CT", "difficulty_rank": 5, "time_target_sec": 120}'::jsonb
  ) ON CONFLICT DO NOTHING;

END $$;