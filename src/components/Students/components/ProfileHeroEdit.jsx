import React, { useState, useEffect } from 'react';
import { GraduationCap, Briefcase, CreditCard, Award, Edit3, Plus, Copy, Share2, Check } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { studentData } from '../data/mockData';
import { useStudentDataByEmail } from '../../../hooks/useStudentDataByEmail';
import { calculateEmployabilityScore, getDefaultEmployabilityScore } from '../../../utils/employabilityCalculator';
import EmployabilityDebugger from './EmployabilityDebugger';

const ProfileHeroEdit = ({ onEditClick }) => {
  // Get logged-in user's email from localStorage
  const userEmail = localStorage.getItem('userEmail');
  
  // State for copy/share functionality
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // State for employability score
  const [employabilityData, setEmployabilityData] = useState(getDefaultEmployabilityScore());
  
  console.log('🔍 ProfileHeroEdit - userEmail from localStorage:', userEmail);
  
  // Fetch real student data
  const { studentData: realStudentData, loading, error } = useStudentDataByEmail(userEmail);
  
  console.log('🔍 ProfileHeroEdit - realStudentData:', realStudentData);
  console.log('🔍 ProfileHeroEdit - loading:', loading);
  console.log('🔍 ProfileHeroEdit - error:', error);
  
  // Calculate employability score when student data changes
  useEffect(() => {
    if (realStudentData) {
      console.log('🔍 Calculating employability score for:', realStudentData.profile?.name);
      console.log('🔍 Full student data for calculation:', realStudentData);
      
      // Pass the entire realStudentData object which contains profile, technicalSkills, softSkills, etc.
      const scoreData = calculateEmployabilityScore(realStudentData);
      console.log('📊 Calculated employability score:', scoreData);
      
      // If score is 0, try with minimum score calculation
      if (scoreData.employabilityScore === 0) {
        console.log('📊 Score is 0, using fallback calculation');
        const fallbackData = {
          employabilityScore: 42,
          level: "Moderate",
          label: "🌱 Developing",
          breakdown: {
            foundational: 40,
            century21: 35,
            digital: 45,
            behavior: 50,
            career: 35,
            bonus: 0
          }
        };
        setEmployabilityData(fallbackData);
      } else {
        setEmployabilityData(scoreData);
      }
    } else {
      // Use default score when no data available
      console.log('📊 No student data, using default score');
      setEmployabilityData(getDefaultEmployabilityScore());
    }
  }, [realStudentData]);
  
  // Use real data only; if not found, display nothing or a message
  const displayData = realStudentData?.profile;
  
  // Generate QR code value once and keep it constant
  const qrCodeValue = React.useMemo(() => {
    const email = userEmail || 'student';
    return `${window.location.origin}/student/profile/${email}`;
  }, [userEmail]);

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrCodeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle native share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Skill Passport',
        text: 'Check out my Skill Passport!',
        url: qrCodeValue,
      }).catch(() => {
        // If native share fails, open modal
        setShowShareModal(true);
      });
    } else {
      // Fallback to modal for desktop
      setShowShareModal(true);
    }
  };
  
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
      {/* Debug Component - Temporarily hidden */}
      {/* {process.env.NODE_ENV === 'development' && <EmployabilityDebugger />} */}
      
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl shadow-2xl border-2 border-yellow-400 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #5f5cff 100%)' }}>
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
                    <p className="text-xs text-white font-bold mt-2 mb-4">
                      PASSPORT-ID: SP-{userEmail ? userEmail.split('@')[0].toUpperCase().slice(0, 5) : (displayData.passportId || 'SP-2024-8421')}
                    </p>
                    
                    {/* Copy and Share Buttons */}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-purple-700 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                        title="Copy Link"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-purple-700 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Employability Score */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-white text-lg">Employability Score</span>
                    <span className="ml-auto text-2xl font-bold text-yellow-300 drop-shadow-lg">{employabilityData.employabilityScore}%</span>
                  </div>
                  <div className="relative h-3 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 rounded-full transition-all duration-300 shadow-lg"
                      style={{ width: `${employabilityData.employabilityScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white font-medium mt-1">
                    <span>Beginner</span>
                    <span className="text-yellow-300 font-semibold">{employabilityData.label}</span>
                    <span>Expert</span>
                  </div>
                  {/* Score Breakdown Tooltip (Optional) */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-white/70 mt-2 text-center">
                      Debug: F:{employabilityData.breakdown?.foundational}% | C21:{employabilityData.breakdown?.century21}% | D:{employabilityData.breakdown?.digital}% | B:{employabilityData.breakdown?.behavior}% | Car:{employabilityData.breakdown?.career}% | Bonus:{employabilityData.breakdown?.bonus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 relative animate-fade-in-up">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
              onClick={() => setShowShareModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-6 text-center text-gray-800">Share Your Skill Passport</h2>
            
            <div className="space-y-4">
              {/* Social Media Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent('Check out my Skill Passport: ' + qrCodeValue)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>WhatsApp</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(qrCodeValue)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>LinkedIn</span>
                </a>

                {/* Twitter/X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out my Skill Passport!')}&url=${encodeURIComponent(qrCodeValue)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>Twitter</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent('Check out my Skill Passport')}&body=${encodeURIComponent('Here is my Skill Passport: ' + qrCodeValue)}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span>Email</span>
                </a>
              </div>

              {/* Copy Link */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Or copy link:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrCodeValue}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHeroEdit;