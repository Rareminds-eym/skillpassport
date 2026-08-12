INSERT INTO public.demo_course_access (learner_id, course_id, is_enabled)
VALUES
    ('b03fc1d8-a96b-4afa-8309-4fe4ddbe6051', 'cd4d5ad7-6097-4956-ac89-fa2e1565053b', TRUE),
    ('b03fc1d8-a96b-4afa-8309-4fe4ddbe6051', '2fc55517-c468-41b6-aabc-0b412532f494', TRUE),
    ('b03fc1d8-a96b-4afa-8309-4fe4ddbe6051', '16efb441-0de7-400e-9c51-6fb1e70dd97d', TRUE),
    ('b03fc1d8-a96b-4afa-8309-4fe4ddbe6051', '010b5048-e27b-4a51-9625-73bb3455766d', TRUE),  
    ('b03fc1d8-a96b-4afa-8309-4fe4ddbe6051', '71a8c1e0-4087-45f1-8f8a-b7bb8978322f', TRUE),
    ('b03fc1d8-a96b-4afa-8309-4fe4ddbe6051', 'f1cac1d9-b949-4927-9867-dce223662278', TRUE)
ON CONFLICT (learner_id, course_id)
DO UPDATE SET is_enabled = TRUE, updated_at = NOW();
