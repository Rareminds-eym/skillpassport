-- Seed file for UG Adaptive Aptitude Questions
-- Generated from UG_Adaptive_Aptitude_750_VISIBLE_QUOTES.csv

-- Insert section for UG
INSERT INTO personal_assessment_sections (id, name, title, description, grade_level, order_number)
VALUES (
  gen_random_uuid(),
  'Adaptive Aptitude Test - UG',
  'Adaptive Aptitude Test - UG',
  'Adaptive aptitude assessment for undergraduate students',
  'college',
  1
)
ON CONFLICT (name) DO NOTHING;

-- Get section_id for questions
DO $$
DECLARE
  v_section_id UUID;
BEGIN
  SELECT id INTO v_section_id FROM personal_assessment_sections WHERE name = 'Adaptive Aptitude Test - UG' AND grade_level = 'college';

  IF v_section_id IS NULL THEN
    RAISE EXCEPTION 'Section not found for UG';
  END IF;

  -- Insert questions
  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 18, 36, 72, 144, ?',
    'mcq',
    '{"A": "288", "B": "324", "C": "216", "D": "252"}'::jsonb,
    '"A"'::jsonb,
    1,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '30% of 1200 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "840", "B": "30", "C": "460", "D": "360"}'::jsonb,
    '"D"'::jsonb,
    2,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 243. What is the value?',
    'mcq',
    '{"A": "27", "B": "243", "C": "24", "D": "30"}'::jsonb,
    '"A"'::jsonb,
    3,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 150 users in Q1 and 151 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "251", "B": "301", "C": "351", "D": "1"}'::jsonb,
    '"B"'::jsonb,
    4,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '30% of 800 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "30", "B": "340", "C": "240", "D": "560"}'::jsonb,
    '"C"'::jsonb,
    5,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 225 users in Q1 and 211 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "486", "B": "436", "C": "386", "D": "14"}'::jsonb,
    '"B"'::jsonb,
    6,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '10% of 500 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "10", "B": "150", "C": "450", "D": "50"}'::jsonb,
    '"D"'::jsonb,
    7,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'All algorithms are logical procedures. Some logical procedures are optimized. What follows?',
    'mcq',
    '{"A": "Optimization is impossible", "B": "Some algorithms may be optimized", "C": "All procedures are algorithms", "D": "No algorithms are optimized"}'::jsonb,
    '"B"'::jsonb,
    8,
    TRUE,
    'Logical Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 189. What is the value?',
    'mcq',
    '{"A": "24", "B": "18", "C": "21", "D": "189"}'::jsonb,
    '"C"'::jsonb,
    9,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 37 and 22 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "73", "B": "15", "C": "45", "D": "59"}'::jsonb,
    '"C"'::jsonb,
    10,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 16, 32, 64, 128, ?',
    'mcq',
    '{"A": "256", "B": "192", "C": "288", "D": "224"}'::jsonb,
    '"A"'::jsonb,
    11,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 51 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "98", "B": "112", "C": "84", "D": "4"}'::jsonb,
    '"C"'::jsonb,
    12,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '25% of 800 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "200", "B": "300", "C": "600", "D": "25"}'::jsonb,
    '"A"'::jsonb,
    13,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 225. What is the value?',
    'mcq',
    '{"A": "22", "B": "28", "C": "25", "D": "225"}'::jsonb,
    '"C"'::jsonb,
    14,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 44 and 44 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "95", "B": "81", "C": "88", "D": "0"}'::jsonb,
    '"B"'::jsonb,
    15,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 6, 12, 24, 48, ?',
    'mcq',
    '{"A": "72", "B": "96", "C": "108", "D": "84"}'::jsonb,
    '"B"'::jsonb,
    16,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 99. What is the value?',
    'mcq',
    '{"A": "14", "B": "99", "C": "8", "D": "11"}'::jsonb,
    '"D"'::jsonb,
    17,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '30% of 500 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "250", "B": "150", "C": "30", "D": "350"}'::jsonb,
    '"B"'::jsonb,
    18,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '30% of 1000 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "400", "B": "300", "C": "30", "D": "700"}'::jsonb,
    '"B"'::jsonb,
    19,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '20% of 600 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "480", "B": "120", "C": "220", "D": "20"}'::jsonb,
    '"B"'::jsonb,
    20,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 7, 14, 28, 56, ?',
    'mcq',
    '{"A": "126", "B": "98", "C": "84", "D": "112"}'::jsonb,
    '"D"'::jsonb,
    21,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '15% of 1200 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "1020", "B": "180", "C": "15", "D": "280"}'::jsonb,
    '"B"'::jsonb,
    22,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 54. What is the value?',
    'mcq',
    '{"A": "3", "B": "9", "C": "54", "D": "6"}'::jsonb,
    '"D"'::jsonb,
    23,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 13, 26, 52, 104, ?',
    'mcq',
    '{"A": "182", "B": "208", "C": "234", "D": "156"}'::jsonb,
    '"B"'::jsonb,
    24,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 15, 30, 60, 120, ?',
    'mcq',
    '{"A": "210", "B": "270", "C": "180", "D": "240"}'::jsonb,
    '"D"'::jsonb,
    25,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 252. What is the value?',
    'mcq',
    '{"A": "25", "B": "28", "C": "31", "D": "252"}'::jsonb,
    '"B"'::jsonb,
    26,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 162. What is the value?',
    'mcq',
    '{"A": "15", "B": "21", "C": "18", "D": "162"}'::jsonb,
    '"C"'::jsonb,
    27,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 138 users in Q1 and 275 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "463", "B": "363", "C": "413", "D": "137"}'::jsonb,
    '"C"'::jsonb,
    28,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 234. What is the value?',
    'mcq',
    '{"A": "234", "B": "26", "C": "23", "D": "29"}'::jsonb,
    '"B"'::jsonb,
    29,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 459 users in Q1 and 71 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "388", "B": "530", "C": "580", "D": "480"}'::jsonb,
    '"B"'::jsonb,
    30,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '20% of 800 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "160", "B": "260", "C": "20", "D": "640"}'::jsonb,
    '"A"'::jsonb,
    31,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 14, 28, 56, 112, ?',
    'mcq',
    '{"A": "196", "B": "224", "C": "252", "D": "168"}'::jsonb,
    '"B"'::jsonb,
    32,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 56 and 26 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "91", "B": "82", "C": "73", "D": "30"}'::jsonb,
    '"C"'::jsonb,
    33,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 20, 40, 80, 160, ?',
    'mcq',
    '{"A": "320", "B": "240", "C": "360", "D": "280"}'::jsonb,
    '"A"'::jsonb,
    34,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 506 users in Q1 and 100 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "406", "B": "556", "C": "656", "D": "606"}'::jsonb,
    '"D"'::jsonb,
    35,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 126. What is the value?',
    'mcq',
    '{"A": "126", "B": "11", "C": "17", "D": "14"}'::jsonb,
    '"D"'::jsonb,
    36,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 148 users in Q1 and 289 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "141", "B": "487", "C": "387", "D": "437"}'::jsonb,
    '"D"'::jsonb,
    37,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 9, 18, 36, 72, ?',
    'mcq',
    '{"A": "126", "B": "144", "C": "108", "D": "162"}'::jsonb,
    '"B"'::jsonb,
    38,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 51 and 55 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "114", "B": "106", "C": "4", "D": "98"}'::jsonb,
    '"D"'::jsonb,
    39,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '25% of 500 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "25", "B": "225", "C": "375", "D": "125"}'::jsonb,
    '"D"'::jsonb,
    40,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 177 users in Q1 and 68 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "295", "B": "109", "C": "195", "D": "245"}'::jsonb,
    '"D"'::jsonb,
    41,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 386 users in Q1 and 241 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "145", "B": "627", "C": "677", "D": "577"}'::jsonb,
    '"B"'::jsonb,
    42,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 15 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "88", "B": "60", "C": "44", "D": "74"}'::jsonb,
    '"B"'::jsonb,
    43,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 32 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "8", "B": "56", "C": "69", "D": "43"}'::jsonb,
    '"D"'::jsonb,
    44,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 144. What is the value?',
    'mcq',
    '{"A": "13", "B": "16", "C": "19", "D": "144"}'::jsonb,
    '"B"'::jsonb,
    45,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '20% of 1000 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "20", "B": "300", "C": "200", "D": "800"}'::jsonb,
    '"C"'::jsonb,
    46,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 22 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "60", "B": "6", "C": "50", "D": "40"}'::jsonb,
    '"D"'::jsonb,
    47,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 207. What is the value?',
    'mcq',
    '{"A": "20", "B": "207", "C": "26", "D": "23"}'::jsonb,
    '"D"'::jsonb,
    48,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 11, 22, 44, 88, ?',
    'mcq',
    '{"A": "154", "B": "198", "C": "176", "D": "132"}'::jsonb,
    '"C"'::jsonb,
    49,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 475 users in Q1 and 105 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "530", "B": "580", "C": "630", "D": "370"}'::jsonb,
    '"B"'::jsonb,
    50,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 171. What is the value?',
    'mcq',
    '{"A": "171", "B": "19", "C": "16", "D": "22"}'::jsonb,
    '"B"'::jsonb,
    51,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 52 and 37 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "89", "B": "84", "C": "94", "D": "15"}'::jsonb,
    '"B"'::jsonb,
    52,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 463 users in Q1 and 214 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "627", "B": "249", "C": "727", "D": "677"}'::jsonb,
    '"D"'::jsonb,
    53,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 55 and 16 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "39", "B": "71", "C": "66", "D": "76"}'::jsonb,
    '"C"'::jsonb,
    54,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 148 users in Q1 and 155 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "253", "B": "303", "C": "7", "D": "353"}'::jsonb,
    '"B"'::jsonb,
    55,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '20% of 1200 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "240", "B": "340", "C": "960", "D": "20"}'::jsonb,
    '"A"'::jsonb,
    56,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 33 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "14", "B": "71", "C": "89", "D": "80"}'::jsonb,
    '"B"'::jsonb,
    57,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '15% of 1000 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "850", "B": "250", "C": "150", "D": "15"}'::jsonb,
    '"C"'::jsonb,
    58,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '10% of 1200 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "1080", "B": "220", "C": "120", "D": "10"}'::jsonb,
    '"C"'::jsonb,
    59,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 340 users in Q1 and 194 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "534", "B": "484", "C": "146", "D": "584"}'::jsonb,
    '"A"'::jsonb,
    60,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 198. What is the value?',
    'mcq',
    '{"A": "22", "B": "25", "C": "19", "D": "198"}'::jsonb,
    '"A"'::jsonb,
    61,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 39 and 49 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "88", "B": "79", "C": "10", "D": "97"}'::jsonb,
    '"B"'::jsonb,
    62,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 385 users in Q1 and 103 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "282", "B": "538", "C": "438", "D": "488"}'::jsonb,
    '"D"'::jsonb,
    63,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 10, 20, 40, 80, ?',
    'mcq',
    '{"A": "120", "B": "140", "C": "160", "D": "180"}'::jsonb,
    '"C"'::jsonb,
    64,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 48 and 37 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "85", "B": "11", "C": "91", "D": "79"}'::jsonb,
    '"D"'::jsonb,
    65,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 60 and 53 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "105", "B": "7", "C": "121", "D": "113"}'::jsonb,
    '"A"'::jsonb,
    66,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 8, 16, 32, 64, ?',
    'mcq',
    '{"A": "96", "B": "112", "C": "128", "D": "144"}'::jsonb,
    '"C"'::jsonb,
    67,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 12, 24, 48, 96, ?',
    'mcq',
    '{"A": "144", "B": "192", "C": "168", "D": "216"}'::jsonb,
    '"B"'::jsonb,
    68,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 55 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "69", "B": "99", "C": "26", "D": "84"}'::jsonb,
    '"A"'::jsonb,
    69,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 81. What is the value?',
    'mcq',
    '{"A": "81", "B": "6", "C": "12", "D": "9"}'::jsonb,
    '"D"'::jsonb,
    70,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 435 users in Q1 and 275 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "760", "B": "710", "C": "160", "D": "660"}'::jsonb,
    '"B"'::jsonb,
    71,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 90. What is the value?',
    'mcq',
    '{"A": "10", "B": "7", "C": "90", "D": "13"}'::jsonb,
    '"A"'::jsonb,
    72,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 143 users in Q1 and 226 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "369", "B": "319", "C": "419", "D": "83"}'::jsonb,
    '"A"'::jsonb,
    73,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 54 and 26 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "28", "B": "95", "C": "80", "D": "65"}'::jsonb,
    '"D"'::jsonb,
    74,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 20 and 19 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "39", "B": "1", "C": "49", "D": "29"}'::jsonb,
    '"D"'::jsonb,
    75,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '30% of 600 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "280", "B": "30", "C": "180", "D": "420"}'::jsonb,
    '"C"'::jsonb,
    76,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 155 users in Q1 and 139 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "294", "B": "244", "C": "344", "D": "16"}'::jsonb,
    '"A"'::jsonb,
    77,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '25% of 1000 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "25", "B": "750", "C": "350", "D": "250"}'::jsonb,
    '"D"'::jsonb,
    78,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 216. What is the value?',
    'mcq',
    '{"A": "27", "B": "24", "C": "216", "D": "21"}'::jsonb,
    '"B"'::jsonb,
    79,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 291 users in Q1 and 55 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "236", "B": "296", "C": "396", "D": "346"}'::jsonb,
    '"D"'::jsonb,
    80,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 41 and 32 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "73", "B": "9", "C": "86", "D": "60"}'::jsonb,
    '"D"'::jsonb,
    81,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 424 users in Q1 and 245 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "719", "B": "669", "C": "619", "D": "179"}'::jsonb,
    '"B"'::jsonb,
    82,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 17, 34, 68, 136, ?',
    'mcq',
    '{"A": "238", "B": "272", "C": "204", "D": "306"}'::jsonb,
    '"B"'::jsonb,
    83,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 45. What is the value?',
    'mcq',
    '{"A": "5", "B": "45", "C": "8", "D": "2"}'::jsonb,
    '"A"'::jsonb,
    84,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 27 and 23 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "50", "B": "45", "C": "55", "D": "4"}'::jsonb,
    '"B"'::jsonb,
    85,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 23 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "39", "B": "48", "C": "57", "D": "2"}'::jsonb,
    '"A"'::jsonb,
    86,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 28 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "49", "B": "0", "C": "63", "D": "56"}'::jsonb,
    '"A"'::jsonb,
    87,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 72. What is the value?',
    'mcq',
    '{"A": "8", "B": "72", "C": "5", "D": "11"}'::jsonb,
    '"A"'::jsonb,
    88,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 149 users in Q1 and 212 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "311", "B": "411", "C": "361", "D": "63"}'::jsonb,
    '"C"'::jsonb,
    89,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 42 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "74", "B": "5", "C": "89", "D": "104"}'::jsonb,
    '"A"'::jsonb,
    90,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '15% of 600 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "190", "B": "510", "C": "90", "D": "15"}'::jsonb,
    '"C"'::jsonb,
    91,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 270 users in Q1 and 99 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "369", "B": "419", "C": "319", "D": "171"}'::jsonb,
    '"A"'::jsonb,
    92,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 407 users in Q1 and 234 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "173", "B": "691", "C": "591", "D": "641"}'::jsonb,
    '"D"'::jsonb,
    93,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 44 and 21 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "55", "B": "65", "C": "75", "D": "23"}'::jsonb,
    '"A"'::jsonb,
    94,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 34 and 23 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "57", "B": "63", "C": "51", "D": "11"}'::jsonb,
    '"C"'::jsonb,
    95,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '25% of 1200 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "300", "B": "400", "C": "25", "D": "900"}'::jsonb,
    '"A"'::jsonb,
    96,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '15% of 500 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "175", "B": "75", "C": "425", "D": "15"}'::jsonb,
    '"B"'::jsonb,
    97,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 23 and 54 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "85", "B": "31", "C": "69", "D": "77"}'::jsonb,
    '"C"'::jsonb,
    98,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 35 and 34 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "62", "B": "69", "C": "76", "D": "1"}'::jsonb,
    '"A"'::jsonb,
    99,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 514 users in Q1 and 306 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "820", "B": "208", "C": "870", "D": "770"}'::jsonb,
    '"A"'::jsonb,
    100,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '10% of 800 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "80", "B": "180", "C": "10", "D": "720"}'::jsonb,
    '"A"'::jsonb,
    101,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 502 users in Q1 and 133 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "685", "B": "635", "C": "369", "D": "585"}'::jsonb,
    '"B"'::jsonb,
    102,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 42 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "13", "B": "83", "C": "71", "D": "59"}'::jsonb,
    '"D"'::jsonb,
    103,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 5, 10, 20, 40, ?',
    'mcq',
    '{"A": "70", "B": "60", "C": "90", "D": "80"}'::jsonb,
    '"D"'::jsonb,
    104,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 34 and 22 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "51", "B": "12", "C": "56", "D": "61"}'::jsonb,
    '"A"'::jsonb,
    105,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 42 and 16 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "47", "B": "58", "C": "26", "D": "69"}'::jsonb,
    '"A"'::jsonb,
    106,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 361 users in Q1 and 249 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "112", "B": "660", "C": "560", "D": "610"}'::jsonb,
    '"D"'::jsonb,
    107,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 469 users in Q1 and 173 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "642", "B": "692", "C": "592", "D": "296"}'::jsonb,
    '"A"'::jsonb,
    108,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 162 users in Q1 and 226 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "338", "B": "64", "C": "438", "D": "388"}'::jsonb,
    '"D"'::jsonb,
    109,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 322 users in Q1 and 199 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "521", "B": "571", "C": "123", "D": "471"}'::jsonb,
    '"A"'::jsonb,
    110,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 20 and 48 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "68", "B": "80", "C": "56", "D": "28"}'::jsonb,
    '"C"'::jsonb,
    111,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 188 users in Q1 and 52 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "290", "B": "240", "C": "136", "D": "190"}'::jsonb,
    '"B"'::jsonb,
    112,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 108. What is the value?',
    'mcq',
    '{"A": "108", "B": "15", "C": "9", "D": "12"}'::jsonb,
    '"D"'::jsonb,
    113,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 267 users in Q1 and 274 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "541", "B": "491", "C": "591", "D": "7"}'::jsonb,
    '"A"'::jsonb,
    114,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 55 and 18 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "60", "B": "37", "C": "86", "D": "73"}'::jsonb,
    '"A"'::jsonb,
    115,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 28 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "87", "B": "74", "C": "100", "D": "31"}'::jsonb,
    '"B"'::jsonb,
    116,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 35 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "49", "B": "59", "C": "11", "D": "69"}'::jsonb,
    '"A"'::jsonb,
    117,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 27 and 51 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "78", "B": "24", "C": "70", "D": "86"}'::jsonb,
    '"C"'::jsonb,
    118,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 480 users in Q1 and 51 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "481", "B": "531", "C": "429", "D": "581"}'::jsonb,
    '"B"'::jsonb,
    119,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 39 and 34 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "73", "B": "5", "C": "63", "D": "83"}'::jsonb,
    '"C"'::jsonb,
    120,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 332 users in Q1 and 55 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "277", "B": "387", "C": "437", "D": "337"}'::jsonb,
    '"B"'::jsonb,
    121,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 253 users in Q1 and 56 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "309", "B": "197", "C": "359", "D": "259"}'::jsonb,
    '"A"'::jsonb,
    122,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 38 and 30 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "8", "B": "62", "C": "74", "D": "68"}'::jsonb,
    '"B"'::jsonb,
    123,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 32 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "85", "B": "26", "C": "90", "D": "95"}'::jsonb,
    '"A"'::jsonb,
    124,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 48 and 30 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "65", "B": "91", "C": "18", "D": "78"}'::jsonb,
    '"A"'::jsonb,
    125,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 22 and 15 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "46", "B": "28", "C": "7", "D": "37"}'::jsonb,
    '"B"'::jsonb,
    126,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 48 and 43 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "5", "B": "86", "C": "96", "D": "91"}'::jsonb,
    '"B"'::jsonb,
    127,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 389 users in Q1 and 78 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "467", "B": "311", "C": "417", "D": "517"}'::jsonb,
    '"A"'::jsonb,
    128,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 60 and 17 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "43", "B": "90", "C": "64", "D": "77"}'::jsonb,
    '"C"'::jsonb,
    129,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 261. What is the value?',
    'mcq',
    '{"A": "261", "B": "32", "C": "29", "D": "26"}'::jsonb,
    '"C"'::jsonb,
    130,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 467 users in Q1 and 156 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "623", "B": "311", "C": "573", "D": "673"}'::jsonb,
    '"A"'::jsonb,
    131,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 23 and 20 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "53", "B": "33", "C": "3", "D": "43"}'::jsonb,
    '"B"'::jsonb,
    132,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 471 users in Q1 and 211 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "732", "B": "632", "C": "682", "D": "260"}'::jsonb,
    '"C"'::jsonb,
    133,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 45 and 51 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "84", "B": "96", "C": "108", "D": "6"}'::jsonb,
    '"A"'::jsonb,
    134,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 366 users in Q1 and 171 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "195", "B": "587", "C": "487", "D": "537"}'::jsonb,
    '"D"'::jsonb,
    135,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 448 users in Q1 and 167 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "281", "B": "615", "C": "565", "D": "665"}'::jsonb,
    '"B"'::jsonb,
    136,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 117. What is the value?',
    'mcq',
    '{"A": "117", "B": "10", "C": "13", "D": "16"}'::jsonb,
    '"C"'::jsonb,
    137,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 505 users in Q1 and 70 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "435", "B": "575", "C": "525", "D": "625"}'::jsonb,
    '"B"'::jsonb,
    138,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 154 users in Q1 and 51 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "155", "B": "255", "C": "205", "D": "103"}'::jsonb,
    '"C"'::jsonb,
    139,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 44 and 46 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "99", "B": "2", "C": "90", "D": "81"}'::jsonb,
    '"D"'::jsonb,
    140,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '10% of 600 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "60", "B": "160", "C": "10", "D": "540"}'::jsonb,
    '"A"'::jsonb,
    141,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 54 and 22 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "32", "B": "70", "C": "76", "D": "82"}'::jsonb,
    '"B"'::jsonb,
    142,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 444 users in Q1 and 268 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "762", "B": "176", "C": "662", "D": "712"}'::jsonb,
    '"D"'::jsonb,
    143,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 53 and 19 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "79", "B": "72", "C": "34", "D": "65"}'::jsonb,
    '"D"'::jsonb,
    144,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '20% of 500 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "400", "B": "100", "C": "200", "D": "20"}'::jsonb,
    '"B"'::jsonb,
    145,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 41 and 28 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "69", "B": "81", "C": "57", "D": "13"}'::jsonb,
    '"C"'::jsonb,
    146,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 343 users in Q1 and 258 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "551", "B": "601", "C": "85", "D": "651"}'::jsonb,
    '"B"'::jsonb,
    147,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 236 users in Q1 and 284 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "48", "B": "520", "C": "470", "D": "570"}'::jsonb,
    '"B"'::jsonb,
    148,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 229 users in Q1 and 294 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "523", "B": "473", "C": "65", "D": "573"}'::jsonb,
    '"A"'::jsonb,
    149,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 52 and 24 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "66", "B": "28", "C": "76", "D": "86"}'::jsonb,
    '"A"'::jsonb,
    150,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 35 and 52 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "79", "B": "87", "C": "17", "D": "95"}'::jsonb,
    '"A"'::jsonb,
    151,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Sequence: 19, 38, 76, 152, ?',
    'mcq',
    '{"A": "228", "B": "266", "C": "304", "D": "342"}'::jsonb,
    '"C"'::jsonb,
    152,
    TRUE,
    'Abstract & Pattern Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 52 and 16 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "78", "B": "36", "C": "58", "D": "68"}'::jsonb,
    '"C"'::jsonb,
    153,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 519 users in Q1 and 262 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "781", "B": "731", "C": "257", "D": "831"}'::jsonb,
    '"A"'::jsonb,
    154,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '25% of 600 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "250", "B": "450", "C": "150", "D": "25"}'::jsonb,
    '"C"'::jsonb,
    155,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 382 users in Q1 and 202 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "180", "B": "534", "C": "584", "D": "634"}'::jsonb,
    '"C"'::jsonb,
    156,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 455 users in Q1 and 57 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "562", "B": "512", "C": "398", "D": "462"}'::jsonb,
    '"B"'::jsonb,
    157,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 46 and 19 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "56", "B": "74", "C": "65", "D": "27"}'::jsonb,
    '"A"'::jsonb,
    158,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 340 users in Q1 and 156 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "546", "B": "184", "C": "446", "D": "496"}'::jsonb,
    '"D"'::jsonb,
    159,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 63. What is the value?',
    'mcq',
    '{"A": "10", "B": "63", "C": "7", "D": "4"}'::jsonb,
    '"C"'::jsonb,
    160,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 16 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "51", "B": "31", "C": "9", "D": "41"}'::jsonb,
    '"B"'::jsonb,
    161,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 34 and 36 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "2", "B": "70", "C": "61", "D": "79"}'::jsonb,
    '"C"'::jsonb,
    162,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 422 users in Q1 and 322 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "694", "B": "100", "C": "744", "D": "794"}'::jsonb,
    '"C"'::jsonb,
    163,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 281 users in Q1 and 165 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "396", "B": "116", "C": "446", "D": "496"}'::jsonb,
    '"C"'::jsonb,
    164,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 39 and 22 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "17", "B": "46", "C": "76", "D": "61"}'::jsonb,
    '"B"'::jsonb,
    165,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 185 users in Q1 and 164 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "349", "B": "399", "C": "21", "D": "299"}'::jsonb,
    '"A"'::jsonb,
    166,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 168 users in Q1 and 286 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "454", "B": "118", "C": "404", "D": "504"}'::jsonb,
    '"A"'::jsonb,
    167,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 418 users in Q1 and 111 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "307", "B": "529", "C": "579", "D": "479"}'::jsonb,
    '"B"'::jsonb,
    168,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 420 users in Q1 and 205 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "215", "B": "575", "C": "625", "D": "675"}'::jsonb,
    '"C"'::jsonb,
    169,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 502 users in Q1 and 273 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "775", "B": "725", "C": "229", "D": "825"}'::jsonb,
    '"A"'::jsonb,
    170,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 33 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "9", "B": "57", "C": "43", "D": "71"}'::jsonb,
    '"C"'::jsonb,
    171,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 249 users in Q1 and 317 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "616", "B": "68", "C": "516", "D": "566"}'::jsonb,
    '"D"'::jsonb,
    172,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 490 users in Q1 and 50 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "590", "B": "440", "C": "490", "D": "540"}'::jsonb,
    '"D"'::jsonb,
    173,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 306. What is the value?',
    'mcq',
    '{"A": "31", "B": "34", "C": "306", "D": "37"}'::jsonb,
    '"B"'::jsonb,
    174,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 33 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "91", "B": "76", "C": "106", "D": "25"}'::jsonb,
    '"B"'::jsonb,
    175,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 369 users in Q1 and 172 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "541", "B": "491", "C": "197", "D": "591"}'::jsonb,
    '"A"'::jsonb,
    176,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 17 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "89", "B": "42", "C": "76", "D": "63"}'::jsonb,
    '"D"'::jsonb,
    177,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 27 and 31 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "58", "B": "71", "C": "45", "D": "4"}'::jsonb,
    '"C"'::jsonb,
    178,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 519 users in Q1 and 151 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "368", "B": "670", "C": "720", "D": "620"}'::jsonb,
    '"B"'::jsonb,
    179,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 424 users in Q1 and 173 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "597", "B": "647", "C": "547", "D": "251"}'::jsonb,
    '"A"'::jsonb,
    180,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 54 and 35 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "19", "B": "95", "C": "89", "D": "83"}'::jsonb,
    '"D"'::jsonb,
    181,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 212 users in Q1 and 197 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "15", "B": "409", "C": "359", "D": "459"}'::jsonb,
    '"B"'::jsonb,
    182,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 30 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "100", "B": "28", "C": "76", "D": "88"}'::jsonb,
    '"C"'::jsonb,
    183,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 51 and 20 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "60", "B": "71", "C": "31", "D": "82"}'::jsonb,
    '"A"'::jsonb,
    184,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 310 users in Q1 and 211 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "521", "B": "571", "C": "471", "D": "99"}'::jsonb,
    '"A"'::jsonb,
    185,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 250 users in Q1 and 171 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "421", "B": "79", "C": "371", "D": "471"}'::jsonb,
    '"A"'::jsonb,
    186,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 321 users in Q1 and 189 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "132", "B": "560", "C": "510", "D": "460"}'::jsonb,
    '"C"'::jsonb,
    187,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 360 users in Q1 and 57 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "467", "B": "417", "C": "303", "D": "367"}'::jsonb,
    '"B"'::jsonb,
    188,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 404 users in Q1 and 284 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "738", "B": "638", "C": "688", "D": "120"}'::jsonb,
    '"C"'::jsonb,
    189,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 443 users in Q1 and 333 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "726", "B": "110", "C": "826", "D": "776"}'::jsonb,
    '"D"'::jsonb,
    190,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 459 users in Q1 and 171 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "680", "B": "630", "C": "580", "D": "288"}'::jsonb,
    '"B"'::jsonb,
    191,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 393 users in Q1 and 214 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "657", "B": "607", "C": "179", "D": "557"}'::jsonb,
    '"B"'::jsonb,
    192,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '10% of 1000 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "900", "B": "10", "C": "100", "D": "200"}'::jsonb,
    '"C"'::jsonb,
    193,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 49 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "83", "B": "65", "C": "74", "D": "24"}'::jsonb,
    '"B"'::jsonb,
    194,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 53 and 29 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "82", "B": "24", "C": "94", "D": "70"}'::jsonb,
    '"D"'::jsonb,
    195,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 452 users in Q1 and 215 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "237", "B": "667", "C": "617", "D": "717"}'::jsonb,
    '"B"'::jsonb,
    196,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 30 and 25 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "49", "B": "55", "C": "61", "D": "5"}'::jsonb,
    '"A"'::jsonb,
    197,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 270. What is the value?',
    'mcq',
    '{"A": "27", "B": "30", "C": "33", "D": "270"}'::jsonb,
    '"B"'::jsonb,
    198,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 523 users in Q1 and 274 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "847", "B": "747", "C": "249", "D": "797"}'::jsonb,
    '"D"'::jsonb,
    199,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 173 users in Q1 and 262 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "89", "B": "435", "C": "485", "D": "385"}'::jsonb,
    '"B"'::jsonb,
    200,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 22 and 25 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "47", "B": "38", "C": "56", "D": "3"}'::jsonb,
    '"B"'::jsonb,
    201,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 362 users in Q1 and 317 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "629", "B": "729", "C": "45", "D": "679"}'::jsonb,
    '"D"'::jsonb,
    202,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 428 users in Q1 and 179 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "657", "B": "607", "C": "557", "D": "249"}'::jsonb,
    '"B"'::jsonb,
    203,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 36 and 22 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "58", "B": "53", "C": "14", "D": "63"}'::jsonb,
    '"B"'::jsonb,
    204,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 437 users in Q1 and 320 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "707", "B": "117", "C": "757", "D": "807"}'::jsonb,
    '"C"'::jsonb,
    205,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 308 users in Q1 and 175 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "483", "B": "533", "C": "133", "D": "433"}'::jsonb,
    '"A"'::jsonb,
    206,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 38 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "81", "B": "10", "C": "66", "D": "51"}'::jsonb,
    '"D"'::jsonb,
    207,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 34 and 44 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "65", "B": "91", "C": "78", "D": "10"}'::jsonb,
    '"A"'::jsonb,
    208,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 135. What is the value?',
    'mcq',
    '{"A": "135", "B": "15", "C": "18", "D": "12"}'::jsonb,
    '"B"'::jsonb,
    209,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 21 and 37 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "49", "B": "58", "C": "16", "D": "67"}'::jsonb,
    '"A"'::jsonb,
    210,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 53 and 30 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "23", "B": "74", "C": "83", "D": "92"}'::jsonb,
    '"B"'::jsonb,
    211,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 42 and 18 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "24", "B": "60", "C": "75", "D": "45"}'::jsonb,
    '"D"'::jsonb,
    212,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 34 and 36 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "2", "B": "75", "C": "70", "D": "65"}'::jsonb,
    '"D"'::jsonb,
    213,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 38 and 27 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "72", "B": "11", "C": "58", "D": "65"}'::jsonb,
    '"C"'::jsonb,
    214,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 288. What is the value?',
    'mcq',
    '{"A": "288", "B": "35", "C": "29", "D": "32"}'::jsonb,
    '"D"'::jsonb,
    215,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 39 and 20 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "19", "B": "64", "C": "54", "D": "59"}'::jsonb,
    '"C"'::jsonb,
    216,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 124 users in Q1 and 84 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "158", "B": "208", "C": "258", "D": "40"}'::jsonb,
    '"B"'::jsonb,
    217,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 21 and 38 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "17", "B": "71", "C": "47", "D": "59"}'::jsonb,
    '"C"'::jsonb,
    218,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    '15% of 800 survey respondents preferred option A. How many respondents is that?',
    'mcq',
    '{"A": "680", "B": "15", "C": "220", "D": "120"}'::jsonb,
    '"D"'::jsonb,
    219,
    TRUE,
    'Data Interpretation (UG level reasoning).',
    '{"grade": "UG", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 263 users in Q1 and 299 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "612", "B": "36", "C": "512", "D": "562"}'::jsonb,
    '"D"'::jsonb,
    220,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 54 and 30 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "24", "B": "84", "C": "71", "D": "97"}'::jsonb,
    '"C"'::jsonb,
    221,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 22 and 22 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "58", "B": "30", "C": "44", "D": "0"}'::jsonb,
    '"B"'::jsonb,
    222,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 57 and 17 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "74", "B": "63", "C": "85", "D": "40"}'::jsonb,
    '"B"'::jsonb,
    223,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 296 users in Q1 and 320 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "566", "B": "666", "C": "616", "D": "24"}'::jsonb,
    '"C"'::jsonb,
    224,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 390 users in Q1 and 338 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "678", "B": "728", "C": "52", "D": "778"}'::jsonb,
    '"B"'::jsonb,
    225,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 41 and 43 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "70", "B": "84", "C": "2", "D": "98"}'::jsonb,
    '"A"'::jsonb,
    226,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 37 and 27 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "64", "B": "79", "C": "10", "D": "49"}'::jsonb,
    '"D"'::jsonb,
    227,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 343 users in Q1 and 89 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "482", "B": "432", "C": "254", "D": "382"}'::jsonb,
    '"B"'::jsonb,
    228,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 43 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "18", "B": "56", "C": "80", "D": "68"}'::jsonb,
    '"B"'::jsonb,
    229,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 23 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "6", "B": "60", "C": "52", "D": "44"}'::jsonb,
    '"D"'::jsonb,
    230,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 31 and 25 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "6", "B": "46", "C": "56", "D": "66"}'::jsonb,
    '"B"'::jsonb,
    231,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 438 users in Q1 and 180 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "668", "B": "258", "C": "618", "D": "568"}'::jsonb,
    '"C"'::jsonb,
    232,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 402 users in Q1 and 112 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "564", "B": "290", "C": "464", "D": "514"}'::jsonb,
    '"D"'::jsonb,
    233,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 138 users in Q1 and 105 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "193", "B": "33", "C": "293", "D": "243"}'::jsonb,
    '"D"'::jsonb,
    234,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 16 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "43", "B": "75", "C": "67", "D": "83"}'::jsonb,
    '"C"'::jsonb,
    235,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 420 users in Q1 and 295 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "765", "B": "715", "C": "125", "D": "665"}'::jsonb,
    '"B"'::jsonb,
    236,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 44 and 52 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "96", "B": "8", "C": "109", "D": "83"}'::jsonb,
    '"D"'::jsonb,
    237,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 197 users in Q1 and 63 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "134", "B": "210", "C": "310", "D": "260"}'::jsonb,
    '"D"'::jsonb,
    238,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 54 and 18 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "36", "B": "60", "C": "84", "D": "72"}'::jsonb,
    '"B"'::jsonb,
    239,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 41 and 51 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "82", "B": "92", "C": "102", "D": "10"}'::jsonb,
    '"A"'::jsonb,
    240,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 305 users in Q1 and 84 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "221", "B": "389", "C": "439", "D": "339"}'::jsonb,
    '"B"'::jsonb,
    241,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 155 users in Q1 and 333 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "538", "B": "438", "C": "178", "D": "488"}'::jsonb,
    '"D"'::jsonb,
    242,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 249 users in Q1 and 218 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "31", "B": "517", "C": "467", "D": "417"}'::jsonb,
    '"C"'::jsonb,
    243,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 32 and 24 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "45", "B": "56", "C": "8", "D": "67"}'::jsonb,
    '"A"'::jsonb,
    244,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 60 and 46 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "96", "B": "106", "C": "14", "D": "116"}'::jsonb,
    '"A"'::jsonb,
    245,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 336 users in Q1 and 318 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "604", "B": "18", "C": "704", "D": "654"}'::jsonb,
    '"D"'::jsonb,
    246,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 411 users in Q1 and 142 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "503", "B": "603", "C": "553", "D": "269"}'::jsonb,
    '"C"'::jsonb,
    247,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 41 and 55 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "91", "B": "96", "C": "14", "D": "101"}'::jsonb,
    '"A"'::jsonb,
    248,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 423 users in Q1 and 294 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "129", "B": "717", "C": "667", "D": "767"}'::jsonb,
    '"B"'::jsonb,
    249,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 297. What is the value?',
    'mcq',
    '{"A": "297", "B": "33", "C": "36", "D": "30"}'::jsonb,
    '"B"'::jsonb,
    250,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 431 users in Q1 and 202 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "229", "B": "583", "C": "683", "D": "633"}'::jsonb,
    '"D"'::jsonb,
    251,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 45 and 32 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "13", "B": "64", "C": "90", "D": "77"}'::jsonb,
    '"B"'::jsonb,
    252,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 212 users in Q1 and 283 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "71", "B": "545", "C": "445", "D": "495"}'::jsonb,
    '"D"'::jsonb,
    253,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 398 users in Q1 and 243 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "155", "B": "641", "C": "591", "D": "691"}'::jsonb,
    '"B"'::jsonb,
    254,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 430 users in Q1 and 181 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "611", "B": "661", "C": "249", "D": "561"}'::jsonb,
    '"A"'::jsonb,
    255,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 315 users in Q1 and 156 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "159", "B": "471", "C": "421", "D": "521"}'::jsonb,
    '"B"'::jsonb,
    256,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 54 and 34 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "88", "B": "103", "C": "20", "D": "73"}'::jsonb,
    '"D"'::jsonb,
    257,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 57 and 17 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "61", "B": "87", "C": "74", "D": "40"}'::jsonb,
    '"A"'::jsonb,
    258,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 40 and 28 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "53", "B": "83", "C": "12", "D": "68"}'::jsonb,
    '"A"'::jsonb,
    259,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 20 and 50 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "70", "B": "81", "C": "30", "D": "59"}'::jsonb,
    '"D"'::jsonb,
    260,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 463 users in Q1 and 115 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "528", "B": "578", "C": "348", "D": "628"}'::jsonb,
    '"B"'::jsonb,
    261,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 160 users in Q1 and 214 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "424", "B": "324", "C": "54", "D": "374"}'::jsonb,
    '"D"'::jsonb,
    262,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 23 and 42 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "19", "B": "65", "C": "71", "D": "59"}'::jsonb,
    '"D"'::jsonb,
    263,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 56 and 30 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "26", "B": "79", "C": "93", "D": "86"}'::jsonb,
    '"B"'::jsonb,
    264,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 473 users in Q1 and 65 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "408", "B": "588", "C": "488", "D": "538"}'::jsonb,
    '"D"'::jsonb,
    265,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 526 users in Q1 and 138 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "664", "B": "388", "C": "614", "D": "714"}'::jsonb,
    '"A"'::jsonb,
    266,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 35 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "63", "B": "50", "C": "76", "D": "7"}'::jsonb,
    '"B"'::jsonb,
    267,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 34 and 16 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "41", "B": "50", "C": "18", "D": "59"}'::jsonb,
    '"A"'::jsonb,
    268,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 109 users in Q1 and 59 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "168", "B": "118", "C": "218", "D": "50"}'::jsonb,
    '"A"'::jsonb,
    269,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 24 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "66", "B": "40", "C": "53", "D": "5"}'::jsonb,
    '"B"'::jsonb,
    270,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 33 and 52 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "99", "B": "85", "C": "71", "D": "19"}'::jsonb,
    '"C"'::jsonb,
    271,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 32 and 29 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "3", "B": "73", "C": "61", "D": "49"}'::jsonb,
    '"D"'::jsonb,
    272,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 32 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "3", "B": "51", "C": "61", "D": "71"}'::jsonb,
    '"B"'::jsonb,
    273,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 309 users in Q1 and 272 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "37", "B": "581", "C": "631", "D": "531"}'::jsonb,
    '"B"'::jsonb,
    274,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 33 and 30 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "3", "B": "71", "C": "55", "D": "63"}'::jsonb,
    '"C"'::jsonb,
    275,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 28 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "40", "B": "53", "C": "3", "D": "66"}'::jsonb,
    '"A"'::jsonb,
    276,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 180 users in Q1 and 189 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "9", "B": "369", "C": "419", "D": "319"}'::jsonb,
    '"B"'::jsonb,
    277,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 410 users in Q1 and 312 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "722", "B": "772", "C": "98", "D": "672"}'::jsonb,
    '"A"'::jsonb,
    278,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 457 users in Q1 and 131 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "326", "B": "638", "C": "588", "D": "538"}'::jsonb,
    '"C"'::jsonb,
    279,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 206 users in Q1 and 186 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "342", "B": "442", "C": "392", "D": "20"}'::jsonb,
    '"C"'::jsonb,
    280,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 30 and 16 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "31", "B": "46", "C": "61", "D": "14"}'::jsonb,
    '"A"'::jsonb,
    281,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 47 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "71", "B": "18", "C": "81", "D": "76"}'::jsonb,
    '"A"'::jsonb,
    282,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 133 users in Q1 and 72 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "205", "B": "255", "C": "61", "D": "155"}'::jsonb,
    '"A"'::jsonb,
    283,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 45 and 41 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "86", "B": "79", "C": "93", "D": "4"}'::jsonb,
    '"B"'::jsonb,
    284,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 474 users in Q1 and 88 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "612", "B": "562", "C": "386", "D": "512"}'::jsonb,
    '"B"'::jsonb,
    285,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 22 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "86", "B": "76", "C": "37", "D": "81"}'::jsonb,
    '"B"'::jsonb,
    286,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 57 and 48 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "9", "B": "99", "C": "111", "D": "105"}'::jsonb,
    '"B"'::jsonb,
    287,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 443 users in Q1 and 157 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "286", "B": "600", "C": "550", "D": "650"}'::jsonb,
    '"B"'::jsonb,
    288,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 55 and 21 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "76", "B": "68", "C": "84", "D": "34"}'::jsonb,
    '"B"'::jsonb,
    289,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 467 users in Q1 and 129 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "646", "B": "596", "C": "338", "D": "546"}'::jsonb,
    '"B"'::jsonb,
    290,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 37 and 50 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "73", "B": "101", "C": "87", "D": "13"}'::jsonb,
    '"A"'::jsonb,
    291,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 429 users in Q1 and 58 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "487", "B": "437", "C": "537", "D": "371"}'::jsonb,
    '"A"'::jsonb,
    292,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 269 users in Q1 and 95 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "314", "B": "174", "C": "364", "D": "414"}'::jsonb,
    '"C"'::jsonb,
    293,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 46 and 24 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "82", "B": "70", "C": "58", "D": "22"}'::jsonb,
    '"C"'::jsonb,
    294,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 153. What is the value?',
    'mcq',
    '{"A": "14", "B": "20", "C": "17", "D": "153"}'::jsonb,
    '"C"'::jsonb,
    295,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 60 and 46 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "100", "B": "14", "C": "112", "D": "106"}'::jsonb,
    '"A"'::jsonb,
    296,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 22 and 48 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "70", "B": "26", "C": "85", "D": "55"}'::jsonb,
    '"D"'::jsonb,
    297,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 42 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "54", "B": "66", "C": "78", "D": "18"}'::jsonb,
    '"A"'::jsonb,
    298,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 102 users in Q1 and 107 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "159", "B": "209", "C": "5", "D": "259"}'::jsonb,
    '"B"'::jsonb,
    299,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 48 and 37 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "11", "B": "95", "C": "75", "D": "85"}'::jsonb,
    '"C"'::jsonb,
    300,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 39 and 17 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "56", "B": "22", "C": "42", "D": "70"}'::jsonb,
    '"C"'::jsonb,
    301,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 495 users in Q1 and 103 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "648", "B": "548", "C": "598", "D": "392"}'::jsonb,
    '"C"'::jsonb,
    302,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 260 users in Q1 and 299 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "609", "B": "39", "C": "509", "D": "559"}'::jsonb,
    '"D"'::jsonb,
    303,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 48 and 21 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "54", "B": "27", "C": "69", "D": "84"}'::jsonb,
    '"A"'::jsonb,
    304,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 42 and 40 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "82", "B": "92", "C": "2", "D": "72"}'::jsonb,
    '"D"'::jsonb,
    305,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 353 users in Q1 and 210 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "513", "B": "563", "C": "613", "D": "143"}'::jsonb,
    '"B"'::jsonb,
    306,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 165 users in Q1 and 216 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "331", "B": "381", "C": "51", "D": "431"}'::jsonb,
    '"B"'::jsonb,
    307,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 456 users in Q1 and 243 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "649", "B": "699", "C": "213", "D": "749"}'::jsonb,
    '"B"'::jsonb,
    308,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 55 and 23 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "78", "B": "93", "C": "63", "D": "32"}'::jsonb,
    '"C"'::jsonb,
    309,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 277 users in Q1 and 346 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "69", "B": "623", "C": "673", "D": "573"}'::jsonb,
    '"B"'::jsonb,
    310,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 32 and 21 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "11", "B": "41", "C": "53", "D": "65"}'::jsonb,
    '"B"'::jsonb,
    311,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 463 users in Q1 and 72 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "535", "B": "485", "C": "585", "D": "391"}'::jsonb,
    '"A"'::jsonb,
    312,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 280 users in Q1 and 280 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "510", "B": "0", "C": "610", "D": "560"}'::jsonb,
    '"D"'::jsonb,
    313,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 37 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "82", "B": "21", "C": "108", "D": "95"}'::jsonb,
    '"A"'::jsonb,
    314,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 35 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "93", "B": "23", "C": "80", "D": "106"}'::jsonb,
    '"C"'::jsonb,
    315,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 56 and 21 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "35", "B": "77", "C": "65", "D": "89"}'::jsonb,
    '"C"'::jsonb,
    316,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 440 users in Q1 and 78 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "568", "B": "518", "C": "362", "D": "468"}'::jsonb,
    '"B"'::jsonb,
    317,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 279. What is the value?',
    'mcq',
    '{"A": "279", "B": "34", "C": "28", "D": "31"}'::jsonb,
    '"D"'::jsonb,
    318,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 440 users in Q1 and 232 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "672", "B": "208", "C": "722", "D": "622"}'::jsonb,
    '"A"'::jsonb,
    319,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 21 and 32 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "44", "B": "62", "C": "53", "D": "11"}'::jsonb,
    '"A"'::jsonb,
    320,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 27 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "92", "B": "78", "C": "85", "D": "31"}'::jsonb,
    '"B"'::jsonb,
    321,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 315. What is the value?',
    'mcq',
    '{"A": "38", "B": "315", "C": "32", "D": "35"}'::jsonb,
    '"D"'::jsonb,
    322,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 34 and 21 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "13", "B": "55", "C": "49", "D": "61"}'::jsonb,
    '"C"'::jsonb,
    323,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 27 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "3", "B": "66", "C": "51", "D": "36"}'::jsonb,
    '"D"'::jsonb,
    324,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 164 users in Q1 and 61 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "275", "B": "175", "C": "225", "D": "103"}'::jsonb,
    '"C"'::jsonb,
    325,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 351. What is the value?',
    'mcq',
    '{"A": "42", "B": "351", "C": "36", "D": "39"}'::jsonb,
    '"D"'::jsonb,
    326,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 496 users in Q1 and 340 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "156", "B": "836", "C": "786", "D": "886"}'::jsonb,
    '"B"'::jsonb,
    327,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 233 users in Q1 and 320 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "553", "B": "87", "C": "603", "D": "503"}'::jsonb,
    '"A"'::jsonb,
    328,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 53 and 32 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "78", "B": "21", "C": "92", "D": "85"}'::jsonb,
    '"A"'::jsonb,
    329,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 342. What is the value?',
    'mcq',
    '{"A": "35", "B": "38", "C": "41", "D": "342"}'::jsonb,
    '"B"'::jsonb,
    330,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 47 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "71", "B": "23", "C": "56", "D": "86"}'::jsonb,
    '"C"'::jsonb,
    331,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 52 and 21 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "65", "B": "81", "C": "73", "D": "31"}'::jsonb,
    '"A"'::jsonb,
    332,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 333. What is the value?',
    'mcq',
    '{"A": "37", "B": "40", "C": "333", "D": "34"}'::jsonb,
    '"A"'::jsonb,
    333,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 354 users in Q1 and 139 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "543", "B": "215", "C": "443", "D": "493"}'::jsonb,
    '"D"'::jsonb,
    334,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 52 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "24", "B": "71", "C": "89", "D": "80"}'::jsonb,
    '"B"'::jsonb,
    335,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 32 and 39 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "85", "B": "57", "C": "71", "D": "7"}'::jsonb,
    '"B"'::jsonb,
    336,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 161 users in Q1 and 77 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "288", "B": "238", "C": "84", "D": "188"}'::jsonb,
    '"B"'::jsonb,
    337,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 439 users in Q1 and 220 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "659", "B": "609", "C": "219", "D": "709"}'::jsonb,
    '"A"'::jsonb,
    338,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 137 users in Q1 and 196 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "59", "B": "283", "C": "383", "D": "333"}'::jsonb,
    '"D"'::jsonb,
    339,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 303 users in Q1 and 72 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "231", "B": "425", "C": "325", "D": "375"}'::jsonb,
    '"D"'::jsonb,
    340,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 369 users in Q1 and 284 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "85", "B": "703", "C": "603", "D": "653"}'::jsonb,
    '"D"'::jsonb,
    341,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 482 users in Q1 and 112 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "594", "B": "544", "C": "370", "D": "644"}'::jsonb,
    '"A"'::jsonb,
    342,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 175 users in Q1 and 95 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "320", "B": "220", "C": "80", "D": "270"}'::jsonb,
    '"D"'::jsonb,
    343,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 22 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "78", "B": "69", "C": "25", "D": "60"}'::jsonb,
    '"D"'::jsonb,
    344,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 28 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "4", "B": "52", "C": "47", "D": "57"}'::jsonb,
    '"C"'::jsonb,
    345,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 179 users in Q1 and 142 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "271", "B": "37", "C": "321", "D": "371"}'::jsonb,
    '"C"'::jsonb,
    346,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 324. What is the value?',
    'mcq',
    '{"A": "33", "B": "39", "C": "324", "D": "36"}'::jsonb,
    '"D"'::jsonb,
    347,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 393 users in Q1 and 359 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "702", "B": "802", "C": "752", "D": "34"}'::jsonb,
    '"C"'::jsonb,
    348,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 504 users in Q1 and 121 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "383", "B": "625", "C": "675", "D": "575"}'::jsonb,
    '"B"'::jsonb,
    349,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 111 users in Q1 and 320 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "431", "B": "381", "C": "209", "D": "481"}'::jsonb,
    '"A"'::jsonb,
    350,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 25 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "0", "B": "59", "C": "50", "D": "41"}'::jsonb,
    '"D"'::jsonb,
    351,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 41 and 26 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "55", "B": "79", "C": "67", "D": "15"}'::jsonb,
    '"A"'::jsonb,
    352,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 360. What is the value?',
    'mcq',
    '{"A": "43", "B": "360", "C": "40", "D": "37"}'::jsonb,
    '"C"'::jsonb,
    353,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 36 and 40 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "82", "B": "76", "C": "70", "D": "4"}'::jsonb,
    '"C"'::jsonb,
    354,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 27 and 40 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "82", "B": "67", "C": "52", "D": "13"}'::jsonb,
    '"C"'::jsonb,
    355,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 356 users in Q1 and 329 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "735", "B": "685", "C": "635", "D": "27"}'::jsonb,
    '"B"'::jsonb,
    356,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 392 users in Q1 and 278 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "720", "B": "620", "C": "114", "D": "670"}'::jsonb,
    '"D"'::jsonb,
    357,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 37 and 30 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "79", "B": "55", "C": "7", "D": "67"}'::jsonb,
    '"B"'::jsonb,
    358,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 31 and 32 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "63", "B": "1", "C": "73", "D": "53"}'::jsonb,
    '"D"'::jsonb,
    359,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 548 users in Q1 and 311 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "809", "B": "237", "C": "859", "D": "909"}'::jsonb,
    '"C"'::jsonb,
    360,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 464 users in Q1 and 248 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "712", "B": "662", "C": "762", "D": "216"}'::jsonb,
    '"A"'::jsonb,
    361,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 174 users in Q1 and 173 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "1", "B": "347", "C": "397", "D": "297"}'::jsonb,
    '"B"'::jsonb,
    362,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 221 users in Q1 and 297 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "568", "B": "518", "C": "76", "D": "468"}'::jsonb,
    '"B"'::jsonb,
    363,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 128 users in Q1 and 190 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "268", "B": "318", "C": "62", "D": "368"}'::jsonb,
    '"B"'::jsonb,
    364,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 60 and 51 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "9", "B": "111", "C": "101", "D": "121"}'::jsonb,
    '"C"'::jsonb,
    365,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 36 and 41 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "77", "B": "69", "C": "5", "D": "85"}'::jsonb,
    '"B"'::jsonb,
    366,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 35 and 29 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "6", "B": "70", "C": "64", "D": "58"}'::jsonb,
    '"D"'::jsonb,
    367,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 447 users in Q1 and 132 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "315", "B": "529", "C": "579", "D": "629"}'::jsonb,
    '"C"'::jsonb,
    368,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 460 users in Q1 and 141 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "319", "B": "551", "C": "651", "D": "601"}'::jsonb,
    '"D"'::jsonb,
    369,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 337 users in Q1 and 161 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "448", "B": "176", "C": "548", "D": "498"}'::jsonb,
    '"D"'::jsonb,
    370,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 159 users in Q1 and 153 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "6", "B": "362", "C": "312", "D": "262"}'::jsonb,
    '"C"'::jsonb,
    371,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 449 users in Q1 and 160 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "559", "B": "659", "C": "609", "D": "289"}'::jsonb,
    '"C"'::jsonb,
    372,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 21 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "68", "B": "38", "C": "80", "D": "92"}'::jsonb,
    '"A"'::jsonb,
    373,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 301 users in Q1 and 289 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "12", "B": "540", "C": "590", "D": "640"}'::jsonb,
    '"C"'::jsonb,
    374,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 558 users in Q1 and 222 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "780", "B": "336", "C": "730", "D": "830"}'::jsonb,
    '"A"'::jsonb,
    375,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 126 users in Q1 and 54 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "130", "B": "230", "C": "180", "D": "72"}'::jsonb,
    '"C"'::jsonb,
    376,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 434 users in Q1 and 53 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "537", "B": "487", "C": "381", "D": "437"}'::jsonb,
    '"B"'::jsonb,
    377,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 494 users in Q1 and 186 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "730", "B": "680", "C": "308", "D": "630"}'::jsonb,
    '"B"'::jsonb,
    378,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 547 users in Q1 and 233 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "780", "B": "314", "C": "730", "D": "830"}'::jsonb,
    '"A"'::jsonb,
    379,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 32 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "65", "B": "60", "C": "55", "D": "4"}'::jsonb,
    '"C"'::jsonb,
    380,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 38 and 18 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "56", "B": "20", "C": "71", "D": "41"}'::jsonb,
    '"D"'::jsonb,
    381,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 45 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "115", "B": "93", "C": "14", "D": "104"}'::jsonb,
    '"B"'::jsonb,
    382,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 538 users in Q1 and 146 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "684", "B": "392", "C": "634", "D": "734"}'::jsonb,
    '"A"'::jsonb,
    383,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 57 and 27 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "30", "B": "97", "C": "71", "D": "84"}'::jsonb,
    '"C"'::jsonb,
    384,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 185 users in Q1 and 287 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "422", "B": "102", "C": "472", "D": "522"}'::jsonb,
    '"C"'::jsonb,
    385,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 407 users in Q1 and 296 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "653", "B": "703", "C": "111", "D": "753"}'::jsonb,
    '"B"'::jsonb,
    386,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 40 and 19 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "67", "B": "51", "C": "21", "D": "59"}'::jsonb,
    '"B"'::jsonb,
    387,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 27 and 22 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "63", "B": "5", "C": "35", "D": "49"}'::jsonb,
    '"C"'::jsonb,
    388,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 48 and 39 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "87", "B": "9", "C": "82", "D": "92"}'::jsonb,
    '"C"'::jsonb,
    389,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 217 users in Q1 and 144 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "311", "B": "73", "C": "411", "D": "361"}'::jsonb,
    '"D"'::jsonb,
    390,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 22 and 44 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "53", "B": "79", "C": "66", "D": "22"}'::jsonb,
    '"A"'::jsonb,
    391,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 368 users in Q1 and 185 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "603", "B": "553", "C": "503", "D": "183"}'::jsonb,
    '"B"'::jsonb,
    392,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 33 and 28 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "48", "B": "61", "C": "74", "D": "5"}'::jsonb,
    '"A"'::jsonb,
    393,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 31 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "43", "B": "55", "C": "67", "D": "7"}'::jsonb,
    '"A"'::jsonb,
    394,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 21 and 23 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "2", "B": "44", "C": "55", "D": "33"}'::jsonb,
    '"D"'::jsonb,
    395,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 322 users in Q1 and 237 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "509", "B": "85", "C": "609", "D": "559"}'::jsonb,
    '"D"'::jsonb,
    396,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 35 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "86", "B": "24", "C": "94", "D": "102"}'::jsonb,
    '"A"'::jsonb,
    397,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 226 users in Q1 and 178 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "404", "B": "454", "C": "354", "D": "48"}'::jsonb,
    '"A"'::jsonb,
    398,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 515 users in Q1 and 326 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "841", "B": "891", "C": "791", "D": "189"}'::jsonb,
    '"A"'::jsonb,
    399,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 156 users in Q1 and 191 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "35", "B": "397", "C": "347", "D": "297"}'::jsonb,
    '"C"'::jsonb,
    400,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 326 users in Q1 and 196 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "522", "B": "572", "C": "472", "D": "130"}'::jsonb,
    '"A"'::jsonb,
    401,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 210 users in Q1 and 98 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "308", "B": "258", "C": "112", "D": "358"}'::jsonb,
    '"A"'::jsonb,
    402,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 37 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "109", "B": "83", "C": "22", "D": "96"}'::jsonb,
    '"B"'::jsonb,
    403,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 433 users in Q1 and 115 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "498", "B": "548", "C": "598", "D": "318"}'::jsonb,
    '"B"'::jsonb,
    404,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 41 and 32 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "59", "B": "9", "C": "73", "D": "87"}'::jsonb,
    '"A"'::jsonb,
    405,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 322 users in Q1 and 218 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "104", "B": "540", "C": "490", "D": "590"}'::jsonb,
    '"B"'::jsonb,
    406,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 27 and 47 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "74", "B": "64", "C": "20", "D": "84"}'::jsonb,
    '"B"'::jsonb,
    407,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 34 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "50", "B": "5", "C": "63", "D": "76"}'::jsonb,
    '"A"'::jsonb,
    408,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 34 and 37 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "84", "B": "58", "C": "71", "D": "3"}'::jsonb,
    '"B"'::jsonb,
    409,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 377 users in Q1 and 222 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "549", "B": "155", "C": "649", "D": "599"}'::jsonb,
    '"D"'::jsonb,
    410,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 272 users in Q1 and 58 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "380", "B": "214", "C": "330", "D": "280"}'::jsonb,
    '"C"'::jsonb,
    411,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 32 and 20 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "52", "B": "61", "C": "43", "D": "12"}'::jsonb,
    '"C"'::jsonb,
    412,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 43 and 20 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "63", "B": "56", "C": "23", "D": "70"}'::jsonb,
    '"B"'::jsonb,
    413,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 43 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "72", "B": "14", "C": "82", "D": "62"}'::jsonb,
    '"D"'::jsonb,
    414,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 49 and 26 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "82", "B": "68", "C": "23", "D": "75"}'::jsonb,
    '"B"'::jsonb,
    415,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 26 and 27 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "48", "B": "1", "C": "53", "D": "58"}'::jsonb,
    '"A"'::jsonb,
    416,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 498 users in Q1 and 250 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "748", "B": "698", "C": "248", "D": "798"}'::jsonb,
    '"A"'::jsonb,
    417,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 387 users in Q1 and 182 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "569", "B": "519", "C": "205", "D": "619"}'::jsonb,
    '"A"'::jsonb,
    418,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 48 and 43 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "97", "B": "5", "C": "85", "D": "91"}'::jsonb,
    '"C"'::jsonb,
    419,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 20 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "38", "B": "78", "C": "71", "D": "85"}'::jsonb,
    '"C"'::jsonb,
    420,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 205 users in Q1 and 242 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "497", "B": "37", "C": "397", "D": "447"}'::jsonb,
    '"D"'::jsonb,
    421,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 50 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "22", "B": "92", "C": "64", "D": "78"}'::jsonb,
    '"C"'::jsonb,
    422,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 39 and 26 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "13", "B": "72", "C": "58", "D": "65"}'::jsonb,
    '"C"'::jsonb,
    423,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 48 and 33 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "68", "B": "81", "C": "15", "D": "94"}'::jsonb,
    '"A"'::jsonb,
    424,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 271 users in Q1 and 85 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "356", "B": "406", "C": "306", "D": "186"}'::jsonb,
    '"A"'::jsonb,
    425,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 57 and 47 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "10", "B": "89", "C": "104", "D": "119"}'::jsonb,
    '"B"'::jsonb,
    426,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 40 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "112", "B": "86", "C": "99", "D": "19"}'::jsonb,
    '"B"'::jsonb,
    427,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 224 users in Q1 and 74 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "348", "B": "150", "C": "248", "D": "298"}'::jsonb,
    '"D"'::jsonb,
    428,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 353 users in Q1 and 177 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "580", "B": "176", "C": "480", "D": "530"}'::jsonb,
    '"D"'::jsonb,
    429,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 28 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "19", "B": "65", "C": "75", "D": "85"}'::jsonb,
    '"B"'::jsonb,
    430,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 49 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "89", "B": "67", "C": "78", "D": "20"}'::jsonb,
    '"B"'::jsonb,
    431,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 51 and 40 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "100", "B": "11", "C": "82", "D": "91"}'::jsonb,
    '"C"'::jsonb,
    432,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 284 users in Q1 and 232 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "466", "B": "52", "C": "516", "D": "566"}'::jsonb,
    '"C"'::jsonb,
    433,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 26 and 22 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "48", "B": "59", "C": "4", "D": "37"}'::jsonb,
    '"D"'::jsonb,
    434,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 30 and 21 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "9", "B": "51", "C": "46", "D": "56"}'::jsonb,
    '"C"'::jsonb,
    435,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 25 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "0", "B": "58", "C": "50", "D": "42"}'::jsonb,
    '"D"'::jsonb,
    436,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 49 and 39 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "100", "B": "76", "C": "10", "D": "88"}'::jsonb,
    '"B"'::jsonb,
    437,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 182 users in Q1 and 321 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "553", "B": "503", "C": "139", "D": "453"}'::jsonb,
    '"B"'::jsonb,
    438,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 350 users in Q1 and 353 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "3", "B": "653", "C": "703", "D": "753"}'::jsonb,
    '"C"'::jsonb,
    439,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 377 users in Q1 and 51 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "378", "B": "326", "C": "478", "D": "428"}'::jsonb,
    '"D"'::jsonb,
    440,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 33 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "92", "B": "80", "C": "26", "D": "104"}'::jsonb,
    '"B"'::jsonb,
    441,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 39 and 42 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "94", "B": "68", "C": "3", "D": "81"}'::jsonb,
    '"B"'::jsonb,
    442,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 438 users in Q1 and 255 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "643", "B": "183", "C": "693", "D": "743"}'::jsonb,
    '"C"'::jsonb,
    443,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 544 users in Q1 and 122 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "666", "B": "716", "C": "616", "D": "422"}'::jsonb,
    '"A"'::jsonb,
    444,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 298 users in Q1 and 215 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "83", "B": "513", "C": "563", "D": "463"}'::jsonb,
    '"B"'::jsonb,
    445,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 37 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "13", "B": "49", "C": "61", "D": "73"}'::jsonb,
    '"B"'::jsonb,
    446,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 26 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "77", "B": "84", "C": "91", "D": "32"}'::jsonb,
    '"A"'::jsonb,
    447,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 378 users in Q1 and 103 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "431", "B": "275", "C": "481", "D": "531"}'::jsonb,
    '"C"'::jsonb,
    448,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 23 and 30 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "64", "B": "42", "C": "53", "D": "7"}'::jsonb,
    '"B"'::jsonb,
    449,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 428 users in Q1 and 260 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "168", "B": "738", "C": "638", "D": "688"}'::jsonb,
    '"D"'::jsonb,
    450,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 389 users in Q1 and 242 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "681", "B": "147", "C": "631", "D": "581"}'::jsonb,
    '"C"'::jsonb,
    451,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 30 and 25 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "65", "B": "45", "C": "55", "D": "5"}'::jsonb,
    '"B"'::jsonb,
    452,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 38 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "97", "B": "91", "C": "21", "D": "103"}'::jsonb,
    '"B"'::jsonb,
    453,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 48 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "76", "B": "20", "C": "88", "D": "64"}'::jsonb,
    '"D"'::jsonb,
    454,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 45 and 20 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "25", "B": "55", "C": "75", "D": "65"}'::jsonb,
    '"B"'::jsonb,
    455,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 107 users in Q1 and 229 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "386", "B": "122", "C": "286", "D": "336"}'::jsonb,
    '"D"'::jsonb,
    456,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 295 users in Q1 and 134 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "479", "B": "379", "C": "161", "D": "429"}'::jsonb,
    '"D"'::jsonb,
    457,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 39 and 25 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "64", "B": "14", "C": "53", "D": "75"}'::jsonb,
    '"C"'::jsonb,
    458,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 52 and 34 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "76", "B": "18", "C": "86", "D": "96"}'::jsonb,
    '"A"'::jsonb,
    459,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 449 users in Q1 and 203 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "652", "B": "602", "C": "702", "D": "246"}'::jsonb,
    '"A"'::jsonb,
    460,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 376 users in Q1 and 319 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "57", "B": "695", "C": "745", "D": "645"}'::jsonb,
    '"B"'::jsonb,
    461,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 555 users in Q1 and 300 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "255", "B": "805", "C": "855", "D": "905"}'::jsonb,
    '"C"'::jsonb,
    462,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 43 and 40 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "76", "B": "83", "C": "90", "D": "3"}'::jsonb,
    '"A"'::jsonb,
    463,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 211 users in Q1 and 328 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "589", "B": "117", "C": "489", "D": "539"}'::jsonb,
    '"D"'::jsonb,
    464,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 36 and 36 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "0", "B": "59", "C": "72", "D": "85"}'::jsonb,
    '"B"'::jsonb,
    465,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 418 users in Q1 and 336 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "82", "B": "754", "C": "804", "D": "704"}'::jsonb,
    '"B"'::jsonb,
    466,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 27 and 16 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "29", "B": "43", "C": "11", "D": "57"}'::jsonb,
    '"A"'::jsonb,
    467,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 21 and 38 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "59", "B": "66", "C": "52", "D": "17"}'::jsonb,
    '"C"'::jsonb,
    468,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 38 and 52 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "100", "B": "14", "C": "90", "D": "80"}'::jsonb,
    '"D"'::jsonb,
    469,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 44 and 36 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "80", "B": "87", "C": "73", "D": "8"}'::jsonb,
    '"C"'::jsonb,
    470,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 46 and 25 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "84", "B": "21", "C": "71", "D": "58"}'::jsonb,
    '"D"'::jsonb,
    471,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 238 users in Q1 and 271 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "459", "B": "559", "C": "509", "D": "33"}'::jsonb,
    '"C"'::jsonb,
    472,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 32 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "90", "B": "26", "C": "80", "D": "100"}'::jsonb,
    '"C"'::jsonb,
    473,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 548 users in Q1 and 267 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "765", "B": "281", "C": "865", "D": "815"}'::jsonb,
    '"D"'::jsonb,
    474,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 38 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "70", "B": "14", "C": "62", "D": "54"}'::jsonb,
    '"D"'::jsonb,
    475,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 349 users in Q1 and 155 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "504", "B": "554", "C": "454", "D": "194"}'::jsonb,
    '"A"'::jsonb,
    476,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 180. What is the value?',
    'mcq',
    '{"A": "17", "B": "23", "C": "180", "D": "20"}'::jsonb,
    '"D"'::jsonb,
    477,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 264 users in Q1 and 253 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "467", "B": "567", "C": "11", "D": "517"}'::jsonb,
    '"D"'::jsonb,
    478,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 314 users in Q1 and 357 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "621", "B": "43", "C": "721", "D": "671"}'::jsonb,
    '"D"'::jsonb,
    479,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 17 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "30", "B": "64", "C": "59", "D": "69"}'::jsonb,
    '"C"'::jsonb,
    480,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 49 and 50 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "1", "B": "108", "C": "90", "D": "99"}'::jsonb,
    '"C"'::jsonb,
    481,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 375 users in Q1 and 169 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "544", "B": "494", "C": "594", "D": "206"}'::jsonb,
    '"A"'::jsonb,
    482,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 53 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "5", "B": "104", "C": "111", "D": "118"}'::jsonb,
    '"B"'::jsonb,
    483,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 54 and 39 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "84", "B": "102", "C": "93", "D": "15"}'::jsonb,
    '"A"'::jsonb,
    484,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 497 users in Q1 and 378 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "925", "B": "825", "C": "119", "D": "875"}'::jsonb,
    '"D"'::jsonb,
    485,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 408 users in Q1 and 94 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "452", "B": "314", "C": "502", "D": "552"}'::jsonb,
    '"C"'::jsonb,
    486,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 338 users in Q1 and 326 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "664", "B": "714", "C": "614", "D": "12"}'::jsonb,
    '"A"'::jsonb,
    487,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 231 users in Q1 and 267 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "448", "B": "498", "C": "36", "D": "548"}'::jsonb,
    '"B"'::jsonb,
    488,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 46 and 45 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "1", "B": "91", "C": "84", "D": "98"}'::jsonb,
    '"C"'::jsonb,
    489,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 291 users in Q1 and 172 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "463", "B": "413", "C": "119", "D": "513"}'::jsonb,
    '"A"'::jsonb,
    490,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 180 users in Q1 and 188 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "418", "B": "318", "C": "8", "D": "368"}'::jsonb,
    '"D"'::jsonb,
    491,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 126 users in Q1 and 243 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "369", "B": "117", "C": "419", "D": "319"}'::jsonb,
    '"A"'::jsonb,
    492,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 103 users in Q1 and 264 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "367", "B": "417", "C": "161", "D": "317"}'::jsonb,
    '"A"'::jsonb,
    493,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 37 and 20 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "57", "B": "51", "C": "17", "D": "63"}'::jsonb,
    '"B"'::jsonb,
    494,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 224 users in Q1 and 322 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "596", "B": "496", "C": "98", "D": "546"}'::jsonb,
    '"D"'::jsonb,
    495,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 558 users in Q1 and 91 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "599", "B": "699", "C": "467", "D": "649"}'::jsonb,
    '"D"'::jsonb,
    496,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 43 and 44 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "77", "B": "97", "C": "87", "D": "1"}'::jsonb,
    '"A"'::jsonb,
    497,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 32 and 18 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "50", "B": "14", "C": "35", "D": "65"}'::jsonb,
    '"C"'::jsonb,
    498,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 50 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "87", "B": "75", "C": "25", "D": "63"}'::jsonb,
    '"D"'::jsonb,
    499,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 42 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "61", "B": "73", "C": "67", "D": "17"}'::jsonb,
    '"A"'::jsonb,
    500,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 36 and 17 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "53", "B": "19", "C": "48", "D": "58"}'::jsonb,
    '"C"'::jsonb,
    501,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 53 and 37 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "102", "B": "90", "C": "78", "D": "16"}'::jsonb,
    '"C"'::jsonb,
    502,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 49 and 31 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "80", "B": "91", "C": "69", "D": "18"}'::jsonb,
    '"C"'::jsonb,
    503,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 29 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "58", "B": "0", "C": "45", "D": "71"}'::jsonb,
    '"C"'::jsonb,
    504,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 532 users in Q1 and 157 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "739", "B": "639", "C": "689", "D": "375"}'::jsonb,
    '"C"'::jsonb,
    505,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 230 users in Q1 and 236 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "6", "B": "416", "C": "466", "D": "516"}'::jsonb,
    '"C"'::jsonb,
    506,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 57 and 18 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "80", "B": "75", "C": "70", "D": "39"}'::jsonb,
    '"C"'::jsonb,
    507,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 157 users in Q1 and 190 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "33", "B": "347", "C": "397", "D": "297"}'::jsonb,
    '"B"'::jsonb,
    508,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 546 users in Q1 and 117 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "663", "B": "429", "C": "613", "D": "713"}'::jsonb,
    '"A"'::jsonb,
    509,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 35 and 27 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "56", "B": "8", "C": "68", "D": "62"}'::jsonb,
    '"A"'::jsonb,
    510,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 49 and 52 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "101", "B": "96", "C": "3", "D": "106"}'::jsonb,
    '"B"'::jsonb,
    511,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 39 and 49 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "88", "B": "10", "C": "103", "D": "73"}'::jsonb,
    '"D"'::jsonb,
    512,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 144 users in Q1 and 240 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "334", "B": "96", "C": "434", "D": "384"}'::jsonb,
    '"D"'::jsonb,
    513,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 40 and 50 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "96", "B": "90", "C": "84", "D": "10"}'::jsonb,
    '"C"'::jsonb,
    514,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 303 users in Q1 and 70 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "323", "B": "233", "C": "373", "D": "423"}'::jsonb,
    '"C"'::jsonb,
    515,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 48 and 40 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "88", "B": "74", "C": "102", "D": "8"}'::jsonb,
    '"B"'::jsonb,
    516,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 32 and 32 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "70", "B": "58", "C": "64", "D": "0"}'::jsonb,
    '"B"'::jsonb,
    517,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 44 and 21 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "59", "B": "71", "C": "65", "D": "23"}'::jsonb,
    '"A"'::jsonb,
    518,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 407 users in Q1 and 122 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "529", "B": "285", "C": "579", "D": "479"}'::jsonb,
    '"A"'::jsonb,
    519,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 210 users in Q1 and 338 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "548", "B": "498", "C": "598", "D": "128"}'::jsonb,
    '"A"'::jsonb,
    520,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 405 users in Q1 and 301 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "656", "B": "104", "C": "756", "D": "706"}'::jsonb,
    '"D"'::jsonb,
    521,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 140 users in Q1 and 142 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "282", "B": "2", "C": "332", "D": "232"}'::jsonb,
    '"A"'::jsonb,
    522,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 33 and 50 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "83", "B": "17", "C": "69", "D": "97"}'::jsonb,
    '"C"'::jsonb,
    523,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 214 users in Q1 and 158 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "372", "B": "422", "C": "56", "D": "322"}'::jsonb,
    '"A"'::jsonb,
    524,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 359 users in Q1 and 202 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "561", "B": "511", "C": "157", "D": "611"}'::jsonb,
    '"A"'::jsonb,
    525,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 240 users in Q1 and 165 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "455", "B": "75", "C": "355", "D": "405"}'::jsonb,
    '"D"'::jsonb,
    526,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 189 users in Q1 and 198 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "437", "B": "9", "C": "387", "D": "337"}'::jsonb,
    '"C"'::jsonb,
    527,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 494 users in Q1 and 199 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "693", "B": "743", "C": "295", "D": "643"}'::jsonb,
    '"A"'::jsonb,
    528,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 50 and 24 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "74", "B": "81", "C": "26", "D": "67"}'::jsonb,
    '"D"'::jsonb,
    529,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 432 users in Q1 and 223 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "655", "B": "605", "C": "209", "D": "705"}'::jsonb,
    '"A"'::jsonb,
    530,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 297 users in Q1 and 266 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "613", "B": "513", "C": "563", "D": "31"}'::jsonb,
    '"C"'::jsonb,
    531,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 481 users in Q1 and 322 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "853", "B": "753", "C": "803", "D": "159"}'::jsonb,
    '"C"'::jsonb,
    532,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 538 users in Q1 and 363 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "851", "B": "951", "C": "175", "D": "901"}'::jsonb,
    '"D"'::jsonb,
    533,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 302 users in Q1 and 75 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "227", "B": "427", "C": "327", "D": "377"}'::jsonb,
    '"D"'::jsonb,
    534,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 214 users in Q1 and 349 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "513", "B": "613", "C": "563", "D": "135"}'::jsonb,
    '"C"'::jsonb,
    535,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 483 users in Q1 and 362 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "795", "B": "845", "C": "121", "D": "895"}'::jsonb,
    '"B"'::jsonb,
    536,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 551 users in Q1 and 131 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "682", "B": "732", "C": "632", "D": "420"}'::jsonb,
    '"A"'::jsonb,
    537,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 238 users in Q1 and 301 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "489", "B": "539", "C": "589", "D": "63"}'::jsonb,
    '"B"'::jsonb,
    538,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 262 users in Q1 and 234 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "446", "B": "28", "C": "496", "D": "546"}'::jsonb,
    '"C"'::jsonb,
    539,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 32 and 47 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "79", "B": "15", "C": "85", "D": "73"}'::jsonb,
    '"D"'::jsonb,
    540,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 27 and 31 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "58", "B": "4", "C": "64", "D": "52"}'::jsonb,
    '"D"'::jsonb,
    541,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 405. What is the value?',
    'mcq',
    '{"A": "42", "B": "45", "C": "405", "D": "48"}'::jsonb,
    '"B"'::jsonb,
    542,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 147 users in Q1 and 110 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "257", "B": "37", "C": "207", "D": "307"}'::jsonb,
    '"A"'::jsonb,
    543,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 45 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "55", "B": "70", "C": "20", "D": "85"}'::jsonb,
    '"A"'::jsonb,
    544,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 52 and 27 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "91", "B": "25", "C": "67", "D": "79"}'::jsonb,
    '"C"'::jsonb,
    545,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 497 users in Q1 and 158 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "339", "B": "605", "C": "705", "D": "655"}'::jsonb,
    '"D"'::jsonb,
    546,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 41 and 15 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "68", "B": "56", "C": "26", "D": "44"}'::jsonb,
    '"D"'::jsonb,
    547,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 38 and 21 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "67", "B": "59", "C": "17", "D": "51"}'::jsonb,
    '"D"'::jsonb,
    548,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 26 and 53 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "79", "B": "70", "C": "88", "D": "27"}'::jsonb,
    '"B"'::jsonb,
    549,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 18 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "50", "B": "43", "C": "7", "D": "36"}'::jsonb,
    '"D"'::jsonb,
    550,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 35 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "79", "B": "94", "C": "109", "D": "24"}'::jsonb,
    '"A"'::jsonb,
    551,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 519 users in Q1 and 315 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "834", "B": "884", "C": "784", "D": "204"}'::jsonb,
    '"A"'::jsonb,
    552,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 53 and 42 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "95", "B": "11", "C": "85", "D": "105"}'::jsonb,
    '"C"'::jsonb,
    553,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 304 users in Q1 and 151 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "405", "B": "153", "C": "455", "D": "505"}'::jsonb,
    '"C"'::jsonb,
    554,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 56 and 36 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "80", "B": "92", "C": "104", "D": "20"}'::jsonb,
    '"A"'::jsonb,
    555,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 387. What is the value?',
    'mcq',
    '{"A": "387", "B": "43", "C": "46", "D": "40"}'::jsonb,
    '"B"'::jsonb,
    556,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 369. What is the value?',
    'mcq',
    '{"A": "38", "B": "44", "C": "369", "D": "41"}'::jsonb,
    '"D"'::jsonb,
    557,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 243 users in Q1 and 321 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "514", "B": "614", "C": "564", "D": "78"}'::jsonb,
    '"C"'::jsonb,
    558,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 277 users in Q1 and 266 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "493", "B": "543", "C": "593", "D": "11"}'::jsonb,
    '"B"'::jsonb,
    559,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 45 and 20 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "59", "B": "71", "C": "25", "D": "65"}'::jsonb,
    '"A"'::jsonb,
    560,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 519 users in Q1 and 363 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "832", "B": "932", "C": "156", "D": "882"}'::jsonb,
    '"D"'::jsonb,
    561,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 30 and 48 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "93", "B": "63", "C": "78", "D": "18"}'::jsonb,
    '"B"'::jsonb,
    562,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 22 and 22 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "29", "B": "0", "C": "59", "D": "44"}'::jsonb,
    '"A"'::jsonb,
    563,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 183 users in Q1 and 368 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "601", "B": "501", "C": "551", "D": "185"}'::jsonb,
    '"C"'::jsonb,
    564,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 23 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "57", "B": "45", "C": "5", "D": "51"}'::jsonb,
    '"B"'::jsonb,
    565,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 41 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "54", "B": "84", "C": "69", "D": "13"}'::jsonb,
    '"A"'::jsonb,
    566,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 378. What is the value?',
    'mcq',
    '{"A": "42", "B": "39", "C": "378", "D": "45"}'::jsonb,
    '"A"'::jsonb,
    567,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 36 and 28 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "8", "B": "57", "C": "71", "D": "64"}'::jsonb,
    '"B"'::jsonb,
    568,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 347 users in Q1 and 192 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "155", "B": "589", "C": "489", "D": "539"}'::jsonb,
    '"D"'::jsonb,
    569,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 39 and 15 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "54", "B": "59", "C": "24", "D": "49"}'::jsonb,
    '"D"'::jsonb,
    570,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 43 and 55 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "89", "B": "107", "C": "12", "D": "98"}'::jsonb,
    '"A"'::jsonb,
    571,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 59 and 16 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "88", "B": "75", "C": "62", "D": "43"}'::jsonb,
    '"C"'::jsonb,
    572,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 396. What is the value?',
    'mcq',
    '{"A": "44", "B": "41", "C": "396", "D": "47"}'::jsonb,
    '"A"'::jsonb,
    573,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 548 users in Q1 and 129 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "677", "B": "627", "C": "419", "D": "727"}'::jsonb,
    '"A"'::jsonb,
    574,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 311 users in Q1 and 61 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "372", "B": "250", "C": "422", "D": "322"}'::jsonb,
    '"A"'::jsonb,
    575,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 262 users in Q1 and 98 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "360", "B": "310", "C": "164", "D": "410"}'::jsonb,
    '"A"'::jsonb,
    576,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 213 users in Q1 and 255 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "468", "B": "518", "C": "418", "D": "42"}'::jsonb,
    '"A"'::jsonb,
    577,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 324 users in Q1 and 79 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "353", "B": "245", "C": "403", "D": "453"}'::jsonb,
    '"C"'::jsonb,
    578,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 452 users in Q1 and 247 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "749", "B": "699", "C": "205", "D": "649"}'::jsonb,
    '"B"'::jsonb,
    579,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 36 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "7", "B": "65", "C": "59", "D": "71"}'::jsonb,
    '"C"'::jsonb,
    580,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 21 and 36 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "70", "B": "15", "C": "57", "D": "44"}'::jsonb,
    '"D"'::jsonb,
    581,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 33 and 44 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "77", "B": "71", "C": "83", "D": "11"}'::jsonb,
    '"B"'::jsonb,
    582,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 26 and 40 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "75", "B": "66", "C": "14", "D": "57"}'::jsonb,
    '"D"'::jsonb,
    583,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 332 users in Q1 and 316 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "648", "B": "698", "C": "598", "D": "16"}'::jsonb,
    '"A"'::jsonb,
    584,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 466 users in Q1 and 192 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "608", "B": "708", "C": "274", "D": "658"}'::jsonb,
    '"D"'::jsonb,
    585,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 280 users in Q1 and 296 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "16", "B": "626", "C": "526", "D": "576"}'::jsonb,
    '"D"'::jsonb,
    586,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 36 and 15 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "37", "B": "21", "C": "51", "D": "65"}'::jsonb,
    '"A"'::jsonb,
    587,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 341 users in Q1 and 154 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "445", "B": "187", "C": "495", "D": "545"}'::jsonb,
    '"C"'::jsonb,
    588,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 580 users in Q1 and 369 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "211", "B": "949", "C": "899", "D": "999"}'::jsonb,
    '"B"'::jsonb,
    589,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 43 and 20 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "76", "B": "63", "C": "50", "D": "23"}'::jsonb,
    '"C"'::jsonb,
    590,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 36 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "90", "B": "76", "C": "83", "D": "11"}'::jsonb,
    '"B"'::jsonb,
    591,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 38 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "9", "B": "67", "C": "56", "D": "78"}'::jsonb,
    '"C"'::jsonb,
    592,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 28 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "81", "B": "91", "C": "30", "D": "86"}'::jsonb,
    '"A"'::jsonb,
    593,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 535 users in Q1 and 233 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "718", "B": "768", "C": "302", "D": "818"}'::jsonb,
    '"B"'::jsonb,
    594,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 266 users in Q1 and 109 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "375", "B": "325", "C": "425", "D": "157"}'::jsonb,
    '"A"'::jsonb,
    595,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 128 users in Q1 and 199 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "327", "B": "277", "C": "377", "D": "71"}'::jsonb,
    '"A"'::jsonb,
    596,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 40 and 26 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "74", "B": "58", "C": "66", "D": "14"}'::jsonb,
    '"B"'::jsonb,
    597,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 35 and 22 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "13", "B": "57", "C": "45", "D": "69"}'::jsonb,
    '"C"'::jsonb,
    598,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 224 users in Q1 and 154 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "428", "B": "378", "C": "70", "D": "328"}'::jsonb,
    '"B"'::jsonb,
    599,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 475 users in Q1 and 298 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "723", "B": "773", "C": "177", "D": "823"}'::jsonb,
    '"B"'::jsonb,
    600,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 432 users in Q1 and 331 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "713", "B": "101", "C": "813", "D": "763"}'::jsonb,
    '"D"'::jsonb,
    601,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 53 and 41 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "84", "B": "12", "C": "94", "D": "104"}'::jsonb,
    '"A"'::jsonb,
    602,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 40 and 30 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "62", "B": "78", "C": "10", "D": "70"}'::jsonb,
    '"A"'::jsonb,
    603,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 48 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "70", "B": "76", "C": "82", "D": "20"}'::jsonb,
    '"A"'::jsonb,
    604,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 24 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "62", "B": "71", "C": "80", "D": "23"}'::jsonb,
    '"A"'::jsonb,
    605,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 514 users in Q1 and 202 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "766", "B": "666", "C": "716", "D": "312"}'::jsonb,
    '"C"'::jsonb,
    606,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 550 users in Q1 and 116 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "716", "B": "616", "C": "666", "D": "434"}'::jsonb,
    '"C"'::jsonb,
    607,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 123 users in Q1 and 220 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "97", "B": "393", "C": "343", "D": "293"}'::jsonb,
    '"C"'::jsonb,
    608,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 33 and 18 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "39", "B": "51", "C": "15", "D": "63"}'::jsonb,
    '"A"'::jsonb,
    609,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 20 and 55 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "35", "B": "90", "C": "75", "D": "60"}'::jsonb,
    '"D"'::jsonb,
    610,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 463 users in Q1 and 61 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "402", "B": "524", "C": "574", "D": "474"}'::jsonb,
    '"B"'::jsonb,
    611,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 569 users in Q1 and 71 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "590", "B": "498", "C": "640", "D": "690"}'::jsonb,
    '"C"'::jsonb,
    612,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 471 users in Q1 and 365 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "886", "B": "106", "C": "836", "D": "786"}'::jsonb,
    '"C"'::jsonb,
    613,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 566 users in Q1 and 354 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "870", "B": "920", "C": "970", "D": "212"}'::jsonb,
    '"B"'::jsonb,
    614,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 171 users in Q1 and 299 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "128", "B": "470", "C": "520", "D": "420"}'::jsonb,
    '"B"'::jsonb,
    615,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 517 users in Q1 and 224 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "741", "B": "791", "C": "293", "D": "691"}'::jsonb,
    '"A"'::jsonb,
    616,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 143 users in Q1 and 197 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "340", "B": "390", "C": "290", "D": "54"}'::jsonb,
    '"A"'::jsonb,
    617,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 28 and 31 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "59", "B": "70", "C": "48", "D": "3"}'::jsonb,
    '"C"'::jsonb,
    618,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 490 users in Q1 and 69 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "421", "B": "609", "C": "559", "D": "509"}'::jsonb,
    '"C"'::jsonb,
    619,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 192 users in Q1 and 183 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "325", "B": "375", "C": "9", "D": "425"}'::jsonb,
    '"B"'::jsonb,
    620,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 314 users in Q1 and 238 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "76", "B": "552", "C": "502", "D": "602"}'::jsonb,
    '"B"'::jsonb,
    621,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 116 users in Q1 and 204 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "370", "B": "88", "C": "270", "D": "320"}'::jsonb,
    '"D"'::jsonb,
    622,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 51 and 51 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "0", "B": "102", "C": "92", "D": "112"}'::jsonb,
    '"C"'::jsonb,
    623,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 432. What is the value?',
    'mcq',
    '{"A": "45", "B": "51", "C": "48", "D": "432"}'::jsonb,
    '"C"'::jsonb,
    624,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 30 and 30 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "60", "B": "55", "C": "0", "D": "65"}'::jsonb,
    '"B"'::jsonb,
    625,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 580 users in Q1 and 392 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "188", "B": "972", "C": "1022", "D": "922"}'::jsonb,
    '"B"'::jsonb,
    626,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 134 users in Q1 and 88 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "272", "B": "222", "C": "46", "D": "172"}'::jsonb,
    '"B"'::jsonb,
    627,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 32 and 54 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "73", "B": "86", "C": "22", "D": "99"}'::jsonb,
    '"A"'::jsonb,
    628,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 315 users in Q1 and 102 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "367", "B": "467", "C": "213", "D": "417"}'::jsonb,
    '"D"'::jsonb,
    629,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 565 users in Q1 and 238 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "803", "B": "753", "C": "327", "D": "853"}'::jsonb,
    '"A"'::jsonb,
    630,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 53 and 16 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "37", "B": "75", "C": "69", "D": "63"}'::jsonb,
    '"D"'::jsonb,
    631,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 20 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "52", "B": "38", "C": "45", "D": "5"}'::jsonb,
    '"B"'::jsonb,
    632,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 25 and 50 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "89", "B": "25", "C": "61", "D": "75"}'::jsonb,
    '"C"'::jsonb,
    633,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 20 and 45 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "65", "B": "79", "C": "51", "D": "25"}'::jsonb,
    '"C"'::jsonb,
    634,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 365 users in Q1 and 345 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "660", "B": "760", "C": "710", "D": "20"}'::jsonb,
    '"C"'::jsonb,
    635,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 362 users in Q1 and 309 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "621", "B": "721", "C": "671", "D": "53"}'::jsonb,
    '"C"'::jsonb,
    636,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 33 and 21 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "12", "B": "54", "C": "61", "D": "47"}'::jsonb,
    '"D"'::jsonb,
    637,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 395 users in Q1 and 73 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "468", "B": "518", "C": "418", "D": "322"}'::jsonb,
    '"A"'::jsonb,
    638,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 34 and 50 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "70", "B": "84", "C": "98", "D": "16"}'::jsonb,
    '"A"'::jsonb,
    639,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 322 users in Q1 and 392 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "714", "B": "664", "C": "70", "D": "764"}'::jsonb,
    '"A"'::jsonb,
    640,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 44 and 52 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "89", "B": "103", "C": "96", "D": "8"}'::jsonb,
    '"A"'::jsonb,
    641,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 550 users in Q1 and 125 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "725", "B": "425", "C": "675", "D": "625"}'::jsonb,
    '"C"'::jsonb,
    642,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 397 users in Q1 and 335 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "682", "B": "782", "C": "732", "D": "62"}'::jsonb,
    '"C"'::jsonb,
    643,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 423. What is the value?',
    'mcq',
    '{"A": "50", "B": "423", "C": "47", "D": "44"}'::jsonb,
    '"C"'::jsonb,
    644,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 45 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "74", "B": "81", "C": "67", "D": "16"}'::jsonb,
    '"C"'::jsonb,
    645,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 40 and 36 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "76", "B": "69", "C": "83", "D": "4"}'::jsonb,
    '"B"'::jsonb,
    646,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 40 and 25 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "78", "B": "52", "C": "15", "D": "65"}'::jsonb,
    '"B"'::jsonb,
    647,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 23 and 55 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "78", "B": "32", "C": "92", "D": "64"}'::jsonb,
    '"D"'::jsonb,
    648,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 39 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "8", "B": "96", "C": "76", "D": "86"}'::jsonb,
    '"C"'::jsonb,
    649,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 287 users in Q1 and 223 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "510", "B": "560", "C": "460", "D": "64"}'::jsonb,
    '"A"'::jsonb,
    650,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 298 users in Q1 and 196 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "444", "B": "494", "C": "544", "D": "102"}'::jsonb,
    '"B"'::jsonb,
    651,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 268 users in Q1 and 363 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "631", "B": "581", "C": "95", "D": "681"}'::jsonb,
    '"A"'::jsonb,
    652,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 20 and 32 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "41", "B": "52", "C": "12", "D": "63"}'::jsonb,
    '"A"'::jsonb,
    653,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 54 and 33 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "102", "B": "72", "C": "21", "D": "87"}'::jsonb,
    '"B"'::jsonb,
    654,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 506 users in Q1 and 163 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "619", "B": "669", "C": "343", "D": "719"}'::jsonb,
    '"B"'::jsonb,
    655,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 134 users in Q1 and 276 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "142", "B": "410", "C": "360", "D": "460"}'::jsonb,
    '"B"'::jsonb,
    656,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 142 users in Q1 and 297 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "155", "B": "489", "C": "439", "D": "389"}'::jsonb,
    '"C"'::jsonb,
    657,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 341 users in Q1 and 270 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "661", "B": "71", "C": "561", "D": "611"}'::jsonb,
    '"D"'::jsonb,
    658,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 54 and 28 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "77", "B": "26", "C": "82", "D": "87"}'::jsonb,
    '"A"'::jsonb,
    659,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 42 and 43 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "92", "B": "85", "C": "1", "D": "78"}'::jsonb,
    '"D"'::jsonb,
    660,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 19 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "28", "B": "75", "C": "57", "D": "66"}'::jsonb,
    '"C"'::jsonb,
    661,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 527 users in Q1 and 124 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "701", "B": "601", "C": "651", "D": "403"}'::jsonb,
    '"C"'::jsonb,
    662,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 27 and 27 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "0", "B": "54", "C": "44", "D": "64"}'::jsonb,
    '"C"'::jsonb,
    663,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 31 and 55 minutes with 13 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "99", "B": "73", "C": "24", "D": "86"}'::jsonb,
    '"B"'::jsonb,
    664,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 136 users in Q1 and 266 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "402", "B": "130", "C": "452", "D": "352"}'::jsonb,
    '"A"'::jsonb,
    665,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 41 and 53 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "94", "B": "100", "C": "12", "D": "88"}'::jsonb,
    '"D"'::jsonb,
    666,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 599 users in Q1 and 323 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "972", "B": "872", "C": "922", "D": "276"}'::jsonb,
    '"C"'::jsonb,
    667,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 33 and 28 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "51", "B": "5", "C": "71", "D": "61"}'::jsonb,
    '"A"'::jsonb,
    668,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 426 users in Q1 and 304 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "122", "B": "730", "C": "780", "D": "680"}'::jsonb,
    '"B"'::jsonb,
    669,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 30 and 16 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "46", "B": "14", "C": "60", "D": "32"}'::jsonb,
    '"D"'::jsonb,
    670,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 359 users in Q1 and 116 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "525", "B": "475", "C": "243", "D": "425"}'::jsonb,
    '"B"'::jsonb,
    671,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 46 and 23 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "54", "B": "84", "C": "69", "D": "23"}'::jsonb,
    '"A"'::jsonb,
    672,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 181 users in Q1 and 328 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "509", "B": "459", "C": "559", "D": "147"}'::jsonb,
    '"A"'::jsonb,
    673,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 208 users in Q1 and 210 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "418", "B": "368", "C": "468", "D": "2"}'::jsonb,
    '"A"'::jsonb,
    674,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 428 users in Q1 and 219 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "597", "B": "647", "C": "697", "D": "209"}'::jsonb,
    '"B"'::jsonb,
    675,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 46 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "59", "B": "22", "C": "70", "D": "81"}'::jsonb,
    '"A"'::jsonb,
    676,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 52 and 48 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "100", "B": "106", "C": "94", "D": "4"}'::jsonb,
    '"C"'::jsonb,
    677,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 37 and 37 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "0", "B": "79", "C": "74", "D": "69"}'::jsonb,
    '"D"'::jsonb,
    678,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 52 and 25 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "77", "B": "66", "C": "88", "D": "27"}'::jsonb,
    '"B"'::jsonb,
    679,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 427 users in Q1 and 271 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "748", "B": "698", "C": "156", "D": "648"}'::jsonb,
    '"B"'::jsonb,
    680,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 29 and 41 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "77", "B": "63", "C": "70", "D": "12"}'::jsonb,
    '"B"'::jsonb,
    681,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 361 users in Q1 and 169 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "192", "B": "480", "C": "530", "D": "580"}'::jsonb,
    '"C"'::jsonb,
    682,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 276 users in Q1 and 191 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "517", "B": "85", "C": "417", "D": "467"}'::jsonb,
    '"D"'::jsonb,
    683,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 33 and 24 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "68", "B": "9", "C": "57", "D": "46"}'::jsonb,
    '"D"'::jsonb,
    684,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 486 users in Q1 and 382 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "918", "B": "868", "C": "818", "D": "104"}'::jsonb,
    '"B"'::jsonb,
    685,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 592 users in Q1 and 160 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "752", "B": "702", "C": "802", "D": "432"}'::jsonb,
    '"A"'::jsonb,
    686,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 130 users in Q1 and 177 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "47", "B": "257", "C": "357", "D": "307"}'::jsonb,
    '"D"'::jsonb,
    687,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 131 users in Q1 and 219 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "300", "B": "400", "C": "88", "D": "350"}'::jsonb,
    '"D"'::jsonb,
    688,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 31 and 47 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "64", "B": "92", "C": "78", "D": "16"}'::jsonb,
    '"A"'::jsonb,
    689,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 52 and 55 minutes with 15 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "92", "B": "107", "C": "122", "D": "3"}'::jsonb,
    '"A"'::jsonb,
    690,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 358 users in Q1 and 244 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "652", "B": "552", "C": "114", "D": "602"}'::jsonb,
    '"D"'::jsonb,
    691,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 17 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "57", "B": "64", "C": "30", "D": "71"}'::jsonb,
    '"A"'::jsonb,
    692,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 403 users in Q1 and 183 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "586", "B": "220", "C": "636", "D": "536"}'::jsonb,
    '"A"'::jsonb,
    693,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 44 and 29 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "15", "B": "73", "C": "63", "D": "83"}'::jsonb,
    '"C"'::jsonb,
    694,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 32 and 39 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "76", "B": "7", "C": "71", "D": "66"}'::jsonb,
    '"D"'::jsonb,
    695,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 50 and 21 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "71", "B": "79", "C": "63", "D": "29"}'::jsonb,
    '"C"'::jsonb,
    696,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 425 users in Q1 and 388 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "763", "B": "813", "C": "863", "D": "37"}'::jsonb,
    '"B"'::jsonb,
    697,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 335 users in Q1 and 139 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "474", "B": "424", "C": "524", "D": "196"}'::jsonb,
    '"A"'::jsonb,
    698,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 49 and 19 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "30", "B": "54", "C": "68", "D": "82"}'::jsonb,
    '"B"'::jsonb,
    699,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 274 users in Q1 and 153 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "121", "B": "427", "C": "377", "D": "477"}'::jsonb,
    '"B"'::jsonb,
    700,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 20 and 47 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "59", "B": "67", "C": "75", "D": "27"}'::jsonb,
    '"A"'::jsonb,
    701,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 144 users in Q1 and 277 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "421", "B": "471", "C": "371", "D": "133"}'::jsonb,
    '"A"'::jsonb,
    702,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 599 users in Q1 and 275 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "924", "B": "824", "C": "874", "D": "324"}'::jsonb,
    '"C"'::jsonb,
    703,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 245 users in Q1 and 227 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "522", "B": "422", "C": "472", "D": "18"}'::jsonb,
    '"C"'::jsonb,
    704,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 347 users in Q1 and 253 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "650", "B": "94", "C": "600", "D": "550"}'::jsonb,
    '"C"'::jsonb,
    705,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 342 users in Q1 and 85 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "477", "B": "427", "C": "257", "D": "377"}'::jsonb,
    '"B"'::jsonb,
    706,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 194 users in Q1 and 280 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "424", "B": "524", "C": "86", "D": "474"}'::jsonb,
    '"D"'::jsonb,
    707,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 44 minutes with 8 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "60", "B": "20", "C": "68", "D": "76"}'::jsonb,
    '"A"'::jsonb,
    708,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 56 and 29 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "74", "B": "27", "C": "85", "D": "96"}'::jsonb,
    '"A"'::jsonb,
    709,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 42 and 22 minutes with 10 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "20", "B": "64", "C": "74", "D": "54"}'::jsonb,
    '"D"'::jsonb,
    710,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 26 and 32 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "6", "B": "58", "C": "69", "D": "47"}'::jsonb,
    '"D"'::jsonb,
    711,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 47 and 52 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "5", "B": "99", "C": "94", "D": "104"}'::jsonb,
    '"C"'::jsonb,
    712,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 124 users in Q1 and 102 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "176", "B": "22", "C": "276", "D": "226"}'::jsonb,
    '"D"'::jsonb,
    713,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 60 and 47 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "107", "B": "98", "C": "116", "D": "13"}'::jsonb,
    '"B"'::jsonb,
    714,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 24 and 19 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "52", "B": "34", "C": "5", "D": "43"}'::jsonb,
    '"B"'::jsonb,
    715,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 132 users in Q1 and 265 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "133", "B": "347", "C": "397", "D": "447"}'::jsonb,
    '"C"'::jsonb,
    716,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 187 users in Q1 and 278 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "415", "B": "465", "C": "91", "D": "515"}'::jsonb,
    '"B"'::jsonb,
    717,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 170 users in Q1 and 390 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "510", "B": "610", "C": "560", "D": "220"}'::jsonb,
    '"C"'::jsonb,
    718,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 30 and 26 minutes with 5 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "56", "B": "51", "C": "4", "D": "61"}'::jsonb,
    '"B"'::jsonb,
    719,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 43 and 45 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "82", "B": "2", "C": "88", "D": "94"}'::jsonb,
    '"A"'::jsonb,
    720,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 36 and 36 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "72", "B": "63", "C": "0", "D": "81"}'::jsonb,
    '"B"'::jsonb,
    721,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 472 users in Q1 and 388 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "84", "B": "910", "C": "810", "D": "860"}'::jsonb,
    '"D"'::jsonb,
    722,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 355 users in Q1 and 171 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "476", "B": "576", "C": "526", "D": "184"}'::jsonb,
    '"C"'::jsonb,
    723,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 44 and 53 minutes with 12 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "109", "B": "85", "C": "9", "D": "97"}'::jsonb,
    '"B"'::jsonb,
    724,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 57 and 44 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "101", "B": "112", "C": "90", "D": "13"}'::jsonb,
    '"C"'::jsonb,
    725,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 451 users in Q1 and 296 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "155", "B": "747", "C": "797", "D": "697"}'::jsonb,
    '"B"'::jsonb,
    726,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 507 users in Q1 and 283 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "840", "B": "740", "C": "790", "D": "224"}'::jsonb,
    '"C"'::jsonb,
    727,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 434 users in Q1 and 339 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "723", "B": "95", "C": "773", "D": "823"}'::jsonb,
    '"C"'::jsonb,
    728,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A value multiplied by 9 gives 450. What is the value?',
    'mcq',
    '{"A": "53", "B": "50", "C": "450", "D": "47"}'::jsonb,
    '"B"'::jsonb,
    729,
    TRUE,
    'Analytical Problem Solving (UG level reasoning).',
    '{"grade": "UG", "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 44 and 40 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "84", "B": "4", "C": "91", "D": "77"}'::jsonb,
    '"D"'::jsonb,
    730,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 179 users in Q1 and 336 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "565", "B": "515", "C": "157", "D": "465"}'::jsonb,
    '"B"'::jsonb,
    731,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 354 users in Q1 and 330 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "24", "B": "684", "C": "734", "D": "634"}'::jsonb,
    '"B"'::jsonb,
    732,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 173 users in Q1 and 55 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "178", "B": "118", "C": "278", "D": "228"}'::jsonb,
    '"D"'::jsonb,
    733,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 108 users in Q1 and 191 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "349", "B": "249", "C": "83", "D": "299"}'::jsonb,
    '"D"'::jsonb,
    734,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 52 and 53 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "1", "B": "114", "C": "105", "D": "96"}'::jsonb,
    '"D"'::jsonb,
    735,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 384 users in Q1 and 320 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "704", "B": "754", "C": "64", "D": "654"}'::jsonb,
    '"A"'::jsonb,
    736,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 48 and 53 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "92", "B": "101", "C": "5", "D": "110"}'::jsonb,
    '"A"'::jsonb,
    737,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 43 and 41 minutes with 6 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "78", "B": "90", "C": "2", "D": "84"}'::jsonb,
    '"A"'::jsonb,
    738,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 36 and 43 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "7", "B": "86", "C": "79", "D": "72"}'::jsonb,
    '"D"'::jsonb,
    739,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 58 and 37 minutes with 7 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "102", "B": "88", "C": "21", "D": "95"}'::jsonb,
    '"B"'::jsonb,
    740,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 53 and 46 minutes with 9 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "108", "B": "90", "C": "7", "D": "99"}'::jsonb,
    '"B"'::jsonb,
    741,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 43 and 41 minutes with 11 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "95", "B": "84", "C": "73", "D": "2"}'::jsonb,
    '"C"'::jsonb,
    742,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 513 users in Q1 and 246 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "809", "B": "267", "C": "759", "D": "709"}'::jsonb,
    '"C"'::jsonb,
    743,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 48 and 22 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "70", "B": "26", "C": "56", "D": "84"}'::jsonb,
    '"C"'::jsonb,
    744,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 229 users in Q1 and 346 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "575", "B": "117", "C": "525", "D": "625"}'::jsonb,
    '"A"'::jsonb,
    745,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'Two processes take 55 and 31 minutes with 14 minutes overlap. Total effective time?',
    'mcq',
    '{"A": "72", "B": "100", "C": "24", "D": "86"}'::jsonb,
    '"A"'::jsonb,
    746,
    TRUE,
    'Scenario-Based Systems Thinking (UG level reasoning).',
    '{"grade": "UG", "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 265 users in Q1 and 154 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "469", "B": "419", "C": "369", "D": "111"}'::jsonb,
    '"B"'::jsonb,
    747,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 213 users in Q1 and 119 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "332", "B": "382", "C": "282", "D": "94"}'::jsonb,
    '"A"'::jsonb,
    748,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 148 users in Q1 and 294 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "146", "B": "492", "C": "392", "D": "442"}'::jsonb,
    '"D"'::jsonb,
    749,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

  INSERT INTO personal_assessment_questions (
    section_id, question_text, question_type, options, correct_answer,
    order_number, is_active, description, metadata
  ) VALUES (
    v_section_id,
    'A startup recorded 406 users in Q1 and 95 users in Q2. What is total user growth?',
    'mcq',
    '{"A": "501", "B": "451", "C": "551", "D": "311"}'::jsonb,
    '"A"'::jsonb,
    750,
    TRUE,
    'Quantitative Reasoning (UG level reasoning).',
    '{"grade": "UG", "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
  ) ON CONFLICT DO NOTHING;

END $$;

-- Total questions inserted: 750