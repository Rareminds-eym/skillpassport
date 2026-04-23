import React from 'react';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { useStudentRealtimeActivities } from '@/entities/student/model/useStudentRealtimeActivities';

interface ActivitySectionProps {
  studentId: string;
}

export const ActivitySection: React.FC<ActivitySectionProps> = ({ studentId }) => {
  const { activities, loading } = useStudentRealtimeActivities(studentId);

  if (loading) {
    return <Card><CardContent>Loading activities...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities?.slice(0, 10).map((activity: any) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
