import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ProfileDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      const info: any = {};

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      info.authUser = user;
      info.authError = authError;

      if (user) {
        // Check users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        info.userData = userData;
        info.userError = userError;

        // Check school_educators table
        const { data: educatorData, error: educatorError } = await supabase
          .from('school_educators')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        info.educatorData = educatorData;
        info.educatorError = educatorError;

        // Check organizations table
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .limit(5);
        
        info.schoolsData = orgsData;
        info.schoolsError = orgsError;

        // Test table existence
        const { data: tablesData, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .in('table_name', ['users', 'school_educators', 'organizations']);
        
        info.tablesData = tablesData;
        info.tablesError = tablesError;
      }

      setDebugInfo(info);
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading debug info...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Profile Debug Information</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Raw Debug Data:</h2>
        <pre className="text-sm overflow-auto max-h-96 bg-white p-4 rounded border">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Auth User</h3>
          <p>ID: {debugInfo.authUser?.id || 'Not found'}</p>
          <p>Email: {debugInfo.authUser?.email || 'Not found'}</p>
          <p>Error: {debugInfo.authError?.message || 'None'}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Users Table</h3>
          <p>Found: {debugInfo.userData ? 'Yes' : 'No'}</p>
          <p>Name: {debugInfo.userData?.full_name || 'Not set'}</p>
          <p>Error: {debugInfo.userError?.message || 'None'}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">School Educators</h3>
          <p>Found: {debugInfo.educatorData ? 'Yes' : 'No'}</p>
          <p>Specialization: {debugInfo.educatorData?.specialization || 'Not set'}</p>
          <p>Error: {debugInfo.educatorError?.message || 'None'}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Schools Table</h3>
          <p>Count: {debugInfo.schoolsData?.length || 0}</p>
          <p>Error: {debugInfo.schoolsError?.message || 'None'}</p>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="font-semibold mb-2">Next Steps:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>If no auth user: Make sure you're logged in</li>
          <li>If no users table data: Run the sample data SQL with your user ID</li>
          <li>If no educator data: Create a school_educators record</li>
          <li>If tables don't exist: Run the schema setup SQL</li>
        </ul>
      </div>
    </div>
  );
};

export default ProfileDebug;