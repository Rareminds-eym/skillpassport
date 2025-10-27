import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { parseResumeWithAI } from '../../../services/resumeParserService';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure PDF.js worker - using local worker file from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const ResumeParser = ({ onDataExtracted, onClose }) => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

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
      console.log('📄 Starting PDF text extraction...');
      console.log('📄 ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');
      
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
      
      console.log(`📄 PDF loaded successfully: ${pdf.numPages} pages`);
      
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
          console.log(`📄 Extracted page ${pageNum}/${pdf.numPages}: ${pageText.length} chars`);
        } catch (pageError) {
          console.warn(`⚠️ Error extracting page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }
      
      const cleanedText = fullText.trim();
      console.log('✅ PDF text extraction complete');
      console.log('📝 Total extracted text length:', cleanedText.length);
      console.log('📝 Extracted text preview:', cleanedText.substring(0, 300));
      
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
      
      // Call parent callback with extracted data
      if (onDataExtracted) {
        onDataExtracted(parsedData);
      }
    } catch (err) {
      console.error('Resume parsing error:', err);
      setError(err.message || 'Failed to parse resume. Please try again.');
    } finally {
      setParsing(false);
    }
  };

  const handleApplyData = () => {
    if (extractedData && onDataExtracted) {
      onDataExtracted(extractedData);
      setSuccess(true);
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

          {/* Extracted Data Preview */}
          {extractedData && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
              <h3 className="font-semibold text-gray-900 mb-3">Extracted Data Preview:</h3>
              <div className="space-y-2 text-sm">
                {extractedData.name && (
                  <p><span className="font-medium">Name:</span> {extractedData.name}</p>
                )}
                {extractedData.email && (
                  <p><span className="font-medium">Email:</span> {extractedData.email}</p>
                )}
                {extractedData.contact_number && (
                  <p><span className="font-medium">Phone:</span> {extractedData.contact_number}</p>
                )}
                {extractedData.education && extractedData.education.length > 0 && (
                  <p><span className="font-medium">Education:</span> {extractedData.education.length} entries found</p>
                )}
                {extractedData.experience && extractedData.experience.length > 0 && (
                  <p><span className="font-medium">Experience:</span> {extractedData.experience.length} entries found</p>
                )}
                {extractedData.technicalSkills && extractedData.technicalSkills.length > 0 && (
                  <p><span className="font-medium">Technical Skills:</span> {extractedData.technicalSkills.length} skills found</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleParse}
              disabled={!file || parsing}
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
            
            {onClose && (
              <Button
                onClick={onClose}
                variant="outline"
                disabled={parsing}
                className="px-6"
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Information */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">How it works:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>1. Upload your resume in PDF, DOC, DOCX, or TXT format</li>
              <li>2. Our AI will extract information from your resume</li>
              <li>3. Review the extracted data and make any necessary adjustments</li>
              <li>4. Your profile will be automatically updated with the parsed information</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeParser;
