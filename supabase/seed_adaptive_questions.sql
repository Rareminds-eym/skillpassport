-- Seed adaptive aptitude questions
-- Generated from Adaptive_Aptitude_QuestionBank_G6-8_400_CLEANED.xlsx

-- Create section for middle school

-- Insert adaptive aptitude section for Middle School (Grades 6-8)
INSERT INTO personal_assessment_sections (
  id, name, title, description, order_number, is_timed, 
  time_limit_seconds, is_active, grade_level, created_at, updated_at
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'adaptive_aptitude_middle',
  'Adaptive Aptitude - Middle School',
  'Adaptive aptitude assessment for middle school students (grades 6-8)',
  10,
  true,
  3600,
  true,
  'middle',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;


-- Insert questions

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 23 + 45?',
  'mcq',
  '{"A": "75", "B": "71", "C": "68", "D": "66"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 68.',
  1,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 89 + 21?',
  'mcq',
  '{"A": "108", "B": "113", "C": "110", "D": "117"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 110.',
  2,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 69 − 26?',
  'mcq',
  '{"A": "45", "B": "50", "C": "40", "D": "43"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 43.',
  3,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 66 ÷ 6?',
  'mcq',
  '{"A": "12", "B": "10", "C": "11", "D": "13"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 11.',
  4,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 64 ÷ 8?',
  'mcq',
  '{"A": "10", "B": "7", "C": "8", "D": "9"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 8.',
  5,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 68 + 22?',
  'mcq',
  '{"A": "90", "B": "97", "C": "88", "D": "93"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 90.',
  6,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 10% of 120?',
  'mcq',
  '{"A": "17", "B": "14", "C": "12", "D": "9"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 12.',
  7,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A rope is 6 meters long. How many centimeters is that?',
  'mcq',
  '{"A": "650", "B": "600", "C": "6000", "D": "60"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 600.',
  8,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 5.9 + 2.8?',
  'mcq',
  '{"A": "8.9", "B": "8.6", "C": "9.2", "D": "8.7"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 8.7.',
  9,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'The ratio of boys to girls is 5:4. If there are 25 boys, how many girls are there?',
  'mcq',
  '{"A": "30", "B": "20", "C": "25", "D": "15"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 20.',
  10,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'The ratio of boys to girls is 2:6. If there are 18 boys, how many girls are there?',
  'mcq',
  '{"A": "72", "B": "54", "C": "45", "D": "63"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 54.',
  11,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 25% of 100?',
  'mcq',
  '{"A": "25", "B": "22", "C": "30", "D": "27"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 25.',
  12,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 1.2 + 3.0?',
  'mcq',
  '{"A": "4.1", "B": "4.2", "C": "4.4", "D": "4.7"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 4.2.',
  13,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 25% of 60?',
  'mcq',
  '{"A": "20", "B": "12", "C": "15", "D": "17"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 15.',
  14,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A rope is 7 meters long. How many centimeters is that?',
  'mcq',
  '{"A": "7000", "B": "700", "C": "70", "D": "750"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 700.',
  15,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A rope is 2 meters long. How many centimeters is that?',
  'mcq',
  '{"A": "20", "B": "2000", "C": "250", "D": "200"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 200.',
  16,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Red:Blue marbles are in the ratio 5:2. If there are 14 blue marbles, how many red marbles are there?',
  'mcq',
  '{"A": "35", "B": "42", "C": "28", "D": "49"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 35.',
  17,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A number increases by 10% from 100. What is the new number?',
  'mcq',
  '{"A": "115", "B": "112", "C": "108", "D": "110"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 110.',
  18,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A number increases by 20% from 40. What is the new number?',
  'mcq',
  '{"A": "46", "B": "50", "C": "48", "D": "53"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 48.',
  19,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Red:Blue marbles are in the ratio 3:4. If there are 20 blue marbles, how many red marbles are there?',
  'mcq',
  '{"A": "25", "B": "20", "C": "10", "D": "15"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 15.',
  20,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Ravi has 15 stickers and gets 23 more. He gives away 9. How many stickers does he have now?',
  'mcq',
  '{"A": "34", "B": "27", "C": "29", "D": "31"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 29.',
  21,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Solve: x + 11 = 18',
  'mcq',
  '{"A": "8", "B": "9", "C": "6", "D": "7"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 7.',
  22,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Red:Blue marbles are in the ratio 5:3. If there are 18 blue marbles, how many red marbles are there?',
  'mcq',
  '{"A": "36", "B": "24", "C": "30", "D": "42"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 30.',
  23,
  true,
  '{"grade": 6, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which comes next: G, I, K, M, ?',
  'mcq',
  '{"A": "N", "B": "O", "C": "P", "D": "Q"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : O.',
  24,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which comes next: A, C, E, G, ?',
  'mcq',
  '{"A": "H", "B": "I", "C": "J", "D": "K"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : I.',
  25,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which one does NOT belong?',
  'mcq',
  '{"A": "Triangle", "B": "Square", "C": "Circle", "D": "Rectangle"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Circle.',
  26,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which comes next: C, E, G, I, ?',
  'mcq',
  '{"A": "J", "B": "K", "C": "L", "D": "M"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : K.',
  27,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Nisha is taller than Sam. Sam is taller than Ravi. Who is the shortest?',
  'mcq',
  '{"A": "Nisha", "B": "Sam", "C": "Ravi", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Ravi.',
  28,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Ravi is taller than Aarav. Aarav is taller than Nisha. Who is the shortest?',
  'mcq',
  '{"A": "Ravi", "B": "Aarav", "C": "Nisha", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Nisha.',
  29,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Riya is taller than Nisha. Nisha is taller than Aarav. Who is the shortest?',
  'mcq',
  '{"A": "Riya", "B": "Nisha", "C": "Aarav", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Aarav.',
  30,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'If it rains, the ground gets wet. It is raining. What must be true?',
  'mcq',
  '{"A": "The ground is wet", "B": "The ground is dry", "C": "It will not rain tomorrow", "D": "The ground will freeze"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : The ground is wet.',
  31,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Nisha is taller than Ravi. Ravi is taller than Riya. Who is the shortest?',
  'mcq',
  '{"A": "Nisha", "B": "Ravi", "C": "Riya", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Riya.',
  32,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Meena is taller than Ravi. Ravi is taller than Sam. Who is the shortest?',
  'mcq',
  '{"A": "Meena", "B": "Ravi", "C": "Sam", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Sam.',
  33,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Aarav is taller than Meena. Meena is taller than Kavya. Who is the shortest?',
  'mcq',
  '{"A": "Aarav", "B": "Meena", "C": "Kavya", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Kavya.',
  34,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Ravi is taller than Riya. Riya is taller than Aarav. Who is the shortest?',
  'mcq',
  '{"A": "Ravi", "B": "Riya", "C": "Aarav", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Aarav.',
  35,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Asha, Esha, Farah, Dev. Asha is before Esha. Farah is before Dev. Which statement must be true?',
  'mcq',
  '{"A": "Esha is first", "B": "Asha is before Esha", "C": "Dev is before Farah", "D": "Farah is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Asha is before Esha.',
  36,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Dev, Farah, Esha, Asha. Dev is before Farah. Esha is before Asha. Which statement must be true?',
  'mcq',
  '{"A": "Farah is first", "B": "Dev is before Farah", "C": "Asha is before Esha", "D": "Esha is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Dev is before Farah.',
  37,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Bala, Dev, Asha, Farah. Bala is before Dev. Asha is before Farah. Which statement must be true?',
  'mcq',
  '{"A": "Dev is first", "B": "Bala is before Dev", "C": "Farah is before Asha", "D": "Asha is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Bala is before Dev.',
  38,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'All cats are animals. Mimi is a cat. What must be true?',
  'mcq',
  '{"A": "Mimi is an animal", "B": "Mimi is a dog", "C": "All animals are cats", "D": "Mimi cannot be an animal"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Mimi is an animal.',
  39,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Chirag, Bala, Asha, Farah. Chirag is before Bala. Asha is before Farah. Which statement must be true?',
  'mcq',
  '{"A": "Bala is first", "B": "Chirag is before Bala", "C": "Farah is before Asha", "D": "Asha is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Chirag is before Bala.',
  40,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Farah, Chirag, Asha, Dev. Farah is before Chirag. Asha is before Dev. Which statement must be true?',
  'mcq',
  '{"A": "Chirag is first", "B": "Farah is before Chirag", "C": "Dev is before Asha", "D": "Asha is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Farah is before Chirag.',
  41,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'If a number is even, it is divisible by 2. 18 is even. What must be true?',
  'mcq',
  '{"A": "18 is divisible by 2", "B": "18 is divisible by 5", "C": "18 is prime", "D": "18 is odd"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 18 is divisible by 2.',
  42,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'In a race, A finished before B. B finished before C. Which statement must be true?',
  'mcq',
  '{"A": "A finished before C", "B": "C finished before A", "C": "B finished last", "D": "A finished last"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : A finished before C.',
  43,
  true,
  '{"grade": 6, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 3, 5, 7, 9, ?',
  'mcq',
  '{"A": "9", "B": "11", "C": "13", "D": "15"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 11.',
  44,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 4, 9, 14, 19, ?',
  'mcq',
  '{"A": "19", "B": "24", "C": "29", "D": "34"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 24.',
  45,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 1, 7, 13, 19, ?',
  'mcq',
  '{"A": "19", "B": "25", "C": "31", "D": "37"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 25.',
  46,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 6, 12, 24, 48, ?',
  'mcq',
  '{"A": "92", "B": "96", "C": "100", "D": "48"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 96.',
  47,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 4, 8, 16, 32, ?',
  'mcq',
  '{"A": "60", "B": "64", "C": "68", "D": "32"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 64.',
  48,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 3, 6, 12, 24, ?',
  'mcq',
  '{"A": "44", "B": "48", "C": "52", "D": "24"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 48.',
  49,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Choose the best match: Tall : Short :: Up : ?',
  'mcq',
  '{"A": "Down", "B": "Left", "C": "Right", "D": "Fast"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Down.',
  50,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 4 is to 12 as 5 is to ?',
  'mcq',
  '{"A": "12", "B": "15", "C": "18", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 15.',
  51,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 3, 6, 4, 7, 5, ?',
  'mcq',
  '{"A": "7", "B": "8", "C": "9", "D": "10"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 8.',
  52,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 6 is to 12 as 7 is to ?',
  'mcq',
  '{"A": "12", "B": "14", "C": "16", "D": "15"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 14.',
  53,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 3 is to 12 as 4 is to ?',
  'mcq',
  '{"A": "12", "B": "16", "C": "20", "D": "17"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 16.',
  54,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 5, 8, 6, 9, 7, ?',
  'mcq',
  '{"A": "9", "B": "10", "C": "11", "D": "12"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 10.',
  55,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 6, 9, 7, 10, 8, ?',
  'mcq',
  '{"A": "10", "B": "11", "C": "12", "D": "13"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 11.',
  56,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 4 is to 16 as 5 is to ?',
  'mcq',
  '{"A": "16", "B": "20", "C": "24", "D": "21"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 20.',
  57,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 10, 12, 24, 26, ?',
  'mcq',
  '{"A": "52", "B": "50", "C": "54", "D": "28"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 52.',
  58,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 4, 6, 12, 14, ?',
  'mcq',
  '{"A": "28", "B": "26", "C": "30", "D": "16"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 28.',
  59,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 3, 5, 10, 12, ?',
  'mcq',
  '{"A": "24", "B": "22", "C": "26", "D": "14"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 24.',
  60,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 6, 8, 16, 18, ?',
  'mcq',
  '{"A": "36", "B": "34", "C": "38", "D": "20"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 36.',
  61,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 7, 9, 18, 20, ?',
  'mcq',
  '{"A": "40", "B": "38", "C": "42", "D": "22"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 40.',
  62,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 1, 4, 2, 5, 3, ?',
  'mcq',
  '{"A": "4", "B": "6", "C": "8", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 6.',
  63,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 1, 4, 9, 16, ?',
  'mcq',
  '{"A": "20", "B": "24", "C": "25", "D": "26"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 25.',
  64,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A rule changes a number by: multiply by 2, then add 1. If the input is 4, what is the output?',
  'mcq',
  '{"A": "8", "B": "9", "C": "10", "D": "12"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 9.',
  65,
  true,
  '{"grade": 6, "dimension": "PAR", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A shape is mirrored left-to-right. Which change happens?',
  'mcq',
  '{"A": "Left becomes right", "B": "Top becomes bottom", "C": "It gets bigger", "D": "It disappears"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Left becomes right.',
  66,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A shape is rotated 90° clockwise. A top point moves to the...',
  'mcq',
  '{"A": "Left", "B": "Right", "C": "Bottom", "D": "Top"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Right.',
  67,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which shape always has at least one line of symmetry?',
  'mcq',
  '{"A": "Scalene triangle", "B": "Circle", "C": "Irregular quadrilateral", "D": "Random scribble"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Circle.',
  68,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'If an arrow points up and you rotate it 180°, it will point...',
  'mcq',
  '{"A": "Up", "B": "Down", "C": "Left", "D": "Right"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Down.',
  69,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A cube has how many faces?',
  'mcq',
  '{"A": "4", "B": "5", "C": "6", "D": "8"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 6.',
  70,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 5 steps right and 4 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  71,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 4 steps right and 2 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  72,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 5 steps right and 2 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  73,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 4 steps right and 1 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  74,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 3 steps right and 4 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  75,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 4 steps right and 3 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  76,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A shape is rotated 90° clockwise and then 180° clockwise. What is the total rotation?',
  'mcq',
  '{"A": "180\u00b0", "B": "270\u00b0", "C": "360\u00b0", "D": "90\u00b0"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 270°.',
  77,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A cube net has 6 squares. If one square is missing, how many faces can the folded shape have at most?',
  'mcq',
  '{"A": "4", "B": "5", "C": "6", "D": "7"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 5.',
  78,
  true,
  '{"grade": 6, "dimension": "SR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Apples=20, Bananas=12, Mangoes=20. How many Mangoes are there?',
  'mcq',
  '{"A": "19", "B": "20", "C": "22", "D": "25"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 20.',
  79,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Bananas=14, Mangoes=16, Pens=20. How many Pens are there?',
  'mcq',
  '{"A": "20", "B": "25", "C": "22", "D": "19"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 20.',
  80,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Oranges=12, Pens=8, Books=11. How many Pens are there?',
  'mcq',
  '{"A": "10", "B": "13", "C": "7", "D": "8"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 8.',
  81,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Books=14, Mangoes=8, Oranges=11. How many Mangoes are there?',
  'mcq',
  '{"A": "7", "B": "8", "C": "13", "D": "10"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 8.',
  82,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Books=13, Grapes=6, Bananas=6. How many Bananas are there?',
  'mcq',
  '{"A": "8", "B": "6", "C": "11", "D": "5"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 6.',
  83,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Apples=14, Pens=20, Grapes=20. How many Pens are there?',
  'mcq',
  '{"A": "22", "B": "25", "C": "20", "D": "19"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 20.',
  84,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: May=15, June=38. How many more in June than May?',
  'mcq',
  '{"A": "26", "B": "24", "C": "22", "D": "23"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 23.',
  85,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: Markers=4, Erasers=7, Pens=7. What is the total items?',
  'mcq',
  '{"A": "19", "B": "21", "C": "18", "D": "17"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 18.',
  86,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: Notebooks=10, Erasers=15, Markers=17. What is the total items?',
  'mcq',
  '{"A": "43", "B": "42", "C": "41", "D": "45"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 42.',
  87,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: Erasers=6, Pens=9, Notebooks=9. What is the total items?',
  'mcq',
  '{"A": "27", "B": "25", "C": "24", "D": "23"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 24.',
  88,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'In a chart, Team A scored 23 and Team B scored 24. Who scored more?',
  'mcq',
  '{"A": "Team A", "B": "Team B", "C": "Both same", "D": "Cannot tell"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Team B.',
  89,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: Pencils=18, Erasers=12, Notebooks=4. What is the total items?',
  'mcq',
  '{"A": "34", "B": "33", "C": "37", "D": "35"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 34.',
  90,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: Notebooks=10, Pens=11, Erasers=9. What is the total items?',
  'mcq',
  '{"A": "33", "B": "30", "C": "31", "D": "29"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 30.',
  91,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'In a chart, Team A scored 12 and Team B scored 11. Who scored more?',
  'mcq',
  '{"A": "Team A", "B": "Team B", "C": "Both same", "D": "Cannot tell"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Team A.',
  92,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: May=31, June=35. How many more in June than May?',
  'mcq',
  '{"A": "7", "B": "4", "C": "3", "D": "5"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 4.',
  93,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Values are: 14, 27, 17, 13. Which is the greatest?',
  'mcq',
  '{"A": "14", "B": "27", "C": "17", "D": "13"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 27.',
  94,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Values are: 20, 19, 7, 24. Which is the greatest?',
  'mcq',
  '{"A": "20", "B": "19", "C": "7", "D": "24"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 24.',
  95,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Scores are: 19, 13, 17. What is the average? (1 decimal place)',
  'mcq',
  '{"A": "16.6", "B": "16.9", "C": "16.3", "D": "16.0"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 16.3.',
  96,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Values are: 23, 23, 5, 29. Which is the greatest?',
  'mcq',
  '{"A": "23", "B": "23", "C": "5", "D": "29"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 29.',
  97,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Scores are: 17, 8, 20. What is the average? (1 decimal place)',
  'mcq',
  '{"A": "15.0", "B": "14.7", "C": "15.6", "D": "15.3"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 15.0.',
  98,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A chart shows: Jan=24, Feb=19, Mar=21. What is Jan + Mar?',
  'mcq',
  '{"A": "48", "B": "46", "C": "44", "D": "45"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 45.',
  99,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Red=20, Blue=13, Green=15. What is (Red + Blue) − Green?',
  'mcq',
  '{"A": "18", "B": "21", "C": "19", "D": "17"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 18.',
  100,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Red=11, Blue=24, Green=12. What is (Red + Blue) − Green?',
  'mcq',
  '{"A": "23", "B": "26", "C": "24", "D": "22"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 23.',
  101,
  true,
  '{"grade": 6, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which number is different from the others?',
  'mcq',
  '{"A": "2.5", "B": "2.50", "C": "2.500", "D": "2.05"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 2.05.',
  102,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 8D6W?',
  'mcq',
  '{"A": "8D6W", "B": "8B6W", "C": "W6D8", "D": "8D6Y"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 8D6W.',
  103,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 4B4Z?',
  'mcq',
  '{"A": "4B4Z", "B": "4D4Z", "C": "Z4B4", "D": "4B4W"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 4B4Z.',
  104,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 2C8W?',
  'mcq',
  '{"A": "2C8W", "B": "2D8W", "C": "W8C2", "D": "2C8W"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 2C8W.',
  105,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 7A2Z?',
  'mcq',
  '{"A": "7A2Z", "B": "7C2Z", "C": "Z2A7", "D": "7A2Y"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 7A2Z.',
  106,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 7B6X?',
  'mcq',
  '{"A": "7B6X", "B": "7B6X", "C": "X6B7", "D": "7B6W"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 7B6X.',
  107,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A list shows: 15, 17, 19, 21, 24. One number breaks the pattern of +2. Which one?',
  'mcq',
  '{"A": "17", "B": "19", "C": "21", "D": "24"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 24.',
  108,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A list shows: 10, 12, 14, 16, 19. One number breaks the pattern of +2. Which one?',
  'mcq',
  '{"A": "12", "B": "14", "C": "16", "D": "19"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 19.',
  109,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the word with a spelling mistake.',
  'mcq',
  '{"A": "Beautiful", "B": "Receive", "C": "Definately", "D": "Quiet"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Definately.',
  110,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 10. Add 6. Then multiply by 5. What is the result?',
  'mcq',
  '{"A": "80", "B": "85", "C": "82", "D": "78"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 80.',
  111,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A list shows: 13, 15, 17, 19, 22. One number breaks the pattern of +2. Which one?',
  'mcq',
  '{"A": "15", "B": "17", "C": "19", "D": "22"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 22.',
  112,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 12. Add 5. Then multiply by 3. What is the result?',
  'mcq',
  '{"A": "49", "B": "53", "C": "51", "D": "56"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 51.',
  113,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A list shows: 16, 18, 20, 22, 25. One number breaks the pattern of +2. Which one?',
  'mcq',
  '{"A": "18", "B": "20", "C": "22", "D": "25"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 25.',
  114,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 10. Add 2. Then multiply by 3. What is the result?',
  'mcq',
  '{"A": "41", "B": "38", "C": "36", "D": "34"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 36.',
  115,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option is NOT the same as the others?',
  'mcq',
  '{"A": "(a+b)", "B": "(a + b)", "C": "(a+b )", "D": "(a-b)"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : (a-b).',
  116,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 8. Multiply by 4. Add 4. Then subtract 1. What is the result?',
  'mcq',
  '{"A": "35", "B": "34", "C": "36", "D": "38"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 35.',
  117,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 7. Multiply by 4. Add 7. Then subtract 4. What is the result?',
  'mcq',
  '{"A": "31", "B": "32", "C": "34", "D": "30"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 31.',
  118,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 3. Multiply by 2. Add 8. Then subtract 3. What is the result?',
  'mcq',
  '{"A": "14", "B": "11", "C": "10", "D": "12"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 11.',
  119,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 3. Multiply by 3. Add 4. Then subtract 3. What is the result?',
  'mcq',
  '{"A": "9", "B": "11", "C": "13", "D": "10"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 10.',
  120,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 5. Multiply by 4. Add 6. Then subtract 5. What is the result?',
  'mcq',
  '{"A": "24", "B": "20", "C": "21", "D": "22"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 21.',
  121,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option is written incorrectly as a fraction?',
  'mcq',
  '{"A": "3/5", "B": "7/9", "C": "4\\6", "D": "2/3"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 4\6.',
  122,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A student writes: 1 meter = 10 centimeters. Which statement is correct?',
  'mcq',
  '{"A": "The student is correct", "B": "It should be 1 m = 100 cm", "C": "It should be 1 m = 1000 cm", "D": "Meters cannot be converted"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : It should be 1 m = 100 cm.',
  123,
  true,
  '{"grade": 6, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 69 − 24?',
  'mcq',
  '{"A": "45", "B": "52", "C": "47", "D": "42"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 45.',
  124,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 79 + 46?',
  'mcq',
  '{"A": "128", "B": "132", "C": "125", "D": "123"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 125.',
  125,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 12 × 8?',
  'mcq',
  '{"A": "93", "B": "96", "C": "100", "D": "104"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 96.',
  126,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 28 ÷ 4?',
  'mcq',
  '{"A": "7", "B": "8", "C": "9", "D": "6"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 7.',
  127,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 10 × 4?',
  'mcq',
  '{"A": "37", "B": "40", "C": "44", "D": "48"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 40.',
  128,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 97 + 73?',
  'mcq',
  '{"A": "177", "B": "168", "C": "170", "D": "173"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 170.',
  129,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 4.9 + 2.6?',
  'mcq',
  '{"A": "8.0", "B": "7.5", "C": "7.4", "D": "7.7"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 7.5.',
  130,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which fraction is greatest?',
  'mcq',
  '{"A": "3/11", "B": "1/11", "C": "3/6", "D": "1/6"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 3/6.',
  131,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 20% of 60?',
  'mcq',
  '{"A": "12", "B": "9", "C": "17", "D": "14"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 12.',
  132,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A rope is 5 meters long. How many centimeters is that?',
  'mcq',
  '{"A": "500", "B": "5000", "C": "550", "D": "50"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 500.',
  133,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'The ratio of boys to girls is 2:5. If there are 8 boys, how many girls are there?',
  'mcq',
  '{"A": "16", "B": "28", "C": "20", "D": "24"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 20.',
  134,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'The ratio of boys to girls is 4:6. If there are 28 boys, how many girls are there?',
  'mcq',
  '{"A": "49", "B": "56", "C": "42", "D": "35"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 42.',
  135,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'The ratio of boys to girls is 5:2. If there are 25 boys, how many girls are there?',
  'mcq',
  '{"A": "5", "B": "15", "C": "20", "D": "10"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 10.',
  136,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A number increases by 20% from 50. What is the new number?',
  'mcq',
  '{"A": "58", "B": "62", "C": "60", "D": "65"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 60.',
  137,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A number increases by 25% from 100. What is the new number?',
  'mcq',
  '{"A": "130", "B": "127", "C": "125", "D": "123"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 125.',
  138,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Red:Blue marbles are in the ratio 2:5. If there are 20 blue marbles, how many red marbles are there?',
  'mcq',
  '{"A": "16", "B": "8", "C": "4", "D": "12"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 8.',
  139,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A number increases by 10% from 50. What is the new number?',
  'mcq',
  '{"A": "60", "B": "53", "C": "55", "D": "57"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 55.',
  140,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Red:Blue marbles are in the ratio 4:2. If there are 10 blue marbles, how many red marbles are there?',
  'mcq',
  '{"A": "25", "B": "30", "C": "20", "D": "15"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 20.',
  141,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A rope is 9 meters long. How many centimeters is that?',
  'mcq',
  '{"A": "90", "B": "950", "C": "9000", "D": "900"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 900.',
  142,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Ravi has 36 stickers and gets 23 more. He gives away 13. How many stickers does he have now?',
  'mcq',
  '{"A": "44", "B": "51", "C": "48", "D": "46"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 46.',
  143,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Solve: x + 11 = 25',
  'mcq',
  '{"A": "13", "B": "15", "C": "16", "D": "14"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 14.',
  144,
  true,
  '{"grade": 7, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which comes next: K, M, O, Q, ?',
  'mcq',
  '{"A": "R", "B": "S", "C": "T", "D": "U"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : S.',
  145,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which comes next: I, K, M, O, ?',
  'mcq',
  '{"A": "P", "B": "Q", "C": "R", "D": "S"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Q.',
  146,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which comes next: E, G, I, K, ?',
  'mcq',
  '{"A": "L", "B": "M", "C": "N", "D": "O"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : M.',
  147,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Kavya is taller than Sam. Sam is taller than Riya. Who is the shortest?',
  'mcq',
  '{"A": "Kavya", "B": "Sam", "C": "Riya", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Riya.',
  148,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Riya is taller than Kavya. Kavya is taller than Nisha. Who is the shortest?',
  'mcq',
  '{"A": "Riya", "B": "Kavya", "C": "Nisha", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Nisha.',
  149,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Sam is taller than Ravi. Ravi is taller than Nisha. Who is the shortest?',
  'mcq',
  '{"A": "Sam", "B": "Ravi", "C": "Nisha", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Nisha.',
  150,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Aarav is taller than Sam. Sam is taller than Meena. Who is the shortest?',
  'mcq',
  '{"A": "Aarav", "B": "Sam", "C": "Meena", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Meena.',
  151,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Riya is taller than Aarav. Aarav is taller than Ravi. Who is the shortest?',
  'mcq',
  '{"A": "Riya", "B": "Aarav", "C": "Ravi", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Ravi.',
  152,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Sam is taller than Nisha. Nisha is taller than Meena. Who is the shortest?',
  'mcq',
  '{"A": "Sam", "B": "Nisha", "C": "Meena", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Meena.',
  153,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Nisha is taller than Aarav. Aarav is taller than Ravi. Who is the shortest?',
  'mcq',
  '{"A": "Nisha", "B": "Aarav", "C": "Ravi", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Ravi.',
  154,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Kavya is taller than Ravi. Ravi is taller than Nisha. Who is the shortest?',
  'mcq',
  '{"A": "Kavya", "B": "Ravi", "C": "Nisha", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Nisha.',
  155,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Farah, Chirag, Asha, Bala. Farah is before Chirag. Asha is before Bala. Which statement must be true?',
  'mcq',
  '{"A": "Chirag is first", "B": "Farah is before Chirag", "C": "Bala is before Asha", "D": "Asha is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Farah is before Chirag.',
  156,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Chirag, Asha, Bala, Dev. Chirag is before Asha. Bala is before Dev. Which statement must be true?',
  'mcq',
  '{"A": "Asha is first", "B": "Chirag is before Asha", "C": "Dev is before Bala", "D": "Bala is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Chirag is before Asha.',
  157,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Chirag, Esha, Dev, Farah. Chirag is before Esha. Dev is before Farah. Which statement must be true?',
  'mcq',
  '{"A": "Esha is first", "B": "Chirag is before Esha", "C": "Farah is before Dev", "D": "Dev is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Chirag is before Esha.',
  158,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Farah, Esha, Asha, Chirag. Farah is before Esha. Asha is before Chirag. Which statement must be true?',
  'mcq',
  '{"A": "Esha is first", "B": "Farah is before Esha", "C": "Chirag is before Asha", "D": "Asha is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Farah is before Esha.',
  159,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Bala, Chirag, Dev, Asha. Bala is before Chirag. Dev is before Asha. Which statement must be true?',
  'mcq',
  '{"A": "Chirag is first", "B": "Bala is before Chirag", "C": "Asha is before Dev", "D": "Dev is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Bala is before Chirag.',
  160,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Bala, Asha, Chirag, Esha. Bala is before Asha. Chirag is before Esha. Which statement must be true?',
  'mcq',
  '{"A": "Asha is first", "B": "Bala is before Asha", "C": "Esha is before Chirag", "D": "Chirag is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Bala is before Asha.',
  161,
  true,
  '{"grade": 7, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 2, 4, 6, 8, ?',
  'mcq',
  '{"A": "8", "B": "10", "C": "12", "D": "14"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 10.',
  162,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 3, 9, 15, 21, ?',
  'mcq',
  '{"A": "21", "B": "27", "C": "33", "D": "39"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 27.',
  163,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 2, 4, 8, 16, ?',
  'mcq',
  '{"A": "28", "B": "32", "C": "36", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 32.',
  164,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 5, 7, 9, 11, ?',
  'mcq',
  '{"A": "11", "B": "13", "C": "15", "D": "17"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 13.',
  165,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 7, 13, 19, 25, ?',
  'mcq',
  '{"A": "25", "B": "31", "C": "37", "D": "43"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 31.',
  166,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 2, 7, 12, 17, ?',
  'mcq',
  '{"A": "17", "B": "22", "C": "27", "D": "32"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 22.',
  167,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 2 is to 8 as 3 is to ?',
  'mcq',
  '{"A": "8", "B": "12", "C": "16", "D": "13"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 12.',
  168,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Choose the best match: Open : Closed :: Up : ?',
  'mcq',
  '{"A": "Down", "B": "Left", "C": "Right", "D": "Fast"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Down.',
  169,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 4 is to 8 as 5 is to ?',
  'mcq',
  '{"A": "8", "B": "10", "C": "12", "D": "11"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 10.',
  170,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 7, 10, 8, 11, 9, ?',
  'mcq',
  '{"A": "11", "B": "12", "C": "13", "D": "14"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 12.',
  171,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 6 is to 24 as 7 is to ?',
  'mcq',
  '{"A": "24", "B": "28", "C": "32", "D": "29"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 28.',
  172,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 5 is to 15 as 6 is to ?',
  'mcq',
  '{"A": "15", "B": "18", "C": "21", "D": "19"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 18.',
  173,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 2 is to 6 as 3 is to ?',
  'mcq',
  '{"A": "6", "B": "9", "C": "12", "D": "10"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 9.',
  174,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Choose the best match: Day : Night :: Up : ?',
  'mcq',
  '{"A": "Down", "B": "Left", "C": "Right", "D": "Fast"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Down.',
  175,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 9, 11, 22, 24, ?',
  'mcq',
  '{"A": "48", "B": "46", "C": "50", "D": "26"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 48.',
  176,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 2, 4, 8, 10, ?',
  'mcq',
  '{"A": "20", "B": "18", "C": "22", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 20.',
  177,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 8, 10, 20, 22, ?',
  'mcq',
  '{"A": "44", "B": "42", "C": "46", "D": "24"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 44.',
  178,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 2, 5, 3, 6, 4, ?',
  'mcq',
  '{"A": "5", "B": "7", "C": "9", "D": "10"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 7.',
  179,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 5, 7, 14, 16, ?',
  'mcq',
  '{"A": "32", "B": "30", "C": "34", "D": "18"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 32.',
  180,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A rule changes a number by: multiply by 2, then add 1. If the input is 7, what is the output?',
  'mcq',
  '{"A": "14", "B": "15", "C": "16", "D": "18"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 15.',
  181,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A rule changes a number by: multiply by 2, then add 1. If the input is 9, what is the output?',
  'mcq',
  '{"A": "18", "B": "19", "C": "20", "D": "22"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 19.',
  182,
  true,
  '{"grade": 7, "dimension": "PAR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A letter L is rotated 90° clockwise, then 90° clockwise again. That is the same as rotating it...',
  'mcq',
  '{"A": "90\u00b0", "B": "180\u00b0", "C": "270\u00b0", "D": "360\u00b0"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 180°.',
  183,
  true,
  '{"grade": 7, "dimension": "SR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 3 steps right and 2 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  184,
  true,
  '{"grade": 7, "dimension": "SR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 3 steps right and 3 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  185,
  true,
  '{"grade": 7, "dimension": "SR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 5 steps right and 1 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  186,
  true,
  '{"grade": 7, "dimension": "SR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 4 steps right and 4 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  187,
  true,
  '{"grade": 7, "dimension": "SR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 2 steps right and 2 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  188,
  true,
  '{"grade": 7, "dimension": "SR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Apples=5, Books=11, Bananas=19. How many Books are there?',
  'mcq',
  '{"A": "16", "B": "13", "C": "10", "D": "11"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 11.',
  189,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Apples=18, Pens=5, Grapes=5. How many Grapes are there?',
  'mcq',
  '{"A": "5", "B": "7", "C": "10", "D": "4"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 5.',
  190,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Pens=8, Bananas=9, Apples=12. How many Pens are there?',
  'mcq',
  '{"A": "8", "B": "13", "C": "10", "D": "7"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 8.',
  191,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Oranges=12, Mangoes=12, Books=14. How many Books are there?',
  'mcq',
  '{"A": "16", "B": "19", "C": "13", "D": "14"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 14.',
  192,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Mangoes=20, Pens=6, Grapes=5. How many Grapes are there?',
  'mcq',
  '{"A": "4", "B": "10", "C": "5", "D": "7"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 5.',
  193,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Grapes=6, Apples=12, Pens=11. How many Pens are there?',
  'mcq',
  '{"A": "10", "B": "11", "C": "13", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 11.',
  194,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: Erasers=11, Pens=4, Notebooks=8. What is the total items?',
  'mcq',
  '{"A": "23", "B": "26", "C": "24", "D": "22"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 23.',
  195,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: May=17, June=30. How many more in June than May?',
  'mcq',
  '{"A": "13", "B": "16", "C": "14", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 13.',
  196,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: Pens=13, Erasers=15, Markers=7. What is the total items?',
  'mcq',
  '{"A": "36", "B": "38", "C": "34", "D": "35"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 35.',
  197,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: May=31, June=36. How many more in June than May?',
  'mcq',
  '{"A": "6", "B": "5", "C": "4", "D": "8"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 5.',
  198,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: May=37, June=53. How many more in June than May?',
  'mcq',
  '{"A": "16", "B": "17", "C": "19", "D": "15"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 16.',
  199,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'In a chart, Team A scored 28 and Team B scored 22. Who scored more?',
  'mcq',
  '{"A": "Team A", "B": "Team B", "C": "Both same", "D": "Cannot tell"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Team A.',
  200,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: Pens=12, Erasers=10, Markers=5. What is the total items?',
  'mcq',
  '{"A": "26", "B": "27", "C": "28", "D": "30"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 27.',
  201,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: May=22, June=23. How many more in June than May?',
  'mcq',
  '{"A": "0", "B": "2", "C": "4", "D": "1"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 1.',
  202,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Scores are: 13, 20, 12. What is the average? (1 decimal place)',
  'mcq',
  '{"A": "15.3", "B": "14.7", "C": "15.6", "D": "15.0"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 15.0.',
  203,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Scores are: 15, 16, 16. What is the average? (1 decimal place)',
  'mcq',
  '{"A": "16.0", "B": "15.4", "C": "15.7", "D": "16.3"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 15.7.',
  204,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Scores are: 16, 9, 17. What is the average? (1 decimal place)',
  'mcq',
  '{"A": "14.6", "B": "14.0", "C": "14.3", "D": "13.7"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 14.0.',
  205,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Scores are: 14, 20, 9. What is the average? (1 decimal place)',
  'mcq',
  '{"A": "14.9", "B": "14.3", "C": "14.0", "D": "14.6"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 14.3.',
  206,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Scores are: 10, 10, 12. What is the average? (1 decimal place)',
  'mcq',
  '{"A": "10.7", "B": "11.3", "C": "11.0", "D": "10.4"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 10.7.',
  207,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A chart shows: Jan=11, Feb=19, Mar=14. What is Jan + Mar?',
  'mcq',
  '{"A": "25", "B": "26", "C": "24", "D": "28"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 25.',
  208,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Red=18, Blue=17, Green=25. What is (Red + Blue) − Green?',
  'mcq',
  '{"A": "9", "B": "10", "C": "13", "D": "11"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 10.',
  209,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Red=10, Blue=22, Green=20. What is (Red + Blue) − Green?',
  'mcq',
  '{"A": "12", "B": "11", "C": "13", "D": "15"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 12.',
  210,
  true,
  '{"grade": 7, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 4C9X?',
  'mcq',
  '{"A": "4C9X", "B": "4D9X", "C": "X9C4", "D": "4C9Y"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 4C9X.',
  211,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 5D4Z?',
  'mcq',
  '{"A": "5D4Z", "B": "5C4Z", "C": "Z4D5", "D": "5D4W"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 5D4Z.',
  212,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 9B8W?',
  'mcq',
  '{"A": "9B8W", "B": "9D8W", "C": "W8B9", "D": "9B8X"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 9B8W.',
  213,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 6D2Y?',
  'mcq',
  '{"A": "6D2Y", "B": "6B2Y", "C": "Y2D6", "D": "6D2Y"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 6D2Y.',
  214,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 6D1Z?',
  'mcq',
  '{"A": "6D1Z", "B": "6D1Z", "C": "Z1D6", "D": "6D1Z"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 6D1Z.',
  215,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 5A1X?',
  'mcq',
  '{"A": "5A1X", "B": "5C1X", "C": "X1A5", "D": "5A1X"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 5A1X.',
  216,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 3. Add 2. Then multiply by 4. What is the result?',
  'mcq',
  '{"A": "25", "B": "20", "C": "18", "D": "22"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 20.',
  217,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 8. Add 2. Then multiply by 5. What is the result?',
  'mcq',
  '{"A": "55", "B": "48", "C": "52", "D": "50"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 50.',
  218,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 5. Add 4. Then multiply by 4. What is the result?',
  'mcq',
  '{"A": "41", "B": "36", "C": "38", "D": "34"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 36.',
  219,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 10. Add 5. Then multiply by 4. What is the result?',
  'mcq',
  '{"A": "58", "B": "65", "C": "62", "D": "60"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 60.',
  220,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 3. Add 4. Then multiply by 2. What is the result?',
  'mcq',
  '{"A": "19", "B": "14", "C": "12", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 14.',
  221,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 11. Add 3. Then multiply by 4. What is the result?',
  'mcq',
  '{"A": "54", "B": "56", "C": "58", "D": "61"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 56.',
  222,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 9. Add 5. Then multiply by 2. What is the result?',
  'mcq',
  '{"A": "28", "B": "26", "C": "33", "D": "30"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 28.',
  223,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 6. Add 3. Then multiply by 4. What is the result?',
  'mcq',
  '{"A": "38", "B": "41", "C": "34", "D": "36"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 36.',
  224,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 7. Multiply by 3. Add 4. Then subtract 4. What is the result?',
  'mcq',
  '{"A": "24", "B": "20", "C": "22", "D": "21"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 21.',
  225,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 7. Multiply by 3. Add 6. Then subtract 5. What is the result?',
  'mcq',
  '{"A": "22", "B": "25", "C": "21", "D": "23"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 22.',
  226,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 4. Multiply by 3. Add 3. Then subtract 2. What is the result?',
  'mcq',
  '{"A": "14", "B": "16", "C": "13", "D": "12"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 13.',
  227,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 10. Multiply by 3. Add 6. Then subtract 5. What is the result?',
  'mcq',
  '{"A": "31", "B": "34", "C": "30", "D": "32"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 31.',
  228,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 9. Multiply by 4. Add 7. Then subtract 2. What is the result?',
  'mcq',
  '{"A": "41", "B": "40", "C": "44", "D": "42"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 41.',
  229,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 7. Multiply by 3. Add 7. Then subtract 1. What is the result?',
  'mcq',
  '{"A": "30", "B": "28", "C": "27", "D": "26"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 27.',
  230,
  true,
  '{"grade": 7, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 60 ÷ 10?',
  'mcq',
  '{"A": "6", "B": "7", "C": "5", "D": "8"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 6.',
  231,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 56 ÷ 4?',
  'mcq',
  '{"A": "13", "B": "16", "C": "15", "D": "14"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 14.',
  232,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 13 × 11?',
  'mcq',
  '{"A": "147", "B": "143", "C": "151", "D": "140"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 143.',
  233,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 78 + 91?',
  'mcq',
  '{"A": "176", "B": "167", "C": "169", "D": "172"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 169.',
  234,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 112 − 37?',
  'mcq',
  '{"A": "72", "B": "75", "C": "77", "D": "82"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 75.',
  235,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 78 + 12?',
  'mcq',
  '{"A": "93", "B": "88", "C": "97", "D": "90"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 90.',
  236,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'The ratio of boys to girls is 4:2. If there are 24 boys, how many girls are there?',
  'mcq',
  '{"A": "6", "B": "24", "C": "12", "D": "18"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 12.',
  237,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'The ratio of boys to girls is 3:5. If there are 27 boys, how many girls are there?',
  'mcq',
  '{"A": "54", "B": "63", "C": "36", "D": "45"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 45.',
  238,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 4.0 + 1.4?',
  'mcq',
  '{"A": "5.9", "B": "5.4", "C": "5.3", "D": "5.6"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 5.4.',
  239,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 10% of 40?',
  'mcq',
  '{"A": "1", "B": "6", "C": "4", "D": "9"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 4.',
  240,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 1.4 + 4.3?',
  'mcq',
  '{"A": "5.9", "B": "6.2", "C": "5.6", "D": "5.7"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 5.7.',
  241,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'The ratio of boys to girls is 3:3. If there are 21 boys, how many girls are there?',
  'mcq',
  '{"A": "28", "B": "14", "C": "21", "D": "35"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 21.',
  242,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'What is 5.8 + 1.7?',
  'mcq',
  '{"A": "7.5", "B": "7.4", "C": "7.7", "D": "8.0"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 7.5.',
  243,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Red:Blue marbles are in the ratio 3:4. If there are 36 blue marbles, how many red marbles are there?',
  'mcq',
  '{"A": "18", "B": "36", "C": "45", "D": "27"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 27.',
  244,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Ravi has 39 stickers and gets 39 more. He gives away 15. How many stickers does he have now?',
  'mcq',
  '{"A": "65", "B": "68", "C": "63", "D": "61"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 63.',
  245,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Ravi has 19 stickers and gets 27 more. He gives away 15. How many stickers does he have now?',
  'mcq',
  '{"A": "33", "B": "36", "C": "29", "D": "31"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 31.',
  246,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Ravi has 12 stickers and gets 30 more. He gives away 6. How many stickers does he have now?',
  'mcq',
  '{"A": "34", "B": "41", "C": "38", "D": "36"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 36.',
  247,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Ravi has 37 stickers and gets 24 more. He gives away 13. How many stickers does he have now?',
  'mcq',
  '{"A": "48", "B": "50", "C": "53", "D": "46"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 48.',
  248,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Ravi has 28 stickers and gets 18 more. He gives away 7. How many stickers does he have now?',
  'mcq',
  '{"A": "44", "B": "39", "C": "41", "D": "37"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 39.',
  249,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Red:Blue marbles are in the ratio 5:3. If there are 12 blue marbles, how many red marbles are there?',
  'mcq',
  '{"A": "16", "B": "28", "C": "20", "D": "24"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 20.',
  250,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Ravi has 31 stickers and gets 31 more. He gives away 5. How many stickers does he have now?',
  'mcq',
  '{"A": "59", "B": "57", "C": "62", "D": "55"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 57.',
  251,
  true,
  '{"grade": 8, "dimension": "QR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Nisha is taller than Riya. Riya is taller than Sam. Who is the shortest?',
  'mcq',
  '{"A": "Nisha", "B": "Riya", "C": "Sam", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Sam.',
  252,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Meena is taller than Sam. Sam is taller than Kavya. Who is the shortest?',
  'mcq',
  '{"A": "Meena", "B": "Sam", "C": "Kavya", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Kavya.',
  253,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Nisha is taller than Sam. Sam is taller than Riya. Who is the shortest?',
  'mcq',
  '{"A": "Nisha", "B": "Sam", "C": "Riya", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Riya.',
  254,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Kavya is taller than Nisha. Nisha is taller than Riya. Who is the shortest?',
  'mcq',
  '{"A": "Kavya", "B": "Nisha", "C": "Riya", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Riya.',
  255,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Nisha is taller than Riya. Riya is taller than Kavya. Who is the shortest?',
  'mcq',
  '{"A": "Nisha", "B": "Riya", "C": "Kavya", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Kavya.',
  256,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Kavya is taller than Meena. Meena is taller than Nisha. Who is the shortest?',
  'mcq',
  '{"A": "Kavya", "B": "Meena", "C": "Nisha", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Nisha.',
  257,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Kavya is taller than Ravi. Ravi is taller than Riya. Who is the shortest?',
  'mcq',
  '{"A": "Kavya", "B": "Ravi", "C": "Riya", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Riya.',
  258,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Riya is taller than Aarav. Aarav is taller than Nisha. Who is the shortest?',
  'mcq',
  '{"A": "Riya", "B": "Aarav", "C": "Nisha", "D": "Cannot be determined"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Nisha.',
  259,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Bala, Dev, Asha, Esha. Bala is before Dev. Asha is before Esha. Which statement must be true?',
  'mcq',
  '{"A": "Dev is first", "B": "Bala is before Dev", "C": "Esha is before Asha", "D": "Asha is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Bala is before Dev.',
  260,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Chirag, Farah, Asha, Dev. Chirag is before Farah. Asha is before Dev. Which statement must be true?',
  'mcq',
  '{"A": "Farah is first", "B": "Chirag is before Farah", "C": "Dev is before Asha", "D": "Asha is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Chirag is before Farah.',
  261,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Dev, Bala, Asha, Chirag. Dev is before Bala. Asha is before Chirag. Which statement must be true?',
  'mcq',
  '{"A": "Bala is first", "B": "Dev is before Bala", "C": "Chirag is before Asha", "D": "Asha is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Dev is before Bala.',
  262,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Dev, Bala, Farah, Asha. Dev is before Bala. Farah is before Asha. Which statement must be true?',
  'mcq',
  '{"A": "Bala is first", "B": "Dev is before Bala", "C": "Asha is before Farah", "D": "Farah is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Dev is before Bala.',
  263,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Chirag, Bala, Esha, Dev. Chirag is before Bala. Esha is before Dev. Which statement must be true?',
  'mcq',
  '{"A": "Bala is first", "B": "Chirag is before Bala", "C": "Dev is before Esha", "D": "Esha is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Chirag is before Bala.',
  264,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Four friends stand in a line: Asha, Farah, Dev, Chirag. Asha is before Farah. Dev is before Chirag. Which statement must be true?',
  'mcq',
  '{"A": "Farah is first", "B": "Asha is before Farah", "C": "Chirag is before Dev", "D": "Dev is last"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Asha is before Farah.',
  265,
  true,
  '{"grade": 8, "dimension": "LR", "difficulty_rank": 5, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 9, 14, 19, 24, ?',
  'mcq',
  '{"A": "24", "B": "29", "C": "34", "D": "39"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 29.',
  266,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 2, 8, 14, 20, ?',
  'mcq',
  '{"A": "20", "B": "26", "C": "32", "D": "38"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 26.',
  267,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 5, 10, 20, 40, ?',
  'mcq',
  '{"A": "76", "B": "80", "C": "84", "D": "40"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 80.',
  268,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 6, 10, 14, 18, ?',
  'mcq',
  '{"A": "18", "B": "22", "C": "26", "D": "30"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 22.',
  269,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 4, 7, 10, 13, ?',
  'mcq',
  '{"A": "13", "B": "16", "C": "19", "D": "22"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 16.',
  270,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 2, 6, 10, 14, ?',
  'mcq',
  '{"A": "14", "B": "18", "C": "22", "D": "26"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 18.',
  271,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 5 is to 10 as 6 is to ?',
  'mcq',
  '{"A": "10", "B": "12", "C": "14", "D": "13"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 12.',
  272,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 2 is to 4 as 3 is to ?',
  'mcq',
  '{"A": "4", "B": "6", "C": "8", "D": "7"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 6.',
  273,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 9, 12, 10, 13, 11, ?',
  'mcq',
  '{"A": "13", "B": "14", "C": "15", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 14.',
  274,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 8, 11, 9, 12, 10, ?',
  'mcq',
  '{"A": "12", "B": "13", "C": "14", "D": "15"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 13.',
  275,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 6 is to 18 as 7 is to ?',
  'mcq',
  '{"A": "18", "B": "21", "C": "24", "D": "22"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 21.',
  276,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Choose the best match: Hot : Cold :: Up : ?',
  'mcq',
  '{"A": "Down", "B": "Left", "C": "Right", "D": "Fast"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Down.',
  277,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Complete: 3 is to 6 as 4 is to ?',
  'mcq',
  '{"A": "6", "B": "8", "C": "10", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 8.',
  278,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Find the next number: 4, 7, 5, 8, 6, ?',
  'mcq',
  '{"A": "7", "B": "9", "C": "11", "D": "12"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 9.',
  279,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A rule changes a number by: multiply by 2, then add 1. If the input is 5, what is the output?',
  'mcq',
  '{"A": "10", "B": "11", "C": "12", "D": "14"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 11.',
  280,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A rule changes a number by: multiply by 2, then add 1. If the input is 11, what is the output?',
  'mcq',
  '{"A": "22", "B": "23", "C": "24", "D": "26"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 23.',
  281,
  true,
  '{"grade": 8, "dimension": "PAR", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 2 steps right and 3 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  282,
  true,
  '{"grade": 8, "dimension": "SR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 3 steps right and 1 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  283,
  true,
  '{"grade": 8, "dimension": "SR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 2 steps right and 1 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  284,
  true,
  '{"grade": 8, "dimension": "SR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 5 steps right and 3 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  285,
  true,
  '{"grade": 8, "dimension": "SR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A point moves 2 steps right and 4 steps up on a grid. Which direction is the overall movement?',
  'mcq',
  '{"A": "Only right", "B": "Only up", "C": "Up and right", "D": "Down and left"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Up and right.',
  286,
  true,
  '{"grade": 8, "dimension": "SR", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Grapes=8, Apples=13, Mangoes=7. How many Apples are there?',
  'mcq',
  '{"A": "18", "B": "13", "C": "12", "D": "15"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 13.',
  287,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Oranges=5, Grapes=13, Books=12. How many Grapes are there?',
  'mcq',
  '{"A": "18", "B": "12", "C": "15", "D": "13"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 13.',
  288,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Mangoes=11, Oranges=13, Books=10. How many Books are there?',
  'mcq',
  '{"A": "9", "B": "10", "C": "15", "D": "12"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 10.',
  289,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Pens=12, Oranges=11, Bananas=12. How many Bananas are there?',
  'mcq',
  '{"A": "14", "B": "17", "C": "12", "D": "11"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 12.',
  290,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Books=5, Pens=6, Mangoes=20. How many Pens are there?',
  'mcq',
  '{"A": "6", "B": "11", "C": "8", "D": "5"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 6.',
  291,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Pens=17, Grapes=12, Oranges=9. How many Pens are there?',
  'mcq',
  '{"A": "16", "B": "17", "C": "19", "D": "22"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 17.',
  292,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: May=24, June=39. How many more in June than May?',
  'mcq',
  '{"A": "16", "B": "15", "C": "18", "D": "14"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 15.',
  293,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: Pens=17, Pencils=13, Notebooks=3. What is the total items?',
  'mcq',
  '{"A": "36", "B": "34", "C": "32", "D": "33"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 33.',
  294,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: May=17, June=29. How many more in June than May?',
  'mcq',
  '{"A": "15", "B": "11", "C": "12", "D": "13"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 12.',
  295,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: Notebooks=13, Markers=14, Pens=8. What is the total items?',
  'mcq',
  '{"A": "35", "B": "34", "C": "36", "D": "38"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 35.',
  296,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: May=20, June=26. How many more in June than May?',
  'mcq',
  '{"A": "9", "B": "6", "C": "7", "D": "5"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 6.',
  297,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A table shows: Pencils=10, Notebooks=6, Markers=11. What is the total items?',
  'mcq',
  '{"A": "30", "B": "28", "C": "27", "D": "26"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 27.',
  298,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'In a chart, Team A scored 15 and Team B scored 23. Who scored more?',
  'mcq',
  '{"A": "Team A", "B": "Team B", "C": "Both same", "D": "Cannot tell"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Team B.',
  299,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'In a chart, Team A scored 30 and Team B scored 26. Who scored more?',
  'mcq',
  '{"A": "Team A", "B": "Team B", "C": "Both same", "D": "Cannot tell"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : Team A.',
  300,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Values are: 15, 30, 20, 14. Which is the greatest?',
  'mcq',
  '{"A": "15", "B": "30", "C": "20", "D": "14"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 30.',
  301,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Values are: 23, 6, 17, 8. Which is the greatest?',
  'mcq',
  '{"A": "23", "B": "6", "C": "17", "D": "8"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 23.',
  302,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A chart shows: Jan=7, Feb=12, Mar=14. What is Jan + Mar?',
  'mcq',
  '{"A": "20", "B": "21", "C": "22", "D": "24"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 21.',
  303,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Values are: 15, 13, 16, 16. Which is the greatest?',
  'mcq',
  '{"A": "15", "B": "13", "C": "16", "D": "16"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 16.',
  304,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Values are: 30, 13, 16, 5. Which is the greatest?',
  'mcq',
  '{"A": "30", "B": "13", "C": "16", "D": "5"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 30.',
  305,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A chart shows: Jan=17, Feb=25, Mar=12. What is Jan + Mar?',
  'mcq',
  '{"A": "29", "B": "30", "C": "32", "D": "28"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 29.',
  306,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Red=24, Blue=12, Green=22. What is (Red + Blue) − Green?',
  'mcq',
  '{"A": "17", "B": "14", "C": "15", "D": "13"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 14.',
  307,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Table: Red=23, Blue=22, Green=12. What is (Red + Blue) − Green?',
  'mcq',
  '{"A": "32", "B": "34", "C": "36", "D": "33"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 33.',
  308,
  true,
  '{"grade": 8, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 2A2X?',
  'mcq',
  '{"A": "2A2X", "B": "2C2X", "C": "X2A2", "D": "2A2W"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 2A2X.',
  309,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 6A1W?',
  'mcq',
  '{"A": "6A1W", "B": "6D1W", "C": "W1A6", "D": "6A1W"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 6A1W.',
  310,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 1C9X?',
  'mcq',
  '{"A": "1C9X", "B": "1A9X", "C": "X9C1", "D": "1C9Z"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 1C9X.',
  311,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 3C7X?',
  'mcq',
  '{"A": "3C7X", "B": "3B7X", "C": "X7C3", "D": "3C7X"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 3C7X.',
  312,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 5C7Z?',
  'mcq',
  '{"A": "5C7Z", "B": "5C7Z", "C": "Z7C5", "D": "5C7Z"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 5C7Z.',
  313,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Which option matches exactly: 9D9Z?',
  'mcq',
  '{"A": "9D9Z", "B": "9C9Z", "C": "Z9D9", "D": "9D9Y"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 9D9Z.',
  314,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 10. Add 4. Then multiply by 4. What is the result?',
  'mcq',
  '{"A": "54", "B": "56", "C": "58", "D": "61"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 56.',
  315,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 3. Add 6. Then multiply by 3. What is the result?',
  'mcq',
  '{"A": "27", "B": "32", "C": "29", "D": "25"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 27.',
  316,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 3. Add 6. Then multiply by 4. What is the result?',
  'mcq',
  '{"A": "36", "B": "34", "C": "41", "D": "38"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 36.',
  317,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 5. Add 5. Then multiply by 5. What is the result?',
  'mcq',
  '{"A": "48", "B": "50", "C": "55", "D": "52"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 50.',
  318,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'A list shows: 14, 16, 18, 20, 23. One number breaks the pattern of +2. Which one?',
  'mcq',
  '{"A": "16", "B": "18", "C": "20", "D": "23"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 23.',
  319,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 5. Add 3. Then multiply by 4. What is the result?',
  'mcq',
  '{"A": "37", "B": "34", "C": "30", "D": "32"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 32.',
  320,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 8. Add 2. Then multiply by 3. What is the result?',
  'mcq',
  '{"A": "32", "B": "35", "C": "28", "D": "30"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 30.',
  321,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 7. Add 4. Then multiply by 3. What is the result?',
  'mcq',
  '{"A": "35", "B": "33", "C": "31", "D": "38"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 33.',
  322,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 3, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 4. Multiply by 2. Add 6. Then subtract 2. What is the result?',
  'mcq',
  '{"A": "12", "B": "15", "C": "13", "D": "11"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 12.',
  323,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 7. Multiply by 2. Add 4. Then subtract 1. What is the result?',
  'mcq',
  '{"A": "20", "B": "17", "C": "18", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 17.',
  324,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 5, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 6. Multiply by 3. Add 3. Then subtract 1. What is the result?',
  'mcq',
  '{"A": "20", "B": "19", "C": "23", "D": "21"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 20.',
  325,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 5. Multiply by 3. Add 8. Then subtract 1. What is the result?',
  'mcq',
  '{"A": "22", "B": "21", "C": "25", "D": "23"}'::jsonb,
  '"A"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 22.',
  326,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 5, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 2. Multiply by 4. Add 7. Then subtract 5. What is the result?',
  'mcq',
  '{"A": "13", "B": "9", "C": "11", "D": "10"}'::jsonb,
  '"D"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 10.',
  327,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 5, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  '4a648b7a-e809-4b01-b378-35a005247c7b',
  'Start with 3. Multiply by 2. Add 8. Then subtract 4. What is the result?',
  'mcq',
  '{"A": "11", "B": "13", "C": "10", "D": "9"}'::jsonb,
  '"C"'::jsonb,
  'Step 1: Carefully analyze the problem and identify the rule or logic required.
Step 2: Apply the reasoning step by step to reach the correct solution.
Step 3: After applying the logic correctly, we determine the correct option.

Therefore, the correct answer is Option : 10.',
  328,
  true,
  '{"grade": 8, "dimension": "AA", "difficulty_rank": 4, "time_target_sec": 75}'::jsonb
);