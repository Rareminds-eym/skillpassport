/**
 * CSV Import Service for Learner Data
 * Handles validation, auto-mapping, capacity checks, and preview generation
 */

import { apiPost } from '@/shared/api/apiClient'

export const MANDATORY_FIELDS = {
  CATEGORY_1: ['learner_name', 'email', 'contact_number', 'date_of_birth', 'gender', 'enrollment_number', 'roll_number'],
  CATEGORY_2: ['address', 'city', 'state', 'country', 'pincode', 'blood_group'],
  CATEGORY_3: ['guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relation'],
  CATEGORY_4: ['grade', 'section', 'academic_year']
}

const FIELD_MAPPINGS: Record<string, string[]> = {
  learner_name: ['name', 'learner_name', 'learnername', 'fullname', 'full_name'],
  email: ['email', 'emailaddress', 'email_address', 'learneremail', 'learner_email'],
  contact_number: ['contact', 'contactnumber', 'contact_number', 'phone', 'phonenumber', 'phone_number', 'mobile'],
  alternate_number: ['alternate', 'alternatenumber', 'alternate_number', 'alternatephone', 'alternate_phone', 'secondaryphone', 'secondary_phone'],
  date_of_birth: ['dob', 'dateofbirth', 'date_of_birth', 'birthdate', 'birth_date'],
  gender: ['gender', 'sex'],
  enrollment_number: ['enrollment', 'enrollmentnumber', 'enrollment_number', 'enrolment', 'enrolmentnumber'],
  roll_number: ['roll', 'rollnumber', 'roll_number', 'rollno', 'roll_no'],
  address: ['address', 'street', 'streetaddress', 'street_address'],
  city: ['city', 'town'],
  state: ['state', 'province'],
  country: ['country', 'nation'],
  pincode: ['pincode', 'pin', 'zipcode', 'zip', 'postalcode', 'postal_code'],
  blood_group: ['bloodgroup', 'blood_group', 'blood'],
  guardian_name: ['guardianname', 'guardian_name', 'parentname', 'parent_name'],
  guardian_phone: ['guardianphone', 'guardian_phone', 'parentphone', 'parent_phone', 'guardiancontact'],
  guardian_email: ['guardianemail', 'guardian_email', 'parentemail', 'parent_email'],
  guardian_relation: ['guardianrelation', 'guardian_relation', 'relation', 'relationship'],
  grade: ['grade', 'class', 'standard', 'level'],
  section: ['section', 'division', 'div'],
  academic_year: ['academicyear', 'academic_year', 'year', 'session'],
  school_code: ['schoolcode', 'school_code', 'code'],
  school_id: ['schoolid', 'school_id']
}

export interface ValidationError {
  row: number
  field: string
  message: string
  value?: any
}

export interface ValidatedRow {
  rowNumber: number
  data: Record<string, any>
  errors: ValidationError[]
  warnings: string[]
  isValid: boolean
  capacityIssue?: string
}

export interface ImportSummary {
  totalRows: number
  validRows: number
  invalidRows: number
  capacityIssues: number
  missingFields: string[]
  duplicates: number
  classesUpdated: number
}

export function autoMapHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}

  headers.forEach(header => {
    const normalized = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '')

    for (const [dbField, aliases] of Object.entries(FIELD_MAPPINGS)) {
      if (aliases.includes(normalized)) {
        mapping[header] = dbField
        break
      }
    }

    if (!mapping[header]) {
      mapping[header] = normalized
    }
  })

  return mapping
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+?\d{1,3})?[\s-]?\d{10}$/
  return phoneRegex.test(phone.replace(/[\s-]/g, ''))
}

function validateDate(date: string): boolean {
  const parsed = new Date(date)
  return !isNaN(parsed.getTime())
}

function checkMandatoryFields(row: Record<string, any>): ValidationError[] {
  const errors: ValidationError[] = []
  const allMandatory = [
    ...MANDATORY_FIELDS.CATEGORY_1,
    ...MANDATORY_FIELDS.CATEGORY_2,
    ...MANDATORY_FIELDS.CATEGORY_3,
    ...MANDATORY_FIELDS.CATEGORY_4
  ]

  const hasSchoolIdentifier = row.school_code || row.school_id
  if (!hasSchoolIdentifier) {
    errors.push({
      row: 0,
      field: 'school_code/school_id',
      message: 'Either school_code or school_id is required'
    })
  }

  allMandatory.forEach(field => {
    if (field === 'school_code' || field === 'school_id') return

    if (!row[field] || String(row[field]).trim() === '') {
      errors.push({
        row: 0,
        field,
        message: `Missing mandatory field: ${field}`,
        value: row[field]
      })
    }
  })

  return errors
}

function validateRow(row: Record<string, any>, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = []

  const mandatoryErrors = checkMandatoryFields(row)
  mandatoryErrors.forEach(err => {
    err.row = rowNumber
    errors.push(err)
  })

  if (row.email && !validateEmail(row.email)) {
    errors.push({
      row: rowNumber,
      field: 'email',
      message: 'Invalid email format',
      value: row.email
    })
  }

  if (row.contact_number && !validatePhone(row.contact_number)) {
    errors.push({
      row: rowNumber,
      field: 'contact_number',
      message: 'Invalid phone number format',
      value: row.contact_number
    })
  }

  if (row.guardian_phone && !validatePhone(row.guardian_phone)) {
    errors.push({
      row: rowNumber,
      field: 'guardian_phone',
      message: 'Invalid guardian phone format',
      value: row.guardian_phone
    })
  }

  if (row.alternate_number && !validatePhone(row.alternate_number)) {
    errors.push({
      row: rowNumber,
      field: 'alternate_number',
      message: 'Invalid alternate phone format',
      value: row.alternate_number
    })
  }

  if (row.date_of_birth && !validateDate(row.date_of_birth)) {
    errors.push({
      row: rowNumber,
      field: 'date_of_birth',
      message: 'Invalid date format',
      value: row.date_of_birth
    })
  }

  if (row.guardian_email && !validateEmail(row.guardian_email)) {
    errors.push({
      row: rowNumber,
      field: 'guardian_email',
      message: 'Invalid guardian email format',
      value: row.guardian_email
    })
  }

  return errors
}

async function validateOrganization(schoolCode?: string, schoolId?: string): Promise<{ schoolId: string | null; error?: string }> {
  const result = await apiPost<any>('/college-admin/csv-import', {
    action: 'validate-organization',
    school_code: schoolCode,
    school_id: schoolId
  })

  if (!result.success) {
    return { schoolId: null, error: result.error || 'Validation failed' }
  }

  return { schoolId: result.data?.schoolId || null }
}

async function validateClasses(
  schoolId: string,
  grade: string,
  section: string,
  academicYear: string
): Promise<{ classId: string; found: boolean; error?: string }> {
  const result = await apiPost<any>('/college-admin/csv-import', {
    action: 'validate-classes',
    school_id: schoolId,
    grade,
    section,
    academic_year: academicYear
  })

  if (!result.success) {
    return {
      classId: '',
      found: false,
      error: result.error || `Class ${grade}-${section} (${academicYear}) validation failed`
    }
  }

  return result.data
}

async function checkCapacity(
  classId: string,
  newlearnersCount: number
): Promise<{ hasCapacity: boolean; available: number; max: number }> {
  const result = await apiPost<any>('/college-admin/csv-import', {
    action: 'check-capacity',
    class_id: classId,
    new_learners_count: newlearnersCount
  })

  if (!result.success) {
    return { hasCapacity: false, available: 0, max: 0 }
  }

  return result.data
}

async function checkDuplicateLearners(
  emails: string[],
  enrollmentNumbers: string[]
): Promise<{ duplicateEmails: string[]; duplicateEnrollments: string[] }> {
  const result = await apiPost<any>('/college-admin/csv-import', {
    action: 'check-duplicate-learners',
    emails,
    enrollment_numbers: enrollmentNumbers
  })

  if (!result.success) {
    return { duplicateEmails: [], duplicateEnrollments: [] }
  }

  return result.data
}

export async function processCSVData(
  rawData: any[],
  headerMapping: Record<string, string>
): Promise<{ validatedRows: ValidatedRow[]; summary: ImportSummary }> {
  const validatedRows: ValidatedRow[] = []
  const summary: ImportSummary = {
    totalRows: rawData.length,
    validRows: 0,
    invalidRows: 0,
    capacityIssues: 0,
    missingFields: [],
    duplicates: 0,
    classesUpdated: 0
  }

  const mappedData = rawData.map((row, index) => {
    const mapped: Record<string, any> = {}
    Object.entries(row).forEach(([key, value]) => {
      const dbField = headerMapping[key] || key
      mapped[dbField] = value
    })
    return { rowNumber: index + 2, data: mapped }
  })

  const allEmails = mappedData.map(r => r.data.email).filter(Boolean)
  const allEnrollments = mappedData.map(r => r.data.enrollment_number).filter(Boolean)
  const { duplicateEmails, duplicateEnrollments } = await checkDuplicateLearners(allEmails, allEnrollments)

  const classCounts: Record<string, number> = {}
  const classInfo: Record<string, { schoolId: string; grade: string; section: string; academicYear: string }> = {}

  for (const { rowNumber, data } of mappedData) {
    let schoolId = data.school_id

    if (!schoolId && data.school_code) {
      const result = await validateOrganization(data.school_code)
      if (!result.schoolId || result.error) {
        validatedRows.push({
          rowNumber,
          data,
          errors: [{ row: rowNumber, field: 'school_code', message: result.error || 'Invalid school code' }],
          warnings: [],
          isValid: false
        })
        continue
      }
      schoolId = result.schoolId
      data.school_id = schoolId
    }

    if (schoolId) {
      const result = await validateOrganization(undefined, schoolId)
      if (!result.schoolId || result.error) {
        validatedRows.push({
          rowNumber,
          data,
          errors: [{ row: rowNumber, field: 'school_id', message: `School with ID "${schoolId}" does not exist` }],
          warnings: [],
          isValid: false
        })
        continue
      }
    }

    const classKey = `${schoolId}_${data.grade}_${data.section}_${data.academic_year}`
    classCounts[classKey] = (classCounts[classKey] || 0) + 1
    classInfo[classKey] = {
      schoolId,
      grade: data.grade,
      section: data.section,
      academicYear: data.academic_year
    }
  }

  const capacityResults: Record<string, { hasCapacity: boolean; available: number; max: number; classId: string; error?: string }> = {}

  for (const [classKey, count] of Object.entries(classCounts)) {
    const info = classInfo[classKey]
    const { classId, found, error } = await validateClasses(
      info.schoolId,
      info.grade,
      info.section,
      info.academicYear
    )

    if (!found || error) {
      capacityResults[classKey] = {
        hasCapacity: false,
        available: 0,
        max: 0,
        classId: '',
        error: error || `Class ${info.grade}-${info.section} not found`
      }
      continue
    }

    summary.classesUpdated++

    const capacity = await checkCapacity(classId, count)
    capacityResults[classKey] = { ...capacity, classId }
  }

  for (const { rowNumber, data } of mappedData) {
    const errors = validateRow(data, rowNumber)
    const warnings: string[] = []

    if (duplicateEmails.includes(data.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Duplicate email - already exists in database'
      })
      summary.duplicates++
    }

    if (data.enrollment_number && duplicateEnrollments.includes(data.enrollment_number)) {
      errors.push({
        row: rowNumber,
        field: 'enrollment_number',
        message: 'Duplicate enrollment number - already exists in database'
      })
    }

    const classKey = `${data.school_id}_${data.grade}_${data.section}_${data.academic_year}`
    const capacity = capacityResults[classKey]

    let capacityIssue: string | undefined

    if (capacity && capacity.error) {
      capacityIssue = capacity.error
      errors.push({
        row: rowNumber,
        field: 'class',
        message: capacityIssue
      })
    } else if (capacity && !capacity.hasCapacity) {
      capacityIssue = `Class capacity exceeded (${capacity.available}/${capacity.max} available, ${classCounts[classKey]} learners in CSV)`
      errors.push({
        row: rowNumber,
        field: 'class_capacity',
        message: capacityIssue
      })
      summary.capacityIssues++
    }

    if (capacity && capacity.classId) {
      data.school_class_id = capacity.classId
    }

    const isValid = errors.length === 0

    validatedRows.push({
      rowNumber,
      data,
      errors,
      warnings,
      isValid,
      capacityIssue
    })

    if (isValid) {
      summary.validRows++
    } else {
      summary.invalidRows++
    }
  }

  return { validatedRows, summary }
}

export async function importLearners(
  validRows: ValidatedRow[],
  userEmail: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  try {
    const result = await apiPost<any>('/college-admin/csv-import', {
      action: 'import-learners',
      user_email: userEmail,
      rows: validRows.map(row => ({
        ...row.data,
        rowNumber: row.rowNumber
      }))
    })

    if (!result.success) {
      return { success: 0, failed: validRows.length, errors: [result.error || 'Import failed'] }
    }

    return result.data || { success: 0, failed: validRows.length, errors: ['No response from server'] }
  } catch (error: any) {
    return { success: 0, failed: validRows.length, errors: [error.message || 'Import failed'] }
  }
}

export { importLearners as importlearners };
