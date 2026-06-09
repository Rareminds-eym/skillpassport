# Data Import System

A comprehensive web-based system for importing university, college, and student data via Excel files with support for both local (Docker) and production environments.

## 🚀 Features

- **Excel Import**: Upload university, college, and student data via Excel files
- **Template Generation**: Download properly formatted Excel templates
- **Environment Switching**: Toggle between local Docker Supabase and production
- **Data Preview**: Preview parsed Excel data before importing
- **Progress Tracking**: Real-time progress updates during import
- **Error Handling**: Detailed error reporting and partial success handling
- **Validation**: Comprehensive data validation before database insertion

## 📋 Prerequisites

1. **Cloudflare Pages** deployment with Functions enabled
2. **Supabase instances** for both SSO and Skillpassport databases
3. **Local Docker Supabase** (optional, for testing)
4. **Environment variables** configured (see setup below)

## 🛠️ Setup

### 1. Environment Variables

Add these variables to your `.dev.vars` file (for local development) and Cloudflare Pages environment settings (for production):

```bash
# Production Databases
SSO_SUPABASE_URL=https://your-sso-project.supabase.co
SSO_SERVICE_ROLE_KEY=your_sso_service_role_key
SKILLPASSPORT_SUPABASE_URL=https://your-skillpassport-project.supabase.co
SKILLPASSPORT_SERVICE_ROLE_KEY=your_skillpassport_service_role_key

# Local Docker Databases (Optional)
SSO_LOCAL_URL=http://localhost:54321
SSO_LOCAL_SERVICE_ROLE_KEY=your_local_sso_service_role_key
SKILLPASSPORT_LOCAL_URL=http://localhost:54322
SKILLPASSPORT_LOCAL_SERVICE_ROLE_KEY=your_local_skillpassport_service_role_key
```

### 2. Install Dependencies

```bash
cd skillpassport/functions
npm install
```

### 3. Deploy Functions

The data import API will be available at `/api/data-import` when deployed.

## 📊 Usage

### 1. Access the Import Interface

Navigate to `/data-import.html` in your deployed Skillpassport application.

### 2. Choose Environment

- **Local**: Uses Docker Supabase instances for testing
- **Production**: Uses live Supabase instances

### 3. Import Data (Recommended Order)

1. **Universities First**: Import university data
2. **Colleges Second**: Import college data (can reference universities)
3. **Students Last**: Import student data (references colleges/universities)

### 4. Import Process

For each data type:
1. Click "Download Template" to get the proper Excel format
2. Fill in your data following the template structure
3. Click "Upload Excel File" and select your completed file
4. Review the data preview
5. Click the import button to process the data

## 📈 Data Templates

### Universities Template
- `name` (required): University name
- `slug` (optional): URL-friendly identifier (auto-generated if empty)
- `description`: University description
- `email` (required): Contact email
- `phone`: Contact phone number
- `state` (required): State/province
- `website`: Official website URL
- `address`: Physical address
- `city` (required): City name
- `country`: Country (defaults to India)
- `pincode`: Postal code
- `established_year`: Year of establishment

### Colleges Template
- `name` (required): College name
- `code` (required): College code/abbreviation
- `description`: College description
- `email` (required): Contact email
- `phone`: Contact phone number
- `address`: Physical address
- `city`: City name
- `state`: State/province
- `pincode`: Postal code
- `dean_name`: Dean's name
- `dean_email`: Dean's email
- `dean_phone`: Dean's phone
- `established_year`: Year of establishment
- `university_name`: Parent university name (for university colleges)

### Students Template
- `name` (required): Full name
- `email` (required): Email address
- `contact_number`: Phone number
- `date_of_birth`: Birth date (YYYY-MM-DD format)
- `gender`: Male/Female/Other
- `enrollment_number` (required): Student enrollment number
- `admission_number`: Admission number
- `course_name`: Course/program name
- `semester`: Current semester (number)
- `branch_field`: Field of study/branch
- `address`: Residential address
- `city`: City name
- `state`: State/province
- `country`: Country (defaults to India)
- `pincode`: Postal code
- `guardian_name`: Guardian's name
- `guardian_phone`: Guardian's phone
- `guardian_email`: Guardian's email
- `guardian_relation`: Relationship to guardian
- `current_cgpa`: Current CGPA (decimal)
- `learner_type`: college/university
- `college_name`: College name (must match exactly)
- `university_name`: University name (must match exactly)

## 🔧 Technical Details

### API Endpoints

#### POST `/api/data-import?env={environment}`
Imports data from uploaded Excel file.

**Parameters:**
- `env`: Environment (`local` or `production`)

**Body (FormData):**
- `file`: Excel file (.xlsx or .xls)
- `dataType`: Type of data (`universities`, `colleges`, or `students`)

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported N records",
  "data": [
    {
      "success": true,
      "data": {...}
    }
  ]
}
```

#### GET `/api/data-import?action=template&dataType={dataType}`
Downloads Excel template for specified data type.

**Parameters:**
- `action`: Must be `template`
- `dataType`: `universities`, `colleges`, or `students`

**Response:** Excel file download

### Database Operations

#### Universities
1. Creates organization in SSO database
2. Creates organization in Skillpassport database
3. Links the two via metadata

#### Colleges
1. Creates organization in Skillpassport database
2. Creates `university_colleges` entry if linked to university
3. Stores dean information in metadata

#### Students
1. Creates user account in SSO database with default password
2. Creates learner record in Skillpassport database
3. Links to college and university (if applicable)

### Data Flow

```
Excel File → Validation → Database Import → Response
```

1. **Parse**: Excel file is parsed using SheetJS
2. **Validate**: Data is validated against required fields
3. **Transform**: Data is transformed to match database schema
4. **Import**: Data is inserted into appropriate databases
5. **Link**: Relationships are created between entities
6. **Response**: Results are returned with success/error details

## 🛡️ Security & Best Practices

### Authentication
- Uses service role keys for database access
- Validates all input data before processing
- Sanitizes file uploads
- **Email verification is automatically set to true** for imported users

### Password Management
- Default password: `rareminds123!`
- Passwords are hashed using bcryptjs with salt rounds = 12
- Users must change passwords on first login
- **Email verification is automatically set to true** for imported users (no email verification required)

### Data Validation
- Required field validation
- Email format validation
- Data type conversion and validation
- Duplicate detection and handling

### Error Handling
- Comprehensive error reporting
- Partial success handling
- Transaction rollback not implemented (be careful!)
- Detailed logging for debugging

## 🚨 Important Notes

### Production Safety
- ⚠️ **Test with local environment first**
- ⚠️ **Backup databases before importing**
- ⚠️ **Review all data before importing to production**
- ⚠️ **No rollback functionality - imports are permanent**

### Data Dependencies
- Import universities before colleges
- Import colleges before students
- Ensure exact name matching between related entities
- College names and university names must match exactly

### Limitations
- No automatic rollback on partial failures
- Limited to Excel file formats (.xlsx, .xls)
- Maximum file size depends on Cloudflare limits
- No batch size limits (memory dependent)

## 🔍 Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file format (.xlsx or .xls)
   - Verify file is not corrupted
   - Check file size limits

2. **Import Fails**
   - Verify environment variables are set
   - Check database connectivity
   - Review validation errors in response

3. **Partial Import Success**
   - Review failed records in import results
   - Fix data issues and re-import failed records
   - Check for duplicate entries

4. **Template Download Fails**
   - Check API endpoint is accessible
   - Verify CORS headers are configured
   - Check network connectivity

### Debug Mode

Add debug logging by modifying the function:

```typescript
console.log('Debug:', { dataType, environment, recordCount: data.length })
```

### Database Connection Issues

Verify environment variables:
```bash
# Test connection
curl -X GET "https://your-project.supabase.co/rest/v1/" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-service-role-key"
```

## 📞 Support

For issues with the data import system:

1. Check environment variables configuration
2. Verify database permissions
3. Review browser console for client-side errors
4. Check Cloudflare Functions logs for server-side errors
5. Validate Excel file format and data

---

**⚠️ Warning**: This system creates permanent data in your databases. Always test thoroughly in the local environment before using in production.