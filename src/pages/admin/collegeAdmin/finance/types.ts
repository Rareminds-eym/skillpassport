// Finance Module Types - College

export interface FeeHead {
  name: string;
  amount: number;
  is_mandatory: boolean;
}

export interface DueSchedule {
  installment: number;
  due_date: string;
  amount: number;
}

export interface FeeStructure {
  id: string;
  college_id?: string;
  program_id?: string;
  program_name: string; // Stream: Science, Commerce, Arts, etc.
  semester: number; // 1 = 1st Year, 2 = 2nd Year, etc.
  academic_year: string;
  category: FeeCategory;
  quota: FeeQuota;
  fee_heads: FeeHead[];
  total_amount: number;
  due_schedule: DueSchedule[];
  scholarship_applicable: boolean;
  scholarship_amount: number;
  discount_percentage: number;
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  created_by?: string;
  approved_by?: string;
  created_at?: string;
  updated_at?: string;
}

export type FeeCategory =
  | 'General'
  | 'OBC'
  | 'SC'
  | 'ST'
  | 'EWS'
  | 'Management'
  | 'NRI'
  | 'Foreign';
export type FeeQuota = 'Merit' | 'Management' | 'NRI' | 'Sports' | 'Defense';

export interface Department {
  id: string;
  name: string;
  code?: string;
  college_id?: string;
}

export interface Program {
  id: string;
  name: string;
  code?: string;
  department_id?: string;
}

// PU College Streams
export const PU_STREAMS = [
  'Science (PCMB)',
  'Science (PCMC)',
  'Science (PCME)',
  'Commerce',
  'Commerce with Computer Science',
  'Arts',
  'Arts with Psychology',
];

// College Years
export const PU_YEARS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
];

export const FEE_CATEGORIES: FeeCategory[] = [
  'General',
  'OBC',
  'SC',
  'ST',
  'EWS',
  'Management',
  'NRI',
  'Foreign',
];
export const FEE_QUOTAS: FeeQuota[] = ['Merit', 'Management', 'NRI', 'Sports', 'Defense'];

export const DEFAULT_FEE_HEADS = [
  'Tuition Fee',
  'Admission Fee',
  'Lab Fee',
  'Library Fee',
  'Examination Fee',
  'Development Fee',
  'Sports Fee',
  'Cultural Fee',
  'Computer Lab Fee',
  'ID Card Fee',
  'Caution Deposit',
  'Registration Fee',
  'Association Fee',
  'Magazine Fee',
];

// Fee Tracking Types
export interface StudentLedger {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  fee_structure_id: string;
  fee_head_id: string;
  fee_head_name: string;
  due_amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  installment_number?: number;
  payment_status: PaymentStatus;
  is_overdue: boolean;
  late_fee_amount?: number;
  late_fee_waived?: boolean;
  waiver_amount?: number;
  waiver_reason?: string;
  waived_by?: string;
  waived_at?: string;
  college_id?: string;
  student_record_id?: string;
  created_at?: string;
  updated_at?: string;
}

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'waived';

export interface FeePayment {
  id: string;
  ledger_id: string;
  student_id: string;
  amount: number;
  mode: PaymentMode;
  reference_number?: string;
  transaction_id?: string;
  bank_name?: string;
  cheque_number?: string;
  cheque_date?: string;
  dd_number?: string;
  receipt_number: string;
  receipt_url?: string;
  paid_at: string;
  payment_date: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  is_reconciled: boolean;
  reconciled_by?: string;
  reconciled_at?: string;
  status: string;
  remarks?: string;
  recorded_by: string;
  created_at?: string;
  updated_at?: string;
}

export type PaymentMode = 'Cash' | 'Cheque' | 'DD' | 'Online' | 'UPI' | 'Bank Transfer' | 'Card';

export const PAYMENT_MODES: PaymentMode[] = [
  'Cash',
  'Cheque',
  'DD',
  'Online',
  'UPI',
  'Bank Transfer',
  'Card',
];

// Aggregated student fee summary for list view
export interface StudentFeeSummary {
  student_id: string;
  student_name: string;
  roll_number: string;
  stream?: string;
  year?: number;
  total_due: number;
  total_paid: number;
  balance: number;
  status: PaymentStatus;
  last_payment_date?: string;
  ledger_entries: StudentLedger[];
}
