import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, showHome = true }) => {
  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {showHome && (
          <li>
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                aria-label="Go back"
              >
                <HomeIcon className="h-5 w-5" />
              </button>
            </div>
          </li>
        )}

        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />

            {item.current ? (
              <span className="ml-2 text-sm font-medium text-gray-900" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="ml-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors"
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;

// Compact Breadcrumb for mobile
export const CompactBreadcrumb: React.FC<{ currentPage: string; onBack: () => void }> = ({
  currentPage,
  onBack,
}) => {
  return (
    <div className="flex items-center gap-2 mb-4 md:hidden">
      <button
        onClick={onBack}
        className="flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors"
      >
        <ChevronRightIcon className="h-4 w-4 rotate-180" />
        <span>Back</span>
      </button>
      <span className="text-sm font-medium text-gray-900">{currentPage}</span>
    </div>
  );
};
