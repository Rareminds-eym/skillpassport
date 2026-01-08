/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Import the college lesson plan UI
import CollegeLessonPlanUI from '../../../components/admin/collegeAdmin/CollegeLessonPlanUI';
import { lessonPlanService, type CollegeLessonPlan } from '../../../services/college/lessonPlanService';

/**
 * CollegeLessonPlans - Lesson plan management for college faculty
 * 
 * Follows the same pattern as CurriculumBuilder with department → program → semester → course flow
 */
const CollegeLessonPlans: React.FC = () => {
  // Local state for college-specific selections
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

  // Current lesson plan data
  const [lessonPlans, setLessonPlans] = useState<CollegeLessonPlan[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<any[]>([]);
  const [currentCurriculumId, setCurrentCurriculumId] = useState<string | undefined>(undefined);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

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
      setSelectedProgram('');
    }
  }, [selectedDepartment]);

  // Load semesters when program changes
  useEffect(() => {
    if (selectedProgram) {
      loadSemesters(selectedProgram);
    } else {
      setSemesters([]);
      setSelectedSemester('');
    }
  }, [selectedProgram]);

  // Load courses when program and semester change
  useEffect(() => {
    if (selectedProgram && selectedSemester) {
      loadCourses(selectedProgram, parseInt(selectedSemester));
    } else {
      setCourses([]);
      setSelectedCourse('');
    }
  }, [selectedProgram, selectedSemester]);

  // Load lesson plans when filters change
  useEffect(() => {
    loadLessonPlans();
  }, [selectedDepartment, selectedProgram, selectedCourse, selectedSemester, selectedAcademicYear]);

  const loadConfigurationData = async () => {
    try {
      setLoading(true);

      // Load departments
      const deptResult = await lessonPlanService.getDepartments();
      if (deptResult.success) {
        setDepartments(deptResult.data || []);
      } else {
        toast.error('Failed to load departments');
      }

      // Load academic years
      const years = lessonPlanService.getAcademicYears();
      setAcademicYears(years);
      
      // Auto-select current academic year
      const currentYear = years.find(year => {
        const startYear = parseInt(year.split('-')[0]);
        const now = new Date();
        const currentYearNum = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
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
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async (departmentId: string) => {
    try {
      const result = await lessonPlanService.getPrograms(departmentId);
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
      const result = await lessonPlanService.getSemesters(programId);
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
      const result = await lessonPlanService.getCourses(programId, semester);
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

  const loadLessonPlans = async () => {
    try {
      setLoading(true);
      
      const filters: any = {};
      if (selectedDepartment) filters.department_id = selectedDepartment;
      if (selectedProgram) filters.program_id = selectedProgram;
      if (selectedCourse) filters.course_id = selectedCourse;
      if (selectedSemester) filters.semester = parseInt(selectedSemester);
      if (selectedAcademicYear) filters.academic_year = selectedAcademicYear;

      const result = await lessonPlanService.getLessonPlans(filters);
      if (result.success) {
        setLessonPlans(result.data || []);
      } else {
        toast.error('Failed to load lesson plans');
        setLessonPlans([]);
      }
    } catch (error) {
      console.error('Error loading lesson plans:', error);
      toast.error('Failed to load lesson plans');
      setLessonPlans([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler for department change in form
  const handleDepartmentChange = async (departmentId: string) => {
    console.log('🔄 Department changed to:', departmentId);
    
    if (departmentId) {
      const result = await lessonPlanService.getPrograms(departmentId);
      if (result.success) {
        return {
          programs: result.data || [],
          courses: [], // Courses will be loaded after program selection
        };
      }
    }
    
    return {
      programs: [],
      courses: [],
    };
  };

  // Handler for program change in form
  const handleProgramChange = async (programId: string) => {
    console.log('🔄 Program changed to:', programId);
    
    if (programId) {
      const semesterResult = await lessonPlanService.getSemesters(programId);
      if (semesterResult.success) {
        // Update the semesters state for the form
        setSemesters(semesterResult.data || []);
        return {
          semesters: (semesterResult.data || []).map(s => s.toString()),
          courses: [], // Courses will be loaded after semester selection
        };
      }
    }
    
    return {
      semesters: [],
      courses: [],
    };
  };

  // Handler for semester change in form
  const handleSemesterChange = async (semester: string, programId: string) => {
    console.log('🔄 Semester changed to:', semester, 'for program:', programId);
    
    if (semester && programId) {
      const result = await lessonPlanService.getCourses(programId, parseInt(semester));
      if (result.success) {
        return {
          courses: result.data || [],
        };
      }
    }
    
    return {
      courses: [],
    };
  };

  // Handler for curriculum context change (course + program + academic year)
  const handleCurriculumContextChange = async (courseId: string, programId: string, academicYear: string) => {
    console.log('🔄 Curriculum context changed:', { courseId, programId, academicYear });
    
    if (courseId && programId && academicYear) {
      try {
        // Load curriculum units
        const unitsResult = await lessonPlanService.getCurriculumUnits(courseId, programId, academicYear);
        if (unitsResult.success) {
          setUnits(unitsResult.data || []);
          setCurrentCurriculumId(unitsResult.curriculumId);
          console.log('📚 Loaded curriculum:', unitsResult.curriculumId, 'with', unitsResult.data?.length, 'units');
          
          // Clear learning outcomes since unit hasn't been selected yet
          setLearningOutcomes([]);
        } else {
          setUnits([]);
          setLearningOutcomes([]);
          setCurrentCurriculumId(undefined);
        }
      } catch (error) {
        console.error('Error loading curriculum context:', error);
        setUnits([]);
        setLearningOutcomes([]);
        setCurrentCurriculumId(undefined);
      }
    } else {
      setUnits([]);
      setLearningOutcomes([]);
      setCurrentCurriculumId(undefined);
    }
  };

  // Handler for unit selection change
  const handleUnitChange = async (unitId: string) => {
    console.log('🔄 Unit changed to:', unitId);
    
    if (unitId) {
      try {
        const outcomesResult = await lessonPlanService.getLearningOutcomes(unitId);
        if (outcomesResult.success) {
          setLearningOutcomes(outcomesResult.data || []);
        } else {
          setLearningOutcomes([]);
        }
      } catch (error) {
        console.error('Error loading learning outcomes:', error);
        setLearningOutcomes([]);
      }
    } else {
      setLearningOutcomes([]);
    }
  };

  // Handler for adding/updating lesson plan
  const handleAddLessonPlan = async (lessonPlan: any) => {
    try {
      setSaveStatus("saving");
      
      if (lessonPlan.id && lessonPlans.find(lp => lp.id === lessonPlan.id)) {
        // Update existing lesson plan
        const result = await lessonPlanService.updateLessonPlan(lessonPlan.id, {
          title: lessonPlan.title,
          session_date: lessonPlan.sessionDate,
          duration_minutes: lessonPlan.duration ? parseInt(lessonPlan.duration) : undefined,
          department_id: lessonPlan.department,
          program_id: lessonPlan.program,
          course_id: lessonPlan.course,
          semester: parseInt(lessonPlan.semester),
          academic_year: lessonPlan.academicYear,
          curriculum_id: currentCurriculumId, // Include curriculum_id
          unit_id: lessonPlan.unitId,
          selected_learning_outcomes: lessonPlan.selectedLearningOutcomes,
          session_objectives: lessonPlan.sessionObjectives,
          teaching_methodology: lessonPlan.teachingMethodology,
          required_materials: lessonPlan.requiredMaterials,
          resource_files: lessonPlan.resourceFiles,
          resource_links: lessonPlan.resourceLinks,
          evaluation_criteria: lessonPlan.evaluationCriteria,
          evaluation_items: lessonPlan.evaluationItems,
          follow_up_activities: lessonPlan.followUpActivities,
          additional_notes: lessonPlan.additionalNotes,
          status: lessonPlan.status,
        });

        if (result.success && result.data) {
          setLessonPlans(prev => prev.map(lp => lp.id === lessonPlan.id ? result.data! : lp));
          setSaveStatus("saved");
          toast.success('Lesson plan updated successfully');
        } else {
          setSaveStatus("idle");
          toast.error(result.error?.message || 'Failed to update lesson plan');
        }
      } else {
        // Create new lesson plan
        const result = await lessonPlanService.createLessonPlan({
          title: lessonPlan.title,
          session_date: lessonPlan.sessionDate,
          duration_minutes: lessonPlan.duration ? parseInt(lessonPlan.duration) : undefined,
          department_id: lessonPlan.department,
          program_id: lessonPlan.program,
          course_id: lessonPlan.course,
          semester: parseInt(lessonPlan.semester),
          academic_year: lessonPlan.academicYear,
          curriculum_id: currentCurriculumId, // Include curriculum_id
          unit_id: lessonPlan.unitId,
          selected_learning_outcomes: lessonPlan.selectedLearningOutcomes,
          session_objectives: lessonPlan.sessionObjectives,
          teaching_methodology: lessonPlan.teachingMethodology,
          required_materials: lessonPlan.requiredMaterials,
          resource_files: lessonPlan.resourceFiles,
          resource_links: lessonPlan.resourceLinks,
          evaluation_criteria: lessonPlan.evaluationCriteria,
          evaluation_items: lessonPlan.evaluationItems,
          follow_up_activities: lessonPlan.followUpActivities,
          additional_notes: lessonPlan.additionalNotes,
          status: lessonPlan.status,
          metadata: {},
        });

        if (result.success && result.data) {
          setLessonPlans(prev => [result.data!, ...prev]);
          setSaveStatus("saved");
          toast.success('Lesson plan created successfully');
        } else {
          setSaveStatus("idle");
          toast.error(result.error?.message || 'Failed to create lesson plan');
        }
      }
      
      // Reset save status after a delay
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      console.error('Error saving lesson plan:', error);
      setSaveStatus("idle");
      toast.error('Failed to save lesson plan');
    }
  };

  // Handler for deleting lesson plan
  const handleDeleteLessonPlan = async (id: string) => {
    try {
      const result = await lessonPlanService.deleteLessonPlan(id);
      if (result.success) {
        setLessonPlans(prev => prev.filter(lp => lp.id !== id));
        toast.success('Lesson plan deleted successfully');
      } else {
        toast.error(result.error?.message || 'Failed to delete lesson plan');
      }
    } catch (error: any) {
      console.error('Error deleting lesson plan:', error);
      toast.error('Failed to delete lesson plan');
    }
  };

  // Handler for publishing lesson plan
  const handlePublishLessonPlan = async (id: string) => {
    try {
      const result = await lessonPlanService.updateLessonPlan(id, {
        status: 'published',
        published_at: new Date().toISOString(),
      });

      if (result.success && result.data) {
        setLessonPlans(prev => prev.map(lp => lp.id === id ? result.data! : lp));
        toast.success('Lesson plan published successfully');
      } else {
        toast.error(result.error?.message || 'Failed to publish lesson plan');
      }
    } catch (error: any) {
      console.error('Error publishing lesson plan:', error);
      toast.error('Failed to publish lesson plan');
    }
  };

  return (
    <CollegeLessonPlanUI
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
      courses={courses}
      departments={departments}
      programs={programs}
      semesters={semesters.map(s => s.toString())}
      academicYears={academicYears}
      // Data
      lessonPlans={lessonPlans}
      units={units}
      learningOutcomes={learningOutcomes}
      saveStatus={saveStatus}
      loading={loading}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      // Handlers
      onAddLessonPlan={handleAddLessonPlan}
      onDeleteLessonPlan={handleDeleteLessonPlan}
      onPublishLessonPlan={handlePublishLessonPlan}
      // Dynamic handlers for form
      onDepartmentChange={handleDepartmentChange}
      onProgramChange={handleProgramChange}
      onSemesterChange={handleSemesterChange}
      onCurriculumContextChange={handleCurriculumContextChange}
      onUnitChange={handleUnitChange}
    />
  );
};

export default CollegeLessonPlans;