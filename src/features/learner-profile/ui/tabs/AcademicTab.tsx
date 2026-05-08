import React from 'react';
import { Learner } from '@/features/learner-profile/model';
import { isSchoolLearner } from '@/entities/learner/lib/learnerType';

interface AcademicTabProps {
  learner: Learner;
}

const AcademicTab: React.FC<AcademicTabProps> = ({ learner }) => {
  return (
    <div className="p-6 space-y-6">

      {isSchoolLearner(learner) ? (
        // School Learner Academic Info
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">School</span>
                <span className="font-medium text-gray-900">{learner.college_school_name || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Grade</span>
                <span className="font-medium text-gray-900">{learner.grade || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Section</span>
                <span className="font-medium text-gray-900">{learner.section || 'N/A'}</span>
              </div>
              {learner.roll_number && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Roll Number</span>
                  <span className="font-medium text-gray-900">{learner.roll_number}</span>
                </div>
              )}
              {learner.admission_number && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Admission Number</span>
                  <span className="font-medium text-gray-900">{learner.admission_number}</span>
                </div>
              )}
              {learner.enrollment_number && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Enrollment Number</span>
                  <span className="font-medium text-gray-900">{learner.enrollment_number}</span>
                </div>
              )}
              {learner.learner_id && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Learner ID</span>
                  <span className="font-medium text-gray-900">{learner.learner_id}</span>
                </div>
              )}
              {learner.learner_type && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Learner Type</span>
                  <span className="font-medium text-gray-900">{learner.learner_type}</span>
                </div>
              )}
            </div>
            <div className="mt-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${learner.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                {learner.approval_status ? learner.approval_status.charAt(0).toUpperCase() + learner.approval_status.slice(1) : 'Pending'}
              </span>
            </div>
          </div>

          {/* Show subjects if available */}
          {learner.subjects && learner.subjects.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {learner.subjects.map((subject: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // University/College Learner Education Info
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">College</span>
                <span className="font-medium text-gray-900">{learner.college || learner.profile?.university || learner.college_school_name || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Degree</span>
                <span className="font-medium text-gray-900">{learner.profile?.education?.[0]?.degree || learner.branch_field || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Section</span>
                <span className="font-medium text-gray-900">{learner.section || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">CGPA</span>
                <span className="font-medium text-gray-900">{learner.profile?.education?.[0]?.cgpa || learner.currentCgpa || 'N/A'}</span>
              </div>
              {learner.enrollment_number && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Enrollment Number</span>
                  <span className="font-medium text-gray-900">{learner.enrollment_number}</span>
                </div>
              )}
              {learner.registration_number && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Registration Number</span>
                  <span className="font-medium text-gray-900">{learner.registration_number}</span>
                </div>
              )}
              {learner.learner_id && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Learner ID</span>
                  <span className="font-medium text-gray-900">{learner.learner_id}</span>
                </div>
              )}
              {learner.learner_type && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Learner Type</span>
                  <span className="font-medium text-gray-900">{learner.learner_type}</span>
                </div>
              )}
              {learner.university && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">University</span>
                  <span className="font-medium text-gray-900">{learner.university}</span>
                </div>
              )}
            </div>
            <div className="mt-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${learner.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                {learner.approval_status ? learner.approval_status.charAt(0).toUpperCase() + learner.approval_status.slice(1) : 'Pending'}
              </span>
            </div>
          </div>

          {/* Education History - Enhanced version matching original */}
          {learner.profile?.education && learner.profile.education.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Education History</h3>
              <div className="space-y-4">
                {learner.profile.education.map((edu: any, index: number) => (
                  <div key={edu.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">Degree</span>
                        <span className="font-medium text-gray-900">{edu.degree || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">Level</span>
                        <span className="font-medium text-gray-900">{edu.level || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">University</span>
                        <span className="font-medium text-gray-900">{edu.university || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">CGPA</span>
                        <span className="font-medium text-gray-900">{edu.cgpa || 'N/A'}</span>
                      </div>
                      {edu.department && (
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">Department</span>
                          <span className="font-medium text-gray-900">{edu.department}</span>
                        </div>
                      )}
                      {edu.yearOfPassing && (
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">Year of Passing</span>
                          <span className="font-medium text-gray-900">{edu.yearOfPassing}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${edu.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                        {edu.status ? edu.status.charAt(0).toUpperCase() + edu.status.slice(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AcademicTab;