-- Seed adaptive aptitude questions for High School (Grades 9-10)
-- Generated from Adaptive_Aptitude_G9-10_500_MCQs_FINAL_FORMATTED_SHUFFLED.csv

-- Insert adaptive aptitude section for High School (Grades 9-10)
INSERT INTO personal_assessment_sections (
  id, name, title, description, order_number, is_timed,
  time_limit_seconds, is_active, grade_level, created_at, updated_at
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'adaptive_aptitude_high',
  'Adaptive Aptitude - High School',
  'Adaptive aptitude assessment for high school students (grades 9-10)',
  11,
  true,
  3600,
  true,
  'highschool',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;


-- Insert questions

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'What is the value of cos 60°?',
  'mcq',
  '{"A": "0.71", "B": "0.5", "C": "0.25", "D": "0.87"}'::jsonb,
  '"B"'::jsonb,
  'Uses standard trigonometric values.',
  1,
  true,
  '{"grade": 9, "dimension": "TR", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Two fair coins are tossed. What is the probability of getting at least one head?',
  'mcq',
  '{"A": "1/2", "B": "3/4", "C": "1/4", "D": "1"}'::jsonb,
  '"B"'::jsonb,
  'Computes probability of combined events (two coins).',
  2,
  true,
  '{"grade": 9, "dimension": "PR", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A circle has radius 5 cm. What is its circumference? (Use π = 3.14)',
  'mcq',
  '{"A": "78.5", "B": "31.4", "C": "28.26", "D": "37.68"}'::jsonb,
  '"B"'::jsonb,
  'Applies circumference formula of a circle.',
  3,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 4x + 4 = 20',
  'mcq',
  '{"A": "4", "B": "5", "C": "3", "D": "6"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  4,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 14, 21, 6, 25, 10. What is the median?',
  'mcq',
  '{"A": "15.2", "B": "14", "C": "21", "D": "10"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  5,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 4x² - 4x + 9 at x = -2.',
  'mcq',
  '{"A": "41", "B": "38", "C": "29", "D": "33"}'::jsonb,
  '"D"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  6,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 118 students, 80 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "94.4", "B": "32.2", "C": "67.8", "D": "6.78"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  7,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 73° and 63°. What is the third angle?',
  'mcq',
  '{"A": "136", "B": "44", "C": "54", "D": "34"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  8,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 5 cm long, 8 cm wide, and 10 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "40", "B": "80", "C": "50", "D": "400"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  9,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹1117. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "949.45", "B": "837.75", "C": "1097", "D": "893.6"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  10,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Which statement is always true for any integer n?',
  'mcq',
  '{"A": "n² is always odd", "B": "n is always prime", "C": "n+2 is always even", "D": "n(n+1) is even"}'::jsonb,
  '"D"'::jsonb,
  'Tests logical reasoning about number properties.',
  11,
  true,
  '{"grade": 9, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (8^2) × (8^1) ÷ 8^2',
  'mcq',
  '{"A": "67", "B": "64", "C": "8", "D": "1"}'::jsonb,
  '"C"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  12,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A circle has radius 9 cm. What is its circumference? (Use π = 3.14)',
  'mcq',
  '{"A": "62.8", "B": "56.52", "C": "53.38", "D": "254.34"}'::jsonb,
  '"B"'::jsonb,
  'Applies circumference formula of a circle.',
  13,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 7 cm long, 6 cm wide, and 7 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "49", "B": "214", "C": "294", "D": "42"}'::jsonb,
  '"C"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  14,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 11, 23, 25, 13, 20. What is the median?',
  'mcq',
  '{"A": "23", "B": "13", "C": "18.4", "D": "20"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  15,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 9 cm long, 6 cm wide, and 3 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "54", "B": "27", "C": "162", "D": "18"}'::jsonb,
  '"C"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  16,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 2x² - 4x + -3 at x = 8.',
  'mcq',
  '{"A": "97", "B": "98", "C": "89", "D": "93"}'::jsonb,
  '"D"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  17,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 3x² - 6x + -3 at x = -4.',
  'mcq',
  '{"A": "69", "B": "74", "C": "75", "D": "63"}'::jsonb,
  '"A"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  18,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 34° and 78°. What is the third angle?',
  'mcq',
  '{"A": "68", "B": "112", "C": "78", "D": "58"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  19,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 10, 22, 22, 16, 15. What is the median?',
  'mcq',
  '{"A": "16", "B": "17", "C": "15", "D": "22"}'::jsonb,
  '"A"'::jsonb,
  'Finds median from an ordered data set.',
  20,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 49° and 44°. What is the third angle?',
  'mcq',
  '{"A": "93", "B": "87", "C": "77", "D": "97"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  21,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (4^3) × (4^2) ÷ 4^3',
  'mcq',
  '{"A": "8", "B": "16", "C": "4", "D": "64"}'::jsonb,
  '"B"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  22,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 2x² - 5x + -3 at x = 4.',
  'mcq',
  '{"A": "9", "B": "4", "C": "14", "D": "13"}'::jsonb,
  '"A"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  23,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 24, 6, 5, 23, 24. What is the median?',
  'mcq',
  '{"A": "23", "B": "16.4", "C": "6", "D": "24"}'::jsonb,
  '"A"'::jsonb,
  'Finds median from an ordered data set.',
  24,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 18, 7, 6, 22, 17. What is the median?',
  'mcq',
  '{"A": "18", "B": "7", "C": "17", "D": "14"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  25,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 65}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 20, 16, 28, 23, 15. What is the median?',
  'mcq',
  '{"A": "16", "B": "20.4", "C": "23", "D": "20"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  26,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 17, 9, 7, 18, 9. What is the median?',
  'mcq',
  '{"A": "12", "B": "17", "C": "116", "D": "9"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  27,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (4,-3) and (5,2).',
  'mcq',
  '{"A": "4", "B": "6", "C": "5", "D": "0.2"}'::jsonb,
  '"C"'::jsonb,
  'Computes slope using coordinate geometry.',
  28,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A circle has radius 3 cm. What is its circumference? (Use π = 3.14)',
  'mcq',
  '{"A": "25.12", "B": "15.7", "C": "18.84", "D": "28.26"}'::jsonb,
  '"C"'::jsonb,
  'Applies circumference formula of a circle.',
  29,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 5, 21, 13, 12, 15. What is the median?',
  'mcq',
  '{"A": "12", "B": "15", "C": "13.2", "D": "13"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  30,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 2x² - 2x + 2 at x = -4.',
  'mcq',
  '{"A": "40", "B": "42", "C": "46", "D": "47"}'::jsonb,
  '"B"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  31,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A circle has radius 11 cm. What is its circumference? (Use π = 3.14)',
  'mcq',
  '{"A": "69.08", "B": "379.94", "C": "75.36", "D": "65.94"}'::jsonb,
  '"A"'::jsonb,
  'Applies circumference formula of a circle.',
  32,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 10 = 22',
  'mcq',
  '{"A": "6", "B": "3", "C": "4", "D": "5"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  33,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 2x² - 1x + 6 at x = 2.',
  'mcq',
  '{"A": "16", "B": "12", "C": "17", "D": "11"}'::jsonb,
  '"B"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  34,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-1,4) and (0,11).',
  'mcq',
  '{"A": "7", "B": "8", "C": "0.14", "D": "6"}'::jsonb,
  '"A"'::jsonb,
  'Computes slope using coordinate geometry.',
  35,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 1x² - 2x + 7 at x = -3.',
  'mcq',
  '{"A": "20", "B": "22", "C": "24", "D": "27"}'::jsonb,
  '"B"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  36,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 149 students, 130 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "12.75", "B": "193.7", "C": "8.72", "D": "87.25"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  37,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 64° and 40°. What is the third angle?',
  'mcq',
  '{"A": "66", "B": "104", "C": "86", "D": "76"}'::jsonb,
  '"D"'::jsonb,
  'Uses angle-sum property of triangles.',
  38,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 6 cm long, 5 cm wide, and 5 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "144", "B": "150", "C": "25", "D": "30"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  39,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 28, 14, 25, 11, 14. What is the median?',
  'mcq',
  '{"A": "124", "B": "18.4", "C": "14", "D": "25"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  40,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 13, 6, 10, 13, 17. What is the median?',
  'mcq',
  '{"A": "212", "B": "10", "C": "13", "D": "11.8"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  41,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 22 = 28',
  'mcq',
  '{"A": "1", "B": "2", "C": "3", "D": "4"}'::jsonb,
  '"B"'::jsonb,
  'Solves a one-variable linear equation.',
  42,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 25, 10, 28, 24, 5. What is the median?',
  'mcq',
  '{"A": "18.4", "B": "25", "C": "24", "D": "10"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  43,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹261. It is sold at 30% discount. What is the selling price?',
  'mcq',
  '{"A": "169.65", "B": "231", "C": "195.75", "D": "182.7"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  44,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 17 = 53',
  'mcq',
  '{"A": "13", "B": "12", "C": "11", "D": "14"}'::jsonb,
  '"B"'::jsonb,
  'Solves a one-variable linear equation.',
  45,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (4^4) × (4^3) ÷ 4^4',
  'mcq',
  '{"A": "16", "B": "64", "C": "256", "D": "12"}'::jsonb,
  '"B"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  46,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-5,-5) and (-2,0).',
  'mcq',
  '{"A": "0.67", "B": "1.67", "C": "0.6", "D": "2.67"}'::jsonb,
  '"B"'::jsonb,
  'Computes slope using coordinate geometry.',
  47,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 26, 13, 29, 5, 26. What is the median?',
  'mcq',
  '{"A": "277", "B": "13", "C": "26", "D": "19.8"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  48,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 4x + 19 = 43',
  'mcq',
  '{"A": "8", "B": "7", "C": "5", "D": "6"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  49,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A circle has radius 8 cm. What is its circumference? (Use π = 3.14)',
  'mcq',
  '{"A": "47.1", "B": "50.24", "C": "56.52", "D": "200.96"}'::jsonb,
  '"B"'::jsonb,
  'Applies circumference formula of a circle.',
  50,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 2, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 3x² - 4x + 3 at x = 2.',
  'mcq',
  '{"A": "13", "B": "12", "C": "3", "D": "7"}'::jsonb,
  '"D"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  51,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 5x + 8 = 118',
  'mcq',
  '{"A": "21", "B": "22", "C": "24", "D": "23"}'::jsonb,
  '"B"'::jsonb,
  'Solves a one-variable linear equation.',
  52,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 11 cm long, 13 cm wide, and 14 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "182", "B": "143", "C": "154", "D": "2002"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  53,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 8x + 7 = 0 are:',
  'mcq',
  '{"A": "1 and -7", "B": "1 and 7", "C": "2 and 7", "D": "8 and 7"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  54,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A circle has radius 7 cm. What is its circumference? (Use π = 3.14)',
  'mcq',
  '{"A": "43.96", "B": "153.86", "C": "40.82", "D": "50.24"}'::jsonb,
  '"A"'::jsonb,
  'Applies circumference formula of a circle.',
  55,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 2x + 20 = 40',
  'mcq',
  '{"A": "10", "B": "11", "C": "9", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  56,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-1,6) and (1,9).',
  'mcq',
  '{"A": "2.5", "B": "0.5", "C": "1.5", "D": "0.67"}'::jsonb,
  '"C"'::jsonb,
  'Computes slope using coordinate geometry.',
  57,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A circle has radius 10 cm. What is its circumference? (Use π = 3.14)',
  'mcq',
  '{"A": "314", "B": "59.66", "C": "62.8", "D": "69.08"}'::jsonb,
  '"C"'::jsonb,
  'Applies circumference formula of a circle.',
  58,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 11x + 28 = 0 are:',
  'mcq',
  '{"A": "11 and 28", "B": "5 and 7", "C": "4 and 7", "D": "4 and -7"}'::jsonb,
  '"C"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  59,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 6x + 8 = 0 are:',
  'mcq',
  '{"A": "2 and 4", "B": "3 and 4", "C": "6 and 8", "D": "2 and -4"}'::jsonb,
  '"A"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  60,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (4,-6) and (11,-2).',
  'mcq',
  '{"A": "1.57", "B": "-0.43", "C": "0.57", "D": "1.75"}'::jsonb,
  '"C"'::jsonb,
  'Computes slope using coordinate geometry.',
  61,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 26° and 67°. What is the third angle?',
  'mcq',
  '{"A": "77", "B": "97", "C": "93", "D": "87"}'::jsonb,
  '"D"'::jsonb,
  'Uses angle-sum property of triangles.',
  62,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 13 cm long, 10 cm wide, and 4 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "40", "B": "520", "C": "52", "D": "130"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  63,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 13 cm long, 6 cm wide, and 4 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "24", "B": "312", "C": "78", "D": "52"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  64,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 4x + 13 = 117',
  'mcq',
  '{"A": "26", "B": "27", "C": "28", "D": "25"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  65,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 124 students, 100 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "19.35", "B": "80.65", "C": "124", "D": "8.06"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  66,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹823. It is sold at 25% discount. What is the selling price?',
  'mcq',
  '{"A": "617.25", "B": "798", "C": "658.4", "D": "576.1"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  67,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 6x + 14 = 68',
  'mcq',
  '{"A": "8", "B": "10", "C": "9", "D": "11"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  68,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 14x + 48 = 0 are:',
  'mcq',
  '{"A": "14 and 48", "B": "6 and 8", "C": "6 and -8", "D": "7 and 8"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  69,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 2x + 8 = 24',
  'mcq',
  '{"A": "8", "B": "10", "C": "9", "D": "7"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  70,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 85 students, 49 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "41.65", "B": "5.76", "C": "57.65", "D": "42.35"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  71,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 4x² - 7x + -3 at x = 0.',
  'mcq',
  '{"A": "-10", "B": "5", "C": "2", "D": "-3"}'::jsonb,
  '"D"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  72,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'What is the value of sin 0°?',
  'mcq',
  '{"A": "0.71", "B": "0.87", "C": "0", "D": "0.25"}'::jsonb,
  '"C"'::jsonb,
  'Uses standard trigonometric values.',
  73,
  true,
  '{"grade": 9, "dimension": "TR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 64 students, 47 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "7.34", "B": "26.56", "C": "30.08", "D": "73.44"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  74,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹631. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "473.25", "B": "611", "C": "536.35", "D": "504.8"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  75,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 100 students, 29 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "38", "B": "71", "C": "29", "D": "2.9"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  76,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 2x² - 2x + 0 at x = 2.',
  'mcq',
  '{"A": "4", "B": "8", "C": "9", "D": "2"}'::jsonb,
  '"A"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  77,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 3x + 2 = 0 are:',
  'mcq',
  '{"A": "2 and 2", "B": "1 and -2", "C": "1 and 2", "D": "3 and 2"}'::jsonb,
  '"C"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  78,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 7x + 8 = 141',
  'mcq',
  '{"A": "19", "B": "18", "C": "21", "D": "20"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  79,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹788. It is sold at 15% discount. What is the selling price?',
  'mcq',
  '{"A": "773", "B": "669.8", "C": "709.2", "D": "630.4"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  80,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 3x² - 5x + -3 at x = 8.',
  'mcq',
  '{"A": "154", "B": "155", "C": "149", "D": "144"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  81,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 27° and 43°. What is the third angle?',
  'mcq',
  '{"A": "120", "B": "100", "C": "110", "D": "70"}'::jsonb,
  '"C"'::jsonb,
  'Uses angle-sum property of triangles.',
  82,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (6^5) × (6^4) ÷ 6^5',
  'mcq',
  '{"A": "24", "B": "7776", "C": "216", "D": "1296"}'::jsonb,
  '"D"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  83,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 17 cm long, 11 cm wide, and 11 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "2057", "B": "199", "C": "187", "D": "121"}'::jsonb,
  '"A"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  84,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹927. It is sold at 5% discount. What is the selling price?',
  'mcq',
  '{"A": "922", "B": "927", "C": "880.65", "D": "834.3"}'::jsonb,
  '"C"'::jsonb,
  'Calculates selling price after discount.',
  85,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹693. It is sold at 5% discount. What is the selling price?',
  'mcq',
  '{"A": "658.35", "B": "623.7", "C": "693", "D": "688"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  86,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 12x + 11 = 0 are:',
  'mcq',
  '{"A": "1 and 11", "B": "12 and 11", "C": "1 and -11", "D": "2 and 11"}'::jsonb,
  '"A"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  87,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 5 cm long, 9 cm wide, and 12 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "108", "B": "540", "C": "60", "D": "45"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  88,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-3,6) and (2,10).',
  'mcq',
  '{"A": "-0.2", "B": "0.8", "C": "1.8", "D": "1.25"}'::jsonb,
  '"B"'::jsonb,
  'Computes slope using coordinate geometry.',
  89,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 1x² - 5x + 2 at x = 3.',
  'mcq',
  '{"A": "1", "B": "-9", "C": "-4", "D": "-2"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  90,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 9 cm long, 10 cm wide, and 10 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "90", "B": "258", "C": "100", "D": "900"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  91,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 5 = 101',
  'mcq',
  '{"A": "33", "B": "34", "C": "32", "D": "31"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  92,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (8^5) × (8^4) ÷ 8^5',
  'mcq',
  '{"A": "32768", "B": "512", "C": "4096", "D": "32"}'::jsonb,
  '"C"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  93,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (2^4) × (2^3) ÷ 2^4',
  'mcq',
  '{"A": "8", "B": "4", "C": "6", "D": "16"}'::jsonb,
  '"A"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  94,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 63° and 25°. What is the third angle?',
  'mcq',
  '{"A": "102", "B": "92", "C": "82", "D": "88"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  95,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 2x + 22 = 86',
  'mcq',
  '{"A": "34", "B": "33", "C": "32", "D": "31"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  96,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 9 cm long, 10 cm wide, and 16 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "160", "B": "90", "C": "144", "D": "1440"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  97,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A fair die is rolled. What is the probability of getting an even number?',
  'mcq',
  '{"A": "1/2", "B": "1/3", "C": "1/6", "D": "2/3"}'::jsonb,
  '"A"'::jsonb,
  'Computes probability for equally likely outcomes (die).',
  98,
  true,
  '{"grade": 9, "dimension": "PR", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 5x + 4 = 104',
  'mcq',
  '{"A": "22", "B": "19", "C": "21", "D": "20"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  99,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 69 students, 42 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "6.09", "B": "60.87", "C": "28.98", "D": "39.13"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  100,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 28° and 75°. What is the third angle?',
  'mcq',
  '{"A": "103", "B": "77", "C": "67", "D": "87"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  101,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (2,3) and (7,8).',
  'mcq',
  '{"A": "0", "B": "98", "C": "1", "D": "2"}'::jsonb,
  '"C"'::jsonb,
  'Computes slope using coordinate geometry.',
  102,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 20x + 99 = 0 are:',
  'mcq',
  '{"A": "20 and 99", "B": "9 and -11", "C": "10 and 11", "D": "9 and 11"}'::jsonb,
  '"D"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  103,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 11x + 18 = 0 are:',
  'mcq',
  '{"A": "2 and 9", "B": "11 and 18", "C": "3 and 9", "D": "2 and -9"}'::jsonb,
  '"A"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  104,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 78° and 51°. What is the third angle?',
  'mcq',
  '{"A": "61", "B": "129", "C": "41", "D": "51"}'::jsonb,
  '"D"'::jsonb,
  'Uses angle-sum property of triangles.',
  105,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'What is the value of sin 90°?',
  'mcq',
  '{"A": "0.87", "B": "0.71", "C": "1", "D": "0.25"}'::jsonb,
  '"C"'::jsonb,
  'Uses standard trigonometric values.',
  106,
  true,
  '{"grade": 9, "dimension": "TR", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 6, 10, 17, 41, 31. What is the median?',
  'mcq',
  '{"A": "31", "B": "21", "C": "17", "D": "10"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  107,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 42, 7, 10, 38, 34. What is the median?',
  'mcq',
  '{"A": "38", "B": "34", "C": "10", "D": "26.2"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  108,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹435. It is sold at 12% discount. What is the selling price?',
  'mcq',
  '{"A": "382.8", "B": "404.55", "C": "423", "D": "361.05"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  109,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 168 students, 106 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "63.1", "B": "178.08", "C": "36.9", "D": "6.31"}'::jsonb,
  '"A"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  110,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹707. It is sold at 25% discount. What is the selling price?',
  'mcq',
  '{"A": "565.6", "B": "530.25", "C": "682", "D": "494.9"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  111,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 5x² - 6x + 10 at x = -2.',
  'mcq',
  '{"A": "36", "B": "52", "C": "42", "D": "47"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  112,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-7,-6) and (1,2).',
  'mcq',
  '{"A": "1", "B": "147", "C": "0", "D": "2"}'::jsonb,
  '"A"'::jsonb,
  'Computes slope using coordinate geometry.',
  113,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 7x + 10 = 0 are:',
  'mcq',
  '{"A": "7 and 10", "B": "2 and 5", "C": "2 and -5", "D": "3 and 5"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  114,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 5x² - 5x + 3 at x = -2.',
  'mcq',
  '{"A": "33", "B": "28", "C": "43", "D": "38"}'::jsonb,
  '"A"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  115,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 18x + 80 = 0 are:',
  'mcq',
  '{"A": "8 and -10", "B": "9 and 10", "C": "18 and 80", "D": "8 and 10"}'::jsonb,
  '"D"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  116,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 29° and 28°. What is the third angle?',
  'mcq',
  '{"A": "57", "B": "123", "C": "113", "D": "133"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  117,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 29, 8, 27, 28, 11. What is the median?',
  'mcq',
  '{"A": "28", "B": "27", "C": "20.6", "D": "11"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  118,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 79° and 67°. What is the third angle?',
  'mcq',
  '{"A": "44", "B": "146", "C": "34", "D": "24"}'::jsonb,
  '"C"'::jsonb,
  'Uses angle-sum property of triangles.',
  119,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 54° and 63°. What is the third angle?',
  'mcq',
  '{"A": "53", "B": "63", "C": "73", "D": "117"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  120,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 45° and 36°. What is the third angle?',
  'mcq',
  '{"A": "81", "B": "109", "C": "89", "D": "99"}'::jsonb,
  '"D"'::jsonb,
  'Uses angle-sum property of triangles.',
  121,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 3x² - 3x + -3 at x = 3.',
  'mcq',
  '{"A": "12", "B": "20", "C": "15", "D": "21"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  122,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 64° and 42°. What is the third angle?',
  'mcq',
  '{"A": "64", "B": "74", "C": "84", "D": "106"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  123,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹399. It is sold at 12% discount. What is the selling price?',
  'mcq',
  '{"A": "371.07", "B": "351.12", "C": "331.17", "D": "387"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  124,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 7x + 1 = 57',
  'mcq',
  '{"A": "9", "B": "10", "C": "8", "D": "7"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  125,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (7^6) × (7^5) ÷ 7^6',
  'mcq',
  '{"A": "16807", "B": "2401", "C": "35", "D": "117649"}'::jsonb,
  '"A"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  126,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 61° and 56°. What is the third angle?',
  'mcq',
  '{"A": "117", "B": "63", "C": "53", "D": "73"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  127,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 6x + 2 = 68',
  'mcq',
  '{"A": "11", "B": "12", "C": "10", "D": "13"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  128,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 9 cm long, 12 cm wide, and 20 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "180", "B": "108", "C": "240", "D": "2160"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  129,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹488. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "468", "B": "390.4", "C": "366", "D": "414.8"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  130,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 64 students, 34 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "5.31", "B": "46.88", "C": "21.76", "D": "53.12"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  131,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹299. It is sold at 25% discount. What is the selling price?',
  'mcq',
  '{"A": "274", "B": "224.25", "C": "239.2", "D": "209.3"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  132,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹859. It is sold at 25% discount. What is the selling price?',
  'mcq',
  '{"A": "644.25", "B": "687.2", "C": "601.3", "D": "834"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  133,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 18x + 77 = 0 are:',
  'mcq',
  '{"A": "18 and 77", "B": "7 and 11", "C": "7 and -11", "D": "8 and 11"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  134,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (9^2) × (9^1) ÷ 9^2',
  'mcq',
  '{"A": "9", "B": "1", "C": "81", "D": "57"}'::jsonb,
  '"A"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  135,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 5x + 6 = 0 are:',
  'mcq',
  '{"A": "5 and 6", "B": "2 and -3", "C": "2 and 3", "D": "3 and 3"}'::jsonb,
  '"C"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  136,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 10 cm long, 12 cm wide, and 5 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "600", "B": "120", "C": "50", "D": "60"}'::jsonb,
  '"A"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  137,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (8^4) × (8^3) ÷ 8^4',
  'mcq',
  '{"A": "4096", "B": "64", "C": "24", "D": "512"}'::jsonb,
  '"D"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  138,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 120 students, 55 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "66", "B": "4.58", "C": "54.17", "D": "45.83"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  139,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 2x + 22 = 104',
  'mcq',
  '{"A": "43", "B": "42", "C": "40", "D": "41"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  140,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'What is the value of sin 30°?',
  'mcq',
  '{"A": "0.87", "B": "0.71", "C": "0.25", "D": "0.5"}'::jsonb,
  '"D"'::jsonb,
  'Uses standard trigonometric values.',
  141,
  true,
  '{"grade": 9, "dimension": "TR", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 7x + 6 = 0 are:',
  'mcq',
  '{"A": "1 and -6", "B": "1 and 6", "C": "7 and 6", "D": "2 and 6"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  142,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 6x² - 3x + 1 at x = 6.',
  'mcq',
  '{"A": "211", "B": "204", "C": "199", "D": "196"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  143,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (9,-4) and (15,3).',
  'mcq',
  '{"A": "0.86", "B": "2.17", "C": "1.17", "D": "0.17"}'::jsonb,
  '"C"'::jsonb,
  'Computes slope using coordinate geometry.',
  144,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 17x + 72 = 0 are:',
  'mcq',
  '{"A": "9 and 9", "B": "8 and 9", "C": "17 and 72", "D": "8 and -9"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  145,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 209 students, 109 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "52.15", "B": "227.81", "C": "47.85", "D": "5.22"}'::jsonb,
  '"A"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  146,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 26, 49, 26, 26, 20. What is the median?',
  'mcq',
  '{"A": "26", "B": "29.4", "C": "11", "D": "32"}'::jsonb,
  '"A"'::jsonb,
  'Finds median from an ordered data set.',
  147,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 43° and 38°. What is the third angle?',
  'mcq',
  '{"A": "89", "B": "99", "C": "109", "D": "81"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  148,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 32, 30, 31, 41, 29. What is the median?',
  'mcq',
  '{"A": "30", "B": "31", "C": "32.6", "D": "32"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  149,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (7^5) × (7^4) ÷ 7^5',
  'mcq',
  '{"A": "343", "B": "28", "C": "2401", "D": "16807"}'::jsonb,
  '"C"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  150,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 6, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 8 cm long, 17 cm wide, and 11 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "1496", "B": "136", "C": "88", "D": "187"}'::jsonb,
  '"A"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  151,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹326. It is sold at 15% discount. What is the selling price?',
  'mcq',
  '{"A": "277.1", "B": "293.4", "C": "260.8", "D": "311"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  152,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'What is the value of cos 0°?',
  'mcq',
  '{"A": "1", "B": "0.71", "C": "0.25", "D": "0.87"}'::jsonb,
  '"A"'::jsonb,
  'Uses standard trigonometric values.',
  153,
  true,
  '{"grade": 9, "dimension": "TR", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A circle has radius 13 cm. What is its circumference? (Use π = 3.14)',
  'mcq',
  '{"A": "78.5", "B": "87.92", "C": "81.64", "D": "530.66"}'::jsonb,
  '"C"'::jsonb,
  'Applies circumference formula of a circle.',
  154,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 78 students, 68 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "8.72", "B": "87.18", "C": "12.82", "D": "53.04"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  155,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 18 cm long, 15 cm wide, and 8 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "144", "B": "270", "C": "2160", "D": "120"}'::jsonb,
  '"C"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  156,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 6x² - 6x + 7 at x = 4.',
  'mcq',
  '{"A": "73", "B": "84", "C": "79", "D": "91"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  157,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 17, 14, 12, 8, 6. What is the median?',
  'mcq',
  '{"A": "11.4", "B": "14", "C": "8", "D": "12"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  158,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 16 cm long, 8 cm wide, and 3 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "128", "B": "384", "C": "48", "D": "24"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  159,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹1140. It is sold at 15% discount. What is the selling price?',
  'mcq',
  '{"A": "912", "B": "1125", "C": "1026", "D": "969"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  160,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 55, 5, 22, 31, 9. What is the median?',
  'mcq',
  '{"A": "9", "B": "22", "C": "24.4", "D": "31"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  161,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 109 students, 38 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "65.14", "B": "41.42", "C": "34.86", "D": "3.49"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  162,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 6x + 5 = 0 are:',
  'mcq',
  '{"A": "1 and -5", "B": "2 and 5", "C": "6 and 5", "D": "1 and 5"}'::jsonb,
  '"D"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  163,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 32, 46, 10, 46, 23. What is the median?',
  'mcq',
  '{"A": "23", "B": "32", "C": "46", "D": "31.4"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  164,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 17x + 70 = 0 are:',
  'mcq',
  '{"A": "7 and 10", "B": "8 and 10", "C": "17 and 70", "D": "7 and -10"}'::jsonb,
  '"A"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  165,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 8x + 23 = 175',
  'mcq',
  '{"A": "20", "B": "18", "C": "21", "D": "19"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  166,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 6x² - 7x + -5 at x = 1.',
  'mcq',
  '{"A": "-13", "B": "6", "C": "-1", "D": "-6"}'::jsonb,
  '"D"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  167,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-6,-11) and (-4,-3).',
  'mcq',
  '{"A": "0.25", "B": "3", "C": "4", "D": "5"}'::jsonb,
  '"C"'::jsonb,
  'Computes slope using coordinate geometry.',
  168,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 36, 7, 29, 9, 34. What is the median?',
  'mcq',
  '{"A": "23", "B": "34", "C": "29", "D": "9"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  169,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 55 students, 26 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "52.73", "B": "47.27", "C": "4.73", "D": "14.3"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  170,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 8x + 15 = 0 are:',
  'mcq',
  '{"A": "3 and 5", "B": "3 and -5", "C": "8 and 15", "D": "4 and 5"}'::jsonb,
  '"A"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  171,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹662. It is sold at 15% discount. What is the selling price?',
  'mcq',
  '{"A": "562.7", "B": "647", "C": "529.6", "D": "595.8"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  172,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 34° and 34°. What is the third angle?',
  'mcq',
  '{"A": "122", "B": "112", "C": "102", "D": "68"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  173,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (5^4) × (5^3) ÷ 5^4',
  'mcq',
  '{"A": "15", "B": "625", "C": "125", "D": "25"}'::jsonb,
  '"C"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  174,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 220 students, 200 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "13", "B": "440", "C": "9.09", "D": "90.91"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  175,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 5x + 16 = 286',
  'mcq',
  '{"A": "56", "B": "55", "C": "53", "D": "54"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  176,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 24, 29, 60, 10, 14. What is the median?',
  'mcq',
  '{"A": "29", "B": "27.4", "C": "24", "D": "14"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  177,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (5^3) × (5^2) ÷ 5^3',
  'mcq',
  '{"A": "25", "B": "5", "C": "10", "D": "125"}'::jsonb,
  '"A"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  178,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (6,4) and (15,11).',
  'mcq',
  '{"A": "-0.22", "B": "1.29", "C": "1.78", "D": "0.78"}'::jsonb,
  '"D"'::jsonb,
  'Computes slope using coordinate geometry.',
  179,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 20, 32, 28, 37, 20. What is the median?',
  'mcq',
  '{"A": "28", "B": "32", "C": "27.4", "D": "20"}'::jsonb,
  '"A"'::jsonb,
  'Finds median from an ordered data set.',
  180,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 202 students, 57 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "2.82", "B": "115.14", "C": "28.22", "D": "71.78"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  181,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-11,-4) and (-7,-1).',
  'mcq',
  '{"A": "0.75", "B": "-0.25", "C": "1.75", "D": "1.33"}'::jsonb,
  '"A"'::jsonb,
  'Computes slope using coordinate geometry.',
  182,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹617. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "524.45", "B": "493.6", "C": "462.75", "D": "597"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  183,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (5,-2) and (9,5).',
  'mcq',
  '{"A": "2.75", "B": "0.75", "C": "0.57", "D": "1.75"}'::jsonb,
  '"D"'::jsonb,
  'Computes slope using coordinate geometry.',
  184,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 7x + 5 = 418',
  'mcq',
  '{"A": "59", "B": "60", "C": "61", "D": "58"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  185,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 13x + 22 = 0 are:',
  'mcq',
  '{"A": "2 and 11", "B": "2 and -11", "C": "3 and 11", "D": "13 and 22"}'::jsonb,
  '"A"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  186,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 8x + 24 = 552',
  'mcq',
  '{"A": "66", "B": "65", "C": "67", "D": "68"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  187,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-8,12) and (-5,22).',
  'mcq',
  '{"A": "3.33", "B": "0.3", "C": "4.33", "D": "2.33"}'::jsonb,
  '"A"'::jsonb,
  'Computes slope using coordinate geometry.',
  188,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 178 students, 42 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "74.76", "B": "76.4", "C": "2.36", "D": "23.6"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  189,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (9,5) and (10,12).',
  'mcq',
  '{"A": "7", "B": "6", "C": "8", "D": "0.14"}'::jsonb,
  '"A"'::jsonb,
  'Computes slope using coordinate geometry.',
  190,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 4x² - 7x + 2 at x = 1.',
  'mcq',
  '{"A": "7", "B": "4", "C": "-8", "D": "-1"}'::jsonb,
  '"D"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  191,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 2x² - 9x + -1 at x = 3.',
  'mcq',
  '{"A": "-19", "B": "-10", "C": "-6", "D": "-5"}'::jsonb,
  '"B"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  192,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 13x + 42 = 0 are:',
  'mcq',
  '{"A": "6 and 7", "B": "7 and 7", "C": "6 and -7", "D": "13 and 42"}'::jsonb,
  '"A"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  193,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 153 students, 23 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "35.19", "B": "15.03", "C": "84.97", "D": "1.5"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  194,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 19x + 84 = 0 are:',
  'mcq',
  '{"A": "7 and -12", "B": "19 and 84", "C": "8 and 12", "D": "7 and 12"}'::jsonb,
  '"D"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  195,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 202 students, 143 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "7.08", "B": "288.86", "C": "29.21", "D": "70.79"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  196,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 117 students, 41 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "35.04", "B": "3.5", "C": "47.97", "D": "64.96"}'::jsonb,
  '"A"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  197,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (12,-5) and (15,-4).',
  'mcq',
  '{"A": "0.33", "B": "-0.67", "C": "1.33", "D": "3"}'::jsonb,
  '"A"'::jsonb,
  'Computes slope using coordinate geometry.',
  198,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 4x + 2 = 250',
  'mcq',
  '{"A": "64", "B": "63", "C": "62", "D": "61"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  199,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 77° and 29°. What is the third angle?',
  'mcq',
  '{"A": "84", "B": "106", "C": "64", "D": "74"}'::jsonb,
  '"D"'::jsonb,
  'Uses angle-sum property of triangles.',
  200,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 8, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 56, 40, 12, 58, 7. What is the median?',
  'mcq',
  '{"A": "40", "B": "56", "C": "12", "D": "34.6"}'::jsonb,
  '"A"'::jsonb,
  'Finds median from an ordered data set.',
  201,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 7x² - 6x + 2 at x = 7.',
  'mcq',
  '{"A": "303", "B": "297", "C": "308", "D": "317"}'::jsonb,
  '"A"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  202,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 11 cm long, 23 cm wide, and 14 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "253", "B": "3542", "C": "154", "D": "322"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  203,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (7^4) × (7^3) ÷ 7^4',
  'mcq',
  '{"A": "49", "B": "2401", "C": "21", "D": "343"}'::jsonb,
  '"D"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  204,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 38° and 63°. What is the third angle?',
  'mcq',
  '{"A": "79", "B": "101", "C": "69", "D": "89"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  205,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 6x + 16 = 436',
  'mcq',
  '{"A": "72", "B": "69", "C": "70", "D": "71"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  206,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 51° and 35°. What is the third angle?',
  'mcq',
  '{"A": "104", "B": "86", "C": "94", "D": "84"}'::jsonb,
  '"C"'::jsonb,
  'Uses angle-sum property of triangles.',
  207,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 16x + 60 = 0 are:',
  'mcq',
  '{"A": "7 and 10", "B": "6 and -10", "C": "6 and 10", "D": "16 and 60"}'::jsonb,
  '"C"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  208,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 89 students, 61 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "54.29", "B": "31.46", "C": "68.54", "D": "6.85"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  209,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 21x + 108 = 0 are:',
  'mcq',
  '{"A": "21 and 108", "B": "9 and 12", "C": "10 and 12", "D": "9 and -12"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  210,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-8,-13) and (2,-10).',
  'mcq',
  '{"A": "0.3", "B": "1.3", "C": "3.33", "D": "-0.7"}'::jsonb,
  '"A"'::jsonb,
  'Computes slope using coordinate geometry.',
  211,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 3x² - 7x + -2 at x = 4.',
  'mcq',
  '{"A": "23", "B": "11", "C": "18", "D": "24"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  212,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 6x + 9 = 309',
  'mcq',
  '{"A": "49", "B": "51", "C": "50", "D": "52"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  213,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 20x + 96 = 0 are:',
  'mcq',
  '{"A": "8 and 12", "B": "20 and 96", "C": "8 and -12", "D": "9 and 12"}'::jsonb,
  '"A"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  214,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A circle has radius 4 cm. What is its circumference? (Use π = 3.14)',
  'mcq',
  '{"A": "21.98", "B": "31.4", "C": "50.24", "D": "25.12"}'::jsonb,
  '"D"'::jsonb,
  'Applies circumference formula of a circle.',
  215,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 9x + 15 = 564',
  'mcq',
  '{"A": "61", "B": "60", "C": "63", "D": "62"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  216,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 105 students, 82 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "86.1", "B": "7.81", "C": "21.9", "D": "78.1"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  217,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 59, 44, 64, 19, 30. What is the median?',
  'mcq',
  '{"A": "30", "B": "43.2", "C": "59", "D": "44"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  218,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A circle has radius 14 cm. What is its circumference? (Use π = 3.14)',
  'mcq',
  '{"A": "94.2", "B": "615.44", "C": "87.92", "D": "84.78"}'::jsonb,
  '"C"'::jsonb,
  'Applies circumference formula of a circle.',
  219,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 66° and 62°. What is the third angle?',
  'mcq',
  '{"A": "62", "B": "52", "C": "42", "D": "128"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  220,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (2^2) × (2^1) ÷ 2^2',
  'mcq',
  '{"A": "1", "B": "90", "C": "2", "D": "4"}'::jsonb,
  '"C"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  221,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 27x + 182 = 0 are:',
  'mcq',
  '{"A": "13 and 14", "B": "27 and 182", "C": "13 and -14", "D": "14 and 14"}'::jsonb,
  '"A"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  222,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (3^4) × (3^3) ÷ 3^4',
  'mcq',
  '{"A": "27", "B": "177", "C": "9", "D": "81"}'::jsonb,
  '"A"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  223,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 45° and 73°. What is the third angle?',
  'mcq',
  '{"A": "118", "B": "52", "C": "62", "D": "72"}'::jsonb,
  '"C"'::jsonb,
  'Uses angle-sum property of triangles.',
  224,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 16 cm long, 25 cm wide, and 18 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "450", "B": "288", "C": "400", "D": "7200"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  225,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 9, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (2^8) × (2^7) ÷ 2^8',
  'mcq',
  '{"A": "64", "B": "128", "C": "256", "D": "14"}'::jsonb,
  '"B"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  226,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 170 students, 151 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "8.88", "B": "11.18", "C": "88.82", "D": "256.7"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  227,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 55 students, 11 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "80", "B": "6.05", "C": "2", "D": "20"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  228,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 61° and 38°. What is the third angle?',
  'mcq',
  '{"A": "81", "B": "91", "C": "71", "D": "99"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  229,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 79 students, 43 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "33.97", "B": "54.43", "C": "5.44", "D": "45.57"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  230,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 241 students, 113 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "272.33", "B": "4.69", "C": "53.11", "D": "46.89"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  231,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 5x + 4 = 0 are:',
  'mcq',
  '{"A": "2 and 4", "B": "1 and 4", "C": "1 and -4", "D": "5 and 4"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  232,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'What is the value of tan 45°?',
  'mcq',
  '{"A": "0.87", "B": "1", "C": "0.71", "D": "0.25"}'::jsonb,
  '"B"'::jsonb,
  'Uses standard trigonometric values.',
  233,
  true,
  '{"grade": 9, "dimension": "TR", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹695. It is sold at 30% discount. What is the selling price?',
  'mcq',
  '{"A": "486.5", "B": "665", "C": "521.25", "D": "451.75"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  234,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 1x² - 6x + 4 at x = -3.',
  'mcq',
  '{"A": "36", "B": "25", "C": "33", "D": "31"}'::jsonb,
  '"D"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  235,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹335. It is sold at 5% discount. What is the selling price?',
  'mcq',
  '{"A": "335", "B": "318.25", "C": "330", "D": "301.5"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  236,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (3^2) × (3^1) ÷ 3^2',
  'mcq',
  '{"A": "223", "B": "1", "C": "9", "D": "3"}'::jsonb,
  '"D"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  237,
  true,
  '{"grade": 9, "dimension": "NS", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 6 cm long, 5 cm wide, and 19 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "30", "B": "95", "C": "570", "D": "114"}'::jsonb,
  '"C"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  238,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (4,9) and (10,11).',
  'mcq',
  '{"A": "1.33", "B": "3", "C": "0.33", "D": "-0.67"}'::jsonb,
  '"C"'::jsonb,
  'Computes slope using coordinate geometry.',
  239,
  true,
  '{"grade": 9, "dimension": "CG", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 8 cm long, 22 cm wide, and 8 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "1408", "B": "3", "C": "64", "D": "176"}'::jsonb,
  '"A"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  240,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 27, 61, 13, 34, 57. What is the median?',
  'mcq',
  '{"A": "57", "B": "34", "C": "27", "D": "38.4"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  241,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹1196. It is sold at 10% discount. What is the selling price?',
  'mcq',
  '{"A": "1016.6", "B": "1076.4", "C": "1186", "D": "1136.2"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  242,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 55 students, 41 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "74.55", "B": "7.45", "C": "22.55", "D": "25.45"}'::jsonb,
  '"A"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  243,
  true,
  '{"grade": 9, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 34, 10, 22, 64, 57. What is the median?',
  'mcq',
  '{"A": "34", "B": "22", "C": "57", "D": "37.4"}'::jsonb,
  '"A"'::jsonb,
  'Finds median from an ordered data set.',
  244,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 28° and 47°. What is the third angle?',
  'mcq',
  '{"A": "75", "B": "115", "C": "95", "D": "105"}'::jsonb,
  '"D"'::jsonb,
  'Uses angle-sum property of triangles.',
  245,
  true,
  '{"grade": 9, "dimension": "GE", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 23 cm long, 28 cm wide, and 24 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "644", "B": "552", "C": "672", "D": "15456"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  246,
  true,
  '{"grade": 9, "dimension": "ME", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 8, 34, 69, 24, 70. What is the median?',
  'mcq',
  '{"A": "24", "B": "41", "C": "69", "D": "34"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  247,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 10x + 8 = 288',
  'mcq',
  '{"A": "30", "B": "27", "C": "28", "D": "29"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  248,
  true,
  '{"grade": 9, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 32, 46, 26, 70, 65. What is the median?',
  'mcq',
  '{"A": "47.8", "B": "32", "C": "46", "D": "65"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  249,
  true,
  '{"grade": 9, "dimension": "ST", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹764. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "649.4", "B": "573", "C": "611.2", "D": "744"}'::jsonb,
  '"C"'::jsonb,
  'Calculates selling price after discount.',
  250,
  true,
  '{"grade": 9, "dimension": "CM", "difficulty_rank": 10, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹927. It is sold at 15% discount. What is the selling price?',
  'mcq',
  '{"A": "912", "B": "741.6", "C": "834.3", "D": "787.95"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  251,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 147 students, 77 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "113.19", "B": "47.62", "C": "5.24", "D": "52.38"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  252,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 63 students, 28 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "4.44", "B": "55.56", "C": "44.44", "D": "17.64"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  253,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 5, 9, 22, 15, 14. What is the median?',
  'mcq',
  '{"A": "15", "B": "13", "C": "14", "D": "9"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  254,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 134 students, 124 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "92.54", "B": "7.46", "C": "9.25", "D": "166.16"}'::jsonb,
  '"A"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  255,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 12 cm long, 7 cm wide, and 8 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "96", "B": "56", "C": "84", "D": "672"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  256,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 73° and 67°. What is the third angle?',
  'mcq',
  '{"A": "40", "B": "30", "C": "50", "D": "140"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  257,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹922. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "691.5", "B": "737.6", "C": "783.7", "D": "902"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  258,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 10 cm long, 5 cm wide, and 10 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "100", "B": "50", "C": "500", "D": "17"}'::jsonb,
  '"C"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  259,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 40° and 36°. What is the third angle?',
  'mcq',
  '{"A": "114", "B": "76", "C": "104", "D": "94"}'::jsonb,
  '"C"'::jsonb,
  'Uses angle-sum property of triangles.',
  260,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 16, 22, 11, 9, 6. What is the median?',
  'mcq',
  '{"A": "12.8", "B": "11", "C": "16", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  261,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 19 = 82',
  'mcq',
  '{"A": "20", "B": "21", "C": "22", "D": "23"}'::jsonb,
  '"B"'::jsonb,
  'Solves a one-variable linear equation.',
  262,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹361. It is sold at 12% discount. What is the selling price?',
  'mcq',
  '{"A": "349", "B": "335.73", "C": "317.68", "D": "299.63"}'::jsonb,
  '"C"'::jsonb,
  'Calculates selling price after discount.',
  263,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹994. It is sold at 30% discount. What is the selling price?',
  'mcq',
  '{"A": "695.8", "B": "964", "C": "646.1", "D": "745.5"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  264,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 9 cm long, 7 cm wide, and 5 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "45", "B": "315", "C": "35", "D": "63"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  265,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 2x + 10 = 44',
  'mcq',
  '{"A": "18", "B": "19", "C": "17", "D": "16"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  266,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (7^2) × (7^1) ÷ 7^2',
  'mcq',
  '{"A": "7", "B": "53", "C": "1", "D": "49"}'::jsonb,
  '"A"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  267,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 94 students, 35 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "3.72", "B": "62.77", "C": "32.9", "D": "37.23"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  268,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 100 students, 52 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "52", "B": "5.2", "C": "34", "D": "48"}'::jsonb,
  '"A"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  269,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 1x² - 2x + -2 at x = -3.',
  'mcq',
  '{"A": "13", "B": "11", "C": "15", "D": "18"}'::jsonb,
  '"A"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  270,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 16, 17, 11, 14, 23. What is the median?',
  'mcq',
  '{"A": "16", "B": "17", "C": "16.2", "D": "14"}'::jsonb,
  '"A"'::jsonb,
  'Finds median from an ordered data set.',
  271,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 6 cm long, 9 cm wide, and 10 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "54", "B": "540", "C": "90", "D": "60"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  272,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹552. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "414", "B": "532", "C": "469.2", "D": "441.6"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  273,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 5x + 5 = 60',
  'mcq',
  '{"A": "13", "B": "12", "C": "10", "D": "11"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  274,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 77° and 64°. What is the third angle?',
  'mcq',
  '{"A": "141", "B": "49", "C": "39", "D": "29"}'::jsonb,
  '"C"'::jsonb,
  'Uses angle-sum property of triangles.',
  275,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 1, "time_target_sec": 70}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 25 = 82',
  'mcq',
  '{"A": "18", "B": "20", "C": "19", "D": "21"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  276,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 6x + 23 = 185',
  'mcq',
  '{"A": "26", "B": "28", "C": "29", "D": "27"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  277,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 6x + 2 = 92',
  'mcq',
  '{"A": "15", "B": "17", "C": "14", "D": "16"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  278,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 135 students, 55 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "74.25", "B": "40.74", "C": "59.26", "D": "4.07"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  279,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 12 cm long, 8 cm wide, and 5 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "40", "B": "96", "C": "60", "D": "480"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  280,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 12 = 99',
  'mcq',
  '{"A": "29", "B": "28", "C": "30", "D": "31"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  281,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 10 cm long, 12 cm wide, and 6 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "720", "B": "60", "C": "120", "D": "72"}'::jsonb,
  '"A"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  282,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 69° and 73°. What is the third angle?',
  'mcq',
  '{"A": "48", "B": "38", "C": "28", "D": "142"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  283,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (6^2) × (6^1) ÷ 6^2',
  'mcq',
  '{"A": "6", "B": "108", "C": "36", "D": "1"}'::jsonb,
  '"A"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  284,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 11x + 10 = 0 are:',
  'mcq',
  '{"A": "11 and 10", "B": "1 and 10", "C": "2 and 10", "D": "1 and -10"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  285,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 6 cm long, 6 cm wide, and 12 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "72", "B": "432", "C": "94", "D": "36"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  286,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 5x + 20 = 100',
  'mcq',
  '{"A": "17", "B": "15", "C": "16", "D": "18"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  287,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 4x² - 6x + 6 at x = 0.',
  'mcq',
  '{"A": "0", "B": "6", "C": "14", "D": "11"}'::jsonb,
  '"B"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  288,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 4x + 22 = 106',
  'mcq',
  '{"A": "20", "B": "22", "C": "21", "D": "23"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  289,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 109 students, 85 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "92.65", "B": "77.98", "C": "7.8", "D": "22.02"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  290,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 1x² - 5x + 0 at x = 6.',
  'mcq',
  '{"A": "8", "B": "11", "C": "1", "D": "6"}'::jsonb,
  '"D"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  291,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 83 students, 31 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "25.73", "B": "37.35", "C": "3.73", "D": "62.65"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  292,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 3x² - 7x + 1 at x = -2.',
  'mcq',
  '{"A": "20", "B": "32", "C": "33", "D": "27"}'::jsonb,
  '"D"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  293,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-3,4) and (1,8).',
  'mcq',
  '{"A": "2", "B": "0", "C": "56", "D": "1"}'::jsonb,
  '"D"'::jsonb,
  'Computes slope using coordinate geometry.',
  294,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹696. It is sold at 10% discount. What is the selling price?',
  'mcq',
  '{"A": "661.2", "B": "591.6", "C": "626.4", "D": "686"}'::jsonb,
  '"C"'::jsonb,
  'Calculates selling price after discount.',
  295,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 77 students, 11 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "1.43", "B": "85.71", "C": "14.29", "D": "8.47"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  296,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹226. It is sold at 30% discount. What is the selling price?',
  'mcq',
  '{"A": "196", "B": "169.5", "C": "158.2", "D": "146.9"}'::jsonb,
  '"C"'::jsonb,
  'Calculates selling price after discount.',
  297,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-4,-4) and (-3,3).',
  'mcq',
  '{"A": "8", "B": "0.14", "C": "6", "D": "7"}'::jsonb,
  '"D"'::jsonb,
  'Computes slope using coordinate geometry.',
  298,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 19, 24, 8, 25, 23. What is the median?',
  'mcq',
  '{"A": "19.8", "B": "19", "C": "24", "D": "23"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  299,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 142 students, 47 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "66.9", "B": "33.1", "C": "3.31", "D": "66.74"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  300,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 2x² - 6x + 6 at x = -2.',
  'mcq',
  '{"A": "26", "B": "30", "C": "31", "D": "20"}'::jsonb,
  '"A"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  301,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 40° and 66°. What is the third angle?',
  'mcq',
  '{"A": "74", "B": "64", "C": "84", "D": "106"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  302,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 47° and 74°. What is the third angle?',
  'mcq',
  '{"A": "49", "B": "121", "C": "69", "D": "59"}'::jsonb,
  '"D"'::jsonb,
  'Uses angle-sum property of triangles.',
  303,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 14 cm long, 9 cm wide, and 4 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "126", "B": "56", "C": "504", "D": "36"}'::jsonb,
  '"C"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  304,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 124 students, 34 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "2.74", "B": "27.42", "C": "72.58", "D": "42.16"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  305,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 100 students, 24 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "76", "B": "24", "C": "2.4", "D": "66"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  306,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 179 students, 23 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "41.17", "B": "87.15", "C": "1.28", "D": "12.85"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  307,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (6,7) and (11,10).',
  'mcq',
  '{"A": "1.6", "B": "0.6", "C": "-0.4", "D": "1.67"}'::jsonb,
  '"B"'::jsonb,
  'Computes slope using coordinate geometry.',
  308,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 12x + 32 = 0 are:',
  'mcq',
  '{"A": "5 and 8", "B": "4 and -8", "C": "12 and 32", "D": "4 and 8"}'::jsonb,
  '"D"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  309,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 30, 9, 28, 29, 18. What is the median?',
  'mcq',
  '{"A": "22.8", "B": "28", "C": "29", "D": "18"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  310,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 34, 9, 28, 12, 8. What is the median?',
  'mcq',
  '{"A": "28", "B": "18.2", "C": "9", "D": "12"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  311,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 35, 35, 29, 25, 11. What is the median?',
  'mcq',
  '{"A": "27", "B": "29", "C": "25", "D": "35"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  312,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 4x + 8 = 72',
  'mcq',
  '{"A": "17", "B": "18", "C": "16", "D": "15"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  313,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹883. It is sold at 12% discount. What is the selling price?',
  'mcq',
  '{"A": "821.19", "B": "732.89", "C": "871", "D": "777.04"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  314,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 2x + 15 = 63',
  'mcq',
  '{"A": "26", "B": "23", "C": "24", "D": "25"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  315,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 13 cm long, 10 cm wide, and 3 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "39", "B": "130", "C": "390", "D": "30"}'::jsonb,
  '"C"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  316,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 2x + 3 = 71',
  'mcq',
  '{"A": "36", "B": "35", "C": "34", "D": "33"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  317,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 15, 23, 8, 27, 35. What is the median?',
  'mcq',
  '{"A": "15", "B": "27", "C": "23", "D": "21.6"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  318,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 122 students, 102 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "16.39", "B": "8.36", "C": "124.44", "D": "83.61"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  319,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 8x + 12 = 0 are:',
  'mcq',
  '{"A": "2 and -6", "B": "2 and 6", "C": "8 and 12", "D": "3 and 6"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  320,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 2x² - 1x + 9 at x = 1.',
  'mcq',
  '{"A": "14", "B": "9", "C": "10", "D": "15"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  321,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹605. It is sold at 15% discount. What is the selling price?',
  'mcq',
  '{"A": "544.5", "B": "590", "C": "484", "D": "514.25"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  322,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 21 = 75',
  'mcq',
  '{"A": "17", "B": "20", "C": "19", "D": "18"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  323,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 43° and 73°. What is the third angle?',
  'mcq',
  '{"A": "54", "B": "64", "C": "116", "D": "74"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  324,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 16 cm long, 7 cm wide, and 3 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "112", "B": "21", "C": "48", "D": "336"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  325,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 3, "time_target_sec": 80}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 18 cm long, 11 cm wide, and 4 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "72", "B": "198", "C": "792", "D": "44"}'::jsonb,
  '"C"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  326,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 15, 14, 10, 8, 40. What is the median?',
  'mcq',
  '{"A": "14", "B": "10", "C": "15", "D": "17.4"}'::jsonb,
  '"A"'::jsonb,
  'Finds median from an ordered data set.',
  327,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 1x² - 5x + 5 at x = 0.',
  'mcq',
  '{"A": "10", "B": "5", "C": "7", "D": "0"}'::jsonb,
  '"B"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  328,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 33, 26, 22, 24, 23. What is the median?',
  'mcq',
  '{"A": "25.6", "B": "23", "C": "26", "D": "24"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  329,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹959. It is sold at 5% discount. What is the selling price?',
  'mcq',
  '{"A": "959", "B": "863.1", "C": "911.05", "D": "954"}'::jsonb,
  '"C"'::jsonb,
  'Calculates selling price after discount.',
  330,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 7, 37, 10, 22, 30. What is the median?',
  'mcq',
  '{"A": "21.2", "B": "30", "C": "10", "D": "22"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  331,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (1,2) and (4,5).',
  'mcq',
  '{"A": "2", "B": "0", "C": "110", "D": "1"}'::jsonb,
  '"D"'::jsonb,
  'Computes slope using coordinate geometry.',
  332,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 28, 32, 5, 30, 24. What is the median?',
  'mcq',
  '{"A": "23.8", "B": "30", "C": "24", "D": "28"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  333,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 6x + 12 = 48',
  'mcq',
  '{"A": "6", "B": "5", "C": "8", "D": "7"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  334,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 63 students, 43 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "27.09", "B": "6.83", "C": "68.25", "D": "31.75"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  335,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-4,2) and (-2,4).',
  'mcq',
  '{"A": "276", "B": "2", "C": "1", "D": "0"}'::jsonb,
  '"C"'::jsonb,
  'Computes slope using coordinate geometry.',
  336,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 1x² - 5x + 6 at x = -5.',
  'mcq',
  '{"A": "58", "B": "56", "C": "61", "D": "51"}'::jsonb,
  '"B"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  337,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 3x² - 2x + 8 at x = 7.',
  'mcq',
  '{"A": "146", "B": "147", "C": "141", "D": "139"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  338,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 9x + 8 = 0 are:',
  'mcq',
  '{"A": "1 and -8", "B": "1 and 8", "C": "2 and 8", "D": "9 and 8"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  339,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 1x² - 7x + 3 at x = -5.',
  'mcq',
  '{"A": "56", "B": "68", "C": "63", "D": "65"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  340,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 15x + 54 = 0 are:',
  'mcq',
  '{"A": "15 and 54", "B": "6 and 9", "C": "6 and -9", "D": "7 and 9"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  341,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 152 students, 93 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "61.18", "B": "6.12", "C": "141.36", "D": "38.82"}'::jsonb,
  '"A"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  342,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 107 students, 66 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "70.62", "B": "38.32", "C": "6.17", "D": "61.68"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  343,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 12, 33, 8, 37, 18. What is the median?',
  'mcq',
  '{"A": "33", "B": "12", "C": "18", "D": "21.6"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  344,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 16x + 55 = 0 are:',
  'mcq',
  '{"A": "16 and 55", "B": "6 and 11", "C": "5 and -11", "D": "5 and 11"}'::jsonb,
  '"D"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  345,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 5x + 16 = 86',
  'mcq',
  '{"A": "14", "B": "15", "C": "16", "D": "13"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  346,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹826. It is sold at 12% discount. What is the selling price?',
  'mcq',
  '{"A": "814", "B": "726.88", "C": "685.58", "D": "768.18"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  347,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹849. It is sold at 30% discount. What is the selling price?',
  'mcq',
  '{"A": "636.75", "B": "594.3", "C": "819", "D": "551.85"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  348,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 53 students, 39 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "20.67", "B": "26.42", "C": "7.36", "D": "73.58"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  349,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 6, 12, 38, 10, 20. What is the median?',
  'mcq',
  '{"A": "17.2", "B": "12", "C": "10", "D": "20"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  350,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 85}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 34° and 26°. What is the third angle?',
  'mcq',
  '{"A": "130", "B": "60", "C": "110", "D": "120"}'::jsonb,
  '"D"'::jsonb,
  'Uses angle-sum property of triangles.',
  351,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 18 cm long, 12 cm wide, and 4 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "216", "B": "48", "C": "72", "D": "864"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  352,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 7 cm long, 13 cm wide, and 17 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "91", "B": "221", "C": "1547", "D": "119"}'::jsonb,
  '"C"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  353,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (5^5) × (5^4) ÷ 5^5',
  'mcq',
  '{"A": "3125", "B": "20", "C": "625", "D": "125"}'::jsonb,
  '"C"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  354,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 4x + 15 = 83',
  'mcq',
  '{"A": "18", "B": "17", "C": "19", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Solves a one-variable linear equation.',
  355,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 5x + 14 = 154',
  'mcq',
  '{"A": "30", "B": "27", "C": "29", "D": "28"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  356,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 3x² - 2x + 7 at x = 1.',
  'mcq',
  '{"A": "6", "B": "8", "C": "14", "D": "13"}'::jsonb,
  '"B"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  357,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (9^5) × (9^4) ÷ 9^5',
  'mcq',
  '{"A": "6561", "B": "729", "C": "36", "D": "59049"}'::jsonb,
  '"A"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  358,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 62 students, 13 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "20.97", "B": "8.06", "C": "79.03", "D": "2.1"}'::jsonb,
  '"A"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  359,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹812. It is sold at 15% discount. What is the selling price?',
  'mcq',
  '{"A": "690.2", "B": "797", "C": "730.8", "D": "649.6"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  360,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 78° and 56°. What is the third angle?',
  'mcq',
  '{"A": "36", "B": "56", "C": "46", "D": "134"}'::jsonb,
  '"C"'::jsonb,
  'Uses angle-sum property of triangles.',
  361,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 2x + 18 = 72',
  'mcq',
  '{"A": "29", "B": "26", "C": "27", "D": "28"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  362,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 4x² - 1x + 8 at x = 4.',
  'mcq',
  '{"A": "73", "B": "76", "C": "68", "D": "67"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  363,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 125 students, 92 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "7.36", "B": "73.6", "C": "26.4", "D": "115"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  364,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (4,-8) and (5,-5).',
  'mcq',
  '{"A": "2", "B": "3", "C": "4", "D": "0.33"}'::jsonb,
  '"B"'::jsonb,
  'Computes slope using coordinate geometry.',
  365,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 6x + 18 = 72',
  'mcq',
  '{"A": "10", "B": "8", "C": "9", "D": "11"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  366,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 4x + 23 = 59',
  'mcq',
  '{"A": "11", "B": "9", "C": "8", "D": "10"}'::jsonb,
  '"B"'::jsonb,
  'Solves a one-variable linear equation.',
  367,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 4x² - 5x + 1 at x = -1.',
  'mcq',
  '{"A": "18", "B": "10", "C": "15", "D": "5"}'::jsonb,
  '"B"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  368,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 40° and 75°. What is the third angle?',
  'mcq',
  '{"A": "55", "B": "75", "C": "65", "D": "115"}'::jsonb,
  '"C"'::jsonb,
  'Uses angle-sum property of triangles.',
  369,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹493. It is sold at 12% discount. What is the selling price?',
  'mcq',
  '{"A": "433.84", "B": "458.49", "C": "409.19", "D": "481"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  370,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 34° and 45°. What is the third angle?',
  'mcq',
  '{"A": "79", "B": "101", "C": "91", "D": "111"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  371,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹276. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "234.6", "B": "207", "C": "220.8", "D": "256"}'::jsonb,
  '"C"'::jsonb,
  'Calculates selling price after discount.',
  372,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 10x + 9 = 0 are:',
  'mcq',
  '{"A": "2 and 9", "B": "10 and 9", "C": "1 and 9", "D": "1 and -9"}'::jsonb,
  '"C"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  373,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 8, 33, 40, 39, 6. What is the median?',
  'mcq',
  '{"A": "39", "B": "25.2", "C": "8", "D": "33"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  374,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 75° and 54°. What is the third angle?',
  'mcq',
  '{"A": "129", "B": "51", "C": "61", "D": "41"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  375,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 20 cm long, 6 cm wide, and 9 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "180", "B": "120", "C": "54", "D": "1080"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  376,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 8 cm long, 16 cm wide, and 3 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "24", "B": "384", "C": "48", "D": "128"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  377,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 5x + 2 = 252',
  'mcq',
  '{"A": "49", "B": "51", "C": "50", "D": "52"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  378,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹919. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "735.2", "B": "899", "C": "689.25", "D": "781.15"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  379,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 44° and 44°. What is the third angle?',
  'mcq',
  '{"A": "92", "B": "102", "C": "88", "D": "82"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  380,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 109 students, 23 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "2.11", "B": "78.9", "C": "25.07", "D": "21.1"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  381,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 154 students, 84 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "5.45", "B": "54.55", "C": "45.45", "D": "129.36"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  382,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 3 = 75',
  'mcq',
  '{"A": "24", "B": "23", "C": "26", "D": "25"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  383,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (10,10) and (18,19).',
  'mcq',
  '{"A": "0.12", "B": "1.12", "C": "2.12", "D": "0.89"}'::jsonb,
  '"B"'::jsonb,
  'Computes slope using coordinate geometry.',
  384,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 13 cm long, 4 cm wide, and 18 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "72", "B": "936", "C": "234", "D": "52"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  385,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 10 = 67',
  'mcq',
  '{"A": "21", "B": "19", "C": "20", "D": "18"}'::jsonb,
  '"B"'::jsonb,
  'Solves a one-variable linear equation.',
  386,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 57° and 30°. What is the third angle?',
  'mcq',
  '{"A": "93", "B": "87", "C": "83", "D": "103"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  387,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 108 students, 38 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "35.19", "B": "3.52", "C": "64.81", "D": "41.04"}'::jsonb,
  '"A"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  388,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 6x + 2 = 38',
  'mcq',
  '{"A": "5", "B": "8", "C": "7", "D": "6"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  389,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 8, 20, 44, 26, 43. What is the median?',
  'mcq',
  '{"A": "20", "B": "26", "C": "43", "D": "28.2"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  390,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (8^6) × (8^5) ÷ 8^6',
  'mcq',
  '{"A": "262144", "B": "40", "C": "4096", "D": "32768"}'::jsonb,
  '"D"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  391,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 44° and 26°. What is the third angle?',
  'mcq',
  '{"A": "120", "B": "70", "C": "110", "D": "100"}'::jsonb,
  '"C"'::jsonb,
  'Uses angle-sum property of triangles.',
  392,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹297. It is sold at 25% discount. What is the selling price?',
  'mcq',
  '{"A": "272", "B": "237.6", "C": "207.9", "D": "222.75"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  393,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 204 students, 169 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "344.76", "B": "17.16", "C": "82.84", "D": "8.28"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  394,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (3,9) and (5,15).',
  'mcq',
  '{"A": "2", "B": "3", "C": "0.33", "D": "4"}'::jsonb,
  '"B"'::jsonb,
  'Computes slope using coordinate geometry.',
  395,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 29, 35, 29, 20, 8. What is the median?',
  'mcq',
  '{"A": "20", "B": "29", "C": "24.2", "D": "11"}'::jsonb,
  '"B"'::jsonb,
  'Finds median from an ordered data set.',
  396,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹853. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "725.05", "B": "639.75", "C": "833", "D": "682.4"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  397,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 21, 33, 42, 10, 50. What is the median?',
  'mcq',
  '{"A": "31.2", "B": "42", "C": "21", "D": "33"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  398,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 4x² - 6x + 3 at x = -4.',
  'mcq',
  '{"A": "99", "B": "96", "C": "91", "D": "85"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  399,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (8,8) and (14,15).',
  'mcq',
  '{"A": "0.17", "B": "1.17", "C": "2.17", "D": "0.86"}'::jsonb,
  '"B"'::jsonb,
  'Computes slope using coordinate geometry.',
  400,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 6, "time_target_sec": 95}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (4^5) × (4^4) ÷ 4^5',
  'mcq',
  '{"A": "16", "B": "1024", "C": "256", "D": "64"}'::jsonb,
  '"C"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  401,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 30° and 66°. What is the third angle?',
  'mcq',
  '{"A": "74", "B": "84", "C": "96", "D": "94"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  402,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 6x² - 7x + 8 at x = 4.',
  'mcq',
  '{"A": "69", "B": "81", "C": "76", "D": "88"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  403,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 8x + 22 = 286',
  'mcq',
  '{"A": "34", "B": "33", "C": "32", "D": "35"}'::jsonb,
  '"B"'::jsonb,
  'Solves a one-variable linear equation.',
  404,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 58° and 42°. What is the third angle?',
  'mcq',
  '{"A": "80", "B": "90", "C": "70", "D": "100"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  405,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 8x + 2 = 218',
  'mcq',
  '{"A": "26", "B": "29", "C": "28", "D": "27"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  406,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 176 students, 138 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "7.84", "B": "242.88", "C": "21.59", "D": "78.41"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  407,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (5^2) × (5^1) ÷ 5^2',
  'mcq',
  '{"A": "170", "B": "5", "C": "1", "D": "25"}'::jsonb,
  '"B"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  408,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 3x² - 3x + -4 at x = -4.',
  'mcq',
  '{"A": "53", "B": "61", "C": "62", "D": "56"}'::jsonb,
  '"D"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  409,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 43, 10, 29, 42, 32. What is the median?',
  'mcq',
  '{"A": "31.2", "B": "29", "C": "42", "D": "32"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  410,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 66° and 45°. What is the third angle?',
  'mcq',
  '{"A": "59", "B": "69", "C": "79", "D": "111"}'::jsonb,
  '"B"'::jsonb,
  'Uses angle-sum property of triangles.',
  411,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 17x + 60 = 0 are:',
  'mcq',
  '{"A": "6 and 12", "B": "5 and 12", "C": "17 and 60", "D": "5 and -12"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  412,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-8,0) and (1,2).',
  'mcq',
  '{"A": "4.5", "B": "1.22", "C": "0.22", "D": "-0.78"}'::jsonb,
  '"C"'::jsonb,
  'Computes slope using coordinate geometry.',
  413,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 7x + 3 = 178',
  'mcq',
  '{"A": "26", "B": "24", "C": "25", "D": "27"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  414,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 94 students, 58 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "61.7", "B": "54.52", "C": "6.17", "D": "38.3"}'::jsonb,
  '"A"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  415,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 7 cm long, 17 cm wide, and 13 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "221", "B": "1547", "C": "91", "D": "119"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  416,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 21x + 110 = 0 are:',
  'mcq',
  '{"A": "10 and 11", "B": "10 and -11", "C": "11 and 11", "D": "21 and 110"}'::jsonb,
  '"A"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  417,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 6, 10, 17, 50, 33. What is the median?',
  'mcq',
  '{"A": "23.2", "B": "33", "C": "10", "D": "17"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  418,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-12,10) and (-8,15).',
  'mcq',
  '{"A": "2.25", "B": "0.25", "C": "1.25", "D": "0.8"}'::jsonb,
  '"C"'::jsonb,
  'Computes slope using coordinate geometry.',
  419,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹406. It is sold at 25% discount. What is the selling price?',
  'mcq',
  '{"A": "324.8", "B": "304.5", "C": "284.2", "D": "381"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  420,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 24 cm long, 8 cm wide, and 21 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "168", "B": "4032", "C": "192", "D": "504"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  421,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 7 = 25',
  'mcq',
  '{"A": "5", "B": "7", "C": "8", "D": "6"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  422,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 10x + 24 = 0 are:',
  'mcq',
  '{"A": "10 and 24", "B": "4 and -6", "C": "5 and 6", "D": "4 and 6"}'::jsonb,
  '"D"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  423,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 51° and 53°. What is the third angle?',
  'mcq',
  '{"A": "104", "B": "86", "C": "76", "D": "66"}'::jsonb,
  '"C"'::jsonb,
  'Uses angle-sum property of triangles.',
  424,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 19 = 37',
  'mcq',
  '{"A": "5", "B": "7", "C": "6", "D": "8"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  425,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 7, "time_target_sec": 100}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (5^7) × (5^6) ÷ 5^7',
  'mcq',
  '{"A": "30", "B": "15625", "C": "78125", "D": "3125"}'::jsonb,
  '"B"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  426,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 24, 35, 11, 31, 10. What is the median?',
  'mcq',
  '{"A": "31", "B": "11", "C": "24", "D": "22.2"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  427,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (8,-2) and (16,0).',
  'mcq',
  '{"A": "0.25", "B": "4", "C": "-0.75", "D": "1.25"}'::jsonb,
  '"A"'::jsonb,
  'Computes slope using coordinate geometry.',
  428,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 70° and 54°. What is the third angle?',
  'mcq',
  '{"A": "56", "B": "66", "C": "124", "D": "46"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  429,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 3x + 24 = 66',
  'mcq',
  '{"A": "14", "B": "13", "C": "15", "D": "16"}'::jsonb,
  '"A"'::jsonb,
  'Solves a one-variable linear equation.',
  430,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹900. It is sold at 5% discount. What is the selling price?',
  'mcq',
  '{"A": "895", "B": "855", "C": "810", "D": "900"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  431,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹395. It is sold at 30% discount. What is the selling price?',
  'mcq',
  '{"A": "296.25", "B": "276.5", "C": "256.75", "D": "365"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  432,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 54 students, 36 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "6.67", "B": "66.67", "C": "19.44", "D": "33.33"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  433,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 2x² - 3x + 4 at x = -1.',
  'mcq',
  '{"A": "9", "B": "14", "C": "13", "D": "6"}'::jsonb,
  '"A"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  434,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 45° and 40°. What is the third angle?',
  'mcq',
  '{"A": "85", "B": "105", "C": "95", "D": "83"}'::jsonb,
  '"C"'::jsonb,
  'Uses angle-sum property of triangles.',
  435,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 5x² - 9x + 5 at x = -3.',
  'mcq',
  '{"A": "77", "B": "82", "C": "68", "D": "87"}'::jsonb,
  '"A"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  436,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (2^6) × (2^5) ÷ 2^6',
  'mcq',
  '{"A": "10", "B": "32", "C": "16", "D": "64"}'::jsonb,
  '"B"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  437,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹330. It is sold at 25% discount. What is the selling price?',
  'mcq',
  '{"A": "247.5", "B": "231", "C": "264", "D": "305"}'::jsonb,
  '"A"'::jsonb,
  'Calculates selling price after discount.',
  438,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 19 cm long, 7 cm wide, and 17 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "119", "B": "2261", "C": "133", "D": "323"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  439,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹565. It is sold at 10% discount. What is the selling price?',
  'mcq',
  '{"A": "555", "B": "508.5", "C": "536.75", "D": "480.25"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  440,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (9^7) × (9^6) ÷ 9^7',
  'mcq',
  '{"A": "59049", "B": "54", "C": "4782969", "D": "531441"}'::jsonb,
  '"D"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  441,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 46, 24, 50, 28, 12. What is the median?',
  'mcq',
  '{"A": "46", "B": "24", "C": "32", "D": "28"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  442,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 2x + 24 = 30',
  'mcq',
  '{"A": "2", "B": "5", "C": "4", "D": "3"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  443,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹703. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "597.55", "B": "683", "C": "527.25", "D": "562.4"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  444,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 46, 38, 58, 8, 18. What is the median?',
  'mcq',
  '{"A": "46", "B": "33.6", "C": "38", "D": "18"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  445,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹753. It is sold at 12% discount. What is the selling price?',
  'mcq',
  '{"A": "624.99", "B": "662.64", "C": "741", "D": "700.29"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  446,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (3^6) × (3^5) ÷ 3^6',
  'mcq',
  '{"A": "81", "B": "243", "C": "729", "D": "15"}'::jsonb,
  '"B"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  447,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 4x + 24 = 72',
  'mcq',
  '{"A": "11", "B": "12", "C": "14", "D": "13"}'::jsonb,
  '"B"'::jsonb,
  'Solves a one-variable linear equation.',
  448,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 19 cm long, 24 cm wide, and 24 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "30", "B": "456", "C": "10944", "D": "576"}'::jsonb,
  '"C"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  449,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 28° and 55°. What is the third angle?',
  'mcq',
  '{"A": "97", "B": "87", "C": "83", "D": "107"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  450,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 8, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 53, 56, 53, 38, 57. What is the median?',
  'mcq',
  '{"A": "56", "B": "51.4", "C": "53", "D": "198"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  451,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 17x + 66 = 0 are:',
  'mcq',
  '{"A": "6 and -11", "B": "7 and 11", "C": "17 and 66", "D": "6 and 11"}'::jsonb,
  '"D"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  452,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 21x + 104 = 0 are:',
  'mcq',
  '{"A": "8 and -13", "B": "21 and 104", "C": "8 and 13", "D": "9 and 13"}'::jsonb,
  '"C"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  453,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 27 cm long, 27 cm wide, and 11 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "729", "B": "13", "C": "297", "D": "8019"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  454,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 22 cm long, 14 cm wide, and 23 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "308", "B": "506", "C": "322", "D": "7084"}'::jsonb,
  '"D"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  455,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A circle has radius 12 cm. What is its circumference? (Use π = 3.14)',
  'mcq',
  '{"A": "72.22", "B": "75.36", "C": "81.64", "D": "452.16"}'::jsonb,
  '"B"'::jsonb,
  'Applies circumference formula of a circle.',
  456,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 64, 15, 38, 41, 58. What is the median?',
  'mcq',
  '{"A": "43.2", "B": "38", "C": "58", "D": "41"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  457,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 1x² - 9x + -4 at x = 1.',
  'mcq',
  '{"A": "-21", "B": "-10", "C": "-7", "D": "-12"}'::jsonb,
  '"D"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  458,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (5^6) × (5^5) ÷ 5^6',
  'mcq',
  '{"A": "15625", "B": "3125", "C": "625", "D": "25"}'::jsonb,
  '"B"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  459,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹1040. It is sold at 20% discount. What is the selling price?',
  'mcq',
  '{"A": "1020", "B": "832", "C": "884", "D": "780"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  460,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 2x² - 1x + -3 at x = 2.',
  'mcq',
  '{"A": "3", "B": "8", "C": "2", "D": "7"}'::jsonb,
  '"A"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  461,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 18x + 72 = 0 are:',
  'mcq',
  '{"A": "7 and 12", "B": "18 and 72", "C": "6 and -12", "D": "6 and 12"}'::jsonb,
  '"D"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  462,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 224 students, 101 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "54.91", "B": "4.51", "C": "45.09", "D": "226.24"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  463,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 6x + 20 = 206',
  'mcq',
  '{"A": "30", "B": "31", "C": "33", "D": "32"}'::jsonb,
  '"B"'::jsonb,
  'Solves a one-variable linear equation.',
  464,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (9,0) and (16,2).',
  'mcq',
  '{"A": "-0.71", "B": "3.5", "C": "1.29", "D": "0.29"}'::jsonb,
  '"D"'::jsonb,
  'Computes slope using coordinate geometry.',
  465,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 69° and 62°. What is the third angle?',
  'mcq',
  '{"A": "49", "B": "131", "C": "59", "D": "39"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  466,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 36° and 42°. What is the third angle?',
  'mcq',
  '{"A": "102", "B": "78", "C": "92", "D": "112"}'::jsonb,
  '"A"'::jsonb,
  'Uses angle-sum property of triangles.',
  467,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 43, 39, 26, 62, 14. What is the median?',
  'mcq',
  '{"A": "36.8", "B": "26", "C": "43", "D": "39"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  468,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 9 cm long, 19 cm wide, and 18 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "162", "B": "171", "C": "3078", "D": "342"}'::jsonb,
  '"C"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  469,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 52° and 42°. What is the third angle?',
  'mcq',
  '{"A": "76", "B": "96", "C": "94", "D": "86"}'::jsonb,
  '"D"'::jsonb,
  'Uses angle-sum property of triangles.',
  470,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 5 cm long, 11 cm wide, and 15 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "825", "B": "165", "C": "75", "D": "55"}'::jsonb,
  '"A"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  471,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 66 students, 46 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "30.36", "B": "6.97", "C": "69.7", "D": "30.3"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  472,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 39, 18, 56, 50, 47. What is the median?',
  'mcq',
  '{"A": "42", "B": "39", "C": "50", "D": "47"}'::jsonb,
  '"D"'::jsonb,
  'Finds median from an ordered data set.',
  473,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 234 students, 144 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "38.46", "B": "336.96", "C": "6.15", "D": "61.54"}'::jsonb,
  '"D"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  474,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 15x + 50 = 0 are:',
  'mcq',
  '{"A": "6 and 10", "B": "5 and -10", "C": "5 and 10", "D": "15 and 50"}'::jsonb,
  '"C"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  475,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 9, "time_target_sec": 110}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (15,-4) and (25,-3).',
  'mcq',
  '{"A": "10", "B": "1.1", "C": "-0.9", "D": "0.1"}'::jsonb,
  '"D"'::jsonb,
  'Computes slope using coordinate geometry.',
  476,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a triangle, two angles are 54° and 78°. What is the third angle?',
  'mcq',
  '{"A": "58", "B": "38", "C": "132", "D": "48"}'::jsonb,
  '"D"'::jsonb,
  'Uses angle-sum property of triangles.',
  477,
  true,
  '{"grade": 10, "dimension": "GE", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 9x + 20 = 0 are:',
  'mcq',
  '{"A": "9 and 20", "B": "5 and 5", "C": "4 and 5", "D": "4 and -5"}'::jsonb,
  '"C"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  478,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (14,-7) and (17,-1).',
  'mcq',
  '{"A": "2", "B": "0.5", "C": "1", "D": "3"}'::jsonb,
  '"A"'::jsonb,
  'Computes slope using coordinate geometry.',
  479,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹283. It is sold at 12% discount. What is the selling price?',
  'mcq',
  '{"A": "234.89", "B": "263.19", "C": "271", "D": "249.04"}'::jsonb,
  '"D"'::jsonb,
  'Calculates selling price after discount.',
  480,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 42, 64, 33, 5, 12. What is the median?',
  'mcq',
  '{"A": "42", "B": "12", "C": "33", "D": "31.2"}'::jsonb,
  '"C"'::jsonb,
  'Finds median from an ordered data set.',
  481,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Evaluate P(x) = 1x² - 8x + -5 at x = -2.',
  'mcq',
  '{"A": "17", "B": "7", "C": "15", "D": "20"}'::jsonb,
  '"C"'::jsonb,
  'Evaluates a polynomial for a given value of x.',
  482,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹924. It is sold at 30% discount. What is the selling price?',
  'mcq',
  '{"A": "600.6", "B": "646.8", "C": "693", "D": "894"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  483,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 17x + 52 = 0 are:',
  'mcq',
  '{"A": "4 and 13", "B": "4 and -13", "C": "17 and 52", "D": "5 and 13"}'::jsonb,
  '"A"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  484,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 5x + 8 = 308',
  'mcq',
  '{"A": "62", "B": "60", "C": "61", "D": "59"}'::jsonb,
  '"B"'::jsonb,
  'Solves a one-variable linear equation.',
  485,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 16x + 48 = 0 are:',
  'mcq',
  '{"A": "4 and -12", "B": "4 and 12", "C": "5 and 12", "D": "16 and 48"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  486,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (3^7) × (3^6) ÷ 3^7',
  'mcq',
  '{"A": "243", "B": "729", "C": "2187", "D": "18"}'::jsonb,
  '"B"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  487,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹1021. It is sold at 12% discount. What is the selling price?',
  'mcq',
  '{"A": "847.43", "B": "949.53", "C": "898.48", "D": "1009"}'::jsonb,
  '"C"'::jsonb,
  'Calculates selling price after discount.',
  488,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (6^8) × (6^7) ÷ 6^8',
  'mcq',
  '{"A": "42", "B": "46656", "C": "279936", "D": "1679616"}'::jsonb,
  '"C"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  489,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Find the slope of the line joining (-2,-4) and (-1,-1).',
  'mcq',
  '{"A": "4", "B": "0.33", "C": "2", "D": "3"}'::jsonb,
  '"D"'::jsonb,
  'Computes slope using coordinate geometry.',
  490,
  true,
  '{"grade": 10, "dimension": "CG", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 4x + 3 = 0 are:',
  'mcq',
  '{"A": "1 and -3", "B": "4 and 3", "C": "2 and 3", "D": "1 and 3"}'::jsonb,
  '"D"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  491,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 129 students, 40 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "3.1", "B": "68.99", "C": "31.01", "D": "51.6"}'::jsonb,
  '"C"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  492,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A box is 15 cm long, 18 cm wide, and 12 cm high. What is its volume in cm³?',
  'mcq',
  '{"A": "270", "B": "3240", "C": "216", "D": "180"}'::jsonb,
  '"B"'::jsonb,
  'Finds volume of a cuboid from dimensions.',
  493,
  true,
  '{"grade": 10, "dimension": "ME", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 8x + 8 = 72',
  'mcq',
  '{"A": "7", "B": "10", "C": "9", "D": "8"}'::jsonb,
  '"D"'::jsonb,
  'Solves a one-variable linear equation.',
  494,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The marks are 61, 40, 45, 40, 8. What is the median?',
  'mcq',
  '{"A": "40", "B": "38.8", "C": "45", "D": "44"}'::jsonb,
  '"A"'::jsonb,
  'Finds median from an ordered data set.',
  495,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Solve for x: 7x + 5 = 530',
  'mcq',
  '{"A": "74", "B": "76", "C": "75", "D": "77"}'::jsonb,
  '"C"'::jsonb,
  'Solves a one-variable linear equation.',
  496,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'The roots of x² - 10x + 16 = 0 are:',
  'mcq',
  '{"A": "10 and 16", "B": "2 and 8", "C": "2 and -8", "D": "3 and 8"}'::jsonb,
  '"B"'::jsonb,
  'Identifies roots from a factorable quadratic equation.',
  497,
  true,
  '{"grade": 10, "dimension": "AL", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'In a survey of 215 students, 21 prefer online learning. What percentage is that?',
  'mcq',
  '{"A": "0.98", "B": "9.77", "C": "90.23", "D": "45.15"}'::jsonb,
  '"B"'::jsonb,
  'Converts part-to-whole information into a percentage.',
  498,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'A bag has marked price ₹782. It is sold at 15% discount. What is the selling price?',
  'mcq',
  '{"A": "625.6", "B": "664.7", "C": "767", "D": "703.8"}'::jsonb,
  '"B"'::jsonb,
  'Calculates selling price after discount.',
  499,
  true,
  '{"grade": 10, "dimension": "CM", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b7d9c8e1-f2a3-4b5c-8d9e-1f2a3b4c5d6e',
  'Simplify: (8^7) × (8^6) ÷ 8^7',
  'mcq',
  '{"A": "48", "B": "32768", "C": "2097152", "D": "262144"}'::jsonb,
  '"D"'::jsonb,
  'Uses laws of exponents to simplify expressions.',
  500,
  true,
  '{"grade": 10, "dimension": "NS", "difficulty_rank": 10, "time_target_sec": 115}'::jsonb
);
