import React, { useState, useEffect } from 'react'
import { XMarkIcon, UserPlusIcon, DocumentArrowUpIcon, ArrowDownTrayIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../lib/supabaseClient'
import Papa from 'papaparse'

// Validated row interface for enhanced preview
interface ValidatedStudent {
  rowNumber: number
  data: any
  isValid: boolean
  errors: string[]
}

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
  district: string
  university: string
}

const AddStudentModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<'manual' | 'csv'>('csv')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [validatedStudents, setValidatedStudents] = useState<ValidatedStudent[]>([])
  const [showEnhancedPreview, setShowEnhancedPreview] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [createdStudentPassword, setCreatedStudentPassword] = useState<string | null>(null)
  const [createdStudentEmail, setCreatedStudentEmail] = useState<string | null>(null)
  
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
    bloodGroup: '',
    district: '',
    university: ''
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
        bloodGroup: '',
        district: '',
        university: ''
      })
      setError(null)
      setSuccess(null)
      setLoading(false)
      setMode('manual')
      setCsvFile(null)
      setValidatedStudents([])
      setShowEnhancedPreview(false)
      setCreatedStudentPassword(null)
      setCreatedStudentEmail(null)
    }
  }, [isOpen])

  // Download sample CSV template
  const downloadSampleCSV = () => {
    const sampleData = [
      ['name', 'email', 'contactNumber', 'alternateNumber', 'dateOfBirth', 'gender', 'enrollmentNumber', 'registrationNumber', 'rollNumber', 'admissionNumber', 'grade', 'section', 'academicYear', 'bloodGroup', 'district', 'university', 'collegeSchoolName', 'profilePicture', 'guardianName', 'guardianPhone', 'guardianEmail', 'guardianRelation', 'address', 'city', 'state', 'country', 'pincode'],
      ['Aarav Sharma', 'aarav.sharma@school.com', '919876501234', '919876543299', '2010-04-15', 'Male', 'ENR2024101', 'REG2024101', '1', 'ADM2024101', '10', 'A', '2024-25', 'O+', 'Mumbai', '', 'Delhi Public School Mumbai', 'https://i.pravatar.cc/150?img=12', 'Rajesh Sharma', '919877654321', 'rajesh.sharma@parent.com', 'Father', 'Flat 301 Sunrise Apartments Andheri West', 'Mumbai', 'Maharashtra', 'India', '400053'],
      ['Diya Patel', 'diya.patel@school.com', '919876502345', '', '2011-08-22', 'Female', 'ENR2024102', 'REG2024102', '2', 'ADM2024102', '9', 'B', '2024-25', 'A+', 'Mumbai', '', 'Delhi Public School Mumbai', 'https://i.pravatar.cc/150?img=47', 'Priya Patel', '919877654322', 'priya.patel@parent.com', 'Mother', 'Bungalow 12 Green Valley Society Borivali', 'Mumbai', 'Maharashtra', 'India', '400092'],
      ['Arjun Reddy', 'arjun.reddy@school.com', '919876503456', '919876543298', '2012-12-10', 'Male', 'ENR2024103', 'REG2024103', '3', 'ADM2024103', '8', 'C', '2024-25', 'B+', 'Mumbai', '', 'Delhi Public School Mumbai', 'https://i.pravatar.cc/150?img=33', 'Venkatesh Reddy', '919877654323', 'venkatesh.reddy@parent.com', 'Father', 'Tower B 1502 Oberoi Heights Goregaon East', 'Mumbai', 'Maharashtra', 'India', '400063']
    ]
    
    const csv = sampleData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
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
      // Get current user from localStorage (custom auth - same as teacher onboarding)
      const userEmail = localStorage.getItem('userEmail')
      const userStr = localStorage.getItem('user')
      
      console.log('Current user from localStorage:', { userEmail, user: userStr })
      
      if (!userEmail) {
        throw new Error('You are not logged in. Please login and try again.')
      }
      
      // Get schoolId from localStorage
      let schoolId = null
      try {
        const userData = JSON.parse(userStr || '{}')
        schoolId = userData.schoolId || null
      } catch (e) {
        console.warn('Could not parse user data from localStorage')
      }
      
      console.log('✅ User authenticated:', userEmail, 'School ID:', schoolId)

      // Call the create-student Edge Function using direct fetch for better error handling
      console.log('Calling create-student Edge Function with data:', {
        name: formData.name,
        email: formData.email,
        contactNumber: formData.contactNumber
      })

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/functions/v1/create-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          userEmail: userEmail,
          schoolId: schoolId, // Send schoolId from localStorage
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
            district: formData.district.trim() || null,
            university: formData.university.trim() || null,
            bloodGroup: formData.bloodGroup || null,
            approval_status: 'approved',
            student_type: 'educator_added'
          }
        })
      })

      const data = await response.json()
      console.log('Edge Function Response:', JSON.stringify(data, null, 2))

      // Check if operation failed
      if (!response.ok || !data?.success) {
        console.error('Function returned error:', data)
        throw new Error(data?.error || data?.details || 'Failed to create student')
      }

      // Store the generated password and email
      if (data?.data?.password) {
        setCreatedStudentPassword(data.data.password)
        setCreatedStudentEmail(data.data.email)
      }

      // Show success message with password
      const successMsg = data?.data?.password 
        ? `✅ Student "${formData.name}" added successfully!\n\n🔑 Login Credentials:\nEmail: ${data.data.email}\nPassword: ${data.data.password}\n\n⚠️ Please save these credentials and share them with the student.`
        : `✅ Student "${formData.name}" added successfully!`
      
      setSuccess(successMsg)
      setError(null)
      
      // DON'T call onSuccess immediately - let user see the password first
      // The modal will stay open so admin can copy the credentials
      // User will manually close it, then we refresh
      console.log('✅ Student created successfully! Password:', data?.data?.password)
    } catch (err: any) {
      setError(err.message || 'Failed to create student. Please try again.')
      setSuccess(null)
    } finally {
      setLoading(false)
    }
  }

  // Validation helper functions
  const validateEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhoneFormat = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s-]/g, '')
    const phoneRegex = /^(\+?\d{1,3})?\d{10}$/
    return phoneRegex.test(cleaned)
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setError(null)
    setSuccess(null)
    setValidatedStudents([])
    setShowEnhancedPreview(false)
    setLoading(true)

    // Parse CSV using PapaParse
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            const errorMsg = results.errors.map(e => `Row ${(e.row ?? 0) + 1}: ${e.message}`).join(', ')
            setError(`CSV parsing errors: ${errorMsg}`)
            setLoading(false)
            return
          }

          if (!results.data || results.data.length === 0) {
            setError('CSV file is empty or contains no valid data')
            setLoading(false)
            return
          }

          // Validate required columns
          const firstRow: any = results.data[0]
          const hasName = 'name' in firstRow
          const hasEmail = 'email' in firstRow
          const hasContact = 'contactnumber' in firstRow

          if (!hasName || !hasEmail || !hasContact) {
            setError('CSV must contain required columns: name, email, contactNumber')
            setLoading(false)
            return
          }

          // Get school ID for class validation
          const userStr = localStorage.getItem('user')
          const userEmail = localStorage.getItem('userEmail')
          let schoolId: string | null = null
          
          try {
            const userData = JSON.parse(userStr || '{}')
            schoolId = userData.schoolId || null
          } catch (e) {
            console.warn('Could not parse user data from localStorage')
          }

          console.log('🔍 DEBUG: Initial schoolId from localStorage:', schoolId)
          console.log('🔍 DEBUG: User email:', userEmail)

          // If schoolId not in localStorage, fetch from database
          if (!schoolId && userEmail) {
            console.log('🔍 DEBUG: Fetching schoolId from database for user:', userEmail)
            
            // Check school_educators table
            const { data: educatorData, error: educatorError } = await supabase
              .from('school_educators')
              .select('school_id')
              .eq('email', userEmail)
              .maybeSingle()

            if (!educatorError && educatorData) {
              schoolId = educatorData.school_id
              console.log('🔍 DEBUG: Found schoolId from school_educators:', schoolId)
            } else {
              console.log('🔍 DEBUG: No educator found, checking users table...')
              
              // Check users.organizationId
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('organizationId')
                .eq('email', userEmail)
                .maybeSingle()

              if (!userError && userData) {
                schoolId = userData.organizationId
                console.log('🔍 DEBUG: Found schoolId from users.organizationId:', schoolId)
              }
            }
          }

          // Collect unique class combinations from CSV
          const classesToCheck = new Map<string, { grade: string; section: string }>()
          ;(results.data as any[]).forEach((student) => {
            const grade = student.grade || student.class
            const section = student.section || student.division
            if (grade && section) {
              const key = `${grade}-${section}`
              if (!classesToCheck.has(key)) {
                classesToCheck.set(key, { grade, section })
              }
            }
          })

          console.log('🔍 DEBUG: Classes to check from CSV:', Array.from(classesToCheck.entries()))
          console.log('🔍 DEBUG: School ID:', schoolId)

          // Check which classes exist in database and store their IDs
          const existingClasses = new Set<string>()
          const classIdMap = new Map<string, string>() // Map of "grade-section" to class_id
          
          if (schoolId && classesToCheck.size > 0) {
            console.log('🔍 DEBUG: Checking classes in database for school:', schoolId)
            
            const { data: classes, error: classError } = await supabase
              .from('school_classes')
              .select('id, grade, section, name, academic_year')
              .eq('school_id', schoolId)
              .eq('account_status', 'active')

            console.log('🔍 DEBUG: Database query result:', { classes, error: classError })

            if (!classError && classes) {
              classes.forEach((cls: { id: string; grade: string; section: string; name: string; academic_year: string }) => {
                const key = `${cls.grade}-${cls.section}`
                existingClasses.add(key)
                classIdMap.set(key, cls.id)
                console.log(`🔍 DEBUG: Found class in DB: ${key} (id: ${cls.id}, name: ${cls.name}, year: ${cls.academic_year})`)
              })
              console.log('🔍 DEBUG: All existing classes:', Array.from(existingClasses))
              console.log('🔍 DEBUG: Class ID map:', Array.from(classIdMap.entries()))
            } else if (classError) {
              console.error('🔍 DEBUG: Error fetching classes:', classError)
            }
          } else {
            console.log('🔍 DEBUG: Skipping class check - schoolId:', schoolId, 'classesToCheck.size:', classesToCheck.size)
          }

          // Validate ALL rows and create enhanced preview
          const validated: ValidatedStudent[] = (results.data as any[]).map((student, index) => {
            const rowNum = index + 2 // +2 for header row and 0-index
            const errors: string[] = []

            // Validate required fields
            if (!student.name || !student.name.trim()) {
              errors.push('Name is required')
            }
            if (!student.email || !student.email.trim()) {
              errors.push('Email is required')
            } else if (!validateEmailFormat(student.email)) {
              errors.push('Invalid email format')
            }
            if (!student.contactnumber || !student.contactnumber.trim()) {
              errors.push('Contact number is required')
            } else if (!validatePhoneFormat(student.contactnumber)) {
              errors.push('Invalid phone format')
            }

            // Validate class exists if grade and section provided
            const grade = student.grade || student.class
            const section = student.section || student.division
            let schoolClassId: string | null = null
            
            console.log(`🔍 DEBUG Row ${rowNum}: grade="${grade}", section="${section}", student.grade="${student.grade}", student.section="${student.section}"`)
            
            if (grade && section) {
              const classKey = `${grade}-${section}`
              const exists = existingClasses.has(classKey)
              console.log(`🔍 DEBUG Row ${rowNum}: Checking class "${classKey}" - exists: ${exists}`)
              if (!exists) {
                errors.push(`Class ${grade}-${section} does not exist. Please create the class first.`)
                console.log(`🔍 DEBUG Row ${rowNum}: Added error - class not found`)
              } else {
                // Get the class ID
                schoolClassId = classIdMap.get(classKey) || null
                console.log(`🔍 DEBUG Row ${rowNum}: Found class ID: ${schoolClassId}`)
              }
            } else if (grade && !section) {
              errors.push('Section is required when grade is provided')
              console.log(`🔍 DEBUG Row ${rowNum}: Missing section`)
            } else if (!grade && section) {
              errors.push('Grade is required when section is provided')
              console.log(`🔍 DEBUG Row ${rowNum}: Missing grade`)
            }

            // Store the schoolClassId in the student data
            student.schoolClassId = schoolClassId

            return {
              rowNumber: rowNum,
              data: { ...student, grade, section },
              isValid: errors.length === 0,
              errors
            }
          })

          setValidatedStudents(validated)
          setShowEnhancedPreview(true)
        } catch (err: any) {
          setError(`Error validating CSV: ${err.message}`)
        } finally {
          setLoading(false)
        }
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`)
        setLoading(false)
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

            // Get userEmail and schoolId FIRST (moved up)
            const userEmail = localStorage.getItem('userEmail')
            const userStr = localStorage.getItem('user')
            
            if (!userEmail) {
              setError('You are not logged in. Please login and try again.')
              setLoading(false)
              return
            }

            let schoolId: string | null = null
            try {
              const userData = JSON.parse(userStr || '{}')
              schoolId = userData.schoolId || null
            } catch (e) {
              console.warn('Could not parse user data from localStorage')
            }

            // If schoolId not in localStorage, fetch from database
            if (!schoolId && userEmail) {
              const { data: educatorData } = await supabase
                .from('school_educators')
                .select('school_id')
                .eq('email', userEmail)
                .maybeSingle()

              if (educatorData) {
                schoolId = educatorData.school_id
              }
            }

            if (!schoolId) {
              setError('School ID not found. Please ensure you are logged in as a school admin.')
              setLoading(false)
              return
            }

            // Fetch class IDs for mapping
            const { data: classes } = await supabase
              .from('school_classes')
              .select('id, grade, section')
              .eq('school_id', schoolId)
              .eq('account_status', 'active')

            const classIdMap = new Map<string, string>()
            if (classes) {
              classes.forEach((cls: { id: string; grade: string; section: string }) => {
                const key = `${cls.grade}-${cls.section}`
                classIdMap.set(key, cls.id)
              })
            }

            console.log('🔍 CSV SUBMIT: Class ID map:', Array.from(classIdMap.entries()))

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

              // Support both 'parent' and 'guardian' prefixes for parent/guardian fields
              const guardianName = student.guardianname || student.parentname || null
              const guardianPhone = student.guardianphone || student.parentphone || null
              const guardianEmail = student.guardianemail || student.parentemail || null
              const guardianRelation = student.guardianrelation || student.parentrelation || 'Parent'

              // Get grade and section
              const grade = student.grade || student.class || null
              const section = student.section || student.division || null
              
              // Look up the class ID
              let schoolClassId: string | null = null
              if (grade && section) {
                const classKey = `${grade}-${section}`
                schoolClassId = classIdMap.get(classKey) || null
                console.log(`🔍 CSV SUBMIT Row ${rowNum}: grade=${grade}, section=${section}, classKey=${classKey}, schoolClassId=${schoolClassId}`)
              }

              validStudents.push({
                row: rowNum,
                data: {
                  name: student.name.trim(),
                  email: student.email.trim().toLowerCase(),
                  contactNumber: student.contactnumber.trim(),
                  alternateNumber: student.alternatenumber?.trim() || null,
                  dateOfBirth: student.dateofbirth || null,
                  gender: student.gender || null,
                  enrollmentNumber: student.enrollmentnumber || null,
                  registrationNumber: student.registrationnumber || null,
                  rollNumber: student.rollnumber || null,
                  admissionNumber: student.admissionnumber || null,
                  grade: grade,
                  section: section,
                  academicYear: student.academicyear || student.year || null,
                  schoolClassId: schoolClassId, // Use the looked-up class ID
                  guardianName: guardianName,
                  guardianPhone: guardianPhone,
                  guardianEmail: guardianEmail,
                  guardianRelation: guardianRelation,
                  bloodGroup: student.bloodgroup || null,
                  district: student.district || null,
                  university: student.university || null,
                  collegeSchoolName: student.collegeschoolname || null,
                  profilePicture: student.profilepicture || null,
                  address: student.address || null,
                  city: student.city || null,
                  state: student.state || null,
                  country: student.country || 'India',
                  pincode: student.pincode || null,
                  approval_status: 'approved',
                  student_type: 'csv_import'
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

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

            for (let i = 0; i < validStudents.length; i += BATCH_SIZE) {
              const batch = validStudents.slice(i, i + BATCH_SIZE)
              
              const batchPromises = batch.map(async ({ row, data }) => {
                try {
                  const response = await fetch(`${supabaseUrl}/functions/v1/create-student`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${supabaseAnonKey}`,
                      'apikey': supabaseAnonKey
                    },
                    body: JSON.stringify({
                      userEmail: userEmail,
                      schoolId: schoolId,
                      student: data
                    })
                  })

                  const result = await response.json()

                  if (!response.ok || !result?.success) {
                    const errorMsg = result?.error || 'Failed to create student'
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
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-green-800 whitespace-pre-line">{success}</p>
                  
                  {/* Show password in a copyable box if available */}
                  {createdStudentPassword && createdStudentEmail && (
                    <div className="mt-3 p-3 bg-white border border-green-200 rounded-md">
                      <p className="text-xs font-semibold text-gray-700 mb-2">📋 Login Credentials (Click to copy):</p>
                      <div className="space-y-2">
                        <div 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            navigator.clipboard.writeText(createdStudentEmail)
                            alert('Email copied to clipboard!')
                          }}
                        >
                          <span className="text-xs text-gray-600">Email:</span>
                          <span className="text-xs font-mono font-semibold text-gray-900">{createdStudentEmail}</span>
                        </div>
                        <div 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            navigator.clipboard.writeText(createdStudentPassword)
                            alert('Password copied to clipboard!')
                          }}
                        >
                          <span className="text-xs text-gray-600">Password:</span>
                          <span className="text-xs font-mono font-semibold text-gray-900">{createdStudentPassword}</span>
                        </div>
                      </div>
                      <p className="text-xs text-amber-600 mt-2">⚠️ Save these credentials before closing!</p>
                    </div>
                  )}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="District name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="University name"
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
                    <span className="font-semibold mr-2">• School Students:</span>
                    <span>grade, section, rollNumber, collegeSchoolName <span className="text-amber-600">(class must exist, leave university empty)</span></span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">• University Students:</span>
                    <span>university, registrationNumber <span className="text-amber-600">(leave grade/section empty)</span></span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">• Optional:</span>
                    <span>alternateNumber, dateOfBirth, gender, enrollmentNumber, bloodGroup, academicYear, profilePicture</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">• Guardian:</span>
                    <span>guardianName, guardianPhone, guardianEmail, guardianRelation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">• Address:</span>
                    <span>address, city, state, country, pincode, district</span>
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

              {/* Validation Loading */}
              {loading && !uploadProgress && csvFile && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium text-blue-900">Validating CSV and checking classes...</span>
                  </div>
                </div>
              )}

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

              {/* Enhanced Preview with Valid/Invalid Separation */}
              {showEnhancedPreview && validatedStudents.length > 0 && (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-gray-900">{validatedStudents.length}</div>
                      <div className="text-xs text-gray-500">Total Rows</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-green-700">{validatedStudents.filter(s => s.isValid).length}</div>
                      <div className="text-xs text-green-600">Valid</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-red-700">{validatedStudents.filter(s => !s.isValid).length}</div>
                      <div className="text-xs text-red-600">Invalid</div>
                    </div>
                  </div>

                  {/* Valid Students */}
                  {validatedStudents.filter(s => s.isValid).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                        Valid Students ({validatedStudents.filter(s => s.isValid).length})
                      </h4>
                      <div className="overflow-x-auto border border-green-200 rounded-md max-h-96">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                          <thead className="bg-green-50 sticky top-0">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Row</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Photo</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Name</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Email</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Phone</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Alt. Phone</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Type</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Class</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">School Name</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">University</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Reg No.</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Roll</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Gender</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Blood</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Guardian</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 text-nowrap">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {validatedStudents.filter(s => s.isValid).slice(0, 15).map((student) => {
                              const isSchoolStudent = student.data.grade && student.data.section;
                              const isUniversityStudent = student.data.university;
                              const hasProfilePicture = student.data.profilepicture && student.data.profilepicture.trim();
                              return (
                                <tr key={student.rowNumber} className="hover:bg-gray-50">
                                  <td className="px-2 py-2 text-gray-500 font-medium">{student.rowNumber}</td>
                                  <td className="px-2 py-2">
                                    {hasProfilePicture ? (
                                      <img 
                                        src={student.data.profilepicture} 
                                        alt={student.data.name}
                                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                      />
                                    ) : null}
                                    <div className={`w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 ${hasProfilePicture ? 'hidden' : ''}`}>
                                      {student.data.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                  </td>
                                  <td className="px-2 py-2 font-medium text-gray-900 whitespace-nowrap">{student.data.name}</td>
                                  <td className="px-2 py-2 text-gray-600 text-xs">{student.data.email}</td>
                                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{student.data.contactnumber || '-'}</td>
                                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">
                                    {student.data.alternatenumber ? (
                                      <span className="text-blue-600">{student.data.alternatenumber}</span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    {isSchoolStudent ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        School
                                      </span>
                                    ) : isUniversityStudent ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                        University
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">
                                    {student.data.grade && student.data.section 
                                      ? `${student.data.grade}-${student.data.section}` 
                                      : <span className="text-gray-400">-</span>}
                                  </td>
                                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{student.data.collegeschoolname || '-'}</td>
                                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{student.data.university || '-'}</td>
                                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{student.data.registrationnumber || '-'}</td>
                                  <td className="px-2 py-2 text-gray-600">{student.data.rollnumber || '-'}</td>
                                  <td className="px-2 py-2 text-gray-600">{student.data.gender || '-'}</td>
                                  <td className="px-2 py-2 text-gray-600">{student.data.bloodgroup || '-'}</td>
                                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{student.data.guardianname || student.data.parentname || '-'}</td>
                                  <td className="px-2 py-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      ✓
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {validatedStudents.filter(s => s.isValid).length > 15 && (
                          <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                            ...and {validatedStudents.filter(s => s.isValid).length - 15} more valid students
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Invalid Students */}
                  {validatedStudents.filter(s => !s.isValid).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                        Invalid Students ({validatedStudents.filter(s => !s.isValid).length}) - Will Not Be Imported
                      </h4>
                      <div className="overflow-x-auto border border-red-200 rounded-md max-h-96">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                          <thead className="bg-red-50 sticky top-0">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Row</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Alt. Phone</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Class</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">School/Univ</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Errors</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {validatedStudents.filter(s => !s.isValid).slice(0, 10).map((student) => {
                              const isSchoolStudent = student.data.grade && student.data.section;
                              const isUniversityStudent = student.data.university;
                              return (
                                <tr key={student.rowNumber} className="hover:bg-red-50">
                                  <td className="px-2 py-2 text-gray-500 font-medium">{student.rowNumber}</td>
                                  <td className="px-2 py-2 font-medium text-gray-900">{student.data.name || <span className="text-gray-400 italic">Missing</span>}</td>
                                  <td className="px-2 py-2 text-gray-600 text-xs">{student.data.email || <span className="text-gray-400 italic">Missing</span>}</td>
                                  <td className="px-2 py-2 text-gray-600">{student.data.contactnumber || <span className="text-gray-400 italic">Missing</span>}</td>
                                  <td className="px-2 py-2 text-gray-600">
                                    {student.data.alternatenumber ? (
                                      <span className="text-blue-600">{student.data.alternatenumber}</span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    {isSchoolStudent ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        School
                                      </span>
                                    ) : isUniversityStudent ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                        University
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-gray-600">
                                    {student.data.grade && student.data.section 
                                      ? `${student.data.grade}-${student.data.section}` 
                                      : <span className="text-gray-400">-</span>}
                                  </td>
                                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">
                                    {student.data.collegeschoolname || student.data.university || '-'}
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="space-y-1">
                                      {student.errors.map((err, i) => (
                                        <div key={i} className="text-xs text-red-600">• {err}</div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {validatedStudents.filter(s => !s.isValid).length > 10 && (
                          <div className="px-3 py-2 text-xs text-red-600 bg-red-50">
                            ...and {validatedStudents.filter(s => !s.isValid).length - 10} more invalid students
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No valid students warning */}
                  {validatedStudents.filter(s => s.isValid).length === 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-800 font-medium">⚠️ No valid students to import</p>
                      <p className="text-xs text-amber-700 mt-1">Please fix the errors above and re-upload the CSV file.</p>
                    </div>
                  )}
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
              disabled={loading || (mode === 'csv' && !csvFile) || (mode === 'csv' && showEnhancedPreview && validatedStudents.filter(s => s.isValid).length === 0)}
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
                  {mode === 'manual' ? 'Add Student' : (
                    showEnhancedPreview && validatedStudents.length > 0 
                      ? `Import ${validatedStudents.filter(s => s.isValid).length} Valid Student${validatedStudents.filter(s => s.isValid).length !== 1 ? 's' : ''}`
                      : 'Upload CSV'
                  )}
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