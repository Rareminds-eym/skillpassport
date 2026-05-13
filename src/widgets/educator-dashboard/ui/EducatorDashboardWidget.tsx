import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { Users2, BookOpen, ClipboardList, TrendingUp } from 'lucide-react';

/**
 * Educator Dashboard Widget
 * 
 * Composite widget for educator overview that combines:
 * - Learner management
 * - Course/class overview
 * - Assessment tracking
 * - Performance metrics
 */
export const EducatorDashboardWidget: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Learners</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <Users2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assessments</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <ClipboardList className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold text-gray-900">0%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">No classes scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">No pending assessments</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
