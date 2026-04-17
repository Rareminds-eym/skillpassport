import React, { Suspense } from 'react';
import { CardSkeleton, PageSkeleton, ListSkeleton, FormSkeleton, ChartSkeleton } from './skeletons';

const SuspenseWrapper = ({ 
  children, 
  fallback = 'card', // 'card', 'page', 'list', 'form', 'chart', 'custom'
  customFallback = null,
  className = "",
  rows = 3,
  showHeader = true,
  showAvatar = false
}) => {
  const getFallback = () => {
    if (customFallback) return customFallback;
    
    switch (fallback) {
      case 'page':
        return <PageSkeleton />;
      case 'list':
        return <ListSkeleton rows={rows} showAvatar={showAvatar} />;
      case 'form':
        return <FormSkeleton />;
      case 'chart':
        return <ChartSkeleton />;
      case 'card':
      default:
        return <CardSkeleton rows={rows} showHeader={showHeader} />;
    }
  };

  return (
    <Suspense fallback={getFallback()}>
      <div className={className}>
        {children}
      </div>
    </Suspense>
  );
};

export default SuspenseWrapper;