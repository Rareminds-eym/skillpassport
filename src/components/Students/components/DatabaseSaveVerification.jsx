/**
 * Database Save Verification Component
 * 
 * This component helps verify if profile edits are actually saving to Supabase
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useStudentDataByEmail } from '../../../hooks/useStudentDataByEmail';
import { useAuth } from '../../../context/AuthContext';

const DatabaseSaveVerification = () => {
  const { user } = useAuth();
  const userEmail = user?.email;
  const [saveResults, setSaveResults] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    studentData,
    loading,
    error,
    updateEducation,
    updateTraining,
    updateExperience,
    updateTechnicalSkills,
    updateSoftSkills,
    refresh
  } = useStudentDataByEmail(userEmail);

  const addTestResult = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setSaveResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const verifyEducationSave = async () => {
    setIsVerifying(true);
    addTestResult('🔄 Testing Education Save...');
    
    try {
      const currentEducation = studentData?.education || [];
      const testEducation = {
        id: Date.now(),
        degree: 'TEST DEGREE - Database Verification',
        university: 'Test University',
        department: 'Test Department',
        yearOfPassing: '2025',
        cgpa: '9.0',
        level: "Bachelor's",
        status: 'ongoing'
      };

      const updatedEducation = [...currentEducation, testEducation];
      
      addTestResult(`📝 Adding test education with ID: ${testEducation.id}`);
      
      const result = await updateEducation(updatedEducation);
      
      if (result?.success) {
        addTestResult('✅ Education save SUCCESS - Data sent to database');
        
        // Wait a bit and refresh to verify persistence
        setTimeout(async () => {
          await refresh();
          addTestResult('🔄 Refreshed data from database...');
          
          // Check if our test data persists
          setTimeout(() => {
            const refreshedEducation = studentData?.education || [];
            const foundTestItem = refreshedEducation.find(edu => edu.id === testEducation.id);
            
            if (foundTestItem) {
              addTestResult('🎉 VERIFICATION PASSED - Data persists in database!');
            } else {
              addTestResult('❌ VERIFICATION FAILED - Data not found after refresh');
            }
          }, 1000);
        }, 2000);
        
      } else {
        addTestResult(`❌ Education save FAILED: ${result?.error || 'Unknown error'}`);
      }
    } catch (err) {
      addTestResult(`❌ Education save ERROR: ${err.message}`);
    }
    
    setIsVerifying(false);
  };

  const verifyTrainingSave = async () => {
    setIsVerifying(true);
    addTestResult('🔄 Testing Training Save...');
    
    try {
      const currentTraining = studentData?.training || [];
      const testTraining = {
        id: Date.now(),
        course: 'TEST TRAINING - Database Verification',
        progress: 50,
        status: 'ongoing',
        instructor: 'Test Instructor',
        description: 'Verification test training'
      };

      const updatedTraining = [...currentTraining, testTraining];
      
      addTestResult(`📝 Adding test training with ID: ${testTraining.id}`);
      
      const result = await updateTraining(updatedTraining);
      
      if (result?.success) {
        addTestResult('✅ Training save SUCCESS - Data sent to database');
      } else {
        addTestResult(`❌ Training save FAILED: ${result?.error || 'Unknown error'}`);
      }
    } catch (err) {
      addTestResult(`❌ Training save ERROR: ${err.message}`);
    }
    
    setIsVerifying(false);
  };

  const verifyTechnicalSkillSave = async () => {
    setIsVerifying(true);
    addTestResult('🔄 Testing Technical Skill Save...');
    
    try {
      const currentSkills = studentData?.technicalSkills || [];
      const testSkill = {
        id: Date.now(),
        name: 'TEST TECHNICAL SKILL - Database Verification',
        level: 4,
        verified: false,
        icon: '🧪',
        category: 'Testing'
      };

      const updatedSkills = [...currentSkills, testSkill];
      
      addTestResult(`📝 Adding test technical skill with ID: ${testSkill.id}`);
      
      const result = await updateTechnicalSkills(updatedSkills);
      
      if (result?.success) {
        addTestResult('✅ Technical Skill save SUCCESS - Data sent to database');
      } else {
        addTestResult(`❌ Technical Skill save FAILED: ${result?.error || 'Unknown error'}`);
      }
    } catch (err) {
      addTestResult(`❌ Technical Skill save ERROR: ${err.message}`);
    }
    
    setIsVerifying(false);
  };

  const verifyExperienceSave = async () => {
    setIsVerifying(true);
    addTestResult('🔄 Testing Experience Save...');
    
    try {
      const currentExperience = studentData?.experience || [];
      const testExperience = {
        id: Date.now(),
        role: 'TEST ROLE - Database Verification',
        company: 'Test Company',
        duration: '1 month',
        description: 'Verification test experience',
        skills: ['Testing', 'Verification']
      };

      const updatedExperience = [...currentExperience, testExperience];
      
      addTestResult(`📝 Adding test experience with ID: ${testExperience.id}`);
      
      const result = await updateExperience(updatedExperience);
      
      if (result?.success) {
        addTestResult('✅ Experience save SUCCESS - Data sent to database');
      } else {
        addTestResult(`❌ Experience save FAILED: ${result?.error || 'Unknown error'}`);
      }
    } catch (err) {
      addTestResult(`❌ Experience save ERROR: ${err.message}`);
    }
    
    setIsVerifying(false);
  };

  const verifySoftSkillSave = async () => {
    setIsVerifying(true);
    addTestResult('🔄 Testing Soft Skill Save...');
    
    try {
      const currentSkills = studentData?.softSkills || [];
      const testSkill = {
        id: Date.now(),
        name: 'TEST SOFT SKILL - Database Verification',
        level: 3,
        type: 'communication',
        description: 'Verification test soft skill'
      };

      const updatedSkills = [...currentSkills, testSkill];
      
      addTestResult(`📝 Adding test soft skill with ID: ${testSkill.id}`);
      
      const result = await updateSoftSkills(updatedSkills);
      
      if (result?.success) {
        addTestResult('✅ Soft Skill save SUCCESS - Data sent to database');
      } else {
        addTestResult(`❌ Soft Skill save FAILED: ${result?.error || 'Unknown error'}`);
      }
    } catch (err) {
      addTestResult(`❌ Soft Skill save ERROR: ${err.message}`);
    }
    
    setIsVerifying(false);
  };

  const testAllSections = async () => {
    addTestResult('🚀 Starting comprehensive test of ALL sections...');
    
    await verifyEducationSave();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await verifyTechnicalSkillSave();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await verifyTrainingSave();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await verifyExperienceSave();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await verifySoftSkillSave();
    
    addTestResult('🎉 Comprehensive test completed! Check results above.');
  };

  const clearResults = () => {
    setSaveResults([]);
  };

  if (loading) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg">
        <p>Loading student data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">🔍 Database Save Verification</h3>
      
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <Button 
            onClick={verifyEducationSave}
            disabled={isVerifying}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isVerifying ? 'Testing...' : 'Test Education Save'}
          </Button>
          
          <Button 
            onClick={verifyTechnicalSkillSave}
            disabled={isVerifying}
            className="bg-green-500 hover:bg-green-600"
          >
            {isVerifying ? 'Testing...' : 'Test Technical Skills'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <Button 
            onClick={verifyTrainingSave}
            disabled={isVerifying}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isVerifying ? 'Testing...' : 'Test Training'}
          </Button>
          
          <Button 
            onClick={verifyExperienceSave}
            disabled={isVerifying}
            className="bg-purple-500 hover:bg-purple-600"
          >
            {isVerifying ? 'Testing...' : 'Test Experience'}
          </Button>
          
          <Button 
            onClick={verifySoftSkillSave}
            disabled={isVerifying}
            className="bg-pink-500 hover:bg-pink-600"
          >
            {isVerifying ? 'Testing...' : 'Test Soft Skills'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            onClick={testAllSections}
            disabled={isVerifying}
            className="bg-red-500 hover:bg-red-600 font-semibold"
          >
            {isVerifying ? 'Testing...' : '🚀 Test ALL Sections'}
          </Button>
          
          <Button 
            onClick={clearResults}
            variant="outline"
            size="sm"
          >
            Clear Results
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Connection Status:</h4>
        {userEmail ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Email: {userEmail}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">No user email found</span>
          </div>
        )}
        
        {studentData?.profile ? (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Profile data loaded</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm">No profile data</span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded border">
        <h4 className="font-medium mb-2">Test Results:</h4>
        {saveResults.length === 0 ? (
          <p className="text-gray-600 text-sm">No tests run yet. Click a test button above.</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {saveResults.map((result, index) => (
              <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
        <h5 className="font-medium text-blue-800">How to verify manually:</h5>
        <ol className="text-sm text-blue-700 mt-1 space-y-1">
          <li>1. Run a test above and see "SUCCESS" message</li>
          <li>2. Go to your Supabase dashboard</li>
          <li>3. Open Table Editor → students table</li>
          <li>4. Find your profile row and click the "profile" JSONB cell</li>
          <li>5. Look for the test data in the arrays:</li>
          <li className="ml-4">• education: [...] - Education records</li>
          <li className="ml-4">• training: [...] - Training courses</li>
          <li className="ml-4">• experience: [...] - Work experience</li>
          <li className="ml-4">• technicalSkills: [...] - Technical skills</li>
          <li className="ml-4">• softSkills: [...] - Soft skills</li>
        </ol>
      </div>
    </div>
  );
};

export default DatabaseSaveVerification;