import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X, Database } from 'lucide-react';
import { Button } from '@/shared/ui/ButtonNew';
import { Card, CardContent } from '@/shared/ui/Card';
import { parseResumeWithAI, saveResumeToTables } from '@/features/digital-portfolio';
import { apiPost } from '@/shared/api/apiClient';
import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line import/default
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { validateFileSize, getValidationErrorMessage } from '@/shared/lib/file-validation';
import { getFileSizeLimit } from '@/shared/config/fileSizeLimits';

// Configure PDF.js worker - using local worker file from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const ResumeParser = ({ onDataExtracted, onClose, userEmail, learnerData, user }) => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const normalizeStringValue = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

  const normalizeStringArray = (value) => {
    const rawItems = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(/[,;\n]/)
        : [];

    const seen = new Set();
    const items = [];

    rawItems.forEach((item) => {
      const normalized = normalizeStringValue(item);
      const key = normalized.toLowerCase();
      if (!normalized || normalized === '[]' || normalized === '{}') return;
      if (seen.has(key)) return;
      seen.add(key);
      items.push(normalized);
    });

    return items;
  };

  const sanitizeExtractedData = (data) => ({
    ...data,
    interests: normalizeStringArray(data?.interests),
    languages: normalizeStringArray(data?.languages),
    hobbies: normalizeStringArray(data?.hobbies)
  });

  const renderValue = (value) => normalizeStringValue(value) || '(empty)';

  const profileListFields = [
    { key: 'interests', label: 'Interests', className: 'bg-blue-100 text-blue-800' },
    { key: 'languages', label: 'Languages', className: 'bg-green-100 text-green-800' },
    { key: 'hobbies', label: 'Hobbies', className: 'bg-purple-100 text-purple-800' }
  ];

  const socialFields = [
    { key: 'linkedin_link', label: 'LinkedIn' },
    { key: 'github_link', label: 'GitHub' },
    { key: 'portfolio_link', label: 'Portfolio' },
    { key: 'twitter_link', label: 'Twitter' },
    { key: 'facebook_link', label: 'Facebook' },
    { key: 'instagram_link', label: 'Instagram' }
  ];

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileExtension = getFileExtension(selectedFile.name);
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      const validExtensions = ['pdf', 'docx', 'txt'];
      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
        setError('Please upload a PDF, DOCX, or TXT file');
        return;
      }

      // Validate file size using centralized validation
      const sizeValidation = validateFileSize(selectedFile, { context: 'resume' });
      if (!sizeValidation.valid) {
        setError(getValidationErrorMessage(sizeValidation));
        return;
      }

      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const getFileExtension = (fileName = '') => {
    const parts = fileName.toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() : '';
  };

  const isDocxFile = (file) => (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    getFileExtension(file.name) === 'docx'
  );

  const isLegacyDocFile = (file) => (
    file.type === 'application/msword' ||
    getFileExtension(file.name) === 'doc'
  );

  const decodeXmlEntities = (value) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  };

  const extractTextFromDOCX = async (arrayBuffer) => {
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXml = await zip.file('word/document.xml')?.async('string');

    if (!documentXml) {
      throw new Error('Could not read text from DOCX file. The document may be corrupted.');
    }

    const xmlWithInlineBreaks = documentXml
      .replace(/<w:tab\s*\/>/g, '<w:t>\t</w:t>')
      .replace(/<w:br\s*\/>/g, '<w:t>\n</w:t>');

    const text = xmlWithInlineBreaks
      .split(/<\/w:p>/)
      .map((paragraph) => (
        paragraph
          .match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)
          ?.map((node) => decodeXmlEntities(node.replace(/<\/?w:t[^>]*>/g, '')))
          .join('') || ''
      ))
      .filter((paragraph) => paragraph.trim().length > 0)
      .join('\n');

    const cleanedText = text
      .replace(/\r/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleanedText) {
      throw new Error('No text could be extracted from the DOCX file.');
    }

    return cleanedText;
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

          if (isDocxFile(file)) {
            const text = await extractTextFromDOCX(content);
            resolve(text);
            return;
          }

          if (isLegacyDocFile(file)) {
            throw new Error('Legacy .doc files are not supported yet. Please save/export the resume as .docx, PDF, or TXT and upload again.');
          }

          throw new Error('Unsupported resume file type.');
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
        } catch {
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
      const parsedData = sanitizeExtractedData(await parseResumeWithAI(resumeText));

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
      // Check if we have user and learner data from props
      if (!user) {
        throw new Error('Please log in to save your resume data.');
      }

      // Try to get learner ID from passed learnerData first
      let learnerId = learnerData?.id;

      // If not available, fetch from database
      if (!learnerId) {
        const currentLearner = await apiPost('/learner-dashboard-widgets/actions', {
          action: 'get-learner-by-user',
          userId: user.id,
        });

        learnerId = currentLearner?.id;

        // If still not found, try by email as fallback
        if (!learnerId && emailToUse) {
          const learnerByEmail = await apiPost('/learner-dashboard-widgets/actions', {
            action: 'get-learner-by-user',
            email: emailToUse,
          });

          if (learnerByEmail) {
            learnerId = learnerByEmail.id;
          }
        }
      }

      // Save to separate tables instead of JSONB profile column
      if (learnerId) {
        // Use the new service to save data to separate tables
        const result = await saveResumeToTables(extractedData, learnerId, emailToUse);

        if (result.success) {
          const totalSaved = Object.values(result.saved).reduce((sum, count) => sum + count, 0);
          setSaveResult({
            success: true,
            message: `Successfully saved ${totalSaved} records to database!`,
            details: result.saved
          });
        } else {
          throw new Error(`Error saving data: ${result.errors.map(e => e.error).join(', ')}`);
        }
      } else {
        throw new Error('Learner record not found. Please ensure your profile is set up correctly.');
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
              <h2 className="text-2xl font-bold text-gray-900">Resume</h2>
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
              accept=".pdf,.docx,.txt"
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
                Supported formats: PDF, DOCX, TXT (Max {getFileSizeLimit('resume').displaySize})
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
                  {saveResult.success ? 'Saved to Database!' : 'Error'}
                </p>
                <p className={`${saveResult.success ? 'text-green-600' : 'text-red-600'} text-sm`}>
                  {saveResult.message}
                </p>
                {saveResult.success && saveResult.details && (
                  <div className="mt-2 text-xs text-green-700 space-y-1">
                    <p className="font-medium">Records saved:</p>
                    <div className="grid grid-cols-2 gap-1">
                      {saveResult.details.education > 0 && <span>• Education: {saveResult.details.education}</span>}
                      {saveResult.details.experience > 0 && <span>• Experience: {saveResult.details.experience}</span>}
                      {saveResult.details.skills > 0 && <span>• Skills: {saveResult.details.skills}</span>}
                      {saveResult.details.certificates > 0 && <span>• Certificates: {saveResult.details.certificates}</span>}
                      {saveResult.details.projects > 0 && <span>• Projects: {saveResult.details.projects}</span>}
                      {saveResult.details.trainings > 0 && <span>• Trainings: {saveResult.details.trainings}</span>}
                    </div>
                  </div>
                )}
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
                        <div>
                          <label className="font-medium block mb-1">Address:</label>
                          <textarea
                            value={extractedData.address || ''}
                            onChange={(e) => handleFieldEdit('address', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                            rows="2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="font-medium block mb-1">City:</label>
                            <input
                              type="text"
                              value={extractedData.city || ''}
                              onChange={(e) => handleFieldEdit('city', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                            />
                          </div>
                          <div>
                            <label className="font-medium block mb-1">State:</label>
                            <input
                              type="text"
                              value={extractedData.state || ''}
                              onChange={(e) => handleFieldEdit('state', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                            />
                          </div>
                          <div>
                            <label className="font-medium block mb-1">Country:</label>
                            <input
                              type="text"
                              value={extractedData.country || ''}
                              onChange={(e) => handleFieldEdit('country', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                            />
                          </div>
                          <div>
                            <label className="font-medium block mb-1">Pincode:</label>
                            <input
                              type="text"
                              value={extractedData.pincode || ''}
                              onChange={(e) => handleFieldEdit('pincode', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="font-medium block mb-1">Bio:</label>
                          <textarea
                            value={extractedData.bio || ''}
                            onChange={(e) => handleFieldEdit('bio', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                            rows="2"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p><span className="font-medium">Name:</span> {renderValue(extractedData.name)}</p>
                        <p><span className="font-medium">Email:</span> {renderValue(extractedData.email)}</p>
                        <p><span className="font-medium">Phone:</span> {renderValue(extractedData.contact_number)}</p>
                        <p><span className="font-medium">Alternate Phone:</span> {renderValue(extractedData.alternate_number)}</p>
                        <p><span className="font-medium">University:</span> {renderValue(extractedData.university)}</p>
                        <p><span className="font-medium">College/School:</span> {renderValue(extractedData.college_school_name)}</p>
                        <p><span className="font-medium">Branch:</span> {renderValue(extractedData.branch_field)}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-700 mb-2">Address Information:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <p className="sm:col-span-2"><span className="font-medium">Address:</span> {renderValue(extractedData.address)}</p>
                    <p><span className="font-medium">City:</span> {renderValue(extractedData.city)}</p>
                    <p><span className="font-medium">State:</span> {renderValue(extractedData.state)}</p>
                    <p><span className="font-medium">Country:</span> {renderValue(extractedData.country)}</p>
                    <p><span className="font-medium">Pincode:</span> {renderValue(extractedData.pincode)}</p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-700 mb-2">Bio and Social Links:</h4>
                  <div className="space-y-2 text-xs">
                    <p><span className="font-medium">Bio:</span> {renderValue(extractedData.bio)}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {socialFields.map(({ key, label }) => (
                        <p key={key} className="break-all">
                          <span className="font-medium">{label}:</span> {renderValue(extractedData[key])}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-gray-700 mb-2">Interests, Languages and Hobbies:</h4>
                  <div className="space-y-3 text-xs">
                    {profileListFields.map(({ key, label, className }) => {
                      const items = normalizeStringArray(extractedData[key]);
                      return (
                        <div key={key}>
                          <p className="font-medium mb-1">{label} ({items.length}):</p>
                          {items.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {items.map((item, idx) => (
                                <span key={`${key}-${idx}`} className={`px-2 py-1 rounded ${className}`}>
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">(empty)</p>
                          )}
                        </div>
                      );
                    })}
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
                                `${exp.startDate ? new Date(exp.startDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '?'} - ${exp.endDate ? new Date(exp.endDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}`
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
                                `${proj.startDate ? new Date(proj.startDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '?'} - ${proj.endDate ? new Date(proj.endDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}`
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
                                  new Date(cert.issuedOn + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) :
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
          {/* <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">📋 How it works:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✅ <strong>Step 1:</strong> Upload your resume (PDF, DOC, DOCX, or TXT)</li>
              <li>✅ <strong>Step 2:</strong> Click "Parse Resume" to extract data</li>
              <li>✅ <strong>Step 3:</strong> Review the extracted data in the preview</li>
              <li>✅ <strong>Step 4:</strong> Click "Save to Database" to update your profile</li>
            </ul>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeParser;
