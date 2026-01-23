-- Insert test assessment questions for "Delivering Constructive Criticism"
-- This allows you to test without running the backend

INSERT INTO generated_external_assessment (
  certificate_name,
  course_id,
  assessment_level,
  total_questions,
  questions,
  generated_by
) VALUES (
  'Delivering Constructive Criticism',
  NULL, -- You can add course_id if you have it
  'Intermediate',
  15,
  '[
    {
      "id": 1,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "What is the primary goal of delivering constructive criticism?",
      "options": [
        "To help the recipient improve and develop their skills",
        "To point out all the mistakes in their work",
        "To make the recipient feel bad about their work",
        "To show your superiority"
      ],
      "correct_answer": "To help the recipient improve and develop their skills",
      "skill_tag": "Understanding constructive criticism"
    },
    {
      "id": 2,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "Which of the following is a key principle when delivering constructive criticism?",
      "options": [
        "Focus only on the negative aspects of the work",
        "Provide specific, actionable feedback",
        "Use vague and general statements",
        "Criticize the person, not the work"
      ],
      "correct_answer": "Provide specific, actionable feedback",
      "skill_tag": "Principles of constructive criticism"
    },
    {
      "id": 3,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "What should you do before delivering constructive criticism?",
      "options": [
        "Wait until you are angry",
        "Prepare specific examples and suggestions",
        "Announce it publicly",
        "Focus only on the negative aspects of the work"
      ],
      "correct_answer": "Prepare specific examples and suggestions",
      "skill_tag": "Preparation for feedback"
    },
    {
      "id": 4,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "Which communication technique is most effective when delivering constructive criticism?",
      "options": [
        "Using I statements to express your perspective",
        "Using you statements to blame the person",
        "Speaking in a loud voice",
        "Interrupting frequently"
      ],
      "correct_answer": "Using I statements to express your perspective",
      "skill_tag": "Communication techniques"
    },
    {
      "id": 5,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "What is the sandwich method in constructive criticism?",
      "options": [
        "Delivering criticism during lunch",
        "Starting with positive feedback, then criticism, then positive feedback",
        "Only giving positive feedback",
        "Only giving negative feedback"
      ],
      "correct_answer": "Starting with positive feedback, then criticism, then positive feedback",
      "skill_tag": "Feedback methods"
    },
    {
      "id": 6,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "When is the best time to deliver constructive criticism?",
      "options": [
        "Immediately after the mistake, in private",
        "During a public meeting",
        "When you are angry",
        "Never"
      ],
      "correct_answer": "Immediately after the mistake, in private",
      "skill_tag": "Timing of feedback"
    },
    {
      "id": 7,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "What should you avoid when delivering constructive criticism?",
      "options": [
        "Being specific about the issue",
        "Making personal attacks",
        "Offering solutions",
        "Being respectful"
      ],
      "correct_answer": "Making personal attacks",
      "skill_tag": "What to avoid"
    },
    {
      "id": 8,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "How should you respond if someone becomes defensive when receiving criticism?",
      "options": [
        "Argue back",
        "Listen to their perspective and acknowledge their feelings",
        "Walk away immediately",
        "Raise your voice"
      ],
      "correct_answer": "Listen to their perspective and acknowledge their feelings",
      "skill_tag": "Handling defensive reactions"
    },
    {
      "id": 9,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "What is the purpose of following up after delivering constructive criticism?",
      "options": [
        "To check if improvements have been made",
        "To criticize again",
        "To ignore the person",
        "To gossip about them"
      ],
      "correct_answer": "To check if improvements have been made",
      "skill_tag": "Follow-up"
    },
    {
      "id": 10,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "Which of the following is an example of constructive criticism?",
      "options": [
        "Your presentation was terrible",
        "I noticed the slides were hard to read. Consider using larger fonts next time",
        "You always mess up presentations",
        "You are not good at this"
      ],
      "correct_answer": "I noticed the slides were hard to read. Consider using larger fonts next time",
      "skill_tag": "Examples of constructive criticism"
    },
    {
      "id": 11,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "What tone should you use when delivering constructive criticism?",
      "options": [
        "Aggressive and confrontational",
        "Calm, respectful, and supportive",
        "Sarcastic",
        "Indifferent"
      ],
      "correct_answer": "Calm, respectful, and supportive",
      "skill_tag": "Tone and delivery"
    },
    {
      "id": 12,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "Why is it important to focus on behavior rather than personality when giving criticism?",
      "options": [
        "It makes the feedback more actionable and less personal",
        "It is easier to criticize behavior",
        "Personality cannot be changed",
        "It is not important"
      ],
      "correct_answer": "It makes the feedback more actionable and less personal",
      "skill_tag": "Focus on behavior"
    },
    {
      "id": 13,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "What should you do if you receive constructive criticism?",
      "options": [
        "Get defensive and argue",
        "Listen actively and ask clarifying questions",
        "Ignore it completely",
        "Blame others"
      ],
      "correct_answer": "Listen actively and ask clarifying questions",
      "skill_tag": "Receiving criticism"
    },
    {
      "id": 14,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "Which of the following helps make constructive criticism more effective?",
      "options": [
        "Being vague about the issue",
        "Providing specific examples and suggestions for improvement",
        "Criticizing in front of others",
        "Focusing only on what went wrong"
      ],
      "correct_answer": "Providing specific examples and suggestions for improvement",
      "skill_tag": "Effectiveness of feedback"
    },
    {
      "id": 15,
      "type": "mcq",
      "difficulty": "Intermediate",
      "question": "What is the benefit of asking for permission before giving constructive criticism?",
      "options": [
        "It shows respect and makes the recipient more receptive",
        "It is not necessary",
        "It wastes time",
        "It makes you look weak"
      ],
      "correct_answer": "It shows respect and makes the recipient more receptive",
      "skill_tag": "Asking for permission"
    }
  ]'::jsonb,
  'Manual Test Data'
);

-- Verify the insert
SELECT 
  certificate_name,
  total_questions,
  jsonb_array_length(questions) as actual_question_count,
  generated_at
FROM generated_external_assessment
WHERE certificate_name = 'Delivering Constructive Criticism';
