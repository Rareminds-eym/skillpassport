// import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabaseClient';

// export const useStudentCertificates = (studentId, enabled = true) => {
//   const [certificates, setCertificates] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const fetchCertificates = async () => {
//     if (!studentId || !enabled) return;

//     try {
//       setLoading(true);
//       setError(null);

//       const { data, error: fetchError } = await supabase
//         .from('certificates')
//         .select('*')
//         .eq('student_id', studentId)
//         .is('training_id', null)
//         .order('issued_on', { ascending: false });

//       if (fetchError) {
//         throw fetchError;
//       }

//       // Transform data to match UI expectations
//       const transformedData = data.map(item => ({
//         id: item.id,
//         title: item.title || item.name,
//         issuer: item.issuer || item.organization,
//         issuedOn: item.issued_on,
//         level: item.level,
//         description: item.description,
//         credentialId: item.credential_id,
//         link: item.link || item.certificate_url,
//         documentUrl: item.document_url,
//         status: item.status || 'active',
//         approval_status: item.approval_status || 'pending',
//         verified: item.approval_status === 'approved',
//         processing: item.approval_status === 'pending',
//         enabled: item.enabled !== false,
//         createdAt: item.created_at,
//         updatedAt: item.updated_at
//       }));

//       setCertificates(transformedData);
//     } catch (err) {
//       console.error('Error fetching certificates:', err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCertificates();
//   }, [studentId, enabled]);

//   const refresh = () => {
//     fetchCertificates();
//   };

//   return {
//     certificates,
//     loading,
//     error,
//     refresh
//   };
// };
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useStudentCertificates = (studentId, enabled = true) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCertificates = async () => {
    if (!studentId || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', studentId)
        .is('training_id', null)
        .in('approval_status', ['approved', 'verified']) // Only approved or verified
        .order('issued_on', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match UI expectations
      const transformedData = data.map((item) => ({
        id: item.id,
        title: item.title || item.name,
        issuer: item.issuer || item.organization,
        issuedOn: item.issued_on,
        level: item.level,
        description: item.description,
        credentialId: item.credential_id,
        link: item.link || item.certificate_url,
        documentUrl: item.document_url,
        status: item.status || 'active',
        approval_status: item.approval_status,
        verified: true, // Already filtered, so all are verified
        processing: false, // Already filtered, so won't be pending
        enabled: item.enabled !== false,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      setCertificates(transformedData);
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [studentId, enabled]);

  const refresh = () => {
    fetchCertificates();
  };

  return {
    certificates,
    loading,
    error,
    refresh,
  };
};
