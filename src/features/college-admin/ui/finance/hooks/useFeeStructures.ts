import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { apiPost } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';
import { FeeStructure } from '@/features/learner-profile/model';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('fee-structures');

export const useFeeStructures = (collegeId: string | null) => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeeStructures = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiPost('/college-admin/finance', {
        action: 'get-fee-structures',
        college_id: collegeId,
      });
      const data = (response.data || []) as FeeStructure[];
      if (collegeId) {
        setFeeStructures(data.filter((f: any) => f.college_id === collegeId));
      } else {
        setFeeStructures(data);
      }
    } catch (err) {
      logger.error("Failed to load fee structures", err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to load fee structures");
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
      const user = useAuthStore.getState().user;

      let feeCollegeId = collegeId;
      if (!feeCollegeId && user) {
        const orgResponse = await apiPost('/college-admin/finance', {
          action: 'get-user-org-by-email',
          email: user.email,
        });
        if (orgResponse.data?.id) feeCollegeId = orgResponse.data.id;
      }

      const totalAmount = (data.fee_heads || []).reduce(
        (sum, head) => sum + (head.amount || 0),
        0
      );

      const payload = {
        ...data,
        college_id: feeCollegeId,
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      };

      if (existingStructure) {
        await apiPost('/college-admin/finance', {
          action: 'update-fee-structure',
          id: existingStructure.id,
          ...payload,
        });
        toast.success("Fee structure updated");
      } else {
        if (!feeCollegeId) {
          toast.error("College not found");
          return false;
        }
        await apiPost('/college-admin/finance', {
          action: 'create-fee-structure',
          ...payload,
          created_by: user?.id,
        });
        toast.success("Fee structure created");
      }

      loadFeeStructures();
      return true;
    } catch (err) {
      logger.error("Failed to save fee structure", err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to save fee structure");
      return false;
    }
  };


  const deleteFeeStructure = async (id: string): Promise<boolean> => {
    if (!confirm("Delete this fee structure?")) return false;
    try {
      await apiPost('/college-admin/finance', {
        action: 'delete-fee-structure',
        id,
      });
      setFeeStructures((prev) => prev.filter((f) => f.id !== id));
      toast.success("Fee structure deleted");
      return true;
    } catch (err) {
      logger.error("Failed to delete fee structure", err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to delete fee structure");
      return false;
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean): Promise<boolean> => {
    try {
      await apiPost('/college-admin/finance', {
        action: 'toggle-fee-structure-active',
        id,
        is_active: !currentStatus,
      });
      setFeeStructures((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_active: !currentStatus } : f))
      );
      toast.success(currentStatus ? "Fee structure deactivated" : "Fee structure activated");
      return true;
    } catch (err) {
      logger.error("Failed to toggle status", err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to update status");
      return false;
    }
  };

  const duplicateFeeStructure = async (structure: FeeStructure): Promise<boolean> => {
    try {
      await apiPost('/college-admin/finance', {
        action: 'duplicate-fee-structure',
        id: structure.id,
      });
      toast.success("Fee structure duplicated");
      loadFeeStructures();
      return true;
    } catch (err) {
      logger.error("Failed to duplicate fee structure", err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to duplicate fee structure");
      return false;
    }
  };

  const stats = useMemo(() => ({
    total: feeStructures.length,
    active: feeStructures.filter((f) => f.is_active).length,
    inactive: feeStructures.filter((f) => !f.is_active).length,
    totalValue: feeStructures.filter((f) => f.is_active).reduce((sum, f) => sum + (f.total_amount || 0), 0),
  }), [feeStructures]);

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
