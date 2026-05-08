/**
 * Mock Data for Integration Tests
 * 
 * Reusable mock data objects for testing
 */

export const mockLearner = {
  id: 'learner-123',
  user_id: 'user-123',
  email: 'learner@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '+919876543210',
  date_of_birth: '2005-01-15',
  gender: 'male',
  school_id: 'school-123',
  grade_level: '10',
  created_at: new Date().toISOString()
};

export const mockEducator = {
  id: 'educator-123',
  user_id: 'user-456',
  email: 'educator@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  phone_number: '+919876543211',
  school_id: 'school-123',
  subjects: ['Mathematics', 'Physics'],
  created_at: new Date().toISOString()
};

export const mockRecruiter = {
  id: 'recruiter-123',
  user_id: 'user-789',
  email: 'recruiter@example.com',
  first_name: 'Bob',
  last_name: 'Johnson',
  phone_number: '+919876543212',
  company_id: 'company-123',
  designation: 'HR Manager',
  created_at: new Date().toISOString()
};

export const mockSchool = {
  id: 'school-123',
  name: 'Test High School',
  code: 'THS001',
  email: 'admin@testschool.edu',
  phone_number: '+919876543213',
  address: '123 School Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  board_affiliation: 'CBSE',
  principal_name: 'Dr. Principal',
  principal_email: 'principal@testschool.edu',
  created_at: new Date().toISOString()
};

export const mockCollege = {
  id: 'college-123',
  name: 'Test College',
  code: 'TC001',
  email: 'admin@testcollege.edu',
  phone_number: '+919876543214',
  address: '456 College Road',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001',
  accreditation: 'NAAC A+',
  registrar_name: 'Dr. Registrar',
  registrar_email: 'registrar@testcollege.edu',
  created_at: new Date().toISOString()
};

export const mockCompany = {
  id: 'company-123',
  name: 'Test Tech Corp',
  code: 'TTC001',
  email: 'hr@testtech.com',
  phone_number: '+919876543215',
  address: '789 Tech Park',
  city: 'Bangalore',
  state: 'Karnataka',
  pincode: '560001',
  industry: 'Technology',
  company_size: '50-200',
  website: 'https://testtech.com',
  created_at: new Date().toISOString()
};

export const mockConversation = {
  id: 'conv_123',
  learner_id: 'learner-123',
  recruiter_id: 'recruiter-123',
  conversation_type: 'learner_recruiter',
  status: 'active',
  learner_unread_count: 0,
  recruiter_unread_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockMessage = {
  id: 1,
  conversation_id: 'conv_123',
  sender_id: 'learner-123',
  sender_type: 'learner',
  receiver_id: 'recruiter-123',
  receiver_type: 'recruiter',
  message_text: 'Hello, I am interested in this opportunity.',
  is_read: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockRole = {
  id: 'role-123',
  role_type: 'learner',
  role_name: 'Learner',
  description: 'Learner role with basic access',
  created_at: new Date().toISOString()
};

export const mockPermission = {
  id: 'perm-123',
  permission_key: 'view_courses',
  permission_name: 'View Courses',
  description: 'Can view course content',
  module_id: 'module-123',
  created_at: new Date().toISOString()
};

export const mockModule = {
  id: 'module-123',
  module_key: 'courses',
  module_name: 'Courses',
  description: 'Course management module',
  created_at: new Date().toISOString()
};

export const mockFileUploadResponse = {
  success: true,
  url: 'https://storage.example.com/documents/test.pdf',
  filename: 'documents/1234567890_abc123.pdf'
};

export const mockAuthSession = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
  refresh_token: 'refresh_token_test',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'user-123',
    email: 'test@example.com',
    role: 'authenticated'
  }
};

export const mockSupabaseError = {
  message: 'Database error',
  details: 'Test error details',
  hint: 'Test error hint',
  code: 'TEST_ERROR'
};
