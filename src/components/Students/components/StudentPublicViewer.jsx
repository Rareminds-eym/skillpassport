import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Award, 
  GraduationCap, 
  Mail,
  Phone,
  MapPin,
  User,
  Building,
  Briefcase,
  Star,
  Code,
  Heart
} from 'lucide-react';
import { useStudentDataByEmail } from '../../../hooks/useStudentDataByEmail';
import { Badge } from './ui/badge';

const StudentPublicViewer = () => {
  const { email } = useParams();
  
  const {
    studentData,
    loading,
    error
  } = useStudentDataByEmail(email);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <User className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Not Found</h2>
          <p className="text-gray-600 mb-6">The student profile you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const profile = studentData.profile || {};
  const education = studentData.education?.[0] || {};
  const employabilityScore = profile.employability_score || profile.employabilityScore || 0;
  const batch = profile.batch || 'Not Assigned';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Main Card Container */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-10 h-10 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Student Profile</h1>
                  <p className="text-indigo-100 text-sm">Public View</p>
                </div>
              </div>
              {profile.verified && (
                <div className="bg-green-500 rounded-full px-4 py-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold text-sm">Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Personal Information */}
          <div className="px-8 py-8 border-b-2 border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Photo and Name */}
              <div className="md:col-span-1 flex flex-col items-center md:items-start">
                {profile.photo ? (
                  <img 
                    src={profile.photo} 
                    alt={profile.name}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-indigo-200 shadow-lg mb-4"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center border-4 border-indigo-200 shadow-lg mb-4">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
                
                {/* Employability Score Badge */}
                <div className="bg-gradient-to-r from-yellow-400 to-amber-400 rounded-xl px-4 py-3 text-center w-full shadow-md">
                  <p className="text-xs font-semibold text-gray-800 mb-1">Employability Score</p>
                  <p className="text-3xl font-bold text-white">{employabilityScore}%</p>
                </div>
              </div>

              {/* Personal Details */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{profile.name || 'Student Name'}</h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Building className="w-5 h-5 text-indigo-500" />
                    <span className="text-lg font-medium">{profile.university || 'University Name'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <GraduationCap className="w-5 h-5 text-purple-500" />
                    <span className="text-md">{profile.department || education.department || 'Department'}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Student ID</p>
                      <p className="text-sm font-semibold text-gray-900">{studentData.id || 'N/A'}</p>
                    </div>
                  </div>

                  {profile.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-semibold text-gray-900">{profile.email}</p>
                      </div>
                    </div>
                  )}

                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-semibold text-gray-900">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Batch</p>
                      <p className="text-sm font-semibold text-gray-900">{batch}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Education */}
          <div className="px-8 py-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-b-2 border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Education</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Education Card 1 */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-indigo-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Degree</p>
                    <p className="text-lg font-bold text-gray-900">{education.degree || profile.degree || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Level</span>
                    <Badge className="bg-indigo-500 text-white border-0">
                      {education.level || profile.level || 'Undergraduate'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Department</span>
                    <span className="text-sm font-semibold text-gray-900">{education.department || profile.department || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Education Card 2 */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Academic Performance</p>
                    <p className="text-lg font-bold text-gray-900">Scores</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Year of Passing</span>
                    <span className="text-sm font-semibold text-gray-900">{education.yearOfPassing || profile.year_of_passing || 'N/A'}</span>
                  </div>
                  {(education.cgpa || profile.cgpa) && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">CGPA</span>
                      <Badge className="bg-purple-500 text-white border-0 text-base">
                        {education.cgpa || profile.cgpa}
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Institution</span>
                    <span className="text-xs font-medium text-gray-700 text-right">{profile.university || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Skills */}
          <div className="px-8 py-8">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Skills & Expertise</h2>
            </div>

            <div className="space-y-6">
              {/* Technical Skills */}
              {studentData.technicalSkills?.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Technical Skills</h3>
                    <Badge className="bg-blue-500 text-white border-0 ml-2">
                      {studentData.technicalSkills.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {studentData.technicalSkills.map((skill, idx) => (
                      <div 
                        key={idx}
                        className="bg-white border-2 border-blue-200 rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <span className="text-sm font-semibold text-blue-700">{skill.name}</span>
                        {skill.proficiency && (
                          <span className="text-xs text-gray-500 ml-2">• {skill.proficiency}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Soft Skills */}
              {studentData.softSkills?.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Soft Skills</h3>
                    <Badge className="bg-purple-500 text-white border-0 ml-2">
                      {studentData.softSkills.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {studentData.softSkills.map((skill, idx) => (
                      <div 
                        key={idx}
                        className="bg-white border-2 border-purple-200 rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <span className="text-sm font-semibold text-purple-700">{skill.name}</span>
                        {skill.proficiency && (
                          <span className="text-xs text-gray-500 ml-2">• {skill.proficiency}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Skills Message */}
              {(!studentData.technicalSkills?.length && !studentData.softSkills?.length) && (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No skills information available</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-4">
            <p className="text-center text-white text-sm">
              This is a verified student profile. All information is subject to verification.
            </p>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Profile viewed in read-only mode • No editing permissions
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentPublicViewer;
