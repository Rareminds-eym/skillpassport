import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import { Progress } from '../../components/Students/components/ui/progress';
import { QRCodeSVG } from 'qrcode.react';
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
  recentUpdates,
  suggestions,
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills,
  opportunities
} from '../../components/Students/data/mockData';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal
} from '../../components/Students/components/ProfileEditModals';
import { useStudentDataByEmail } from '../../hooks/useStudentDataByEmail';

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
  
  // Get logged-in user's email from localStorage
  const userEmail = localStorage.getItem('userEmail');
  
  // Generate QR code value once and keep it constant
  const qrCodeValue = React.useMemo(() => {
    const email = userEmail || 'student';
    return `${window.location.origin}/student/profile/${email}`;
  }, [userEmail]);
  
  // Fetch real student data
  const { studentData, loading, error } = useStudentDataByEmail(userEmail);
  
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

  // Update userData when real student data is loaded
  useEffect(() => {
    if (studentData) {
      console.log('📊 Using real student data:', studentData.name);
      setUserData({
        education: studentData.education || educationData,
        training: studentData.training || trainingData,
        experience: studentData.experience || experienceData,
        technicalSkills: studentData.technicalSkills || technicalSkills,
        softSkills: studentData.softSkills || softSkills
      });
    }
  }, [studentData]);

  const handleSave = (section, data) => {
    setUserData(prev => ({
      ...prev,
      [section]: data
    }));
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
      <Card key="opportunities" className="h-full border-2 border-[#FFB800] rounded-2xl shadow-none bg-white">
        <CardHeader className="bg-white rounded-t-2xl border-b-0">
          <CardTitle className="flex items-center gap-2 text-black text-lg font-bold">
            <ExternalLink className="w-5 h-5 text-[#FFB800]" />
            Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-0">
          {(showAllOpportunities ? opportunities : opportunities.slice(0,2)).map((opp, idx) => (
            <div key={opp.id || `${opp.title}-${opp.company}-${idx}`} className="bg-white rounded-xl border border-[#FFB800] px-5 py-4 mb-2 flex flex-col gap-2" style={{boxShadow:'none'}}>
              <h4 className="font-bold text-gray-900 text-base mb-1">{opp.title}</h4>
              <p className="text-[#FFB800] text-base font-semibold mb-3">{opp.company}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-lg text-xs font-semibold shadow-none">{opp.type}</span>
                <Button size="sm" className="bg-[#FFB800] hover:bg-[#FFD54F] text-black font-semibold px-6 py-2 rounded-lg shadow-md transition-all" style={{boxShadow:'0 2px 6px 0 #f7e7b0'}}>
                  Apply Now
                </Button>
              </div>
            </div>
          ))}
          {opportunities.length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllOpportunities((v) => !v)}
              className="w-full border-2 border-[#FFB800] text-[#FFB800] hover:bg-yellow-50 font-semibold rounded-lg mt-2"
            >
              {showAllOpportunities ? 'Show Less' : 'View All Opportunities'}
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    technicalSkills: (
      <Card key="technicalSkills" className="h-full border-2 border-[#5378f1] rounded-2xl shadow-none bg-white">
        <CardHeader className="bg-gradient-to-r from-white to-purple-50 rounded-t-2xl border-b-0">
          <CardTitle className="flex items-center gap-2 text-purple-700 text-lg font-semibold">
            <Code className="w-5 h-5" />
            Technical Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {(showAllTechnicalSkills ? userData.technicalSkills.filter(skill => skill.enabled !== false) : userData.technicalSkills.filter(skill => skill.enabled !== false).slice(0,2)).map((skill, idx) => (
            <div key={skill.id || `tech-skill-${idx}`} className="bg-white rounded-xl border-0 shadow-none px-5 py-4 mb-2 flex flex-col gap-2" style={{boxShadow:'0 2px 8px 0 #e9e3fa'}}>
              <div className="flex items-center justify-between">
                <div key={`tech-skill-info-${skill.id}`}>
                  <h4 className="font-bold text-gray-900 text-base mb-1">{skill.name}</h4>
                  <p className="text-xs text-gray-600 font-medium">{skill.category}</p>
                </div>
                <div key={`tech-skill-stars-${skill.id}`} className="flex gap-1">
                  {renderStars(skill.level)}
                </div>
              </div>
            </div>
          ))}
          {userData.technicalSkills.length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllTechnicalSkills((v) => !v)}
              className="w-full border-2 border-purple-400 text-purple-600 hover:bg-purple-50 font-semibold rounded-lg mt-2"
            >
              {showAllTechnicalSkills ? 'Show Less' : 'View All Technical Skills'}
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    education: (
      <Card key="education" className="h-full border-2 border-[#5378f1] rounded-2xl shadow-none bg-white">
        <CardHeader className="bg-gradient-to-r from-white to-purple-50 rounded-t-2xl border-b-0">
          <CardTitle className="flex items-center gap-2 text-purple-700 text-lg font-semibold">
            <Award className="w-5 h-5" />
            My Education
            <span className="ml-auto">
              <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-semibold shadow-none">
                {userData.education.length} Qualifications
              </Badge>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {(showAllEducation ? userData.education.filter(education => education.enabled !== false) : userData.education.filter(education => education.enabled !== false).slice(0,2)).map((education, idx) => (
            <div key={education.id || `edu-${idx}`} className="bg-white rounded-xl border-0 shadow-none px-5 py-4 mb-2 flex flex-col gap-2" style={{boxShadow:'0 2px 8px 0 #e9e3fa'}}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">{education.degree}</h4>
                  <p className="text-gray-600 text-sm font-medium mb-1">{education.university}</p>
                </div>
                <Badge className={`rounded-md px-3 py-1 text-xs font-semibold shadow-none ${education.status === 'ongoing' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>{education.status}</Badge>
              </div>
              <div className="flex gap-8 mt-1">
                <div key={`edu-level-${education.id}`}>
                  <p className="text-gray-500 text-xs font-medium">Level</p>
                  <p className="font-semibold text-gray-800 text-xs">{education.level}</p>
                </div>
                <div key={`edu-year-${education.id}`}>
                  <p className="text-gray-500 text-xs font-medium">Year</p>
                  <p className="font-semibold text-gray-800 text-xs">{education.yearOfPassing}</p>
                </div>
                <div key={`edu-grade-${education.id}`}>
                  <p className="text-gray-500 text-xs font-medium">Grade</p>
                  <p className="font-semibold text-gray-800 text-xs">{education.cgpa}</p>
                </div>
              </div>
            </div>
          ))}
          {userData.education.length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllEducation((v) => !v)}
              className="w-full border-2 border-purple-400 text-purple-600 hover:bg-purple-50 font-semibold rounded-lg mt-2"
            >
              {showAllEducation ? 'Show Less' : 'View All Qualifications'}
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    training: (
      <Card key="training" className="h-full border-2 border-[#5378f1] rounded-2xl shadow-none bg-white">
        <CardHeader className="bg-gradient-to-r from-white to-purple-50 rounded-t-2xl border-b-0">
          <CardTitle className="flex items-center gap-2 text-purple-700 text-lg font-semibold">
            <Code className="w-5 h-5" />
            My Training
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {userData.training.filter(training => training.enabled !== false).slice(0, 2).map((training, idx) => (
            <div key={training.id || `training-${training.course}-${idx}`} className="bg-white rounded-xl border-0 shadow-none px-5 py-4 mb-2 flex flex-col gap-2" style={{boxShadow:'0 2px 8px 0 #e9e3fa'}}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-900 text-base">{training.course}</span>
                <Badge className={`rounded-md px-3 py-1 text-xs font-semibold shadow-none ${training.status === 'completed' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>{training.status}</Badge>
              </div>
              <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden mb-1">
                <div className="h-2 bg-black rounded-full transition-all duration-300" style={{ width: `${training.progress}%` }} />
              </div>
              <span className="text-xs text-purple-600 font-semibold">{training.progress}% Complete</span>
            </div>
          ))}
          {userData.training.filter(training => training.enabled !== false).length > 0 && (
            <Button
              variant="outline"
              onClick={() => setActiveModal('training')}
              className="w-full border-2 border-purple-400 text-purple-600 hover:bg-purple-50 font-semibold rounded-lg mt-2"
            >
              View All Courses
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    experience: (
      <Card key="experience" className="h-full border-2 border-[#5378f1] rounded-2xl shadow-none bg-white">
        <CardHeader className="bg-gradient-to-r from-white to-purple-50 rounded-t-2xl border-b-0">
          <CardTitle className="flex items-center gap-2 text-purple-700 text-lg font-semibold">
            <Users className="w-5 h-5" />
            My Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {(showAllExperience ? userData.experience.filter(exp => exp.enabled !== false) : userData.experience.filter(exp => exp.enabled !== false).slice(0,2)).map((exp, idx) => (
            <div key={exp.id || `${exp.role}-${exp.organization}-${idx}`} className="bg-white rounded-xl border-0 shadow-none px-5 py-4 mb-2 flex flex-col gap-2" style={{boxShadow:'0 2px 8px 0 #e9e3fa'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-base mb-1">{exp.role}</p>
                  <p className="text-gray-600 text-sm font-medium mb-1">{exp.organization}</p>
                  <p className="text-xs text-gray-500">{exp.duration}</p>
                </div>
                {exp.verified && (
                  <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-semibold shadow-none">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {userData.experience.length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllExperience((v) => !v)}
              className="w-full border-2 border-purple-400 text-purple-600 hover:bg-purple-50 font-semibold rounded-lg mt-2"
            >
              {showAllExperience ? 'Show Less' : 'View All Experience'}
            </Button>
          )}
        </CardContent>
      </Card>
    ),
    softSkills: (
      <Card key="softSkills" className="h-full border-2 border-[#5378f1] rounded-2xl shadow-none bg-white">
        <CardHeader className="bg-gradient-to-r from-white to-purple-50 rounded-t-2xl border-b-0">
          <CardTitle className="flex items-center gap-2 text-purple-700 text-lg font-semibold">
            <MessageCircle className="w-5 h-5" />
            My Soft Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {(showAllSoftSkills ? userData.softSkills.filter(skill => skill.enabled !== false) : userData.softSkills.filter(skill => skill.enabled !== false).slice(0,2)).map((skill, idx) => (
            <div key={skill.id || `soft-skill-${idx}`} className="bg-white rounded-xl border-0 shadow-none px-5 py-4 mb-2 flex flex-col gap-2" style={{boxShadow:'0 2px 8px 0 #e9e3fa'}}>
              <div className="flex items-center justify-between">
                <div key={`skill-info-${skill.id}`}>
                  <h4 className="font-bold text-gray-900 text-base mb-1">{skill.name}</h4>
                  <p className="text-xs text-gray-600 font-medium">{skill.description}</p>
                </div>
                <div key={`skill-stars-${skill.id}`} className="flex gap-1">
                  {renderStars(skill.level)}
                </div>
              </div>
            </div>
          ))}
          {userData.softSkills.length > 2 && (
            <Button
              variant="outline"
              onClick={() => setShowAllSoftSkills((v) => !v)}
              className="w-full border-2 border-purple-400 text-purple-600 hover:bg-purple-50 font-semibold rounded-lg mt-2"
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
      ? ['education', 'training', 'experience', 'softSkills', 'technicalSkills'] 
      : ['opportunities', 'education', 'training', 'experience', 'softSkills', 'technicalSkills'],
    skills: ['technicalSkills', 'softSkills', 'education', 'training', 'experience', ...(isViewingOthersProfile ? [] : ['opportunities'])],
    training: ['training', 'education', 'technicalSkills', 'softSkills', 'experience', ...(isViewingOthersProfile ? [] : ['opportunities'])],
    experience: ['experience', 'education', 'training', 'technicalSkills', 'softSkills', ...(isViewingOthersProfile ? [] : ['opportunities'])]
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
    });
  };

  return (
    <div className="bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Bar */}
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN - User Activity & Updates - Only show for own profile */}
          {!isViewingOthersProfile && (
            <div className="lg:col-span-1 space-y-6">

              {/* Sticky container for both cards */}
              <div className="sticky top-20 z-30 flex flex-col gap-6">
                {/* Recent Updates */}
                <Card
                  ref={recentUpdatesRef}
                  className={`border-2 border-[#2196F3] bg-white rounded-2xl shadow-none`}
                >
                  <CardHeader className="bg-[#F3F8FF] rounded-t-2xl border-b-0 px-6 py-4">
                    <CardTitle className="flex items-center gap-2 text-[#1976D2] text-lg font-bold">
                      <Bell className="w-5 h-5 text-[#1976D2]" />
                      Recent Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-0 py-4">
                    {(showAllRecentUpdates || !recentUpdatesCollapsed
                      ? recentUpdates
                      : recentUpdates.slice(0, 1)
                    ).map((update, idx) => (
                      <div key={update.id || `update-${update.timestamp}-${idx}`} className="flex items-start gap-3 px-6 py-4 bg-white rounded-xl border-l-4 border-[#2196F3] mb-2">
                        <div className="w-2 h-2 bg-[#FF9800] rounded-full mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-base font-medium text-gray-900 mb-1">{update.message}</p>
                          <p className="text-xs text-[#1976D2] font-medium">{update.timestamp}</p>
                        </div>
                      </div>
                    ))}
                    {recentUpdates.length > 1 && recentUpdatesCollapsed && !showAllRecentUpdates && (
                      <Button
                        variant="outline"
                        className="w-full border-2 border-[#2196F3] text-[#2196F3] hover:bg-blue-50 font-semibold rounded-lg mt-2"
                        onClick={() => {
                          setShowAllRecentUpdates(true);
                          setRecentUpdatesSticky(false);
                        }}
                      >
                        Show More
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Suggested Next Steps */}
                <Card
                  ref={suggestedNextStepsRef}
                  className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                      <TrendingUp className="w-5 h-5" />
                      Suggested Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {suggestions.map((suggestion, idx) => (
                      <div key={suggestion.id || `suggestion-${idx}`} className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg border-l-2 border-l-amber-500 hover:shadow-sm transition-shadow">
                        <p className="text-sm font-medium text-amber-900">{suggestion}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Student QR Code */}
                {/* <Card className="border-2 border-purple-500 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="flex flex-col items-center justify-center py-8 px-6">
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
                        PASSPORT-ID: SP-{userEmail ? userEmail.split('@')[0].toUpperCase().slice(0, 5) : '62111'}
                      </p>
                    </div>
                  </CardContent>
                </Card> */}
              </div>
            </div>
          )}

          {/* RIGHT COLUMN - 6 Key Boxes with Dynamic Ordering */}
          <div className={isViewingOthersProfile ? "lg:col-span-3" : "lg:col-span-2"}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {activeModal === 'skills' && (
        <SkillsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={{ softSkills: userData.softSkills, technicalSkills: userData.technicalSkills }}
          onSave={(data) => handleSave('softSkills', data)}
          title="Edit Soft Skills"
        />
      )}

      {activeModal === 'technicalSkills' && (
        <SkillsEditModal
          isOpen
          onClose={() => setActiveModal(null)}
          data={{ softSkills: userData.softSkills, technicalSkills: userData.technicalSkills }}
          onSave={(data) => handleSave('technicalSkills', data)}
          title="Edit Technical Skills"
        />
      )}
    </div>
  );
};

export default StudentDashboard;
