import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Debug component to test Supabase opportunities connection
 * Add this temporarily to your dashboard to debug
 */
const OpportunitiesDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({
    loading: true,
    error: null,
    data: null,
    connectionStatus: 'Checking...'
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        
        // Test 1: Check if supabase client is configured
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        // Test 2: Try to fetch from opportunities table
        const { data, error, count } = await supabase
          .from('opportunities')
          .select('*', { count: 'exact' });

        if (error) {
          console.error('❌ Supabase Error:', error);
          setDebugInfo({
            loading: false,
            error: error.message,
            data: null,
            connectionStatus: 'Failed'
          });
          return;
        }


        setDebugInfo({
          loading: false,
          error: null,
          data: data,
          connectionStatus: 'Connected'
        });

      } catch (err) {
        console.error('❌ Connection Error:', err);
        setDebugInfo({
          loading: false,
          error: err.message,
          data: null,
          connectionStatus: 'Failed'
        });
      }
    };

    testConnection();
  }, []);

  if (debugInfo.loading) {
    return (
      <div className="p-4 border border-blue-500 rounded-lg bg-blue-50">
        <h3 className="font-bold text-blue-800">🔍 Testing Opportunities Connection...</h3>
        <p className="text-blue-600">Please wait...</p>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg ${debugInfo.error ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
      <h3 className={`font-bold ${debugInfo.error ? 'text-red-800' : 'text-green-800'}`}>
        🔍 Opportunities Debug Info
      </h3>
      
      <div className="mt-2 space-y-2">
        <p><strong>Connection Status:</strong> 
          <span className={debugInfo.error ? 'text-red-600' : 'text-green-600'}>
            {debugInfo.connectionStatus}
          </span>
        </p>
        
        <p><strong>Environment Variables:</strong></p>
        <ul className="ml-4 text-sm">
          <li>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
          <li>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
        </ul>

        {debugInfo.error && (
          <div className="mt-2">
            <p className="text-red-600"><strong>Error:</strong> {debugInfo.error}</p>
          </div>
        )}

        {debugInfo.data && (
          <div className="mt-2">
            <p className="text-green-600"><strong>Data Found:</strong> {debugInfo.data.length} opportunities</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-semibold">View Raw Data</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(debugInfo.data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunitiesDebugger;