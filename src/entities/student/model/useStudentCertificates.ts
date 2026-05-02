import { useState, useEffect } from 'react';
import { supabase } from '@/shared/api/supabaseClient';

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issuedOn: string;
  expiryDate?: string;
  level?: string;
  description?: string;
  credentialId?: string;
  link?: string;
  documentUrl?: string;
  platform?: string;
  instructor?: string;
  category?: string;
  status: string;
  approval_status?: string;
  verified: boolean;
  processing: boolean;
  enabled: boolean;
  has_pending_edit: boolean;
  verified_data?: any;
  pending_edit_data?: any;
  createdAt: string;
  updatedAt: string;
}

interface UseStudentCertificatesResult {
  certificates: Certificate[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useStudentCertificates = (
  studentId: string | undefined | null,
  enabled: boolean = true
): UseStudentCertificatesResult => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
        .order('issued_on', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to match UI expectations
      const transformedData: Certificate[] = (data || []).map((item: any) => ({
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
    } catch (err: any) {
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
