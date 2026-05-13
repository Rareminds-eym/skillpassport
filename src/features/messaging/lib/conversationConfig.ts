/**
 * Conversation Configuration
 * 
 * Defines role-based conversation types and their configurations.
 * Used by the unified ConversationModal to handle different role combinations.
 */

export type ConversationType = 
  | 'learner-educator'
  | 'learner-admin'
  | 'learner-college-admin'
  | 'admin-learner'
  | 'admin-educator'
  | 'college-admin-learner'
  | 'college-admin-educator'
  | 'educator-admin'
  | 'educator-learner'
  | 'college-lecturer'
  | 'college-educator-admin';

export interface ConversationConfig {
  title: string;
  subtitle: string;
  icon: 'GraduationCap' | 'Building2' | 'MessageCircle';
  iconColor: string;
  iconBgColor: string;
  primaryColor: string;
  subjects?: string[];
  defaultSubject?: string;
  showSubjectSelection: boolean;
  allowCustomSubject: boolean;
  maxMessageLength: number;
  quickStarters?: string[];
  recipientLabel: string;
  fetchRecipients?: boolean;
}

export const conversationConfigs: Record<ConversationType, ConversationConfig> = {
  'learner-educator': {
    title: 'Select Educator',
    subtitle: 'Choose who you want to message',
    icon: 'GraduationCap',
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    primaryColor: 'blue',
    subjects: [],
    showSubjectSelection: false,
    allowCustomSubject: false,
    maxMessageLength: 500,
    quickStarters: [
      'Hi! I have a question',
      'Need help with homework',
      'Can you clarify something?'
    ],
    recipientLabel: 'Educator',
    fetchRecipients: true
  },
  
  'learner-admin': {
    title: 'Message School Admin',
    subtitle: 'Start a conversation',
    icon: 'Building2',
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    primaryColor: 'blue',
    subjects: [
      'General Inquiry',
      'Academic Support',
      'Attendance Issue',
      'Fee Payment',
      'Document Request',
      'Complaint/Feedback',
      'Technical Support',
      'Admission Query',
      'Transfer Request',
      'Other'
    ],
    defaultSubject: 'General Inquiry',
    showSubjectSelection: true,
    allowCustomSubject: true,
    maxMessageLength: 1000,
    quickStarters: [
      'Hi! I need to discuss something',
      'Regarding my academic progress',
      'Can we schedule a meeting?'
    ],
    recipientLabel: 'School Admin',
    fetchRecipients: false
  },
  
  'learner-college-admin': {
    title: 'Message College Admin',
    subtitle: 'Start a conversation',
    icon: 'Building2',
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-100',
    primaryColor: 'purple',
    subjects: [
      'General Inquiry',
      'Academic Support',
      'Attendance Issue',
      'Fee Payment',
      'Document Request',
      'Complaint/Feedback',
      'Technical Support',
      'Admission Query',
      'Course Registration',
      'Examination Query',
      'Placement Support',
      'Library Access',
      'Hostel/Accommodation',
      'Other'
    ],
    defaultSubject: 'General Inquiry',
    showSubjectSelection: true,
    allowCustomSubject: true,
    maxMessageLength: 1000,
    quickStarters: [
      'Hi! I need assistance',
      'Regarding college matters',
      'Can you help me with this?'
    ],
    recipientLabel: 'College Admin',
    fetchRecipients: false
  },
  
  'admin-learner': {
    title: 'Select Learner',
    subtitle: 'Choose who you want to message',
    icon: 'GraduationCap',
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    primaryColor: 'blue',
    subjects: [
      'General Inquiry',
      'Academic Support',
      'Attendance Issue',
      'Fee Payment',
      'Document Request',
      'Complaint/Feedback',
      'Technical Support',
      'Admission Query',
      'Transfer Request',
      'Other'
    ],
    defaultSubject: 'General Inquiry',
    showSubjectSelection: true,
    allowCustomSubject: true,
    maxMessageLength: 1000,
    quickStarters: [
      'Hi! I need to discuss something',
      'Regarding your academic progress',
      'Can we schedule a meeting?'
    ],
    recipientLabel: 'Learner',
    fetchRecipients: true
  },
  
  'admin-educator': {
    title: 'Select Educator',
    subtitle: 'Choose who you want to message',
    icon: 'GraduationCap',
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    primaryColor: 'blue',
    subjects: [
      'General Communication',
      'Resource Allocation',
      'Learner Performance',
      'Curriculum Discussion',
      'Policy Update',
      'Training Information',
      'Schedule Coordination',
      'Facility Management',
      'Performance Review',
      'Other'
    ],
    defaultSubject: 'General Communication',
    showSubjectSelection: true,
    allowCustomSubject: true,
    maxMessageLength: 1000,
    quickStarters: [
      'Hi! I need to discuss something',
      'Regarding school operations',
      'Can we schedule a meeting?'
    ],
    recipientLabel: 'Educator',
    fetchRecipients: true
  },
  
  'college-admin-learner': {
    title: 'Select Learner',
    subtitle: 'Choose who you want to message',
    icon: 'GraduationCap',
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-100',
    primaryColor: 'purple',
    subjects: [
      'General Inquiry',
      'Academic Support',
      'Attendance Issue',
      'Fee Payment',
      'Document Request',
      'Complaint/Feedback',
      'Technical Support',
      'Admission Query',
      'Course Registration',
      'Examination Query',
      'Other'
    ],
    defaultSubject: 'General Inquiry',
    showSubjectSelection: true,
    allowCustomSubject: true,
    maxMessageLength: 1000,
    quickStarters: [
      'Hi! I need to discuss something',
      'Regarding your academic progress',
      'Can we schedule a meeting?'
    ],
    recipientLabel: 'Learner',
    fetchRecipients: true
  },
  
  'college-admin-educator': {
    title: 'Select Educator',
    subtitle: 'Choose who you want to message',
    icon: 'GraduationCap',
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-100',
    primaryColor: 'purple',
    subjects: [
      'General Communication',
      'Resource Allocation',
      'Learner Performance',
      'Curriculum Discussion',
      'Policy Update',
      'Training Information',
      'Schedule Coordination',
      'Facility Management',
      'Performance Review',
      'Other'
    ],
    defaultSubject: 'General Communication',
    showSubjectSelection: true,
    allowCustomSubject: true,
    maxMessageLength: 1000,
    quickStarters: [
      'Hi! I need to discuss something',
      'Regarding college operations',
      'Can we schedule a meeting?'
    ],
    recipientLabel: 'Educator',
    fetchRecipients: true
  },
  
  'educator-admin': {
    title: 'Message Admin',
    subtitle: 'Start a conversation',
    icon: 'Building2',
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    primaryColor: 'blue',
    subjects: [
      'General Communication',
      'Resource Request',
      'Learner Issue',
      'Curriculum Support',
      'Policy Question',
      'Training Request',
      'Schedule Conflict',
      'Facility Issue',
      'Other'
    ],
    defaultSubject: 'General Communication',
    showSubjectSelection: true,
    allowCustomSubject: true,
    maxMessageLength: 1000,
    quickStarters: [
      'Hi! I need assistance',
      'Regarding school matters',
      'Can you help me with this?'
    ],
    recipientLabel: 'Admin',
    fetchRecipients: false
  },
  
  'educator-learner': {
    title: 'Select Learner',
    subtitle: 'Choose who you want to message',
    icon: 'GraduationCap',
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    primaryColor: 'blue',
    subjects: [],
    defaultSubject: 'General Discussion',
    showSubjectSelection: false,
    allowCustomSubject: false,
    maxMessageLength: 500,
    quickStarters: [
      'Hi! I wanted to discuss',
      'Regarding your progress',
      'Can we talk about this?'
    ],
    recipientLabel: 'Learner',
    fetchRecipients: true
  },
  
  'college-lecturer': {
    title: 'Select Lecturer',
    subtitle: 'Choose who you want to message',
    icon: 'GraduationCap',
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    primaryColor: 'blue',
    subjects: [],
    showSubjectSelection: true,
    allowCustomSubject: false,
    maxMessageLength: 500,
    quickStarters: [
      'Hi! I have a question',
      'Need help with assignment',
      'Can you explain this topic?'
    ],
    recipientLabel: 'Lecturer',
    fetchRecipients: true
  },
  
  'college-educator-admin': {
    title: 'Message College Admin',
    subtitle: 'Start a conversation',
    icon: 'Building2',
    iconColor: 'text-purple-600',
    iconBgColor: 'bg-purple-100',
    primaryColor: 'purple',
    subjects: [
      'General Communication',
      'Resource Request',
      'Learner Issue',
      'Curriculum Support',
      'Policy Question',
      'Training Request',
      'Schedule Conflict',
      'Facility Issue',
      'Other'
    ],
    defaultSubject: 'General Communication',
    showSubjectSelection: true,
    allowCustomSubject: true,
    maxMessageLength: 1000,
    quickStarters: [
      'Hi! I need assistance',
      'Regarding college matters',
      'Can you help me with this?'
    ],
    recipientLabel: 'College Admin',
    fetchRecipients: false
  }
};

export function getConversationConfig(type: ConversationType): ConversationConfig {
  return conversationConfigs[type];
}
