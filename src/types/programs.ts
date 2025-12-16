// Programs & Sections Type Definitions

export interface Program {
  id: string;
  department_id: string;
  name: string;
  code: string;
  description?: string;
  degree_level: 'Undergraduate' | 'Postgraduate' | 'Diploma' | 'Certificate';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  created_by?: string;
  updated_by?: string;
}

export interface ProgramSection {
  id: string;
  department_id: string;
  program_id: string;
  semester: number;
  section: string;
  max_students: number;
  current_students: number;
  faculty_id?: string;
  academic_year: string;
  status: 'active' | 'inactive' | 'archived';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ProgramSectionView extends ProgramSection {
  department_name: string;
  department_code: string;
  program_name: string;
  program_code: string;
  degree_level: string;
  faculty_name?: string;
  faculty_email?: string;
}

export interface CreateProgramInput {
  department_id: string;
  name: string;
  code: string;
  description?: string;
  degree_level: Program['degree_level'];
  status?: Program['status'];
  metadata?: Record<string, any>;
}

export interface CreateProgramSectionInput {
  department_id: string;
  program_id: string;
  semester: number;
  section: string;
  max_students: number;
  faculty_id?: string;
  academic_year: string;
  status?: ProgramSection['status'];
  metadata?: Record<string, any>;
}

export interface UpdateProgramInput extends Partial<CreateProgramInput> {
  id: string;
}

export interface UpdateProgramSectionInput extends Partial<CreateProgramSectionInput> {
  id: string;
}
