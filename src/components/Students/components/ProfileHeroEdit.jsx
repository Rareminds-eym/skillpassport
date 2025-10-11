import React, { useState, useEffect } from 'react';
import { GraduationCap, Briefcase, CreditCard, Award, Edit3, Plus } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { studentData } from '../data/mockData';
import { useStudentDataByEmail } from '../../../hooks/useStudentDataByEmail';

const ProfileHeroEdit = ({ onEditClick }) => {
  // Get logged-in user's email from localStorage
  const userEmail = localStorage.getItem('userEmail');
  
  console.log('🔍 ProfileHeroEdit - userEmail from localStorage:', userEmail);
  
  // Fetch real student data
  const { studentData: realStudentData, loading, error } = useStudentDataByEmail(userEmail);
  
  console.log('🔍 ProfileHeroEdit - realStudentData:', realStudentData);
  console.log('🔍 ProfileHeroEdit - loading:', loading);
  console.log('🔍 ProfileHeroEdit - error:', error);
  
  // Use real data only; if not found, display nothing or a message
  const displayData = realStudentData?.profile;
  
  // Generate QR code value once and keep it constant
  const qrCodeValue = React.useMemo(() => {
    const email = userEmail || 'student';
    return `${window.location.origin}/student/profile/${email}`;
  }, [userEmail]);
  
  console.log('🔍 ProfileHeroEdit - displayData.name:', displayData?.name);
  if (!displayData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-center">
        No student data found. Please check your email or contact support.
      </div>
    );
  }
  const quickEditSections = [
    {
      id: 'education',
      label: 'Education',
      icon: Award,
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    {
      id: 'training', 
      label: 'Training',
      icon: GraduationCap,
      color: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    {
      id: 'experience',
      label: 'Experience', 
      icon: Briefcase,
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    },
    {
      id: 'softSkills',
      label: 'Soft Skills',
      icon: Plus,
      color: 'bg-orange-100 text-orange-700 hover:bg-orange-200'
    },
    {
      id: 'technicalSkills',
      label: 'Technical',
      icon: Plus,
      color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
    }
  ];

  return (
    <div className="bg-[#f6f7fd] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl shadow-2xl border-2 border-yellow-400 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #ff4757 0%, #c23bdb 50%, #5f5cff 100%)' }}>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 z-10" />
          <CardContent className="p-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-5 md-mt-10 ">
              
              {/* Left Column - Profile Info */}
              <div className="space-y-6">
                {/* Profile Icon with Badge */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-lg border-2 border-white">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                      <Award className="w-3 h-3 text-purple-700" />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <h1 className="text-3xl font-bold text-white drop-shadow-lg">{displayData.name || 'Student Name'}</h1>
                  </div>
                </div>

                {/* University and Student ID */}
                <div className="space-y-2 ml-1">
                  <div className="flex items-center gap-2 text-white">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium">{displayData.university || 'University'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CreditCard className="w-4 h-4" />
                    <span>Student ID: {displayData.passportId || displayData.studentId || 'N/A'}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-3 ml-1">
                  <Badge className="bg-white text-purple-700 border-0 px-4 py-1.5 text-sm font-medium rounded-full shadow-md hover:scale-105 transition-transform">
                    {displayData.department || displayData.degree || 'Computer Science'}
                  </Badge>
                  <Badge className="bg-white text-pink-600 border-0 px-4 py-1.5 text-sm font-medium rounded-full shadow-md hover:scale-105 transition-transform">
                    {displayData.classYear || 'Class of 2025'}
                  </Badge>
                </div>

                {/* Removed Quick Edit Buttons Section */}
              </div>

              {/* Right Column - QR Code and Score */}
              <div className="space-y-6">
                
                {/* QR Code Card */}
                <Card className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl">
                  <CardContent className="p-6 text-center pt-5 md:pt-10">
                    <div className="w-28 h-28 mx-auto mb-2 bg-white rounded-xl flex items-center justify-center shadow-md p-2">
                      {/* Student QR Code */}
                      <QRCodeSVG
                        value={qrCodeValue}
                        size={100}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <p className="text-xs text-white font-bold mt-2">
                      PASSPORT-ID: SP-{userEmail ? userEmail.split('@')[0].toUpperCase().slice(0, 5) : (displayData.passportId || 'SP-2024-8421')}
                    </p>
                  </CardContent>
                </Card>

                {/* Employability Score */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-white text-lg">Employability Score</span>
                    <span className="ml-auto text-2xl font-bold text-yellow-300 drop-shadow-lg">{displayData.employabilityScore || '78'}%</span>
                  </div>
                  <div className="relative h-3 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 rounded-full transition-all duration-300 shadow-lg"
                      style={{ width: `${displayData.employabilityScore || 78}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white font-medium mt-1">
                    <span>Beginner</span>
                    <span>Expert</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeroEdit;