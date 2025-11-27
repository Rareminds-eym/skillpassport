import React from 'react';
import { Award, Star, TrendingUp, Download, Eye } from 'lucide-react';

const SkillBadgesCertificates = () => {
  const skillBadges = [
    { 
      name: 'Problem Solver', 
      level: 'Gold', 
      progress: 85, 
      icon: '🧩', 
      earnedDate: 'Nov 2024', 
      description: 'Completed 50+ coding challenges' 
    },
    { 
      name: 'Team Player', 
      level: 'Silver', 
      progress: 70, 
      icon: '🤝', 
      earnedDate: 'Oct 2024', 
      description: 'Collaborated on 10 group projects' 
    },
    { 
      name: 'Creative Thinker', 
      level: 'Bronze', 
      progress: 60, 
      icon: '💡', 
      earnedDate: 'Sep 2024', 
      description: 'Submitted 5 innovative ideas' 
    },
    { 
      name: 'Leadership', 
      level: 'Gold', 
      progress: 90, 
      icon: '⭐', 
      earnedDate: 'Nov 2024', 
      description: 'Led 3 successful club events' 
    },
    { 
      name: 'Public Speaker', 
      level: 'Silver', 
      progress: 75, 
      icon: '🎤', 
      earnedDate: 'Oct 2024', 
      description: 'Participated in 8 debates' 
    },
    { 
      name: 'Tech Innovator', 
      level: 'Gold', 
      progress: 88, 
      icon: '💻', 
      earnedDate: 'Nov 2024', 
      description: 'Built 4 working prototypes' 
    }
  ];

  const certificates = [
    { 
      id: 1, 
      title: 'Web Development Bootcamp', 
      date: 'Oct 2024', 
      issuer: 'Coding Club', 
      type: 'Course Completion', 
      credentialId: 'WDB-2024-001' 
    },
    { 
      id: 2, 
      title: 'Public Speaking Excellence', 
      date: 'Sep 2024', 
      issuer: 'Debate Society', 
      type: 'Skill Achievement', 
      credentialId: 'PSE-2024-045' 
    },
    { 
      id: 3, 
      title: 'Robotics Workshop', 
      date: 'Aug 2024', 
      issuer: 'Robotics Lab', 
      type: 'Workshop', 
      credentialId: 'RW-2024-023' 
    },
    { 
      id: 4, 
      title: 'Digital Art Mastery', 
      date: 'Jul 2024', 
      issuer: 'Art & Design', 
      type: 'Course Completion', 
      credentialId: 'DAM-2024-089' 
    },
    { 
      id: 5, 
      title: 'Environmental Leadership', 
      date: 'Jun 2024', 
      issuer: 'Environmental Club', 
      type: 'Leadership', 
      credentialId: 'EL-2024-012' 
    },
    { 
      id: 6, 
      title: 'Hackathon Winner', 
      date: 'May 2024', 
      issuer: 'Coding Club', 
      type: 'Competition', 
      credentialId: 'HW-2024-003' 
    }
  ];

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
                <p className="text-3xl font-bold">{skillBadges.filter(b => b.level === 'Gold').length}</p>
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
                <p className="text-3xl font-bold">{certificates.filter(c => c.date.includes('2024')).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Badges Section */}
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
                        badge.level === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                        badge.level === 'Silver' ? 'bg-gray-200 text-gray-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {badge.level} Level
                      </span>
                      <p className="text-sm text-gray-500 mt-1">Earned: {badge.earnedDate}</p>
                    </div>
                  </div>
                  <TrendingUp className="text-green-500" size={24} />
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{badge.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress to Next Level</span>
                    <span className="font-semibold">{badge.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${badge.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificates Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Certificates</h2>
            <p className="text-gray-600 mt-1">View, download, and share your earned certificates</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map(cert => (
              <div
                key={cert.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 h-48 flex flex-col items-center justify-center p-6 text-white">
                  <Star size={56} className="mb-3" />
                  <div className="text-center">
                    <p className="text-xs font-semibold bg-white bg-opacity-20 px-3 py-1 rounded-full">
                      {cert.type}
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
                      <span className="font-medium text-gray-900">{cert.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Credential ID:</span>
                      <span className="font-mono text-xs text-gray-700">{cert.credentialId}</span>
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
      </div>
    </div>
  );
};

export default SkillBadgesCertificates;