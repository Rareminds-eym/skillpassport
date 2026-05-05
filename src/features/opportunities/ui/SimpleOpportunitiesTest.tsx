import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/api/supabaseClient';

const SimpleOpportunitiesTest = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        
        // Test 1: Basic connection
        const { data: testData, error: testError } = await supabase
          .from('opportunities')
          .select('id, title, company_name, employment_type')
          .limit(5);

        if (testError) {
          setError(testError.message);
          return;
        }

        setData(testData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4 border">🔄 Testing connection...</div>;
  if (error) return <div className="p-4 border border-red-500 bg-red-50">❌ Error: {error}</div>;

  return (
    <div className="p-4 border border-green-500 bg-green-50">
      <h3 className="font-bold text-green-800">✅ Simple Test Results</h3>
      <p>Found {data?.length || 0} opportunities:</p>
      {data && data.map((opp, idx) => (
        <div key={idx} className="mt-2 p-2 bg-white rounded">
          <strong>{opp.title}</strong> at {opp.company_name} ({opp.employment_type})
        </div>
      ))}
    </div>
  );
};

export default SimpleOpportunitiesTest;
