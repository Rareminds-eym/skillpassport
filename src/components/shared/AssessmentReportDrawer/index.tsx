import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabaseClient';
import {
  Target,
  Briefcase,
  Zap,
  Rocket,
  Download,
  AlertCircle,
  RefreshCw,
  X,
  Users,
  FileCheck,
  GraduationCap,
  Calendar,
  Brain,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../Students/components/ui/dialog';

// Import section components from assessment-result
import ProfileSection from '../../../features/assessment/assessment-result/components/sections/ProfileSection';
import CareerSection from '../../../features/assessment/assessment-result/components/sections/CareerSection';
import SkillsSection from '../../../features/assessment/assessment-result/components/sections/SkillsSection';
import RoadmapSection from '../../../features/assessment/assessment-result/components/sections/RoadmapSection';

interface AssessmentReportDrawerProps {
  student: any;
  isOpen: boolean;
  onClose: () => void;
  assessmentResult?: any; // Optional: pass the assessment result directly to avoid re-fetching
}

// RIASEC type names and colors
const RIASEC_NAMES: Record<string, string> = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
};

const RIASEC_COLORS: Record<string, string> = {
  R: '#ef4444',
  I: '#8b5cf6',
  A: '#f59e0b',
  S: '#10b981',
  E: '#3b82f6',
  C: '#6366f1',
};

const TRAIT_NAMES: Record<string, string> = {
  O: 'Openness',
  C: 'Conscientiousness',
  E: 'Extraversion',
  A: 'Agreeableness',
  N: 'Neuroticism',
};

const TRAIT_COLORS: Record<string, string> = {
  O: '#8b5cf6',
  C: '#10b981',
  E: '#f59e0b',
  A: '#ec4899',
  N: '#6366f1',
};

// Summary Card Component
const SummaryCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  gradient, 
  data, 
  onClick, 
  delay = 0 
}: {
  title: string;
  subtitle: string;
  icon: any;
  gradient: string;
  data: { label: string; value: string | number }[];
  onClick: () => void;
  delay?: number;
}) => (
  <div
    onClick={onClick}
    className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${gradient}`}></div>
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{title} - {subtitle}</h3>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" />
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-base">
            <span className="text-gray-500 font-medium">{item.label}</span>
            <span className="text-gray-800 font-semibold truncate max-w-[180px]">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center text-indigo-600 font-medium text-base opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
        View Full Details
      </div>
    </div>
  </div>
);

// Report Header Component
const ReportHeader = ({ studentInfo }: { studentInfo: any }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
    <div className="bg-slate-800 p-6 text-white">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-400 text-base font-medium">AI-Powered Assessment</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Career Profiling & Skill Development Report</h1>
          <p className="text-gray-400 mt-1 text-base">AI-Powered Career Assessment</p>
        </div>
      </div>
    </div>

    <div className="p-5 bg-gray-50">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
          <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Student Name</p>
            <p className="font-semibold text-gray-800 text-base">{studentInfo.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
          <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Register No.</p>
            <p className="font-semibold text-gray-800 text-base">{studentInfo.regNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
          <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Programme/Stream</p>
            <p className="font-semibold text-gray-800 text-base">{studentInfo.stream}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
          <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">College</p>
            <p className="font-semibold text-gray-800 text-base truncate max-w-[180px]">{studentInfo.college}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
          <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Assessment Date</p>
            <p className="font-semibold text-gray-800 text-base">{studentInfo.assessmentDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-100">
          <div className="w-11 h-11 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Brain className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Assessor</p>
            <p className="font-semibold text-gray-800 text-base">SkillPassport AI</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AssessmentReportDrawer: React.FC<AssessmentReportDrawerProps> = ({
  student,
  isOpen,
  onClose,
  assessmentResult,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState({
    name: '—',
    regNo: '—',
    college: '—',
    stream: '—',
    assessmentDate: '—',
  });

  useEffect(() => {
    if (isOpen && student?.id) {
      // If assessmentResult is passed directly, use it instead of fetching
      if (assessmentResult?.gemini_results) {
        console.log('Using passed assessment result directly');
        setResults(assessmentResult.gemini_results);
        setStudentInfo({
          name: student?.name || '—',
          regNo: student?.registration_number || '—',
          college: student?.college_name || student?.college || '—',
          stream: assessmentResult?.stream_id?.toUpperCase() || assessmentResult?.stream?.toUpperCase() || '—',
          assessmentDate: assessmentResult?.created_at
            ? new Date(assessmentResult.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '—',
        });
        setLoading(false);
      } else {
        fetchAssessmentResults();
      }
    }
  }, [isOpen, student?.id, assessmentResult]);

  const fetchAssessmentResults = async () => {
    setLoading(true);
    setError(null);

    try {
      // First, get the student's user_id from the students table
      // The student object has 'id' (record ID), but we need 'user_id' for assessment lookup
      let studentUserId = student.user_id;
      
      // If user_id is not in the student object, fetch it from the database
      if (!studentUserId && student.id) {
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', student.id)
          .single();
        
        if (studentError) {
          console.error('Error fetching student user_id:', studentError);
        } else {
          studentUserId = studentData?.user_id;
        }
      }
      
      // Also try with email if user_id is still not found
      if (!studentUserId && student.email) {
        const { data: studentByEmail, error: emailError } = await supabase
          .from('students')
          .select('user_id')
          .eq('email', student.email)
          .single();
        
        if (!emailError && studentByEmail?.user_id) {
          studentUserId = studentByEmail.user_id;
        }
      }
      
      if (!studentUserId) {
        setError('Could not find student user ID. The student may not have a linked account.');
        setLoading(false);
        return;
      }
      
      console.log('Fetching assessment for student user_id:', studentUserId);
      
      // Fetch the latest completed assessment result for this student
      // Note: personal_assessment_results.student_id references students.user_id
      // First try without the join to avoid potential RLS issues
      const { data, error: fetchError } = await supabase
        .from('personal_assessment_results')
        .select('*')
        .eq('student_id', studentUserId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Assessment query result:', { data, fetchError });

      if (fetchError) {
        console.error('Assessment fetch error:', fetchError);
        if (fetchError.code === 'PGRST116') {
          // No rows found - try without status filter
          console.log('No completed assessment, trying without status filter...');
          const { data: anyData, error: anyError } = await supabase
            .from('personal_assessment_results')
            .select('*')
            .eq('student_id', studentUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          console.log('Any assessment result:', { anyData, anyError });
          
          if (anyError || !anyData) {
            setError('No assessment found for this student.');
          } else {
            // Found an assessment but it's not completed
            setError(`Assessment found but status is: ${anyData.status || 'unknown'}`);
          }
        } else {
          setError(`Failed to load assessment: ${fetchError.message}`);
        }
        return;
      }

      // Extract gemini_results which contains the full assessment data
      const geminiResults = data?.gemini_results;
      if (geminiResults) {
        setResults(geminiResults);
      } else {
        setError('Assessment results not available.');
        return;
      }

      // Set student info
      setStudentInfo({
        name: student?.name || '—',
        regNo: student?.registration_number || '—',
        college: student?.college_name || student?.colleges?.name || student?.college || '—',
        stream: data?.stream?.toUpperCase() || '—',
        assessmentDate: data?.created_at
          ? new Date(data.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '—',
      });
    } catch (err) {
      console.error('Error fetching assessment results:', err);
      setError('Failed to load assessment results.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const { riasec, aptitude, knowledge, careerFit, skillGap, roadmap, employability } = results || {};

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-hidden"
        aria-labelledby="slide-over-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={onClose}
          />

          <div className="fixed inset-y-0 right-0 pl-4 sm:pl-10 max-w-full flex">
            <div className="w-screen max-w-4xl">
              <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50 shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 bg-slate-800 border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          Career Assessment Report
                        </h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {student?.name || 'Student'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="bg-white/10 rounded-lg p-2 text-white hover:bg-white/20 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
                        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-white animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Loading Report</h3>
                      <p className="text-gray-500 max-w-xs mx-auto text-center">Fetching assessment results...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                        <AlertCircle className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-3">No Assessment Found</h2>
                      <p className="text-gray-600 text-center mb-6">{error}</p>
                      <button
                        onClick={fetchAssessmentResults}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 shadow-lg"
                      >
                        <RefreshCw className="h-5 w-5" />
                        Try Again
                      </button>
                    </div>
                  ) : results ? (
                    <div className="max-w-4xl mx-auto">
                      {/* Report Header */}
                      <ReportHeader studentInfo={studentInfo} />

                      {/* Summary Grid */}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Assessment Summary</h2>
                        <p className="text-gray-500 text-center mb-6 text-base">Click on any section to view detailed insights</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <SummaryCard
                            title="Profile Snapshot"
                            subtitle="Your core characteristics"
                            icon={Target}
                            gradient="from-indigo-500 to-indigo-600"
                            onClick={() => setActiveSection('profile')}
                            delay={0}
                            data={[
                              { label: 'Top Interest', value: riasec?.topThree?.[0] ? RIASEC_NAMES[riasec.topThree[0]] : 'N/A' },
                              { label: 'Top Aptitude', value: aptitude?.topStrengths?.[0] || 'N/A' },
                              { label: 'Knowledge Score', value: `${knowledge?.score || 0}%` },
                            ]}
                          />

                          <SummaryCard
                            title="Career Fit"
                            subtitle="Best-matching career paths"
                            icon={Briefcase}
                            gradient="from-indigo-500 to-indigo-600"
                            onClick={() => setActiveSection('career')}
                            delay={100}
                            data={[
                              { label: 'Top Cluster', value: careerFit?.clusters?.[0]?.title || 'N/A' },
                              { label: 'Match Score', value: `${careerFit?.clusters?.[0]?.matchScore || 0}%` },
                              { label: 'High Fit Roles', value: careerFit?.specificOptions?.highFit?.length || 0 },
                            ]}
                          />

                          <SummaryCard
                            title="Skill Gap Analysis"
                            subtitle="Areas for development"
                            icon={Zap}
                            gradient="from-indigo-500 to-indigo-600"
                            onClick={() => setActiveSection('skills')}
                            delay={200}
                            data={[
                              { label: 'Priority Skills', value: skillGap?.priorityA?.length || 0 },
                              { label: 'Top Focus', value: skillGap?.priorityA?.[0]?.skill || 'N/A' },
                              { label: 'Learning Track', value: skillGap?.recommendedTrack || 'N/A' },
                            ]}
                          />

                          <SummaryCard
                            title="Action Roadmap"
                            subtitle="Your next 6-12 months"
                            icon={Rocket}
                            gradient="from-indigo-500 to-indigo-600"
                            onClick={() => setActiveSection('roadmap')}
                            delay={300}
                            data={[
                              { label: 'Projects', value: roadmap?.projects?.length || 0 },
                              { label: 'Next Project', value: roadmap?.projects?.[0]?.title || 'N/A' },
                              { label: 'Internship Type', value: roadmap?.internship?.types?.[0] || 'N/A' },
                            ]}
                          />
                        </div>
                      </div>

                      {/* Overall Summary Banner */}
                      {results?.overallSummary && (
                        <div className="bg-slate-800 rounded-2xl p-6 text-white">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                              <Rocket className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xl mb-2">Overall Career Direction</h4>
                              <p className="text-gray-300 leading-relaxed text-base">"{results.overallSummary}"</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={activeSection !== null} onOpenChange={() => setActiveSection(null)}>
        <DialogContent className="w-[95vw] max-w-[1400px] max-h-[95vh] !p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          {/* Header */}
          <DialogHeader className="bg-slate-800 px-8 py-6 relative !mb-0">
            <DialogTitle className="sr-only">
              {activeSection === 'profile' && 'Student Profile Snapshot'}
              {activeSection === 'career' && 'Career Fit Results'}
              {activeSection === 'skills' && 'Skill Gap & Development'}
              {activeSection === 'roadmap' && 'Action Roadmap'}
            </DialogTitle>
            {/* Close Button */}
            <button
              onClick={() => setActiveSection(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-4 pr-12">
              {activeSection === 'profile' && (
                <>
                  <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white">Student Profile Snapshot - Your interests, aptitudes & personality</span>
                </>
              )}
              {activeSection === 'career' && (
                <>
                  <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white">Career Fit Results - Best-matching career paths for you</span>
                </>
              )}
              {activeSection === 'skills' && (
                <>
                  <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white">Skill Gap & Development - Skills to build for career success</span>
                </>
              )}
              {activeSection === 'roadmap' && (
                <>
                  <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white">Action Roadmap - Your 6-12 month career plan</span>
                </>
              )}
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(95vh-100px)] bg-gray-50">
            <div className="p-6 pb-12">
              {activeSection === 'profile' && results && (
                <ProfileSection
                  results={results}
                  riasecNames={RIASEC_NAMES}
                  riasecColors={RIASEC_COLORS}
                  traitNames={TRAIT_NAMES}
                  traitColors={TRAIT_COLORS}
                />
              )}
              {activeSection === 'career' && careerFit && (
                <CareerSection careerFit={careerFit} />
              )}
              {activeSection === 'skills' && skillGap && employability && (
                <SkillsSection 
                  skillGap={skillGap} 
                  employability={employability}
                  skillGapCourses={results?.skillGapCourses || {}}
                />
              )}
              {activeSection === 'roadmap' && roadmap && (
                <RoadmapSection 
                  roadmap={roadmap}
                  platformCourses={results?.platformCourses || []}
                  coursesByType={results?.coursesByType || { technical: [], soft: [] }}
                  skillGapCourses={results?.skillGapCourses || {}}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AssessmentReportDrawer;
