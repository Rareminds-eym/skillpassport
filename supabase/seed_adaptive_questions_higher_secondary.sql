-- Seed adaptive aptitude questions for Higher Secondary (Grades 11-12)
-- Generated from G11-12Aptitude_500_MODEL_B.csv

-- Insert adaptive aptitude section for Higher Secondary (Grades 11-12)
INSERT INTO personal_assessment_sections (
  id, name, title, description, order_number, is_timed,
  time_limit_seconds, is_active, grade_level, created_at, updated_at
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'adaptive_aptitude_higher_secondary',
  'Adaptive Aptitude - Higher Secondary',
  'Adaptive aptitude assessment for higher secondary students (grades 11-12)',
  12,
  true,
  3600,
  true,
  'higher_secondary',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;


-- Insert questions

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Which completes: A1, B2, C3, D4, ?',
  'mcq',
  '{"A": "D5", "B": "E5", "C": "F6", "D": "E4"}'::jsonb,
  '"B"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  1,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If input doubles and output is proportional, output becomes:',
  'mcq',
  '{"A": "Halves", "B": "Unchanged", "C": "Doubles", "D": "Triples"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  2,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 9^2 ÷ 9^1',
  'mcq',
  '{"A": "27", "B": "9", "C": "8", "D": "81"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  3,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 4^2 ÷ 4^1',
  'mcq',
  '{"A": "3", "B": "16", "C": "12", "D": "4"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  4,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Which is faster as n grows: O(n) or O(n log n)?',
  'mcq',
  '{"A": "Cannot compare", "B": "Same", "C": "O(n)", "D": "O(n log n)"}'::jsonb,
  '"C"'::jsonb,
  'Algorithmic intuition and step counting.',
  5,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If n is an even integer, which expression is always even?',
  'mcq',
  '{"A": "2n+1", "B": "n^2+1", "C": "n(n+1)", "D": "n+1"}'::jsonb,
  '"C"'::jsonb,
  'Logical deduction / implication reasoning.',
  6,
  true,
  '{"grade": 11, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 136 increases by 8%. What is the new value?',
  'mcq',
  '{"A": "10.88", "B": "146.88", "C": "128", "D": "144"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  7,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A loop runs from i=1 to i=10. How many iterations?',
  'mcq',
  '{"A": "20", "B": "11", "C": "9", "D": "10"}'::jsonb,
  '"D"'::jsonb,
  'Algorithmic intuition and step counting.',
  8,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 83 items/min for 3 minutes. Total processed?',
  'mcq',
  '{"A": "86", "B": "239", "C": "332", "D": "249"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  9,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 5^4 ÷ 5^3',
  'mcq',
  '{"A": "25", "B": "369", "C": "4", "D": "5"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  10,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 216 increases by 5%. What is the new value?',
  'mcq',
  '{"A": "226.8", "B": "10.8", "C": "211", "D": "221"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  11,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=1x+4. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "5", "B": "4", "C": "16", "D": "512"}'::jsonb,
  '"B"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  12,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If a test has 95% accuracy, what is error rate?',
  'mcq',
  '{"A": "0.05", "B": "10", "C": "95", "D": "5"}'::jsonb,
  '"D"'::jsonb,
  'Expected value, complements, and decision principles.',
  13,
  true,
  '{"grade": 11, "dimension": "DR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If a chart shows 40% A, 35% B, remaining C. What % is C?',
  'mcq',
  '{"A": "30", "B": "20", "C": "15", "D": "25"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  14,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 244 respondents, 202 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "492.88", "B": "8.28", "C": "17.21", "D": "82.79"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  15,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: An algorithm runs in O(n²). For n=6, operations scale to about:',
  'mcq',
  '{"A": "64", "B": "8", "C": "12", "D": "36"}'::jsonb,
  '"D"'::jsonb,
  'Algorithmic intuition and step counting.',
  16,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Statement 1: ''If it rains, roads are wet.'' Statement 2: ''Roads are wet.'' Which is valid?',
  'mcq',
  '{"A": "It may have rained", "B": "It definitely rained", "C": "It did not rain", "D": "Roads cannot be wet"}'::jsonb,
  '"A"'::jsonb,
  'Logical deduction / implication reasoning.',
  17,
  true,
  '{"grade": 11, "dimension": "LR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 248 increases by 5%. What is the new value?',
  'mcq',
  '{"A": "243", "B": "260.4", "C": "253", "D": "12.4"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  18,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If a process doubles then increases by 10%, what is the multiplier?',
  'mcq',
  '{"A": "2.2", "B": "2.1", "C": "1.1", "D": "224"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  19,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 157 respondents, 48 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "30.57", "B": "3.06", "C": "69.43", "D": "75.36"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  20,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 3x + 3. What is y when x = 6?',
  'mcq',
  '{"A": "6", "B": "664", "C": "18", "D": "21"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  21,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If two subsystems in series have reliabilities 0.9 and 0.8, combined reliability ≈?',
  'mcq',
  '{"A": "0.85", "B": "0.17", "C": "0.72", "D": "1.7"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  22,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Binary search reduces search space by half. For 128 items, max comparisons ≈?',
  'mcq',
  '{"A": "8", "B": "6", "C": "7", "D": "10"}'::jsonb,
  '"C"'::jsonb,
  'Algorithmic intuition and step counting.',
  23,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 40',
  'mcq',
  '{"A": "13", "B": "10", "C": "12", "D": "11"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  24,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If a list has 64 items and you halve it each step, steps to reach 1?',
  'mcq',
  '{"A": "6", "B": "7", "C": "5", "D": "8"}'::jsonb,
  '"A"'::jsonb,
  'Algorithmic intuition and step counting.',
  25,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: All A are B. Some B are C. Which statement is logically possible?',
  'mcq',
  '{"A": "Some A may be C", "B": "All C are A", "C": "All B are A", "D": "No A is C"}'::jsonb,
  '"A"'::jsonb,
  'Logical deduction / implication reasoning.',
  26,
  true,
  '{"grade": 11, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 139 respondents, 20 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "1.44", "B": "27.8", "C": "14.39", "D": "85.61"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  27,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 2^2 ÷ 2^1',
  'mcq',
  '{"A": "6", "B": "2", "C": "1", "D": "4"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  28,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: An algorithm runs in O(n²). For n=7, operations scale to about:',
  'mcq',
  '{"A": "128", "B": "14", "C": "49", "D": "9"}'::jsonb,
  '"C"'::jsonb,
  'Algorithmic intuition and step counting.',
  29,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 39, 63, 62, 89, 42. What is the median?',
  'mcq',
  '{"A": "42", "B": "59", "C": "62", "D": "63"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  30,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 479 increases by 22%. What is the new value?',
  'mcq',
  '{"A": "501", "B": "105.38", "C": "457", "D": "584.38"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  31,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=5x+5. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "20", "B": "25", "C": "845", "D": "9"}'::jsonb,
  '"A"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  32,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 14 L/min and drains at 10 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "4", "B": "24", "C": "-4", "D": "140"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  33,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=2x+4. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "8", "B": "16", "C": "6", "D": "941"}'::jsonb,
  '"A"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  34,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Option A gives sure ₹50. Option B gives ₹100 with 50% chance. Expected value of B?',
  'mcq',
  '{"A": "100", "B": "50", "C": "75", "D": "25"}'::jsonb,
  '"B"'::jsonb,
  'Expected value, complements, and decision principles.',
  35,
  true,
  '{"grade": 11, "dimension": "DR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Choose the best decision rule under uncertainty:',
  'mcq',
  '{"A": "Minimize outcomes", "B": "Maximize variance", "C": "Ignore probabilities", "D": "Maximize expected value"}'::jsonb,
  '"D"'::jsonb,
  'Expected value, complements, and decision principles.',
  36,
  true,
  '{"grade": 11, "dimension": "DR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 537 increases by 24%. What is the new value?',
  'mcq',
  '{"A": "561", "B": "513", "C": "665.88", "D": "128.88"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  37,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 4^3 ÷ 4^2',
  'mcq',
  '{"A": "16", "B": "375", "C": "4", "D": "3"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  38,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: In a feedback system, output increases by 5 units per cycle. After 6 cycles, increase?',
  'mcq',
  '{"A": "15", "B": "11", "C": "25", "D": "30"}'::jsonb,
  '"D"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  39,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: An algorithm runs in O(n²). For n=4, operations scale to about:',
  'mcq',
  '{"A": "426", "B": "16", "C": "6", "D": "8"}'::jsonb,
  '"B"'::jsonb,
  'Algorithmic intuition and step counting.',
  40,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 6x + 8. What is y when x = 8?',
  'mcq',
  '{"A": "64", "B": "14", "C": "48", "D": "56"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  41,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A process has 3 stages taking 2, 4, 3 minutes. Total time?',
  'mcq',
  '{"A": "10", "B": "9", "C": "8", "D": "7"}'::jsonb,
  '"B"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  42,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹874. Profit 25%. Selling price?',
  'mcq',
  '{"A": "1136.2", "B": "1092.5", "C": "899", "D": "1048.8"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  43,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 20, 64, 35. What is the mean?',
  'mcq',
  '{"A": "49.5", "B": "42", "C": "119", "D": "39.67"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  44,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 269 to 342. Approx % increase?',
  'mcq',
  '{"A": "9.96", "B": "22", "C": "27", "D": "32"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  45,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 14 L/min and drains at 14 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "0", "B": "745", "C": "28", "D": "196"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  46,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 74 items/min for 3 minutes. Total processed?',
  'mcq',
  '{"A": "77", "B": "296", "C": "222", "D": "212"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  47,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If P → Q and Q → R, which must be true?',
  'mcq',
  '{"A": "P → R", "B": "Q → P", "C": "R → P", "D": "P → Q only"}'::jsonb,
  '"A"'::jsonb,
  'Logical deduction / implication reasoning.',
  48,
  true,
  '{"grade": 11, "dimension": "LR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 9^3 ÷ 9^2',
  'mcq',
  '{"A": "9", "B": "81", "C": "8", "D": "36"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  49,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹219. Profit 20%. Selling price?',
  'mcq',
  '{"A": "251.85", "B": "239", "C": "273.75", "D": "262.8"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  50,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 51 items/min for 4 minutes. Total processed?',
  'mcq',
  '{"A": "255", "B": "204", "C": "194", "D": "55"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  51,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 29 L/min and drains at 5 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-24", "B": "145", "C": "34", "D": "24"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  52,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 7^4 ÷ 7^3',
  'mcq',
  '{"A": "35", "B": "7", "C": "6", "D": "49"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  53,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 46% of 20?',
  'mcq',
  '{"A": "9.2", "B": "46.2", "C": "2.3", "D": "92"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  54,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: An algorithm runs in O(n²). For n=3, operations scale to about:',
  'mcq',
  '{"A": "5", "B": "6", "C": "8", "D": "9"}'::jsonb,
  '"D"'::jsonb,
  'Algorithmic intuition and step counting.',
  55,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 7^3 ÷ 7^2',
  'mcq',
  '{"A": "49", "B": "7", "C": "6", "D": "28"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  56,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 34, 45, 43. What is the mean?',
  'mcq',
  '{"A": "40.67", "B": "122", "C": "39.5", "D": "44"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  57,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 177 to 239. Approx % increase?',
  'mcq',
  '{"A": "40", "B": "5.06", "C": "30", "D": "35"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  58,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 464 increases by 8%. What is the new value?',
  'mcq',
  '{"A": "472", "B": "456", "C": "501.12", "D": "37.12"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  59,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Choose the odd one out: Triangle, Square, Circle, Cube',
  'mcq',
  '{"A": "Square", "B": "Circle", "C": "Triangle", "D": "Cube"}'::jsonb,
  '"D"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  60,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 335 increases by 14%. What is the new value?',
  'mcq',
  '{"A": "46.9", "B": "381.9", "C": "321", "D": "349"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  61,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If ▲=+2 and ■=×3, what is ■(▲(4))?',
  'mcq',
  '{"A": "928", "B": "18", "C": "14", "D": "246"}'::jsonb,
  '"B"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  62,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=4x+2. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "16", "B": "222", "C": "8", "D": "541"}'::jsonb,
  '"A"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  63,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=1x+5. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "5", "B": "4", "C": "20", "D": "619"}'::jsonb,
  '"B"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  64,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 325 to 387. Approx % increase?',
  'mcq',
  '{"A": "24", "B": "17.11", "C": "14", "D": "19"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  65,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If risk of failure is 0.2, probability of success is:',
  'mcq',
  '{"A": "0.8", "B": "1.2", "C": "0.2", "D": "0.1"}'::jsonb,
  '"A"'::jsonb,
  'Expected value, complements, and decision principles.',
  66,
  true,
  '{"grade": 11, "dimension": "DR", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹342. Profit 20%. Selling price?',
  'mcq',
  '{"A": "362", "B": "427.5", "C": "410.4", "D": "393.3"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  67,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 8, 14, 20, 26, ?',
  'mcq',
  '{"A": "20", "B": "32", "C": "38", "D": "26"}'::jsonb,
  '"B"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  68,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=3x+5. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "12", "B": "20", "C": "15", "D": "7"}'::jsonb,
  '"A"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  69,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 44 items/min for 1 minutes. Total processed?',
  'mcq',
  '{"A": "34", "B": "88", "C": "45", "D": "44"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  70,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 296 to 394. Approx % increase?',
  'mcq',
  '{"A": "38", "B": "8.97", "C": "28", "D": "33"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  71,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=5x+2. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "8", "B": "9", "C": "10", "D": "20"}'::jsonb,
  '"D"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  72,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹692. Profit 15%. Selling price?',
  'mcq',
  '{"A": "795.8", "B": "707", "C": "830.4", "D": "761.2"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  73,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 16 L/min and drains at 15 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "1", "B": "240", "C": "-1", "D": "31"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  74,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: In a feedback system, output increases by 7 units per cycle. After 6 cycles, increase?',
  'mcq',
  '{"A": "49", "B": "21", "C": "42", "D": "13"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  75,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 69, 34, 60. What is the mean?',
  'mcq',
  '{"A": "51.5", "B": "54.33", "C": "163", "D": "47"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  76,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 13 L/min and drains at 4 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "9", "B": "52", "C": "17", "D": "-9"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  77,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 4x + 8. What is y when x = 9?',
  'mcq',
  '{"A": "44", "B": "36", "C": "72", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  78,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 64, 20, 12, 11, 70. What is the median?',
  'mcq',
  '{"A": "20", "B": "12", "C": "64", "D": "35.4"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  79,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1102. Profit 10%. Selling price?',
  'mcq',
  '{"A": "1267.3", "B": "1157.1", "C": "1212.2", "D": "1112"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  80,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 222 increases by 12%. What is the new value?',
  'mcq',
  '{"A": "210", "B": "26.64", "C": "248.64", "D": "234"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  81,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=1x+3. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "12", "B": "4", "C": "5", "D": "3"}'::jsonb,
  '"B"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  82,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1547. Profit 5%. Selling price?',
  'mcq',
  '{"A": "1547", "B": "1552", "C": "1624.35", "D": "1701.7"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  83,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 82, 68, 87, 89, 79. What is the median?',
  'mcq',
  '{"A": "87", "B": "81", "C": "79", "D": "82"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  84,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If 60 out of 150 are successful, what is the success rate (%)?',
  'mcq',
  '{"A": "60", "B": "90", "C": "25", "D": "40"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  85,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: In a feedback system, output increases by 4 units per cycle. After 6 cycles, increase?',
  'mcq',
  '{"A": "16", "B": "12", "C": "10", "D": "24"}'::jsonb,
  '"D"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  86,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 371 to 479. Approx % increase?',
  'mcq',
  '{"A": "29", "B": "24", "C": "12.79", "D": "34"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  87,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 29 L/min and drains at 15 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-14", "B": "14", "C": "44", "D": "435"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  88,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: In a feedback system, output increases by 1 units per cycle. After 6 cycles, increase?',
  'mcq',
  '{"A": "6", "B": "3", "C": "1", "D": "7"}'::jsonb,
  '"A"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  89,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Find the next number: 3, 6, 12, 24, ?',
  'mcq',
  '{"A": "36", "B": "48", "C": "54", "D": "42"}'::jsonb,
  '"B"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  90,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 270 increases by 18%. What is the new value?',
  'mcq',
  '{"A": "48.6", "B": "252", "C": "288", "D": "318.6"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  91,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 28, 43, 73, 25, 20. What is the median?',
  'mcq',
  '{"A": "25", "B": "43", "C": "28", "D": "37.8"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  92,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 30 L/min and drains at 7 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "23", "B": "210", "C": "-23", "D": "37"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  93,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 514 increases by 9%. What is the new value?',
  'mcq',
  '{"A": "505", "B": "560.26", "C": "523", "D": "46.26"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  94,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 237 to 277. Approx % increase?',
  'mcq',
  '{"A": "22", "B": "17", "C": "12", "D": "13.94"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  95,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 7^2 ÷ 7^1',
  'mcq',
  '{"A": "7", "B": "21", "C": "49", "D": "6"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  96,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If you can reduce failure risk from 0.3 to 0.2, risk reduction is:',
  'mcq',
  '{"A": "0.2", "B": "0.5", "C": "0.3", "D": "0.1"}'::jsonb,
  '"D"'::jsonb,
  'Expected value, complements, and decision principles.',
  97,
  true,
  '{"grade": 11, "dimension": "DR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 506 increases by 20%. What is the new value?',
  'mcq',
  '{"A": "101.2", "B": "486", "C": "526", "D": "607.2"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  98,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 612 increases by 18%. What is the new value?',
  'mcq',
  '{"A": "594", "B": "722.16", "C": "630", "D": "110.16"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  99,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 79 items/min for 2 minutes. Total processed?',
  'mcq',
  '{"A": "158", "B": "81", "C": "148", "D": "237"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  100,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 58, 29, 25, 29, 69. What is the median?',
  'mcq',
  '{"A": "58", "B": "42", "C": "29", "D": "164"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  101,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=3x+4. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "16", "B": "7", "C": "623", "D": "12"}'::jsonb,
  '"D"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  102,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 362 to 424. Approx % increase?',
  'mcq',
  '{"A": "17", "B": "21.29", "C": "12", "D": "22"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  103,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Find the next number: 1, 2, 4, 8, ?',
  'mcq',
  '{"A": "12", "B": "18", "C": "16", "D": "14"}'::jsonb,
  '"C"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  104,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 109 to 143. Approx % increase?',
  'mcq',
  '{"A": "3.52", "B": "31", "C": "26", "D": "36"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  105,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 11 L/min and drains at 7 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "18", "B": "-4", "C": "77", "D": "4"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  106,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 78, 23, 47. What is the mean?',
  'mcq',
  '{"A": "148", "B": "49.33", "C": "35", "D": "50.5"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  107,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 31, 26, 32, 51, 35. What is the median?',
  'mcq',
  '{"A": "35", "B": "31", "C": "138", "D": "32"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  108,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 37',
  'mcq',
  '{"A": "10", "B": "12", "C": "11", "D": "9"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  109,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 12 L/min and drains at 8 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "4", "B": "-4", "C": "96", "D": "20"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  110,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 9^4 ÷ 9^3',
  'mcq',
  '{"A": "81", "B": "45", "C": "9", "D": "8"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  111,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 292 increases by 18%. What is the new value?',
  'mcq',
  '{"A": "310", "B": "344.56", "C": "274", "D": "52.56"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  112,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 2x + 4. What is y when x = 13?',
  'mcq',
  '{"A": "26", "B": "30", "C": "52", "D": "6"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  113,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 398 to 482. Approx % increase?',
  'mcq',
  '{"A": "18.95", "B": "21", "C": "26", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  114,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 8^3 ÷ 8^2',
  'mcq',
  '{"A": "8", "B": "32", "C": "64", "D": "7"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  115,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=1x+2. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "8", "B": "2", "C": "4", "D": "5"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  116,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If risk of failure is 0.25, probability of success is:',
  'mcq',
  '{"A": "0.12", "B": "0.25", "C": "0.75", "D": "1.25"}'::jsonb,
  '"C"'::jsonb,
  'Expected value, complements, and decision principles.',
  117,
  true,
  '{"grade": 11, "dimension": "DR", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: An algorithm runs in O(n²). For n=10, operations scale to about:',
  'mcq',
  '{"A": "1024", "B": "100", "C": "20", "D": "12"}'::jsonb,
  '"B"'::jsonb,
  'Algorithmic intuition and step counting.',
  118,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 42 items/min for 3 minutes. Total processed?',
  'mcq',
  '{"A": "45", "B": "126", "C": "116", "D": "168"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  119,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 46',
  'mcq',
  '{"A": "12", "B": "13", "C": "15", "D": "14"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  120,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 4x + 1. What is y when x = 10?',
  'mcq',
  '{"A": "10", "B": "40", "C": "41", "D": "5"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  121,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 33% of 12?',
  'mcq',
  '{"A": "33.12", "B": "3.96", "C": "39.6", "D": "2.75"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  122,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 5, 12, 19, 26, ?',
  'mcq',
  '{"A": "26", "B": "33", "C": "19", "D": "40"}'::jsonb,
  '"B"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  123,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 125 respondents, 29 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "2.32", "B": "36.25", "C": "23.2", "D": "76.8"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  124,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=4x+4. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "16", "B": "112", "C": "201", "D": "8"}'::jsonb,
  '"A"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  125,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 45 items/min for 2 minutes. Total processed?',
  'mcq',
  '{"A": "90", "B": "47", "C": "135", "D": "80"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  126,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If probability of delay is 0.6, probability of no delay is:',
  'mcq',
  '{"A": "0.6", "B": "0.3", "C": "1.6", "D": "0.4"}'::jsonb,
  '"D"'::jsonb,
  'Expected value, complements, and decision principles.',
  127,
  true,
  '{"grade": 11, "dimension": "DR", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: An algorithm runs in O(n²). For n=11, operations scale to about:',
  'mcq',
  '{"A": "13", "B": "121", "C": "22", "D": "2048"}'::jsonb,
  '"B"'::jsonb,
  'Algorithmic intuition and step counting.',
  128,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 280 to 378. Approx % increase?',
  'mcq',
  '{"A": "35", "B": "8", "C": "30", "D": "40"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  129,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 244 respondents, 234 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "95.9", "B": "570.96", "C": "9.59", "D": "4.1"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  130,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹852. Profit 20%. Selling price?',
  'mcq',
  '{"A": "872", "B": "979.8", "C": "1022.4", "D": "1065"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  131,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 464 increases by 16%. What is the new value?',
  'mcq',
  '{"A": "538.24", "B": "480", "C": "74.24", "D": "448"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  132,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 54, 49, 40, 45, 62. What is the median?',
  'mcq',
  '{"A": "50", "B": "54", "C": "45", "D": "49"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  133,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 24% of 8?',
  'mcq',
  '{"A": "3", "B": "1.92", "C": "19.2", "D": "24.08"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  134,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 6, 9, 12, 15, ?',
  'mcq',
  '{"A": "15", "B": "18", "C": "12", "D": "21"}'::jsonb,
  '"B"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  135,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 41% of 42?',
  'mcq',
  '{"A": "0.98", "B": "17.22", "C": "172.2", "D": "41.42"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  136,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If risk of failure is 0.3, probability of success is:',
  'mcq',
  '{"A": "0.7", "B": "0.3", "C": "1.3", "D": "0.15"}'::jsonb,
  '"A"'::jsonb,
  'Expected value, complements, and decision principles.',
  137,
  true,
  '{"grade": 11, "dimension": "DR", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 2x + 2. What is y when x = 11?',
  'mcq',
  '{"A": "4", "B": "24", "C": "22", "D": "603"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  138,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 42 L/min and drains at 16 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "26", "B": "58", "C": "672", "D": "-26"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  139,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 325 increases by 15%. What is the new value?',
  'mcq',
  '{"A": "340", "B": "48.75", "C": "373.75", "D": "310"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  140,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 43, 74, 22. What is the mean?',
  'mcq',
  '{"A": "139", "B": "46.33", "C": "58.5", "D": "48"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  141,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 61',
  'mcq',
  '{"A": "19", "B": "20", "C": "18", "D": "17"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  142,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 6^4 ÷ 6^3',
  'mcq',
  '{"A": "30", "B": "36", "C": "5", "D": "6"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  143,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹280. Profit 10%. Selling price?',
  'mcq',
  '{"A": "322", "B": "294", "C": "290", "D": "308"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  144,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: In a feedback system, output increases by 3 units per cycle. After 6 cycles, increase?',
  'mcq',
  '{"A": "618", "B": "18", "C": "218", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  145,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 418 increases by 18%. What is the new value?',
  'mcq',
  '{"A": "436", "B": "493.24", "C": "400", "D": "75.24"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  146,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 31',
  'mcq',
  '{"A": "9", "B": "10", "C": "7", "D": "8"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  147,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 259 to 293. Approx % increase?',
  'mcq',
  '{"A": "18", "B": "8", "C": "19.92", "D": "13"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  148,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 80, 35, 21. What is the mean?',
  'mcq',
  '{"A": "57.5", "B": "28", "C": "136", "D": "45.33"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  149,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 34',
  'mcq',
  '{"A": "9", "B": "8", "C": "11", "D": "10"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  150,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 42 L/min and drains at 14 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "588", "B": "-28", "C": "28", "D": "56"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  151,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 36% of 44?',
  'mcq',
  '{"A": "0.82", "B": "36.44", "C": "15.84", "D": "158.4"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  152,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: An algorithm runs in O(n²). For n=9, operations scale to about:',
  'mcq',
  '{"A": "11", "B": "18", "C": "81", "D": "512"}'::jsonb,
  '"C"'::jsonb,
  'Algorithmic intuition and step counting.',
  153,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 98 items/min for 4 minutes. Total processed?',
  'mcq',
  '{"A": "102", "B": "490", "C": "382", "D": "392"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  154,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹830. Profit 12%. Selling price?',
  'mcq',
  '{"A": "888.1", "B": "929.6", "C": "971.1", "D": "842"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  155,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹791. Profit 15%. Selling price?',
  'mcq',
  '{"A": "909.65", "B": "949.2", "C": "806", "D": "870.1"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  156,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 52% of 29?',
  'mcq',
  '{"A": "15.08", "B": "52.29", "C": "1.79", "D": "150.8"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  157,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 51% of 53?',
  'mcq',
  '{"A": "0.96", "B": "27.03", "C": "270.3", "D": "51.53"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  158,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 20 L/min and drains at 3 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "60", "B": "17", "C": "23", "D": "-17"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  159,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 46, 85, 38, 15, 12. What is the median?',
  'mcq',
  '{"A": "39.2", "B": "38", "C": "15", "D": "46"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  160,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹871. Profit 10%. Selling price?',
  'mcq',
  '{"A": "958.1", "B": "881", "C": "1001.65", "D": "914.55"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  161,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 142 to 160. Approx % increase?',
  'mcq',
  '{"A": "8", "B": "13", "C": "10.92", "D": "18"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  162,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 25 L/min and drains at 10 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "15", "B": "250", "C": "-15", "D": "35"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  163,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 181 to 228. Approx % increase?',
  'mcq',
  '{"A": "6.96", "B": "31", "C": "21", "D": "26"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  164,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 310 respondents, 297 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "4.19", "B": "9.58", "C": "95.81", "D": "920.7"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  165,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 49, 38, 45. What is the mean?',
  'mcq',
  '{"A": "43.5", "B": "132", "C": "41.5", "D": "44"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  166,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 2x + 8. What is y when x = 8?',
  'mcq',
  '{"A": "16", "B": "24", "C": "10", "D": "64"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  167,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 2^4 ÷ 2^3',
  'mcq',
  '{"A": "1", "B": "10", "C": "2", "D": "4"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  168,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 58',
  'mcq',
  '{"A": "18", "B": "16", "C": "19", "D": "17"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  169,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 386 increases by 7%. What is the new value?',
  'mcq',
  '{"A": "27.02", "B": "379", "C": "413.02", "D": "393"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  170,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: In a feedback system, output increases by 8 units per cycle. After 6 cycles, increase?',
  'mcq',
  '{"A": "24", "B": "14", "C": "48", "D": "64"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  171,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 4x + 8. What is y when x = 10?',
  'mcq',
  '{"A": "40", "B": "48", "C": "12", "D": "80"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  172,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 85 items/min for 2 minutes. Total processed?',
  'mcq',
  '{"A": "160", "B": "255", "C": "170", "D": "87"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  173,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 502 increases by 20%. What is the new value?',
  'mcq',
  '{"A": "602.4", "B": "100.4", "C": "522", "D": "482"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  174,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 42% of 6?',
  'mcq',
  '{"A": "2.52", "B": "42.06", "C": "25.2", "D": "7"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  175,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 3x + 1. What is y when x = 10?',
  'mcq',
  '{"A": "31", "B": "4", "C": "10", "D": "30"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  176,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 2x + 3. What is y when x = 12?',
  'mcq',
  '{"A": "5", "B": "36", "C": "24", "D": "27"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  177,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: In a feedback system, output increases by 10 units per cycle. After 6 cycles, increase?',
  'mcq',
  '{"A": "60", "B": "30", "C": "100", "D": "16"}'::jsonb,
  '"A"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  178,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 305 to 342. Approx % increase?',
  'mcq',
  '{"A": "7", "B": "25.42", "C": "17", "D": "12"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  179,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 15 L/min and drains at 4 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-11", "B": "11", "C": "60", "D": "19"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  180,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 35% of 30?',
  'mcq',
  '{"A": "10.5", "B": "35.3", "C": "1.17", "D": "105"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  181,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: If risk of failure is 0.1, probability of success is:',
  'mcq',
  '{"A": "1.1", "B": "0.9", "C": "0.05", "D": "0.1"}'::jsonb,
  '"B"'::jsonb,
  'Expected value, complements, and decision principles.',
  182,
  true,
  '{"grade": 11, "dimension": "DR", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 32 L/min and drains at 7 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "25", "B": "-25", "C": "224", "D": "39"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  183,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 27, 20, 71. What is the mean?',
  'mcq',
  '{"A": "39.33", "B": "45.5", "C": "118", "D": "23.5"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  184,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 18 L/min and drains at 5 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "13", "B": "-13", "C": "90", "D": "23"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  185,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 71 items/min for 3 minutes. Total processed?',
  'mcq',
  '{"A": "213", "B": "284", "C": "203", "D": "74"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  186,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 65, 34, 46. What is the mean?',
  'mcq',
  '{"A": "48.33", "B": "49.5", "C": "145", "D": "40"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  187,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1094. Profit 10%. Selling price?',
  'mcq',
  '{"A": "1148.7", "B": "1203.4", "C": "1104", "D": "1258.1"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  188,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 221 to 298. Approx % increase?',
  'mcq',
  '{"A": "35", "B": "30", "C": "6.31", "D": "40"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  189,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 73% of 18?',
  'mcq',
  '{"A": "4.06", "B": "13.14", "C": "131.4", "D": "73.18"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  190,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: An algorithm runs in O(n²). For n=12, operations scale to about:',
  'mcq',
  '{"A": "4096", "B": "24", "C": "144", "D": "14"}'::jsonb,
  '"C"'::jsonb,
  'Algorithmic intuition and step counting.',
  191,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 613 increases by 7%. What is the new value?',
  'mcq',
  '{"A": "620", "B": "655.91", "C": "42.91", "D": "606"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  192,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 176 to 201. Approx % increase?',
  'mcq',
  '{"A": "9", "B": "19", "C": "14", "D": "12.57"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  193,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: In a feedback system, output increases by 2 units per cycle. After 6 cycles, increase?',
  'mcq',
  '{"A": "8", "B": "4", "C": "12", "D": "6"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  194,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 4, 12, 20, 28, ?',
  'mcq',
  '{"A": "28", "B": "20", "C": "36", "D": "44"}'::jsonb,
  '"C"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  195,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹368. Profit 25%. Selling price?',
  'mcq',
  '{"A": "393", "B": "460", "C": "441.6", "D": "478.4"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  196,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 3^2 ÷ 3^1',
  'mcq',
  '{"A": "3", "B": "2", "C": "509", "D": "9"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  197,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 53, 51, 40. What is the mean?',
  'mcq',
  '{"A": "144", "B": "45.5", "C": "52", "D": "48"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  198,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 42% of 54?',
  'mcq',
  '{"A": "0.78", "B": "226.8", "C": "22.68", "D": "42.54"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  199,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 72 items/min for 8 minutes. Total processed?',
  'mcq',
  '{"A": "648", "B": "576", "C": "566", "D": "80"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  200,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1077. Profit 10%. Selling price?',
  'mcq',
  '{"A": "1238.55", "B": "1087", "C": "1130.85", "D": "1184.7"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  201,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 39% of 53?',
  'mcq',
  '{"A": "206.7", "B": "39.53", "C": "20.67", "D": "0.74"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  202,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 217 increases by 14%. What is the new value?',
  'mcq',
  '{"A": "247.38", "B": "231", "C": "30.38", "D": "203"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  203,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 76 items/min for 8 minutes. Total processed?',
  'mcq',
  '{"A": "84", "B": "598", "C": "608", "D": "684"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  204,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 58% of 14?',
  'mcq',
  '{"A": "8.12", "B": "4.14", "C": "58.14", "D": "81.2"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  205,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 75% of 27?',
  'mcq',
  '{"A": "202.5", "B": "20.25", "C": "75.27", "D": "2.78"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  206,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 6x + 5. What is y when x = 16?',
  'mcq',
  '{"A": "96", "B": "101", "C": "80", "D": "11"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  207,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 2x + 3. What is y when x = 14?',
  'mcq',
  '{"A": "5", "B": "31", "C": "28", "D": "42"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  208,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 171 to 197. Approx % increase?',
  'mcq',
  '{"A": "10", "B": "15", "C": "20", "D": "11.4"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  209,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 41 L/min and drains at 7 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-34", "B": "287", "C": "34", "D": "48"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  210,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=1x+1. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "1", "B": "4", "C": "529", "D": "5"}'::jsonb,
  '"B"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  211,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 3^4 ÷ 3^3',
  'mcq',
  '{"A": "15", "B": "3", "C": "2", "D": "9"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  212,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 155 increases by 23%. What is the new value?',
  'mcq',
  '{"A": "132", "B": "190.65", "C": "178", "D": "35.65"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  213,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: An algorithm runs in O(n²). For n=8, operations scale to about:',
  'mcq',
  '{"A": "16", "B": "10", "C": "256", "D": "64"}'::jsonb,
  '"D"'::jsonb,
  'Algorithmic intuition and step counting.',
  214,
  true,
  '{"grade": 11, "dimension": "AT", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 4x + 8. What is y when x = 7?',
  'mcq',
  '{"A": "12", "B": "28", "C": "56", "D": "36"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  215,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=2x+3. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "8", "B": "580", "C": "6", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  216,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 14 L/min and drains at 5 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-9", "B": "19", "C": "70", "D": "9"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  217,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=2x+2. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "4", "B": "408", "C": "6", "D": "8"}'::jsonb,
  '"D"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  218,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 12 L/min and drains at 18 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "30", "B": "216", "C": "6", "D": "-6"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  219,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: In a feedback system, output increases by 9 units per cycle. After 6 cycles, increase?',
  'mcq',
  '{"A": "81", "B": "27", "C": "54", "D": "15"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  220,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 13',
  'mcq',
  '{"A": "3", "B": "4", "C": "2", "D": "1"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  221,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 33, 36, 21, 34, 55. What is the median?',
  'mcq',
  '{"A": "34", "B": "35.8", "C": "33", "D": "36"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  222,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 70',
  'mcq',
  '{"A": "23", "B": "22", "C": "20", "D": "21"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  223,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 73% of 54?',
  'mcq',
  '{"A": "39.42", "B": "73.54", "C": "1.35", "D": "394.2"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  224,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 85, 60, 52, 65, 78. What is the median?',
  'mcq',
  '{"A": "60", "B": "68", "C": "65", "D": "78"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  225,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 19',
  'mcq',
  '{"A": "4", "B": "3", "C": "5", "D": "6"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  226,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 83% of 10?',
  'mcq',
  '{"A": "372", "B": "83.1", "C": "83", "D": "8.3"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  227,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Find the next number: 6, 12, 24, 48, ?',
  'mcq',
  '{"A": "84", "B": "72", "C": "108", "D": "96"}'::jsonb,
  '"D"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  228,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 84 items/min for 8 minutes. Total processed?',
  'mcq',
  '{"A": "672", "B": "92", "C": "756", "D": "662"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  229,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 3x + 4. What is y when x = 18?',
  'mcq',
  '{"A": "72", "B": "54", "C": "7", "D": "58"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  230,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=5x+3. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "15", "B": "9", "C": "20", "D": "12"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  231,
  true,
  '{"grade": 11, "dimension": "ST", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 123 to 141. Approx % increase?',
  'mcq',
  '{"A": "15", "B": "10", "C": "20", "D": "8.2"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  232,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 182 respondents, 65 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "3.57", "B": "35.71", "C": "118.3", "D": "64.29"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  233,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 8, 16, 24, 32, ?',
  'mcq',
  '{"A": "24", "B": "48", "C": "32", "D": "40"}'::jsonb,
  '"D"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  234,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 68, 71, 55. What is the mean?',
  'mcq',
  '{"A": "64.67", "B": "194", "C": "69.5", "D": "63"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  235,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹560. Profit 20%. Selling price?',
  'mcq',
  '{"A": "700", "B": "672", "C": "580", "D": "644"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  236,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 21, 78, 28. What is the mean?',
  'mcq',
  '{"A": "127", "B": "53", "C": "42.33", "D": "49.5"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  237,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 199 respondents, 60 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "119.4", "B": "30.15", "C": "3.02", "D": "69.85"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  238,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 633 increases by 18%. What is the new value?',
  'mcq',
  '{"A": "113.94", "B": "651", "C": "615", "D": "746.94"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  239,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 432 increases by 12%. What is the new value?',
  'mcq',
  '{"A": "483.84", "B": "420", "C": "51.84", "D": "444"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  240,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 123 respondents, 85 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "104.55", "B": "69.11", "C": "6.91", "D": "30.89"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  241,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 20, 51, 60. What is the mean?',
  'mcq',
  '{"A": "55.5", "B": "43.67", "C": "131", "D": "35.5"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  242,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Find the next number: 5, 10, 20, 40, ?',
  'mcq',
  '{"A": "90", "B": "70", "C": "80", "D": "60"}'::jsonb,
  '"C"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  243,
  true,
  '{"grade": 11, "dimension": "AR", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 6x + 10. What is y when x = 9?',
  'mcq',
  '{"A": "16", "B": "90", "C": "54", "D": "64"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  244,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 4x + 1. What is y when x = 16?',
  'mcq',
  '{"A": "64", "B": "65", "C": "5", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  245,
  true,
  '{"grade": 11, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 17% of 21?',
  'mcq',
  '{"A": "0.81", "B": "17.21", "C": "3.57", "D": "35.7"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  246,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹314. Profit 12%. Selling price?',
  'mcq',
  '{"A": "351.68", "B": "335.98", "C": "367.38", "D": "326"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  247,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 47% of 7?',
  'mcq',
  '{"A": "6.71", "B": "47.07", "C": "32.9", "D": "3.29"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  248,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 86 respondents, 41 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "52.33", "B": "47.67", "C": "4.77", "D": "35.26"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  249,
  true,
  '{"grade": 11, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1354. Profit 20%. Selling price?',
  'mcq',
  '{"A": "1692.5", "B": "1624.8", "C": "1374", "D": "1557.1"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  250,
  true,
  '{"grade": 11, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 154 respondents, 98 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "150.92", "B": "36.36", "C": "63.64", "D": "6.36"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  251,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹723. Profit 20%. Selling price?',
  'mcq',
  '{"A": "743", "B": "903.75", "C": "831.45", "D": "867.6"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  252,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 34% of 22?',
  'mcq',
  '{"A": "1.55", "B": "34.22", "C": "74.8", "D": "7.48"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  253,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 62 items/min for 4 minutes. Total processed?',
  'mcq',
  '{"A": "310", "B": "248", "C": "66", "D": "238"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  254,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 2^3 ÷ 2^2',
  'mcq',
  '{"A": "2", "B": "1", "C": "4", "D": "8"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  255,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 51, 35, 42. What is the mean?',
  'mcq',
  '{"A": "43", "B": "38.5", "C": "128", "D": "42.67"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  256,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 23 L/min and drains at 8 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-15", "B": "184", "C": "15", "D": "31"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  257,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹753. Profit 25%. Selling price?',
  'mcq',
  '{"A": "903.6", "B": "778", "C": "941.25", "D": "978.9"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  258,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 17% of 10?',
  'mcq',
  '{"A": "17", "B": "1.7", "C": "17.1", "D": "567"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  259,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 25, 83, 90, 83, 54. What is the median?',
  'mcq',
  '{"A": "560", "B": "83", "C": "67", "D": "54"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  260,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1358. Profit 12%. Selling price?',
  'mcq',
  '{"A": "1453.06", "B": "1370", "C": "1520.96", "D": "1588.86"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  261,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 29 L/min and drains at 13 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-16", "B": "16", "C": "42", "D": "377"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  262,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 19, 13, 21, 48, 75. What is the median?',
  'mcq',
  '{"A": "35.2", "B": "19", "C": "48", "D": "21"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  263,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 12 L/min and drains at 9 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "3", "B": "108", "C": "21", "D": "-3"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  264,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 8^2 ÷ 8^1',
  'mcq',
  '{"A": "7", "B": "24", "C": "8", "D": "64"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  265,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Find the next number: 4, 8, 16, 32, ?',
  'mcq',
  '{"A": "48", "B": "56", "C": "72", "D": "64"}'::jsonb,
  '"D"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  266,
  true,
  '{"grade": 12, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 59, 53, 44. What is the mean?',
  'mcq',
  '{"A": "52", "B": "48.5", "C": "56", "D": "156"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  267,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 90 items/min for 1 minutes. Total processed?',
  'mcq',
  '{"A": "180", "B": "80", "C": "91", "D": "90"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  268,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 3, 12, 21, 30, ?',
  'mcq',
  '{"A": "21", "B": "30", "C": "48", "D": "39"}'::jsonb,
  '"D"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  269,
  true,
  '{"grade": 12, "dimension": "AR", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹812. Profit 5%. Selling price?',
  'mcq',
  '{"A": "893.2", "B": "852.6", "C": "812", "D": "817"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  270,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 541 increases by 11%. What is the new value?',
  'mcq',
  '{"A": "59.51", "B": "530", "C": "552", "D": "600.51"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  271,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 6x + 3. What is y when x = 3?',
  'mcq',
  '{"A": "274", "B": "9", "C": "21", "D": "18"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  272,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 91 items/min for 1 minutes. Total processed?',
  'mcq',
  '{"A": "81", "B": "91", "C": "92", "D": "182"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  273,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 466 increases by 19%. What is the new value?',
  'mcq',
  '{"A": "447", "B": "554.54", "C": "88.54", "D": "485"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  274,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 374 to 497. Approx % increase?',
  'mcq',
  '{"A": "28", "B": "11.33", "C": "33", "D": "38"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  275,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 1, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 13 L/min and drains at 6 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "19", "B": "7", "C": "-7", "D": "78"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  276,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 2x + 2. What is y when x = 6?',
  'mcq',
  '{"A": "12", "B": "4", "C": "254", "D": "14"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  277,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1465. Profit 20%. Selling price?',
  'mcq',
  '{"A": "1758", "B": "1831.25", "C": "1485", "D": "1684.75"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  278,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 54 items/min for 3 minutes. Total processed?',
  'mcq',
  '{"A": "57", "B": "152", "C": "162", "D": "216"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  279,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 3, 11, 19, 27, ?',
  'mcq',
  '{"A": "19", "B": "35", "C": "43", "D": "27"}'::jsonb,
  '"B"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  280,
  true,
  '{"grade": 12, "dimension": "AR", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 6x + 1. What is y when x = 5?',
  'mcq',
  '{"A": "7", "B": "31", "C": "5", "D": "30"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  281,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 442 increases by 22%. What is the new value?',
  'mcq',
  '{"A": "97.24", "B": "464", "C": "539.24", "D": "420"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  282,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 181 increases by 15%. What is the new value?',
  'mcq',
  '{"A": "208.15", "B": "196", "C": "166", "D": "27.15"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  283,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 13 L/min and drains at 14 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "27", "B": "1", "C": "182", "D": "-1"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  284,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1308. Profit 10%. Selling price?',
  'mcq',
  '{"A": "1504.2", "B": "1318", "C": "1373.4", "D": "1438.8"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  285,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 182 increases by 10%. What is the new value?',
  'mcq',
  '{"A": "18.2", "B": "192", "C": "172", "D": "200.2"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  286,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1263. Profit 15%. Selling price?',
  'mcq',
  '{"A": "1389.3", "B": "1278", "C": "1515.6", "D": "1452.45"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  287,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹910. Profit 12%. Selling price?',
  'mcq',
  '{"A": "973.7", "B": "1064.7", "C": "1019.2", "D": "922"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  288,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=5x+1. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "20", "B": "5", "C": "4", "D": "9"}'::jsonb,
  '"A"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  289,
  true,
  '{"grade": 12, "dimension": "ST", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹632. Profit 12%. Selling price?',
  'mcq',
  '{"A": "739.44", "B": "676.24", "C": "644", "D": "707.84"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  290,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 3x + 7. What is y when x = 4?',
  'mcq',
  '{"A": "12", "B": "10", "C": "19", "D": "28"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  291,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹531. Profit 25%. Selling price?',
  'mcq',
  '{"A": "663.75", "B": "690.3", "C": "556", "D": "637.2"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  292,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 25',
  'mcq',
  '{"A": "8", "B": "7", "C": "6", "D": "5"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  293,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 5^2 ÷ 5^1',
  'mcq',
  '{"A": "25", "B": "5", "C": "4", "D": "15"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  294,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 219 respondents, 184 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "15.98", "B": "402.96", "C": "8.4", "D": "84.02"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  295,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 31, 55, 74. What is the mean?',
  'mcq',
  '{"A": "43", "B": "53.33", "C": "64.5", "D": "160"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  296,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 72 items/min for 4 minutes. Total processed?',
  'mcq',
  '{"A": "278", "B": "76", "C": "360", "D": "288"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  297,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 33, 62, 53. What is the mean?',
  'mcq',
  '{"A": "57.5", "B": "47.5", "C": "148", "D": "49.33"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  298,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 2x + 1. What is y when x = 4?',
  'mcq',
  '{"A": "3", "B": "4", "C": "9", "D": "8"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  299,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 269 increases by 20%. What is the new value?',
  'mcq',
  '{"A": "249", "B": "322.8", "C": "53.8", "D": "289"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  300,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 2, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 6x + 6. What is y when x = 11?',
  'mcq',
  '{"A": "20", "B": "72", "C": "66", "D": "12"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  301,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 65, 84, 27, 89, 68. What is the median?',
  'mcq',
  '{"A": "68", "B": "84", "C": "66.6", "D": "65"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  302,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 27 L/min and drains at 14 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "378", "B": "-13", "C": "41", "D": "13"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  303,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 340 to 401. Approx % increase?',
  'mcq',
  '{"A": "13", "B": "18.89", "C": "18", "D": "23"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  304,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 292 to 318. Approx % increase?',
  'mcq',
  '{"A": "4", "B": "14", "C": "9", "D": "32.44"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  305,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 75 items/min for 2 minutes. Total processed?',
  'mcq',
  '{"A": "140", "B": "150", "C": "77", "D": "225"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  306,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 53, 37, 45. What is the mean?',
  'mcq',
  '{"A": "878", "B": "41", "C": "135", "D": "45"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  307,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 28 L/min and drains at 9 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-19", "B": "37", "C": "19", "D": "252"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  308,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1337. Profit 15%. Selling price?',
  'mcq',
  '{"A": "1470.7", "B": "1604.4", "C": "1352", "D": "1537.55"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  309,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 58, 85, 29, 58, 86. What is the median?',
  'mcq',
  '{"A": "58", "B": "63.2", "C": "85", "D": "912"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  310,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 67, 13, 23, 15, 52. What is the median?',
  'mcq',
  '{"A": "34", "B": "15", "C": "23", "D": "52"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  311,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 3^3 ÷ 3^2',
  'mcq',
  '{"A": "3", "B": "2", "C": "9", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  312,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 47 items/min for 1 minutes. Total processed?',
  'mcq',
  '{"A": "37", "B": "47", "C": "48", "D": "94"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  313,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 133 respondents, 10 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "92.48", "B": "7.52", "C": "13.3", "D": "0.75"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  314,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 49, 26, 27. What is the mean?',
  'mcq',
  '{"A": "37.5", "B": "102", "C": "26.5", "D": "34"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  315,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 59, 26, 38. What is the mean?',
  'mcq',
  '{"A": "32", "B": "42.5", "C": "41", "D": "123"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  316,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 43',
  'mcq',
  '{"A": "12", "B": "14", "C": "11", "D": "13"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  317,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 171 respondents, 52 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "88.92", "B": "3.04", "C": "69.59", "D": "30.41"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  318,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1223. Profit 10%. Selling price?',
  'mcq',
  '{"A": "1345.3", "B": "1406.45", "C": "1284.15", "D": "1233"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  319,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 2x + 8. What is y when x = 10?',
  'mcq',
  '{"A": "28", "B": "10", "C": "80", "D": "20"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  320,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 440 increases by 18%. What is the new value?',
  'mcq',
  '{"A": "519.2", "B": "422", "C": "458", "D": "79.2"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  321,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 88, 72, 79, 78, 14. What is the median?',
  'mcq',
  '{"A": "78", "B": "66.2", "C": "79", "D": "72"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  322,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 57% of 36?',
  'mcq',
  '{"A": "57.36", "B": "20.52", "C": "205.2", "D": "1.58"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  323,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: In a feedback system, output increases by 6 units per cycle. After 6 cycles, increase?',
  'mcq',
  '{"A": "36", "B": "517", "C": "18", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  324,
  true,
  '{"grade": 12, "dimension": "ST", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 68 items/min for 2 minutes. Total processed?',
  'mcq',
  '{"A": "70", "B": "136", "C": "204", "D": "126"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  325,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 3, "time_target_sec": 45}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 8^4 ÷ 8^3',
  'mcq',
  '{"A": "8", "B": "7", "C": "64", "D": "40"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  326,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 16 L/min and drains at 8 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "128", "B": "8", "C": "24", "D": "-8"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  327,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1281. Profit 15%. Selling price?',
  'mcq',
  '{"A": "1473.15", "B": "1296", "C": "1537.2", "D": "1409.1"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  328,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 33, 34, 27, 89, 47. What is the median?',
  'mcq',
  '{"A": "33", "B": "34", "C": "46", "D": "47"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  329,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 210 respondents, 106 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "222.6", "B": "49.52", "C": "5.05", "D": "50.48"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  330,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 174 increases by 19%. What is the new value?',
  'mcq',
  '{"A": "33.06", "B": "155", "C": "193", "D": "207.06"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  331,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 142 to 152. Approx % increase?',
  'mcq',
  '{"A": "20.29", "B": "7", "C": "2", "D": "12"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  332,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1203. Profit 15%. Selling price?',
  'mcq',
  '{"A": "1323.3", "B": "1443.6", "C": "1383.45", "D": "1218"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  333,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹446. Profit 12%. Selling price?',
  'mcq',
  '{"A": "458", "B": "477.22", "C": "499.52", "D": "521.82"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  334,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 49, 27, 28. What is the mean?',
  'mcq',
  '{"A": "38", "B": "104", "C": "27.5", "D": "34.67"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  335,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 338 increases by 13%. What is the new value?',
  'mcq',
  '{"A": "325", "B": "43.94", "C": "351", "D": "381.94"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  336,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1508. Profit 20%. Selling price?',
  'mcq',
  '{"A": "1528", "B": "1809.6", "C": "1734.2", "D": "1885"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  337,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 2, 4, 6, 8, ?',
  'mcq',
  '{"A": "6", "B": "10", "C": "12", "D": "8"}'::jsonb,
  '"B"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  338,
  true,
  '{"grade": 12, "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 256 respondents, 234 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "599.04", "B": "9.14", "C": "8.59", "D": "91.41"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  339,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 389 to 521. Approx % increase?',
  'mcq',
  '{"A": "34", "B": "29", "C": "11.44", "D": "39"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  340,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 471 increases by 8%. What is the new value?',
  'mcq',
  '{"A": "37.68", "B": "479", "C": "508.68", "D": "463"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  341,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 288 increases by 5%. What is the new value?',
  'mcq',
  '{"A": "14.4", "B": "302.4", "C": "283", "D": "293"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  342,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 30 L/min and drains at 5 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "35", "B": "25", "C": "-25", "D": "150"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  343,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 29% of 15?',
  'mcq',
  '{"A": "29.15", "B": "43.5", "C": "1.93", "D": "4.35"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  344,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 8, 15, 22, 29, ?',
  'mcq',
  '{"A": "36", "B": "29", "C": "22", "D": "43"}'::jsonb,
  '"A"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  345,
  true,
  '{"grade": 12, "dimension": "AR", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 6x + 8. What is y when x = 3?',
  'mcq',
  '{"A": "26", "B": "14", "C": "24", "D": "18"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  346,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 103 to 134. Approx % increase?',
  'mcq',
  '{"A": "30", "B": "3.43", "C": "25", "D": "35"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  347,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 130 respondents, 74 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "43.08", "B": "96.2", "C": "5.69", "D": "56.92"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  348,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=2x+1. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "6", "B": "4", "C": "8", "D": "2"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  349,
  true,
  '{"grade": 12, "dimension": "ST", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 6^3 ÷ 6^2',
  'mcq',
  '{"A": "36", "B": "24", "C": "6", "D": "5"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  350,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 4, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 9, 11, 13, 15, ?',
  'mcq',
  '{"A": "15", "B": "13", "C": "17", "D": "19"}'::jsonb,
  '"C"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  351,
  true,
  '{"grade": 12, "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 5x + 6. What is y when x = 5?',
  'mcq',
  '{"A": "30", "B": "31", "C": "11", "D": "25"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  352,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 28 L/min and drains at 14 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "42", "B": "392", "C": "-14", "D": "14"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  353,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 70, 49, 69. What is the mean?',
  'mcq',
  '{"A": "188", "B": "62.67", "C": "59", "D": "59.5"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  354,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 3x + 10. What is y when x = 7?',
  'mcq',
  '{"A": "21", "B": "31", "C": "13", "D": "70"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  355,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 42% of 48?',
  'mcq',
  '{"A": "20.16", "B": "42.48", "C": "201.6", "D": "0.88"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  356,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 513 increases by 6%. What is the new value?',
  'mcq',
  '{"A": "507", "B": "519", "C": "30.78", "D": "543.78"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  357,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹249. Profit 10%. Selling price?',
  'mcq',
  '{"A": "261.45", "B": "273.9", "C": "259", "D": "286.35"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  358,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 241 respondents, 39 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "1.62", "B": "83.82", "C": "16.18", "D": "93.99"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  359,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 22',
  'mcq',
  '{"A": "7", "B": "5", "C": "6", "D": "4"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  360,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1039. Profit 20%. Selling price?',
  'mcq',
  '{"A": "1194.85", "B": "1246.8", "C": "1298.75", "D": "1059"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  361,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 3x + 6. What is y when x = 13?',
  'mcq',
  '{"A": "45", "B": "9", "C": "39", "D": "78"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  362,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 52% of 34?',
  'mcq',
  '{"A": "17.68", "B": "52.34", "C": "176.8", "D": "1.53"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  363,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 6x + 4. What is y when x = 3?',
  'mcq',
  '{"A": "22", "B": "18", "C": "10", "D": "12"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  364,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹322. Profit 5%. Selling price?',
  'mcq',
  '{"A": "322", "B": "327", "C": "354.2", "D": "338.1"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  365,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 16% of 10?',
  'mcq',
  '{"A": "16.1", "B": "16", "C": "1.6", "D": "411"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  366,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 265 respondents, 74 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "196.1", "B": "72.08", "C": "27.92", "D": "2.79"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  367,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 45, 26, 36. What is the mean?',
  'mcq',
  '{"A": "35.5", "B": "107", "C": "35.67", "D": "31"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  368,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 50, 53, 56, 25, 36. What is the median?',
  'mcq',
  '{"A": "50", "B": "44", "C": "36", "D": "53"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  369,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 57% of 29?',
  'mcq',
  '{"A": "165.3", "B": "1.97", "C": "57.29", "D": "16.53"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  370,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 9, 12, 15, 18, ?',
  'mcq',
  '{"A": "21", "B": "24", "C": "18", "D": "15"}'::jsonb,
  '"A"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  371,
  true,
  '{"grade": 12, "dimension": "AR", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 44 items/min for 6 minutes. Total processed?',
  'mcq',
  '{"A": "308", "B": "254", "C": "264", "D": "50"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  372,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 72% of 44?',
  'mcq',
  '{"A": "1.64", "B": "31.68", "C": "72.44", "D": "316.8"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  373,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 32% of 19?',
  'mcq',
  '{"A": "1.68", "B": "60.8", "C": "6.08", "D": "32.19"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  374,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 22 L/min and drains at 4 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-18", "B": "88", "C": "18", "D": "26"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  375,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 5, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 39% of 6?',
  'mcq',
  '{"A": "39.06", "B": "23.4", "C": "6.5", "D": "2.34"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  376,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 41 L/min and drains at 17 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-24", "B": "58", "C": "697", "D": "24"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  377,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 162 increases by 8%. What is the new value?',
  'mcq',
  '{"A": "12.96", "B": "170", "C": "154", "D": "174.96"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  378,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 33 L/min and drains at 10 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "330", "B": "43", "C": "-23", "D": "23"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  379,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 69, 16, 16, 22, 77. What is the median?',
  'mcq',
  '{"A": "22", "B": "16", "C": "40", "D": "69"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  380,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 16 L/min and drains at 9 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "144", "B": "-7", "C": "25", "D": "7"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  381,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 12 L/min and drains at 17 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "204", "B": "5", "C": "-5", "D": "29"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  382,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 76 items/min for 2 minutes. Total processed?',
  'mcq',
  '{"A": "152", "B": "142", "C": "78", "D": "228"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  383,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 3x + 6. What is y when x = 4?',
  'mcq',
  '{"A": "24", "B": "12", "C": "9", "D": "18"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  384,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 54, 23, 79. What is the mean?',
  'mcq',
  '{"A": "52", "B": "51", "C": "38.5", "D": "156"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  385,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: An algorithm runs in O(n²). For n=5, operations scale to about:',
  'mcq',
  '{"A": "10", "B": "7", "C": "32", "D": "25"}'::jsonb,
  '"D"'::jsonb,
  'Algorithmic intuition and step counting.',
  386,
  true,
  '{"grade": 12, "dimension": "AT", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 32 L/min and drains at 12 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "44", "B": "-20", "C": "20", "D": "384"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  387,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 66% of 37?',
  'mcq',
  '{"A": "244.2", "B": "66.37", "C": "1.78", "D": "24.42"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  388,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 2x + 6. What is y when x = 7?',
  'mcq',
  '{"A": "8", "B": "42", "C": "20", "D": "14"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  389,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 61, 34, 75. What is the mean?',
  'mcq',
  '{"A": "54.5", "B": "47.5", "C": "56.67", "D": "170"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  390,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 47% of 10?',
  'mcq',
  '{"A": "47.1", "B": "479", "C": "47", "D": "4.7"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  391,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 61, 79, 17, 79, 24. What is the median?',
  'mcq',
  '{"A": "52", "B": "79", "C": "24", "D": "61"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  392,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 70% of 10?',
  'mcq',
  '{"A": "372", "B": "7", "C": "70", "D": "70.1"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  393,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹755. Profit 20%. Selling price?',
  'mcq',
  '{"A": "775", "B": "868.25", "C": "906", "D": "943.75"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  394,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 7, 12, 17, 22, ?',
  'mcq',
  '{"A": "22", "B": "27", "C": "32", "D": "17"}'::jsonb,
  '"B"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  395,
  true,
  '{"grade": 12, "dimension": "AR", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=4x+3. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "8", "B": "12", "C": "16", "D": "14"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  396,
  true,
  '{"grade": 12, "dimension": "ST", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 56% of 37?',
  'mcq',
  '{"A": "56.37", "B": "207.2", "C": "1.51", "D": "20.72"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  397,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 189 respondents, 69 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "3.65", "B": "36.51", "C": "63.49", "D": "130.41"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  398,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹547. Profit 10%. Selling price?',
  'mcq',
  '{"A": "601.7", "B": "557", "C": "574.35", "D": "629.05"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  399,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1489. Profit 5%. Selling price?',
  'mcq',
  '{"A": "1563.45", "B": "1489", "C": "1494", "D": "1637.9"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  400,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 6, "time_target_sec": 60}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1265. Profit 5%. Selling price?',
  'mcq',
  '{"A": "1265", "B": "1270", "C": "1391.5", "D": "1328.25"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  401,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 5x + 5. What is y when x = 15?',
  'mcq',
  '{"A": "80", "B": "10", "C": "278", "D": "75"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  402,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1506. Profit 10%. Selling price?',
  'mcq',
  '{"A": "1516", "B": "1656.6", "C": "1731.9", "D": "1581.3"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  403,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 299 to 401. Approx % increase?',
  'mcq',
  '{"A": "8.79", "B": "34", "C": "39", "D": "29"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  404,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 19 L/min and drains at 6 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-13", "B": "114", "C": "25", "D": "13"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  405,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 248 increases by 15%. What is the new value?',
  'mcq',
  '{"A": "233", "B": "285.2", "C": "263", "D": "37.2"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  406,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 332 to 402. Approx % increase?',
  'mcq',
  '{"A": "21", "B": "26", "C": "16", "D": "15.81"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  407,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 279 to 368. Approx % increase?',
  'mcq',
  '{"A": "8.72", "B": "27", "C": "37", "D": "32"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  408,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 56% of 46?',
  'mcq',
  '{"A": "25.76", "B": "1.22", "C": "257.6", "D": "56.46"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  409,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 23 L/min and drains at 13 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-10", "B": "299", "C": "36", "D": "10"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  410,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 79, 64, 22. What is the mean?',
  'mcq',
  '{"A": "55", "B": "43", "C": "165", "D": "71.5"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  411,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 5x + 9. What is y when x = 7?',
  'mcq',
  '{"A": "63", "B": "35", "C": "44", "D": "14"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  412,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 4x + 9. What is y when x = 15?',
  'mcq',
  '{"A": "69", "B": "60", "C": "135", "D": "13"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  413,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 38, 31, 32, 75, 73. What is the median?',
  'mcq',
  '{"A": "73", "B": "38", "C": "49.8", "D": "32"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  414,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 102 to 123. Approx % increase?',
  'mcq',
  '{"A": "4.86", "B": "16", "C": "21", "D": "26"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  415,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 64',
  'mcq',
  '{"A": "18", "B": "19", "C": "20", "D": "21"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  416,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 34 L/min and drains at 17 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "51", "B": "17", "C": "-17", "D": "578"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  417,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 6^2 ÷ 6^1',
  'mcq',
  '{"A": "18", "B": "6", "C": "5", "D": "36"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  418,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 329 to 365. Approx % increase?',
  'mcq',
  '{"A": "29.91", "B": "11", "C": "6", "D": "16"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  419,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 238 to 250. Approx % increase?',
  'mcq',
  '{"A": "10", "B": "47.6", "C": "5", "D": "0"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  420,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 72 items/min for 5 minutes. Total processed?',
  'mcq',
  '{"A": "432", "B": "360", "C": "77", "D": "350"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  421,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 2x + 6. What is y when x = 8?',
  'mcq',
  '{"A": "22", "B": "16", "C": "8", "D": "48"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  422,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 152 respondents, 113 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "74.34", "B": "25.66", "C": "7.43", "D": "171.76"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  423,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1026. Profit 5%. Selling price?',
  'mcq',
  '{"A": "1026", "B": "1031", "C": "1077.3", "D": "1128.6"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  424,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 5x + 10. What is y when x = 14?',
  'mcq',
  '{"A": "70", "B": "15", "C": "140", "D": "80"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  425,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 7, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1098. Profit 10%. Selling price?',
  'mcq',
  '{"A": "1108", "B": "1152.9", "C": "1207.8", "D": "1262.7"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  426,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=4x+5. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "165", "B": "16", "C": "8", "D": "20"}'::jsonb,
  '"B"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  427,
  true,
  '{"grade": 12, "dimension": "ST", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 66% of 47?',
  'mcq',
  '{"A": "31.02", "B": "66.47", "C": "310.2", "D": "1.4"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  428,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 3x + 7. What is y when x = 15?',
  'mcq',
  '{"A": "52", "B": "105", "C": "10", "D": "45"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  429,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 32 L/min and drains at 13 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "45", "B": "-19", "C": "19", "D": "416"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  430,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 48, 30, 37. What is the mean?',
  'mcq',
  '{"A": "33.5", "B": "115", "C": "39", "D": "38.33"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  431,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 19, 19, 86, 20, 59. What is the median?',
  'mcq',
  '{"A": "19", "B": "20", "C": "59", "D": "40.6"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  432,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 293 respondents, 17 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "94.2", "B": "0.58", "C": "5.8", "D": "49.81"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  433,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 199 increases by 16%. What is the new value?',
  'mcq',
  '{"A": "31.84", "B": "183", "C": "215", "D": "230.84"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  434,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 67% of 19?',
  'mcq',
  '{"A": "12.73", "B": "3.53", "C": "127.3", "D": "67.19"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  435,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 695 increases by 13%. What is the new value?',
  'mcq',
  '{"A": "785.35", "B": "682", "C": "708", "D": "90.35"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  436,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1649. Profit 5%. Selling price?',
  'mcq',
  '{"A": "1654", "B": "1813.9", "C": "1731.45", "D": "1649"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  437,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 5x + 8. What is y when x = 14?',
  'mcq',
  '{"A": "13", "B": "70", "C": "78", "D": "112"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  438,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Out of 299 respondents, 25 chose Option X. What percentage chose X?',
  'mcq',
  '{"A": "91.64", "B": "74.75", "C": "0.84", "D": "8.36"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  439,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 3x + 7. What is y when x = 5?',
  'mcq',
  '{"A": "22", "B": "35", "C": "10", "D": "15"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  440,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1586. Profit 5%. Selling price?',
  'mcq',
  '{"A": "1591", "B": "1586", "C": "1744.6", "D": "1665.3"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  441,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=2x+5. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "20", "B": "6", "C": "8", "D": "10"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  442,
  true,
  '{"grade": 12, "dimension": "ST", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 77 items/min for 7 minutes. Total processed?',
  'mcq',
  '{"A": "84", "B": "529", "C": "539", "D": "616"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  443,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 29, 51, 30, 65, 31. What is the median?',
  'mcq',
  '{"A": "41.2", "B": "30", "C": "31", "D": "51"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  444,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 14 L/min and drains at 17 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-3", "B": "238", "C": "31", "D": "3"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  445,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 4, 11, 18, 25, ?',
  'mcq',
  '{"A": "32", "B": "18", "C": "39", "D": "25"}'::jsonb,
  '"A"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  446,
  true,
  '{"grade": 12, "dimension": "AR", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 2x + 3. What is y when x = 16?',
  'mcq',
  '{"A": "35", "B": "48", "C": "5", "D": "32"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  447,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 151 increases by 17%. What is the new value?',
  'mcq',
  '{"A": "134", "B": "168", "C": "25.67", "D": "176.67"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  448,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 25% of 8?',
  'mcq',
  '{"A": "2", "B": "20", "C": "3.12", "D": "25.08"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  449,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 67 items/min for 4 minutes. Total processed?',
  'mcq',
  '{"A": "71", "B": "268", "C": "258", "D": "335"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  450,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 8, "time_target_sec": 75}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 24, 63, 55. What is the mean?',
  'mcq',
  '{"A": "59", "B": "47.33", "C": "43.5", "D": "142"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  451,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 80 items/min for 5 minutes. Total processed?',
  'mcq',
  '{"A": "480", "B": "400", "C": "390", "D": "85"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  452,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: System rule y=3x+3. If x increases by 4, y increases by?',
  'mcq',
  '{"A": "263", "B": "7", "C": "12", "D": "9"}'::jsonb,
  '"C"'::jsonb,
  'Interdependency, proportionality, and system aggregation.',
  453,
  true,
  '{"grade": 12, "dimension": "ST", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 41 items/min for 5 minutes. Total processed?',
  'mcq',
  '{"A": "246", "B": "46", "C": "205", "D": "195"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  454,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 106 items/min for 1 minutes. Total processed?',
  'mcq',
  '{"A": "212", "B": "106", "C": "96", "D": "107"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  455,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 13 L/min and drains at 18 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-5", "B": "5", "C": "234", "D": "31"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  456,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 49',
  'mcq',
  '{"A": "15", "B": "16", "C": "14", "D": "13"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  457,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1033. Profit 5%. Selling price?',
  'mcq',
  '{"A": "1084.65", "B": "1038", "C": "1136.3", "D": "1033"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  458,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1667. Profit 15%. Selling price?',
  'mcq',
  '{"A": "1917.05", "B": "1833.7", "C": "2000.4", "D": "1682"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  459,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹731. Profit 25%. Selling price?',
  'mcq',
  '{"A": "913.75", "B": "756", "C": "877.2", "D": "950.3"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  460,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 55',
  'mcq',
  '{"A": "15", "B": "18", "C": "17", "D": "16"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  461,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 41% of 34?',
  'mcq',
  '{"A": "41.34", "B": "1.21", "C": "139.4", "D": "13.94"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  462,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Pattern: 6, 10, 14, 18, ?',
  'mcq',
  '{"A": "26", "B": "22", "C": "18", "D": "14"}'::jsonb,
  '"B"'::jsonb,
  'Pattern / abstraction / symbol reasoning.',
  463,
  true,
  '{"grade": 12, "dimension": "AR", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 11 L/min and drains at 16 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-5", "B": "5", "C": "27", "D": "176"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  464,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 40, 55, 64. What is the mean?',
  'mcq',
  '{"A": "159", "B": "53", "C": "47.5", "D": "59.5"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  465,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 84% of 29?',
  'mcq',
  '{"A": "84.29", "B": "24.36", "C": "2.9", "D": "243.6"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  466,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 3x + 9. What is y when x = 11?',
  'mcq',
  '{"A": "42", "B": "12", "C": "33", "D": "99"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  467,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 39, 35, 60. What is the mean?',
  'mcq',
  '{"A": "47.5", "B": "134", "C": "37", "D": "44.67"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  468,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 41% of 27?',
  'mcq',
  '{"A": "41.27", "B": "11.07", "C": "1.52", "D": "110.7"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  469,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1685. Profit 25%. Selling price?',
  'mcq',
  '{"A": "2190.5", "B": "1710", "C": "2106.25", "D": "2022"}'::jsonb,
  '"C"'::jsonb,
  'Quantitative aptitude (fast compute).',
  470,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹526. Profit 12%. Selling price?',
  'mcq',
  '{"A": "615.42", "B": "538", "C": "562.82", "D": "589.12"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  471,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 50, 48, 26. What is the mean?',
  'mcq',
  '{"A": "124", "B": "41.33", "C": "37", "D": "49"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  472,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 108 to 131. Approx % increase?',
  'mcq',
  '{"A": "16", "B": "21", "C": "5.14", "D": "26"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  473,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Simplify: 5^3 ÷ 5^2',
  'mcq',
  '{"A": "25", "B": "20", "C": "4", "D": "5"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  474,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 216 increases by 22%. What is the new value?',
  'mcq',
  '{"A": "47.52", "B": "238", "C": "194", "D": "263.52"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  475,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 9, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: What is 38% of 36?',
  'mcq',
  '{"A": "13.68", "B": "38.36", "C": "136.8", "D": "1.06"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  476,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 15 L/min and drains at 9 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "24", "B": "6", "C": "135", "D": "-6"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  477,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 13 L/min and drains at 9 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "4", "B": "117", "C": "22", "D": "-4"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  478,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 21 L/min and drains at 15 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "6", "B": "36", "C": "-6", "D": "315"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  479,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 33 L/min and drains at 22 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-11", "B": "726", "C": "11", "D": "55"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  480,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 29, 54, 50. What is the mean?',
  'mcq',
  '{"A": "44.33", "B": "52", "C": "133", "D": "41.5"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  481,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1305. Profit 5%. Selling price?',
  'mcq',
  '{"A": "1435.5", "B": "1370.25", "C": "1305", "D": "1310"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  482,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1296. Profit 12%. Selling price?',
  'mcq',
  '{"A": "1308", "B": "1386.72", "C": "1516.32", "D": "1451.52"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  483,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 10 L/min and drains at 7 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "-3", "B": "17", "C": "3", "D": "70"}'::jsonb,
  '"C"'::jsonb,
  'Multi-step but quick analytical computation.',
  484,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A device processes 81 items/min for 9 minutes. Total processed?',
  'mcq',
  '{"A": "729", "B": "90", "C": "719", "D": "810"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  485,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 6x + 2. What is y when x = 10?',
  'mcq',
  '{"A": "20", "B": "62", "C": "8", "D": "60"}'::jsonb,
  '"B"'::jsonb,
  'Multi-step but quick analytical computation.',
  486,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 46, 60, 48. What is the mean?',
  'mcq',
  '{"A": "53", "B": "51.33", "C": "154", "D": "54"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  487,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Values are 48, 24, 39. What is the mean?',
  'mcq',
  '{"A": "111", "B": "37", "C": "31.5", "D": "36"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  488,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 5x + 7. What is y when x = 14?',
  'mcq',
  '{"A": "98", "B": "70", "C": "12", "D": "77"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  489,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 203 to 258. Approx % increase?',
  'mcq',
  '{"A": "32", "B": "27", "C": "7.52", "D": "22"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  490,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A system follows y = 3x + 9. What is y when x = 4?',
  'mcq',
  '{"A": "12", "B": "567", "C": "36", "D": "21"}'::jsonb,
  '"D"'::jsonb,
  'Multi-step but quick analytical computation.',
  491,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A value of 424 increases by 21%. What is the new value?',
  'mcq',
  '{"A": "403", "B": "513.04", "C": "89.04", "D": "445"}'::jsonb,
  '"B"'::jsonb,
  'Quantitative aptitude (fast compute).',
  492,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A tank is filled at 46 L/min and drains at 18 L/min simultaneously. Net fill rate?',
  'mcq',
  '{"A": "28", "B": "828", "C": "-28", "D": "64"}'::jsonb,
  '"A"'::jsonb,
  'Multi-step but quick analytical computation.',
  493,
  true,
  '{"grade": 12, "dimension": "AN", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: An algorithm runs in O(n²). For n=13, operations scale to about:',
  'mcq',
  '{"A": "169", "B": "15", "C": "8192", "D": "26"}'::jsonb,
  '"A"'::jsonb,
  'Algorithmic intuition and step counting.',
  494,
  true,
  '{"grade": 12, "dimension": "AT", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Cost price ₹1059. Profit 5%. Selling price?',
  'mcq',
  '{"A": "1164.9", "B": "1064", "C": "1059", "D": "1111.95"}'::jsonb,
  '"D"'::jsonb,
  'Quantitative aptitude (fast compute).',
  495,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 389 to 412. Approx % increase?',
  'mcq',
  '{"A": "6", "B": "1", "C": "11", "D": "64.83"}'::jsonb,
  '"A"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  496,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Solve for x: 3x + 7 = 16',
  'mcq',
  '{"A": "3", "B": "5", "C": "2", "D": "4"}'::jsonb,
  '"A"'::jsonb,
  'Quantitative aptitude (fast compute).',
  497,
  true,
  '{"grade": 12, "dimension": "QA", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: A metric rose from 282 to 338. Approx % increase?',
  'mcq',
  '{"A": "25", "B": "20", "C": "15", "D": "14.1"}'::jsonb,
  '"B"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  498,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 55, 80, 42, 90, 81. What is the median?',
  'mcq',
  '{"A": "55", "B": "81", "C": "80", "D": "69.6"}'::jsonb,
  '"C"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  499,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);

INSERT INTO personal_assessment_questions (
  section_id, question_text, question_type, options, correct_answer,
  description, order_number, is_active, metadata
) VALUES (
  'c8d9e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f',
  'Science: Data set: 41, 33, 45, 88, 71. What is the median?',
  'mcq',
  '{"A": "71", "B": "41", "C": "55.6", "D": "45"}'::jsonb,
  '"D"'::jsonb,
  'Interpreting data, percentages, central tendency.',
  500,
  true,
  '{"grade": 12, "dimension": "DI", "difficulty_rank": 10, "time_target_sec": 90}'::jsonb
);
