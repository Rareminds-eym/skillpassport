import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../../../../lib/supabaseClient";
import toast from "react-hot-toast";
import { StudentLedger, FeePayment, StudentFeeSummary, PaymentStatus } from "../types";

export const useFeeTracking = (collegeId: string | null) => {
  const [ledgers, setLedgers] = useState<StudentLedger[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLedgers = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("student_ledgers")
        .select("*")
        .order("student_name", { ascending: true });

      if (collegeId) query = query.eq("college_id", collegeId);

      const { data, error } = await query;
      if (error) throw error;
      setLedgers(data || []);
    } catch (err) {
      console.error("Failed to load ledgers:", err);
      toast.error("Failed to load student ledgers");
    } finally {
      setLoading(false);
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
      console.error("Failed to load payments:", err);
    }
  }, []);

  useEffect(() => {
    loadLedgers();
  }, [collegeId, loadLedgers]);


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
      console.error("Failed to record payment:", err);
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
      console.error("Failed to verify payment:", err);
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

  // Stats
  const stats = useMemo(() => ({
    totalDue: studentSummaries.reduce((sum, s) => sum + s.total_due, 0),
    totalCollected: studentSummaries.reduce((sum, s) => sum + s.total_paid, 0),
    totalPending: studentSummaries.reduce((sum, s) => sum + s.balance, 0),
    totalStudents: studentSummaries.length,
    paidCount: studentSummaries.filter((s) => s.status === "paid").length,
    partialCount: studentSummaries.filter((s) => s.status === "partial").length,
    pendingCount: studentSummaries.filter((s) => s.status === "pending").length,
    overdueCount: studentSummaries.filter((s) => s.status === "overdue").length,
  }), [studentSummaries]);

  return {
    ledgers,
    payments,
    studentSummaries,
    loading,
    stats,
    loadLedgers,
    loadPayments,
    recordPayment,
    verifyPayment,
  };
};
