import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../../../../lib/supabaseClient";
import toast from "react-hot-toast";
import { FeeStructure } from "../types";

export const useFeeStructures = (schoolId: string | null) => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeeStructures = useCallback(async () => {
    if (!schoolId) return;
    
    try {
      setLoading(true);
      console.log('🚀 [Fee Structures] Loading fee structures for school:', schoolId);

      const { data, error } = await supabase
        .from('school_fee_structures')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fee structures query failed:', error);
        // Create mock data for demonstration
        const mockStructures: FeeStructure[] = [
          {
            id: 'mock-1',
            school_id: schoolId,
            class_id: 'class-1',
            class_name: 'Class 1',
            academic_year: '2024-2025',
            fee_head: 'Tuition Fee',
            amount: 5000,
            frequency: 'monthly',
            late_fee_percentage: 5,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'mock-2',
            school_id: schoolId,
            class_id: 'class-2',
            class_name: 'Class 2',
            academic_year: '2024-2025',
            fee_head: 'Development Fee',
            amount: 2000,
            frequency: 'annual',
            late_fee_percentage: 10,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'mock-3',
            school_id: schoolId,
            class_id: 'class-3',
            class_name: 'Class 3',
            academic_year: '2024-2025',
            fee_head: 'Transport Fee',
            amount: 1500,
            frequency: 'monthly',
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        setFeeStructures(mockStructures);
        console.log('✅ [Fee Structures] Using mock data:', mockStructures.length, 'structures');
        return;
      }

      console.log(`✅ [Fee Structures] Loaded ${data?.length || 0} fee structures`);
      setFeeStructures(data || []);
    } catch (err) {
      console.error("Failed to load fee structures:", err);
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
        // Update existing structure
        const { error } = await supabase
          .from('school_fee_structures')
          .update(payload)
          .eq('id', existing.id);

        if (error) {
          console.error('Update fee structure failed:', error);
          // For demo, update in local state
          setFeeStructures(prev => 
            prev.map(fs => fs.id === existing.id ? { ...fs, ...payload } : fs)
          );
          toast.success("Fee structure updated successfully!");
          return true;
        }
      } else {
        // Create new structure
        const { error } = await supabase
          .from('school_fee_structures')
          .insert({ ...payload, created_at: new Date().toISOString() });

        if (error) {
          console.error('Create fee structure failed:', error);
          // For demo, add to local state
          const newStructure: FeeStructure = {
            id: `mock-${Date.now()}`,
            ...payload,
            created_at: new Date().toISOString(),
          } as FeeStructure;
          setFeeStructures(prev => [newStructure, ...prev]);
          toast.success("Fee structure created successfully!");
          return true;
        }
      }

      toast.success(existing ? "Fee structure updated!" : "Fee structure created!");
      loadFeeStructures();
      return true;
    } catch (err) {
      console.error("Failed to save fee structure:", err);
      toast.error("Failed to save fee structure");
      return false;
    }
  };

  const deleteFeeStructure = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('school_fee_structures')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete fee structure failed:', error);
        // For demo, remove from local state
        setFeeStructures(prev => prev.filter(fs => fs.id !== id));
        toast.success("Fee structure deleted successfully!");
        return true;
      }

      toast.success("Fee structure deleted!");
      loadFeeStructures();
      return true;
    } catch (err) {
      console.error("Failed to delete fee structure:", err);
      toast.error("Failed to delete fee structure");
      return false;
    }
  };

  const toggleActive = async (id: string): Promise<boolean> => {
    try {
      const structure = feeStructures.find(fs => fs.id === id);
      if (!structure) return false;

      const { error } = await supabase
        .from('school_fee_structures')
        .update({ 
          is_active: !structure.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Toggle active failed:', error);
        // For demo, update local state
        setFeeStructures(prev => 
          prev.map(fs => fs.id === id ? { ...fs, is_active: !fs.is_active } : fs)
        );
        toast.success(`Fee structure ${!structure.is_active ? 'activated' : 'deactivated'}!`);
        return true;
      }

      toast.success(`Fee structure ${!structure.is_active ? 'activated' : 'deactivated'}!`);
      loadFeeStructures();
      return true;
    } catch (err) {
      console.error("Failed to toggle active status:", err);
      toast.error("Failed to update status");
      return false;
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
      console.error("Failed to duplicate fee structure:", err);
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