import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Debug component to test real-time connections
 * Shows connection status and allows testing
 */
export const RealtimeDebugger: React.FC = () => {
  const [status, setStatus] = useState<string>('Not connected');
  const [events, setEvents] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    // Test connection
    const channel = supabase.channel('debug-test');
    
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'offers'
      }, (payload) => {
        const timestamp = new Date().toLocaleTimeString();
        setEvents(prev => [`[${timestamp}] ${payload.eventType} on offers`, ...prev.slice(0, 9)]);
      })
      .subscribe((status) => {
        setStatus(status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const testInsert = async () => {
    setTestResult('Inserting test offer...');
    try {
      const { data, error } = await supabase
        .from('offers')
        .insert({
          candidate_name: `Test ${Date.now()}`,
          job_title: 'Software Engineer',
          offered_ctc: '10 LPA',
          expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        })
        .select();

      if (error) {
        setTestResult(`❌ Error: ${error.message}`);
      } else {
        setTestResult(`✅ Inserted successfully! ID: ${data[0]?.id}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`);
    }
  };

  const getStatusColor = () => {
    if (status === 'SUBSCRIBED') return 'bg-green-500';
    if (status === 'CHANNEL_ERROR') return 'bg-red-500';
    if (status === 'TIMED_OUT') return 'bg-orange-500';
    return 'bg-gray-500';
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white shadow-2xl rounded-lg border-2 border-gray-200 p-4 z-50">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-gray-900 mb-2">🔍 Real-time Debugger</h3>
        
        {/* Status */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`h-3 w-3 rounded-full ${getStatusColor()}`}></div>
          <span className="text-xs font-medium">{status}</span>
        </div>

        {/* Test Button */}
        <button
          onClick={testInsert}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded mb-2"
        >
          🧪 Test Insert Offer
        </button>

        {/* Test Result */}
        {testResult && (
          <div className="text-xs p-2 bg-gray-50 rounded mb-2 break-words">
            {testResult}
          </div>
        )}

        {/* Events Log */}
        <div className="border-t pt-2">
          <p className="text-xs font-semibold mb-1">Recent Events:</p>
          <div className="max-h-32 overflow-y-auto text-xs space-y-1">
            {events.length === 0 ? (
              <p className="text-gray-400">No events yet...</p>
            ) : (
              events.map((event, i) => (
                <div key={i} className="text-gray-600 font-mono text-[10px]">
                  {event}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-3 p-2 bg-blue-50 rounded text-[10px] text-gray-600">
          <p className="font-semibold mb-1">How to test:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Check status is "SUBSCRIBED"</li>
            <li>Click "Test Insert Offer"</li>
            <li>Watch for event in log</li>
            <li>Check Recent Activity updates</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RealtimeDebugger;
