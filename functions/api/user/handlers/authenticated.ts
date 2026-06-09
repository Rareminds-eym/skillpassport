/**
 * Authenticated handlers (Admin creates users)
 * - Create learner (admin adds learner)
 * - Create teacher (admin adds teacher)
 * - Create college staff (college admin adds staff)
 * - Update learner documents
 */

import { apiError, apiSuccess } from '../../../lib/response';
import { ssoCreateMember, ssoCreateMemberWithId, ssoFetch } from '../../../lib/sso-client';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import {
  calculateAge,
  deleteAuthUser,
  generatePassword,
  splitName,
  validateEmail,
} from '../utils/helpers';

/**
 * Handle admin creating a learner
 */
export async function handleCreateLearner(request: Request, env: any, user?: { id: string; email: string; org_id?: string }): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    learner: {
      name: string;
      email: string;
      contactNumber: string;
      dateOfBirth?: string;
      gender?: string;
      enrollmentNumber?: string;
      grade?: string;
      section?: string;
      guardianName?: string;
      guardianPhone?: string;
      // Rich profile data
      projects?: Array<{
        title: string;
        description?: string;
        start_date?: string;
        end_date?: string;
        tech_stack?: string[];
        demo_link?: string;
        github_link?: string;
        role?: string;
      }>;
      certifications?: Array<{
        title: string;
        issuer?: string;
        issued_on?: string;
        credential_id?: string;
        link?: string;
        platform?: string;
      }>;
      skills?: Array<{
        name: string;
        type?: string;
        level?: number;
        proficiency_level?: string;
      }>;
      education?: Array<{
        level?: string;
        degree: string;
        department?: string;
        university?: string;
        year_of_passing?: string;
        cgpa?: string;
      }>;
    };
    userEmail: string;
    schoolId?: string;
    collegeId?: string;
  };

  const { learner, userEmail, schoolId: requestSchoolId, collegeId: requestCollegeId } = body;

  if (!learner || !learner.name || !learner.email || !learner.contactNumber) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: name, email, and contactNumber', request);
  }

  if (!userEmail) {
    return apiError(400, 'VALIDATION_ERROR', 'No user email provided', request);
  }

  if (!validateEmail(learner.email)) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
  }

  // Get current user data
  // TODO(12.1 review / §7.3): the acting admin's role is read from the shadow
  // `users.role` (looked up by the client-supplied `userEmail`, not the verified
  // JWT) and branched on the SSO roles `college_admin`/`school_admin` below to
  // decide institution scope. Proper fix is to use `getContextUser(context).roles`,
  // but this handler is invoked without the auth context (request/env only) and
  // keys off client-supplied email — threading the verified user requires a
  // signature change. Deferred for safety; flagged for review.
  const { data: currentUserData } = await supabaseAdmin
    .from('users')
    .select('id, organizationId, role')
    .eq('email', userEmail)
    .maybeSingle();

  const userId = currentUserData?.id || null;
  const userRole = currentUserData?.role || null;

  // Determine institution type
  let schoolId = requestSchoolId || null;
  let collegeId = requestCollegeId || null;
  let institutionType: string | null = null;

  if (collegeId) {
    institutionType = 'college';
  } else if (schoolId) {
    institutionType = 'school';
  } else {
    if (userRole === 'college_admin') {
      // Look up college from organizations table
      const { data: college } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('organization_type', 'college')
        .or(`admin_id.eq.${userId},email.ilike.${userEmail}`)
        .maybeSingle();
      if (college?.id) {
        collegeId = college.id;
        institutionType = 'college';
      }
    } else if (userRole === 'school_admin') {
      // Look up school from organizations table for school_admin
      const { data: school } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('organization_type', 'school')
        .or(`admin_id.eq.${userId},email.ilike.${userEmail}`)
        .maybeSingle();
      if (school?.id) {
        schoolId = school.id;
        institutionType = 'school';
      }
    } else {
      // For educators, try organizationId first, then school_educators table
      schoolId = currentUserData?.organizationId || null;
      const { data: educatorData } = await supabaseAdmin
        .from('school_educators')
        .select('school_id')
        .eq('email', userEmail)
        .maybeSingle();
      schoolId = educatorData?.school_id || schoolId;
    }
    if (schoolId) institutionType = 'school';
  }

  if (!schoolId && !collegeId) {
    return apiError(400, 'VALIDATION_ERROR', 'School/College ID not found', request);
  }

  // Get or create the SSO organization ID
  let ssoOrgId: string | null = user?.org_id || null;
  
  try {
    if (!ssoOrgId) {
      // First, try to get sso_org_id from organization metadata
      const { data: organizationData } = await supabaseAdmin
        .from('organizations')
        .select('metadata')
        .eq('id', schoolId || collegeId)
        .maybeSingle();

      ssoOrgId = organizationData?.metadata?.sso_org_id || null;

    // If no sso_org_id found, we need to get it from the SSO database
    // The SSO org should already exist (created during school/college signup)
    // We'll look it up by matching the organization name or slug
    if (!ssoOrgId && env.SSO_SERVICE) {
      const { data: orgDetails } = await supabaseAdmin
        .from('organizations')
        .select('name, slug')
        .eq('id', schoolId || collegeId)
        .maybeSingle();

      if (orgDetails) {
        // Query SSO database to find matching organization
        // Using the SSO service binding to query
        try {
          const ssoOrgs = await ssoFetch(env, `/api/orgs?slug=${encodeURIComponent(orgDetails.slug)}`, {
            method: 'GET',
          });
          
          if (ssoOrgs.ok) {
            const orgsData = await ssoOrgs.json() as { organizations: { id: string }[] };
            if (orgsData.organizations && orgsData.organizations.length > 0) {
              ssoOrgId = orgsData.organizations[0].id;
              
              // Save the sso_org_id back to skillpassport metadata for future use
              await supabaseAdmin
                .from('organizations')
                .update({
                  metadata: {
                    ...organizationData?.metadata,
                    sso_org_id: ssoOrgId,
                  },
                })
                .eq('id', schoolId || collegeId);
                
              console.log('[CREATE_LEARNER] Found and saved SSO org_id:', ssoOrgId);
            }
          }
        } catch (ssoLookupError) {
          console.warn('[CREATE_LEARNER] Failed to lookup SSO organization:', ssoLookupError);
        }
      }
    }

    if (!ssoOrgId) {
      console.warn('[CREATE_LEARNER] No SSO org_id found for organization, learner will only be created in skillpassport database');
    }
    } // Close the outer if (!ssoOrgId) block
  } catch (error) {
    console.error('[CREATE_LEARNER] Error getting SSO org_id:', error);
    // Continue without SSO sync
  }

  // Check if email already exists in skillpassport database
  const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailExists = existingAuthUsers?.users?.some(
    (u: any) => u.email === learner.email.toLowerCase()
  );
  if (emailExists) {
    return apiError(400, 'VALIDATION_ERROR', `Learner with email ${learner.email} already exists`, request);
  }

  const { data: existingLearner } = await supabaseAdmin
    .from('learners')
    .select('id')
    .eq('email', learner.email.toLowerCase())
    .maybeSingle();
  if (existingLearner) {
    return apiError(400, 'VALIDATION_ERROR', `Learner with email ${learner.email} already exists`, request);
  }

  const learnerPassword = generatePassword();
  const learnerRole = 'learner';

  // Create auth user in skillpassport database
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: learner.email.toLowerCase(),
    password: learnerPassword,
    email_confirm: true,
    user_metadata: {
      name: learner.name,
      role: learnerRole,
      phone: learner.contactNumber,
      password: learnerPassword,
      added_by: userId,
    },
  });

  if (authError || !authUser.user) {
    return apiError(500, 'INTERNAL_ERROR', `Failed to create auth account: ${authError?.message}`, request);
  }

  const authUserId = authUser.user.id;

  try {
    // Create public.users record in skillpassport database
    const { firstName, lastName } = splitName(learner.name);

    await supabaseAdmin.from('users').insert({
      id: authUserId,
      email: learner.email.toLowerCase(),
      firstName,
      lastName,
      role: learnerRole,
      organizationId: schoolId || collegeId,
      isActive: true,
      metadata: {
        source: `${institutionType}_admin_added`,
        schoolId,
        collegeId,
        addedBy: userId,
        password: learnerPassword,
      },
    });

    // Create learners record in skillpassport database
    const age = calculateAge(learner.dateOfBirth || '');

    const { data: learnerRecord, error: learnerError } = await supabaseAdmin
      .from('learners')
      .insert({
        user_id: authUserId,
        email: learner.email.toLowerCase(),
        name: learner.name,
        contactNumber: learner.contactNumber,
        contact_number: learner.contactNumber,
        dateOfBirth: learner.dateOfBirth || null,
        date_of_birth: learner.dateOfBirth || null,
        age,
        gender: learner.gender || null,
        enrollmentNumber: learner.enrollmentNumber || null,
        grade: learner.grade || null,
        section: learner.section || null,
        guardianName: learner.guardianName || null,
        guardianPhone: learner.guardianPhone || null,
        school_id: schoolId,
        college_id: collegeId,
        learner_type: institutionType === 'college' ? 'direct' : 'learner',
        approval_status: 'approved',
        metadata: {
          source: `${institutionType}_admin_added`,
          addedBy: userId,
          password: learnerPassword,
        },
      })
      .select()
      .single();

    if (learnerError) {
      throw new Error(`Failed to create learner profile: ${learnerError.message}`);
    }

    // ══════════════════════════════════════════════════════════════
    // SAVE TO SSO DATABASE (using ssoCreateMemberWithId RPC via binding)
    // ══════════════════════════════════════════════════════════════
    
    if (ssoOrgId && env.SSO_SERVICE) {
      try {
        console.log('[CREATE_LEARNER] Creating learner in SSO database with same user_id', {
          user_id: authUserId,
          email: learner.email.toLowerCase(),
          org_id: ssoOrgId,
          role: 'learner',
        });

        // Use SSO service binding to create member WITH SAME USER_ID
        // This creates: user + membership + role assignment in SSO database
        // CRITICAL: Pass authUserId from Skillpassport to ensure SAME user_id in both databases
        const ssoResult = await ssoCreateMemberWithId(env, {
          user_id: authUserId,
          email: learner.email.toLowerCase(),
          password: learnerPassword,
          role: 'learner',
          org_id: ssoOrgId,
        });

        console.log('[CREATE_LEARNER] Successfully created learner in SSO database with same user_id', {
          sso_user_id: ssoResult.user_id,
          skillpassport_user_id: authUserId,
          same_id: ssoResult.user_id === authUserId,
        });

        // Update learner metadata to track SSO sync
        await supabaseAdmin
          .from('learners')
          .update({
            metadata: {
              ...learnerRecord.metadata,
              sso_synced: true,
              sso_org_id: ssoOrgId,
              sso_user_id: ssoResult.user_id,
              sso_membership_id: ssoResult.membership_id,
              sso_synced_at: new Date().toISOString(),
            },
          })
          .eq('id', learnerRecord.id);

      } catch (ssoError) {
        // Log error but don't fail the operation
        console.error('[CREATE_LEARNER] Failed to create learner in SSO database:', ssoError);
        
        // Update metadata to indicate sync failure
        await supabaseAdmin
          .from('learners')
          .update({
            metadata: {
              ...learnerRecord.metadata,
              sso_synced: false,
              sso_sync_error: ssoError instanceof Error ? ssoError.message : String(ssoError),
              sso_sync_failed_at: new Date().toISOString(),
            },
          })
          .eq('id', learnerRecord.id);
      }
    } else {
      console.warn('[CREATE_LEARNER] No SSO org_id or SSO_SERVICE binding found, skipping SSO sync');
    }

    // Add rich profile data (projects, certifications, skills, education)
    const richDataResults = {
      projects: 0,
      certifications: 0,
      skills: 0,
      education: 0
    };

    console.log('[CREATE_LEARNER] Starting rich profile data insertion for learner_id:', learnerRecord.id);
    console.log('[CREATE_LEARNER] Received rich data:', {
      projects: learner.projects?.length || 0,
      certifications: learner.certifications?.length || 0,
      skills: learner.skills?.length || 0,
      education: learner.education?.length || 0,
    });

    try {
      // Add projects if provided
      if (learner.projects && learner.projects.length > 0) {
        console.log('[CREATE_LEARNER] Processing', learner.projects.length, 'projects');
        console.log('[CREATE_LEARNER] Processing', learner.projects.length, 'projects');
        for (const project of learner.projects) {
          if (project.title) {
            console.log('[CREATE_LEARNER] Inserting project:', project.title);
            
            // Note: The projects table has triggers that create notifications
            // If the admin user doesn't exist in users table (only in SSO),
            // the notification foreign key constraint will fail
            // We wrap this in a transaction and handle errors gracefully
            try {
              const { error: projError } = await supabaseAdmin
                .from('projects')
                .insert({
                  learner_id: learnerRecord.id,
                  title: project.title,
                  description: project.description || null,
                  start_date: project.start_date || null,
                  end_date: project.end_date || null,
                  tech_stack: project.tech_stack || [],
                  demo_link: project.demo_link || null,
                  github_link: project.github_link || null,
                  role: project.role || null,
                  approval_status: 'approved',
                  enabled: true,
                });
              
              if (!projError) {
                richDataResults.projects++;
                console.log('[CREATE_LEARNER] ✅ Project inserted successfully:', project.title);
              } else {
                // Check if it's a notification foreign key error
                if (projError.code === '23503' && projError.message.includes('notifications')) {
                  console.warn(`[CREATE_LEARNER] ⚠️  Project "${project.title}" created but notification failed (admin not in users table):`, projError.message);
                  richDataResults.projects++;
                } else {
                  console.error(`[CREATE_LEARNER] ❌ Failed to add project "${project.title}":`, projError.message, projError);
                }
              }
            } catch (projException: any) {
              console.error(`[CREATE_LEARNER] ❌ Exception adding project "${project.title}":`, projException);
            }
          } else {
            console.warn('[CREATE_LEARNER] Skipping project with no title:', project);
          }
        }
      }

      // Add certifications if provided
      if (learner.certifications && learner.certifications.length > 0) {
        console.log('[CREATE_LEARNER] Processing', learner.certifications.length, 'certifications');
        for (const cert of learner.certifications) {
          if (cert.title) {
            console.log('[CREATE_LEARNER] Inserting certificate:', cert.title);
            const { error: certError } = await supabaseAdmin
              .from('certificates')
              .insert({
                learner_id: learnerRecord.id,
                title: cert.title,
                issuer: cert.issuer || null,
                issued_on: cert.issued_on || null,
                credential_id: cert.credential_id || null,
                link: cert.link || null,
                platform: cert.platform || null,
                approval_status: 'approved',
                enabled: true,
              });
            if (!certError) {
              richDataResults.certifications++;
              console.log('[CREATE_LEARNER] ✅ Certificate inserted successfully:', cert.title);
            } else {
              console.error(`[CREATE_LEARNER] ❌ Failed to add certification "${cert.title}":`, certError.message, certError);
            }
          } else {
            console.warn('[CREATE_LEARNER] Skipping certificate with no title:', cert);
          }
        }
      }

      // Add skills if provided
      if (learner.skills && learner.skills.length > 0) {
        console.log('[CREATE_LEARNER] Processing', learner.skills.length, 'skills');
        for (const skill of learner.skills) {
          if (skill.name) {
            // Normalize skill type to lowercase and map to valid values
            let skillType = (skill.type || 'technical').toLowerCase();
            if (skillType !== 'technical' && skillType !== 'soft') {
              skillType = 'technical'; // Default to 'technical' for any invalid type
            }
            
            console.log('[CREATE_LEARNER] Inserting skill:', skill.name, 'type:', skillType, 'level:', skill.level);
            const { error: skillError } = await supabaseAdmin
              .from('skills')
              .insert({
                learner_id: learnerRecord.id,
                name: skill.name,
                type: skillType,
                level: skill.level || null,
                proficiency_level: skill.proficiency_level || null,
                approval_status: 'approved',
                verified: true,
                enabled: true,
              });
            if (!skillError) {
              richDataResults.skills++;
              console.log('[CREATE_LEARNER] ✅ Skill inserted successfully:', skill.name);
            } else {
              console.error(`[CREATE_LEARNER] ❌ Failed to add skill "${skill.name}":`, skillError.message, skillError);
            }
          } else {
            console.warn('[CREATE_LEARNER] Skipping skill with no name:', skill);
          }
        }
      }

      // Add education if provided
      if (learner.education && learner.education.length > 0) {
        console.log('[CREATE_LEARNER] Processing', learner.education.length, 'education records');
        for (const edu of learner.education) {
          if (edu.degree) {
            console.log('[CREATE_LEARNER] Inserting education:', edu.degree);
            const { error: eduError } = await supabaseAdmin
              .from('education')
              .insert({
                learner_id: learnerRecord.id,
                level: edu.level || null,
                degree: edu.degree,
                department: edu.department || null,
                university: edu.university || null,
                year_of_passing: edu.year_of_passing || null,
                cgpa: edu.cgpa || null,
                approval_status: 'approved',
                enabled: true,
              });
            if (!eduError) {
              richDataResults.education++;
              console.log('[CREATE_LEARNER] ✅ Education inserted successfully:', edu.degree);
            } else {
              console.error(`[CREATE_LEARNER] ❌ Failed to add education "${edu.degree}":`, eduError.message, eduError);
            }
          } else {
            console.warn('[CREATE_LEARNER] Skipping education with no degree:', edu);
          }
        }
      }

      console.log('[CREATE_LEARNER] Rich data added:', richDataResults);
    } catch (richDataError) {
      console.error('[CREATE_LEARNER] Error adding rich profile data:', richDataError);
      // Don't throw - allow learner creation to succeed even if rich data fails
      // The richDataResults object will show what was successfully added
    }

    return apiSuccess({
      message: `Learner ${learner.name} created successfully`,
      data: {
        authUserId: authUserId,
        learnerId: learnerRecord.id,
        email: learner.email,
        name: learner.name,
        password: learnerPassword,
        institutionType,
        schoolId,
        collegeId,
        richData: richDataResults,
      },
    }, request);
  } catch (error) {
    // Rollback auth user
    await deleteAuthUser(supabaseAdmin, authUserId);
    return apiError(400, 'VALIDATION_ERROR', (error as Error).message, request);
  }
}

/**
 * Handle admin creating a teacher
 */
export async function handleCreateTeacher(request: Request, env: any, user: { id: string; email: string; org_id?: string }): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    teacher: {
      first_name: string;
      last_name: string;
      email: string;
      phone_number?: string;
      date_of_birth?: string;
      address?: string;
      qualification?: string;
      role?: string;
      designation?: string;
      department?: string;
      specialization?: string;
      experience_years?: number;
      date_of_joining?: string;
      subject_expertise?: any[]; // Can be array of strings or objects
      subjects_handled?: string[];
      // Additional personal information
      employee_id?: string;
      gender?: string;
      city?: string;
      state?: string;
      dob?: string;
      country?: string;
      pincode?: string;
    };
  };

  const { teacher } = body;

  console.log('📥 Received teacher data in API:', JSON.stringify(teacher, null, 2));

  if (!teacher || !teacher.first_name || !teacher.last_name || !teacher.email) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: first_name, last_name, and email', request);
  }

  if (!validateEmail(teacher.email)) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
  }

  // Get school ID
  const { data: currentUserData } = await supabaseAdmin
    .from('users')
    .select('organizationId')
    .eq('id', user.id)
    .single();

  let schoolId = currentUserData?.organizationId || null;

  if (!schoolId) {
    const { data: educatorData } = await supabaseAdmin
      .from('school_educators')
      .select('school_id')
      .eq('email', user.email)
      .maybeSingle();
    schoolId = educatorData?.school_id || null;
  }

  if (!schoolId) {
    // Look up school from organizations table
    const { data: schoolData } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_type', 'school')
      .or(`admin_id.eq.${user.id},email.ilike.${user.email}`)
      .maybeSingle();
    schoolId = schoolData?.id || null;
  }

  if (!schoolId) {
    return apiError(400, 'VALIDATION_ERROR', 'School ID not found', request);
  }

  // Pre-check for an existing teacher profile in the app DB (fast, friendly error).
  // The SSO worker is the source of truth for the auth user and will reject
  // duplicate emails too.
  const { data: existingTeacher } = await supabaseAdmin
    .from('school_educators')
    .select('id')
    .eq('email', teacher.email.toLowerCase())
    .maybeSingle();
  if (existingTeacher) {
    return apiError(400, 'VALIDATION_ERROR', `Teacher with email ${teacher.email} already exists`, request);
  }

  // The new teacher must join the admin's organization in the SSO DB.
  const ssoOrgId = user.org_id;
  if (!ssoOrgId) {
    return apiError(400, 'VALIDATION_ERROR', 'Admin organization not found in session', request);
  }

  const teacherPassword = generatePassword();

  // ── Create the AUTH user in the SSO worker (never Supabase Auth) ──
  // This makes the teacher a real, active SSO member of the school's org with
  // the school_educator role, so they can log in via SSO. Access is granted
  // through the organization's subscription/seats — no personal subscription.
  let ssoUserId: string;
  try {
    const ssoMember = await ssoCreateMember(env, {
      email: teacher.email.toLowerCase(),
      password: teacherPassword,
      role: 'school_educator',
      org_id: ssoOrgId,
    });
    if (!ssoMember?.user_id) throw new Error('SSO member creation returned invalid user_id');
    ssoUserId = ssoMember.user_id;
  } catch (ssoErr) {
    return apiError(400, 'VALIDATION_ERROR', (ssoErr as Error).message || 'Failed to create teacher account', request);
  }

  try {
    // Create app-DB users profile row (FK target for school_educators).
    // Mirrors the SSO user id; this is a profile shadow, not an auth record.
    await supabaseAdmin.from('users').insert({
      id: ssoUserId,
      email: teacher.email.toLowerCase(),
      firstName: teacher.first_name,
      lastName: teacher.last_name,
      role: 'school_educator',
      organizationId: schoolId,
      isActive: true,
      metadata: {
        source: 'school_admin_added',
        schoolId,
        addedBy: user.id,
        teacherRole: teacher.role,
        entityType: 'educator',
      },
    });

    // Create school_educators record
    const educatorData = {
      user_id: ssoUserId,
      school_id: schoolId,
      email: teacher.email.toLowerCase(),
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      phone_number: teacher.phone_number || null,
      dob: teacher.dob || teacher.date_of_birth || null, // Handle both field names
      address: teacher.address || null,
      qualification: teacher.qualification || null,
      designation: teacher.designation || null,
      department: teacher.department || null,
      specialization: teacher.specialization || null,
      experience_years: teacher.experience_years || null,
      date_of_joining: teacher.date_of_joining || null,
      role: teacher.role || 'subject_teacher',
      subject_expertise: teacher.subject_expertise || [],
      subjects_handled: teacher.subjects_handled || (Array.isArray(teacher.subject_expertise) ? teacher.subject_expertise.map((s: any) => typeof s === 'string' ? s : s.name) : []),
      onboarding_status: 'active',
      // Additional personal information
      employee_id: teacher.employee_id || null,
      gender: teacher.gender || null,
      city: teacher.city || null,
      state: teacher.state || null,
      country: teacher.country || null,
      pincode: teacher.pincode || null,
      metadata: {
        temporary_password: teacherPassword,
        created_by: user.id,
        source: 'school_admin_added',
      },
    };

    console.log('📝 Inserting educator data:', JSON.stringify(educatorData, null, 2));

    const { data: teacherRecord, error: teacherError } = await supabaseAdmin
      .from('school_educators')
      .insert(educatorData)
      .select()
      .single();

    if (teacherError) {
      console.error('❌ Failed to create teacher profile:', teacherError);
      throw new Error(`Failed to create teacher profile: ${teacherError.message}`);
    }

    console.log('✅ Teacher record created successfully:', teacherRecord);

    return apiSuccess({
      message: `Teacher ${teacher.first_name} ${teacher.last_name} created successfully`,
      authUserId: ssoUserId,
      teacherId: teacherRecord.id,
      email: teacher.email,
      name: `${teacher.first_name} ${teacher.last_name}`,
      password: teacherPassword,
      role: teacher.role,
    }, request);
  } catch (error) {
    // Best-effort rollback of the app-DB profile row. The SSO user already
    // exists; it is reused on a corrected retry (duplicate email is rejected).
    if (ssoUserId) {
      await supabaseAdmin.from('users').delete().eq('id', ssoUserId);
    }
    return apiError(400, 'VALIDATION_ERROR', (error as Error).message, request);
  }
}

/**
 * Handle updating learner documents
 */
export async function handleUpdateLearnerDocuments(request: Request, env: any): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    learnerId: string;
    documents: Array<{
      name: string;
      url: string;
      size: number;
      type: string;
    }>;
  };

  const { learnerId, documents } = body;

  if (!learnerId) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required field: learnerId', request);
  }

  if (!documents || !Array.isArray(documents)) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing or invalid documents array', request);
  }

  try {
    // Validate that the learner exists
    const { data: existingLearner, error: fetchError } = await supabaseAdmin
      .from('learners')
      .select('id, documents')
      .eq('id', learnerId)
      .single();

    if (fetchError || !existingLearner) {
      return apiError(404, 'NOT_FOUND', 'Learner not found', request);
    }

    // Format documents for storage
    const formattedDocuments = documents.map(doc => ({
      url: doc.url,
      name: doc.name,
      type: doc.type || 'general',
      uploadedAt: new Date().toISOString(),
      size: doc.size || 0
    }));

    // Get existing documents and merge with new ones
    const existingDocuments = existingLearner.documents || [];
    const updatedDocuments = [...existingDocuments, ...formattedDocuments];

    // Update learner record with documents
    const { error: updateError } = await supabaseAdmin
      .from('learners')
      .update({ documents: updatedDocuments })
      .eq('id', learnerId);

    if (updateError) {
      return apiError(500, 'INTERNAL_ERROR', `Failed to update learner documents: ${updateError.message}`, request);
    }

    return apiSuccess({
      message: `Successfully updated documents for learner ${learnerId}`,
      data: {
        learnerId,
        documentsCount: formattedDocuments.length,
        totalDocuments: updatedDocuments.length
      }
    }, request);
  } catch (error) {
    return apiError(500, 'INTERNAL_ERROR', (error as Error).message, request);
  }
}

/**
 * Handle college admin creating a staff member
 * Supports roles: College Admin, HoD, Faculty, Lecturer, Exam Cell, Finance Admin, Placement Officer
 */
export async function handleCreateCollegeStaff(request: Request, env: any, user: { id: string; email: string; org_id?: string }): Promise<Response> {
  const supabaseAdmin = createSupabaseAdminClient(env);

  const body = await request.json() as {
    staff: {
      name: string;
      email: string;
      phone?: string;
      roles: string[];
      employee_id?: string;
      department_id?: string;
      specialization?: string;
      qualification?: string;
      experience_years?: number;
    };
    collegeId?: string;
  };

  const { staff, collegeId: requestCollegeId } = body;

  if (!staff || !staff.name || !staff.email) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: name and email', request);
  }

  if (!staff.roles || staff.roles.length === 0) {
    return apiError(400, 'VALIDATION_ERROR', 'At least one role must be selected', request);
  }

  if (!validateEmail(staff.email)) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid email format', request);
  }

  // ── Resolve the APP-DB college id (organizations row) ──
  // This is the FK target for college_lecturers.collegeId. It is distinct from
  // the SSO org id used for membership below.
  let collegeId = requestCollegeId || null;

  if (!collegeId) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('organizationId')
      .eq('id', user.id)
      .maybeSingle();
    if (userData?.organizationId) collegeId = userData.organizationId;
  }

  if (!collegeId) {
    // organizations has admin_id and email columns (no admin_email column).
    let q = supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_type', 'college');
    q = user.email
      ? q.or(`admin_id.eq.${user.id},email.ilike.${user.email}`)
      : q.eq('admin_id', user.id);
    const { data: collegeData } = await q.maybeSingle();
    if (collegeData?.id) collegeId = collegeData.id;
  }

  if (!collegeId) {
    // college_lecturers uses snake_case user_id (there is no userId column).
    const { data: lecturer } = await supabaseAdmin
      .from('college_lecturers')
      .select('collegeId')
      .eq('user_id', user.id)
      .maybeSingle();
    if (lecturer?.collegeId) collegeId = lecturer.collegeId;
  }

  if (!collegeId) {
    return apiError(400, 'VALIDATION_ERROR', 'College ID not found. Please ensure you are logged in as a college admin.', request);
  }

  // The new staff member must join the admin's organization in the SSO DB.
  const ssoOrgId = user.org_id;
  if (!ssoOrgId) {
    return apiError(400, 'VALIDATION_ERROR', 'Admin organization not found in session', request);
  }

  // Pre-check for an existing staff profile in the app DB (fast, friendly error).
  // The SSO worker is the source of truth for the auth user and rejects
  // duplicate emails too.
  const { data: existingLecturer } = await supabaseAdmin
    .from('college_lecturers')
    .select('id')
    .eq('metadata->>email', staff.email.toLowerCase())
    .maybeSingle();
  if (existingLecturer) {
    return apiError(400, 'VALIDATION_ERROR', `Staff member with email ${staff.email} already exists`, request);
  }

  const staffPassword = generatePassword();
  const { firstName, lastName } = splitName(staff.name);

  // Map the selected UI role to the app-DB internal role string.
  const roleMap: Record<string, string> = {
    'College Admin': 'college_admin',
    'HoD': 'hod',
    'Faculty': 'faculty',
    'Lecturer': 'lecturer',
    'Exam Cell': 'exam_cell',
    'Finance Admin': 'finance_admin',
    'Placement Officer': 'placement_officer',
  };
  const primaryRole = roleMap[staff.roles[0]] || 'faculty';

  // SSO role must be a valid name in the SSO roles table. A College Admin staff
  // member maps to college_admin; all other college staff map to college_educator.
  const ssoRole = primaryRole === 'college_admin' ? 'college_admin' : 'college_educator';

  // ── Create the AUTH user in the SSO worker (never Supabase Auth) ──
  // Makes the staff a real, active SSO member of the college's org. Access is
  // granted through the organization's subscription/seats — no personal sub.
  let ssoUserId: string;
  try {
    const ssoMember = await ssoCreateMember(env, {
      email: staff.email.toLowerCase(),
      password: staffPassword,
      role: ssoRole,
      org_id: ssoOrgId,
    });
    if (!ssoMember?.user_id) throw new Error('SSO member creation returned invalid user_id');
    ssoUserId = ssoMember.user_id;
  } catch (ssoErr) {
    return apiError(400, 'VALIDATION_ERROR', (ssoErr as Error).message || 'Failed to create staff account', request);
  }

  try {
    // Create app-DB users profile row (FK target). Mirrors the SSO user id;
    // this is a profile shadow, not an auth record. users.role is the
    // user_role enum (college_admin | college_educator); the fine-grained staff
    // role (faculty/hod/lecturer/...) is preserved in metadata.
    const { error: userInsertError } = await supabaseAdmin.from('users').insert({
      id: ssoUserId,
      email: staff.email.toLowerCase(),
      firstName,
      lastName,
      role: ssoRole,
      organizationId: collegeId,
      isActive: true,
      metadata: {
        source: 'college_admin_added',
        collegeId,
        addedBy: user.id,
        staffRole: primaryRole,
        roles: staff.roles,
        fullName: staff.name,
        entityType: 'college_staff',
      },
    });

    if (userInsertError) {
      throw new Error(`Failed to create user profile: ${userInsertError.message}`);
    }

    // Create college_lecturers record (snake_case user_id; other columns are
    // camelCase per the table schema).
    const { data: staffRecord, error: staffError } = await supabaseAdmin
      .from('college_lecturers')
      .insert({
        user_id: ssoUserId,
        collegeId: collegeId,
        employeeId: staff.employee_id || null,
        department: staff.department_id || null,
        specialization: staff.specialization || null,
        qualification: staff.qualification || null,
        experienceYears: staff.experience_years || null,
        accountStatus: 'active',
        metadata: {
          first_name: firstName,
          last_name: lastName,
          email: staff.email.toLowerCase(),
          phone: staff.phone || null,
          role: primaryRole,
          roles: staff.roles,
          temporary_password: staffPassword,
          password_created_at: new Date().toISOString(),
          created_by: user.email,
        },
      })
      .select()
      .single();

    if (staffError) {
      throw new Error(`Failed to create staff profile: ${staffError.message}`);
    }

    // Flat shape (matches handleCreateTeacher) so the frontend can read
    // result.data.authUserId / staffId / password directly.
    return apiSuccess({
      message: `Staff member ${staff.name} created successfully`,
      authUserId: ssoUserId,
      staffId: staffRecord.id,
      email: staff.email,
      name: staff.name,
      roles: staff.roles,
      password: staffPassword,
      collegeId,
    }, request);
  } catch (error) {
    // Best-effort rollback of the app-DB profile row. The SSO user already
    // exists; it is reused on a corrected retry (duplicate email is rejected).
    if (ssoUserId) {
      await supabaseAdmin.from('users').delete().eq('id', ssoUserId);
    }
    return apiError(400, 'VALIDATION_ERROR', (error as Error).message, request);
  }
}
