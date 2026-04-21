/**
 * Organization Entity - OrganizationCard Component
 * Displays organization information in a card format
 */

import React from 'react';
import type { Organization } from '../model/types';
import { getOrganizationDisplayName, getOrganizationTypeLabel } from '../model/utils';

interface OrganizationCardProps {
  organization: Organization;
  onClick?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({
  organization,
  onClick,
  className = '',
  showDetails = true,
}) => {
  const displayName = getOrganizationDisplayName(organization);
  const typeLabel = getOrganizationTypeLabel(organization.organization_type);

  return (
    <div
      className={`
        p-4 rounded-lg border border-gray-200 bg-white
        hover:shadow-md transition-shadow
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {organization.logo_url && (
          <img
            src={organization.logo_url}
            alt={displayName}
            className="w-12 h-12 rounded-md object-cover"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 text-lg truncate">
              {displayName}
            </h3>
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 ml-2">
              {typeLabel}
            </span>
          </div>

          {showDetails && (
            <div className="mt-2 space-y-1">
              {organization.city && organization.state && (
                <p className="text-sm text-gray-600">
                  {organization.city}, {organization.state}
                </p>
              )}
              
              {organization.email && (
                <p className="text-sm text-gray-600">
                  {organization.email}
                </p>
              )}

              {organization.phone && (
                <p className="text-sm text-gray-600">
                  {organization.phone}
                </p>
              )}
            </div>
          )}

          {organization.is_active !== undefined && (
            <div className="mt-2">
              <span
                className={`
                  px-2 py-1 text-xs rounded-full
                  ${organization.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                `}
              >
                {organization.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
