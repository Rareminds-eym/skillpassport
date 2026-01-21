import React from 'react';
import { GraduationCap, Building2, CreditCard, Award, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { studentData } from '../data/mockData';

const HeroSection = ({ approvalStatus = 'pending' }) => {
  return (
    <div className="bg-[#f6f7fd] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl shadow-lg border border-blue-200 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400" />
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column - Profile Info */}
              <div className="space-y-6">
                {/* Profile Icon with Badge */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md border-2 border-white">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                      <Award className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                        Sarah Johnson
                      </h1>
                      {approvalStatus === 'approved' && (
                        <Badge className="bg-green-100 text-green-700 border-green-300 border px-3 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approved
                        </Badge>
                      )}
                      {approvalStatus === 'pending' && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300 border px-3 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* University and Student ID */}
                <div className="space-y-2 ml-1">
                  <div className="flex items-center gap-2 text-white">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">Stanford University</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <CreditCard className="w-4 h-4" />
                    <span>Student ID: SU2024-8421</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-3 ml-1">
                  <Badge className="bg-white text-indigo-700 border-0 px-4 py-1.5 text-sm font-medium rounded-full shadow-md hover:scale-105 transition-transform">
                    Computer Science
                  </Badge>
                  <Badge className="bg-white text-blue-600 border-0 px-4 py-1.5 text-sm font-medium rounded-full shadow-md hover:scale-105 transition-transform">
                    Class of 2025
                  </Badge>
                </div>
              </div>

              {/* Right Column - QR Code and Score */}
              <div className="space-y-6">
                {/* QR Code Card */}
                <Card className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl">
                  <CardContent className="p-6 text-center">
                    <div className="w-28 h-28 mx-auto mb-2 bg-white rounded-xl flex items-center justify-center shadow-md p-2">
                      {/* QR Code Design */}
                      <div className="w-full h-full grid grid-cols-5 gap-1">
                        {/* Top-left position marker */}
                        <div className="col-span-2 row-span-2 border-4 border-indigo-600 rounded-sm p-0.5">
                          <div className="w-full h-full bg-indigo-600 rounded-sm"></div>
                        </div>
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={`tl-${i}`}
                            className={`${Math.random() > 0.5 ? 'bg-indigo-600' : ''} rounded-sm`}
                          ></div>
                        ))}
                        {/* Second row */}
                        {[...Array(2)].map((_, i) => (
                          <div key={`r2-${i}`} className="bg-transparent"></div>
                        ))}
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={`r2b-${i}`}
                            className={`${Math.random() > 0.5 ? 'bg-indigo-600' : ''} rounded-sm`}
                          ></div>
                        ))}
                        {/* Middle rows */}
                        {[...Array(9)].map((_, i) => (
                          <div
                            key={`m-${i}`}
                            className={`${Math.random() > 0.4 ? 'bg-indigo-600' : ''} rounded-sm`}
                          ></div>
                        ))}
                        {/* Bottom-left position marker */}
                        <div className="col-span-2 row-span-2 border-4 border-indigo-600 rounded-sm p-0.5">
                          <div className="w-full h-full bg-indigo-600 rounded-sm"></div>
                        </div>
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={`bl-${i}`}
                            className={`${Math.random() > 0.5 ? 'bg-indigo-600' : ''} rounded-sm`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-white font-bold mt-2">PASSPORT-ID: SP-2024-8421</p>
                  </CardContent>
                </Card>

                {/* Employability Score */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-white text-lg">Employability Score</span>
                    <span className="ml-auto text-2xl font-bold text-yellow-300 drop-shadow-lg">
                      78%
                    </span>
                  </div>
                  <div className="relative h-3 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 rounded-full transition-all duration-300 shadow-lg"
                      style={{ width: '78%' }}
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

export default HeroSection;
