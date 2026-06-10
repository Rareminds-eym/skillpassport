import React, { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { useUserRole } from '@/entities/user';
import { useUser, useUserRole as useUserRoleFromStore } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';


const RoleDebugger: React.FC = () => {
  const logger = getLogger('RoleDebugger');
  const authUser = useUser();
  const { role: authRole } = useUserRoleFromStore();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [educatorData, setEducatorData] = useState<any>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const { role, permissions, loading } = useUserRole(authUser, authRole);

  const addDebugLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    logger.info(message);
  };

  useEffect(() => {
    addDebugLog(`useEffect triggered. authUser: ${JSON.stringify(authUser)}`);
    fetchDebugInfo();
  }, [authUser]); // Re-fetch when authUser changes

  const fetchDebugInfo = async () => {
    try {
      addDebugLog('fetchDebugInfo started');
      // Use authUser from auth store (SSO Worker pattern)
      const user = authUser;
      
      addDebugLog(`User from store: ${JSON.stringify(user)}`);
      setUserInfo(user || { error: 'No user found' });

      if (user && user.email) {
        addDebugLog(`Fetching debug data for email: ${user.email}`);

        const payload: Record<string, string> = { email: user.email };
        if (user.id) payload.userId = user.id;

        try {
          const result = await apiPost('/explorer/actions', { ...payload, action: 'role-debug' });
          const data = result?.data || {};

          if (data.teacher && !data.teacher.error) {
            addDebugLog(`Teacher data: ${JSON.stringify(data.teacher)}`);
            setTeacherData(data.teacher);
          } else {
            addDebugLog(`Teacher query result: ${JSON.stringify(data.teacher)}`);
          }

          if (data.educator && !data.educator.error) {
            addDebugLog(`Educator data: ${JSON.stringify(data.educator)}`);
            setEducatorData(data.educator);
          } else {
            addDebugLog(`Educator query result: ${JSON.stringify(data.educator)}`);
          }
        } catch (fetchErr) {
          addDebugLog(`API call error: ${(fetchErr as Error).message}`);
        }
      } else {
        addDebugLog('No user or email found');
      }
    } catch (err) {
      const errorMsg = `Debug fetch error: ${(err as Error).message}`;
      addDebugLog(errorMsg);
      logger.error('Debug fetch error', err as Error);
    }
  };

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
          <strong>🔐 AuthContext (SSO Store):</strong>
          <div className="ml-2 mt-1 space-y-1">
            <div>Email: {authUser?.email || 'N/A'}</div>
            <div>Role: <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">{authRole || 'N/A'}</span></div>
            <div>ID: <div className="text-xs text-gray-600 break-all">{authUser?.id || 'N/A'}</div></div>
            <div>Org ID: {authUser?.orgId || 'N/A'}</div>
            <div>Roles: {authUser?.roles?.join(', ') || 'N/A'}</div>
            <div>Products: {authUser?.products?.join(', ') || 'N/A'}</div>
          </div>
        </div>

        <div className="border-t pt-2">
          <strong>🔑 User Info (from store):</strong>
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
                <div key={i} className="text-xs text-gray-600 break-all">{log}</div>
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
