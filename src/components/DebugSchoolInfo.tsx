import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const DebugSchoolInfo = () => {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      let finalSchoolId: string | null = null;
      let userEmail: string | null = null;
      let authMethod = 'none';

      // Check localStorage first (for school admins)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          userEmail = userData.email;
          if (userData.role === 'school_admin' && userData.schoolId) {
            finalSchoolId = userData.schoolId;
            authMethod = 'localStorage (school_admin)';
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }

      // If not found, check Supabase Auth
      let supabaseUserId: string | null = null;
      if (!finalSchoolId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          supabaseUserId = user.id;
          userEmail = user.email;
          authMethod = 'supabase_auth';

          // Check school_educators
          const { data: educator } = await supabase
            .from('school_educators')
            .select('school_id, role')
            .eq('user_id', user.id)
            .single();

          if (educator?.school_id) {
            finalSchoolId = educator.school_id;
          } else {
            // Check organizations table
            const { data: org } = await supabase
              .from('organizations')
              .select('id, name')
              .eq('organization_type', 'school')
              .eq('email', user.email)
              .maybeSingle();

            if (org?.id) {
              finalSchoolId = org.id;
            }
          }
        }
      }

      if (!finalSchoolId) {
        setInfo({ error: 'No school_id found', authMethod, userEmail });
        return;
      }

      // Get school name from organizations table
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', finalSchoolId)
        .single();

      // Count students
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', finalSchoolId);

      setInfo({
        userEmail,
        authMethod,
        supabaseUserId,
        schoolName: org?.name,
        finalSchoolId,
        studentCount: count || 0
      });
    };

    fetchInfo();
  }, []);

  if (!info) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: '#1f2937',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '400px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#60a5fa' }}>
        🔍 Debug Info
      </div>
      {info.error ? (
        <>
          <div style={{ color: '#ef4444' }}>{info.error}</div>
          <div><strong>Auth Method:</strong> {info.authMethod}</div>
          <div><strong>Email:</strong> {info.userEmail || 'N/A'}</div>
        </>
      ) : (
        <>
          <div><strong>Email:</strong> {info.userEmail}</div>
          <div><strong>Auth Method:</strong> {info.authMethod}</div>
          {info.supabaseUserId && (
            <div><strong>Supabase User ID:</strong> {info.supabaseUserId.substring(0, 8)}...</div>
          )}
          <div><strong>School Name:</strong> {info.schoolName || 'N/A'}</div>
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #374151' }}>
            <strong style={{ color: '#10b981' }}>School ID:</strong> {info.finalSchoolId || 'NONE'}
          </div>
          <div style={{ color: '#10b981' }}>
            <strong>Students:</strong> {info.studentCount}
          </div>
        </>
      )}
    </div>
  );
};
