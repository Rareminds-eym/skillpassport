import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../../../lib/supabaseClient";
import { Program } from "../types";

export const usePrograms = (collegeId: string | null) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPrograms = useCallback(async () => {
    try {
      setLoading(true);
      
      if (collegeId) {
        // Programs are linked to colleges through departments
        // First get department IDs for this college
        const { data: depts } = await supabase
          .from("departments")
          .select("id")
          .eq("college_id", collegeId);
        
        if (depts && depts.length > 0) {
          const deptIds = depts.map(d => d.id);
          const { data, error } = await supabase
            .from("programs")
            .select("id, name, code, department_id")
            .in("department_id", deptIds)
            .order("name", { ascending: true });
          
          if (error) throw error;
          setPrograms(data || []);
        } else {
          // No departments found, try fetching all programs as fallback
          const { data, error } = await supabase
            .from("programs")
            .select("id, name, code, department_id")
            .order("name", { ascending: true });
          
          if (error) throw error;
          setPrograms(data || []);
        }
      } else {
        // No college ID, fetch all programs
        const { data, error } = await supabase
          .from("programs")
          .select("id, name, code, department_id")
          .order("name", { ascending: true });
        
        if (error) throw error;
        setPrograms(data || []);
      }
    } catch (err) {
      console.error("Failed to load programs:", err);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    loadPrograms();
  }, [collegeId, loadPrograms]);

  return { programs, loading, loadPrograms };
};
