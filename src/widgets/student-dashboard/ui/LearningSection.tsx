import React from 'react';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { useStudentLearning } from '@/entities/student';

interface LearningSectionProps {
  studentId: string;
}

export const LearningSection: React.FC<LearningSectionProps> = ({ studentId }) => {
  const { learning, loading } = useStudentLearning(studentId, !!studentId);

  if (loading) {
    return <Card><CardContent>Loading courses...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          My Learning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {learning?.slice(0, 5).map((course: any) => (
            <div
              key={course.id}
              className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
            >
              <h4 className="font-semibold text-gray-900">{course.title}</h4>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration || 'Self-paced'}</span>
                </div>
                {course.completed && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
