/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { getLogger } from '@/shared/config/logging';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  UserGroupIcon,
  TrophyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { UIExam } from '@/features/exams';
import { WorkflowStage } from '../types';

const logger = getLogger('ResultsStep');
import TypeBadge from '../TypeBadge';

interface ResultsStepProps {
  exam: UIExam;
  setActiveStep: (step: WorkflowStage) => void;
  // Add other props as needed
}

const ResultsStep: React.FC<ResultsStepProps> = ({ exam, setActiveStep }) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'subject' | 'learners' | 'classwise'>('overview');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [classwiseData, setClasswiseData] = useState<any[]>([]);
  const [loadingClasswise, setLoadingClasswise] = useState(false);

  // Check if this is a whole grade exam
  const isWholeGradeExam = exam.targetClasses?.type === 'whole_grade';

  // Function to fetch class-wise statistics
  const fetchClasswiseData = React.useCallback(async () => {
    if (!isWholeGradeExam || !exam.targetClasses?.grade) return;
    
    setLoadingClasswise(true);
    try {
      // Import supabase client
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      // Get only the classes that are part of this exam (from target_classes.class_ids)
      const targetClassIds = exam.targetClasses.class_ids || [];
      
      if (targetClassIds.length === 0) {
        setClasswiseData([]);
        return;
      }

      const { data: classes, error: classError } = await supabase
        .from('school_classes')
        .select('id, name, section, grade')
        .in('id', targetClassIds)
        .order('section');

      if (classError) throw classError;

      // For each class, get learner statistics
      const classwiseStats = await Promise.all(
        classes.map(async (classInfo) => {
          // Get learners in this class
          const { data: learners, error: learnersError } = await supabase
            .from('learners')
            .select('id')
            .eq('school_class_id', classInfo.id)
            .or('is_deleted.is.null,is_deleted.eq.false');

          if (learnersError) throw learnersError;

          const learnerIds = learners.map(s => s.id);
          
          if (learnerIds.length === 0) {
            return {
              class_id: classInfo.id,
              section: classInfo.section,
              class_name: classInfo.name,
              total_learners: 0,
              learners_with_marks: 0,
              passed_learners: 0,
              average_marks: null,
              highest_marks: null,
              lowest_marks: null,
              pass_rate: 0,
              attendance_rate: 0
            };
          }

          // Get mark entries for these learners in this exam
          const { data: markEntries, error: marksError } = await supabase
            .from('mark_entries')
            .select('learner_id, marks_obtained, is_absent, subject_id')
            .eq('assessment_id', exam.id)
            .in('learner_id', learnerIds);

          if (marksError) throw marksError;

          // Calculate statistics
          const learnersWithMarks = new Set(
            markEntries
              .filter(me => me.marks_obtained !== null && !me.is_absent)
              .map(me => me.learner_id)
          ).size;

          const allMarks = markEntries
            .filter(me => me.marks_obtained !== null && !me.is_absent)
            .map(me => me.marks_obtained);

          // For pass calculation, check against actual subject passing marks
          const passedLearnerIds = new Set();
          
          // Group marks by learner and check if they pass all subjects
          const learnerMarksMap = new Map();
          markEntries.forEach(me => {
            if (!learnerMarksMap.has(me.learner_id)) {
              learnerMarksMap.set(me.learner_id, []);
            }
            learnerMarksMap.get(me.learner_id).push(me);
          });
          
          learnerMarksMap.forEach((learnerMarks, learnerId) => {
            const appearedSubjects = learnerMarks.filter((sm: any) => !sm.is_absent);
            const passedSubjects = appearedSubjects.filter((sm: any) => {
              const subject = exam.subjects.find(s => s.id === sm.subject_id);
              return sm.marks_obtained !== null && sm.marks_obtained >= (subject?.passingMarks || 0);
            });
            
            // Learner passes ONLY if they appeared for ALL subjects AND passed all of them
            if (appearedSubjects.length === exam.subjects.length && passedSubjects.length === exam.subjects.length) {
              passedLearnerIds.add(learnerId);
            }
          });
          
          const passedlearners = passedLearnerIds.size;

          const averageMarks = allMarks.length > 0 ? 
            Math.round((allMarks.reduce((a, b) => a + b, 0) / allMarks.length) * 100) / 100 : null;
          const highestMarks = allMarks.length > 0 ? Math.max(...allMarks) : null;
          const lowestMarks = allMarks.length > 0 ? Math.min(...allMarks) : null;

          return {
            class_id: classInfo.id,
            section: classInfo.section,
            class_name: classInfo.name,
            total_learners: learnerIds.length,
            learners_with_marks: learnersWithMarks,
            passed_learners: passedlearners,
            average_marks: averageMarks,
            highest_marks: highestMarks,
            lowest_marks: lowestMarks,
            pass_rate: learnersWithMarks > 0 ? Math.round((passedlearners / learnersWithMarks) * 100) : 0,
            attendance_rate: learnerIds.length > 0 ? Math.round((learnersWithMarks / learnerIds.length) * 100) : 0
          };
        })
      );

      // Filter out classes with no learners and sort by section
      const filteredStats = classwiseStats
        .filter(stat => stat.total_learners > 0)
        .sort((a, b) => a.section.localeCompare(b.section));
      
      setClasswiseData(filteredStats);
    } catch (error) {
      logger.error('Failed to fetch class-wise data', error as Error);
      setClasswiseData([]);
    } finally {
      setLoadingClasswise(false);
    }
  }, [exam.id, exam.targetClasses, isWholeGradeExam]);

  // Fetch class-wise data when component mounts or exam changes
  React.useEffect(() => {
    if (selectedView === 'classwise' && isWholeGradeExam) {
      fetchClasswiseData();
    }
  }, [selectedView, fetchClasswiseData, isWholeGradeExam]);

  // Calculate overall statistics
  const overallStats = React.useMemo(() => {
    const alllearners = exam.marks.flatMap(m => m.learnerMarks);
    const uniquelearners = Array.from(new Set(alllearners.map(s => s.learnerId)));
    const totallearners = uniquelearners.length;
    
    // Calculate pass/fail for each learner across all subjects
    const learnerResults = uniquelearners.map(learnerId => {
      const learnerMarks = exam.marks.map(subjectMark => {
        const mark = subjectMark.learnerMarks.find(sm => sm.learnerId === learnerId);
        const subject = exam.subjects.find(s => s.id === subjectMark.subjectId);
        const isModerated = mark?.originalMarks !== null && mark?.originalMarks !== mark?.marks;
        
        return {
          subjectId: subjectMark.subjectId,
          subjectName: subjectMark.subjectName,
          marks: mark?.marks || null,
          originalMarks: mark?.originalMarks || null,
          isAbsent: mark?.isAbsent || false,
          isModerated,
          passed: mark && !mark.isAbsent && mark.marks !== null && mark.marks >= (subject?.passingMarks || 0),
          passingMarks: subject?.passingMarks || 0
        };
      });
      
      // Count subjects where learner appeared (not absent)
      const appearedSubjects = learnerMarks.filter(sm => !sm.isAbsent);
      const passedSubjects = learnerMarks.filter(sm => sm.passed);
      
      // Learner passes overall ONLY if they appeared for ALL subjects AND passed all of them
      // If absent for any subject, they fail overall
      const overallPassed = appearedSubjects.length === exam.subjects.length && passedSubjects.length === exam.subjects.length;
      
      // Calculate total marks and percentage based on actual subject max marks
      const totalMarks = appearedSubjects.reduce((sum, sm) => sum + (sm.marks || 0), 0);
      const maxMarks = appearedSubjects.reduce((sum, sm) => {
        const subject = exam.subjects.find(s => s.id === sm.subjectId);
        return sum + (subject?.totalMarks || 100); // Use subject's total marks or default to 100
      }, 0);
      const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
      
      // Calculate grade based on percentage - only if learner appeared for ALL subjects and passed
      let grade;
      if (appearedSubjects.length === 0) {
        grade = '-'; // No grade for fully absent learners
      } else if (appearedSubjects.length < exam.subjects.length) {
        grade = 'F'; // Absent for any subject = Fail
      } else if (overallPassed) {
        // If learner appeared for all subjects and passed all, calculate grade based on percentage
        grade = percentage >= 90 ? 'A+' : 
                percentage >= 80 ? 'A' : 
                percentage >= 70 ? 'B+' : 
                percentage >= 60 ? 'B' : 
                percentage >= 50 ? 'C' : 'D'; // Minimum D for passing learners
      } else {
        grade = 'F'; // Failed any subject = F
      }
      
      return {
        learnerId,
        passedSubjects: passedSubjects.length,
        appearedSubjects: appearedSubjects.length,
        totalSubjects: exam.subjects.length,
        overallPassed,
        totalMarks,
        maxMarks,
        percentage,
        grade,
        learnerMarks
      };
    });
    
    // Count different categories of learners
    const fullyAbsentlearners = learnerResults.filter(sr => sr.appearedSubjects === 0).length;
    const partiallyAbsentlearners = learnerResults.filter(sr => sr.appearedSubjects > 0 && sr.appearedSubjects < sr.totalSubjects).length;
    const fullyAppearedlearners = learnerResults.filter(sr => sr.appearedSubjects === sr.totalSubjects).length;
    const passedlearners = learnerResults.filter(sr => sr.overallPassed).length;
    const failedlearners = totallearners - passedlearners - fullyAbsentlearners;
    
    // Pass rate based on all learners (excluding fully absent)
    const learnersWithSomeAppearance = totallearners - fullyAbsentlearners;
    const passRate = learnersWithSomeAppearance > 0 ? Math.round((passedlearners / learnersWithSomeAppearance) * 100) : 0;
    
    return {
      totallearners,
      appearedlearners: fullyAppearedlearners,
      absentlearners: fullyAbsentlearners,
      partiallyAbsentlearners,
      passedlearners,
      failedlearners,
      passRate,
      learnerResults
    };
  }, [exam.marks, exam.subjects]);

  // Calculate subject-wise statistics
  const subjectStats = React.useMemo(() => {
    return exam.marks.map(subjectMark => {
      const subject = exam.subjects.find(s => s.id === subjectMark.subjectId);
      const totallearners = subjectMark.learnerMarks.length;
      const presentlearners = subjectMark.learnerMarks.filter(s => !s.isAbsent);
      const absentlearners = subjectMark.learnerMarks.filter(s => s.isAbsent);
      const passedlearners = presentlearners.filter(s => s.marks !== null && s.marks >= (subject?.passingMarks || 0));
      const failedlearners = presentlearners.filter(s => s.marks !== null && s.marks < (subject?.passingMarks || 0));
      const moderatedlearners = subjectMark.learnerMarks.filter(s => s.originalMarks !== null && s.originalMarks !== s.marks);
      
      const passRate = presentlearners.length > 0 ? Math.round((passedlearners.length / presentlearners.length) * 100) : 0;
      
      const validMarks = presentlearners.map(s => s.marks || 0).filter(m => m !== null);
      const average = validMarks.length > 0 ? Math.round((validMarks.reduce((a, b) => a + b, 0) / validMarks.length) * 100) / 100 : 0;
      const highest = validMarks.length > 0 ? Math.max(...validMarks) : 0;
      const lowest = validMarks.length > 0 ? Math.min(...validMarks) : 0;
      
      return {
        ...subjectMark,
        subject,
        totallearners,
        presentlearners: presentlearners.length,
        absentlearners: absentlearners.length,
        passedlearners: passedlearners.length,
        failedlearners: failedlearners.length,
        moderatedlearners: moderatedlearners.length,
        passRate,
        average,
        highest,
        lowest
      };
    });
  }, [exam.marks, exam.subjects]);

  const exportResults = () => {
    const csvData = exam.marks.map(sm => 
      sm.learnerMarks.map(learner => 
        `${learner.rollNumber},${learner.learnerName},${sm.subjectName},${learner.marks || "Absent"}`
      ).join('\n')
    ).join('\n');
    
    const blob = new Blob([`Roll No,Learner Name,Subject,Marks\n${csvData}`], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exam.name.replace(/\s+/g, '_')}_results.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Exam Results</h3>
          <p className="text-sm text-gray-500 mt-1">Published results for {exam.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <TypeBadge type={exam.type} />
          <span className="text-sm text-gray-500">
            Published on {exam.publishedAt ? new Date(exam.publishedAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
        <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-gray-50">
          <button
            onClick={() => setSelectedView('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'overview' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-700 hover:bg-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView('subject')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'subject' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-700 hover:bg-white"
            }`}
          >
            Subject Analysis
          </button>
          <button
            onClick={() => setSelectedView('learners')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'learners' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-700 hover:bg-white"
            }`}
          >
            Learner Results
          </button>
          {isWholeGradeExam && (
            <button
              onClick={() => setSelectedView('classwise')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === 'classwise' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-700 hover:bg-white"
              }`}
            >
              Class-wise Results
            </button>
          )}
        </div>
      </div>

      {/* Overview */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{overallStats.totallearners}</p>
                  <p className="text-sm text-blue-700">Total Learners</p>
                </div>
              </div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-2xl font-bold text-indigo-900">{overallStats.appearedlearners}</p>
                  <p className="text-sm text-indigo-700">Appeared</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrophyIcon className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{overallStats.passedlearners}</p>
                  <p className="text-sm text-green-700">Passed</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900">{overallStats.failedlearners}</p>
                  <p className="text-sm text-red-700">Failed</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">{overallStats.passRate}%</p>
                  <p className="text-sm text-purple-700">Pass Rate</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Statistics */}
          {(overallStats.absentlearners > 0 || overallStats.partiallyAbsentlearners > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                <div className="text-amber-800 font-medium">
                  {overallStats.absentlearners > 0 && (
                    <div>{overallStats.absentlearners} learner(s) were absent for all subjects</div>
                  )}
                  {overallStats.partiallyAbsentlearners > 0 && (
                    <div>{overallStats.partiallyAbsentlearners} learner(s) were absent for some subjects (marked as Fail)</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subject-wise Performance */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectStats.map(stat => (
                <div key={stat.subjectId} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">{stat.subjectName}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Present:</span>
                      <span className="font-medium text-gray-900">{stat.presentlearners}/{stat.totallearners}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pass Rate:</span>
                      <span className={`font-medium ${stat.passRate >= 75 ? 'text-green-600' : stat.passRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {stat.passRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average:</span>
                      <span className="font-medium text-gray-900">{stat.average}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Highest:</span>
                      <span className="font-medium text-gray-900">{stat.highest}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lowest:</span>
                      <span className="font-medium text-gray-900">{stat.lowest}</span>
                    </div>
                    {stat.moderatedlearners > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Moderated:</span>
                        <span className="font-medium text-purple-600">{stat.moderatedlearners}</span>
                      </div>
                    )}
                    {stat.absentlearners > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Absent:</span>
                        <span className="font-medium text-amber-600">{stat.absentlearners}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${stat.passRate >= 75 ? "bg-green-500" : stat.passRate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${stat.passRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subject Analysis */}
      {selectedView === 'subject' && (
        <div className="space-y-6">
          {/* Subject Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.map(stat => (
              <div 
                key={stat.subjectId} 
                className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedSubject === stat.subjectId ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedSubject(selectedSubject === stat.subjectId ? '' : stat.subjectId)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900">{stat.subjectName}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stat.passRate >= 75 ? 'bg-green-100 text-green-800' : 
                    stat.passRate >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {stat.passRate}% Pass
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <p className="text-gray-600">Average</p>
                    <p className="font-semibold text-gray-900">{stat.average}/{stat.subject?.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Present</p>
                    <p className="font-semibold text-gray-900">{stat.presentlearners}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Highest</p>
                    <p className="font-semibold text-green-600">{stat.highest}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Lowest</p>
                    <p className="font-semibold text-red-600">{stat.lowest}</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      stat.passRate >= 75 ? "bg-green-500" : 
                      stat.passRate >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${stat.passRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Subject Results */}
          {selectedSubject && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {(() => {
                const subjectMark = exam.marks.find(m => m.subjectId === selectedSubject);
                const subject = exam.subjects.find(s => s.id === selectedSubject);
                const stat = subjectStats.find(s => s.subjectId === selectedSubject);
                if (!subjectMark || !subject || !stat) return null;

                return (
                  <>
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900">{subject.name} - Learner Results</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Total Marks: {subject.totalMarks}</span>
                          <span>Passing Marks: {subject.passingMarks}</span>
                          <span>Duration: {subject.duration} min</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Roll No</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Learner Name</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Marks Obtained</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Percentage</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Grade</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {subjectMark.learnerMarks
                            .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }))
                            .map(learner => {
                              const percentage = learner.isAbsent || learner.marks === null ? 0 : 
                                Math.round((learner.marks / subject.totalMarks) * 100);
                              
                              const grade = learner.isAbsent ? 'AB' : 
                                           learner.marks === null ? 'N/A' :
                                           percentage >= 90 ? 'A+' :
                                           percentage >= 80 ? 'A' :
                                           percentage >= 70 ? 'B+' :
                                           percentage >= 60 ? 'B' :
                                           percentage >= 50 ? 'C' :
                                           percentage >= 40 ? 'D' : 'F';
                              
                              const passed = !learner.isAbsent && learner.marks !== null && learner.marks >= subject.passingMarks;
                              
                              return (
                                <tr key={learner.learnerId} className="hover:bg-gray-50">
                                  <td className="py-3 px-4 font-medium text-gray-900">{learner.rollNumber}</td>
                                  <td className="py-3 px-4 text-gray-900">{learner.learnerName}</td>
                                  <td className="py-3 px-4 text-center font-semibold">
                                    {learner.isAbsent ? (
                                      <span className="text-gray-500">Absent</span>
                                    ) : (
                                      <span className={passed ? 'text-green-600' : 'text-red-600'}>
                                        {learner.marks}/{subject.totalMarks}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-center font-medium">
                                    {learner.isAbsent ? '-' : `${percentage}%`}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                      learner.isAbsent ? 'bg-gray-100 text-gray-700' :
                                      grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-800' :
                                      grade === 'B+' || grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                      grade === 'C' ? 'bg-amber-100 text-amber-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {grade}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      learner.isAbsent ? 'bg-gray-100 text-gray-800' :
                                      passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {learner.isAbsent ? 'Absent' : passed ? 'Pass' : 'Fail'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Learner Results */}
      {selectedView === 'learners' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">All Learner Results</h4>
            <div className="text-xs text-gray-500">
              <span className="text-purple-600 font-bold">*</span> = Moderated marks
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3">Learner</th>
                  {exam.subjects.map(subject => (
                    <th key={subject.id} className="text-left py-2 px-3">{subject.name}</th>
                  ))}
                  <th className="text-left py-2 px-3">Total</th>
                  <th className="text-left py-2 px-3">%</th>
                  <th className="text-left py-2 px-3">Grade</th>
                  <th className="text-left py-2 px-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {overallStats.learnerResults.map(result => {
                  const firstMark = exam.marks[0]?.learnerMarks.find(sm => sm.learnerId === result.learnerId);
                  
                  return (
                    <tr key={result.learnerId} className="border-b border-gray-100">
                      <td className="py-2 px-3">
                        <div>
                          <p className="font-medium">{firstMark?.learnerName}</p>
                          <p className="text-xs text-gray-500">{firstMark?.rollNumber}</p>
                        </div>
                      </td>
                      {exam.subjects.map(subject => {
                        const subjectMark = exam.marks.find(m => m.subjectId === subject.id);
                        const learnerMark = subjectMark?.learnerMarks.find(sm => sm.learnerId === result.learnerId);
                        const passed = learnerMark && !learnerMark.isAbsent && learnerMark.marks !== null && learnerMark.marks >= subject.passingMarks;
                        const isModerated = learnerMark?.originalMarks !== null && learnerMark?.originalMarks !== learnerMark?.marks;
                        
                        return (
                          <td key={subject.id} className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <span className={`font-medium ${
                                learnerMark?.isAbsent ? 'text-gray-500' :
                                passed ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {learnerMark?.isAbsent ? 'AB' : learnerMark?.marks || 'N/A'}
                              </span>
                              {isModerated && (
                                <span className="text-xs text-purple-600 font-bold" title={`Original: ${learnerMark?.originalMarks}`}>
                                  *
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-2 px-3">
                        <span className="font-medium text-gray-900">
                          {result.appearedSubjects > 0 ? result.totalMarks : 'AB'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span 
                          className="font-medium text-gray-900 cursor-help" 
                          title={result.appearedSubjects > 0 ? `${result.totalMarks} marks out of ${result.maxMarks} possible` : ''}
                        >
                          {result.appearedSubjects > 0 ? `${result.percentage}%` : '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.grade === 'A+' || result.grade === 'A' ? 'bg-green-100 text-green-800' :
                          result.grade === 'B+' || result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          result.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                          result.grade === 'F' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.appearedSubjects === 0 ? 'bg-gray-100 text-gray-800' :
                          result.overallPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.appearedSubjects === 0 ? 'Absent' : 
                           result.appearedSubjects < result.totalSubjects ? 'Fail (Absent)' :
                           result.overallPassed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class-wise Results */}
      {selectedView === 'classwise' && isWholeGradeExam && (
        <div className="space-y-6">
          {loadingClasswise ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Loading class-wise data...</span>
            </div>
          ) : (
            <>
              {/* Class-wise Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classwiseData.map((classData, index) => (
                  <div key={classData.class_id || index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          Section {classData.section}
                        </h4>
                        {classData.class_name && classData.class_name !== `Section ${classData.section}` && (
                          <p className="text-sm text-gray-600">{classData.class_name}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        classData.pass_rate >= 75 ? 'bg-green-100 text-green-800' :
                        classData.pass_rate >= 50 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {classData.pass_rate}% Pass
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Learners:</span>
                        <span className="font-semibold text-gray-900">{classData.total_learners}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Appeared:</span>
                        <span className="font-semibold text-gray-900">
                          {classData.learners_with_marks} ({classData.attendance_rate}%)
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Passed:</span>
                        <span className="font-semibold text-green-600">{classData.passed_learners}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Failed:</span>
                        <span className="font-semibold text-red-600">
                          {classData.learners_with_marks - classData.passed_learners}
                        </span>
                      </div>
                      
                      <hr className="my-3" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average:</span>
                        <span className="font-semibold text-gray-900">
                          {classData.average_marks ? `${classData.average_marks}%` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Highest:</span>
                        <span className="font-semibold text-green-600">
                          {classData.highest_marks || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Lowest:</span>
                        <span className="font-semibold text-red-600">
                          {classData.lowest_marks || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Pass Rate</span>
                        <span>{classData.pass_rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            classData.pass_rate >= 75 ? "bg-green-500" :
                            classData.pass_rate >= 50 ? "bg-amber-500" :
                            "bg-red-500"
                          }`}
                          style={{ width: `${classData.pass_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Class Comparison Table */}
              {classwiseData.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Class Comparison</h4>
                    <p className="text-sm text-gray-600 mt-1">Comparative analysis across all sections</p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Section</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Learners</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Appeared</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Passed</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Pass Rate</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Average</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Highest</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Lowest</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {classwiseData.map((classData, index) => (
                          <tr key={classData.class_id || index} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">
                              <div>
                                Section {classData.section}
                                {classData.class_name && classData.class_name !== `Section ${classData.section}` && (
                                  <div className="text-xs text-gray-500">{classData.class_name}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-gray-900">
                              {classData.total_learners}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-900">
                              {classData.learners_with_marks}
                              <span className="text-xs text-gray-500 ml-1">
                                ({classData.attendance_rate}%)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-green-600">
                              {classData.passed_learners}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                classData.pass_rate >= 75 ? 'bg-green-100 text-green-800' :
                                classData.pass_rate >= 50 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {classData.pass_rate}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-medium text-gray-900">
                              {classData.average_marks ? `${classData.average_marks}%` : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-green-600">
                              {classData.highest_marks || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-red-600">
                              {classData.lowest_marks || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {classwiseData.length === 0 && !loadingClasswise && (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Class Data Available</h3>
                  <p className="text-gray-600">
                    Class-wise results will appear here once marks are entered for learners.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
        <button 
          onClick={() => setActiveStep("publishing")} 
          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Publishing
        </button>
        <button 
          onClick={exportResults}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export Results
        </button>
      </div>
    </div>
  );
};

export default ResultsStep;
