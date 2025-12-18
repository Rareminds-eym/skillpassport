import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Database,
  Share,
  ChevronDown,
  ChevronUp
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
} from '../data/mockData'; // Removed mock data imports
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal
} from './ProfileEditModals';
import { useStudentDataByEmail } from '../../../hooks/useStudentDataByEmail';
import { useAuth } from '../../../context/AuthContext';
import { useStudentRealtimeActivities } from '../../../hooks/useStudentRealtimeActivities';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [activeNavItem, setActiveNavItem] = useState('skills'); // Default to skills
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  // Get student ID and email from your custom auth
  const { user } = useAuth();
  const userEmail = user?.email;

  // Fetch student data by EMAIL (from real Supabase table)
  const {
    studentData,
    loading,
    error,
    refresh,
    updateEducation,
    updateTraining,
    updateExperience,
    updateTechnicalSkills,
    updateSoftSkills
  } = useStudentDataByEmail(userEmail, false); // no fallback to mock data

  // Fetch real-time student activities (replaces mock recentUpdates)
  const { 
    activities: recentActivities, 
    isLoading: activitiesLoading,
    isError: activitiesError
  } = useStudentRealtimeActivities(userEmail, 10);

  // Extract data with fallback to mock data
  const profile = studentData?.profile;
  const education = studentData?.education || mockEducationData;
  const training = studentData?.training || mockTrainingData;
  const experience = studentData?.experience || mockExperienceData;
  const technicalSkills = studentData?.technicalSkills || mockTechnicalSkills;
  const softSkills = studentData?.softSkills || mockSoftSkills;
  
  // Use real activities instead of mock data
  const recentUpdates = recentActivities.length > 0 ? recentActivities : mockRecentUpdates;
  
  const suggestions = studentData?.suggestions || mockSuggestions;
  const opportunities = studentData?.opportunities || mockOpportunities;

  const [userData, setUserData] = useState({
    education: education || mockEducationData,
    training: training || mockTrainingData,
    experience: experience || mockExperienceData,
    technicalSkills: technicalSkills || mockTechnicalSkills,
    softSkills: softSkills || mockSoftSkills
  });

  // Update local state when Supabase data changess
  React.useEffect(() => {
    setUserData({
      education: education || mockEducationData,
      training: training || mockTrainingData,
      experience: experience || mockExperienceData,
      technicalSkills: technicalSkills || mockTechnicalSkills,
      softSkills: softSkills || mockSoftSkills
    });
  }, [studentData, education, training, experience, technicalSkills, softSkills]);

  const handleSave = async (section, data) => {
    setUserData(prev => ({
      ...prev,
      [section]: data
    }));
    
    // If connected to Supabase, save to database
    if (userEmail && studentData?.profile) {
      try {
        
        let result;
        switch (section) {
          case 'education':
            result = await updateEducation(data);
            break;
          case 'training':
            result = await updateTraining(data);
            break;
          case 'experience':
            result = await updateExperience(data);
            break;
          case 'technicalSkills':
            result = await updateTechnicalSkills(data);
            break;
          case 'softSkills':
            result = await updateSoftSkills(data);
            break;
          default:
            return;
        }

        if (result.success) {
        } else {
          console.error(`❌ Error saving ${section}:`, result.error);
        }
      } catch (err) {
        console.error(`❌ Error saving ${section} to Supabase:`, err);
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

  // Function to render cards in the correct order based on active navigation
  const renderCardsByPriority = () => {
    const allCards = {
      education: (
        <Card key="education" className="h-full border-t-4 border-t-emerald-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="flex items-center justify-between text-emerald-700">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                My Education
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {userData.education?.filter(education => education.enabled !== false).length || 0} Qualifications
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveModal('education')}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 p-1"
                  title="Edit Education"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-80 overflow-y-auto">
            {userData.education?.filter(education => education.enabled !== false).map((education, index) => (
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
                Manage Educa
              </Button>
            </div>
          </CardContent>
        </Card>
      ),
      training: (
        <Card key="training" className="h-full shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-[#5378f1]/10 to-[#5378f1]/20 cursor-pointer" onClick={() => navigate('/student/my-learning')}>
          <CardHeader className="bg-gradient-to-r from-[#5378f1]/20 to-[#5378f1]/30 border-b border-[#5378f1]/30">
            <CardTitle className="flex items-center justify-between text-[#5378f1]">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                My Training
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal('training');
                  }}
                  className="text-[#5378f1] hover:text-[#4267d9] hover:bg-[#5378f1]/20 p-1"
                  title="Edit Training"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#5378f1] hover:text-[#4267d9] hover:bg-[#5378f1]/20 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/student/my-learning');
                  }}
                >
                  View All →
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 bg-gradient-to-br from-[#5378f1]/5 to-[#5378f1]/10">
            {userData.training?.filter(training => training.enabled !== false).slice(0, 2).map((training, index) => (
              <div key={index} className="space-y-3 p-4 bg-gradient-to-br from-[#5378f1]/20 to-[#5378f1]/30 rounded-lg border border-[#5378f1]/40 shadow-sm">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-semibold text-[#5378f1]">{training.course}</p>
                  <Badge className={training.status === 'completed' 
                    ? 'bg-emerald-500 hover:bg-emerald-500 text-white' 
                    : 'bg-[#5378f1] hover:bg-[#4267d9] text-white'}>
                    {training.status}
                  </Badge>
                </div>
                <Progress value={training.progress} className="h-3 bg-[#5378f1]/30" />
                <p className="text-xs text-[#5378f1] font-medium">{training.progress}% Complete</p>
              </div>
            ))}
            <Button 
              variant="outline" 
              onClick={() => setActiveModal('training')}
              className="w-full border-[#5378f1] text-[#5378f1] hover:bg-[#5378f1]/10 hover:border-[#4267d9] font-medium bg-white/50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Training
            </Button>
          </CardContent>
        </Card>
      ),
      experience: (
        <Card key="experience" className="h-full border-t-4 border-t-indigo-500 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/student/my-experience')}>
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardTitle className="flex items-center justify-between text-indigo-700">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                My Experience
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal('experience');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 p-1"
                  title="Edit Experience"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/student/my-experience');
                  }}
                >
                  View All →
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userData.experience?.filter(exp => exp.enabled !== false).slice(0, 2).map((exp, index) => (
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
      ),
      opportunities: (
  <Card key="opportunities" variant="orange" className="h-full border-2 border-[#FFB800] rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/student/opportunities')}>
          <CardHeader className="bg-white">
            <CardTitle className="flex items-center justify-between text-gray-900">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-[#FFB800]" />
                Opportunities
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#FFB800] hover:text-[#E5A600] hover:bg-orange-50 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/student/opportunities');
                }}
              >
                View All →
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {opportunities?.slice(0, 2).map((opp, index) => (
              <div key={index} className="p-4 border-2 border-[#FFB800] bg-white rounded-lg hover:shadow-md transition-all">
                <h4 className="font-semibold text-sm text-gray-800">{opp.title}</h4>
                <p className="text-sm text-[#FFB800] font-medium mb-2">{opp.company}</p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{opp.type}</Badge>
                  <Button size="sm" className="bg-blue- hover:bg-[#E5A600] text-black font-medium">
                    Apply Now
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ),
      softSkills: (
        <Card key="softSkills" className="h-full border-t-4 border-t-teal-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-teal-700">
              <MessageCircle className="w-5 h-5" />
              My Soft Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-gradient-to-r from-teal-50 to-white rounded-lg border-l-2 border-l-teal-400">
              <p className="text-sm font-semibold mb-3 text-teal-700">Languages</p>
              {softSkills?.filter(skill => skill.type === 'language' && skill.enabled !== false).map((skill, index) => (
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
              {softSkills?.filter(skill => skill.type === 'communication' && skill.enabled !== false).map((skill, index) => (
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
      ),
      technicalSkills: (
        <Card key="technicalSkills" className="h-full border-t-4 border-t-slate-500 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/student/my-skills')}>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
            <CardTitle className="flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                My Skills (Technical)
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-700 hover:bg-slate-100 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/student/my-skills');
                }}
              >
                View All →
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {technicalSkills?.filter(skill => skill.enabled !== false).map((skill, index) => (
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
      ),
      passport: (
        <Card key="passport" className="h-full border-t-4 border-t-yellow-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Share className="w-5 h-5" />
              Share Passport
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6">
              <div className="mb-4">
                <Share className="w-16 h-16 mx-auto text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Share Your Digital Passport</h3>
              <p className="text-sm text-gray-600 mb-4">Generate a shareable link to showcase your skills and experience</p>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium">
                <ExternalLink className="w-4 h-4 mr-2" />
                Generate Share Link
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    };

    // Define card order based on active navigation item
    const cardOrders = {
      opportunities: ['opportunities', 'education', 'training', 'experience', 'softSkills', 'technicalSkills'],
      skills: ['technicalSkills', 'softSkills', 'education', 'training', 'experience', 'opportunities'],
      training: ['training', 'education', 'technicalSkills', 'softSkills', 'experience', 'opportunities'],
      experience: ['experience', 'education', 'training', 'technicalSkills', 'softSkills', 'opportunities']
    };

    const order = cardOrders[activeNavItem] || cardOrders.opportunities;
    
    return order.map((cardKey, index) => {
      const card = allCards[cardKey];
      if (!card) return null;
      
      // Add priority indicator for the first card
      if (index === 0) {
        return React.cloneElement(card, {
          className: `${card.props.className} ring-2 ring-blue-400 ring-opacity-50`,
          key: cardKey,
          children: [
            React.cloneElement(card.props.children[0], {
              children: [
                card.props.children[0].props.children,
                <Badge key="priority" className="bg-blue-500 hover:bg-blue-500 text-white text-xs ml-2">
                  ✨ Priority
                </Badge>
              ]
            }),
            ...card.props.children.slice(1)
          ]
        });
      }
      return card;
    }).filter(Boolean);
  };

  return (
    <div className="bg-gray-50 py-4 px-6">
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
                <span className="text-sm font-medium text-red-700">No student data found for this email.</span>
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm font-medium text-yellow-700">
                  No student data found. Please check your email or contact support.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Bar (commented out)
        <div className="mb-6">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { id: 'opportunities', label: 'Opportunities', icon: ExternalLink },
                  { id: 'skills', label: 'My Skills', icon: Code },
                  { id: 'training', label: 'My Training', icon: Award },
                  { id: 'experience', label: 'My Experience', icon: Users },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNavItem === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "outline"}
                      onClick={() => {
                        setActiveNavItem(item.id);
                      }}
                      className={`flex items-center gap-2 transition-all ${
                        isActive
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md transform scale-105'
                          : 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - User Activity & Updates */}
          {/* 
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-20">
            
            {/* Recent Updates *}
            <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Bell className="w-5 h-5" />
                  Recent Updates
                  {recentActivities.length > 0 && (
                    <Badge className="bg-blue-500 text-white text-xs ml-2">
                      {recentActivities.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activitiesLoading && recentActivities.length === 0 ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">Loading activities...</span>
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-6">
                    <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activities yet</p>
                    <p className="text-xs text-gray-400 mt-1">Recruiters' actions will appear here</p>
                  </div>
                ) : (
                  recentUpdates?.slice(0, showAllUpdates ? recentUpdates.length : 4).map((update, index) => {
                    // Format the activity message
                    const message = update.message || 
                      `${update.user} ${update.action} ${update.candidate}`;
                    const timestamp = update.timestamp;
                    
                    // Determine color based on activity type
                    const getActivityColor = (type) => {
                      switch(type) {
                        case 'shortlist_added': return 'from-yellow-50 to-white border-l-yellow-400';
                        case 'offer_extended': return 'from-green-50 to-white border-l-green-400';
                        case 'offer_accepted': return 'from-emerald-50 to-white border-l-emerald-400';
                        case 'placement_hired': return 'from-purple-50 to-white border-l-purple-400';
                        case 'stage_change': return 'from-indigo-50 to-white border-l-indigo-400';
                        case 'application_rejected': return 'from-red-50 to-white border-l-red-400';
                        default: return 'from-blue-50 to-white border-l-blue-400';
                      }
                    };
                    
                    return (
                      <div 
                        key={update.id || index} 
                        className={`p-3 bg-gradient-to-r ${getActivityColor(update.type)} rounded-lg border-l-2 hover:shadow-sm transition-shadow`}
                      >
                        <p className="text-sm text-gray-900 font-medium">
                          {update.user && <span className="text-blue-700">{update.user}</span>}
                          {update.action && <span className="text-gray-600"> {update.action} </span>}
                          {update.candidate && <span className="font-semibold">{update.candidate}</span>}
                        </p>
                        {update.details && (
                          <p className="text-xs text-gray-600 mt-1">{update.details}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {typeof timestamp === 'string' && timestamp.includes('ago') 
                            ? timestamp 
                            : new Date(timestamp).toLocaleString()}
                        </p>
                      </div>
                    );
                  })
                )}
                {recentActivities.length > 4 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllUpdates(!showAllUpdates)}
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    {showAllUpdates ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        View All Updates ({recentActivities.length})
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
          */}

            {/* Suggestions */}
            <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <TrendingUp className="w-5 h-5" />
                  Suggested Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions?.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg border-l-2 border-l-amber-500 hover:shadow-sm transition-shadow">
                    <p className="text-sm font-medium text-amber-900">
                      {typeof suggestion === 'string' ? suggestion : suggestion.message}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

          {/* RIGHT COLUMN - 6 Key Boxes */}
          {/*
            When 'My Skills' is selected in the nav, the 'My Skills (Technical)'
            card will always be rendered first in the right column, followed by the rest.
            This is controlled by the cardOrders object in renderCardsByPriority().
          */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderCardsByPriority()}
            </div>
          </div>
        </div>

        {/* Edit Modals */}
        {activeModal === 'education' && (
          <EducationEditModal
            data={userData.education}
            onSave={(data) => handleSave('education', data)}
            onClose={() => setActiveModal(null)}
          />
        )}
        
        {activeModal === 'training' && (
          <TrainingEditModal
            data={userData.training}
            onSave={(data) => handleSave('training', data)}
            onClose={() => setActiveModal(null)}
          />
        )}
        
        {activeModal === 'experience' && (
          <ExperienceEditModal
            data={userData.experience}
            onSave={(data) => handleSave('experience', data)}
            onClose={() => setActiveModal(null)}
          />
        )}
        
        {activeModal === 'skills' && (
          <SkillsEditModal
            technicalSkills={userData.technicalSkills}
            softSkills={userData.softSkills}
            onSave={(technical, soft) => {
              handleSave('technicalSkills', technical);
              handleSave('softSkills', soft);
            }}
            onClose={() => setActiveModal(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;