import React, { useState } from 'react';
import { XMarkIcon, UserIcon, AcademicCapIcon, DocumentTextIcon, ExclamationTriangleIcon, PhoneIcon, MapPinIcon, ClockIcon, EnvelopeIcon, ChatBubbleLeftEllipsisIcon, UserMinusIcon, CalendarIcon, ChevronDownIcon, ChevronUpIcon, CogIcon } from '@heroicons/react/24/outline';

interface Student {
  id: number;
  name: string;
  rollNo: string;
  department: string;
  semester: number;
  cgpa: number;
  atRisk: boolean;
  email: string;
  batch: string;
  riskFactors?: string[];
  lastInteraction?: string;
  interventionCount?: number;
}

interface MentorAllocation {
  id: number;
  mentorId: number;
  students: Student[];
  allocationPeriod: {
    startDate: string;
    endDate: string;
  };
  capacity: number;
  officeLocation: string;
  availableHours: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: string;
  academicYear: string;
  semester: string;
}

interface Mentor {
  id: number;
  name: string;
  email: string;
  department: string;
  designation: string;
  specializations?: string[];
  contactNumber?: string;
  allocations: MentorAllocation[];
}

interface MentorNote {
  id: number;
  mentorId: number;
  studentId: number;
  note: string;
  date: string;
  outcome: string;
  isPrivate: boolean;
  interventionType: 'academic' | 'personal' | 'career' | 'attendance' | 'behavioral' | 'financial' | 'other';
  status: 'pending' | 'in-progress' | 'completed' | 'escalated';
  // New fields for 2-way communication
  priority?: string;
  educator_response?: string;
  action_taken?: string;
  next_steps?: string;
  admin_feedback?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  _fullNote?: any; // Reference to full note data
}

interface MentorDetailsDrawerProps {
  mentor: Mentor;
  notes: MentorNote[];
  onClose: () => void;
  onLogIntervention?: (student: Student) => void;
  onReassignStudent?: (student: Student) => void;
  onConfigureAllocation?: (allocation: MentorAllocation) => void;
  onViewConversation?: (note: MentorNote) => void;
}

const MentorDetailsDrawer: React.FC<MentorDetailsDrawerProps> = ({ 
  mentor, 
  notes, 
  onClose, 
  onLogIntervention,
  onReassignStudent,
  onConfigureAllocation,
  onViewConversation
}) => {
  // State for accordion management
  const [expandedAllocations, setExpandedAllocations] = useState<Set<number>>(new Set());

  const toggleAllocation = (allocationId: number) => {
    const newExpanded = new Set(expandedAllocations);
    if (newExpanded.has(allocationId)) {
      newExpanded.delete(allocationId);
    } else {
      newExpanded.add(allocationId);
    }
    setExpandedAllocations(newExpanded);
  };

  const expandAll = () => {
    const activeAllocations = mentor.allocations.filter(a => a.status === 'active');
    setExpandedAllocations(new Set(activeAllocations.map(a => a.id)));
  };

  const collapseAll = () => {
    setExpandedAllocations(new Set());
  };
  // Helper functions to work with new allocation structure
  const getAllocatedStudents = () => {
    return mentor.allocations
      .filter(allocation => allocation.status === 'active')
      .flatMap(allocation => allocation.students);
  };

  const getAtRiskStudents = () => {
    return getAllocatedStudents().filter(student => student.atRisk);
  };

  const getLatestAllocation = () => {
    const activeAllocations = mentor.allocations.filter(allocation => allocation.status === 'active');
    return activeAllocations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };
  const getInterventionTypeColor = (type: string) => {
    const colors = {
      academic: 'bg-blue-100 text-blue-700',
      personal: 'bg-purple-100 text-purple-700',
      career: 'bg-green-100 text-green-700',
      attendance: 'bg-orange-100 text-orange-700',
      behavioral: 'bg-red-100 text-red-700',
      financial: 'bg-yellow-100 text-yellow-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      escalated: 'bg-red-100 text-red-700'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity inset-y-0 right-0 pl-10 max-w-full flex sm:pl-16" onClick={onClose}></div>

        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex sm:pl-16">
          <div className="w-screen max-w-4xl">
            <div className="h-full flex flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="bg-indigo-600 text-white p-6 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{mentor.name}</h2>
                    <p className="text-indigo-100">{mentor.designation} • {mentor.department}</p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-8">
                  {/* Mentor Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Faculty Information</h3>
                    
                    {/* Basic Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-900">{mentor.email}</p>
                        </div>
                      </div>
                      
                      {mentor.contactNumber && (
                        <div className="flex items-center gap-3">
                          <PhoneIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="text-sm font-medium text-gray-900">{mentor.contactNumber}</p>
                          </div>
                        </div>
                      )}

                      {mentor.employeeId && (
                        <div className="flex items-center gap-3">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Employee ID</p>
                            <p className="text-sm font-medium text-gray-900">{mentor.employeeId}</p>
                          </div>
                        </div>
                      )}

                      {mentor.gender && (
                        <div className="flex items-center gap-3">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Gender</p>
                            <p className="text-sm font-medium text-gray-900 capitalize">{mentor.gender}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Professional Information */}
                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Professional Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mentor.qualification && (
                          <div className="flex items-start gap-3">
                            <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Qualification</p>
                              <p className="text-sm font-medium text-gray-900">{mentor.qualification}</p>
                            </div>
                          </div>
                        )}

                        {mentor.specialization && (
                          <div className="flex items-start gap-3">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Specialization</p>
                              <p className="text-sm font-medium text-gray-900">{mentor.specialization}</p>
                            </div>
                          </div>
                        )}

                        {mentor.experienceYears && (
                          <div className="flex items-start gap-3">
                            <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Experience</p>
                              <p className="text-sm font-medium text-gray-900">{mentor.experienceYears} years</p>
                            </div>
                          </div>
                        )}

                        {mentor.dateOfJoining && (
                          <div className="flex items-start gap-3">
                            <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Date of Joining</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(mentor.dateOfJoining).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    {mentor.address && (
                      <div className="border-t border-gray-200 pt-4 mb-6">
                        <div className="flex items-start gap-3">
                          <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="text-sm font-medium text-gray-900">{mentor.address}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Subject Expertise */}
                    {mentor.specializations && mentor.specializations.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Subject Expertise</h4>
                        <div className="flex flex-wrap gap-2">
                          {mentor.specializations.map((spec: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Allocations - Accordion Style */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Active Allocations</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{mentor.allocations.filter(a => a.status === 'active').length} allocation periods</span>
                        {getAtRiskStudents().length > 0 && (
                          <div className="flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600">
                              {getAtRiskStudents().length} at-risk
                            </span>
                          </div>
                        )}
                        {mentor.allocations.filter(a => a.status === 'active').length > 1 && (
                          <div className="flex gap-2">
                            <button
                              onClick={expandAll}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Expand All
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={collapseAll}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Collapse All
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {mentor.allocations.filter(allocation => allocation.status === 'active').length === 0 ? (
                      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                        <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No active allocations</p>
                        <p className="text-sm">Allocations will appear here once students are assigned to this mentor</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mentor.allocations
                          .filter(allocation => allocation.status === 'active')
                          .sort((a, b) => new Date(b.allocationPeriod.startDate).getTime() - new Date(a.allocationPeriod.startDate).getTime())
                          .map((allocation: MentorAllocation) => {
                            const isExpanded = expandedAllocations.has(allocation.id);
                            return (
                              <div key={allocation.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                {/* Allocation Header - Always Visible */}
                                <div 
                                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => toggleAllocation(allocation.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    {(() => {
                                      const currentDate = new Date();
                                      const startDate = new Date(allocation.allocationPeriod.startDate);
                                      const endDate = new Date(allocation.allocationPeriod.endDate);
                                      const isCurrentPeriod = currentDate >= startDate && currentDate <= endDate;
                                      const isPastPeriod = currentDate > endDate;
                                      const isFuturePeriod = currentDate < startDate;
                                      
                                      return (
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                          isCurrentPeriod 
                                            ? 'bg-green-100' 
                                            : isPastPeriod 
                                            ? 'bg-gray-100' 
                                            : 'bg-blue-100'
                                        }`}>
                                          <CalendarIcon className={`h-4 w-4 ${
                                            isCurrentPeriod 
                                              ? 'text-green-600' 
                                              : isPastPeriod 
                                              ? 'text-gray-500' 
                                              : 'text-blue-600'
                                          }`} />
                                        </div>
                                      );
                                    })()}
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                          {allocation.allocationPeriod.startDate} to {allocation.allocationPeriod.endDate}
                                        </h4>
                                        {(() => {
                                          const currentDate = new Date();
                                          const startDate = new Date(allocation.allocationPeriod.startDate);
                                          const endDate = new Date(allocation.allocationPeriod.endDate);
                                          const isCurrentPeriod = currentDate >= startDate && currentDate <= endDate;
                                          const isPastPeriod = currentDate > endDate;
                                          const isFuturePeriod = currentDate < startDate;
                                          
                                          if (isCurrentPeriod) {
                                            return (
                                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                Active Now
                                              </span>
                                            );
                                          } else if (isPastPeriod) {
                                            return (
                                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                                Completed
                                              </span>
                                            );
                                          } else if (isFuturePeriod) {
                                            return (
                                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                Upcoming
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                      <p className="text-xs text-gray-600">
                                        {allocation.academicYear} • {allocation.semester}
                                      </p>
                                    </div>
                                  </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-medium text-gray-900">
                                            {allocation.students.length}/{allocation.capacity}
                                          </span>
                                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                            allocation.students.length >= allocation.capacity
                                              ? "bg-red-100 text-red-700"
                                              : allocation.students.length >= allocation.capacity * 0.8
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-green-100 text-green-700"
                                          }`}>
                                            {allocation.students.length >= allocation.capacity
                                              ? "Full"
                                              : allocation.students.length >= allocation.capacity * 0.8
                                              ? "Near Full"
                                              : "Available"
                                            }
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          {allocation.students.filter(s => s.atRisk).length > 0 && 
                                            `${allocation.students.filter(s => s.atRisk).length} at-risk`
                                          }
                                        </p>
                                      </div>
                                      {(() => {
                                        const currentDate = new Date();
                                        const startDate = new Date(allocation.allocationPeriod.startDate);
                                        const endDate = new Date(allocation.allocationPeriod.endDate);
                                        const isCurrentPeriod = currentDate >= startDate && currentDate <= endDate;
                                        const isFuturePeriod = currentDate < startDate;
                                        
                                        // Only show configure button for current or future periods
                                        return (isCurrentPeriod || isFuturePeriod) && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onConfigureAllocation?.(allocation);
                                            }}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Configure this allocation"
                                          >
                                            <CogIcon className="h-4 w-4" />
                                          </button>
                                        );
                                      })()}
                                      <div className="ml-2">
                                        {isExpanded ? (
                                          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                        ) : (
                                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                        )}
                                      </div>
                                    </div>
                                </div>

                                {/* Allocation Details - Expandable */}
                                {isExpanded && (
                                  <div className="px-4 pb-4 border-t border-gray-100">
                                    {/* Allocation Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 mt-3 text-sm">
                                      <div className="flex items-center gap-2">
                                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Office:</span>
                                        <span className="font-medium text-gray-900">{allocation.officeLocation}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <ClockIcon className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">Hours:</span>
                                        <span className="font-medium text-gray-900">{allocation.availableHours}</span>
                                      </div>
                                    </div>

                                    {/* Students in this Allocation */}
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                                        Students ({allocation.students.length})
                                      </h5>
                                      {allocation.students.length === 0 ? (
                                        <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-lg">
                                          <p className="text-sm">No students in this allocation period</p>
                                        </div>
                                      ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                          {allocation.students.map((student: Student) => (
                                            <div key={student.id} className="bg-gray-50 border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow">
                                              <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <h6 className="font-medium text-gray-900 text-sm">{student.name}</h6>
                                                    {student.atRisk && (
                                                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                                                        <ExclamationTriangleIcon className="h-3 w-3" />
                                                        At Risk
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 mb-2">
                                                    <div>
                                                      <span className="text-gray-500">Roll No:</span>
                                                      <p className="font-medium">{student.rollNo}</p>
                                                    </div>
                                                    <div>
                                                      <span className="text-gray-500">Batch:</span>
                                                      <p className="font-medium">{student.batch}</p>
                                                    </div>
                                                    <div>
                                                      <span className="text-gray-500">CGPA:</span>
                                                      <p className="font-medium">{student.cgpa}</p>
                                                    </div>
                                                    <div>
                                                      <span className="text-gray-500">Semester:</span>
                                                      <p className="font-medium">{student.semester}</p>
                                                    </div>
                                                  </div>
                                                  
                                                  {student.riskFactors && student.riskFactors.length > 0 && (
                                                    <div className="mb-2">
                                                      <p className="text-xs text-gray-500 mb-1">Risk Factors:</p>
                                                      <div className="flex flex-wrap gap-1">
                                                        {student.riskFactors.map((factor, index) => (
                                                          <span key={index} className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded">
                                                            {factor}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {student.lastInteraction && (
                                                    <p className="text-xs text-gray-500">
                                                      Last interaction: {new Date(student.lastInteraction).toLocaleDateString()}
                                                    </p>
                                                  )}
                                                </div>
                                                
                                                <div className="flex items-center gap-1 ml-3">
                                                  {onLogIntervention && (
                                                    <button
                                                      onClick={() => onLogIntervention(student)}
                                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                      title="Add Mentoring Note"
                                                    >
                                                      <ChatBubbleLeftEllipsisIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                  )}
                                                  {onReassignStudent && (
                                                    <button
                                                      onClick={() => onReassignStudent(student)}
                                                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                                                      title="Reassign Student"
                                                    >
                                                      <UserMinusIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Allocation Metadata */}
                                    <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                      <div className="flex items-center justify-between">
                                        <span>Created: {new Date(allocation.createdAt).toLocaleDateString()}</span>
                                        <span>Created by: {allocation.createdBy}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Recent Interventions */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Interventions</h3>
                      <span className="text-sm text-gray-500">{notes.length} total interventions</span>
                    </div>
                    
                    {notes.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                        <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No interventions recorded yet</p>
                        <p className="text-sm">Intervention logs will appear here once recorded</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notes.slice(0, 20).map((note: MentorNote) => {
                          const student = getAllocatedStudents().find((s: Student) => s.id === note.studentId);
                          const hasEducatorResponse = note.educator_response || note.action_taken || note.next_steps;
                          const needsResponse = !hasEducatorResponse && note.status === 'pending';
                          
                          const getPriorityColor = (priority?: string) => {
                            const colors = {
                              urgent: 'bg-red-50 text-red-700 border-red-200',
                              high: 'bg-orange-50 text-orange-700 border-orange-200',
                              medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                              low: 'bg-green-50 text-green-700 border-green-200',
                            };
                            return colors[priority as keyof typeof colors] || colors.medium;
                          };
                          
                          return (
                            <div 
                              key={note.id} 
                              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                              {/* Header Section */}
                              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                      <UserIcon className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900 text-base">{student?.name || 'Unknown Student'}</h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                                        <p className="text-sm text-gray-500">
                                          {new Date(note.date).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2 justify-end max-w-md">
                                    {note.priority && (
                                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(note.priority)}`}>
                                        {note.priority.toUpperCase()}
                                      </span>
                                    )}
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(note.status)}`}>
                                      {note.status.replace('-', ' ').toUpperCase()}
                                    </span>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getInterventionTypeColor(note.interventionType)}`}>
                                      {note.interventionType.charAt(0).toUpperCase() + note.interventionType.slice(1)}
                                    </span>
                                    {note.isPrivate && (
                                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                        Private
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Status Indicator */}
                                {hasEducatorResponse && (
                                  <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="font-medium">Educator has responded</span>
                                  </div>
                                )}
                                {needsResponse && (
                                  <div className="mt-3 flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                                    <ClockIcon className="h-4 w-4" />
                                    <span className="font-medium">Awaiting educator response</span>
                                  </div>
                                )}
                                
                                {/* Follow-up Alert */}
                                {note.follow_up_required && note.follow_up_date && (
                                  <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                                    <ExclamationTriangleIcon className="h-4 w-4" />
                                    <span className="font-medium">
                                      Follow-up required by {new Date(note.follow_up_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Content Section */}
                              <div className="px-6 py-5 space-y-4">
                                {/* Admin's Note */}
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Note</p>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed pl-3">{note.note}</p>
                                </div>
                                
                                {/* Initial Outcome */}
                                {note.outcome && (
                                  <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Initial Outcome</p>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed pl-3">{note.outcome}</p>
                                  </div>
                                )}
                                
                                {/* Educator's Response */}
                                {note.educator_response && (
                                  <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-green-600" />
                                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Educator's Response</p>
                                    </div>
                                    <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{note.educator_response}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Action Taken */}
                                {note.action_taken && (
                                  <div className={note.educator_response ? '' : 'pt-4 border-t border-gray-100'}>
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Action Taken</p>
                                    </div>
                                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{note.action_taken}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Admin's Feedback */}
                                {note.admin_feedback && (
                                  <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Your Feedback</p>
                                    </div>
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{note.admin_feedback}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Action Button */}
                              {onViewConversation && (
                                <div className="px-6 pb-5">
                                  <button
                                    onClick={() => onViewConversation(note)}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                  >
                                    <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
                                    {hasEducatorResponse ? 'View Full Conversation & Respond' : 'View Details & Provide Feedback'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {notes.length > 20 && (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">
                              Showing 20 of {notes.length} interventions
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDetailsDrawer;