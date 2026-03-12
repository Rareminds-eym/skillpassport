// Analytics service type definitions - matching actual database schema

export interface PipelineCandidate {
  id?: string;
  status?: string;
  stage?: string;
  pipeline_candidate_id?: string;
  student_id?: string | null;
  added_at?: string;
  students?: {
    id?: string;
    university_college_id?: string;
    school_id?: string;
    state?: string;
    employability_score?: number;
    currentCgpa?: number;
    gender?: string;
    age?: number;
    branch_field?: string;
    university?: string;
    college_school_name?: string;
    profile?: {
      course?: string;
      program?: string;
    };
  } | {
    id?: string;
    university_college_id?: string;
    school_id?: string;
    state?: string;
    employability_score?: number;
    currentCgpa?: number;
    gender?: string;
    age?: number;
    branch_field?: string;
    university?: string;
    college_school_name?: string;
    profile?: any;
  }[];
}

export interface PipelineActivity {
  id?: string;
  pipeline_candidate_id?: string;
  activity_type?: string;
  to_stage?: string;
  from_stage?: string;
  created_at?: string;
}

export interface HireRecord {
  id?: string;
  pipeline_candidate_id?: string;
  student_id?: string | null;
  created_at?: string;
}

export interface StudentRecord {
  id?: string;
  employability_score?: number;
  university_college_id?: string;
  school_id?: string;
  state?: string;
  currentCgpa?: number;
  gender?: string;
  age?: number;
  branch_field?: string;
  profile?: {
    course?: string;
    program?: string;
  };
}

export interface CollegeRecord {
  id?: string;
  name?: string;
  university_id?: string;
}

export interface UniversityRecord {
  id?: string;
  name?: string;
}

export interface SchoolRecord {
  id?: string;
  name?: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}