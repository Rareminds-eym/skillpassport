import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, GraduationCap, Target, Users, File, Activity, Lightbulb, FileText, Link2, CheckSquare, BookMarked, ExternalLinkIcon } from 'lucide-react';
import { CurriculumData, LessonPlan } from '../types';
import { LessonSection } from '../components';

interface CurriculumTabProps {
  curriculumData: CurriculumData[];
  lessonPlans: LessonPlan[];
  studentAcademicYear: string | null;
  loading: boolean;
  student?: any;
}

const CurriculumTab: React.FC<CurriculumTabProps> = ({ 
  curriculumData, 
  lessonPlans, 
  studentAcademicYear, 
  loading,
  student 
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  // Get unique subjects to avoid duplicates in filters
  const uniqueSubjects = Array.from(new Set(curriculumData.map(c => c.subject)));

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          {/* Filter skeleton */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded w-20"></div>
            ))}
          </div>
          
          {/* Content skeleton */}
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-200 h-40 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
        <BookOpen className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-2">No curriculum found</h3>
      <p className="text-sm text-gray-500">
        No curriculum found for Grade {student?.grade || student?.class}. Curriculum may not be created or approved yet.
      </p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Curriculum & Lesson Plans</h3>
          <p className="text-sm text-gray-600">
            Grade {student?.grade || student?.class} • {uniqueSubjects.length} subject{uniqueSubjects.length !== 1 ? 's' : ''} • {
              curriculumData.reduce((total, curriculum) => {
                const curriculumLessons = lessonPlans.filter(lesson => {
                  if (!lesson.chapter_id) return false;
                  return curriculum.curriculum_chapters?.some(chapter => chapter.id === lesson.chapter_id);
                });
                return total + curriculumLessons.length;
              }, 0)
            } lesson{lessonPlans.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {curriculumData.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Subject Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSubject === 'all'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                All Subjects ({uniqueSubjects.length})
              </button>
              {uniqueSubjects.map((subject) => {
                const subjectCurriculum = curriculumData.find(c => c.subject === subject);
                const subjectLessonCount = subjectCurriculum ? lessonPlans.filter(lesson => {
                  if (!lesson.chapter_id) return false;
                  return subjectCurriculum.curriculum_chapters?.some(chapter => chapter.id === lesson.chapter_id);
                }).length : 0;
                
                return (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSubject === subject
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {subject} ({subjectLessonCount} lessons)
                  </button>
                );
              })}
            </div>
          </div>
          {/* Curriculum Content */}
          <div className="space-y-4">
            {uniqueSubjects
              .filter(subject => selectedSubject === 'all' || subject === selectedSubject)
              .map((subject) => {
                const subjectCurriculums = curriculumData.filter(c => c.subject === subject);
                const primaryCurriculum = subjectCurriculums[0];
                
                if (!primaryCurriculum) return null;

                const curriculumLessonCount = lessonPlans.filter(lesson => {
                  if (!lesson.chapter_id) return false;
                  return primaryCurriculum.curriculum_chapters?.some(chapter => chapter.id === lesson.chapter_id);
                }).length;
                
                return (
                  <div key={subject} className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-shadow">
                    {/* Subject Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                            <h4 className="text-lg font-semibold text-gray-900">{subject}</h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {primaryCurriculum.academic_year || 'Current'}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookMarked className="h-4 w-4" />
                              {primaryCurriculum.curriculum_chapters?.length || 0} chapters
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {curriculumLessonCount} lessons
                            </span>
                          </div>
                          {primaryCurriculum.lessonCount !== undefined && (
                            <p className="text-xs text-gray-500 mt-2">
                              {studentAcademicYear && primaryCurriculum.academic_year === studentAcademicYear 
                                ? `Student's academic year curriculum (${primaryCurriculum.lessonCount} lesson${primaryCurriculum.lessonCount !== 1 ? 's' : ''})`
                                : `Selected based on lesson availability (${primaryCurriculum.lessonCount} total lessons)`
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      {/* Curriculum Chapters */}
                      {primaryCurriculum.curriculum_chapters && primaryCurriculum.curriculum_chapters.length > 0 ? (
                        <div className="space-y-3">
                          {primaryCurriculum.curriculum_chapters
                          .sort((a: any, b: any) => (a.order_number || 0) - (b.order_number || 0))
                          .map((chapter: any) => {
                            const chapterLessons = lessonPlans.filter(lesson => lesson.chapter_id === chapter.id);
                            
                            return (
                              <div key={chapter.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                {/* Chapter Header */}
                                <div 
                                  className="p-4 cursor-pointer transition-colors"
                                  onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-1">
                                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                        <span className="text-sm font-bold text-blue-700">
                                          {chapter.order_number || '•'}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="text-sm font-semibold text-gray-900 mb-1">
                                          {chapter.name}
                                          {chapter.code && <span className="text-gray-500 ml-2 text-sm font-normal">({chapter.code})</span>}
                                        </h5>
                                        <div className="flex items-center gap-4 text-xs text-gray-600">
                                          {chapter.estimated_duration && (
                                            <span className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {chapter.estimated_duration} {chapter.duration_unit || 'hours'}
                                            </span>
                                          )}
                                          {chapter.curriculum_learning_outcomes && chapter.curriculum_learning_outcomes.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Target className="h-3 w-3" />
                                              {chapter.curriculum_learning_outcomes.length} outcomes
                                            </span>
                                          )}
                                          {chapterLessons.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <File className="h-3 w-3" />
                                              {chapterLessons.length} lessons
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <svg 
                                        className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${expandedChapter === chapter.id ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                                {/* Expanded Chapter Content */}
                                {expandedChapter === chapter.id && (
                                  <div className="border-t border-gray-200 bg-gray-50">
                                    <div className="p-4 space-y-4">
                                      {/* Chapter Description */}
                                      {chapter.description && (
                                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                                          <p className="text-sm text-gray-700 leading-relaxed">{chapter.description}</p>
                                        </div>
                                      )}

                                      {/* Learning Outcomes */}
                                      {chapter.curriculum_learning_outcomes && chapter.curriculum_learning_outcomes.length > 0 && (
                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                          <div className="flex items-center gap-2 mb-3">
                                            <Target className="h-4 w-4 text-blue-600" />
                                            <h6 className="text-sm font-semibold text-gray-900">Learning Outcomes</h6>
                                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                              {chapter.curriculum_learning_outcomes.length}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-1 gap-2">
                                            {chapter.curriculum_learning_outcomes.map((outcome: any, idx: number) => (
                                              <div key={outcome.id || idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                <div className="flex items-start gap-2">
                                                  <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                                                    {idx + 1}
                                                  </div>
                                                  <div className="flex-1">
                                                    <p className="text-sm text-gray-700 leading-relaxed">{outcome.outcome || outcome.description}</p>
                                                    {outcome.bloom_level && (
                                                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                                                        {outcome.bloom_level}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {/* Chapter Lesson Plans */}
                                      {chapterLessons.length > 0 && (
                                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                                          <div className="flex items-center gap-2 mb-4">
                                            <File className="h-4 w-4 text-green-600" />
                                            <h6 className="text-sm font-semibold text-gray-900">Lesson Plans</h6>
                                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                              {chapterLessons.length}
                                            </span>
                                          </div>
                                          
                                          <div className="space-y-3">
                                            {chapterLessons.map((lesson, lessonIndex) => (
                                              <div key={lesson.id} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                                {/* Lesson Header */}
                                                <div 
                                                  className="p-3 cursor-pointer transition-colors"
                                                  onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                                                >
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center flex-1">
                                                      <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center mr-3">
                                                        <span className="text-xs font-semibold text-green-700">{lessonIndex + 1}</span>
                                                      </div>
                                                      <div className="flex-1">
                                                        <h6 className="text-sm font-semibold text-gray-900 mb-1">{lesson.title}</h6>
                                                        <div className="flex items-center gap-3 text-xs text-gray-600">
                                                          <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {lesson.date ? new Date(lesson.date).toLocaleDateString('en-US', { 
                                                              weekday: 'short', 
                                                              month: 'short', 
                                                              day: 'numeric' 
                                                            }) : 'No date'}
                                                          </span>
                                                          <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {(lesson as any).duration || 'N/A'} min
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                        lesson.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        lesson.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                      }`}>
                                                        {lesson.status?.charAt(0).toUpperCase() + lesson.status?.slice(1)}
                                                      </span>
                                                      
                                                      <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                                                        <svg 
                                                          className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${expandedLesson === lesson.id ? 'rotate-180' : ''}`} 
                                                          fill="none" 
                                                          stroke="currentColor" 
                                                          viewBox="0 0 24 24"
                                                        >
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                                {/* Expanded Lesson Content */}
                                                {expandedLesson === lesson.id && (
                                                  <div className="border-t border-gray-200 p-4 bg-white">
                                                    <div className="space-y-4">
                                                      
                                                      {/* Learning Objectives */}
                                                      {(lesson as any).learning_objectives && (
                                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                          <div className="flex items-center gap-2 mb-2">
                                                            <Target className="w-4 h-4 text-blue-600" />
                                                            <h6 className="text-sm font-semibold text-gray-900">Learning Objectives</h6>
                                                          </div>
                                                          <p className="text-sm text-gray-700 leading-relaxed">{(lesson as any).learning_objectives}</p>
                                                        </div>
                                                      )}

                                                      {/* Activities */}
                                                      {(lesson as any).activities && (lesson as any).activities.length > 0 && (
                                                        <LessonSection
                                                          icon={Activity}
                                                          title={`Activities (${(lesson as any).activities.length})`}
                                                          content={
                                                            <div className="space-y-2">
                                                              {(lesson as any).activities.map((activity: any, idx: number) => (
                                                                <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                                                  <div className="flex items-start gap-2">
                                                                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                                                                      {idx + 1}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                      <h6 className="text-sm font-semibold text-gray-900 mb-1">{activity.title || activity.name || `Activity ${idx + 1}`}</h6>
                                                                      <p className="text-sm text-gray-700 leading-relaxed">{activity.description || activity.content}</p>
                                                                      {activity.duration && (
                                                                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                                          {activity.duration} min
                                                                        </span>
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              ))}
                                                            </div>
                                                          }
                                                        />
                                                      )}

                                                      {/* Required Materials */}
                                                      {(lesson as any).required_materials && (
                                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                          <div className="flex items-center gap-2 mb-2">
                                                            <BookMarked className="w-4 h-4 text-orange-600" />
                                                            <h6 className="text-sm font-semibold text-gray-900">Required Materials</h6>
                                                          </div>
                                                          <p className="text-sm text-gray-700 leading-relaxed">{(lesson as any).required_materials}</p>
                                                        </div>
                                                      )}
                                                      {/* Resources */}
                                                      {(((lesson as any).resource_links && (lesson as any).resource_links.length > 0) || ((lesson as any).resource_files && (lesson as any).resource_files.length > 0)) && (
                                                        <LessonSection
                                                          icon={Link2}
                                                          title="Resources"
                                                          content={
                                                            <div className="space-y-2">
                                                              {(lesson as any).resource_links && (lesson as any).resource_links.map((link: any, idx: number) => (
                                                                <div key={idx} className="flex items-center bg-white rounded-lg p-2 border border-gray-200">
                                                                  <ExternalLinkIcon className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                                                                  <a 
                                                                    href={link.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm text-gray-700 underline font-medium truncate"
                                                                  >
                                                                    {link.title || link.url}
                                                                  </a>
                                                                </div>
                                                              ))}
                                                              {(lesson as any).resource_files && (lesson as any).resource_files.map((file: any, idx: number) => (
                                                                <div key={idx} className="flex items-center bg-white rounded-lg p-2 border border-gray-200">
                                                                  <FileText className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                                                                  <span className="text-sm text-gray-700 font-medium truncate">{file.name || file.title}</span>
                                                                </div>
                                                              ))}
                                                            </div>
                                                          }
                                                        />
                                                      )}

                                                      {/* Assessment & Evaluation */}
                                                      {((lesson as any).assessment_methods || ((lesson as any).evaluation_items && (lesson as any).evaluation_items.length > 0)) && (
                                                        <LessonSection
                                                          icon={CheckSquare}
                                                          title="Assessment & Evaluation"
                                                          content={
                                                            <div className="space-y-3">
                                                              {(lesson as any).assessment_methods && (
                                                                <p className="text-sm text-gray-700">{(lesson as any).assessment_methods}</p>
                                                              )}
                                                              {(lesson as any).evaluation_criteria && (
                                                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                                  <span className="text-sm font-medium text-gray-900">Criteria: </span>
                                                                  <span className="text-sm text-gray-700">{(lesson as any).evaluation_criteria}</span>
                                                                </div>
                                                              )}
                                                              {(lesson as any).evaluation_items && (lesson as any).evaluation_items.length > 0 && (
                                                                <div className="space-y-2">
                                                                  <p className="text-sm font-medium text-gray-900">Evaluation Items:</p>
                                                                  {(lesson as any).evaluation_items.map((item: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-3 border border-gray-200">
                                                                      <span className="text-sm text-gray-700 font-medium">{item.criterion}</span>
                                                                      <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">{item.percentage}%</span>
                                                                    </div>
                                                                  ))}
                                                                </div>
                                                              )}
                                                            </div>
                                                          }
                                                        />
                                                      )}
                                                      {/* Homework */}
                                                      {(lesson as any).homework && (
                                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                          <div className="flex items-center gap-2 mb-2">
                                                            <BookMarked className="w-4 h-4 text-purple-600" />
                                                            <h6 className="text-sm font-semibold text-gray-900">Homework Assignment</h6>
                                                          </div>
                                                          <p className="text-sm text-gray-700 leading-relaxed">{(lesson as any).homework}</p>
                                                        </div>
                                                      )}

                                                      {/* Differentiation Notes */}
                                                      {(lesson as any).differentiation_notes && (
                                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                          <div className="flex items-center gap-2 mb-2">
                                                            <Users className="w-4 h-4 text-indigo-600" />
                                                            <h6 className="text-sm font-semibold text-gray-900">Differentiation Notes</h6>
                                                          </div>
                                                          <p className="text-sm text-gray-700 leading-relaxed">{(lesson as any).differentiation_notes}</p>
                                                        </div>
                                                      )}

                                                      {/* Additional Notes */}
                                                      {(lesson as any).notes && (
                                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                          <div className="flex items-center gap-2 mb-2">
                                                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                                                            <h6 className="text-sm font-semibold text-gray-900">Additional Notes</h6>
                                                          </div>
                                                          <p className="text-sm text-gray-700 leading-relaxed">{(lesson as any).notes}</p>
                                                        </div>
                                                      )}

                                                      {/* Basic lesson info */}
                                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-4 border-t border-gray-200">
                                                        <div>
                                                          <span className="text-gray-500">Status:</span>
                                                          <span className="ml-1 font-medium text-gray-900">
                                                            {lesson.status?.charAt(0).toUpperCase() + lesson.status?.slice(1)}
                                                          </span>
                                                        </div>
                                                        <div>
                                                          <span className="text-gray-500">Class:</span>
                                                          <span className="ml-1 font-medium text-gray-900">{lesson.class_name}</span>
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Description */}
                                                      {(lesson as any).description && (
                                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                          <h6 className="text-sm font-semibold text-gray-900 mb-2">Description</h6>
                                                          <p className="text-sm text-gray-700 leading-relaxed">{(lesson as any).description}</p>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">No chapters defined for this subject yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
};

export default CurriculumTab;