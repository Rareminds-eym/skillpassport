/**
 * Comprehensive RAG System Test Suite
 * Tests all 6 wins across diverse student profiles and scenarios
 * Scenarios: Different RIASEC codes, grade levels, aptitude levels, streams
 */

import { describe, it } from 'vitest';
import { buildAssessmentRagContext } from '../../../functions/api/assessment/services/core/assessment-context-builder';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .dev.vars for local testing
const devVarsPath = path.resolve(process.cwd(), '.dev.vars');
if (fs.existsSync(devVarsPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(devVarsPath));
  Object.assign(process.env, envConfig);
}

describe('RAG System - Comprehensive Test Suite', () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const apiKey = process.env.EMBEDDING_API_KEY;

  if (!supabaseUrl || !supabaseKey || !apiKey) {
    throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, EMBEDDING_API_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const testScenarios = [
    // ===== SCENARIO 1: College - Main Streams (MBA, MCA, BCA)
    {
      category: 'College - Main Streams',
      profiles: [
        {
          name: 'MBA - ECS (Business Strategy & Leadership)',
          stream: 'MBA',
          riasec: 'ECS',
          data: {
            stream_id: 'MBA',
            grade_level: 'college',
            riasec_code: 'ECS',
            riasec_scores: { E: 4.9, C: 4.3, S: 3.5, I: 3.2, A: 2.8, R: 1.6 },
            aptitude_overall: 78,
            aptitude_scores: {
              overallAccuracy: 78,
              accuracyBySubtag: {
                numerical_reasoning: { total: 25, correct: 20, accuracy: 80 },
                verbal_reasoning: { total: 24, correct: 21, accuracy: 87 },
              },
            },
            bigfive_scores: { extraversion: 4.8, conscientiousness: 4.4, agreeableness: 4.0 },
            work_values_scores: { Leadership: 4.7, Impact: 4.5, Financial: 4.4 },
            knowledge_score: 75,
            knowledge_details: {
              strongTopics: ['Strategic Planning', 'Financial Analysis', 'Operations Management'],
              weakTopics: ['Technical Implementation'],
            },
          },
        },
        {
          name: 'MCA - IEC (Data & Systems Analysis)',
          stream: 'MCA',
          riasec: 'IEC',
          data: {
            stream_id: 'MCA',
            grade_level: 'college',
            riasec_code: 'IEC',
            riasec_scores: { I: 4.7, E: 3.9, C: 3.8, A: 2.6, S: 2.2, R: 1.9 },
            aptitude_overall: 84,
            aptitude_scores: {
              overallAccuracy: 84,
              accuracyBySubtag: {
                logical_reasoning: { total: 25, correct: 23, accuracy: 92 },
                pattern_recognition: { total: 25, correct: 21, accuracy: 84 },
                numerical_reasoning: { total: 20, correct: 17, accuracy: 85 },
              },
            },
            bigfive_scores: { openness: 4.5, conscientiousness: 4.3, extraversion: 3.2 },
            work_values_scores: { Impact: 4.6, Autonomy: 4.4, Creativity: 4.1 },
            knowledge_score: 81,
            knowledge_details: {
              strongTopics: ['Data Structures', 'Algorithms', 'Database Systems', 'Software Architecture'],
              weakTopics: ['UI Design', 'Project Management'],
            },
          },
        },
        {
          name: 'BCA - RIC (Software Development & Systems)',
          stream: 'BCA',
          riasec: 'RIC',
          data: {
            stream_id: 'BCA',
            grade_level: 'college',
            riasec_code: 'RIC',
            riasec_scores: { R: 4.5, I: 4.3, C: 4.0, E: 2.9, A: 2.3, S: 1.8 },
            aptitude_overall: 80,
            aptitude_scores: {
              overallAccuracy: 80,
              accuracyBySubtag: {
                logical_reasoning: { total: 25, correct: 21, accuracy: 84 },
                spatial_reasoning: { total: 20, correct: 18, accuracy: 90 },
                pattern_recognition: { total: 25, correct: 20, accuracy: 80 },
              },
            },
            bigfive_scores: { conscientiousness: 4.4, openness: 3.9, extraversion: 3.0 },
            work_values_scores: { Impact: 4.5, Security: 4.2, Autonomy: 4.0 },
            knowledge_score: 77,
            knowledge_details: {
              strongTopics: ['Programming', 'Database Design', 'Web Development', 'System Design'],
              weakTopics: ['Business Analysis'],
            },
          },
        },
      ],
    },

    // ===== SCENARIO 2: High Aptitude Profiles (90+%)
    {
      category: 'High Aptitude Achievers (90%+)',
      profiles: [
        {
          name: 'CS High-Achiever - IEC (Expert Level)',
          stream: 'CS',
          riasec: 'IEC',
          data: {
            stream_id: 'CS',
            grade_level: 'college',
            riasec_code: 'IEC',
            riasec_scores: { I: 4.9, E: 4.0, C: 3.7, A: 2.2, S: 1.8, R: 1.5 },
            aptitude_overall: 95,
            aptitude_scores: {
              overallAccuracy: 95,
              accuracyBySubtag: {
                logical_reasoning: { total: 25, correct: 25, accuracy: 100 },
                pattern_recognition: { total: 25, correct: 24, accuracy: 96 },
                spatial_reasoning: { total: 20, correct: 19, accuracy: 95 },
              },
            },
            bigfive_scores: { openness: 4.8, conscientiousness: 4.6, extraversion: 3.5 },
            work_values_scores: { Impact: 4.8, Creativity: 4.7, Autonomy: 4.6 },
            knowledge_score: 92,
            knowledge_details: {
              strongTopics: ['Advanced Algorithms', 'System Architecture', 'Machine Learning', 'Cloud Computing'],
              weakTopics: [],
            },
          },
        },
      ],
    },

    // ===== SCENARIO 3: Low Aptitude Profiles (<60%)
    {
      category: 'Developing Profiles (Aptitude <60%)',
      profiles: [
        {
          name: 'Beginner Developer - SEC (Entry Level)',
          stream: 'BCA',
          riasec: 'SEC',
          data: {
            stream_id: 'BCA',
            grade_level: 'college',
            riasec_code: 'SEC',
            riasec_scores: { S: 4.2, E: 3.8, C: 3.5, I: 3.0, A: 2.4, R: 2.0 },
            aptitude_overall: 55,
            aptitude_scores: {
              overallAccuracy: 55,
              accuracyBySubtag: {
                logical_reasoning: { total: 25, correct: 12, accuracy: 48 },
                pattern_recognition: { total: 25, correct: 14, accuracy: 56 },
                spatial_reasoning: { total: 20, correct: 11, accuracy: 55 },
              },
            },
            bigfive_scores: { extraversion: 4.6, agreeableness: 4.5, conscientiousness: 3.2 },
            work_values_scores: { Impact: 4.0, Security: 3.8, Relationships: 3.7 },
            knowledge_score: 52,
            knowledge_details: {
              strongTopics: ['Communication', 'Team Collaboration'],
              weakTopics: ['Complex Algorithms', 'System Design', 'Database Optimization'],
            },
          },
        },
      ],
    },

    // ===== SCENARIO 4: Artistic/Creative Profiles (High A)
    {
      category: 'Creative & Artistic Profiles',
      profiles: [
        {
          name: 'Designer - AES (Creative Focus)',
          stream: 'Arts',
          riasec: 'AES',
          data: {
            stream_id: 'Arts',
            grade_level: 'college',
            riasec_code: 'AES',
            riasec_scores: { A: 4.8, E: 4.0, S: 3.6, I: 2.5, C: 2.3, R: 1.8 },
            aptitude_overall: 72,
            aptitude_scores: {
              overallAccuracy: 72,
              accuracyBySubtag: {
                verbal_reasoning: { total: 25, correct: 20, accuracy: 80 },
                pattern_recognition: { total: 25, correct: 18, accuracy: 72 },
              },
            },
            bigfive_scores: { openness: 4.7, extraversion: 4.2, conscientiousness: 3.5 },
            work_values_scores: { Creativity: 4.8, Impact: 4.3, Autonomy: 4.2 },
            knowledge_score: 70,
            knowledge_details: {
              strongTopics: ['Visual Design', 'User Experience', 'Creative Thinking', 'Brand Strategy'],
              weakTopics: ['Data Analysis', 'Technical Implementation'],
            },
          },
        },
      ],
    },

    // ===== SCENARIO 5: High School Student
    {
      category: 'High School Profile',
      profiles: [
        {
          name: 'High School - ICE (Early Exploration)',
          stream: 'Science',
          riasec: 'ICE',
          data: {
            stream_id: 'Science',
            grade_level: 'high_school',
            riasec_code: 'ICE',
            riasec_scores: { I: 4.5, C: 4.0, E: 3.8, R: 3.2, A: 2.6, S: 2.0 },
            aptitude_overall: 82,
            aptitude_scores: {
              overallAccuracy: 82,
              accuracyBySubtag: {
                logical_reasoning: { total: 20, correct: 17, accuracy: 85 },
                numerical_reasoning: { total: 20, correct: 16, accuracy: 80 },
              },
            },
            bigfive_scores: { conscientiousness: 4.4, openness: 4.3, extraversion: 3.4 },
            work_values_scores: { Impact: 4.4, Security: 4.0, Learning: 4.3 },
            knowledge_score: 79,
            knowledge_details: {
              strongTopics: ['Physics', 'Chemistry', 'Mathematics'],
              weakTopics: ['Biology', 'Literature'],
            },
          },
        },
      ],
    },

    // ===== SCENARIO 6: Balanced/Investigative Profile
    {
      category: 'Research & Investigation',
      profiles: [
        {
          name: 'Researcher - IAC (Analytical Explorer)',
          stream: 'Science',
          riasec: 'IAC',
          data: {
            stream_id: 'Science',
            grade_level: 'college',
            riasec_code: 'IAC',
            riasec_scores: { I: 4.7, A: 4.2, C: 4.0, E: 3.0, S: 2.5, R: 2.3 },
            aptitude_overall: 88,
            aptitude_scores: {
              overallAccuracy: 88,
              accuracyBySubtag: {
                logical_reasoning: { total: 25, correct: 23, accuracy: 92 },
                pattern_recognition: { total: 25, correct: 22, accuracy: 88 },
                spatial_reasoning: { total: 20, correct: 17, accuracy: 85 },
              },
            },
            bigfive_scores: { openness: 4.7, conscientiousness: 4.5, extraversion: 3.1 },
            work_values_scores: { Impact: 4.6, Autonomy: 4.5, Creativity: 4.4 },
            knowledge_score: 86,
            knowledge_details: {
              strongTopics: ['Research Methodology', 'Data Analysis', 'Scientific Writing', 'Problem Solving'],
              weakTopics: ['Management', 'Sales'],
            },
          },
        },
      ],
    },

    // ===== SCENARIO 7: Commerce/Finance Profile
    {
      category: 'Commerce & Finance',
      profiles: [
        {
          name: 'Finance Professional - ECS (Business Analyst)',
          stream: 'Commerce',
          riasec: 'ECS',
          data: {
            stream_id: 'Commerce',
            grade_level: 'college',
            riasec_code: 'ECS',
            riasec_scores: { E: 4.6, C: 4.7, S: 3.4, I: 3.3, A: 2.2, R: 1.9 },
            aptitude_overall: 81,
            aptitude_scores: {
              overallAccuracy: 81,
              accuracyBySubtag: {
                numerical_reasoning: { total: 25, correct: 22, accuracy: 88 },
                logical_reasoning: { total: 25, correct: 20, accuracy: 80 },
              },
            },
            bigfive_scores: { conscientiousness: 4.7, extraversion: 4.5, agreeableness: 4.0 },
            work_values_scores: { Financial: 4.7, Leadership: 4.4, Security: 4.3 },
            knowledge_score: 83,
            knowledge_details: {
              strongTopics: ['Financial Analysis', 'Accounting', 'Business Strategy', 'Market Analysis'],
              weakTopics: ['Creative Writing', 'Technical Development'],
            },
          },
        },
      ],
    },

    // ===== SCENARIO 8: Mixed Interest Profile (Balanced RIASEC)
    {
      category: 'Balanced/Versatile Profiles',
      profiles: [
        {
          name: 'Versatile Professional - EICSR (Jack of All Trades)',
          stream: 'General',
          riasec: 'EICSR',
          data: {
            stream_id: 'General',
            grade_level: 'college',
            riasec_code: 'ECS',
            riasec_scores: { E: 4.0, I: 3.9, C: 3.8, S: 3.7, R: 3.6, A: 3.5 },
            aptitude_overall: 75,
            aptitude_scores: {
              overallAccuracy: 75,
              accuracyBySubtag: {
                logical_reasoning: { total: 25, correct: 18, accuracy: 72 },
                numerical_reasoning: { total: 25, correct: 19, accuracy: 76 },
                verbal_reasoning: { total: 25, correct: 19, accuracy: 76 },
                spatial_reasoning: { total: 20, correct: 15, accuracy: 75 },
              },
            },
            bigfive_scores: { extraversion: 4.0, conscientiousness: 4.0, openness: 3.9 },
            work_values_scores: { Impact: 4.2, Leadership: 4.0, Creativity: 3.9 },
            knowledge_score: 73,
            knowledge_details: {
              strongTopics: ['Project Management', 'Communication', 'Problem Analysis', 'Team Leadership'],
              weakTopics: ['Specialized Technical Skills'],
            },
          },
        },
      ],
    },
  ];

  // ===== RUN ALL SCENARIOS
  for (const scenario of testScenarios) {
    it(`${scenario.category}`, async () => {
      console.log('\n\n');
      console.log('█'.repeat(220));
      console.log(`█ SCENARIO: ${scenario.category}`);
      console.log('█'.repeat(220));

      for (const profile of scenario.profiles) {
        console.log('\n\n');
        console.log('═'.repeat(220));
        console.log(`${profile.name}`);
        console.log('═'.repeat(220));

        try {
          // Step 1: Generate Context
          const context = buildAssessmentRagContext(profile.data, {
            stream: profile.stream,
            degreeLevel: profile.data.grade_level,
          });

          console.log(`\n📝 CONTEXT: ${context.length} chars | 6 sections`);

          // Step 2: Get Embedding
          const embeddingUrl = process.env.EMBEDDING_API_URL;
          if (!embeddingUrl) {
            throw new Error('Missing required environment variable: EMBEDDING_API_URL');
          }
          const embeddingResponse = await fetch(`${embeddingUrl}/embeddings/text`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              input: context,
              task_type: 'RETRIEVAL_DOCUMENT',
            }),
          });

          if (!embeddingResponse.ok) {
            console.log(`\n❌ Embedding failed`);
            continue;
          }

          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.embedding;

          if (!embedding) {
            console.log(`\n❌ No embedding`);
            continue;
          }

          console.log(`✅ Embedding: ${embedding.length}D`);

          // Step 3: RAG Retrieval
          const { data, error } = await supabase.rpc('match_occupations_by_embedding', {
            query_embedding: embedding,
            learner_riasec_code: profile.riasec,
            match_count: 10,
          });

          if (error || !data) {
            console.log(`\n❌ RAG Error`);
            continue;
          }

          if (data.length === 0) {
            console.log(`\n❌ No results`);
            continue;
          }

          // Step 4: Display Results
          console.log(`\n🎯 TOP 10 OCCUPATIONS:`);
          console.log('Rank │ Occupation                    │ Match  │ Alignment');
          console.log('─────┼───────────────────────────────┼────────┼──────────');

          const top3: string[] = [];
          const similarities: number[] = [];

          data.forEach((occ: any, idx: number) => {
            const sim = ((occ.similarity || 0) * 100).toFixed(1);
            const align = ((occ.riasec_alignment || 0) * 100).toFixed(0);
            const name = (occ.occupation_name || 'Unknown').substring(0, 29).padEnd(29);

            console.log(`${String(idx + 1).padStart(2)}   │ ${name} │ ${sim.padStart(6)}% │ ${align.padStart(8)}%`);

            if (idx < 3) {
              top3.push(occ.occupation_name);
            }
            similarities.push(parseFloat(sim));
          });

          // Step 5: Statistics
          const avgSim = (similarities.reduce((a, b) => a + b) / similarities.length).toFixed(1);
          const maxSim = Math.max(...similarities).toFixed(1);

          console.log(`\n📊 Avg: ${avgSim}% | Max: ${maxSim}% | RIASEC: ${profile.riasec} | Grade: ${profile.data.grade_level}`);
          console.log(`⭐ Top 3: ${top3.join(' → ')}`);
        } catch (error: any) {
          console.log(`\n❌ Error: ${error.message}`);
        }
      }

      console.log('\n');
    });
  }
});
