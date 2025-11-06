import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Database } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { parseResumeWithAI } from '../../../services/resumeParserService';
import { supabase } from '../../../utils/api';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js worker - using local worker file from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const ResumeParser = ({ onDataExtracted, onClose, userEmail }) => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Handle editing extracted data
  const handleFieldEdit = (field, value) => {
    setExtractedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayItemEdit = (arrayName, index, field, value) => {
    setExtractedData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleArrayItemDelete = (arrayName, index) => {
    setExtractedData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleArrayItemAdd = (arrayName, newItem) => {
    setExtractedData(prev => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] || []), newItem]
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF, DOC, DOCX, or TXT file');
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const extractTextFromFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target.result;
          
          // For text files, directly use the content
          if (file.type === 'text/plain') {
            resolve(content);
            return;
          }
          
          // For PDF files, use a simple text extraction
          if (file.type === 'application/pdf') {
            // Simple PDF text extraction (basic approach)
            // In production, you'd want to use a library like pdf.js
            const text = await extractTextFromPDF(content);
            resolve(text);
            return;
          }
          
          // For DOC/DOCX, we'll need to send to backend or use a library
          // For now, we'll use a simple approach
          resolve(content);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const extractTextFromPDF = async (arrayBuffer) => {
    try {
      
      // Create a Uint8Array from the ArrayBuffer
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Load the PDF document with better error handling
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        verbosity: 0, // Reduce console noise
        cMapUrl: 'https://unpkg.com/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
        cMapPacked: true,
      });
      
      const pdf = await loadingTask.promise;
      
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine all text items with proper spacing
          const pageText = textContent.items
            .map(item => item.str)
            .filter(str => str.trim().length > 0) // Remove empty strings
            .join(' ');
          
          fullText += pageText + '\n\n';
        } catch (pageError) {
          // Continue with other pages
        }
      }
      
      const cleanedText = fullText.trim();
      
      if (cleanedText.length === 0) {
        throw new Error('No text could be extracted from the PDF. The PDF might be image-based or encrypted.');
      }
      
      return cleanedText;
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      console.error('❌ Error details:', error.message);
      
      // Provide more specific error messages
      if (error.message?.includes('Invalid PDF')) {
        throw new Error('Invalid PDF file. Please ensure the file is a valid PDF document.');
      } else if (error.message?.includes('password')) {
        throw new Error('PDF is password protected. Please upload an unprotected PDF.');
      } else if (error.message?.includes('No text')) {
        throw new Error('No text found in PDF. The PDF might contain only images. Try converting to text first or use a TXT file.');
      } else {
        throw new Error(`Failed to extract text from PDF: ${error.message}. Try using a TXT file instead.`);
      }
    }
  };

  const handleParse = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setParsing(true);
    setError(null);
    setSuccess(false);
    setSaveResult(null);

    try {
      // Extract text from file
      const resumeText = await extractTextFromFile(file);
      
      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error('Could not extract text from file');
      }

      // Parse resume using AI
      const parsedData = await parseResumeWithAI(resumeText);
      
      if (!parsedData) {
        throw new Error('Failed to parse resume data');
      }

      setExtractedData(parsedData);
      setSuccess(true);
      
    } catch (err) {
      console.error('Resume parsing error:', err);
      setError(err.message || 'Failed to parse resume. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  // Save to database
  const handleSaveToDatabase = async () => {
    if (!extractedData) {
      setError('No data to save');
      return;
    }

    // Use email from extracted data if userEmail is not available
    const emailToUse = userEmail || extractedData.email;
    
    if (!emailToUse) {
      setError('No email available for saving');
      return;
    }

    setSaving(true);
    setSaveResult(null);

    try {

      // Get current student data by email (from JSONB profile column)
      const { data: currentStudent, error: fetchError } = await supabase
        .from('students')
        .select('profile, id')
        .eq('profile->>email', emailToUse)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is okay - we'll create a new record
        throw new Error(`Error fetching current data: ${fetchError.message}`);
      }


      // Merge extracted data with current profile
      const updatedProfile = {
        ...(currentStudent?.profile || {}),
        name: extractedData.name || currentStudent?.profile?.name,
        email: extractedData.email || currentStudent?.profile?.email,
        contact_number: extractedData.contact_number,
        age: extractedData.age,
        date_of_birth: extractedData.date_of_birth,
        college_school_name: extractedData.college_school_name,
        university: extractedData.university,
        registration_number: extractedData.registration_number,
        district_name: extractedData.district_name,
        branch_field: extractedData.branch_field,
        trainer_name: extractedData.trainer_name,
        nm_id: extractedData.nm_id,
        course: extractedData.course,
        alternate_number: extractedData.alternate_number,
        contact_number_dial_code: extractedData.contact_number_dial_code,
        skill: extractedData.skill,
        
        // Arrays - merge with existing
        education: extractedData.education || currentStudent?.profile?.education || [],
        training: extractedData.training || currentStudent?.profile?.training || [],
        experience: extractedData.experience || currentStudent?.profile?.experience || [],
        technicalSkills: extractedData.technicalSkills || currentStudent?.profile?.technicalSkills || [],
        softSkills: extractedData.softSkills || currentStudent?.profile?.softSkills || [],
        certificates: extractedData.certificates || currentStudent?.profile?.certificates || [],
        projects: extractedData.projects || currentStudent?.profile?.projects || [],
        
        // Metadata
        resumeImportedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };


      if (currentStudent?.id) {
        // Update existing student using student ID
        const { data: savedData, error: updateError } = await supabase
          .from('students')
          .update({ profile: updatedProfile })
          .eq('id', currentStudent.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Error saving data: ${updateError.message}`);
        }

        setSaveResult({ success: true, message: 'Profile updated successfully!' });
      } else {
        // Create new student record
        const { data: newStudent, error: insertError } = await supabase
          .from('students')
          .insert([{ profile: updatedProfile }])
          .select()
          .single();

        if (insertError) {
          throw new Error(`Error creating profile: ${insertError.message}`);
        }

        setSaveResult({ success: true, message: 'Profile created successfully!' });
      }
      
      // Call parent callback with extracted data
      if (onDataExtracted) {
        onDataExtracted(extractedData);
      }

    } catch (err) {
      console.error('❌ Save error:', err);
      setSaveResult({ success: false, message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Resume Parser</h2>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          <p className="text-gray-600 mb-6">
            Upload your resume and we'll automatically extract your information to fill your profile.
          </p>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-blue-400 transition-colors">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
              disabled={parsing}
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <span className="text-lg font-medium text-gray-700 mb-1">
                {file ? file.name : 'Click to upload your resume'}
              </span>
              <span className="text-sm text-gray-500">
                Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
              </span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-800 font-medium">Success!</p>
                <p className="text-green-600 text-sm">
                  Resume parsed successfully. Your profile data has been updated.
                </p>
              </div>
            </div>
          )}

          {/* Save Result Message */}
          {saveResult && (
            <div className={`${saveResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mb-6 flex items-start gap-3`}>
              {saveResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`${saveResult.success ? 'text-green-800' : 'text-red-800'} font-medium`}>
                  {saveResult.success ? 'Saved!' : 'Error'}
                </p>
                <p className={`${saveResult.success ? 'text-green-600' : 'text-red-600'} text-sm`}>
                  {saveResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Extracted Data Preview */}
          {extractedData && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">✅ Extracted Data - {editMode ? 'Edit Mode' : 'Review Mode'}:</h3>
                <Button
                  onClick={() => setEditMode(!editMode)}
                  variant="outline"
                  size="sm"
                  className="text-xs px-3 py-1"
                >
                  {editMode ? '👁️ View' : '✏️ Edit'}
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                {/* Personal Info */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-700 mb-2">Personal Information:</h4>
                  <div className="space-y-2 text-xs">
                    {editMode ? (
                      <>
                        <div>
                          <label className="font-medium block mb-1">Name:</label>
                          <input
                            type="text"
                            value={extractedData.name || ''}
                            onChange={(e) => handleFieldEdit('name', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-medium block mb-1">Email:</label>
                          <input
                            type="email"
                            value={extractedData.email || ''}
                            onChange={(e) => handleFieldEdit('email', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-medium block mb-1">Phone:</label>
                          <input
                            type="text"
                            value={extractedData.contact_number || ''}
                            onChange={(e) => handleFieldEdit('contact_number', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="font-medium block mb-1">University:</label>
                          <input
                            type="text"
                            value={extractedData.university || ''}
                            onChange={(e) => handleFieldEdit('university', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p><span className="font-medium">Name:</span> {extractedData.name || '(empty)'}</p>
                        <p><span className="font-medium">Email:</span> {extractedData.email || '(empty)'}</p>
                        <p><span className="font-medium">Phone:</span> {extractedData.contact_number || '(empty)'}</p>
                        <p><span className="font-medium">University:</span> {extractedData.university || '(empty)'}</p>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Education */}
                {extractedData.education && extractedData.education.length > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-700 mb-2">Education ({extractedData.education.length}):</h4>
                    {extractedData.education.map((edu, idx) => (
                      <div key={idx} className="text-xs mb-3 pl-3 border-l-2 border-blue-300">
                        {editMode ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={edu.degree || ''}
                              onChange={(e) => handleArrayItemEdit('education', idx, 'degree', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs font-medium"
                              placeholder="Degree"
                            />
                            <input
                              type="text"
                              value={edu.university || ''}
                              onChange={(e) => handleArrayItemEdit('education', idx, 'university', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                              placeholder="University"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={edu.yearOfPassing || ''}
                                onChange={(e) => handleArrayItemEdit('education', idx, 'yearOfPassing', e.target.value)}
                                className="flex-1 px-2 py-1 border rounded text-xs"
                                placeholder="Year"
                              />
                              <input
                                type="text"
                                value={edu.cgpa || ''}
                                onChange={(e) => handleArrayItemEdit('education', idx, 'cgpa', e.target.value)}
                                className="flex-1 px-2 py-1 border rounded text-xs"
                                placeholder="CGPA"
                              />
                            </div>
                            <button
                              onClick={() => handleArrayItemDelete('education', idx)}
                              className="text-red-600 hover:text-red-800 text-xs mt-1"
                            >
                              ❌ Delete
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium">{edu.degree || '(no degree)'}</p>
                            <p className="text-gray-600">{edu.university || '(no university)'}</p>
                            <p className="text-gray-500">{edu.yearOfPassing || '(no year)'} | CGPA: {edu.cgpa || 'N/A'}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Experience */}
                {extractedData.experience && extractedData.experience.length > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-700 mb-2">Experience ({extractedData.experience.length}):</h4>
                    {extractedData.experience.map((exp, idx) => (
                      <div key={idx} className="text-xs mb-3 pl-3 border-l-2 border-green-300">
                        {editMode ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={exp.role || ''}
                              onChange={(e) => handleArrayItemEdit('experience', idx, 'role', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs font-medium"
                              placeholder="Role"
                            />
                            <input
                              type="text"
                              value={exp.organization || ''}
                              onChange={(e) => handleArrayItemEdit('experience', idx, 'organization', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                              placeholder="Organization"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-gray-600">From Date</label>
                                <input
                                  type="month"
                                  value={exp.startDate || ''}
                                  onChange={(e) => handleArrayItemEdit('experience', idx, 'startDate', e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">To Date</label>
                                <input
                                  type="month"
                                  value={exp.endDate || ''}
                                  onChange={(e) => handleArrayItemEdit('experience', idx, 'endDate', e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-xs"
                                  placeholder="or 'Present'"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => handleArrayItemDelete('experience', idx)}
                              className="text-red-600 hover:text-red-800 text-xs mt-1"
                            >
                              ❌ Delete
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium">{exp.role || '(no role)'}</p>
                            <p className="text-gray-600">{exp.organization || '(no organization)'}</p>
                            <p className="text-gray-500">
                              {exp.startDate || exp.endDate ? (
                                `${exp.startDate ? new Date(exp.startDate + '-01').toLocaleDateString('en-US', {month: 'short', year: 'numeric'}) : '?'} - ${exp.endDate ? new Date(exp.endDate + '-01').toLocaleDateString('en-US', {month: 'short', year: 'numeric'}) : 'Present'}`
                              ) : (
                                exp.duration || '(no duration)'
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Projects */}
                {extractedData.projects && extractedData.projects.length > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-700 mb-2">Projects ({extractedData.projects.length}):</h4>
                    {extractedData.projects.map((proj, idx) => (
                      <div key={idx} className="text-xs mb-3 pl-3 border-l-2 border-purple-300">
                        {editMode ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={proj.title || ''}
                              onChange={(e) => handleArrayItemEdit('projects', idx, 'title', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs font-medium"
                              placeholder="Project Title"
                            />
                            <input
                              type="text"
                              value={proj.organization || ''}
                              onChange={(e) => handleArrayItemEdit('projects', idx, 'organization', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                              placeholder="Organization"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-gray-600">From Date</label>
                                <input
                                  type="month"
                                  value={proj.startDate || ''}
                                  onChange={(e) => handleArrayItemEdit('projects', idx, 'startDate', e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">To Date</label>
                                <input
                                  type="month"
                                  value={proj.endDate || ''}
                                  onChange={(e) => handleArrayItemEdit('projects', idx, 'endDate', e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-xs"
                                  placeholder="or 'Present'"
                                />
                              </div>
                            </div>
                            <textarea
                              value={proj.description || ''}
                              onChange={(e) => handleArrayItemEdit('projects', idx, 'description', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                              placeholder="Project Description"
                              rows="2"
                            />
                            <input
                              type="text"
                              value={(proj.technologies || []).join(', ')}
                              onChange={(e) => handleArrayItemEdit('projects', idx, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                              className="w-full px-2 py-1 border rounded text-xs"
                              placeholder="Technologies (comma-separated: React, Node.js, Python)"
                            />
                            <input
                              type="text"
                              value={proj.link || ''}
                              onChange={(e) => handleArrayItemEdit('projects', idx, 'link', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                              placeholder="Project Link (optional)"
                            />
                            <button
                              onClick={() => handleArrayItemDelete('projects', idx)}
                              className="text-red-600 hover:text-red-800 text-xs mt-1"
                            >
                              ❌ Delete
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium">{proj.title || '(no title)'}</p>
                            {proj.organization && <p className="text-gray-600">{proj.organization}</p>}
                            <p className="text-gray-600">
                              {proj.startDate || proj.endDate ? (
                                `${proj.startDate ? new Date(proj.startDate + '-01').toLocaleDateString('en-US', {month: 'short', year: 'numeric'}) : '?'} - ${proj.endDate ? new Date(proj.endDate + '-01').toLocaleDateString('en-US', {month: 'short', year: 'numeric'}) : 'Present'}`
                              ) : (
                                proj.duration || '(no duration)'
                              )}
                            </p>
                            {proj.description && <p className="text-gray-500 mt-1">{proj.description}</p>}
                            {proj.technologies && proj.technologies.length > 0 ? (
                              <p className="text-gray-500">Tech: {proj.technologies.join(', ')}</p>
                            ) : (
                              <p className="text-red-500">⚠️ No technologies extracted</p>
                            )}
                            {proj.link && <p className="text-blue-500 text-xs">🔗 {proj.link}</p>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Technical Skills */}
                {extractedData.technicalSkills && extractedData.technicalSkills.length > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-700 mb-2">Technical Skills ({extractedData.technicalSkills.length}):</h4>
                    {editMode ? (
                      <div className="space-y-2">
                        {extractedData.technicalSkills.map((skill, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <input
                              type="text"
                              value={skill.name || ''}
                              onChange={(e) => handleArrayItemEdit('technicalSkills', idx, 'name', e.target.value)}
                              className="flex-1 px-2 py-1 border rounded text-xs"
                              placeholder="Skill Name"
                            />
                            <input
                              type="text"
                              value={skill.category || ''}
                              onChange={(e) => handleArrayItemEdit('technicalSkills', idx, 'category', e.target.value)}
                              className="w-32 px-2 py-1 border rounded text-xs"
                              placeholder="Category"
                            />
                            <select
                              value={skill.level || 3}
                              onChange={(e) => handleArrayItemEdit('technicalSkills', idx, 'level', parseInt(e.target.value))}
                              className="w-20 px-2 py-1 border rounded text-xs"
                            >
                              <option value="1">Beginner</option>
                              <option value="2">Basic</option>
                              <option value="3">Intermediate</option>
                              <option value="4">Advanced</option>
                              <option value="5">Expert</option>
                            </select>
                            <button
                              onClick={() => handleArrayItemDelete('technicalSkills', idx)}
                              className="text-red-600 hover:text-red-800 text-xs px-1"
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {extractedData.technicalSkills.map((skill, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Soft Skills */}
                {extractedData.softSkills && extractedData.softSkills.length > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-700 mb-2">Soft Skills ({extractedData.softSkills.length}):</h4>
                    {editMode ? (
                      <div className="space-y-2">
                        {extractedData.softSkills.map((skill, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <input
                              type="text"
                              value={skill.name || ''}
                              onChange={(e) => handleArrayItemEdit('softSkills', idx, 'name', e.target.value)}
                              className="flex-1 px-2 py-1 border rounded text-xs"
                              placeholder="Skill Name"
                            />
                            <input
                              type="text"
                              value={skill.type || ''}
                              onChange={(e) => handleArrayItemEdit('softSkills', idx, 'type', e.target.value)}
                              className="w-28 px-2 py-1 border rounded text-xs"
                              placeholder="Type"
                            />
                            <select
                              value={skill.level || 3}
                              onChange={(e) => handleArrayItemEdit('softSkills', idx, 'level', parseInt(e.target.value))}
                              className="w-20 px-2 py-1 border rounded text-xs"
                            >
                              <option value="1">Beginner</option>
                              <option value="2">Basic</option>
                              <option value="3">Intermediate</option>
                              <option value="4">Advanced</option>
                              <option value="5">Expert</option>
                            </select>
                            <button
                              onClick={() => handleArrayItemDelete('softSkills', idx)}
                              className="text-red-600 hover:text-red-800 text-xs px-1"
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {extractedData.softSkills.map((skill, idx) => (
                          <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Certificates */}
                {extractedData.certificates && extractedData.certificates.length > 0 && (
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-700 mb-2">Certificates ({extractedData.certificates.length}):</h4>
                    {extractedData.certificates.map((cert, idx) => (
                      <div key={idx} className="text-xs mb-3 pl-3 border-l-2 border-yellow-300">
                        {editMode ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={cert.title || ''}
                              onChange={(e) => handleArrayItemEdit('certificates', idx, 'title', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs font-medium"
                              placeholder="Certificate Title"
                            />
                            <input
                              type="text"
                              value={cert.issuer || ''}
                              onChange={(e) => handleArrayItemEdit('certificates', idx, 'issuer', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                              placeholder="Issuer/Organization"
                            />
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">Issue Date</label>
                              <input
                                type="month"
                                value={cert.issuedOn || ''}
                                onChange={(e) => handleArrayItemEdit('certificates', idx, 'issuedOn', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-xs"
                              />
                            </div>
                            <input
                              type="text"
                              value={cert.credentialId || ''}
                              onChange={(e) => handleArrayItemEdit('certificates', idx, 'credentialId', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                              placeholder="Credential ID (optional)"
                            />
                            <input
                              type="text"
                              value={cert.link || ''}
                              onChange={(e) => handleArrayItemEdit('certificates', idx, 'link', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                              placeholder="Certificate Link (optional)"
                            />
                            <button
                              onClick={() => handleArrayItemDelete('certificates', idx)}
                              className="text-red-600 hover:text-red-800 text-xs mt-1"
                            >
                              ❌ Delete
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium">{cert.title || '(no title)'}</p>
                            <p className="text-gray-600">
                              {cert.issuer || '(no issuer)'} | {
                                cert.issuedOn ? 
                                  new Date(cert.issuedOn + '-01').toLocaleDateString('en-US', {month: 'short', year: 'numeric'}) : 
                                  '(no date)'
                              }
                            </p>
                            {cert.credentialId && <p className="text-gray-500">ID: {cert.credentialId}</p>}
                            {cert.link && <p className="text-blue-500">🔗 {cert.link}</p>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <Button
              onClick={handleParse}
              disabled={!file || parsing || saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {parsing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing Resume...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Parse Resume
                </>
              )}
            </Button>
            
            {extractedData && (
              <Button
                onClick={handleSaveToDatabase}
                disabled={saving || parsing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving to Database...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Save to Database
                  </>
                )}
              </Button>
            )}
            
            {onClose && (
              <Button
                onClick={onClose}
                variant="outline"
                disabled={parsing || saving}
                className="px-6"
              >
                {saveResult?.success ? 'Done' : 'Cancel'}
              </Button>
            )}
          </div>

          {/* Information */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">📋 How it works:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✅ <strong>Step 1:</strong> Upload your resume (PDF, DOC, DOCX, or TXT)</li>
              <li>✅ <strong>Step 2:</strong> Click "Parse Resume" to extract data</li>
              <li>✅ <strong>Step 3:</strong> Review the extracted data in the preview</li>
              <li>✅ <strong>Step 4:</strong> Click "Save to Database" to update your profile</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeParser;
