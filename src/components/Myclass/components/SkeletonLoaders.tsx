import React from 'react';

/**
 * Reusable skeleton loader components with shimmer animation
 * Following modern UX best practices for loading states
 */

// Base skeleton component with shimmer effect
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded ${className}`} 
       style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
);

// Card skeleton for assignments, classmates, etc.
export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-9 w-24 rounded-lg" />
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  </div>
);

// Stats card skeleton for overview
export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-3 w-32" />
  </div>
);

// Table row skeleton
export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-200">
    <td className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
    <td className="px-4 py-3"><Skeleton className="h-8 w-20 rounded-full" /></td>
  </tr>
);

// Timetable slot skeleton
export const TimetableSlotSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <Skeleton className="h-3 w-1/3" />
  </div>
);

// Profile card skeleton for classmates
export const ProfileCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  </div>
);

// Club card skeleton
export const ClubCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-24 rounded-full" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="flex items-center gap-4 pt-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

// Achievement card skeleton
export const AchievementCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

// Exam card skeleton
export const ExamCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-36" />
    </div>
  </div>
);

// Composite skeleton loaders for full sections
export const AssignmentsSkeletonLoader: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
  </div>
);

export const OverviewSkeletonLoader: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        {[...Array(4)].map((_, i) => <TimetableSlotSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

export const ClassmatesSkeletonLoader: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => <ProfileCardSkeleton key={i} />)}
  </div>
);

export const TimetableSkeletonLoader: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="h-6 w-24" />
        {[...Array(6)].map((_, j) => <TimetableSlotSkeleton key={j} />)}
      </div>
    ))}
  </div>
);

export const CoCurricularsSkeletonLoader: React.FC = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <ClubCardSkeleton key={i} />)}
      </div>
    </div>
    <div>
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <AchievementCardSkeleton key={i} />)}
      </div>
    </div>
  </div>
);

export const ExamsSkeletonLoader: React.FC = () => (
  <div className="space-y-4">
    {[...Array(4)].map((_, i) => <ExamCardSkeleton key={i} />)}
  </div>
);

export const ResultsSkeletonLoader: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
    </div>
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3"><Skeleton className="h-4 w-20" /></th>
            <th className="px-4 py-3"><Skeleton className="h-4 w-16" /></th>
            <th className="px-4 py-3"><Skeleton className="h-4 w-16" /></th>
            <th className="px-4 py-3"><Skeleton className="h-4 w-20" /></th>
            <th className="px-4 py-3"><Skeleton className="h-4 w-16" /></th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
        </tbody>
      </table>
    </div>
  </div>
);

// Add shimmer keyframe animation to global styles
export const SkeletonStyles = () => (
  <style>{`
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `}</style>
);
