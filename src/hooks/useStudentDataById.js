/**
 * Hook to fetch student data from Supabase by student ID
 *
 * Works with your actual students table structure (profile JSONB column)
 */

import { useState, useEffect } from 'react';
import { getStudentById } from '../services/studentServiceProfile';

export const useStudentDataById = (studentId, fallbackToMock = true) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await getStudentById(studentId);

        if (result.success && result.data) {
          setStudentData(result.data);
          setError(null);
        } else {
          // Check if it's an RLS error
          const errorMsg = result.error || 'Student not found';
          if (
            errorMsg.toLowerCase().includes('row-level security') ||
            errorMsg.toLowerCase().includes('rls') ||
            errorMsg.toLowerCase().includes('permission denied')
          ) {
            setError('⚠️ Database access blocked. Please disable RLS in Supabase. See FIX_RLS.md');
            console.error('🔒 RLS is blocking access! Run this in Supabase SQL Editor:');
            console.error('ALTER TABLE students DISABLE ROW LEVEL SECURITY;');
          } else {
            setError(errorMsg);
          }
          setStudentData(null);
        }
      } catch (err) {
        console.error('❌ useStudentDataById error:', err);
        setError(err.message || 'Failed to fetch student data');
        setStudentData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, fallbackToMock]);

  return { studentData, loading, error };
};
