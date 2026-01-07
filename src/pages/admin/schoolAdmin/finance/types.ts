export interface FeeStructure {
  id: string;
  school_id: string;
  class_id: string;
  class_name: string;
  academic_year: string;
  fee_head: string;
  custom_fee_head?: string;
  amount: number;
  frequency: 'monthly' | 'term' | 'annual';
  late_fee_percentage?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentLedger {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  student_email?: string;
  school_id: string;
  fee_structure_id: string;
  fee_head_id: string;
  fee_head_name: string;
  due_amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  payment_status: PaymentStatus;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

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
  payment_date: string;
  paid_at: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  remarks?: string;
  recorded_by: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  is_reconciled: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentFeeSummary {
  student_id: string;
  student_name: string;
  roll_number: string;
  total_due: number;
  total_paid: number;
  balance: number;
  status: PaymentStatus;
  ledger_entries: StudentLedger[];
}

export type PaymentStatus = 'paid' | 'partial' | 'pending' | 'overdue' | 'waived';

export type PaymentMode = 'cash' | 'cheque' | 'dd' | 'online' | 'card' | 'upi' | 'bank_transfer';

export interface Class {
  id: string;
  name: string;
  grade: number;
  section?: string;
}

export interface FeeHead {
  id: string;
  name: string;
  description?: string;
  is_mandatory: boolean;
  category: 'tuition' | 'development' | 'activity' | 'transport' | 'hostel' | 'other';
}