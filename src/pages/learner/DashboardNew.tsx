/**
 * Learner Dashboard - New Implementation
 * 
 * Uses backend API instead of direct Supabase calls
 * This is a simplified version showing how to use the new useLearnerDashboard hook
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearnerDashboard } from '@/features/learner-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { Briefcase, GraduationCap, Award, BookOpen, Loader2 } from 'lucide-react';

export const LearnerDashboardNew: React.FC = () => {
  const navigate = useNavigate();

  // Fetch all dashboard data from backend API (uses user_id from JWT automatically)
  const {
    profile,
    education,
    experience,
    technicalSkills,
    softSkills,
    projects,
    certificates,
    training,
    opportunities,
    loading,
    error,
    refresh
  } = useLearnerDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No learner data found. Please check your email or contact support.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile.name || 'Learner'}!
        </h1>
        <p className="text-gray-600 mt-2">
          {profile.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Education</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{education.length}</div>
            <p className="text-xs text-muted-foreground">
              {education.length === 1 ? 'record' : 'records'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Experience</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{experience.length}</div>
            <p className="text-xs text-muted-foreground">
              {experience.length === 1 ? 'position' : 'positions'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {technicalSkills.length + softSkills.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {technicalSkills.length} technical, {softSkills.length} soft
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities.length}</div>
            <p className="text-xs text-muted-foreground">
              available now
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Education Section */}
        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent>
            {education.length === 0 ? (
              <p className="text-gray-500">No education records yet</p>
            ) : (
              <div className="space-y-4">
                {education.slice(0, 3).map((edu: any) => (
                  <div key={edu.id} className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-semibold">{edu.degree}</h4>
                    <p className="text-sm text-gray-600">{edu.university}</p>
                    <p className="text-xs text-gray-500">{edu.year_of_passing}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience Section */}
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
          </CardHeader>
          <CardContent>
            {experience.length === 0 ? (
              <p className="text-gray-500">No experience records yet</p>
            ) : (
              <div className="space-y-4">
                {experience.slice(0, 3).map((exp: any) => (
                  <div key={exp.id} className="border-l-2 border-green-500 pl-4">
                    <h4 className="font-semibold">{exp.role}</h4>
                    <p className="text-sm text-gray-600">{exp.organization}</p>
                    <p className="text-xs text-gray-500">
                      {exp.start_date} - {exp.end_date || 'Present'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills Section */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {technicalSkills.length === 0 ? (
              <p className="text-gray-500">No technical skills yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {technicalSkills.slice(0, 10).map((skill: any) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opportunities Section */}
        <Card>
          <CardHeader>
            <CardTitle>Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <p className="text-gray-500">No opportunities available</p>
            ) : (
              <div className="space-y-4">
                {opportunities.slice(0, 3).map((opp: any) => (
                  <div key={opp.id} className="border-l-2 border-purple-500 pl-4">
                    <h4 className="font-semibold">{opp.title}</h4>
                    <p className="text-sm text-gray-600">{opp.company_name}</p>
                    <p className="text-xs text-gray-500">{opp.location}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearnerDashboardNew;
