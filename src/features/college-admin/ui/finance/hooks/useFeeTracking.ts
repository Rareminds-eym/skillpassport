import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from '@/shared/api/supabaseClient';
import { FeePayment, PaymentStatus, StudentFeeSummary, StudentLedger } from '@/features/student-profile/model';
import { getExpenditureSummary } from "@/features/college-admin";
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('fee-tracking');

export const useFeeTracking = () => {
  const [ledgers, setLedgers] = useState<StudentLedger[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState<any>(null);
  const [collegeId, setCollegeId] = useState<string | null>(null);

  // Get college ID using the same pattern as useAdminStudents
  const getCollegeId = useCallback(async () => {
    try {
      // First, check localStorage for college admin data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.role === 'college_admin' && userData.collegeId) {
          return userData.collegeId;
        }
      }

      // If not found in localStorage, try Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user role from users table
        const { data: userRecord } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userRecord?.role === 'college_admin') {
          // Find college by matching email in organizations table (case-insensitive)
          const { data: org } = await supabase
            .from('organizations')
            .select('id, name, email')
            .eq('organization_type', 'college')
            .or(`admin_id.eq.${user.id},email.ilike.${user.email}`)
            .maybeSingle();

          if (org?.id) {
            return org.id;
          }
        }
      }
      
      return null;
    } catch (err) {
      return null;
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (!collegeId) return;
    
    try {
      const stats = await getExpenditureSummary(collegeId);
      
      setDbStats({
        totalDue: Number(stats.total_due_amount) || 0,
        totalCollected: Number(stats.total_paid_amount) || 0,
        totalPending: Number(stats.total_balance) || 0,
        totalStudents: Number(stats.total_students) || 0,
        paidCount: Number(stats.paid_students) || 0,
        partialCount: 0, // Will be calculated from ledgers
        pendingCount: Number(stats.pending_students) || 0,
        overdueCount: Number(stats.overdue_students) || 0,
      });
    } catch (err) {
      logger.error("Failed to get fee stats", err instanceof Error ? err : new Error(String(err)));
    }
  }, [collegeId]);

  const loadLedgers = useCallback(async () => {
    if (!collegeId) return;
    
    try {
      setLoading(true);
      await loadStudentsAsFallback();
      
    } catch (err) {
      toast.error("Failed to load student ledgers");
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  const loadStudentsAsFallback = useCallback(async () => {
    if (!collegeId) return;
    
    try {
      // Get all students for this college
      const { data: students, error } = await supabase
        .from("students")
        .select("id, user_id, name, roll_number, email, college_id, grade, section")
        .eq("college_id", collegeId)
        .order("name", { ascending: true });
      
      if (error) {
        logger.error("Students query failed", error instanceof Error ? error : new Error(String(error)));
        return;
      }

      // Get existing ledger entries for these students
      const studentIds = students?.map(s => s.user_id || s.id).filter(Boolean) || [];
      let existingLedgers: any[] = [];
      
      if (studentIds.length > 0) {
        const { data: ledgerData } = await supabase
          .from("student_ledgers")
          .select("*")
          .in("student_id", studentIds);
        
        existingLedgers = ledgerData || [];
      }

      // Create ledger entries for all students (real + mock)
      const allLedgers = students?.map((student: any) => {
        const studentId = student.user_id || student.id;
        const existingLedger = existingLedgers.find(l => l.student_id === studentId);
        
        if (existingLedger) {
          // Use real ledger data
          return {
            ...existingLedger,
            student_name: student.name || 'Unknown',
            roll_number: student.roll_number || 'N/A',
            student_email: student.email || '',
            college_id: student.college_id,
          };
        } else {
          // Create mock ledger entry
          const mockAmount = 50000 + Math.floor(Math.random() * 25000); // 50K-75K
          const paidAmount = Math.random() > 0.3 ? Math.floor(Math.random() * mockAmount * 0.8) : 0;
          
          return {
            id: `mock-${student.id}`,
            student_id: studentId,
            student_name: student.name || 'Unknown',
            roll_number: student.roll_number || 'N/A',
            student_email: student.email || '',
            college_id: student.college_id,
            fee_structure_id: 'mock-fee-structure',
            fee_head_id: 'mock-fee-head',
            fee_head_name: 'Tuition Fee',
            due_amount: mockAmount,
            paid_amount: paidAmount,
            balance: mockAmount - paidAmount,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            payment_status: (mockAmount - paidAmount) <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
            is_overdue: Math.random() > 0.8, // 20% chance of being overdue
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }) || [];

      setLedgers(allLedgers);
    } catch (err) {
      logger.error("Failed to load students", err instanceof Error ? err : new Error(String(err)));
      setLedgers([]);
    }
  }, [collegeId]);

  const loadPayments = useCallback(async (studentId?: string) => {
    try {
      let query = supabase
        .from("fee_payments")
        .select("*")
        .order("payment_date", { ascending: false });

      if (studentId) query = query.eq("student_id", studentId);

      const { data, error } = await query;
      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      logger.error("Failed to load payments", err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  useEffect(() => {
    const initializeCollegeId = async () => {
      const id = await getCollegeId();
      setCollegeId(id);
    };
    
    initializeCollegeId();
  }, [getCollegeId]);

  useEffect(() => {
    if (collegeId) {
      loadStats();
      loadLedgers();
    }
  }, [collegeId, loadStats, loadLedgers]);


  // Generate receipt number
  const generateReceiptNumber = () => {
    const date = new Date();
    const prefix = "RCP";
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `${prefix}${year}${month}${random}`;
  };

  const recordPayment = async (
    ledgerId: string,
    studentId: string,
    paymentData: Partial<FeePayment>
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not authenticated");
        return false;
      }

      const receiptNumber = generateReceiptNumber();
      const payload = {
        ledger_id: ledgerId,
        student_id: studentId,
        amount: paymentData.amount,
        mode: paymentData.mode,
        reference_number: paymentData.reference_number || null,
        transaction_id: paymentData.transaction_id || null,
        bank_name: paymentData.bank_name || null,
        cheque_number: paymentData.cheque_number || null,
        cheque_date: paymentData.cheque_date || null,
        dd_number: paymentData.dd_number || null,
        receipt_number: receiptNumber,
        payment_date: paymentData.payment_date || new Date().toISOString().split("T")[0],
        paid_at: new Date().toISOString(),
        status: "completed",
        remarks: paymentData.remarks || null,
        recorded_by: user.id,
        is_verified: false,
        is_reconciled: false,
      };

      const { error: paymentError } = await supabase
        .from("fee_payments")
        .insert(payload);

      if (paymentError) throw paymentError;

      // Update ledger paid_amount and balance
      const ledger = ledgers.find((l) => l.id === ledgerId);
      if (ledger) {
        const newPaidAmount = (ledger.paid_amount || 0) + (paymentData.amount || 0);
        const newBalance = ledger.due_amount - newPaidAmount;
        const newStatus: PaymentStatus = newBalance <= 0 ? "paid" : newBalance < ledger.due_amount ? "partial" : "pending";

        const { error: updateError } = await supabase
          .from("student_ledgers")
          .update({
            paid_amount: newPaidAmount,
            balance: newBalance,
            payment_status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ledgerId);

        if (updateError) throw updateError;
      }

      toast.success(`Payment recorded. Receipt: ${receiptNumber}`);
      loadLedgers();
      return true;
    } catch (err) {
      logger.error("Failed to record payment", err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to record payment");
      return false;
    }
  };


  const verifyPayment = async (paymentId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("fee_payments")
        .update({
          is_verified: true,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;
      toast.success("Payment verified");
      return true;
    } catch (err) {
      logger.error("Failed to verify payment", err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to verify payment");
      return false;
    }
  };

  // Aggregate ledgers by student for summary view
  const studentSummaries = useMemo((): StudentFeeSummary[] => {
    const summaryMap = new Map<string, StudentFeeSummary>();

    ledgers.forEach((ledger) => {
      const existing = summaryMap.get(ledger.student_id);
      if (existing) {
        existing.total_due += ledger.due_amount || 0;
        existing.total_paid += ledger.paid_amount || 0;
        existing.balance += ledger.balance || 0;
        existing.ledger_entries.push(ledger);
      } else {
        summaryMap.set(ledger.student_id, {
          student_id: ledger.student_id,
          student_name: ledger.student_name,
          roll_number: ledger.roll_number,
          total_due: ledger.due_amount || 0,
          total_paid: ledger.paid_amount || 0,
          balance: ledger.balance || 0,
          status: ledger.payment_status as PaymentStatus,
          ledger_entries: [ledger],
        });
      }
    });

    // Update status based on aggregated values
    summaryMap.forEach((summary) => {
      if (summary.balance <= 0) summary.status = "paid";
      else if (summary.total_paid > 0) summary.status = "partial";
      else if (summary.ledger_entries.some((l) => l.is_overdue)) summary.status = "overdue";
      else summary.status = "pending";
    });

    return Array.from(summaryMap.values());
  }, [ledgers]);

  // Stats - Use database function for better performance, fallback to calculated stats
  const stats = useMemo(() => {
    // If we have database stats and they show actual data, use them
    if (dbStats && dbStats.totalStudents > 0) {
      return dbStats;
    }

    // Calculate from ledgers data (including mock data)
    if (ledgers.length > 0) {
      const totalDue = studentSummaries.reduce((sum, s) => sum + s.total_due, 0);
      const totalCollected = studentSummaries.reduce((sum, s) => sum + s.total_paid, 0);
      const totalPending = studentSummaries.reduce((sum, s) => sum + s.balance, 0);
      const totalStudents = studentSummaries.length;
      const paidCount = studentSummaries.filter((s) => s.status === "paid").length;
      const partialCount = studentSummaries.filter((s) => s.status === "partial").length;
      const pendingCount = studentSummaries.filter((s) => s.status === "pending").length;
      const overdueCount = studentSummaries.filter((s) => s.status === "overdue").length;

      return {
        totalDue,
        totalCollected,
        totalPending,
        totalStudents,
        paidCount,
        partialCount,
        pendingCount,
        overdueCount,
      };
    }

    // Default empty stats
    return {
      totalDue: 0,
      totalCollected: 0,
      totalPending: 0,
      totalStudents: 0,
      paidCount: 0,
      partialCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    };
  }, [studentSummaries, ledgers.length, dbStats]);

  return {
    ledgers,
    payments,
    studentSummaries,
    loading,
    stats,
    loadLedgers,
    loadPayments,
    loadStats,
    recordPayment,
    verifyPayment,
  };
};
