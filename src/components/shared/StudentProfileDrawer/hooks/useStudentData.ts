import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { Student, AssessmentResult, CurriculumData, LessonPlan, Course, AdmissionNote, Project, Certificate } from '../types';

export const useStudentData = (student: Student | null, isOpen: boolean) => {
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [curriculumData, setCurriculumData] = useState<CurriculumData[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [admissionNotes, setAdmissionNotes] = useState<AdmissionNote[]>([]);
  
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  
  const [studentAcademicYear, setStudentAcademicYear] = useState<string | null>(null);


  useEffect(() => {
    if (isOpen && student?.id) {
      fetchAdmissionNotes();
      fetchAssessmentResults();
      fetchCurriculumData();
      fetchCourses();
      fetchProjects();
      fetchCertificates();
    }
  }, [student?.id, isOpen]);

  const fetchAdmissionNotes = async () => {
    setLoadingNotes(true);
    try {
      // Mock data for now - replace with actual API call
      setAdmissionNotes([
        {
          id: '1',
          admin: 'Admin User',
          date: new Date().toLocaleDateString(),
          note: 'Strong application. Excellent entrance score. Recommended for approval.'
        }
      ]);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setAdmissionNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchAssessmentResults = async () => {
    if (!student?.id) return;
    
    setLoadingAssessments(true);
    try {
      const { data, error } = await supabase
        .from('personal_assessment_results')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assessment results:', error);
        setAssessmentResults([]);
      } else {
        setAssessmentResults(data || []);
      }
    } catch (error) {
      console.error('Error fetching assessment results:', error);
      setAssessmentResults([]);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const fetchCourses = async () => {
    if (!student?.id) return;
    
    setLoadingCourses(true);
    try {
      const { data: trainings, error: trainingsError } = await supabase
        .from('trainings')
        .select(`
          *,
          courses:course_id (
            course_id,
            title,
            description,
            duration,
            status,
            thumbnail,
            educator_id
          )
        `)
        .eq('student_id', student.id)
        .in('approval_status', ['approved', 'verified', 'pending'])
        .order('created_at', { ascending: false });

      if (trainingsError) {
        console.error('Error fetching trainings:', trainingsError);
        setCourses([]);
        return;
      }

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('student_id', student.id)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) {
        console.error('Error fetching course enrollments:', enrollmentsError);
      }

      const coursesData = (trainings || []).map((training: any) => {
        const enrollment = (enrollments || []).find(e => e.training_id === training.id);
        
        let progress = 0;
        if (training.status === 'completed') {
          progress = 100;
        } else if (training.total_modules > 0) {
          progress = Math.round(((training.completed_modules || 0) / training.total_modules) * 100);
        } else if (enrollment?.progress) {
          progress = enrollment.progress;
        }

        return {
          id: training.id,
          title: training.title,
          organization: training.organization,
          description: training.description,
          status: training.status,
          approval_status: training.approval_status,
          progress: progress,
          completed_modules: training.completed_modules || 0,
          total_modules: training.total_modules || 0,
          hours_spent: training.hours_spent || 0,
          start_date: training.start_date,
          end_date: training.end_date,
          duration: training.duration,
          course_id: training.course_id,
          source: training.source,
          created_at: training.created_at,
          updated_at: training.updated_at,
          course_details: training.courses,
          enrolled_at: enrollment?.enrolled_at,
          last_accessed: enrollment?.last_accessed,
          completed_lessons: enrollment?.completed_lessons || [],
          total_lessons: enrollment?.total_lessons || 0,
          enrollment_status: enrollment?.status,
          skills_acquired: enrollment?.skills_acquired || [],
          certificate_url: enrollment?.certificate_url,
          grade: enrollment?.grade
        };
      });

      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchProjects = async () => {
    if (!student?.id) return;
    
    setLoadingProjects(true);
    try {
      // First try to get projects from student.projects if it exists
      if (student.projects && Array.isArray(student.projects)) {
        setProjects(student.projects);
        setLoadingProjects(false);
        return;
      }

      // Try to fetch from a projects table if it exists
      const { data: projectsData, error: projectsError } = await supabase
        .from('student_projects')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.log('No projects table found, using student.projects field');
        setProjects([]);
      } else {
        setProjects(projectsData || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchCertificates = async () => {
    if (!student?.id) return;
    
    setLoadingCertificates(true);
    try {
      // First try to get certificates from student.certificates if it exists
      if (student.certificates && Array.isArray(student.certificates)) {
        setCertificates(student.certificates);
        setLoadingCertificates(false);
        return;
      }

      // Try to fetch from a certificates table if it exists
      const { data: certificatesData, error: certificatesError } = await supabase
        .from('student_certificates')
        .select('*')
        .eq('student_id', student.id)
        .order('issued_on', { ascending: false });

      if (certificatesError) {
        console.log('No certificates table found, using student.certificates field');
        setCertificates([]);
      } else {
        setCertificates(certificatesData || []);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates([]);
    } finally {
      setLoadingCertificates(false);
    }
  };

  const fetchCurriculumData = async () => {
    if (!student) return;
    
    
    setLoadingCurriculum(true);
    try {
      let schoolClassId = student.school_class_id;
      
      if (!schoolClassId && student.school_id && student.grade) {
        let schoolClassQuery = supabase
          .from('school_classes')
          .select('id, grade, academic_year, school_id, section')
          .eq('school_id', student.school_id)
          .eq('grade', student.grade);
        
        if (student.section) {
          schoolClassQuery = schoolClassQuery.eq('section', student.section);
        }
        
        const { data: schoolClasses, error: searchError } = await schoolClassQuery;
        
        if (!searchError && schoolClasses && schoolClasses.length > 0) {
          const selectedClass = schoolClasses.sort((a, b) => b.academic_year.localeCompare(a.academic_year))[0];
          schoolClassId = selectedClass.id;
        }
      }
      
      if (!schoolClassId) {
        setCurriculumData([]);
        setLessonPlans([]);
        return;
      }

      const { data: schoolClass, error: classError } = await supabase
        .from('school_classes')
        .select('grade, academic_year, school_id')
        .eq('id', schoolClassId)
        .single();

      if (classError || !schoolClass) {
        setCurriculumData([]);
        setLessonPlans([]);
        return;
      }

      const studentGrade = schoolClass.grade;
      const studentAcademicYear = schoolClass.academic_year;
      const studentSchoolId = schoolClass.school_id;
      
      setStudentAcademicYear(studentAcademicYear);

      // Fetch lesson plans
      const { data: allLessons, error: lessonsError } = await supabase
        .from('lesson_plans')
        .select(`
          *,
          curriculum_chapters!inner (
            id,
            name,
            curriculum_id,
            curriculums!inner (
              id,
              school_id,
              subject,
              academic_year
            )
          )
        `)
        .eq('class_name', studentGrade)
        .eq('status', 'approved')
        .eq('curriculum_chapters.curriculums.school_id', studentSchoolId)
        .order('date', { ascending: false });
      
      if (!lessonsError) {
        setLessonPlans(allLessons || []);
      }

      // Fetch curriculums
      let allCurriculumsQuery = supabase
        .from('curriculums')
        .select(`
          *,
          curriculum_chapters (
            *,
            curriculum_learning_outcomes (*)
          )
        `)
        .eq('class', studentGrade)
        .eq('status', 'approved')
        .order('academic_year', { ascending: false });

      if (studentSchoolId) {
        allCurriculumsQuery = allCurriculumsQuery.eq('school_id', studentSchoolId);
      }

      const { data: allCurriculums, error: curriculumError } = await allCurriculumsQuery;

      if (curriculumError || !allCurriculums) {
        setCurriculumData([]);
        return;
      }

      // Process curriculums with lesson counts
      const curriculumsBySubject = new Map();
      const lessonsByChapter = new Map();

      (allLessons || []).forEach(lesson => {
        if (lesson.chapter_id) {
          if (!lessonsByChapter.has(lesson.chapter_id)) {
            lessonsByChapter.set(lesson.chapter_id, []);
          }
          lessonsByChapter.get(lesson.chapter_id).push(lesson);
        }
      });

      allCurriculums.forEach(curriculum => {
        const subject = curriculum.subject;
        let lessonCount = 0;
        
        if (curriculum.curriculum_chapters) {
          curriculum.curriculum_chapters.forEach((chapter: any) => {
            const chapterLessons = lessonsByChapter.get(chapter.id) || [];
            lessonCount += chapterLessons.length;
          });
        }

        const existing = curriculumsBySubject.get(subject);
        let shouldReplace = false;
        
        if (!existing) {
          shouldReplace = true;
        } else {
          if (studentAcademicYear) {
            if (curriculum.academic_year === studentAcademicYear && existing.academic_year !== studentAcademicYear) {
              shouldReplace = true;
            } else if (existing.academic_year === studentAcademicYear && curriculum.academic_year !== studentAcademicYear) {
              shouldReplace = false;
            } else if (curriculum.academic_year === studentAcademicYear && existing.academic_year === studentAcademicYear) {
              shouldReplace = lessonCount > existing.lessonCount;
            } else {
              if (lessonCount > existing.lessonCount) {
                shouldReplace = true;
              } else if (lessonCount === existing.lessonCount) {
                shouldReplace = curriculum.academic_year > existing.academic_year;
              }
            }
          } else {
            if (lessonCount > existing.lessonCount) {
              shouldReplace = true;
            } else if (lessonCount === existing.lessonCount) {
              shouldReplace = curriculum.academic_year > existing.academic_year;
            }
          }
        }

        if (shouldReplace) {
          curriculumsBySubject.set(subject, {
            ...curriculum,
            lessonCount
          });
        }
      });

      const selectedCurriculums = Array.from(curriculumsBySubject.values());
      setCurriculumData(selectedCurriculums);

    } catch (error) {
      console.error('Error fetching curriculum data:', error);
      setCurriculumData([]);
      setLessonPlans([]);
    } finally {
      setLoadingCurriculum(false);
    }
  };

  return {
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
    refetchAssessments: fetchAssessmentResults,
    refetchCurriculum: fetchCurriculumData,
    refetchCourses: fetchCourses,
    refetchProjects: fetchProjects,
    refetchCertificates: fetchCertificates,
    refetchNotes: fetchAdmissionNotes
  };
};