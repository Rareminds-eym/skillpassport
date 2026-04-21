import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/shared/api/supabaseClient";

interface UserInfo {
  id?: string;
  email?: string;
  error?: string;
}

interface TeacherData {
  role?: string;
  email?: string;
}

interface EducatorData {
  role?: string;
  user_id?: string;
}

const RoleDebugger: React.FC = () => {
  // Guard BEFORE all hooks — safe for lint and future-proof
  if (import.meta.env.PROD) return null;

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [educatorData, setEducatorData] = useState<EducatorData | null>(null);

  const fetchDebugInfo = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        setUserInfo({ error: error.message });
        return;
      }

      setUserInfo(user || { error: 'No user found' });

      if (user) {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        setTeacherData(teacher);

        const { data: educator } = await supabase
          .from('school_educators')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setEducatorData(educator);
      }
    } catch (err) {
      setUserInfo({ error: err instanceof Error ? err.message : 'Failed to fetch debug info' });
    }
  }, []);

  useEffect(() => {
    fetchDebugInfo();
  }, [fetchDebugInfo]);

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-lg mb-2">🔍 Role Debugger</h3>

      <div className="space-y-2 text-sm max-h-96 overflow-y-auto">

        <div className="border-t pt-2">
          <strong>🔑 Supabase Auth:</strong>
          <div className="ml-2 mt-1 space-y-1">
            <div>Email: {userInfo?.email || userInfo?.error || 'N/A'}</div>
            <div>ID: <div className="text-xs text-gray-600 break-all">{userInfo?.id || 'N/A'}</div></div>
            <div>
              Status:
              <span className={`ml-2 px-2 py-1 rounded text-xs ${userInfo?.id ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {userInfo?.id ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-2">
          <strong>📊 Database Roles:</strong>
          <div className="ml-2 mt-1 space-y-1">
            <div>Teachers Table: {teacherData?.role || 'Not found'}</div>
            <div>School Educators: {educatorData?.role || 'Not found'}</div>
          </div>
        </div>

        <div className="border-t pt-2">
          <strong>🌐 Current Path:</strong>
          <div className="text-xs text-gray-600 break-all">{window.location.pathname}</div>
        </div>

        <button
          onClick={fetchDebugInfo}
          className="mt-2 w-full px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 font-medium"
        >
          🔄 Refresh Debug Info
        </button>
      </div>
    </div>
  );
};

export default RoleDebugger;
