/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';

// Import the college-adapted lesson plan UI
import CollegeLessonPlanUI from '../../../components/admin/collegeAdmin/CollegeLessonPlanUI';

/**
 * College Lesson Plan Management (Offline Mode)
 * No database connections - works with local state only
 * Adapted for college terminology and workflow
 */
const CollegeLessonPlanManagement: React.FC = () => {
  // Local state for college-specific selections
  const [selectedCourse, setSelectedCourse] = useState(''); // Course/Subject
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // Configuration data (hardcoded for offline mode)
  const [courses, setCourses] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  // Local state for lesson plan data
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load configuration data on mount
  useEffect(() => {
    loadConfigurationData();
  }, []);

  const loadConfigurationData = async () => {
    try {
      // College-specific configuration data (hardcoded for offline mode)
      const coursesData = [
        "Computer Science Fundamentals",
        "Data Structures and Algorithms", 
        "Database Management Systems",
        "Software Engineering",
        "Web Development",
        "Machine Learning",
        "Artificial Intelligence",
        "Computer Networks",
        "Operating Systems",
        "Mathematics for CS",
        "Statistics and Probability",
        "Digital Electronics"
      ];

      const departmentsData = [
        "Computer Science",
        "Information Technology", 
        "Electronics and Communication",
        "Mechanical Engineering",
        "Civil Engineering",
        "Electrical Engineering",
        "Mathematics",
        "Physics",
        "Chemistry"
      ];

      const programsData = [
        "B.Tech",
        "B.E.",
        "M.Tech", 
        "M.E.",
        "B.Sc",
        "M.Sc",
        "BCA",
        "MCA",
        "MBA"
      ];

      const semestersData = ["1", "2", "3", "4", "5", "6", "7", "8"];

      const yearsData = [
        "2024-2025",
        "2025-2026", 
        "2026-2027"
      ];
      
      setCourses(coursesData);
      setDepartments(departmentsData);
      setPrograms(programsData);
      setSemesters(semestersData);
      setAcademicYears(yearsData);
      
      // Auto-select current academic year
      setSelectedAcademicYear("2024-2025");

      // Load sample units for demo
      const sampleUnits = [
        {
          id: "1",
          name: "Introduction to Programming",
          code: "UNIT-01",
          description: "Basic programming concepts and syntax",
          credits: 3,
          estimatedDuration: 15,
          durationUnit: "hours"
        },
        {
          id: "2", 
          name: "Control Structures",
          code: "UNIT-02",
          description: "Loops, conditions, and decision making",
          credits: 2,
          estimatedDuration: 12,
          durationUnit: "hours"
        }
      ];
      setUnits(sampleUnits);

      // Load sample learning outcomes
      const sampleOutcomes = [
        {
          id: "1",
          unitId: "1",
          outcome: "Students will be able to write basic programs using variables and data types",
          bloomLevel: "Apply",
          assessmentMappings: [
            { assessmentType: "IA (Internal Assessment)", weightage: 30 },
            { assessmentType: "End-Semester Exam", weightage: 70 }
          ]
        },
        {
          id: "2",
          unitId: "2", 
          outcome: "Students will be able to implement control structures for program flow",
          bloomLevel: "Apply",
          assessmentMappings: [
            { assessmentType: "Practical Exam", weightage: 50 },
            { assessmentType: "IA (Internal Assessment)", weightage: 50 }
          ]
        }
      ];
      setLearningOutcomes(sampleOutcomes);

    } catch (error: any) {
      console.error('Error loading configuration:', error);
      setNotification({ type: 'error', message: 'Failed to load configuration data.' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Local handlers (no database connection)
  const handleAddLessonPlan = async (lessonPlan: any) => {
    setSaveStatus("saving");
    
    // Simulate async operation
    setTimeout(() => {
      if (lessonPlan.id && lessonPlans.find(lp => lp.id === lessonPlan.id)) {
        // Update existing
        setLessonPlans(prev => prev.map(lp => lp.id === lessonPlan.id ? lessonPlan : lp));
      } else {
        // Create new
        const newLessonPlan = { ...lessonPlan, id: Date.now().toString(), status: 'draft' };
        setLessonPlans(prev => [newLessonPlan, ...prev]);
      }
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      
      setNotification({ type: 'success', message: 'Lesson plan saved successfully!' });
      setTimeout(() => setNotification(null), 3000);
    }, 500);
  };

  const handleDeleteLessonPlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson plan?')) return;
    
    setSaveStatus("saving");
    
    // Simulate async operation
    setTimeout(() => {
      setLessonPlans(prev => prev.filter(lp => lp.id !== id));
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      
      setNotification({ type: 'success', message: 'Lesson plan deleted successfully!' });
      setTimeout(() => setNotification(null), 3000);
    }, 300);
  };

  const handlePublishLessonPlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to publish this lesson plan?')) return;
    
    setSaveStatus("saving");
    
    // Simulate async operation
    setTimeout(() => {
      setLessonPlans(prev => prev.map(lp => 
        lp.id === id ? { ...lp, status: 'published' } : lp
      ));
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      
      setNotification({ type: 'success', message: 'Lesson plan published successfully!' });
      setTimeout(() => setNotification(null), 3000);
    }, 500);
  };

  // Pass all props to the college-adapted component
  return (
    <>
      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div
            className={`rounded-lg border px-6 py-4 shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? (
                <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-current opacity-70 hover:opacity-100"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
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
        semesters={semesters}
        academicYears={academicYears}
        // Data
        lessonPlans={lessonPlans}
        units={units}
        learningOutcomes={learningOutcomes}
        saveStatus={saveStatus}
        // Search
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        // Handlers
        onAddLessonPlan={handleAddLessonPlan}
        onDeleteLessonPlan={handleDeleteLessonPlan}
        onPublishLessonPlan={handlePublishLessonPlan}
      />
    </>
  );
};

export default CollegeLessonPlanManagement;