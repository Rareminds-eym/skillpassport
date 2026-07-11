/**
 * Get Capabilities Handler
 *
 * Handles POST /api/assessment/get-capabilities
 * Returns capabilities in sequence order:
 * - If roleName: Returns role's required capabilities in sequence (role_capability_sequence.sequence_step)
 * - If courseId: Returns course's capabilities derived from its skills
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export async function getCapabilitiesHandler(context: AuthenticatedContext) {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const requestData = await context.request.json() as any;
    const { roleName, courseId } = requestData;

    if (roleName) {
      // Get role's capabilities in sequence order
      return getCapabilitiesByRole(supabase, roleName);
    } else if (courseId) {
      // Get course's capabilities
      return getCapabilitiesByCourse(supabase, courseId);
    } else {
      return Response.json({ error: 'Either roleName or courseId is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Get capabilities error:', error);
    return Response.json(
      { error: 'Failed to fetch capabilities', capabilities: [] },
      { status: 500 }
    );
  }
}

async function getCapabilitiesByRole(supabase: any, roleName: string) {
  try {
    // Get occupations by name. Multi-domain roles have one row per domain
    // (same name, different id), so this can return several rows — .single()
    // would throw for them. role_capability_sequence links directly to
    // occupations (the role_domains table no longer exists).
    const { data: occupations } = await supabase
      .from('occupations')
      .select('id')
      .eq('name', roleName);

    if (!occupations || occupations.length === 0) {
      return Response.json({ capabilities: [] }, { status: 200 });
    }

    const occupationIds = occupations.map((o: any) => o.id);

    // Get capabilities in SEQUENCE order (this is the key difference)
    const { data: capabilitySequence } = await supabase
      .from('role_capability_sequence')
      .select(`
        sequence_step,
        capability_priority,
        required_level,
        capability_master(id, name, description)
      `)
      .in('occupation_id', occupationIds)
      .order('sequence_step', { ascending: true })
      .limit(6);

    if (!capabilitySequence) {
      return Response.json({ capabilities: [] }, { status: 200 });
    }

    const capabilities = capabilitySequence.map((item: any) => ({
      id: item.capability_master?.id,
      name: item.capability_master?.name,
      description: item.capability_master?.description,
      priority: item.capability_priority,
      level: item.required_level,
      step: item.sequence_step
    }));

    return Response.json({ capabilities }, { status: 200 });
  } catch (error) {
    console.error('Error fetching role capabilities:', error);
    return Response.json({ capabilities: [] }, { status: 200 });
  }
}

async function getCapabilitiesByCourse(supabase: any, courseId: string) {
  try {
    // Get course skills
    const { data: courseSkills } = await supabase
      .from('course_skills')
      .select('skill_name, proficiency_level')
      .eq('course_id', courseId);

    if (!courseSkills || courseSkills.length === 0) {
      return Response.json({ capabilities: [] }, { status: 200 });
    }

    const skillNames = courseSkills.map((cs: any) => cs.skill_name);

    // Get skill IDs
    const { data: skills } = await supabase
      .from('skills')
      .select('id')
      .in('name', skillNames);

    if (!skills || skills.length === 0) {
      return Response.json({ capabilities: [] }, { status: 200 });
    }

    const skillIds = skills.map((s: any) => s.id);

    // Get capabilities via skill_capability_mapping
    const { data: capabilityMappings } = await supabase
      .from('skill_capability_mapping')
      .select(`
        capability_id,
        capability_master(id, name, description)
      `)
      .in('skill_id', skillIds);

    if (!capabilityMappings) {
      return Response.json({ capabilities: [] }, { status: 200 });
    }

    // Deduplicate capabilities
    const capabilityMap = new Map();
    capabilityMappings.forEach((mapping: any) => {
      const cap = mapping.capability_master;
      if (cap && !capabilityMap.has(cap.id)) {
        capabilityMap.set(cap.id, {
          id: cap.id,
          name: cap.name,
          description: cap.description,
          priority: 'Course Content',
          step: capabilityMap.size + 1
        });
      }
    });

    const capabilities = Array.from(capabilityMap.values()).slice(0, 6);

    return Response.json({ capabilities }, { status: 200 });
  } catch (error) {
    console.error('Error fetching course capabilities:', error);
    return Response.json({ capabilities: [] }, { status: 200 });
  }
}
