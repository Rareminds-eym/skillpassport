/**
 * Team Analytics Tab Component
 * Enhanced version of TeamAnalytics with filtering
 */

import { TeamAnalytics } from '../../TeamAnalytics';

interface TeamTabProps {
  orgId: string;
}

export function TeamTab({ orgId }: TeamTabProps) {
  // Using existing TeamAnalytics component
  // In future, can add filters specific to this tab
  return (
    <div className="space-y-6">
      <TeamAnalytics />
      
      {/* Future enhancements can go here */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Use the global filters above to analyze specific team segments
        </p>
      </div>
    </div>
  );
}
