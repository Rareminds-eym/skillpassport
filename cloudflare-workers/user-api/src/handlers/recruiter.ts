/**
 * Recruiter signup handlers
 * - Recruiter Admin signup (creates company)
 * - Recruiter signup (joins existing company)
 */

import { Env, RecruiterAdminSignupRequest, RecruiterSignupRequest } from '../types';
import { jsonResponse, validateEmail, splitName } from '../utils/helpers';
import { getSupabaseAdmin, checkEmailExists, deleteAuthUser } from '../utils/supabase';
import { sendWelcomeEmail } from '../utils/email';

/**
 * Handle recruiter admin signup with company creation
 */
export async function handleRecruiterAdminSignup(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as RecruiterAdminSignupRequest;

    const requiredFields = ['email', 'password', 'companyName', 'companyCode', 'contactPersonName'];
    for (const field of requiredFields) {
      if (!body[field as keyof RecruiterAdminSignupRequest]) {
        return jsonResponse({ error: `Missing required field: ${field}` }, 400);
      }
    }

    if (!validateEmail(body.email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400);
    }

    if (body.password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
    }

    if (await checkEmailExists(supabaseAdmin, body.email)) {
      return jsonResponse({ error: 'An account with this email already exists' }, 400);
    }

    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('code', body.companyCode)
      .maybeSingle();

    if (existingCompany) {
      return jsonResponse({ error: 'Company code already exists' }, 400);
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email.toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        name: body.contactPersonName,
        role: 'recruiter_admin',
        phone: body.phone || body.contactPersonPhone,
      },
    });

    if (authError || !authUser.user) {
      return jsonResponse({ error: authError?.message || 'Failed to create account' }, 500);
    }

    const userId = authUser.user.id;

    try {
      const { firstName, lastName } = splitName(body.contactPersonName);

      await supabaseAdmin.from('users').insert({
        id: userId,
        email: body.email.toLowerCase(),
        firstName,
        lastName,
        role: 'recruiter_admin',
        organizationId: null,
        isActive: true,
        phone: body.phone || body.contactPersonPhone,
        metadata: { source: 'recruiter_admin_signup', companyCode: body.companyCode },
      });

      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({
          name: body.companyName,
          code: body.companyCode,
          email: body.email.toLowerCase(),
          phone: body.phone,
          website: body.website,
          industry: body.industry,
          company_size: body.companySize,
          hq_address: body.hqAddress,
          hq_city: body.hqCity,
          hq_state: body.hqState,
          hq_country: body.hqCountry || 'India',
          hq_pincode: body.hqPincode,
          established_year: body.establishedYear,
          contact_person_name: body.contactPersonName,
          contact_person_designation: body.contactPersonDesignation,
          contact_person_email: body.contactPersonEmail || body.email,
          contact_person_phone: body.contactPersonPhone || body.phone,
          account_status: 'pending',
          approval_status: 'pending',
          created_by: userId,
        })
        .select()
        .single();

      if (companyError || !company) {
        throw new Error(`Failed to create company: ${companyError?.message}`);
      }

      await supabaseAdmin.from('users').update({ organizationId: company.id }).eq('id', userId);

      // Create recruiter record for the admin
      await supabaseAdmin.from('recruiters').insert({
        user_id: userId,
        company_id: company.id,
        name: body.contactPersonName,
        email: body.email.toLowerCase(),
        phone: body.phone || body.contactPersonPhone,
        designation: body.contactPersonDesignation || 'Admin',
        is_admin: true,
        verificationstatus: 'pending',
        isactive: true,
        approval_status: 'pending',
        account_status: 'active',
      });

      await sendWelcomeEmail(
        env,
        body.email,
        body.contactPersonName,
        body.password,
        'recruiter_admin',
        `<strong>Company:</strong> ${body.companyName}`
      );

      return jsonResponse({
        success: true,
        message: 'Recruiter admin account created successfully! Please check your email for login details.',
        data: {
          userId,
          companyId: company.id,
          companyName: company.name,
          companyCode: company.code,
          email: body.email,
          role: 'recruiter_admin',
        },
      });
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('Recruiter admin signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create recruiter admin account' },
      500
    );
  }
}

/**
 * Handle recruiter signup (joins existing company)
 */
export async function handleRecruiterSignup(request: Request, env: Env): Promise<Response> {
  const supabaseAdmin = getSupabaseAdmin(env);

  try {
    const body = (await request.json()) as RecruiterSignupRequest;

    if (!body.email || !body.password || !body.name || !body.companyId) {
      return jsonResponse(
        { error: 'Missing required fields: email, password, name, companyId' },
        400
      );
    }

    if (!validateEmail(body.email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400);
    }

    if (body.password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
    }

    if (await checkEmailExists(supabaseAdmin, body.email)) {
      return jsonResponse({ error: 'An account with this email already exists' }, 400);
    }

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', body.companyId)
      .single();

    if (companyError || !company) {
      return jsonResponse({ error: 'Invalid company selected' }, 400);
    }

    // Check if recruiter already exists
    const { data: existingRecruiter } = await supabaseAdmin
      .from('recruiters')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .maybeSingle();

    if (existingRecruiter) {
      return jsonResponse({ error: 'A recruiter with this email already exists' }, 400);
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email.toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        name: body.name,
        role: 'recruiter',
        phone: body.phone,
        company_id: body.companyId,
      },
    });

    if (authError || !authUser.user) {
      return jsonResponse({ error: authError?.message || 'Failed to create account' }, 500);
    }

    const userId = authUser.user.id;

    try {
      const { firstName, lastName } = splitName(body.name);

      await supabaseAdmin.from('users').insert({
        id: userId,
        email: body.email.toLowerCase(),
        firstName,
        lastName,
        role: 'recruiter',
        organizationId: body.companyId,
        isActive: true,
        phone: body.phone,
        metadata: { source: 'recruiter_signup', companyId: body.companyId },
      });

      const { data: recruiter, error: recruiterError } = await supabaseAdmin
        .from('recruiters')
        .insert({
          user_id: userId,
          company_id: body.companyId,
          name: body.name,
          email: body.email.toLowerCase(),
          phone: body.phone,
          designation: body.designation,
          department: body.department,
          is_admin: false,
          verificationstatus: 'pending',
          isactive: true,
          approval_status: 'pending',
          account_status: 'active',
          metadata: { source: 'self_signup' },
        })
        .select()
        .single();

      if (recruiterError || !recruiter) {
        throw new Error(`Failed to create recruiter profile: ${recruiterError?.message}`);
      }

      await sendWelcomeEmail(
        env,
        body.email,
        body.name,
        body.password,
        'recruiter',
        `<strong>Company:</strong> ${company.name}`
      );

      return jsonResponse({
        success: true,
        message: 'Recruiter account created successfully!',
        data: {
          userId,
          recruiterId: recruiter.id,
          email: body.email,
          name: body.name,
          companyId: body.companyId,
          companyName: company.name,
          role: 'recruiter',
        },
      });
    } catch (error) {
      console.error('Rollback: deleting auth user due to error:', error);
      await deleteAuthUser(supabaseAdmin, userId);
      throw error;
    }
  } catch (error) {
    console.error('Recruiter signup error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to create recruiter account' },
      500
    );
  }
}
