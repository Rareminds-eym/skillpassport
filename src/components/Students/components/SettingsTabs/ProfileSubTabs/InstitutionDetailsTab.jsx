import React from "react";
import { Briefcase, Save } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";

const InstitutionDetailsTab = ({
  profileData,
  handleInstitutionChange,
  schools,
  colleges,
  universities,
  universityColleges,
  programs,
  programSections,
  schoolClasses,
  showCustomSchool,
  setShowCustomSchool,
  showCustomUniversity,
  setShowCustomUniversity,
  showCustomCollege,
  setShowCustomCollege,
  showCustomSchoolClass,
  setShowCustomSchoolClass,
  showCustomProgram,
  setShowCustomProgram,
  showCustomSemester,
  setShowCustomSemester,
  customSchoolName,
  setCustomSchoolName,
  customUniversityName,
  setCustomUniversityName,
  customCollegeName,
  setCustomCollegeName,
  customSchoolClassName,
  setCustomSchoolClassName,
  customProgramName,
  setCustomProgramName,
  customSemesterName,
  setCustomSemesterName,
  studentData,
  handleSaveProfile,
  isSaving,
}) => {
  // Determine student type from role
  const userRole = studentData?.userRole;
  const isSchoolStudent = userRole === 'school_student';
  const isCollegeStudent = userRole === 'college_student';
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          Institution Details
        </h3>
      </div>
      
      {/* Info banner - show appropriate message based on role
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-gray-700 mb-3">
          <span className="font-semibold">📍 This tab is for your institution information only:</span>
        </p>
        {isSchoolStudent && (
          <div className="bg-white/60 rounded-lg p-3">
            <p className="font-semibold text-gray-800 mb-1">� School Students (Grade 6-12)</p>
            <p className="text-gray-600 text-xs">Fill: School name + Your section (like "A", "B", "C")</p>
          </div>
        )}
        {isCollegeStudent && (
          <div className="bg-white/60 rounded-lg p-3">
            <p className="font-semibold text-gray-800 mb-1">🎓 College Students (Diploma/UG/PG)</p>
            <p className="text-gray-600 text-xs">Fill: University → College → Program → Semester</p>
          </div>
        )}
        {!isSchoolStudent && !isCollegeStudent && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="font-semibold text-gray-800 mb-1">🏫 School Students (Grade 6-12)</p>
              <p className="text-gray-600 text-xs">Fill: School name + Your section (like "A", "B", "C")</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="font-semibold text-gray-800 mb-1">🎓 College Students (Diploma/UG/PG)</p>
              <p className="text-gray-600 text-xs">Fill: University → College → Program → Semester</p>
            </div>
          </div>
        )}
        <p className="text-xs text-amber-700 mt-3 bg-amber-50 rounded px-2 py-1">
          ⚠️ Your academic year (Grade 10, UG Year 2, etc.) goes in the <span className="font-semibold">Academic Details</span> tab, not here.
        </p>
      </div> */}

      {/* Organization Membership Card - Shows when assigned via invitation */}
      {(studentData?.schoolOrganization || studentData?.collegeOrganization) && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">Organization Membership</h4>
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                  Active
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                You are a member of the following organization through an accepted invitation.
              </p>
              <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                {studentData?.schoolOrganization && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{studentData.schoolOrganization.name}</p>
                      <p className="text-xs text-gray-500">
                        {studentData.schoolOrganization.organization_type === 'school' ? 'School' : 'Organization'}
                        {studentData.schoolOrganization.city && ` • ${studentData.schoolOrganization.city}`}
                        {studentData.schoolOrganization.state && `, ${studentData.schoolOrganization.state}`}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      Read-only
                    </div>
                  </div>
                )}
                {studentData?.collegeOrganization && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{studentData.collegeOrganization.name}</p>
                      <p className="text-xs text-gray-500">
                        {studentData.collegeOrganization.organization_type === 'college' ? 'College' : 'Organization'}
                        {studentData.collegeOrganization.city && ` • ${studentData.collegeOrganization.city}`}
                        {studentData.collegeOrganization.state && `, ${studentData.collegeOrganization.state}`}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      Read-only
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* School Fields - Only for school students */}
        {(isSchoolStudent || !userRole) && (
          <>
            {/* School */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                School Name {!isSchoolStudent && <span className="text-gray-400 text-xs font-normal">(For Grade 6-12 students)</span>}
              </label>
          {!showCustomSchool ? (
            <>
              <select
                value={profileData.schoolId}
                onChange={(e) =>
                  handleInstitutionChange("schoolId", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={!!profileData.universityId || showCustomUniversity || !!customUniversityName || !!profileData.universityCollegeId || showCustomCollege || !!customCollegeName}
              >
                <option value="">
                  {(profileData.universityId || showCustomUniversity || customUniversityName || profileData.universityCollegeId || showCustomCollege || customCollegeName) ? 'University path selected - clear to use school' : 'Select School'}
                </option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} {school.city && `- ${school.city}`}
                  </option>
                ))}
                {!(profileData.universityId || showCustomUniversity || customUniversityName || profileData.universityCollegeId || showCustomCollege || customCollegeName) && (
                  <option value="add_new" className="font-semibold text-blue-600">
                    + Add Custom School
                  </option>
                )}
              </select>
              {(profileData.universityId || showCustomUniversity || customUniversityName || profileData.universityCollegeId || showCustomCollege || customCollegeName) && (
                <p className="text-xs text-gray-500">Clear university path to use school</p>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                value={customSchoolName}
                onChange={(e) => {
                  const schoolName = e.target.value;
                  setCustomSchoolName(schoolName);
                  // Store in college_school_name field
                  // handleProfileChange("college", schoolName);
                }}
                placeholder="Enter your school name"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomSchool(false);
                  setCustomSchoolName('');
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                ← Back to dropdown
              </button>
            </>
          )}
        </div>

        {/* School Class */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Section <span className="text-gray-400 text-xs font-normal">(Your classroom section)</span>
          </label>
          {!showCustomSchoolClass ? (
            <>
              <select
                value={profileData.schoolClassId}
                onChange={(e) =>
                  handleInstitutionChange("schoolClassId", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={(!profileData.schoolId && !showCustomSchool && !customSchoolName) || !!profileData.universityId || showCustomUniversity || !!customUniversityName}
              >
                <option value="">
                  {(profileData.schoolId || showCustomSchool || customSchoolName) ? 'Select Section (A, B, C, etc.)' : 'Select a school first'}
                </option>
                {schoolClasses
                  .filter(sc => !profileData.schoolId || sc.school_id === profileData.schoolId)
                  .map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name || `Grade ${schoolClass.grade} - ${schoolClass.section}`}
                    </option>
                  ))}
                {(profileData.schoolId || showCustomSchool || customSchoolName) && !(profileData.universityId || showCustomUniversity || customUniversityName) && (
                  <option value="add_new" className="font-semibold text-blue-600">
                    + Add Custom Section
                  </option>
                )}
              </select>
              {(!profileData.schoolId && !showCustomSchool && !customSchoolName) && (
                <p className="text-xs text-gray-500">Please select a school first</p>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                value={customSchoolClassName}
                onChange={(e) => {
                  const className = e.target.value;
                  setCustomSchoolClassName(className);
                }}
                placeholder="Enter your section (e.g., A, B, C, Section-1)"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomSchoolClass(false);
                  setCustomSchoolClassName('');
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                ← Back to dropdown
              </button>
            </>
          )}
        </div>
          </>
        )}

        {/* College Fields - Only for college students */}
        {(isCollegeStudent || !userRole) && (
          <>
        {/* University */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            University Name {!isCollegeStudent && <span className="text-gray-400 text-xs font-normal">(For Diploma/UG/PG students)</span>}
          </label>
          {!showCustomUniversity && !profileData.university ? (
            <>
              <select
                value={profileData.universityId}
                onChange={(e) =>
                  handleInstitutionChange("universityId", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={!!profileData.schoolId || showCustomSchool || !!customSchoolName || !!profileData.schoolClassId || showCustomSchoolClass || !!customSchoolClassName}
              >
                <option value="">
                  {(profileData.schoolId || showCustomSchool || customSchoolName || profileData.schoolClassId || showCustomSchoolClass || customSchoolClassName) ? 'School path selected - clear to use university' : 'Select University'}
                </option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name} {uni.code && `(${uni.code})`}
                  </option>
                ))}
                {!(profileData.schoolId || showCustomSchool || customSchoolName || profileData.schoolClassId || showCustomSchoolClass || customSchoolClassName) && (
                  <option value="add_new" className="font-semibold text-blue-600">
                    + Add Custom University
                  </option>
                )}
              </select>
              {(profileData.schoolId || showCustomSchool || customSchoolName || profileData.schoolClassId || showCustomSchoolClass || customSchoolClassName) && (
                <p className="text-xs text-gray-500">Clear school path to use university</p>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                value={customUniversityName || profileData.university}
                onChange={(e) => {
                  const universityName = e.target.value;
                  setCustomUniversityName(universityName);
                  // Also update profileData.university for immediate sync
                  handleInstitutionChange('university', universityName);
                }}
                placeholder="Enter your university name"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomUniversity(false);
                  setCustomUniversityName('');
                  handleInstitutionChange('university', '');
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                ← Back to dropdown
              </button>
            </>
          )}
        </div>

        {/* College (University College) */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            College Name <span className="text-gray-400 text-xs font-normal">(Within your university)</span>
          </label>
          {!showCustomCollege ? (
            <>
              <select
                value={profileData.universityCollegeId}
                onChange={(e) =>
                  handleInstitutionChange("universityCollegeId", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={(!profileData.universityId && !showCustomUniversity && !customUniversityName) || !!profileData.schoolId || showCustomSchool || !!customSchoolName}
              >
                <option value="">
                  {(profileData.universityId || showCustomUniversity || customUniversityName) ? 'Select College' : 'Select university first'}
                </option>
                {universityColleges
                  .filter(uc => !profileData.universityId || uc.university_id === profileData.universityId)
                  .map((uc) => (
                    <option key={uc.id} value={uc.id}>
                      {uc.name} {uc.code && `(${uc.code})`}
                    </option>
                  ))}
                {(profileData.universityId || showCustomUniversity || customUniversityName) && !(profileData.schoolId || showCustomSchool || customSchoolName) && (
                  <option value="add_new" className="font-semibold text-blue-600">
                    + Add Custom College
                  </option>
                )}
              </select>
              {(!profileData.universityId && !showCustomUniversity && !customUniversityName) && (
                <p className="text-xs text-gray-500">Please select a university first</p>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                value={customCollegeName}
                onChange={(e) => {
                  const collegeName = e.target.value;
                  setCustomCollegeName(collegeName);
                  // Also update profileData.college for immediate sync
                  handleInstitutionChange('college', collegeName);
                }}
                placeholder="Enter your college name"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomCollege(false);
                  setCustomCollegeName('');
                  handleInstitutionChange('college', '');
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                ← Back to dropdown
              </button>
            </>
          )}
        </div>

        {/* Program */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Program/Course Name <span className="text-gray-400 text-xs font-normal">(e.g., B.Tech CS, BBA)</span>
          </label>
          {!showCustomProgram ? (
            <>
              <select
                value={profileData.programId}
                onChange={(e) =>
                  handleInstitutionChange("programId", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={(!profileData.universityCollegeId && !showCustomCollege && !customCollegeName) || !!profileData.schoolId || showCustomSchool || !!customSchoolName}
              >
                <option value="">
                  {(profileData.universityCollegeId || showCustomCollege || customCollegeName) ? 'Select Program' : 'Select college first'}
                </option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name} {program.degree_level && `(${program.degree_level})`}
                  </option>
                ))}
                {(profileData.universityCollegeId || showCustomCollege || customCollegeName) && !(profileData.schoolId || showCustomSchool || customSchoolName) && (
                  <option value="add_new" className="font-semibold text-blue-600">
                    + Add Custom Program
                  </option>
                )}
              </select>
              {(!profileData.universityCollegeId && !showCustomCollege && !customCollegeName) && (
                <p className="text-xs text-gray-500">Please select a college first</p>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                value={customProgramName}
                onChange={(e) => {
                  const programName = e.target.value;
                  setCustomProgramName(programName);
                  // Also update profileData.branch for immediate sync
                  handleInstitutionChange('branch', programName);
                  
                  // Auto-detect and set grade based on program name
                  const lowerProgram = programName.toLowerCase();
                  const trimmedProgram = programName.trim();
                  
                  // Smart detection: Check for B. or M. prefix (catches B.Tech, B.Com, B.A, B.Sc, BBA, etc.)
                  const isBachelor = /^b\.?[a-z]/i.test(trimmedProgram) || lowerProgram.includes('bachelor') || 
                                    lowerProgram.includes('ug') || lowerProgram.includes('undergraduate');
                  const isMaster = /^m\.?[a-z]/i.test(trimmedProgram) || lowerProgram.includes('master') || 
                                  lowerProgram.includes('pg') || lowerProgram.includes('postgraduate');
                  const isDiploma = lowerProgram.includes('diploma');
                  
                  if (isBachelor) {
                    // It's an undergraduate program - default to UG Year 1
                    handleInstitutionChange('grade', 'UG Year 1');
                  } else if (isMaster) {
                    // It's a postgraduate program - default to PG Year 1
                    handleInstitutionChange('grade', 'PG Year 1');
                  } else if (isDiploma) {
                    handleInstitutionChange('grade', 'Diploma');
                  }
                }}
                placeholder="Enter program name (e.g., B.Tech Computer Science, BCA, MBA)"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              {customProgramName && (
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  {(() => {
                    const lowerProgram = customProgramName.toLowerCase();
                    const trimmedProgram = customProgramName.trim();
                    
                    const isBachelor = /^b\.?[a-z]/i.test(trimmedProgram) || lowerProgram.includes('bachelor') || 
                                      lowerProgram.includes('ug') || lowerProgram.includes('undergraduate');
                    const isMaster = /^m\.?[a-z]/i.test(trimmedProgram) || lowerProgram.includes('master') || 
                                    lowerProgram.includes('pg') || lowerProgram.includes('postgraduate');
                    const isDiploma = lowerProgram.includes('diploma');
                    
                    if (isBachelor) {
                      return <><span className="text-green-600">✓</span> Detected as Undergraduate (UG)</>;
                    } else if (isMaster) {
                      return <><span className="text-green-600">✓</span> Detected as Postgraduate (PG)</>;
                    } else if (isDiploma) {
                      return <><span className="text-green-600">✓</span> Detected as Diploma</>;
                    } else {
                      return <><span className="text-amber-600">⚠</span> Not detected - set grade manually in Academic Details</>;
                    }
                  })()}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowCustomProgram(false);
                  setCustomProgramName('');
                  handleInstitutionChange('branch', '');
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                ← Back to dropdown
              </button>
            </>
          )}
        </div>

        {/* Semester/Section */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Current Semester & Section <span className="text-gray-400 text-xs font-normal">(e.g., Sem 3-A)</span>
          </label>
          {!showCustomSemester ? (
            <>
              <select
                value={profileData.programSectionId}
                onChange={(e) =>
                  handleInstitutionChange("programSectionId", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500"
                disabled={!profileData.programId && !showCustomProgram}
              >
                <option value="">
                  {profileData.programId || showCustomProgram ? 'Select Semester/Section' : 'Select program first'}
                </option>
                {programSections
                  .filter(ps => !profileData.programId || ps.program_id === profileData.programId)
                  .map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      Semester {ps.semester} - Section {ps.section}
                    </option>
                  ))}
                {(profileData.programId || showCustomProgram) && (
                  <option value="add_new" className="font-semibold text-blue-600">
                    + Add Custom Semester
                  </option>
                )}
              </select>
              {!profileData.programId && !showCustomProgram && (
                <p className="text-xs text-red-500">⚠️ Please select a program first</p>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                value={customSemesterName}
                onChange={(e) => {
                  const semesterText = e.target.value;
                  
                  // Limit input to 10 characters (database constraint)
                  if (semesterText.length > 10) {
                    return; // Don't update if exceeds limit
                  }
                  
                  setCustomSemesterName(semesterText);
                  // Also update profileData.section for immediate sync
                  handleInstitutionChange('section', semesterText);
                  
                  // Auto-detect year from semester and update grade
                  const lowerSemester = semesterText.toLowerCase();
                  const currentGrade = profileData.grade || '';
                  
                  // Extract year number from semester text (e.g., "2nd year", "semester 3", "3rd sem")
                  let yearNumber = null;
                  let semesterNumber = null;
                  let validationError = null;
                  
                  // Check for patterns like "1st year", "2nd year", "3rd year", "4th year"
                  const yearMatch = lowerSemester.match(/(\d+)(?:st|nd|rd|th)?\s*year/);
                  if (yearMatch) {
                    yearNumber = parseInt(yearMatch[1]);
                    
                    // Validate year based on program type
                    if (currentGrade.includes('UG') && yearNumber > 5) {
                      validationError = 'UG programs typically have max 5 years (10 semesters)';
                    } else if (currentGrade.includes('PG') && yearNumber > 2) {
                      validationError = 'PG programs typically have max 2 years (4 semesters)';
                    }
                  } else {
                    // Check for semester numbers and convert to year (sem 1-2 = year 1, sem 3-4 = year 2, etc.)
                    const semMatch = lowerSemester.match(/(?:semester|sem)\s*(\d+)/);
                    if (semMatch) {
                      semesterNumber = parseInt(semMatch[1]);
                      
                      // Validate semester based on program type
                      if (currentGrade.includes('UG') && semesterNumber > 10) {
                        validationError = 'UG programs typically have max 10 semesters';
                      } else if (currentGrade.includes('PG') && semesterNumber > 4) {
                        validationError = 'PG programs typically have max 4 semesters';
                      } else if (currentGrade.includes('Diploma') && semesterNumber > 6) {
                        validationError = 'Diploma programs typically have max 6 semesters';
                      }
                      
                      yearNumber = Math.ceil(semesterNumber / 2); // Convert semester to year
                    }
                  }
                  
                  // Update grade based on detected year and current program type (only if no validation error)
                  if (yearNumber && !validationError) {
                    if (currentGrade.includes('UG')) {
                      handleInstitutionChange('grade', `UG Year ${yearNumber}`);
                    } else if (currentGrade.includes('PG')) {
                      handleInstitutionChange('grade', `PG Year ${yearNumber}`);
                    }
                  }
                }}
                placeholder="Enter semester/section (e.g., 2nd year, Semester 3)"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                maxLength={10}
              />
              {customSemesterName && (
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  {(() => {
                    const lowerSemester = customSemesterName.toLowerCase();
                    const currentGrade = profileData.grade || '';
                    const yearMatch = lowerSemester.match(/(\d+)(?:st|nd|rd|th)?\s*year/);
                    const semMatch = lowerSemester.match(/(?:semester|sem)\s*(\d+)/);
                    
                    if (yearMatch) {
                      const yearNum = parseInt(yearMatch[1]);
                      // Validate year
                      if (currentGrade.includes('UG') && yearNum > 5) {
                        return <><span className="text-red-600">✗</span> Invalid: UG programs typically have max 5 years (10 semesters)</>;
                      } else if (currentGrade.includes('PG') && yearNum > 2) {
                        return <><span className="text-red-600">✗</span> Invalid: PG programs typically have max 2 years (4 semesters)</>;
                      }
                      return <><span className="text-green-600">✓</span> Detected Year {yearMatch[1]}</>;
                    } else if (semMatch) {
                      const semNum = parseInt(semMatch[1]);
                      const year = Math.ceil(semNum / 2);
                      
                      // Validate semester
                      if (currentGrade.includes('UG') && semNum > 10) {
                        return <><span className="text-red-600">✗</span> Invalid: UG programs typically have max 10 semesters</>;
                      } else if (currentGrade.includes('PG') && semNum > 4) {
                        return <><span className="text-red-600">✗</span> Invalid: PG programs typically have max 4 semesters</>;
                      } else if (currentGrade.includes('Diploma') && semNum > 6) {
                        return <><span className="text-red-600">✗</span> Invalid: Diploma programs typically have max 6 semesters</>;
                      }
                      
                      return <><span className="text-green-600">✓</span> Semester {semMatch[1]} = Year {year}</>;
                    } else {
                      return <><span className="text-amber-600">⚠</span> Year not detected - set grade manually</>;
                    }
                  })()}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowCustomSemester(false);
                  setCustomSemesterName('');
                  handleInstitutionChange('section', '');
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                ← Back to dropdown
              </button>
            </>
          )}
        </div>
          </>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className={`
            inline-flex items-center gap-2
            bg-blue-600 hover:bg-blue-700 active:bg-blue-800
            text-white font-medium
            px-6 py-2.5 rounded-lg
            shadow-[0_2px_6px_rgba(0,0,0,0.05)]
            hover:shadow-[0_3px_8px_rgba(0,0,0,0.08)]
            active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]
            transition-all duration-200 ease-in-out
            disabled:opacity-60 disabled:cursor-not-allowed
          `}
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default InstitutionDetailsTab;