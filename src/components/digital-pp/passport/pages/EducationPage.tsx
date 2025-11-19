import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Calendar, Award } from 'lucide-react';
import { Student } from '../../../types/student';
import PassportPage from '../PassportPage';

interface EducationPageProps {
  student: Student;
  isActive: boolean;
}

const EducationPage: React.FC<EducationPageProps> = ({ student, isActive }) => {
  const education = student.profile.education || [];

  return (
    <PassportPage pageNumber={2} isActive={isActive}>
      <div className="p-8 h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">EDUCATION</h2>
          <div className="w-24 h-0.5 bg-blue-600 mx-auto"></div>
        </div>

        {/* Current Education */}
        <motion.div
          className="mb-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-600"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: isActive ? 1 : 0.7, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Current Education</h3>
              <p className="text-base font-semibold text-blue-600 mb-1">
                {student.branch_field || 'N/A'}
              </p>
              <p className="text-gray-700 mb-2">{student.university || 'N/A'}</p>
              <p className="text-sm text-gray-600">{student.college_school_name || 'N/A'}</p>
              {student.registration_number && (
                <p className="text-xs text-gray-500 mt-2">
                  Registration: {student.registration_number}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Education History */}
        {education.length > 0 && (
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Education History
            </h3>
            
            <div className="space-y-4">
              {education.map((edu, index) => (
                <motion.div
                  key={edu.id}
                  className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isActive ? 1 : 0.7, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">{edu.degree}</h4>
                      <p className="text-sm text-gray-600">{edu.field}</p>
                    </div>
                    {edu.grade && (
                      <div className="text-right">
                        <span className="text-sm font-semibold text-green-600">{edu.grade}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{edu.institution}</p>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{edu.startDate} - {edu.endDate || 'Present'}</span>
                  </div>
                  
                  {edu.description && (
                    <p className="text-xs text-gray-600 leading-relaxed">{edu.description}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* No Education Data */}
        {education.length === 0 && (
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0.5 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center text-gray-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No additional education history available</p>
            </div>
          </motion.div>
        )}

        {/* Footer Stamp */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isActive ? 1 : 0.5, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="inline-block px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg transform -rotate-3">
            <div className="text-xs font-bold">EDUCATION</div>
            <div className="text-xs">VERIFIED</div>
          </div>
        </motion.div>
      </div>
    </PassportPage>
  );
};

export default EducationPage;