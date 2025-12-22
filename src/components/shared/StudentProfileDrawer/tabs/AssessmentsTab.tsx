import React, { useState } from 'react';
import { AssessmentResult } from '../types';
import { 
  ChartBarIcon, 
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  UserCircleIcon,
  LightBulbIcon,
  BriefcaseIcon,
  BookOpenIcon,
  StarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { 
  IconBrain, 
  IconTarget, 
  IconTrendingUp,
  IconSchool,
  IconBuilding,
  IconMoodSmile,
  IconCalculator,
  IconUsers
} from '@tabler/icons-react';

interface AssessmentsTabProps {
  assessmentResults: AssessmentResult[];
  loading: boolean;
  studentType?: 'school' | 'college';
  studentGrade?: string;
}

const AssessmentsTab: React.FC<AssessmentsTabProps> = ({ 
  assessmentResults, 
  loading, 
  studentType = 'school',
  studentGrade 
}) => {
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);

  // Determine assessment context based on student type and grade
  const getAssessmentContext = () => {
    if (studentType === 'college') {
      return {
        title: 'Career & Skill Assessments',
        subtitle: 'Professional readiness and career guidance assessments',
        icon: IconBuilding,
        color: 'blue'
      };
    } else {
      const grade = parseInt(studentGrade || '0');
      if (grade >= 6 && grade <= 8) {
        return {
          title: 'Learning & Development Assessments',
          subtitle: 'Middle school aptitude and interest assessments',
          icon: IconSchool,
          color: 'green'
        };
      } else {
        return {
          title: 'Academic & Career Assessments',
          subtitle: 'High school academic and career readiness assessments',
          icon: IconBrain,
          color: 'purple'
        };
      }
    }
  };

  const context = getAssessmentContext();

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      default:
        return <InformationCircleIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatAssessmentData = (assessment: AssessmentResult) => {
    const sections = [];
    
    // RIASEC Interest Profile
    if (assessment.riasec_scores) {
      const riasecData = assessment.riasec_scores as any;
      const riasecLabels = {
        R: 'Realistic (Hands-on)',
        I: 'Investigative (Thinking)', 
        A: 'Artistic (Creative)',
        S: 'Social (Helping)',
        E: 'Enterprising (Leading)',
        C: 'Conventional (Organizing)'
      };
      
      sections.push({
        title: 'Interest Profile (RIASEC)',
        icon: IconTarget,
        data: Object.entries(riasecData).map(([key, value]) => ({
          label: riasecLabels[key as keyof typeof riasecLabels] || key,
          value: `${value}/20`,
          percentage: ((value as number) / 20) * 100
        }))
      });
    }

    // Big Five Personality Traits
    if (assessment.bigfive_scores) {
      const bigFiveData = assessment.bigfive_scores as any;
      const bigFiveLabels = {
        O: 'Openness to Experience',
        C: 'Conscientiousness', 
        E: 'Extraversion',
        A: 'Agreeableness',
        N: 'Neuroticism'
      };
      
      sections.push({
        title: 'Personality Traits (Big Five)',
        icon: IconMoodSmile,
        data: Object.entries(bigFiveData)
          .filter(([key]) => key !== 'workStyleSummary')
          .map(([key, value]) => ({
            label: bigFiveLabels[key as keyof typeof bigFiveLabels] || key,
            value: `${value}/5`,
            percentage: ((value as number) / 5) * 100
          }))
      });
    }

    // Knowledge Assessment Details
    if (assessment.knowledge_details) {
      const knowledgeData = assessment.knowledge_details as any;
      sections.push({
        title: 'Knowledge Assessment',
        icon: BookOpenIcon,
        data: [
          {
            label: 'Overall Score',
            value: `${knowledgeData.score || assessment.knowledge_score}/100`,
            percentage: parseFloat(knowledgeData.score || assessment.knowledge_score || '0')
          },
          {
            label: 'Questions Correct',
            value: `${knowledgeData.correctCount}/${knowledgeData.totalQuestions}`,
            percentage: (knowledgeData.correctCount / knowledgeData.totalQuestions) * 100
          }
        ]
      });
    }

    // Career Fit Analysis
    if (assessment.career_fit) {
      const careerData = assessment.career_fit as any;
      if (careerData.clusters && careerData.clusters.length > 0) {
        sections.push({
          title: 'Career Fit Analysis',
          icon: BriefcaseIcon,
          data: careerData.clusters.slice(0, 3).map((cluster: any) => ({
            label: cluster.title,
            value: `${cluster.fit} Fit (${cluster.matchScore}%)`,
            description: cluster.description,
            percentage: cluster.matchScore
          }))
        });
      }
    }

    // Skill Gap Analysis
    if (assessment.skill_gap) {
      const skillGapData = assessment.skill_gap as any;
      const skillsToImprove = [];
      
      if (skillGapData.priorityA) {
        skillsToImprove.push(...skillGapData.priorityA.slice(0, 2));
      }
      if (skillGapData.priorityB && skillsToImprove.length < 3) {
        skillsToImprove.push(...skillGapData.priorityB.slice(0, 3 - skillsToImprove.length));
      }

      if (skillsToImprove.length > 0) {
        sections.push({
          title: 'Skills to Develop',
          icon: AcademicCapIcon,
          data: skillsToImprove.map((skill: any) => ({
            label: skill.skill,
            value: `${skill.currentLevel} → ${skill.targetLevel}`,
            description: skill.reason
          }))
        });
      }
    }

    // Work Values (if available)
    if (assessment.work_values_scores) {
      const workValuesData = assessment.work_values_scores as any;
      sections.push({
        title: 'Work Values',
        icon: StarIcon,
        data: Object.entries(workValuesData).map(([key, value]) => ({
          label: key.replace(/([A-Z])/g, ' $1').trim(),
          value: `${value}/5`,
          percentage: ((value as number) / 5) * 100
        }))
      });
    }

    // Aptitude Scores (if available)
    if (assessment.aptitude_scores && Object.keys(assessment.aptitude_scores).length > 0) {
      const aptitudeData = assessment.aptitude_scores as any;
      sections.push({
        title: 'Aptitude Assessment',
        icon: IconCalculator,
        data: Object.entries(aptitudeData).map(([key, value]) => ({
          label: key.replace(/([A-Z])/g, ' $1').trim(),
          value: typeof value === 'object' ? `${(value as any).percentage}%` : `${value}`,
          percentage: typeof value === 'object' ? (value as any).percentage : parseFloat(value as string)
        }))
      });
    }

    // Employability Scores (if available)
    if (assessment.employability_scores) {
      const employabilityData = assessment.employability_scores as any;
      sections.push({
        title: 'Employability Assessment',
        icon: IconUsers,
        data: Object.entries(employabilityData).map(([key, value]) => ({
          label: key.replace(/([A-Z])/g, ' $1').trim(),
          value: typeof value === 'object' ? JSON.stringify(value) : `${value}`,
          percentage: typeof value === 'number' ? value : undefined
        }))
      });
    }

    // Profile Snapshot (if available)
    if (assessment.profile_snapshot) {
      const profileData = assessment.profile_snapshot as any;
      const profileItems: any[] = [];
      
      if (profileData.keyPatterns) {
        Object.entries(profileData.keyPatterns).forEach(([key, value]) => {
          profileItems.push({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: value as string,
            description: `Key pattern in ${key}`
          });
        });
      }

      if (profileData.aptitudeStrengths) {
        profileData.aptitudeStrengths.forEach((strength: any) => {
          profileItems.push({
            label: `Strength: ${strength.name}`,
            value: strength.description,
            description: 'Identified aptitude strength'
          });
        });
      }

      if (profileItems.length > 0) {
        sections.push({
          title: 'Profile Snapshot',
          icon: UserCircleIcon,
          data: profileItems
        });
      }
    }

    // Final Note (if available)
    if (assessment.final_note) {
      const finalNoteData = assessment.final_note as any;
      const finalNoteItems: any[] = [];
      
      if (finalNoteData.advantage) {
        finalNoteItems.push({
          label: 'Key Advantage',
          value: finalNoteData.advantage,
          description: 'Your main strength identified'
        });
      }
      
      if (finalNoteData.growthFocus) {
        finalNoteItems.push({
          label: 'Growth Focus',
          value: finalNoteData.growthFocus,
          description: 'Recommended next steps'
        });
      }

      if (finalNoteItems.length > 0) {
        sections.push({
          title: 'Key Insights',
          icon: LightBulbIcon,
          data: finalNoteItems
        });
      }
    }

    // Basic Assessment Info
    const basicInfo = [];
    
    if (assessment.riasec_code) {
      basicInfo.push({
        label: 'RIASEC Code',
        value: assessment.riasec_code,
        description: 'Holland Career Interest Code'
      });
    }
    
    if (assessment.grade_level) {
      basicInfo.push({
        label: 'Assessment Level',
        value: assessment.grade_level.charAt(0).toUpperCase() + assessment.grade_level.slice(1),
        description: 'Target grade/education level'
      });
    }

    if (assessment.stream_id) {
      const streamName = assessment.stream_id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      basicInfo.push({
        label: 'Assessment Stream',
        value: streamName,
        description: 'Assessment category or stream'
      });
    }

    if (assessment.employability_readiness) {
      basicInfo.push({
        label: 'Career Readiness',
        value: assessment.employability_readiness,
        description: 'Readiness for professional environment'
      });
    }

    if (assessment.aptitude_overall && parseFloat(assessment.aptitude_overall.toString()) > 0) {
      basicInfo.push({
        label: 'Overall Aptitude',
        value: `${assessment.aptitude_overall}/100`,
        description: 'General cognitive ability score',
        percentage: parseFloat(assessment.aptitude_overall.toString())
      });
    }

    if (basicInfo.length > 0) {
      sections.push({
        title: 'Assessment Details',
        icon: InformationCircleIcon,
        data: basicInfo
      });
    }

    return sections;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          {/* Assessment cards skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
        <ChartBarIcon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-2">No assessments completed</h3>
      <p className="text-sm text-gray-500">
        {studentType === 'college' 
          ? 'Complete career assessments to get personalized guidance'
          : 'Take assessments to track your learning progress'
        }
      </p>
    </div>
  );

  if (assessmentResults.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <context.icon className={`h-5 w-5 text-${context.color}-600`} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{context.title}</h3>
            <p className="text-sm text-gray-600">{context.subtitle}</p>
          </div>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <context.icon className={`h-5 w-5 text-${context.color}-600`} />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{context.title}</h3>
          <p className="text-sm text-gray-600">{context.subtitle}</p>
        </div>
      </div>
      
      {/* Assessment Cards */}
      <div className="space-y-4">
        {assessmentResults.map((assessment) => {
          const assessmentSections = formatAssessmentData(assessment);
          const overallScore = assessment.knowledge_score ? parseFloat(assessment.knowledge_score.toString()) : 
                              assessment.aptitude_overall ? parseFloat(assessment.aptitude_overall.toString()) : 
                              assessment.percentage || 0;

          return (
            <div key={assessment.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedAssessment(
                  expandedAssessment === assessment.id ? null : assessment.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(assessment.status || 'completed')}
                      <h4 className="text-sm font-semibold text-gray-900">
                        {assessment.assessment_type || 'Personal Assessment'}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        assessment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        assessment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {assessment.status || 'Completed'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </span>
                      {assessment.grade_level && (
                        <span className="flex items-center gap-1">
                          <IconTarget className="h-3 w-3" />
                          {assessment.grade_level.charAt(0).toUpperCase() + assessment.grade_level.slice(1)} Level
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {overallScore > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(overallScore)}`}
                            style={{ width: `${Math.min(overallScore, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getScoreColor(overallScore)}`}>
                          {Math.round(overallScore)}%
                        </span>
                      </div>
                    )}
                    
                    <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg 
                        className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
                          expandedAssessment === assessment.id ? 'rotate-180' : ''
                        }`} 
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
              
              {expandedAssessment === assessment.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {/* Overall Summary */}
                  {assessment.overall_summary && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <IconBrain className="h-4 w-4" />
                        Assessment Summary
                      </h5>
                      <p className="text-sm text-blue-800 leading-relaxed">{assessment.overall_summary}</p>
                    </div>
                  )}

                  {/* Assessment Sections */}
                  <div className="space-y-6">
                    {assessmentSections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="bg-white rounded-lg border border-gray-200 p-4">
                        <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <section.icon className="h-4 w-4 text-gray-600" />
                          {section.title}
                        </h5>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {section.data.map((item: any, itemIndex: number) => (
                            <div key={itemIndex} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <span className="text-xs text-gray-600 font-medium block mb-1">
                                    {item.label}
                                  </span>
                                  <span className="text-sm font-semibold text-gray-900 block mb-1">
                                    {item.value}
                                  </span>
                                  {item.description && (
                                    <span className="text-xs text-gray-600 leading-relaxed block">
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                                {item.percentage !== undefined && (
                                  <div className="ml-3 flex flex-col items-end">
                                    <span className="text-xs font-medium text-gray-700 mb-1">
                                      {Math.round(item.percentage)}%
                                    </span>
                                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className={`h-1.5 rounded-full ${getProgressBarColor(item.percentage)}`}
                                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Work Style Summary (if available) */}
                  {assessment.bigfive_scores && (assessment.bigfive_scores as any).workStyleSummary && (
                    <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h5 className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
                        <IconTrendingUp className="h-4 w-4" />
                        Work Style Summary
                      </h5>
                      <p className="text-sm text-purple-800 leading-relaxed">
                        {(assessment.bigfive_scores as any).workStyleSummary}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssessmentsTab;