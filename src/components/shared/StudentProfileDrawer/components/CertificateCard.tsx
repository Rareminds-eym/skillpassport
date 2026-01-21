import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { ExternalLinkIcon } from 'lucide-react';
import { Certificate } from '../types';
import StatusBadge from './StatusBadge';

interface CertificateCardProps {
  certificate: Certificate;
}

const CertificateCard: React.FC<CertificateCardProps> = ({ certificate }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheckIcon className="h-4 w-4 text-yellow-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              {certificate.title || 'Untitled Certificate'}
            </h4>
          </div>
          {certificate.issuer && (
            <p className="text-xs text-gray-600">Issued by: {certificate.issuer}</p>
          )}
        </div>
        {certificate.approval_status && <StatusBadge status={certificate.approval_status} />}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex gap-4">
          {certificate.level && (
            <span className="text-gray-600">
              Level: <span className="font-medium">{certificate.level}</span>
            </span>
          )}
          {certificate.issued_on && (
            <span className="text-gray-600">
              Issued:{' '}
              <span className="font-medium">
                {new Date(certificate.issued_on).toLocaleDateString()}
              </span>
            </span>
          )}
        </div>
        {certificate.credential_id && (
          <span
            className="text-blue-600 font-mono text-xs truncate max-w-[150px]"
            title={certificate.credential_id}
          >
            ID: {certificate.credential_id}
          </span>
        )}
      </div>

      {certificate.link && (
        <a
          href={certificate.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center text-blue-600 hover:text-blue-700 text-xs"
        >
          <ExternalLinkIcon className="h-3 w-3 mr-1" />
          View Certificate
        </a>
      )}

      {certificate.description && (
        <p className="text-xs text-gray-600 mt-2 line-clamp-1">{certificate.description}</p>
      )}
    </div>
  );
};

export default CertificateCard;
