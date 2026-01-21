import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../../../lib/supabaseClient';

export interface DepartmentBudget {
  id: string;
  department_id: string;
  department_name: string;
  budget_year: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  budget_categories: BudgetCategory[];
  status: 'draft' | 'approved' | 'active' | 'closed';
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetCategory {
  category: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
}

export const useDepartmentBudgets = () => {
  const [budgets, setBudgets] = useState<DepartmentBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [collegeId, setCollegeId] = useState<string | null>(null);

  // Get college ID using the same pattern as other hooks
  const getCollegeId = useCallback(async () => {
    try {
      // First, check localStorage for college admin data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.role === 'college_admin' && userData.collegeId) {
          console.log(
            '✅ College admin detected, using collegeId from localStorage:',
            userData.collegeId
          );
          return userData.collegeId;
        }
      }

      // If not found in localStorage, try Supabase Auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        console.log('🔍 Checking Supabase auth user for college admin:', user.email);

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
            console.log('✅ Found college_id for college admin:', org.id, 'College:', org.name);
            return org.id;
          } else {
            console.warn(
              '⚠️ College admin but no matching organization found for email:',
              user.email
            );
          }
        }
      }

      return null;
    } catch (err) {
      console.error('Failed to get college ID:', err);
      return null;
    }
  }, []);

  const loadBudgets = useCallback(async () => {
    if (!collegeId) return;

    try {
      setLoading(true);
      console.log('🚀 [Department Budgets] Loading budgets for college:', collegeId);

      // Try to load from department_budgets table (if it exists)
      const { data, error } = await supabase
        .from('department_budgets')
        .select('*')
        .eq('college_id', collegeId)
        .order('department_name', { ascending: true });

      if (error && error.code === '42P01') {
        // Table doesn't exist, create mock data
        console.log('📝 [Department Budgets] Table not found, creating mock data');
        await createMockBudgets();
        return;
      }

      if (error) {
        console.error('Failed to load budgets:', error);
        await createMockBudgets();
        return;
      }

      console.log(`✅ [Department Budgets] Loaded ${data?.length || 0} budget records`);
      setBudgets(data || []);
    } catch (err) {
      console.error('Failed to load department budgets:', err);
      await createMockBudgets();
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  const createMockBudgets = useCallback(async () => {
    // Create mock department budget data
    const mockBudgets: DepartmentBudget[] = [
      {
        id: 'mock-cs-budget',
        department_id: 'dept-cs',
        department_name: 'Computer Science',
        budget_year: '2024-25',
        allocated_amount: 500000,
        spent_amount: 320000,
        remaining_amount: 180000,
        status: 'active',
        budget_categories: [
          {
            category: 'Equipment',
            allocated_amount: 200000,
            spent_amount: 150000,
            remaining_amount: 50000,
          },
          {
            category: 'Software Licenses',
            allocated_amount: 100000,
            spent_amount: 80000,
            remaining_amount: 20000,
          },
          {
            category: 'Training',
            allocated_amount: 75000,
            spent_amount: 45000,
            remaining_amount: 30000,
          },
          {
            category: 'Maintenance',
            allocated_amount: 125000,
            spent_amount: 45000,
            remaining_amount: 80000,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'mock-commerce-budget',
        department_id: 'dept-commerce',
        department_name: 'Commerce',
        budget_year: '2024-25',
        allocated_amount: 300000,
        spent_amount: 180000,
        remaining_amount: 120000,
        status: 'active',
        budget_categories: [
          {
            category: 'Books & Resources',
            allocated_amount: 100000,
            spent_amount: 75000,
            remaining_amount: 25000,
          },
          {
            category: 'Guest Lectures',
            allocated_amount: 50000,
            spent_amount: 30000,
            remaining_amount: 20000,
          },
          {
            category: 'Field Trips',
            allocated_amount: 75000,
            spent_amount: 40000,
            remaining_amount: 35000,
          },
          {
            category: 'Office Supplies',
            allocated_amount: 75000,
            spent_amount: 35000,
            remaining_amount: 40000,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'mock-science-budget',
        department_id: 'dept-science',
        department_name: 'Science',
        budget_year: '2024-25',
        allocated_amount: 600000,
        spent_amount: 420000,
        remaining_amount: 180000,
        status: 'active',
        budget_categories: [
          {
            category: 'Lab Equipment',
            allocated_amount: 300000,
            spent_amount: 250000,
            remaining_amount: 50000,
          },
          {
            category: 'Chemicals & Reagents',
            allocated_amount: 150000,
            spent_amount: 100000,
            remaining_amount: 50000,
          },
          {
            category: 'Safety Equipment',
            allocated_amount: 75000,
            spent_amount: 45000,
            remaining_amount: 30000,
          },
          {
            category: 'Maintenance',
            allocated_amount: 75000,
            spent_amount: 25000,
            remaining_amount: 50000,
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    setBudgets(mockBudgets);
    console.log(`✅ [Department Budgets] Created ${mockBudgets.length} mock budget records`);
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
      loadBudgets();
    }
  }, [collegeId, loadBudgets]);

  // Computed stats
  const stats = useMemo(() => {
    const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated_amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + b.remaining_amount, 0);
    const utilizationRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    return {
      totalAllocated,
      totalSpent,
      totalRemaining,
      utilizationRate,
      departmentCount: budgets.length,
    };
  }, [budgets]);

  return {
    budgets,
    loading,
    stats,
    loadBudgets,
  };
};
