import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Database, CheckCircle, XCircle } from 'lucide-react';

/**
 * Database Connection Verification Display
 * Shows which components are connected to the database
 */
const DatabaseConnectionStatus = ({ studentData, loading, error }) => {
  const isConnected = !loading && !error && studentData?.profile;

  const sections = [
    { name: 'Personal Information', key: 'profile', icon: '👤' },
    { name: 'Education', key: 'education', icon: '🎓' },
    { name: 'Training', key: 'training', icon: '📚' },
    { name: 'Experience', key: 'experience', icon: '💼' },
    { name: 'Technical Skills', key: 'technicalSkills', icon: '⚡' },
    { name: 'Soft Skills', key: 'softSkills', icon: '💬' },
  ];

  const getSectionStatus = (key) => {
    if (!isConnected) return 'disconnected';
    if (key === 'profile') return studentData?.profile ? 'connected' : 'no-data';
    const data = studentData?.[key];
    if (!data) return 'no-data';
    if (Array.isArray(data)) {
      return data.length > 0 ? 'connected' : 'empty';
    }
    return 'connected';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'empty':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'no-data':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'disconnected':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusText = (status, data) => {
    switch (status) {
      case 'connected':
        if (Array.isArray(data)) {
          return `${data.length} item${data.length !== 1 ? 's' : ''}`;
        }
        return 'Connected';
      case 'empty':
        return 'Connected (No items)';
      case 'no-data':
        return 'No data';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Database className="w-5 h-5" />
          Database Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Overall Status */}
          <div
            className={`p-4 rounded-lg border-2 ${
              isConnected
                ? 'bg-green-50 border-green-300'
                : loading
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-red-50 border-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span
                  className={`font-semibold ${
                    isConnected ? 'text-green-700' : loading ? 'text-blue-700' : 'text-red-700'
                  }`}
                >
                  {loading
                    ? 'Connecting...'
                    : isConnected
                      ? 'Connected to Database'
                      : 'Disconnected'}
                </span>
              </div>
              {isConnected && studentData?.profile && (
                <Badge className="bg-green-600 text-white">{studentData.profile.name}</Badge>
              )}
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>

          {/* Individual Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sections.map((section) => {
              const status = getSectionStatus(section.key);
              const data = studentData?.[section.key];
              const statusColor = getStatusColor(status);

              return (
                <div
                  key={section.key}
                  className={`p-3 rounded-lg border ${statusColor} transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{section.icon}</span>
                      <span className="text-sm font-medium">{section.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(status, data)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Technical Details */}
          {isConnected && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 mb-2">✅ Database Details:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>
                  • Table: <code className="bg-gray-100 px-1 rounded">students</code>
                </li>
                <li>
                  • Column: <code className="bg-gray-100 px-1 rounded">profile</code> (JSONB)
                </li>
                <li>
                  • Hook: <code className="bg-gray-100 px-1 rounded">useStudentDataByEmail</code>
                </li>
                <li>
                  • Service:{' '}
                  <code className="bg-gray-100 px-1 rounded">studentServiceProfile.js</code>
                </li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseConnectionStatus;
