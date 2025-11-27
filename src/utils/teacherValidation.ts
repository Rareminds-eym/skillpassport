// Teacher Onboarding Validation Rules

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates teacher name (alphabetic only)
 */
export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: "Name is required." };
  }
  
  const alphabeticRegex = /^[a-zA-Z\s]+$/;
  if (!alphabeticRegex.test(name)) {
    return { isValid: false, error: "Invalid name. Only alphabetic characters allowed." };
  }
  
  return { isValid: true };
};

/**
 * Validates email format and optionally checks school domain
 */
export const validateEmail = (email: string, schoolDomain?: string): ValidationResult => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: "Email is required." };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format." };
  }
  
  // Optional: Check school domain
  if (schoolDomain && !email.endsWith(`@${schoolDomain}`)) {
    return { isValid: false, error: `Email must belong to school domain (@${schoolDomain}).` };
  }
  
  return { isValid: true };
};

/**
 * Validates phone number (10 digits)
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: true }; // Phone is optional
  }
  
  const phoneRegex = /^\d{10}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, ''); // Remove formatting
  
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: "Phone invalid. Must be 10 digits." };
  }
  
  return { isValid: true };
};

/**
 * Validates subjects (minimum 1 required)
 */
export const validateSubjects = (subjects: any[]): ValidationResult => {
  if (!subjects || subjects.length === 0) {
    return { isValid: false, error: "Assign at least one subject." };
  }
  
  return { isValid: true };
};

/**
 * Validates document file (PDF/JPG only, max 5MB)
 */
export const validateDocument = (file: File | null, required: boolean = false): ValidationResult => {
  if (!file) {
    if (required) {
      return { isValid: false, error: "Document is required." };
    }
    return { isValid: true };
  }
  
  // Check file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "Invalid file format. Only PDF/JPG/PNG allowed." };
  }
  
  // Check file size (5 MB max)
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_SIZE) {
    return { isValid: false, error: "File exceeds 5 MB limit." };
  }
  
  return { isValid: true };
};

/**
 * Validates all teacher onboarding data
 */
export const validateTeacherOnboarding = (data: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  subjects: any[];
  degree_certificate: File | null;
  id_proof: File | null;
  schoolDomain?: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Validate first name
  const firstNameResult = validateName(data.first_name);
  if (!firstNameResult.isValid) {
    errors.first_name = firstNameResult.error!;
  }
  
  // Validate last name
  const lastNameResult = validateName(data.last_name);
  if (!lastNameResult.isValid) {
    errors.last_name = lastNameResult.error!;
  }
  
  // Validate email
  const emailResult = validateEmail(data.email, data.schoolDomain);
  if (!emailResult.isValid) {
    errors.email = emailResult.error!;
  }
  
  // Validate phone
  const phoneResult = validatePhone(data.phone);
  if (!phoneResult.isValid) {
    errors.phone = phoneResult.error!;
  }
  
  // Validate subjects
  const subjectsResult = validateSubjects(data.subjects);
  if (!subjectsResult.isValid) {
    errors.subjects = subjectsResult.error!;
  }
  
  // Validate degree certificate (temporarily optional)
  const degreeResult = validateDocument(data.degree_certificate, false);
  if (!degreeResult.isValid) {
    errors.degree_certificate = degreeResult.error!;
  }
  
  // Validate ID proof (temporarily optional)
  const idProofResult = validateDocument(data.id_proof, false);
  if (!idProofResult.isValid) {
    errors.id_proof = idProofResult.error!;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
