// Simplified data import function without xlsx dependency
// This version works with JSON data and can be extended later

import { getCorsHeaders, handleRequest } from '../../lib/cors'

export const onRequestOptions = (context: any) => {
  const origin = context.request.headers.get('Origin')
  return new Response(null, {
    headers: getCorsHeaders(origin),
  })
}

export const onRequestPost = (context: any) =>
  handleRequest(context, async ({ request, env }) => {
    const origin = request.headers.get('Origin')
    const corsHeaders = getCorsHeaders(origin)
    const { searchParams } = new URL(request.url)
    const environment = searchParams.get('env') || 'local'
    
    // Force local-only mode if FORCE_LOCAL_ONLY is set
    if (env.FORCE_LOCAL_ONLY === 'true') {
      console.log('🔒 FORCE_LOCAL_ONLY mode - using local databases only')
      if (environment === 'production') {
        return new Response(JSON.stringify({ 
          error: 'Production access disabled', 
          details: 'FORCE_LOCAL_ONLY mode is active. Use local environment for testing.' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }
    
    let formData: FormData
    let file: File | null = null
    let dataType: string | null = null
    
    try {
      // Handle multipart form data parsing with better error handling
      const contentType = request.headers.get('content-type') || ''
      console.log('[data-import] Content-Type:', contentType)
      console.log('[data-import] Headers:', Object.fromEntries(request.headers.entries()))
      
      if (!contentType.includes('multipart/form-data')) {
        throw new Error('Content-Type must be multipart/form-data for file uploads')
      }
      
      // Try to parse form data directly without cloning
      try {
        formData = await request.formData()
        console.log('[data-import] Form data parsed successfully')
      } catch (formError: any) {
        console.error('[data-import] FormData parsing failed:', formError.message)
        
        // Fallback: try to parse as blob and handle manually
        const body = await request.blob()
        console.log('[data-import] Body size:', body.size)
        
        // For now, return a more helpful error message
        throw new Error(`FormData parsing failed: ${formError.message}. Body size: ${body.size} bytes`)
      }
      
      file = formData.get('file') as File
      dataType = formData.get('dataType') as string
      
      console.log('[data-import] File:', file ? file.name : 'No file')
      console.log('[data-import] Data type:', dataType)
      
    } catch (parseError: any) {
      console.error('[data-import] Form parsing error:', parseError.message)
      return new Response(JSON.stringify({ 
        error: 'Form parsing failed', 
        details: parseError.message + '. Please ensure you are uploading a file via the web interface.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
    
    if (!file) {
      console.error('[data-import] No file provided in form data')
      return new Response(JSON.stringify({ 
        error: 'No file provided',
        details: 'Please select a CSV file to upload'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
    
    if (!dataType) {
      console.error('[data-import] No dataType provided in form data')
      return new Response(JSON.stringify({ 
        error: 'No data type provided',
        details: 'Please specify whether you are uploading universities, colleges, or students data'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log(`[data-import] Processing ${dataType} file: ${file.name} (${file.size} bytes)`)

    try {
      // For now, we'll accept CSV files or JSON files
      const text = await file.text()
      let data: any[]
      
      if (file.name.endsWith('.json')) {
        try {
          data = JSON.parse(text)
        } catch (jsonError: any) {
          return new Response(JSON.stringify({ 
            error: 'Invalid JSON format', 
            details: jsonError.message 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          })
        }
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text)
      } else {
        return new Response(JSON.stringify({ 
          error: 'Unsupported file format', 
          details: 'Please upload CSV or JSON files. Excel support coming soon.' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      // Validate data - return 400 for validation errors
      let validatedData: any[]
      try {
        validatedData = validateData(data, dataType)
      } catch (validationError: any) {
        console.error('Validation error:', validationError.message)
        return new Response(JSON.stringify({ 
          error: 'Validation failed', 
          details: validationError.message 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
      
      // Import data (simplified for now)
      const result = await importData(validatedData, dataType, environment, env)
      
      return new Response(JSON.stringify({
        success: true,
        message: `Successfully imported ${data.length} ${dataType} records to ${environment} environment`,
        data: result
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })

    } catch (error: any) {
      console.error('Import error:', error)
      return new Response(JSON.stringify({ 
        error: 'Import failed', 
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
  })

export const onRequestGet = (context: any) =>
  handleRequest(context, async ({ request }) => {
    const origin = request.headers.get('Origin')
    const corsHeaders = getCorsHeaders(origin)
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const dataType = searchParams.get('dataType')
    
    if (action === 'template' && dataType) {
      // Generate CSV template
      const csvTemplate = generateCSVTemplate(dataType)
      return new Response(csvTemplate, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${dataType}-template.csv"`,
          ...corsHeaders
        }
      })
    }
    
    return new Response(JSON.stringify({ 
      status: 'ok',
      message: 'Data Import API is running',
      note: 'Excel support temporarily disabled due to build issues. Use CSV files for now.',
      endpoints: {
        upload: 'POST /api/data-import?env=local',
        template: 'GET /api/data-import?action=template&dataType={type}'
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  })

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  
  console.log('[data-import] CSV Headers:', headers)
  console.log('[data-import] relationship_type header index:', headers.indexOf('relationship_type'))
  
  return lines.slice(1).map((line, index) => {
    // Handle CSV parsing with proper quote handling
    const values = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    
    // Add the last value
    values.push(current.trim().replace(/^"|"$/g, ''))
    
    const row: any = {}
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] || ''
    })
    
    console.log(`[data-import] Row ${index + 1} parsed:`, row)
    console.log(`[data-import] Row ${index + 1} relationship_type:`, JSON.stringify(row.relationship_type))
    return row
  })
}

function validateData(data: any[], dataType: string): any[] {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array')
  }
  
  if (data.length === 0) {
    throw new Error('No data found in file')
  }
  
  console.log(`[data-import] Validating ${data.length} records for type: ${dataType}`)
  console.log('[data-import] First record fields:', Object.keys(data[0]))
  
  // Enhanced validation based on university-college mapping system
  const requiredFields: { [key: string]: string[] } = {
    universities: [
      'organization_type', 'organization_name', 'relationship_type', 
      'admin_email', 'admin_password', 'country', 'state', 'city'
    ],
    colleges: [
      'organization_type', 'organization_name', 'relationship_type',
      'admin_email', 'admin_password', 'country', 'state', 'city'
    ],
    students: [
      'name', 'email'
    ]
  }
  
  const required = requiredFields[dataType] || []
  
  console.log(`[data-import] Required fields for ${dataType}:`, required)
  
  data.forEach((row, index) => {
    // Check required fields
    required.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        console.error(`[data-import] Row ${index + 1} missing field '${field}':`, row)
        throw new Error(`Missing required field '${field}' in row ${index + 1}`)
      }
    })
    
    // University/College specific validation
    if (dataType === 'universities' || dataType === 'colleges') {
      // Validate organization type
      const orgType = row.organization_type?.toLowerCase();
      if (dataType === 'universities' && orgType !== 'university') {
        throw new Error(`Row ${index + 1}: organization_type must be 'university' for universities data type`)
      }
      if (dataType === 'colleges' && orgType !== 'college') {
        throw new Error(`Row ${index + 1}: organization_type must be 'college' for colleges data type`)
      }
      
      // Validate relationship type
      const relationshipType = row.relationship_type?.toLowerCase();
      const validRelationshipTypes = ['standalone', 'parent', 'affiliated'];
      
      console.log(`[data-import] Row ${index + 1} relationship_type validation:`);
      console.log(`[data-import]   Raw value: "${row.relationship_type}"`);
      console.log(`[data-import]   Lowercase: "${relationshipType}"`);
      console.log(`[data-import]   Valid types: ${JSON.stringify(validRelationshipTypes)}`);
      
      if (!relationshipType || !validRelationshipTypes.includes(relationshipType)) {
        throw new Error(`Row ${index + 1}: relationship_type must be one of: ${validRelationshipTypes.join(', ')}. Got: "${row.relationship_type}" (${typeof row.relationship_type})`)
      }
      
      // Validate university-college mapping logic
      const isAffiliatedCollege = row.is_affiliated_college?.toLowerCase() === 'true';
      
      if (relationshipType === 'affiliated' && !isAffiliatedCollege) {
        throw new Error(`Row ${index + 1}: affiliated organizations must have is_affiliated_college = TRUE`)
      }
      
      if (relationshipType === 'affiliated' && (!row.parent_university_name || row.parent_university_name.trim() === '')) {
        throw new Error(`Row ${index + 1}: affiliated colleges must specify parent_university_name`)
      }
      
      if (relationshipType === 'parent' && orgType !== 'university') {
        throw new Error(`Row ${index + 1}: only universities can be parent institutions`)
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.admin_email)) {
        throw new Error(`Row ${index + 1}: invalid admin_email format`)
      }
      
      // Validate password strength
      if (row.admin_password && row.admin_password.length < 10) {
        throw new Error(`Row ${index + 1}: admin_password must be at least 10 characters`)
      }
    }
  })
  
  return data
}

async function importData(data: any[], dataType: string, environment: string, env: any) {
  const results: any[] = [];
  
  console.log(`[data-import] Starting import of ${data.length} ${dataType} records to ${environment} environment`);
  
  // Process each record
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      let result: any = null;
      let retries = 0;
      const maxRetries = 3;
      
      // Retry logic for rate limiting
      while (retries <= maxRetries) {
        try {
          if (dataType === 'universities') {
            result = await createUniversityViaSSO(row, env);
          } else if (dataType === 'colleges') {
            result = await createCollegeViaSSO(row, env);
          } else if (dataType === 'students') {
            // Students would be handled differently - creating user accounts
            result = await createStudentViaSSO(row, env);
          } else {
            throw new Error(`Unsupported data type: ${dataType}`);
          }
          
          // Success - break out of retry loop
          break;
          
        } catch (error: any) {
          if (error.message.includes('Too many requests') && retries < maxRetries) {
            retries++;
            const delayTime = retries * 5000; // Exponential backoff: 5s, 10s, 15s
            console.log(`[data-import] Rate limited, retrying in ${delayTime/1000}s... (attempt ${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delayTime));
          } else {
            throw error; // Re-throw if not rate limited or max retries exceeded
          }
        }
      }
      
      results.push({
        success: true,
        data: row,
        result: result,
        message: `${dataType.slice(0, -1)} created successfully`
      });
      
      console.log(`[data-import] ✅ Successfully created ${dataType.slice(0, -1)}: ${row.organization_name || row.name || row.email}`);
      
    } catch (error: any) {
      console.error(`[data-import] ❌ Failed to create ${dataType.slice(0, -1)}:`, error.message);
      
      results.push({
        success: false,
        data: row,
        error: error.message,
        message: `Failed to create ${dataType.slice(0, -1)}`
      });
    }
    
    // Add delay between requests to avoid rate limiting
    if (i < data.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Increased delay to 3 seconds
    }
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  return {
    processed: data.length,
    successful,
    failed,
    environment,
    results,
    message: `Successfully imported ${successful}/${data.length} ${dataType} records${failed > 0 ? ` (${failed} failed)` : ''}`
  };
}

// Helper function to create university via SSO API
async function createUniversityViaSSO(data: any, env: any): Promise<any> {
  console.log('[data-import] Creating university via SSO database directly');
  
  const dbConfig = getDbConfig('local', env);
  const password = data.admin_password || generateTempPassword();
  
  // Generate password hash using a simple approach (in real implementation, use proper bcrypt)
  const passwordHash = await hashPassword(password);
  
  try {
    // Step 1: Create user in SSO database
    console.log('[data-import] Creating user in SSO database...');
    
    const userData = {
      email: data.admin_email,
      password_hash: passwordHash,
      is_email_verified: true, // Auto-verify email for admin-created accounts
      created_at: new Date().toISOString(),
      is_blocked: false
    };
    
    const userResponse = await fetch(`${dbConfig.ssoUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dbConfig.ssoKey}`,
        'apikey': dbConfig.ssoKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(userData)
    });
    
    if (!userResponse.ok) {
      const userError = await userResponse.text();
      throw new Error(`Failed to create user in SSO database: ${userError}`);
    }
    
    const userResult = await userResponse.json();
    const userId = userResult[0]?.id;
    
    if (!userId) {
      throw new Error('User creation failed - no user ID returned');
    }
    
    console.log('[data-import] ✅ User created in SSO database:', userId);
    
    // Step 2: Create organization in SSO database
    console.log('[data-import] Creating organization in SSO database...');
    
    const orgData = {
      name: data.organization_name,
      slug: generateSlug(data.organization_name),
      created_at: new Date().toISOString()
    };
    
    const orgResponse = await fetch(`${dbConfig.ssoUrl}/rest/v1/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dbConfig.ssoKey}`,
        'apikey': dbConfig.ssoKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orgData)
    });
    
    if (!orgResponse.ok) {
      const orgError = await orgResponse.text();
      throw new Error(`Failed to create organization in SSO database: ${orgError}`);
    }
    
    const orgResult = await orgResponse.json();
    const orgId = orgResult[0]?.id;
    
    if (!orgId) {
      throw new Error('Organization creation failed - no org ID returned');
    }
    
    console.log('[data-import] ✅ Organization created in SSO database:', orgId);
    
    // Step 3: Create membership (user-organization relationship)
    console.log('[data-import] Creating membership...');
    
    const membershipData = {
      user_id: userId,
      org_id: orgId,
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    const membershipResponse = await fetch(`${dbConfig.ssoUrl}/rest/v1/memberships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dbConfig.ssoKey}`,
        'apikey': dbConfig.ssoKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(membershipData)
    });
    
    if (!membershipResponse.ok) {
      const membershipError = await membershipResponse.text();
      throw new Error(`Failed to create membership: ${membershipError}`);
    }
    
    const membershipResult = await membershipResponse.json();
    const membershipId = membershipResult[0]?.id;
    
    console.log('[data-import] ✅ Membership created:', membershipId);
    
    // Step 4: Assign university_admin role
    console.log('[data-import] Assigning university_admin role...');
    
    // First, find the university_admin role ID
    const rolesResponse = await fetch(`${dbConfig.ssoUrl}/rest/v1/roles?name=eq.university_admin`, {
      headers: {
        'Authorization': `Bearer ${dbConfig.ssoKey}`,
        'apikey': dbConfig.ssoKey
      }
    });
    
    if (!rolesResponse.ok) {
      throw new Error('Failed to fetch university_admin role');
    }
    
    const roles = await rolesResponse.json();
    if (roles.length === 0) {
      throw new Error('university_admin role not found in SSO database');
    }
    
    const universityAdminRoleId = roles[0].id;
    console.log('[data-import] Found university_admin role ID:', universityAdminRoleId);
    
    // Assign the role to the membership
    const membershipRoleData = {
      membership_id: membershipId,
      role_id: universityAdminRoleId,
      created_at: new Date().toISOString()
    };
    
    const membershipRoleResponse = await fetch(`${dbConfig.ssoUrl}/rest/v1/membership_roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dbConfig.ssoKey}`,
        'apikey': dbConfig.ssoKey
      },
      body: JSON.stringify(membershipRoleData)
    });
    
    if (!membershipRoleResponse.ok) {
      const roleError = await membershipRoleResponse.text();
      console.error('[data-import] Failed to assign role:', roleError);
      // Don't throw error - user and org were created successfully
    } else {
      console.log('[data-import] ✅ University admin role assigned successfully');
    }
    
    return {
      type: 'university',
      sso_user_id: userId,
      sso_org_id: orgId,
      org_slug: orgData.slug,
      admin_email: data.admin_email,
      organization_name: data.organization_name,
      relationship_type: data.relationship_type,
      temp_password: password !== data.admin_password ? password : '[provided]',
      email_verified: true
    };
    
  } catch (error: any) {
    throw new Error(`SSO database error: ${error.message}`);
  }
}

// Helper function to create college via SSO API  
async function createCollegeViaSSO(data: any, env: any): Promise<any> {
  console.log('[data-import] Creating college via SSO database directly');
  
  const dbConfig = getDbConfig('local', env);
  const password = data.admin_password || generateTempPassword();
  
  // Generate password hash using a simple approach (in real implementation, use proper bcrypt)
  const passwordHash = await hashPassword(password);
  
  try {
    // Step 1: Create user in SSO database
    console.log('[data-import] Creating user in SSO database...');
    
    const userData = {
      email: data.admin_email,
      password_hash: passwordHash,
      is_email_verified: true, // Auto-verify email for admin-created accounts
      created_at: new Date().toISOString(),
      is_blocked: false
    };
    
    const userResponse = await fetch(`${dbConfig.ssoUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dbConfig.ssoKey}`,
        'apikey': dbConfig.ssoKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(userData)
    });
    
    if (!userResponse.ok) {
      const userError = await userResponse.text();
      throw new Error(`Failed to create user in SSO database: ${userError}`);
    }
    
    const userResult = await userResponse.json();
    const userId = userResult[0]?.id;
    
    if (!userId) {
      throw new Error('User creation failed - no user ID returned');
    }
    
    console.log('[data-import] ✅ User created in SSO database:', userId);
    
    // Step 2: Create organization in SSO database
    console.log('[data-import] Creating organization in SSO database...');
    
    const orgData = {
      name: data.organization_name,
      slug: generateSlug(data.organization_name),
      created_at: new Date().toISOString()
    };
    
    const orgResponse = await fetch(`${dbConfig.ssoUrl}/rest/v1/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dbConfig.ssoKey}`,
        'apikey': dbConfig.ssoKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orgData)
    });
    
    if (!orgResponse.ok) {
      const orgError = await orgResponse.text();
      throw new Error(`Failed to create organization in SSO database: ${orgError}`);
    }
    
    const orgResult = await orgResponse.json();
    const orgId = orgResult[0]?.id;
    
    if (!orgId) {
      throw new Error('Organization creation failed - no org ID returned');
    }
    
    console.log('[data-import] ✅ Organization created in SSO database:', orgId);
    
    // Step 3: Create membership (user-organization relationship)
    console.log('[data-import] Creating membership...');
    
    const membershipData = {
      user_id: userId,
      org_id: orgId,
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    const membershipResponse = await fetch(`${dbConfig.ssoUrl}/rest/v1/memberships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dbConfig.ssoKey}`,
        'apikey': dbConfig.ssoKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(membershipData)
    });
    
    if (!membershipResponse.ok) {
      const membershipError = await membershipResponse.text();
      throw new Error(`Failed to create membership: ${membershipError}`);
    }
    
    const membershipResult = await membershipResponse.json();
    const membershipId = membershipResult[0]?.id;
    
    console.log('[data-import] ✅ Membership created:', membershipId);
    
    // Step 4: Assign college_admin role
    console.log('[data-import] Assigning college_admin role...');
    
    // First, find the college_admin role ID
    const rolesResponse = await fetch(`${dbConfig.ssoUrl}/rest/v1/roles?name=eq.college_admin`, {
      headers: {
        'Authorization': `Bearer ${dbConfig.ssoKey}`,
        'apikey': dbConfig.ssoKey
      }
    });
    
    if (!rolesResponse.ok) {
      throw new Error('Failed to fetch college_admin role');
    }
    
    const roles = await rolesResponse.json();
    if (roles.length === 0) {
      throw new Error('college_admin role not found in SSO database');
    }
    
    const collegeAdminRoleId = roles[0].id;
    console.log('[data-import] Found college_admin role ID:', collegeAdminRoleId);
    
    // Assign the role to the membership
    const membershipRoleData = {
      membership_id: membershipId,
      role_id: collegeAdminRoleId,
      created_at: new Date().toISOString()
    };
    
    const membershipRoleResponse = await fetch(`${dbConfig.ssoUrl}/rest/v1/membership_roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dbConfig.ssoKey}`,
        'apikey': dbConfig.ssoKey
      },
      body: JSON.stringify(membershipRoleData)
    });
    
    if (!membershipRoleResponse.ok) {
      const roleError = await membershipRoleResponse.text();
      console.error('[data-import] Failed to assign role:', roleError);
      // Don't throw error - user and org were created successfully
    } else {
      console.log('[data-import] ✅ College admin role assigned successfully');
    }
    
    return {
      type: 'college',
      sso_user_id: userId,
      sso_org_id: orgId,
      org_slug: orgData.slug,
      admin_email: data.admin_email,
      organization_name: data.organization_name,
      relationship_type: data.relationship_type,
      parent_university_name: data.parent_university_name || null,
      temp_password: password !== data.admin_password ? password : '[provided]',
      email_verified: true
    };
    
  } catch (error: any) {
    throw new Error(`SSO database error: ${error.message}`);
  }
}

// Helper function to create student via SSO API
async function createStudentViaSSO(data: any, env: any): Promise<any> {
  if (env.SSO_SERVICE) {
    console.log('[data-import] Using SSO service binding for student creation');
    
    // Use the signup-member endpoint for students (no organization required)
    const signupData = {
      email: data.email,
      password: data.password || generateTempPassword(),
      full_name: data.name,
      role: 'learner' // Students are learners in the system
    };
    
    try {
      // Step 1: Create user in SSO database
      const request = new Request('http://internal/auth/signup-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });
      
      console.log('[data-import] Calling SSO signup-member with:', JSON.stringify(signupData));
      const response = await env.SSO_SERVICE.fetch(request);
      console.log('[data-import] SSO response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`SSO member signup failed: ${errorData.error || response.statusText}`);
      }
      
      const ssoResult = await response.json();
      const ssoUserId = ssoResult.user?.id;
      
      if (!ssoUserId) {
        throw new Error('SSO user creation failed - no user ID returned');
      }
      
      // Step 2: Create user record in SkillPassport database
      console.log('[data-import] Creating user record in SkillPassport database');
      
      const dbConfig = getDbConfig('local', env);
      
      // Split name into first and last name
      const nameParts = data.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Create user record first
      try {
        const userData = {
          id: ssoUserId, // Use the same ID from SSO
          email: data.email,
          firstName: firstName,
          lastName: lastName,
          role: 'learner',
          isActive: true,
          organizationId: null, // Can be set later if needed
          metadata: {
            imported_via: 'data_import',
            import_date: new Date().toISOString(),
            college_name: data.college_name || null,
            university_name: data.university_name || null
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const userResponse = await fetch(`${dbConfig.skillpassportUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dbConfig.skillpassportKey}`,
            'apikey': dbConfig.skillpassportKey
          },
          body: JSON.stringify(userData)
        });
        
        if (userResponse.ok) {
          console.log('[data-import] ✅ User record created successfully');
        } else {
          const userError = await userResponse.text();
          console.error('[data-import] Failed to create user record:', userError);
        }
      } catch (userError: any) {
        console.error('[data-import] User record creation error:', userError.message);
      }
      
      // Step 3: Create learner profile in SkillPassport database
      console.log('[data-import] Creating learner profile in SkillPassport database');
      
      let learnerId: string | null = null;
      
      try {
        // Create learner profile
        const learnerData = {
          email: data.email,
          name: data.name,
          enrollmentNumber: data.enrollment_number || null,
          registration_number: data.admission_number || null, // Fixed: use registration_number, not registrationNumber
          contact_number: data.contact_number || null, // Fixed: use contact_number, not contactNumber  
          date_of_birth: data.date_of_birth || null, // Fixed: use date_of_birth, not dateOfBirth
          gender: data.gender || null,
          branch_field: data.course_name || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country || null,
          pincode: data.pincode || null,
          guardianName: data.guardian_name || null,
          guardianPhone: data.guardian_phone || null,
          guardianEmail: data.guardian_email || null,
          guardianRelation: data.guardian_relation || null,
          currentCgpa: data.current_cgpa ? parseFloat(data.current_cgpa) : null,
          college_school_name: data.college_name || null,
          university: data.university_name || null,
          learner_type: data.learner_type || 'university', // Add learner_type
          approval_status: 'approved', // Add approval_status
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Make API call to create learner profile with Prefer header to get response
        const learnerResponse = await fetch(`${dbConfig.skillpassportUrl}/rest/v1/learners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dbConfig.skillpassportKey}`,
            'apikey': dbConfig.skillpassportKey,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(learnerData)
        });
        
        if (!learnerResponse.ok) {
          const learnerError = await learnerResponse.text();
          console.error('[data-import] Failed to create learner profile:', learnerError);
          // Don't throw error here - SSO user was created successfully
        } else {
          const learnerResult = await learnerResponse.json();
          learnerId = learnerResult[0]?.id || null;
          console.log('[data-import] ✅ Learner profile created successfully, ID:', learnerId);
        }
        
      } catch (dbError: any) {
        console.error('[data-import] Database sync error:', dbError.message);
        // Don't throw error - SSO user creation was successful
      }
      
      // Step 4: Add rich profile data (experience, projects, certificates, education, skills)
      // Only if learner profile was created successfully
      if (learnerId) {
        await addRichProfileData(learnerId, data, dbConfig);
      } else {
        console.log('[data-import] ⚠️  Skipping rich profile data - learner profile not created');
      }
      
      return {
        type: 'student',
        sso_user_id: ssoUserId,
        email: data.email,
        name: data.name,
        enrollment_number: data.enrollment_number || null,
        admission_number: data.admission_number || null,
        course_name: data.course_name || null,
        college_name: data.college_name || null,
        university_name: data.university_name || null,
        temp_password: signupData.password !== data.password ? signupData.password : '[provided]',
        note: 'Student account created with full profile including experience, projects, certificates, education, and skills'
      };
      
    } catch (error: any) {
      throw new Error(`SSO service error: ${error.message}`);
    }
  } else {
    throw new Error('SSO_SERVICE binding not configured. Cannot create student accounts.');
  }
}

// Helper function to add rich profile data (experience, projects, certificates, education, skills)
async function addRichProfileData(learnerId: string, data: any, dbConfig: any): Promise<void> {
  console.log('[data-import] Adding rich profile data for learner:', learnerId);
  
  const results = {
    experience: 0,
    projects: 0,
    certificates: 0,
    education: 0,
    skills: 0
  };
  
  // Add Experience entries (supports up to 5 experiences)
  for (let i = 1; i <= 5; i++) {
    const expPrefix = `experience_${i}_`;
    if (data[`${expPrefix}organization`] && data[`${expPrefix}role`]) {
      try {
        const experienceData = {
          learner_id: learnerId,
          organization: data[`${expPrefix}organization`],
          role: data[`${expPrefix}role`],
          start_date: data[`${expPrefix}start_date`] || null,
          end_date: data[`${expPrefix}end_date`] || null,
          description: data[`${expPrefix}description`] || null,
          approval_status: 'approved',
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`[data-import] Creating experience ${i}:`, experienceData);
        
        const expResponse = await fetch(`${dbConfig.skillpassportUrl}/rest/v1/experience`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dbConfig.skillpassportKey}`,
            'apikey': dbConfig.skillpassportKey
          },
          body: JSON.stringify(experienceData)
        });
        
        if (expResponse.ok) {
          results.experience++;
          console.log(`[data-import] ✅ Added experience ${i}: ${experienceData.role} at ${experienceData.organization}`);
        } else {
          const expError = await expResponse.text();
          console.error(`[data-import] Failed to add experience ${i} (${expResponse.status}):`, expError);
        }
      } catch (error: any) {
        console.error(`[data-import] Failed to add experience ${i}:`, error.message);
      }
    } else {
      console.log(`[data-import] Skipping experience ${i}: missing organization or role`);
    }
  }
  
  // Add Project entries (supports up to 5 projects)
  for (let i = 1; i <= 5; i++) {
    const projPrefix = `project_${i}_`;
    if (data[`${projPrefix}title`]) {
      try {
        const projectData = {
          learner_id: learnerId,
          title: data[`${projPrefix}title`],
          description: data[`${projPrefix}description`] || null,
          start_date: data[`${projPrefix}start_date`] || null,
          end_date: data[`${projPrefix}end_date`] || null,
          tech_stack: data[`${projPrefix}tech_stack`] ? data[`${projPrefix}tech_stack`].split(',') : [],
          demo_link: data[`${projPrefix}demo_link`] || null,
          github_link: data[`${projPrefix}github_link`] || null,
          role: data[`${projPrefix}role`] || null,
          approval_status: 'approved',
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`[data-import] Creating project ${i}:`, projectData);
        
        const projResponse = await fetch(`${dbConfig.skillpassportUrl}/rest/v1/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dbConfig.skillpassportKey}`,
            'apikey': dbConfig.skillpassportKey
          },
          body: JSON.stringify(projectData)
        });
        
        if (projResponse.ok) {
          results.projects++;
          console.log(`[data-import] ✅ Added project ${i}: ${projectData.title}`);
        } else {
          const projError = await projResponse.text();
          console.error(`[data-import] Failed to add project ${i} (${projResponse.status}):`, projError);
        }
      } catch (error: any) {
        console.error(`[data-import] Failed to add project ${i}:`, error.message);
      }
    } else {
      console.log(`[data-import] Skipping project ${i}: missing title`);
    }
  }
  
  // Add Certificate entries (supports up to 5 certificates)
  for (let i = 1; i <= 5; i++) {
    const certPrefix = `certificate_${i}_`;
    if (data[`${certPrefix}title`]) {
      try {
        const certificateData = {
          learner_id: learnerId,
          title: data[`${certPrefix}title`],
          issuer: data[`${certPrefix}issuer`] || null,
          issued_on: data[`${certPrefix}issued_on`] || null,
          credential_id: data[`${certPrefix}credential_id`] || null,
          link: data[`${certPrefix}link`] || null,
          platform: data[`${certPrefix}platform`] || null,
          approval_status: 'approved',
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`[data-import] Creating certificate ${i}:`, certificateData);
        
        const certResponse = await fetch(`${dbConfig.skillpassportUrl}/rest/v1/certificates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dbConfig.skillpassportKey}`,
            'apikey': dbConfig.skillpassportKey
          },
          body: JSON.stringify(certificateData)
        });
        
        if (certResponse.ok) {
          results.certificates++;
          console.log(`[data-import] ✅ Added certificate ${i}: ${certificateData.title}`);
        } else {
          const certError = await certResponse.text();
          console.error(`[data-import] Failed to add certificate ${i} (${certResponse.status}):`, certError);
        }
      } catch (error: any) {
        console.error(`[data-import] Failed to add certificate ${i}:`, error.message);
      }
    } else {
      console.log(`[data-import] Skipping certificate ${i}: missing title`);
    }
  }
  
  // Add Education entries (supports up to 5 education records)
  for (let i = 1; i <= 5; i++) {
    const eduPrefix = `education_${i}_`;
    if (data[`${eduPrefix}degree`]) {
      try {
        const educationData = {
          learner_id: learnerId,
          level: data[`${eduPrefix}level`] || null,
          degree: data[`${eduPrefix}degree`],
          department: data[`${eduPrefix}department`] || null,
          university: data[`${eduPrefix}university`] || null,
          year_of_passing: data[`${eduPrefix}year_of_passing`] || null,
          cgpa: data[`${eduPrefix}cgpa`] || null,
          approval_status: 'approved',
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`[data-import] Creating education ${i}:`, educationData);
        
        const eduResponse = await fetch(`${dbConfig.skillpassportUrl}/rest/v1/education`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dbConfig.skillpassportKey}`,
            'apikey': dbConfig.skillpassportKey
          },
          body: JSON.stringify(educationData)
        });
        
        if (eduResponse.ok) {
          results.education++;
          console.log(`[data-import] ✅ Added education ${i}: ${educationData.degree}`);
        } else {
          const eduError = await eduResponse.text();
          console.error(`[data-import] Failed to add education ${i} (${eduResponse.status}):`, eduError);
        }
      } catch (error: any) {
        console.error(`[data-import] Failed to add education ${i}:`, error.message);
      }
    } else {
      console.log(`[data-import] Skipping education ${i}: missing degree`);
    }
  }
  
  // Add Skill entries (supports up to 10 skills)
  for (let i = 1; i <= 10; i++) {
    const skillPrefix = `skill_${i}_`;
    if (data[`${skillPrefix}name`]) {
      try {
        const skillData = {
          learner_id: learnerId,
          name: data[`${skillPrefix}name`],
          type: data[`${skillPrefix}type`] || 'technical',
          level: data[`${skillPrefix}level`] ? parseInt(data[`${skillPrefix}level`]) : null,
          proficiency_level: data[`${skillPrefix}proficiency_level`] || null,
          approval_status: 'approved',
          verified: true,
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`[data-import] Creating skill ${i}:`, skillData);
        
        const skillResponse = await fetch(`${dbConfig.skillpassportUrl}/rest/v1/skills`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dbConfig.skillpassportKey}`,
            'apikey': dbConfig.skillpassportKey
          },
          body: JSON.stringify(skillData)
        });
        
        if (skillResponse.ok) {
          results.skills++;
          console.log(`[data-import] ✅ Added skill ${i}: ${skillData.name}`);
        } else {
          const skillError = await skillResponse.text();
          console.error(`[data-import] Failed to add skill ${i} (${skillResponse.status}):`, skillError);
        }
      } catch (error: any) {
        console.error(`[data-import] Failed to add skill ${i}:`, error.message);
      }
    } else {
      console.log(`[data-import] Skipping skill ${i}: missing name`);
    }
  }
  
  console.log('[data-import] Rich profile data summary:', results);
}

// Helper function to generate temporary password
function generateTempPassword(): string {
  // Default password for all imported users
  // Students should change this on first login
  return 'parem@nds123!';
}

// Helper function to hash password (simplified for demo - use proper bcrypt in production)
async function hashPassword(password: string): string {
  // For demo purposes, we'll use a simple hash
  // In production, use proper bcrypt or similar
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'demo_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper function to generate organization slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

function getDbConfig(environment: string, env: any) {
  if (environment === 'local') {
    return {
      ssoUrl: 'http://127.0.0.1:54331', // SSO worker uses port 54331
      ssoKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
      skillpassportUrl: env.SUPABASE_URL || 'http://127.0.0.1:54321', // SkillPassport uses port 54321
      skillpassportKey: env.SUPABASE_SERVICE_ROLE_KEY
    }
  } else {
    return {
      ssoUrl: env.SSO_SUPABASE_URL || env.SUPABASE_URL,
      ssoKey: env.SSO_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
      skillpassportUrl: env.SUPABASE_URL,
      skillpassportKey: env.SUPABASE_SERVICE_ROLE_KEY
    }
  }
}

function generateCSVTemplate(dataType: string): string {
  let headers: string[]
  let sampleRow: string[]

  switch (dataType) {
    case 'universities':
      headers = [
        'organization_type', 'organization_name', 'organization_slug', 'parent_university_name', 
        'parent_university_slug', 'is_affiliated_college', 'university_code', 'college_code',
        'industry', 'website', 'country', 'state', 'city', 'contact_person_name', 
        'contact_person_email', 'contact_person_phone', 'contact_person_role',
        'admin_email', 'admin_password', 'admin_full_name', 'admin_phone',
        'subscription_plan_code', 'billing_cycle', 'seat_count', 'is_organization_subscription',
        'organization_metadata_students_count', 'organization_metadata_faculty_count',
        'organization_metadata_departments', 'organization_metadata_established_year',
        'organization_metadata_accreditation', 'organization_metadata_university_type',
        'relationship_type', 'notes'
      ];
      sampleRow = [
        'university', 'Sample University', 'sample-university', '', 
        '', 'FALSE', 'SU', '',
        'Education', 'https://www.sample-university.edu', 'India', 'Karnataka', 'Bangalore', 'Dr. Sample Chancellor',
        'chancellor@sample-university.edu', '+91-80-12345678', 'Vice Chancellor',
        'admin@sample-university.edu', 'SampleAdmin123!', 'Sample Admin User', '+91-80-12345679',
        'university_premium', 'annual', '500', 'TRUE',
        '15000', '800', 'Computer Science,Engineering,Arts', '1950',
        'NAAC A+', 'Public', 'standalone', 'Sample standalone university'
      ];
      break;
    case 'colleges':
      headers = [
        'organization_type', 'organization_name', 'organization_slug', 'parent_university_name',
        'parent_university_slug', 'is_affiliated_college', 'university_code', 'college_code', 
        'industry', 'website', 'country', 'state', 'city', 'contact_person_name',
        'contact_person_email', 'contact_person_phone', 'contact_person_role',
        'admin_email', 'admin_password', 'admin_full_name', 'admin_phone',
        'subscription_plan_code', 'billing_cycle', 'seat_count', 'is_organization_subscription',
        'organization_metadata_students_count', 'organization_metadata_faculty_count',
        'organization_metadata_departments', 'organization_metadata_established_year',
        'organization_metadata_accreditation', 'organization_metadata_university_type', 
        'relationship_type', 'notes'
      ];
      sampleRow = [
        'college', 'Sample College of Engineering', 'sample-college-engineering', 'Sample University',
        'sample-university', 'TRUE', 'SU', 'SCE001',
        'Education', 'https://sce.sample-university.edu', 'India', 'Karnataka', 'Bangalore', 'Dr. Sample Principal',
        'principal@sce.sample-university.edu', '+91-80-12345680', 'Principal',  
        'admin@sce.sample-university.edu', 'CollegeAdmin123!', 'Sample College Admin', '+91-80-12345681',
        'college_premium', 'annual', '200', 'TRUE',
        '3500', '180', 'Computer Science,Mechanical,Electrical', '1960',
        'NAAC A', 'Affiliated College', 'affiliated', 'Sample college affiliated to Sample University'
      ];
      break;
    case 'students':
      // Enhanced template with rich profile fields
      headers = [
        // Basic fields
        'name', 'email', 'contact_number', 'date_of_birth', 'gender', 'enrollment_number', 
        'admission_number', 'course_name', 'semester', 'branch_field', 'address', 'city', 
        'state', 'country', 'pincode', 'guardian_name', 'guardian_phone', 'guardian_email', 
        'guardian_relation', 'current_cgpa', 'learner_type', 'college_name', 'university_name',
        // Experience fields (2 examples)
        'experience_1_organization', 'experience_1_role', 'experience_1_start_date', 'experience_1_end_date', 'experience_1_description',
        'experience_2_organization', 'experience_2_role', 'experience_2_start_date', 'experience_2_end_date', 'experience_2_description',
        // Project fields (2 examples)
        'project_1_title', 'project_1_description', 'project_1_start_date', 'project_1_end_date', 'project_1_tech_stack', 'project_1_demo_link', 'project_1_github_link', 'project_1_role',
        'project_2_title', 'project_2_description', 'project_2_start_date', 'project_2_end_date', 'project_2_tech_stack', 'project_2_demo_link', 'project_2_github_link', 'project_2_role',
        // Certificate fields (2 examples)
        'certificate_1_title', 'certificate_1_issuer', 'certificate_1_issued_on', 'certificate_1_credential_id', 'certificate_1_link', 'certificate_1_platform',
        'certificate_2_title', 'certificate_2_issuer', 'certificate_2_issued_on', 'certificate_2_credential_id', 'certificate_2_link', 'certificate_2_platform',
        // Education fields (2 examples)
        'education_1_level', 'education_1_degree', 'education_1_department', 'education_1_university', 'education_1_year_of_passing', 'education_1_cgpa',
        'education_2_level', 'education_2_degree', 'education_2_department', 'education_2_university', 'education_2_year_of_passing', 'education_2_cgpa',
        // Skill fields (5 examples)
        'skill_1_name', 'skill_1_type', 'skill_1_level', 'skill_1_proficiency_level',
        'skill_2_name', 'skill_2_type', 'skill_2_level', 'skill_2_proficiency_level',
        'skill_3_name', 'skill_3_type', 'skill_3_level', 'skill_3_proficiency_level',
        'skill_4_name', 'skill_4_type', 'skill_4_level', 'skill_4_proficiency_level',
        'skill_5_name', 'skill_5_type', 'skill_5_level', 'skill_5_proficiency_level'
      ];
      sampleRow = [
        // Basic fields
        'John Doe', 'john.doe@student.edu', '+91-9876543210', '2002-05-15', 'Male', 'CSE2024001',
        '2024001', 'B.Tech Computer Science', '6', 'Computer Science', '123 Student Street', 'Bangalore', 
        'Karnataka', 'India', '560001', 'Jane Doe', '+91-9876543211', 'jane.doe@email.com',
        'Mother', '8.5', 'university', 'Sample Engineering College', 'Sample University',
        // Experience
        'Tech Solutions Pvt Ltd', 'Software Development Intern', '2024-06-01', '2024-08-31', 'Developed REST APIs using Node.js',
        'StartupXYZ', 'Frontend Developer Intern', '2023-12-01', '2024-02-28', 'Built responsive web applications',
        // Projects
        'E-Commerce Platform', 'Full-stack web application with payment integration', '2024-01-15', '2024-04-30', 'React,Node.js,MongoDB', 'https://demo.ecommerce.com', 'https://github.com/johndoe/ecommerce', 'Full Stack Developer',
        'AI Chatbot', 'Intelligent chatbot using NLP', '2023-09-01', '2023-12-15', 'Python,TensorFlow,Flask', '', 'https://github.com/johndoe/chatbot', 'AI/ML Developer',
        // Certificates
        'AWS Certified Solutions Architect', 'Amazon Web Services', '2024-03-15', 'AWS-SAA-12345', 'https://aws.amazon.com/verification', 'AWS',
        'Full Stack Web Development', 'Coursera', '2023-08-20', 'COURSERA-FS-67890', 'https://coursera.org/verify/COURSERA-FS-67890', 'Coursera',
        // Education
        'Undergraduate', 'B.Tech Computer Science', 'Computer Science and Engineering', 'Sample University', '2025', '8.5',
        'Higher Secondary', '12th Grade - Science', 'PCM', 'State Board', '2020', '92.5',
        // Skills
        'JavaScript', 'technical', '4', 'Advanced',
        'Python', 'technical', '5', 'Expert',
        'React', 'technical', '4', 'Advanced',
        'Node.js', 'technical', '3', 'Intermediate',
        'Problem Solving', 'soft', '4', 'Advanced'
      ];
      break;
    default:
      throw new Error('Invalid data type')
  }

  return headers.join(',') + '\n' + sampleRow.join(',')
}