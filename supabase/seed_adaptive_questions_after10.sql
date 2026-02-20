-- Seed adaptive aptitude questions for Post-10 (After Grade 10)
-- Generated from Post10_Adaptive_Aptitude_750_VISIBLE_QUOTES.csv

-- Insert adaptive aptitude section for Post-10
INSERT INTO personal_assessment_sections (
  id, name, title, description, order_number, is_timed,
  time_limit_seconds, is_active, grade_level, created_at, updated_at
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'adaptive_aptitude_after10',
  'Adaptive Aptitude - Post Grade 10',
  'Adaptive aptitude assessment for students after grade 10',
  10,
  true,
  2250,
  true,
  'after10',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;


-- Insert questions

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '780 tasks are shared equally among 12 students in a online classes club. How many tasks per student?',
  'mcq',
  '{"A": "65", "B": "67", "C": "12", "D": "63"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  1,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 47 and 17 minutes with 12 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "52", "B": "64", "C": "30", "D": "76"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  2,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media platform reports that 25% of 250 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "25", "B": "37", "C": "87", "D": "62"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  3,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 26, 31, 24, 29, 22, ?',
  'mcq',
  '{"A": "27", "B": "31", "C": "28", "D": "25"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  4,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a sports analytics survey of 881 teens, 35 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "846", "B": "35", "C": "866", "D": "916"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  5,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 99 is divided by 3, what is the remainder?',
  'mcq',
  '{"A": "0", "B": "716", "C": "1", "D": "2"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  6,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'If ▲ means +2 and ■ means ×3, what is ■(▲(6))?',
  'mcq',
  '{"A": "24", "B": "11", "C": "20", "D": "18"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  7,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A robotics club run is 17 km long. How many meters is that?',
  'mcq',
  '{"A": "18700", "B": "17000", "C": "170000", "D": "1700"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  8,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A smartwatch store had 66 orders in Week 1 and 80 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "14", "B": "24", "C": "80", "D": "146"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  9,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a EV survey of 796 teens, 60 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "856", "B": "736", "C": "756", "D": "60"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  10,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A online classes store had 128 orders in Week 1 and 140 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "22", "B": "140", "C": "268", "D": "12"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  11,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=74, B=105, C=91. What is the total number of votes?',
  'mcq',
  '{"A": "260", "B": "280", "C": "270", "D": "105"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  12,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Choose the odd one out: Hexagon, Pentagon, Octagon, Triangle',
  'mcq',
  '{"A": "Triangle", "B": "Pentagon", "C": "Hexagon", "D": "Octagon"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  13,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 52 minutes in traffic and 51 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "1", "B": "6", "C": "103", "D": "-1"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  14,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=75, B=69, C=106. What is the total number of votes?',
  'mcq',
  '{"A": "240", "B": "250", "C": "260", "D": "106"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  15,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A recycling platform reports that 20% of 800 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "80", "B": "160", "C": "20", "D": "240"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  16,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '588 tasks are shared equally among 12 students in a sports analytics club. How many tasks per student?',
  'mcq',
  '{"A": "49", "B": "12", "C": "47", "D": "51"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  17,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=68, B=53, C=104. What is the total number of votes?',
  'mcq',
  '{"A": "104", "B": "215", "C": "235", "D": "225"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  18,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 44, 24, 71, 69. What is the mean?',
  'mcq',
  '{"A": "54", "B": "52", "C": "208", "D": "50"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  19,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 33, 38, 31, 36, 29, ?',
  'mcq',
  '{"A": "34", "B": "38", "C": "32", "D": "35"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  20,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '565 tasks are shared equally among 5 students in a creator economy club. How many tasks per student?',
  'mcq',
  '{"A": "5", "B": "111", "C": "115", "D": "113"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  21,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 6 snack packs at ₹76 each. What is the total cost?',
  'mcq',
  '{"A": "380", "B": "532", "C": "82", "D": "456"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  22,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 250 packets and lost 15%. How many packets were received?',
  'mcq',
  '{"A": "37", "B": "213", "C": "235", "D": "287"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  23,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A gaming run is 11 km long. How many meters is that?',
  'mcq',
  '{"A": "11000", "B": "110000", "C": "1100", "D": "12100"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  24,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 295% at start and drops by 252 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "43", "B": "252", "C": "53", "D": "547"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  25,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 7, 12, 17, 22, ?',
  'mcq',
  '{"A": "22", "B": "27", "C": "1033", "D": "32"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  26,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 50, 20, 30, 28. What is the average?',
  'mcq',
  '{"A": "37", "B": "32", "C": "27", "D": "128"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  27,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 9 snack packs at ₹33 each. What is the total cost?',
  'mcq',
  '{"A": "297", "B": "264", "C": "42", "D": "330"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  28,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'If P → Q and Q → R, which must be true?',
  'mcq',
  '{"A": "Q \u2192 P", "B": "R \u2192 P", "C": "P \u2192 R", "D": "P \u2192 Q only"}'::jsonb,
  '"C"'::jsonb,
  'Deduction, implication, and constraint logic.',
  29,
  true,
  '{"grade": 10, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power run is 15 km long. How many meters is that?',
  'mcq',
  '{"A": "150000", "B": "16500", "C": "1500", "D": "15000"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  30,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A online classes store sold 684 items on Monday and 228 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "962", "B": "862", "C": "912", "D": "456"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  31,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 12 after multiplying by 3. The result is 30. What was the original number?',
  'mcq',
  '{"A": "7", "B": "5", "C": "6", "D": "18"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  32,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 20, 25, 18, 23, 16, ?',
  'mcq',
  '{"A": "22", "B": "19", "C": "21", "D": "25"}'::jsonb,
  '"C"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  33,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media store sold 151 items on Monday and 355 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "456", "B": "556", "C": "-204", "D": "506"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  34,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 89 is divided by 9, what is the remainder?',
  'mcq',
  '{"A": "1158", "B": "8", "C": "10", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  35,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Which completes the pair: Hand : Glove :: Foot : ?',
  'mcq',
  '{"A": "Shoe", "B": "Sock", "C": "Belt", "D": "Hat"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  36,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A recycling event needs 6 badges per team. If there are 9 teams, how many badges are needed?',
  'mcq',
  '{"A": "48", "B": "60", "C": "54", "D": "15"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  37,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'If exactly one of the statements is true: (1) The key is under the mat. (2) The key is not under the mat. Which is possible?',
  'mcq',
  '{"A": "Only (1) can be true", "B": "Both are true", "C": "Either could be true, but not both", "D": "Both are false"}'::jsonb,
  '"C"'::jsonb,
  'Deduction, implication, and constraint logic.',
  38,
  true,
  '{"grade": 10, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '1038 tasks are shared equally among 6 students in a smartwatch club. How many tasks per student?',
  'mcq',
  '{"A": "171", "B": "173", "C": "6", "D": "175"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  39,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'If n is an odd integer, which expression is always even?',
  'mcq',
  '{"A": "n", "B": "2n+1", "C": "n^2", "D": "n+1"}'::jsonb,
  '"D"'::jsonb,
  'Deduction, implication, and constraint logic.',
  40,
  true,
  '{"grade": 10, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'If all electric scooters are vehicles and all vehicles need energy, which must be true?',
  'mcq',
  '{"A": "All energy is vehicles", "B": "Electric scooters need energy", "C": "No vehicle needs energy", "D": "All vehicles are scooters"}'::jsonb,
  '"B"'::jsonb,
  'Deduction, implication, and constraint logic.',
  41,
  true,
  '{"grade": 10, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 55 minutes in traffic and 20 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "35", "B": "-35", "C": "75", "D": "40"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  42,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Choose the conclusion that follows: Some students are athletes. All athletes practice daily.',
  'mcq',
  '{"A": "No student practices daily", "B": "Only athletes are students", "C": "All students practice daily", "D": "Some students practice daily"}'::jsonb,
  '"D"'::jsonb,
  'Deduction, implication, and constraint logic.',
  43,
  true,
  '{"grade": 10, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store sold 982 items on Monday and 637 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1669", "B": "345", "C": "1619", "D": "1569"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  44,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A recycling event needs 9 badges per team. If there are 8 teams, how many badges are needed?',
  'mcq',
  '{"A": "72", "B": "17", "C": "63", "D": "81"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  45,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Pattern: 3, 6, 12, 24, ?',
  'mcq',
  '{"A": "36", "B": "54", "C": "48", "D": "42"}'::jsonb,
  '"C"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  46,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media event needs 6 badges per team. If there are 4 teams, how many badges are needed?',
  'mcq',
  '{"A": "18", "B": "10", "C": "30", "D": "24"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  47,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a creator economy quiz are: 21, 91, 32, 37, 11. What is the median score?',
  'mcq',
  '{"A": "21", "B": "38", "C": "32", "D": "37"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  48,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹778 budget. They buy 6 subscriptions at ₹116 each. How much money is left?',
  'mcq',
  '{"A": "1474", "B": "662", "C": "82", "D": "-82"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  49,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 31 minutes in traffic and 20 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "16", "B": "-11", "C": "51", "D": "11"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  50,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a code, CAT=3 and DOG=3 (based on a rule). What is the value of ELEPHANT?',
  'mcq',
  '{"A": "7", "B": "8", "C": "9", "D": "6"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  51,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 916 subscribers and gained 25% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "941", "B": "891", "C": "274", "D": "229"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  52,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 885 subscribers and gained 30% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "855", "B": "309", "C": "915", "D": "265"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  53,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '4 volunteers finish 88 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "22", "B": "19", "C": "92", "D": "25"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  54,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '424 tasks are shared equally among 8 students in a digital payments club. How many tasks per student?',
  'mcq',
  '{"A": "53", "B": "51", "C": "8", "D": "55"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  55,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 100 is divided by 3, what is the remainder?',
  'mcq',
  '{"A": "3", "B": "1", "C": "2", "D": "847"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  56,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 82 items. 19 were returned and 17 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "84", "B": "65", "C": "46", "D": "63"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  57,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '522 tasks are shared equally among 6 students in a online classes club. How many tasks per student?',
  'mcq',
  '{"A": "87", "B": "6", "C": "89", "D": "85"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  58,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A e-commerce event needs 4 badges per team. If there are 10 teams, how many badges are needed?',
  'mcq',
  '{"A": "40", "B": "36", "C": "44", "D": "14"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  59,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹327 budget. They buy 6 subscriptions at ₹116 each. How much money is left?',
  'mcq',
  '{"A": "1023", "B": "-369", "C": "211", "D": "369"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  60,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 9 after multiplying by 2. The result is 33. What was the original number?',
  'mcq',
  '{"A": "24", "B": "12", "C": "11", "D": "13"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  61,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 37 minutes in traffic and 24 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "18", "B": "-13", "C": "61", "D": "13"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  62,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 15, 20, 13, 18, 11, ?',
  'mcq',
  '{"A": "14", "B": "20", "C": "16", "D": "17"}'::jsonb,
  '"C"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  63,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 155 items. 25 were returned and 25 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "105", "B": "130", "C": "1164", "D": "155"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  64,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media event needs 5 badges per team. If there are 6 teams, how many badges are needed?',
  'mcq',
  '{"A": "35", "B": "11", "C": "30", "D": "25"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  65,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 500 packets and lost 15%. How many packets were received?',
  'mcq',
  '{"A": "75", "B": "575", "C": "425", "D": "485"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  66,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store had 128 orders in Week 1 and 115 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "23", "B": "13", "C": "128", "D": "243"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  67,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '6 volunteers finish 84 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "90", "B": "11", "C": "17", "D": "14"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  68,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a app survey of 543 teens, 25 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "25", "B": "538", "C": "568", "D": "518"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  69,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 12 snack packs at ₹87 each. What is the total cost?',
  'mcq',
  '{"A": "1044", "B": "957", "C": "99", "D": "1131"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  70,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '655 tasks are shared equally among 5 students in a solar power club. How many tasks per student?',
  'mcq',
  '{"A": "129", "B": "133", "C": "5", "D": "131"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  71,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=85, B=49, C=67. What is the total number of votes?',
  'mcq',
  '{"A": "201", "B": "85", "C": "211", "D": "191"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  72,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A e-commerce store had 58 orders in Week 1 and 91 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "43", "B": "33", "C": "149", "D": "91"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  73,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a sports analytics quiz are: 20, 11, 96, 82, 17. What is the median score?',
  'mcq',
  '{"A": "82", "B": "45", "C": "17", "D": "20"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  74,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '4 volunteers finish 108 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "112", "B": "27", "C": "30", "D": "24"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  75,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A digital payments store had 76 orders in Week 1 and 57 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "133", "B": "29", "C": "19", "D": "76"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  76,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '645 tasks are shared equally among 3 students in a delivery club. How many tasks per student?',
  'mcq',
  '{"A": "3", "B": "217", "C": "215", "D": "213"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  77,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A sports analytics event needs 4 badges per team. If there are 4 teams, how many badges are needed?',
  'mcq',
  '{"A": "8", "B": "20", "C": "16", "D": "12"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  78,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹552 budget. They buy 6 subscriptions at ₹112 each. How much money is left?',
  'mcq',
  '{"A": "120", "B": "1224", "C": "440", "D": "-120"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  79,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 8, 15, 22, 29, ?',
  'mcq',
  '{"A": "934", "B": "36", "C": "43", "D": "29"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  80,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a public transport competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "4 wins, 1 draw", "B": "3 wins, 0 draw", "C": "1 win, 4 draws", "D": "3 wins, 1 draw"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  81,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 84 is divided by 9, what is the remainder?',
  'mcq',
  '{"A": "4", "B": "3", "C": "5", "D": "8"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  82,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A recycling store sold 494 items on Monday and 218 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "712", "B": "762", "C": "662", "D": "276"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  83,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A gaming store sold 501 items on Monday and 96 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "405", "B": "597", "C": "647", "D": "547"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  84,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Statement: If a device is charged, it can turn on. The device turns on. What can you conclude?',
  'mcq',
  '{"A": "Charging is impossible", "B": "It is definitely charged", "C": "It may be charged", "D": "It is definitely not charged"}'::jsonb,
  '"C"'::jsonb,
  'Deduction, implication, and constraint logic.',
  85,
  true,
  '{"grade": 10, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '770 tasks are shared equally among 10 students in a fitness challenge club. How many tasks per student?',
  'mcq',
  '{"A": "79", "B": "77", "C": "10", "D": "75"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  86,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹8 per month. If the total for 6 months is ₹168, what is the monthly charge?',
  'mcq',
  '{"A": "48", "B": "3", "C": "8", "D": "13"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  87,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 65 items. 29 were returned and 8 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "28", "B": "86", "C": "36", "D": "57"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  88,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 373% at start and drops by 173 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "173", "B": "546", "C": "210", "D": "200"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  89,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a EV survey of 604 teens, 60 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "60", "B": "544", "C": "564", "D": "664"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  90,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 29 is divided by 9, what is the remainder?',
  'mcq',
  '{"A": "3", "B": "4", "C": "8", "D": "2"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  91,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A online classes store had 79 orders in Week 1 and 113 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "113", "B": "34", "C": "44", "D": "192"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  92,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 46 and 17 minutes with 6 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "29", "B": "69", "C": "63", "D": "57"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  93,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media event needs 4 badges per team. If there are 10 teams, how many badges are needed?',
  'mcq',
  '{"A": "36", "B": "44", "C": "40", "D": "14"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  94,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A cyber safety store sold 954 items on Monday and 391 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1345", "B": "1295", "C": "1395", "D": "563"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  95,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A sports analytics store had 108 orders in Week 1 and 74 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "34", "B": "44", "C": "108", "D": "182"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  96,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 39, 46, 34, 49. What is the average?',
  'mcq',
  '{"A": "37", "B": "42", "C": "47", "D": "168"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  97,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 11 snack packs at ₹84 each. What is the total cost?',
  'mcq',
  '{"A": "924", "B": "95", "C": "840", "D": "1008"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  98,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'All A are B. No B are C. Which must be true?',
  'mcq',
  '{"A": "Some B are C", "B": "No A are C", "C": "All C are A", "D": "Some A are C"}'::jsonb,
  '"B"'::jsonb,
  'Deduction, implication, and constraint logic.',
  99,
  true,
  '{"grade": 10, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 5 snack packs at ₹85 each. What is the total cost?',
  'mcq',
  '{"A": "510", "B": "425", "C": "340", "D": "90"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  100,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '1044 tasks are shared equally among 3 students in a sports analytics club. How many tasks per student?',
  'mcq',
  '{"A": "350", "B": "346", "C": "348", "D": "3"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  101,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV store had 73 orders in Week 1 and 112 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "39", "B": "49", "C": "185", "D": "112"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  102,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 300 packets and lost 20%. How many packets were received?',
  'mcq',
  '{"A": "240", "B": "60", "C": "280", "D": "360"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  103,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store had 78 orders in Week 1 and 144 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "144", "B": "222", "C": "66", "D": "76"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  104,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 42 and 15 minutes with 7 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "57", "B": "64", "C": "27", "D": "50"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  105,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A sports analytics store had 84 orders in Week 1 and 102 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "18", "B": "102", "C": "28", "D": "186"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  106,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 40 and 21 minutes with 8 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "69", "B": "53", "C": "19", "D": "61"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  107,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 25, 41, 78, 48. What is the mean?',
  'mcq',
  '{"A": "48", "B": "192", "C": "46", "D": "50"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  108,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=79, B=65, C=40. What is the total number of votes?',
  'mcq',
  '{"A": "194", "B": "174", "C": "79", "D": "184"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  109,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 74, 48, 78, 28. What is the mean?',
  'mcq',
  '{"A": "55", "B": "228", "C": "57", "D": "59"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  110,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 642% at start and drops by 102 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "744", "B": "550", "C": "540", "D": "102"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  111,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '580 tasks are shared equally among 4 students in a public transport club. How many tasks per student?',
  'mcq',
  '{"A": "145", "B": "4", "C": "143", "D": "147"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  112,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a gaming survey of 897 teens, 60 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "857", "B": "837", "C": "60", "D": "957"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  113,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV event needs 6 badges per team. If there are 9 teams, how many badges are needed?',
  'mcq',
  '{"A": "60", "B": "54", "C": "15", "D": "48"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  114,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '1144 tasks are shared equally among 8 students in a app club. How many tasks per student?',
  'mcq',
  '{"A": "141", "B": "143", "C": "8", "D": "145"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  115,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 54, 37, 21, 20. What is the average?',
  'mcq',
  '{"A": "28", "B": "132", "C": "38", "D": "33"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  116,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 574 subscribers and gained 15% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "86", "B": "114", "C": "559", "D": "589"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  117,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '4 volunteers finish 120 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "124", "B": "33", "C": "30", "D": "27"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  118,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '1038 tasks are shared equally among 6 students in a recycling club. How many tasks per student?',
  'mcq',
  '{"A": "175", "B": "6", "C": "171", "D": "173"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  119,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A delivery run is 10 km long. How many meters is that?',
  'mcq',
  '{"A": "10000", "B": "1000", "C": "100000", "D": "11000"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  120,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 34, 39, 32, 37, 30, ?',
  'mcq',
  '{"A": "33", "B": "36", "C": "39", "D": "35"}'::jsonb,
  '"D"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  121,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 32, 37, 30, 35, 28, ?',
  'mcq',
  '{"A": "33", "B": "37", "C": "31", "D": "34"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  122,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 86 is divided by 4, what is the remainder?',
  'mcq',
  '{"A": "4", "B": "2", "C": "169", "D": "3"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  123,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 9 after multiplying by 2. The result is 27. What was the original number?',
  'mcq',
  '{"A": "18", "B": "9", "C": "10", "D": "8"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  124,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 8, 10, 12, 14, ?',
  'mcq',
  '{"A": "18", "B": "425", "C": "16", "D": "14"}'::jsonb,
  '"C"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  125,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A creator economy store had 88 orders in Week 1 and 122 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "122", "B": "210", "C": "44", "D": "34"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  126,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '3 volunteers finish 84 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "87", "B": "28", "C": "25", "D": "31"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  127,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 13 after multiplying by 3. The result is 22. What was the original number?',
  'mcq',
  '{"A": "4", "B": "3", "C": "9", "D": "2"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  128,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 6 after multiplying by 3. The result is 42. What was the original number?',
  'mcq',
  '{"A": "36", "B": "13", "C": "11", "D": "12"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  129,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '365 tasks are shared equally among 5 students in a creator economy club. How many tasks per student?',
  'mcq',
  '{"A": "75", "B": "5", "C": "73", "D": "71"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  130,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 28, 73, 41, 38. What is the mean?',
  'mcq',
  '{"A": "45", "B": "180", "C": "43", "D": "47"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  131,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 71 minutes in traffic and 52 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "24", "B": "-19", "C": "19", "D": "123"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  132,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=110, B=112, C=101. What is the total number of votes?',
  'mcq',
  '{"A": "313", "B": "112", "C": "323", "D": "333"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  133,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '3 volunteers finish 60 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "23", "B": "17", "C": "20", "D": "63"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  134,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 11 after multiplying by 4. The result is 55. What was the original number?',
  'mcq',
  '{"A": "11", "B": "44", "C": "10", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  135,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A delivery platform reports that 10% of 500 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "50", "B": "0", "C": "100", "D": "10"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  136,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 300 packets and lost 15%. How many packets were received?',
  'mcq',
  '{"A": "345", "B": "285", "C": "45", "D": "255"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  137,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '960 tasks are shared equally among 4 students in a delivery club. How many tasks per student?',
  'mcq',
  '{"A": "240", "B": "242", "C": "238", "D": "4"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  138,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹19 per month. If the total for 6 months is ₹234, what is the monthly charge?',
  'mcq',
  '{"A": "14", "B": "19", "C": "24", "D": "114"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  139,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹415 budget. They buy 5 subscriptions at ₹142 each. How much money is left?',
  'mcq',
  '{"A": "273", "B": "-295", "C": "1125", "D": "295"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  140,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a EV survey of 253 teens, 80 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "333", "B": "80", "C": "173", "D": "193"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  141,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a gaming survey of 516 teens, 120 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "120", "B": "396", "C": "636", "D": "416"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  142,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=96, B=92, C=76. What is the total number of votes?',
  'mcq',
  '{"A": "254", "B": "264", "C": "96", "D": "274"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  143,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 316 subscribers and gained 10% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "326", "B": "47", "C": "31", "D": "306"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  144,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 14, 19, 12, 17, 10, ?',
  'mcq',
  '{"A": "13", "B": "19", "C": "16", "D": "15"}'::jsonb,
  '"D"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  145,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 13 snack packs at ₹40 each. What is the total cost?',
  'mcq',
  '{"A": "560", "B": "53", "C": "480", "D": "520"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  146,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 8, 13, 18, 23, ?',
  'mcq',
  '{"A": "23", "B": "28", "C": "33", "D": "888"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  147,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 344% at start and drops by 255 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "255", "B": "599", "C": "99", "D": "89"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  148,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 22 students. At each of 3 stops, 3 get off and 2 get on. How many students after the last stop?',
  'mcq',
  '{"A": "25", "B": "19", "C": "21", "D": "37"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  149,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A online classes store sold 507 items on Monday and 298 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "805", "B": "755", "C": "209", "D": "855"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  150,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a smartwatch competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "3 wins, 0 draw", "B": "1 win, 4 draws", "C": "4 wins, 1 draw", "D": "3 wins, 1 draw"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  151,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 529% at start and drops by 348 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "348", "B": "877", "C": "191", "D": "181"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  152,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A e-commerce store sold 709 items on Monday and 95 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "804", "B": "854", "C": "614", "D": "754"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  153,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 12 after multiplying by 3. The result is 36. What was the original number?',
  'mcq',
  '{"A": "7", "B": "9", "C": "8", "D": "24"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  154,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹11 per month. If the total for 6 months is ₹186, what is the monthly charge?',
  'mcq',
  '{"A": "11", "B": "66", "C": "6", "D": "16"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  155,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 273% at start and drops by 105 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "105", "B": "378", "C": "178", "D": "168"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  156,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 13 snack packs at ₹93 each. What is the total cost?',
  'mcq',
  '{"A": "106", "B": "1302", "C": "1116", "D": "1209"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  157,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 39, 54, 41, 42. What is the average?',
  'mcq',
  '{"A": "39", "B": "44", "C": "49", "D": "176"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  158,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 45 minutes in traffic and 35 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "15", "B": "10", "C": "-10", "D": "80"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  159,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 9 snack packs at ₹89 each. What is the total cost?',
  'mcq',
  '{"A": "98", "B": "712", "C": "890", "D": "801"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  160,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '1176 tasks are shared equally among 12 students in a EV club. How many tasks per student?',
  'mcq',
  '{"A": "100", "B": "98", "C": "12", "D": "96"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  161,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 29, 34, 27, 32, 25, ?',
  'mcq',
  '{"A": "30", "B": "34", "C": "31", "D": "28"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  162,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '300 tasks are shared equally among 12 students in a robotics club club. How many tasks per student?',
  'mcq',
  '{"A": "27", "B": "23", "C": "25", "D": "12"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  163,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media run is 15 km long. How many meters is that?',
  'mcq',
  '{"A": "16500", "B": "1500", "C": "15000", "D": "150000"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  164,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '6 volunteers finish 60 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "10", "B": "66", "C": "13", "D": "7"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  165,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹4 per month. If the total for 6 months is ₹144, what is the monthly charge?',
  'mcq',
  '{"A": "4", "B": "9", "C": "-1", "D": "24"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  166,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 13, 18, 11, 16, 9, ?',
  'mcq',
  '{"A": "14", "B": "18", "C": "15", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  167,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 713% at start and drops by 311 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "311", "B": "1024", "C": "402", "D": "412"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  168,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A online classes run is 15 km long. How many meters is that?',
  'mcq',
  '{"A": "150000", "B": "16500", "C": "1500", "D": "15000"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  169,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a smartwatch survey of 616 teens, 100 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "516", "B": "100", "C": "536", "D": "716"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  170,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 794% at start and drops by 233 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "1027", "B": "233", "C": "561", "D": "571"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  171,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 17 after multiplying by 6. The result is 71. What was the original number?',
  'mcq',
  '{"A": "8", "B": "9", "C": "10", "D": "54"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  172,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 293% at start and drops by 159 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "452", "B": "159", "C": "134", "D": "144"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  173,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 27, 32, 25, 30, 23, ?',
  'mcq',
  '{"A": "28", "B": "32", "C": "26", "D": "29"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  174,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 103 is divided by 4, what is the remainder?',
  'mcq',
  '{"A": "3", "B": "4", "C": "740", "D": "5"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  175,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=98, B=85, C=40. What is the total number of votes?',
  'mcq',
  '{"A": "213", "B": "233", "C": "223", "D": "98"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  176,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 59 students. At each of 3 stops, 7 get off and 7 get on. How many students after the last stop?',
  'mcq',
  '{"A": "386", "B": "101", "C": "59", "D": "382"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  177,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 23 and 15 minutes with 13 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "8", "B": "38", "C": "25", "D": "51"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  178,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 32 is divided by 4, what is the remainder?',
  'mcq',
  '{"A": "2", "B": "0", "C": "1", "D": "3"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  179,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 8, 11, 14, 17, ?',
  'mcq',
  '{"A": "47", "B": "20", "C": "17", "D": "23"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  180,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 11 L/min and 9 L/min. A leak drains 9 L/min. Starting empty, how much water after 4 minutes?',
  'mcq',
  '{"A": "44", "B": "80", "C": "116", "D": "36"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  181,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 5 snack packs at ₹24 each. What is the total cost?',
  'mcq',
  '{"A": "96", "B": "144", "C": "29", "D": "120"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  182,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 9 L/min and 13 L/min. A leak drains 4 L/min. Starting empty, how much water after 9 minutes?',
  'mcq',
  '{"A": "36", "B": "198", "C": "162", "D": "234"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  183,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 4, 4, and 1 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "16", "B": "5", "C": "9", "D": "8"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  184,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A robotics club event needs 5 badges per team. If there are 12 teams, how many badges are needed?',
  'mcq',
  '{"A": "17", "B": "60", "C": "65", "D": "55"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  185,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 37, 42, 35, 40, 33, ?',
  'mcq',
  '{"A": "39", "B": "38", "C": "42", "D": "36"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  186,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 39, 44, 37, 42, 35, ?',
  'mcq',
  '{"A": "40", "B": "41", "C": "38", "D": "44"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  187,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 7, 11, 15, 19, ?',
  'mcq',
  '{"A": "23", "B": "27", "C": "325", "D": "19"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  188,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A digital payments platform reports that 20% of 400 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "120", "B": "20", "C": "40", "D": "80"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  189,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 48 and 22 minutes with 15 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "85", "B": "70", "C": "26", "D": "55"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  190,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a creator economy survey of 841 teens, 120 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "961", "B": "120", "C": "741", "D": "721"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  191,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media store sold 597 items on Monday and 230 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "827", "B": "367", "C": "777", "D": "877"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  192,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A e-commerce platform reports that 40% of 300 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "120", "B": "40", "C": "90", "D": "150"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  193,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 6 L/min and 7 L/min. A leak drains 8 L/min. Starting empty, how much water after 6 minutes?',
  'mcq',
  '{"A": "48", "B": "78", "C": "30", "D": "126"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  194,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '830 tasks are shared equally among 10 students in a creator economy club. How many tasks per student?',
  'mcq',
  '{"A": "10", "B": "81", "C": "83", "D": "85"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  195,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A public transport store had 77 orders in Week 1 and 82 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "15", "B": "5", "C": "159", "D": "82"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  196,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a recycling survey of 291 teens, 45 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "266", "B": "45", "C": "246", "D": "336"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  197,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Pattern: 6, 12, 24, 48, ?',
  'mcq',
  '{"A": "84", "B": "108", "C": "72", "D": "96"}'::jsonb,
  '"D"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  198,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store sold 1114 items on Monday and 86 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1150", "B": "1200", "C": "1028", "D": "1250"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  199,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 3, 3, and 5 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "8", "B": "11", "C": "45", "D": "6"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  200,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 800 subscribers and gained 12% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "812", "B": "788", "C": "136", "D": "96"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  201,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '488 tasks are shared equally among 8 students in a e-commerce club. How many tasks per student?',
  'mcq',
  '{"A": "63", "B": "61", "C": "59", "D": "8"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  202,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 56, 20, 28, 40. What is the average?',
  'mcq',
  '{"A": "36", "B": "31", "C": "144", "D": "41"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  203,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Pattern: 5, 10, 20, 40, ?',
  'mcq',
  '{"A": "90", "B": "60", "C": "70", "D": "80"}'::jsonb,
  '"D"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  204,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '612 tasks are shared equally among 3 students in a EV club. How many tasks per student?',
  'mcq',
  '{"A": "3", "B": "206", "C": "204", "D": "202"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  205,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 3, 12, 21, 30, ?',
  'mcq',
  '{"A": "30", "B": "39", "C": "974", "D": "48"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  206,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 229% at start and drops by 193 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "193", "B": "36", "C": "422", "D": "46"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  207,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 5 snack packs at ₹90 each. What is the total cost?',
  'mcq',
  '{"A": "360", "B": "450", "C": "95", "D": "540"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  208,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹5 per month. If the total for 6 months is ₹150, what is the monthly charge?',
  'mcq',
  '{"A": "10", "B": "0", "C": "30", "D": "5"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  209,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 31, 36, 29, 34, 27, ?',
  'mcq',
  '{"A": "30", "B": "36", "C": "32", "D": "33"}'::jsonb,
  '"C"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  210,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 200 packets and lost 5%. How many packets were received?',
  'mcq',
  '{"A": "10", "B": "210", "C": "195", "D": "190"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  211,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 33 and 39 minutes with 11 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "6", "B": "83", "C": "61", "D": "72"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  212,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=49, B=95, C=79. What is the total number of votes?',
  'mcq',
  '{"A": "223", "B": "213", "C": "95", "D": "233"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  213,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '460 tasks are shared equally among 5 students in a fitness challenge club. How many tasks per student?',
  'mcq',
  '{"A": "92", "B": "90", "C": "94", "D": "5"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  214,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 28, 76, 76, 32. What is the mean?',
  'mcq',
  '{"A": "53", "B": "55", "C": "51", "D": "212"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  215,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV store sold 838 items on Monday and 561 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1399", "B": "1349", "C": "1449", "D": "277"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  216,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV store had 70 orders in Week 1 and 86 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "156", "B": "86", "C": "16", "D": "26"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  217,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '6 volunteers finish 108 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "18", "B": "21", "C": "15", "D": "114"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  218,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 38, 25, 53, 32. What is the average?',
  'mcq',
  '{"A": "148", "B": "37", "C": "42", "D": "32"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  219,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '1080 tasks are shared equally among 12 students in a online classes club. How many tasks per student?',
  'mcq',
  '{"A": "90", "B": "88", "C": "12", "D": "92"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  220,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A recycling store sold 650 items on Monday and 489 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1139", "B": "161", "C": "1089", "D": "1189"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  221,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV event needs 7 badges per team. If there are 10 teams, how many badges are needed?',
  'mcq',
  '{"A": "63", "B": "77", "C": "17", "D": "70"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  222,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV event needs 4 badges per team. If there are 5 teams, how many badges are needed?',
  'mcq',
  '{"A": "24", "B": "20", "C": "16", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  223,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 6 snack packs at ₹60 each. What is the total cost?',
  'mcq',
  '{"A": "360", "B": "420", "C": "300", "D": "66"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  224,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 751 subscribers and gained 10% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "75", "B": "761", "C": "112", "D": "741"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  225,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A digital payments store sold 403 items on Monday and 724 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1177", "B": "-321", "C": "1077", "D": "1127"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  226,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 24, 34, 62, 36. What is the mean?',
  'mcq',
  '{"A": "39", "B": "41", "C": "37", "D": "156"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  227,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 288% at start and drops by 81 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "207", "B": "81", "C": "369", "D": "217"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  228,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store had 61 orders in Week 1 and 113 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "113", "B": "174", "C": "62", "D": "52"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  229,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A delivery store had 66 orders in Week 1 and 52 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "66", "B": "24", "C": "14", "D": "118"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  230,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 532 subscribers and gained 20% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "512", "B": "106", "C": "552", "D": "133"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  231,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a recycling quiz are: 99, 62, 47, 20, 69. What is the median score?',
  'mcq',
  '{"A": "47", "B": "59", "C": "62", "D": "69"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  232,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A robotics club platform reports that 15% of 500 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "15", "B": "75", "C": "25", "D": "125"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  233,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 120 items. 8 were returned and 18 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "94", "B": "102", "C": "110", "D": "112"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  234,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A creator economy event needs 4 badges per team. If there are 6 teams, how many badges are needed?',
  'mcq',
  '{"A": "24", "B": "10", "C": "28", "D": "20"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  235,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 349% at start and drops by 201 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "550", "B": "148", "C": "158", "D": "201"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  236,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A robotics club store sold 758 items on Monday and 390 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1098", "B": "368", "C": "1148", "D": "1198"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  237,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '288 tasks are shared equally among 12 students in a app club. How many tasks per student?',
  'mcq',
  '{"A": "24", "B": "12", "C": "22", "D": "26"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  238,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=53, B=70, C=64. What is the total number of votes?',
  'mcq',
  '{"A": "197", "B": "70", "C": "177", "D": "187"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  239,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 6, 6, and 3 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "108", "B": "15", "C": "12", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  240,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a robotics club quiz are: 90, 45, 34, 32, 92. What is the median score?',
  'mcq',
  '{"A": "45", "B": "90", "C": "58", "D": "34"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  241,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a digital payments survey of 526 teens, 20 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "506", "B": "526", "C": "546", "D": "20"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  242,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a solar power quiz are: 50, 98, 86, 56, 87. What is the median score?',
  'mcq',
  '{"A": "86", "B": "87", "C": "75", "D": "56"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  243,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A e-commerce run is 21 km long. How many meters is that?',
  'mcq',
  '{"A": "210000", "B": "21000", "C": "2100", "D": "23100"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  244,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a robotics club quiz are: 88, 14, 23, 15, 52. What is the median score?',
  'mcq',
  '{"A": "52", "B": "38", "C": "23", "D": "15"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  245,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹576 budget. They buy 5 subscriptions at ₹59 each. How much money is left?',
  'mcq',
  '{"A": "871", "B": "-281", "C": "517", "D": "281"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  246,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A public transport platform reports that 10% of 300 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "30", "B": "0", "C": "60", "D": "10"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  247,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A e-commerce store sold 595 items on Monday and 318 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "277", "B": "863", "C": "963", "D": "913"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  248,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '5 volunteers finish 120 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "24", "B": "125", "C": "21", "D": "27"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  249,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 7 after multiplying by 2. The result is 25. What was the original number?',
  'mcq',
  '{"A": "9", "B": "10", "C": "18", "D": "8"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  250,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 110 items. 8 were returned and 9 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "109", "B": "93", "C": "101", "D": "102"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  251,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 14 L/min and 7 L/min. A leak drains 8 L/min. Starting empty, how much water after 10 minutes?',
  'mcq',
  '{"A": "290", "B": "210", "C": "130", "D": "80"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  252,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 6 after multiplying by 3. The result is 45. What was the original number?',
  'mcq',
  '{"A": "13", "B": "39", "C": "14", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  253,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 51, 73, 27, 57. What is the mean?',
  'mcq',
  '{"A": "52", "B": "50", "C": "208", "D": "54"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  254,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 160 is divided by 8, what is the remainder?',
  'mcq',
  '{"A": "7", "B": "0", "C": "1", "D": "2"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  255,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 14 snack packs at ₹82 each. What is the total cost?',
  'mcq',
  '{"A": "1066", "B": "1148", "C": "96", "D": "1230"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  256,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A e-commerce store sold 458 items on Monday and 395 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "853", "B": "63", "C": "903", "D": "803"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  257,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 500 packets and lost 5%. How many packets were received?',
  'mcq',
  '{"A": "495", "B": "25", "C": "525", "D": "475"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  258,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 954 subscribers and gained 12% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "114", "B": "162", "C": "966", "D": "942"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  259,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 38, 24, 60, 42. What is the average?',
  'mcq',
  '{"A": "36", "B": "46", "C": "164", "D": "41"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  260,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 22, 27, 20, 25, 18, ?',
  'mcq',
  '{"A": "24", "B": "27", "C": "23", "D": "21"}'::jsonb,
  '"C"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  261,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a e-commerce survey of 632 teens, 30 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "662", "B": "30", "C": "622", "D": "602"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  262,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 501% at start and drops by 334 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "167", "B": "177", "C": "835", "D": "334"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  263,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹649 budget. They buy 6 subscriptions at ₹50 each. How much money is left?',
  'mcq',
  '{"A": "599", "B": "-349", "C": "349", "D": "949"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  264,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 5, 14, 23, 32, ?',
  'mcq',
  '{"A": "50", "B": "41", "C": "857", "D": "32"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  265,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a robotics club quiz are: 16, 99, 59, 78, 13. What is the median score?',
  'mcq',
  '{"A": "16", "B": "78", "C": "59", "D": "53"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  266,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a e-commerce quiz are: 55, 63, 60, 84, 81. What is the median score?',
  'mcq',
  '{"A": "60", "B": "81", "C": "63", "D": "68"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  267,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 7 after multiplying by 5. The result is 67. What was the original number?',
  'mcq',
  '{"A": "11", "B": "13", "C": "12", "D": "60"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  268,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A robotics club store had 147 orders in Week 1 and 129 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "18", "B": "276", "C": "28", "D": "147"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  269,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A sports analytics platform reports that 12% of 500 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "60", "B": "10", "C": "110", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  270,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 39 is divided by 8, what is the remainder?',
  'mcq',
  '{"A": "8", "B": "7", "C": "9", "D": "900"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  271,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a EV quiz are: 12, 53, 69, 27, 66. What is the median score?',
  'mcq',
  '{"A": "27", "B": "45", "C": "66", "D": "53"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  272,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '650 tasks are shared equally among 10 students in a solar power club. How many tasks per student?',
  'mcq',
  '{"A": "10", "B": "67", "C": "65", "D": "63"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  273,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 130 items. 21 were returned and 19 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "90", "B": "111", "C": "109", "D": "132"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  274,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a digital payments competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "4 wins, 1 draw", "B": "1 win, 4 draws", "C": "3 wins, 0 draw", "D": "3 wins, 1 draw"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  275,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 9 snack packs at ₹54 each. What is the total cost?',
  'mcq',
  '{"A": "486", "B": "63", "C": "540", "D": "432"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  276,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹14 per month. If the total for 6 months is ₹204, what is the monthly charge?',
  'mcq',
  '{"A": "14", "B": "84", "C": "9", "D": "19"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  277,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 5, 8, and 2 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "80", "B": "15", "C": "10", "D": "13"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  278,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 39, 23, 43, 59. What is the average?',
  'mcq',
  '{"A": "36", "B": "41", "C": "46", "D": "164"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  279,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 669 subscribers and gained 15% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "133", "B": "684", "C": "654", "D": "100"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  280,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 353% at start and drops by 157 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "196", "B": "510", "C": "157", "D": "206"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  281,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '1164 tasks are shared equally among 4 students in a app club. How many tasks per student?',
  'mcq',
  '{"A": "293", "B": "289", "C": "291", "D": "4"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  282,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a social media survey of 598 teens, 90 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "528", "B": "90", "C": "688", "D": "508"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  283,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 57 students. At each of 4 stops, 8 get off and 7 get on. How many students after the last stop?',
  'mcq',
  '{"A": "61", "B": "53", "C": "56", "D": "117"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  284,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A creator economy run is 12 km long. How many meters is that?',
  'mcq',
  '{"A": "120000", "B": "13200", "C": "12000", "D": "1200"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  285,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 468% at start and drops by 308 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "160", "B": "776", "C": "170", "D": "308"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  286,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 39 students. At each of 4 stops, 5 get off and 4 get on. How many students after the last stop?',
  'mcq',
  '{"A": "43", "B": "75", "C": "38", "D": "35"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  287,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 18 after multiplying by 2. The result is 30. What was the original number?',
  'mcq',
  '{"A": "7", "B": "6", "C": "12", "D": "5"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  288,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A app store had 90 orders in Week 1 and 139 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "139", "B": "229", "C": "59", "D": "49"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  289,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV platform reports that 20% of 600 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "120", "B": "180", "C": "60", "D": "20"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  290,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 783 subscribers and gained 30% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "813", "B": "753", "C": "234", "D": "274"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  291,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 53 minutes in traffic and 32 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "85", "B": "21", "C": "-21", "D": "26"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  292,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV run is 15 km long. How many meters is that?',
  'mcq',
  '{"A": "1500", "B": "150000", "C": "16500", "D": "15000"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  293,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 701% at start and drops by 612 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "89", "B": "1313", "C": "99", "D": "612"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  294,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 222 subscribers and gained 20% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "242", "B": "202", "C": "55", "D": "44"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  295,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 13 after multiplying by 6. The result is 97. What was the original number?',
  'mcq',
  '{"A": "13", "B": "84", "C": "14", "D": "15"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  296,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A online classes event needs 12 badges per team. If there are 6 teams, how many badges are needed?',
  'mcq',
  '{"A": "18", "B": "84", "C": "72", "D": "60"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  297,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A app store had 149 orders in Week 1 and 138 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "11", "B": "287", "C": "21", "D": "149"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  298,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A online classes event needs 8 badges per team. If there are 5 teams, how many badges are needed?',
  'mcq',
  '{"A": "40", "B": "13", "C": "48", "D": "32"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  299,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '6 volunteers finish 72 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "9", "B": "15", "C": "12", "D": "78"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  300,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 50 students. At each of 3 stops, 7 get off and 7 get on. How many students after the last stop?',
  'mcq',
  '{"A": "618", "B": "92", "C": "50", "D": "434"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  301,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 545% at start and drops by 337 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "218", "B": "882", "C": "208", "D": "337"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  302,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 155 items. 6 were returned and 25 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "124", "B": "130", "C": "136", "D": "149"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  303,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '790 tasks are shared equally among 10 students in a e-commerce club. How many tasks per student?',
  'mcq',
  '{"A": "79", "B": "77", "C": "10", "D": "81"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  304,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 356 subscribers and gained 30% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "106", "B": "386", "C": "124", "D": "326"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  305,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 13 snack packs at ₹81 each. What is the total cost?',
  'mcq',
  '{"A": "1134", "B": "1053", "C": "972", "D": "94"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  306,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 52 minutes in traffic and 70 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "-13", "B": "18", "C": "122", "D": "-18"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  307,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A app platform reports that 50% of 800 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "50", "B": "400", "C": "320", "D": "480"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  308,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 311% at start and drops by 109 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "202", "B": "109", "C": "420", "D": "212"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  309,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Pattern: 2, 4, 8, 16, ?',
  'mcq',
  '{"A": "28", "B": "36", "C": "24", "D": "32"}'::jsonb,
  '"D"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  310,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '3 volunteers finish 90 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "30", "B": "33", "C": "93", "D": "27"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  311,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 101 items. 9 were returned and 20 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "81", "B": "72", "C": "92", "D": "90"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  312,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 93 minutes in traffic and 12 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "105", "B": "81", "C": "-81", "D": "86"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  313,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A e-commerce store sold 731 items on Monday and 264 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "945", "B": "1045", "C": "467", "D": "995"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  314,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 1003 subscribers and gained 25% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "300", "B": "978", "C": "1028", "D": "250"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  315,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹6 per month. If the total for 6 months is ₹156, what is the monthly charge?',
  'mcq',
  '{"A": "6", "B": "11", "C": "1", "D": "36"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  316,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A delivery store had 51 orders in Week 1 and 50 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "51", "B": "101", "C": "1", "D": "11"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  317,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a creator economy competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "4 wins, 1 draw", "B": "3 wins, 0 draw", "C": "1 win, 4 draws", "D": "3 wins, 1 draw"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  318,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 18, 23, 16, 21, 14, ?',
  'mcq',
  '{"A": "17", "B": "20", "C": "19", "D": "23"}'::jsonb,
  '"C"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  319,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 91 minutes in traffic and 27 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "64", "B": "118", "C": "-64", "D": "69"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  320,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=84, B=47, C=99. What is the total number of votes?',
  'mcq',
  '{"A": "230", "B": "99", "C": "240", "D": "220"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  321,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 80 is divided by 4, what is the remainder?',
  'mcq',
  '{"A": "3", "B": "2", "C": "0", "D": "1"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  322,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 33, 36, 43, 44. What is the average?',
  'mcq',
  '{"A": "39", "B": "34", "C": "156", "D": "44"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  323,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 2, 3, and 3 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "8", "B": "5", "C": "6", "D": "18"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  324,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 8, 12, 16, 20, ?',
  'mcq',
  '{"A": "24", "B": "20", "C": "376", "D": "28"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  325,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 4, 3, and 3 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "36", "B": "7", "C": "10", "D": "6"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  326,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Pattern: 4, 8, 16, 32, ?',
  'mcq',
  '{"A": "48", "B": "64", "C": "72", "D": "56"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  327,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 108 minutes in traffic and 33 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "141", "B": "-75", "C": "75", "D": "80"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  328,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 153 items. 9 were returned and 25 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "119", "B": "128", "C": "144", "D": "137"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  329,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a recycling survey of 258 teens, 100 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "158", "B": "178", "C": "100", "D": "358"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  330,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=60, B=56, C=113. What is the total number of votes?',
  'mcq',
  '{"A": "229", "B": "239", "C": "113", "D": "219"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  331,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 130 items. 23 were returned and 22 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "108", "B": "85", "C": "107", "D": "131"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  332,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 300 packets and lost 5%. How many packets were received?',
  'mcq',
  '{"A": "15", "B": "315", "C": "285", "D": "295"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  333,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹13 per month. If the total for 6 months is ₹198, what is the monthly charge?',
  'mcq',
  '{"A": "18", "B": "13", "C": "8", "D": "78"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  334,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 133 is divided by 7, what is the remainder?',
  'mcq',
  '{"A": "2", "B": "0", "C": "6", "D": "1"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  335,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 29 and 21 minutes with 10 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "40", "B": "50", "C": "60", "D": "8"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  336,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 383 subscribers and gained 10% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "38", "B": "393", "C": "373", "D": "57"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  337,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 56 students. At each of 2 stops, 7 get off and 3 get on. How many students after the last stop?',
  'mcq',
  '{"A": "76", "B": "64", "C": "52", "D": "48"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  338,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a gaming competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "4 wins, 1 draw", "B": "3 wins, 1 draw", "C": "3 wins, 0 draw", "D": "1 win, 4 draws"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  339,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A robotics club event needs 9 badges per team. If there are 8 teams, how many badges are needed?',
  'mcq',
  '{"A": "63", "B": "81", "C": "17", "D": "72"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  340,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV store had 139 orders in Week 1 and 116 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "23", "B": "139", "C": "255", "D": "33"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  341,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 51 minutes in traffic and 74 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "-18", "B": "23", "C": "-23", "D": "125"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  342,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 49 and 26 minutes with 10 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "75", "B": "85", "C": "65", "D": "23"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  343,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 14 after multiplying by 6. The result is 38. What was the original number?',
  'mcq',
  '{"A": "24", "B": "3", "C": "4", "D": "5"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  344,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A sports analytics platform reports that 30% of 800 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "30", "B": "240", "C": "320", "D": "160"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  345,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹7 per month. If the total for 6 months is ₹162, what is the monthly charge?',
  'mcq',
  '{"A": "7", "B": "42", "C": "12", "D": "2"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  346,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A public transport platform reports that 12% of 250 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "5", "B": "55", "C": "30", "D": "12"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  347,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 800 packets and lost 10%. How many packets were received?',
  'mcq',
  '{"A": "880", "B": "790", "C": "720", "D": "80"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  348,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 36 students. At each of 3 stops, 4 get off and 5 get on. How many students after the last stop?',
  'mcq',
  '{"A": "33", "B": "63", "C": "39", "D": "37"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  349,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=55, B=57, C=65. What is the total number of votes?',
  'mcq',
  '{"A": "177", "B": "167", "C": "65", "D": "187"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  350,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 32, 31, 60, 33. What is the average?',
  'mcq',
  '{"A": "156", "B": "34", "C": "39", "D": "44"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  351,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 25 students. At each of 4 stops, 8 get off and 7 get on. How many students after the last stop?',
  'mcq',
  '{"A": "21", "B": "29", "C": "24", "D": "85"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  352,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹15 per month. If the total for 6 months is ₹210, what is the monthly charge?',
  'mcq',
  '{"A": "90", "B": "10", "C": "15", "D": "20"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  353,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '684 tasks are shared equally among 12 students in a cyber safety club. How many tasks per student?',
  'mcq',
  '{"A": "57", "B": "55", "C": "59", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  354,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 4 snack packs at ₹100 each. What is the total cost?',
  'mcq',
  '{"A": "400", "B": "500", "C": "104", "D": "300"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  355,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 13 after multiplying by 2. The result is 31. What was the original number?',
  'mcq',
  '{"A": "18", "B": "9", "C": "10", "D": "8"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  356,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 24, 29, 22, 27, 20, ?',
  'mcq',
  '{"A": "23", "B": "25", "C": "26", "D": "29"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  357,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 11 L/min and 13 L/min. A leak drains 7 L/min. Starting empty, how much water after 5 minutes?',
  'mcq',
  '{"A": "155", "B": "120", "C": "85", "D": "35"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  358,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 33, 30, 21, 28. What is the average?',
  'mcq',
  '{"A": "112", "B": "33", "C": "23", "D": "28"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  359,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 31, 34, 35, 36. What is the average?',
  'mcq',
  '{"A": "29", "B": "39", "C": "136", "D": "34"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  360,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 60 is divided by 5, what is the remainder?',
  'mcq',
  '{"A": "1", "B": "4", "C": "2", "D": "0"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  361,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 504% at start and drops by 231 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "273", "B": "283", "C": "735", "D": "231"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  362,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 15 snack packs at ₹27 each. What is the total cost?',
  'mcq',
  '{"A": "378", "B": "432", "C": "405", "D": "42"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  363,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 56 items. 28 were returned and 8 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "28", "B": "48", "C": "20", "D": "76"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  364,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 50 is divided by 5, what is the remainder?',
  'mcq',
  '{"A": "1", "B": "2", "C": "0", "D": "4"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  365,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A online classes event needs 9 badges per team. If there are 7 teams, how many badges are needed?',
  'mcq',
  '{"A": "63", "B": "16", "C": "72", "D": "54"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  366,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a app competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "1 win, 4 draws", "B": "3 wins, 0 draw", "C": "3 wins, 1 draw", "D": "4 wins, 1 draw"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  367,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 56 students. At each of 4 stops, 3 get off and 4 get on. How many students after the last stop?',
  'mcq',
  '{"A": "84", "B": "60", "C": "57", "D": "52"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  368,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 38, 43, 36, 41, 34, ?',
  'mcq',
  '{"A": "39", "B": "37", "C": "40", "D": "43"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  369,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '820 tasks are shared equally among 10 students in a recycling club. How many tasks per student?',
  'mcq',
  '{"A": "82", "B": "84", "C": "80", "D": "10"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  370,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 1145 subscribers and gained 20% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "1125", "B": "229", "C": "286", "D": "1165"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  371,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=111, B=94, C=84. What is the total number of votes?',
  'mcq',
  '{"A": "111", "B": "299", "C": "289", "D": "279"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  372,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 23, 28, 21, 26, 19, ?',
  'mcq',
  '{"A": "22", "B": "24", "C": "28", "D": "25"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  373,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 14 snack packs at ₹108 each. What is the total cost?',
  'mcq',
  '{"A": "1620", "B": "1512", "C": "122", "D": "1404"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  374,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 600 packets and lost 5%. How many packets were received?',
  'mcq',
  '{"A": "570", "B": "30", "C": "630", "D": "595"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  375,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 236 subscribers and gained 10% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "226", "B": "23", "C": "246", "D": "35"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  376,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 45 and 20 minutes with 8 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "25", "B": "65", "C": "73", "D": "57"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  377,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 250 packets and lost 12%. How many packets were received?',
  'mcq',
  '{"A": "238", "B": "30", "C": "220", "D": "280"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  378,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 73 minutes in traffic and 22 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "-51", "B": "56", "C": "51", "D": "95"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  379,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 3 snack packs at ₹25 each. What is the total cost?',
  'mcq',
  '{"A": "28", "B": "75", "C": "100", "D": "50"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  380,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 38, 44, 22, 36. What is the average?',
  'mcq',
  '{"A": "40", "B": "35", "C": "140", "D": "30"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  381,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 29, 38, 38, 27. What is the mean?',
  'mcq',
  '{"A": "31", "B": "33", "C": "35", "D": "132"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  382,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 67 minutes in traffic and 38 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "29", "B": "-29", "C": "105", "D": "34"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  383,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 193 is divided by 6, what is the remainder?',
  'mcq',
  '{"A": "3", "B": "2", "C": "1", "D": "5"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  384,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a online classes quiz are: 79, 56, 38, 45, 72. What is the median score?',
  'mcq',
  '{"A": "72", "B": "45", "C": "56", "D": "58"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  385,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 157 items. 7 were returned and 23 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "150", "B": "127", "C": "134", "D": "141"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  386,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV event needs 12 badges per team. If there are 4 teams, how many badges are needed?',
  'mcq',
  '{"A": "36", "B": "60", "C": "48", "D": "16"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  387,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 50 items. 26 were returned and 12 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "24", "B": "38", "C": "12", "D": "64"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  388,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A fitness challenge platform reports that 30% of 800 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "320", "B": "160", "C": "240", "D": "30"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  389,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 39, 26, 24, 39. What is the average?',
  'mcq',
  '{"A": "32", "B": "128", "C": "37", "D": "27"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  390,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 55 students. At each of 4 stops, 3 get off and 3 get on. How many students after the last stop?',
  'mcq',
  '{"A": "822", "B": "55", "C": "146", "D": "79"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  391,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A cyber safety store had 52 orders in Week 1 and 75 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "127", "B": "23", "C": "33", "D": "75"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  392,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 40 students. At each of 3 stops, 4 get off and 8 get on. How many students after the last stop?',
  'mcq',
  '{"A": "52", "B": "76", "C": "28", "D": "44"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  393,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 188 is divided by 3, what is the remainder?',
  'mcq',
  '{"A": "625", "B": "4", "C": "3", "D": "2"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  394,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 250 packets and lost 5%. How many packets were received?',
  'mcq',
  '{"A": "262", "B": "12", "C": "245", "D": "238"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  395,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 23, 27, 31, 31. What is the average?',
  'mcq',
  '{"A": "33", "B": "112", "C": "28", "D": "23"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  396,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 4, 5, and 5 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "14", "B": "10", "C": "9", "D": "100"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  397,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 7 L/min and 11 L/min. A leak drains 4 L/min. Starting empty, how much water after 10 minutes?',
  'mcq',
  '{"A": "140", "B": "180", "C": "220", "D": "40"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  398,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 47 students. At each of 3 stops, 10 get off and 2 get on. How many students after the last stop?',
  'mcq',
  '{"A": "83", "B": "71", "C": "23", "D": "39"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  399,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 14 snack packs at ₹66 each. What is the total cost?',
  'mcq',
  '{"A": "990", "B": "924", "C": "80", "D": "858"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  400,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 1234 subscribers and gained 30% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "1204", "B": "431", "C": "370", "D": "1264"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  401,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=101, B=86, C=101. What is the total number of votes?',
  'mcq',
  '{"A": "101", "B": "298", "C": "288", "D": "278"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  402,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media platform reports that 20% of 600 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "20", "B": "60", "C": "180", "D": "120"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  403,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 389 subscribers and gained 10% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "38", "B": "399", "C": "379", "D": "58"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  404,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 9 L/min and 8 L/min. A leak drains 3 L/min. Starting empty, how much water after 4 minutes?',
  'mcq',
  '{"A": "12", "B": "68", "C": "80", "D": "56"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  405,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 4, 8, 12, 16, ?',
  'mcq',
  '{"A": "20", "B": "16", "C": "495", "D": "24"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  406,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 13 snack packs at ₹63 each. What is the total cost?',
  'mcq',
  '{"A": "76", "B": "882", "C": "819", "D": "756"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  407,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 119 minutes in traffic and 28 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "147", "B": "91", "C": "96", "D": "-91"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  408,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 400 packets and lost 12%. How many packets were received?',
  'mcq',
  '{"A": "48", "B": "352", "C": "448", "D": "388"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  409,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=45, B=111, C=52. What is the total number of votes?',
  'mcq',
  '{"A": "198", "B": "111", "C": "218", "D": "208"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  410,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a cyber safety quiz are: 27, 74, 20, 79, 74. What is the median score?',
  'mcq',
  '{"A": "74", "B": "54", "C": "1014", "D": "27"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  411,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 5 after multiplying by 5. The result is 50. What was the original number?',
  'mcq',
  '{"A": "45", "B": "8", "C": "10", "D": "9"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  412,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 63, 73, 30, 46. What is the mean?',
  'mcq',
  '{"A": "55", "B": "53", "C": "212", "D": "51"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  413,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 99 items. 24 were returned and 4 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "71", "B": "119", "C": "95", "D": "75"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  414,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 39, 61, 33, 59. What is the mean?',
  'mcq',
  '{"A": "50", "B": "192", "C": "46", "D": "48"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  415,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹329 budget. They buy 6 subscriptions at ₹141 each. How much money is left?',
  'mcq',
  '{"A": "-517", "B": "1175", "C": "188", "D": "517"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  416,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 6 L/min and 5 L/min. A leak drains 8 L/min. Starting empty, how much water after 9 minutes?',
  'mcq',
  '{"A": "171", "B": "99", "C": "27", "D": "72"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  417,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 41, 51, 31, 21. What is the average?',
  'mcq',
  '{"A": "41", "B": "36", "C": "31", "D": "144"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  418,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 1146 subscribers and gained 10% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "171", "B": "114", "C": "1156", "D": "1136"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  419,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 1335 subscribers and gained 10% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "1325", "B": "200", "C": "133", "D": "1345"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  420,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A recycling store had 133 orders in Week 1 and 123 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "256", "B": "20", "C": "10", "D": "133"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  421,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 503% at start and drops by 462 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "965", "B": "462", "C": "51", "D": "41"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  422,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 87 is divided by 6, what is the remainder?',
  'mcq',
  '{"A": "3", "B": "794", "C": "4", "D": "5"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  423,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 822% at start and drops by 408 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "414", "B": "1230", "C": "408", "D": "424"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  424,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 579 subscribers and gained 25% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "554", "B": "604", "C": "173", "D": "144"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  425,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹736 budget. They buy 2 subscriptions at ₹89 each. How much money is left?',
  'mcq',
  '{"A": "647", "B": "914", "C": "-558", "D": "558"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  426,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 39 minutes in traffic and 30 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "-9", "B": "9", "C": "14", "D": "69"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  427,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹542 budget. They buy 2 subscriptions at ₹130 each. How much money is left?',
  'mcq',
  '{"A": "412", "B": "-282", "C": "282", "D": "802"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  428,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A delivery store had 92 orders in Week 1 and 93 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "11", "B": "93", "C": "185", "D": "1"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  429,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 7 L/min and 13 L/min. A leak drains 7 L/min. Starting empty, how much water after 7 minutes?',
  'mcq',
  '{"A": "189", "B": "91", "C": "140", "D": "49"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  430,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 32 minutes in traffic and 31 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "63", "B": "6", "C": "1", "D": "-1"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  431,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 40, 69, 33, 62. What is the mean?',
  'mcq',
  '{"A": "49", "B": "53", "C": "51", "D": "204"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  432,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A gaming run is 13 km long. How many meters is that?',
  'mcq',
  '{"A": "130000", "B": "13000", "C": "1300", "D": "14300"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  433,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 38, 42, 40, 56. What is the average?',
  'mcq',
  '{"A": "49", "B": "44", "C": "176", "D": "39"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  434,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 148 is divided by 7, what is the remainder?',
  'mcq',
  '{"A": "6", "B": "3", "C": "1", "D": "2"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  435,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store sold 175 items on Monday and 361 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "536", "B": "486", "C": "586", "D": "-186"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  436,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '3 volunteers finish 96 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "35", "B": "32", "C": "99", "D": "29"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  437,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 610% at start and drops by 407 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "1017", "B": "213", "C": "203", "D": "407"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  438,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 9 after multiplying by 3. The result is 39. What was the original number?',
  'mcq',
  '{"A": "11", "B": "9", "C": "10", "D": "30"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  439,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a online classes survey of 451 teens, 20 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "20", "B": "471", "C": "451", "D": "431"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  440,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 3, 5, and 3 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "143", "B": "11", "C": "45", "D": "8"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  441,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a delivery quiz are: 44, 92, 62, 59, 56. What is the median score?',
  'mcq',
  '{"A": "263", "B": "59", "C": "62", "D": "56"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  442,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '654 tasks are shared equally among 6 students in a digital payments club. How many tasks per student?',
  'mcq',
  '{"A": "111", "B": "109", "C": "6", "D": "107"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  443,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 48 and 28 minutes with 5 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "81", "B": "20", "C": "76", "D": "71"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  444,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a EV quiz are: 10, 21, 14, 24, 49. What is the median score?',
  'mcq',
  '{"A": "23", "B": "21", "C": "24", "D": "14"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  445,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=102, B=89, C=61. What is the total number of votes?',
  'mcq',
  '{"A": "102", "B": "252", "C": "262", "D": "242"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  446,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A digital payments store sold 782 items on Monday and 210 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "992", "B": "1042", "C": "572", "D": "942"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  447,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 98 minutes in traffic and 46 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "144", "B": "52", "C": "57", "D": "-52"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  448,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 9 L/min and 8 L/min. A leak drains 10 L/min. Starting empty, how much water after 6 minutes?',
  'mcq',
  '{"A": "60", "B": "42", "C": "102", "D": "162"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  449,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 75, 80, 50, 51. What is the mean?',
  'mcq',
  '{"A": "64", "B": "66", "C": "256", "D": "62"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  450,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 45, 46, 38, 39. What is the mean?',
  'mcq',
  '{"A": "168", "B": "44", "C": "40", "D": "42"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  451,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A delivery event needs 10 badges per team. If there are 8 teams, how many badges are needed?',
  'mcq',
  '{"A": "90", "B": "18", "C": "80", "D": "70"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  452,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a smartwatch quiz are: 12, 15, 62, 59, 92. What is the median score?',
  'mcq',
  '{"A": "15", "B": "48", "C": "62", "D": "59"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  453,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 48 students. At each of 2 stops, 8 get off and 8 get on. How many students after the last stop?',
  'mcq',
  '{"A": "80", "B": "91", "C": "48", "D": "639"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  454,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 77, 78, 68, 61. What is the mean?',
  'mcq',
  '{"A": "69", "B": "73", "C": "284", "D": "71"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  455,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 151 items. 9 were returned and 24 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "127", "B": "118", "C": "142", "D": "136"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  456,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 43, 33, 56, 24. What is the average?',
  'mcq',
  '{"A": "44", "B": "156", "C": "39", "D": "34"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  457,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹824 budget. They buy 4 subscriptions at ₹78 each. How much money is left?',
  'mcq',
  '{"A": "512", "B": "746", "C": "1136", "D": "-512"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  458,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A gaming store sold 1457 items on Monday and 647 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "2104", "B": "810", "C": "2054", "D": "2154"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  459,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 38 students. At each of 3 stops, 7 get off and 6 get on. How many students after the last stop?',
  'mcq',
  '{"A": "41", "B": "37", "C": "77", "D": "35"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  460,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 24 students. At each of 4 stops, 5 get off and 4 get on. How many students after the last stop?',
  'mcq',
  '{"A": "60", "B": "23", "C": "20", "D": "28"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  461,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 4, 4, and 4 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "12", "B": "662", "C": "8", "D": "64"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  462,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 6, 5, and 1 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "6", "B": "30", "C": "11", "D": "12"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  463,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '966 tasks are shared equally among 3 students in a recycling club. How many tasks per student?',
  'mcq',
  '{"A": "320", "B": "324", "C": "322", "D": "3"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  464,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 13 snack packs at ₹23 each. What is the total cost?',
  'mcq',
  '{"A": "322", "B": "299", "C": "36", "D": "276"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  465,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a solar power competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "1 win, 4 draws", "B": "3 wins, 0 draw", "C": "3 wins, 1 draw", "D": "4 wins, 1 draw"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  466,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a creator economy quiz are: 62, 50, 11, 67, 88. What is the median score?',
  'mcq',
  '{"A": "55", "B": "67", "C": "62", "D": "50"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  467,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 2, 13, 24, 35, ?',
  'mcq',
  '{"A": "57", "B": "46", "C": "255", "D": "35"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  468,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '5 volunteers finish 105 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "21", "B": "24", "C": "110", "D": "18"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  469,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=46, B=45, C=88. What is the total number of votes?',
  'mcq',
  '{"A": "189", "B": "169", "C": "179", "D": "88"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  470,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 5 snack packs at ₹111 each. What is the total cost?',
  'mcq',
  '{"A": "116", "B": "444", "C": "555", "D": "666"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  471,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 33, 24, 36, 39. What is the mean?',
  'mcq',
  '{"A": "132", "B": "33", "C": "35", "D": "31"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  472,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 32 minutes in traffic and 58 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "90", "B": "-26", "C": "-21", "D": "26"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  473,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 21, 26, 19, 24, 17, ?',
  'mcq',
  '{"A": "26", "B": "20", "C": "23", "D": "22"}'::jsonb,
  '"D"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  474,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 69, 52, 25, 58. What is the mean?',
  'mcq',
  '{"A": "53", "B": "204", "C": "51", "D": "49"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  475,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A digital payments platform reports that 40% of 300 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "120", "B": "90", "C": "40", "D": "150"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  476,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 12 snack packs at ₹104 each. What is the total cost?',
  'mcq',
  '{"A": "1352", "B": "1248", "C": "116", "D": "1144"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  477,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store had 124 orders in Week 1 and 89 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "213", "B": "45", "C": "35", "D": "124"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  478,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a recycling survey of 589 teens, 60 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "60", "B": "649", "C": "549", "D": "529"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  479,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '570 tasks are shared equally among 10 students in a cyber safety club. How many tasks per student?',
  'mcq',
  '{"A": "57", "B": "59", "C": "55", "D": "10"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  480,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '453 tasks are shared equally among 3 students in a EV club. How many tasks per student?',
  'mcq',
  '{"A": "151", "B": "149", "C": "3", "D": "153"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  481,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power event needs 8 badges per team. If there are 5 teams, how many badges are needed?',
  'mcq',
  '{"A": "48", "B": "32", "C": "40", "D": "13"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  482,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹557 budget. They buy 2 subscriptions at ₹125 each. How much money is left?',
  'mcq',
  '{"A": "-307", "B": "807", "C": "432", "D": "307"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  483,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV event needs 10 badges per team. If there are 6 teams, how many badges are needed?',
  'mcq',
  '{"A": "16", "B": "70", "C": "50", "D": "60"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  484,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a fitness challenge quiz are: 34, 27, 82, 70, 67. What is the median score?',
  'mcq',
  '{"A": "56", "B": "34", "C": "67", "D": "70"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  485,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 613% at start and drops by 296 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "317", "B": "909", "C": "327", "D": "296"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  486,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A sports analytics store had 121 orders in Week 1 and 149 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "38", "B": "149", "C": "28", "D": "270"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  487,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A delivery platform reports that 15% of 500 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "125", "B": "25", "C": "75", "D": "15"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  488,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 6 L/min and 6 L/min. A leak drains 7 L/min. Starting empty, how much water after 7 minutes?',
  'mcq',
  '{"A": "133", "B": "49", "C": "84", "D": "35"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  489,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A public transport store had 83 orders in Week 1 and 123 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "123", "B": "206", "C": "50", "D": "40"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  490,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 55 students. At each of 4 stops, 10 get off and 7 get on. How many students after the last stop?',
  'mcq',
  '{"A": "123", "B": "52", "C": "67", "D": "43"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  491,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 11 snack packs at ₹93 each. What is the total cost?',
  'mcq',
  '{"A": "930", "B": "1023", "C": "104", "D": "1116"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  492,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV store sold 872 items on Monday and 819 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1691", "B": "53", "C": "1641", "D": "1741"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  493,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV event needs 5 badges per team. If there are 14 teams, how many badges are needed?',
  'mcq',
  '{"A": "70", "B": "75", "C": "65", "D": "19"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  494,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 78 is divided by 5, what is the remainder?',
  'mcq',
  '{"A": "3", "B": "4", "C": "985", "D": "5"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  495,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=112, B=65, C=103. What is the total number of votes?',
  'mcq',
  '{"A": "270", "B": "280", "C": "290", "D": "112"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  496,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 4 snack packs at ₹45 each. What is the total cost?',
  'mcq',
  '{"A": "49", "B": "225", "C": "180", "D": "135"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  497,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 96 is divided by 7, what is the remainder?',
  'mcq',
  '{"A": "6", "B": "951", "C": "5", "D": "7"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  498,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 29 is divided by 7, what is the remainder?',
  'mcq',
  '{"A": "3", "B": "6", "C": "2", "D": "1"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  499,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A public transport platform reports that 20% of 1000 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "300", "B": "20", "C": "100", "D": "200"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  500,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 9 L/min and 6 L/min. A leak drains 3 L/min. Starting empty, how much water after 9 minutes?',
  'mcq',
  '{"A": "162", "B": "27", "C": "108", "D": "135"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  501,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 16 snack packs at ₹99 each. What is the total cost?',
  'mcq',
  '{"A": "1584", "B": "1485", "C": "115", "D": "1683"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  502,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '5 volunteers finish 80 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "13", "B": "85", "C": "19", "D": "16"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  503,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 39, 55, 60, 30. What is the average?',
  'mcq',
  '{"A": "41", "B": "51", "C": "46", "D": "184"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  504,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 1112 subscribers and gained 10% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "166", "B": "1122", "C": "1102", "D": "111"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  505,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a recycling survey of 289 teens, 40 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "40", "B": "329", "C": "269", "D": "249"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  506,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 52 students. At each of 2 stops, 8 get off and 4 get on. How many students after the last stop?',
  'mcq',
  '{"A": "76", "B": "60", "C": "48", "D": "44"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  507,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media event needs 5 badges per team. If there are 11 teams, how many badges are needed?',
  'mcq',
  '{"A": "55", "B": "50", "C": "16", "D": "60"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  508,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=53, B=44, C=52. What is the total number of votes?',
  'mcq',
  '{"A": "159", "B": "149", "C": "139", "D": "53"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  509,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 81 minutes in traffic and 52 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "-29", "B": "29", "C": "34", "D": "133"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  510,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '255 tasks are shared equally among 3 students in a gaming club. How many tasks per student?',
  'mcq',
  '{"A": "3", "B": "85", "C": "83", "D": "87"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  511,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹562 budget. They buy 6 subscriptions at ₹95 each. How much money is left?',
  'mcq',
  '{"A": "-8", "B": "8", "C": "467", "D": "1132"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  512,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 64 items. 21 were returned and 14 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "50", "B": "29", "C": "43", "D": "71"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  513,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 35 students. At each of 3 stops, 8 get off and 3 get on. How many students after the last stop?',
  'mcq',
  '{"A": "68", "B": "30", "C": "20", "D": "50"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  514,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 10, 15, 8, 13, 6, ?',
  'mcq',
  '{"A": "15", "B": "11", "C": "12", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  515,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 12, 17, 10, 15, 8, ?',
  'mcq',
  '{"A": "14", "B": "11", "C": "17", "D": "13"}'::jsonb,
  '"D"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  516,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 6, 8, 10, 12, ?',
  'mcq',
  '{"A": "12", "B": "163", "C": "16", "D": "14"}'::jsonb,
  '"D"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  517,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=87, B=67, C=66. What is the total number of votes?',
  'mcq',
  '{"A": "220", "B": "87", "C": "210", "D": "230"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  518,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 31 minutes in traffic and 63 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "94", "B": "32", "C": "-32", "D": "-27"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  519,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 800 packets and lost 20%. How many packets were received?',
  'mcq',
  '{"A": "960", "B": "640", "C": "160", "D": "780"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  520,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 400 packets and lost 20%. How many packets were received?',
  'mcq',
  '{"A": "80", "B": "380", "C": "480", "D": "320"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  521,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 182 is divided by 8, what is the remainder?',
  'mcq',
  '{"A": "6", "B": "84", "C": "7", "D": "8"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  522,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A gaming platform reports that 10% of 1000 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "0", "B": "10", "C": "200", "D": "100"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  523,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 65 is divided by 6, what is the remainder?',
  'mcq',
  '{"A": "7", "B": "244", "C": "5", "D": "6"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  524,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=105, B=120, C=79. What is the total number of votes?',
  'mcq',
  '{"A": "304", "B": "120", "C": "314", "D": "294"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  525,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store had 108 orders in Week 1 and 115 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "17", "B": "223", "C": "7", "D": "115"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  526,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 32 and 34 minutes with 10 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "2", "B": "56", "C": "66", "D": "76"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  527,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 134 items. 19 were returned and 22 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "93", "B": "115", "C": "112", "D": "131"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  528,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 15 L/min and 12 L/min. A leak drains 10 L/min. Starting empty, how much water after 10 minutes?',
  'mcq',
  '{"A": "170", "B": "370", "C": "100", "D": "270"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  529,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a solar power survey of 553 teens, 60 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "513", "B": "613", "C": "493", "D": "60"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  530,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 23 and 34 minutes with 14 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "57", "B": "11", "C": "71", "D": "43"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  531,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 30 students. At each of 3 stops, 8 get off and 4 get on. How many students after the last stop?',
  'mcq',
  '{"A": "18", "B": "42", "C": "26", "D": "66"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  532,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 25, 65, 51, 23. What is the mean?',
  'mcq',
  '{"A": "39", "B": "164", "C": "43", "D": "41"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  533,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹464 budget. They buy 3 subscriptions at ₹91 each. How much money is left?',
  'mcq',
  '{"A": "737", "B": "-191", "C": "191", "D": "373"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  534,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 18 after multiplying by 2. The result is 50. What was the original number?',
  'mcq',
  '{"A": "16", "B": "15", "C": "32", "D": "17"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  535,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 6, 14, 22, 30, ?',
  'mcq',
  '{"A": "729", "B": "30", "C": "38", "D": "46"}'::jsonb,
  '"C"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  536,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 578 subscribers and gained 25% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "553", "B": "144", "C": "173", "D": "603"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  537,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A delivery platform reports that 50% of 250 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "150", "B": "50", "C": "100", "D": "125"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  538,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media store had 114 orders in Week 1 and 136 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "136", "B": "32", "C": "22", "D": "250"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  539,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 107 minutes in traffic and 28 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "84", "B": "-79", "C": "79", "D": "135"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  540,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 41, 20, 42, 41. What is the average?',
  'mcq',
  '{"A": "41", "B": "31", "C": "36", "D": "144"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  541,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A digital payments store had 83 orders in Week 1 and 115 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "198", "B": "115", "C": "32", "D": "42"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  542,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 101 is divided by 3, what is the remainder?',
  'mcq',
  '{"A": "4", "B": "3", "C": "2", "D": "269"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  543,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 30 and 24 minutes with 13 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "41", "B": "54", "C": "67", "D": "6"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  544,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹679 budget. They buy 4 subscriptions at ₹54 each. How much money is left?',
  'mcq',
  '{"A": "625", "B": "895", "C": "463", "D": "-463"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  545,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 11 snack packs at ₹42 each. What is the total cost?',
  'mcq',
  '{"A": "462", "B": "420", "C": "504", "D": "53"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  546,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 500 packets and lost 10%. How many packets were received?',
  'mcq',
  '{"A": "450", "B": "50", "C": "550", "D": "490"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  547,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 40 and 42 minutes with 8 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "82", "B": "90", "C": "74", "D": "2"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  548,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A fitness challenge platform reports that 40% of 400 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "40", "B": "120", "C": "160", "D": "200"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  549,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power event needs 12 badges per team. If there are 11 teams, how many badges are needed?',
  'mcq',
  '{"A": "144", "B": "132", "C": "23", "D": "120"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  550,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹27 per month. If the total for 6 months is ₹282, what is the monthly charge?',
  'mcq',
  '{"A": "22", "B": "27", "C": "32", "D": "162"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  551,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 608 subscribers and gained 20% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "152", "B": "628", "C": "121", "D": "588"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  552,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹401 budget. They buy 6 subscriptions at ₹97 each. How much money is left?',
  'mcq',
  '{"A": "983", "B": "181", "C": "-181", "D": "304"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  553,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 37, 60, 51, 32. What is the mean?',
  'mcq',
  '{"A": "45", "B": "180", "C": "47", "D": "43"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  554,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a delivery competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "4 wins, 1 draw", "B": "1 win, 4 draws", "C": "3 wins, 0 draw", "D": "3 wins, 1 draw"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  555,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 11 after multiplying by 3. The result is 26. What was the original number?',
  'mcq',
  '{"A": "5", "B": "15", "C": "6", "D": "4"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  556,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a online classes competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "3 wins, 1 draw", "B": "3 wins, 0 draw", "C": "1 win, 4 draws", "D": "4 wins, 1 draw"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  557,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=47, B=63, C=99. What is the total number of votes?',
  'mcq',
  '{"A": "199", "B": "209", "C": "99", "D": "219"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  558,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 70 items. 15 were returned and 17 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "55", "B": "53", "C": "38", "D": "68"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  559,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 6, 8, and 2 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "16", "B": "96", "C": "14", "D": "10"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  560,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media event needs 8 badges per team. If there are 11 teams, how many badges are needed?',
  'mcq',
  '{"A": "80", "B": "19", "C": "88", "D": "96"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  561,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 40, 24, 34, 74. What is the mean?',
  'mcq',
  '{"A": "172", "B": "43", "C": "41", "D": "45"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  562,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV store had 127 orders in Week 1 and 99 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "38", "B": "226", "C": "28", "D": "127"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  563,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹549 budget. They buy 3 subscriptions at ₹121 each. How much money is left?',
  'mcq',
  '{"A": "-186", "B": "912", "C": "428", "D": "186"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  564,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 20 students. At each of 4 stops, 7 get off and 2 get on. How many students after the last stop?',
  'mcq',
  '{"A": "40", "B": "15", "C": "0", "D": "56"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  565,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A fitness challenge run is 24 km long. How many meters is that?',
  'mcq',
  '{"A": "2400", "B": "26400", "C": "240000", "D": "24000"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  566,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a app survey of 622 teens, 60 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "562", "B": "582", "C": "60", "D": "682"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  567,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A smartwatch store sold 427 items on Monday and 784 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1211", "B": "1261", "C": "1161", "D": "-357"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  568,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 3, 3, and 1 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "6", "B": "7", "C": "9", "D": "4"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  569,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 83 minutes in traffic and 67 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "21", "B": "-16", "C": "150", "D": "16"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  570,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 12 L/min and 10 L/min. A leak drains 3 L/min. Starting empty, how much water after 9 minutes?',
  'mcq',
  '{"A": "171", "B": "198", "C": "27", "D": "225"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  571,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A public transport run is 26 km long. How many meters is that?',
  'mcq',
  '{"A": "26000", "B": "2600", "C": "260000", "D": "28600"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  572,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media store sold 353 items on Monday and 702 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1005", "B": "-349", "C": "1105", "D": "1055"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  573,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 54 minutes in traffic and 74 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "20", "B": "-20", "C": "-15", "D": "128"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  574,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A app store had 129 orders in Week 1 and 79 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "60", "B": "50", "C": "129", "D": "208"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  575,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A digital payments platform reports that 12% of 300 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "12", "B": "36", "C": "66", "D": "6"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  576,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 994% at start and drops by 184 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "810", "B": "184", "C": "820", "D": "1178"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  577,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store sold 699 items on Monday and 193 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "892", "B": "842", "C": "942", "D": "506"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  578,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 43 students. At each of 2 stops, 3 get off and 6 get on. How many students after the last stop?',
  'mcq',
  '{"A": "61", "B": "49", "C": "37", "D": "46"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  579,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 174 is divided by 9, what is the remainder?',
  'mcq',
  '{"A": "4", "B": "5", "C": "8", "D": "3"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  580,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 292% at start and drops by 253 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "49", "B": "39", "C": "545", "D": "253"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  581,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹832 budget. They buy 5 subscriptions at ₹115 each. How much money is left?',
  'mcq',
  '{"A": "-257", "B": "1407", "C": "717", "D": "257"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  582,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a EV survey of 246 teens, 90 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "336", "B": "90", "C": "156", "D": "176"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  583,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a gaming survey of 360 teens, 40 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "40", "B": "340", "C": "400", "D": "320"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  584,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A cyber safety store had 112 orders in Week 1 and 123 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "123", "B": "11", "C": "235", "D": "21"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  585,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A fitness challenge store sold 1350 items on Monday and 150 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1500", "B": "1450", "C": "1200", "D": "1550"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  586,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 6, 11, 16, 21, ?',
  'mcq',
  '{"A": "26", "B": "884", "C": "31", "D": "21"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  587,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A cyber safety platform reports that 25% of 200 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "50", "B": "30", "C": "70", "D": "25"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  588,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A recycling store had 102 orders in Week 1 and 81 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "102", "B": "183", "C": "31", "D": "21"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  589,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '4 volunteers finish 96 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "100", "B": "24", "C": "21", "D": "27"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  590,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A sports analytics run is 8 km long. How many meters is that?',
  'mcq',
  '{"A": "800", "B": "80000", "C": "8000", "D": "8800"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  591,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 379% at start and drops by 87 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "302", "B": "87", "C": "292", "D": "466"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  592,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 800 packets and lost 15%. How many packets were received?',
  'mcq',
  '{"A": "785", "B": "680", "C": "120", "D": "920"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  593,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 49 is divided by 3, what is the remainder?',
  'mcq',
  '{"A": "1", "B": "1027", "C": "3", "D": "2"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  594,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 38 students. At each of 2 stops, 10 get off and 4 get on. How many students after the last stop?',
  'mcq',
  '{"A": "50", "B": "32", "C": "26", "D": "66"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  595,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a online classes survey of 277 teens, 50 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "327", "B": "227", "C": "247", "D": "50"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  596,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 64 minutes in traffic and 36 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "-28", "B": "28", "C": "33", "D": "100"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  597,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A e-commerce store had 116 orders in Week 1 and 90 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "36", "B": "206", "C": "26", "D": "116"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  598,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 4, 6, and 2 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "10", "B": "48", "C": "12", "D": "8"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  599,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A EV event needs 11 badges per team. If there are 9 teams, how many badges are needed?',
  'mcq',
  '{"A": "88", "B": "20", "C": "110", "D": "99"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  600,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 23, 59, 46, 32. What is the average?',
  'mcq',
  '{"A": "40", "B": "160", "C": "35", "D": "45"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  601,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 11 L/min and 6 L/min. A leak drains 5 L/min. Starting empty, how much water after 5 minutes?',
  'mcq',
  '{"A": "85", "B": "25", "C": "110", "D": "60"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  602,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '3 volunteers finish 72 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "75", "B": "27", "C": "24", "D": "21"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  603,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 88 minutes in traffic and 75 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "18", "B": "13", "C": "163", "D": "-13"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  604,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A online classes platform reports that 15% of 1000 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "150", "B": "250", "C": "50", "D": "15"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  605,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 179 items. 20 were returned and 14 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "145", "B": "185", "C": "165", "D": "159"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  606,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 400 packets and lost 15%. How many packets were received?',
  'mcq',
  '{"A": "385", "B": "60", "C": "460", "D": "340"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  607,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 675 subscribers and gained 25% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "650", "B": "202", "C": "700", "D": "168"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  608,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 143 is divided by 7, what is the remainder?',
  'mcq',
  '{"A": "4", "B": "6", "C": "5", "D": "3"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  609,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A public transport run is 25 km long. How many meters is that?',
  'mcq',
  '{"A": "250000", "B": "2500", "C": "27500", "D": "25000"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  610,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A social media store sold 707 items on Monday and 129 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "836", "B": "786", "C": "886", "D": "578"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  611,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 23 students. At each of 3 stops, 7 get off and 4 get on. How many students after the last stop?',
  'mcq',
  '{"A": "32", "B": "56", "C": "20", "D": "14"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  612,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 50 and 29 minutes with 9 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "70", "B": "88", "C": "79", "D": "21"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  613,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a robotics club competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "4 wins, 1 draw", "B": "3 wins, 1 draw", "C": "1 win, 4 draws", "D": "3 wins, 0 draw"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  614,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 168 is divided by 3, what is the remainder?',
  'mcq',
  '{"A": "332", "B": "0", "C": "1", "D": "2"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  615,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=105, B=120, C=89. What is the total number of votes?',
  'mcq',
  '{"A": "304", "B": "324", "C": "314", "D": "120"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  616,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 76 minutes in traffic and 27 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "103", "B": "-49", "C": "49", "D": "54"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  617,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 64 items. 22 were returned and 7 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "57", "B": "79", "C": "42", "D": "35"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  618,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 129 is divided by 9, what is the remainder?',
  'mcq',
  '{"A": "4", "B": "3", "C": "8", "D": "5"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  619,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '5 volunteers finish 90 stickers equally. How many stickers does each volunteer get?',
  'mcq',
  '{"A": "18", "B": "15", "C": "95", "D": "21"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  620,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 666% at start and drops by 135 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "531", "B": "801", "C": "135", "D": "541"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  621,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 15 L/min and 13 L/min. A leak drains 9 L/min. Starting empty, how much water after 4 minutes?',
  'mcq',
  '{"A": "112", "B": "76", "C": "36", "D": "148"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  622,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 52 items. 5 were returned and 10 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "47", "B": "42", "C": "37", "D": "256"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  623,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹543 budget. They buy 2 subscriptions at ₹99 each. How much money is left?',
  'mcq',
  '{"A": "-345", "B": "741", "C": "444", "D": "345"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  624,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 46 items. 25 were returned and 25 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "21", "B": "-4", "C": "233", "D": "46"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  625,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A cyber safety run is 22 km long. How many meters is that?',
  'mcq',
  '{"A": "22000", "B": "24200", "C": "220000", "D": "2200"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  626,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 55 items. 20 were returned and 24 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "35", "B": "51", "C": "31", "D": "11"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  627,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 71, 23, 55, 39. What is the mean?',
  'mcq',
  '{"A": "45", "B": "188", "C": "47", "D": "49"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  628,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 186 is divided by 4, what is the remainder?',
  'mcq',
  '{"A": "612", "B": "3", "C": "2", "D": "4"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  629,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a delivery survey of 839 teens, 80 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "80", "B": "919", "C": "779", "D": "759"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  630,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 800 packets and lost 5%. How many packets were received?',
  'mcq',
  '{"A": "795", "B": "840", "C": "760", "D": "40"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  631,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 126 minutes in traffic and 58 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "-68", "B": "73", "C": "68", "D": "184"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  632,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 26, 59, 46, 21. What is the average?',
  'mcq',
  '{"A": "33", "B": "152", "C": "38", "D": "43"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  633,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 21 and 36 minutes with 7 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "64", "B": "57", "C": "50", "D": "15"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  634,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A recycling platform reports that 15% of 1000 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "250", "B": "150", "C": "50", "D": "15"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  635,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A robotics club store had 96 orders in Week 1 and 77 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "19", "B": "96", "C": "173", "D": "29"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  636,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store had 70 orders in Week 1 and 79 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "19", "B": "9", "C": "79", "D": "149"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  637,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=45, B=45, C=111. What is the total number of votes?',
  'mcq',
  '{"A": "191", "B": "201", "C": "111", "D": "211"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  638,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 33, 66, 26, 47. What is the mean?',
  'mcq',
  '{"A": "43", "B": "41", "C": "45", "D": "172"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  639,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A delivery event needs 5 badges per team. If there are 8 teams, how many badges are needed?',
  'mcq',
  '{"A": "40", "B": "13", "C": "35", "D": "45"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  640,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹29 per month. If the total for 6 months is ₹294, what is the monthly charge?',
  'mcq',
  '{"A": "34", "B": "24", "C": "29", "D": "174"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  641,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 48, 34, 34, 80. What is the mean?',
  'mcq',
  '{"A": "51", "B": "47", "C": "49", "D": "196"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  642,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a social media survey of 407 teens, 40 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "447", "B": "40", "C": "387", "D": "367"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  643,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A cyber safety event needs 8 badges per team. If there are 7 teams, how many badges are needed?',
  'mcq',
  '{"A": "15", "B": "48", "C": "56", "D": "64"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  644,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Sequence: 35, 40, 33, 38, 31, ?',
  'mcq',
  '{"A": "36", "B": "40", "C": "37", "D": "34"}'::jsonb,
  '"A"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  645,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 587 subscribers and gained 15% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "88", "B": "572", "C": "602", "D": "117"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  646,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 21 students. At each of 3 stops, 4 get off and 8 get on. How many students after the last stop?',
  'mcq',
  '{"A": "9", "B": "25", "C": "33", "D": "57"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  647,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 10 L/min and 5 L/min. A leak drains 9 L/min. Starting empty, how much water after 8 minutes?',
  'mcq',
  '{"A": "72", "B": "120", "C": "192", "D": "48"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  648,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 53, 52, 41, 22. What is the average?',
  'mcq',
  '{"A": "42", "B": "47", "C": "37", "D": "168"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  649,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A digital payments run is 8 km long. How many meters is that?',
  'mcq',
  '{"A": "8800", "B": "8000", "C": "80000", "D": "800"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  650,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 32, 47, 69, 52. What is the mean?',
  'mcq',
  '{"A": "48", "B": "50", "C": "200", "D": "52"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  651,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A subscription costs ₹120 plus ₹18 per month. If the total for 6 months is ₹228, what is the monthly charge?',
  'mcq',
  '{"A": "23", "B": "18", "C": "13", "D": "108"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  652,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 668% at start and drops by 427 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "241", "B": "1095", "C": "427", "D": "251"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  653,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a gaming survey of 357 teens, 35 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "342", "B": "35", "C": "322", "D": "392"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  654,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 151 items. 16 were returned and 14 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "153", "B": "137", "C": "135", "D": "121"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  655,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 3, 4, and 3 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "36", "B": "115", "C": "10", "D": "7"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  656,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 125 minutes in traffic and 66 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "191", "B": "59", "C": "-59", "D": "64"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  657,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 22 and 29 minutes with 5 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "46", "B": "7", "C": "51", "D": "56"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  658,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 24, 44, 46, 54. What is the average?',
  'mcq',
  '{"A": "37", "B": "42", "C": "47", "D": "168"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  659,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Daily steps (in thousands) recorded are: 71, 36, 57, 80. What is the mean?',
  'mcq',
  '{"A": "63", "B": "59", "C": "61", "D": "244"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  660,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A online classes store had 86 orders in Week 1 and 142 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "66", "B": "56", "C": "228", "D": "142"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  661,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store had 146 orders in Week 1 and 63 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "83", "B": "146", "C": "93", "D": "209"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  662,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power store had 68 orders in Week 1 and 59 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "68", "B": "9", "C": "127", "D": "19"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  663,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A recycling event needs 8 badges per team. If there are 13 teams, how many badges are needed?',
  'mcq',
  '{"A": "21", "B": "112", "C": "96", "D": "104"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  664,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power run is 19 km long. How many meters is that?',
  'mcq',
  '{"A": "1900", "B": "19000", "C": "190000", "D": "20900"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  665,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A app store sold 197 items on Monday and 1200 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1397", "B": "1347", "C": "-1003", "D": "1447"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  666,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A sports analytics run is 16 km long. How many meters is that?',
  'mcq',
  '{"A": "17600", "B": "160000", "C": "1600", "D": "16000"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  667,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹332 budget. They buy 5 subscriptions at ₹121 each. How much money is left?',
  'mcq',
  '{"A": "937", "B": "273", "C": "211", "D": "-273"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  668,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a gaming survey of 803 teens, 90 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "713", "B": "90", "C": "733", "D": "893"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  669,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 16 snack packs at ₹62 each. What is the total cost?',
  'mcq',
  '{"A": "930", "B": "1054", "C": "992", "D": "78"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  670,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A cyber safety store had 141 orders in Week 1 and 133 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "141", "B": "18", "C": "8", "D": "274"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  671,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 76 items. 21 were returned and 7 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "48", "B": "69", "C": "90", "D": "55"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  672,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=75, B=50, C=86. What is the total number of votes?',
  'mcq',
  '{"A": "221", "B": "201", "C": "86", "D": "211"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  673,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=62, B=84, C=55. What is the total number of votes?',
  'mcq',
  '{"A": "211", "B": "201", "C": "84", "D": "191"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  674,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 501 subscribers and gained 20% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "521", "B": "125", "C": "100", "D": "481"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  675,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a EV competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "3 wins, 1 draw", "B": "1 win, 4 draws", "C": "4 wins, 1 draw", "D": "3 wins, 0 draw"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  676,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 700 subscribers and gained 15% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "105", "B": "715", "C": "685", "D": "140"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  677,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹470 budget. They buy 6 subscriptions at ₹72 each. How much money is left?',
  'mcq',
  '{"A": "398", "B": "902", "C": "-38", "D": "38"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  678,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 90 minutes in traffic and 76 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "166", "B": "14", "C": "19", "D": "-14"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  679,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A fitness challenge event needs 10 badges per team. If there are 15 teams, how many badges are needed?',
  'mcq',
  '{"A": "140", "B": "25", "C": "160", "D": "150"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  680,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A smartwatch platform reports that 40% of 300 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "150", "B": "40", "C": "90", "D": "120"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  681,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 600 packets and lost 15%. How many packets were received?',
  'mcq',
  '{"A": "90", "B": "690", "C": "510", "D": "585"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  682,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A solar power event needs 7 badges per team. If there are 3 teams, how many badges are needed?',
  'mcq',
  '{"A": "21", "B": "14", "C": "10", "D": "28"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  683,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A gaming store sold 1057 items on Monday and 1006 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "51", "B": "2013", "C": "2063", "D": "2113"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  684,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'When 107 is divided by 3, what is the remainder?',
  'mcq',
  '{"A": "728", "B": "2", "C": "3", "D": "4"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  685,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=108, B=67, C=82. What is the total number of votes?',
  'mcq',
  '{"A": "108", "B": "267", "C": "247", "D": "257"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  686,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 21 and 15 minutes with 13 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "6", "B": "49", "C": "23", "D": "36"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  687,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 27 and 27 minutes with 14 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "54", "B": "40", "C": "0", "D": "68"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  688,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 27 students. At each of 3 stops, 5 get off and 7 get on. How many students after the last stop?',
  'mcq',
  '{"A": "63", "B": "33", "C": "21", "D": "29"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  689,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A recycling run is 16 km long. How many meters is that?',
  'mcq',
  '{"A": "16000", "B": "1600", "C": "160000", "D": "17600"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  690,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Find the next number: 9, 18, 27, 36, ?',
  'mcq',
  '{"A": "291", "B": "36", "C": "54", "D": "45"}'::jsonb,
  '"D"'::jsonb,
  'Pattern, analogy, and symbolic reasoning.',
  691,
  true,
  '{"grade": 10, "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=53, B=58, C=88. What is the total number of votes?',
  'mcq',
  '{"A": "199", "B": "209", "C": "189", "D": "88"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  692,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 15 snack packs at ₹96 each. What is the total cost?',
  'mcq',
  '{"A": "111", "B": "1344", "C": "1440", "D": "1536"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  693,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A network sent 200 packets and lost 15%. How many packets were received?',
  'mcq',
  '{"A": "230", "B": "170", "C": "185", "D": "30"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  694,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 4, 6, and 1 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "11", "B": "10", "C": "24", "D": "7"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  695,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 28 students. At each of 3 stops, 3 get off and 6 get on. How many students after the last stop?',
  'mcq',
  '{"A": "37", "B": "31", "C": "55", "D": "19"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  696,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A canteen buys 11 snack packs at ₹89 each. What is the total cost?',
  'mcq',
  '{"A": "979", "B": "890", "C": "1068", "D": "100"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  697,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a social media competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "3 wins, 0 draw", "B": "4 wins, 1 draw", "C": "3 wins, 1 draw", "D": "1 win, 4 draws"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  698,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '325 tasks are shared equally among 5 students in a cyber safety club. How many tasks per student?',
  'mcq',
  '{"A": "5", "B": "67", "C": "63", "D": "65"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  699,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=76, B=77, C=70. What is the total number of votes?',
  'mcq',
  '{"A": "213", "B": "223", "C": "77", "D": "233"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  700,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 39 students. At each of 3 stops, 3 get off and 8 get on. How many students after the last stop?',
  'mcq',
  '{"A": "24", "B": "54", "C": "44", "D": "72"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  701,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 25, 24, 25, 42. What is the average?',
  'mcq',
  '{"A": "34", "B": "29", "C": "116", "D": "24"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  702,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a gaming survey of 272 teens, 100 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "100", "B": "372", "C": "172", "D": "192"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  703,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 311% at start and drops by 68 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "243", "B": "68", "C": "379", "D": "253"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  704,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 15 L/min and 13 L/min. A leak drains 7 L/min. Starting empty, how much water after 6 minutes?',
  'mcq',
  '{"A": "168", "B": "126", "C": "210", "D": "42"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  705,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 1016% at start and drops by 91 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "1107", "B": "925", "C": "935", "D": "91"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  706,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A fitness challenge store sold 174 items on Monday and 488 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "612", "B": "712", "C": "662", "D": "-314"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  707,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A app store had 132 orders in Week 1 and 77 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "209", "B": "65", "C": "55", "D": "132"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  708,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '288 tasks are shared equally among 4 students in a recycling club. How many tasks per student?',
  'mcq',
  '{"A": "74", "B": "72", "C": "4", "D": "70"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  709,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A student has ₹647 budget. They buy 4 subscriptions at ₹52 each. How much money is left?',
  'mcq',
  '{"A": "439", "B": "-439", "C": "595", "D": "855"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  710,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 35 and 24 minutes with 10 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "59", "B": "69", "C": "49", "D": "11"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  711,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A bus starts with 20 students. At each of 2 stops, 9 get off and 4 get on. How many students after the last stop?',
  'mcq',
  '{"A": "15", "B": "46", "C": "30", "D": "10"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  712,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 5, 8, and 4 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "13", "B": "17", "C": "12", "D": "160"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  713,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A app store sold 779 items on Monday and 1059 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1838", "B": "1788", "C": "1888", "D": "-280"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  714,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '1050 tasks are shared equally among 10 students in a digital payments club. How many tasks per student?',
  'mcq',
  '{"A": "10", "B": "103", "C": "107", "D": "105"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  715,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 2, 6, and 5 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "13", "B": "11", "C": "8", "D": "60"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  716,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A delivery store had 85 orders in Week 1 and 74 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "21", "B": "85", "C": "159", "D": "11"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  717,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A smartwatch store had 74 orders in Week 1 and 76 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "76", "B": "12", "C": "2", "D": "150"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  718,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 71 minutes in traffic and 72 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "-1", "B": "4", "C": "1", "D": "143"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  719,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 10 L/min and 13 L/min. A leak drains 7 L/min. Starting empty, how much water after 10 minutes?',
  'mcq',
  '{"A": "160", "B": "230", "C": "300", "D": "70"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  720,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=103, B=76, C=101. What is the total number of votes?',
  'mcq',
  '{"A": "280", "B": "103", "C": "270", "D": "290"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  721,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 6, 3, and 3 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "6", "B": "12", "C": "54", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  722,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a delivery quiz are: 43, 59, 49, 57, 84. What is the median score?',
  'mcq',
  '{"A": "59", "B": "58", "C": "57", "D": "49"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  723,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A ride takes 140 minutes in traffic and 88 minutes without traffic. What is the time saved without traffic?',
  'mcq',
  '{"A": "-52", "B": "57", "C": "52", "D": "228"}'::jsonb,
  '"C"'::jsonb,
  'Real-world quantitative computation with integers.',
  724,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A code adds 18 after multiplying by 5. The result is 93. What was the original number?',
  'mcq',
  '{"A": "16", "B": "15", "C": "14", "D": "75"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  725,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a gaming survey of 282 teens, 20 preferred option A. How many did NOT choose option A?',
  'mcq',
  '{"A": "262", "B": "20", "C": "282", "D": "302"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  726,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 11 L/min and 11 L/min. A leak drains 5 L/min. Starting empty, how much water after 6 minutes?',
  'mcq',
  '{"A": "132", "B": "30", "C": "162", "D": "102"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  727,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A poll shows votes: A=101, B=85, C=109. What is the total number of votes?',
  'mcq',
  '{"A": "305", "B": "295", "C": "285", "D": "109"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  728,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 7 L/min and 12 L/min. A leak drains 9 L/min. Starting empty, how much water after 4 minutes?',
  'mcq',
  '{"A": "112", "B": "76", "C": "36", "D": "40"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  729,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 6, 7, and 2 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "13", "B": "9", "C": "15", "D": "84"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  730,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Scores in a sports analytics quiz are: 32, 99, 19, 82, 99. What is the median score?',
  'mcq',
  '{"A": "32", "B": "99", "C": "82", "D": "66"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  731,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online channel had 1325 subscribers and gained 10% in a month. How many new subscribers joined?',
  'mcq',
  '{"A": "1335", "B": "132", "C": "1315", "D": "198"}'::jsonb,
  '"B"'::jsonb,
  'Real-world quantitative computation with integers.',
  732,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A robotics club platform reports that 30% of 300 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "90", "B": "60", "C": "120", "D": "30"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  733,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 6, 6, and 1 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "7", "B": "36", "C": "12", "D": "13"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  734,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A phone battery shows 1088% at start and drops by 875 percentage points. What is the new percentage?',
  'mcq',
  '{"A": "213", "B": "875", "C": "1963", "D": "223"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  735,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A public transport store had 137 orders in Week 1 and 61 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "86", "B": "137", "C": "198", "D": "76"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  736,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 34 and 25 minutes with 15 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "74", "B": "9", "C": "59", "D": "44"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  737,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 13 L/min and 7 L/min. A leak drains 5 L/min. Starting empty, how much water after 8 minutes?',
  'mcq',
  '{"A": "120", "B": "40", "C": "160", "D": "200"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  738,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 2, 4, and 4 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "8", "B": "32", "C": "6", "D": "10"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  739,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two online classes last 46 and 42 minutes with 5 minutes overlap. Total unique time spent?',
  'mcq',
  '{"A": "4", "B": "88", "C": "83", "D": "93"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  740,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'In a e-commerce competition, points are: Win=3, Draw=1, Loss=0. A team has 10 points. Which could be a valid (wins, draws) pair?',
  'mcq',
  '{"A": "3 wins, 1 draw", "B": "4 wins, 1 draw", "C": "1 win, 4 draws", "D": "3 wins, 0 draw"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  741,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A online classes event needs 5 badges per team. If there are 12 teams, how many badges are needed?',
  'mcq',
  '{"A": "55", "B": "65", "C": "17", "D": "60"}'::jsonb,
  '"D"'::jsonb,
  'Real-world quantitative computation with integers.',
  742,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Two pipes fill a tank at 7 L/min and 6 L/min. A leak drains 9 L/min. Starting empty, how much water after 9 minutes?',
  'mcq',
  '{"A": "117", "B": "81", "C": "36", "D": "198"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  743,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A cyber safety platform reports that 30% of 500 users are active daily. How many users are active daily?',
  'mcq',
  '{"A": "150", "B": "100", "C": "200", "D": "30"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  744,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A digital payments store sold 943 items on Monday and 591 on Tuesday. How many items were sold in total?',
  'mcq',
  '{"A": "1534", "B": "1584", "C": "1484", "D": "352"}'::jsonb,
  '"A"'::jsonb,
  'Real-world quantitative computation with integers.',
  745,
  true,
  '{"grade": 10, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A sports analytics store had 90 orders in Week 1 and 69 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "159", "B": "90", "C": "21", "D": "31"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  746,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Four daily screen-times (minutes) are 34, 48, 20, 26. What is the average?',
  'mcq',
  '{"A": "27", "B": "32", "C": "128", "D": "37"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step arithmetic/algebraic reasoning with integers.',
  747,
  true,
  '{"grade": 10, "dimension": "PS", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'An online shop sold 68 items. 28 were returned and 16 orders were cancelled. How many successful sales remain?',
  'mcq',
  '{"A": "24", "B": "40", "C": "52", "D": "80"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  748,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A workflow has 3 stages taking 2, 5, and 1 minutes per task. How long for 1 task to pass all stages?',
  'mcq',
  '{"A": "10", "B": "6", "C": "8", "D": "7"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step system scenarios with net effects and constraints.',
  749,
  true,
  '{"grade": 10, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'A public transport store had 132 orders in Week 1 and 136 orders in Week 2. How many more orders were there in the higher week?',
  'mcq',
  '{"A": "136", "B": "268", "C": "4", "D": "14"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting counts, averages, and percentages (integers only).',
  750,
  true,
  '{"grade": 10, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 105}'::jsonb
);
