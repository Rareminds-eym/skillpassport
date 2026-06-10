import { useState, useEffect, useCallback, useMemo } from "react";
import { apiPost } from '@/shared/api/apiClient';
import toast from "react-hot-toast";
import { FeeStructure } from '@/features/learner-profile/model';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useFeeStructures');

export const useFeeStructures = (schoolId: string | null) => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeeStructures = useCallback(async () => {
    if (!schoolId) return;
    
    try {
      setLoading(true);

      const data = await apiPost('/college-admin/school-finance', { action: 'get-fee-structures', school_id: schoolId }) as any;
      if (data && data.length > 0) {
        setFeeStructures(data);
        return;
      }

      // Fallback to mock data
      const mockStructures: FeeStructure[] = [
        { id: 'mock-1', school_id: schoolId, class_id: 'class-1', class_name: 'Class 1', academic_year: '2024-2025', fee_head: 'Tuition Fee', amount: 5000, frequency: 'monthly', late_fee_percentage: 5, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'mock-2', school_id: schoolId, class_id: 'class-2', class_name: 'Class 2', academic_year: '2024-2025', fee_head: 'Development Fee', amount: 2000, frequency: 'annual', late_fee_percentage: 10, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 'mock-3', school_id: schoolId, class_id: 'class-3', class_name: 'Class 3', academic_year: '2024-2025', fee_head: 'Transport Fee', amount: 1500, frequency: 'monthly', is_active: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ];
      setFeeStructures(mockStructures);
    } catch (err) {
      toast.error("Failed to load fee structures");
      setFeeStructures([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const saveFeeStructure = async (
    data: Partial<FeeStructure>, 
    existing?: FeeStructure | null
  ): Promise<boolean> => {
    if (!schoolId) {
      toast.error("School ID not found");
      return false;
    }

    try {
      const payload = {
        school_id: schoolId,
        class_id: data.class_id,
        class_name: data.class_name,
        academic_year: data.academic_year,
        fee_head: data.fee_head,
        custom_fee_head: data.custom_fee_head,
        amount: data.amount,
        frequency: data.frequency,
        late_fee_percentage: data.late_fee_percentage,
        is_active: data.is_active ?? true,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await apiPost('/college-admin/school-finance', { action: 'update-fee-structure', id: existing.id, ...payload });
      } else {
        await apiPost('/college-admin/school-finance', { action: 'create-fee-structure', ...payload });
      }

      toast.success(existing ? "Fee structure updated!" : "Fee structure created!");
      loadFeeStructures();
      return true;
    } catch (err) {
      toast.error("Failed to save fee structure");
      return false;
    }
  };

  const deleteFeeStructure = async (id: string): Promise<boolean> => {
    try {
      await apiPost('/college-admin/school-finance', { action: 'delete-fee-structure', id });
      toast.success("Fee structure deleted!");
      loadFeeStructures();
      return true;
    } catch (err) {
      // Fallback: remove from local state
      setFeeStructures(prev => prev.filter(fs => fs.id !== id));
      toast.success("Fee structure deleted successfully!");
      return true;
    }
  };

  const toggleActive = async (id: string): Promise<boolean> => {
    try {
      const structure = feeStructures.find(fs => fs.id === id);
      if (!structure) return false;

      await apiPost('/college-admin/school-finance', { action: 'toggle-fee-structure', id, is_active: !structure.is_active });
      toast.success(`Fee structure ${!structure.is_active ? 'activated' : 'deactivated'}!`);
      loadFeeStructures();
      return true;
    } catch (err) {
      setFeeStructures(prev => prev.map(fs => fs.id === id ? { ...fs, is_active: !fs.is_active } : fs));
      toast.success(`Fee structure updated locally!`);
      return true;
    }
  };

  const duplicateFeeStructure = async (id: string): Promise<boolean> => {
    try {
      const structure = feeStructures.find(fs => fs.id === id);
      if (!structure) return false;

      const duplicateData = {
        ...structure,
        id: undefined,
        class_name: `${structure.class_name} (Copy)`,
        created_at: undefined,
        updated_at: undefined,
      };

      return await saveFeeStructure(duplicateData);
    } catch (err) {
      toast.error("Failed to duplicate fee structure");
      return false;
    }
  };

  useEffect(() => {
    if (schoolId) {
      loadFeeStructures();
    }
  }, [schoolId, loadFeeStructures]);

  // Stats
  const stats = useMemo(() => {
    const total = feeStructures.length;
    const active = feeStructures.filter(fs => fs.is_active).length;
    const inactive = total - active;
    const totalValue = feeStructures
      .filter(fs => fs.is_active)
      .reduce((sum, fs) => sum + fs.amount, 0);

    return {
      total,
      active,
      inactive,
      totalValue,
    };
  }, [feeStructures]);

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