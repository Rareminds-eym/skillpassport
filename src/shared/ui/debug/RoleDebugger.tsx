import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/shared/api/supabaseClient";
import { useUserRole } from '@/entities/user';
import { useUser, useUserRole as useUserRoleFromStore } from '@/stores';

const RoleDebugger: React.FC = () => {
  // Do not render in production — debug component only
  if (import.meta.env.PROD) return null;

  const authUser = useUser();
  const { role: authRole } = useUserRoleFromStore();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [educatorData, setEducatorData] = useState<any>(null);
  const { role, permissions, loading } = useUserRole(authUser, authRole);

  const fetchDebugInfo = useCallback(async () => {
    try {
      const { data: { session: _session } } = await supabase.auth.getSession();

      const { data: { user }, error } = await supabase.auth.getUser();

      setUserInfo(user || { error: error?.message || 'No user found' });

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

  if (loading) return <div>Loading role info...</div>;

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-lg mb-2">🔍 Role Debugger</h3>

      <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
        <div className="bg-blue-50 p-2 rounded">
          <strong>🎯 Detected Role:</strong>
          <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded font-bold">
            {role}
          </span>
        </div>

        <div>
          <strong>📋 Permissions:</strong>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </div>

        <div className="border-t pt-2">
          <strong>🔐 AuthContext (localStorage):</strong>
          <div className="ml-2 mt-1 space-y-1">
            <div>Email: {authUser?.email || 'N/A'}</div>
            <div>Role: <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">{authRole || 'N/A'}</span></div>
            <div>Name: {authUser?.name || 'N/A'}</div>
          </div>
        </div>

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
