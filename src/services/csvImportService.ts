/**
 * CSV Import Service for Student Data
 * Handles validation, auto-mapping, capacity checks, and preview generation
 */

import { supabase } from '../lib/supabaseClient';

// Mandatory field categories
export const MANDATORY_FIELDS = {
  CATEGORY_1: [
    'student_name',
    'email',
    'contact_number',
    'date_of_birth',
    'gender',
    'enrollment_number',
    'roll_number',
  ],
  CATEGORY_2: ['address', 'city', 'state', 'country', 'pincode', 'blood_group'],
  CATEGORY_3: ['guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relation'],
  CATEGORY_4: ['grade', 'section', 'academic_year'], // school_code or school_id
};

// Field mapping dictionary for auto-detection
const FIELD_MAPPINGS: Record<string, string[]> = {
  student_name: ['name', 'student_name', 'studentname', 'fullname', 'full_name'],
  email: ['email', 'emailaddress', 'email_address', 'studentemail', 'student_email'],
  contact_number: [
    'contact',
    'contactnumber',
    'contact_number',
    'phone',
    'phonenumber',
    'phone_number',
    'mobile',
  ],
  alternate_number: [
    'alternate',
    'alternatenumber',
    'alternate_number',
    'alternatephone',
    'alternate_phone',
    'secondaryphone',
    'secondary_phone',
  ],
  date_of_birth: ['dob', 'dateofbirth', 'date_of_birth', 'birthdate', 'birth_date'],
  gender: ['gender', 'sex'],
  enrollment_number: [
    'enrollment',
    'enrollmentnumber',
    'enrollment_number',
    'enrolment',
    'enrolmentnumber',
  ],
  roll_number: ['roll', 'rollnumber', 'roll_number', 'rollno', 'roll_no'],
  address: ['address', 'street', 'streetaddress', 'street_address'],
  city: ['city', 'town'],
  state: ['state', 'province'],
  country: ['country', 'nation'],
  pincode: ['pincode', 'pin', 'zipcode', 'zip', 'postalcode', 'postal_code'],
  blood_group: ['bloodgroup', 'blood_group', 'blood'],
  guardian_name: ['guardianname', 'guardian_name', 'parentname', 'parent_name'],
  guardian_phone: [
    'guardianphone',
    'guardian_phone',
    'parentphone',
    'parent_phone',
    'guardiancontact',
  ],
  guardian_email: ['guardianemail', 'guardian_email', 'parentemail', 'parent_email'],
  guardian_relation: ['guardianrelation', 'guardian_relation', 'relation', 'relationship'],
  grade: ['grade', 'class', 'standard', 'level'],
  section: ['section', 'division', 'div'],
  academic_year: ['academicyear', 'academic_year', 'year', 'session'],
  school_code: ['schoolcode', 'school_code', 'code'],
  school_id: ['schoolid', 'school_id'],
};

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ValidatedRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: ValidationError[];
  warnings: string[];
  isValid: boolean;
  capacityIssue?: string;
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  capacityIssues: number;
  missingFields: string[];
  duplicates: number;
  classesUpdated: number;
}

/**
 * Auto-map CSV headers to database fields
 */
export function autoMapHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  headers.forEach((header) => {
    const normalized = header
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');

    // Find matching field
    for (const [dbField, aliases] of Object.entries(FIELD_MAPPINGS)) {
      if (aliases.includes(normalized)) {
        mapping[header] = dbField;
        break;
      }
    }

    // If no match found, keep original
    if (!mapping[header]) {
      mapping[header] = normalized;
    }
  });

  return mapping;
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
function validatePhone(phone: string): boolean {
  // Allow various formats: +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX
  const phoneRegex = /^(\+?\d{1,3})?[\s-]?\d{10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Validate date format
 */
function validateDate(date: string): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Check if all mandatory fields are present
 */
function checkMandatoryFields(row: Record<string, any>): ValidationError[] {
  const errors: ValidationError[] = [];
  const allMandatory = [
    ...MANDATORY_FIELDS.CATEGORY_1,
    ...MANDATORY_FIELDS.CATEGORY_2,
    ...MANDATORY_FIELDS.CATEGORY_3,
    ...MANDATORY_FIELDS.CATEGORY_4,
  ];

  // Check for school_code OR school_id
  const hasSchoolIdentifier = row.school_code || row.school_id;
  if (!hasSchoolIdentifier) {
    errors.push({
      row: 0,
      field: 'school_code/school_id',
      message: 'Either school_code or school_id is required',
    });
  }

  allMandatory.forEach((field) => {
    if (field === 'school_code' || field === 'school_id') return; // Already checked above

    if (!row[field] || String(row[field]).trim() === '') {
      errors.push({
        row: 0,
        field,
        message: `Missing mandatory field: ${field}`,
        value: row[field],
      });
    }
  });

  return errors;
}

/**
 * Validate individual row data
 */
function validateRow(row: Record<string, any>, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check mandatory fields
  const mandatoryErrors = checkMandatoryFields(row);
  mandatoryErrors.forEach((err) => {
    err.row = rowNumber;
    errors.push(err);
  });

  // Validate email
  if (row.email && !validateEmail(row.email)) {
    errors.push({
      row: rowNumber,
      field: 'email',
      message: 'Invalid email format',
      value: row.email,
    });
  }

  // Validate contact number
  if (row.contact_number && !validatePhone(row.contact_number)) {
    errors.push({
      row: rowNumber,
      field: 'contact_number',
      message: 'Invalid phone number format',
      value: row.contact_number,
    });
  }

  // Validate guardian phone
  if (row.guardian_phone && !validatePhone(row.guardian_phone)) {
    errors.push({
      row: rowNumber,
      field: 'guardian_phone',
      message: 'Invalid guardian phone format',
      value: row.guardian_phone,
    });
  }

  // Validate alternate number (optional)
  if (row.alternate_number && !validatePhone(row.alternate_number)) {
    errors.push({
      row: rowNumber,
      field: 'alternate_number',
      message: 'Invalid alternate phone format',
      value: row.alternate_number,
    });
  }

  // Validate date of birth
  if (row.date_of_birth && !validateDate(row.date_of_birth)) {
    errors.push({
      row: rowNumber,
      field: 'date_of_birth',
      message: 'Invalid date format',
      value: row.date_of_birth,
    });
  }

  // Validate guardian email if provided
  if (row.guardian_email && !validateEmail(row.guardian_email)) {
    errors.push({
      row: rowNumber,
      field: 'guardian_email',
      message: 'Invalid guardian email format',
      value: row.guardian_email,
    });
  }

  return errors;
}

/**
 * Get school ID from school code (uses organizations table)
 */
async function getSchoolIdFromCode(
  schoolCode: string
): Promise<{ schoolId: string | null; error?: string }> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('organization_type', 'school')
    .eq('code', schoolCode)
    .maybeSingle();

  if (error) {
    return { schoolId: null, error: `Database error: ${error.message}` };
  }

  if (!data) {
    return { schoolId: null, error: `School with code "${schoolCode}" does not exist` };
  }

  return { schoolId: data.id };
}

/**
 * Find existing class (no auto-creation)
 */
async function findExistingClass(
  schoolId: string,
  grade: string,
  section: string,
  academicYear: string
): Promise<{ classId: string; found: boolean; error?: string }> {
  // Try to find existing class
  const { data: existingClass, error: findError } = await supabase
    .from('school_classes')
    .select('id, max_students, current_students')
    .eq('school_id', schoolId)
    .eq('grade', grade)
    .eq('section', section)
    .eq('academic_year', academicYear)
    .single();

  if (findError || !existingClass) {
    return {
      classId: '',
      found: false,
      error: `Class ${grade}-${section} (${academicYear}) does not exist. Please create the class first.`,
    };
  }

  return { classId: existingClass.id, found: true };
}

/**
 * Check class capacity
 */
async function checkClassCapacity(
  classId: string,
  newStudentsCount: number
): Promise<{ hasCapacity: boolean; available: number; max: number }> {
  const { data, error } = await supabase
    .from('school_classes')
    .select('max_students, current_students')
    .eq('id', classId)
    .single();

  if (error || !data) {
    return { hasCapacity: false, available: 0, max: 0 };
  }

  const available = data.max_students - data.current_students;
  const hasCapacity = available >= newStudentsCount;

  return { hasCapacity, available, max: data.max_students };
}

/**
 * Check for duplicate emails and enrollment numbers
 */
async function checkDuplicates(
  emails: string[],
  enrollmentNumbers: string[]
): Promise<{ duplicateEmails: string[]; duplicateEnrollments: string[] }> {
  const duplicateEmails: string[] = [];
  const duplicateEnrollments: string[] = [];

  // Check emails
  if (emails.length > 0) {
    const { data: existingEmails } = await supabase
      .from('students')
      .select('email')
      .in('email', emails);

    if (existingEmails) {
      duplicateEmails.push(...existingEmails.map((e) => e.email));
    }
  }

  // Check enrollment numbers
  if (enrollmentNumbers.length > 0) {
    const { data: existingEnrollments } = await supabase
      .from('students')
      .select('enrollment_number')
      .in('enrollment_number', enrollmentNumbers.filter(Boolean));

    if (existingEnrollments) {
      duplicateEnrollments.push(...existingEnrollments.map((e) => e.enrollment_number));
    }
  }

  return { duplicateEmails, duplicateEnrollments };
}

/**
 * Process and validate CSV data
 */
export async function processCSVData(
  rawData: any[],
  headerMapping: Record<string, string>
): Promise<{ validatedRows: ValidatedRow[]; summary: ImportSummary }> {
  const validatedRows: ValidatedRow[] = [];
  const summary: ImportSummary = {
    totalRows: rawData.length,
    validRows: 0,
    invalidRows: 0,
    capacityIssues: 0,
    missingFields: [],
    duplicates: 0,
    classesUpdated: 0,
  };

  // Map raw data to database fields
  const mappedData = rawData.map((row, index) => {
    const mapped: Record<string, any> = {};
    Object.entries(row).forEach(([key, value]) => {
      const dbField = headerMapping[key] || key;
      mapped[dbField] = value;
    });
    return { rowNumber: index + 2, data: mapped }; // +2 for header row and 0-index
  });

  // Collect all emails and enrollment numbers for duplicate check
  const allEmails = mappedData.map((r) => r.data.email).filter(Boolean);
  const allEnrollments = mappedData.map((r) => r.data.enrollment_number).filter(Boolean);
  const { duplicateEmails, duplicateEnrollments } = await checkDuplicates(
    allEmails,
    allEnrollments
  );

  // Group by class for capacity checking
  const classCounts: Record<string, number> = {};
  const classInfo: Record<
    string,
    { schoolId: string; grade: string; section: string; academicYear: string }
  > = {};

  // First pass: resolve school IDs and group by class
  for (const { rowNumber, data } of mappedData) {
    let schoolId = data.school_id;

    // If school_code provided, resolve to school_id
    if (!schoolId && data.school_code) {
      const result = await getSchoolIdFromCode(data.school_code);
      if (!result.schoolId || result.error) {
        validatedRows.push({
          rowNumber,
          data,
          errors: [
            {
              row: rowNumber,
              field: 'school_code',
              message: result.error || 'Invalid school code',
            },
          ],
          warnings: [],
          isValid: false,
        });
        continue;
      }
      schoolId = result.schoolId;
      data.school_id = schoolId;
    }

    // Validate school_id exists if provided (check organizations table)
    if (schoolId) {
      const { data: orgExists, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', schoolId)
        .maybeSingle();

      if (orgError || !orgExists) {
        validatedRows.push({
          rowNumber,
          data,
          errors: [
            {
              row: rowNumber,
              field: 'school_id',
              message: `School with ID "${schoolId}" does not exist`,
            },
          ],
          warnings: [],
          isValid: false,
        });
        continue;
      }
    }

    const classKey = `${schoolId}_${data.grade}_${data.section}_${data.academic_year}`;
    classCounts[classKey] = (classCounts[classKey] || 0) + 1;
    classInfo[classKey] = {
      schoolId,
      grade: data.grade,
      section: data.section,
      academicYear: data.academic_year,
    };
  }

  // Check capacity for each class
  const capacityResults: Record<
    string,
    { hasCapacity: boolean; available: number; max: number; classId: string; error?: string }
  > = {};

  for (const [classKey, count] of Object.entries(classCounts)) {
    const info = classInfo[classKey];
    const { classId, found, error } = await findExistingClass(
      info.schoolId,
      info.grade,
      info.section,
      info.academicYear
    );

    if (!found || error) {
      capacityResults[classKey] = {
        hasCapacity: false,
        available: 0,
        max: 0,
        classId: '',
        error: error || `Class ${info.grade}-${info.section} not found`,
      };
      continue;
    }

    summary.classesUpdated++;

    const capacity = await checkClassCapacity(classId, count);
    capacityResults[classKey] = { ...capacity, classId };
  }

  // Second pass: validate each row
  for (const { rowNumber, data } of mappedData) {
    const errors = validateRow(data, rowNumber);
    const warnings: string[] = [];

    // Check for duplicates
    if (duplicateEmails.includes(data.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Duplicate email - already exists in database',
      });
      summary.duplicates++;
    }

    if (data.enrollment_number && duplicateEnrollments.includes(data.enrollment_number)) {
      errors.push({
        row: rowNumber,
        field: 'enrollment_number',
        message: 'Duplicate enrollment number - already exists in database',
      });
    }

    // Check capacity
    const classKey = `${data.school_id}_${data.grade}_${data.section}_${data.academic_year}`;
    const capacity = capacityResults[classKey];

    let capacityIssue: string | undefined;

    // Check if class doesn't exist
    if (capacity && capacity.error) {
      capacityIssue = capacity.error;
      errors.push({
        row: rowNumber,
        field: 'class',
        message: capacityIssue,
      });
    } else if (capacity && !capacity.hasCapacity) {
      // Check capacity exceeded
      capacityIssue = `Class capacity exceeded (${capacity.available}/${capacity.max} available, ${classCounts[classKey]} students in CSV)`;
      errors.push({
        row: rowNumber,
        field: 'class_capacity',
        message: capacityIssue,
      });
      summary.capacityIssues++;
    }

    // Add class_id to data
    if (capacity && capacity.classId) {
      data.school_class_id = capacity.classId;
    }

    const isValid = errors.length === 0;

    validatedRows.push({
      rowNumber,
      data,
      errors,
      warnings,
      isValid,
      capacityIssue,
    });

    if (isValid) {
      summary.validRows++;
    } else {
      summary.invalidRows++;
    }
  }

  return { validatedRows, summary };
}

/**
 * Import validated students
 */
import userApiService from './userApiService';

/**
 * Import validated students
 */
export async function importStudents(
  validRows: ValidatedRow[],
  userEmail: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    return { success: 0, failed: validRows.length, errors: ['Authentication token missing'] };
  }

  for (const row of validRows) {
    try {
      // Call Cloudflare Worker via userApiService
      const result = await userApiService.createStudent(
        {
          userEmail,
          schoolId: row.data.school_id,
          student: {
            name: row.data.student_name,
            email: row.data.email,
            contactNumber: row.data.contact_number,
            alternateNumber: row.data.alternate_number || null,
            dateOfBirth: row.data.date_of_birth,
            gender: row.data.gender,
            enrollmentNumber: row.data.enrollment_number,
            rollNumber: row.data.roll_number,
            guardianName: row.data.guardian_name,
            guardianPhone: row.data.guardian_phone,
            guardianEmail: row.data.guardian_email,
            guardianRelation: row.data.guardian_relation,
            address: row.data.address,
            city: row.data.city,
            state: row.data.state,
            country: row.data.country,
            pincode: row.data.pincode,
            bloodGroup: row.data.blood_group,
            grade: row.data.grade,
            section: row.data.section,
            schoolClassId: row.data.school_class_id,
            approval_status: 'approved',
            student_type: 'csv_import',
          },
        },
        token
      );

      if (result.success) {
        success++;
      } else {
        failed++;
        errors.push(`Row ${row.rowNumber}: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      failed++;
      errors.push(`Row ${row.rowNumber}: ${error.message}`);
    }
  }

  return { success, failed, errors };
}
