/**
 * Auth Debug Page
 * 
 * Displays JWT token details and database lookup results
 * Helps diagnose user_id mismatch issues
 * 
 * Access at: /debug/auth
 * 
 * IMPORTANT: Remove this page in production!
 */

import React, { useEffect, useState } from 'react';
import { useUser } from '@/shared/model/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8788';

export default function AuthDebug() {
  const user = useUser();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/debug/auth-check`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setDebugData(result.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch debug data');
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Auth Debug</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Loading debug information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Auth Debug</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { jwt, usersTable, learnersTable, diagnosis } = debugData || {};

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Auth Debug</h1>
          <p className="text-gray-600">Diagnose JWT authentication and user_id mismatch issues</p>
        </div>

        {/* Diagnosis */}
        {diagnosis && (
          <div className={`rounded-lg p-6 ${
            diagnosis.issue 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <h2 className="text-xl font-semibold mb-3">
              {diagnosis.issue ? '❌ Issue Detected' : '✅ All Good'}
            </h2>
            {diagnosis.issue && (
              <>
                <p className="text-red-800 font-medium mb-2">Issue: {diagnosis.issue}</p>
                <p className="text-red-700 mb-3">Solution: {diagnosis.solution}</p>
              </>
            )}
            {!diagnosis.issue && (
              <p className="text-green-800">Your authentication is working correctly!</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">User exists:</span>{' '}
                <span className={diagnosis.userExists ? 'text-green-600' : 'text-red-600'}>
                  {diagnosis.userExists ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Learner by user_id:</span>{' '}
                <span className={diagnosis.learnerExistsByUserId ? 'text-green-600' : 'text-red-600'}>
                  {diagnosis.learnerExistsByUserId ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Learner by email:</span>{' '}
                <span className={diagnosis.learnerExistsByEmail ? 'text-green-600' : 'text-red-600'}>
                  {diagnosis.learnerExistsByEmail ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">user_id match:</span>{' '}
                <span className={diagnosis.userIdMatch ? 'text-green-600' : 'text-red-600'}>
                  {diagnosis.userIdMatch ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* JWT Token Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">JWT Token (from Auth Store)</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="grid grid-cols-3 gap-4">
              <span className="text-gray-600">user.id:</span>
              <span className="col-span-2 break-all">{user?.id || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <span className="text-gray-600">user.email:</span>
              <span className="col-span-2 break-all">{user?.email || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <span className="text-gray-600">user.role:</span>
              <span className="col-span-2">{user?.role || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* JWT from Backend */}
        {jwt && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">JWT Token (from Backend)</h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="grid grid-cols-3 gap-4">
                <span className="text-gray-600">userId (sub):</span>
                <span className="col-span-2 break-all">{jwt.userId}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="text-gray-600">email:</span>
                <span className="col-span-2 break-all">{jwt.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="text-gray-600">roles:</span>
                <span className="col-span-2">{jwt.roles.join(', ')}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <span className="text-gray-600">orgId:</span>
                <span className="col-span-2">{jwt.orgId || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        {usersTable && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Users Table Lookup</h2>
            {usersTable.found ? (
              <div className="space-y-2 font-mono text-sm">
                <div className="text-green-600 font-medium mb-2">✅ User found</div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-gray-600">id:</span>
                  <span className="col-span-2 break-all">{usersTable.data.id}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-gray-600">email:</span>
                  <span className="col-span-2 break-all">{usersTable.data.email}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-gray-600">created_at:</span>
                  <span className="col-span-2">{new Date(usersTable.data.created_at).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-red-600 font-medium">❌ User not found</div>
            )}
            {usersTable.error && (
              <div className="mt-2 text-red-600 text-sm">Error: {usersTable.error}</div>
            )}
          </div>
        )}

        {/* Learners Table - By user_id */}
        {learnersTable?.byUserId && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Learners Table (by user_id)</h2>
            {learnersTable.byUserId.found ? (
              <div className="space-y-2 font-mono text-sm">
                <div className="text-green-600 font-medium mb-2">✅ Learner found</div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-gray-600">id:</span>
                  <span className="col-span-2 break-all">{learnersTable.byUserId.data.id}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-gray-600">user_id:</span>
                  <span className="col-span-2 break-all">{learnersTable.byUserId.data.user_id}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-gray-600">email:</span>
                  <span className="col-span-2 break-all">{learnersTable.byUserId.data.email}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-gray-600">name:</span>
                  <span className="col-span-2">{learnersTable.byUserId.data.name}</span>
                </div>
              </div>
            ) : (
              <div className="text-red-600 font-medium">❌ Learner not found by user_id</div>
            )}
            {learnersTable.byUserId.error && (
              <div className="mt-2 text-red-600 text-sm">Error: {learnersTable.byUserId.error}</div>
            )}
          </div>
        )}

        {/* Learners Table - By email */}
        {learnersTable?.byEmail && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Learners Table (by email)</h2>
            {learnersTable.byEmail.found ? (
              <div className="space-y-2 font-mono text-sm">
                <div className="text-green-600 font-medium mb-2">✅ Learner found</div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-gray-600">id:</span>
                  <span className="col-span-2 break-all">{learnersTable.byEmail.data.id}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-gray-600">user_id:</span>
                  <span className="col-span-2 break-all">{learnersTable.byEmail.data.user_id || 'NULL'}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-gray-600">email:</span>
                  <span className="col-span-2 break-all">{learnersTable.byEmail.data.email}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-gray-600">name:</span>
                  <span className="col-span-2">{learnersTable.byEmail.data.name}</span>
                </div>
              </div>
            ) : (
              <div className="text-red-600 font-medium">❌ Learner not found by email</div>
            )}
            {learnersTable.byEmail.error && (
              <div className="mt-2 text-red-600 text-sm">Error: {learnersTable.byEmail.error}</div>
            )}
          </div>
        )}

        {/* All learners with this email */}
        {learnersTable?.allWithEmail && learnersTable.allWithEmail.count > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              All Learners with Email ({learnersTable.allWithEmail.count})
            </h2>
            <div className="space-y-4">
              {learnersTable.allWithEmail.data.map((learner: any, index: number) => (
                <div key={learner.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="font-medium text-sm text-gray-500 mb-2">Record {index + 1}</div>
                  <div className="space-y-1 font-mono text-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <span className="text-gray-600">id:</span>
                      <span className="col-span-2 break-all">{learner.id}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <span className="text-gray-600">user_id:</span>
                      <span className="col-span-2 break-all">{learner.user_id || 'NULL'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <span className="text-gray-600">name:</span>
                      <span className="col-span-2">{learner.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
