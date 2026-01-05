/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { FeatureGate } from '../../../components/Subscription/FeatureGate';

// Import the college-adapted curriculum builder UI
import CollegeCurriculumBuilderUI from '../../../components/admin/collegeAdmin/CollegeCurriculumBuilderUI';

/**
 * CollegeCurriculumBuilder - Curriculum management for college admins
 * 
 * Wrapped with FeatureGate for curriculum_builder add-on access control
 */
const CollegeCurriculumBuilderContent: React.FC = () => {
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
  
  // Configuration data from database
  const [courses, setCourses] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  // Load configuration data on mount
  useEffect(() => {
    loadConfigurationData();
  }, []);

  const loadConfigurationData = async () => {
    try {
      // Load college-specific configuration data
      let coursesData: string[] = [];
      let departmentsData: string[] = [];
      let programsData: string[] = [];
      let semestersData: string[] = [];
      let yearsData: string[] = [];

      try {
        // For now, use hardcoded data - can be replaced with API calls later
        coursesData = [
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
      } catch (err) {
        console.error('Error loading courses:', err);
      }

      try {
        departmentsData = [
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
      } catch (err) {
        console.error('Error loading departments:', err);
      }

      try {
        programsData = [
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
      } catch (err) {
        console.error('Error loading programs:', err);
      }

      try {
        semestersData = ["1", "2", "3", "4", "5", "6", "7", "8"];
      } catch (err) {
        console.error('Error loading semesters:', err);
      }

      try {
        yearsData = [
          "2024-2025",
          "2025-2026", 
          "2026-2027"
        ];
      } catch (err) {
        console.error('Error loading academic years:', err);
      }
      
      setCourses(coursesData);
      setDepartments(departmentsData);
      setPrograms(programsData);
      setSemesters(semestersData);
      setAcademicYears(yearsData);
      
      // Auto-select current academic year if available
      try {
        const currentYear = "2024-2025"; // Can be fetched from API
        if (currentYear && yearsData.includes(currentYear)) {
          setSelectedAcademicYear(currentYear);
        }
      } catch (err) {
        console.error('Error loading current academic year:', err);
      }

      // Show warning if no data was loaded
      if (coursesData.length === 0 || departmentsData.length === 0 || programsData.length === 0) {
        console.warn('Some configuration data is missing:', {
          courses: coursesData.length,
          departments: departmentsData.length,
          programs: programsData.length,
        });
      }
    } catch (error: any) {
      console.error('Error loading configuration:', error);
      alert('Failed to load configuration data. Please check the console for details.');
    }
  };

  // Local state for curriculum data (no database connection)
  const [curriculumId] = useState<string | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<any[]>([]);
  const [status, setStatus] = useState<"draft" | "pending_approval" | "approved" | "rejected">("draft");
  const [rejectionReason] = useState<string | undefined>();
  const [loading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Local handlers (no database connection)
  const handleAddUnit = async (unit: any) => {
    setSaveStatus("saving");
    
    // Simulate async operation
    setTimeout(() => {
      if (unit.id && units.find(u => u.id === unit.id)) {
        // Update existing
        setUnits(prev => prev.map(u => u.id === unit.id ? unit : u));
      } else {
        // Create new
        const newUnit = { ...unit, id: Date.now().toString(), order: units.length + 1 };
        setUnits(prev => [...prev, newUnit]);
      }
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      
      setNotification({ type: 'success', message: 'Unit saved successfully!' });
      setTimeout(() => setNotification(null), 3000);
    }, 500);
  };

  const handleDeleteUnit = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) return;
    
    setSaveStatus("saving");
    
    // Simulate async operation
    setTimeout(() => {
      setUnits(prev => prev.filter(u => u.id !== id));
      setLearningOutcomes(prev => prev.filter(lo => lo.unitId !== id));
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      
      setNotification({ type: 'success', message: 'Unit deleted successfully!' });
      setTimeout(() => setNotification(null), 3000);
    }, 300);
  };

  const handleAddOutcome = async (outcome: any) => {
    setSaveStatus("saving");
    
    // Simulate async operation
    setTimeout(() => {
      if (outcome.id && learningOutcomes.find(lo => lo.id === outcome.id)) {
        // Update existing
        setLearningOutcomes(prev => prev.map(lo => lo.id === outcome.id ? outcome : lo));
      } else {
        // Create new
        const newOutcome = { ...outcome, id: Date.now().toString() };
        setLearningOutcomes(prev => [...prev, newOutcome]);
      }
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      
      setNotification({ type: 'success', message: 'Learning outcome saved successfully!' });
      setTimeout(() => setNotification(null), 3000);
    }, 500);
  };

  const handleDeleteOutcome = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this outcome?')) return;
    
    setSaveStatus("saving");
    
    // Simulate async operation
    setTimeout(() => {
      setLearningOutcomes(prev => prev.filter(lo => lo.id !== id));
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      
      setNotification({ type: 'success', message: 'Learning outcome deleted successfully!' });
      setTimeout(() => setNotification(null), 3000);
    }, 300);
  };

  const handleSubmitForApproval = async () => {
    // Simulate role check (no database)
    const isCollegeAdmin = false; // For demo purposes, assume regular faculty
    
    const confirmMessage = isCollegeAdmin
      ? "Are you sure you want to approve and publish this curriculum?"
      : "Are you sure you want to submit this curriculum for Academic Head approval?";

    if (!window.confirm(confirmMessage)) return;
    
    setSaveStatus("saving");
    
    // Simulate async operation
    setTimeout(() => {
      setStatus(isCollegeAdmin ? "approved" : "pending_approval");
      
      const message = isCollegeAdmin
        ? 'Curriculum approved and published successfully!'
        : 'Curriculum submitted for approval! The Academic Head will review it.';
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      
      setNotification({ type: 'success', message });
      setTimeout(() => setNotification(null), 5000);
    }, 800);
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve this curriculum?')) return;
    
    setSaveStatus("saving");
    
    // Simulate async operation
    setTimeout(() => {
      setStatus("approved");
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      
      setNotification({ type: 'success', message: 'Curriculum approved successfully!' });
      setTimeout(() => setNotification(null), 5000);
    }, 500);
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    setSaveStatus("saving");
    
    // Simulate async operation
    setTimeout(() => {
      setStatus("rejected");
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      
      setNotification({ type: 'success', message: 'Curriculum rejected. Faculty will be notified.' });
      setTimeout(() => setNotification(null), 5000);
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
        courses={courses}
        departments={departments}
        programs={programs}
        semesters={semesters}
        academicYears={academicYears}
        // Local data (no database connection)
        curriculumId={curriculumId}
        units={units}
        learningOutcomes={learningOutcomes}
        assessmentTypes={undefined} // Will use default college assessment types
        status={status}
        rejectionReason={rejectionReason}
        loading={loading}
        saveStatus={saveStatus}
        // Search
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        // Handlers (adapted for college terminology)
        onAddUnit={handleAddUnit}
        onDeleteUnit={handleDeleteUnit}
        onAddOutcome={handleAddOutcome}
        onDeleteOutcome={handleDeleteOutcome}
        onSubmitForApproval={handleSubmitForApproval}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
};

/**
 * Wrapped CollegeCurriculumBuilder with FeatureGate for curriculum_builder add-on
 */
const CollegeCurriculumBuilder: React.FC = () => (
  <FeatureGate featureKey="curriculum_builder" showUpgradePrompt={true}>
    <CollegeCurriculumBuilderContent />
  </FeatureGate>
);

export default CollegeCurriculumBuilder;
