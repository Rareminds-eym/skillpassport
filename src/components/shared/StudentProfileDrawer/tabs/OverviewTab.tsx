import React from 'react';
import { Student } from '../types';

interface OverviewTabProps {
  student: Student;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ student }) => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs mb-1">Full Name</span>
            <span className="font-medium text-gray-900">{student.name || student.profile?.name || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs mb-1">Email</span>
            <span className="font-medium text-gray-900 break-all">{student.email || student.profile?.email || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 text-xs mb-1">Contact</span>
            <span className="font-medium text-gray-900">{student.contact_number || student.contactNumber || student.phone || 'N/A'}</span>
          </div>
          
          {/* School-specific fields */}
          {student.school_id ? (
            <>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">School</span>
                <span className="font-medium text-gray-900">{student.college_school_name || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Grade</span>
                <span className="font-medium text-gray-900">{student.grade || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Section</span>
                <span className="font-medium text-gray-900">{student.section || 'N/A'}</span>
              </div>
              {student.roll_number && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Roll Number</span>
                  <span className="font-medium text-gray-900">{student.roll_number}</span>
                </div>
              )}
              {student.admission_number && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Admission Number</span>
                  <span className="font-medium text-gray-900">{student.admission_number}</span>
                </div>
              )}
              {student.category && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Category</span>
                  <span className="font-medium text-gray-900">{student.category}</span>
                </div>
              )}
              {student.quota && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Quota</span>
                  <span className="font-medium text-gray-900">{student.quota}</span>
                </div>
              )}
              {student.date_of_birth && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Date of Birth</span>
                  <span className="font-medium text-gray-900">{new Date(student.date_of_birth).toLocaleDateString()}</span>
                </div>
              )}
              {student.age && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Age</span>
                  <span className="font-medium text-gray-900">{student.age}</span>
                </div>
              )}
              {student.gender && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Gender</span>
                  <span className="font-medium text-gray-900">{student.gender}</span>
                </div>
              )}
              {student.bloodGroup && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Blood Group</span>
                  <span className="font-medium text-gray-900">{student.bloodGroup}</span>
                </div>
              )}
              {student.district_name && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">District</span>
                  <span className="font-medium text-gray-900">{student.district_name}</span>
                </div>
              )}
            </>
          ) : (
            // University/College fields
            <>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">College</span>
                <span className="font-medium text-gray-900">{student.college || student.profile?.university || student.college_school_name || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Degree</span>
                <span className="font-medium text-gray-900">{student.profile?.education?.[0]?.degree || student.branch_field || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Section</span>
                <span className="font-medium text-gray-900">{student.section || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">CGPA</span>
                <span className="font-medium text-gray-900">{student.profile?.education?.[0]?.cgpa || student.currentCgpa || 'N/A'}</span>
              </div>
              {student.enrollment_number && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Enrollment Number</span>
                  <span className="font-medium text-gray-900">{student.enrollment_number}</span>
                </div>
              )}
              {student.registration_number && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Registration Number</span>
                  <span className="font-medium text-gray-900">{student.registration_number}</span>
                </div>
              )}
              {student.roll_number && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Roll Number</span>
                  <span className="font-medium text-gray-900">{student.roll_number}</span>
                </div>
              )}
              {student.category && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Category</span>
                  <span className="font-medium text-gray-900">{student.category}</span>
                </div>
              )}
              {student.quota && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Quota</span>
                  <span className="font-medium text-gray-900">{student.quota}</span>
                </div>
              )}
              {student.date_of_birth && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Date of Birth</span>
                  <span className="font-medium text-gray-900">{new Date(student.date_of_birth).toLocaleDateString()}</span>
                </div>
              )}
              {(student.age || student.profile?.age) && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Age</span>
                  <span className="font-medium text-gray-900">{student.age || student.profile?.age}</span>
                </div>
              )}
              {student.gender && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">Gender</span>
                  <span className="font-medium text-gray-900">{student.gender}</span>
                </div>
              )}
              {student.district_name && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">District</span>
                  <span className="font-medium text-gray-900">{student.district_name}</span>
                </div>
              )}
              {student.profile?.linkedin_link && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">LinkedIn</span>
                  <a
                    href={student.profile.linkedin_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-700 truncate"
                  >
                    View Profile →
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Guardian Information - Show for both school and college students if data exists */}
      {(student.guardianName || student.guardianPhone || student.guardianEmail) && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Guardian Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {student.guardianName && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Guardian Name</span>
                <span className="font-medium text-gray-900">{student.guardianName}</span>
              </div>
            )}
            {student.guardianPhone && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Guardian Phone</span>
                <span className="font-medium text-gray-900">{student.guardianPhone}</span>
              </div>
            )}
            {student.guardianEmail && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Guardian Email</span>
                <span className="font-medium text-gray-900">{student.guardianEmail}</span>
              </div>
            )}
            {student.guardianRelation && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Relation</span>
                <span className="font-medium text-gray-900">{student.guardianRelation}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Address Information - Show for both school and college students if data exists */}
      {(student.address || student.city || student.state || student.country || student.pincode) && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col sm:col-span-2">
              <span className="text-gray-500 text-xs mb-1">Address</span>
              <span className="font-medium text-gray-900">{student.address || '-'}</span>
            </div>
            {student.city && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">City</span>
                <span className="font-medium text-gray-900">{student.city}</span>
              </div>
            )}
            {student.state && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">State</span>
                <span className="font-medium text-gray-900">{student.state}</span>
              </div>
            )}
            {student.country && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Country</span>
                <span className="font-medium text-gray-900">{student.country}</span>
              </div>
            )}
            {student.pincode && (
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">Pincode</span>
                <span className="font-medium text-gray-900">{student.pincode}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical Skills */}
      {student.profile?.technicalSkills && student.profile.technicalSkills.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Skills</h3>
          <div className="flex flex-wrap gap-2">
            {student.profile.technicalSkills
              .filter((skill: any) => skill.enabled !== false)
              .map((skill: any, index: number) => (
                <span
                  key={skill.id || index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                >
                  {skill.name}
                  {skill.level && (
                    <span className="ml-2 text-xs opacity-75">
                      Level {skill.level}/5
                    </span>
                  )}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Soft Skills */}
      {student.profile?.softSkills && student.profile.softSkills.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Soft Skills</h3>
          <div className="flex flex-wrap gap-2">
            {student.profile.softSkills
              .filter((skill: any) => skill.enabled !== false)
              .map((skill: any, index: number) => (
                <span
                  key={skill.id || index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200"
                >
                  {skill.name}
                  {skill.level && (
                    <span className="ml-2 text-xs opacity-75">
                      Level {skill.level}/5
                    </span>
                  )}
                </span>
              ))}
          </div>
        </div>
      )}

      {student.profile?.bio && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Bio</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{student.profile.bio}</p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
              <div className="w-0.5 h-8 bg-gray-200 my-1"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Application Submitted</p>
              <p className="text-xs text-gray-500">
                {student.applied_date ? new Date(student.applied_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <div className={`w-3 h-3 ${
                student.admission_status === 'approved' || student.approval_status === 'approved' ? 'bg-green-600' : 
                student.admission_status === 'rejected' || student.approval_status === 'rejected' ? 'bg-red-600' : 
                'bg-gray-300'
              } rounded-full`}></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Application Decision</p>
              <p className="text-xs text-gray-500">
                Status: {(student.admission_status || student.approval_status || 'PENDING').toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;