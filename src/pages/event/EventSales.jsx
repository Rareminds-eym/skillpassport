/**
 * EventSales - DEPRECATED
 *
 * This complex multi-step form has been replaced by SimpleEventRegistration.jsx
 * for social media campaigns.
 *
 * For new registrations, use: /register?campaign=xxx
 *
 * This file is kept for backward compatibility with existing /signup/plans
 * and /register/plans routes that may still be in use.
 *
 * @deprecated Use SimpleEventRegistration instead
 * @see src/pages/register/SimpleEventRegistration.jsx
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function EventSales() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Redirect to new simple registration with campaign param preserved
    const campaign = searchParams.get('event') || searchParams.get('campaign') || 'legacy';
    navigate(`/register?campaign=${campaign}`, { replace: true });
  }, [navigate, searchParams]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to registration...</p>
      </div>
    </div>
  );
}
