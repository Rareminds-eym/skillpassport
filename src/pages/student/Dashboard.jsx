import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
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
  QrCode
} from 'lucide-react';
import {
  suggestions,
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills
} from '../../components/Students/data/mockData';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal
} from '../../components/Students/components/ProfileEditModals';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';
import { useOpportunities } from '../../hooks/useOpportunities';
import { useStudentRealtimeActivities } from '../../hooks/useStudentRealtimeActivities';
import { supabase } from '../../lib/supabaseClient';
// Debug utilities removed for production cleanliness

const StudentDashboard = () => {
  const location = useLocation();
  
  // Check if viewing someone else's profile (from QR scan)
  const isViewingOthersProfile = location.pathname.includes('/student/profile/');
  
  // For sticky Recent Updates: show only one when Suggested Next Steps touches it
  const [showAllRecentUpdates, setShowAllRecentUpdates] = useState(false);
  // Remove sticky when showing all
  const [recentUpdatesSticky, setRecentUpdatesSticky] = useState(true);
  const [recentUpdatesCollapsed, setRecentUpdatesCollapsed] = useState(false);

  // Intersection observer for Suggested Next Steps and Recent Updates
  const recentUpdatesRef = React.useRef(null);
  const suggestedNextStepsRef = React.useRef(null);


  useEffect(() => {
    if (!recentUpdatesRef.current || !suggestedNextStepsRef.current) return;
    const handleScroll = () => {
      const recentRect = recentUpdatesRef.current.getBoundingClientRect();
      const suggestedRect = suggestedNextStepsRef.current.getBoundingClientRect();
      // If bottom of Recent Updates is below top of Suggested Next Steps (they touch/overlap)
      if (recentRect.bottom >= suggestedRect.top) {
        setRecentUpdatesCollapsed(true);
      } else {
        setRecentUpdatesCollapsed(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // Navigation state for card ordering
  const [activeNavItem, setActiveNavItem] = useState(() => {
    // Check if coming from Header nav
    const storedNav = localStorage.getItem('dashboardActiveNav');
    return storedNav || 'opportunities';
  }); // Default to opportunities

  // Clear dashboardActiveNav after using it (so future visits default to opportunities)
  useEffect(() => {
    if (localStorage.getItem('dashboardActiveNav')) {
      localStorage.removeItem('dashboardActiveNav');
    }
  }, []);
  
  // Use authenticated student data instead of localStorage
  // Get user email from localStorage or context (customize as needed)
  const userEmail = localStorage.getItem('userEmail');

  // Use the same hook as ProfileEditSection for fetching and updating
  const {
    studentData,
    loading: authStudentLoading,
    error: authStudentError,
    refresh,
    updateProfile,
    updateEducation,
    updateTraining,
    updateExperience,
    updateTechnicalSkills,
    updateSoftSkills
  } = useStudentDataByEmail(userEmail);
  
  // Generate QR code value once and keep it constant
  const qrCodeValue = React.useMemo(() => {
    const email = userEmail || 'student';
    return `${window.location.origin}/student/profile/${email}`;
  }, [userEmail]);
  
  // Memoize studentSkills to prevent infinite re-renders
  const studentSkills = useMemo(() => {
    return studentData?.profile?.technicalSkills?.map(skill => skill.name) || [];
  }, [studentData?.profile?.technicalSkills]);
  
  // Fetch opportunities data from Supabase
  const { 
    opportunities, 
    loading: opportunitiesLoading, 
    error: opportunitiesError,
    refreshOpportunities 
  } = useOpportunities({
    fetchOnMount: true,
    activeOnly: false, // Changed to false to see all opportunities
    studentSkills: studentSkills
  });

  // Fetch recent updates data from recruitment tables (student-specific)
  const {
    activities: recentUpdates,
    isLoading: recentUpdatesLoading,
    isError: recentUpdatesError,
    refetch: refreshRecentUpdates,
    isConnected: realtimeConnected
  } = useStudentRealtimeActivities(userEmail, 10);

  // Debug log for authentication and student data
  useEffect(() => {
    console.log('👤 Dashboard: Student data state changed:', {
      studentData: studentData?.id,
      loading: authStudentLoading,
      error: authStudentError
    });
  }, [studentData, authStudentLoading, authStudentError]);

  // Debug log for opportunities
  useEffect(() => {
    console.log('🔍 Dashboard: Opportunities state changed:', {
      opportunities,
      loading: opportunitiesLoading,
      error: opportunitiesError,
      count: opportunities?.length
    });
  }, [opportunities, opportunitiesLoading, opportunitiesError]);

  // Debug log for recent updates
  useEffect(() => {
    console.log('📢 Dashboard: Recent updates state changed:', {
      recentUpdates,
      loading: recentUpdatesLoading,
      error: recentUpdatesError,
      count: recentUpdates?.length,
      userEmail
    });
  }, [recentUpdates, recentUpdatesLoading, recentUpdatesError, userEmail]);

  // Poll for new opportunities and refresh Recent Updates
  useEffect(() => {
    if (!userEmail || isViewingOthersProfile) return;

    console.log('🔔 Setting up real-time subscription for opportunities...');

    // Subscribe to real-time changes in opportunities table
    const channel = supabase
      .channel('opportunities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'opportunities'
        },
        (payload) => {
          console.log('🆕 New opportunity detected:', payload.new);
          
          // Refresh opportunities list
          refreshOpportunities();
          
          // Refresh Recent Updates to show the new opportunity
          setTimeout(() => {
            console.log('🔄 Refreshing Recent Updates after new opportunity...');
            refreshRecentUpdates();
          }, 1000); // Small delay to ensure DB trigger has fired
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'opportunities'
        },
        (payload) => {
          console.log('✏️ Opportunity updated:', payload.new);
          refreshOpportunities();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log('� Unsubscribing from opportunities changes...');
      supabase.removeChannel(channel);
    };
  }, [userEmail, isViewingOthersProfile]);

  // Direct Supabase test
  useEffect(() => {
    const testSupabaseDirectly = async () => {
      try {
        console.log('🧪 Testing Supabase connection directly...');
        console.log('🔑 Environment vars:', {
          url: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
          key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        });
        
        const { data, error, count } = await supabase
          .from('opportunities')
          .select('*', { count: 'exact' });
          
        console.log('🧪 Direct test result:', { data, error, count });
        
        // Run debug for recent updates (commented out to prevent automatic execution)
        // await debugRecentUpdates();
        console.log('ℹ️ To debug recent updates, run: await window.debugRecentUpdates() in console');
      } catch (err) {
        console.error('🧪 Direct test error:', err);
      }
    };
    
    testSupabaseDirectly();
  }, []);
  
  const [activeModal, setActiveModal] = useState(null);
  const [userData, setUserData] = useState({
    education: educationData,
    training: trainingData,
    experience: experienceData,
    technicalSkills: technicalSkills,
    softSkills: softSkills
  });
  const [showAllEducation, setShowAllEducation] = useState(false);
  const [showAllExperience, setShowAllExperience] = useState(false);
  const [showAllOpportunities, setShowAllOpportunities] = useState(false);
  const [showAllSoftSkills, setShowAllSoftSkills] = useState(false);
  const [showAllTechnicalSkills, setShowAllTechnicalSkills] = useState(false);
  const [showAllTraining, setShowAllTraining] = useState(false);

  // Update userData when real student data is loaded
  useEffect(() => {
    if (studentData) {
      setUserData({
        education: Array.isArray(studentData.education) ? studentData.education : [],
        training: Array.isArray(studentData.training) ? studentData.training : [],
        experience: Array.isArray(studentData.experience) ? studentData.experience : [],
        technicalSkills: Array.isArray(studentData.technicalSkills) ? studentData.technicalSkills : [],
        softSkills: Array.isArray(studentData.softSkills) ? studentData.softSkills : [],
      });
    }
  }, [studentData]);

  // Save handler with DB update logic (like ProfileEditSection)
  const handleSave = async (section, data) => {
    // Immediately update UI
    setUserData(prev => ({
      ...prev,
      [section]: data
    }));

    // Save to Supabase if studentData exists
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
          case 'personalInfo':
            result = await updateProfile(data);
            break;
          default:
            return;
        }
        if (result?.success) {
          // Refresh from database to ensure sync
          await refresh();
          
          // Refresh Recent Updates to show the new activity
          console.log('🔄 Refreshing Recent Updates after save...');
          refreshRecentUpdates();
        }
      } catch (err) {
        console.error('Error saving:', err);
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

  // Card components for dynamic ordering
  const allCards = {
    opportunities: (
      <Card key="opportunities" className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Opportunities</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {(() => {
            console.log('🎭 Rendering opportunities with:', {
              loading: opportunitiesLoading,
              error: opportunitiesError,
              opportunities,
              count: opportunities?.length
            });
            return null;
          })()}
          {opportunitiesLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : opportunitiesError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-3 font-medium">Failed to load opportunities</p>
              <Button 
                onClick={refreshOpportunities}
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
              >
                Retry
              </Button>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 font-medium">No opportunities available at the moment</p>
            </div>
          ) : (
            (showAllOpportunities ? opportunities : opportunities.slice(0,2)).map((opp, idx) => (
              <div key={opp.id || `${opp.title}-${opp.company_name}-${idx}`} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all">
                <h4 className="font-semibold text-gray-900 text-base mb-1">{opp.title}</h4>
                <p className="text-blue-600 text-sm font-medium mb-3">{opp.company_name}</p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs font-medium px-3 py-1">{opp.employment_type}</Badge>
                  {opp.application_link ? (
                    <a 
                      href={opp.application_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors">
                        Apply Now
                      </Button>
                    </a>
                  ) : (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors">
                      Apply Now
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          {opportunities.length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllOpportunities((v) => !v)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
            >
              {showAllOpportunities ? 'Show Less' : `View All Opportunities (${opportunities.length})`}
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    technicalSkills: (
      <Card key="technicalSkills" className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Code className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Technical Skills</span>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Edit Technical Skills"
              onClick={() => setActiveModal('technicalSkills')}
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {(showAllTechnicalSkills ? userData.technicalSkills.filter(skill => skill.enabled !== false) : userData.technicalSkills.filter(skill => skill.enabled !== false).slice(0,2)).map((skill, idx) => (
            <div key={skill.id || `tech-skill-${idx}`} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <div key={`tech-skill-info-${skill.id}`}> 
                  <h4 className="font-semibold text-gray-900 text-base mb-1">{skill.name}</h4>
                  <p className="text-xs text-gray-600 font-medium">{skill.category}</p>
                </div>
                <div key={`tech-skill-stars-${skill.id}`} className="flex gap-1">
                  {renderStars(skill.level)}
                </div>
              </div>
            </div>
          ))}
          {userData.technicalSkills.filter(skill => skill.enabled !== false).length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllTechnicalSkills((v) => !v)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
            >
              {showAllTechnicalSkills ? 'Show Less' : 'View All Technical Skills'}
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    education: (
      <Card key="education" className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">My Education</span>
              <Badge className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-xs font-medium ml-2">
                {userData.education.filter(education => education.enabled !== false).length}
              </Badge>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Edit Education"
              onClick={() => setActiveModal('education')}
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {(showAllEducation ? userData.education.filter(education => education.enabled !== false) : userData.education.filter(education => education.enabled !== false).slice(0,2)).map((education, idx) => (
            <div key={education.id || `edu-${idx}`} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 text-base mb-0.5">{education.degree || 'N/A'}</h4>
                  <p className="text-gray-600 text-sm">{education.university || 'N/A'}</p>
                </div>
                <Badge className={`px-2.5 py-1 text-xs font-medium rounded-md ${education.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{education.status || 'N/A'}</Badge>
              </div>
              <div className="flex gap-6 text-xs">
                <div key={`edu-level-${education.id}`}>
                  <p className="text-gray-500 mb-0.5">Level</p>
                  <p className="font-medium text-gray-900">{education.level || 'N/A'}</p>
                </div>
                <div key={`edu-year-${education.id}`}>
                  <p className="text-gray-500 mb-0.5">Year</p>
                  <p className="font-medium text-gray-900">{education.yearOfPassing || 'N/A'}</p>
                </div>
                <div key={`edu-grade-${education.id}`}>
                  <p className="text-gray-500 mb-0.5">Grade</p>
                  <p className="font-medium text-gray-900">{education.cgpa || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
          {userData.education.filter(education => education.enabled !== false).length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllEducation((v) => !v)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
            >
              {showAllEducation ? 'Show Less' : 'View All Qualifications'}
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    training: (
      <Card key="training" className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Code className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">My Training</span>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Edit Training"
              onClick={() => setActiveModal('training')}
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {(showAllTraining ? userData.training.filter(training => training.enabled !== false) : userData.training.filter(training => training.enabled !== false).slice(0,2)).map((training, idx) => (
            <div key={training.id || `training-${training.course}-${idx}`} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900 text-base">{training.course}</span>
                <Badge className={`px-2.5 py-1 text-xs font-medium rounded-md ${training.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{training.status}</Badge>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div className="h-2 bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${training.progress}%` }} />
              </div>
              <span className="text-xs text-gray-600 font-medium">{training.progress}% Complete</span>
            </div>
          ))}
          {userData.training.filter(training => training.enabled !== false).length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllTraining((v) => !v)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
            >
              {showAllTraining ? 'Show Less' : 'View All Courses'}
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    experience: (
      <Card key="experience" className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">My Experience</span>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Edit Experience"
              onClick={() => setActiveModal('experience')}
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {(showAllExperience ? userData.experience.filter(exp => exp.enabled !== false) : userData.experience.filter(exp => exp.enabled !== false).slice(0,2)).map((exp, idx) => (
            <div key={exp.id || `${exp.role}-${exp.organization}-${idx}`} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-base mb-1">{exp.role}</p>
                  <p className="text-blue-600 text-sm font-medium mb-1">{exp.organization}</p>
                  <p className="text-xs text-gray-600">{exp.duration}</p>
                </div>
                {exp.verified && (
                  <Badge className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {userData.experience.filter(exp => exp.enabled !== false).length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllExperience((v) => !v)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
            >
              {showAllExperience ? 'Show Less' : 'View All Experience'}
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    softSkills: (
      <Card key="softSkills" className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md">
        <CardHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center w-full justify-between">
            <CardTitle className="flex items-center gap-3 m-0 p-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">My Soft Skills</span>
            </CardTitle>
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Edit Soft Skills"
              onClick={() => setActiveModal('softSkills')}
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {(showAllSoftSkills ? userData.softSkills.filter(skill => skill.enabled !== false) : userData.softSkills.filter(skill => skill.enabled !== false).slice(0,2)).map((skill, idx) => (
            <div key={skill.id || `soft-skill-${idx}`} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-white hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <div key={`skill-info-${skill.id}`}>
                  <h4 className="font-semibold text-gray-900 text-base mb-1">{skill.name}</h4>
                  <p className="text-xs text-gray-600">{skill.description}</p>
                </div>
                <div key={`skill-stars-${skill.id}`} className="flex gap-1">
                  {renderStars(skill.level)}
                </div>
              </div>
            </div>
          ))}
          {userData.softSkills.filter(skill => skill.enabled !== false).length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllSoftSkills((v) => !v)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
            >
              {showAllSoftSkills ? 'Show Less' : 'View All Soft Skills'}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  };

  // Define card order based on active navigation item
  const cardOrders = {
    opportunities: isViewingOthersProfile 
      ? ['opportunities', 'education', 'training', 'experience', 'softSkills', 'technicalSkills'] 
      : ['opportunities', 'education', 'training', 'experience', 'softSkills', 'technicalSkills'],
    skills: ['opportunities', 'technicalSkills', 'softSkills', 'education', 'training', 'experience'],
    training: ['opportunities', 'training', 'education', 'technicalSkills', 'softSkills', 'experience'],
    experience: ['opportunities', 'experience', 'education', 'training', 'technicalSkills', 'softSkills']
  };

  const renderCardsByPriority = () => {
    const order = cardOrders[activeNavItem] || cardOrders.opportunities;
    console.log('Active nav item:', activeNavItem);
    console.log('Card order:', order);
    
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
                // <Badge key="priority" className="bg-blue-500 hover:bg-blue-500 text-white text-xs ml-2">
                //   ✨ Priority
                // </Badge>
              ]
            }),
            ...card.props.children.slice(1)
          ]
        });
      }
      return card;
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Bar */}
        {/* <div className="mb-6">
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
                        console.log('Clicked nav item:', item.id);
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
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN - User Activity & Updates - Only show for own profile */}
          {!isViewingOthersProfile && (
            <div className="lg:col-span-1 space-y-6">

              {/* Sticky container for both cards */}
              <div className="sticky top-20 z-30 flex flex-col gap-6">
                {/* Recent Updates */}
                <div
                  ref={recentUpdatesRef}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm"
                >
                  <CardHeader className="px-6 py-4 border-b border-gray-100">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-lg font-semibold text-gray-900">Recent Updates</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {recentUpdatesLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : recentUpdatesError ? (
                      <div className="text-center py-8">
                        <p className="text-red-600 mb-3 font-medium">Failed to load recent updates</p>
                        <Button 
                          onClick={refreshRecentUpdates}
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : recentUpdates.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 font-medium">No recent updates available</p>
                      </div>
                    ) : (
                      <>
                        <div 
                          className={`space-y-2 ${showAllRecentUpdates ? 'max-h-96 overflow-y-auto pr-2 scroll-smooth recent-updates-scroll' : ''}`}
                        >
                          {(showAllRecentUpdates 
                            ? recentUpdates
                            : recentUpdates.slice(0, 5)
                          ).map((update, idx) => {
                            // Format the message from activity structure
                            const message = update.message || 
                              `${update.user} ${update.action} ${update.candidate}`;
                            
                            // Determine color based on activity type
                            const getActivityColor = (type) => {
                              switch(type) {
                                case 'shortlist_added': return 'bg-yellow-50 border-yellow-300';
                                case 'offer_extended': return 'bg-green-50 border-green-300';
                                case 'offer_accepted': return 'bg-emerald-50 border-emerald-300';
                                case 'placement_hired': return 'bg-purple-50 border-purple-300';
                                case 'stage_change': return 'bg-indigo-50 border-indigo-300';
                                case 'application_rejected': return 'bg-red-50 border-red-300';
                                default: return 'bg-gray-50 border-gray-200';
                              }
                            };
                            
                            return (
                              <div 
                                key={update.id || `update-${update.timestamp}-${idx}`} 
                                className={`p-3 rounded-lg border hover:shadow-sm transition-all flex items-start gap-3 ${getActivityColor(update.type)}`}
                              >
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 mb-0.5">
                                    {update.user && <span className="text-blue-700">{update.user}</span>}
                                    {update.action && <span className="text-gray-700"> {update.action} </span>}
                                    {update.candidate && <span className="font-semibold">{update.candidate}</span>}
                                    {update.message && <span className="text-gray-700">{update.message}</span>}
                                  </p>
                                  {update.details && (
                                    <p className="text-xs text-gray-600 mb-1">{update.details}</p>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    {typeof update.timestamp === 'string' && update.timestamp.includes('ago') 
                                      ? update.timestamp 
                                      : new Date(update.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {recentUpdates.length > 5 && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
                              onClick={() => setShowAllRecentUpdates(!showAllRecentUpdates)}
                            >
                              {showAllRecentUpdates ? 'See Less' : 'See More'}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </div>

                {/* Suggested Next Steps */}
                <Card
                  ref={suggestedNextStepsRef}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm"
                >
                  <CardHeader className="px-6 py-4 border-b border-gray-100">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="text-lg font-semibold text-gray-900">Suggested Next Steps</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-2">
                    {suggestions.map((suggestion, idx) => (
                      <div key={suggestion.id || `suggestion-${idx}`} className="p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all">
                        <p className="text-sm font-medium text-gray-900">
                          {typeof suggestion === 'string' ? suggestion : suggestion.message || suggestion}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Student QR Code */}
                {/* {userEmail && (
                  <Card className="border-2 border-purple-500 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-white text-lg font-bold justify-center">
                        <QrCode className="w-5 h-5" />
                        Your QR Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6 px-6">
                      <div className="bg-white p-6 rounded-2xl shadow-xl">
                        <QRCodeSVG
                          value={qrCodeValue}
                          size={180}
                          level="H"
                          includeMargin={true}
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>
                      <div className="mt-6 text-center">
                        <p className="text-white text-lg font-bold tracking-wide">
                          PASSPORT-ID: {
                            studentData?.passport_id || 
                            (studentData?.id ? studentData.id.toUpperCase().slice(0, 8) : null) || 
                            (userEmail ? userEmail.split('@')[0].toUpperCase().slice(0, 5) : 'STUDENT')
                          }
                        </p>
                        <p className="text-white/80 text-sm mt-2">
                          Scan to view your profile card
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )} */}
              </div>
            </div>
          )}

          {/* RIGHT COLUMN - 6 Key Boxes with Dynamic Ordering */}
          <div className={isViewingOthersProfile ? "lg:col-span-3" : "lg:col-span-2"}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderCardsByPriority()}
            </div>
          </div>
        </div>
      </div>

      {/* Modals for editing sections */}
      {activeModal === 'education' && (
        <EducationEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.education}
          onSave={(data) => handleSave('education', data)}
        />
      )}

      {activeModal === 'training' && (
        <TrainingEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.training}
          onSave={(data) => handleSave('training', data)}
        />
      )}

      {activeModal === 'experience' && (
        <ExperienceEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.experience}
          onSave={(data) => handleSave('experience', data)}
        />
      )}

      {activeModal === 'softSkills' && (
        <SkillsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.softSkills}
          onSave={(data) => handleSave('softSkills', data)}
          title="Edit Soft Skills"
        />
      )}

      {activeModal === 'technicalSkills' && (
        <SkillsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={userData.technicalSkills}
          onSave={(data) => handleSave('technicalSkills', data)}
          title="Edit Technical Skills"
        />
      )}
    </div>
  );
};


export default StudentDashboard;
