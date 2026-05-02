/**
 * Hook to fetch student data from Supabase by student ID
 * 
 * Works with your actual students table structure (profile JSONB column)
 */

import { useState, useEffect } from 'react';
import { getStudentById } from '@/entities/student/api/studentService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('student-data-hook');

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
          if (errorMsg.toLowerCase().includes('row-level security') ||
            errorMsg.toLowerCase().includes('rls') ||
            errorMsg.toLowerCase().includes('permission denied')) {
            setError('⚠️ Database access blocked. Please disable RLS in Supabase. See FIX_RLS.md');
            logger.error('RLS policy blocking student data access', undefined, { studentId });
          } else {
            setError(errorMsg);
            logger.warn('Failed to fetch student data', { studentId, error: errorMsg });
          }
          setStudentData(null);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to fetch student data', error, { studentId });
        setError(error.message || 'Failed to fetch student data');
        setStudentData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, fallbackToMock]);

  return { studentData, loading, error };
};