import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
// @ts-expect-error - Auto-suppressed for migration
import { Student } from '../../../types/student';
import PassportPage from '../PassportPage';

interface PersonalInfoPageProps {
  student: Student;
  isActive: boolean;
}

const PersonalInfoPage: React.FC<PersonalInfoPageProps> = ({ student, isActive }) => {
  const isVerified = student.approval_status === 'approved';

  return (
    <PassportPage pageNumber={1} isActive={isActive}>
      <div className="p-8 h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">PERSONAL INFORMATION</h2>
          <div className="w-24 h-0.5 bg-blue-600 mx-auto"></div>
        </div>

        <div className="flex-1 flex">
          {/* Photo Section */}
          <div className="w-1/3 flex flex-col items-center">
            <motion.div
              className="relative mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: isActive ? 1 : 0.9 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <img
                src={student.profile.profileImage || '/api/placeholder/150/180'}
                alt={student.name || 'Profile'}
                className="w-32 h-40 object-cover border-4 border-gray-300 shadow-lg"
                style={{ filter: 'sepia(10%)' }}
              />

              {/* Verification Stamp */}
              <motion.div
                className={`absolute -bottom-2 -right-2 p-2 rounded-full ${
                  isVerified ? 'bg-green-100' : 'bg-red-100'
                }`}
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: isActive ? 1 : 0.8, rotate: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {isVerified ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </motion.div>
            </motion.div>

            {/* Verification Status */}
            <motion.div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: isActive ? 1 : 0.7 }}
              transition={{ delay: 0.7 }}
            >
              {isVerified ? 'VERIFIED' : 'NOT VERIFIED'}
            </motion.div>

            {/* Stamp */}
            <motion.div
              className="mt-4 text-center"
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: isActive ? 1 : 0.5, rotate: 0 }}
              transition={{ delay: 0.9 }}
            >
              <div
                className={`inline-block px-4 py-2 border-2 rounded-lg transform rotate-12 ${
                  isVerified ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'
                }`}
              >
                <div className="text-xs font-bold">{isVerified ? 'VERIFIED BY' : 'PENDING'}</div>
                <div className="text-xs">{isVerified ? 'RAREMINS' : 'VERIFICATION'}</div>
              </div>
            </motion.div>
          </div>

          {/* Information Section */}
          <div className="w-2/3 pl-8">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isActive ? 1 : 0.7, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {/* Name */}
              <div className="border-b border-gray-200 pb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Full Name
                </label>
                <p className="text-lg font-bold text-gray-800 mt-1">
                  {student.name || student.profile.name || 'N/A'}
                </p>
              </div>

              {/* Passport ID */}
              <div className="border-b border-gray-200 pb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Passport ID
                </label>
                <p className="text-lg font-mono font-bold text-blue-600 mt-1">
                  {student.profile.passportId || 'DP' + student.id.slice(-6).toUpperCase()}
                </p>
              </div>

              {/* Date of Birth */}
              <div className="border-b border-gray-200 pb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date of Birth
                </label>
                <p className="text-base text-gray-700 mt-1">
                  {student.date_of_birth
                    ? new Date(student.date_of_birth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>

              {/* Age */}
              <div className="border-b border-gray-200 pb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Age
                </label>
                <p className="text-base text-gray-700 mt-1">{student.age || 'N/A'} years</p>
              </div>

              {/* Contact */}
              <div className="border-b border-gray-200 pb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Contact Number
                </label>
                <p className="text-base text-gray-700 mt-1">{student.contact_number || 'N/A'}</p>
              </div>

              {/* Email */}
              <div className="border-b border-gray-200 pb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Email Address
                </label>
                <p className="text-base text-gray-700 mt-1 break-all">{student.email}</p>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Location
                </label>
                <p className="text-base text-gray-700 mt-1">{student.district_name || 'N/A'}</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          className="mt-8 pt-4 border-t border-gray-200 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isActive ? 1 : 0.5 }}
          transition={{ delay: 1.1 }}
        >
          <p className="text-xs text-gray-500">
            Issued: {new Date(student.created_at).toLocaleDateString()}
          </p>
        </motion.div>
      </div>
    </PassportPage>
  );
};

export default PersonalInfoPage;
