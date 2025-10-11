import React, { useState } from 'react';
import {
  XMarkIcon,
  StarIcon,
  MapPinIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  TrophyIcon,
  BriefcaseIcon,
  BeakerIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const Badge = ({ type }) => {
  const badgeConfig = {
    self_verified: { 
      color: 'bg-gray-100 text-gray-800 border-gray-300', 
      label: 'Self Verified',
      icon: ShieldCheckIcon
    },
    institution_verified: { 
      color: 'bg-blue-100 text-blue-800 border-blue-300', 
      label: 'Institution Verified',
      icon: AcademicCapIcon
    },
    external_audited: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-400', 
      label: 'External Audited',
      icon: ShieldCheckIcon
    }
  };

  const config = badgeConfig[type] || badgeConfig.self_verified;
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <IconComponent className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium border-b-2 ${
      active
        ? 'border-primary-500 text-primary-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);

const ProgressBar = ({ label, value, maxValue = 100 }) => (
  <div className="mb-3">
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}/{maxValue}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-primary-600 h-2 rounded-full"
        style={{ width: `${(value / maxValue) * 100}%` }}
      ></div>
    </div>
  </div>
);

const CandidateProfileDrawer = ({ candidate, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);

  if (!isOpen || !candidate) return null;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'projects', label: 'Projects' },
    { key: 'assessments', label: 'Assessments' },
    { key: 'certificates', label: 'Certificates' },
    { key: 'verification', label: 'Verification' },
    { key: 'notes', label: 'Notes & Ratings' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex sm:pl-16">
          <div className="w-screen max-w-2xl">
            <div className="h-full flex flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="px-6 py-4 bg-primary-50 border-b border-primary-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h2 className="text-xl font-semibold text-gray-900">{candidate.name}</h2>
                      <div className="ml-3 flex items-center">
                        <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="text-lg font-bold text-gray-900 ml-1">{candidate.ai_score_overall}</span>
                        <span className="text-sm text-gray-600 ml-1">AI Score</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 mr-1" />
                      <span>{candidate.college} • {candidate.dept}</span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>{candidate.location} • {candidate.year}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {candidate.badges.map((badge, index) => (
                        <Badge key={index} type={badge} />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="bg-white rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    <span>{candidate.phone || '+91 XXXXX-XXXXX'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    <span>{candidate.email}</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {tabs.map((tab) => (
                    <TabButton
                      key={tab.key}
                      active={activeTab === tab.key}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </TabButton>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && (
                  <div className="p-6 space-y-6">
                    {/* AI Scores */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">AI Readiness Summary</h3>
                      <div className="space-y-3">
                        <ProgressBar label="LSRW (Language Skills)" value={candidate.ai_scores?.lsrw || 0} />
                        <ProgressBar label="Coding Ability" value={candidate.ai_scores?.coding || 0} />
                        <ProgressBar label="Case Study Analysis" value={candidate.ai_scores?.case_study || 0} />
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Core Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Achievements */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Key Achievements</h3>
                      <div className="space-y-3">
                        {candidate.hackathon && (
                          <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <TrophyIcon className="h-6 w-6 text-yellow-600 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Hackathon Rank #{candidate.hackathon.rank}
                              </p>
                              <p className="text-sm text-gray-600">{candidate.hackathon.event_id}</p>
                            </div>
                          </div>
                        )}
                        {candidate.internship && (
                          <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <BriefcaseIcon className="h-6 w-6 text-blue-600 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Internship at {candidate.internship.org}
                              </p>
                              <p className="text-sm text-gray-600">
                                Rating: {candidate.internship.rating}/5.0
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Projects & Portfolio</h3>
                    <div className="space-y-4">
                      {candidate.projects?.map((project, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{project.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {project.tech?.map((tech, techIndex) => (
                                  <span
                                    key={techIndex}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <BeakerIcon className="h-6 w-6 text-gray-400 ml-4" />
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-8">No projects available</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'verification' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Provenance</h3>
                    <div className="space-y-4">
                      {candidate.badges.map((badge, index) => {
                        const verificationInfo = {
                          self_verified: {
                            title: 'Self Verified',
                            description: 'Student has self-declared this information',
                            date: 'Sep 20, 2025',
                            verifier: 'Student',
                            status: 'pending'
                          },
                          institution_verified: {
                            title: 'Institution Verified',
                            description: 'Verified by college examination cell',
                            date: 'Sep 25, 2025',
                            verifier: 'College Exam Cell',
                            status: 'verified'
                          },
                          external_audited: {
                            title: 'External Audited',
                            description: 'Third-party verification completed',
                            date: 'Sep 28, 2025',
                            verifier: 'External Auditor',
                            status: 'audited'
                          }
                        };

                        const info = verificationInfo[badge];
                        const statusColors = {
                          pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
                          verified: 'text-blue-600 bg-blue-50 border-blue-200',
                          audited: 'text-green-600 bg-green-50 border-green-200'
                        };

                        return (
                          <div key={index} className={`border rounded-lg p-4 ${statusColors[info.status]}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{info.title}</h4>
                                <p className="text-sm mt-1">{info.description}</p>
                                <p className="text-xs mt-2">
                                  Verified on {info.date} by {info.verifier}
                                </p>
                              </div>
                              <ShieldCheckIcon className="h-6 w-6" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notes & Ratings</h3>
                    
                    {/* Rating */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Rating
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`h-8 w-8 ${
                              star <= rating ? 'text-yellow-400' : 'text-gray-300'
                            } hover:text-yellow-400`}
                          >
                            <StarIcon className={star <= rating ? 'fill-current' : ''} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add your notes about this candidate..."
                      />
                    </div>

                    {/* Team Notes */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Team Notes</h4>
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">Sarah Johnson</span>
                            <span className="text-xs text-gray-500">2 days ago</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            Strong technical skills, particularly impressed with the food safety project. 
                            Good communication during preliminary screening.
                          </p>
                          <div className="flex items-center mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon
                                key={star}
                                className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-2">4/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other tabs content can be added similarly */}
                {activeTab === 'assessments' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Assessments</h3>
                    <p className="text-gray-500 text-center py-8">Assessment results will be displayed here</p>
                  </div>
                )}

                {activeTab === 'certificates' && (
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Certificates</h3>
                    <p className="text-gray-500 text-center py-8">Certificates will be displayed here</p>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    <button className="inline-flex items-center px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100">
                      <BookmarkIcon className="h-4 w-4 mr-2" />
                      Add to Shortlist
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      Schedule Interview
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                      Message
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileDrawer;