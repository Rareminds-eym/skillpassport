/**
 * Get Courses By Role Capabilities Handler
 *
 * Handles POST /api/assessment/get-courses-by-capabilities
 *
 * Flow:
 * 1. Get role's required capabilities (from role_capability_sequence)
 * 2. Find courses that teach those capabilities (via skill_capability_mapping)
 * 3. Return courses with their matched capabilities
 * 4. If < 4 courses found, return empty list (caller will use RAG as fallback)
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export async function getCoursesbyCapabilitiesHandler(context: AuthenticatedContext) {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const requestData = await context.request.json() as any;
    const { roleName } = requestData;

    if (!roleName) {
      return Response.json({ error: 'roleName is required' }, { status: 400 });
    }

    // Step 1: Get role's required capabilities in sequence order.
    // Multi-domain roles have one occupation row per domain (same name), so
    // fetch all ids — .single() would throw. role_capability_sequence links
    // directly to occupations (the role_domains table no longer exists).
    const { data: occupations } = await supabase
      .from('occupations')
      .select('id')
      .eq('name', roleName);

    if (!occupations || occupations.length === 0) {
      return Response.json({ courses: [], capabilities: [] }, { status: 200 });
    }

    const occupationIds = occupations.map((o: any) => o.id);

    // Get ALL role's required capabilities in sequence (no limit)
    const { data: capabilitySequence } = await supabase
      .from('role_capability_sequence')
      .select(`
        sequence_step,
        capability_priority,
        required_level,
        capability_master(id, name, description)
      `)
      .in('occupation_id', occupationIds)
      .order('sequence_step', { ascending: true });

    if (!capabilitySequence || capabilitySequence.length === 0) {
      return Response.json({ courses: [], capabilities: [] }, { status: 200 });
    }

    // Format role capabilities
    const roleCapabilities = capabilitySequence.map((item: any) => ({
      id: item.capability_master?.id,
      name: item.capability_master?.name,
      description: item.capability_master?.description,
      priority: item.capability_priority,
      level: item.required_level,
      step: item.sequence_step
    }));

    // Step 2: Find courses that teach these capabilities
    const capabilityIds = roleCapabilities.map(cap => cap.id).filter(Boolean);

    if (capabilityIds.length === 0) {
      return Response.json({ courses: [], capabilities: roleCapabilities }, { status: 200 });
    }

    // Get capabilities from skill_capability_mapping
    const { data: skillCapabilityMappings } = await supabase
      .from('skill_capability_mapping')
      .select('skill_id')
      .in('capability_id', capabilityIds);

    if (!skillCapabilityMappings || skillCapabilityMappings.length === 0) {
      return Response.json({ courses: [], capabilities: roleCapabilities }, { status: 200 });
    }

    const skillIds = [...new Set(skillCapabilityMappings.map(scm => scm.skill_id))];

    // Get skills details
    const { data: skills } = await supabase
      .from('skills')
      .select('id, name')
      .in('id', skillIds);

    if (!skills || skills.length === 0) {
      return Response.json({ courses: [], capabilities: roleCapabilities }, { status: 200 });
    }

    const skillNames = skills.map(s => s.name);

    // Get courses that have these skills
    const { data: courseSkills } = await supabase
      .from('course_skills')
      .select(`
        course_id,
        skill_name,
        proficiency_level,
        courses(course_id, title, description, duration, category, level)
      `)
      .in('skill_name', skillNames);

    if (!courseSkills || courseSkills.length === 0) {
      return Response.json({ courses: [], capabilities: roleCapabilities }, { status: 200 });
    }

    // Deduplicate courses and map capabilities
    const courseMap = new Map();
    courseSkills.forEach((cs: any) => {
      const courseId = cs.course_id;
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          id: courseId,
          course_id: courseId,
          title: cs.courses?.title || '',
          description: cs.courses?.description || '',
          duration: cs.courses?.duration || '',
          category: cs.courses?.category || '',
          level: cs.courses?.level || 'Intermediate',
          matchedCapabilities: []
        });
      }
    });

    // For each course, find which capabilities it teaches
    for (const [courseId, course] of courseMap) {
      const { data: courseCaps } = await supabase
        .from('course_skills')
        .select(`skill_name`)
        .eq('course_id', courseId);

      if (courseCaps) {
        const courseSkillNames = courseCaps.map(c => c.skill_name);

        // Find matching capabilities
        const { data: matchedCapabilities } = await supabase
          .from('skill_capability_mapping')
          .select(`capability_master(id, name, description)`)
          .in('capability_id', capabilityIds)
          .in('skill_id', courseSkillNames.map(sn =>
            skills.find(s => s.name === sn)?.id
          ).filter(Boolean));

        const uniqueCaps = new Map();
        (matchedCapabilities || []).forEach((cap: any) => {
          if (cap.capability_master && !uniqueCaps.has(cap.capability_master.id)) {
            uniqueCaps.set(cap.capability_master.id, cap.capability_master);
          }
        });

        course.matchedCapabilities = Array.from(uniqueCaps.values()).slice(0, 3);
      }
    }

    // Return top 6 courses that have capability matches
    const courses = Array.from(courseMap.values())
      .filter((c: any) => c.matchedCapabilities.length > 0)
      .slice(0, 6);

    return Response.json({
      courses,
      capabilities: roleCapabilities,
      matchCount: courses.length
    }, { status: 200 });
  } catch (error) {
    console.error('Get courses by capabilities error:', error);
    return Response.json(
      { error: 'Failed to fetch courses', courses: [], capabilities: [] },
      { status: 500 }
    );
  }
}
