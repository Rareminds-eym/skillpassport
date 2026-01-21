// Type augmentations for missing properties

declare module '@/types/database' {
  interface Department {
    college_id?: string;
  }

  interface Mentor {
    employeeId?: string;
    gender?: string;
    qualification?: string;
    specialization?: string;
    experienceYears?: number;
    dateOfJoining?: string;
    address?: string;
  }

  interface Student {
    projects?: any[];
    universityCollege?: any;
    school?: any;
  }

  interface StudentProfile {
    universityCollege?: any;
    school?: any;
  }

  interface CollegeLessonPlan {
    course?: string;
    department?: string;
    program?: string;
  }
}

// Permission type
export type Permission = 'view' | 'edit' | 'delete' | 'create' | 'manage';

// Lucide Icon type fix
declare module 'lucide-react' {
  export type LucideIcon = React.FC<React.SVGProps<SVGSVGElement>>;
}
