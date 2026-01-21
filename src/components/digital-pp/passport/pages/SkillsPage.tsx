import React from 'react';
import { motion } from 'framer-motion';
import { Code, Star, Zap } from 'lucide-react';
// @ts-expect-error - Auto-suppressed for migration
import { Student } from '../../../types/student';
import PassportPage from '../PassportPage';

interface SkillsPageProps {
  student: Student;
  isActive: boolean;
}

const SkillsPage: React.FC<SkillsPageProps> = ({ student, isActive }) => {
  const technicalSkills = student.profile.technicalSkills || [];
  const skills = student.profile.skills || [];

  const getSkillLevel = (level: number) => {
    if (level >= 8) return 'Expert';
    if (level >= 6) return 'Advanced';
    if (level >= 4) return 'Intermediate';
    return 'Beginner';
  };

  const getSkillColor = (level: number) => {
    if (level >= 8) return 'text-green-600 bg-green-100';
    if (level >= 6) return 'text-blue-600 bg-blue-100';
    if (level >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <PassportPage pageNumber={3} isActive={isActive}>
      <div className="p-8 h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">TECHNICAL SKILLS</h2>
          <div className="w-24 h-0.5 bg-blue-600 mx-auto"></div>
        </div>

        {/* Technical Skills */}
        {technicalSkills.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Code className="w-5 h-5 mr-2" />
              Programming & Technologies
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {technicalSkills.slice(0, 8).map((skill, index) => (
                <motion.div
                  key={index}
                  className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isActive ? 1 : 0.7, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm">{skill.name}</h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillColor(skill.level)}`}
                    >
                      {getSkillLevel(skill.level)}
                    </span>
                  </div>

                  <div className="flex items-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(skill.level / 2)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xs text-gray-500">{skill.level}/10</span>
                  </div>

                  <p className="text-xs text-gray-500">{skill.category}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* General Skills */}
        {skills.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Core Competencies
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {skills.slice(0, 6).map((skill, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-blue-600"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isActive ? 1 : 0.7, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                >
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{skill.name}</h4>
                    {skill.category && <p className="text-xs text-gray-500">{skill.category}</p>}
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                    {skill.level}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* No Skills Data */}
        {technicalSkills.length === 0 && skills.length === 0 && (
          <motion.div
            className="flex-1 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0.5 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center text-gray-500">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No skills information available</p>
            </div>
          </motion.div>
        )}

        {/* Footer Stamp */}
        <motion.div
          className="mt-auto text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isActive ? 1 : 0.5, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="inline-block px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg transform rotate-2">
            <div className="text-xs font-bold">SKILLS</div>
            <div className="text-xs">ASSESSED</div>
          </div>
        </motion.div>
      </div>
    </PassportPage>
  );
};

export default SkillsPage;
