/**
 * Generate Strengths & Growth Plan Handler
 *
 * Generates personalized "Your Strengths & Growth Plan" using AI
 * Based on: role capabilities + learner assessment results
 */

import { getServiceClient } from '../../../lib/supabase';
import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../shared/ai-config';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export async function generateStrengthsGrowthPlanHandler(context: AuthenticatedContext) {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const requestData = await context.request.json() as any;
    const { roleName, learnerProfile } = requestData;

    if (!roleName || !learnerProfile) {
      return Response.json(
        { error: 'roleName and learnerProfile are required' },
        { status: 400 }
      );
    }

    const { openRouter } = getAPIKeys(env);

    // Get role's required capabilities. Multi-domain roles have one occupation
    // row per domain (same name), so fetch all ids — .single() would throw.
    // role_capability_sequence links directly to occupations (the role_domains
    // table no longer exists), and RIASEC context lives on the sequence row.
    const { data: occupations } = await supabase
      .from('occupations')
      .select('id')
      .eq('name', roleName);

    if (!occupations || occupations.length === 0) {
      return Response.json({ error: 'Role not found' }, { status: 404 });
    }

    const occupationIds = occupations.map((o: any) => o.id);

    const { data: capabilitySequence } = await supabase
      .from('role_capability_sequence')
      .select(`
        sequence_step,
        capability_priority,
        required_level,
        primary_riasec_context,
        secondary_riasec_context,
        capability_master(id, name, description)
      `)
      .in('occupation_id', occupationIds)
      .order('sequence_step', { ascending: true })
      .limit(6);

    if (!capabilitySequence || capabilitySequence.length === 0) {
      return Response.json({ error: 'No capabilities found for role' }, { status: 404 });
    }

    const capabilities = capabilitySequence.map((item: any) => ({
      name: item.capability_master?.name,
      description: item.capability_master?.description,
      priority: item.capability_priority,
      level: item.required_level,
      primaryRiasec: item.primary_riasec_context,
      secondaryRiasec: item.secondary_riasec_context
    }));

    // Check if already generated (stored in gemini_results)
    const assessmentResultId = requestData.assessmentResultId;
    console.log('[Strengths-Growth-Plan] Starting... assessmentResultId:', assessmentResultId, 'roleName:', roleName);

    if (assessmentResultId) {
      // Fetch current gemini_results from DB
      const { data: existing, error: fetchError } = await supabase
        .from('personal_assessment_results')
        .select('gemini_results')
        .eq('id', assessmentResultId)
        .maybeSingle();

      if (fetchError) {
        console.log('[Strengths-Growth-Plan] ⚠️  Fetch error:', fetchError.message);
      } else {
        console.log('[Strengths-Growth-Plan] 📊 Fetched data:', {
          hasGeminiResults: !!existing?.gemini_results,
          geminiResultsKeys: Object.keys(existing?.gemini_results || {})
        });
      }

      // Check if cached for this specific role
      const cachedForRole = existing?.gemini_results?.strengthsGrowthPlan?.[roleName];
      if (cachedForRole) {
        console.log('[Strengths-Growth-Plan] ✅ USING CACHED DATA for role:', roleName);
        return Response.json({
          strengths: cachedForRole.strengths || [],
          growthAreas: cachedForRole.growthAreas || [],
          immediateActions: cachedForRole.immediateActions || [],
          timeline: cachedForRole.timeline || [],
          cached: true
        }, { status: 200 });
      }
    }

    // AI Prompt - BEGINNER-FRIENDLY, SUPER SIMPLE
    const learnerRiasec = learnerProfile.riasec || {};
    const capabilityNames = capabilities.map((c: any) => c.name);

    const prompt = `You help students understand what they need to learn for "${roleName}".
Write in VERY SIMPLE language - like explaining to a 12 year old.
NO technical jargon. NO complex words.

**Skills they need to learn:**
${capabilityNames.map((name: string) => `- ${name}`).join('\n')}

RULES:
1. Use SIMPLE words only (no technical terms)
2. Each item = 1 short sentence (under 15 words)
3. Strengths = what they're already good at
4. Growth areas = what they need to learn
5. Actions = simple things to do this week
6. Timeline = when to learn each skill

Example GOOD answers:
- "You are good at solving problems" (simple!)
- "Learn how to clean data" (simple!)
- "Read a tutorial online" (simple!)

Example BAD answers (don't do this):
- "Evaluate statistical experiments" (too technical)
- "Construct leakage-safe predictive feature datasets" (too technical)

Generate JSON ONLY:
{
  "strengths": [
    {"title": "Simple skill they know", "reason": "why in simple words"}
  ],
  "growthAreas": [
    {"title": "Simple skill to learn", "reason": "why in simple words"}
  ],
  "immediateActions": [
    {"title": "simple action 1"},
    {"title": "simple action 2"},
    {"title": "simple action 3"}
  ],
  "timeline": [
    {"month": "Month 1-2", "capability": "First simple skill"},
    {"month": "Month 3-4", "capability": "Second simple skill"},
    {"month": "Month 5-6", "capability": "Third simple skill"}
  ]
}`;

    // Call OpenRouter with 4o-mini
    const aiResponse = await callOpenRouterWithRetry(openRouter, [
      { role: 'user', content: prompt }
    ], {
      models: ['openai/gpt-4o-mini'],
      maxTokens: 1024,
      temperature: 0.7
    });

    // Parse JSON response
    const result = repairAndParseJSON(aiResponse, true);

    // Store in gemini_results for future use
    if (assessmentResultId) {
      console.log('[Strengths-Growth-Plan] 💾 Storing cache for role:', roleName);

      const { data: current, error: fetchError } = await supabase
        .from('personal_assessment_results')
        .select('gemini_results')
        .eq('id', assessmentResultId)
        .maybeSingle();

      if (fetchError) {
        console.error('[Strengths-Growth-Plan] ❌ Failed to fetch current record:', fetchError.message);
      } else {
        console.log('[Strengths-Growth-Plan] ✓ Fetched current record for update');
      }

      const updatedGeminiResults = {
        ...(current?.gemini_results || {}),
        strengthsGrowthPlan: {
          ...(current?.gemini_results?.strengthsGrowthPlan || {}),
          [roleName]: {
            strengths: result.strengths || [],
            growthAreas: result.growthAreas || [],
            immediateActions: result.immediateActions || [],
            timeline: result.timeline || []
          }
        }
      };

      console.log('[Strengths-Growth-Plan] 📦 Data to store:', {
        assessmentId: assessmentResultId,
        roleName,
        dataStructure: JSON.stringify(updatedGeminiResults).substring(0, 100)
      });

      const { error: updateError, data: updateData } = await supabase
        .from('personal_assessment_results')
        .update({ gemini_results: updatedGeminiResults })
        .eq('id', assessmentResultId)
        .select();

      if (updateError) {
        console.error('[Strengths-Growth-Plan] ❌ Failed to store in DB:', updateError.message);
        console.error('[Strengths-Growth-Plan] Error details:', updateError);
      } else {
        console.log('[Strengths-Growth-Plan] Updated record count:', updateData?.length);

        // If no rows updated, the record doesn't exist - INSERT it instead
        if (!updateData || updateData.length === 0) {
          console.log('[Strengths-Growth-Plan] ⚠️  No rows updated, attempting INSERT instead');

          const { error: insertError, data: insertData } = await supabase
            .from('personal_assessment_results')
            .insert({
              id: assessmentResultId,
              gemini_results: updatedGeminiResults
            })
            .select();

          if (insertError) {
            console.error('[Strengths-Growth-Plan] ❌ Failed to INSERT in DB:', insertError.message);
          } else {
            console.log('[Strengths-Growth-Plan] ✅ Successfully INSERTED cache in DB');
          }
        } else {
          console.log('[Strengths-Growth-Plan] ✅ Successfully updated cache in DB');
        }
      }
    } else {
      console.log('[Strengths-Growth-Plan] ⚠️  No assessmentResultId provided, cache not stored');
    }

    return Response.json({
      strengths: result.strengths || [],
      growthAreas: result.growthAreas || [],
      immediateActions: result.immediateActions || [],
      timeline: result.timeline || [],
      cached: false
    }, { status: 200 });
  } catch (error) {
    console.error('Generate strengths & growth plan error:', error);
    return Response.json(
      { error: 'Failed to generate plan', details: (error as any).message },
      { status: 500 }
    );
  }
}
