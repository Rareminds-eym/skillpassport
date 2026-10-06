-- Generated Google Forms assessment migration
-- Learner: lavanya13142003@gmail.com
-- Target tables: personal_assessment_attempts, adaptive_aptitude_sessions, adaptive_aptitude_responses, adaptive_aptitude_results
-- Existing learner and question UUIDs are reused.
-- response_time_ms/average_response_time_ms are 0 because Google Forms did not record per-question timing.

BEGIN;

-- ============================================================
-- Learner: lavanya13142003@gmail.com
-- Source: Assessment Answers.xlsx (Google Forms migration)
-- ============================================================
DO $$
DECLARE
    v_learner_id uuid;
BEGIN
    SELECT id INTO v_learner_id FROM public.learners WHERE lower(email) = lower('lavanya13142003@gmail.com') LIMIT 1;
    IF v_learner_id IS NULL THEN
        RAISE EXCEPTION 'Learner not found for email: %', 'lavanya13142003@gmail.com';
    END IF;

    INSERT INTO public.adaptive_aptitude_sessions (
        id, learner_id, grade_level, current_phase, tier, current_difficulty, difficulty_path,
        questions_answered, correct_answers, current_question_index, current_phase_questions,
        provisional_band, status, started_at, updated_at, completed_at, learner_course, all_responses
    ) VALUES (
        '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, v_learner_id, 'postgraduate', 'stability_confirmation', 'H',
        2, ARRAY[1,1,5,2,4,1,1,5,4,4,4,1,2,1,1,5,1,2,2,2,4,1,5,1,5,5,1,2,1,2,1,4,2,3,1,3,1,3,2,3,1,2,4,3,3,1,1,3,3,2]::smallint[],
        50, 36, 6, '[]'::jsonb,
        4, 'completed', '2026-08-29T10:05:09.075000'::timestamptz, '2026-08-29T11:09:36.988000'::timestamptz, '2026-08-29T11:09:36.988000'::timestamptz, NULL,
        '[{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"01a72c08-518b-4010-aaf2-acbb36666a0e","selected_answer":"A","sequence_number":1,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"1f8cba9a-2379-4792-9095-44710399f207","selected_answer":"C","sequence_number":2,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"1ffdc626-4273-4e57-85e2-1855928f3467","selected_answer":"A","sequence_number":3,"response_time_ms":0,"difficulty_at_time":5},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"21ced5d6-173f-469b-8c17-9e4da6b04993","selected_answer":"D","sequence_number":4,"response_time_ms":0,"difficulty_at_time":2},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"2223eea8-9c93-4396-9859-9d1819bd97f1","selected_answer":"D","sequence_number":5,"response_time_ms":0,"difficulty_at_time":4},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"1b483fbb-e262-4c32-af03-8d67693573e6","selected_answer":"D","sequence_number":6,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"1bf2d8cf-14ab-4334-bffc-84392410d8f1","selected_answer":"C","sequence_number":7,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"data_interpretation","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"0fb8bf96-4419-47f3-8714-676fc9e12682","selected_answer":"C","sequence_number":8,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"3020b398-f051-4071-a4db-b5282afb87f8","selected_answer":"C","sequence_number":9,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"40ee0126-bce3-4f3e-bd8b-bda922eba1b7","selected_answer":"B","sequence_number":10,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"14c51e9d-0171-445b-aacf-f85a40723570","selected_answer":"D","sequence_number":11,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"5c24a741-c0cd-46b3-a5ea-2a183ee3004c","selected_answer":"B","sequence_number":12,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"0a6e2c03-94d1-4881-8497-7300532e9fb9","selected_answer":"C","sequence_number":13,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"5c3c71f0-8f67-4a22-9b3e-56718a4d0898","selected_answer":"C","sequence_number":14,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"196980e4-5041-437a-82c0-85414bdec8eb","selected_answer":"C","sequence_number":15,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"089b0340-5ece-45e1-9e99-9806166cb1a3","selected_answer":"C","sequence_number":16,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"0a5d107b-f724-48e8-9e53-28c73cff01f2","selected_answer":"B","sequence_number":17,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"1307c2dc-4ce2-4c91-acee-232654b46455","selected_answer":"B","sequence_number":18,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"1566a37f-964a-46a6-86a8-5afb46b3308a","selected_answer":"D","sequence_number":19,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"1a2d7e85-9218-4933-b546-a9187d241ea1","selected_answer":"A","sequence_number":20,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"21023475-e847-4d44-b2fe-67fbd1039639","selected_answer":"D","sequence_number":21,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"226e0b6d-70ab-4794-add5-fc7538a67c41","selected_answer":"D","sequence_number":22,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"271c685f-ceca-4e90-a966-ccd12ffabe21","selected_answer":"C","sequence_number":23,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"31579955-806e-4a24-8bd3-cfc7758ae74f","selected_answer":"B","sequence_number":24,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"3cd386ad-1bb3-46fc-af98-0bea4044a337","selected_answer":"C","sequence_number":25,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"42cac156-9490-41f8-9a1e-f602c3bef5fa","selected_answer":"D","sequence_number":26,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"481895db-c065-46fd-92e1-a6aed13faad0","selected_answer":"C","sequence_number":27,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"49d8fba8-10a1-42a1-89fd-65da3341c535","selected_answer":"C","sequence_number":28,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"4b7dd7ae-8b2f-4051-8e8f-cbd2f88f487a","selected_answer":"C","sequence_number":29,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"6b9d7960-c2cb-4e69-8bbd-3f1928b0667b","selected_answer":"B","sequence_number":30,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"0da21e72-9077-47e6-9dd6-988bc1e48adf","selected_answer":"B","sequence_number":31,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"1ce56a05-48cf-4116-abfc-d72d32d72577","selected_answer":"C","sequence_number":32,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"2354c56b-4c26-4ec2-93e8-76c055d57a3f","selected_answer":"B","sequence_number":33,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"0d7c36ac-e042-49c6-ab76-d090c046e8e6","selected_answer":"A","sequence_number":34,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"20b39805-bf80-40d3-b67f-f2c0a88a146b","selected_answer":"B","sequence_number":35,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"005b3803-b53f-43a6-bf42-9502540eb9ae","selected_answer":"C","sequence_number":36,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"286c5cad-a097-455d-b168-e9c7449c4ec2","selected_answer":"B","sequence_number":37,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"0e8e698d-ede3-4644-a889-83d778febdee","selected_answer":"B","sequence_number":38,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"149ce6cc-9b31-45e4-968a-7c728edd1779","selected_answer":"C","sequence_number":39,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"11a3f4bd-2181-45ae-8006-070b7a89d5c3","selected_answer":"C","sequence_number":40,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"1cc561a1-33ea-4a9a-8b20-52b57db34825","selected_answer":"C","sequence_number":41,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"1cc9ca64-657a-4fb5-a6b2-185116412d42","selected_answer":"D","sequence_number":42,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"38872fc2-3ab0-4711-a6fd-025c96f47cca","selected_answer":"C","sequence_number":43,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"491d6e9b-4c2d-4912-92de-6fb2ee4a1e1c","selected_answer":"C","sequence_number":44,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"3738d88c-3e30-483c-8c32-d2ed7f384d01","selected_answer":"D","sequence_number":45,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"64889be1-ba54-4909-adca-1c48d64413ad","selected_answer":"A","sequence_number":46,"response_time_ms":0,"difficulty_at_time":1},{"phase":"stability_confirmation","subtag":"numerical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"3a2a6833-8c83-493d-af58-76d08222ef64","selected_answer":"B","sequence_number":47,"response_time_ms":0,"difficulty_at_time":1},{"phase":"stability_confirmation","subtag":"data_interpretation","timestamp":"2026-08-29T11:09:36.988000","is_correct":false,"question_id":"4238c753-3041-4d96-a05c-69134fa6a173","selected_answer":"B","sequence_number":48,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"data_interpretation","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"3e179b76-3625-42fc-94fb-2aaad9468e2d","selected_answer":"C","sequence_number":49,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"logical_reasoning","timestamp":"2026-08-29T11:09:36.988000","is_correct":true,"question_id":"4738c491-a453-4d28-bcd0-ecd09de08e31","selected_answer":"B","sequence_number":50,"response_time_ms":0,"difficulty_at_time":2}]'::jsonb
    );

    INSERT INTO public.personal_assessment_attempts (
        id, learner_id, stream_id, started_at, completed_at, status, current_section_index,
        current_question_index, section_timings, created_at, updated_at, timer_remaining, elapsed_time,
        grade_level, adaptive_aptitude_session_id, all_responses, aptitude_scores, knowledge_scores,
        aptitude_question_timer, learner_context
    ) VALUES (
        '3644b588-39c1-4308-8983-51907e620730'::uuid, v_learner_id, 'mca', '2026-08-29T10:05:09.075000'::timestamptz, '2026-08-29T11:09:36.988000'::timestamptz,
        'in_progress', 6, 19, '{}'::jsonb,
        '2026-08-29T10:05:09.075000'::timestamptz, '2026-08-29T11:09:36.988000'::timestamptz, NULL, 0, 'college', '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid,
        '{"06deb6c6-15ac-43ee-b2b3-985ebc9a960e":3,"0a47b8e2-f325-4b26-af58-6598ef066b8e":5,"240b7719-2a8b-4123-aaa6-c4e3c3b83805":5,"27b18af7-f107-4f3d-be1b-2918dc81f671":4,"2c1676c5-3c8c-47ab-a397-862e18c6bf7a":5,"339251a2-53bd-4e5f-83f2-d37323321ce6":4,"467ea730-eb1e-48c2-9a33-8ff61a42a2e1":4,"4dc1274b-0a67-4b78-9e71-bea384959d6a":5,"5562375d-1593-4245-93d4-03759e911d59":4,"56c280e7-1b54-4677-9ac3-05be13fb01a2":3,"5d88fb06-d3b4-4384-bc2a-0cb9e4258e05":5,"5fde0e38-736e-4532-b0d0-407f8a3fbe9f":4,"694cc973-0085-423d-94e7-5ef988c4445d":4,"6c4bffac-5ff0-417c-8284-516acf952da8":2,"76182f5f-cec9-460b-8cb0-cdd078851e2a":5,"8841900e-b81a-417d-bfa8-c34cc0883298":5,"8df3287d-ca2a-47c9-8d3e-fa6a158f806b":5,"90380841-e9b7-4a32-b463-b47adc1cd36e":4,"907e87a5-cca1-4777-b175-4b0e24c0659b":5,"9572c351-167f-4f1a-be31-fb84adab49d0":5,"c4c71340-1547-4da7-bb68-ec69538dbab0":5,"cdad024e-073f-4e51-bd31-8b9755cb5e07":5,"ce7ae29d-d579-45c9-b687-bcb078f71dc3":5,"d44433bb-c9b9-464e-ab71-68d50ef99441":5,"d6a9b143-b90a-4f5d-8793-99bb4b82ed8b":5,"dafdb924-1a67-492d-8a33-52f6437939c5":3,"ee37a69d-ce12-4608-9dd5-d59f68005927":5,"eeacf36c-6b0e-4c5e-aecf-dde25ef5e23c":5,"f3582656-2ccf-434d-909a-70329bface51":4,"fba6a261-6e57-43a3-b399-9d2a29a9e0dc":5,"01331035-a34c-4d25-8875-aa2ff83d66f5":5,"01fbf206-d912-4166-8b93-25c929af89ec":3,"06d3c6ed-bfb8-4996-9760-c7dd04dcdf93":4,"08760ff6-143f-420a-948f-e43725abd187":5,"091c5d5e-20e7-4569-80dd-684b3c3f4c7b":4,"0c9b32fa-f4c2-47bc-ac9e-79f95255945b":4,"0fa684c9-31a8-4017-a39d-67a1cf55d89d":4,"13d5b49b-874b-45da-8351-a284866c575e":5,"167dfd52-ebbc-4937-8ad4-628b690112d2":3,"17494d6d-577f-45fe-adfd-b8d87ca53ec3":5,"1869d9d7-e04a-45c9-9c9e-88b49925b12f":3,"26a5070e-5c6e-4e4c-99c4-0213a2eb0078":4,"27762ded-b161-4ffc-9209-5b2e56db2b7a":4,"2ad6ff93-24e6-4c21-8865-918cc56abb13":4,"2b92f958-0112-4ba3-9864-b6224d92da48":4,"2bacfdfd-e8b1-43d7-bae5-3ff5045fb3fb":4,"39b83fb7-c1b4-40a7-9db7-f4097841b372":5,"3d216a62-6bfd-43f0-b1b4-dbe1a0fdd55d":5,"3e666b0b-31d2-4494-a172-055d575a430d":3,"40c5e397-c445-43c9-ad4a-719a812aa099":5,"45ac3ded-fa7d-438b-9c7d-7ca53672e11c":5,"4779fc41-4687-4717-9aa4-6431065d86c9":4,"512b16c3-b9eb-4431-ae38-97220a23226c":4,"595c2f36-93f3-4c7d-ad61-b62fdb4f24f8":4,"660eb513-29d8-4690-aa8d-0b9eb85bbdd1":5,"6aa516f2-43f1-4344-ac40-91c2c1ab635c":5,"6c9a2a5d-3181-49d8-9637-344e74990a47":3,"71d5493f-183a-4f31-877e-599890810cbf":5,"7b093dbb-059c-4fa1-a2d2-76cc9b49c03f":4,"7cf5488d-1494-4524-beb7-e77d38e2ab01":4,"7e8f036d-21bc-4b4d-ab95-26fe3125274e":4,"90ccc419-a71d-47e4-b4ab-23349b46ec0a":5,"a7d1599c-9d54-4b72-aac4-84277bb0d6e4":3,"b773c9dc-6961-4d47-911d-a6276d147919":4,"b90646eb-41d7-4d3b-8c48-08386392da9a":5,"bcf3c128-3589-42f0-a80a-f948b05eead8":5,"beb2f937-9b66-4d49-8af9-d2a18ebc4b78":3,"c3887f59-fec7-40ef-8315-08536bcdbcbd":5,"c69768d2-412e-4758-a51a-3322aa302a50":3,"c8ec064b-9a93-4f65-bd7e-170c99ec93a5":4,"d3130891-b367-4102-8975-eed33f6a05ee":3,"d5a3a205-ff1b-4dd2-8988-435e5a5e1b5f":5,"dec93f12-84e4-4972-81dd-2e06770fc616":4,"e1bd638b-49b4-4560-8fe3-10cc524a2c70":5,"e90b5b8c-6ebd-469f-8e9a-d79a9aa144de":4,"ee0135fb-4b22-4a9a-9527-49ca434b1d9f":3,"fbaf10bf-8f5a-47ee-a76a-a69f8861aeb3":4,"fd150864-4484-497c-9de5-bfce6cac073a":5,"01c0e5be-c1ca-4631-a435-ae24a72ad52e":4,"05d2ad97-b710-498b-8bf3-38783458f017":4,"1a1d4a4d-a6c5-49eb-b69e-079a7cbf8d82":4,"2232eb8e-790e-43f6-9fab-29708d6ac351":4,"275b30cd-ab23-48c8-8418-02366fe05d45":3,"2d489adf-e237-4fc1-b9c7-d7e8c47aa7a1":3,"2e703b76-81c1-4751-a5b1-83e54ca8438a":3,"3ab491ae-dad3-4c55-8923-041421c5afc0":4,"3bc21600-cfc8-4609-abcd-0a717b743365":4,"4b3120c7-e95c-45d4-a16f-603034963d68":4,"5b74476a-eac9-4e29-bed3-3b685c8d5653":3,"5ba86e06-a7be-4d49-a9ed-c4e0f022e50e":4,"5fbcb1a1-b843-4e6b-84b0-cccb2688b52e":5,"60966df4-8a11-4256-b99a-eae057a53907":4,"658dc658-137c-46fb-9abe-94f917610564":4,"7c09d6ec-378b-4e66-8a72-08dea9952342":5,"924ce5b4-c523-49a6-aebf-29674cc2dc64":3,"a11a1520-8576-4762-97d4-73596450eec0":4,"c67cc0ae-03a2-4806-b350-b05baff61848":3,"faac271d-0ade-4fee-ae0d-976793779f88":4,"dd3a6dbe-78aa-4fb6-8321-7bacd0362dbf":3,"ea7d178f-730e-4f78-8c1f-dce39cdc1fbe":4,"fd807f20-f77e-479a-b9fe-a97effe0ab79":4,"03584db7-84bf-4121-85f4-36c0668b5efa":5,"0753c617-c120-494f-af90-f2025195c2e1":3,"0adb6072-b17d-4d60-b3b0-b7ddc87b78d7":4,"0de5838c-a239-4d01-8c23-d4ac0d0792ff":3,"211dbcb3-b7b9-4898-9a0e-7910c5b73ae0":5,"2bb51f6b-3f73-45ee-8b34-3a367cc87cdd":4,"48f74df0-b950-4570-99ae-0ca57aa0ada4":5,"54bfd038-3b74-4a48-817e-d472393e3c83":4,"578f73b8-f210-4fd3-939d-606a663e8428":5,"616fbb97-16aa-4331-9d90-7264857aba70":4,"62df1810-d7a0-4d64-bea8-ab313e8517fe":4,"6968f6e6-7b17-4f30-acc4-cd992fdb6015":3,"6dc44857-6c56-49f5-bf8a-d550f1f9c804":5,"724ad68c-b691-4c1d-9d50-a6ed43a18857":4,"85703c95-e68f-4874-9d2b-f183d37e5b4c":4,"969216ed-87c9-461d-a120-96b4990637fb":4,"9e8d9da7-17b0-4e19-9e84-5758367bdb3c":4,"aa6f2012-8b4b-44cf-b521-7390eacb9ebe":5,"b06c7b60-6289-4611-934a-7e0ec04082cc":5,"d22fe66e-4dd9-4381-bb80-9357a866b76d":4,"d2b86a46-d1ac-45a4-bdd0-835d00989965":4,"e5c2d2a0-65b0-447a-858c-c43cc3623d4c":5,"ef782ccd-3409-4120-a0b6-a4cd0b45ad48":4,"b32bcbe0-d431-470b-849a-c2e363734cf1":4,"0c52a0c0-1531-439d-b826-c8924a315e3c":{"best":"Ask someone else to present for you.","worst":"Read slides without eye contact."},"242df483-6ef0-4c4d-9f4e-72ea170807be":{"best":"Learn basics fast, ask guidance early, deliver in parts.","worst":"Say no immediately."},"61304246-4810-46dc-94c1-0f3866035436":{"best":"Hide it and hope nobody notices.","worst":"Inform mentor, correct quickly, explain learning."},"dadd0616-7d2a-4634-9b54-0f2e8992cc16":{"best":"Take sides with your friend.","worst":"Facilitate a calm discussion on facts and goals."},"eaf39932-7c82-41e6-9e93-34eea9d8a3d7":{"best":"Talk privately, ask what''s blocking them, agree on a plan.","worst":"Complain to the faculty immediately."},"7b4fee68-2c37-4d79-817a-25dcd7fc069f":{"best":"Ask for priority changes and renegotiate timeline.","worst":"Agree to everything without checking feasibility."},"57c6c690-007a-4344-9391-5c5bb6875570":"Master of Computer Applications","275c3d1f-e39a-4282-bb03-986435cf9622":"Python","03adcdf8-7a75-4476-844a-6208496d68db":"Data Retrieval and Manipulation","cf4e7ccb-263c-4a61-9213-a61d4afb3a03":"Regression Testing","22816cbb-3bcd-4812-947f-ad60d4a66333":"Time Complexity","5fdf3576-30f7-41e7-900f-fdba53419731":"Inheritance","208ec716-f1c0-45cc-b741-afa51e4e0f94":"Playing Audio Files","56e0a696-ace9-41e0-8a92-131adcd08779":"Queue","90519261-f650-4513-8b19-618f698602c6":"Translate Code to Machine Language","67a5c21c-3e61-487f-8f4b-03985bd47bdc":"Integer","f0d4ca15-8557-4587-9766-70b53dea3b40":"Secure Data Transmission","7016c9c9-f849-4915-8f33-6b982f1578ab":"AES","91b1dff0-e918-44c7-82b1-92563e2b4fc0":"Combine Data from Multiple Tables","7beace78-30e3-4ad5-9b3e-a0ca73cc4d08":"Telegraph Machines","376f4833-9072-4f69-8bac-f2307367017d":"Execute when the IF condition is false","1e023127-3b07-4d09-8d07-9fa70b736d8a":"SMTP","49f96cd6-71c0-4f13-8269-d066ddd6579d":"Error Handling","a6c27d70-36c1-4034-a944-1fbc2a96896b":"Code Refactoring","99e7fa30-e089-4a50-952f-c56753dfcadb":"Water Filtration","2e7c8edf-74fe-47c4-9ba1-f11cb0538572":"8","347d1694-b082-4933-b398-f2c49c0319eb":"Kind","5e6dc8be-5074-4772-b300-fc18907f88a1":"Banana","a3f8e390-f8a9-4945-a059-ff46aba68f94":"V","3c423858-1fa8-46e9-b84e-c044a60bd829":"To face a difficult situation with courage","0e64a40b-97c6-4671-ba78-253ee65ffafa":"Sunshine","9872784c-7c53-40c5-9b9f-01789e8a1696":"Childern","6772c340-3cf8-4217-a46a-8812ca4b154b":"Personification","d61b7a4f-003a-4e67-9571-33afc383421e":"A word that reads the same backward as forward","e2bc6a81-bc3d-40da-9037-452d858776a9":"6","1bf5b59c-c2be-4726-a7f1-ce37957f382a":"20","42353fee-7713-47d7-a95f-effd1b2d7152":"180 km","68c3ffde-93ca-4114-87bb-b15512aa8318":"12","b8685acb-7404-4977-b14a-2b6742f559e0":"9","bf89a8e9-7a83-4dd6-9b3f-8a26f8792cbc":"29","6d2ce80e-a47a-455b-8d12-74d7b515bdbd":"4","2c703e3e-94ab-4a09-b7b2-4947066052d7":"5","dd8b0411-63ac-4fb8-93be-f01de7ca24d2":"3","0610be4c-5b58-4ca2-9d99-7c641e53587c":"4","8665e50b-93c1-49ef-a12b-fb2cf80faffe":"√3/2","afc96a3a-9d7c-4592-93c9-d60dda966465":"2","9949899c-b4a6-4d3b-9e6f-7948ce8f8565":"52","205f47f0-064a-42ef-84f2-c74b2585bb74":"cos(x)","8887ec62-d89d-4ec5-9b90-29861bd9d56c":"y = 2x2","64d5babf-244e-428e-81a4-47db22a9cadf":"12","bd195a4c-6fcc-4226-a818-f032d6e172fd":"27","9a33ccc1-348a-49e8-abab-1ce03afc8cbd":"200","2ebc1429-e53a-438d-874b-536c1c644bde":"79%","b330f1a9-3cdf-4a87-8ea3-ab2d06d3f70c":"81.5","43961af2-ada5-4058-b3a3-d10f21026069":"◻","db82dfbe-6aac-44b3-a6bf-46f97f3817fe":"26","0ae332e8-7e0b-4477-83f5-5905b6c61d24":"Circle","6d12af89-0dea-4677-8d40-c23e7fa32ba5":"37","72456056-44fe-4813-9b7f-401cf5a191a9":"◇","97b3a5b7-9044-4fff-a499-2002712a4057":"□","7221e5e1-1e23-4efb-a07d-5e82e4aa9a81":"⧄","72b42642-79b6-48d9-84ba-5e176286b1de":"C","188f1bcc-09ea-4bc0-b75b-7948a956db80":"△","ac0dae8b-8a0b-4857-8337-9988191f5e5e":"⚭","af56f904-715b-4a2b-97d3-545a00b004ed":"⊣","2303812e-e861-4b28-937d-4844db2c2c7a":"Articulate","d562fc44-88e1-435a-b477-5562d61a944b":"Intensify","cf6c0ad2-be58-4872-9f21-178e0354aa11":"Brush","a39da96f-ec73-458a-bf5f-b7266182363e":"He don''t like ice cream.","226c42cc-abb1-4591-b8da-e35f7bb02bca":"26","27d543c2-c583-46cd-bc84-fd8d8d00a548":"Square","26715555-1b83-49fc-91fc-4d81ad79f180":"Hexagon","40f2ccf6-92bf-4a4b-822f-f8faf2a8cf69":"Left","d6c77500-0abf-4bd6-9e29-b904d10188c9":"48","5107b649-d896-4ccd-bd68-8c03557ee49c":"T"}'::jsonb, NULL, NULL, NULL,
        '{"rawGrade":"PG","degreeLevel":"Postgraduate","programCode":"MCA","programName":"Master of Computer Applications","selectedStream":"mca","migrationSource":"google_forms"}'::jsonb
    );

    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'fc45394c-30f9-4d84-add8-79a9cbb55d37'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '01a72c08-518b-4010-aaf2-acbb36666a0e'::uuid,
        'A', TRUE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 1,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Solve for x: 5x + 11 = 41', '{"A":"6","B":"0","C":"2","D":"1"}'::jsonb,
        'A', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '35887e82-12ba-4484-9f9c-eb268c6958e0'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '1f8cba9a-2379-4792-9095-44710399f207'::uuid,
        'C', FALSE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 2,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Solve for x: 4x + 16 = 32', '{"A":"0","B":"6","C":"8","D":"4"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '92642754-47a5-486a-a7a3-12d232d6a823'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '1ffdc626-4273-4e57-85e2-1855928f3467'::uuid,
        'A', TRUE, 0,
        5, 'numerical_reasoning', 'diagnostic_screener', 3,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Solve for x: 10x + 30 = 100', '{"A":"7","B":"9","C":"12","D":"5"}'::jsonb,
        'A', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '0159a514-beaf-4c73-9b3a-2b3e510a4968'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '21ced5d6-173f-469b-8c17-9e4da6b04993'::uuid,
        'D', FALSE, 0,
        2, 'numerical_reasoning', 'diagnostic_screener', 4,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Solve for x: 8x + 18 = 66', '{"A":"6","B":"9","C":"10","D":"3"}'::jsonb,
        'A', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '26775024-902d-4b16-a133-7936eb4a6705'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '2223eea8-9c93-4396-9859-9d1819bd97f1'::uuid,
        'D', TRUE, 0,
        4, 'numerical_reasoning', 'diagnostic_screener', 5,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Solve for x: 9x + 25 = 97', '{"A":"5","B":"11","C":"0","D":"8"}'::jsonb,
        'D', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'a4bebfe9-faca-4ba6-896c-cd705875fe67'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '1b483fbb-e262-4c32-af03-8d67693573e6'::uuid,
        'D', TRUE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 6,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Evaluate: (60 + 89) Ã— 6 âˆ’ 3', '{"A":"854","B":"995","C":"818","D":"891"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '376beee6-9607-4c5d-a250-757d6281f01b'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '1bf2d8cf-14ab-4334-bffc-84392410d8f1'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 7,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Evaluate: (50 + 48) Ã— 6 âˆ’ 2', '{"A":"568","B":"513","C":"586","D":"575"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'ca8fad89-bfc3-46a3-9658-5670a58599f9'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '0fb8bf96-4419-47f3-8714-676fc9e12682'::uuid,
        'C', TRUE, 0,
        5, 'data_interpretation', 'diagnostic_screener', 8,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Data table (units): Q1=184, Q2=145, Q3=123, Q4=163. What is the total for the year (Q1+Q2+Q3+Q4)?', '{"A":"579","B":"477","C":"615","D":"692"}'::jsonb,
        'C', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'eda8c509-a6ca-4b7c-9ede-2eab9a28ccdf'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '3020b398-f051-4071-a4db-b5282afb87f8'::uuid,
        'C', FALSE, 0,
        4, 'data_interpretation', 'adaptive_core', 9,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Data table (units): Q1=124, Q2=157, Q3=113, Q4=80. What is the total for the year (Q1+Q2+Q3+Q4)?', '{"A":"474","B":"519","C":"494","D":"540"}'::jsonb,
        'A', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '706e2400-8a45-4bb6-9bab-eb5c49dcf034'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '40ee0126-bce3-4f3e-bd8b-bda922eba1b7'::uuid,
        'B', FALSE, 0,
        4, 'logical_reasoning', 'adaptive_core', 10,
        '2026-08-29T11:09:36.988000'::timestamptz, 'For the numbers 16, 22, 39, 45, 53, what is the median?', '{"A":"51","B":"54","C":"39","D":"12"}'::jsonb,
        'C', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '0386ae27-5faa-462e-b9af-2d7c34ab1a39'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '14c51e9d-0171-445b-aacf-f85a40723570'::uuid,
        'D', TRUE, 0,
        4, 'pattern_recognition', 'adaptive_core', 11,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Squares pattern: 144, 169, 196, 225, ?', '{"A":"312","B":"251","C":"198","D":"256"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'd30c86d4-6139-4a58-8916-c13138e93758'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '5c24a741-c0cd-46b3-a5ea-2a183ee3004c'::uuid,
        'B', TRUE, 0,
        1, 'pattern_recognition', 'adaptive_core', 12,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Squares pattern: 36, 49, 64, 81, ?', '{"A":"84","B":"100","C":"107","D":"108"}'::jsonb,
        'B', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'e3b4f0a9-f3ca-470d-b0eb-f406352eae90'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '0a6e2c03-94d1-4881-8497-7300532e9fb9'::uuid,
        'C', FALSE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 13,
        '2026-08-29T11:09:36.988000'::timestamptz, 'If probability of success is 0.24, what is the expected number of successes in 30 trials?', '{"A":"7.5391","B":"6.8571","C":"7.1066","D":"7.2"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'e01f6c79-326d-42c6-92e5-3921b2b6293a'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '5c3c71f0-8f67-4a22-9b3e-56718a4d0898'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 14,
        '2026-08-29T11:09:36.988000'::timestamptz, 'If probability of success is 0.2, what is the expected number of successes in 20 trials?', '{"A":"4.6198","B":"3.922","C":"4.0","D":"4.2968"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '857e604f-9736-402c-a199-ab243589c0dc'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '196980e4-5041-437a-82c0-85414bdec8eb'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 15,
        '2026-08-29T11:09:36.988000'::timestamptz, 'If log_10(1000000) = k, what is k?', '{"A":"18","B":"12","C":"6","D":"4"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '3d7a722d-0873-4172-a655-52e2394eec82'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '089b0340-5ece-45e1-9e99-9806166cb1a3'::uuid,
        'C', TRUE, 0,
        5, 'numerical_reasoning', 'adaptive_core', 16,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the 10th term of an AP with first term 48 and common difference 10.', '{"A":"152","B":"92","C":"138","D":"172"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'aeb3dcda-1479-4226-8076-95bb34d74c6a'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '0a5d107b-f724-48e8-9e53-28c73cff01f2'::uuid,
        'B', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 17,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the 9th term of an AP with first term 36 and common difference 8.', '{"A":"101","B":"100","C":"120","D":"82"}'::jsonb,
        'B', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '9540e84d-3c80-413b-993f-9448a2ce71fa'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '1307c2dc-4ce2-4c91-acee-232654b46455'::uuid,
        'B', FALSE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 18,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the 8th term of an AP with first term 44 and common difference 10.', '{"A":"114","B":"104","C":"121","D":"112"}'::jsonb,
        'A', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '34bc5ea2-9ed4-45f0-aa5c-42298c07a5a6'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '1566a37f-964a-46a6-86a8-5afb46b3308a'::uuid,
        'D', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 19,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the next term: 14, 20, 32, 50, ?', '{"A":"76","B":"56","C":"69","D":"74"}'::jsonb,
        'D', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '3c50a610-67c7-4aa6-a1c7-20e411041ea7'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '1a2d7e85-9218-4933-b546-a9187d241ea1'::uuid,
        'A', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 20,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the next term: 14, 18, 26, 38, ?', '{"A":"54","B":"60","C":"78","D":"43"}'::jsonb,
        'A', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '5aaaa7df-98d0-4d50-865f-1156bfea87e8'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '21023475-e847-4d44-b2fe-67fbd1039639'::uuid,
        'D', TRUE, 0,
        4, 'numerical_reasoning', 'adaptive_core', 21,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the next term in the series: 12, 20, 36, 60, ?', '{"A":"116","B":"80","C":"114","D":"92"}'::jsonb,
        'D', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '86328dac-8edc-47c7-b606-f6dab5885638'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '226e0b6d-70ab-4794-add5-fc7538a67c41'::uuid,
        'D', TRUE, 0,
        1, 'pattern_recognition', 'adaptive_core', 22,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the next term in the series: 6, 12, 24, 42, ?', '{"A":"42","B":"48","C":"76","D":"66"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '41a14191-ee2f-41c3-8d7b-d1bb2635056c'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '271c685f-ceca-4e90-a966-ccd12ffabe21'::uuid,
        'C', TRUE, 0,
        5, 'pattern_recognition', 'adaptive_core', 23,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find next term: 44, 51, 65, 86, ?', '{"A":"124","B":"132","C":"114","D":"159"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'dc6078c6-e397-48de-aa4d-d646bb520739'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '31579955-806e-4a24-8bd3-cfc7758ae74f'::uuid,
        'B', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 24,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the next term in the series: 12, 18, 30, 48, ?', '{"A":"73","B":"72","C":"83","D":"71"}'::jsonb,
        'B', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'c4d6226e-4b5a-4cbf-b72e-aeae2566a37f'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '3cd386ad-1bb3-46fc-af98-0bea4044a337'::uuid,
        'C', TRUE, 0,
        5, 'numerical_reasoning', 'adaptive_core', 25,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the next term: 35, 45, 65, 95, ?', '{"A":"114","B":"145","C":"135","D":"132"}'::jsonb,
        'C', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '7f6920f1-a722-495b-a9c2-55599368b87b'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '42cac156-9490-41f8-9a1e-f602c3bef5fa'::uuid,
        'D', TRUE, 0,
        5, 'pattern_recognition', 'adaptive_core', 26,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the next term in the series: 20, 30, 50, 80, ?', '{"A":"160","B":"131","C":"138","D":"120"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '5a9675c8-4ee2-414e-8867-a19c5b8269bd'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '481895db-c065-46fd-92e1-a6aed13faad0'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 27,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the next term in the series: 7, 12, 22, 37, ?', '{"A":"70","B":"45","C":"57","D":"69"}'::jsonb,
        'C', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '6856375e-8a10-49f6-9e69-37ac7cdbde0f'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '49d8fba8-10a1-42a1-89fd-65da3341c535'::uuid,
        'C', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 28,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find next term: 19, 23, 31, 43, ?', '{"A":"45","B":"41","C":"59","D":"48"}'::jsonb,
        'C', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '3003b1cf-b873-4d1d-ae46-efd1ffb24d13'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '4b7dd7ae-8b2f-4051-8e8f-cbd2f88f487a'::uuid,
        'C', TRUE, 0,
        1, 'pattern_recognition', 'adaptive_core', 29,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Find the next term: 37, 40, 46, 55, ?', '{"A":"73","B":"45","C":"67","D":"59"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '5b13ffcb-eb33-4cdd-b2e2-1dfc8eb23a22'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '6b9d7960-c2cb-4e69-8bbd-3f1928b0667b'::uuid,
        'B', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 30,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Squares pattern: 81, 100, 121, 144, ?', '{"A":"172","B":"169","C":"143","D":"157"}'::jsonb,
        'B', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'b17b7862-57b6-4c90-9c1e-67acce2daf46'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '0da21e72-9077-47e6-9dd6-988bc1e48adf'::uuid,
        'B', FALSE, 0,
        1, 'pattern_recognition', 'adaptive_core', 31,
        '2026-08-29T11:09:36.988000'::timestamptz, 'In a 2Ã—2 grid, bottom-right equals sum of other three. If grid is [[21,9],[21,?]], find ?', '{"A":"59","B":"65","C":"51","D":"54"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '49ea9359-21de-4feb-b92e-94aceaefcfe3'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '1ce56a05-48cf-4116-abfc-d72d32d72577'::uuid,
        'C', TRUE, 0,
        4, 'pattern_recognition', 'adaptive_core', 32,
        '2026-08-29T11:09:36.988000'::timestamptz, 'In a 2Ã—2 grid, bottom-right equals sum of other three. If grid is [[30,19],[9,?]], find ?', '{"A":"74","B":"72","C":"58","D":"61"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '0920cc8d-4e28-4d1d-8db4-93c3704cd6bb'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '2354c56b-4c26-4ec2-93e8-76c055d57a3f'::uuid,
        'B', FALSE, 0,
        2, 'pattern_recognition', 'adaptive_core', 33,
        '2026-08-29T11:09:36.988000'::timestamptz, 'In a 2Ã—2 grid, bottom-right equals sum of other three. If grid is [[32,10],[20,?]], find ?', '{"A":"68","B":"46","C":"56","D":"62"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'ad65ace2-19eb-482b-8ba9-819c67001f6d'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '0d7c36ac-e042-49c6-ab76-d090c046e8e6'::uuid,
        'A', TRUE, 0,
        3, 'logical_reasoning', 'adaptive_core', 34,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Days are coded Mon=1,...,Sun=7. If today has code 6, what will be the code after 81 days?', '{"A":"3","B":"9","C":"1","D":"8"}'::jsonb,
        'A', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'e66dc88d-e864-4028-85d6-d48e32164400'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '20b39805-bf80-40d3-b67f-f2c0a88a146b'::uuid,
        'B', FALSE, 0,
        1, 'logical_reasoning', 'adaptive_core', 35,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Days are coded Mon=1,...,Sun=7. If today has code 2, what will be the code after 37 days?', '{"A":"4","B":"7","C":"3","D":"16"}'::jsonb,
        'A', 'Step 1: Track relationships systematically.
 
 Step 2: Eliminate contradictions.
 
 Step 3: Arrive at the unique numeric conclusion.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '302a81c7-0a61-47f2-99db-b2ef56b6f3b7'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '005b3803-b53f-43a6-bf42-9502540eb9ae'::uuid,
        'C', TRUE, 0,
        3, 'logical_reasoning', 'adaptive_core', 36,
        '2026-08-29T11:09:36.988000'::timestamptz, 'In a group, |A|=44, |B|=42, and |Aâˆ©B|=18. What is |AâˆªB|?', '{"A":"56","B":"82","C":"68","D":"70"}'::jsonb,
        'C', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '336c427e-0af0-4a94-8454-28d17559b9b4'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '286c5cad-a097-455d-b168-e9c7449c4ec2'::uuid,
        'B', TRUE, 0,
        1, 'logical_reasoning', 'adaptive_core', 37,
        '2026-08-29T11:09:36.988000'::timestamptz, 'In a group, |A|=42, |B|=38, and |Aâˆ©B|=26. What is |AâˆªB|?', '{"A":"64","B":"54","C":"66","D":"52"}'::jsonb,
        'B', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '99145656-0167-443a-98b9-42b3b23ea940'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '0e8e698d-ede3-4644-a889-83d778febdee'::uuid,
        'B', TRUE, 0,
        3, 'data_interpretation', 'adaptive_core', 38,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Category values: X=123, Y=93, Z=147. What is X''s share X/(X+Y+Z)? (round to 4 decimals)', '{"A":"0.6286","B":"0.3388","C":"0.6702","D":"0.4732"}'::jsonb,
        'B', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '2e11a5c3-4ade-4a7c-ae4c-d7a82d3c7e99'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '149ce6cc-9b31-45e4-968a-7c728edd1779'::uuid,
        'C', TRUE, 0,
        2, 'data_interpretation', 'adaptive_core', 39,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Index calculation: base value=144, current value=121. Compute index = (current/base)Ã—100. (round to 2 decimals)', '{"A":"83.6895","B":"84.0619","C":"84.03","D":"84.0971"}'::jsonb,
        'C', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'a5658c1a-f4a2-4129-9ad5-8f5c576ed889'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '11a3f4bd-2181-45ae-8006-070b7a89d5c3'::uuid,
        'C', FALSE, 0,
        3, 'data_interpretation', 'adaptive_core', 40,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Quarter values: Q1=152, Q4=129. Compute proportional change (Q4âˆ’Q1)/Q1. (round to 4 decimals)', '{"A":"0.3692","B":"-0.1513","C":"0.1505","D":"-0.0623"}'::jsonb,
        'B', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '2d31b245-8b67-4d71-acbc-2d69f04c843f'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '1cc561a1-33ea-4a9a-8b20-52b57db34825'::uuid,
        'C', FALSE, 0,
        1, 'data_interpretation', 'adaptive_core', 41,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Category values: X=137, Y=90, Z=128. What is X''s share X/(X+Y+Z)? (round to 4 decimals)', '{"A":"0.4362","B":"0.122","C":"0.6884","D":"0.3859"}'::jsonb,
        'D', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'aebc4894-512a-463b-80ab-d33f4d799227'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '1cc9ca64-657a-4fb5-a6b2-185116412d42'::uuid,
        'D', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 42,
        '2026-08-29T11:09:36.988000'::timestamptz, 'A dataset has mean 37 and standard deviation 11. Compute coefficient of variation (sd/mean). (round to 4 decimals)', '{"A":"0.4249","B":"0.2139","C":"0.43","D":"0.2973"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'f6fd608c-7c10-431f-9dc4-4da3d0da0f5f'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '38872fc2-3ab0-4711-a6fd-025c96f47cca'::uuid,
        'C', FALSE, 0,
        4, 'numerical_reasoning', 'adaptive_core', 43,
        '2026-08-29T11:09:36.988000'::timestamptz, 'If probability of success is 0.39, what is the expected number of successes in 12 trials?', '{"A":"4.2409","B":"4.68","C":"4.804","D":"4.2373"}'::jsonb,
        'B', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '291e4af3-830d-42ad-9c31-d8a71b15d674'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '491d6e9b-4c2d-4912-92de-6fb2ee4a1e1c'::uuid,
        'C', TRUE, 0,
        3, 'numerical_reasoning', 'adaptive_core', 44,
        '2026-08-29T11:09:36.988000'::timestamptz, 'If probability of success is 0.31, what is the expected number of successes in 25 trials?', '{"A":"8.0779","B":"7.6358","C":"7.75","D":"7.9281"}'::jsonb,
        'C', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'b6928342-36ef-4abb-8561-fede87d2e0fb'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '3738d88c-3e30-483c-8c32-d2ed7f384d01'::uuid,
        'D', TRUE, 0,
        3, 'numerical_reasoning', 'stability_confirmation', 45,
        '2026-08-29T11:09:36.988000'::timestamptz, 'How many ways to choose 2 items from 12 distinct items?', '{"A":"48","B":"74","C":"54","D":"66"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'facda1cb-8d93-47f6-849b-68e5118ddc25'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '64889be1-ba54-4909-adca-1c48d64413ad'::uuid,
        'A', TRUE, 0,
        1, 'numerical_reasoning', 'stability_confirmation', 46,
        '2026-08-29T11:09:36.988000'::timestamptz, 'In a GP with first term 4 and ratio 3, what is the 5th term?', '{"A":"324","B":"347","C":"326","D":"313"}'::jsonb,
        'A', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'e33d0808-64fc-43f5-b7bb-1f69d9d2344f'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '3a2a6833-8c83-493d-af58-76d08222ef64'::uuid,
        'B', FALSE, 0,
        1, 'numerical_reasoning', 'stability_confirmation', 47,
        '2026-08-29T11:09:36.988000'::timestamptz, 'If log_5(125) = k, what is k?', '{"A":"3","B":"4","C":"2","D":"1"}'::jsonb,
        'A', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'b905eed6-8866-4fb4-a324-2f02776e7b75'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '4238c753-3041-4d96-a05c-69134fa6a173'::uuid,
        'B', FALSE, 0,
        3, 'data_interpretation', 'stability_confirmation', 48,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Data table (units): Q1=115, Q2=158, Q3=90, Q4=137. What is the total for the year (Q1+Q2+Q3+Q4)?', '{"A":"518","B":"476","C":"500","D":"462"}'::jsonb,
        'C', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '75b97158-846c-4906-beff-2e2c1ee48c89'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '3e179b76-3625-42fc-94fb-2aaad9468e2d'::uuid,
        'C', TRUE, 0,
        3, 'data_interpretation', 'stability_confirmation', 49,
        '2026-08-29T11:09:36.988000'::timestamptz, 'Quarter values: Q1=110, Q4=145. Compute proportional change (Q4âˆ’Q1)/Q1. (round to 4 decimals)', '{"A":"0.5565","B":"0.2164","C":"0.3182","D":"0.5771"}'::jsonb,
        'C', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '6d0138ac-f867-454a-842c-eb0e9cdc9116'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, '4738c491-a453-4d28-bcd0-ecd09de08e31'::uuid,
        'B', TRUE, 0,
        2, 'logical_reasoning', 'stability_confirmation', 50,
        '2026-08-29T11:09:36.988000'::timestamptz, 'For the numbers 15, 22, 29, 34, 53, what is the median?', '{"A":"15","B":"29","C":"28","D":"13"}'::jsonb,
        'B', 'Step 1: Track relationships systematically.
 
 Step 2: Eliminate contradictions.
 
 Step 3: Arrive at the unique numeric conclusion.'
    );

    INSERT INTO public.adaptive_aptitude_results (
        id, session_id, learner_id, aptitude_level, confidence_tag, tier, total_questions, total_correct,
        overall_accuracy, accuracy_by_difficulty, accuracy_by_subtag, difficulty_path, path_classification,
        average_response_time_ms, grade_level, completed_at, created_at, metadata
    ) VALUES (
        'b786e961-aa71-44a9-8c90-bbe10aa58e78'::uuid, '9d4fff7c-4b36-4bca-b47b-54caf00fb3be'::uuid, v_learner_id, 4,
        'medium', 'H', 50, 36,
        72.0, '{"1":{"total":18,"correct":13,"accuracy":72.22222222222221},"5":{"total":6,"correct":6,"accuracy":100.0},"2":{"total":11,"correct":7,"accuracy":63.63636363636363},"4":{"total":7,"correct":4,"accuracy":57.14285714285714},"3":{"total":8,"correct":6,"accuracy":75.0}}'::jsonb, '{"numerical_reasoning":{"total":27,"correct":21,"accuracy":77.77777777777779},"data_interpretation":{"total":8,"correct":4,"accuracy":50.0},"logical_reasoning":{"total":6,"correct":4,"accuracy":66.66666666666666},"pattern_recognition":{"total":9,"correct":7,"accuracy":77.77777777777779}}'::jsonb, ARRAY[1,1,5,2,4,1,1,5,4,4,4,1,2,1,1,5,1,2,2,2,4,1,5,1,5,5,1,2,1,2,1,4,2,3,1,3,1,3,2,3,1,2,4,3,3,1,1,3,3,2]::smallint[],
        'stable', 0, 'postgraduate', '2026-08-29T11:09:36.988000'::timestamptz, '2026-08-29T11:09:36.988000'::timestamptz, '{"duplicateValidation":{"isValid":true,"duplicates":[]},"migrationSource":"google_forms","responseTimeUnavailable":true}'::jsonb
    );
END $$;

COMMIT;
