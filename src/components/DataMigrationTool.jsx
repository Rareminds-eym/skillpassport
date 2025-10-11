import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Students/components/ui/card';
import { Button } from '../Students/components/ui/button';
import { Alert, AlertDescription } from '../Students/components/ui/alert';
import { runMigration, clearStudentData, checkStudentExists } from '../utils/dataMigration';
import { Loader2, Database, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Data Migration Tool Component
 * Use this to migrate mock data to Supabase or clear existing data
 * Add this to your app temporarily for initial setup
 */
const DataMigrationTool = () => {
  const [studentId, setStudentId] = useState('SP2024001');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [exists, setExists] = useState(null);

  // Check if student exists
  const handleCheckExists = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      const result = await checkStudentExists(studentId);
      setExists(result.exists);
      setStatus({
        type: result.exists ? 'info' : 'warning',
        message: result.exists 
          ? `Student ${studentId} exists in database` 
          : `Student ${studentId} not found in database`
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Error checking student: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Run migration
  const handleMigrate = async () => {
    if (!studentId.trim()) {
      setStatus({
        type: 'error',
        message: 'Please enter a student ID'
      });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await runMigration(studentId);
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: `✅ Migration successful! Student ID: ${result.studentId}`
        });
        setExists(true);
      } else {
        setStatus({
          type: 'error',
          message: `❌ Migration failed: ${result.error?.message || 'Unknown error'}`
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `❌ Migration failed: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear student data
  const handleClear = async () => {
    if (!window.confirm(`Are you sure you want to delete all data for student ${studentId}?`)) {
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const result = await clearStudentData(studentId);
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: `✅ Data cleared successfully for student ${studentId}`
        });
        setExists(false);
      } else {
        setStatus({
          type: 'error',
          message: `❌ Clear failed: ${result.error?.message || 'Unknown error'}`
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: `❌ Clear failed: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getAlertVariant = () => {
    switch (status.type) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getAlertIcon = () => {
    switch (status.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-6 h-6" />
              Supabase Data Migration Tool
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Instructions */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Make sure you've run the SQL schema in Supabase</li>
                <li>Enter the student ID (default: SP2024001)</li>
                <li>Click "Check Status" to see if data exists</li>
                <li>Click "Migrate Data" to insert mock data</li>
                <li>Use "Clear Data" to remove all student data</li>
              </ol>
            </div>

            {/* Student ID Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter student ID"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {/* Status Display */}
            {exists !== null && (
              <div className={`p-3 rounded-md ${exists ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <p className={`text-sm font-medium ${exists ? 'text-green-800' : 'text-yellow-800'}`}>
                  {exists ? '✅ Student exists in database' : '⚠️ Student not found in database'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={handleCheckExists}
                disabled={loading || !studentId.trim()}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Check Status
              </Button>

              <Button
                onClick={handleMigrate}
                disabled={loading || !studentId.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Migrate Data
              </Button>

              <Button
                onClick={handleClear}
                disabled={loading || !studentId.trim() || !exists}
                variant="destructive"
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Clear Data
              </Button>
            </div>

            {/* Status Message */}
            {status.message && (
              <Alert variant={getAlertVariant()}>
                {getAlertIcon()}
                <AlertDescription className="ml-2">
                  {status.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Data Preview */}
            <div className="bg-gray-50 p-4 rounded-md border">
              <h4 className="font-semibold mb-2">Migration Preview:</h4>
              <div className="text-sm space-y-1 text-gray-600">
                <p>✓ Student Profile</p>
                <p>✓ 3 Education Records</p>
                <p>✓ 3 Training Courses</p>
                <p>✓ 2 Experience Records</p>
                <p>✓ 5 Technical Skills</p>
                <p>✓ 5 Soft Skills</p>
                <p>✓ 3 Opportunities</p>
                <p>✓ 3 Recent Updates</p>
                <p>✓ 3 Suggestions</p>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This tool is for development use only. 
                Remove it before deploying to production.
              </p>
            </div>

          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>After migration, check your Supabase Dashboard → Table Editor</p>
          <p className="mt-2">
            Environment: {import.meta.env.VITE_SUPABASE_URL ? '✅ Connected' : '❌ Not configured'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataMigrationTool;
