import React, { useEffect, useState } from 'react';
import { useStudentDataByEmail } from '../../../hooks/useStudentDataByEmail';
import { calculateEmployabilityScore } from '../../../utils/employabilityCalculator';

const EmployabilityDebugger = () => {
  const userEmail = localStorage.getItem('userEmail');
  const { studentData: realStudentData, loading, error } = useStudentDataByEmail(userEmail);
  const [debugResult, setDebugResult] = useState(null);

  useEffect(() => {
    if (realStudentData) {
      console.log('🐛 EMPLOYABILITY DEBUGGER - Full Student Data:', realStudentData);
      console.log('🐛 EMPLOYABILITY DEBUGGER - Keys:', Object.keys(realStudentData));
      
      // Test the calculation step by step
      const result = calculateEmployabilityScore(realStudentData);
      console.log('🐛 EMPLOYABILITY DEBUGGER - Final Result:', result);
      setDebugResult(result);
      
      // Also try with just the profile
      const profileResult = calculateEmployabilityScore(realStudentData.profile || {});
      console.log('🐛 EMPLOYABILITY DEBUGGER - Profile Only Result:', profileResult);
      
      // Test with sample data to verify calculator works
      const testData = {
        technicalSkills: [
          { name: 'JavaScript', level: 4, verified: true },
          { name: 'React', level: 3, verified: false }
        ],
        softSkills: [
          { name: 'Communication', level: 4, verified: true },
          { name: 'Teamwork', level: 5, verified: true }
        ],
        training: [
          { course: 'Web Development', status: 'completed' }
        ],
        education: [
          { degree: 'Computer Science', university: 'Test University' }
        ],
        experience: [
          { role: 'Intern', organization: 'Tech Company' }
        ]
      };
      
      const testResult = calculateEmployabilityScore(testData);
      console.log('🐛 TEST DATA RESULT:', testResult);
    }
  }, [realStudentData]);

  if (loading) return <div className="p-4 bg-blue-100">Loading debug data...</div>;
  if (error) return <div className="p-4 bg-red-100">Error: {error}</div>;
  if (!realStudentData) return <div className="p-4 bg-yellow-100">No data found</div>;

  const renderSkillsArray = (skills, title) => {
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return <p className="text-red-600"><strong>{title}:</strong> Empty or missing</p>;
    }
    
    return (
      <div className="mb-2">
        <p><strong>{title}:</strong> {skills.length} items</p>
        <ul className="ml-4 text-xs">
          {skills.slice(0, 3).map((skill, idx) => (
            <li key={idx}>
              {skill.name || 'No name'} - 
              Level: {skill.level || skill.rating || 'N/A'} - 
              Verified: {skill.verified || skill.evidenceVerified ? 'Yes' : 'No'}
            </li>
          ))}
          {skills.length > 3 && <li>... and {skills.length - 3} more</li>}
        </ul>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-100 m-4 rounded border-2 border-red-400">
      <h3 className="font-bold mb-2 text-red-700">🐛 Employability Score Debugger</h3>
      <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p><strong>User Email:</strong> {userEmail}</p>
          <p><strong>Student Name:</strong> {realStudentData.profile?.name}</p>
          <p><strong>Data Keys:</strong> {Object.keys(realStudentData).join(', ')}</p>
          
          {renderSkillsArray(realStudentData.technicalSkills, 'Technical Skills')}
          {renderSkillsArray(realStudentData.softSkills, 'Soft Skills')}
          {renderSkillsArray(realStudentData.training, 'Training')}
          {renderSkillsArray(realStudentData.experience, 'Experience')}
          {renderSkillsArray(realStudentData.education, 'Education')}
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Calculation Result:</h4>
          {debugResult ? (
            <div className="bg-white p-3 rounded">
              <p><strong>Score:</strong> {debugResult.employabilityScore}%</p>
              <p><strong>Level:</strong> {debugResult.level}</p>
              <p><strong>Label:</strong> {debugResult.label}</p>
              <div className="mt-2">
                <p className="font-semibold">Breakdown:</p>
                <ul className="text-xs">
                  <li>Foundational: {debugResult.breakdown?.foundational}%</li>
                  <li>Century21: {debugResult.breakdown?.century21}%</li>
                  <li>Digital: {debugResult.breakdown?.digital}%</li>
                  <li>Behavior: {debugResult.breakdown?.behavior}%</li>
                  <li>Career: {debugResult.breakdown?.career}%</li>
                  <li>Bonus: {debugResult.breakdown?.bonus}</li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Waiting for calculation...</p>
          )}
          
          <div className="mt-4">
            <p className="font-semibold text-blue-700">Check browser console for detailed logs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployabilityDebugger;