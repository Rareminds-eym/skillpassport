import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Bell,
  TrendingUp,
  CheckCircle,
  Star,
  ExternalLink,
  Edit,
  Calendar,
  Award,
  Users,
  Code,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { useStudentData } from '../../../hooks/useStudentData';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal,
} from './ProfileEditModals';

/**
 * Dashboard Component with Supabase Integration
 * This version fetches data from Supabase and falls back to mock data if needed
 */
const DashboardWithSupabase = ({ studentId }) => {
  const [activeModal, setActiveModal] = useState(null);

  // Use the custom hook to fetch and manage student data
  const {
    studentData,
    loading,
    error,
    updateEducation,
    deleteEducation,
    updateTraining,
    deleteTraining,
    updateExperience,
    deleteExperience,
    updateTechnicalSkill,
    deleteTechnicalSkill,
    updateSoftSkill,
    deleteSoftSkill,
    refresh,
  } = useStudentData(studentId, true); // true = fallback to mock data

  // Handle save operations for different sections
  const handleSave = async (section, data) => {
    try {
      switch (section) {
        case 'education':
          // If data has an id, update; otherwise, it's handled by the modal
          if (Array.isArray(data)) {
            // Update multiple records
            await Promise.all(
              data.map((item) => (item.id ? updateEducation(item.id, item) : null))
            );
          }
          break;

        case 'training':
          if (Array.isArray(data)) {
            await Promise.all(data.map((item) => (item.id ? updateTraining(item.id, item) : null)));
          }
          break;

        case 'experience':
          if (Array.isArray(data)) {
            await Promise.all(
              data.map((item) => (item.id ? updateExperience(item.id, item) : null))
            );
          }
          break;

        case 'technicalSkills':
          if (Array.isArray(data)) {
            await Promise.all(
              data.map((item) => (item.id ? updateTechnicalSkill(item.id, item) : null))
            );
          }
          break;

        case 'softSkills':
          if (Array.isArray(data)) {
            await Promise.all(
              data.map((item) => (item.id ? updateSoftSkill(item.id, item) : null))
            );
          }
          break;

        default:
          break;
      }

      // Refresh data after update
      refresh();
      setActiveModal(null);
    } catch (err) {
      console.error(`Error saving ${section}:`, err);
      alert(`Failed to save ${section}. Please try again.`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !studentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Unable to load your dashboard data. Please try again later.
            </p>
            <Button onClick={refresh}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data with fallback
  const profile = studentData?.profile || {};
  const education = studentData?.education || [];
  const training = studentData?.training || [];
  const experience = studentData?.experience || [];
  const technicalSkills = studentData?.technicalSkills || [];
  const softSkills = studentData?.softSkills || [];
  const opportunities = studentData?.opportunities || [];
  const recentUpdates = studentData?.recentUpdates || [];
  const suggestions = studentData?.suggestions || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Employability Score</p>
                  <h3 className="text-3xl font-bold mt-1">
                    {profile.employability_score || profile.employabilityScore || 0}%
                  </h3>
                </div>
                <TrendingUp className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Completed Training</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {training.filter((t) => t.status === 'completed').length}
                  </h3>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Verified Skills</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {technicalSkills.filter((s) => s.verified).length}
                  </h3>
                </div>
                <Star className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Opportunities</p>
                  <h3 className="text-2xl font-bold mt-1">{opportunities.length}</h3>
                </div>
                <ExternalLink className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Education */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Education
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveModal('education')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {education
                  .filter((edu) => edu.enabled !== false)
                  .map((edu, idx) => (
                    <div key={edu.id || idx} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h4 className="font-semibold">{edu.degree}</h4>
                      <p className="text-sm text-gray-600">{edu.university}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{edu.year_of_passing || edu.yearOfPassing}</span>
                        <span>CGPA: {edu.cgpa}</span>
                        {edu.status === 'ongoing' && (
                          <Badge variant="outline" className="text-xs">
                            Ongoing
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Training */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Training & Certifications
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveModal('training')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {training
                  .filter((course) => course.enabled !== false)
                  .map((course, idx) => (
                    <div key={course.id || idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{course.course}</h4>
                        <Badge variant={course.status === 'completed' ? 'default' : 'secondary'}>
                          {course.status}
                        </Badge>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <p className="text-sm text-gray-500">{course.progress}% Complete</p>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Experience
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveModal('experience')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {experience
                  .filter((exp) => exp.enabled !== false)
                  .map((exp, idx) => (
                    <div key={exp.id || idx} className="border-l-4 border-green-500 pl-4 py-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{exp.role}</h4>
                        {exp.verified && (
                          <Badge variant="outline" className="text-xs">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{exp.organization}</p>
                      <p className="text-sm text-gray-500 mt-1">{exp.duration}</p>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Technical Skills</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal('technicalSkills')}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {technicalSkills
                    .filter((skill) => skill.enabled !== false)
                    .map((skill, idx) => (
                      <Badge
                        key={skill.id || idx}
                        variant="secondary"
                        className="text-sm px-3 py-1"
                      >
                        {skill.icon} {skill.name}
                        <span className="ml-2 text-yellow-500">{'★'.repeat(skill.level)}</span>
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Updates
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentUpdates.slice(0, 5).map((update, idx) => (
                  <div key={update.id || idx} className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                    <p className="text-gray-700">{update.message}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {update.timestamp || new Date(update.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
             */}

            {/* Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={suggestion.id || idx}
                    className="text-sm p-2 bg-yellow-50 border-l-2 border-yellow-500 rounded"
                  >
                    {suggestion.message}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {opportunities.slice(0, 3).map((opp, idx) => (
                  <div
                    key={opp.id || idx}
                    className="border rounded p-3 hover:shadow-md transition-shadow"
                  >
                    <h5 className="font-semibold text-sm">{opp.title}</h5>
                    <p className="text-xs text-gray-600">{opp.company}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {opp.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Due: {new Date(opp.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'education' && (
        <EducationEditModal
          data={education}
          onSave={(data) => handleSave('education', data)}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'training' && (
        <TrainingEditModal
          data={training}
          onSave={(data) => handleSave('training', data)}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'experience' && (
        <ExperienceEditModal
          data={experience}
          onSave={(data) => handleSave('experience', data)}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'technicalSkills' && (
        <SkillsEditModal
          data={{ technicalSkills, softSkills }}
          onSave={(data) => {
            handleSave('technicalSkills', data.technicalSkills);
            handleSave('softSkills', data.softSkills);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default DashboardWithSupabase;
