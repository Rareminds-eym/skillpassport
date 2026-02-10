/**
 * Profile Completion Modal
 * 
 * Shows a modal with required profile fields for assessment completion.
 * Handles both school and college students with appropriate field validation.
 * Uses the same logic and data structure as the Settings page.
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Save, X, Loader2 } from 'lucide-react';
import { Button } from '../Students/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../Students/components/ui/card';
// @ts-ignore - JS hook without types
import { useToast } from '../../hooks/use-toast';
// @ts-ignore - JS hook without types
import { useStudentSettings } from '../../hooks/useStudentSettings';
// @ts-ignore - JS hook without types
import { useInstitutions } from '../../hooks/useInstitutions';
import { isCollegeStudent as checkIsCollegeStudent, isSchoolStudent as checkIsSchoolStudent } from '../../utils/studentType';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userEmail: string;
  profileData: any;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  userEmail,
  profileData: initialProfileData
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Use the same complete profile data structure as Settings page
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
    location: "",
    address: "",
    state: "",
    country: "India",
    pincode: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    bloodGroup: "",
    university: "",
    branch: "",
    college: "",
    registrationNumber: "",
    enrollmentNumber: "",
    currentCgpa: "",
    grade: "",
    gradeStartDate: "",
    universityCollegeId: "",
    universityId: "",
    schoolId: "",
    schoolClassId: "",
    collegeId: "",
    programId: "",
    programSectionId: "",
    semester: "",
    section: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianRelation: "",
    bio: "",
    linkedIn: "",
    github: "",
    twitter: "",
    facebook: "",
    instagram: "",
    portfolio: "",
  });

  // Student type selection state
  const [studentType, setStudentType] = useState<'school' | 'college' | ''>('');

  // Custom institution states
  const [showCustomSchool, setShowCustomSchool] = useState(false);
  const [showCustomUniversity, setShowCustomUniversity] = useState(false);
  const [showCustomCollege, setShowCustomCollege] = useState(false);
  const [showCustomProgram, setShowCustomProgram] = useState(false);
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [customUniversityName, setCustomUniversityName] = useState('');
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [customProgramName, setCustomProgramName] = useState('');

  // Hooks
  const { updateProfile } = useStudentSettings(userEmail);
  const {
    schools,
    universities,
    universityColleges,
    programs,
    loading: institutionsLoading
  } = useInstitutions();

  // Initialize profile data from props (same logic as Settings page)
  useEffect(() => {
    if (initialProfileData) {
      setProfileData({
        name: initialProfileData.name || "",
        email: initialProfileData.email || userEmail || "",
        phone: initialProfileData.contact_number || initialProfileData.phone || "",
        alternatePhone: initialProfileData.alternate_number || initialProfileData.alternatePhone || "",
        location: initialProfileData.city || initialProfileData.location || "",
        address: initialProfileData.address || "",
        state: initialProfileData.state || "",
        country: initialProfileData.country || "India",
        pincode: initialProfileData.pincode || "",
        dateOfBirth: initialProfileData.date_of_birth || initialProfileData.dateOfBirth || "",
        age: initialProfileData.age || "",
        gender: initialProfileData.gender || "",
        bloodGroup: initialProfileData.bloodGroup || "",
        university: initialProfileData.university || "",
        branch: initialProfileData.branch_field || initialProfileData.branch || "",
        college: initialProfileData.college_school_name || initialProfileData.college || "",
        registrationNumber: initialProfileData.registration_number || initialProfileData.registrationNumber || "",
        enrollmentNumber: initialProfileData.enrollmentNumber || "",
        currentCgpa: initialProfileData.currentCgpa || "",
        grade: initialProfileData.grade || "",
        gradeStartDate: initialProfileData.grade_start_date || initialProfileData.gradeStartDate || "",
        universityCollegeId: initialProfileData.university_college_id || initialProfileData.universityCollegeId || "",
        universityId: initialProfileData.universityId || "",
        schoolId: initialProfileData.school_id || initialProfileData.schoolId || "",
        schoolClassId: initialProfileData.school_class_id || initialProfileData.schoolClassId || "",
        collegeId: initialProfileData.college_id || initialProfileData.collegeId || "",
        programId: initialProfileData.program_id || initialProfileData.programId || "",
        programSectionId: initialProfileData.program_section_id || initialProfileData.programSectionId || "",
        semester: initialProfileData.semester || "",
        section: initialProfileData.section || "",
        guardianName: initialProfileData.guardianName || "",
        guardianPhone: initialProfileData.guardianPhone || "",
        guardianEmail: initialProfileData.guardianEmail || "",
        guardianRelation: initialProfileData.guardianRelation || "",
        bio: initialProfileData.bio || "",
        linkedIn: initialProfileData.linkedin_link || initialProfileData.linkedIn || "",
        github: initialProfileData.github_link || initialProfileData.github || "",
        twitter: initialProfileData.twitter_link || initialProfileData.twitter || "",
        facebook: initialProfileData.facebook_link || initialProfileData.facebook || "",
        instagram: initialProfileData.instagram_link || initialProfileData.instagram || "",
        portfolio: initialProfileData.portfolio_link || initialProfileData.portfolio || "",
      });

      // Detect student type based on existing data
      const hasSchoolId = initialProfileData.school_id || initialProfileData.schoolId;
      const hasUniversityId = initialProfileData.university_id || initialProfileData.universityId;

      if (hasSchoolId && !hasUniversityId) {
        setStudentType('school');
      } else if (hasUniversityId && !hasSchoolId) {
        setStudentType('college');
      }

      // Detect custom entries and show custom input fields
      if (initialProfileData.college_school_name && !initialProfileData.university_college_id) {
        setShowCustomCollege(true);
        setCustomCollegeName(initialProfileData.college_school_name);
      }
      if (initialProfileData.college_school_name && !initialProfileData.school_id) {
        setShowCustomSchool(true);
        setCustomSchoolName(initialProfileData.college_school_name);
      }
      if (initialProfileData.course_name && !initialProfileData.program_id) {
        setShowCustomProgram(true);
        setCustomProgramName(initialProfileData.course_name);
      }
    }
  }, [initialProfileData, userEmail]);

  // Handle student type change
  const handleStudentTypeChange = (type: 'school' | 'college' | '') => {
    setStudentType(type);

    // Clear opposite type data when switching
    if (type === 'school') {
      setProfileData(prev => ({
        ...prev,
        universityId: '',
        universityCollegeId: '',
        programId: '',
        semester: ''
      }));
      setShowCustomCollege(false);
      setShowCustomUniversity(false);
      setCustomCollegeName('');
      setCustomUniversityName('');
    } else if (type === 'college') {
      setProfileData(prev => ({
        ...prev,
        schoolId: '',
        schoolClassId: '',
        grade: '',
        gradeStartDate: ''
      }));
      setShowCustomSchool(false);
      setCustomSchoolName('');
    }
  };

  // Determine student type using centralized utility
  const studentDataForTypeCheck = {
    university_college_id: profileData.universityCollegeId || profileData.universityId,
    school_id: profileData.schoolId,
    role: studentType === 'college' ? 'college_student' : studentType === 'school' ? 'school_student' : undefined
  };
  const isSchoolStudent = checkIsSchoolStudent(studentDataForTypeCheck);
  const isCollegeStudent = checkIsCollegeStudent(studentDataForTypeCheck);
  const isUndetermined = !studentType && !profileData.schoolId && !profileData.universityId && !profileData.universityCollegeId;

  // Get filtered options based on selections
  const filteredColleges = universityColleges?.filter((college: any) =>
    !profileData.universityId || college.university_id === profileData.universityId
  ) || [];

  // Show all programs when college is selected (same as settings page)
  // Note: Programs are linked via departments, but we show all for simplicity
  const filteredPrograms = programs || [];

  // Handle form field changes (same logic as Settings page)
  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleInstitutionChange = (field: string, value: string) => {
    if (value === 'add_new') {
      if (field === 'schoolId') setShowCustomSchool(true);
      if (field === 'universityId') setShowCustomUniversity(true);
      if (field === 'universityCollegeId') setShowCustomCollege(true);
      if (field === 'programId') setShowCustomProgram(true);
      return;
    }

    // Use the same cascading logic as Settings page
    if (field === 'schoolId') {
      setProfileData(prev => ({
        ...prev,
        schoolId: value,
        universityId: '',
        universityCollegeId: '',
        programId: '',
        semester: '',
        section: '',
        schoolClassId: '',
        grade: ''
      }));
    } else if (field === 'universityId') {
      setProfileData(prev => ({
        ...prev,
        universityId: value,
        schoolId: '',
        schoolClassId: '',
        grade: '',
        universityCollegeId: '',
        programId: ''
      }));
    } else if (field === 'universityCollegeId') {
      setProfileData(prev => ({
        ...prev,
        universityCollegeId: value,
        programId: ''
      }));
    } else if (field === 'programId') {
      setProfileData(prev => ({
        ...prev,
        programId: value
      }));
    } else {
      handleProfileChange(field, value);
    }
  };

  // Validate required fields
  const validateForm = () => {
    const errors: string[] = [];

    if (!studentType && isUndetermined) {
      errors.push('Please select student type (School or College)');
      return errors;
    }

    if (studentType === 'school' || isSchoolStudent) {
      if (!profileData.grade) {
        errors.push('Grade information is required');
      }
      if (!profileData.schoolId && !showCustomSchool && !customSchoolName) {
        errors.push('School selection is required');
      }
    }

    if (studentType === 'college' || isCollegeStudent) {
      if (!profileData.universityId && !showCustomUniversity && !customUniversityName) {
        errors.push('University selection is required');
      }
      // College is optional - user might just want to specify university
      // Program is optional - user might just want to specify university and college
    }

    return errors;
  };

  // Handle form submission (same logic as Settings page)
  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Pass the complete profile data object (same as Settings page)
      await updateProfile(profileData);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
        variant: "default"
      });

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('student_settings_updated', {
        detail: { type: 'profile_updated', data: profileData }
      }));

      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50/95 via-blue-50/95 to-slate-50/95 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/20 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white/90 backdrop-blur-sm rounded-xl shadow-xl w-full max-w-2xl transform transition-all border border-slate-200/50">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Complete Your Profile
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Please update your information to continue with the assessment
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Student Type Selection */}
              {isUndetermined && (
                <div className="space-y-4">
                  <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200/50 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-blue-800 mb-2">
                      Student Type Not Determined
                    </p>
                    <p className="text-sm text-blue-700 mb-4">
                      Please select whether you are a school student or college student.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">I am a *</label>
                    <select
                      value={studentType}
                      onChange={(e) => handleStudentTypeChange(e.target.value as 'school' | 'college' | '')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    >
                      <option value="">Select Student Type</option>
                      <option value="school">School Student</option>
                      <option value="college">College Student</option>
                    </select>
                  </div>
                </div>
              )}

              {/* School Student Fields */}
              {isSchoolStudent && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b border-slate-100 pb-2">
                    School Information
                  </h3>

                  {/* School Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700" htmlFor="school">School *</label>
                    {showCustomSchool ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSchoolName}
                          onChange={(e) => {
                            const schoolName = e.target.value;
                            setCustomSchoolName(schoolName);
                            handleProfileChange("college", schoolName);
                          }}
                          placeholder="Enter school name"
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCustomSchool(false);
                            setCustomSchoolName('');
                            handleProfileChange("college", '');
                          }}
                          className="border-slate-200 hover:bg-slate-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <select
                        value={profileData.schoolId}
                        onChange={(e) => handleInstitutionChange('schoolId', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                        disabled={institutionsLoading}
                      >
                        <option value="">Select School</option>
                        {schools?.map((school: any) => (
                          <option key={school.id} value={school.id}>
                            {school.name} {school.city && `- ${school.city}`}
                          </option>
                        ))}
                        <option value="add_new">+ Add New School</option>
                      </select>
                    )}
                  </div>

                  {/* Grade */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700" htmlFor="grade">Grade *</label>
                    <select
                      value={profileData.grade}
                      onChange={(e) => handleProfileChange('grade', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    >
                      <option value="">Select Grade</option>
                      {Array.from({ length: 7 }, (_, i) => i + 6).map(grade => (
                        <option key={grade} value={`Grade ${grade}`}>
                          Grade {grade}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Grade Start Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700" htmlFor="gradeStartDate">Grade Start Date</label>
                    <input
                      type="date"
                      value={profileData.gradeStartDate}
                      onChange={(e) => handleProfileChange('gradeStartDate', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              {/* College Student Fields */}
              {isCollegeStudent && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b border-slate-100 pb-2">
                    College Information
                  </h3>

                  {/* University Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700" htmlFor="university">University *</label>
                    {showCustomUniversity ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customUniversityName}
                          onChange={(e) => {
                            const universityName = e.target.value;
                            setCustomUniversityName(universityName);
                            handleProfileChange("university", universityName);
                          }}
                          placeholder="Enter university name"
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCustomUniversity(false);
                            setCustomUniversityName('');
                            handleProfileChange("university", '');
                          }}
                          className="border-slate-200 hover:bg-slate-50"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <select
                        value={profileData.universityId}
                        onChange={(e) => handleInstitutionChange('universityId', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                        disabled={institutionsLoading}
                      >
                        <option value="">Select University</option>
                        {universities?.map((uni: any) => (
                          <option key={uni.id} value={uni.id}>
                            {uni.name} {uni.code && `(${uni.code})`}
                          </option>
                        ))}
                        <option value="add_new">+ Add New University</option>
                      </select>
                    )}
                  </div>

                  {/* College Selection */}
                  {(filteredColleges.length > 0 || profileData.universityId || showCustomUniversity || customUniversityName) && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700" htmlFor="college">College</label>
                      {showCustomCollege ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customCollegeName}
                            onChange={(e) => {
                              const collegeName = e.target.value;
                              setCustomCollegeName(collegeName);
                              handleProfileChange("college", collegeName);
                            }}
                            placeholder="Enter college name"
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowCustomCollege(false);
                              setCustomCollegeName('');
                              handleProfileChange("college", '');
                            }}
                            className="border-slate-200 hover:bg-slate-50"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <select
                          value={profileData.universityCollegeId}
                          onChange={(e) => handleInstitutionChange('universityCollegeId', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          disabled={!profileData.universityId && !showCustomUniversity && !customUniversityName}
                        >
                          <option value="">
                            {(!profileData.universityId && !showCustomUniversity && !customUniversityName) ? 'Select university first' : 'Select College'}
                          </option>
                          {filteredColleges.map((college: any) => (
                            <option key={college.id} value={college.id}>
                              {college.name}
                            </option>
                          ))}
                          {(profileData.universityId || showCustomUniversity || customUniversityName) && (
                            <option value="add_new">+ Add New College</option>
                          )}
                        </select>
                      )}
                      {(!profileData.universityId && !showCustomUniversity && !customUniversityName) && (
                        <p className="text-xs text-gray-500">Please select a university first</p>
                      )}
                    </div>
                  )}

                  {/* Program Selection */}
                  {(filteredPrograms.length > 0 || profileData.universityCollegeId || showCustomCollege || customCollegeName) && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700" htmlFor="program">Program</label>
                      {showCustomProgram ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customProgramName}
                            onChange={(e) => {
                              const programName = e.target.value;
                              setCustomProgramName(programName);
                              handleProfileChange("branch", programName);
                            }}
                            placeholder="Enter program name"
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowCustomProgram(false);
                              setCustomProgramName('');
                              handleProfileChange("branch", '');
                            }}
                            className="border-slate-200 hover:bg-slate-50"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <select
                          value={profileData.programId}
                          onChange={(e) => handleInstitutionChange('programId', e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          disabled={!profileData.universityCollegeId && !showCustomCollege && !customCollegeName}
                        >
                          <option value="">
                            {(!profileData.universityCollegeId && !showCustomCollege && !customCollegeName) ? 'Select college first' : 'Select Program'}
                          </option>
                          {filteredPrograms.map((program: any) => (
                            <option key={program.id} value={program.id}>
                              {program.name} {program.code && `(${program.code})`}
                            </option>
                          ))}
                          {(profileData.universityCollegeId || showCustomCollege || customCollegeName) && (
                            <option value="add_new">+ Add New Program</option>
                          )}
                        </select>
                      )}
                      {(!profileData.universityCollegeId && !showCustomCollege && !customCollegeName) && (
                        <p className="text-xs text-gray-500">Please select a college first</p>
                      )}
                    </div>
                  )}

                  {/* Course Start Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700" htmlFor="courseStartDate">Course Start Date</label>
                    <input
                      type="date"
                      value={profileData.gradeStartDate}
                      onChange={(e) => handleProfileChange('gradeStartDate', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save & Continue
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={studentType && !profileData.schoolId && !profileData.universityId ? () => handleStudentTypeChange('') : onClose}
                  disabled={isSaving}
                  className="px-6 border-slate-200 hover:bg-slate-50 rounded-xl"
                >
                  {studentType && !profileData.schoolId && !profileData.universityId ? 'Back' : 'Cancel'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};