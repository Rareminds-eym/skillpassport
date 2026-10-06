-- Generated Google Forms assessment migration
-- Learner: narayannarayan0726@gmail.com
-- Target tables: personal_assessment_attempts, adaptive_aptitude_sessions, adaptive_aptitude_responses, adaptive_aptitude_results
-- Existing learner and question UUIDs are reused.
-- response_time_ms/average_response_time_ms are 0 because Google Forms did not record per-question timing.

BEGIN;

-- ============================================================
-- Learner: narayannarayan0726@gmail.com
-- Source: Assessment Answers.xlsx (Google Forms migration)
-- ============================================================
DO $$
DECLARE
    v_learner_id uuid;
BEGIN
    SELECT id INTO v_learner_id FROM public.learners WHERE lower(email) = lower('narayannarayan0726@gmail.com') LIMIT 1;
    IF v_learner_id IS NULL THEN
        RAISE EXCEPTION 'Learner not found for email: %', 'narayannarayan0726@gmail.com';
    END IF;

    INSERT INTO public.adaptive_aptitude_sessions (
        id, learner_id, grade_level, current_phase, tier, current_difficulty, difficulty_path,
        questions_answered, correct_answers, current_question_index, current_phase_questions,
        provisional_band, status, started_at, updated_at, completed_at, learner_course, all_responses
    ) VALUES (
        '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, v_learner_id, 'postgraduate', 'stability_confirmation', 'H',
        2, ARRAY[1,1,5,2,4,1,1,5,4,4,4,1,2,1,1,5,1,2,2,2,4,1,5,1,5,5,1,2,1,2,1,4,2,3,1,3,1,3,2,3,1,2,4,3,3,1,1,3,3,2]::smallint[],
        50, 45, 6, '[]'::jsonb,
        5, 'completed', '2026-08-28T14:10:41.971000'::timestamptz, '2026-08-28T15:38:46.138000'::timestamptz, '2026-08-28T15:38:46.138000'::timestamptz, NULL,
        '[{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"01a72c08-518b-4010-aaf2-acbb36666a0e","selected_answer":"A","sequence_number":1,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"1f8cba9a-2379-4792-9095-44710399f207","selected_answer":"D","sequence_number":2,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"1ffdc626-4273-4e57-85e2-1855928f3467","selected_answer":"A","sequence_number":3,"response_time_ms":0,"difficulty_at_time":5},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"21ced5d6-173f-469b-8c17-9e4da6b04993","selected_answer":"A","sequence_number":4,"response_time_ms":0,"difficulty_at_time":2},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"2223eea8-9c93-4396-9859-9d1819bd97f1","selected_answer":"D","sequence_number":5,"response_time_ms":0,"difficulty_at_time":4},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"1b483fbb-e262-4c32-af03-8d67693573e6","selected_answer":"D","sequence_number":6,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"1bf2d8cf-14ab-4334-bffc-84392410d8f1","selected_answer":"C","sequence_number":7,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"data_interpretation","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"0fb8bf96-4419-47f3-8714-676fc9e12682","selected_answer":"C","sequence_number":8,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"3020b398-f051-4071-a4db-b5282afb87f8","selected_answer":"A","sequence_number":9,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"40ee0126-bce3-4f3e-bd8b-bda922eba1b7","selected_answer":"C","sequence_number":10,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"14c51e9d-0171-445b-aacf-f85a40723570","selected_answer":"D","sequence_number":11,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"5c24a741-c0cd-46b3-a5ea-2a183ee3004c","selected_answer":"B","sequence_number":12,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":false,"question_id":"0a6e2c03-94d1-4881-8497-7300532e9fb9","selected_answer":"A","sequence_number":13,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"5c3c71f0-8f67-4a22-9b3e-56718a4d0898","selected_answer":"C","sequence_number":14,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"196980e4-5041-437a-82c0-85414bdec8eb","selected_answer":"C","sequence_number":15,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"089b0340-5ece-45e1-9e99-9806166cb1a3","selected_answer":"C","sequence_number":16,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"0a5d107b-f724-48e8-9e53-28c73cff01f2","selected_answer":"B","sequence_number":17,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"1307c2dc-4ce2-4c91-acee-232654b46455","selected_answer":"A","sequence_number":18,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"1566a37f-964a-46a6-86a8-5afb46b3308a","selected_answer":"D","sequence_number":19,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"1a2d7e85-9218-4933-b546-a9187d241ea1","selected_answer":"A","sequence_number":20,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"21023475-e847-4d44-b2fe-67fbd1039639","selected_answer":"D","sequence_number":21,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:38:46.138000","is_correct":false,"question_id":"226e0b6d-70ab-4794-add5-fc7538a67c41","selected_answer":"C","sequence_number":22,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:38:46.138000","is_correct":false,"question_id":"271c685f-ceca-4e90-a966-ccd12ffabe21","selected_answer":"A","sequence_number":23,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"31579955-806e-4a24-8bd3-cfc7758ae74f","selected_answer":"B","sequence_number":24,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"3cd386ad-1bb3-46fc-af98-0bea4044a337","selected_answer":"C","sequence_number":25,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"42cac156-9490-41f8-9a1e-f602c3bef5fa","selected_answer":"D","sequence_number":26,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"481895db-c065-46fd-92e1-a6aed13faad0","selected_answer":"C","sequence_number":27,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"49d8fba8-10a1-42a1-89fd-65da3341c535","selected_answer":"C","sequence_number":28,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"4b7dd7ae-8b2f-4051-8e8f-cbd2f88f487a","selected_answer":"C","sequence_number":29,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"6b9d7960-c2cb-4e69-8bbd-3f1928b0667b","selected_answer":"B","sequence_number":30,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"0da21e72-9077-47e6-9dd6-988bc1e48adf","selected_answer":"C","sequence_number":31,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"1ce56a05-48cf-4116-abfc-d72d32d72577","selected_answer":"C","sequence_number":32,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"2354c56b-4c26-4ec2-93e8-76c055d57a3f","selected_answer":"D","sequence_number":33,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"0d7c36ac-e042-49c6-ab76-d090c046e8e6","selected_answer":"A","sequence_number":34,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"20b39805-bf80-40d3-b67f-f2c0a88a146b","selected_answer":"A","sequence_number":35,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"005b3803-b53f-43a6-bf42-9502540eb9ae","selected_answer":"C","sequence_number":36,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"286c5cad-a097-455d-b168-e9c7449c4ec2","selected_answer":"B","sequence_number":37,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"0e8e698d-ede3-4644-a889-83d778febdee","selected_answer":"B","sequence_number":38,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"149ce6cc-9b31-45e4-968a-7c728edd1779","selected_answer":"C","sequence_number":39,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"11a3f4bd-2181-45ae-8006-070b7a89d5c3","selected_answer":"B","sequence_number":40,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"1cc561a1-33ea-4a9a-8b20-52b57db34825","selected_answer":"D","sequence_number":41,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"1cc9ca64-657a-4fb5-a6b2-185116412d42","selected_answer":"D","sequence_number":42,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"38872fc2-3ab0-4711-a6fd-025c96f47cca","selected_answer":"B","sequence_number":43,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"491d6e9b-4c2d-4912-92de-6fb2ee4a1e1c","selected_answer":"C","sequence_number":44,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"3738d88c-3e30-483c-8c32-d2ed7f384d01","selected_answer":"D","sequence_number":45,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":false,"question_id":"64889be1-ba54-4909-adca-1c48d64413ad","selected_answer":"C","sequence_number":46,"response_time_ms":0,"difficulty_at_time":1},{"phase":"stability_confirmation","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"3a2a6833-8c83-493d-af58-76d08222ef64","selected_answer":"A","sequence_number":47,"response_time_ms":0,"difficulty_at_time":1},{"phase":"stability_confirmation","subtag":"data_interpretation","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"4238c753-3041-4d96-a05c-69134fa6a173","selected_answer":"C","sequence_number":48,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"data_interpretation","timestamp":"2026-08-28T15:38:46.138000","is_correct":false,"question_id":"3e179b76-3625-42fc-94fb-2aaad9468e2d","selected_answer":"A","sequence_number":49,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"logical_reasoning","timestamp":"2026-08-28T15:38:46.138000","is_correct":true,"question_id":"4738c491-a453-4d28-bcd0-ecd09de08e31","selected_answer":"B","sequence_number":50,"response_time_ms":0,"difficulty_at_time":2}]'::jsonb
    );

    INSERT INTO public.personal_assessment_attempts (
        id, learner_id, stream_id, started_at, completed_at, status, current_section_index,
        current_question_index, section_timings, created_at, updated_at, timer_remaining, elapsed_time,
        grade_level, adaptive_aptitude_session_id, all_responses, aptitude_scores, knowledge_scores,
        aptitude_question_timer, learner_context
    ) VALUES (
        'a8002dbb-a7e5-4acc-907b-3bb5a88f00c5'::uuid, v_learner_id, 'mba', '2026-08-28T14:10:41.971000'::timestamptz, '2026-08-28T15:38:46.138000'::timestamptz,
        'in_progress', 6, 19, '{}'::jsonb,
        '2026-08-28T14:10:41.971000'::timestamptz, '2026-08-28T15:38:46.138000'::timestamptz, NULL, 0, 'college', '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid,
        '{"06deb6c6-15ac-43ee-b2b3-985ebc9a960e":3,"0a47b8e2-f325-4b26-af58-6598ef066b8e":5,"240b7719-2a8b-4123-aaa6-c4e3c3b83805":4,"27b18af7-f107-4f3d-be1b-2918dc81f671":4,"2c1676c5-3c8c-47ab-a397-862e18c6bf7a":3,"339251a2-53bd-4e5f-83f2-d37323321ce6":3,"467ea730-eb1e-48c2-9a33-8ff61a42a2e1":3,"4dc1274b-0a67-4b78-9e71-bea384959d6a":3,"5562375d-1593-4245-93d4-03759e911d59":5,"56c280e7-1b54-4677-9ac3-05be13fb01a2":4,"5d88fb06-d3b4-4384-bc2a-0cb9e4258e05":4,"5fde0e38-736e-4532-b0d0-407f8a3fbe9f":5,"694cc973-0085-423d-94e7-5ef988c4445d":5,"6c4bffac-5ff0-417c-8284-516acf952da8":2,"76182f5f-cec9-460b-8cb0-cdd078851e2a":4,"8841900e-b81a-417d-bfa8-c34cc0883298":5,"8df3287d-ca2a-47c9-8d3e-fa6a158f806b":5,"90380841-e9b7-4a32-b463-b47adc1cd36e":2,"907e87a5-cca1-4777-b175-4b0e24c0659b":5,"9572c351-167f-4f1a-be31-fb84adab49d0":4,"c4c71340-1547-4da7-bb68-ec69538dbab0":3,"cdad024e-073f-4e51-bd31-8b9755cb5e07":5,"ce7ae29d-d579-45c9-b687-bcb078f71dc3":5,"d44433bb-c9b9-464e-ab71-68d50ef99441":3,"d6a9b143-b90a-4f5d-8793-99bb4b82ed8b":5,"dafdb924-1a67-492d-8a33-52f6437939c5":4,"ee37a69d-ce12-4608-9dd5-d59f68005927":5,"eeacf36c-6b0e-4c5e-aecf-dde25ef5e23c":3,"f3582656-2ccf-434d-909a-70329bface51":5,"fba6a261-6e57-43a3-b399-9d2a29a9e0dc":5,"01331035-a34c-4d25-8875-aa2ff83d66f5":4,"01fbf206-d912-4166-8b93-25c929af89ec":3,"06d3c6ed-bfb8-4996-9760-c7dd04dcdf93":3,"08760ff6-143f-420a-948f-e43725abd187":3,"091c5d5e-20e7-4569-80dd-684b3c3f4c7b":5,"0c9b32fa-f4c2-47bc-ac9e-79f95255945b":4,"0fa684c9-31a8-4017-a39d-67a1cf55d89d":4,"13d5b49b-874b-45da-8351-a284866c575e":4,"167dfd52-ebbc-4937-8ad4-628b690112d2":4,"17494d6d-577f-45fe-adfd-b8d87ca53ec3":4,"1869d9d7-e04a-45c9-9c9e-88b49925b12f":5,"26a5070e-5c6e-4e4c-99c4-0213a2eb0078":2,"27762ded-b161-4ffc-9209-5b2e56db2b7a":3,"2ad6ff93-24e6-4c21-8865-918cc56abb13":5,"2b92f958-0112-4ba3-9864-b6224d92da48":5,"2bacfdfd-e8b1-43d7-bae5-3ff5045fb3fb":3,"39b83fb7-c1b4-40a7-9db7-f4097841b372":5,"3d216a62-6bfd-43f0-b1b4-dbe1a0fdd55d":5,"3e666b0b-31d2-4494-a172-055d575a430d":3,"40c5e397-c445-43c9-ad4a-719a812aa099":5,"45ac3ded-fa7d-438b-9c7d-7ca53672e11c":4,"4779fc41-4687-4717-9aa4-6431065d86c9":3,"512b16c3-b9eb-4431-ae38-97220a23226c":3,"595c2f36-93f3-4c7d-ad61-b62fdb4f24f8":5,"660eb513-29d8-4690-aa8d-0b9eb85bbdd1":4,"6aa516f2-43f1-4344-ac40-91c2c1ab635c":4,"6c9a2a5d-3181-49d8-9637-344e74990a47":4,"71d5493f-183a-4f31-877e-599890810cbf":5,"7b093dbb-059c-4fa1-a2d2-76cc9b49c03f":2,"7cf5488d-1494-4524-beb7-e77d38e2ab01":4,"7e8f036d-21bc-4b4d-ab95-26fe3125274e":4,"90ccc419-a71d-47e4-b4ab-23349b46ec0a":4,"a7d1599c-9d54-4b72-aac4-84277bb0d6e4":3,"b773c9dc-6961-4d47-911d-a6276d147919":4,"b90646eb-41d7-4d3b-8c48-08386392da9a":5,"bcf3c128-3589-42f0-a80a-f948b05eead8":5,"beb2f937-9b66-4d49-8af9-d2a18ebc4b78":4,"c3887f59-fec7-40ef-8315-08536bcdbcbd":3,"c69768d2-412e-4758-a51a-3322aa302a50":3,"c8ec064b-9a93-4f65-bd7e-170c99ec93a5":3,"d3130891-b367-4102-8975-eed33f6a05ee":5,"d5a3a205-ff1b-4dd2-8988-435e5a5e1b5f":3,"dec93f12-84e4-4972-81dd-2e06770fc616":2,"e1bd638b-49b4-4560-8fe3-10cc524a2c70":4,"e90b5b8c-6ebd-469f-8e9a-d79a9aa144de":4,"ee0135fb-4b22-4a9a-9527-49ca434b1d9f":2,"fbaf10bf-8f5a-47ee-a76a-a69f8861aeb3":4,"fd150864-4484-497c-9de5-bfce6cac073a":4,"01c0e5be-c1ca-4631-a435-ae24a72ad52e":4,"05d2ad97-b710-498b-8bf3-38783458f017":3,"1a1d4a4d-a6c5-49eb-b69e-079a7cbf8d82":3,"2232eb8e-790e-43f6-9fab-29708d6ac351":5,"275b30cd-ab23-48c8-8418-02366fe05d45":4,"2d489adf-e237-4fc1-b9c7-d7e8c47aa7a1":3,"2e703b76-81c1-4751-a5b1-83e54ca8438a":3,"3ab491ae-dad3-4c55-8923-041421c5afc0":4,"3bc21600-cfc8-4609-abcd-0a717b743365":5,"4b3120c7-e95c-45d4-a16f-603034963d68":4,"5b74476a-eac9-4e29-bed3-3b685c8d5653":5,"5ba86e06-a7be-4d49-a9ed-c4e0f022e50e":4,"5fbcb1a1-b843-4e6b-84b0-cccb2688b52e":4,"60966df4-8a11-4256-b99a-eae057a53907":4,"658dc658-137c-46fb-9abe-94f917610564":4,"7c09d6ec-378b-4e66-8a72-08dea9952342":4,"924ce5b4-c523-49a6-aebf-29674cc2dc64":5,"a11a1520-8576-4762-97d4-73596450eec0":4,"c67cc0ae-03a2-4806-b350-b05baff61848":3,"faac271d-0ade-4fee-ae0d-976793779f88":3,"dd3a6dbe-78aa-4fb6-8321-7bacd0362dbf":3,"ea7d178f-730e-4f78-8c1f-dce39cdc1fbe":3,"fd807f20-f77e-479a-b9fe-a97effe0ab79":4,"03584db7-84bf-4121-85f4-36c0668b5efa":4,"0753c617-c120-494f-af90-f2025195c2e1":5,"0adb6072-b17d-4d60-b3b0-b7ddc87b78d7":4,"0de5838c-a239-4d01-8c23-d4ac0d0792ff":4,"211dbcb3-b7b9-4898-9a0e-7910c5b73ae0":4,"2bb51f6b-3f73-45ee-8b34-3a367cc87cdd":5,"48f74df0-b950-4570-99ae-0ca57aa0ada4":5,"54bfd038-3b74-4a48-817e-d472393e3c83":3,"578f73b8-f210-4fd3-939d-606a663e8428":4,"616fbb97-16aa-4331-9d90-7264857aba70":4,"62df1810-d7a0-4d64-bea8-ab313e8517fe":4,"6968f6e6-7b17-4f30-acc4-cd992fdb6015":2,"6dc44857-6c56-49f5-bf8a-d550f1f9c804":4,"724ad68c-b691-4c1d-9d50-a6ed43a18857":2,"85703c95-e68f-4874-9d2b-f183d37e5b4c":3,"969216ed-87c9-461d-a120-96b4990637fb":4,"9e8d9da7-17b0-4e19-9e84-5758367bdb3c":5,"aa6f2012-8b4b-44cf-b521-7390eacb9ebe":5,"b06c7b60-6289-4611-934a-7e0ec04082cc":2,"d22fe66e-4dd9-4381-bb80-9357a866b76d":4,"d2b86a46-d1ac-45a4-bdd0-835d00989965":3,"e5c2d2a0-65b0-447a-858c-c43cc3623d4c":4,"ef782ccd-3409-4120-a0b6-a4cd0b45ad48":5,"b32bcbe0-d431-470b-849a-c2e363734cf1":4,"0c52a0c0-1531-439d-b826-c8924a315e3c":{"best":"Practice small parts, seek feedback, then present.","worst":"Skip presenting."},"242df483-6ef0-4c4d-9f4e-72ea170807be":{"best":"Learn basics fast, ask guidance early, deliver in parts.","worst":"Say no immediately."},"61304246-4810-46dc-94c1-0f3866035436":{"best":"Inform mentor, correct quickly, explain learning.","worst":"Hide it and hope nobody notices."},"dadd0616-7d2a-4634-9b54-0f2e8992cc16":{"best":"Facilitate a calm discussion on facts and goals.","worst":"Take sides with your friend."},"eaf39932-7c82-41e6-9e93-34eea9d8a3d7":{"best":"Talk privately, ask what''s blocking them, agree on a plan.","worst":"Complain to the faculty immediately."},"7b4fee68-2c37-4d79-817a-25dcd7fc069f":{"best":"Ask for priority changes and renegotiate timeline.","worst":"Ignore and continue old plan."},"1012c64d-fecc-461d-8cf6-f18a6cfd2a16":"B. Leadership and management skills","9103b1c5-0e9a-43d6-aff1-8dc1a6dfee0d":"B. Engineering","9025bacb-1519-4565-8792-93fdb4bed544":"A. Strengths, Weaknesses, Opportunities, Threats","6392bbc7-cb66-4d27-b184-5c3f9b299ecd":"B. Income Statement","1ccdc15d-d31b-470c-af2b-095f88dafcb7":"B. To offer office space and support for new businesses","15e1e36b-76cb-4b91-89bf-eae9233553aa":"B. Democratic leadership","5ce96fa6-b66a-4941-8571-42bcca630324":"C. Ensuring efficient flow of goods and services","5492ab5e-db33-4b4e-b91e-2f4f0afe549e":"B. Money is more valuable the sooner it is received","db6c7ebd-3cca-4289-ba41-4ed8adfe9166":"C. Observational research","1f8ffafa-910d-425f-aff2-3d53af395e8d":"B. To maximize profits at all costs","dec4bec2-558c-4f31-9148-b35fea065e2e":"C. Vision statement is aspirational, mission statement is operational","192fbe42-2eef-4fd4-814c-2dc7d0054f3a":"B. Introducing products that create new markets and value networks","902ba6cc-796d-4388-98a8-ee290df6af31":"B. It helps in understanding industry dynamics and competitiveness","cdb4bc90-3dfd-4b40-adf4-9d54a2a4ca9e":"B. It helps leaders understand and manage their emotions and those of others","4bd684c0-28c2-4d06-b53b-8eaec2dfac6f":"B. Ethical marketing practices enhance brand reputation and customer trust","c4357c6d-b129-45b7-ae29-2acb271300d7":"A. Master of Business Administration","2eb38356-eefe-41e8-b1e2-a1d6fdb30084":"A. ROI (Return on Investment)","bee15d54-76f8-4917-b137-7b0fe082c0c2":"B. Operations","6d97d6c8-68a1-45b9-83d9-a21ef6084053":"A. Functional Structure","33febca2-8cbb-4fdb-a458-ff6f7e3faee5":"B. Creating uncontested market space with innovative value propositions","fd874361-af44-4c4b-b4ec-86d5b5c4bbb6":"Copyright","89336031-aea9-4549-896e-badf728dc3f0":"Chief Executive Officer","665b4e19-0339-4ade-bc24-5fc2b7c2cc68":"Initial Public Offering","f8ae5dc3-0f4c-4349-944f-cb5093434cd3":"Bureaucracy","0db2a798-a51d-4bf7-ba4b-29e07054e822":"Auditing","e77bbdb2-f063-4791-81e8-4e5f76ce117a":"Income Statement","5dd130b6-e6ca-478c-94d2-6782688d1df9":"Liquidation","d38162be-72dd-4d69-a4c2-fec4dabc8b3e":"Inflation","c55c716c-6f06-4c67-847e-c4e913b998d3":"₹5000","0496e5c1-096b-4c06-8f48-b78ce7772ec6":"30","e8964dc2-aa6e-44c5-a28c-04e62fcbd6d4":"₹100","fc92fabc-5e8c-474b-a665-f1996420f962":"18%","815e9ed6-d680-4c1c-84d6-0082e89307d0":"40%","549946f9-2454-4bf3-bce7-f37dc7d29a0b":"₹25000","d880ab07-23ee-4408-9e1e-2c0566355436":"0.5","18ccfcdc-cbb6-4aeb-ac54-c70b793cb9ea":"₹50000","9d9b3d27-565b-4e3f-bc51-fb3cadb9ef40":"₹16666.67","30596cc8-98a9-4376-ad6c-b89b72cccdf7":"₹750,000","dd134bda-c75a-46ea-a064-97668944b9fe":"3 months","185cfb4f-d537-4c3b-8114-8827435e88ae":"36","d6ef234d-a3cb-4dc7-bb57-420945c28a6c":"28","166b0384-5d39-47d6-afb2-0cfcbcc0eabe":"90","59660931-6f78-4658-bed2-51193dd52262":"△","b919a830-d200-44ae-8008-93cb7ab32e07":"33","1aa9c06b-e311-4e66-81db-fe3666a3b2b7":"Profit","b0587987-2b3b-411b-93f9-da24d34685e8":"15","a8f1605b-66ed-4f15-854f-055c8a62cca6":"CEO","b99c211c-5c71-4e9e-b556-a2c3bc74f5a0":"East","62a5570a-4141-4556-8ca6-68e66d4577b1":"Diamond","9cec992e-3aa9-44a3-8e30-e4bcc7247ba7":"E","ed1c06f3-6438-4afc-a246-5d2a35524b6f":"Collaborative success","ccaa78a2-c5a2-470c-a4c4-d2a321bb512c":"Cost Leadership Strategy","e41153ca-1054-4cb8-9a25-c345d637860d":"Profit maximization","80002635-0b00-49c1-8558-a0206541a3c9":"Democratic","2d9c573c-0c22-43a1-b0cc-2ed82fde98c5":"40%","af222009-6aa9-48c5-8304-eeb33c855765":"25%","98ce5216-f54a-4d8d-907b-02da6b98feb9":"1600","03fddd17-2bdd-45d4-af71-b401c90ba2ba":"$64","e1c332d6-83cf-4ae6-8d1e-ae6df9f9166c":"10","2d620edf-7ce5-4744-992c-5403265959b1":"48","69f18c25-4623-462b-b89d-f1514cab3c21":"CEO","68a37766-3595-440f-8cb9-cfe496f8c23c":"9","dc7002ee-a35a-4049-ab4b-8b71dc7ca481":"DEAL","101f5a92-7989-427c-82ae-f63ea0d55833":"PLAX","52b74850-b36a-4e2f-958c-6d66b7c8736e":"$5250","c28609cf-c3c1-47ad-9e43-92d96db48b39":"20%","27f6bb3c-1b4b-40e8-9e5e-82e97ead117d":"5%","1817763c-f114-4889-9f56-c6ade91d8e1d":"3% decrease","6e35f75c-f158-4da0-a6f5-790a815ccecc":"12","92343113-e9e0-4ee1-9682-04b89ebe16ff":"26"}'::jsonb, NULL, NULL, NULL,
        '{"rawGrade":"PG","degreeLevel":"Postgraduate","programCode":"MBA","programName":"Master of Business Administration","selectedStream":"mba","migrationSource":"google_forms"}'::jsonb
    );

    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '0a2e74c7-a243-45dd-a104-b1f75bce699e'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '01a72c08-518b-4010-aaf2-acbb36666a0e'::uuid,
        'A', TRUE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 1,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Solve for x: 5x + 11 = 41', '{"A":"6","B":"0","C":"2","D":"1"}'::jsonb,
        'A', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'b956cd5c-47a6-4e75-8524-58e3df959c15'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '1f8cba9a-2379-4792-9095-44710399f207'::uuid,
        'D', TRUE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 2,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Solve for x: 4x + 16 = 32', '{"A":"0","B":"6","C":"8","D":"4"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '861c1846-4927-4a3a-91c3-ceaef752d935'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '1ffdc626-4273-4e57-85e2-1855928f3467'::uuid,
        'A', TRUE, 0,
        5, 'numerical_reasoning', 'diagnostic_screener', 3,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Solve for x: 10x + 30 = 100', '{"A":"7","B":"9","C":"12","D":"5"}'::jsonb,
        'A', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '610280cf-392d-4ef0-afb0-e7725f192292'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '21ced5d6-173f-469b-8c17-9e4da6b04993'::uuid,
        'A', TRUE, 0,
        2, 'numerical_reasoning', 'diagnostic_screener', 4,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Solve for x: 8x + 18 = 66', '{"A":"6","B":"9","C":"10","D":"3"}'::jsonb,
        'A', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '2a464f21-5f45-43a6-a499-84897d609ff6'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '2223eea8-9c93-4396-9859-9d1819bd97f1'::uuid,
        'D', TRUE, 0,
        4, 'numerical_reasoning', 'diagnostic_screener', 5,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Solve for x: 9x + 25 = 97', '{"A":"5","B":"11","C":"0","D":"8"}'::jsonb,
        'D', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '8e652108-fc99-4043-a34c-6ceee2deef0a'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '1b483fbb-e262-4c32-af03-8d67693573e6'::uuid,
        'D', TRUE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 6,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Evaluate: (60 + 89) Ã— 6 âˆ’ 3', '{"A":"854","B":"995","C":"818","D":"891"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'cd880ff4-e1cb-4ee2-8717-b536144431b3'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '1bf2d8cf-14ab-4334-bffc-84392410d8f1'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 7,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Evaluate: (50 + 48) Ã— 6 âˆ’ 2', '{"A":"568","B":"513","C":"586","D":"575"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '2439335d-1bda-49bb-9bbc-790afc816725'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '0fb8bf96-4419-47f3-8714-676fc9e12682'::uuid,
        'C', TRUE, 0,
        5, 'data_interpretation', 'diagnostic_screener', 8,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Data table (units): Q1=184, Q2=145, Q3=123, Q4=163. What is the total for the year (Q1+Q2+Q3+Q4)?', '{"A":"579","B":"477","C":"615","D":"692"}'::jsonb,
        'C', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '655f90e2-aa24-4669-9765-a134be8d46ff'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '3020b398-f051-4071-a4db-b5282afb87f8'::uuid,
        'A', TRUE, 0,
        4, 'data_interpretation', 'adaptive_core', 9,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Data table (units): Q1=124, Q2=157, Q3=113, Q4=80. What is the total for the year (Q1+Q2+Q3+Q4)?', '{"A":"474","B":"519","C":"494","D":"540"}'::jsonb,
        'A', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '9bd4aeb7-3d8c-4b6a-b733-de2871aff212'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '40ee0126-bce3-4f3e-bd8b-bda922eba1b7'::uuid,
        'C', TRUE, 0,
        4, 'logical_reasoning', 'adaptive_core', 10,
        '2026-08-28T15:38:46.138000'::timestamptz, 'For the numbers 16, 22, 39, 45, 53, what is the median?', '{"A":"51","B":"54","C":"39","D":"12"}'::jsonb,
        'C', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '7f02c946-3dc9-46fd-833f-948b2a675998'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '14c51e9d-0171-445b-aacf-f85a40723570'::uuid,
        'D', TRUE, 0,
        4, 'pattern_recognition', 'adaptive_core', 11,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Squares pattern: 144, 169, 196, 225, ?', '{"A":"312","B":"251","C":"198","D":"256"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'c97eb988-c02a-4d17-9216-7570a3b43c9a'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '5c24a741-c0cd-46b3-a5ea-2a183ee3004c'::uuid,
        'B', TRUE, 0,
        1, 'pattern_recognition', 'adaptive_core', 12,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Squares pattern: 36, 49, 64, 81, ?', '{"A":"84","B":"100","C":"107","D":"108"}'::jsonb,
        'B', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '230e8f72-fdbc-45e8-bfc3-8ed06638e415'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '0a6e2c03-94d1-4881-8497-7300532e9fb9'::uuid,
        'A', FALSE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 13,
        '2026-08-28T15:38:46.138000'::timestamptz, 'If probability of success is 0.24, what is the expected number of successes in 30 trials?', '{"A":"7.5391","B":"6.8571","C":"7.1066","D":"7.2"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '76f4579d-49e2-4632-81ca-6007a3d1dbe9'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '5c3c71f0-8f67-4a22-9b3e-56718a4d0898'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 14,
        '2026-08-28T15:38:46.138000'::timestamptz, 'If probability of success is 0.2, what is the expected number of successes in 20 trials?', '{"A":"4.6198","B":"3.922","C":"4.0","D":"4.2968"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'e70d8d8d-94a7-4b73-add7-b7c544ca7671'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '196980e4-5041-437a-82c0-85414bdec8eb'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 15,
        '2026-08-28T15:38:46.138000'::timestamptz, 'If log_10(1000000) = k, what is k?', '{"A":"18","B":"12","C":"6","D":"4"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'db3935a5-103c-40b7-84ba-3c2e9546f985'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '089b0340-5ece-45e1-9e99-9806166cb1a3'::uuid,
        'C', TRUE, 0,
        5, 'numerical_reasoning', 'adaptive_core', 16,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the 10th term of an AP with first term 48 and common difference 10.', '{"A":"152","B":"92","C":"138","D":"172"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '2b771d88-48b2-482f-80b5-efd7d8916666'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '0a5d107b-f724-48e8-9e53-28c73cff01f2'::uuid,
        'B', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 17,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the 9th term of an AP with first term 36 and common difference 8.', '{"A":"101","B":"100","C":"120","D":"82"}'::jsonb,
        'B', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '9ed1df95-6295-45f4-a2a7-40a2c8e88554'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '1307c2dc-4ce2-4c91-acee-232654b46455'::uuid,
        'A', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 18,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the 8th term of an AP with first term 44 and common difference 10.', '{"A":"114","B":"104","C":"121","D":"112"}'::jsonb,
        'A', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '93e845d8-8464-4b3c-bc02-47365881e6f5'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '1566a37f-964a-46a6-86a8-5afb46b3308a'::uuid,
        'D', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 19,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the next term: 14, 20, 32, 50, ?', '{"A":"76","B":"56","C":"69","D":"74"}'::jsonb,
        'D', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'a76f38fa-34f0-47eb-927b-1b8a24552eed'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '1a2d7e85-9218-4933-b546-a9187d241ea1'::uuid,
        'A', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 20,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the next term: 14, 18, 26, 38, ?', '{"A":"54","B":"60","C":"78","D":"43"}'::jsonb,
        'A', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '16075eea-3f14-431a-adfe-a0838c2f6dac'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '21023475-e847-4d44-b2fe-67fbd1039639'::uuid,
        'D', TRUE, 0,
        4, 'numerical_reasoning', 'adaptive_core', 21,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the next term in the series: 12, 20, 36, 60, ?', '{"A":"116","B":"80","C":"114","D":"92"}'::jsonb,
        'D', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '43112555-b592-4b17-aba3-10a6e90dcc3b'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '226e0b6d-70ab-4794-add5-fc7538a67c41'::uuid,
        'C', FALSE, 0,
        1, 'pattern_recognition', 'adaptive_core', 22,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the next term in the series: 6, 12, 24, 42, ?', '{"A":"42","B":"48","C":"76","D":"66"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '806bcce1-92de-41a1-888e-8f27f0a78c7f'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '271c685f-ceca-4e90-a966-ccd12ffabe21'::uuid,
        'A', FALSE, 0,
        5, 'pattern_recognition', 'adaptive_core', 23,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find next term: 44, 51, 65, 86, ?', '{"A":"124","B":"132","C":"114","D":"159"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'cdf693bc-6f7a-40a4-8724-7391be0e9f2d'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '31579955-806e-4a24-8bd3-cfc7758ae74f'::uuid,
        'B', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 24,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the next term in the series: 12, 18, 30, 48, ?', '{"A":"73","B":"72","C":"83","D":"71"}'::jsonb,
        'B', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'feb601d1-8b6c-44d7-92be-ea2bc6bc671c'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '3cd386ad-1bb3-46fc-af98-0bea4044a337'::uuid,
        'C', TRUE, 0,
        5, 'numerical_reasoning', 'adaptive_core', 25,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the next term: 35, 45, 65, 95, ?', '{"A":"114","B":"145","C":"135","D":"132"}'::jsonb,
        'C', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '64a5837b-f760-4816-9597-9193326e50af'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '42cac156-9490-41f8-9a1e-f602c3bef5fa'::uuid,
        'D', TRUE, 0,
        5, 'pattern_recognition', 'adaptive_core', 26,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the next term in the series: 20, 30, 50, 80, ?', '{"A":"160","B":"131","C":"138","D":"120"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'cc3b0c11-8d5f-4760-9b29-853b9cbfd2a1'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '481895db-c065-46fd-92e1-a6aed13faad0'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 27,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the next term in the series: 7, 12, 22, 37, ?', '{"A":"70","B":"45","C":"57","D":"69"}'::jsonb,
        'C', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'c2ae87a7-97bf-48c4-943b-81d0706e35a8'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '49d8fba8-10a1-42a1-89fd-65da3341c535'::uuid,
        'C', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 28,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find next term: 19, 23, 31, 43, ?', '{"A":"45","B":"41","C":"59","D":"48"}'::jsonb,
        'C', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'ecb30725-b29b-446e-942a-2f50317e5980'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '4b7dd7ae-8b2f-4051-8e8f-cbd2f88f487a'::uuid,
        'C', TRUE, 0,
        1, 'pattern_recognition', 'adaptive_core', 29,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Find the next term: 37, 40, 46, 55, ?', '{"A":"73","B":"45","C":"67","D":"59"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'd54409f3-3148-4a50-bc1f-d9a6e8b0f0e9'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '6b9d7960-c2cb-4e69-8bbd-3f1928b0667b'::uuid,
        'B', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 30,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Squares pattern: 81, 100, 121, 144, ?', '{"A":"172","B":"169","C":"143","D":"157"}'::jsonb,
        'B', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '8d48e0f6-3998-4780-ab24-2a8dcde8499e'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '0da21e72-9077-47e6-9dd6-988bc1e48adf'::uuid,
        'C', TRUE, 0,
        1, 'pattern_recognition', 'adaptive_core', 31,
        '2026-08-28T15:38:46.138000'::timestamptz, 'In a 2Ã—2 grid, bottom-right equals sum of other three. If grid is [[21,9],[21,?]], find ?', '{"A":"59","B":"65","C":"51","D":"54"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '5fe7c0d9-44f3-4e3f-acd7-c701bdd7ec95'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '1ce56a05-48cf-4116-abfc-d72d32d72577'::uuid,
        'C', TRUE, 0,
        4, 'pattern_recognition', 'adaptive_core', 32,
        '2026-08-28T15:38:46.138000'::timestamptz, 'In a 2Ã—2 grid, bottom-right equals sum of other three. If grid is [[30,19],[9,?]], find ?', '{"A":"74","B":"72","C":"58","D":"61"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'ada5610b-742f-4cc4-8840-80c1590d3f44'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '2354c56b-4c26-4ec2-93e8-76c055d57a3f'::uuid,
        'D', TRUE, 0,
        2, 'pattern_recognition', 'adaptive_core', 33,
        '2026-08-28T15:38:46.138000'::timestamptz, 'In a 2Ã—2 grid, bottom-right equals sum of other three. If grid is [[32,10],[20,?]], find ?', '{"A":"68","B":"46","C":"56","D":"62"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '03047f48-fa4b-4af9-b7a5-7fdc06e2bfe5'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '0d7c36ac-e042-49c6-ab76-d090c046e8e6'::uuid,
        'A', TRUE, 0,
        3, 'logical_reasoning', 'adaptive_core', 34,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Days are coded Mon=1,...,Sun=7. If today has code 6, what will be the code after 81 days?', '{"A":"3","B":"9","C":"1","D":"8"}'::jsonb,
        'A', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '580c3091-9a8f-40a2-9841-dde25b0bff6b'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '20b39805-bf80-40d3-b67f-f2c0a88a146b'::uuid,
        'A', TRUE, 0,
        1, 'logical_reasoning', 'adaptive_core', 35,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Days are coded Mon=1,...,Sun=7. If today has code 2, what will be the code after 37 days?', '{"A":"4","B":"7","C":"3","D":"16"}'::jsonb,
        'A', 'Step 1: Track relationships systematically.
 
 Step 2: Eliminate contradictions.
 
 Step 3: Arrive at the unique numeric conclusion.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '2a73f8ca-81f1-45e9-b716-f14d1889f910'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '005b3803-b53f-43a6-bf42-9502540eb9ae'::uuid,
        'C', TRUE, 0,
        3, 'logical_reasoning', 'adaptive_core', 36,
        '2026-08-28T15:38:46.138000'::timestamptz, 'In a group, |A|=44, |B|=42, and |Aâˆ©B|=18. What is |AâˆªB|?', '{"A":"56","B":"82","C":"68","D":"70"}'::jsonb,
        'C', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'dfdf93ad-75e3-458d-aa56-d51a87f14763'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '286c5cad-a097-455d-b168-e9c7449c4ec2'::uuid,
        'B', TRUE, 0,
        1, 'logical_reasoning', 'adaptive_core', 37,
        '2026-08-28T15:38:46.138000'::timestamptz, 'In a group, |A|=42, |B|=38, and |Aâˆ©B|=26. What is |AâˆªB|?', '{"A":"64","B":"54","C":"66","D":"52"}'::jsonb,
        'B', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '4a2a57fa-dc13-471b-8b86-981426a67abf'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '0e8e698d-ede3-4644-a889-83d778febdee'::uuid,
        'B', TRUE, 0,
        3, 'data_interpretation', 'adaptive_core', 38,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Category values: X=123, Y=93, Z=147. What is X''s share X/(X+Y+Z)? (round to 4 decimals)', '{"A":"0.6286","B":"0.3388","C":"0.6702","D":"0.4732"}'::jsonb,
        'B', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'ea1e3e36-06ac-499a-a69f-5ae63f77ecf8'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '149ce6cc-9b31-45e4-968a-7c728edd1779'::uuid,
        'C', TRUE, 0,
        2, 'data_interpretation', 'adaptive_core', 39,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Index calculation: base value=144, current value=121. Compute index = (current/base)Ã—100. (round to 2 decimals)', '{"A":"83.6895","B":"84.0619","C":"84.03","D":"84.0971"}'::jsonb,
        'C', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'c02a17e1-2b11-4716-a068-3c8cbb51aabf'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '11a3f4bd-2181-45ae-8006-070b7a89d5c3'::uuid,
        'B', TRUE, 0,
        3, 'data_interpretation', 'adaptive_core', 40,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Quarter values: Q1=152, Q4=129. Compute proportional change (Q4âˆ’Q1)/Q1. (round to 4 decimals)', '{"A":"0.3692","B":"-0.1513","C":"0.1505","D":"-0.0623"}'::jsonb,
        'B', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'ffb65527-eb1a-496b-a150-0c78bf725434'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '1cc561a1-33ea-4a9a-8b20-52b57db34825'::uuid,
        'D', TRUE, 0,
        1, 'data_interpretation', 'adaptive_core', 41,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Category values: X=137, Y=90, Z=128. What is X''s share X/(X+Y+Z)? (round to 4 decimals)', '{"A":"0.4362","B":"0.122","C":"0.6884","D":"0.3859"}'::jsonb,
        'D', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'b3f2f9c4-023b-4369-9c5f-f867d4051325'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '1cc9ca64-657a-4fb5-a6b2-185116412d42'::uuid,
        'D', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 42,
        '2026-08-28T15:38:46.138000'::timestamptz, 'A dataset has mean 37 and standard deviation 11. Compute coefficient of variation (sd/mean). (round to 4 decimals)', '{"A":"0.4249","B":"0.2139","C":"0.43","D":"0.2973"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'd3eddd19-d4c9-49b6-92da-18a144b66c47'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '38872fc2-3ab0-4711-a6fd-025c96f47cca'::uuid,
        'B', TRUE, 0,
        4, 'numerical_reasoning', 'adaptive_core', 43,
        '2026-08-28T15:38:46.138000'::timestamptz, 'If probability of success is 0.39, what is the expected number of successes in 12 trials?', '{"A":"4.2409","B":"4.68","C":"4.804","D":"4.2373"}'::jsonb,
        'B', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '629ee9ba-cc52-42c0-bc33-0ba39d5a1060'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '491d6e9b-4c2d-4912-92de-6fb2ee4a1e1c'::uuid,
        'C', TRUE, 0,
        3, 'numerical_reasoning', 'adaptive_core', 44,
        '2026-08-28T15:38:46.138000'::timestamptz, 'If probability of success is 0.31, what is the expected number of successes in 25 trials?', '{"A":"8.0779","B":"7.6358","C":"7.75","D":"7.9281"}'::jsonb,
        'C', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '15398d3e-e231-4ae5-bb23-171163f6d3c8'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '3738d88c-3e30-483c-8c32-d2ed7f384d01'::uuid,
        'D', TRUE, 0,
        3, 'numerical_reasoning', 'stability_confirmation', 45,
        '2026-08-28T15:38:46.138000'::timestamptz, 'How many ways to choose 2 items from 12 distinct items?', '{"A":"48","B":"74","C":"54","D":"66"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '29aff743-a5d0-4d0e-b768-d8ee19227dcd'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '64889be1-ba54-4909-adca-1c48d64413ad'::uuid,
        'C', FALSE, 0,
        1, 'numerical_reasoning', 'stability_confirmation', 46,
        '2026-08-28T15:38:46.138000'::timestamptz, 'In a GP with first term 4 and ratio 3, what is the 5th term?', '{"A":"324","B":"347","C":"326","D":"313"}'::jsonb,
        'A', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '9176a3de-21c0-4b94-9db2-266c93f91a86'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '3a2a6833-8c83-493d-af58-76d08222ef64'::uuid,
        'A', TRUE, 0,
        1, 'numerical_reasoning', 'stability_confirmation', 47,
        '2026-08-28T15:38:46.138000'::timestamptz, 'If log_5(125) = k, what is k?', '{"A":"3","B":"4","C":"2","D":"1"}'::jsonb,
        'A', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'c34fa0f5-520f-4cd9-8383-f28b67e811f5'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '4238c753-3041-4d96-a05c-69134fa6a173'::uuid,
        'C', TRUE, 0,
        3, 'data_interpretation', 'stability_confirmation', 48,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Data table (units): Q1=115, Q2=158, Q3=90, Q4=137. What is the total for the year (Q1+Q2+Q3+Q4)?', '{"A":"518","B":"476","C":"500","D":"462"}'::jsonb,
        'C', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'a33d6f05-7977-4e20-ad30-6250c94010c8'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '3e179b76-3625-42fc-94fb-2aaad9468e2d'::uuid,
        'A', FALSE, 0,
        3, 'data_interpretation', 'stability_confirmation', 49,
        '2026-08-28T15:38:46.138000'::timestamptz, 'Quarter values: Q1=110, Q4=145. Compute proportional change (Q4âˆ’Q1)/Q1. (round to 4 decimals)', '{"A":"0.5565","B":"0.2164","C":"0.3182","D":"0.5771"}'::jsonb,
        'C', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '76dd42f6-d2a4-47f7-8253-692749e255f7'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, '4738c491-a453-4d28-bcd0-ecd09de08e31'::uuid,
        'B', TRUE, 0,
        2, 'logical_reasoning', 'stability_confirmation', 50,
        '2026-08-28T15:38:46.138000'::timestamptz, 'For the numbers 15, 22, 29, 34, 53, what is the median?', '{"A":"15","B":"29","C":"28","D":"13"}'::jsonb,
        'B', 'Step 1: Track relationships systematically.
 
 Step 2: Eliminate contradictions.
 
 Step 3: Arrive at the unique numeric conclusion.'
    );

    INSERT INTO public.adaptive_aptitude_results (
        id, session_id, learner_id, aptitude_level, confidence_tag, tier, total_questions, total_correct,
        overall_accuracy, accuracy_by_difficulty, accuracy_by_subtag, difficulty_path, path_classification,
        average_response_time_ms, grade_level, completed_at, created_at, metadata
    ) VALUES (
        'a698eb3d-3d17-48cb-bd8a-d420de5458e8'::uuid, '1910bdad-8d6d-4621-b3cd-5ac06bfa8eed'::uuid, v_learner_id, 5,
        'high', 'H', 50, 45,
        90.0, '{"1":{"total":18,"correct":16,"accuracy":88.88888888888889},"5":{"total":6,"correct":5,"accuracy":83.33333333333334},"2":{"total":11,"correct":10,"accuracy":90.9090909090909},"4":{"total":7,"correct":7,"accuracy":100.0},"3":{"total":8,"correct":7,"accuracy":87.5}}'::jsonb, '{"numerical_reasoning":{"total":27,"correct":25,"accuracy":92.5925925925926},"data_interpretation":{"total":8,"correct":7,"accuracy":87.5},"logical_reasoning":{"total":6,"correct":6,"accuracy":100.0},"pattern_recognition":{"total":9,"correct":7,"accuracy":77.77777777777779}}'::jsonb, ARRAY[1,1,5,2,4,1,1,5,4,4,4,1,2,1,1,5,1,2,2,2,4,1,5,1,5,5,1,2,1,2,1,4,2,3,1,3,1,3,2,3,1,2,4,3,3,1,1,3,3,2]::smallint[],
        'stable', 0, 'postgraduate', '2026-08-28T15:38:46.138000'::timestamptz, '2026-08-28T15:38:46.138000'::timestamptz, '{"duplicateValidation":{"isValid":true,"duplicates":[]},"migrationSource":"google_forms","responseTimeUnavailable":true}'::jsonb
    );
END $$;

COMMIT;
