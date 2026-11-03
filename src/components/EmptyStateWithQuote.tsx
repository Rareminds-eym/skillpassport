import React, { useMemo } from 'react';
import { getRandomQuote, PageIdentifier } from '@/utils/emptyStateQuotes';

interface EmptyStateWithQuoteProps {
  /**
   * The page identifier to determine which quotes to use
   */
  page: PageIdentifier;
  
  /**
   * Icon component to display (should be a Heroicon component)
   */
  icon: React.ComponentType<{ className?: string }>;
  
  /**
   * Optional action button to display below the quote
   */
  actionButton?: React.ReactNode;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  
  /**
   * Size variant for the icon
   * @default 'default'
   */
  iconSize?: 'small' | 'default' | 'large';
}

/**
 * EmptyStateWithQuote Component
 * 
 * Displays a motivational quote with an icon for empty states across the recruiter platform.
 * Quotes are page-specific and rotate on each component mount using session-based tracking.
 * 
 * @example
 * ```tsx
 * <EmptyStateWithQuote
 *   page="requisitions"
 *   icon={BriefcaseSolidIcon}
 *   actionButton={
 *     <button onClick={handleCreate}>
 *       <PlusIcon className="h-5 w-5 mr-2" />
 *       Create Your First Requisition
 *     </button>
 *   }
 * />
 * ```
 */
export const EmptyStateWithQuote: React.FC<EmptyStateWithQuoteProps> = ({
  page,
  icon: Icon,
  actionButton,
  className = '',
  iconSize = 'default',
}) => {
  // Get a random quote on component mount (useMemo ensures it doesn't change on re-renders)
  const quote = useMemo(() => getRandomQuote(page), [page]);

  // Icon size classes
  const iconSizeClasses = {
    small: 'h-8 w-8',
    default: 'h-12 w-12',
    large: 'h-16 w-16',
  };

  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className={`mx-auto ${iconSizeClasses[iconSize]} text-gray-400`} />
      <p className="mt-4 text-base font-medium text-gray-700 max-w-md mx-auto">
        {quote}
      </p>
      {actionButton && (
        <div className="mt-6">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default EmptyStateWithQuote;
