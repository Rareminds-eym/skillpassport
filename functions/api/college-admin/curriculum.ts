import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      // ── Curriculum CRUD ────────────────────────────────────────

      case 'create-curriculum': {
        const { department_id, program_id, course_id, academic_year } = params;
        if (!department_id) return apiError(400, 'VALIDATION_ERROR', 'Missing department_id', context.request, { startTime });
        if (!program_id) return apiError(400, 'VALIDATION_ERROR', 'Missing program_id', context.request, { startTime });
        if (!course_id) return apiError(400, 'VALIDATION_ERROR', 'Missing course_id', context.request, { startTime });
        if (!academic_year) return apiError(400, 'VALIDATION_ERROR', 'Missing academic_year', context.request, { startTime });

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('organizationId')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.organizationId) {
          return apiError(400, 'AFFILIATION_ERROR', 'User has no college organization', context.request, { startTime });
        }

        const collegeId = userData.organizationId;

        const { data: curriculum, error: insertError } = await supabase
          .from('college_curriculums')
          .insert([{
            college_id: collegeId,
            department_id,
            program_id,
            course_id,
            academic_year,
            status: 'draft',
            created_by: user.id,
          }])
          .select(`
            *,
            course:college_courses!college_curriculums_course_id_fkey(course_code, course_name)
          `)
          .single();

        if (insertError) return apiDbError(insertError, context.request, { startTime });

        const { data: mapping } = await supabase
          .from('college_course_mappings')
          .select('semester')
          .eq('program_id', program_id)
          .eq('course_id', course_id)
          .limit(1);

        const result = {
          ...curriculum,
          course_code: curriculum.course?.course_code,
          course_name: curriculum.course?.course_name,
          semester: mapping?.[0]?.semester,
        };

        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-curriculum-by-id': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });

        const { data: curriculum, error: curriculumError } = await supabase
          .from('college_curriculums')
          .select(`
            *,
            departments!inner(name),
            programs!inner(name),
            course:college_courses!college_curriculums_course_id_fkey(course_code, course_name)
          `)
          .eq('id', id)
          .single();

        if (curriculumError) return apiDbError(curriculumError, context.request, { startTime });

        const { data: mapping } = await supabase
          .from('college_course_mappings')
          .select('semester')
          .eq('program_id', curriculum.program_id)
          .eq('course_id', curriculum.course_id)
          .limit(1);

        const { data: units, error: unitsError } = await supabase
          .from('college_curriculum_units')
          .select('*')
          .eq('curriculum_id', id)
          .order('order_index');

        if (unitsError) return apiDbError(unitsError, context.request, { startTime });

        const { data: outcomes, error: outcomesError } = await supabase
          .from('college_curriculum_outcomes')
          .select('*')
          .eq('curriculum_id', id);

        if (outcomesError) return apiDbError(outcomesError, context.request, { startTime });

        const result = {
          ...curriculum,
          course_code: curriculum.course?.course_code,
          course_name: curriculum.course?.course_name,
          semester: mapping?.[0]?.semester,
          units: units || [],
          outcomes: outcomes || [],
          department_name: curriculum.departments?.name,
          program_name: curriculum.programs?.name,
        };

        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-curriculums': {
        const { department_id, program_id, semester, academic_year, status, course_id } = params;

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('organizationId')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.organizationId) {
          return apiError(400, 'AFFILIATION_ERROR', 'User has no college organization', context.request, { startTime });
        }

        const collegeId = userData.organizationId;

        let query = supabase
          .from('college_curriculums')
          .select(`
            *,
            departments!inner(name),
            programs!inner(name),
            course:college_courses!college_curriculums_course_id_fkey(course_code, course_name)
          `)
          .eq('college_id', collegeId);

        if (department_id) query = query.eq('department_id', department_id);
        if (program_id) query = query.eq('program_id', program_id);
        if (academic_year) query = query.eq('academic_year', academic_year);
        if (status) query = query.eq('status', status);
        if (course_id) query = query.eq('course_id', course_id);

        const { data: curriculums, error } = await query.order('created_at', { ascending: false });

        if (error) return apiDbError(error, context.request, { startTime });

        if (!curriculums || curriculums.length === 0) {
          return apiSuccess([], context.request, { startTime });
        }

        const coursePrograms = curriculums.map(c => ({
          course_id: c.course_id,
          program_id: c.program_id,
        }));

        let mappings: any[] = [];
        if (coursePrograms.length > 0) {
          const { data: mappingData } = await supabase
            .from('college_course_mappings')
            .select('course_id, program_id, semester');

          mappings = mappingData || [];
        }

        let result: any[] = curriculums.map(curriculum => {
          const allMappings = mappings.filter(m =>
            m.program_id === curriculum.program_id &&
            m.course_id === curriculum.course_id
          );

          let selectedMapping;
          if (semester !== undefined) {
            selectedMapping = allMappings.find(m => m.semester === semester);
          } else {
            selectedMapping = allMappings[0];
          }

          return {
            ...curriculum,
            course_code: curriculum.course?.course_code,
            course_name: curriculum.course?.course_name,
            semester: selectedMapping?.semester,
            units: [],
            outcomes: [],
            department_name: curriculum.departments?.name,
            program_name: curriculum.programs?.name,
          };
        });

        if (semester !== undefined) {
          result = result.filter(curriculum => curriculum.semester === semester);
        }

        return apiSuccess(result, context.request, { startTime });
      }

      case 'update-curriculum': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });

        const { data: existing, error: fetchError } = await supabase
          .from('college_curriculums')
          .select('status')
          .eq('id', id)
          .single();

        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        if (existing.status === 'approved') {
          return apiError(400, 'INVALID_STATE', 'Cannot modify approved curriculum', context.request, { startTime });
        }

        const { data, error: updateError } = await supabase
          .from('college_curriculums')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (updateError) return apiDbError(updateError, context.request, { startTime });

        return apiSuccess(data, context.request, { startTime });
      }

      // ── Units ──────────────────────────────────────────────────

      case 'add-unit': {
        const { curriculum_id, name, code, description, credits, estimated_duration, duration_unit } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        if (!name) return apiError(400, 'VALIDATION_ERROR', 'Missing name', context.request, { startTime });
        if (!description) return apiError(400, 'VALIDATION_ERROR', 'Missing description', context.request, { startTime });

        const { data: maxOrder } = await supabase
          .from('college_curriculum_units')
          .select('order_index')
          .eq('curriculum_id', curriculum_id)
          .order('order_index', { ascending: false })
          .limit(1)
          .single();

        const nextOrder = (maxOrder?.order_index || 0) + 1;

        const { data: unit, error } = await supabase
          .from('college_curriculum_units')
          .insert([{
            curriculum_id,
            name,
            code: code || null,
            description,
            credits: credits || null,
            estimated_duration: estimated_duration || null,
            duration_unit: duration_unit || null,
            order_index: nextOrder,
          }])
          .select()
          .single();

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(unit, context.request, { startTime });
      }

      case 'update-unit': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });

        const { data, error } = await supabase
          .from('college_curriculum_units')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-unit': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });

        const { error } = await supabase
          .from('college_curriculum_units')
          .delete()
          .eq('id', id);

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Outcomes ───────────────────────────────────────────────

      case 'add-outcome': {
        const { curriculum_id, unit_id, outcome_text, bloom_level, assessment_mappings } = params;
        if (!curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculum_id', context.request, { startTime });
        if (!unit_id) return apiError(400, 'VALIDATION_ERROR', 'Missing unit_id', context.request, { startTime });
        if (!outcome_text) return apiError(400, 'VALIDATION_ERROR', 'Missing outcome_text', context.request, { startTime });

        const { data: outcome, error } = await supabase
          .from('college_curriculum_outcomes')
          .insert([{
            curriculum_id,
            unit_id,
            outcome_text,
            bloom_level: bloom_level || null,
            assessment_mappings: assessment_mappings || [],
          }])
          .select()
          .single();

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(outcome, context.request, { startTime });
      }

      case 'update-outcome': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });

        const { data, error } = await supabase
          .from('college_curriculum_outcomes')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-outcome': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });

        const { error } = await supabase
          .from('college_curriculum_outcomes')
          .delete()
          .eq('id', id);

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Approval & Publishing ──────────────────────────────────

      case 'approve-curriculum': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });

        const { data: curriculum, error: fetchError } = await supabase
          .from('college_curriculums')
          .select('status, college_id, university_id')
          .eq('id', id)
          .single();

        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        if (curriculum.university_id) {
          return apiError(400, 'AFFILIATED_COLLEGE', 'Affiliated colleges cannot directly approve curriculum. Please request approval from your university.', context.request, { startTime });
        }

        const { data: units, error: unitsError } = await supabase
          .from('college_curriculum_units')
          .select('id', { count: 'exact', head: true })
          .eq('curriculum_id', id);

        if (unitsError) return apiDbError(unitsError, context.request, { startTime });

        if (!units || units.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Curriculum must have at least one unit before approval', context.request, { startTime });
        }

        const { data: outcomes, error: outcomesError } = await supabase
          .from('college_curriculum_outcomes')
          .select('id', { count: 'exact', head: true })
          .eq('curriculum_id', id);

        if (outcomesError) return apiDbError(outcomesError, context.request, { startTime });

        if (!outcomes || outcomes.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Curriculum must have at least one learning outcome before approval', context.request, { startTime });
        }

        const { error: updateError } = await supabase
          .from('college_curriculums')
          .update({
            status: 'approved',
            reviewed_by: user.id,
            review_date: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) return apiDbError(updateError, context.request, { startTime });

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'publish-curriculum': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });

        const { data: curriculum, error: fetchError } = await supabase
          .from('college_curriculums')
          .select('status, college_id, university_id')
          .eq('id', id)
          .single();

        if (fetchError) return apiDbError(fetchError, context.request, { startTime });

        if (curriculum.status !== 'approved') {
          if (curriculum.university_id) {
            return apiError(400, 'REQUIRES_APPROVAL', 'This curriculum requires university approval before publishing. Please request approval first.', context.request, { startTime });
          }
          return apiError(400, 'INVALID_STATE', 'Only approved curriculums can be published', context.request, { startTime });
        }

        const { error: updateError } = await supabase
          .from('college_curriculums')
          .update({
            status: 'published',
            published_date: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) return apiDbError(updateError, context.request, { startTime });

        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Clone ──────────────────────────────────────────────────

      case 'clone-curriculum': {
        const { source_id, academic_year, department_id, program_id } = params;
        if (!source_id) return apiError(400, 'VALIDATION_ERROR', 'Missing source_id', context.request, { startTime });
        if (!academic_year) return apiError(400, 'VALIDATION_ERROR', 'Missing academic_year', context.request, { startTime });

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('organizationId')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.organizationId) {
          return apiError(400, 'AFFILIATION_ERROR', 'User has no college organization', context.request, { startTime });
        }

        const collegeId = userData.organizationId;

        const { data: source, error: sourceError } = await supabase
          .from('college_curriculums')
          .select(`
            *,
            course:college_courses!college_curriculums_course_id_fkey(course_code, course_name)
          `)
          .eq('id', source_id)
          .single();

        if (sourceError) {
          return apiError(404, 'NOT_FOUND', 'Source curriculum not found', context.request, { startTime });
        }

        const { data: sourceUnits, error: sourceUnitsError } = await supabase
          .from('college_curriculum_units')
          .select('*')
          .eq('curriculum_id', source_id)
          .order('order_index');

        if (sourceUnitsError) return apiDbError(sourceUnitsError, context.request, { startTime });

        const { data: sourceOutcomes, error: sourceOutcomesError } = await supabase
          .from('college_curriculum_outcomes')
          .select('*')
          .eq('curriculum_id', source_id);

        if (sourceOutcomesError) return apiDbError(sourceOutcomesError, context.request, { startTime });

        const { data: newCurriculum, error: curriculumError } = await supabase
          .from('college_curriculums')
          .insert([{
            college_id: collegeId,
            department_id: department_id || source.department_id,
            program_id: program_id || source.program_id,
            course_id: source.course_id,
            academic_year,
            status: 'draft',
            created_by: user.id,
            cloned_from_id: source_id,
            version: 1,
          }])
          .select(`
            *,
            course:college_courses!college_curriculums_course_id_fkey(course_code, course_name)
          `)
          .single();

        if (curriculumError) return apiDbError(curriculumError, context.request, { startTime });

        const unitMapping: Record<string, string> = {};
        for (const unit of sourceUnits || []) {
          const { data: newUnit, error: unitError } = await supabase
            .from('college_curriculum_units')
            .insert([{
              curriculum_id: newCurriculum.id,
              name: unit.name,
              code: unit.code,
              description: unit.description,
              credits: unit.credits,
              estimated_duration: unit.estimated_duration,
              duration_unit: unit.duration_unit,
              order_index: unit.order_index,
            }])
            .select()
            .single();

          if (unitError) return apiDbError(unitError, context.request, { startTime });
          unitMapping[unit.id] = newUnit.id;
        }

        for (const outcome of sourceOutcomes || []) {
          const newUnitId = unitMapping[outcome.unit_id];
          if (newUnitId) {
            const { error: outcomeError } = await supabase
              .from('college_curriculum_outcomes')
              .insert([{
                curriculum_id: newCurriculum.id,
                unit_id: newUnitId,
                outcome_text: outcome.outcome_text,
                bloom_level: outcome.bloom_level,
                assessment_mappings: outcome.assessment_mappings,
              }]);

            if (outcomeError) return apiDbError(outcomeError, context.request, { startTime });
          }
        }

        const result = {
          ...newCurriculum,
          course_code: newCurriculum.course?.course_code,
          course_name: newCurriculum.course?.course_name,
        };

        return apiSuccess(result, context.request, { startTime });
      }

      // ── Export ──────────────────────────────────────────────────

      case 'export-curriculum': {
        const { id, format } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });

        const exportFormat: 'json' | 'csv' = format || 'json';

        const { data: curriculum, error: curriculumError } = await supabase
          .from('college_curriculums')
          .select(`
            *,
            departments!inner(name),
            programs!inner(name),
            course:college_courses!college_curriculums_course_id_fkey(course_code, course_name)
          `)
          .eq('id', id)
          .single();

        if (curriculumError) {
          return apiError(404, 'NOT_FOUND', 'Curriculum not found', context.request, { startTime });
        }

        const { data: mapping } = await supabase
          .from('college_course_mappings')
          .select('semester')
          .eq('program_id', curriculum.program_id)
          .eq('course_id', curriculum.course_id)
          .limit(1);

        const { data: units, error: unitsError } = await supabase
          .from('college_curriculum_units')
          .select('*')
          .eq('curriculum_id', id)
          .order('order_index');

        if (unitsError) return apiDbError(unitsError, context.request, { startTime });

        const { data: outcomes, error: outcomesError } = await supabase
          .from('college_curriculum_outcomes')
          .select('*')
          .eq('curriculum_id', id);

        if (outcomesError) return apiDbError(outcomesError, context.request, { startTime });

        const courseCode = curriculum.course?.course_code;
        const courseName = curriculum.course?.course_name;
        const semester = mapping?.[0]?.semester;
        const departmentName = curriculum.departments?.name;
        const programName = curriculum.programs?.name;

        if (exportFormat === 'csv') {
          const csvData: any[][] = [];

          csvData.push([
            'Unit Order',
            'Unit Name',
            'Unit Code',
            'Unit Description',
            'Credits',
            'Duration',
            'Learning Outcome',
            'Bloom Level',
            'Assessment Types',
          ]);

          (units || []).forEach(unit => {
            const unitOutcomes = (outcomes || []).filter(o => o.unit_id === unit.id);

            if (unitOutcomes.length === 0) {
              csvData.push([
                unit.order_index,
                unit.name,
                unit.code || '',
                unit.description,
                unit.credits || '',
                unit.estimated_duration ? `${unit.estimated_duration} ${unit.duration_unit || 'hours'}` : '',
                '',
                '',
                '',
              ]);
            } else {
              unitOutcomes.forEach((outcome, index) => {
                const assessmentTypes = (outcome.assessment_mappings || [])
                  .map((m: any) => `${m.assessmentType}${m.weightage ? ` (${m.weightage}%)` : ''}`)
                  .join('; ');

                csvData.push([
                  index === 0 ? unit.order_index : '',
                  index === 0 ? unit.name : '',
                  index === 0 ? (unit.code || '') : '',
                  index === 0 ? unit.description : '',
                  index === 0 ? (unit.credits || '') : '',
                  index === 0 ? (unit.estimated_duration ? `${unit.estimated_duration} ${unit.duration_unit || 'hours'}` : '') : '',
                  outcome.outcome_text,
                  outcome.bloom_level || '',
                  assessmentTypes,
                ]);
              });
            }
          });

          return apiSuccess({ format: 'csv', content: csvData }, context.request, { startTime });
        }

        const exportData = {
          curriculum: {
            course_code: courseCode,
            course_name: courseName,
            department: departmentName,
            program: programName,
            semester,
            academic_year: curriculum.academic_year,
            status: curriculum.status,
            created_at: curriculum.created_at,
          },
          units: (units || []).map(unit => ({
            name: unit.name,
            code: unit.code,
            description: unit.description,
            credits: unit.credits,
            estimated_duration: unit.estimated_duration,
            duration_unit: unit.duration_unit,
            order: unit.order_index,
          })),
          learning_outcomes: (outcomes || []).map(outcome => ({
            unit_name: (units || []).find(u => u.id === outcome.unit_id)?.name,
            outcome_text: outcome.outcome_text,
            bloom_level: outcome.bloom_level,
            assessment_mappings: outcome.assessment_mappings,
          })),
          export_metadata: {
            exported_at: new Date().toISOString(),
            total_units: (units || []).length,
            total_outcomes: (outcomes || []).length,
            total_credits: (units || []).reduce((sum, u) => sum + (u.credits || 0), 0),
          },
        };

        return apiSuccess(exportData, context.request, { startTime });
      }

      // ── List / Lookup ───────────────────────────────────────────

      case 'get-curriculums-for-cloning': {
        const { department_id, program_id, course_code, exclude_academic_year } = params;

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('organizationId')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.organizationId) {
          return apiError(400, 'AFFILIATION_ERROR', 'User has no college organization', context.request, { startTime });
        }

        const collegeId = userData.organizationId;

        let query = supabase
          .from('college_curriculums')
          .select(`
            *,
            departments!inner(name),
            programs!inner(name),
            course:college_courses!college_curriculums_course_id_fkey(course_code, course_name)
          `)
          .eq('college_id', collegeId)
          .in('status', ['published', 'approved']);

        if (department_id) query = query.eq('department_id', department_id);
        if (program_id) query = query.eq('program_id', program_id);
        if (exclude_academic_year) query = query.neq('academic_year', exclude_academic_year);

        const { data: curriculums, error } = await query.order('academic_year', { ascending: false });

        if (error) return apiDbError(error, context.request, { startTime });

        let result = (curriculums || []).map(c => ({
          ...c,
          course_code: c.course?.course_code,
          course_name: c.course?.course_name,
          units: [],
          outcomes: [],
          department_name: c.departments?.name,
          program_name: c.programs?.name,
        }));

        if (course_code) {
          result = result.filter(c => c.course_code === course_code);
        }

        return apiSuccess(result, context.request, { startTime });
      }

      case 'get-departments': {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('organizationId')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.organizationId) {
          return apiError(400, 'AFFILIATION_ERROR', 'User has no college organization', context.request, { startTime });
        }

        const collegeId = userData.organizationId;

        const { data, error } = await supabase
          .from('departments')
          .select('id, name, code')
          .eq('college_id', collegeId)
          .eq('status', 'active')
          .order('name');

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-programs': {
        const { department_id } = params;

        let query = supabase
          .from('programs')
          .select('id, name, code, department_id')
          .eq('status', 'active')
          .order('name');

        if (department_id) query = query.eq('department_id', department_id);

        const { data, error } = await query;

        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-courses': {
        const { program_id, semester: courseSemester } = params;
        if (!program_id) return apiError(400, 'VALIDATION_ERROR', 'Missing program_id', context.request, { startTime });
        if (courseSemester === undefined || courseSemester === null) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing semester', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_course_mappings')
          .select(`
            id,
            offering_type,
            course:college_courses(
              id,
              course_code,
              course_name,
              credits,
              course_type
            )
          `)
          .eq('program_id', program_id)
          .eq('semester', courseSemester);

        if (error) return apiDbError(error, context.request, { startTime });

        const transformedData = (data || []).map((mapping: any) => ({
          id: mapping.course?.id,
          mapping_id: mapping.id,
          course_code: mapping.course?.course_code,
          course_name: mapping.course?.course_name,
          credits: mapping.course?.credits,
          type: mapping.offering_type,
          course_type: mapping.course?.course_type,
        }));

        return apiSuccess(transformedData, context.request, { startTime });
      }

      case 'get-semesters': {
        const { program_id } = params;
        if (!program_id) return apiError(400, 'VALIDATION_ERROR', 'Missing program_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('college_course_mappings')
          .select('semester')
          .eq('program_id', program_id)
          .order('semester');

        if (error) return apiDbError(error, context.request, { startTime });

        const semesters = (data || []).map(item => item.semester);
        const uniqueSemesters = Array.from(new Set(semesters));

        return apiSuccess(uniqueSemesters, context.request, { startTime });
      }

      case 'get-assessment-types': {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('organizationId')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.organizationId) {
          return apiError(400, 'AFFILIATION_ERROR', 'User has no college organization', context.request, { startTime });
        }

        const collegeId = userData.organizationId;

        const { data, error } = await supabase
          .from('assessment_types')
          .select('id, name, description, is_active, institution_id, institution_type')
          .or(`and(institution_id.eq.${collegeId},institution_type.eq.college),institution_id.is.null`)
          .eq('is_active', true)
          .order('name');

        if (error) {
          const { data: collegeTypes, error: collegeError } = await supabase
            .from('assessment_types')
            .select('id, name, description, is_active')
            .eq('institution_id', collegeId)
            .eq('institution_type', 'college')
            .eq('is_active', true);

          const { data: globalTypes, error: globalError } = await supabase
            .from('assessment_types')
            .select('id, name, description, is_active')
            .is('institution_id', null)
            .eq('is_active', true);

          if (collegeError && globalError) {
            return apiError(500, 'FETCH_ERROR', 'Failed to fetch assessment types', context.request, { startTime });
          }

          const combinedData = [
            ...(collegeTypes || []),
            ...(globalTypes || []),
          ].sort((a, b) => a.name.localeCompare(b.name));

          return apiSuccess(combinedData, context.request, { startTime });
        }

        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Pure JS (no DB) ─────────────────────────────────────────

      case 'get-academic-years': {
        const currentYear = new Date().getFullYear();
        const years: string[] = [];

        for (let i = -1; i <= 2; i++) {
          const startYear = currentYear + i;
          const endYear = startYear + 1;
          years.push(`${startYear}-${endYear}`);
        }

        return apiSuccess(years, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[curriculum POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
