-- Big Five Missing Text Question
-- Adds the reflection question (order 11) to complete the Big Five section

INSERT INTO "public"."personal_assessment_questions" ("id", "section_id", "stream_id", "question_text", "question_type", "options", "correct_answer", "order_number", "is_active", "created_at", "updated_at", "description", "category_mapping", "metadata") VALUES
	('f76e44c9-2d8f-4a5e-9c3b-1e2a7d5f8b4c', 'fb6d7aac-0923-4a42-baba-ec27e22550db', NULL, 'Write one moment you felt proud of yourself this year. What strength did you use?', 'text', NULL, NULL, 11, true, '2026-01-09 06:18:22.237862+00', '2026-01-09 06:18:22.237862+00', NULL, NULL, '{"strength_type": "Reflection"}');
