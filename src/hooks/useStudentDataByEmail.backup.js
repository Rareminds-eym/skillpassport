/**
 * Hook to fetch student data from Supabase JSONB profile by EMAIL
 * 
 * Works with your actual students table structure (profile JSONB column)
 */

import { useState, useEffect } from 'react';
import { getStudentByEmail } from '../services/studentServiceProfile';

export const useStudentDataByEmail = (email, fallbackToMock = true) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('\ud83d\udce7 Fetching data for email:', email);

        const result = await getStudentByEmail(email);

        if (result.success && result.data) {
          console.log('\u2705 Student data loaded:', result.data);
          setStudentData(result.data);
          setError(null);
        } else {
          console.warn('\u26a0\ufe0f No data found for email:', email);
          // Check if it's an RLS error
          const errorMsg = result.error || 'Student not found';
          if (errorMsg.toLowerCase().includes('row-level security') || 
              errorMsg.toLowerCase().includes('rls') ||
              errorMsg.toLowerCase().includes('permission denied')) {
            setError('\u26a0\ufe0f Database access blocked. Please disable RLS in Supabase. See FIX_RLS.md');
            console.error('\ud83d\udd12 RLS is blocking access! Run this in Supabase SQL Editor:');
            console.error('ALTER TABLE students DISABLE ROW LEVEL SECURITY;');
          } else {
            setError(errorMsg);
          }
          setStudentData(null); // No fallback to mock data
        }
      } catch (err) {
        console.error('\u274c Error fetching student data:', err);
        setError(err.message);
        setStudentData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email]);
  /*...*/

  const refresh = async () => {
    if (!email) return;
    
    setLoading(true);
    const result = await getStudentByEmail(email);
    
    if (result.success) {
      setStudentData(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return {
    studentData,
    loading,
    error,
    refresh
  };
};
