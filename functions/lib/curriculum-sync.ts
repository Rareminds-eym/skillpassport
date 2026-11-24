import type { SupabaseClient } from '@supabase/supabase-js';

export async function syncApprovedCurriculumChanges(db: SupabaseClient, curriculumId: string) {
  if (!curriculumId) return;
  try {
    const { data: curr } = await db
      .from('college_curriculums')
      .select('id, change_history')
      .eq('id', curriculumId)
      .maybeSingle();

    if (!curr) return;
    let history = curr.change_history;
    if (typeof history === 'string') {
      try { history = JSON.parse(history); } catch { history = []; }
    }
    if (!Array.isArray(history) || history.length === 0) return;

    const { data: existingUnits } = await db
      .from('college_curriculum_units')
      .select('id, name, code, order_index')
      .eq('curriculum_id', curriculumId);

    const unitMap = new Map((existingUnits || []).map((u: any) => [(u.name || '').trim().toLowerCase(), u]));
    let maxOrder = (existingUnits || []).reduce((max: number, u: any) => Math.max(max, u.order_index || 0), 0);

    for (const h of history) {
      if (h.status !== 'approved' && h.action !== 'change_approved') continue;
      const changeType = h.change_type || h.original_change?.change_type;
      const orig = h.original_change || h;
      const proposed = orig.data?.after || orig.data?.proposed || orig.data?.changes || orig.data || {};

      if (changeType === 'unit_add') {
        const name = (proposed.name || proposed.title || '').trim();
        if (!name) continue;
        if (!unitMap.has(name.toLowerCase())) {
          maxOrder += 1;
          const code = proposed.code || `U${maxOrder}`;
          const { data: insertedUnit, error: insertErr } = await db
            .from('college_curriculum_units')
            .insert([{
              curriculum_id: curriculumId,
              name,
              code,
              description: proposed.description || '',
              credits: proposed.credits ? Number(proposed.credits) : null,
              estimated_duration: proposed.estimated_duration ? Number(proposed.estimated_duration) : null,
              duration_unit: proposed.duration_unit || null,
              order_index: maxOrder,
            }])
            .select()
            .single();

          if (!insertErr && insertedUnit) {
            unitMap.set(name.toLowerCase(), insertedUnit);
            const rawOutcomes = proposed.outcomes || proposed.learning_outcomes || [];
            if (Array.isArray(rawOutcomes) && rawOutcomes.length > 0) {
              const outcomeRows = rawOutcomes.map((oc: any) => ({
                curriculum_id: curriculumId,
                unit_id: insertedUnit.id,
                outcome_text: typeof oc === 'string' ? oc : oc.text || oc.outcome_text || '',
                bloom_level: typeof oc === 'object' ? oc.bloomLevel || oc.bloom_level || null : null,
                assessment_mappings: typeof oc === 'object' ? oc.assessments || oc.assessment_mappings || [] : [],
              })).filter((oc: any) => oc.outcome_text && oc.outcome_text.trim());

              if (outcomeRows.length) {
                await db.from('college_curriculum_outcomes').insert(outcomeRows);
              }
            }
          }
        }
      } else if (changeType === 'outcome_add') {
        const text = (proposed.outcome_text || proposed.text || '').trim();
        const unitId = orig.entity_id || proposed.unit_id || proposed.unitId;
        if (text && unitId) {
          const { data: existingOutcome } = await db
            .from('college_curriculum_outcomes')
            .select('id')
            .eq('curriculum_id', curriculumId)
            .eq('unit_id', unitId)
            .eq('outcome_text', text)
            .maybeSingle();

          if (!existingOutcome) {
            await db.from('college_curriculum_outcomes').insert([{
              curriculum_id: curriculumId,
              unit_id: unitId,
              outcome_text: text,
              bloom_level: proposed.bloom_level || proposed.bloomLevel || null,
              assessment_mappings: proposed.assessment_mappings || proposed.assessments || [],
            }]);
          }
        }
      } else if (changeType === 'unit_edit') {
        const entityId = orig.entity_id || h.entity_id;
        if (entityId && (proposed.name || proposed.description)) {
          await db
            .from('college_curriculum_units')
            .update({
              ...(proposed.name ? { name: proposed.name } : {}),
              ...(proposed.description !== undefined ? { description: proposed.description } : {}),
            })
            .eq('id', entityId);
        }
      } else if (changeType === 'outcome_edit') {
        const entityId = orig.entity_id || h.entity_id;
        const outcomeText = proposed.outcome_text || proposed.text;
        if (entityId && outcomeText) {
          await db
            .from('college_curriculum_outcomes')
            .update({ outcome_text: outcomeText })
            .eq('id', entityId);
        }
      }
    }
  } catch (err) {
    console.error('Error syncing approved curriculum changes:', err);
  }
}
