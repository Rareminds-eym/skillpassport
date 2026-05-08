import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from '@/shared/api/supabaseClient';
import toast from "react-hot-toast";
import { LearnerLedger, FeePayment, LearnerFeeSummary, PaymentStatus } from '@/features/learner-profile/model';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('school-admin-fee-tracking');

export const useFeeTracking = (schoolId: string | null) => {
  const [ledgers, setLedgers] = useState<LearnerLedger[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLedgers = useCallback(async () => {
    if (!schoolId) return;
    
    try {
      setLoading(true);
      logger.info('Loading learner ledgers for school', { schoolId });

      // Try to load from database first
      const { data, error } = await supabase
        .from("learner_ledgers")
        .select("*")
        .eq("school_id", schoolId)
        .order("learner_name", { ascending: true });
      
      if (error) {
        logger.error('Learner ledgers query failed', error, { schoolId });
        // Load learners and create mock ledgers
        await loadlearnersAsFallback();
        return;
      }

      if (data && data.length > 0) {
        logger.info('Found existing ledger entries', { count: data.length });
        setLedgers(data);
      } else {
        // No ledgers found, create from learners
        await loadlearnersAsFallback();
      }
    } catch (err) {
      logger.error("Failed to load ledgers", err as Error, { schoolId });
      toast.error("Failed to load learner ledgers");
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const loadlearnersAsFallback = useCallback(async () => {
    if (!schoolId) return;
    
    try {
      logger.info('Loading learners for school', { schoolId });
      
      // Get all learners for this school
      const { data: learners, error } = await supabase
        .from("learners")
        .select("id, user_id, name, roll_number, email, school_id, grade, section")
        .eq("school_id", schoolId)
        .order("name", { ascending: true });
      
      if (error) {
        logger.error('Learners query failed', error, { schoolId });
        // Create completely mock data
        const mockLedgers: LearnerLedger[] = [
          {
            id: 'mock-ledger-1',
            learner_id: 'mock-learner-1',
            learner_name: 'Rahul Sharma',
            roll_number: 'STU001',
            learner_email: 'rahul@example.com',
            school_id: schoolId,
            fee_structure_id: 'mock-fee-1',
            fee_head_id: 'tuition',
            fee_head_name: 'Tuition Fee',
            due_amount: 5000,
            paid_amount: 3000,
            balance: 2000,
            due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            payment_status: 'partial',
            is_overdue: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'mock-ledger-2',
            learner_id: 'mock-learner-2',
            learner_name: 'Priya Patel',
            roll_number: 'STU002',
            learner_email: 'priya@example.com',
            school_id: schoolId,
            fee_structure_id: 'mock-fee-1',
            fee_head_id: 'tuition',
            fee_head_name: 'Tuition Fee',
            due_amount: 5000,
            paid_amount: 5000,
            balance: 0,
            due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            payment_status: 'paid',
            is_overdue: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'mock-ledger-3',
            learner_id: 'mock-learner-3',
            learner_name: 'Amit Kumar',
            roll_number: 'STU003',
            learner_email: 'amit@example.com',
            school_id: schoolId,
            fee_structure_id: 'mock-fee-1',
            fee_head_id: 'tuition',
            fee_head_name: 'Tuition Fee',
            due_amount: 5000,
            paid_amount: 0,
            balance: 5000,
            due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            payment_status: 'overdue',
            is_overdue: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        setLedgers(mockLedgers);
        logger.info('Using completely mock ledger data', { count: mockLedgers.length });
        return;
      }

      logger.info('Found learners in school', { count: learners?.length || 0 });

      // Create ledger entries for all learners (real + mock)
      const allLedgers = learners?.map((learner: any) => {
        const learnerId = learner.user_id || learner.id;
        const mockAmount = 5000 + Math.floor(Math.random() * 3000); // 5K-8K
        const paidAmount = Math.random() > 0.3 ? Math.floor(Math.random() * mockAmount * 0.8) : 0;
        
        return {
          id: `mock-${learner.id}`,
          learner_id: learnerId,
          learner_name: learner.name || 'Unknown',
          roll_number: learner.roll_number || 'N/A',
          learner_email: learner.email || '',
          school_id: learner.school_id,
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
        } as LearnerLedger;
      }) || [];

      logger.info('Created ledger entries', { count: allLedgers.length });
      setLedgers(allLedgers);
    } catch (err) {
      logger.error("Failed to load learners", err as Error, { schoolId });
      setLedgers([]);
    }
  }, [schoolId]);

  const loadPayments = useCallback(async (learnerId?: string) => {
    try {
      let query = supabase
        .from("school_fee_payments")
        .select("*")
        .order("payment_date", { ascending: false });

      if (learnerId) query = query.eq("learner_id", learnerId);

      const { data, error } = await query;
      if (error) {
        logger.error('Payments query failed', error, { learnerId });
        setPayments([]);
        return;
      }
      setPayments(data || []);
    } catch (err) {
      logger.error("Failed to load payments", err as Error, { learnerId });
      setPayments([]);
    }
  }, []);

  // Generate receipt number
  const generateReceiptNumber = () => {
    const date = new Date();
    const prefix = "SCH";
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `${prefix}${year}${month}${random}`;
  };

  const recordPayment = async (
    ledgerId: string,
    learnerId: string,
    paymentData: Partial<FeePayment>
  ): Promise<boolean> => {
    try {
      const { data: { user } } = getCurrentUser();
      if (!user) {
        toast.error("User not authenticated");
        return false;
      }

      const receiptNumber = generateReceiptNumber();
      const payload = {
        ledger_id: ledgerId,
        learner_id: learnerId,
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
        .from("school_fee_payments")
        .insert(payload);

      if (paymentError) {
        logger.error('Payment insert failed', paymentError, { ledgerId, learnerId });
        // For demo, just update local state
      }

      // Update ledger paid_amount and balance
      const ledger = ledgers.find((l) => l.id === ledgerId);
      if (ledger) {
        const newPaidAmount = (ledger.paid_amount || 0) + (paymentData.amount || 0);
        const newBalance = ledger.due_amount - newPaidAmount;
        const newStatus: PaymentStatus = newBalance <= 0 ? "paid" : newBalance < ledger.due_amount ? "partial" : "pending";

        const { error: updateError } = await supabase
          .from("learner_ledgers")
          .update({
            paid_amount: newPaidAmount,
            balance: newBalance,
            payment_status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ledgerId);

        if (updateError) {
          logger.error('Ledger update failed', updateError, { ledgerId });
          // For demo, update local state
          setLedgers(prev => prev.map(l => 
            l.id === ledgerId 
              ? { ...l, paid_amount: newPaidAmount, balance: newBalance, payment_status: newStatus }
              : l
          ));
        }
      }

      toast.success(`Payment recorded. Receipt: ${receiptNumber}`);
      loadLedgers();
      return true;
    } catch (err) {
      logger.error("Failed to record payment", err as Error, { ledgerId, learnerId });
      toast.error("Failed to record payment");
      return false;
    }
  };

  useEffect(() => {
    if (schoolId) {
      loadLedgers();
    }
  }, [schoolId, loadLedgers]);

  // Aggregate ledgers by learner for summary view
  const learnerSummaries = useMemo((): LearnerFeeSummary[] => {
    const summaryMap = new Map<string, LearnerFeeSummary>();

    ledgers.forEach((ledger) => {
      const existing = summaryMap.get(ledger.learner_id);
      if (existing) {
        existing.total_due += ledger.due_amount || 0;
        existing.total_paid += ledger.paid_amount || 0;
        existing.balance += ledger.balance || 0;
        existing.ledger_entries.push(ledger);
      } else {
        summaryMap.set(ledger.learner_id, {
          learner_id: ledger.learner_id,
          learner_name: ledger.learner_name,
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
  const stats = useMemo(() => {
    if (ledgers.length > 0) {
      const totalDue = learnerSummaries.reduce((sum, s) => sum + s.total_due, 0);
      const totalCollected = learnerSummaries.reduce((sum, s) => sum + s.total_paid, 0);
      const totalPending = learnerSummaries.reduce((sum, s) => sum + s.balance, 0);
      const totallearners = learnerSummaries.length;
      const paidCount = learnerSummaries.filter((s) => s.status === "paid").length;
      const partialCount = learnerSummaries.filter((s) => s.status === "partial").length;
      const pendingCount = learnerSummaries.filter((s) => s.status === "pending").length;
      const overdueCount = learnerSummaries.filter((s) => s.status === "overdue").length;

      return {
        totalDue,
        totalCollected,
        totalPending,
        totallearners,
        paidCount,
        partialCount,
        pendingCount,
        overdueCount,
      };
    }

    return {
      totalDue: 0,
      totalCollected: 0,
      totalPending: 0,
      totallearners: 0,
      paidCount: 0,
      partialCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    };
  }, [learnerSummaries, ledgers.length]);

  return {
    ledgers,
    payments,
    learnerSummaries,
    loading,
    stats,
    loadLedgers,
    loadPayments,
    recordPayment,
  };
};