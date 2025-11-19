/**
 * TEST FILE: How to Add and Save Data to Supabase JSONB
 * 
 * This file demonstrates how the add functionality works with Supabase
 * and saves data in JSONB format to the students table.
 */

import React, { useState } from 'react';
import { useStudentDataByEmail } from '../hooks/useStudentDataByEmail';
import { useAuth } from '../context/AuthContext';

const AddDataTest = () => {
  const { user } = useAuth();
  const userEmail = user?.email;
  
  const {
    studentData,
    loading,
    error,
    updateEducation,
    updateTraining,
    updateExperience,
    updateTechnicalSkills,
    updateSoftSkills
  } = useStudentDataByEmail(userEmail);

  const [testResults, setTestResults] = useState([]);

  // Test adding new education
  const testAddEducation = async () => {
    
    const currentEducation = studentData?.education || [];
    const newEducation = {
      id: Date.now(),
      degree: 'Master of Science',
      university: 'Test University',
      department: 'Computer Science',
      yearOfPassing: '2026',
      cgpa: '9.0',
      level: "Master's",
      status: 'ongoing'
    };

    const updatedEducation = [...currentEducation, newEducation];
    
    try {
      const result = await updateEducation(updatedEducation);
      if (result.success) {
        setTestResults(prev => [...prev, '✅ Education added successfully']);
      } else {
        setTestResults(prev => [...prev, `❌ Education failed: ${result.error}`]);
      }
    } catch (err) {
      setTestResults(prev => [...prev, `❌ Education error: ${err.message}`]);
    }
  };

  // Test adding new training
  const testAddTraining = async () => {
    
    const currentTraining = studentData?.training || [];
    const newTraining = {
      id: Date.now(),
      course: 'Advanced React Development',
      progress: 25,
      status: 'ongoing',
      instructor: 'John Doe',
      startDate: new Date().toISOString(),
      description: 'Learning advanced React patterns and hooks'
    };

    const updatedTraining = [...currentTraining, newTraining];
    
    try {
      const result = await updateTraining(updatedTraining);
      if (result.success) {
        setTestResults(prev => [...prev, '✅ Training added successfully']);
      } else {
        setTestResults(prev => [...prev, `❌ Training failed: ${result.error}`]);
      }
    } catch (err) {
      setTestResults(prev => [...prev, `❌ Training error: ${err.message}`]);
    }
  };

  // Test adding new experience
  const testAddExperience = async () => {
    
    const currentExperience = studentData?.experience || [];
    const newExperience = {
      id: Date.now(),
      role: 'Software Developer Intern',
      company: 'Tech Corp',
      duration: '3 months',
      description: 'Developed web applications using React and Node.js',
      skills: ['React', 'Node.js', 'MongoDB'],
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      verified: false
    };

    const updatedExperience = [...currentExperience, newExperience];
    
    try {
      const result = await updateExperience(updatedExperience);
      if (result.success) {
        setTestResults(prev => [...prev, '✅ Experience added successfully']);
      } else {
        setTestResults(prev => [...prev, `❌ Experience failed: ${result.error}`]);
      }
    } catch (err) {
      setTestResults(prev => [...prev, `❌ Experience error: ${err.message}`]);
    }
  };

  // Test adding new technical skill
  const testAddTechnicalSkill = async () => {
    
    const currentSkills = studentData?.technicalSkills || [];
    const newSkill = {
      id: Date.now(),
      name: 'TypeScript',
      level: 4,
      verified: false,
      icon: '📝',
      category: 'Programming Language',
      description: 'Statically typed JavaScript'
    };

    const updatedSkills = [...currentSkills, newSkill];
    
    try {
      const result = await updateTechnicalSkills(updatedSkills);
      if (result.success) {
        setTestResults(prev => [...prev, '✅ Technical skill added successfully']);
      } else {
        setTestResults(prev => [...prev, `❌ Technical skill failed: ${result.error}`]);
      }
    } catch (err) {
      setTestResults(prev => [...prev, `❌ Technical skill error: ${err.message}`]);
    }
  };

  // Test adding new soft skill
  const testAddSoftSkill = async () => {
    
    const currentSoftSkills = studentData?.softSkills || [];
    const newSoftSkill = {
      id: Date.now(),
      name: 'Leadership',
      level: 3,
      type: 'leadership',
      description: 'Ability to lead and motivate teams'
    };

    const updatedSoftSkills = [...currentSoftSkills, newSoftSkill];
    
    try {
      const result = await updateSoftSkills(updatedSoftSkills);
      if (result.success) {
        setTestResults(prev => [...prev, '✅ Soft skill added successfully']);
      } else {
        setTestResults(prev => [...prev, `❌ Soft skill failed: ${result.error}`]);
      }
    } catch (err) {
      setTestResults(prev => [...prev, `❌ Soft skill error: ${err.message}`]);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!studentData) return <div>No student data found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Data to Supabase JSONB Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <button 
          onClick={testAddEducation}
          className="p-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Education
        </button>
        
        <button 
          onClick={testAddTraining}
          className="p-4 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Training
        </button>
        
        <button 
          onClick={testAddExperience}
          className="p-4 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Add Experience
        </button>
        
        <button 
          onClick={testAddTechnicalSkill}
          className="p-4 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Add Technical Skill
        </button>
        
        <button 
          onClick={testAddSoftSkill}
          className="p-4 bg-pink-500 text-white rounded hover:bg-pink-600"
        >
          Add Soft Skill
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Test Results:</h2>
        <div className="bg-gray-100 p-4 rounded">
          {testResults.length === 0 ? (
            <p>No tests run yet. Click buttons above to test add functionality.</p>
          ) : (
            <ul className="space-y-1">
              {testResults.map((result, index) => (
                <li key={index} className="font-mono text-sm">{result}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Current Data Structure:</h2>
        <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          <pre className="text-xs">
            {JSON.stringify({
              education: studentData.education,
              training: studentData.training,
              experience: studentData.experience,
              technicalSkills: studentData.technicalSkills,
              softSkills: studentData.softSkills
            }, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-800">How it works:</h3>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>• Each button adds a new item to the respective array</li>
          <li>• Data is saved to Supabase students table → profile JSONB column</li>
          <li>• The hook automatically updates the UI with new data</li>
          <li>• All data persists across page refreshes</li>
          <li>• Check your Supabase dashboard to see the JSONB structure</li>
        </ul>
      </div>
    </div>
  );
};

export default AddDataTest;