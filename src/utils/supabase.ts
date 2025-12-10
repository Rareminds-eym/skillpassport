import { createClient } from '@supabase/supabase-js';
import { Student } from '../types/student';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});

export const studentService = {
  async getStudent(id: string): Promise<Student | null> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching student:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching student:', error);
      return null;
    }
  },

  async getStudentByEmail(email: string): Promise<Student | null> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error fetching student by email:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching student by email:', error);
      return null;
    }
  },

  async updateStudentProfile(id: string, profile: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('students')
        .update({ profile })
        .eq('id', id);

      if (error) {
        console.error('Error updating student profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating student profile:', error);
      return false;
    }
  },

  async uploadProfileImage(file: File, studentId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      return null;
    }
  }
};

// Mock data for development/demo purposes
export const mockStudent: Student = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  universityId: '123e4567-e89b-12d3-a456-426614174001',
  profile: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    passportId: 'DP2024001',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    bio: 'Passionate full-stack developer with expertise in React, Node.js, and cloud technologies. Love creating innovative solutions and learning new technologies.',
    skills: [
      { name: 'JavaScript', level: 'Expert', category: 'Programming' },
      { name: 'React', level: 'Advanced', category: 'Frontend' },
      { name: 'Node.js', level: 'Advanced', category: 'Backend' },
      { name: 'Python', level: 'Intermediate', category: 'Programming' },
      { name: 'AWS', level: 'Intermediate', category: 'Cloud' }
    ],
    technicalSkills: [
      { name: 'JavaScript', level: 9, category: 'Programming Languages' },
      { name: 'TypeScript', level: 8, category: 'Programming Languages' },
      { name: 'React', level: 9, category: 'Frontend Frameworks' },
      { name: 'Node.js', level: 8, category: 'Backend Technologies' },
      { name: 'MongoDB', level: 7, category: 'Databases' },
      { name: 'AWS', level: 6, category: 'Cloud Platforms' }
    ],
    projects: [
      {
        id: '1',
        title: 'E-Commerce Platform',
        description: 'Full-stack e-commerce solution with React frontend and Node.js backend',
        technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
        github_url: 'https://github.com/johndoe/ecommerce',
        live_url: 'https://myecommerce.com',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
        startDate: '2024-01-01',
        endDate: '2024-03-01'
      },
      {
        id: '2',
        title: 'Task Management App',
        description: 'Collaborative task management application with real-time updates',
        technologies: ['React', 'Firebase', 'Material-UI'],
        github_url: 'https://github.com/johndoe/taskmanager',
        live_url: 'https://mytaskmanager.com',
        image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop',
        startDate: '2023-10-01',
        endDate: '2023-12-01'
      }
    ],
    education: [
      {
        id: '1',
        institution: 'University of Technology',
        degree: 'Bachelor of Technology',
        field: 'Computer Science Engineering',
        startDate: '2020-08-01',
        endDate: '2024-05-01',
        grade: '8.5 CGPA',
        description: 'Specialized in software engineering and web technologies'
      }
    ],
    experience: [
      {
        id: '1',
        company: 'Tech Solutions Inc.',
        position: 'Frontend Developer Intern',
        startDate: '2023-06-01',
        endDate: '2023-08-01',
        description: 'Developed responsive web applications using React and collaborated with the design team',
        technologies: ['React', 'JavaScript', 'CSS', 'Git']
      }
    ],
    certifications: [
      {
        id: '1',
        name: 'AWS Certified Developer Associate',
        issuer: 'Amazon Web Services',
        date: '2024-02-15',
        url: 'https://aws.amazon.com/certification/'
      },
      {
        id: '2',
        name: 'React Developer Certification',
        issuer: 'Meta',
        date: '2023-11-20',
        url: 'https://developers.facebook.com/docs/react/'
      }
    ],
    languages: [
      { name: 'English', proficiency: 'Fluent' },
      { name: 'Spanish', proficiency: 'Conversational' },
      { name: 'French', proficiency: 'Basic' }
    ],
    hobbies: ['Photography', 'Hiking', 'Reading', 'Gaming', 'Cooking'],
    interests: ['Artificial Intelligence', 'Machine Learning', 'Blockchain', 'IoT', 'Cybersecurity'],
    achievements: [
      {
        id: '1',
        title: 'Best Project Award',
        description: 'Won first place in university hackathon for innovative web application',
        date: '2023-11-15',
        category: 'Academic'
      },
      {
        id: '2',
        title: 'Dean\'s List',
        description: 'Achieved Dean\'s List recognition for academic excellence',
        date: '2023-05-01',
        category: 'Academic'
      }
    ],
    training: [
      {
        id: '1',
        name: 'Full Stack Web Development',
        provider: 'Coding Bootcamp',
        completionDate: '2023-08-01',
        skills: ['React', 'Node.js', 'MongoDB', 'Express']
      }
    ]
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  email: 'john.doe@example.com',
  name: 'John Doe',
  age: 22,
  date_of_birth: '2002-03-15',
  contact_number: '+1234567890',
  alternate_number: '+1234567891',
  district_name: 'Tech District',
  university: 'University of Technology',
  branch_field: 'Computer Science Engineering',
  college_school_name: 'School of Engineering',
  registration_number: 'CSE2020001',
  github_link: 'https://github.com/johndoe',
  linkedin_link: 'https://linkedin.com/in/johndoe',
  twitter_link: 'https://twitter.com/johndoe',
  facebook_link: 'https://facebook.com/johndoe',
  instagram_link: 'https://instagram.com/johndoe',
  portfolio_link: 'https://johndoe.dev',
  other_social_links: [
    { platform: 'YouTube', url: 'https://youtube.com/johndoe' },
    { platform: 'Medium', url: 'https://medium.com/@johndoe' }
  ],
  approval_status: 'approved',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};