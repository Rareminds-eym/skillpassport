import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Certificate } from '../types';
import { CertificateCard } from '../components';

interface CertificatesTabProps {
  certificates: Certificate[];
  loading?: boolean;
}

const CertificatesTab: React.FC<CertificatesTabProps> = ({ certificates, loading = false }) => {
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-28 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Certificates</h3>
        <span className="text-sm text-gray-600">{certificates?.length || 0} total</span>
      </div>

      {certificates && certificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {certificates.map((certificate) => (
            <CertificateCard key={certificate.id} certificate={certificate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 mt-2">No certificates yet</p>
          <p className="text-gray-400 text-sm mt-1">Student hasn't added any certificates</p>
        </div>
      )}
    </div>
  );
};

export default CertificatesTab;