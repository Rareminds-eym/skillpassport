import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../../lib/supabaseClient';
import { FeeStructure } from '../types';

export const useFeeStructures = (collegeId: string | null) => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeeStructures = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('fee_structures')
        .select('*')
        .order('program_name', { ascending: true })
        .order('semester', { ascending: true });

      if (collegeId) query = query.eq('college_id', collegeId);

      const { data, error } = await query;
      if (error) throw error;
      setFeeStructures(data || []);
    } catch (err) {
      console.error('Failed to load fee structures:', err);
      toast.error('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    loadFeeStructures();
  }, [collegeId, loadFeeStructures]);

  const saveFeeStructure = async (
    data: Partial<FeeStructure>,
    existingStructure?: FeeStructure | null
  ): Promise<boolean> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get college_id if not set
      let feeCollegeId = collegeId;
      if (!feeCollegeId && user) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('organization_type', 'college')
          .or(`admin_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();
        if (org?.id) feeCollegeId = org.id;
      }

      // Calculate total from fee_heads
      const totalAmount = (data.fee_heads || []).reduce((sum, head) => sum + (head.amount || 0), 0);

      const payload = {
        ...data,
        college_id: feeCollegeId,
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      };

      if (existingStructure) {
        const { error } = await supabase
          .from('fee_structures')
          .update(payload)
          .eq('id', existingStructure.id);
        if (error) throw error;
        toast.success('Fee structure updated');
      } else {
        if (!feeCollegeId) {
          toast.error('College not found');
          return false;
        }
        const { error } = await supabase
          .from('fee_structures')
          .insert({ ...payload, created_by: user?.id });
        if (error) throw error;
        toast.success('Fee structure created');
      }

      loadFeeStructures();
      return true;
    } catch (err) {
      console.error('Failed to save fee structure:', err);
      toast.error('Failed to save fee structure');
      return false;
    }
  };

  const deleteFeeStructure = async (id: string): Promise<boolean> => {
    if (!confirm('Delete this fee structure?')) return false;
    try {
      const { error } = await supabase.from('fee_structures').delete().eq('id', id);
      if (error) throw error;
      setFeeStructures((prev) => prev.filter((f) => f.id !== id));
      toast.success('Fee structure deleted');
      return true;
    } catch (err) {
      console.error('Failed to delete fee structure:', err);
      toast.error('Failed to delete fee structure');
      return false;
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('fee_structures')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setFeeStructures((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_active: !currentStatus } : f))
      );
      toast.success(currentStatus ? 'Fee structure deactivated' : 'Fee structure activated');
      return true;
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update status');
      return false;
    }
  };

  const duplicateFeeStructure = async (structure: FeeStructure): Promise<boolean> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { id, created_at, updated_at, ...rest } = structure;
      const { error } = await supabase.from('fee_structures').insert({
        ...rest,
        academic_year: `${structure.academic_year} (Copy)`,
        is_active: false,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success('Fee structure duplicated');
      loadFeeStructures();
      return true;
    } catch (err) {
      console.error('Failed to duplicate:', err);
      toast.error('Failed to duplicate fee structure');
      return false;
    }
  };

  // Computed stats
  const stats = useMemo(
    () => ({
      total: feeStructures.length,
      active: feeStructures.filter((f) => f.is_active).length,
      inactive: feeStructures.filter((f) => !f.is_active).length,
      totalValue: feeStructures
        .filter((f) => f.is_active)
        .reduce((sum, f) => sum + (f.total_amount || 0), 0),
    }),
    [feeStructures]
  );

  return {
    feeStructures,
    loading,
    stats,
    loadFeeStructures,
    saveFeeStructure,
    deleteFeeStructure,
    toggleActive,
    duplicateFeeStructure,
  };
};
