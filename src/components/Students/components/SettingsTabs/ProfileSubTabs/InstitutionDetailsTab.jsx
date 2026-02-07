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
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          Institution Details
        </h3>
      </div>

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
        {/* School */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            School <span className="text-red-500">*</span>
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
            School Class
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
                  {(profileData.schoolId || showCustomSchool || customSchoolName) ? 'Select Class' : 'Select a school first'}
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
                    + Add Custom Class
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
                placeholder="Enter class/section (e.g., Grade 10-A)"
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

        {/* University */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            University <span className="text-red-500">*</span>
          </label>
          {!showCustomUniversity ? (
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
                value={customUniversityName}
                onChange={(e) => {
                  const universityName = e.target.value;
                  setCustomUniversityName(universityName);
                }}
                placeholder="Enter your university name"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomUniversity(false);
                  setCustomUniversityName('');
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
            College <span className="text-red-500">*</span>
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
                }}
                placeholder="Enter your college name"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomCollege(false);
                  setCustomCollegeName('');
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
            Program <span className="text-red-500">*</span>
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
                }}
                placeholder="Enter program name (e.g., B.Tech Computer Science)"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomProgram(false);
                  setCustomProgramName('');
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
            Semester / Section <span className="text-red-500">*</span>
          </label>
          {!showCustomSemester ? (
            <>
              <select
                value={profileData.programSectionId}
                onChange={(e) =>
                  handleInstitutionChange("programSectionId", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
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
                <p className="text-xs text-gray-500">Please select a program first</p>
              )}
            </>
          ) : (
            <>
              <input
                type="text"
                value={customSemesterName}
                onChange={(e) => {
                  const semesterText = e.target.value;
                  setCustomSemesterName(semesterText);
                }}
                placeholder="Enter semester/section (e.g., Semester 3, 5th Sem)"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomSemester(false);
                  setCustomSemesterName('');
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                ← Back to dropdown
              </button>
            </>
          )}
        </div>
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