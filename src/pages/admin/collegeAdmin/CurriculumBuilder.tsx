/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// Import the college-adapted curriculum builder UI
import CollegeCurriculumBuilderUI from '../../../components/admin/collegeAdmin/CollegeCurriculumBuilderUI';
import { curriculumService, type CollegeCurriculum, type CurriculumUnit, type CurriculumOutcome } from '../../../services/college/curriculumService';

const CollegeCurriculumBuilder: React.FC = () => {
  // Context selections
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Configuration data from database
  const [courses, setCourses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<number[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<any[]>([]);

  // Current curriculum data
  const [curriculumId, setCurriculumId] = useState<string | null>(null);
  const [currentCurriculum, setCurrentCurriculum] = useState<CollegeCurriculum | null>(null);
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<CurriculumOutcome[]>([]);
  const [status, setStatus] = useState<"draft" | "pending_approval" | "approved" | "rejected">("draft");
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [assessmentTypesLoading, setAssessmentTypesLoading] = useState(false);

  // Load configuration data on mount
  useEffect(() => {
    loadConfigurationData();
  }, []);

  // Load programs when department changes
  useEffect(() => {
    if (selectedDepartment) {
      loadPrograms(selectedDepartment);
    } else {
      setPrograms([]);
      setSelectedProgram(''); // Reset program selection
    }
  }, [selectedDepartment]);

  // Load semesters when program changes
  useEffect(() => {
    if (selectedProgram) {
      loadSemesters(selectedProgram);
    } else {
      setSemesters([]);
      setSelectedSemester(''); // Reset semester selection
    }
  }, [selectedProgram]);

  // Load courses when program and semester change
  useEffect(() => {
    if (selectedProgram && selectedSemester) {
      loadCourses(selectedProgram, parseInt(selectedSemester));
    } else {
      setCourses([]);
      setSelectedCourse(''); // Reset course selection
    }
  }, [selectedProgram, selectedSemester]);

  // Load or create curriculum when context is complete
  useEffect(() => {
    if (selectedDepartment && selectedProgram && selectedSemester && selectedAcademicYear && selectedCourse) {
      loadOrCreateCurriculum();
    } else {
      // Clear curriculum data when context is incomplete
      setCurriculumId(null);
      setCurrentCurriculum(null);
      setUnits([]);
      setLearningOutcomes([]);
      setStatus("draft");
      setRejectionReason(undefined);
    }
  }, [selectedDepartment, selectedProgram, selectedSemester, selectedAcademicYear, selectedCourse]);

  const loadConfigurationData = async () => {
    try {
      setLoading(true);

      // Load departments
      const deptResult = await curriculumService.getDepartments();
      if (deptResult.success) {
        setDepartments(deptResult.data || []);
      } else {
        toast.error('Failed to load departments');
      }

      // Load assessment types
      setAssessmentTypesLoading(true);
      console.log('🔄 Loading assessment types...');
      const assessmentResult = await curriculumService.getAssessmentTypes();
      console.log('📋 Assessment types result:', assessmentResult);
      
      if (assessmentResult.success) {
        setAssessmentTypes(assessmentResult.data || []);
        console.log('✅ Assessment types loaded:', assessmentResult.data?.length);
      } else {
        console.error('❌ Failed to load assessment types:', assessmentResult.error);
        toast.error('Failed to load assessment types');
      }
      setAssessmentTypesLoading(false);

      // Load academic years
      const years = curriculumService.getAcademicYears();
      setAcademicYears(years);
      
      // Auto-select current academic year
      const currentYear = years.find(year => {
        const startYear = parseInt(year.split('-')[0]);
        const now = new Date();
        const currentYearNum = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 0-based to 1-based
        
        // Academic year typically starts in July/August
        if (currentMonth >= 7) {
          return startYear === currentYearNum;
        } else {
          return startYear === currentYearNum - 1;
        }
      });
      
      if (currentYear) {
        setSelectedAcademicYear(currentYear);
      }

    } catch (error: any) {
      console.error('Error loading configuration:', error);
      toast.error('Failed to load configuration data');
      setAssessmentTypesLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async (departmentId: string) => {
    try {
      const result = await curriculumService.getPrograms(departmentId);
      if (result.success) {
        setPrograms(result.data || []);
      } else {
        toast.error('Failed to load programs');
        setPrograms([]);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
      toast.error('Failed to load programs');
      setPrograms([]);
    }
  };

  const loadSemesters = async (programId: string) => {
    try {
      const result = await curriculumService.getSemesters(programId);
      if (result.success) {
        setSemesters(result.data || []);
      } else {
        toast.error('Failed to load semesters');
        setSemesters([]);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
      toast.error('Failed to load semesters');
      setSemesters([]);
    }
  };

  const loadCourses = async (programId: string, semester: number) => {
    try {
      const result = await curriculumService.getCourses(programId, semester);
      if (result.success) {
        setCourses(result.data || []);
      } else {
        toast.error('Failed to load courses');
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
      setCourses([]);
    }
  };

  const loadOrCreateCurriculum = async () => {
    if (!selectedDepartment || !selectedProgram || !selectedSemester || !selectedAcademicYear || !selectedCourse) {
      return;
    }

    try {
      setLoading(true);

      // Get the selected course details
      const selectedCourseData = courses.find(c => c.id === selectedCourse);
      if (!selectedCourseData) {
        toast.error('Selected course not found');
        return;
      }

      // Try to find existing curriculum
      const result = await curriculumService.getCurriculums({
        department_id: selectedDepartment,
        program_id: selectedProgram,
        semester: parseInt(selectedSemester),
        academic_year: selectedAcademicYear,
      });

      if (result.success && result.data) {
        // Find curriculum with matching course
        const existingCurriculum = result.data.find(c => 
          c.course_code === selectedCourseData.course_code && c.course_name === selectedCourseData.course_name
        );

        if (existingCurriculum) {
          // Load existing curriculum
          const detailResult = await curriculumService.getCurriculumById(existingCurriculum.id);
          if (detailResult.success && detailResult.data) {
            setCurriculumId(detailResult.data.id);
            setCurrentCurriculum(detailResult.data);
            setUnits(detailResult.data.units);
            setLearningOutcomes(detailResult.data.outcomes);
            setStatus(detailResult.data.status);
            setRejectionReason(detailResult.data.rejection_reason);
            toast.success('Curriculum loaded successfully');
          }
        } else {
          // Create new curriculum
          await createNewCurriculum(selectedCourseData.course_code, selectedCourseData.course_name);
        }
      } else {
        // Create new curriculum
        await createNewCurriculum(selectedCourseData.course_code, selectedCourseData.course_name);
      }
    } catch (error: any) {
      console.error('Error loading curriculum:', error);
      toast.error('Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  const createNewCurriculum = async (courseCode: string, courseName: string) => {
    try {
      const result = await curriculumService.createCurriculum({
        department_id: selectedDepartment,
        program_id: selectedProgram,
        course_code: courseCode,
        course_name: courseName,
        semester: parseInt(selectedSemester),
        academic_year: selectedAcademicYear,
      });

      if (result.success && result.data) {
        setCurriculumId(result.data.id);
        setCurrentCurriculum(result.data);
        setUnits([]);
        setLearningOutcomes([]);
        setStatus(result.data.status);
        setRejectionReason(undefined);
        toast.success('New curriculum created');
      } else {
        toast.error(result.error?.message || 'Failed to create curriculum');
      }
    } catch (error: any) {
      console.error('Error creating curriculum:', error);
      toast.error('Failed to create curriculum');
    }
  };

  // Unit handlers
  const handleAddUnit = async (unit: any) => {
    if (!curriculumId) {
      toast.error('Please select curriculum context first');
      return;
    }

    try {
      setSaveStatus("saving");
      
      if (unit.id && units.find(u => u.id === unit.id)) {
        // Update existing unit
        const result = await curriculumService.updateUnit(unit.id, {
          name: unit.name,
          code: unit.code,
          description: unit.description,
          credits: unit.credits,
          estimated_duration: unit.estimatedDuration,
          duration_unit: unit.durationUnit,
        });

        if (result.success && result.data) {
          setUnits(prev => prev.map(u => u.id === unit.id ? result.data! : u));
          toast.success('Unit updated successfully');
        } else {
          toast.error(result.error?.message || 'Failed to update unit');
        }
      } else {
        // Create new unit
        const result = await curriculumService.addUnit({
          curriculum_id: curriculumId,
          name: unit.name,
          code: unit.code,
          description: unit.description,
          credits: unit.credits,
          estimated_duration: unit.estimatedDuration,
          duration_unit: unit.durationUnit,
        });

        if (result.success && result.data) {
          setUnits(prev => [...prev, result.data!]);
          toast.success('Unit added successfully');
        } else {
          toast.error(result.error?.message || 'Failed to add unit');
        }
      }
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      console.error('Error saving unit:', error);
      toast.error('Failed to save unit');
      setSaveStatus("idle");
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this unit? All associated learning outcomes will also be deleted.')) {
      return;
    }
    
    try {
      setSaveStatus("saving");
      
      const result = await curriculumService.deleteUnit(id);
      if (result.success) {
        setUnits(prev => prev.filter(u => u.id !== id));
        setLearningOutcomes(prev => prev.filter(lo => lo.unit_id !== id));
        toast.success('Unit deleted successfully');
      } else {
        toast.error(result.error?.message || 'Failed to delete unit');
      }
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      console.error('Error deleting unit:', error);
      toast.error('Failed to delete unit');
      setSaveStatus("idle");
    }
  };

  const handleAddOutcome = async (outcome: any) => {
    if (!curriculumId) {
      toast.error('Please select curriculum context first');
      return;
    }

    try {
      setSaveStatus("saving");
      
      if (outcome.id && learningOutcomes.find(lo => lo.id === outcome.id)) {
        // Update existing outcome
        const result = await curriculumService.updateOutcome(outcome.id, {
          unit_id: outcome.unitId,
          outcome_text: outcome.outcome,
          bloom_level: outcome.bloomLevel,
          assessment_mappings: outcome.assessmentMappings,
        });

        if (result.success && result.data) {
          setLearningOutcomes(prev => prev.map(lo => lo.id === outcome.id ? result.data! : lo));
          toast.success('Learning outcome updated successfully');
        } else {
          toast.error(result.error?.message || 'Failed to update outcome');
        }
      } else {
        // Create new outcome
        const result = await curriculumService.addOutcome({
          curriculum_id: curriculumId,
          unit_id: outcome.unitId,
          outcome_text: outcome.outcome,
          bloom_level: outcome.bloomLevel,
          assessment_mappings: outcome.assessmentMappings,
        });

        if (result.success && result.data) {
          setLearningOutcomes(prev => [...prev, result.data!]);
          toast.success('Learning outcome added successfully');
        } else {
          toast.error(result.error?.message || 'Failed to add outcome');
        }
      }
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      console.error('Error saving outcome:', error);
      toast.error('Failed to save outcome');
      setSaveStatus("idle");
    }
  };

  const handleDeleteOutcome = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this learning outcome?')) {
      return;
    }
    
    try {
      setSaveStatus("saving");
      
      const result = await curriculumService.deleteOutcome(id);
      if (result.success) {
        setLearningOutcomes(prev => prev.filter(lo => lo.id !== id));
        toast.success('Learning outcome deleted successfully');
      } else {
        toast.error(result.error?.message || 'Failed to delete outcome');
      }
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      console.error('Error deleting outcome:', error);
      toast.error('Failed to delete outcome');
      setSaveStatus("idle");
    }
  };

  const handleSubmitForApproval = async () => {
    if (!curriculumId) {
      toast.error('No curriculum to publish');
      return;
    }

    const confirmMessage = "Are you sure you want to publish this curriculum? It will be immediately available to students and faculty.";
    if (!window.confirm(confirmMessage)) return;
    
    try {
      setSaveStatus("saving");
      
      // College admin directly approves the curriculum
      const result = await curriculumService.approveCurriculum(curriculumId);
      if (result.success) {
        setStatus("approved");
        toast.success('Curriculum published successfully! It is now active and available to students and faculty.');
      } else {
        toast.error(result.error?.message || 'Failed to publish curriculum');
      }
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      console.error('Error publishing curriculum:', error);
      toast.error('Failed to publish curriculum');
      setSaveStatus("idle");
    }
  };

  const handleApprove = async () => {
    if (!curriculumId) return;
    
    if (!window.confirm('Approve this curriculum?')) return;
    
    try {
      setSaveStatus("saving");
      
      const result = await curriculumService.approveCurriculum(curriculumId);
      if (result.success) {
        setStatus("approved");
        toast.success('Curriculum approved successfully!');
      } else {
        toast.error(result.error?.message || 'Failed to approve curriculum');
      }
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      console.error('Error approving curriculum:', error);
      toast.error('Failed to approve curriculum');
      setSaveStatus("idle");
    }
  };

  const handleReject = async () => {
    if (!curriculumId) return;
    
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      setSaveStatus("saving");
      
      const result = await curriculumService.rejectCurriculum(curriculumId, reason);
      if (result.success) {
        setStatus("rejected");
        setRejectionReason(reason);
        toast.success('Curriculum rejected. Faculty will be notified.');
      } else {
        toast.error(result.error?.message || 'Failed to reject curriculum');
      }
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      console.error('Error rejecting curriculum:', error);
      toast.error('Failed to reject curriculum');
      setSaveStatus("idle");
    }
  };

  // Generate course options from database
  const courseOptions = courses.map(course => ({
    id: course.id,
    value: course.id,
    label: `${course.course_code} - ${course.course_name}`,
    code: course.course_code,
    name: course.course_name,
    credits: course.credits,
    type: course.type,
  }));

  // Transform units for UI (add order property)
  const transformedUnits = units.map(unit => ({
    id: unit.id,
    name: unit.name,
    code: unit.code,
    description: unit.description,
    order: unit.order_index,
    estimatedDuration: unit.estimated_duration,
    durationUnit: unit.duration_unit as 'hours' | 'weeks' | undefined,
    credits: unit.credits ? Number(unit.credits) : undefined,
  }));

  // Transform outcomes for UI
  const transformedOutcomes = learningOutcomes.map(outcome => ({
    id: outcome.id,
    unitId: outcome.unit_id,
    outcome: outcome.outcome_text,
    bloomLevel: outcome.bloom_level,
    assessmentMappings: outcome.assessment_mappings,
  }));

  return (
    <CollegeCurriculumBuilderUI
      // College-specific selections
      selectedCourse={selectedCourse}
      setSelectedCourse={setSelectedCourse}
      selectedDepartment={selectedDepartment}
      setSelectedDepartment={setSelectedDepartment}
      selectedProgram={selectedProgram}
      setSelectedProgram={setSelectedProgram}
      selectedSemester={selectedSemester}
      setSelectedSemester={setSelectedSemester}
      selectedAcademicYear={selectedAcademicYear}
      setSelectedAcademicYear={setSelectedAcademicYear}
      // Configuration data
      courses={courseOptions}
      departments={departments.map(d => ({ id: d.id, name: d.name }))}
      programs={programs.map(p => ({ id: p.id, name: p.name }))}
      semesters={semesters.map(s => s.toString())}
      academicYears={academicYears}
      // Current data
      curriculumId={curriculumId}
      units={transformedUnits}
      learningOutcomes={transformedOutcomes}
      assessmentTypes={assessmentTypes.map(at => ({ id: at.id, name: at.name, description: at.description }))}
      status={status}
      rejectionReason={rejectionReason}
      loading={loading}
      saveStatus={saveStatus}
      // Search
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      // Handlers
      onAddUnit={handleAddUnit}
      onDeleteUnit={handleDeleteUnit}
      onAddOutcome={handleAddOutcome}
      onDeleteOutcome={handleDeleteOutcome}
      onSubmitForApproval={handleSubmitForApproval}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
};

export default CollegeCurriculumBuilder;
