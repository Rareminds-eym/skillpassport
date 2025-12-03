import React, { useState, useEffect } from 'react';
import { Award, Star, Plus, Edit2, Trash2, Users, Search, X, Gift, FileText, TrendingUp, Eye, Download, Trophy, Medal } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

const SkillBadgesCertificates = () => {
  const [activeTab, setActiveTab] = useState('badges'); // 'badges', 'certificates', or 'competitions'
  const [skillBadges, setSkillBadges] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  
  // Modals
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Competition Results Modal
  const [resultsModal, setResultsModal] = useState({ open: false, competition: null });
  const [competitionResults, setCompetitionResults] = useState([]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    icon: '🏆',
    category: 'leadership',
    level: 'bronze',
    points_required: 100,
    auto_award_enabled: false
  });

  const [certificateForm, setCertificateForm] = useState({
    title: '',
    description: '',
    certificate_type: 'course_completion',
    issuer: '',
    issued_date: new Date().toISOString().split('T')[0]
  });

  // Load initial data
  useEffect(() => {
    loadBadges();
    loadCertificates();
    loadCompetitions();
  }, []);

  const loadBadges = () => {
    // Mock data for now - replace with Supabase query
    const mockBadges = [
      { 
        badge_id: '1',
        name: 'Problem Solver', 
        level: 'gold', 
        icon: '🧩', 
        category: 'technical',
        description: 'Completed 50+ coding challenges',
        points_required: 500,
        is_active: true,
        awarded_count: 12
      },
      { 
        badge_id: '2',
        name: 'Team Player', 
        level: 'silver', 
        icon: '🤝', 
        category: 'collaboration',
        description: 'Collaborated on 10 group projects',
        points_required: 300,
        is_active: true,
        awarded_count: 25
      },
      { 
        badge_id: '3',
        name: 'Creative Thinker', 
        level: 'bronze', 
        icon: '💡', 
        category: 'creativity',
        description: 'Submitted 5 innovative ideas',
        points_required: 200,
        is_active: true,
        awarded_count: 18
      },
      { 
        badge_id: '4',
        name: 'Leadership', 
        level: 'gold', 
        icon: '⭐', 
        category: 'leadership',
        description: 'Led 3 successful club events',
        points_required: 600,
        is_active: true,
        awarded_count: 8
      },
      { 
        badge_id: '5',
        name: 'Public Speaker', 
        level: 'silver', 
        icon: '🎤', 
        category: 'communication',
        description: 'Participated in 8 debates',
        points_required: 350,
        is_active: true,
        awarded_count: 15
      },
      { 
        badge_id: '6',
        name: 'Tech Innovator', 
        level: 'gold', 
        icon: '💻', 
        category: 'technical',
        description: 'Built 4 working prototypes',
        points_required: 550,
        is_active: true,
        awarded_count: 10
      }
    ];
    setSkillBadges(mockBadges);
    setLoading(false);
  };

  const loadCertificates = () => {
    // Mock data for now - replace with Supabase query
    const mockCertificates = [
      { 
        certificate_id: '1',
        title: 'Web Development Bootcamp', 
        issued_date: '2024-10-15', 
        issuer: 'Coding Club', 
        certificate_type: 'course_completion',
        student_count: 24
      },
      { 
        certificate_id: '2',
        title: 'Public Speaking Excellence', 
        issued_date: '2024-09-20', 
        issuer: 'Debate Society', 
        certificate_type: 'skill_achievement',
        student_count: 18
      },
      { 
        certificate_id: '3',
        title: 'Robotics Workshop', 
        issued_date: '2024-08-10', 
        issuer: 'Robotics Lab', 
        certificate_type: 'workshop',
        student_count: 30
      },
      { 
        certificate_id: '4',
        title: 'Digital Art Mastery', 
        issued_date: '2024-07-05', 
        issuer: 'Art & Design', 
        certificate_type: 'course_completion',
        student_count: 15
      },
      { 
        certificate_id: '5',
        title: 'Environmental Leadership', 
        issued_date: '2024-06-12', 
        issuer: 'Environmental Club', 
        certificate_type: 'leadership',
        student_count: 12
      },
      { 
        certificate_id: '6',
        title: 'Hackathon Winner', 
        issued_date: '2024-05-20', 
        issuer: 'Coding Club', 
        certificate_type: 'competition',
        student_count: 5
      }
    ];
    setCertificates(mockCertificates);
  };

  const loadCompetitions = () => {
    // Mock data - replace with Supabase query
    const mockCompetitions = [
      {
        comp_id: '1',
        name: 'State Robotics Challenge',
        level: 'state',
        competition_date: '2024-11-15',
        status: 'completed',
        registrations: [
          { student_email: 'student1@school.com', student_name: 'Alice Johnson' },
          { student_email: 'student2@school.com', student_name: 'Bob Smith' },
          { student_email: 'student3@school.com', student_name: 'Charlie Brown' }
        ]
      },
      {
        comp_id: '2',
        name: 'Inter-school Hackathon',
        level: 'interschool',
        competition_date: '2024-12-05',
        status: 'upcoming',
        registrations: [
          { student_email: 'student4@school.com', student_name: 'David Lee' },
          { student_email: 'student5@school.com', student_name: 'Emma Wilson' }
        ]
      }
    ];
    setCompetitions(mockCompetitions);
  };

  const openResultsModal = (competition) => {
    setResultsModal({ open: true, competition });
    // Load registered students
    const registeredStudents = competition.registrations || [];
    const initialResults = registeredStudents.map(reg => ({
      student_email: reg.student_email,
      student_name: reg.student_name,
      rank: null,
      score: null,
      award: null,
      notes: ''
    }));
    setCompetitionResults(initialResults);
  };

  const handleResultChange = (studentEmail, field, value) => {
    setCompetitionResults(prev =>
      prev.map(result =>
        result.student_email === studentEmail
          ? { ...result, [field]: value }
          : result
      )
    );
  };

  const handleSaveResults = async () => {
    // Validate all results have scores
    const incomplete = competitionResults.filter(r => r.score === null || r.score === '');
    if (incomplete.length > 0) {
      setNotice({ type: "error", text: "Please enter scores for all participants" });
      return;
    }

    // Auto-assign ranks based on scores
    const sorted = [...competitionResults].sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    const withRanks = sorted.map((result, index) => ({
      ...result,
      rank: index + 1,
      award: index === 0 ? 'Gold Medal - 1st Place' :
             index === 1 ? 'Silver Medal - 2nd Place' :
             index === 2 ? 'Bronze Medal - 3rd Place' :
             parseFloat(result.score) >= 70 ? 'Certificate of Merit' :
             'Certificate of Participation'
    }));

    // Save to Supabase
    // TODO: Add Supabase insert logic here
    console.log('Saving results:', withRanks);

    setNotice({
      type: "success",
      text: `Results saved for ${resultsModal.competition?.name}! Certificates will be auto-generated.`
    });
    setResultsModal({ open: false, competition: null });
    setCompetitionResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-2">Skill Badges</h1>
          <p className="text-indigo-100">View your badges and earned certificates</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Notice */}
        {notice && (
          <div className={`mb-4 p-4 rounded-lg ${
            notice.type === 'error' ? 'bg-red-50 text-red-700' :
            notice.type === 'success' ? 'bg-green-50 text-green-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            <div className="flex items-center justify-between">
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)} className="text-sm underline">Dismiss</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('badges')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'badges'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Award className="inline-block mr-2" size={18} />
              Skill Badges
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'certificates'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Star className="inline-block mr-2" size={18} />
              Certificates
            </button>
            <button
              onClick={() => setActiveTab('competitions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'competitions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="inline-block mr-2" size={18} />
              Competition Results
            </button>
          </nav>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Skill Badges</h3>
              <Award size={32} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-indigo-100 text-sm">Total Badges</p>
                <p className="text-3xl font-bold">{skillBadges.length}</p>
              </div>
              <div>
                <p className="text-indigo-100 text-sm">Gold Badges</p>
                <p className="text-3xl font-bold">{skillBadges.filter(b => b.level === 'gold').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Certificates</h3>
              <Star size={32} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-orange-100 text-sm">Total Earned</p>
                <p className="text-3xl font-bold">{certificates.length}</p>
              </div>
              <div>
                <p className="text-orange-100 text-sm">This Year</p>
                <p className="text-3xl font-bold">{certificates.filter(c => c.issued_date?.includes('2024')).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Badges Section */}
        {activeTab === 'badges' && (
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Skill Badges</h2>
            <p className="text-gray-600 mt-1">Track your progress and achievements across different skill areas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skillBadges.map((badge, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-5xl">{badge.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{badge.name}</h3>
                      <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                        badge.level === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                        badge.level === 'silver' ? 'bg-gray-200 text-gray-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)} Level
                      </span>
                      <p className="text-sm text-gray-500 mt-1">Points: {badge.points_required}</p>
                    </div>
                  </div>
                  <TrendingUp className="text-green-500" size={24} />
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{badge.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Students Awarded</span>
                    <span className="font-semibold">{badge.awarded_count || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Status</span>
                    <span className={`font-semibold ${badge.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {badge.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Certificates Section */}
        {activeTab === 'certificates' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Certificates</h2>
            <p className="text-gray-600 mt-1">View, download, and share your earned certificates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map(cert => (
              <div
                key={cert.certificate_id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 h-48 flex flex-col items-center justify-center p-6 text-white">
                  <Star size={56} className="mb-3" />
                  <div className="text-center">
                    <p className="text-xs font-semibold bg-white bg-opacity-20 px-3 py-1 rounded-full">
                      {cert.certificate_type?.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{cert.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Issued by:</span>
                      <span className="font-medium text-gray-900">{cert.issuer}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-gray-900">{cert.issued_date}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-medium text-gray-900">{cert.student_count || 0}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                      <Eye size={16} />
                      <span>View</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                      <Download size={16} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Competition Results Section */}
        {activeTab === 'competitions' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Competition Results</h2>
            <p className="text-gray-600 mt-1">Enter and manage competition results and awards</p>
          </div>

          <div className="space-y-4">
            {competitions.map(comp => (
              <div
                key={comp.comp_id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Trophy className="text-yellow-500" size={24} />
                      <h3 className="text-xl font-bold text-gray-900">{comp.name}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        comp.status === 'completed' ? 'bg-green-100 text-green-700' :
                        comp.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {comp.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Level</p>
                        <p className="font-semibold text-gray-900 capitalize">{comp.level}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-semibold text-gray-900">{comp.competition_date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Participants</p>
                        <p className="font-semibold text-gray-900">{comp.registrations?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openResultsModal(comp)}
                    disabled={comp.status === 'upcoming'}
                    className={`ml-4 px-4 py-2 rounded-lg font-medium text-sm ${
                      comp.status === 'upcoming'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {comp.status === 'completed' ? 'View/Edit Results' : 'Enter Results'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Results Entry Modal */}
        {resultsModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{resultsModal.competition?.name}</h3>
                    <p className="text-sm text-indigo-100 mt-1">
                      Enter scores and results for all participants
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setResultsModal({ open: false, competition: null });
                      setCompetitionResults([]);
                    }}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {competitionResults.map((result, index) => (
                    <div
                      key={result.student_email}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Student Name
                            </label>
                            <div className="text-sm font-semibold text-gray-900">
                              {result.student_name}
                            </div>
                            <div className="text-xs text-gray-500">{result.student_email}</div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Score *
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={result.score || ''}
                              onChange={(e) => handleResultChange(result.student_email, 'score', e.target.value)}
                              placeholder="0-100"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Award (Auto-assigned)
                            </label>
                            <div className="text-sm text-gray-600 italic">
                              {result.score ? (
                                parseFloat(result.score) >= 90 ? '🥇 Gold Medal' :
                                parseFloat(result.score) >= 80 ? '🥈 Silver Medal' :
                                parseFloat(result.score) >= 70 ? '🥉 Bronze Medal' :
                                '📜 Participation'
                              ) : 'Enter score first'}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <input
                              type="text"
                              value={result.notes || ''}
                              onChange={(e) => handleResultChange(result.student_email, 'notes', e.target.value)}
                              placeholder="Optional notes"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {competitionResults.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No participants registered for this competition
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{competitionResults.length}</span> participants
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setResultsModal({ open: false, competition: null });
                        setCompetitionResults([]);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveResults}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                    >
                      Save Results & Generate Certificates
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillBadgesCertificates;