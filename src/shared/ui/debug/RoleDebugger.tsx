import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/shared/api/supabaseClient";
import { useAuthStore } from '@/shared/model/authStore';

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
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setDebugLog(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`[RoleDebugger] ${message}`);
  };

  const fetchDebugInfo = useCallback(async () => {
    try {
      addDebugLog('fetchDebugInfo started');
      const user = useAuthStore.getState().user;
      
      addDebugLog(`User from store: ${JSON.stringify(user)}`);
      setUserInfo(user || { error: 'No user found' });

      if (user && user.email) {
        addDebugLog(`Fetching teacher data for email: ${user.email}`);
        const { data: teacher, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        
        if (teacherError) {
          addDebugLog(`Teacher query error: ${JSON.stringify(teacherError)}`);
        } else {
          addDebugLog(`Teacher data: ${JSON.stringify(teacher)}`);
        }
        setTeacherData(teacher);

        if (user.id) {
          addDebugLog(`Fetching educator data for user_id: ${user.id}`);
          const { data: educator, error: educatorError } = await supabase
            .from('school_educators')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (educatorError) {
            addDebugLog(`Educator query error: ${JSON.stringify(educatorError)}`);
          } else {
            addDebugLog(`Educator data: ${JSON.stringify(educator)}`);
          }
          setEducatorData(educator);
        }
      } else {
        addDebugLog('No user or email found');
      }
    } catch (err) {
      const errorMsg = `Debug fetch error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      addDebugLog(errorMsg);
      setUserInfo({ error: err instanceof Error ? err.message : 'Failed to fetch debug info' });
    }
  }, []);

  useEffect(() => {
    addDebugLog('Component mounted');
    fetchDebugInfo();
  }, [fetchDebugInfo]);

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-lg mb-2">🔍 Role Debugger</h3>

      <div className="space-y-2 text-sm max-h-96 overflow-y-auto">

        <div className="border-t pt-2">
          <strong>🔑 User Info:</strong>
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
          <strong>🐛 Debug Log:</strong>
          <div className="ml-2 mt-1 space-y-1 max-h-40 overflow-y-auto">
            {debugLog.length === 0 ? (
              <div className="text-xs text-gray-500">No logs yet</div>
            ) : (
              debugLog.map((log, i) => (
                <div key={i} className="text-xs text-gray-600 break-all font-mono">{log}</div>
              ))
            )}
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
