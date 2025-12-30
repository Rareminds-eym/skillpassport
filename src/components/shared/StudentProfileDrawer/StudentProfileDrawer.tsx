import React, { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  ArrowUpIcon,
} from '@heroicons/react/24/outline';
import { Trophy, File } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

// Types
import { StudentProfileDrawerProps, TabConfig, ActionConfig } from './types';

// Hooks
import { useStudentData, useStudentActions } from './hooks';

// Components
import { Badge, TabButton } from './components';

// Modals
import {
  AdmissionNoteModal,
  MessageModal,
  ExportModal,
  ApprovalModal,
  PromotionModal,
  GraduationModal,
} from './modals';

// Tabs
import {
  OverviewTab,
  AcademicTab,
  CoursesTab,
  ProjectsTab,
  CertificatesTab,
  AssessmentsTab,
  CurriculumTab,
  ClubsCompetitionsTab,
  ExamResultsTab,
  NotesTab,
  EventsTab,
} from './tabs';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({
  student,
  isOpen,
  onClose,
  userRole = 'school_admin',
  defaultTab = 'overview',
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [copied, setCopied] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Scroll tabs container to start when drawer opens
  useEffect(() => {
    if (isOpen && tabsContainerRef.current) {
      tabsContainerRef.current.scrollLeft = 0;
    }
  }, [isOpen]);

  // Reset active tab when defaultTab changes or drawer opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAdmissionNoteModal, setShowAdmissionNoteModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showGraduationModal, setShowGraduationModal] = useState(false);

  // Custom hooks
  const {
    assessmentResults,
    curriculumData,
    lessonPlans,
    courses,
    projects,
    certificates,
    admissionNotes,
    studentAcademicYear,
    loadingAssessments,
    loadingCurriculum,
    loadingCourses,
    loadingProjects,
    loadingCertificates,
    loadingNotes,
  } = useStudentData(student, isOpen);

  const {
    actionLoading,
    getCurrentSemester,
    getTotalSemesters,
    needsVerification,
    canPromote,
    canGraduate,
    handleApprovalAction,
    handlePromotion,
    handleGraduation,
  } = useStudentActions(student);

  if (!isOpen || !student) return null;

  // Configuration based on user role and student type
  const getTabsConfig = (): TabConfig[] => {
    const baseTabs: TabConfig[] = [
      { key: 'overview', label: 'Overview' },
      { key: 'academic', label: 'Academic' },
    ];

    // Add courses tab for all students
    baseTabs.push({ key: 'courses', label: 'Courses' });

    // Add projects and certificates tabs for ALL students
    baseTabs.push(
      { key: 'projects', label: 'Projects' },
      { key: 'certificates', label: 'Certificates' }
    );

    // Add assessments tab
    baseTabs.push({ key: 'assessments', label: 'Assessments' });

    // Add exam results tab
    baseTabs.push({ key: 'exam-results', label: 'Exam Results' });

    // Add Events tab for all students
    baseTabs.push({ key: 'events', label: 'Events' });

    // For school educators: show school-specific tabs
    if (userRole === 'school_educator' || (userRole.includes('admin') && student.school_id)) {
      baseTabs.push({ key: 'curriculum', label: 'Curriculum & Lessons' });
      baseTabs.push({ key: 'clubs', label: 'Clubs & Competitions' });
    }
    
    // For college educators: show college-specific tabs
    if (userRole === 'college_educator' || (userRole.includes('admin') && student.college_id && !student.school_id)) {
      baseTabs.push({ key: 'clubs', label: 'Clubs & Activities' });
    }

    // Add notes tab for admins only
    if (userRole.includes('admin')) {
      baseTabs.push({ key: 'notes', label: 'Admission Notes' });
    }

    return baseTabs;
  };

  const getActionsConfig = (): ActionConfig => {
    const isAdmin = userRole.includes('admin');
    const isEducator = userRole.includes('educator');
    const isCollegeStudent = !student.school_id; // College students don't have school_id

    return {
      showApproval: Boolean(isAdmin && needsVerification() && isCollegeStudent),
      showPromotion: Boolean(isAdmin && canPromote() && isCollegeStudent),
      showGraduation: Boolean(isAdmin && canGraduate() && isCollegeStudent),
      showNotes: Boolean(isEducator || isAdmin), // Educators can add mentor notes
      showExport: Boolean(isEducator || isAdmin),
      showMessage: Boolean(isEducator || isAdmin),
    };
  };

  const tabs = getTabsConfig();
  const actions = getActionsConfig();
  const qrCodeValue = `${window.location.origin}/student/profile/${student.email}`;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab student={student} />;
      case 'academic':
        return <AcademicTab student={student} />;
      case 'courses':
        return <CoursesTab courses={courses} loading={loadingCourses} studentId={student?.id} />;
      case 'projects':
        return <ProjectsTab projects={projects} loading={loadingProjects} />;
      case 'certificates':
        return <CertificatesTab certificates={certificates} loading={loadingCertificates} />;
      case 'assessments':
        return (
          <AssessmentsTab
            assessmentResults={assessmentResults}
            loading={loadingAssessments}
            studentType={student?.college_id ? 'college' : 'school'}
            studentGrade={student?.grade}
          />
        );
      case 'exam-results':
        return (
          <ExamResultsTab
            student={student}
            loading={false}
          />
        );
      case 'events':
        return (
          <EventsTab
            student={student}
            loading={false}
          />
        );
      case 'curriculum':
        return (
          <CurriculumTab
            curriculumData={curriculumData}
            lessonPlans={lessonPlans}
            studentAcademicYear={studentAcademicYear}
            loading={loadingCurriculum}
            student={student}
          />
        );
      case 'clubs':
        return (
          <ClubsCompetitionsTab
            student={student}
            loading={false}
          />
        );
      case 'notes':
        return (
          <NotesTab
            admissionNotes={admissionNotes}
            loading={loadingNotes}
            onAddNote={() => setShowAdmissionNoteModal(true)}
          />
        );
      default:
        return <OverviewTab student={student} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="fixed inset-y-0 right-0 pl-4 sm:pl-10 max-w-full flex">
          <div className="w-screen max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
            <div className="h-full flex flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="px-6 py-4 bg-primary-50 border-b border-primary-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{student.email}</p>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {/* Show different fields based on student type */}
                      {student.school_id ? (
                        // School Student Fields
                        <>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">School</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{student.school_name || student.college_school_name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Grade</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{student.grade || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Section</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{student.section || 'N/A'}</p>
                          </div>
                        </>
                      ) : (
                        // University/College Student Fields
                        <>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">College</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{student.college || student.profile?.university || student.college_school_name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Degree</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{student.profile?.education?.[0]?.degree || student.branch_field || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Section</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{student.section || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">CGPA</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{student.profile?.education?.[0]?.cgpa || student.currentCgpa || 'N/A'}</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          {student.school_id ? 'Admission Status:' : 'Enrollment Status:'}
                        </p>
                        <Badge type={student.approval_status || 'pending'} />
                        
                      </div>
                      
                      {/* Academic Progress Indicator */}
                      {!student.school_id && (
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">
                            Academic Progress:
                          </div>
                          <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
                            <div className="text-xs font-medium text-gray-700">
                              Semester {getCurrentSemester()} of {getTotalSemesters()}
                            </div>
                            <div className="ml-2 w-12 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-primary-600 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${(getCurrentSemester() / getTotalSemesters()) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="relative flex flex-col items-center justify-center group mr-4">
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText(qrCodeValue);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="cursor-pointer bg-white border border-gray-200 p-2 rounded-lg shadow-sm transition-transform transform hover:scale-105 hover:shadow-md"
                      title="Click to copy profile link"
                    >
                      <QRCodeSVG value={qrCodeValue} size={72} level="H" />
                    </div>

                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[11px] bg-gray-800 text-white rounded-md px-2 py-1 bottom-[-30px] whitespace-nowrap shadow-md">
                      {copied ? '✅ Link copied!' : '📱 Scan or click to copy'}
                    </div>

                    <p className="text-xs text-gray-500 mt-1">Scan to view</p>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      <span>{student.contact_number || student.contactNumber || student.profile?.contact_number || student.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      <span>{student.email || student.profile?.email || 'Not provided'}</span>
                    </div>
                  </div>
                  
                  {/* Action Indicators */}
                  <div className="flex items-center space-x-2">
                    {actions.showApproval && (
                      <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-1 animate-pulse"></div>
                        Verification Required
                      </div>
                    )}
                    
                    {actions.showPromotion && (
                      <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                        <ArrowUpIcon className="h-3 w-3 mr-1" />
                        Ready for Promotion
                      </div>
                    )}
                    
                    {actions.showGraduation && (
                      <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <Trophy className="h-3 w-3 mr-1" />
                        Ready to Graduate
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div 
                ref={tabsContainerRef}
                className="border-b border-gray-200 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                <nav className="-mb-px flex space-x-2 sm:space-x-4 lg:space-x-6 px-4 sm:px-6 whitespace-nowrap" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <TabButton
                      key={tab.key}
                      active={activeTab === tab.key}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </TabButton>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {renderTabContent()}
              </div>

              {/* Action Bar - Bottom Section */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {actions.showNotes && (
                      <button
                        onClick={() => setShowAdmissionNoteModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-2" />
                        {userRole.includes('educator') ? 'Add Mentor Note' : 'Add Note'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => navigate('/digital-pp/homepage', { state: { candidate: student } })}
                      className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
                    >
                      <File className="h-4 w-4 mr-2" />
                      View Portfolio
                    </button>

                    {/* Student Management Actions - Only for Admins */}
                    {actions.showApproval && (
                      <button
                        onClick={() => setShowApprovalModal(true)}
                        disabled={actionLoading}
                        className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Verify
                      </button>
                    )}

                    {actions.showPromotion && (
                      <button
                        onClick={() => setShowPromotionModal(true)}
                        disabled={actionLoading}
                        className="inline-flex items-center px-3 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50"
                      >
                        <ArrowUpIcon className="h-4 w-4 mr-2" />
                        Promote
                      </button>
                    )}

                    {actions.showGraduation && (
                      <button
                        onClick={() => setShowGraduationModal(true)}
                        disabled={actionLoading}
                        className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Graduate
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Semester Status - Only for College Students */}
                    {!student.school_id && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Sem {getCurrentSemester()}/{getTotalSemesters()}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {actions.showMessage && (
                        <button
                          onClick={() => setShowMessageModal(true)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                          Message
                        </button>
                      )}
                      
                      {actions.showExport && (
                        <button
                          onClick={() => setShowExportModal(true)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          Export
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {actions.showExport && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          student={student}
        />
      )}

      {actions.showMessage && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          student={student}
          userRole={userRole as 'school_admin' | 'college_admin' | 'educator'}
        />
      )}

      {actions.showNotes && (
        <AdmissionNoteModal
          isOpen={showAdmissionNoteModal}
          onClose={() => setShowAdmissionNoteModal(false)}
          student={student}
        />
      )}

      {actions.showApproval && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          student={student}
          onApprove={handleApprovalAction}
          onReject={handleApprovalAction}
          loading={actionLoading}
        />
      )}

      {actions.showPromotion && (
        <PromotionModal
          isOpen={showPromotionModal}
          onClose={() => setShowPromotionModal(false)}
          student={student}
          onPromote={handlePromotion}
          loading={actionLoading}
          currentSemester={getCurrentSemester()}
          nextSemester={getCurrentSemester() + 1}
        />
      )}

      {actions.showGraduation && (
        <GraduationModal
          isOpen={showGraduationModal}
          onClose={() => setShowGraduationModal(false)}
          student={student}
          onGraduate={handleGraduation}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default StudentProfileDrawer;