/**
 * Admin Feature - Type Definitions
 */

// Settings Types
export interface Module {
  id: string;
  module_name: string;
  description: string;
  is_active: boolean;
}

export interface Permission {
  id: string;
  permission_name: string;
  description: string;
}

export interface RolePermission {
  role_type: string;
  module_id: string;
  permission_id: string;
  module_name: string;
  permission_name: string;
}

export interface Role {
  id: string;
  roleName: string;
  moduleAccess: ModuleAccess[];
  scopeRules: ScopeRule[];
}

export interface ModuleAccess {
  module: string;
  permissions: string[];
}

export interface ScopeRule {
  type: "department" | "program";
  values: string[];
}

// Notification Types
export type AdminNotificationType =
  | 'training_submitted'
  | 'experience_submitted'
  | 'project_submitted'
  | 'training_approved'
  | 'training_rejected'
  | 'experience_approved'
  | 'experience_rejected'
  | 'project_approved'
  | 'project_rejected'
  | 'system_alert';

// Learner Types
export interface Learner {
  id: string;
  name: string;
  email?: string;
  status?: string;
}

// Class Types
export interface SchoolClass {
  id: string;
  name: string;
  grade?: string;
  section?: string;
}

// Educator Types
export interface Educator {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

// Document Types
export interface Document {
  name: string;
  url: string;
  type?: string;
  size?: number;
}

// Status Types
export interface StatusOption {
  value: string;
  label: string;
  icon: any;
  color: string;
  description: string;
}

// KPI Types
export interface KPIData {
  totallearners: number;
  attendanceToday: number;
  activeClasses: number;
  pendingApprovals: number;
  averageGrade?: number;
  completionRate?: number;
}

export interface FilterOptions {
  grade?: string;
  section?: string;
  department?: string;
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// Attendance Types
export interface SubjectGroup {
  subject: string;
  department: string;
  sessions: any[];
}
