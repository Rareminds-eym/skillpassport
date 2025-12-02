/**
 * Enhanced CSV Import Modal
 * Handles CSV upload, validation, preview, and import
 */

import React, { useState } from 'react'
import { XMarkIcon, DocumentArrowUpIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import Papa from 'papaparse'
import {
  autoMapHeaders,
  processCSVData,
  importStudents,
  ValidatedRow,
  ImportSummary,
  MANDATORY_FIELDS
} from '../../../services/csvImportService'
import CSVImportPreview from '../CSVImportPreview'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'upload' | 'preview' | 'importing' | 'complete'

const CSVImportModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>('upload')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  
  const reset = () => {
    setStep('upload')
    setCsvFile(null)
    setError(null)
    setValidatedRows([])
    setSummary(null)
    setImportResult(null)
    setLoading(false)
  }
  
  const handleClose = () => {
    reset()
    onClose()
  }
  
  // Download sample CSV template
  const downloadSampleCSV = () => {
    const headers = [
      // Category 1 - Core
      'student_name', 'email', 'contact_number', 'alternate_number', 'date_of_birth', 'gender', 'enrollment_number', 'roll_number',
      // Category 2 - Address
      'address', 'city', 'state', 'country', 'pincode', 'blood_group',
      // Category 3 - Guardian
      'guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relation',
      // Category 4 - Class
      'school_code', 'grade', 'section', 'academic_year'
    ]
    
    const sampleData = [
      [
        'John Doe', 'john.doe@example.com', '+919876543210', '+919876543299', '2010-05-15', 'Male', 'ENR2024001', '001',
        '123 Main Street', 'Mumbai', 'Maharashtra', 'India', '400001', 'O+',
        'Jane Doe', '+919876543211', 'jane.doe@example.com', 'Mother',
        'SCH001', '10', 'A', '2024-25'
      ],
      [
        'Alice Smith', 'alice.smith@example.com', '+919876543212', '', '2010-08-20', 'Female', 'ENR2024002', '002',
        '456 Park Avenue', 'Delhi', 'Delhi', 'India', '110001', 'A+',
        'Bob Smith', '+919876543213', 'bob.smith@example.com', 'Father',
        'SCH001', '10', 'A', '2024-25'
      ],
      [
        'Raj Kumar', 'raj.kumar@example.com', '+919876543214', '+919876543298', '2010-03-10', 'Male', 'ENR2024003', '003',
        '789 Lake Road', 'Bangalore', 'Karnataka', 'India', '560001', 'B+',
        'Priya Kumar', '+919876543215', 'priya.kumar@example.com', 'Mother',
        'SCH001', '10', 'B', '2024-25'
      ]
    ]
    
    const csv = [headers.join(','), ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setCsvFile(file)
    setError(null)
    setLoading(true)
    
    try {
      // Parse CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            if (results.errors.length > 0) {
              const errorMsg = results.errors.map(e => `Row ${e.row !== undefined ? e.row + 1 : 'unknown'}: ${e.message}`).join(', ')
              setError(`CSV parsing errors: ${errorMsg}`)
              setLoading(false)
              return
            }
            
            if (!results.data || results.data.length === 0) {
              setError('CSV file is empty or contains no valid data')
              setLoading(false)
              return
            }
            
            // Auto-map headers
            const headers = results.meta.fields || []
            const headerMapping = autoMapHeaders(headers)
            
            console.log('Header mapping:', headerMapping)
            
            // Process and validate data
            const { validatedRows: rows, summary: sum } = await processCSVData(results.data, headerMapping)
            
            setValidatedRows(rows)
            setSummary(sum)
            setStep('preview')
            setLoading(false)
          } catch (err: any) {
            setError(err.message || 'Failed to process CSV file')
            setLoading(false)
          }
        },
        error: (error) => {
          setError(`Failed to parse CSV: ${error.message}`)
          setLoading(false)
        }
      })
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV')
      setLoading(false)
    }
  }
  
  const handleConfirmImport = async () => {
    setLoading(true)
    setStep('importing')
    
    try {
      const userEmail = localStorage.getItem('userEmail')
      if (!userEmail) {
        throw new Error('You are not logged in. Please login and try again.')
      }
      
      const validRows = validatedRows.filter(r => r.isValid)
      const result = await importStudents(validRows, userEmail)
      
      setImportResult(result)
      setStep('complete')
      
      if (result.success > 0) {
        onSuccess?.()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import students')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Import Students from CSV</h3>
              <p className="text-sm text-gray-500 mt-1">
                {step === 'upload' && 'Upload a CSV file with student data'}
                {step === 'preview' && 'Review and confirm student data before importing'}
                {step === 'importing' && 'Importing students...'}
                {step === 'complete' && 'Import complete'}
              </p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 whitespace-pre-line">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* CSV Format Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">CSV Format Requirements</h4>
                
                <div className="space-y-3 text-sm text-blue-800">
                  <div>
                    <div className="font-semibold mb-1">Category 1 - Student Core Information (Required)</div>
                    <div className="pl-4 text-xs space-y-0.5">
                      {MANDATORY_FIELDS.CATEGORY_1.map(field => (
                        <div key={field}>• {field}</div>
                      ))}
                      <div className="text-blue-600">• alternate_number (optional)</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-semibold mb-1">Category 2 - Address & Demographics (Required)</div>
                    <div className="pl-4 text-xs space-y-0.5">
                      {MANDATORY_FIELDS.CATEGORY_2.map(field => (
                        <div key={field}>• {field}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-semibold mb-1">Category 3 - Guardian Information (Required)</div>
                    <div className="pl-4 text-xs space-y-0.5">
                      {MANDATORY_FIELDS.CATEGORY_3.map(field => (
                        <div key={field}>• {field}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-semibold mb-1">Category 4 - Class & School Linking (Required)</div>
                    <div className="pl-4 text-xs space-y-0.5">
                      <div>• school_code OR school_id</div>
                      {MANDATORY_FIELDS.CATEGORY_4.map(field => (
                        <div key={field}>• {field}</div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={downloadSampleCSV}
                  className="mt-4 inline-flex items-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Download Sample CSV Template
                </button>
              </div>
              
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 cursor-pointer">
                    Choose CSV File
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {csvFile ? csvFile.name : 'or drag and drop your CSV file here'}
                </p>
                {loading && (
                  <div className="mt-4 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2 text-sm text-gray-600">Processing CSV...</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Preview Step */}
          {step === 'preview' && summary && (
            <CSVImportPreview
              validatedRows={validatedRows}
              summary={summary}
              onConfirm={handleConfirmImport}
              onCancel={handleClose}
              loading={loading}
            />
          )}
          
          {/* Importing Step */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-lg font-medium text-gray-900">Importing students...</p>
              <p className="mt-2 text-sm text-gray-500">Please wait while we create student accounts</p>
            </div>
          )}
          
          {/* Complete Step */}
          {step === 'complete' && importResult && (
            <div className="space-y-6">
              <div className="text-center py-6">
                {importResult.success > 0 ? (
                  <>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Import Successful!</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Successfully imported {importResult.success} student{importResult.success > 1 ? 's' : ''}
                      {importResult.failed > 0 && `, ${importResult.failed} failed`}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Import Failed</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      All {importResult.failed} student{importResult.failed > 1 ? 's' : ''} failed to import
                    </p>
                  </>
                )}
              </div>
              
              {importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">Errors ({importResult.errors.length})</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 10).map((error, idx) => (
                      <div key={idx} className="text-xs text-red-800">• {error}</div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <div className="text-xs text-red-600 font-medium">
                        ...and {importResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CSVImportModal
