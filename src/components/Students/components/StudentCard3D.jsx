import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CheckCircle, 
  Award, 
  GraduationCap, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  User,
  Building,
  Clock
} from 'lucide-react';
import { useStudentDataByEmail } from '../../../hooks/useStudentDataByEmail';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const StudentCard3D = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  const [tiltStyle, setTiltStyle] = useState({});
  
  const {
    studentData,
    loading,
    error
  } = useStudentDataByEmail(email);

  // 3D tilt effect on mouse move
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <User className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Not Found</h2>
          <p className="text-gray-600 mb-6">The student profile you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={() => navigate('/student/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const profile = studentData.profile || {};
  const education = studentData.education?.[0] || {};
  const employabilityScore = profile.employability_score || profile.employabilityScore || 0;
  const approvalStatus = studentData.approval_status || 'pending';
  const qrCodeValue = `${window.location.origin}/student/profile/${email}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/student/dashboard')}
          variant="outline"
          className="mb-6 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* 3D Card Container */}
        <div 
          className="relative"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            style={tiltStyle}
            className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Yellow Top Bar */}
            <div className="h-16 bg-gradient-to-r from-yellow-400 to-amber-400"></div>

            {/* Main Card Content */}
            <div className="p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Section - Student Info */}
                <div className="space-y-6">
                  {/* Logo/Name Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <GraduationCap className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white tracking-wide">
                        {profile.university || 'University'}
                      </h1>
                    </div>
                  </div>

                  {/* Student Photo and Name */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <div className="flex items-start gap-6">
                      {profile.photo ? (
                        <img 
                          src={profile.photo} 
                          alt={profile.name}
                          className="w-24 h-24 rounded-xl object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center border-4 border-white shadow-lg">
                          <User className="w-12 h-12 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h2 className="text-2xl font-bold text-white">{profile.name || 'Student Name'}</h2>
                          {approvalStatus === 'approved' && (
                            <Badge className="bg-green-500 text-white border-0 px-3 py-1 text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approved
                            </Badge>
                          )}
                          {approvalStatus === 'pending' && (
                            <Badge className="bg-amber-400 text-amber-900 border-0 px-3 py-1 text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              Pending
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-white/90 mb-2">
                          <Building className="w-4 h-4" />
                          <span className="text-sm">{profile.university || 'University'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/90">
                          <GraduationCap className="w-4 h-4" />
                          <span className="text-sm">{profile.department || education.department || 'Department'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student Details */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Student ID
                      </span>
                      <span className="text-white font-bold">{studentData.id || 'N/A'}</span>
                    </div>
                    
                    {profile.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </span>
                        <span className="text-white font-medium text-sm">{profile.email}</span>
                      </div>
                    )}

                    {profile.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone
                        </span>
                        <span className="text-white font-medium text-sm">{profile.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Education Details */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Education
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Degree</span>
                        <span className="text-white font-semibold">{education.degree || profile.degree || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Level</span>
                        <Badge className="bg-blue-500 text-white border-0">
                          {education.level || profile.level || 'Undergraduate'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Year</span>
                        <span className="text-white font-semibold">
                          {education.yearOfPassing || profile.year_of_passing || 'N/A'}
                        </span>
                      </div>
                      {(education.cgpa || profile.cgpa) && (
                        <div className="flex justify-between items-center">
                          <span className="text-white/80 text-sm">CGPA</span>
                          <span className="text-white font-semibold">{education.cgpa || profile.cgpa}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Badge */}
                  {profile.verified && (
                    <div className="bg-green-500 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                      <CheckCircle className="w-8 h-8 text-white" />
                      <div>
                        <p className="text-white font-bold text-lg">Verified Student</p>
                        <p className="text-white/90 text-sm">Profile authenticated and verified</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Section - QR Code and Score */}
                <div className="space-y-6">
                  {/* QR Code */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 flex flex-col items-center">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl mb-4">
                      <QRCodeSVG
                        value={qrCodeValue}
                        size={220}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <p className="text-white text-xl font-bold tracking-wider">
                      PASSPORT-ID: {studentData.passport_id || studentData.id?.toUpperCase().slice(0, 8) || 'N/A'}
                    </p>
                    <p className="text-white/70 text-sm mt-2">Scan to view profile</p>
                  </div>

                  {/* Employability Score */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-white text-2xl font-bold mb-6 text-center">
                      Employability Score
                    </h3>
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative">
                        <div className="text-7xl font-bold text-yellow-400">
                          {employabilityScore}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="w-full h-8 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${employabilityScore}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-white/80 text-sm mt-2 px-1">
                        <span>Beginner</span>
                        <span>Expert</span>
                      </div>
                    </div>

                    {/* Score Description */}
                    <div className="mt-6 text-center">
                      <p className="text-white/90 text-sm">
                        {employabilityScore >= 80 && "Excellent! Ready for top opportunities."}
                        {employabilityScore >= 60 && employabilityScore < 80 && "Great progress! Keep building your skills."}
                        {employabilityScore >= 40 && employabilityScore < 60 && "Good start! Continue developing your profile."}
                        {employabilityScore < 40 && "Keep learning and adding to your profile!"}
                      </p>
                    </div>
                  </div>

                  {/* Skills Summary */}
                  {(studentData.technicalSkills?.length > 0 || studentData.softSkills?.length > 0) && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                      <h3 className="text-white font-bold text-lg mb-4">Skills Overview</h3>
                      <div className="space-y-3">
                        {studentData.technicalSkills?.length > 0 && (
                          <div>
                            <p className="text-white/70 text-sm mb-2">Technical Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {studentData.technicalSkills.slice(0, 5).map((skill, idx) => (
                                <Badge 
                                  key={idx}
                                  className="bg-blue-500 text-white border-0"
                                >
                                  {skill.name}
                                </Badge>
                              ))}
                              {studentData.technicalSkills.length > 5 && (
                                <Badge className="bg-blue-600 text-white border-0">
                                  +{studentData.technicalSkills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {studentData.softSkills?.length > 0 && (
                          <div>
                            <p className="text-white/70 text-sm mb-2">Soft Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {studentData.softSkills.slice(0, 5).map((skill, idx) => (
                                <Badge
                                  key={idx}
                                  className="bg-indigo-500 text-white border-0"
                                >
                                  {skill.name}
                                </Badge>
                              ))}
                              {studentData.softSkills.length > 5 && (
                                <Badge className="bg-indigo-600 text-white border-0">
                                  +{studentData.softSkills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Below Card */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            This is a digital student profile card. Scan the QR code to access the full profile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentCard3D;
