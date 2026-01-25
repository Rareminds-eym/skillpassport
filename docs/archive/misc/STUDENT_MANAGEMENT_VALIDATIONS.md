# Student Management System - Validation Rules

## 6.1.1 Student Admission Form – Validation Matrix

| Field | Validation Rule | Error Message | Notes |
|-------|----------------|---------------|-------|
| **First Name** | Alphabetic only; min 2 chars | "First name must contain only letters." | No digits or symbols allowed |
| **Last Name** | Alphabetic only; min 1 char | "Last name must contain only letters." | — |
| **Date of Birth** | Must be ≥ 3 years old and ≤ 20 years old | "Age not suitable for selected class." | Calculated on class selection |
| **Gender** | Mandatory | "Please select a gender." | — |
| **Class Applied** | Required | "Please choose a class." | Available classes are dynamic |
| **Parent Phone** | Must be 10 digits | "Invalid mobile number." | No country code allowed |
| **Parent Email** | Must be valid format | "Invalid email address." | Must be unique |
| **Address Line 1** | Required | "Address cannot be empty." | — |
| **Birth Certificate** | File must be PDF/JPG; size < 10MB | "Unsupported file type or file too large." | Verification needed |
| **Medical Information** | Optional | — | If filled, must match field format |
| **Previous School Name** | Optional text | "Invalid school name." | Special chars not allowed |

### Form-Level Validations
- Total size of all uploaded documents < 25MB
- Duplicate student detection based on: Name + DOB + Parent phone

## 6.1.2 Student Profile Edits – Validation Matrix

| Field | Rule | Constraint |
|-------|------|------------|
| **Email (Parent)** | Cannot be changed after verification | System must lock field |
| **Class & Section** | Can only be changed by Principal | Requires justification note |
| **Student Status** | Alumni only if graduation workflow completed | Lock transitions |

## 6.1.3 Attendance Entry – Validation Matrix

| Field | Rule | Behavior |
|-------|------|----------|
| **Status** | Must be one of: present, absent, late, excused | Dropdown only |
| **Date** | Cannot be future date | Error if future |
| **Remarks** | Max 280 chars | For explanation of late/excused |
| **Bulk Mark-All-Present** | Allowed only before 10 AM | After 10 AM → manual only |

### Additional Rules
- Student cannot be marked present in two classes in same period
- Attendance cannot be edited after 24 hours unless Principal approves

## Usage Examples

### 1. Validate Admission Form

```typescript
import { validationUtils } from '@/services/studentManagementService';

const formData = {
  studentName: 'John Doe',
  dateOfBirth: '2015-05-15',
  gender: 'male',
  appliedFor: 'Class 3',
  phone: '9876543210',
  email: 'parent@example.com',
  address: '123 Main Street',
  fatherName: 'John Sr',
  motherName: 'Jane Doe'
};

const errors = validationUtils.validateAdmissionData(formData);

if (errors.length > 0) {
  console.error('Validation errors:', errors);
  // Display errors to user
} else {
  // Proceed with submission
}
```

### 2. Validate Document Upload

```typescript
const file = document.getElementById('birthCertificate').files[0];
const error = validationUtils.validateDocument(file, 'birthCertificate');

if (error) {
  alert(error.message);
} else {
  // Upload file
}
```

### 3. Validate Total Documents Size

```typescript
const allFiles = [
  birthCertificateFile,
  transferCertificateFile,
  photoFile
];

const error = validationUtils.validateTotalDocumentsSize(allFiles);

if (error) {
  alert(error.message);
} else {
  // Proceed with upload
}
```

### 4. Check Profile Edit Permission

```typescript
const userRole = 'teacher'; // or 'principal'
const fieldToEdit = 'class';

const { allowed, message } = validationUtils.validateProfileEdit(fieldToEdit, userRole);

if (!allowed) {
  alert(message);
} else {
  // Allow edit
}
```

### 5. Validate Attendance Entry

```typescript
const attendanceData = {
  date: '2024-01-15',
  status: 'present',
  remarks: 'Arrived on time',
  currentTime: new Date(),
  isBulkMarkAll: false
};

const errors = validationUtils.validateAttendanceEntry(attendanceData);

if (errors.length > 0) {
  console.error('Attendance validation errors:', errors);
} else {
  // Mark attendance
}
```

### 6. Check if Attendance Can Be Edited

```typescript
const attendanceDate = '2024-01-14';
const userRole = 'teacher';

const { allowed, message } = validationUtils.canEditAttendance(attendanceDate, userRole);

if (!allowed) {
  alert(message);
  // Show "Request Principal Approval" button
} else {
  // Allow edit
}
```

### 7. Check for Duplicate Student

```typescript
const isDuplicate = await validationUtils.checkDuplicateStudent(
  'John Doe',
  '2015-05-15',
  '9876543210'
);

if (isDuplicate) {
  alert('A student with the same name, date of birth, and parent phone already exists.');
} else {
  // Proceed with admission
}
```

## Frontend Implementation Tips

### Real-time Validation

```typescript
// Name field - only letters
<input 
  type="text"
  onInput={(e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
  }}
/>

// Phone field - only 10 digits
<input 
  type="tel"
  maxLength={10}
  onInput={(e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  }}
/>

// Age calculation on DOB change
<input 
  type="date"
  onChange={(e) => {
    const age = calculateAge(e.target.value);
    if (age < 3 || age > 20) {
      setError('Age not suitable for selected class.');
    }
  }}
/>
```

### Bulk Mark Present with Time Check

```typescript
const handleBulkMarkPresent = () => {
  const currentHour = new Date().getHours();
  
  if (currentHour >= 10) {
    alert('Bulk mark-all-present is only allowed before 10 AM.');
    return;
  }
  
  // Proceed with bulk marking
  markAllPresent();
};
```

### Document Upload with Size Check

```typescript
const handleFileUpload = (files: FileList) => {
  const fileArray = Array.from(files);
  
  // Check individual file
  for (const file of fileArray) {
    const error = validationUtils.validateDocument(file, 'document');
    if (error) {
      alert(error.message);
      return;
    }
  }
  
  // Check total size
  const totalError = validationUtils.validateTotalDocumentsSize(fileArray);
  if (totalError) {
    alert(totalError.message);
    return;
  }
  
  // Upload files
  uploadDocuments(fileArray);
};
```

## Database Constraints

Add these constraints in your migration for additional safety:

```sql
-- Admission applications constraints
ALTER TABLE admission_applications
  ADD CONSTRAINT check_phone_format CHECK (phone ~ '^\d{10}$'),
  ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT check_age_range CHECK (
    EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 3 AND 20
  );

-- Attendance records constraints
ALTER TABLE attendance_records
  ADD CONSTRAINT check_date_not_future CHECK (date <= CURRENT_DATE),
  ADD CONSTRAINT check_remarks_length CHECK (LENGTH(remarks) <= 280);
```

## Error Handling Best Practices

```typescript
try {
  // Validate before submission
  const errors = validationUtils.validateAdmissionData(formData);
  
  if (errors.length > 0) {
    // Group errors by field
    const errorsByField = errors.reduce((acc, err) => {
      acc[err.field] = err.message;
      return acc;
    }, {});
    
    // Display errors in form
    setFormErrors(errorsByField);
    return;
  }
  
  // Check for duplicates
  const isDuplicate = await validationUtils.checkDuplicateStudent(
    formData.studentName,
    formData.dateOfBirth,
    formData.phone
  );
  
  if (isDuplicate) {
    alert('Duplicate student detected. Please verify the details.');
    return;
  }
  
  // Submit form
  await admissionService.createApplication(formData, schoolId);
  
} catch (error) {
  console.error('Submission error:', error);
  alert('An error occurred. Please try again.');
}
```
