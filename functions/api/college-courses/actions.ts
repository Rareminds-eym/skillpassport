import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { hasFeatureEntitlement } from '../../lib/entitlements';
import { apiSuccess, apiError } from '../../lib/response';
import { parseCollegeCourseRequest } from '../../lib/college-course-request';
import { publishCollegeCourseNotifications } from '../../lib/college-course-notifications';
import { syncApprovedCurriculumChanges } from '../../lib/curriculum-sync';

export const onRequestPost = withAuth(async context => {
  let operation;
  try { operation = parseCollegeCourseRequest(await context.request.json()); }
  catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid course request. Check required fields and import limits.', context.request); }
  const user = getContextUser(context);
  const db = getServiceClient(context.env);
  if (operation.action === 'import' && !(await hasFeatureEntitlement(db, user.id, 'curriculum_builder'))) {
    return apiError(403, 'FEATURE_ACCESS_DENIED', 'Curriculum Builder access is required.', context.request);
  }
  if (operation.action === 'rareminds-content') {
    const access = await db.rpc('college_course_workflow', { p_actor: user.id, p_action: 'courses', p_payload: {} });
    if (access.error) return apiError(503, 'COURSE_WORKFLOW_ERROR', 'Could not verify mapped courses.', context.request);
    if (!access.data?.courses?.some((course: { id: string; ownership: string }) => course.id === operation.payload.courseId && course.ownership === 'rareminds')) {
      return apiError(403, 'FORBIDDEN', 'Course is not mapped to you.', context.request);
    }
    const content = await db.from('course_modules').select('module_id,title,description,lessons(lesson_id,title,description,content,lesson_resources(resource_id,name,url))').eq('course_id', operation.payload.courseId).order('order_index');
    if (content.error) return apiError(503, 'CONTENT_UNAVAILABLE', 'Course content is unavailable.', context.request);
    return apiSuccess(content.data || [], context.request);
  }
  if (operation.action === 'create-assessment-type') {
    const { data: actor, error: actorError } = await db.from('users').select('organizationId,role,isActive').eq('id', user.id).maybeSingle();
    const jwtIsCollegeAdmin = Array.isArray(user.roles) && user.roles.includes('college_admin');

    if (!actorError && actor?.isActive && (actor.role === 'college_admin' || jwtIsCollegeAdmin) && actor.organizationId) {
      const name = operation.payload.name.trim();
      const desc = (operation.payload.description || '').trim();

      const { data: existing } = await db
        .from('assessment_types')
        .select('id, name, description')
        .ilike('name', name)
        .eq('is_active', true)
        .or(`institution_id.is.null,and(institution_id.eq.${actor.organizationId},institution_type.eq.college)`)
        .order('institution_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        return apiSuccess(existing, context.request);
      }

      const { data: created, error: createError } = await db
        .from('assessment_types')
        .insert({
          name,
          description: desc,
          institution_id: actor.organizationId,
          institution_type: 'college',
          is_active: true,
        })
        .select('id, name, description')
        .single();

      if (createError) {
        return apiError(500, 'DB_ERROR', createError.message, context.request);
      }
      return apiSuccess(created, context.request);
    }
  }

  if (operation.action === 'admin-overview') {
    const { data: actor, error: actorError } = await db.from('users').select('organizationId,role,isActive').eq('id', user.id).maybeSingle();
    const jwtIsCollegeAdmin = Array.isArray(user.roles) && user.roles.includes('college_admin');

    if (!actorError && actor?.isActive && (actor.role === 'college_admin' || jwtIsCollegeAdmin) && actor.organizationId) {
      const org = actor.organizationId;
      const { data: mappingsData, error: mapErr } = await db
        .from('college_course_mappings')
        .select(`
          id, faculty_access, program_id, semester, faculty_id,
          course:college_courses!inner(id, course_name, course_code, college_id)
        `)
        .eq('course.college_id', org)
        .not('faculty_id', 'is', null);

      if (mapErr) return apiDbError(mapErr, context.request);

      const facultyIds = [...new Set((mappingsData || []).map((m: any) => m.faculty_id).filter(Boolean))];
      let lecturers: any[] = [];
      if (facultyIds.length) {
        const { data: lecData } = await db
          .from('college_lecturers')
          .select('id, user_id, first_name, last_name, email')
          .eq('collegeId', org)
          .or(`id.in.(${facultyIds.join(',')}),user_id.in.(${facultyIds.join(',')})`);
        lecturers = lecData || [];
      }

      const mappings = (mappingsData || []).map((m: any) => {
        const lec = lecturers.find((l: any) => l.id === m.faculty_id || l.user_id === m.faculty_id);
        const facultyName = lec ? `${lec.first_name || ''} ${lec.last_name || ''}`.trim() : null;
        return {
          id: m.id,
          faculty_access: m.faculty_access || 'read',
          program_id: m.program_id,
          semester: m.semester,
          course_name: m.course?.course_name || '',
          course_code: m.course?.course_code || '',
          faculty_name: facultyName,
          email: lec?.email || null,
        };
      }).sort((a: any, b: any) => (a.course_name || '').localeCompare(b.course_name || ''));

      const { data: collegeCourses } = await db
        .from('college_courses')
        .select('id, course_name, college_id')
        .eq('college_id', org);

      const validCourseIds = new Set((collegeCourses || []).map((c: any) => c.id));
      const coursesMap = new Map((collegeCourses || []).map((c: any) => [c.id, c.course_name]));

      const { data: currData } = await db
        .from('college_curriculums')
        .select('id, course_id, college_id, pending_changes')
        .or(`college_id.eq.${org},college_id.is.null`);

      const extraCourseIds = [...new Set((currData || []).map((c: any) => c.course_id).filter((id: string) => id && !coursesMap.has(id)))];
      if (extraCourseIds.length) {
        const { data: extraList } = await db
          .from('college_courses')
          .select('id, course_name, college_id')
          .in('id', extraCourseIds);
        for (const ec of extraList || []) {
          coursesMap.set(ec.id, ec.course_name);
          if (ec.college_id === org) validCourseIds.add(ec.id);
        }
      }

      const requests: any[] = [];
      for (const curr of currData || []) {
        if (curr.college_id && curr.college_id !== org) continue;
        if (!curr.college_id && curr.course_id && !validCourseIds.has(curr.course_id)) continue;

        await syncApprovedCurriculumChanges(db, curr.id);

        let changes = curr.pending_changes;
        if (typeof changes === 'string') {
          try { changes = JSON.parse(changes); } catch { changes = []; }
        }
        if (!Array.isArray(changes)) changes = [];

        for (const r of changes) {
          const status = (r?.status || '').toLowerCase();
          const isPending = !status || status === 'pending' || status === 'submitted' || status === 'pending_approval' || status === 'pending_review';
          if (isPending) {
            let requesterEmail = r.requester_name || '';
            if (!requesterEmail && r.requested_by) {
              const { data: u } = await db.from('users').select('email').eq('id', r.requested_by).maybeSingle();
              requesterEmail = u?.email || '';
            }
            const entityType = (r.change_type === 'unit_edit' || r.change_type === 'unit_add' || r.change_type === 'unit_delete') ? 'unit' : 'outcome';

            const rawBefore = r.data?.before || r.data?.existing || r.before_data || (r.data && !r.data.after && !r.data.proposed ? r.data : {});
            const rawProposed = r.data?.after || r.data?.proposed || r.proposed_data || r.data?.changes || r.changes || (r.data && (r.data.outcome_text || r.data.text) ? r.data : {});

            const beforeData = {
              ...rawBefore,
              outcome_text: rawBefore.outcome_text || rawBefore.text || rawBefore.name || '',
            };
            const proposedData = {
              ...rawProposed,
              outcome_text: rawProposed.outcome_text || rawProposed.text || rawProposed.name || '',
            };

            requests.push({
              id: r.id,
              curriculum_id: curr.id,
              course_name: coursesMap.get(curr.course_id) || '',
              requester_email: requesterEmail,
              entity_type: entityType,
              before_data: beforeData,
              proposed_data: proposedData,
              created_at: r.timestamp || r.created_at || new Date().toISOString(),
            });
          }
        }
      }
      requests.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));

      return apiSuccess({ mappings, requests }, context.request);
    }
  }

  if (operation.action === 'review') {
    const { data: actor, error: actorError } = await db.from('users').select('organizationId,role,isActive').eq('id', user.id).maybeSingle();
    const jwtIsCollegeAdmin = Array.isArray(user.roles) && user.roles.includes('college_admin');

    if (!actorError && actor?.isActive && (actor.role === 'college_admin' || jwtIsCollegeAdmin) && actor.organizationId) {
      const org = actor.organizationId;
      const { requestId, decision, notes } = operation.payload;
      if (!['approved', 'rejected'].includes(decision)) {
        return apiError(400, 'VALIDATION_ERROR', 'Invalid decision', context.request);
      }

      const { data: currList, error: currErr } = await db
        .from('college_curriculums')
        .select('id, course_id, college_id, pending_changes, change_history, version')
        .or(`college_id.eq.${org},college_id.is.null`);

      if (currErr) return apiDbError(currErr, context.request);

      let targetCurriculum: any = null;
      let targetRequest: any = null;

      for (const curr of currList || []) {
        if (curr.college_id && curr.college_id !== org) continue;
        let changes = curr.pending_changes;
        if (typeof changes === 'string') {
          try { changes = JSON.parse(changes); } catch { changes = []; }
        }
        if (!Array.isArray(changes)) changes = [];
        const req = changes.find((r: any) => r.id === requestId);
        if (req) {
          targetCurriculum = { ...curr, pending_changes: changes };
          targetRequest = req;
          break;
        }
      }

      if (!targetCurriculum || !targetRequest) {
        return apiError(404, 'NOT_FOUND', 'Request is no longer pending', context.request);
      }

      if (decision === 'approved') {
        const proposed = targetRequest.data?.after || targetRequest.data?.proposed || targetRequest.data?.changes || targetRequest.changes || targetRequest.data || {};
        const entityId = targetRequest.entity_id;

        if (targetRequest.change_type === 'unit_edit') {
          await db
            .from('college_curriculum_units')
            .update({
              name: proposed.name,
              description: proposed.description,
              updated_at: new Date().toISOString(),
              updated_by: user.id,
            })
            .eq('id', entityId);
        } else if (targetRequest.change_type === 'outcome_edit') {
          await db
            .from('college_curriculum_outcomes')
            .update({
              outcome_text: proposed.outcome_text || proposed.text || '',
              updated_at: new Date().toISOString(),
              updated_by: user.id,
            })
            .eq('id', entityId);
        } else if (targetRequest.change_type === 'unit_add') {
          const { data: maxOrder } = await db
            .from('college_curriculum_units')
            .select('order_index')
            .eq('curriculum_id', targetCurriculum.id)
            .order('order_index', { ascending: false })
            .limit(1)
            .maybeSingle();

          const nextOrder = (maxOrder?.order_index || 0) + 1;
          const unitName = proposed.name || proposed.title || 'New Unit';
          const unitCode = proposed.code || `U${nextOrder}`;

          const { data: newUnit, error: newUnitErr } = await db
            .from('college_curriculum_units')
            .insert([{
              curriculum_id: targetCurriculum.id,
              name: unitName,
              code: unitCode,
              description: proposed.description || '',
              credits: proposed.credits ? Number(proposed.credits) : null,
              estimated_duration: proposed.estimated_duration ? Number(proposed.estimated_duration) : null,
              duration_unit: proposed.duration_unit || null,
              order_index: nextOrder,
            }])
            .select()
            .single();

          if (!newUnitErr && newUnit) {
            const rawOutcomes = proposed.outcomes || proposed.learning_outcomes || [];
            if (Array.isArray(rawOutcomes) && rawOutcomes.length > 0) {
              const outcomeRows = rawOutcomes.map((oc: any) => ({
                curriculum_id: targetCurriculum.id,
                unit_id: newUnit.id,
                outcome_text: typeof oc === 'string' ? oc : oc.text || oc.outcome_text || '',
                bloom_level: typeof oc === 'object' ? oc.bloomLevel || oc.bloom_level || null : null,
                assessment_mappings: typeof oc === 'object' ? oc.assessments || oc.assessment_mappings || [] : [],
              })).filter((oc: any) => oc.outcome_text && oc.outcome_text.trim());

              if (outcomeRows.length) {
                await db.from('college_curriculum_outcomes').insert(outcomeRows);
              }
            }
          }
        } else if (targetRequest.change_type === 'outcome_add') {
          const unitId = targetRequest.entity_id || proposed.unit_id || proposed.unitId;
          const text = (proposed.outcome_text || proposed.text || '').trim();
          if (unitId && text) {
            await db.from('college_curriculum_outcomes').insert([{
              curriculum_id: targetCurriculum.id,
              unit_id: unitId,
              outcome_text: text,
              bloom_level: proposed.bloom_level || proposed.bloomLevel || null,
              assessment_mappings: proposed.assessment_mappings || proposed.assessments || [],
            }]);
          }
        }
      }

      let currentChanges = targetCurriculum.pending_changes;
      if (typeof currentChanges === 'string') {
        try { currentChanges = JSON.parse(currentChanges); } catch { currentChanges = []; }
      }
      if (!Array.isArray(currentChanges)) currentChanges = [];
      const remainingChanges = currentChanges.filter((r: any) => r.id !== requestId);

      let currentHistory = targetCurriculum.change_history;
      if (typeof currentHistory === 'string') {
        try { currentHistory = JSON.parse(currentHistory); } catch { currentHistory = []; }
      }
      if (!Array.isArray(currentHistory)) currentHistory = [];

      const historyEntry = {
        id: targetRequest.id,
        action: decision === 'approved' ? 'change_approved' : 'change_rejected',
        change_type: targetRequest.change_type,
        status: decision,
        timestamp: new Date().toISOString(),
        user_id: user.id,
        review_notes: notes || '',
        applied: decision === 'approved',
        original_change: targetRequest,
      };

      await db
        .from('college_curriculums')
        .update({
          pending_changes: remainingChanges,
          has_pending_changes: remainingChanges.length > 0,
          change_history: [...currentHistory, historyEntry],
          version: (targetCurriculum.version || 1) + (decision === 'approved' ? 1 : 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetCurriculum.id);

      await db
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('curriculum_change_id', requestId);

      await syncApprovedCurriculumChanges(db, targetCurriculum.id);

      context.waitUntil(publishCollegeCourseNotifications(db, context.env, requestId, `curriculum_change_${decision}`));

      return apiSuccess({ reviewed: true }, context.request);
    }
  }

  if (operation.action === 'content') {
    const { courseId, programId } = operation.payload || {};
    if (courseId && programId) {
      const { data: currs } = await db.from('college_curriculums').select('id').eq('course_id', courseId).eq('program_id', programId);
      for (const c of currs || []) {
        await syncApprovedCurriculumChanges(db, c.id);
      }
    }
  }

  if (operation.action === 'set-access') {
    const { data: actor, error: actorError } = await db.from('users').select('organizationId,role,isActive').eq('id', user.id).maybeSingle();
    const jwtIsCollegeAdmin = Array.isArray(user.roles) && user.roles.includes('college_admin');

    if (!actorError && actor?.isActive && (actor.role === 'college_admin' || jwtIsCollegeAdmin) && actor.organizationId) {
      const { mappingId, access } = operation.payload;
      if (!['read', 'edit'].includes(access)) {
        return apiError(400, 'VALIDATION_ERROR', 'Invalid permission', context.request);
      }
      const { error: updErr } = await db
        .from('college_course_mappings')
        .update({
          faculty_access: access,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mappingId);

      if (updErr) return apiDbError(updErr, context.request);
      return apiSuccess({ updated: true }, context.request);
    }
  }
  const { data, error } = operation.action === 'create-assessment-type'
    ? await db.rpc('create_college_assessment_type', { p_actor: user.id, p_course: operation.payload.courseId, p_program: operation.payload.programId, p_name: operation.payload.name, p_description: operation.payload.description || '' })
    : await db.rpc('college_course_workflow', { p_actor: user.id, p_action: operation.action, p_payload: operation.payload });
  if (error) {
    const status = error.code === '42501' ? 403 : ['23505', '40001'].includes(error.code) ? 409 : error.code === '22023' ? 400 : 503;
    return apiError(status, status === 403 ? 'FORBIDDEN' : status === 409 ? 'CONFLICT' : 'COURSE_WORKFLOW_ERROR', status === 503 ? 'Course service is unavailable. Please retry.' : error.message, context.request);
  }
  if (operation.action === 'courses' && data?.courses) {
    const programIds = [...new Set<string>(data.courses.map((course: { program_id?: string }) => course.program_id).filter(Boolean))];
    if (programIds.length) {
      const programs = await db.from('programs').select('id,name,code,department:departments(id,name,code)').in('id', programIds);
      if (programs.error) return apiError(503, 'COURSE_WORKFLOW_ERROR', 'Could not load course program details. Please retry.', context.request);
      data.courses = data.courses.map((course: { program_id?: string }) => {
        const program = programs.data?.find(item => item.id === course.program_id);
        const department = Array.isArray(program?.department) ? program.department[0] : program?.department;
        return {
          ...course, program_name: program?.name ?? null, program_code: program?.code ?? null,
          department_id: department?.id ?? null, department_name: department?.name ?? null, department_code: department?.code ?? null
        };
      });
    }
  }
  if ((operation.action === 'propose' || operation.action === 'propose-add') && data?.requestId) {
    context.waitUntil(publishCollegeCourseNotifications(db, context.env, data.requestId, 'curriculum_change_submitted'));
  } else if (operation.action === 'review') {
    context.waitUntil(publishCollegeCourseNotifications(db, context.env, operation.payload.requestId, `curriculum_change_${operation.payload.decision}`));
  }
  return apiSuccess(data, context.request);
});
