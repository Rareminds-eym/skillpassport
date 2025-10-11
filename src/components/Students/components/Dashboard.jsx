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
  Database
} from 'lucide-react';
import { 
  recentUpdates as mockRecentUpdates, 
  suggestions as mockSuggestions, 
  educationData as mockEducationData, 
  trainingData as mockTrainingData, 
  experienceData as mockExperienceData, 
  technicalSkills as mockTechnicalSkills, 
  softSkills as mockSoftSkills, 
  opportunities as mockOpportunities,
  studentData as mockStudentData
} from '../data/mockData';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal
} from './ProfileEditModals';
import { useStudentDataByEmail } from '../../../hooks/useStudentDataByEmail';
import { useAuth } from '../../../context/AuthContext';

const Dashboard = () => {
  const [activeModal, setActiveModal] = useState(null);

  // Get email from your custom auth
  const { user } = useAuth();
  const userEmail = user?.email;

  // Fetch student data by EMAIL (from real Supabase table)
  const {
    studentData,
    loading,
    error,
    refresh
  } = useStudentDataByEmail(userEmail, true); // true = fallback to mock data

  // Extract data with fallback to mock
  const profile = studentData?.profile || mockStudentData;
  const education = studentData?.education || mockEducationData;
  const training = studentData?.training || mockTrainingData;
  const experience = studentData?.experience || mockExperienceData;
  const technicalSkills = studentData?.technicalSkills || mockTechnicalSkills;
  const softSkills = studentData?.softSkills || mockSoftSkills;
  const recentUpdates = studentData?.recentUpdates || mockRecentUpdates;
  const suggestions = studentData?.suggestions || mockSuggestions;
  const opportunities = studentData?.opportunities || mockOpportunities;

  const [userData, setUserData] = useState({
    education: education,
    training: training,
    experience: experience,
    technicalSkills: technicalSkills,
    softSkills: softSkills
  });

  // Update local state when Supabase data changes
  React.useEffect(() => {
    setUserData({
      education: education,
      training: training,
      experience: experience,
      technicalSkills: technicalSkills,
      softSkills: softSkills
    });
  }, [studentData]);

  const handleSave = async (section, data) => {
    setUserData(prev => ({
      ...prev,
      [section]: data
    }));
    
    // If connected to Supabase, save to database
    if (currentUserId && studentData?.profile) {
      try {
        // Save each item that has an id
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.id) {
              switch (section) {
                case 'education':
                  await updateEducation(item.id, item);
                  break;
                case 'training':
                  await updateTraining(item.id, item);
                  break;
                case 'experience':
                  await updateExperience(item.id, item);
                  break;
                case 'technicalSkills':
                  await updateTechnicalSkill(item.id, item);
                  break;
                case 'softSkills':
                  await updateSoftSkill(item.id, item);
                  break;
              }
            }
          }
        }
        refresh(); // Refresh data after save
      } catch (err) {
        console.error('Error saving to Supabase:', err);
      }
    }
  };

  const renderStars = (level) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < level ? 'fill-[#FFD700] text-[#FFD700]' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Connection Status Banner */}
        <div className="mb-6">
          {loading ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Loading data from Supabase...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm font-medium text-red-700">Using Mock Data (Supabase connection error)</span>
              </div>
              <p className="text-xs text-red-600 ml-5">{error}</p>
            </div>
          ) : studentData && studentData.profile ? (
            // 🟢 CONNECTED STATE - Has real data
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Connected to Supabase ✓ (Real Data: {profile.name})
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refresh}
                className="border-green-300 hover:bg-green-100"
              >
                Refresh
              </Button>
            </div>
          ) : (
            // 🟡 MOCK DATA STATE
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm font-medium text-yellow-700">
                  Using Mock Data - Login with email: {userEmail || 'chinnuu116@gmail.com'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - User Activity & Updates */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-20">
            
            {/* Recent Updates */}
            <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Bell className="w-5 h-5" />
                  Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentUpdates.map((update, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg border-l-2 border-l-blue-400">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{update.message}</p>
                      <p className="text-xs text-blue-600 font-medium">{update.timestamp}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <TrendingUp className="w-5 h-5" />
                  Suggested Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg border-l-2 border-l-amber-500 hover:shadow-sm transition-shadow">
                    <p className="text-sm font-medium text-amber-900">{suggestion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - 6 Key Boxes */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. My Education - Multiple Entries */}
              <Card className="h-full border-t-4 border-t-emerald-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardTitle className="flex items-center justify-between text-emerald-700">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      My Education
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        {userData.education.length} Qualifications
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveModal('education')}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 p-1"
                      title="Edit Education"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-80 overflow-y-auto">
                  {userData.education.map((education, index) => (
                    <div key={education.id} className={`p-4 rounded-lg border-l-4 ${
                      education.status === 'ongoing' 
                        ? 'border-l-blue-500 bg-blue-50' 
                        : education.level === 'Bachelor\'s' 
                          ? 'border-l-emerald-500 bg-emerald-50'
                          : education.level === 'Certificate'
                            ? 'border-l-amber-500 bg-amber-50'
                            : 'border-l-gray-500 bg-gray-50'
                    } hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-sm">{education.degree}</h4>
                          <p className="text-sm text-gray-600 font-medium">{education.university}</p>
                        </div>
                        <Badge className={`${
                          education.status === 'ongoing' 
                            ? 'bg-blue-500 hover:bg-blue-500' 
                            : 'bg-emerald-500 hover:bg-emerald-500'
                        } text-white text-xs`}>
                          {education.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div key={`level-${education.id}`}>
                          <p className="text-gray-500 font-medium">Level</p>
                          <p className="font-semibold text-gray-700">{education.level}</p>
                        </div>
                        <div key={`year-${education.id}`}>
                          <p className="text-gray-500 font-medium">Year</p>
                          <p className="font-semibold text-gray-700">{education.yearOfPassing}</p>
                        </div>
                        <div key={`grade-${education.id}`}>
                          <p className="text-gray-500 font-medium">Grade</p>
                          <p className="font-semibold text-gray-700">{education.cgpa}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveModal('education')}
                      className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Manage Education
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 2. My Training */}
              <Card className="h-full border-t-4 border-t-purple-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
                  <CardTitle className="flex items-center justify-between text-purple-700">
                    <div className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      My Training
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveModal('training')}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 p-1"
                      title="Edit Training"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userData.training.slice(0, 2).map((training, index) => (
                    <div key={index} className="space-y-3 p-3 bg-gradient-to-r from-purple-50 to-white rounded-lg border-l-2 border-l-purple-400">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-gray-800">{training.course}</p>
                        <Badge className={training.status === 'completed' 
                          ? 'bg-emerald-500 hover:bg-emerald-500 text-white' 
                          : 'bg-blue-500 hover:bg-blue-500 text-white'}>
                          {training.status}
                        </Badge>
                      </div>
                      <Progress value={training.progress} className="h-3 bg-purple-100" />
                      <p className="text-xs text-purple-700 font-medium">{training.progress}% Complete</p>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveModal('training')}
                    className="w-full border-purple-500 text-purple-700 hover:bg-purple-50 font-medium"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Training
                  </Button>
                </CardContent>
              </Card>

              {/* 3. My Experience */}
              <Card className="h-full border-t-4 border-t-indigo-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                  <CardTitle className="flex items-center justify-between text-indigo-700">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      My Experience
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveModal('experience')}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 p-1"
                      title="Edit Experience"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userData.experience.slice(0, 2).map((exp, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-indigo-50 to-white rounded-lg border-l-4 border-l-indigo-400 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-800">{exp.role}</p>
                          <p className="text-sm text-indigo-600 font-medium">{exp.organization}</p>
                          <p className="text-xs text-gray-600 mt-1">{exp.duration}</p>
                        </div>
                        {exp.verified && (
                          <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 4. Opportunities */}
              <Card variant="orange" className="h-full border-t-4 border-t-rose-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50">
                  <CardTitle className="flex items-center gap-2 text-rose-700">
                    <ExternalLink className="w-5 h-5" />
                    Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {opportunities.slice(0, 2).map((opp, index) => (
                    <div key={index} className="p-4 border-2 border-rose-100 bg-gradient-to-r from-rose-50 to-white rounded-lg hover:border-rose-200 transition-colors">
                      <h4 className="font-semibold text-sm text-gray-800">{opp.title}</h4>
                      <p className="text-sm text-rose-600 font-medium mb-2">{opp.company}</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">{opp.type}</Badge>
                        <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white font-medium">
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 5. My Soft Skills */}
              <Card className="h-full border-t-4 border-t-teal-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <CardTitle className="flex items-center gap-2 text-teal-700">
                    <MessageCircle className="w-5 h-5" />
                    My Soft Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-gradient-to-r from-teal-50 to-white rounded-lg border-l-2 border-l-teal-400">
                    <p className="text-sm font-semibold mb-3 text-teal-700">Languages</p>
                    {softSkills.filter(skill => skill.type === 'language').map((skill, index) => (
                      <div key={index} className="flex items-center justify-between mb-2 p-2 bg-white rounded border border-teal-100">
                        <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                        <div className="flex">
                          {renderStars(skill.level)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-gradient-to-r from-cyan-50 to-white rounded-lg border-l-2 border-l-cyan-400">
                    <p className="text-sm font-semibold mb-3 text-cyan-700">Communication</p>
                    {softSkills.filter(skill => skill.type === 'communication').map((skill, index) => (
                      <div key={index} className="flex items-center justify-between mb-2 p-2 bg-white rounded border border-cyan-100">
                        <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                        <div className="flex">
                          {renderStars(skill.level)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 6. My Technical Skills */}
              <Card className="h-full border-t-4 border-t-slate-500 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
                  <CardTitle className="flex items-center gap-2 text-slate-700">
                    <Code className="w-5 h-5" />
                    My Skills (Technical)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {technicalSkills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border-l-2 border-l-slate-400 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{skill.icon}</span>
                        <div>
                          <span className="text-sm font-semibold text-gray-800">{skill.name}</span>
                          {skill.verified && (
                            <Badge className="ml-2 bg-emerald-500 hover:bg-emerald-500 text-white text-xs px-2 py-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex">
                        {renderStars(skill.level)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;