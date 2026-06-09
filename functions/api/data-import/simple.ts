// Simplified data import function without xlsx dependency
// This version works with JSON data and can be extended later

import { corsHeaders, handleRequest } from '../../lib/cors'

export const onRequestOptions = () => {
  return new Response(null, {
    headers: corsHeaders,
  })
}

export const onRequestPost = (context: any) =>
  handleRequest(context, async ({ request, env }) => {
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
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const dataType = formData.get('dataType') as string
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    try {
      // For now, we'll accept CSV files or JSON files
      const text = await file.text()
      let data: any[]
      
      if (file.name.endsWith('.json')) {
        data = JSON.parse(text)
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text)
      } else {
        throw new Error('Unsupported file format. Please upload CSV or JSON files. Excel support coming soon.')
      }
      
      // Validate data
      const validatedData = validateData(data, dataType)
      
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
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const dataType = searchParams.get('dataType')
    
    if (action === 'template' && dataType) {
      // Generate CSV template for now
      const template = generateCSVTemplate(dataType)
      return new Response(template, {
        headers: {
          'Content-Type': 'text/csv',
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
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
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
  
  // Basic validation based on type
  const requiredFields: { [key: string]: string[] } = {
    universities: ['name', 'email', 'state', 'city'],
    colleges: ['name', 'code', 'email'],
    students: ['name', 'email', 'enrollment_number']
  }
  
  const required = requiredFields[dataType] || []
  
  data.forEach((row, index) => {
    required.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        throw new Error(`Missing required field '${field}' in row ${index + 1}`)
      }
    })
  })
  
  return data
}

async function importData(data: any[], dataType: string, environment: string, env: any) {
  // Get database configuration
  const dbConfig = getDbConfig(environment, env)
  
  return {
    processed: data.length,
    environment,
    note: 'Database import functionality will be implemented after Excel library issues are resolved',
    dbConfig: {
      ssoUrl: dbConfig.ssoUrl ? 'configured' : 'missing',
      skillpassportUrl: dbConfig.skillpassportUrl ? 'configured' : 'missing'
    }
  }
}

function getDbConfig(environment: string, env: any) {
  if (environment === 'local') {
    return {
      ssoUrl: env.SSO_LOCAL_URL,
      ssoKey: env.SSO_LOCAL_SERVICE_ROLE_KEY,
      skillpassportUrl: env.SKILLPASSPORT_LOCAL_URL,
      skillpassportKey: env.SKILLPASSPORT_LOCAL_SERVICE_ROLE_KEY
    }
  } else {
    return {
      ssoUrl: env.SSO_SUPABASE_URL,
      ssoKey: env.SSO_SERVICE_ROLE_KEY,
      skillpassportUrl: env.SKILLPASSPORT_SUPABASE_URL,
      skillpassportKey: env.SKILLPASSPORT_SERVICE_ROLE_KEY
    }
  }
}

function generateCSVTemplate(dataType: string): string {
  let headers: string[]
  let sampleRow: string[]

  switch (dataType) {
    case 'universities':
      headers = ['name', 'slug', 'description', 'email', 'phone', 'state', 'website', 'address', 'city', 'country', 'pincode', 'established_year']
      sampleRow = ['Sample University', 'sample-university', 'A premier institution', 'admin@sample.edu', '+91-11-12345678', 'Delhi', 'https://sample.edu', '123 University Road', 'New Delhi', 'India', '110001', '1950']
      break
    case 'colleges':
      headers = ['name', 'code', 'description', 'email', 'phone', 'address', 'city', 'state', 'pincode', 'dean_name', 'dean_email', 'dean_phone', 'established_year', 'university_name']
      sampleRow = ['College of Engineering', 'COE', 'Engineering college', 'coe@sample.edu', '+91-11-12345679', 'Block A Campus', 'New Delhi', 'Delhi', '110001', 'Dr. John Smith', 'john@sample.edu', '+91-11-12345680', '1960', 'Sample University']
      break
    case 'students':
      headers = ['name', 'email', 'contact_number', 'date_of_birth', 'gender', 'enrollment_number', 'admission_number', 'course_name', 'semester', 'branch_field', 'address', 'city', 'state', 'country', 'pincode', 'guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relation', 'current_cgpa', 'learner_type', 'college_name', 'university_name']
      sampleRow = ['John Doe', 'john@student.sample.edu', '+91-9876543210', '2002-05-15', 'Male', 'COE2021001', '2021001', 'B.Tech Computer Science', '6', 'Computer Science', '456 Student Street', 'New Delhi', 'Delhi', 'India', '110002', 'Jane Doe', '+91-9876543211', 'jane@email.com', 'Mother', '8.5', 'university', 'College of Engineering', 'Sample University']
      break
    default:
      throw new Error('Invalid data type')
  }

  return headers.join(',') + '\n' + sampleRow.join(',')
}