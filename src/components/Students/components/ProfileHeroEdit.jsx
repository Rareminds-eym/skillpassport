import React, { useState, useEffect } from 'react';
import { GraduationCap, Briefcase, CreditCard, Award, Edit3, Plus } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
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
        <div className="rounded-3xl shadow-lg border border-[#f6e7c1] overflow-hidden bg-white relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#ffcb3c]" />
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-5 md-mt-10 ">
              
              {/* Left Column - Profile Info */}
              <div className="space-y-6">
                {/* Profile Icon with Badge */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6d3eff] to-[#7f56d9] flex items-center justify-center shadow-md">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#ffcb3c] rounded-full border-2 border-white flex items-center justify-center">
                      <Award className="w-3 h-3 text-[#6d3eff]" />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <h1 className="text-3xl font-bold text-[#23272e]">{displayData.name || 'Student Name'}</h1>
                  </div>
                </div>

                {/* University and Student ID */}
                <div className="space-y-2 ml-1">
                  <div className="flex items-center gap-2 text-[#23272e]">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium">{displayData.university || 'University'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#23272e]">
                    <CreditCard className="w-4 h-4" />
                    <span>Student ID: {displayData.passportId || displayData.studentId || 'N/A'}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-3 ml-1">
                  <Badge className="bg-[#e6edfd] text-[#4f46e5] border-0 px-4 py-1.5 text-sm font-medium rounded-full shadow-none">
                    {displayData.department || displayData.degree || 'Computer Science'}
                  </Badge>
                  <Badge className="bg-[#fbe7f7] text-[#c026d3] border-0 px-4 py-1.5 text-sm font-medium rounded-full shadow-none">
                    {displayData.classYear || 'Class of 2025'}
                  </Badge>
                </div>

                {/* Removed Quick Edit Buttons Section */}
              </div>

              {/* Right Column - QR Code and Score */}
              <div className="space-y-6">
                
                {/* QR Code Card */}
                <Card className="bg-[#f6f4ff] border-0 rounded-2xl shadow-none">
                  <CardContent className="p-6 text-center pt-5 md:pt-10">
                    <div className="w-28 h-28 mx-auto mb-2 bg-[#f6f4ff] rounded-xl flex items-center justify-center shadow-none p-2">
                      {/* QR Code Design */}
                      <div className="w-full h-full grid grid-cols-5 gap-1">
                        {/* Top-left position marker */}
                        <div className="col-span-2 row-span-2 border-4 border-purple-600 rounded-sm p-0.5">
                          <div className="w-full h-full bg-purple-600 rounded-sm"></div>
                        </div>
                        {[...Array(3)].map((_, i) => (
                          <div key={`tl-${i}`} className={`${Math.random() > 0.5 ? 'bg-purple-600' : ''} rounded-sm`}></div>
                        ))}
                        {/* Second row */}
                        {[...Array(2)].map((_, i) => (
                          <div key={`r2-${i}`} className="bg-transparent"></div>
                        ))}
                        {[...Array(3)].map((_, i) => (
                          <div key={`r2b-${i}`} className={`${Math.random() > 0.5 ? 'bg-purple-600' : ''} rounded-sm`}></div>
                        ))}
                        {/* Middle rows */}
                        {[...Array(9)].map((_, i) => (
                          <div key={`m-${i}`} className={`${Math.random() > 0.4 ? 'bg-purple-600' : ''} rounded-sm`}></div>
                        ))}
                        {/* Bottom-left position marker */}
                        <div className="col-span-2 row-span-2 border-4 border-purple-600 rounded-sm p-0.5">
                          <div className="w-full h-full bg-purple-600 rounded-sm"></div>
                        </div>
                        {[...Array(3)].map((_, i) => (
                          <div key={`bl-${i}`} className={`${Math.random() > 0.5 ? 'bg-purple-600' : ''} rounded-sm`}></div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#23272e] font-medium mt-2">
                      PASSPORT-ID: {displayData.passportId || 'SP-2024-8421'}
                    </p>
                  </CardContent>
                </Card>

                {/* Employability Score */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-[#23272e]">Employability Score</span>
                    <span className="ml-auto text-xl font-bold text-[#7f56d9]">{displayData.employabilityScore || '78'}%</span>
                  </div>
                  <div className="relative h-2 bg-[#e6e6e6] rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#6d3eff] via-[#a685fa] to-[#ffcb3c] rounded-full transition-all duration-300"
                      style={{ width: `${displayData.employabilityScore || 78}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#23272e] mt-1">
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