import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Send,
  Eye,
  ClipboardList,
  UserCheck,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examinationService } from "../../../services/college";
import { assessmentService } from "../../../services/college/assessmentService";
import { markEntryService } from "../../../services/college/markEntryService";
import { transcriptService } from "../../../services/college/transcriptService";
import { departmentService } from "../../../services/college/departmentService";
import { supabase } from "../../../lib/supabaseClient";
import AssessmentFormModal from "./components/AssessmentFormModal";
import TimetableScheduler from "./components/TimetableScheduler";
import MarkEntryGrid from "./components/MarkEntryGrid";
import ModerationPanel from "./components/ModerationPanel";
import InvigilatorAssignment from "./components/InvigilatorAssignment";
import TranscriptForm from "./components/TranscriptForm";
import type { Assessment, ExamSlot, MarkEntry, Transcript } from "../../../types/college";

const ExaminationManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("assessments");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Modal states
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showMarkEntryModal, setShowMarkEntryModal] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [showInvigilatorModal, setShowInvigilatorModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [selectedAssessmentForAction, setSelectedAssessmentForAction] = useState<Assessment | null>(null);

  // Get current user's college
  const [collegeId, setCollegeId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserCollege = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('metadata')
          .eq('id', user.id)
          .single();
        
        if (userData?.metadata?.college_id) {
          setCollegeId(userData.metadata.college_id);
        }
      }
    };
    fetchUserCollege();
  }, []);

  // Fetch assessments from database
  const { data: assessments = [], isLoading: loading, error: assessmentsError } = useQuery({
    queryKey: ['assessments', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('college_id', collegeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code')
        .eq('college_id', collegeId)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId
  });

  // Fetch programs
  const { data: programs = [] } = useQuery({
    queryKey: ['programs', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, code, department_id')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId
  });

  // Fetch courses from curriculum_courses
  const { data: courses = [] } = useQuery({
    queryKey: ['curriculum_courses', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('curriculum_courses')
        .select('id, course_name, course_code, semester, course_type, credits')
        .eq('is_active', true)
        .order('semester', { ascending: true })
        .order('course_name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId
  });

  // Fetch exam slots
  const { data: examSlots = [] } = useQuery({
    queryKey: ['examSlots', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_timetable')
        .select('*')
        .order('exam_date');
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId
  });

  // Fetch mark entries
  const { data: markEntries = [] } = useQuery({
    queryKey: ['markEntries', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mark_entries')
        .select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId
  });

  // Fetch transcripts
  const { data: transcripts = [] } = useQuery({
    queryKey: ['transcripts', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId
  });

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ['students', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, roll_number, name, email, phone, department_id, program_id, semester, college_id')
        .eq('college_id', collegeId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId
  });

  // Fetch faculty
  const { data: faculty = [] } = useQuery({
    queryKey: ['faculty', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('college_lecturers')
        .select('*, users!inner(firstName, lastName, email)')
        .eq('collegeId', collegeId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId
  });

  const error = assessmentsError?.message || null;

  // Filter assessments based on current filters
  const filteredAssessments = assessments.filter((assessment: any) => {
    if (typeFilter && assessment.type !== typeFilter) return false;
    if (statusFilter && assessment.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        assessment.type?.toLowerCase().includes(search) ||
        assessment.academic_year?.toLowerCase().includes(search) ||
        assessment.course_name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleCreateAssessment = () => {
    setSelectedAssessment(null);
    setIsModalOpen(true);
  };

  const handleEditAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsModalOpen(true);
  };

  // Mutations
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: Partial<Assessment>) => {
      // Get course details
      const course = courses.find(c => c.id === data.course_id);
      
      // Generate assessment_code (auto-generated if not provided)
      const courseCode = course?.course_code || 'EXAM';
      const typeCode = (data.type || 'IA').substring(0, 3).toUpperCase();
      const year = data.academic_year?.split('-')[0] || new Date().getFullYear();
      const autoGeneratedCode = `${typeCode}-${courseCode.toUpperCase()}-S${data.semester}-${year}`;

      // Use user-provided assessment_code or default to auto-generated
      const assessmentCode = data.assessment_code || autoGeneratedCode;

      // Check if assessment with same code already exists (globally unique)
      const { data: existingAssessment } = await supabase
        .from('assessments')
        .select('id, assessment_code')
        .eq('assessment_code', assessmentCode)
        .maybeSingle();

      if (existingAssessment) {
        throw new Error(`Assessment with code "${assessmentCode}" already exists. Please use a different code or leave empty for auto-generation.`);
      }

      // Remove id from data to let database auto-generate it
      const { id, ...dataWithoutId } = data as any;

      const { data: result, error } = await supabase
        .from('assessments')
        .insert([{ 
          ...dataWithoutId, 
          assessment_code: assessmentCode,
          course_name: course?.course_name || '',
          course_code: course?.course_code || '',
          college_id: collegeId 
        }])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setIsModalOpen(false);
      toast.success('Assessment created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assessment');
    }
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Assessment> }) => {
      // Get course details if course_id is being updated or if we need to regenerate code
      const course = data.course_id ? courses.find(c => c.id === data.course_id) : null;
      
      // Get current assessment to merge with updates
      const currentAssessment = assessments.find(a => a.id === id);
      const mergedData = { ...currentAssessment, ...data };
      
      // Regenerate assessment_code if type, course, semester, or academic_year changed
      let assessmentCode = data.assessment_code || currentAssessment?.assessment_code;
      
      if (data.type || data.course_id || data.semester || data.academic_year) {
        const courseCode = course?.course_code || currentAssessment?.course_code || 'EXAM';
        const year = (data.academic_year || currentAssessment?.academic_year)?.split('-')[0] || new Date().getFullYear();
        const semester = data.semester || currentAssessment?.semester || 1;
        const type = data.type || currentAssessment?.type || 'IA';
        
        const typeCode = type.substring(0, 3).toUpperCase();
        assessmentCode = `${typeCode}-${courseCode.toUpperCase()}-S${semester}-${year}`;

        // Check if another assessment with same code exists (excluding current one)
        const { data: existingCode } = await supabase
          .from('assessments')
          .select('id, assessment_code')
          .eq('assessment_code', assessmentCode)
          .neq('id', id)
          .maybeSingle();

        if (existingCode) {
          throw new Error(`Assessment with code "${assessmentCode}" already exists.`);
        }
      }
      
      // Check if custom assessment_code conflicts
      if (data.assessment_code && data.assessment_code !== currentAssessment?.assessment_code) {
        const { data: existingAssessment } = await supabase
          .from('assessments')
          .select('id, assessment_code')
          .eq('assessment_code', data.assessment_code)
          .neq('id', id)
          .maybeSingle();

        if (existingAssessment) {
          throw new Error(`Assessment with code "${data.assessment_code}" already exists.`);
        }
      }

      const updateData: any = { ...data };
      if (assessmentCode) {
        updateData.assessment_code = assessmentCode;
      }
      if (course) {
        updateData.course_name = course.course_name;
        updateData.course_code = course.course_code;
      }

      const { data: result, error } = await supabase
        .from('assessments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setIsModalOpen(false);
      toast.success('Assessment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update assessment');
    }
  });

  const handleSubmitAssessment = async (data: Partial<Assessment>) => {
    try {
      if (selectedAssessment) {
        await updateAssessmentMutation.mutateAsync({ id: selectedAssessment.id, data });
      } else {
        await createAssessmentMutation.mutateAsync(data);
      }
      return { success: true };
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSubmitToExamCell = async (id: string) => {
    if (confirm('Submit this assessment to exam cell for approval?')) {
      try {
        await updateAssessmentMutation.mutateAsync({ 
          id, 
          data: { status: 'scheduled' } 
        });
        toast.success('Assessment submitted successfully');
      } catch (error: any) {
        toast.error('Error submitting assessment: ' + error.message);
      }
    }
  };

  // Timetable handlers
  const handleScheduleTimetable = (assessment: Assessment) => {
    setSelectedAssessmentForAction(assessment);
    setShowTimetableModal(true);
  };

  const handleSaveSchedule = async (slots: Partial<ExamSlot>[]) => {
    try {
      // Get the assessment details to populate required fields
      const assessment = selectedAssessmentForAction;
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Enrich slots with required fields from assessment
      const enrichedSlots = slots.map(slot => ({
        ...slot,
        assessment_id: assessment.id,
        course_id: assessment.course_id,
        course_name: assessment.course_name || 'Exam',
        course_code: assessment.course_code || assessment.assessment_code,
        duration_minutes: assessment.duration_minutes || 180,
        status: 'scheduled'
      }));

      const { data, error } = await supabase
        .from('exam_timetable')
        .insert(enrichedSlots)
        .select();
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['examSlots'] });
      setShowTimetableModal(false);
      toast.success('Exam timetable scheduled successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to schedule exam: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  // Mark entry handlers
  const handleOpenMarkEntry = (assessment: Assessment) => {
    setSelectedAssessmentForAction(assessment);
    setShowMarkEntryModal(true);
  };

  const handleSaveMarks = async (marks: Partial<MarkEntry>[]) => {
    try {
      const { data, error } = await supabase
        .from('mark_entries')
        .upsert(marks, { onConflict: 'assessment_id,student_id' })
        .select();
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['markEntries'] });
      return { success: true };
    } catch (error: any) {
      console.error('Error saving marks:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSubmitMarks = async () => {
    try {
      // Mark entries as submitted/locked
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Moderation handlers
  const handleOpenModeration = (assessment: Assessment) => {
    setSelectedAssessmentForAction(assessment);
    setShowModerationModal(true);
  };

  const handleModerate = async (entryId: string, newMarks: number, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('mark_entries')
        .update({
          marks_obtained: newMarks,
          moderated_by: user?.id,
          moderation_reason: reason,
          moderation_date: new Date().toISOString()
        })
        .eq('id', entryId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['markEntries'] });
      return { success: true };
    } catch (error: any) {
      console.error('Error moderating marks:', error);
      return { success: false, error: error.message };
    }
  };

  const handleApproveMarks = async () => {
    try {
      // Implement mark approval logic
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Invigilator handlers
  const handleOpenInvigilators = (assessment: Assessment) => {
    setSelectedAssessmentForAction(assessment);
    setShowInvigilatorModal(true);
  };

  const handleAssignInvigilator = async (slotId: string, facultyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await examinationService.assignInvigilator({
        exam_timetable_id: slotId,
        invigilator_id: facultyId,
        invigilator_name: faculty.find(f => f.id === facultyId)?.users?.firstName || '',
        invigilator_type: 'regular',
        duty_date: new Date().toISOString().split('T')[0],
        duty_start_time: '09:00',
        duty_end_time: '12:00',
        assigned_by: user?.id
      });
      
      queryClient.invalidateQueries({ queryKey: ['examSlots'] });
      return { success: true };
    } catch (error: any) {
      console.error('Error assigning invigilator:', error);
      return { success: false, error: error.message };
    }
  };

  const handleRemoveInvigilator = async (slotId: string, facultyId: string) => {
    try {
      const { error } = await supabase
        .from('invigilator_assignments')
        .delete()
        .eq('exam_timetable_id', slotId)
        .eq('invigilator_id', facultyId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['examSlots'] });
      return { success: true };
    } catch (error: any) {
      console.error('Error removing invigilator:', error);
      return { success: false, error: error.message };
    }
  };

  // Transcript handlers
  const handleGenerateTranscript = async (data: Partial<Transcript>) => {
    try {
      const verificationId = `TR${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const { data: transcript, error } = await supabase
        .from('transcripts')
        .insert([{
          ...data,
          verification_id: verificationId,
          status: 'draft',
          generated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['transcripts'] });
      setShowTranscriptModal(false);
      return { success: true, data: transcript };
    } catch (error: any) {
      console.error('Error generating transcript:', error);
      return { success: false, error: error.message };
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      ongoing: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      IA: 'bg-purple-100 text-purple-700',
      end_semester: 'bg-indigo-100 text-indigo-700',
      practical: 'bg-teal-100 text-teal-700',
      viva: 'bg-pink-100 text-pink-700',
      arrears: 'bg-orange-100 text-orange-700',
    };
    return styles[type as keyof typeof styles] || styles.IA;
  };

  const tabs = [
    { id: "assessments", label: "Assessments & Examinations" },
    { id: "transcripts", label: "Transcripts" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Examination Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage syllabus, assessments, exams, and transcripts
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "assessments" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Examinations & Results ({filteredAssessments.length})
              </h2>
              <button 
                onClick={handleCreateAssessment}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Create Assessment
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Assessments</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                    {error.includes('406') || error.includes('relation') ? (
                      <p className="mt-2 text-sm text-red-700">
                        Please run the database migration. See <code className="bg-red-100 px-1 rounded">setup-college-dashboard.sql</code>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="IA">Internal Assessment</option>
                <option value="end_semester">End Semester</option>
                <option value="practical">Practical</option>
                <option value="viva">Viva</option>
                <option value="arrears">Arrears</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No assessments found</p>
                <button
                  onClick={handleCreateAssessment}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first assessment
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Academic Year
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Semester
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Marks
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAssessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(assessment.type)}`}>
                            {assessment.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {assessment.academic_year}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          Semester {assessment.semester}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {assessment.duration_minutes} min
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {assessment.total_marks} ({assessment.pass_marks} to pass)
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(assessment.status)}`}>
                            {assessment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleEditAssessment(assessment)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit assessment"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {assessment.status === 'draft' && (
                              <button 
                                onClick={() => handleSubmitToExamCell(assessment.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Submit to exam cell"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleScheduleTimetable(assessment)}
                              className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                              title="Schedule timetable"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenInvigilators(assessment)}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Assign invigilators"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenMarkEntry(assessment)}
                              className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                              title="Enter marks"
                            >
                              <ClipboardList className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenModeration(assessment)}
                              className="p-1 text-pink-600 hover:bg-pink-50 rounded"
                              title="Moderate marks"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "transcripts" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Transcript Generation</h2>
              <button 
                onClick={() => setShowTranscriptModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="h-4 w-4" />
                Generate Transcript
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Generated Transcripts ({transcripts.length})</h3>
                <p className="text-sm text-blue-700">
                  View and manage all generated transcripts. Click "Generate Transcript" to create a new one.
                </p>
              </div>

              {transcripts.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Semesters</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Verification ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transcripts.map((transcript) => {
                        const student = students.find((s: any) => s.id === transcript.student_id);
                        return (
                          <tr key={transcript.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {student?.roll_number} - {student?.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                              {transcript.type}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              Sem {transcript.semester_from} - {transcript.semester_to}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-600">
                              {transcript.verification_id}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                transcript.status === 'published' ? 'bg-green-100 text-green-700' :
                                transcript.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {transcript.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Download
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AssessmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitAssessment}
        assessment={selectedAssessment}
        departments={departments}
        programs={programs}
        courses={courses}
      />

      {selectedAssessmentForAction && (
        <>
          <TimetableScheduler
            isOpen={showTimetableModal}
            onClose={() => setShowTimetableModal(false)}
            assessmentId={selectedAssessmentForAction.id}
            onSchedule={handleSaveSchedule}
            existingSlots={examSlots.filter(s => s.assessment_id === selectedAssessmentForAction.id)}
          />

          <MarkEntryGrid
            isOpen={showMarkEntryModal}
            onClose={() => setShowMarkEntryModal(false)}
            assessmentId={selectedAssessmentForAction.id}
            assessmentName={`${selectedAssessmentForAction.type} - Semester ${selectedAssessmentForAction.semester}`}
            totalMarks={selectedAssessmentForAction.total_marks}
            students={students}
            existingMarks={markEntries.filter((m: any) => m.assessment_id === selectedAssessmentForAction.id)}
            onSave={handleSaveMarks}
            onSubmit={handleSubmitMarks}
          />

          <ModerationPanel
            isOpen={showModerationModal}
            onClose={() => setShowModerationModal(false)}
            assessmentName={`${selectedAssessmentForAction.type} - Semester ${selectedAssessmentForAction.semester}`}
            totalMarks={selectedAssessmentForAction.total_marks}
            markEntries={markEntries.filter((m: any) => m.assessment_id === selectedAssessmentForAction.id)}
            onModerate={handleModerate}
            onApprove={handleApproveMarks}
          />

          <InvigilatorAssignment
            isOpen={showInvigilatorModal}
            onClose={() => setShowInvigilatorModal(false)}
            examSlots={examSlots.filter((s: any) => s.assessment_id === selectedAssessmentForAction.id)}
            availableFaculty={faculty}
            onAssign={handleAssignInvigilator}
            onRemove={handleRemoveInvigilator}
          />
        </>
      )}

      {activeTab === "transcripts" && (
        <TranscriptForm
          isOpen={showTranscriptModal}
          onClose={() => setShowTranscriptModal(false)}
          onGenerate={handleGenerateTranscript}
          students={students}
          departments={departments}
        />
      )}
    </div>
  );
};

export default ExaminationManagement;
