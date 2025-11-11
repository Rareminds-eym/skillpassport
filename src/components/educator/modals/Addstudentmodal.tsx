import React, { useState, useEffect } from 'react'
import { XMarkIcon, UserPlusIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../lib/supabaseClient'

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
  const [mode, setMode] = useState<'manual' | 'csv'>('manual')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  
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
      setLoading(false)
      setMode('manual')
      setCsvFile(null)
      setCsvPreview([])
    }
  }, [isOpen])

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
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

    try {
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

      if (functionError) {
        throw new Error(functionError.message || 'Failed to create student')
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create student')
      }

      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('Error creating student:', err)
      setError(err.message || 'Failed to create student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setError(null)

    // Parse CSV for preview
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          setError('CSV file must contain headers and at least one data row')
          return
        }

        const headers = lines[0].split(',').map(h => h.trim())
        const preview = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim())
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = values[index] || ''
          })
          return obj
        })

        setCsvPreview(preview)
      } catch (err) {
        setError('Failed to parse CSV file')
        console.error('CSV parse error:', err)
      }
    }
    reader.readAsText(file)
  }

  const handleCSVSubmit = async () => {
    if (!csvFile) {
      setError('Please select a CSV file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
          
          let successCount = 0
          let errorCount = 0
          const errors: string[] = []

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim())
            const student: any = {}
            
            headers.forEach((header, index) => {
              student[header] = values[index] || ''
            })

            // Validate required fields
            if (!student.name || !student.email) {
              errorCount++
              errors.push(`Row ${i + 1}: Missing name or email`)
              continue
            }

            try {
              const { data, error: functionError } = await supabase.functions.invoke('create-student', {
                body: {
                  student: {
                    name: student.name,
                    email: student.email.toLowerCase(),
                    contactNumber: student.contactnumber || student.contact_number || null,
                    dateOfBirth: student.dateofbirth || student.date_of_birth || null,
                    gender: student.gender || null,
                    enrollmentNumber: student.enrollmentnumber || student.enrollment_number || null,
                    guardianName: student.guardianname || student.guardian_name || null,
                    guardianPhone: student.guardianphone || student.guardian_phone || null,
                    guardianEmail: student.guardianemail || student.guardian_email || null,
                    guardianRelation: student.guardianrelation || student.guardian_relation || null,
                    address: student.address || null,
                    city: student.city || null,
                    state: student.state || null,
                    country: student.country || 'India',
                    pincode: student.pincode || null,
                    bloodGroup: student.bloodgroup || student.blood_group || null,
                    approval_status: 'approved',
                    student_type: 'educator_added',
                    profile: JSON.stringify({
                      source: 'educator_csv_import',
                      imported_at: new Date().toISOString()
                    })
                  }
                }
              })

              if (functionError || !data?.success) {
                errorCount++
                errors.push(`Row ${i + 1}: ${functionError?.message || data?.error || 'Failed'}`)
              } else {
                successCount++
              }
            } catch (err: any) {
              errorCount++
              errors.push(`Row ${i + 1}: ${err.message}`)
            }
          }

          if (errorCount > 0) {
            setError(`Imported ${successCount} students. ${errorCount} errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...and ${errors.length - 5} more` : ''}`)
          }

          if (successCount > 0) {
            onSuccess?.()
            if (errorCount === 0) {
              onClose()
            }
          }
        } catch (err: any) {
          setError(err.message || 'Failed to process CSV file')
        } finally {
          setLoading(false)
        }
      }
      reader.readAsText(csvFile)
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

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
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
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">CSV Format Requirements</h4>
                <p className="text-xs text-blue-800 mb-2">Your CSV file should include these columns:</p>
                <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
                  <li><strong>Required:</strong> name, email, contactNumber</li>
                  <li><strong>Optional:</strong> dateOfBirth, gender, enrollmentNumber, bloodGroup</li>
                  <li><strong>Guardian:</strong> guardianName, guardianPhone, guardianEmail, guardianRelation</li>
                  <li><strong>Address:</strong> address, city, state, country, pincode</li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

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