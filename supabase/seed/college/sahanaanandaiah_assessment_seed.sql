-- Generated Google Forms assessment migration
-- Learner: sahanaanandaiah@gmail.com
-- Target tables: personal_assessment_attempts, adaptive_aptitude_sessions, adaptive_aptitude_responses, adaptive_aptitude_results
-- Existing learner and question UUIDs are reused.
-- response_time_ms/average_response_time_ms are 0 because Google Forms did not record per-question timing.

BEGIN;

-- ============================================================
-- Learner: sahanaanandaiah@gmail.com
-- Source: Assessment Answers.xlsx (Google Forms migration)
-- ============================================================
DO $$
DECLARE
    v_learner_id uuid;
BEGIN
    SELECT id INTO v_learner_id FROM public.learners WHERE lower(email) = lower('sahanaanandaiah@gmail.com') LIMIT 1;
    IF v_learner_id IS NULL THEN
        RAISE EXCEPTION 'Learner not found for email: %', 'sahanaanandaiah@gmail.com';
    END IF;

    INSERT INTO public.adaptive_aptitude_sessions (
        id, learner_id, grade_level, current_phase, tier, current_difficulty, difficulty_path,
        questions_answered, correct_answers, current_question_index, current_phase_questions,
        provisional_band, status, started_at, updated_at, completed_at, learner_course, all_responses
    ) VALUES (
        'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, v_learner_id, 'postgraduate', 'stability_confirmation', 'H',
        2, ARRAY[1,1,5,2,4,1,1,5,4,4,4,1,2,1,1,5,1,2,2,2,4,1,5,1,5,5,1,2,1,2,1,4,2,3,1,3,1,3,2,3,1,2,4,3,3,1,1,3,3,2]::smallint[],
        50, 47, 6, '[]'::jsonb,
        5, 'completed', '2026-08-28T14:10:01.391000'::timestamptz, '2026-08-28T15:37:08.048000'::timestamptz, '2026-08-28T15:37:08.048000'::timestamptz, NULL,
        '[{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"01a72c08-518b-4010-aaf2-acbb36666a0e","selected_answer":"A","sequence_number":1,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"1f8cba9a-2379-4792-9095-44710399f207","selected_answer":"D","sequence_number":2,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"1ffdc626-4273-4e57-85e2-1855928f3467","selected_answer":"A","sequence_number":3,"response_time_ms":0,"difficulty_at_time":5},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"21ced5d6-173f-469b-8c17-9e4da6b04993","selected_answer":"A","sequence_number":4,"response_time_ms":0,"difficulty_at_time":2},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"2223eea8-9c93-4396-9859-9d1819bd97f1","selected_answer":"D","sequence_number":5,"response_time_ms":0,"difficulty_at_time":4},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"1b483fbb-e262-4c32-af03-8d67693573e6","selected_answer":"D","sequence_number":6,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"1bf2d8cf-14ab-4334-bffc-84392410d8f1","selected_answer":"C","sequence_number":7,"response_time_ms":0,"difficulty_at_time":1},{"phase":"diagnostic_screener","subtag":"data_interpretation","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"0fb8bf96-4419-47f3-8714-676fc9e12682","selected_answer":"C","sequence_number":8,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"3020b398-f051-4071-a4db-b5282afb87f8","selected_answer":"A","sequence_number":9,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"40ee0126-bce3-4f3e-bd8b-bda922eba1b7","selected_answer":"C","sequence_number":10,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"14c51e9d-0171-445b-aacf-f85a40723570","selected_answer":"D","sequence_number":11,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"5c24a741-c0cd-46b3-a5ea-2a183ee3004c","selected_answer":"B","sequence_number":12,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"0a6e2c03-94d1-4881-8497-7300532e9fb9","selected_answer":"D","sequence_number":13,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"5c3c71f0-8f67-4a22-9b3e-56718a4d0898","selected_answer":"C","sequence_number":14,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"196980e4-5041-437a-82c0-85414bdec8eb","selected_answer":"C","sequence_number":15,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"089b0340-5ece-45e1-9e99-9806166cb1a3","selected_answer":"C","sequence_number":16,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"0a5d107b-f724-48e8-9e53-28c73cff01f2","selected_answer":"B","sequence_number":17,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"1307c2dc-4ce2-4c91-acee-232654b46455","selected_answer":"A","sequence_number":18,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"1566a37f-964a-46a6-86a8-5afb46b3308a","selected_answer":"D","sequence_number":19,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"1a2d7e85-9218-4933-b546-a9187d241ea1","selected_answer":"A","sequence_number":20,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"21023475-e847-4d44-b2fe-67fbd1039639","selected_answer":"D","sequence_number":21,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"226e0b6d-70ab-4794-add5-fc7538a67c41","selected_answer":"D","sequence_number":22,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"271c685f-ceca-4e90-a966-ccd12ffabe21","selected_answer":"C","sequence_number":23,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"31579955-806e-4a24-8bd3-cfc7758ae74f","selected_answer":"B","sequence_number":24,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":false,"question_id":"3cd386ad-1bb3-46fc-af98-0bea4044a337","selected_answer":"B","sequence_number":25,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"42cac156-9490-41f8-9a1e-f602c3bef5fa","selected_answer":"D","sequence_number":26,"response_time_ms":0,"difficulty_at_time":5},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"481895db-c065-46fd-92e1-a6aed13faad0","selected_answer":"C","sequence_number":27,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"49d8fba8-10a1-42a1-89fd-65da3341c535","selected_answer":"C","sequence_number":28,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"4b7dd7ae-8b2f-4051-8e8f-cbd2f88f487a","selected_answer":"C","sequence_number":29,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"6b9d7960-c2cb-4e69-8bbd-3f1928b0667b","selected_answer":"B","sequence_number":30,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"0da21e72-9077-47e6-9dd6-988bc1e48adf","selected_answer":"C","sequence_number":31,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"1ce56a05-48cf-4116-abfc-d72d32d72577","selected_answer":"C","sequence_number":32,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"pattern_recognition","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"2354c56b-4c26-4ec2-93e8-76c055d57a3f","selected_answer":"D","sequence_number":33,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":false,"question_id":"0d7c36ac-e042-49c6-ab76-d090c046e8e6","selected_answer":"D","sequence_number":34,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"20b39805-bf80-40d3-b67f-f2c0a88a146b","selected_answer":"A","sequence_number":35,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"005b3803-b53f-43a6-bf42-9502540eb9ae","selected_answer":"C","sequence_number":36,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"logical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"286c5cad-a097-455d-b168-e9c7449c4ec2","selected_answer":"B","sequence_number":37,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"0e8e698d-ede3-4644-a889-83d778febdee","selected_answer":"B","sequence_number":38,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"149ce6cc-9b31-45e4-968a-7c728edd1779","selected_answer":"C","sequence_number":39,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"11a3f4bd-2181-45ae-8006-070b7a89d5c3","selected_answer":"B","sequence_number":40,"response_time_ms":0,"difficulty_at_time":3},{"phase":"adaptive_core","subtag":"data_interpretation","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"1cc561a1-33ea-4a9a-8b20-52b57db34825","selected_answer":"D","sequence_number":41,"response_time_ms":0,"difficulty_at_time":1},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":false,"question_id":"1cc9ca64-657a-4fb5-a6b2-185116412d42","selected_answer":"B","sequence_number":42,"response_time_ms":0,"difficulty_at_time":2},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"38872fc2-3ab0-4711-a6fd-025c96f47cca","selected_answer":"B","sequence_number":43,"response_time_ms":0,"difficulty_at_time":4},{"phase":"adaptive_core","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"491d6e9b-4c2d-4912-92de-6fb2ee4a1e1c","selected_answer":"C","sequence_number":44,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"3738d88c-3e30-483c-8c32-d2ed7f384d01","selected_answer":"D","sequence_number":45,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"64889be1-ba54-4909-adca-1c48d64413ad","selected_answer":"A","sequence_number":46,"response_time_ms":0,"difficulty_at_time":1},{"phase":"stability_confirmation","subtag":"numerical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"3a2a6833-8c83-493d-af58-76d08222ef64","selected_answer":"A","sequence_number":47,"response_time_ms":0,"difficulty_at_time":1},{"phase":"stability_confirmation","subtag":"data_interpretation","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"4238c753-3041-4d96-a05c-69134fa6a173","selected_answer":"C","sequence_number":48,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"data_interpretation","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"3e179b76-3625-42fc-94fb-2aaad9468e2d","selected_answer":"C","sequence_number":49,"response_time_ms":0,"difficulty_at_time":3},{"phase":"stability_confirmation","subtag":"logical_reasoning","timestamp":"2026-08-28T15:37:08.048000","is_correct":true,"question_id":"4738c491-a453-4d28-bcd0-ecd09de08e31","selected_answer":"B","sequence_number":50,"response_time_ms":0,"difficulty_at_time":2}]'::jsonb
    );

    INSERT INTO public.personal_assessment_attempts (
        id, learner_id, stream_id, started_at, completed_at, status, current_section_index,
        current_question_index, section_timings, created_at, updated_at, timer_remaining, elapsed_time,
        grade_level, adaptive_aptitude_session_id, all_responses, aptitude_scores, knowledge_scores,
        aptitude_question_timer, learner_context
    ) VALUES (
        '1a7fc5cd-a10a-48fd-9cc6-88923cef1b96'::uuid, v_learner_id, 'mba', '2026-08-28T14:10:01.391000'::timestamptz, '2026-08-28T15:37:08.048000'::timestamptz,
        'completed', 6, 19, '{}'::jsonb,
        '2026-08-28T14:10:01.391000'::timestamptz, '2026-08-28T15:37:08.048000'::timestamptz, NULL, 0, 'college', 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid,
        '{"06deb6c6-15ac-43ee-b2b3-985ebc9a960e":4,"0a47b8e2-f325-4b26-af58-6598ef066b8e":5,"240b7719-2a8b-4123-aaa6-c4e3c3b83805":3,"27b18af7-f107-4f3d-be1b-2918dc81f671":5,"2c1676c5-3c8c-47ab-a397-862e18c6bf7a":5,"339251a2-53bd-4e5f-83f2-d37323321ce6":4,"467ea730-eb1e-48c2-9a33-8ff61a42a2e1":4,"4dc1274b-0a67-4b78-9e71-bea384959d6a":4,"5562375d-1593-4245-93d4-03759e911d59":5,"56c280e7-1b54-4677-9ac3-05be13fb01a2":3,"5d88fb06-d3b4-4384-bc2a-0cb9e4258e05":5,"5fde0e38-736e-4532-b0d0-407f8a3fbe9f":5,"694cc973-0085-423d-94e7-5ef988c4445d":4,"6c4bffac-5ff0-417c-8284-516acf952da8":3,"76182f5f-cec9-460b-8cb0-cdd078851e2a":5,"8841900e-b81a-417d-bfa8-c34cc0883298":4,"8df3287d-ca2a-47c9-8d3e-fa6a158f806b":4,"90380841-e9b7-4a32-b463-b47adc1cd36e":4,"907e87a5-cca1-4777-b175-4b0e24c0659b":4,"9572c351-167f-4f1a-be31-fb84adab49d0":4,"c4c71340-1547-4da7-bb68-ec69538dbab0":4,"cdad024e-073f-4e51-bd31-8b9755cb5e07":4,"ce7ae29d-d579-45c9-b687-bcb078f71dc3":4,"d44433bb-c9b9-464e-ab71-68d50ef99441":5,"d6a9b143-b90a-4f5d-8793-99bb4b82ed8b":5,"dafdb924-1a67-492d-8a33-52f6437939c5":4,"ee37a69d-ce12-4608-9dd5-d59f68005927":5,"eeacf36c-6b0e-4c5e-aecf-dde25ef5e23c":5,"f3582656-2ccf-434d-909a-70329bface51":4,"fba6a261-6e57-43a3-b399-9d2a29a9e0dc":5,"01331035-a34c-4d25-8875-aa2ff83d66f5":3,"01fbf206-d912-4166-8b93-25c929af89ec":5,"06d3c6ed-bfb8-4996-9760-c7dd04dcdf93":4,"08760ff6-143f-420a-948f-e43725abd187":4,"091c5d5e-20e7-4569-80dd-684b3c3f4c7b":5,"0c9b32fa-f4c2-47bc-ac9e-79f95255945b":4,"0fa684c9-31a8-4017-a39d-67a1cf55d89d":4,"13d5b49b-874b-45da-8351-a284866c575e":5,"167dfd52-ebbc-4937-8ad4-628b690112d2":4,"17494d6d-577f-45fe-adfd-b8d87ca53ec3":4,"1869d9d7-e04a-45c9-9c9e-88b49925b12f":4,"26a5070e-5c6e-4e4c-99c4-0213a2eb0078":4,"27762ded-b161-4ffc-9209-5b2e56db2b7a":4,"2ad6ff93-24e6-4c21-8865-918cc56abb13":5,"2b92f958-0112-4ba3-9864-b6224d92da48":4,"2bacfdfd-e8b1-43d7-bae5-3ff5045fb3fb":3,"39b83fb7-c1b4-40a7-9db7-f4097841b372":5,"3d216a62-6bfd-43f0-b1b4-dbe1a0fdd55d":5,"3e666b0b-31d2-4494-a172-055d575a430d":5,"40c5e397-c445-43c9-ad4a-719a812aa099":4,"45ac3ded-fa7d-438b-9c7d-7ca53672e11c":5,"4779fc41-4687-4717-9aa4-6431065d86c9":4,"512b16c3-b9eb-4431-ae38-97220a23226c":5,"595c2f36-93f3-4c7d-ad61-b62fdb4f24f8":4,"660eb513-29d8-4690-aa8d-0b9eb85bbdd1":3,"6aa516f2-43f1-4344-ac40-91c2c1ab635c":5,"6c9a2a5d-3181-49d8-9637-344e74990a47":5,"71d5493f-183a-4f31-877e-599890810cbf":4,"7b093dbb-059c-4fa1-a2d2-76cc9b49c03f":4,"7cf5488d-1494-4524-beb7-e77d38e2ab01":2,"7e8f036d-21bc-4b4d-ab95-26fe3125274e":5,"90ccc419-a71d-47e4-b4ab-23349b46ec0a":3,"a7d1599c-9d54-4b72-aac4-84277bb0d6e4":4,"b773c9dc-6961-4d47-911d-a6276d147919":4,"b90646eb-41d7-4d3b-8c48-08386392da9a":4,"bcf3c128-3589-42f0-a80a-f948b05eead8":4,"beb2f937-9b66-4d49-8af9-d2a18ebc4b78":5,"c3887f59-fec7-40ef-8315-08536bcdbcbd":4,"c69768d2-412e-4758-a51a-3322aa302a50":4,"c8ec064b-9a93-4f65-bd7e-170c99ec93a5":5,"d3130891-b367-4102-8975-eed33f6a05ee":5,"d5a3a205-ff1b-4dd2-8988-435e5a5e1b5f":5,"dec93f12-84e4-4972-81dd-2e06770fc616":4,"e1bd638b-49b4-4560-8fe3-10cc524a2c70":5,"e90b5b8c-6ebd-469f-8e9a-d79a9aa144de":4,"ee0135fb-4b22-4a9a-9527-49ca434b1d9f":3,"fbaf10bf-8f5a-47ee-a76a-a69f8861aeb3":5,"fd150864-4484-497c-9de5-bfce6cac073a":4,"01c0e5be-c1ca-4631-a435-ae24a72ad52e":5,"05d2ad97-b710-498b-8bf3-38783458f017":4,"1a1d4a4d-a6c5-49eb-b69e-079a7cbf8d82":4,"2232eb8e-790e-43f6-9fab-29708d6ac351":5,"275b30cd-ab23-48c8-8418-02366fe05d45":4,"2d489adf-e237-4fc1-b9c7-d7e8c47aa7a1":3,"2e703b76-81c1-4751-a5b1-83e54ca8438a":4,"3ab491ae-dad3-4c55-8923-041421c5afc0":4,"3bc21600-cfc8-4609-abcd-0a717b743365":5,"4b3120c7-e95c-45d4-a16f-603034963d68":5,"5b74476a-eac9-4e29-bed3-3b685c8d5653":4,"5ba86e06-a7be-4d49-a9ed-c4e0f022e50e":4,"5fbcb1a1-b843-4e6b-84b0-cccb2688b52e":5,"60966df4-8a11-4256-b99a-eae057a53907":4,"658dc658-137c-46fb-9abe-94f917610564":4,"7c09d6ec-378b-4e66-8a72-08dea9952342":4,"924ce5b4-c523-49a6-aebf-29674cc2dc64":4,"a11a1520-8576-4762-97d4-73596450eec0":3,"c67cc0ae-03a2-4806-b350-b05baff61848":5,"faac271d-0ade-4fee-ae0d-976793779f88":3,"dd3a6dbe-78aa-4fb6-8321-7bacd0362dbf":4,"ea7d178f-730e-4f78-8c1f-dce39cdc1fbe":4,"fd807f20-f77e-479a-b9fe-a97effe0ab79":5,"03584db7-84bf-4121-85f4-36c0668b5efa":4,"0753c617-c120-494f-af90-f2025195c2e1":4,"0adb6072-b17d-4d60-b3b0-b7ddc87b78d7":4,"0de5838c-a239-4d01-8c23-d4ac0d0792ff":4,"211dbcb3-b7b9-4898-9a0e-7910c5b73ae0":4,"2bb51f6b-3f73-45ee-8b34-3a367cc87cdd":4,"48f74df0-b950-4570-99ae-0ca57aa0ada4":4,"54bfd038-3b74-4a48-817e-d472393e3c83":3,"578f73b8-f210-4fd3-939d-606a663e8428":5,"616fbb97-16aa-4331-9d90-7264857aba70":4,"62df1810-d7a0-4d64-bea8-ab313e8517fe":4,"6968f6e6-7b17-4f30-acc4-cd992fdb6015":4,"6dc44857-6c56-49f5-bf8a-d550f1f9c804":5,"724ad68c-b691-4c1d-9d50-a6ed43a18857":3,"85703c95-e68f-4874-9d2b-f183d37e5b4c":3,"969216ed-87c9-461d-a120-96b4990637fb":4,"9e8d9da7-17b0-4e19-9e84-5758367bdb3c":4,"aa6f2012-8b4b-44cf-b521-7390eacb9ebe":4,"b06c7b60-6289-4611-934a-7e0ec04082cc":4,"d22fe66e-4dd9-4381-bb80-9357a866b76d":4,"d2b86a46-d1ac-45a4-bdd0-835d00989965":4,"e5c2d2a0-65b0-447a-858c-c43cc3623d4c":5,"ef782ccd-3409-4120-a0b6-a4cd0b45ad48":4,"b32bcbe0-d431-470b-849a-c2e363734cf1":4,"0c52a0c0-1531-439d-b826-c8924a315e3c":{"best":"Practice small parts, seek feedback, then present.","worst":"Practice small parts, seek feedback, then present."},"242df483-6ef0-4c4d-9f4e-72ea170807be":{"best":"Learn basics fast, ask guidance early, deliver in parts.","worst":"Learn basics fast, ask guidance early, deliver in parts."},"61304246-4810-46dc-94c1-0f3866035436":{"best":"Inform mentor, correct quickly, explain learning.","worst":"Inform mentor, correct quickly, explain learning."},"dadd0616-7d2a-4634-9b54-0f2e8992cc16":{"best":"Tell them to grow up","worst":"Facilitate a calm discussion on facts and goals."},"eaf39932-7c82-41e6-9e93-34eea9d8a3d7":{"best":"Talk privately, ask what''s blocking them, agree on a plan.","worst":"Do their part silently to finish."},"7b4fee68-2c37-4d79-817a-25dcd7fc069f":{"best":"Ask for priority changes and renegotiate timeline.","worst":"Ask for priority changes and renegotiate timeline."},"1012c64d-fecc-461d-8cf6-f18a6cfd2a16":"B. Leadership and management skills","9103b1c5-0e9a-43d6-aff1-8dc1a6dfee0d":"B. Engineering","9025bacb-1519-4565-8792-93fdb4bed544":"A. Strengths, Weaknesses, Opportunities, Threats","6392bbc7-cb66-4d27-b184-5c3f9b299ecd":"B. Income Statement","1ccdc15d-d31b-470c-af2b-095f88dafcb7":"A. To provide funding for startups","15e1e36b-76cb-4b91-89bf-eae9233553aa":"B. Democratic leadership","5ce96fa6-b66a-4941-8571-42bcca630324":"C. Ensuring efficient flow of goods and services","5492ab5e-db33-4b4e-b91e-2f4f0afe549e":"B. Money is more valuable the sooner it is received","db6c7ebd-3cca-4289-ba41-4ed8adfe9166":"C. Observational research","1f8ffafa-910d-425f-aff2-3d53af395e8d":"A. To determine the point where sales cover all costs","dec4bec2-558c-4f31-9148-b35fea065e2e":"C. Vision statement is aspirational, mission statement is operational","192fbe42-2eef-4fd4-814c-2dc7d0054f3a":"B. Introducing products that create new markets and value networks","902ba6cc-796d-4388-98a8-ee290df6af31":"B. It helps in understanding industry dynamics and competitiveness","cdb4bc90-3dfd-4b40-adf4-9d54a2a4ca9e":"B. It helps leaders understand and manage their emotions and those of others","4bd684c0-28c2-4d06-b53b-8eaec2dfac6f":"B. Ethical marketing practices enhance brand reputation and customer trust","c4357c6d-b129-45b7-ae29-2acb271300d7":"A. Master of Business Administration","2eb38356-eefe-41e8-b1e2-a1d6fdb30084":"A. ROI (Return on Investment)","bee15d54-76f8-4917-b137-7b0fe082c0c2":"B. Operations","6d97d6c8-68a1-45b9-83d9-a21ef6084053":"D. Hierarchical Structure","33febca2-8cbb-4fdb-a458-ff6f7e3faee5":"B. Creating uncontested market space with innovative value propositions","fd874361-af44-4c4b-b4ec-86d5b5c4bbb6":"Copyright","89336031-aea9-4549-896e-badf728dc3f0":"Chief Executive Officer","665b4e19-0339-4ade-bc24-5fc2b7c2cc68":"Initial Public Offering","f8ae5dc3-0f4c-4349-944f-cb5093434cd3":"Bureaucracy","0db2a798-a51d-4bf7-ba4b-29e07054e822":"Auditing","e77bbdb2-f063-4791-81e8-4e5f76ce117a":"Income Statement","5dd130b6-e6ca-478c-94d2-6782688d1df9":"Diversification","d38162be-72dd-4d69-a4c2-fec4dabc8b3e":"Inflation","c55c716c-6f06-4c67-847e-c4e913b998d3":"₹5000","0496e5c1-096b-4c06-8f48-b78ce7772ec6":"30","e8964dc2-aa6e-44c5-a28c-04e62fcbd6d4":"₹100","fc92fabc-5e8c-474b-a665-f1996420f962":"20%","815e9ed6-d680-4c1c-84d6-0082e89307d0":"50%","549946f9-2454-4bf3-bce7-f37dc7d29a0b":"₹30000","d880ab07-23ee-4408-9e1e-2c0566355436":"0.5","18ccfcdc-cbb6-4aeb-ac54-c70b793cb9ea":"₹50000","9d9b3d27-565b-4e3f-bc51-fb3cadb9ef40":"₹16666.67","30596cc8-98a9-4376-ad6c-b89b72cccdf7":"₹600,000","dd134bda-c75a-46ea-a064-97668944b9fe":"3 months","185cfb4f-d537-4c3b-8114-8827435e88ae":"36","d6ef234d-a3cb-4dc7-bb57-420945c28a6c":"24","166b0384-5d39-47d6-afb2-0cfcbcc0eabe":"85","59660931-6f78-4658-bed2-51193dd52262":"○","b919a830-d200-44ae-8008-93cb7ab32e07":"33","1aa9c06b-e311-4e66-81db-fe3666a3b2b7":"Profit","b0587987-2b3b-411b-93f9-da24d34685e8":"15","a8f1605b-66ed-4f15-854f-055c8a62cca6":"CEO","b99c211c-5c71-4e9e-b556-a2c3bc74f5a0":"North","62a5570a-4141-4556-8ca6-68e66d4577b1":"Diamond","9cec992e-3aa9-44a3-8e30-e4bcc7247ba7":"W","ed1c06f3-6438-4afc-a246-5d2a35524b6f":"Collaborative success","ccaa78a2-c5a2-470c-a4c4-d2a321bb512c":"Cost Leadership Strategy","e41153ca-1054-4cb8-9a25-c345d637860d":"Customer satisfaction","80002635-0b00-49c1-8558-a0206541a3c9":"Democratic","2d9c573c-0c22-43a1-b0cc-2ed82fde98c5":"40%","af222009-6aa9-48c5-8304-eeb33c855765":"25%","98ce5216-f54a-4d8d-907b-02da6b98feb9":"1200","03fddd17-2bdd-45d4-af71-b401c90ba2ba":"$64","e1c332d6-83cf-4ae6-8d1e-ae6df9f9166c":"14","2d620edf-7ce5-4744-992c-5403265959b1":"48","69f18c25-4623-462b-b89d-f1514cab3c21":"CEO","68a37766-3595-440f-8cb9-cfe496f8c23c":"9","dc7002ee-a35a-4049-ab4b-8b71dc7ca481":"DAEL","101f5a92-7989-427c-82ae-f63ea0d55833":"NALP","52b74850-b36a-4e2f-958c-6d66b7c8736e":"$5250","c28609cf-c3c1-47ad-9e43-92d96db48b39":"20%","27f6bb3c-1b4b-40e8-9e5e-82e97ead117d":"5%","1817763c-f114-4889-9f56-c6ade91d8e1d":"5% decrease","6e35f75c-f158-4da0-a6f5-790a815ccecc":"10","92343113-e9e0-4ee1-9682-04b89ebe16ff":"26"}'::jsonb, NULL, NULL, NULL,
        '{"rawGrade":"PG","degreeLevel":"Postgraduate","programCode":"MBA","programName":"Master of Business Administration","selectedStream":"mba","migrationSource":"google_forms"}'::jsonb
    );

    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'ebdfe5ba-a9b1-4b44-9db4-49ea0b1cd80f'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '01a72c08-518b-4010-aaf2-acbb36666a0e'::uuid,
        'A', TRUE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 1,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Solve for x: 5x + 11 = 41', '{"A":"6","B":"0","C":"2","D":"1"}'::jsonb,
        'A', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '453da4a7-2b00-4d68-8322-a27742157747'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '1f8cba9a-2379-4792-9095-44710399f207'::uuid,
        'D', TRUE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 2,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Solve for x: 4x + 16 = 32', '{"A":"0","B":"6","C":"8","D":"4"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '32d6454d-696a-4252-9366-4d6160a87c64'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '1ffdc626-4273-4e57-85e2-1855928f3467'::uuid,
        'A', TRUE, 0,
        5, 'numerical_reasoning', 'diagnostic_screener', 3,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Solve for x: 10x + 30 = 100', '{"A":"7","B":"9","C":"12","D":"5"}'::jsonb,
        'A', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '29927462-1352-4d6b-8b27-d095cea1bb8c'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '21ced5d6-173f-469b-8c17-9e4da6b04993'::uuid,
        'A', TRUE, 0,
        2, 'numerical_reasoning', 'diagnostic_screener', 4,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Solve for x: 8x + 18 = 66', '{"A":"6","B":"9","C":"10","D":"3"}'::jsonb,
        'A', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '549782df-edd1-451c-b2b3-ae0683f465ef'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '2223eea8-9c93-4396-9859-9d1819bd97f1'::uuid,
        'D', TRUE, 0,
        4, 'numerical_reasoning', 'diagnostic_screener', 5,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Solve for x: 9x + 25 = 97', '{"A":"5","B":"11","C":"0","D":"8"}'::jsonb,
        'D', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '2318a0c5-aa2b-4847-bba6-79879d5ded3d'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '1b483fbb-e262-4c32-af03-8d67693573e6'::uuid,
        'D', TRUE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 6,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Evaluate: (60 + 89) Ã— 6 âˆ’ 3', '{"A":"854","B":"995","C":"818","D":"891"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'd93f0c86-0fc2-4d8a-ab73-8575ec1e6dcf'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '1bf2d8cf-14ab-4334-bffc-84392410d8f1'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'diagnostic_screener', 7,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Evaluate: (50 + 48) Ã— 6 âˆ’ 2', '{"A":"568","B":"513","C":"586","D":"575"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'da80c1a3-b863-416e-9315-1a4006ee69c1'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '0fb8bf96-4419-47f3-8714-676fc9e12682'::uuid,
        'C', TRUE, 0,
        5, 'data_interpretation', 'diagnostic_screener', 8,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Data table (units): Q1=184, Q2=145, Q3=123, Q4=163. What is the total for the year (Q1+Q2+Q3+Q4)?', '{"A":"579","B":"477","C":"615","D":"692"}'::jsonb,
        'C', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '90970de4-a756-44a0-9987-2edb39018a45'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '3020b398-f051-4071-a4db-b5282afb87f8'::uuid,
        'A', TRUE, 0,
        4, 'data_interpretation', 'adaptive_core', 9,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Data table (units): Q1=124, Q2=157, Q3=113, Q4=80. What is the total for the year (Q1+Q2+Q3+Q4)?', '{"A":"474","B":"519","C":"494","D":"540"}'::jsonb,
        'A', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '7f00cf42-b87f-40c5-8f9b-522283aeb6eb'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '40ee0126-bce3-4f3e-bd8b-bda922eba1b7'::uuid,
        'C', TRUE, 0,
        4, 'logical_reasoning', 'adaptive_core', 10,
        '2026-08-28T15:37:08.048000'::timestamptz, 'For the numbers 16, 22, 39, 45, 53, what is the median?', '{"A":"51","B":"54","C":"39","D":"12"}'::jsonb,
        'C', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '4f3c7324-3a18-4ce5-b054-7f41e40ea46b'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '14c51e9d-0171-445b-aacf-f85a40723570'::uuid,
        'D', TRUE, 0,
        4, 'pattern_recognition', 'adaptive_core', 11,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Squares pattern: 144, 169, 196, 225, ?', '{"A":"312","B":"251","C":"198","D":"256"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '2bda17ce-6811-489e-b496-15d9c5e6ba28'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '5c24a741-c0cd-46b3-a5ea-2a183ee3004c'::uuid,
        'B', TRUE, 0,
        1, 'pattern_recognition', 'adaptive_core', 12,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Squares pattern: 36, 49, 64, 81, ?', '{"A":"84","B":"100","C":"107","D":"108"}'::jsonb,
        'B', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '659400ad-0c0b-4bba-a393-ee5172d5239d'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '0a6e2c03-94d1-4881-8497-7300532e9fb9'::uuid,
        'D', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 13,
        '2026-08-28T15:37:08.048000'::timestamptz, 'If probability of success is 0.24, what is the expected number of successes in 30 trials?', '{"A":"7.5391","B":"6.8571","C":"7.1066","D":"7.2"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '1c5b9492-cf24-4717-968d-776ef2391056'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '5c3c71f0-8f67-4a22-9b3e-56718a4d0898'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 14,
        '2026-08-28T15:37:08.048000'::timestamptz, 'If probability of success is 0.2, what is the expected number of successes in 20 trials?', '{"A":"4.6198","B":"3.922","C":"4.0","D":"4.2968"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '4dd786e2-720d-4b2e-addd-f73fa934b794'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '196980e4-5041-437a-82c0-85414bdec8eb'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 15,
        '2026-08-28T15:37:08.048000'::timestamptz, 'If log_10(1000000) = k, what is k?', '{"A":"18","B":"12","C":"6","D":"4"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '62cc4b89-0cc2-419d-900a-436294e65810'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '089b0340-5ece-45e1-9e99-9806166cb1a3'::uuid,
        'C', TRUE, 0,
        5, 'numerical_reasoning', 'adaptive_core', 16,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the 10th term of an AP with first term 48 and common difference 10.', '{"A":"152","B":"92","C":"138","D":"172"}'::jsonb,
        'C', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '93032b9d-9c84-473e-9f4c-161075332cf0'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '0a5d107b-f724-48e8-9e53-28c73cff01f2'::uuid,
        'B', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 17,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the 9th term of an AP with first term 36 and common difference 8.', '{"A":"101","B":"100","C":"120","D":"82"}'::jsonb,
        'B', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '0ffa5283-1511-4f8c-bac1-210fde47a466'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '1307c2dc-4ce2-4c91-acee-232654b46455'::uuid,
        'A', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 18,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the 8th term of an AP with first term 44 and common difference 10.', '{"A":"114","B":"104","C":"121","D":"112"}'::jsonb,
        'A', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'dd872f0f-85c2-44e1-8028-0ba95bc9fb7f'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '1566a37f-964a-46a6-86a8-5afb46b3308a'::uuid,
        'D', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 19,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the next term: 14, 20, 32, 50, ?', '{"A":"76","B":"56","C":"69","D":"74"}'::jsonb,
        'D', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'f4395de3-7199-407c-8486-b873bc30a8e1'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '1a2d7e85-9218-4933-b546-a9187d241ea1'::uuid,
        'A', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 20,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the next term: 14, 18, 26, 38, ?', '{"A":"54","B":"60","C":"78","D":"43"}'::jsonb,
        'A', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'f4c1671a-6b78-45f8-9f0b-b38364fd484f'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '21023475-e847-4d44-b2fe-67fbd1039639'::uuid,
        'D', TRUE, 0,
        4, 'numerical_reasoning', 'adaptive_core', 21,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the next term in the series: 12, 20, 36, 60, ?', '{"A":"116","B":"80","C":"114","D":"92"}'::jsonb,
        'D', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '9248ab70-d7d4-417f-a052-68c987a4346f'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '226e0b6d-70ab-4794-add5-fc7538a67c41'::uuid,
        'D', TRUE, 0,
        1, 'pattern_recognition', 'adaptive_core', 22,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the next term in the series: 6, 12, 24, 42, ?', '{"A":"42","B":"48","C":"76","D":"66"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'eacc6bd0-4373-4bd2-b340-7b464d2d4688'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '271c685f-ceca-4e90-a966-ccd12ffabe21'::uuid,
        'C', TRUE, 0,
        5, 'pattern_recognition', 'adaptive_core', 23,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find next term: 44, 51, 65, 86, ?', '{"A":"124","B":"132","C":"114","D":"159"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '6ebf01e0-3c4d-4552-947a-526d7d39cf01'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '31579955-806e-4a24-8bd3-cfc7758ae74f'::uuid,
        'B', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 24,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the next term in the series: 12, 18, 30, 48, ?', '{"A":"73","B":"72","C":"83","D":"71"}'::jsonb,
        'B', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'fb9db486-7ad3-453d-b8f2-27754de0a103'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '3cd386ad-1bb3-46fc-af98-0bea4044a337'::uuid,
        'B', FALSE, 0,
        5, 'numerical_reasoning', 'adaptive_core', 25,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the next term: 35, 45, 65, 95, ?', '{"A":"114","B":"145","C":"135","D":"132"}'::jsonb,
        'C', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '1886cae9-b1b0-4127-87eb-fc3f613da058'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '42cac156-9490-41f8-9a1e-f602c3bef5fa'::uuid,
        'D', TRUE, 0,
        5, 'pattern_recognition', 'adaptive_core', 26,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the next term in the series: 20, 30, 50, 80, ?', '{"A":"160","B":"131","C":"138","D":"120"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '025fed2e-dd1d-49bf-ac19-655e92c70d30'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '481895db-c065-46fd-92e1-a6aed13faad0'::uuid,
        'C', TRUE, 0,
        1, 'numerical_reasoning', 'adaptive_core', 27,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the next term in the series: 7, 12, 22, 37, ?', '{"A":"70","B":"45","C":"57","D":"69"}'::jsonb,
        'C', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '05a3ceaa-bc4a-424f-9356-8f26b8c60ddb'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '49d8fba8-10a1-42a1-89fd-65da3341c535'::uuid,
        'C', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 28,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find next term: 19, 23, 31, 43, ?', '{"A":"45","B":"41","C":"59","D":"48"}'::jsonb,
        'C', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'a7ca8fc4-8042-4cd5-ba32-d768fb016b34'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '4b7dd7ae-8b2f-4051-8e8f-cbd2f88f487a'::uuid,
        'C', TRUE, 0,
        1, 'pattern_recognition', 'adaptive_core', 29,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Find the next term: 37, 40, 46, 55, ?', '{"A":"73","B":"45","C":"67","D":"59"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'b98be111-3a7d-4e61-a608-617b9c912c50'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '6b9d7960-c2cb-4e69-8bbd-3f1928b0667b'::uuid,
        'B', TRUE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 30,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Squares pattern: 81, 100, 121, 144, ?', '{"A":"172","B":"169","C":"143","D":"157"}'::jsonb,
        'B', 'Step 1: Identify transformation rules.
 
 Step 2: Apply the rule consistently.
 
 Step 3: Confirm by checking earlier terms.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'b1857f91-7b77-4958-ba4b-72aa6578001d'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '0da21e72-9077-47e6-9dd6-988bc1e48adf'::uuid,
        'C', TRUE, 0,
        1, 'pattern_recognition', 'adaptive_core', 31,
        '2026-08-28T15:37:08.048000'::timestamptz, 'In a 2Ã—2 grid, bottom-right equals sum of other three. If grid is [[21,9],[21,?]], find ?', '{"A":"59","B":"65","C":"51","D":"54"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '72b0cc49-dc8e-475e-8f00-986d727a433d'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '1ce56a05-48cf-4116-abfc-d72d32d72577'::uuid,
        'C', TRUE, 0,
        4, 'pattern_recognition', 'adaptive_core', 32,
        '2026-08-28T15:37:08.048000'::timestamptz, 'In a 2Ã—2 grid, bottom-right equals sum of other three. If grid is [[30,19],[9,?]], find ?', '{"A":"74","B":"72","C":"58","D":"61"}'::jsonb,
        'C', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'ea2395cd-a277-4776-9418-61b9d8fb4ba2'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '2354c56b-4c26-4ec2-93e8-76c055d57a3f'::uuid,
        'D', TRUE, 0,
        2, 'pattern_recognition', 'adaptive_core', 33,
        '2026-08-28T15:37:08.048000'::timestamptz, 'In a 2Ã—2 grid, bottom-right equals sum of other three. If grid is [[32,10],[20,?]], find ?', '{"A":"68","B":"46","C":"56","D":"62"}'::jsonb,
        'D', 'Step 1: Detect the underlying pattern in the sequence/structure.
 
 Step 2: Apply the pattern to the next step.
 
 Step 3: Select the matching numeric option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'dd706cb8-887d-49c7-bd5a-334fb8106b90'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '0d7c36ac-e042-49c6-ab76-d090c046e8e6'::uuid,
        'D', FALSE, 0,
        3, 'logical_reasoning', 'adaptive_core', 34,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Days are coded Mon=1,...,Sun=7. If today has code 6, what will be the code after 81 days?', '{"A":"3","B":"9","C":"1","D":"8"}'::jsonb,
        'A', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '9a02aaed-4ec5-473f-844a-c4dcc290f905'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '20b39805-bf80-40d3-b67f-f2c0a88a146b'::uuid,
        'A', TRUE, 0,
        1, 'logical_reasoning', 'adaptive_core', 35,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Days are coded Mon=1,...,Sun=7. If today has code 2, what will be the code after 37 days?', '{"A":"4","B":"7","C":"3","D":"16"}'::jsonb,
        'A', 'Step 1: Track relationships systematically.
 
 Step 2: Eliminate contradictions.
 
 Step 3: Arrive at the unique numeric conclusion.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'df315fc2-156e-4b18-b4d7-844cbaa081ef'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '005b3803-b53f-43a6-bf42-9502540eb9ae'::uuid,
        'C', TRUE, 0,
        3, 'logical_reasoning', 'adaptive_core', 36,
        '2026-08-28T15:37:08.048000'::timestamptz, 'In a group, |A|=44, |B|=42, and |Aâˆ©B|=18. What is |AâˆªB|?', '{"A":"56","B":"82","C":"68","D":"70"}'::jsonb,
        'C', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '12247e4b-ed5e-45a0-877c-62bb350a12c5'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '286c5cad-a097-455d-b168-e9c7449c4ec2'::uuid,
        'B', TRUE, 0,
        1, 'logical_reasoning', 'adaptive_core', 37,
        '2026-08-28T15:37:08.048000'::timestamptz, 'In a group, |A|=42, |B|=38, and |Aâˆ©B|=26. What is |AâˆªB|?', '{"A":"64","B":"54","C":"66","D":"52"}'::jsonb,
        'B', 'Step 1: Convert the conditions into constraints.
 
 Step 2: Evaluate logically to isolate the required value.
 
 Step 3: Choose the option that satisfies all constraints.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'da36474c-3bdd-409f-9623-32a00b01d5e2'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '0e8e698d-ede3-4644-a889-83d778febdee'::uuid,
        'B', TRUE, 0,
        3, 'data_interpretation', 'adaptive_core', 38,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Category values: X=123, Y=93, Z=147. What is X''s share X/(X+Y+Z)? (round to 4 decimals)', '{"A":"0.6286","B":"0.3388","C":"0.6702","D":"0.4732"}'::jsonb,
        'B', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'f631b2f3-d38f-4923-92ed-65fd7ce25212'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '149ce6cc-9b31-45e4-968a-7c728edd1779'::uuid,
        'C', TRUE, 0,
        2, 'data_interpretation', 'adaptive_core', 39,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Index calculation: base value=144, current value=121. Compute index = (current/base)Ã—100. (round to 2 decimals)', '{"A":"83.6895","B":"84.0619","C":"84.03","D":"84.0971"}'::jsonb,
        'C', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '575f3c8c-9390-49d1-9f36-ec20c2a052fe'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '11a3f4bd-2181-45ae-8006-070b7a89d5c3'::uuid,
        'B', TRUE, 0,
        3, 'data_interpretation', 'adaptive_core', 40,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Quarter values: Q1=152, Q4=129. Compute proportional change (Q4âˆ’Q1)/Q1. (round to 4 decimals)', '{"A":"0.3692","B":"-0.1513","C":"0.1505","D":"-0.0623"}'::jsonb,
        'B', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '3c32d4d1-1c88-4a6d-b60e-14112f401de5'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '1cc561a1-33ea-4a9a-8b20-52b57db34825'::uuid,
        'D', TRUE, 0,
        1, 'data_interpretation', 'adaptive_core', 41,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Category values: X=137, Y=90, Z=128. What is X''s share X/(X+Y+Z)? (round to 4 decimals)', '{"A":"0.4362","B":"0.122","C":"0.6884","D":"0.3859"}'::jsonb,
        'D', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'ca8ad802-1c21-44d6-9f77-d34b7e46bfdc'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '1cc9ca64-657a-4fb5-a6b2-185116412d42'::uuid,
        'B', FALSE, 0,
        2, 'numerical_reasoning', 'adaptive_core', 42,
        '2026-08-28T15:37:08.048000'::timestamptz, 'A dataset has mean 37 and standard deviation 11. Compute coefficient of variation (sd/mean). (round to 4 decimals)', '{"A":"0.4249","B":"0.2139","C":"0.43","D":"0.2973"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '9a2bd42d-c3e3-492d-ab08-a6d1a113c6ed'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '38872fc2-3ab0-4711-a6fd-025c96f47cca'::uuid,
        'B', TRUE, 0,
        4, 'numerical_reasoning', 'adaptive_core', 43,
        '2026-08-28T15:37:08.048000'::timestamptz, 'If probability of success is 0.39, what is the expected number of successes in 12 trials?', '{"A":"4.2409","B":"4.68","C":"4.804","D":"4.2373"}'::jsonb,
        'B', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '4d1e72d8-fd71-4bd7-86d8-eb42ffd6fe1e'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '491d6e9b-4c2d-4912-92de-6fb2ee4a1e1c'::uuid,
        'C', TRUE, 0,
        3, 'numerical_reasoning', 'adaptive_core', 44,
        '2026-08-28T15:37:08.048000'::timestamptz, 'If probability of success is 0.31, what is the expected number of successes in 25 trials?', '{"A":"8.0779","B":"7.6358","C":"7.75","D":"7.9281"}'::jsonb,
        'C', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '9166d0a3-0a4d-4410-b640-c01a3beb8305'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '3738d88c-3e30-483c-8c32-d2ed7f384d01'::uuid,
        'D', TRUE, 0,
        3, 'numerical_reasoning', 'stability_confirmation', 45,
        '2026-08-28T15:37:08.048000'::timestamptz, 'How many ways to choose 2 items from 12 distinct items?', '{"A":"48","B":"74","C":"54","D":"66"}'::jsonb,
        'D', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'cea17a60-89e6-4336-b17b-d470988979cd'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '64889be1-ba54-4909-adca-1c48d64413ad'::uuid,
        'A', TRUE, 0,
        1, 'numerical_reasoning', 'stability_confirmation', 46,
        '2026-08-28T15:37:08.048000'::timestamptz, 'In a GP with first term 4 and ratio 3, what is the 5th term?', '{"A":"324","B":"347","C":"326","D":"313"}'::jsonb,
        'A', 'Step 1: Translate the statement into an equation/expression.
 
 Step 2: Solve systematically.
 
 Step 3: Verify and select the correct value.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'a699414d-3132-4ed5-b47d-4fd25966b108'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '3a2a6833-8c83-493d-af58-76d08222ef64'::uuid,
        'A', TRUE, 0,
        1, 'numerical_reasoning', 'stability_confirmation', 47,
        '2026-08-28T15:37:08.048000'::timestamptz, 'If log_5(125) = k, what is k?', '{"A":"3","B":"4","C":"2","D":"1"}'::jsonb,
        'A', 'Step 1: Identify the quantitative relationship.
 
 Step 2: Apply the appropriate formula.
 
 Step 3: Compute the numeric result and match the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'd410b549-da1c-409b-aa58-016ff58f7973'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '4238c753-3041-4d96-a05c-69134fa6a173'::uuid,
        'C', TRUE, 0,
        3, 'data_interpretation', 'stability_confirmation', 48,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Data table (units): Q1=115, Q2=158, Q3=90, Q4=137. What is the total for the year (Q1+Q2+Q3+Q4)?', '{"A":"518","B":"476","C":"500","D":"462"}'::jsonb,
        'C', 'Step 1: Identify relevant numbers from the table.
 
 Step 2: Apply the calculation (sum/ratio/change).
 
 Step 3: Match the computed value with the option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        '6e8c798a-9b67-4561-87ff-96f602fd63db'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '3e179b76-3625-42fc-94fb-2aaad9468e2d'::uuid,
        'C', TRUE, 0,
        3, 'data_interpretation', 'stability_confirmation', 49,
        '2026-08-28T15:37:08.048000'::timestamptz, 'Quarter values: Q1=110, Q4=145. Compute proportional change (Q4âˆ’Q1)/Q1. (round to 4 decimals)', '{"A":"0.5565","B":"0.2164","C":"0.3182","D":"0.5771"}'::jsonb,
        'C', 'Step 1: Read the given data carefully.
 
 Step 2: Perform the required aggregation/comparison.
 
 Step 3: Compute the value and select the correct option.'
    );
    INSERT INTO public.adaptive_aptitude_responses (
        id, session_id, question_id, selected_answer, is_correct, response_time_ms, difficulty_at_time,
        subtag, phase, sequence_number, answered_at, question_text, question_options, correct_answer, explanation
    ) VALUES (
        'dbcf38de-c3fd-420f-b740-c8aa07c24413'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, '4738c491-a453-4d28-bcd0-ecd09de08e31'::uuid,
        'B', TRUE, 0,
        2, 'logical_reasoning', 'stability_confirmation', 50,
        '2026-08-28T15:37:08.048000'::timestamptz, 'For the numbers 15, 22, 29, 34, 53, what is the median?', '{"A":"15","B":"29","C":"28","D":"13"}'::jsonb,
        'B', 'Step 1: Track relationships systematically.
 
 Step 2: Eliminate contradictions.
 
 Step 3: Arrive at the unique numeric conclusion.'
    );

    INSERT INTO public.adaptive_aptitude_results (
        id, session_id, learner_id, aptitude_level, confidence_tag, tier, total_questions, total_correct,
        overall_accuracy, accuracy_by_difficulty, accuracy_by_subtag, difficulty_path, path_classification,
        average_response_time_ms, grade_level, completed_at, created_at, metadata
    ) VALUES (
        '4d500220-ac07-4f23-b213-611675b95223'::uuid, 'dbd26062-dace-433b-bfa9-6d6b5d247a35'::uuid, v_learner_id, 5,
        'high', 'H', 50, 47,
        94.0, '{"1":{"total":18,"correct":18,"accuracy":100.0},"5":{"total":6,"correct":5,"accuracy":83.33333333333334},"2":{"total":11,"correct":10,"accuracy":90.9090909090909},"4":{"total":7,"correct":7,"accuracy":100.0},"3":{"total":8,"correct":7,"accuracy":87.5}}'::jsonb, '{"numerical_reasoning":{"total":27,"correct":25,"accuracy":92.5925925925926},"data_interpretation":{"total":8,"correct":8,"accuracy":100.0},"logical_reasoning":{"total":6,"correct":5,"accuracy":83.33333333333334},"pattern_recognition":{"total":9,"correct":9,"accuracy":100.0}}'::jsonb, ARRAY[1,1,5,2,4,1,1,5,4,4,4,1,2,1,1,5,1,2,2,2,4,1,5,1,5,5,1,2,1,2,1,4,2,3,1,3,1,3,2,3,1,2,4,3,3,1,1,3,3,2]::smallint[],
        'stable', 0, 'postgraduate', '2026-08-28T15:37:08.048000'::timestamptz, '2026-08-28T15:37:08.048000'::timestamptz, '{"duplicateValidation":{"isValid":true,"duplicates":[]},"migrationSource":"google_forms","responseTimeUnavailable":true}'::jsonb
    );
END $$;

COMMIT;
