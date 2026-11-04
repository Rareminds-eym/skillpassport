import type {SupabaseClient} from '@supabase/supabase-js';

export class ProfileAccessError extends Error {
  constructor(message = 'Profile access denied', public status = 403) { super(message); }
}
const uuid = (value: unknown): value is string => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const check = (condition: unknown, message?: string): void => {if (!condition) throw new ProfileAccessError(message);};
const record = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const catalog = new Set(['fetch-programs', 'fetch-program-name-by-id', 'get-institutions',
  'fetch-course-modules', 'fetch-courses-by-ids', 'fetch-lessons-by-module-ids',
  'fetch-course-modules-by-course-ids', 'fetch-lesson-counts-by-module-ids', 'fetch-orgs-by-type']);
const lists = new Set(['fetch-learners', 'fetch-learners-rich', 'fetch-learners-admin',
  'fetch-learner-count', 'fetch-enrolled-learners', 'fetch-unenrolled-learners',
  'fetch-enrollment-stats', 'fetch-enrolled-learner-list']);
const targets = new Set(['fetch-learner-overview', 'fetch-trainings', 'fetch-course-enrollments',
  'fetch-certificates', 'fetch-learner-skills', 'fetch-projects', 'fetch-learner-projects',
  'fetch-learner-certificates', 'fetch-skills', 'fetch-education', 'fetch-experience',
  'fetch-personal-assessment-results', 'fetch-learner-streaks', 'fetch-skill-passports',
  'fetch-applied-jobs', 'fetch-saved-jobs', 'fetch-learner-assignments', 'fetch-attendance-records',
  'fetch-club-memberships', 'fetch-competition-registrations', 'fetch-exam-results',
  'fetch-assessment-results', 'fetch-mark-entries', 'fetch-exam-timetable', 'fetch-curriculum',
  'fetch-learner-portfolio', 'fetch-learner', 'update-learner', 'fetch-learner-admin-message',
  'update-enrollment', 'delete-profile-section', 'fetch-authenticated-learner',
  'fetch-learner-by-id', 'fetch-profile-section-data', 'fetch-weekly-learning',
  'fetch-achievement-stats', 'fetch-certificate-url', 'fetch-learner-settings-by-email',
  'fetch-learner-id-by-email', 'update-learner-by-id', 'lookup-learner-by-email',
  'fetch-learner-documents', 'update-learner-documents', 'fetch-learner-exam-data',
  'fetch-learner-result-data', 'fetch-learner-class-data', 'fetch-learner-club-event-data']);
const selfUsers = new Set(['fetch-user-settings', 'upsert-user-settings', 'fetch-user-by-id']);
const staff = new Set(['fetch-school-educators', 'fetch-college-lecturers',
  'fetch-school-educator-by-user', 'fetch-user-college-lecturer', 'fetch-org-by-admin']);
const orgReads = new Set(['fetch-school-classes', 'fetch-school-class-by-id', 'fetch-lesson-plans',
  'fetch-curriculums', 'fetch-college-events', 'fetch-organization', 'fetch-timetable-slots',
  'fetch-educator-class-assignments', 'check-duplicate-application']);
const profileFields = new Set(('name age date_of_birth dateOfBirth contact_number contactNumber alternate_number '
  + 'contact_dial_code district_name city state country pincode address branch_field course_name '
  + 'github_link linkedin_link twitter_link facebook_link instagram_link portfolio_link other_social_links '
  + 'youtube_link resumeUrl profilePicture bio gender bloodGroup guardianName guardianPhone guardianEmail '
  + 'guardianRelation hobbies interests languages documents gap_in_studies gap_years gap_reason '
  + 'work_experience aadhar_number backlogs_history current_backlogs data profile notification_settings updated_at '
  + 'university college_school_name school_name category quota').split(' '));
const academicFields = new Set(('program_id program_section_id semester section school_class_id college_class_id '
  + 'grade grade_start_date specialization enrollmentNumber registration_number roll_number admission_number '
  + 'admission_academic_year expectedGraduationDate enrollmentDate currentCgpa approval_status').split(' '));
const learnerFields = 'id,user_id,email,school_id,college_id,universityId,school_class_id,college_class_id';

/** All legacy actions pass this gate. Unknown capabilities default to denial. */
export async function authorizeProfileAction(db: SupabaseClient, user: any, action: string, input: Record<string, any>) {
  const actor = user.sub;
  check(uuid(actor), 'Verified subject required');
  const params = {...input};
  let target: any;
  let organization: {id: string; column: string; kind: string} | undefined;
  let administrator = false;

  async function academic(admin: boolean) {
    if (organization && (!admin || administrator)) return organization;
    check(uuid(user.org_id), 'Active academic context required');
    const membership = await db.from('organization_members').select('role').eq('user_id', actor)
      .eq('organization_id', user.org_id).eq('status', 'active').maybeSingle();
    if (membership.error) throw membership.error;
    check(membership.data, 'Active academic membership required');
    const org = await db.from('organizations').select('organization_type').eq('id', user.org_id).maybeSingle();
    if (org.error) throw org.error;
    const kind = org.data?.organization_type;
    check(['school', 'college', 'university'].includes(kind), 'Academic organization required');
    administrator = ['owner', 'admin'].includes(membership.data!.role)
      && user.roles?.some((role: string) => ['school_admin', 'college_admin', 'university_admin', 'admin', 'owner'].includes(role));
    if (admin) check(administrator, 'Academic administrator required');
    organization = {id: user.org_id, kind, column: kind === 'university' ? 'universityId' : `${kind}_id`};
    return organization;
  }

  async function resolve(value: unknown, email = false) {
    check(email ? typeof value === 'string' && value.length <= 320 : uuid(value), 'Invalid profile reference');
    // Check both UUID namespaces together: ambiguous references must not choose an owner.
    let own = db.from('learners').select(learnerFields).eq('user_id', actor);
    own = email ? own.eq('email', value as string) : own.or(`id.eq.${value},user_id.eq.${value}`);
    const owned = await own.maybeSingle();
    if (owned.error) throw owned.error;
    if (owned.data) return owned.data;
    const scope = await academic(true);
    let query = db.from('zoho_recruiter_learners').select(learnerFields).eq(scope.column, scope.id);
    query = email ? query.eq('email', value as string) : query.or(`id.eq.${value},user_id.eq.${value}`);
    const found = await query.maybeSingle();
    if (found.error) throw found.error;
    check(found.data, 'Profile not available in your authorized scope');
    return found.data;
  }

  async function bindTarget() {
    const references = ['learnerId', 'id', 'userId', 'learnerDbId', 'email', 'learnerEmail']
      .filter(key => params[key] !== undefined && params[key] !== null);
    check(references.length, 'Profile reference required');
    target = await resolve(params[references[0]], ['email', 'learnerEmail'].includes(references[0]));
    for (const key of references) {
      const value = params[key];
      check(['email', 'learnerEmail'].includes(key) ? value === target.email
        : key === 'userId' ? value === target.user_id : value === target.id || value === target.user_id,
      'Conflicting profile references');
    }
    for (const key of ['schoolId', 'collegeId', 'universityId']) {
      const column = key === 'schoolId' ? 'school_id' : key === 'collegeId' ? 'college_id' : 'universityId';
      if (params[key] !== undefined) check(params[key] === target[column], 'Conflicting organization reference');
    }
    if (params.learnerId !== undefined) params.learnerId = target.id;
    if (params.id !== undefined) params.id = target.id;
    if (params.userId !== undefined) params.userId = target.user_id;
    if (params.learnerDbId !== undefined) params.learnerDbId = target.id;
    // Overview mixes record and user foreign keys; supply both canonical aliases.
    if (action === 'fetch-learner-overview') {
      params.learnerId = target.id; params.userId = target.user_id; params.email = target.email;
    }
    if (action === 'fetch-skill-passports') params.learnerId = target.user_id;
    if (action === 'fetch-achievement-stats') params.learnerDbId = target.id;
  }

  function validateUpdates(value: unknown, academicUpdate: boolean) {
    check(record(value), 'Invalid profile update');
    for (const key of Object.keys(value as object)) {
      check(profileFields.has(key) || (academicUpdate && academicFields.has(key)), 'Unsupported profile update field');
    }
  }

  async function academicUpdates(value: Record<string, any>) {
    const scope = await academic(true);
    if (target) check(target[scope.column] === scope.id, 'Enrollment is outside your context');
    for (const [key, table, column] of [['school_class_id', 'school_classes', 'school_id'], ['college_class_id', 'college_classes', 'college_id']]) {
      if (value[key] != null) {
        check(uuid(value[key]));
        const item = await db.from(table).select('id').eq('id', value[key]).eq(column, scope.id).maybeSingle();
        if (item.error) throw item.error; check(item.data, 'Class is outside your context');
      }
    }
    if (value.program_id != null) {
      check(uuid(value.program_id));
      const program = await db.from('programs').select('department_id').eq('id', value.program_id).maybeSingle();
      if (program.error) throw program.error; check(program.data?.department_id);
      const department = await db.from('departments').select('id').eq('id', program.data!.department_id)
        .eq(scope.column, scope.id).maybeSingle();
      if (department.error) throw department.error; check(department.data, 'Program is outside your context');
    }
    if (value.program_section_id != null) {
      check(uuid(value.program_section_id) && uuid(value.program_id), 'Program required with its section');
      const section = await db.from('program_sections').select('id').eq('id', value.program_section_id)
        .eq('program_id', value.program_id).maybeSingle();
      if (section.error) throw section.error; check(section.data, 'Section is outside the program');
    }
  }

  if (catalog.has(action)) {
    // These actions select catalogue/institution metadata, never learner rows.
  } else if (lists.has(action)) {
    const scope = await academic(true);
    for (const [key, kind] of [['schoolId', 'school'], ['collegeId', 'college'], ['college_id', 'college'], ['universityId', 'university']]) {
      if (params[key] !== undefined) check(params[key] === scope.id && kind === scope.kind);
    }
    check(params.filters === undefined || record(params.filters), 'Invalid list filters');
    for (const key of ['schoolId', 'collegeId', 'college_id']) {
      if (params.filters?.[key] !== undefined) check(params.filters[key] === scope.id);
    }
  } else if (targets.has(action)) {
    await bindTarget();
    if (['update-enrollment'].includes(action)) {
      validateUpdates(params.enrollmentData, true); await academicUpdates(params.enrollmentData);
    }
    if (['update-learner', 'update-learner-by-id'].includes(action)) {
      check(record(params.updates), 'Invalid profile update');
      if (Object.keys(params.updates).some(key => academicFields.has(key))) await academicUpdates(params.updates);
      validateUpdates(params.updates, administrator);
    }
    if (action === 'delete-profile-section') check(!params.deleted_at, 'Account deletion requires its dedicated workflow');
  } else if (selfUsers.has(action)) {
    check(params.userId === actor, 'This action is owner-only');
  } else if (staff.has(action)) {
    if (params.userId !== actor || (params.email !== undefined && params.email !== user.email)) await academic(true);
    else check(params.email === undefined || params.email === user.email);
  } else if (orgReads.has(action)) {
    const scope = await academic(action === 'check-duplicate-application');
    for (const key of ['schoolId', 'collegeId', 'orgId']) if (params[key] !== undefined) check(params[key] === scope.id);
    if (action === 'fetch-organization') {params.orgId = scope.id; delete params.adminId;}
    if (['fetch-school-classes', 'fetch-lesson-plans', 'fetch-curriculums'].includes(action)) {
      check(scope.kind === 'school'); params.schoolId = scope.id;
    }
    if (action === 'fetch-college-events') {check(scope.kind === 'college'); params.collegeId = scope.id;}
    if (params.classId !== undefined) {
      check(uuid(params.classId));
      const item = await db.from(scope.kind === 'school' ? 'school_classes' : 'college_classes')
        .select('id').eq('id', params.classId).eq(`${scope.kind}_id`, scope.id).maybeSingle();
      if (item.error) throw item.error; check(item.data, 'Class is outside your context');
    }
    if (params.educatorId !== undefined) {
      const educator = await db.from('school_educators').select('id').eq('id', params.educatorId)
        .eq('school_id', scope.id).eq('user_id', actor).maybeSingle();
      if (educator.error) throw educator.error; check(educator.data);
    }
  } else if (['fetch-certificates-by-training', 'fetch-skills-by-training'].includes(action)) {
    check(Array.isArray(params.trainingIds) && params.trainingIds.length > 0 && params.trainingIds.length <= 100
      && params.trainingIds.every(uuid), 'Invalid training selection');
    const selected = await db.from('trainings').select('id,learner_id').in('id', params.trainingIds);
    if (selected.error) throw selected.error;
    check(selected.data?.length === new Set(params.trainingIds).size);
    for (const row of selected.data!) await resolve(row.learner_id);
  } else if (action === 'log-assessment-report') {
    target = await resolve(actor);
  } else if (action === 'track-profile-view') {
    check(uuid(params.learnerId));
    const profile = await db.from('zoho_recruiter_learners').select(learnerFields).eq('id', params.learnerId).maybeSingle();
    if (profile.error) throw profile.error; check(profile.data);
    target = profile.data;
  } else if (['create-message', 'send-learner-message', 'update-conversation-last-message'].includes(action)) {
    check(typeof params.conversationId === 'string' && params.conversationId.length <= 200);
    const conversation = await db.from('conversations').select('learner_id,recruiter_id,educator_id,school_id,college_id')
      .eq('id', params.conversationId).maybeSingle();
    if (conversation.error) throw conversation.error;
    const participants = conversation.data ? [conversation.data.learner_id, conversation.data.educator_id] : [];
    if (!participants.includes(actor)) {
      const scope = await academic(true);
      check([conversation.data?.school_id, conversation.data?.college_id].includes(scope.id), 'Conversation participation required');
    }
    if (params.senderId !== undefined) check(params.senderId === actor, 'Sender must be the caller');
    if (params.receiverId !== undefined) check(participants.includes(params.receiverId)
      || params.receiverId === user.org_id);
    const senderRole = actor === conversation.data?.learner_id ? 'learner'
      : actor === conversation.data?.educator_id ? 'educator' : 'admin';
    params.senderRole = senderRole; params.senderType = senderRole;
    if (params.receiverId !== undefined) params.receiverType = params.receiverId === conversation.data?.learner_id
      ? 'learner' : params.receiverId === conversation.data?.educator_id ? 'educator' : 'admin';
    // Participation already authorizes this conversation; it grants no profile read.
  } else if (action === 'create-conversation') {
    const data = params.conversationData;
    check(record(data) && uuid(data.learner_id));
    target = await resolve(data.learner_id);
    check(data.learner_id === target.user_id, 'Conversation requires the learner user ID');
    // Other-learner conversations require the same live academic authority as reads.
    if (target.user_id !== actor) await academic(true);
    for (const key of ['school_id', 'college_id']) if (data[key] !== undefined) check(data[key] === target[key]);
    check(!data.recruiter_id && !data.admin_id, 'Use the dedicated recruitment or messaging capability');
    if (target.user_id === actor) {
      // School/college conversations address a live organization, never arbitrary recipients.
      check(!data.educator_id, 'Use the dedicated educator messaging capability');
      const scope = await academic(false);
      check([data.school_id, data.college_id].includes(scope.id));
    } else if (data.educator_id) check(data.educator_id === actor);
  } else if (action === 'enroll-learner') {
    const scope = await academic(true);
    const data = params.enrollmentData;
    check(record(data) && uuid(data.user_id), 'Existing user identity required');
    const member = await db.from('organization_members').select('id').eq('user_id', data.user_id)
      .eq('organization_id', scope.id).eq('status', 'active').maybeSingle();
    if (member.error) throw member.error; check(member.data);
    const identity = await db.from('users').select('id,email').eq('id', data.user_id).maybeSingle();
    if (identity.error) throw identity.error; check(identity.data);
    const marker = await db.from('zoho_candidate_projections').select('target_id').eq('target_id', data.user_id).maybeSingle();
    if (marker.error) throw marker.error; check(!marker.data, 'Private imports require their approval workflow');
    const copy = {...data}; delete copy.user_id; delete copy.email;
    for (const key of ['school_id', 'college_id', 'universityId']) {
      if (copy[key] !== undefined) check(key === scope.column && copy[key] === scope.id);
      delete copy[key];
    }
    validateUpdates(copy, true);
    await academicUpdates(copy);
    params.enrollmentData = {...copy, user_id: data.user_id, email: identity.data!.email, [scope.column]: scope.id};
  } else {
    throw new ProfileAccessError('Unsupported profile capability');
  }

  // Validate caller-selected search expressions before interpolating PostgREST syntax.
  for (const value of [params.searchTerm, params.search, params.filters?.search]) {
    if (value !== undefined) check(typeof value === 'string' && value.length <= 100 && !/[(),.\\]/.test(value), 'Invalid search');
  }
  for (const value of [params.limit, params.pageSize, params.filters?.limit]) {
    if (value !== undefined) check(Number.isInteger(value) && value >= 1 && value <= 500, 'Invalid page size');
  }
  if (params.page !== undefined) check(Number.isInteger(params.page) && params.page >= 1 && params.page <= 10000);

  // Append SQL scope before ordering/limits/counts. A client-supplied filter can
  // only narrow this scope. The filtered view also protects nested copied fields.
  const client = {
    from(table: string) {
      const learnerTable = table === 'learners';
      const source = learnerTable && target?.user_id !== actor ? 'zoho_recruiter_learners' : table;
      const builder = db.from(source);
      if (!learnerTable && !['school_educators', 'college_lecturers', 'admission_applications'].includes(table)) return builder;
      return new Proxy(builder, {get(object, method) {
        const original = Reflect.get(object, method, object);
        if (typeof original !== 'function') return original;
        return (...args: any[]) => {
          let query = original.apply(object, args);
          if (['select', 'update', 'delete'].includes(String(method))) {
            if (learnerTable && target) query = query.eq('id', target.id);
            else if (learnerTable && organization) query = query.eq(organization.column, organization.id);
            else if (learnerTable) throw new ProfileAccessError('Unscoped learner query');
            if (table === 'school_educators') query = query.eq(organization ? 'school_id' : 'user_id', organization?.id ?? actor);
            if (table === 'college_lecturers') query = query.eq(organization ? 'collegeId' : 'user_id', organization?.id ?? actor);
            if (table === 'admission_applications') query = query.eq(organization!.column, organization!.id);
          }
          return query;
        };
      }});
    },
  } as unknown as SupabaseClient;
  return {client, params, target};
}
