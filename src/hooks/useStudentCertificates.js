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
        // Removed: .eq('enabled', true) - Fetch ALL certificates including hidden ones
        .order('issued_on', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match UI expectations
      // NOTE: We return the ACTUAL data here (including pending edits)
      // The Dashboard component will handle showing verified_data when needed
      const transformedData = data.map(item => ({
        id: item.id,
        title: item.title || item.name,
        issuer: item.issuer || item.organization,
        issuedOn: item.issued_on,
        expiryDate: item.expiry_date,
        level: item.level,
        description: item.description,
        credentialId: item.credential_id,
        link: item.link || item.certificate_url,
        documentUrl: item.document_url,
        platform: item.platform,
        instructor: item.instructor,
        category: item.category,
        status: item.status || 'active',
        approval_status: item.approval_status,
        verified: item.approval_status === 'approved' || item.approval_status === 'verified',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        has_pending_edit: item.has_pending_edit || false,
        verified_data: item.verified_data,
        pending_edit_data: item.pending_edit_data,
        createdAt: item.created_at,
        updatedAt: item.updated_at
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
    refresh
  };
};