import React, { useState, useEffect } from 'react'
import { XMarkIcon, UserPlusIcon, DocumentArrowUpIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../lib/supabaseClient'
import Papa from 'papaparse'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface StudentFormData {
  name: string
  email: string
  contactNumber: string
  dateOfBirth: string
  gender: string
  enrollmentNumber: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  guardianRelation: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
  bloodGroup: string
}

const AddStudentModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<'manual' | 'csv'>('csv')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    contactNumber: '',
    dateOfBirth: '',
    gender: '',
    enrollmentNumber: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelation: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    bloodGroup: ''
  })

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        email: '',
        contactNumber: '',
        dateOfBirth: '',
        gender: '',
        enrollmentNumber: '',
        guardianName: '',
        guardianPhone: '',
        guardianEmail: '',
        guardianRelation: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        bloodGroup: ''
      })
      setError(null)
      setSuccess(null)
      setLoading(false)
      setMode('manual')
      setCsvFile(null)
      setCsvPreview([])
    }
  }, [isOpen])

  // Download sample CSV template
  const downloadSampleCSV = () => {
    const sampleData = [
      ['name', 'email', 'contactNumber', 'dateOfBirth', 'gender', 'enrollmentNumber', 'bloodGroup', 'guardianName', 'guardianPhone', 'guardianEmail', 'guardianRelation', 'address', 'city', 'state', 'country', 'pincode'],
      ['John Doe', 'john@example.com', '+919876543210', '2000-01-15', 'Male', 'ENR2024001', 'O+', 'Jane Doe', '+919876543211', 'jane@example.com', 'Mother', '123 Main St', 'Mumbai', 'Maharashtra', 'India', '400001'],
      ['Alice Smith', 'alice@example.com', '+919876543212', '1999-05-20', 'Female', 'ENR2024002', 'A+', 'Bob Smith', '+919876543213', 'bob@example.com', 'Father', '456 Park Ave', 'Delhi', 'Delhi', 'India', '110001']
    ]
    
    const csv = sampleData.map(row => row.join(',')).join('\n')
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

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(null)
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!validateEmail(formData.email)) {
      setError('Invalid email format')
      return false
    }
    if (!formData.contactNumber.trim()) {
      setError('Contact number is required')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Try to refresh session if user is logged in (optional)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        await supabase.auth.refreshSession()
      }

      // Call the create-student Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('create-student', {
        body: {
          student: {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            contactNumber: formData.contactNumber.trim(),
            dateOfBirth: formData.dateOfBirth || null,
            gender: formData.gender || null,
            enrollmentNumber: formData.enrollmentNumber.trim() || null,
            guardianName: formData.guardianName.trim() || null,
            guardianPhone: formData.guardianPhone.trim() || null,
            guardianEmail: formData.guardianEmail.trim() || null,
            guardianRelation: formData.guardianRelation.trim() || null,
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            state: formData.state.trim() || null,
            country: formData.country || 'India',
            pincode: formData.pincode.trim() || null,
            bloodGroup: formData.bloodGroup || null,
            approval_status: 'approved',
            student_type: 'educator_added',
            profile: JSON.stringify({
              source: 'educator_manual_entry',
              added_at: new Date().toISOString()
            })
          }
        }
      })

      // Check if operation failed
      if (functionError) {
        throw new Error('Unable to connect to server. Please try again.')
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create student')
      }

      // Show success message
      setSuccess(`✅ Student "${formData.name}" added successfully!`)
      setError(null)
      
      // Call parent callback
      onSuccess?.()
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to create student. Please try again.')
      setSuccess(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setError(null)
    setSuccess(null)
    setCsvPreview([])

    // Parse CSV using PapaParse
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
      complete: (results) => {
        if (results.errors.length > 0) {
          const errorMsg = results.errors.map(e => `Row ${e.row + 1}: ${e.message}`).join(', ')
          setError(`CSV parsing errors: ${errorMsg}`)
          return
        }

        if (!results.data || results.data.length === 0) {
          setError('CSV file is empty or contains no valid data')
          return
        }

        // Validate required columns
        const firstRow: any = results.data[0]
        const hasName = 'name' in firstRow
        const hasEmail = 'email' in firstRow
        const hasContact = 'contactnumber' in firstRow

        if (!hasName || !hasEmail || !hasContact) {
          setError('CSV must contain required columns: name, email, contactNumber')
          return
        }

        // Show preview of first 5 rows
        setCsvPreview(results.data.slice(0, 5))
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`)
      }
    })
  }

  const handleCSVSubmit = async () => {
    if (!csvFile) {
      setError('Please select a CSV file')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setUploadProgress(null)

    try {
      // Refresh session
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.auth.refreshSession()
      }

      // Parse CSV using PapaParse
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
        complete: async (results) => {
          try {
            const students: any[] = results.data as any[]
            
            if (students.length === 0) {
              setError('CSV file contains no valid data')
              setLoading(false)
              return
            }

            // Validate and prepare students data
            const validStudents: any[] = []
            const errors: string[] = []

            students.forEach((student, index) => {
              const rowNum = index + 2 // +2 because index starts at 0 and there's a header row
              
              // Validate required fields
              if (!student.name || !student.name.trim()) {
                errors.push(`Row ${rowNum}: Name is required`)
                return
              }
              if (!student.email || !student.email.trim()) {
                errors.push(`Row ${rowNum}: Email is required`)
                return
              }
              if (!student.contactnumber || !student.contactnumber.trim()) {
                errors.push(`Row ${rowNum}: Contact number is required`)
                return
              }

              // Email validation
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
              if (!emailRegex.test(student.email)) {
                errors.push(`Row ${rowNum}: Invalid email format`)
                return
              }

              validStudents.push({
                row: rowNum,
                data: {
                  name: student.name.trim(),
                  email: student.email.trim().toLowerCase(),
                  contactNumber: student.contactnumber.trim(),
                  dateOfBirth: student.dateofbirth || null,
                  gender: student.gender || null,
                  enrollmentNumber: student.enrollmentnumber || null,
                  guardianName: student.guardianname || null,
                  guardianPhone: student.guardianphone || null,
                  guardianEmail: student.guardianemail || null,
                  guardianRelation: student.guardianrelation || null,
                  address: student.address || null,
                  city: student.city || null,
                  state: student.state || null,
                  country: student.country || 'India',
                  pincode: student.pincode || null,
                  bloodGroup: student.bloodgroup || null,
                  approval_status: 'approved',
                  student_type: 'educator_added',
                  profile: JSON.stringify({
                    source: 'educator_csv_import',
                    imported_at: new Date().toISOString()
                  })
                }
              })
            })

            if (validStudents.length === 0) {
              setError(`❌ No valid students to import. Errors:\n${errors.slice(0, 10).join('\n')}`)
              setLoading(false)
              return
            }

            // Batch process students (10 at a time)
            const BATCH_SIZE = 10
            let successCount = 0
            let failureCount = 0
            const processingErrors: string[] = [...errors]

            setUploadProgress({ current: 0, total: validStudents.length })

            for (let i = 0; i < validStudents.length; i += BATCH_SIZE) {
              const batch = validStudents.slice(i, i + BATCH_SIZE)
              
              const batchPromises = batch.map(async ({ row, data }) => {
                try {
                  const { data: result, error: functionError } = await supabase.functions.invoke('create-student', {
                    body: { student: data }
                  })

                  if (functionError || !result?.success) {
                    const errorMsg = result?.error || functionError?.message || 'Failed to create student'
                    processingErrors.push(`Row ${row}: ${errorMsg}`)
                    return false
                  }
                  return true
                } catch (err: any) {
                  processingErrors.push(`Row ${row}: ${err.message}`)
                  return false
                }
              })

              const batchResults = await Promise.all(batchPromises)
              successCount += batchResults.filter(Boolean).length
              failureCount += batchResults.filter(r => !r).length

              setUploadProgress({ current: Math.min(i + BATCH_SIZE, validStudents.length), total: validStudents.length })
            }

            // Display results
            setUploadProgress(null)
            
            if (successCount > 0 && failureCount === 0) {
              setSuccess(`✅ Successfully imported ${successCount} student${successCount > 1 ? 's' : ''}!`)
              setError(null)
              onSuccess?.()
              setTimeout(() => {
                onClose()
              }, 2000)
            } else if (successCount > 0 && failureCount > 0) {
              setSuccess(`✅ Imported ${successCount} student${successCount > 1 ? 's' : ''} successfully`)
              setError(`⚠️ ${failureCount} failed:\n${processingErrors.slice(0, 5).join('\n')}${processingErrors.length > 5 ? `\n...and ${processingErrors.length - 5} more` : ''}`)
              onSuccess?.()
            } else {
              setError(`❌ All imports failed. Errors:\n${processingErrors.slice(0, 10).join('\n')}${processingErrors.length > 10 ? `\n...and ${processingErrors.length - 10} more` : ''}`)
              setSuccess(null)
            }
          } catch (err: any) {
            setError(err.message || 'Failed to process CSV file')
          } finally {
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Add New Student</h3>
              <p className="text-sm text-gray-500 mt-1">Add students manually or bulk upload via CSV</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Mode Selection */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                mode === 'manual'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UserPlusIcon className="h-5 w-5 inline mr-2" />
              Manual Entry
            </button>
            <button
              onClick={() => setMode('csv')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                mode === 'csv'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <DocumentArrowUpIcon className="h-5 w-5 inline mr-2" />
              CSV Upload
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-md transition-all duration-300 ease-in-out">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md transition-all duration-300 ease-in-out">
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

          {mode === 'manual' ? (
            <div className="max-h-[60vh] px-2 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Basic Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter student's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="student@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Number</label>
                  <input
                    type="text"
                    value={formData.enrollmentNumber}
                    onChange={(e) => handleInputChange('enrollmentNumber', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ENR2024001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Guardian Information */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Guardian Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => handleInputChange('guardianName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Guardian's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
                  <input
                    type="tel"
                    value={formData.guardianPhone}
                    onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Email</label>
                  <input
                    type="email"
                    value={formData.guardianEmail}
                    onChange={(e) => handleInputChange('guardianEmail', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="guardian@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                  <select
                    value={formData.guardianRelation}
                    onChange={(e) => handleInputChange('guardianRelation', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Relation</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Address Information */}
                <div className="md:col-span-2 mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Address Information</h4>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Street address, building, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="City name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="State/Province"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="India"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="123456"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* CSV Format Requirements */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">CSV Format Requirements</h4>
                <p className="text-sm text-blue-800 mb-3">Your CSV file should include these columns:</p>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">• Required:</span>
                    <span>name, email, contactNumber</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">• Optional:</span>
                    <span>dateOfBirth, gender, enrollmentNumber, bloodGroup</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">• Guardian:</span>
                    <span>guardianName, guardianPhone, guardianEmail, guardianRelation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">• Address:</span>
                    <span>address, city, state, country, pincode</span>
                  </li>
                </ul>
                
                {/* Download Sample CSV Button */}
                <button
                  onClick={downloadSampleCSV}
                  className="mt-4 inline-flex items-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Download Sample CSV Template
                </button>
              </div>

              {/* Upload CSV File */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Upload CSV File
                </label>
                <div className="flex items-center space-x-3">
                  <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Choose File
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-600">
                    {csvFile ? csvFile.name : 'No file chosen'}
                  </span>
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress && (
                <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary-900">
                      Processing students...
                    </span>
                    <span className="text-sm font-medium text-primary-900">
                      {uploadProgress.current} / {uploadProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-primary-200 rounded-full h-2.5">
                    <div
                      className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {csvPreview.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Preview (First 5 rows)</h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(csvPreview[0]).map((header) => (
                            <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {csvPreview.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((value: any, cellIdx) => (
                              <td key={cellIdx} className="px-3 py-2 whitespace-nowrap text-gray-900">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={mode === 'manual' ? handleSubmit : handleCSVSubmit}
              disabled={loading || (mode === 'csv' && !csvFile)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'manual' ? 'Adding Student...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-4 w-4 mr-1" />
                  {mode === 'manual' ? 'Add Student' : 'Upload CSV'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddStudentModal