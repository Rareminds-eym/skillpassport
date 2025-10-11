/**
 * Debug component to test the student finding functionality
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../utils/api';

const StudentFindingDebug = () => {
  const { user } = useAuth();
  const userEmail = user?.email;
  const [debugResults, setDebugResults] = useState([]);

  const addResult = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testDirectJSONBQuery = async () => {
    if (!userEmail) {
      addResult('❌ No user email found');
      return;
    }

    addResult(`🔍 Testing direct JSONB query for: ${userEmail}`);
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('profile->>email', userEmail)
        .maybeSingle();

      if (error) {
        addResult(`❌ JSONB query error: ${error.message}`);
      } else if (data) {
        addResult(`✅ JSONB query SUCCESS - Found student ID: ${data.id}`);
        addResult(`📋 Profile name: ${JSON.parse(data.profile)?.name}`);
      } else {
        addResult(`⚠️ JSONB query returned null`);
      }
    } catch (err) {
      addResult(`❌ JSONB query exception: ${err.message}`);
    }
  };

  const testManualSearch = async () => {
    if (!userEmail) {
      addResult('❌ No user email found');
      return;
    }

    addResult(`🔍 Testing manual search for: ${userEmail}`);
    
    try {
      const { data: allStudents, error } = await supabase
        .from('students')
        .select('*');

      if (error) {
        addResult(`❌ Manual search error: ${error.message}`);
        return;
      }

      addResult(`📊 Found ${allStudents?.length || 0} total students`);

      let found = false;
      for (const student of allStudents || []) {
        try {
          const profile = JSON.parse(student.profile);
          if (profile?.email === userEmail) {
            addResult(`✅ Manual search SUCCESS - Found student ID: ${student.id}`);
            addResult(`📋 Profile name: ${profile.name}`);
            found = true;
            break;
          }
        } catch (parseErr) {
          // Skip invalid JSON profiles
        }
      }

      if (!found) {
        addResult(`❌ Manual search FAILED - No student found with email: ${userEmail}`);
      }
    } catch (err) {
      addResult(`❌ Manual search exception: ${err.message}`);
    }
  };

  const testUpdateEducation = async () => {
    if (!userEmail) {
      addResult('❌ No user email found');
      return;
    }

    addResult(`🧪 Testing education update for: ${userEmail}`);
    
    try {
      // Import the function dynamically to test it
      const { updateEducationByEmail } = await import('../../../services/studentServiceProfile');
      
      const testEducation = [
        {
          id: Date.now(),
          degree: 'DEBUG TEST DEGREE',
          university: 'Test University',
          department: 'Test Department',
          yearOfPassing: '2025',
          cgpa: '9.0',
          level: "Bachelor's",
          status: 'ongoing'
        }
      ];

      const result = await updateEducationByEmail(userEmail, testEducation);
      
      if (result.success) {
        addResult(`✅ Education update SUCCESS!`);
        addResult(`📋 Updated profile data received`);
      } else {
        addResult(`❌ Education update FAILED: ${result.error}`);
      }
    } catch (err) {
      addResult(`❌ Education update exception: ${err.message}`);
    }
  };

  const testUpdateTraining = async () => {
    if (!userEmail) {
      addResult('❌ No user email found');
      return;
    }

    addResult(`🎓 Testing training update for: ${userEmail}`);
    
    try {
      const { updateTrainingByEmail } = await import('../../../services/studentServiceProfile');
      
      const testTraining = [
        {
          id: Date.now(),
          course: 'DEBUG TEST TRAINING COURSE',
          progress: 75,
          status: 'ongoing',
          instructor: 'Test Instructor',
          startDate: new Date().toISOString(),
          description: 'Test training description'
        }
      ];

      const result = await updateTrainingByEmail(userEmail, testTraining);
      
      if (result.success) {
        addResult(`✅ Training update SUCCESS!`);
      } else {
        addResult(`❌ Training update FAILED: ${result.error}`);
      }
    } catch (err) {
      addResult(`❌ Training update exception: ${err.message}`);
    }
  };

  const testUpdateExperience = async () => {
    if (!userEmail) {
      addResult('❌ No user email found');
      return;
    }

    addResult(`💼 Testing experience update for: ${userEmail}`);
    
    try {
      const { updateExperienceByEmail } = await import('../../../services/studentServiceProfile');
      
      const testExperience = [
        {
          id: Date.now(),
          role: 'DEBUG TEST ROLE',
          company: 'Test Company',
          duration: '3 months',
          description: 'Test work experience',
          skills: ['Testing', 'Debugging'],
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          verified: false
        }
      ];

      const result = await updateExperienceByEmail(userEmail, testExperience);
      
      if (result.success) {
        addResult(`✅ Experience update SUCCESS!`);
      } else {
        addResult(`❌ Experience update FAILED: ${result.error}`);
      }
    } catch (err) {
      addResult(`❌ Experience update exception: ${err.message}`);
    }
  };

  const testUpdateTechnicalSkills = async () => {
    if (!userEmail) {
      addResult('❌ No user email found');
      return;
    }

    addResult(`⚡ Testing technical skills update for: ${userEmail}`);
    
    try {
      const { updateTechnicalSkillsByEmail } = await import('../../../services/studentServiceProfile');
      
      const testSkills = [
        {
          id: Date.now(),
          name: 'DEBUG TEST TECHNICAL SKILL',
          level: 4,
          verified: false,
          icon: '🧪',
          category: 'Testing',
          description: 'Test technical skill'
        }
      ];

      const result = await updateTechnicalSkillsByEmail(userEmail, testSkills);
      
      if (result.success) {
        addResult(`✅ Technical skills update SUCCESS!`);
      } else {
        addResult(`❌ Technical skills update FAILED: ${result.error}`);
      }
    } catch (err) {
      addResult(`❌ Technical skills update exception: ${err.message}`);
    }
  };

  const testUpdateSoftSkills = async () => {
    if (!userEmail) {
      addResult('❌ No user email found');
      return;
    }

    addResult(`🤝 Testing soft skills update for: ${userEmail}`);
    
    try {
      const { updateSoftSkillsByEmail } = await import('../../../services/studentServiceProfile');
      
      const testSkills = [
        {
          id: Date.now(),
          name: 'DEBUG TEST SOFT SKILL',
          level: 3,
          type: 'communication',
          description: 'Test soft skill'
        }
      ];

      const result = await updateSoftSkillsByEmail(userEmail, testSkills);
      
      if (result.success) {
        addResult(`✅ Soft skills update SUCCESS!`);
      } else {
        addResult(`❌ Soft skills update FAILED: ${result.error}`);
      }
    } catch (err) {
      addResult(`❌ Soft skills update exception: ${err.message}`);
    }
  };

  const testAllSections = async () => {
    addResult(`🚀 Testing ALL sections...`);
    await testUpdateEducation();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await testUpdateTraining();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testUpdateExperience();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testUpdateTechnicalSkills();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testUpdateSoftSkills();
    addResult(`🎉 All section tests completed!`);
  };

  const clearResults = () => {
    setDebugResults([]);
  };

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🐛 Student Finding Debug Tool</h3>
      
      <div className="mb-4">
        <p className="text-sm mb-2">
          <strong>User Email:</strong> {userEmail || 'Not logged in'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Button onClick={testDirectJSONBQuery} className="bg-blue-500 hover:bg-blue-600">
          Test JSONB Query
        </Button>
        
        <Button onClick={testManualSearch} className="bg-green-500 hover:bg-green-600">
          Test Manual Search
        </Button>
        
        <Button onClick={testAllSections} className="bg-red-500 hover:bg-red-600">
          🚀 Test ALL Sections
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
        <Button onClick={testUpdateEducation} className="bg-purple-500 hover:bg-purple-600 text-xs">
          Education
        </Button>
        
        <Button onClick={testUpdateTraining} className="bg-orange-500 hover:bg-orange-600 text-xs">
          Training
        </Button>
        
        <Button onClick={testUpdateExperience} className="bg-teal-500 hover:bg-teal-600 text-xs">
          Experience
        </Button>
        
        <Button onClick={testUpdateTechnicalSkills} className="bg-indigo-500 hover:bg-indigo-600 text-xs">
          Tech Skills
        </Button>
        
        <Button onClick={testUpdateSoftSkills} className="bg-pink-500 hover:bg-pink-600 text-xs">
          Soft Skills
        </Button>
      </div>

      <Button onClick={clearResults} variant="outline" size="sm" className="mb-4">
        Clear Results
      </Button>

      <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
        <h4 className="font-medium mb-2">Debug Results:</h4>
        {debugResults.length === 0 ? (
          <p className="text-gray-600 text-sm">No tests run yet. Click buttons above to debug.</p>
        ) : (
          <div className="space-y-1">
            {debugResults.map((result, index) => (
              <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
        <h5 className="font-medium text-blue-800">What this tests:</h5>
        <ul className="text-sm text-blue-700 mt-1 space-y-1">
          <li>• JSONB Query: Tests if profile{'->'}{'>'}email query works</li>
          <li>• Manual Search: Fallback method that should always work</li>
          <li>• Individual Sections: Test each data type separately</li>
          <li>• Test ALL Sections: Comprehensive test of all 5 data types</li>
          <li>• Verifies: Education, Training, Experience, Technical Skills, Soft Skills</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentFindingDebug;