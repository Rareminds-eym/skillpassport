import React, { useState } from 'react';
import { Mail, Zap, RotateCcw, TestTube, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const StreakTestPanel = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [testEmail, setTestEmail] = useState('');

  const API_URL = import.meta.env.VITE_EXTERNAL_API_KEY || 'http://localhost:3000';

  const handleAction = async (endpoint, body = null) => {
    setLoading(true);
    setResult(null);

    try {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_URL}${endpoint}`, options);
      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Action completed successfully!',
          data: data,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Action failed!',
          data: data,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      setResult({
        success: false,
        message: 'Please enter an email address',
      });
      return;
    }
    handleAction('/api/streaks/admin/test-email', { email: testEmail });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TestTube className="w-6 h-6" />
            Streak System Test Panel
          </h2>
          <p className="text-purple-100 text-sm mt-1">
            Test the streak notification system manually
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Test Email */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              1. Send Test Email
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Send a test email to verify SMTP configuration is working
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your-email@gmail.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleTestEmail}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Send Test
              </button>
            </div>
          </div>

          {/* Manual Streak Check */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              2. Trigger Manual Streak Check
            </h3>
            <p className="text-sm text-purple-700 mb-3">
              Manually run the streak checker to see which students need reminders.
              This will send actual emails to students who haven't completed their streak today.
            </p>
            <button
              onClick={() => handleAction('/api/streaks/admin/check-all')}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Run Streak Check Now
            </button>
          </div>

          {/* Manual Daily Reset */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              3. Trigger Daily Reset
            </h3>
            <p className="text-sm text-orange-700 mb-3">
              Reset all students' "streak_completed_today" flags. Normally runs at midnight.
            </p>
            <button
              onClick={() => handleAction('/api/streaks/admin/reset-daily')}
              disabled={loading}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Reset Daily Flags
            </button>
          </div>

          {/* Result Display */}
          {result && (
            <div
              className={`border rounded-lg p-4 ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {result.success ? 'Success!' : 'Error'}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-gray-600 hover:text-gray-900">
                        View details
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">📋 Instructions:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Start your backend server: <code className="bg-gray-200 px-1 rounded">cd Backend && npm start</code></li>
              <li>Make sure you've run the database migration</li>
              <li>First, test email configuration with button #1</li>
              <li>Then test the streak checker with button #2</li>
              <li>Check server logs for detailed output</li>
            </ol>
          </div>

          {/* Server Logs Reminder */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>💡 Tip:</strong> Watch your backend server terminal for detailed logs when you click these buttons.
              You'll see which students would receive emails and what's happening.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakTestPanel;
