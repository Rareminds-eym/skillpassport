import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Database, Code } from 'lucide-react';
import { Button } from './ui/button';
import { parseResumeWithAI } from '../../../services/resumeParserService';
import { supabase } from '../../../utils/api';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js worker - using local worker file from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * ResumeParserTester - Test component to verify resume parsing and JSONB storage
 *
 * This component helps you:
 * 1. Upload and parse a resume
 * 2. View the extracted JSON data
 * 3. Verify the data structure matches the database schema
 * 4. Test saving to Supabase JSONB column
 */
const ResumeParserTester = ({ userId, onClose }) => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [databaseData, setDatabaseData] = useState(null);

  // Handle file upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'text/plain'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF or TXT file');
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setExtractedData(null);
      setSaveResult(null);
      setDatabaseData(null);
    }
  };

  // Extract text from file
  const extractTextFromFile = async (file) => {
    if (file.type === 'text/plain') {
      // For text files, read as text
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    } else if (file.type === 'application/pdf') {
      // For PDF files, use PDF.js
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
            const text = await extractTextFromPDF(arrayBuffer);
            resolve(text);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    } else {
      throw new Error('Unsupported file type');
    }
  };

  // Extract text from PDF using PDF.js
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

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          const pageText = textContent.items
            .map((item) => item.str)
            .filter((str) => str.trim().length > 0)
            .join(' ');

          fullText += pageText + '\n\n';
        } catch (pageError) {}
      }

      const cleanedText = fullText.trim();

      if (cleanedText.length === 0) {
        throw new Error(
          'No text could be extracted from the PDF. The PDF might be image-based or encrypted.'
        );
      }

      return cleanedText;
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      console.error('❌ Error details:', error.message);

      if (error.message?.includes('Invalid PDF')) {
        throw new Error('Invalid PDF file. Please ensure the file is a valid PDF document.');
      } else if (error.message?.includes('password')) {
        throw new Error('PDF is password protected. Please upload an unprotected PDF.');
      } else if (error.message?.includes('No text')) {
        throw new Error(
          'No text found in PDF. The PDF might contain only images. Try converting to text first or use a TXT file.'
        );
      } else {
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
      }
    }
  };

  // Parse resume
  const handleParse = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setParsing(true);
    setError(null);

    try {
      // Extract text
      const resumeText = await extractTextFromFile(file);

      // Parse with AI
      const parsedData = await parseResumeWithAI(resumeText);

      if (!parsedData) {
        throw new Error('Failed to parse resume data');
      }

      setExtractedData(parsedData);
    } catch (err) {
      console.error('Resume parsing error:', err);
      setError(err.message || 'Failed to parse resume');
    } finally {
      setParsing(false);
    }
  };

  // Verify JSONB structure
  const verifyJSONBStructure = (data) => {
    const requiredFields = [
      'name',
      'email',
      'contact_number',
      'education',
      'experience',
      'technicalSkills',
      'softSkills',
      'certificates',
      'training',
    ];

    const issues = [];
    requiredFields.forEach((field) => {
      if (!(field in data)) {
        issues.push(`Missing field: ${field}`);
      }
    });

    // Check array fields
    [
      'education',
      'experience',
      'technicalSkills',
      'softSkills',
      'certificates',
      'training',
    ].forEach((field) => {
      if (data[field] && !Array.isArray(data[field])) {
        issues.push(`${field} should be an array`);
      }
    });

    return issues;
  };

  // Save to database
  const handleSaveToDatabase = async () => {
    if (!extractedData) {
      setError('No data to save');
      return;
    }

    // Use email from extracted data if userId is not available
    const emailToUse = extractedData.email || userId;

    if (!emailToUse) {
      setError('No email or user ID available');
      return;
    }

    setSaving(true);
    setSaveResult(null);

    try {
      // Get current student data by email (from JSONB profile column)
      const { data: currentStudent, error: fetchError } = await supabase
        .from('students')
        .select('profile')
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
        technicalSkills:
          extractedData.technicalSkills || currentStudent?.profile?.technicalSkills || [],
        softSkills: extractedData.softSkills || currentStudent?.profile?.softSkills || [],
        certificates: extractedData.certificates || currentStudent?.profile?.certificates || [],

        // Metadata
        resumeImportedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Update in database using email from profile
      const { data: savedData, error: updateError } = await supabase
        .from('students')
        .update({ profile: updatedProfile })
        .eq('profile->>email', emailToUse)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error saving data: ${updateError.message}`);
      }

      setSaveResult({
        success: true,
        message: 'Data saved successfully to JSONB column',
        data: savedData,
      });

      setDatabaseData(savedData?.profile);
    } catch (err) {
      console.error('❌ Save error:', err);
      setSaveResult({
        success: false,
        message: err.message,
      });
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Fetch current database data
  const handleFetchDatabaseData = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('profile')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setDatabaseData(data?.profile);
    } catch (err) {
      console.error('Error fetching database data:', err);
      setError(err.message);
    }
  };

  const structureIssues = extractedData ? verifyJSONBStructure(extractedData) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto my-4">
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Resume Parser Tester</h2>
                <p className="text-sm text-gray-600">Test resume parsing and JSONB storage</p>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Upload File */}
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                1
              </span>
              Upload Resume
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="resume-test-upload"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="resume-test-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <span className="text-lg font-medium text-gray-700 mb-1">
                  {file ? file.name : 'Click to upload resume'}
                </span>
                <span className="text-sm text-gray-500">PDF or TXT (Max 5MB)</span>
              </label>
            </div>
            {file && (
              <Button onClick={handleParse} disabled={parsing} className="mt-4 w-full">
                {parsing ? 'Parsing...' : 'Parse Resume'}
              </Button>
            )}
          </div>

          {/* Step 2: View Extracted Data */}
          {extractedData && (
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  2
                </span>
                Extracted Data (JSON)
              </h3>

              {/* Structure validation */}
              {structureIssues.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Structure Issues:</p>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        {structureIssues.map((issue, idx) => (
                          <li key={idx}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="font-medium text-blue-900">Education entries</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {extractedData.education?.length || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-medium text-green-900">Experience entries</p>
                  <p className="text-2xl font-bold text-green-600">
                    {extractedData.experience?.length || 0}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="font-medium text-purple-900">Technical Skills</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {extractedData.technicalSkills?.length || 0}
                  </p>
                </div>
                <div className="bg-pink-50 rounded-lg p-3">
                  <p className="font-medium text-pink-900">Certificates</p>
                  <p className="text-2xl font-bold text-pink-600">
                    {extractedData.certificates?.length || 0}
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveToDatabase} disabled={saving} className="mt-4 w-full">
                {saving ? 'Saving to Database...' : 'Save to Supabase (JSONB)'}
              </Button>
            </div>
          )}

          {/* Step 3: Save Result */}
          {saveResult && (
            <div
              className={`border rounded-lg p-6 ${saveResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  3
                </span>
                {saveResult.success ? 'Save Successful' : 'Save Failed'}
              </h3>
              <div className="flex items-start gap-3">
                {saveResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={saveResult.success ? 'text-green-800' : 'text-red-800'}>
                    {saveResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Verify Database Data */}
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
                4
              </span>
              Verify Database Storage
            </h3>
            <Button onClick={handleFetchDatabaseData} className="w-full mb-4">
              Fetch Current Database Data
            </Button>

            {databaseData && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Current JSONB profile column:</p>
                <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto max-h-96">
                  <pre className="text-sm text-gray-800">
                    {JSON.stringify(databaseData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeParserTester;
