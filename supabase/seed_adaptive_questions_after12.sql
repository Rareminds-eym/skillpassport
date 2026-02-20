-- Seed adaptive aptitude questions for After 12
-- Generated from Post12_General_STEM_Aptitude_500_MODEL_B.csv

-- Insert adaptive aptitude section for After 12
INSERT INTO personal_assessment_sections (
  id, name, title, description, order_number, is_timed,
  time_limit_seconds, is_active, grade_level, created_at, updated_at
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'adaptive_aptitude_after12',
  'Adaptive Aptitude - After 12',
  'Adaptive aptitude assessment for students after grade 12',
  13,
  true,
  3600,
  true,
  'after12',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;


-- Insert questions

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'Find next in pattern: 5, 9, 17, 33, ?',
  'mcq',
  '{"A": "65", "B": "60", "C": "57", "D": "49"}'::jsonb,
  '"A"'::jsonb,
  'Non-linear pattern recognition.',
  1,
  true,
  '{"grade": "Post-12", "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'Two components in series have reliability 0.9 and 0.85. Combined reliability?',
  'mcq',
  '{"A": "0.05", "B": "1.75", "C": "0.77", "D": "811"}'::jsonb,
  '"C"'::jsonb,
  'System reliability aggregation.',
  2,
  true,
  '{"grade": "Post-12", "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'If all X are Y and no Y are Z, what must be true?',
  'mcq',
  '{"A": "All Z are X", "B": "No X are Z", "C": "All Y are X", "D": "Some X are Z"}'::jsonb,
  '"B"'::jsonb,
  'Advanced syllogistic reasoning.',
  3,
  true,
  '{"grade": "Post-12", "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+3. Find y when x=9.',
  'mcq',
  '{"A": "27", "B": "39", "C": "7", "D": "36"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  4,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '30 out of 243 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "12.35", "B": "1.23", "C": "87.65", "D": "72.9"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  5,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '77 out of 235 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "3.28", "B": "67.23", "C": "32.77", "D": "180.95"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  6,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '111 out of 315 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "349.65", "B": "35.24", "C": "64.76", "D": "3.52"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  7,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'Option A gives ₹80 guaranteed. Option B gives ₹150 with 50% chance. Expected value of B?',
  'mcq',
  '{"A": "75", "B": "80", "C": "65", "D": "150"}'::jsonb,
  '"A"'::jsonb,
  'Expected value decision reasoning.',
  8,
  true,
  '{"grade": "Post-12", "dimension": "DR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'Binary search on 32 items needs approx how many comparisons?',
  'mcq',
  '{"A": "6", "B": "5", "C": "10", "D": "4"}'::jsonb,
  '"B"'::jsonb,
  'Logarithmic complexity reasoning.',
  9,
  true,
  '{"grade": "Post-12", "dimension": "AT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+8. Find y when x=9.',
  'mcq',
  '{"A": "72", "B": "14", "C": "54", "D": "62"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  10,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'Binary search on 128 items needs approx how many comparisons?',
  'mcq',
  '{"A": "7", "B": "8", "C": "14", "D": "6"}'::jsonb,
  '"A"'::jsonb,
  'Logarithmic complexity reasoning.',
  11,
  true,
  '{"grade": "Post-12", "dimension": "AT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 230 grows 9% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "239", "B": "297.86", "C": "273.26", "D": "250.7"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  12,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 676 grows 20% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "1168.13", "B": "696", "C": "1401.75", "D": "811.2"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  13,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'Binary search on 64 items needs approx how many comparisons?',
  'mcq',
  '{"A": "12", "B": "6", "C": "7", "D": "5"}'::jsonb,
  '"B"'::jsonb,
  'Logarithmic complexity reasoning.',
  14,
  true,
  '{"grade": "Post-12", "dimension": "AT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '112 out of 230 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "4.87", "B": "51.3", "C": "257.6", "D": "48.7"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  15,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 282 grows 11% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "428.1", "B": "313.02", "C": "475.19", "D": "293"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  16,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '155 out of 359 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "556.45", "B": "4.32", "C": "56.82", "D": "43.18"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  17,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '203 out of 251 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "509.53", "B": "80.88", "C": "19.12", "D": "8.09"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  18,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '231 out of 359 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "35.65", "B": "829.29", "C": "6.43", "D": "64.35"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  19,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '169 out of 287 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "485.03", "B": "58.89", "C": "41.11", "D": "5.89"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  20,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '117 out of 271 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "4.32", "B": "56.83", "C": "43.17", "D": "317.07"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  21,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+8. Find y when x=10.',
  'mcq',
  '{"A": "60", "B": "14", "C": "68", "D": "80"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  22,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'Binary search on 16 items needs approx how many comparisons?',
  'mcq',
  '{"A": "8", "B": "5", "C": "3", "D": "4"}'::jsonb,
  '"D"'::jsonb,
  'Logarithmic complexity reasoning.',
  23,
  true,
  '{"grade": "Post-12", "dimension": "AT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+9. Find y when x=4.',
  'mcq',
  '{"A": "36", "B": "41", "C": "17", "D": "32"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  24,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '90 out of 134 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "6.72", "B": "67.16", "C": "32.84", "D": "120.6"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  25,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+8. Find y when x=10.',
  'mcq',
  '{"A": "10", "B": "20", "C": "28", "D": "80"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  26,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 631 grows 8% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "858.47", "B": "794.88", "C": "681.48", "D": "639"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  27,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 504 grows 19% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "849.32", "B": "523", "C": "1010.69", "D": "599.76"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  28,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'Binary search on 512 items needs approx how many comparisons?',
  'mcq',
  '{"A": "18", "B": "8", "C": "9", "D": "10"}'::jsonb,
  '"C"'::jsonb,
  'Logarithmic complexity reasoning.',
  29,
  true,
  '{"grade": "Post-12", "dimension": "AT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 692 grows 25% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "865", "B": "134", "C": "1081.25", "D": "717"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  30,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 482 grows 5% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "487", "B": "516", "C": "531.4", "D": "506.1"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  31,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 580 grows 7% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "664.04", "B": "587", "C": "620.6", "D": "710.52"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  32,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '187 out of 371 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "693.77", "B": "49.6", "C": "50.4", "D": "5.04"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  33,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 706 grows 22% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "861.32", "B": "1564.03", "C": "1908.11", "D": "728"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  34,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+5. Find y when x=9.',
  'mcq',
  '{"A": "32", "B": "27", "C": "45", "D": "8"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  35,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+8. Find y when x=7.',
  'mcq',
  '{"A": "11", "B": "56", "C": "21", "D": "29"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  36,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 319 grows 21% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "565.13", "B": "340", "C": "467.05", "D": "385.99"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  37,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+5. Find y when x=7.',
  'mcq',
  '{"A": "26", "B": "21", "C": "8", "D": "35"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  38,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '155 out of 305 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "50.82", "B": "5.08", "C": "49.18", "D": "472.75"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  39,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'Binary search on 1024 items needs approx how many comparisons?',
  'mcq',
  '{"A": "20", "B": "10", "C": "11", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Logarithmic complexity reasoning.',
  40,
  true,
  '{"grade": "Post-12", "dimension": "AT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 515 grows 24% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "638.6", "B": "981.91", "C": "539", "D": "791.86"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  41,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '202 out of 223 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "9.06", "B": "90.58", "C": "450.46", "D": "9.42"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  42,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+9. Find y when x=9.',
  'mcq',
  '{"A": "81", "B": "72", "C": "17", "D": "35"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  43,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 593 grows 15% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "901.88", "B": "681.95", "C": "784.24", "D": "608"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  44,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '128 out of 221 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "5.79", "B": "57.92", "C": "42.08", "D": "282.88"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  45,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+7. Find y when x=10.',
  'mcq',
  '{"A": "11", "B": "47", "C": "40", "D": "70"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  46,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 779 grows 9% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "788", "B": "849.11", "C": "1008.83", "D": "925.53"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  47,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 410 grows 7% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "438.7", "B": "469.41", "C": "502.27", "D": "417"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  48,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 397 grows 17% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "414", "B": "543.45", "C": "464.49", "D": "824"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  49,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 420 grows 21% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "508.2", "B": "744.06", "C": "441", "D": "614.92"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  50,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '368 out of 391 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "1438.88", "B": "5.88", "C": "9.41", "D": "94.12"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  51,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 381 grows 10% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "391", "B": "419.1", "C": "926", "D": "461.01"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  52,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 719 grows 21% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "740", "B": "88", "C": "869.99", "D": "1052.69"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  53,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 226 grows 11% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "237", "B": "250.86", "C": "309.08", "D": "343.08"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  54,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'Binary search on 256 items needs approx how many comparisons?',
  'mcq',
  '{"A": "7", "B": "8", "C": "9", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Logarithmic complexity reasoning.',
  55,
  true,
  '{"grade": "Post-12", "dimension": "AT", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 747 grows 12% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "836.64", "B": "937.04", "C": "1049.48", "D": "759"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  56,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 363 grows 6% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "412", "B": "369", "C": "407.87", "D": "384.78"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  57,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+6. Find y when x=5.',
  'mcq',
  '{"A": "25", "B": "30", "C": "31", "D": "11"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  58,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+7. Find y when x=7.',
  'mcq',
  '{"A": "28", "B": "11", "C": "49", "D": "35"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  59,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+7. Find y when x=10.',
  'mcq',
  '{"A": "70", "B": "37", "C": "10", "D": "30"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  60,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '207 out of 392 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "47.19", "B": "811.44", "C": "52.81", "D": "5.28"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  61,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '69 out of 299 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "206.31", "B": "23.08", "C": "76.92", "D": "2.31"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  62,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '75 out of 374 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "79.95", "B": "280.5", "C": "2.01", "D": "20.05"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  63,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '155 out of 278 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "44.24", "B": "430.9", "C": "55.76", "D": "5.58"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  64,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 596 grows 24% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "1409.07", "B": "620", "C": "1747.25", "D": "739.04"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  65,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '213 out of 369 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "785.97", "B": "5.77", "C": "42.28", "D": "57.72"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  66,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+8. Find y when x=4.',
  'mcq',
  '{"A": "8", "B": "32", "C": "10", "D": "16"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  67,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 424 grows 12% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "850", "B": "531.87", "C": "436", "D": "474.88"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  68,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '66 out of 191 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "34.55", "B": "126.06", "C": "3.46", "D": "65.45"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  69,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+7. Find y when x=4.',
  'mcq',
  '{"A": "27", "B": "20", "C": "12", "D": "28"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  70,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '86 out of 250 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "215", "B": "34.4", "C": "65.6", "D": "3.44"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  71,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 538 grows 13% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "167", "B": "686.97", "C": "607.94", "D": "551"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  72,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 431 grows 10% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "694.13", "B": "631.03", "C": "441", "D": "474.1"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  73,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+8. Find y when x=9.',
  'mcq',
  '{"A": "72", "B": "15", "C": "63", "D": "71"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  74,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 616 grows 17% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "720.72", "B": "843.24", "C": "682", "D": "633"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  75,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+4. Find y when x=6.',
  'mcq',
  '{"A": "12", "B": "24", "C": "52", "D": "48"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  76,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+4. Find y when x=7.',
  'mcq',
  '{"A": "14", "B": "6", "C": "28", "D": "18"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  77,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 268 grows 13% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "281", "B": "302.84", "C": "386.7", "D": "342.21"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  78,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+5. Find y when x=7.',
  'mcq',
  '{"A": "10", "B": "40", "C": "182", "D": "35"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  79,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 320 grows 13% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "361.6", "B": "521.75", "C": "461.73", "D": "333"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  80,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+6. Find y when x=6.',
  'mcq',
  '{"A": "36", "B": "807", "C": "30", "D": "11"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  81,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+6. Find y when x=9.',
  'mcq',
  '{"A": "13", "B": "69", "C": "63", "D": "54"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  82,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '186 out of 270 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "31.11", "B": "68.89", "C": "502.2", "D": "6.89"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  83,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '23 out of 145 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "84.14", "B": "33.35", "C": "15.86", "D": "1.59"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  84,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 234 grows 20% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "485.22", "B": "280.8", "C": "582.27", "D": "254"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  85,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 797 grows 25% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "1945.8", "B": "822", "C": "1556.64", "D": "996.25"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  86,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+9. Find y when x=9.',
  'mcq',
  '{"A": "81", "B": "14", "C": "54", "D": "45"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  87,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '90 out of 257 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "64.98", "B": "231.3", "C": "3.5", "D": "35.02"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  88,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+3. Find y when x=7.',
  'mcq',
  '{"A": "21", "B": "5", "C": "17", "D": "14"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  89,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+6. Find y when x=4.',
  'mcq',
  '{"A": "14", "B": "32", "C": "38", "D": "24"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  90,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 361 grows 10% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "397.1", "B": "371", "C": "436.81", "D": "480.49"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  91,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '107 out of 188 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "43.09", "B": "5.69", "C": "201.16", "D": "56.91"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  92,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '166 out of 227 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "7.31", "B": "376.82", "C": "73.13", "D": "26.87"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  93,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+5. Find y when x=10.',
  'mcq',
  '{"A": "12", "B": "75", "C": "50", "D": "70"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  94,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '211 out of 232 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "489.52", "B": "90.95", "C": "9.05", "D": "9.09"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  95,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 522 grows 24% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "995.26", "B": "647.28", "C": "1234.12", "D": "546"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  96,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '196 out of 393 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "49.87", "B": "770.28", "C": "50.13", "D": "4.99"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  97,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+9. Find y when x=9.',
  'mcq',
  '{"A": "11", "B": "27", "C": "18", "D": "81"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  98,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '97 out of 243 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "3.99", "B": "60.08", "C": "235.71", "D": "39.92"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  99,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 449 grows 19% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "900.4", "B": "534.31", "C": "1071.47", "D": "468"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  100,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+5. Find y when x=4.',
  'mcq',
  '{"A": "25", "B": "20", "C": "856", "D": "10"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  101,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 637 grows 8% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "866.63", "B": "645", "C": "687.96", "D": "802.44"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  102,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '100 out of 139 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "139", "B": "7.19", "C": "28.06", "D": "71.94"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  103,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 285 grows 19% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "339.15", "B": "304", "C": "403.59", "D": "480.27"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  104,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+6. Find y when x=9.',
  'mcq',
  '{"A": "45", "B": "51", "C": "54", "D": "11"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  105,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 797 grows 22% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "1447.23", "B": "1765.62", "C": "819", "D": "972.34"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  106,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 450 grows 16% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "351", "B": "522", "C": "466", "D": "605.52"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  107,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 522 grows 24% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "1530.31", "B": "1234.12", "C": "647.28", "D": "546"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  108,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '76 out of 121 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "62.81", "B": "37.19", "C": "91.96", "D": "6.28"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  109,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 451 grows 20% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "935.19", "B": "1122.23", "C": "471", "D": "541.2"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  110,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+7. Find y when x=8.',
  'mcq',
  '{"A": "9", "B": "56", "C": "23", "D": "16"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  111,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 592 grows 15% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "680.8", "B": "1190.72", "C": "1035.41", "D": "607"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  112,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 689 grows 5% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "694", "B": "569", "C": "723.45", "D": "759.62"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  113,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 210 grows 5% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "220.5", "B": "215", "C": "161", "D": "231.53"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  114,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '165 out of 246 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "405.9", "B": "32.93", "C": "6.71", "D": "67.07"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  115,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 343 grows 13% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "631.96", "B": "559.25", "C": "387.59", "D": "356"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  116,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+6. Find y when x=10.',
  'mcq',
  '{"A": "40", "B": "60", "C": "46", "D": "10"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  117,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 272 grows 22% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "404.84", "B": "331.84", "C": "257", "D": "294"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  118,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 681 grows 7% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "728.67", "B": "688", "C": "955.14", "D": "892.65"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  119,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 498 grows 7% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "505", "B": "570.16", "C": "610.07", "D": "532.86"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  120,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 505 grows 22% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "527", "B": "751.64", "C": "174", "D": "616.1"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  121,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+3. Find y when x=9.',
  'mcq',
  '{"A": "5", "B": "27", "C": "21", "D": "18"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  122,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 501 grows 11% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "556.11", "B": "685.18", "C": "760.55", "D": "512"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  123,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '26 out of 226 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "58.76", "B": "88.5", "C": "1.15", "D": "11.5"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  124,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 297 grows 22% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "657.95", "B": "802.7", "C": "362.34", "D": "319"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  125,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '33 out of 172 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "80.81", "B": "19.19", "C": "1.92", "D": "56.76"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  126,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '148 out of 302 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "4.9", "B": "446.96", "C": "49.01", "D": "50.99"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  127,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+8. Find y when x=9.',
  'mcq',
  '{"A": "72", "B": "13", "C": "45", "D": "53"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  128,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '63 out of 236 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "2.67", "B": "73.31", "C": "26.69", "D": "148.68"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  129,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+3. Find y when x=10.',
  'mcq',
  '{"A": "9", "B": "60", "C": "30", "D": "63"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  130,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 722 grows 6% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "911.51", "B": "859.91", "C": "765.32", "D": "728"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  131,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+3. Find y when x=5.',
  'mcq',
  '{"A": "40", "B": "11", "C": "43", "D": "15"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  132,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+8. Find y when x=7.',
  'mcq',
  '{"A": "56", "B": "14", "C": "42", "D": "50"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  133,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '48 out of 229 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "2.1", "B": "79.04", "C": "20.96", "D": "109.92"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  134,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 374 grows 7% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "381", "B": "524.55", "C": "490.24", "D": "400.18"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  135,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 797 grows 21% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "964.37", "B": "1411.93", "C": "1166.89", "D": "818"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  136,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 249 grows 14% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "283.86", "B": "368.9", "C": "420.55", "D": "263"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  137,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '39 out of 173 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "67.47", "B": "77.46", "C": "22.54", "D": "2.25"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  138,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 769 grows 18% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "907.42", "B": "1070.76", "C": "787", "D": "837"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  139,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+9. Find y when x=6.',
  'mcq',
  '{"A": "39", "B": "54", "C": "30", "D": "14"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  140,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+6. Find y when x=7.',
  'mcq',
  '{"A": "42", "B": "41", "C": "35", "D": "11"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  141,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 672 grows 13% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "858.08", "B": "759.36", "C": "969.63", "D": "685"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  142,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+6. Find y when x=7.',
  'mcq',
  '{"A": "99", "B": "48", "C": "12", "D": "42"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  143,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '73 out of 121 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "6.03", "B": "88.33", "C": "60.33", "D": "39.67"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  144,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '105 out of 185 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "5.68", "B": "56.76", "C": "43.24", "D": "194.25"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  145,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+4. Find y when x=4.',
  'mcq',
  '{"A": "16", "B": "28", "C": "11", "D": "32"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  146,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '184 out of 325 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "5.66", "B": "56.62", "C": "43.38", "D": "598"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  147,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '65 out of 172 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "62.21", "B": "3.78", "C": "111.8", "D": "37.79"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  148,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '103 out of 380 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "391.4", "B": "2.71", "C": "27.11", "D": "72.89"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  149,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+9. Find y when x=6.',
  'mcq',
  '{"A": "15", "B": "45", "C": "36", "D": "54"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  150,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '24 out of 203 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "48.72", "B": "1.18", "C": "88.18", "D": "11.82"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  151,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '161 out of 219 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "26.48", "B": "73.52", "C": "7.35", "D": "352.59"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  152,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 723 grows 8% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "731", "B": "843.31", "C": "780.84", "D": "910.77"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  153,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 469 grows 17% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "486", "B": "548.73", "C": "25", "D": "642.01"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  154,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '80 out of 174 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "139.2", "B": "45.98", "C": "54.02", "D": "4.6"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  155,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+3. Find y when x=4.',
  'mcq',
  '{"A": "24", "B": "27", "C": "12", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  156,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 235 grows 22% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "646", "B": "257", "C": "349.77", "D": "286.7"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  157,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '79 out of 212 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "62.74", "B": "37.26", "C": "167.48", "D": "3.73"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  158,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 437 grows 25% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "682.81", "B": "462", "C": "853.52", "D": "546.25"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  159,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+3. Find y when x=5.',
  'mcq',
  '{"A": "10", "B": "15", "C": "5", "D": "13"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  160,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+4. Find y when x=10.',
  'mcq',
  '{"A": "70", "B": "11", "C": "74", "D": "40"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  161,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '41 out of 162 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "74.69", "B": "25.31", "C": "66.42", "D": "2.53"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  162,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 713 grows 6% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "736", "B": "719", "C": "801.13", "D": "755.78"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  163,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '161 out of 181 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "88.95", "B": "11.05", "C": "8.9", "D": "291.41"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  164,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+4. Find y when x=5.',
  'mcq',
  '{"A": "62", "B": "8", "C": "20", "D": "24"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  165,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 748 grows 25% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "1168.75", "B": "935", "C": "773", "D": "1460.94"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  166,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '169 out of 214 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "21.03", "B": "361.66", "C": "78.97", "D": "7.9"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  167,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 443 grows 16% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "513.88", "B": "802.11", "C": "459", "D": "691.48"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  168,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 546 grows 5% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "663.67", "B": "551", "C": "696.85", "D": "573.3"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  169,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+9. Find y when x=7.',
  'mcq',
  '{"A": "63", "B": "28", "C": "37", "D": "13"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  170,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '174 out of 239 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "27.2", "B": "415.86", "C": "72.8", "D": "7.28"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  171,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '162 out of 300 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "54", "B": "486", "C": "46", "D": "5.4"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  172,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+4. Find y when x=4.',
  'mcq',
  '{"A": "20", "B": "9", "C": "16", "D": "24"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  173,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 737 grows 17% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "1381.05", "B": "754", "C": "862.29", "D": "1180.39"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  174,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '231 out of 303 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "76.24", "B": "699.93", "C": "7.62", "D": "23.76"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  175,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+4. Find y when x=9.',
  'mcq',
  '{"A": "18", "B": "6", "C": "22", "D": "36"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  176,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 698 grows 8% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "879.28", "B": "949.62", "C": "706", "D": "753.84"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  177,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 498 grows 22% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "520", "B": "741.22", "C": "904.29", "D": "607.56"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  178,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+9. Find y when x=4.',
  'mcq',
  '{"A": "8", "B": "36", "C": "11", "D": "17"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  179,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+9. Find y when x=9.',
  'mcq',
  '{"A": "54", "B": "63", "C": "15", "D": "81"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  180,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '51 out of 228 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "77.63", "B": "2.24", "C": "22.37", "D": "116.28"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  181,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '88 out of 341 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "300.08", "B": "74.19", "C": "2.58", "D": "25.81"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  182,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '78 out of 352 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "274.56", "B": "2.22", "C": "77.84", "D": "22.16"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  183,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 510 grows 6% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "573.04", "B": "516", "C": "607.42", "D": "540.6"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  184,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 571 grows 25% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "1115.23", "B": "596", "C": "713.75", "D": "1394.04"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  185,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 652 grows 23% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "801.96", "B": "441", "C": "986.41", "D": "675"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  186,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '341 out of 393 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "1340.13", "B": "13.23", "C": "8.68", "D": "86.77"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  187,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 267 grows 6% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "283.02", "B": "300", "C": "775", "D": "273"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  188,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '53 out of 308 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "82.79", "B": "163.24", "C": "1.72", "D": "17.21"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  189,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 770 grows 17% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "1233.24", "B": "900.9", "C": "787", "D": "1442.89"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  190,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '117 out of 141 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "164.97", "B": "8.3", "C": "17.02", "D": "82.98"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  191,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+5. Find y when x=5.',
  'mcq',
  '{"A": "30", "B": "25", "C": "593", "D": "10"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  192,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '70 out of 368 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "257.6", "B": "80.98", "C": "19.02", "D": "1.9"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  193,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+4. Find y when x=7.',
  'mcq',
  '{"A": "49", "B": "28", "C": "53", "D": "11"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  194,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '198 out of 276 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "546.48", "B": "71.74", "C": "28.26", "D": "7.17"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  195,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 613 grows 6% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "649.78", "B": "619", "C": "730.09", "D": "773.9"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  196,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 340 grows 7% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "347", "B": "389.27", "C": "83", "D": "363.8"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  197,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+9. Find y when x=9.',
  'mcq',
  '{"A": "16", "B": "81", "C": "72", "D": "63"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  198,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '126 out of 164 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "76.83", "B": "23.17", "C": "7.68", "D": "206.64"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  199,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '53 out of 163 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "32.52", "B": "67.48", "C": "3.25", "D": "86.39"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  200,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '110 out of 379 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "416.9", "B": "70.98", "C": "2.9", "D": "29.02"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  201,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+7. Find y when x=10.',
  'mcq',
  '{"A": "15", "B": "80", "C": "70", "D": "87"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  202,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+9. Find y when x=5.',
  'mcq',
  '{"A": "45", "B": "29", "C": "20", "D": "13"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  203,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 500 grows 18% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "564", "B": "518", "C": "590", "D": "696.2"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  204,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '228 out of 348 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "34.48", "B": "65.52", "C": "793.44", "D": "6.55"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  205,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '153 out of 259 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "5.91", "B": "396.27", "C": "59.07", "D": "40.93"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  206,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 715 grows 5% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "720", "B": "912.54", "C": "750.75", "D": "869.09"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  207,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 432 grows 20% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "622.08", "B": "518.4", "C": "452", "D": "388"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  208,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+3. Find y when x=7.',
  'mcq',
  '{"A": "42", "B": "21", "C": "9", "D": "45"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  209,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 283 grows 14% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "477.98", "B": "544.89", "C": "322.62", "D": "297"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  210,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 281 grows 15% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "371.62", "B": "427.37", "C": "323.15", "D": "296"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  211,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+5. Find y when x=9.',
  'mcq',
  '{"A": "45", "B": "36", "C": "41", "D": "9"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  212,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+8. Find y when x=6.',
  'mcq',
  '{"A": "10", "B": "48", "C": "12", "D": "20"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  213,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '171 out of 235 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "27.23", "B": "401.85", "C": "72.77", "D": "7.28"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  214,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 511 grows 17% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "699.51", "B": "597.87", "C": "818.42", "D": "528"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  215,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+5. Find y when x=6.',
  'mcq',
  '{"A": "12", "B": "47", "C": "30", "D": "42"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  216,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+4. Find y when x=4.',
  'mcq',
  '{"A": "32", "B": "36", "C": "12", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  217,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '91 out of 335 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "304.85", "B": "2.72", "C": "72.84", "D": "27.16"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  218,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 380 grows 8% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "388", "B": "410.4", "C": "478.69", "D": "516.99"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  219,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+6. Find y when x=6.',
  'mcq',
  '{"A": "18", "B": "8", "C": "36", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  220,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 224 grows 14% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "431.29", "B": "378.33", "C": "238", "D": "255.36"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  221,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+8. Find y when x=4.',
  'mcq',
  '{"A": "32", "B": "15", "C": "36", "D": "28"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  222,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+7. Find y when x=5.',
  'mcq',
  '{"A": "47", "B": "40", "C": "15", "D": "35"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  223,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '317 out of 395 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "80.25", "B": "8.03", "C": "1252.15", "D": "19.75"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  224,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+9. Find y when x=10.',
  'mcq',
  '{"A": "16", "B": "70", "C": "90", "D": "79"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  225,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 750 grows 8% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "758", "B": "217", "C": "810", "D": "874.8"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  226,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '32 out of 120 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "26.67", "B": "73.33", "C": "2.67", "D": "38.4"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  227,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '303 out of 386 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "7.85", "B": "21.5", "C": "1169.58", "D": "78.5"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  228,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 234 grows 24% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "359.8", "B": "290.16", "C": "258", "D": "446.15"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  229,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 238 grows 8% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "246", "B": "257.04", "C": "323.8", "D": "299.81"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  230,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 510 grows 17% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "596.7", "B": "955.68", "C": "1118.15", "D": "527"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  231,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 649 grows 20% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "669", "B": "90", "C": "934.56", "D": "778.8"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  232,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '79 out of 303 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "73.93", "B": "239.37", "C": "26.07", "D": "2.61"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  233,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '57 out of 124 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "45.97", "B": "4.6", "C": "54.03", "D": "70.68"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  234,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '125 out of 222 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "56.31", "B": "43.69", "C": "5.63", "D": "277.5"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  235,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+9. Find y when x=5.',
  'mcq',
  '{"A": "49", "B": "17", "C": "45", "D": "40"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  236,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+6. Find y when x=9.',
  'mcq',
  '{"A": "664", "B": "12", "C": "54", "D": "60"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  237,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 384 grows 21% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "680.28", "B": "464.64", "C": "562.21", "D": "405"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  238,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '133 out of 154 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "86.36", "B": "8.64", "C": "13.64", "D": "204.82"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  239,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 741 grows 10% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "815.1", "B": "986.27", "C": "896.61", "D": "751"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  240,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '62 out of 136 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "45.59", "B": "54.41", "C": "84.32", "D": "4.56"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  241,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '147 out of 219 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "321.93", "B": "6.71", "C": "32.88", "D": "67.12"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  242,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+4. Find y when x=5.',
  'mcq',
  '{"A": "10", "B": "20", "C": "30", "D": "34"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  243,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '192 out of 316 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "606.72", "B": "60.76", "C": "39.24", "D": "6.08"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  244,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+7. Find y when x=5.',
  'mcq',
  '{"A": "20", "B": "11", "C": "27", "D": "35"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  245,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '51 out of 153 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "3.33", "B": "78.03", "C": "66.67", "D": "33.33"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  246,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 431 grows 23% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "454", "B": "530.13", "C": "1213.4", "D": "986.5"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  247,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 527 grows 8% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "569.16", "B": "663.87", "C": "535", "D": "614.69"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  248,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 414 grows 21% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "435", "B": "500.94", "C": "887.45", "D": "1073.81"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  249,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+3. Find y when x=4.',
  'mcq',
  '{"A": "23", "B": "12", "C": "8", "D": "20"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  250,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+9. Find y when x=9.',
  'mcq',
  '{"A": "45", "B": "81", "C": "36", "D": "13"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  251,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+8. Find y when x=9.',
  'mcq',
  '{"A": "26", "B": "10", "C": "72", "D": "18"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  252,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '38 out of 235 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "16.17", "B": "83.83", "C": "89.3", "D": "1.62"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  253,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '188 out of 371 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "50.67", "B": "5.07", "C": "697.48", "D": "49.33"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  254,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 702 grows 22% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "1897.3", "B": "856.44", "C": "1555.16", "D": "724"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  255,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 343 grows 7% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "420.19", "B": "367.01", "C": "350", "D": "449.6"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  256,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 203 grows 16% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "426.37", "B": "367.56", "C": "219", "D": "235.48"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  257,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '127 out of 322 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "60.56", "B": "408.94", "C": "3.94", "D": "39.44"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  258,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+7. Find y when x=9.',
  'mcq',
  '{"A": "72", "B": "79", "C": "15", "D": "63"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  259,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '117 out of 398 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "29.4", "B": "465.66", "C": "2.94", "D": "70.6"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  260,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '88 out of 238 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "209.44", "B": "63.03", "C": "3.7", "D": "36.97"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  261,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 605 grows 8% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "703", "B": "705.67", "C": "613", "D": "653.4"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  262,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 544 grows 11% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "555", "B": "603.84", "C": "825.83", "D": "743.99"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  263,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '338 out of 371 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "91.11", "B": "9.11", "C": "8.89", "D": "1253.98"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  264,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '148 out of 196 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "7.55", "B": "24.49", "C": "75.51", "D": "290.08"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  265,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '277 out of 300 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "9.23", "B": "92.33", "C": "831", "D": "7.67"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  266,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '26 out of 201 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "87.06", "B": "1.29", "C": "12.94", "D": "52.26"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  267,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 242 grows 18% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "397.61", "B": "469.18", "C": "260", "D": "285.56"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  268,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '259 out of 331 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "78.25", "B": "857.29", "C": "7.82", "D": "21.75"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  269,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+3. Find y when x=6.',
  'mcq',
  '{"A": "48", "B": "51", "C": "11", "D": "18"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  270,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+4. Find y when x=9.',
  'mcq',
  '{"A": "36", "B": "40", "C": "8", "D": "988"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  271,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+7. Find y when x=8.',
  'mcq',
  '{"A": "48", "B": "56", "C": "13", "D": "55"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  272,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '80 out of 284 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "71.83", "B": "2.82", "C": "227.2", "D": "28.17"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  273,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '29 out of 345 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "91.59", "B": "100.05", "C": "0.84", "D": "8.41"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  274,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 542 grows 25% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "1058.59", "B": "677.5", "C": "846.88", "D": "567"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  275,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '228 out of 289 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "7.89", "B": "78.89", "C": "21.11", "D": "658.92"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  276,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+7. Find y when x=9.',
  'mcq',
  '{"A": "63", "B": "25", "C": "9", "D": "18"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  277,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+6. Find y when x=10.',
  'mcq',
  '{"A": "56", "B": "50", "C": "60", "D": "11"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  278,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 450 grows 9% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "635.21", "B": "490.5", "C": "459", "D": "582.76"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  279,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 716 grows 14% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "816.24", "B": "930.51", "C": "730", "D": "1060.79"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  280,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 581 grows 20% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "836.64", "B": "697.2", "C": "769", "D": "601"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  281,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '214 out of 330 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "706.2", "B": "6.48", "C": "64.85", "D": "35.15"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  282,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+7. Find y when x=9.',
  'mcq',
  '{"A": "70", "B": "14", "C": "862", "D": "63"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  283,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '236 out of 280 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "84.29", "B": "8.43", "C": "660.8", "D": "15.71"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  284,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '218 out of 341 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "743.38", "B": "63.93", "C": "6.39", "D": "36.07"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  285,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 576 grows 24% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "714.24", "B": "600", "C": "1361.79", "D": "1688.62"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  286,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '97 out of 212 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "45.75", "B": "4.58", "C": "54.25", "D": "205.64"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  287,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 644 grows 15% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "851.69", "B": "740.6", "C": "659", "D": "979.44"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  288,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+3. Find y when x=5.',
  'mcq',
  '{"A": "7", "B": "15", "C": "23", "D": "20"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  289,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '304 out of 370 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "17.84", "B": "1124.8", "C": "82.16", "D": "8.22"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  290,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+7. Find y when x=6.',
  'mcq',
  '{"A": "36", "B": "13", "C": "42", "D": "43"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  291,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+5. Find y when x=4.',
  'mcq',
  '{"A": "12", "B": "17", "C": "8", "D": "20"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  292,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+6. Find y when x=5.',
  'mcq',
  '{"A": "15", "B": "9", "C": "30", "D": "21"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  293,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+9. Find y when x=9.',
  'mcq',
  '{"A": "36", "B": "81", "C": "12", "D": "27"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  294,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '117 out of 166 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "29.52", "B": "194.22", "C": "70.48", "D": "7.05"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  295,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '116 out of 172 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "6.74", "B": "32.56", "C": "199.52", "D": "67.44"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  296,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+5. Find y when x=10.',
  'mcq',
  '{"A": "50", "B": "40", "C": "45", "D": "9"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  297,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 288 grows 15% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "303", "B": "331.2", "C": "380.88", "D": "613"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  298,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '104 out of 153 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "32.03", "B": "67.97", "C": "6.8", "D": "159.12"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  299,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '316 out of 369 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "14.36", "B": "8.56", "C": "1166.04", "D": "85.64"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  300,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+9. Find y when x=4.',
  'mcq',
  '{"A": "28", "B": "37", "C": "36", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  301,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '133 out of 359 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "62.95", "B": "37.05", "C": "477.47", "D": "3.7"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  302,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '57 out of 251 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "2.27", "B": "143.07", "C": "22.71", "D": "77.29"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  303,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '166 out of 208 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "79.81", "B": "345.28", "C": "20.19", "D": "7.98"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  304,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '319 out of 387 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "17.57", "B": "82.43", "C": "8.24", "D": "1234.53"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  305,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+6. Find y when x=10.',
  'mcq',
  '{"A": "30", "B": "9", "C": "60", "D": "36"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  306,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '133 out of 155 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "85.81", "B": "14.19", "C": "206.15", "D": "8.58"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  307,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '79 out of 343 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "270.97", "B": "76.97", "C": "2.3", "D": "23.03"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  308,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 617 grows 16% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "963.07", "B": "633", "C": "715.72", "D": "830.24"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  309,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 775 grows 13% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "875.75", "B": "1263.62", "C": "1118.25", "D": "788"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  310,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '128 out of 296 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "378.88", "B": "56.76", "C": "43.24", "D": "4.32"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  311,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 590 grows 12% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "602", "B": "660.8", "C": "153", "D": "740.1"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  312,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '21 out of 132 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "84.09", "B": "15.91", "C": "27.72", "D": "1.59"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  313,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 326 grows 6% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "388.27", "B": "332", "C": "366.29", "D": "345.56"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  314,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '57 out of 378 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "15.08", "B": "1.51", "C": "84.92", "D": "215.46"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  315,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 499 grows 8% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "678.88", "B": "628.6", "C": "507", "D": "538.92"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  316,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '153 out of 196 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "299.88", "B": "78.06", "C": "7.81", "D": "21.94"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  317,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '55 out of 184 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "29.89", "B": "70.11", "C": "101.2", "D": "2.99"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  318,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 267 grows 6% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "318", "B": "273", "C": "283.02", "D": "337.08"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  319,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+5. Find y when x=9.',
  'mcq',
  '{"A": "77", "B": "72", "C": "45", "D": "13"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  320,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+5. Find y when x=5.',
  'mcq',
  '{"A": "40", "B": "12", "C": "35", "D": "25"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  321,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+6. Find y when x=6.',
  'mcq',
  '{"A": "24", "B": "18", "C": "36", "D": "9"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  322,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+8. Find y when x=5.',
  'mcq',
  '{"A": "20", "B": "28", "C": "12", "D": "40"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  323,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+6. Find y when x=8.',
  'mcq',
  '{"A": "10", "B": "38", "C": "48", "D": "32"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  324,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 431 grows 13% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "444", "B": "487.03", "C": "702.73", "D": "794.09"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  325,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '240 out of 389 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "61.7", "B": "6.17", "C": "38.3", "D": "933.6"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  326,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 277 grows 17% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "443.65", "B": "294", "C": "379.19", "D": "324.09"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  327,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 643 grows 8% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "651", "B": "833", "C": "694.44", "D": "750"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  328,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 586 grows 13% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "10", "B": "599", "C": "748.26", "D": "662.18"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  329,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '260 out of 290 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "754", "B": "89.66", "C": "8.97", "D": "10.34"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  330,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '241 out of 302 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "727.82", "B": "79.8", "C": "20.2", "D": "7.98"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  331,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+5. Find y when x=10.',
  'mcq',
  '{"A": "60", "B": "65", "C": "11", "D": "50"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  332,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+6. Find y when x=9.',
  'mcq',
  '{"A": "33", "B": "54", "C": "9", "D": "27"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  333,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '136 out of 162 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "16.05", "B": "8.4", "C": "220.32", "D": "83.95"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  334,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '122 out of 195 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "37.44", "B": "6.26", "C": "62.56", "D": "237.9"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  335,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+4. Find y when x=4.',
  'mcq',
  '{"A": "16", "B": "8", "C": "157", "D": "20"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  336,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+8. Find y when x=8.',
  'mcq',
  '{"A": "69", "B": "56", "C": "15", "D": "64"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  337,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '128 out of 214 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "5.98", "B": "273.92", "C": "59.81", "D": "40.19"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  338,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+7. Find y when x=6.',
  'mcq',
  '{"A": "24", "B": "42", "C": "31", "D": "11"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  339,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 772 grows 15% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "1350.23", "B": "1552.77", "C": "787", "D": "887.8"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  340,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 280 grows 14% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "363.89", "B": "528", "C": "319.2", "D": "294"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  341,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 800 grows 17% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "936", "B": "1281.29", "C": "817", "D": "1095.12"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  342,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '93 out of 358 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "2.6", "B": "25.98", "C": "74.02", "D": "332.94"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  343,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+7. Find y when x=7.',
  'mcq',
  '{"A": "550", "B": "14", "C": "49", "D": "56"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  344,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+6. Find y when x=8.',
  'mcq',
  '{"A": "24", "B": "48", "C": "30", "D": "9"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  345,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 369 grows 21% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "653.71", "B": "446.49", "C": "390", "D": "790.98"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  346,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 668 grows 13% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "1230.75", "B": "681", "C": "1089.16", "D": "754.84"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  347,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 715 grows 5% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "750.75", "B": "869.09", "C": "827.7", "D": "720"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  348,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '164 out of 305 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "5.38", "B": "46.23", "C": "53.77", "D": "500.2"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  349,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+7. Find y when x=8.',
  'mcq',
  '{"A": "56", "B": "71", "C": "64", "D": "15"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  350,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+7. Find y when x=4.',
  'mcq',
  '{"A": "28", "B": "39", "C": "32", "D": "15"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  351,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+6. Find y when x=10.',
  'mcq',
  '{"A": "13", "B": "70", "C": "76", "D": "60"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  352,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '86 out of 148 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "5.81", "B": "127.28", "C": "58.11", "D": "41.89"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  353,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+3. Find y when x=7.',
  'mcq',
  '{"A": "21", "B": "8", "C": "35", "D": "38"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  354,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 323 grows 18% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "626.23", "B": "381.14", "C": "530.7", "D": "341"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  355,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+8. Find y when x=5.',
  'mcq',
  '{"A": "11", "B": "15", "C": "40", "D": "23"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  356,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 491 grows 14% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "505", "B": "559.74", "C": "829.28", "D": "945.38"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  357,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 394 grows 7% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "401", "B": "482.67", "C": "421.58", "D": "451.09"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  358,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+6. Find y when x=7.',
  'mcq',
  '{"A": "28", "B": "34", "C": "42", "D": "10"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  359,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+6. Find y when x=5.',
  'mcq',
  '{"A": "13", "B": "41", "C": "35", "D": "30"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  360,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '288 out of 355 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "1022.4", "B": "18.87", "C": "8.11", "D": "81.13"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  361,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 775 grows 25% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "800", "B": "1210.94", "C": "1513.67", "D": "968.75"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  362,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 233 grows 23% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "256", "B": "352.51", "C": "259", "D": "286.59"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  363,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '42 out of 246 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "82.93", "B": "103.32", "C": "1.71", "D": "17.07"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  364,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '237 out of 338 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "7.01", "B": "801.06", "C": "70.12", "D": "29.88"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  365,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '96 out of 279 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "34.41", "B": "3.44", "C": "267.84", "D": "65.59"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  366,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+9. Find y when x=7.',
  'mcq',
  '{"A": "11", "B": "14", "C": "23", "D": "63"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  367,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 643 grows 14% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "1238.04", "B": "1086", "C": "657", "D": "733.02"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  368,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '138 out of 279 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "49.46", "B": "4.95", "C": "385.02", "D": "50.54"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  369,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '141 out of 230 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "6.13", "B": "38.7", "C": "61.3", "D": "324.3"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  370,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '195 out of 224 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "436.8", "B": "8.71", "C": "12.95", "D": "87.05"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  371,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '54 out of 126 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "4.29", "B": "68.04", "C": "42.86", "D": "57.14"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  372,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '216 out of 363 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "59.5", "B": "40.5", "C": "5.95", "D": "784.08"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  373,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+9. Find y when x=8.',
  'mcq',
  '{"A": "64", "B": "17", "C": "72", "D": "73"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  374,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '37 out of 219 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "16.89", "B": "81.03", "C": "1.69", "D": "83.11"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  375,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 616 grows 12% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "689.92", "B": "865.44", "C": "628", "D": "969.29"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  376,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+7. Find y when x=6.',
  'mcq',
  '{"A": "55", "B": "48", "C": "15", "D": "42"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  377,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 282 grows 24% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "433.6", "B": "537.67", "C": "349.68", "D": "306"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  378,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '282 out of 326 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "8.65", "B": "919.32", "C": "86.5", "D": "13.5"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  379,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '257 out of 395 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "65.06", "B": "1015.15", "C": "6.51", "D": "34.94"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  380,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+9. Find y when x=10.',
  'mcq',
  '{"A": "90", "B": "17", "C": "80", "D": "89"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  381,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+7. Find y when x=6.',
  'mcq',
  '{"A": "10", "B": "42", "C": "25", "D": "18"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  382,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 691 grows 14% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "1330.46", "B": "705", "C": "1167.07", "D": "787.74"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  383,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+7. Find y when x=9.',
  'mcq',
  '{"A": "13", "B": "54", "C": "61", "D": "63"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  384,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+8. Find y when x=6.',
  'mcq',
  '{"A": "44", "B": "48", "C": "36", "D": "14"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  385,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+5. Find y when x=7.',
  'mcq',
  '{"A": "35", "B": "14", "C": "19", "D": "7"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  386,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '231 out of 254 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "9.06", "B": "9.09", "C": "586.74", "D": "90.94"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  387,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '185 out of 398 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "46.48", "B": "53.52", "C": "736.3", "D": "4.65"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  388,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 683 grows 24% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "724", "B": "707", "C": "846.92", "D": "1050.18"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  389,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 405 grows 21% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "490.05", "B": "592.96", "C": "426", "D": "994"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  390,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '196 out of 235 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "16.6", "B": "460.6", "C": "83.4", "D": "8.34"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  391,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+4. Find y when x=5.',
  'mcq',
  '{"A": "20", "B": "6", "C": "10", "D": "14"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  392,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '213 out of 250 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "532.5", "B": "85.2", "C": "8.52", "D": "14.8"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  393,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '141 out of 210 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "6.71", "B": "296.1", "C": "67.14", "D": "32.86"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  394,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+9. Find y when x=8.',
  'mcq',
  '{"A": "49", "B": "72", "C": "14", "D": "40"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  395,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 722 grows 9% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "857", "B": "857.81", "C": "786.98", "D": "731"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  396,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '229 out of 284 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "80.63", "B": "650.36", "C": "19.37", "D": "8.06"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  397,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+3. Find y when x=10.',
  'mcq',
  '{"A": "80", "B": "83", "C": "30", "D": "11"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  398,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 704 grows 13% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "795.52", "B": "898.94", "C": "717", "D": "1015.8"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  399,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+3. Find y when x=7.',
  'mcq',
  '{"A": "24", "B": "21", "C": "795", "D": "6"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  400,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '190 out of 298 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "566.2", "B": "6.38", "C": "63.76", "D": "36.24"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  401,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '238 out of 269 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "640.22", "B": "8.85", "C": "11.52", "D": "88.48"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  402,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+8. Find y when x=10.',
  'mcq',
  '{"A": "48", "B": "80", "C": "12", "D": "40"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  403,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 303 grows 20% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "323", "B": "753.96", "C": "363.6", "D": "628.3"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  404,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 318 grows 14% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "612.28", "B": "362.52", "C": "332", "D": "537.09"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  405,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '312 out of 362 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "1129.44", "B": "13.81", "C": "86.19", "D": "8.62"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  406,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+5. Find y when x=6.',
  'mcq',
  '{"A": "29", "B": "24", "C": "9", "D": "30"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  407,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '169 out of 212 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "7.97", "B": "79.72", "C": "20.28", "D": "358.28"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  408,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 239 grows 17% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "279.63", "B": "382.79", "C": "327.17", "D": "256"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  409,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 625 grows 21% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "756.25", "B": "1339.74", "C": "1621.09", "D": "646"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  410,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+3. Find y when x=4.',
  'mcq',
  '{"A": "11", "B": "35", "C": "12", "D": "32"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  411,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 523 grows 18% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "617.14", "B": "1013.98", "C": "1196.5", "D": "541"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  412,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 558 grows 8% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "650.85", "B": "566", "C": "702.92", "D": "602.64"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  413,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '37 out of 121 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "3.06", "B": "30.58", "C": "69.42", "D": "44.77"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  414,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 598 grows 24% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "622", "B": "1413.8", "C": "1753.11", "D": "741.52"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  415,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 426 grows 9% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "464.34", "B": "506.13", "C": "435", "D": "551.68"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  416,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '84 out of 165 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "49.09", "B": "5.09", "C": "50.91", "D": "138.6"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  417,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 675 grows 12% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "948.33", "B": "846.72", "C": "756", "D": "687"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  418,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '25 out of 178 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "1.4", "B": "44.5", "C": "85.96", "D": "14.04"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  419,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '89 out of 329 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "27.05", "B": "72.95", "C": "292.81", "D": "2.71"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  420,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '144 out of 245 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "352.8", "B": "58.78", "C": "41.22", "D": "5.88"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  421,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 316 grows 9% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "344.44", "B": "375.44", "C": "325", "D": "483"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  422,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 389 grows 18% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "639.14", "B": "407", "C": "459.02", "D": "754.18"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  423,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+4. Find y when x=5.',
  'mcq',
  '{"A": "20", "B": "29", "C": "25", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  424,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '26 out of 123 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "21.14", "B": "78.86", "C": "2.11", "D": "31.98"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  425,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '319 out of 351 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "1119.69", "B": "9.12", "C": "9.09", "D": "90.88"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  426,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 471 grows 19% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "944.51", "B": "560.49", "C": "1123.97", "D": "490"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  427,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '230 out of 330 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "759", "B": "6.97", "C": "69.7", "D": "30.3"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  428,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 247 grows 25% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "603.03", "B": "753.78", "C": "308.75", "D": "272"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  429,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 705 grows 19% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "998.35", "B": "494", "C": "838.95", "D": "724"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  430,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=3x+9. Find y when x=4.',
  'mcq',
  '{"A": "21", "B": "36", "C": "12", "D": "71"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  431,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '102 out of 165 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "61.82", "B": "168.3", "C": "6.18", "D": "38.18"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  432,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '37 out of 272 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "1.36", "B": "13.6", "C": "100.64", "D": "86.4"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  433,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '118 out of 158 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "7.47", "B": "25.32", "C": "74.68", "D": "186.44"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  434,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 733 grows 10% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "1073.19", "B": "743", "C": "1180.5", "D": "806.3"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  435,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '225 out of 327 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "68.81", "B": "31.19", "C": "735.75", "D": "6.88"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  436,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+9. Find y when x=5.',
  'mcq',
  '{"A": "39", "B": "15", "C": "45", "D": "30"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  437,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 697 grows 6% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "703", "B": "783.15", "C": "830.14", "D": "738.82"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  438,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+5. Find y when x=8.',
  'mcq',
  '{"A": "996", "B": "40", "C": "45", "D": "10"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  439,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 402 grows 16% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "727.88", "B": "627.48", "C": "418", "D": "466.32"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  440,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 788 grows 23% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "1803.63", "B": "1466.36", "C": "969.24", "D": "811"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  441,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 637 grows 18% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "54", "B": "751.66", "C": "655", "D": "886.96"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  442,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '305 out of 339 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "1033.95", "B": "89.97", "C": "9", "D": "10.03"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  443,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+3. Find y when x=8.',
  'mcq',
  '{"A": "59", "B": "24", "C": "10", "D": "56"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  444,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 544 grows 19% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "563", "B": "916.73", "C": "647.36", "D": "770.36"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  445,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 323 grows 25% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "403.75", "B": "788.57", "C": "630.86", "D": "348"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  446,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '27 out of 232 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "62.64", "B": "88.36", "C": "11.64", "D": "1.16"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  447,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '124 out of 347 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "35.73", "B": "3.57", "C": "430.28", "D": "64.27"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  448,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+4. Find y when x=9.',
  'mcq',
  '{"A": "54", "B": "36", "C": "10", "D": "58"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  449,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '54 out of 166 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "89.64", "B": "32.53", "C": "67.47", "D": "3.25"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  450,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 425 grows 23% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "642.98", "B": "522.75", "C": "448", "D": "578"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  451,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '297 out of 322 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "956.34", "B": "9.22", "C": "7.76", "D": "92.24"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  452,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 387 grows 19% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "406", "B": "652.16", "C": "460.53", "D": "776.07"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  453,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 334 grows 12% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "346", "B": "588.62", "C": "525.56", "D": "374.08"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  454,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 355 grows 6% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "461", "B": "361", "C": "398.88", "D": "376.3"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  455,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+9. Find y when x=8.',
  'mcq',
  '{"A": "65", "B": "72", "C": "56", "D": "16"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  456,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 697 grows 17% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "954.12", "B": "714", "C": "815.49", "D": "789"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  457,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 311 grows 22% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "379.42", "B": "333", "C": "688.97", "D": "840.54"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  458,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+4. Find y when x=4.',
  'mcq',
  '{"A": "28", "B": "16", "C": "10", "D": "24"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step linear analytical reasoning.',
  459,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 539 grows 20% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "931.39", "B": "646.8", "C": "776.16", "D": "559"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  460,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 311 grows 12% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "348.32", "B": "81", "C": "390.12", "D": "323"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  461,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '215 out of 317 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "32.18", "B": "67.82", "C": "681.55", "D": "6.78"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  462,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '179 out of 218 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "17.89", "B": "390.22", "C": "82.11", "D": "8.21"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  463,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 764 grows 15% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "878.6", "B": "1010.39", "C": "1161.95", "D": "779"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  464,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+8. Find y when x=4.',
  'mcq',
  '{"A": "16", "B": "12", "C": "24", "D": "32"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  465,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '262 out of 329 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "79.64", "B": "20.36", "C": "861.98", "D": "7.96"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  466,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 762 grows 22% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "1688.08", "B": "2059.46", "C": "784", "D": "929.64"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  467,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '105 out of 186 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "56.45", "B": "43.55", "C": "5.65", "D": "195.3"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  468,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '328 out of 389 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "15.68", "B": "8.43", "C": "84.32", "D": "1275.92"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  469,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+3. Find y when x=7.',
  'mcq',
  '{"A": "21", "B": "10", "C": "52", "D": "49"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  470,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '57 out of 181 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "31.49", "B": "68.51", "C": "103.17", "D": "3.15"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  471,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+3. Find y when x=8.',
  'mcq',
  '{"A": "24", "B": "5", "C": "19", "D": "16"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  472,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '44 out of 182 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "75.82", "B": "2.42", "C": "24.18", "D": "80.08"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  473,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '210 out of 321 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "674.1", "B": "65.42", "C": "6.54", "D": "34.58"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  474,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+3. Find y when x=9.',
  'mcq',
  '{"A": "27", "B": "48", "C": "8", "D": "45"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  475,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=5x+3. Find y when x=8.',
  'mcq',
  '{"A": "24", "B": "43", "C": "8", "D": "40"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  476,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=6x+6. Find y when x=5.',
  'mcq',
  '{"A": "30", "B": "546", "C": "12", "D": "36"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  477,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '119 out of 373 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "31.9", "B": "68.1", "C": "443.87", "D": "3.19"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  478,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=2x+7. Find y when x=6.',
  'mcq',
  '{"A": "9", "B": "19", "C": "42", "D": "12"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  479,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+5. Find y when x=7.',
  'mcq',
  '{"A": "49", "B": "12", "C": "35", "D": "54"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  480,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+4. Find y when x=9.',
  'mcq',
  '{"A": "11", "B": "36", "C": "67", "D": "63"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  481,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 724 grows 18% annually for 5 years. Approx final value?',
  'mcq',
  '{"A": "742", "B": "1656.34", "C": "1403.68", "D": "854.32"}'::jsonb,
  '"B"'::jsonb,
  'Compound growth modeling.',
  482,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 634 grows 12% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "890.72", "B": "710.08", "C": "795.29", "D": "646"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  483,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '220 out of 389 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "56.56", "B": "855.8", "C": "5.66", "D": "43.44"}'::jsonb,
  '"A"'::jsonb,
  'Percentage data interpretation.',
  484,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '197 out of 254 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "7.76", "B": "77.56", "C": "500.38", "D": "22.44"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  485,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '62 out of 178 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "3.48", "B": "65.17", "C": "34.83", "D": "110.36"}'::jsonb,
  '"C"'::jsonb,
  'Percentage data interpretation.',
  486,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '148 out of 198 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "25.25", "B": "74.75", "C": "7.47", "D": "293.04"}'::jsonb,
  '"B"'::jsonb,
  'Percentage data interpretation.',
  487,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '130 out of 245 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "46.94", "B": "318.5", "C": "5.31", "D": "53.06"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  488,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 369 grows 22% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "817.46", "B": "670.05", "C": "450.18", "D": "391"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  489,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 661 grows 21% annually for 4 years. Approx final value?',
  'mcq',
  '{"A": "1171", "B": "682", "C": "799.81", "D": "1416.91"}'::jsonb,
  '"D"'::jsonb,
  'Compound growth modeling.',
  490,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '102 out of 134 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "136.68", "B": "7.61", "C": "23.88", "D": "76.12"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  491,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 312 grows 22% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "464.38", "B": "380.64", "C": "334", "D": "439"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  492,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=7x+9. Find y when x=5.',
  'mcq',
  '{"A": "35", "B": "45", "C": "44", "D": "16"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step linear analytical reasoning.',
  493,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 300 grows 7% annually for 2 years. Approx final value?',
  'mcq',
  '{"A": "343.47", "B": "321", "C": "307", "D": "540"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  494,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=8x+3. Find y when x=8.',
  'mcq',
  '{"A": "11", "B": "67", "C": "64", "D": "24"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step linear analytical reasoning.',
  495,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  '123 out of 261 respondents preferred option A. What is percentage?',
  'mcq',
  '{"A": "321.03", "B": "4.71", "C": "52.87", "D": "47.13"}'::jsonb,
  '"D"'::jsonb,
  'Percentage data interpretation.',
  496,
  true,
  '{"grade": "Post-12", "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 344 grows 19% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "579.69", "B": "487.14", "C": "409.36", "D": "363"}'::jsonb,
  '"A"'::jsonb,
  'Compound growth modeling.',
  497,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+8. Find y when x=6.',
  'mcq',
  '{"A": "12", "B": "24", "C": "48", "D": "32"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  498,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A value 363 grows 13% annually for 3 years. Approx final value?',
  'mcq',
  '{"A": "376", "B": "463.51", "C": "523.77", "D": "410.19"}'::jsonb,
  '"C"'::jsonb,
  'Compound growth modeling.',
  499,
  true,
  '{"grade": "Post-12", "dimension": "QU", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'd9e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a',
  'A system follows y=4x+3. Find y when x=7.',
  'mcq',
  '{"A": "7", "B": "28", "C": "21", "D": "31"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step linear analytical reasoning.',
  500,
  true,
  '{"grade": "Post-12", "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);
